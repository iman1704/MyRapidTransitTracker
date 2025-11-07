"""
Consumed parsed GTFS data from kafka and writes to database (PostgreSQL)
Features:
- Upsert (update or insert) data in batches (one update per vehicle in single batch)
- Clean up old records (currently set to 30 day ttl)
- Fallback to time-based processing if there are too few vehicles to reach the PROCESSING_BATCH_SIZE threshold
"""

import json
import logging
from datetime import datetime, timedelta

from kafka import KafkaConsumer
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.orm import sessionmaker
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from MyRapidTransitTracker.config.settings import settings
from MyRapidTransitTracker.database.database import get_db
from MyRapidTransitTracker.database.models import Base, CurrentVehiclePosition, Route, Trip, Vehicle, VehiclePosition

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROCESSING_BATCH_SIZE = settings.PROCESSING_BATCH_SIZE
BATCH_TIMEOUT_SECONDS = settings.BATCH_TIMEOUT_SECONDS  # When there are only a few vehicles on the road
CLEANUP_INTERVAL_HOURS = settings.CLEANUP_INTERVAL_HOURS
KAFKA_BOOTSTRAP_SERVERS = settings.KAFKA_BOOTSTRAP_SERVERS
KAFKA_OUTPUT_TOPIC = settings.KAFKA_OUTPUT_TOPIC
DB_USER = settings.DB_USER
DB_PASSWORD = settings.DB_PASSWORD
DB_HOST = settings.DB_HOST
DB_PORT = settings.DB_PORT
DB_NAME = settings.DB_NAME
DB_RETENTION = settings.DB_RETENTION


class DatabaseWriter:
    def __init__(self):
        self.consumer = KafkaConsumer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            group_id="database-writer",
            # SUGGESTION: Use 'earliest' during development for easier testing
            auto_offset_reset="latest",
        )
        self.consumer.subscribe([KAFKA_OUTPUT_TOPIC])
        self.setup_database()

    def setup_database(self):
        """Initialize database connection and create tables."""
        database_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        self.engine = create_engine(database_url)
        self.Session = sessionmaker(bind=self.engine)
        Base.metadata.create_all(self.engine)
        logger.info("Database tables created/verified")

    def extract_vehicle_data(self, data):
        """Extract and normalize vehicle position data from the nested JSON."""
        try:
            entities = data.get("entity", [])
            vehicle_positions = []
            feed_timestamp = data.get("header", {}).get("timestamp")

            for entity in entities:
                if "vehicle" not in entity:
                    continue

                vehicle_data = entity["vehicle"]
                position = vehicle_data.get("position", {})
                trip = vehicle_data.get("trip", {})
                vehicle_info = vehicle_data.get("vehicle", {})

                extracted = {
                    "vehicle_id": vehicle_info.get("id"),
                    "license_plate": vehicle_info.get("license_plate"),
                    "trip_id": trip.get("trip_id"),
                    "start_time": trip.get("start_time"),
                    "start_date": trip.get("start_date"),
                    "route_id": trip.get("route_id"),
                    "latitude": position.get("latitude"),
                    "longitude": position.get("longitude"),
                    "bearing": position.get("bearing"),
                    "speed": position.get("speed"),
                    "feed_timestamp": feed_timestamp,
                }

                if extracted["vehicle_id"] and extracted["latitude"] is not None and extracted["longitude"] is not None:
                    vehicle_positions.append(extracted)
            return vehicle_positions

        except Exception as e:
            logger.error(f"Error extracting vehicle data: {e}", exc_info=True)
            return []

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((OperationalError, InterfaceError)),
        before_sleep=lambda retry_state: logger.warning(
            f"retrying database operation after error: {retry_state.outcome.exception()}"
        ),
    )
    def process_vehicle_positions(self, batch, session):
        """Upsert records with deduplications"""
        latest_current_positions = {}
        historical_positions = {}

        for data in batch:
            now_ts = datetime.now()

            # Ensure Vehicle row exist and keep the latest license_plate and last_seen
            # NOTE in most cases vehicle_id and license_plate have the same value
            vehicle_stmt = insert(Vehicle).values(
                id=data["vehicle_id"],
                license_plate=data.get("license_plate"),
                last_seen=now_ts,
            )

            vehicle_stmt = vehicle_stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "license_plate": data.get("license_plate"),
                    "last_seen": now_ts,
                },
            )
            session.execute(vehicle_stmt)

            # Insert to Route table if new route is observed
            if data["route_id"]:
                route_stmt = insert(Route).values(id=data["route_id"])
                route_stmt = route_stmt.on_conflict_do_nothing(index_elements=["id"])
                session.execute(route_stmt)

            # Upsert Trip metadata based on trip_id
            if data["trip_id"] and data["route_id"] and data["start_date"] and data["start_time"]:
                try:
                    trip_start_date = datetime.strptime(data["start_date"], "%Y%m%d").date()
                    trip_start_time = datetime.strptime(data["start_time"], "%H:%M:%S").time()
                    trip_stmt = insert(Trip).values(
                        trip_id=data["trip_id"],
                        route_id=data["route_id"],
                        start_date=trip_start_date,
                        start_time=trip_start_time,
                    )
                    trip_stmt = trip_stmt.on_conflict_do_update(
                        index_elements=["trip_id"],
                        set_={
                            "route_id": data["route_id"],
                            "start_date": trip_start_date,
                            "start_time": trip_start_time,
                        },
                    )
                    session.execute(trip_stmt)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Could not parse trip date/time for trip {data['trip_id']}: {e}")
                    data["trip_id"] = None

            # Fallback to current time if timestamp is not included in the feed
            feed_timestamp_raw = data.get("feed_timestamp")
            try:
                feed_timestamp = datetime.fromtimestamp(float(feed_timestamp_raw))
            except Exception:
                logger.debug("Missing/invalid feed_timestamp for vehicle %s, using current time", data["vehicle_id"])
                feed_timestamp = now_ts

            # Deduplicate historical row
            hist_key = (data["vehicle_id"], feed_timestamp)
            historical_positions[hist_key] = {
                "vehicle_id": data["vehicle_id"],
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "bearing": data.get("bearing"),
                "speed": data.get("speed"),
                "trip_id": data.get("trip_id"),
                "route_id": data.get("route_id"),
                "feed_timestamp": feed_timestamp,
            }

            # Keep latest record per vehicle for current_vehicle_positions table
            current_payload = {
                "vehicle_id": data["vehicle_id"],
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "bearing": data.get("bearing"),
                "speed": data.get("speed"),
                "trip_id": data.get("trip_id"),
                "route_id": data.get("route_id"),
                "feed_timestamp": feed_timestamp,
            }
            existing = latest_current_positions.get(data["vehicle_id"])
            if not existing or feed_timestamp >= existing["feed_timestamp"]:
                latest_current_positions[data["vehicle_id"]] = current_payload

        # Flush dimension rows so foreign keys succeed
        session.flush()

        # Bulk insert and retain only the latest update within the same batch
        if historical_positions:
            stmt = insert(VehiclePosition).values(list(historical_positions.values()))
            stmt = stmt.on_conflict_do_nothing(constraint="uq_vehicle_position_vehicle_ts")
            session.execute(stmt)

        # Upsert current_vehicle_positions table
        if latest_current_positions:
            stmt = insert(CurrentVehiclePosition).values(list(latest_current_positions.values()))
            update_dict = {c.name: c for c in stmt.excluded if c.name != "vehicle_id"}
            stmt = stmt.on_conflict_do_update(index_elements=["vehicle_id"], set_=update_dict)
            session.execute(stmt)

        return len(latest_current_positions)

    def time_to_live(self, session, retention_days: int = 30):
        """
        Clean up records older than specified retention period
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)

            deleted_count = session.query(VehiclePosition).filter(VehiclePosition.recorded_at < cutoff_date).delete()

            logger.info(f"Cleaned up {deleted_count} records older than {retention_days}")

        except Exception as e:
            logger.error(f"Error cleaning up old records: {e}")

    def run(self):
        """Main loop that batches kafka messages, writes to database, clean up old data"""
        logger.info("Starting database writer...")
        vehicle_data_batch = []
        last_cleanup = datetime.now()
        last_batch_time = datetime.now()

        try:
            for message in self.consumer:
                data = message.value
                vehicle_positions = self.extract_vehicle_data(data)
                vehicle_data_batch.extend(vehicle_positions)

                current_time = datetime.now()
                time_since_last_flush = (current_time - last_batch_time).total_seconds()

                if len(vehicle_data_batch) >= PROCESSING_BATCH_SIZE or (
                    time_since_last_flush >= BATCH_TIMEOUT_SECONDS and vehicle_data_batch
                ):
                    db = next(get_db())
                    try:
                        processed_count = self.process_vehicle_positions(vehicle_data_batch, db)
                        db.commit()
                        logger.info(f"Commited batch of {processed_count} vehicle positions")

                        vehicle_data_batch = []
                        last_batch_time = current_time
                    except Exception as e:
                        logger.error(f"Error processing batch, rolling back: {e}", exc_info=True)
                        db.rollback()
                    finally:
                        db.close()

                if (datetime.now() - last_cleanup).total_seconds() >= CLEANUP_INTERVAL_HOURS * 3600:
                    db = next(get_db())
                    try:
                        self.time_to_live(db, retention_days=DB_RETENTION)
                        db.commit()
                    except Exception as e:
                        logger.error(f"Error during cleanup: {e}")
                        db.rollback()
                    finally:
                        db.close()
                    last_cleanup = datetime.now()

        except KeyboardInterrupt:
            logger.info("Shutting down database writer...")
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
        finally:
            if vehicle_data_batch:
                logger.info(f"Processing final batch of {len(vehicle_data_batch)} items...")
                db = next(get_db())
                try:
                    self.process_vehicle_positions(vehicle_data_batch, db)
                    db.commit()
                    logger.info("Final batch committed.")
                except Exception as e:
                    logger.error(f"Error processing final batch: {e}", exc_info=True)
                    db.rollback()
                finally:
                    db.close()

            logger.info("Closing Kafka consumer...")
            self.consumer.close()
            logger.info("Database writer shutdown complete")


if __name__ == "__main__":
    writer = DatabaseWriter()
    writer.run()

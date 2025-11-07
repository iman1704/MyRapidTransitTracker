""" "
Consumes raw data topic and parses the protobuf file into structured JSON
Publish into new topic 'vehicle'
"""

import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from google.protobuf.json_format import MessageToDict
from google.transit import gtfs_realtime_pb2
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import NoBrokersAvailable

from MyRapidTransitTracker.config.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

logger = logging.getLogger("raw_consumer")

# Load enviroment from .env file
load_dotenv()


class RawConsumer:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
        self.running = False
        self.consumer = None
        self.producer = None
        self.sample_shown = False

        self.input_topic = config.get("input_topic", "raw-data")
        self.output_topic = config.get("output_topic", "parsed-data")

        logger.info("Initializing raw consumer...")
        logger.info(f"Input topic: {self.input_topic}")
        logger.info(f"Output topic: {self.output_topic}")

    def create_consumer(self):
        """
        Create and configure kafka consumer
        """
        consumer_config = {
            "bootstrap_servers": self.config.get("bootstrap_servers", "localhost:9092").split(","),
            "group_id": self.config.get("consumer_group", "raw-data-consumer"),
            "auto_offset_reset": self.config.get("auto_offset_reset", "earliest"),
            "enable_auto_commit": self.config.get("enable_auto_commit", True),
            "auto_commit_interval_ms": self.config.get("auto_commit_interval_ms", 5000),
            "value_deserializer": lambda x: x,  # keep as raw protobuf
            "key_deserializer": lambda x: x.decode("utf-8") if x else None,
            "max_poll_records": 500,
            "fetch_max_bytes": 10485760,  # 10MB
            "max_partition_fetch_bytes": 10485760,  # 10MB
        }

        # TODO Security configurations
        # Need to implement before deploying to server

        return KafkaConsumer(self.input_topic, **consumer_config)

    def create_producer(self):
        """
        Create and configure kafka producer
        """
        producer_config = {
            "bootstrap_servers": self.config.get("bootstrap_servers", "localhost:9092").split(","),
            "client_id": self.config.get("client_id", "raw-data-parser"),
            "acks": self.config.get("acks", "all"),
            "retries": self.config.get("retries", 3),
            "value_serializer": lambda x: json.dumps(x).encode("utf-8"),
            "key_serializer": lambda x: x.encode("utf-8") if x else None,
        }

        # TODO Security configurations
        # Implement before deploying to server
        return KafkaProducer(**producer_config)

    def parse_raw_protobuf(self, protobuf_data: bytes) -> Optional[dict[str, Any]]:
        """
        Parse GTFS realtime protobuf data into a dictionary
        """
        try:
            # Create message instance then parse
            feed_message = gtfs_realtime_pb2.FeedMessage()
            feed_message.ParseFromString(protobuf_data)

            parsed_data = MessageToDict(feed_message, preserving_proto_field_name=True)

            # Add metadata
            parsed_data["_metadata"] = {
                "parsed_timestamp": datetime.utcnow().isoformat() + "Z",
                "header_timestamp": parsed_data.get("header", {}).get("timestamp"),
                "gtfs_realtime_version": parsed_data.get("header", {}).get("gtfs_realtime_version"),
                "incementality": parsed_data.get("header", {}).get("incrementality"),
                "entity_count": len(parsed_data.get("entity", [])),
                "schema_version": "1.0",
            }

            logger.debug(
                f"Successfully parsed GTFS realtime message with {len(parsed_data.get('entity', []))} entities"
            )

            return parsed_data

        except Exception as e:
            logger.error(f"Error parsing GTFS realtime protobuf : {e!s}")
            return None

    def delivery_callback(self, record_metadata):
        """
        Callback function for kafka producer delivery reports
        """
        try:
            logger.debug(
                f"Message delivered to {record_metadata.topic}"
                f"[partition {record_metadata.partition},"
                f"offset {record_metadata.offset}]"
            )

        except Exception as e:
            logger.error(f"Unexpected error in delivery callback: {e!s}")

    def process_message(self, message) -> bool:
        """
        Process a single kafka message
        """
        try:
            parsed_data = self.parse_raw_protobuf(message.value)

            if parsed_data is None:
                logger.warning("Failed to parse protobuf data, skipping message")
                return False

            # Prepare key (preserve original or use timestamp)
            key = message.key if message.key else None
            if not key:
                # Create key from header timestamp if available
                header_ts = parsed_data.get("header", {}).get("timestamp")
                key = f"ts_{header_ts}" if header_ts else str(int(time.time()))

            if not self.sample_shown:
                self._show_sample(parsed_data, key)

            future = self.producer.send(topic=self.output_topic, value=parsed_data, key=key)

            # Add callback for delivery report
            future.add_callback(self.delivery_callback)

            logger.info(f"Processed message with {len(parsed_data.get('entity', []))} entities, key: {key})")
            return True

        except Exception as e:
            logger.exception(f"Error processing message: {e!s}")
            return False

    def start(self):
        """
        Start consuming message from kafka
        """
        logger.info("Starting GTFS realtime consumer...")

        try:
            self.consumer = self.create_consumer()
            self.producer = self.create_producer()

            logger.info(f"Subscribed to topic: {self.input_topic}")
            self.running = True

            # Main consumption loop
            for message in self.consumer:
                if not self.running:
                    break

                logger.debug(f"Received message from partition {message.partition},offset {message.offset}")

                # Process message
                success = self.process_message(message)

                if success and not self.config.get("enable_auto_commit", True):
                    # Manual commit if self-commit is disabled
                    self.consumer.commit()

                time.sleep(0.001)

        except KeyboardInterrupt:
            logger.info("Interrupted, shutting down...")
        except NoBrokersAvailable:
            logger.info("Could not connect to Kafka broker. Check bootstrap servers")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in consumer loop: {e!s}")
            raise
        finally:
            self.stop()

    def stop(self):
        """
        Stop consuming and clean up resources
        """
        logger.info("Stopping GTFS realtime consumer...")
        self.running = False

        # Close consumer and producer
        if self.consumer:
            self.consumer.close()

        if self.producer:
            self.producer.flush(timeout=10)
            self.producer.close()

        logger.info("GTFS realtime stopped successfully")

    def _save_sample_json(self, parsed_data: dict, message_key: str = None, filename: str = None) -> None:
        """
        Internal function to save a sample of parsed data as JSON file for debugging/analysis
        """
        try:
            if not filename:
                # Generate filename with timestamp
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                filename = f"gtfs_sample_{timestamp}.json"

            # Create sample structure with metadata
            sample = {
                "_sample_info": {
                    "saved_at": datetime.utcnow().isoformat() + "Z",
                    "message_key": message_key,
                    "filename": filename,
                    "total_entities": len(parsed_data.get("entity", [])),
                },
                "header": parsed_data.get("header", {}),
                "entity_samples": [],
                "metadata": parsed_data.get("_metadata", {}),
            }

            # Sample up to 5 entities to avoid huge files
            entities = parsed_data.get("entity", [])
            sample_entities = entities[:5]  # First 5 entities

            for i, entity in enumerate(sample_entities):
                entity_sample = {
                    "sample_index": i,
                    "entity_id": entity.get("id", f"unknown_{i}"),
                    "entity_type": self._get_entity_type(entity),
                    "data": entity,
                }
                sample["entity_samples"].append(entity_sample)

            # Add entity type distribution
            sample["_sample_info"]["entity_type_distribution"] = self._get_entity_distribution(entities)

            # Save to file
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(sample, f, indent=2, ensure_ascii=False, default=str)

            logger.info(f"Sample data saved to: {filename}")
            logger.info(f"Sample contains {len(sample_entities)} entities out of {len(entities)} total")

            return filename

        except Exception as e:
            logger.error(f"Failed to save sample JSON: {e!s}")
            return None

    def _get_entity_type(self, entity: dict) -> str:
        """
        Determine the type of GTFS entity
        """
        if entity.get("trip_update"):
            return "trip_update"
        elif entity.get("vehicle"):
            return "vehicle_position"
        elif entity.get("alert"):
            return "alert"
        else:
            return "unknown"

    def _get_entity_distribution(self, entities: list) -> dict:
        """
        Count distribution of entity types
        """
        distribution = {}
        for entity in entities:
            entity_type = self._get_entity_type(entity)
            distribution[entity_type] = distribution.get(entity_type, 0) + 1
        return distribution

    def _show_sample(self, parsed_data: dict, message_key: str = None) -> None:
        """
        Internal function to show a sample of the parsed Kafka message structure. For development purposes.
        """
        if self.sample_shown:
            return None

        logger.info("=" * 40)
        logger.info("SAMPLE PARSED MESSAGE STRUCTURE:")
        logger.info("=" * 40)

        sample = {
            "key": message_key,
            "header": parsed_data.get("header", {}),
            "entity_sample": {},
            "metadata": parsed_data.get("_metadata", {}),
        }

        entities = parsed_data.get("entity", [])

        if not entities:
            logger.info("No entities found in message")
            return

        # Get the first entity for the sample
        first_entity = entities[0]

        # Create a flattened representation for tabular display
        sample_data = {}

        # Add basic entity info
        sample_data["entity_id"] = first_entity.get("id", "N/A")

        # Add header info
        header = parsed_data.get("header", {})
        sample_data["header_timestamp"] = header.get("timestamp", "N/A")
        sample_data["gtfs_version"] = header.get("gtfs_realtime_version", "N/A")

        # Flatten entity data (handle nested structures)
        for key, value in first_entity.items():
            if key == "id":
                continue  # Already added
            elif isinstance(value, dict):
                # For nested dicts, create composite columns
                for sub_key, sub_value in value.items():
                    if isinstance(sub_value, dict):
                        # Double nested - stringify
                        sample_data[f"{key}.{sub_key}"] = (
                            str(sub_value)[:50] + "..." if len(str(sub_value)) > 50 else str(sub_value)
                        )
                    else:
                        sample_data[f"{key}.{sub_key}"] = sub_value
            else:
                sample_data[key] = value

        # Add metadata
        metadata = parsed_data.get("_metadata", {})
        sample_data["parsed_timestamp"] = metadata.get("parsed_timestamp", "N/A")
        sample_data["entity_count"] = metadata.get("entity_count", 0)

        # Display as DataFrame-like table
        logger.info(f"Message Key: {message_key}")
        logger.info(f"Total entities in batch: {len(entities)}")
        logger.info("")
        logger.info("First Entity Sample (similar to df.head(1)):")
        logger.info("-" * 100)

        # Calculate column widths
        max_key_len = max(len(str(key)) for key in sample_data)
        max_value_len = min(80, max(len(str(value)) for value in sample_data.values()))

        # Header row
        header_line = f"{'Field':<{max_key_len}} | {'Value':<{max_value_len}}"
        logger.info(header_line)
        logger.info("-" * len(header_line))

        # Data rows
        for key, value in sample_data.items():
            # Truncate long values for display
            display_value = str(value)
            if len(display_value) > max_value_len:
                display_value = display_value[: max_value_len - 3] + "..."

            row = f"{key:<{max_key_len}} | {display_value:<{max_value_len}}"
            logger.info(row)

        logger.info("-" * len(header_line))
        logger.info("")

        # Show entity types distribution
        entity_types = {}
        for entity in entities[:10]:  # Check first 10 entities for types
            for key in entity.keys():
                if key != "id":
                    entity_types[key] = entity_types.get(key, 0) + 1

        if entity_types:
            logger.info("Entity types in this batch:")
            for etype, count in entity_types.items():
                logger.info(f"  {etype}: {count} entities")

        # Save sample as json file
        json_filename = self._save_sample_json(parsed_data, message_key)
        if json_filename:
            logger.info(f"Full sample saved toL {json_filename}")

        logger.info("=" * 80)

        # Mark sample as shown
        self.sample_shown = True


def load_config() -> dict[str, Any]:
    """
    Load config from enviroment variables
    """

    config = {
        "bootstrap_servers": settings.KAFKA_BOOTSTRAP_SERVERS,
        "consumer_group": settings.KAFKA_CONSUMER_GROUP,
        "input_topic": settings.KAFKA_INPUT_TOPIC,
        "output_topic": settings.KAFKA_OUTPUT_TOPIC,
        "auto_offset_reset": settings.KAFKA_AUTO_OFFSET_RESET,
        "enable_auto_commit": settings.KAFKA_ENABLE_AUTO_COMMIT,
        "client_id": settings.KAFKA_CLIENT_ID,
        "acks": settings.KAFKA_ACKS,
        "retries": settings.KAFKA_RETRIES,
    }

    return config


def main():
    "Main execution function"
    try:
        config = load_config()

        consumer = RawConsumer(config)
        consumer.start()

    except Exception as e:
        logger.error(f"Failed to start GTFS realtime consumer: {e!s}")
        raise


if __name__ == "__main__":
    main()

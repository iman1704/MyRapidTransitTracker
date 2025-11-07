from datetime import datetime

from google.transit import gtfs_realtime_pb2
from kafka import KafkaConsumer


def verify_raw_ingestion():
    print("Verifying raw data...")
    print("=" * 20)

    try:
        consumer = KafkaConsumer(
            "rapid-bus-kl",
            bootstrap_servers=["localhost:9092"],
            auto_offset_reset="earliest",
            enable_auto_commit=False,
            consumer_timeout_ms=10000,
        )

        print("Connecting to Kafka...")

        for message_count, message in enumerate(consumer, 1):
            print(f"Message #{message_count}")
            print(f"Key: {message.key.decode() if message.key else 'None'}")

            try:
                feed = gtfs_realtime_pb2.FeedMessage()
                feed.ParseFromString(message.value)
                print("Valid protobuf")

                print(f"Version: {feed.header.gtfs_realtime_version}")
                print(f"Timestamp: {datetime.fromtimestamp(feed.header.timestamp)}")
                print(f"Entities: {len(feed.entity)}")

                vehicle_count = sum(1 for e in feed.entity if e.HasField("vehicle"))
                print(f"Vehicles: {vehicle_count}")

            except Exception as e:
                print(f"Invalid GTFS protobuf: {e}")

            if message_count >= 3:
                print(f"Success! Received {message_count} valid messages")

            if message_count == 0:
                print("No message received")

        consumer.close()

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    verify_raw_ingestion()

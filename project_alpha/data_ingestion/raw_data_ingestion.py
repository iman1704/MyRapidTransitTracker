import logging
import sys
import time
from datetime import datetime

import requests
from kafka import KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import KafkaError

# Import settings from your configs.py file
from project_alpha.config.settings import settings

# Setup logging
logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s - %(name)s - %(message)s")
logger = logging.getLogger(__name__)


class DataIngestor:
    def __init__(self):
        self.api_url = settings.GTFS_API_URL
        self.api_key = settings.GTFS_API_KEY
        self.kafka_broker = settings.KAFKA_BOOTSTRAP_SERVERS
        self.kafka_topic = settings.KAFKA_INPUT_TOPIC
        self.polling_interval = settings.POLLING_INTERVAL

        self.kafka_config = {
            "bootstrap_servers": [self.kafka_broker],
            "acks": settings.KAFKA_ACKS,
            "retries": settings.KAFKA_RETRIES,
            "request_timeout_ms": settings.KAFKA_REQUEST_TIMEOUT_MS,
            "max_block_ms": settings.KAFKA_MAX_BLOCK_MS,
        }

        # For Production settings
        if settings.KAFKA_SECURITY_PROTOCOL:
            self.kafka_config["security_protocol"] = settings.KAFKA_SECURITY_PROTOCOL

        if settings.KAFKA_SASL_MECHANISM:
            self.kafka_config["sasl_mechanism"] = settings.KAFKA_SASL_MECHANISM

        if settings.KAFKA_SASL_PLAIN_USERNAME and settings.KAFKA_SASL_PLAIN_PASSWORD:
            self.kafka_config["sasl_plain_username"] = settings.KAFKA_SASL_PLAIN_USERNAME
            self.kafka_config["sasl_plain_password"] = settings.KAFKA_SASL_PLAIN_PASSWORD

        if settings.KAFKA_SSL_CAFILE:
            self.kafka_config["ssl_cafile"] = settings.KAFKA_SSL_CAFILE

        if settings.KAFKA_SSL_CERTFILE:
            self.kafka_config["ssl_certfile"] = settings.KAFKA_SSL_CERTFILE

        if settings.KAFKA_SSL_KEYFILE:
            self.kafka_config["ssl_keyfile"] = settings.KAFKA_SSL_KEYFILE

        try:
            self.producer = KafkaProducer(**self.kafka_config)
            logger.info(f"Kafka producer connected to {self.kafka_broker}")
        except Exception as e:
            logger.exception(f"Failed to connect to Kafka: {e}")
            sys.exit(1)

        # The api key is optional for higher rate limit
        if self.api_key:
            self.headers = {"Authorization": f"Bearer {self.api_key}"}
            logger.info("API key configured")
        else:
            self.headers = None
            logger.info("Using without API key")

    def fetchGTFS(self):
        try:
            logger.debug(f"Fetching data from {self.api_url}")

            response = requests.get(
                self.api_url,
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()

            return response.content

        except requests.exceptions.RequestException as e:
            logger.exception(f"HTTP error fetching data: {e}")
            return None
        except Exception as e:
            logger.exception(f"Unexpected error fetching data: {e}")
            return None

    def send_to_kafka(self, raw_data):
        try:
            if not raw_data:
                logger.warning("No data to send to kafka")
                return False

            data_size = len(raw_data)
            timestamp = datetime.now().timestamp()

            future = self.producer.send(self.kafka_topic, value=raw_data, key=str(timestamp).encode("utf-8"))

            # wait for sending to complete
            record_metadata = future.get(timeout=10)

            logger.info(
                f"Sent {data_size} bytes to Kafka - {record_metadata.topic}, "
                f"Partition: {record_metadata.partition}, Offset: {record_metadata.offset}"
            )

            return True

        except KafkaError as e:
            logger.exception(f"Kafka error: {e}")
            return False

        except Exception as e:
            logger.error(f"Error sending to Kafka: {e}")
            return False

    def single_fetch(self):
        logger.info("Fetching data...")

        raw_data = self.fetchGTFS()
        if not raw_data:
            logger.error("Failed to fetch data")
            return False

        logger.info(f"Received {len(raw_data)} bytes of protobuf data")

        success = self.send_to_kafka(raw_data)

        return success

    def continuous_fetch(self):
        logger.info(f"Starting continuous data ingestion with {self.polling_interval} seconds interval")

        try:
            while True:
                start_time = time.time()

                success = self.single_fetch()
                if not success:
                    logger.warning("Fetch failed, retrying after interval")

                processing_time = time.time() - start_time
                sleep_time = max(0, self.polling_interval - processing_time)

                if sleep_time > 0:
                    logger.debug(f"Sleeping for {sleep_time:.1f} seconds")
                    time.sleep(sleep_time)

        except KeyboardInterrupt:
            logger.info("User interrupted manually")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            self.close()

        return

    def close(self):
        logger.info("Cleaning up resources...")
        if hasattr(self, "producer"):
            self.producer.close()
        logger.info("Data ingestion stopped")

        return


def main():
    ingestor = DataIngestor()

    # Get Kafka broker and topic from settings for admin client
    kafka_broker = settings.KAFKA_BOOTSTRAP_SERVERS
    kafka_topic = settings.KAFKA_INPUT_TOPIC

    try:
        admin = KafkaAdminClient(bootstrap_servers=kafka_broker)
        topics = admin.list_topics()
        logger.info(f"Kafka connection verified. Available topics: {len(topics)}")
        admin.close()
    except Exception as e:
        logger.error(f"Cannot connect to Kafka: {e}")
        sys.exit(1)

    try:
        admin = KafkaAdminClient(bootstrap_servers=kafka_broker)
        topic_list = [NewTopic(name=kafka_topic, num_partitions=1, replication_factor=1)]
        admin.create_topics(new_topics=topic_list, validate_only=False)
        logger.info(f"Topic '{kafka_topic}' created or already exists")
        admin.close()
    except Exception as e:
        logger.info(f"Topic creation {e} (may already exists)")

    try:
        ingestor.continuous_fetch()
    except KeyboardInterrupt:
        logger.info("Shutdown complete")


if __name__ == "__main__":
    main()

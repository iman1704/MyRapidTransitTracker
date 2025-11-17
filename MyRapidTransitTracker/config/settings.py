"""
Get configs from env
Format: CONFIG_NAME: type = "default_value"
"""

from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Kafka configs
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_INPUT_TOPIC: str = "gtfs-realtime-raw"
    KAFKA_OUTPUT_TOPIC: str = "gtfs-realtime-parsed"
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"
    KAFKA_ENABLE_AUTO_COMMIT: bool = True
    KAFKA_CLIENT_ID: str = "gtfs-realtime-parser-local"
    KAFKA_ACKS: str = "all"
    KAFKA_RETRIES: int = 3
    KAFKA_REQUEST_TIMEOUT_MS: int = 30000
    KAFKA_MAX_BLOCK_MS: int = 60000
    KAFKA_CONSUMER_GROUP: str = "gtfs-realtime-consumer"

    # Optional Kafka security configurations
    KAFKA_SECURITY_PROTOCOL: Optional[str] = None
    KAFKA_SASL_MECHANISM: Optional[str] = None
    KAFKA_SASL_PLAIN_USERNAME: Optional[str] = None
    KAFKA_SASL_PLAIN_PASSWORD: Optional[str] = None
    KAFKA_SSL_CAFILE: Optional[str] = None
    KAFKA_SSL_CERTFILE: Optional[str] = None
    KAFKA_SSL_KEYFILE: Optional[str] = None

    # GTFS API
    GTFS_FEED_TYPE: str = "vehicle_positions"
    GTFS_API_URL: str = "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-kl"
    GTFS_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "gtfs_data"
    DB_USER: str = "user"
    DB_PASSWORD: str = "password"
    DB_RETENTION: int = 7 # Period to keep record

    # Application configs
    POLLING_INTERVAL: int = 30
    LOG_LEVEL: str = "INFO"
    PROCESSING_BATCH_SIZE: int = 190
    PROCESSING_DELAY_MS: int = 100
    BATCH_SIZE: int = 500
    BATCH_TIMEOUT_SECONDS: int = 180
    CLEANUP_INTERVAL_HOURS: int = 24
    DATA_RETENTION_DAYS: int = 7

    REDIS_PORT: int = 6379
    REDIS_HOST: str = "redis"
    SAVE_BATCH_TO_JSON: bool = False
    
    # Additional settings
    FLASK_SECRET_KEY: str = "dev-secret-key-change-in-production"
    NETWORK_SUBNET: str = "172.25.0.0/16"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )

    @field_validator(
        "KAFKA_RETRIES",
        "KAFKA_REQUEST_TIMEOUT_MS",
        "KAFKA_MAX_BLOCK_MS",
        "POLLING_INTERVAL",
        "BATCH_SIZE",
        "PROCESSING_DELAY_MS",
    )
    def validate_positive_ints(cls, v):
        if v < 0:
            raise ValueError(f"Value must be positive, got {v}")
        return v


settings = Settings()

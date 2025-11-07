"""
Database connection utilities
"""

from redis.crc import REDIS_CLUSTER_HASH_SLOTS
import redis
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from project_alpha.config.settings import settings


# Setup logging
logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s - %(name)s - %(message)s")
logger = logging.getLogger(__name__)

DATABASE_URL = (
    f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)
REDIS_URL = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis
try:
    redis_client = redis.Redis.from_url(REDIS_URL)
    redis_client.ping()
    logger.info("Redis connection successful")
except redis.exceptions.ConnectionError as e:
    logger.exception(f"Could not connect to Redis at {REDIS_URL}: {e}")
    redis_client = None
    

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

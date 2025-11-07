## Directory Tree

```
/
    ├── project_alpha/
    │   ├── config/
    │   │   ├── __init__.py
    │   │   └── settings.py
    │   ├── data_ingestion/
    │   │   ├── __init__.py
    │   │   ├── data_verifier.py
    │   │   ├── prototype.py
    │   │   ├── raw_consumer.py
    │   │   └── raw_data_ingestion.py
    │   ├── database/
    │   │   ├── __init__.py
    │   │   ├── database.py
    │   │   └── models.py
    │   ├── scripts/
    │   │   ├── test_import.py
    │   │   └── test_visualization.py
    │   ├── stream_processing/
    │   │   └── database_writer.py
    │   ├── utils/
    │   │   └── logger.py
    │   ├── visualization/
    │   │   ├── static/
    │   │   │   ├── css/
    │   │   │   │   └── styles.css
    │   │   │   └── js/
    │   │   │       └── map.js
    │   │   ├── templates/
    │   │   │   ├── base.html
    │   │   │   ├── index.html
    │   │   │   └── map.html
    │   │   ├── __init__.py
    │   │   └── app.py
    │   ├── Dockerfile.viz
    │   ├── __init__.py
    │   └── foo.py
    ├── tests/
    │   ├── test_foo.py
    │   └── test_server.py
    ├── Dockerfile.consumer
    ├── Dockerfile.ingestion
    ├── Dockerfile.writer
    ├── LICENSE
    ├── Makefile
    ├── docker-compose.yml
    ├── pyproject.toml
    └── test_api.py
```


## File Contents

### .dockerignore

```text

__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
.mypy_cache/
.env
.git/
.vscode/
.idea/
*.md
!README.md
tests/
.coverage
htmlcov/
dist/
build/
*.egg-info/
```

### .github/actions/setup-python-env/action.yml

```text
name: "Setup Python Environment"
description: "Set up Python environment for the given Python version"

inputs:
  python-version:
    description: "Python version to use"
    required: true
    default: "3.12"
  uv-version:
    description: "uv version to use"
    required: true
    default: "0.6.14"

runs:
  using: "composite"
  steps:
    - uses: actions/setup-python@v5
      with:
        python-version: ${{ inputs.python-version }}

    - name: Install uv
      uses: astral-sh/setup-uv@v6
      with:
        version: ${{ inputs.uv-version }}
        enable-cache: 'true'
        cache-suffix: ${{ matrix.python-version }}

    - name: Install Python dependencies
      run: uv sync --frozen
      shell: bash
```

### .github/workflows/main.yml

```text
name: Main

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Check out
        uses: actions/checkout@v4

      - uses: actions/cache@v4
        with:
          path: ~/.cache/pre-commit
          key: pre-commit-${{ hashFiles('.pre-commit-config.yaml') }}

      - name: Set up the environment
        uses: ./.github/actions/setup-python-env

      - name: Run checks
        run: make check

  tests-and-type-check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.9", "3.10", "3.11", "3.12", "3.13"]
      fail-fast: false
    defaults:
      run:
        shell: bash
    steps:
      - name: Check out
        uses: actions/checkout@v4

      - name: Set up the environment
        uses: ./.github/actions/setup-python-env
        with:
          python-version: ${{ matrix.python-version }}

      - name: Run tests
        run: uv run python -m pytest tests 

      - name: Check typing
        run: uv run mypy
```

### .gitignore

```text
docs/source

# From https://raw.githubusercontent.com/github/gitignore/main/Python.gitignore

# Byte-compiled / optimized / DLL files
__pycache__/
*.py[codz]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py.cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# UV
#   Similar to Pipfile.lock, it is generally recommended to include uv.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#uv.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
#poetry.lock
#poetry.toml

# pdm
#   Similar to Pipfile.lock, it is generally recommended to include pdm.lock in version control.
#   pdm recommends including project-wide configuration in pdm.toml, but excluding .pdm-python.
#   https://pdm-project.org/en/latest/usage/project/#working-with-version-control
#pdm.lock
#pdm.toml
.pdm-python
.pdm-build/

# pixi
#   Similar to Pipfile.lock, it is generally recommended to include pixi.lock in version control.
#pixi.lock
#   Pixi creates a virtual environment in the .pixi directory, just like venv module creates one
#   in the .venv directory. It is recommended not to include this directory in version control.
.pixi

# PEP 582; used by e.g. github.com/David-OConnor/pyflow and github.com/pdm-project/pdm
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.envrc
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# PyCharm
#  JetBrains specific template is maintained in a separate JetBrains.gitignore that can
#  be found at https://github.com/github/gitignore/blob/main/Global/JetBrains.gitignore
#  and can be added to the global gitignore or merged into this file.  For a more nuclear
#  option (not recommended) you can uncomment the following to ignore the entire idea folder.
#.idea/

# Abstra
# Abstra is an AI-powered process automation framework.
# Ignore directories containing user credentials, local state, and settings.
# Learn more at https://abstra.io/docs
.abstra/

# Visual Studio Code
#  Visual Studio Code specific template is maintained in a separate VisualStudioCode.gitignore
#  that can be found at https://github.com/github/gitignore/blob/main/Global/VisualStudioCode.gitignore
#  and can be added to the global gitignore or merged into this file. However, if you prefer,
#  you could uncomment the following to ignore the entire vscode folder
# .vscode/

# Ruff stuff:
.ruff_cache/

# PyPI configuration file
.pypirc

# Cursor
#  Cursor is an AI-powered code editor. `.cursorignore` specifies files/directories to
#  exclude from AI features like autocomplete and code analysis. Recommended for sensitive data
#  refer to https://docs.cursor.com/context/ignore-files
.cursorignore
.cursorindexingignore

# Marimo
marimo/_static/
marimo/_lsp/
__marimo__/
```

### .pre-commit-config.yaml

```text
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: "v5.0.0"
    hooks:
      - id: check-case-conflict
      - id: check-merge-conflict
      - id: check-toml
      - id: check-yaml
      - id: check-json
        exclude: ^.devcontainer/devcontainer.json
      - id: pretty-format-json
        exclude: ^.devcontainer/devcontainer.json
        args: [--autofix, --no-sort-keys]
      - id: end-of-file-fixer
      - id: trailing-whitespace

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: "v0.12.7"
    hooks:
      - id: ruff-check
        args: [ --exit-non-zero-on-fix ]
      - id: ruff-format
```

### Dockerfile.consumer

```text
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install .

COPY project_alpha ./project_alpha

ENV PYTHONPATH=/app

CMD ["python", "-m", "project_alpha.data_ingestion.raw_consumer"]
```

### Dockerfile.ingestion

```text
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install .

COPY project_alpha ./project_alpha

ENV PYTHONPATH=/app

CMD ["python", "-m", "project_alpha.data_ingestion.raw_data_ingestion"]
```

### Dockerfile.writer

```text
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install .

COPY project_alpha ./project_alpha

ENV PYTHONPATH=/app

CMD ["python", "-m", "project_alpha.stream_processing.database_writer"]
```

### LICENSE

```text
MIT License

Copyright (c) 2025 Iman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Makefile

```text
.PHONY: install
install: ## Install the virtual environment and install the pre-commit hooks
	@echo "🚀 Creating virtual environment using uv"
	@uv sync
	@uv run pre-commit install

.PHONY: check
check: ## Run code quality tools.
	@echo "🚀 Checking lock file consistency with 'pyproject.toml'"
	@uv lock --locked
	@echo "🚀 Linting code: Running pre-commit"
	@uv run pre-commit run -a
	@echo "🚀 Static type checking: Running mypy"
	@uv run mypy

.PHONY: test
test: ## Test the code with pytest
	@echo "🚀 Testing code: Running pytest"
	@uv run python -m pytest --doctest-modules

.PHONY: build
build: clean-build ## Build wheel file
	@echo "🚀 Creating wheel file"
	@uvx --from build pyproject-build --installer uv

.PHONY: clean-build
clean-build: ## Clean build artifacts
	@echo "🚀 Removing build artifacts"
	@uv run python -c "import shutil; import os; shutil.rmtree('dist') if os.path.exists('dist') else None"

.PHONY: help
help:
	@uv run python -c "import re; \
	[[print(f'\033[36m{m[0]:<20}\033[0m {m[1]}') for m in re.findall(r'^([a-zA-Z_-]+):.*?## (.*)$$', open(makefile).read(), re.M)] for makefile in ('$(MAKEFILE_LIST)').strip().split()]"

.DEFAULT_GOAL := help
```

### docker-compose.yml

```text
version: '3.8'

services:
  # ============================================
  # ZOOKEEPER - Required for Kafka
  # ============================================
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0 
    platform: linux/arm64
    hostname: zookeeper
    container_name: gtfs-zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - gtfs-network
    restart: unless-stopped

  # ============================================
  # KAFKA - Message Broker
  # ============================================
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    platform: linux/arm64
    hostname: kafka
    container_name: gtfs-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_LOG_RETENTION_HOURS: 168
    networks:
      - gtfs-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "kafka:29092", "--list"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ============================================
  # POSTGRESQL - Database
  # ============================================
  postgres:
    image: postgres:15-alpine
    platform: linux/arm64
    hostname: postgres
    container_name: gtfs-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-gtfs_realtime}
      POSTGRES_USER: ${DB_USER:-gtfs_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-gtfs_password}
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - gtfs-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-gtfs_user} -d ${DB_NAME:-gtfs_realtime}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ============================================
  # DATA INGESTION - GTFS Feed Producer
  # ============================================
  data-ingestion:
    build:
      context: .
      dockerfile: Dockerfile.ingestion
    platform: linux/arm64
    container_name: gtfs-data-ingestion
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      - KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - KAFKA_INPUT_TOPIC=${KAFKA_INPUT_TOPIC:-gtfs-realtime-raw}
      - GTFS_API_URL=${GTFS_API_URL}
      - GTFS_API_KEY=${GTFS_API_KEY:-}
      - POLLING_INTERVAL=${POLLING_INTERVAL:-30}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
      - PYTHONUNBUFFERED=1
    networks:
      - gtfs-network
    restart: unless-stopped

  # ============================================
  # RAW CONSUMER - Processes raw GTFS data
  # ============================================
  raw-consumer:
    build:
      context: .
      dockerfile: Dockerfile.consumer
    platform: linux/arm64
    container_name: gtfs-raw-consumer
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      - KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - KAFKA_INPUT_TOPIC=${KAFKA_INPUT_TOPIC:-gtfs-realtime-raw}
      - KAFKA_CONSUMER_GROUP_RAW=${KAFKA_CONSUMER_GROUP_RAW:-raw-consumer-group}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
      - PYTHONUNBUFFERED=1
    networks:
      - gtfs-network
    restart: unless-stopped

  # ============================================
  # DATABASE WRITER - Writes to PostgreSQL
  # ============================================
  database-writer:
    build:
      context: .
      dockerfile: Dockerfile.writer
    platform: linux/arm64
    container_name: gtfs-database-writer
    depends_on:
      kafka:
        condition: service_healthy
      postgres:
        condition: service_healthy
    environment:
      - KAFKA_BOOTSTRAP_SERVERS=kafka:29092
      - KAFKA_OUTPUT_TOPIC=${KAFKA_OUTPUT_TOPIC:-gtfs-realtime-parsed}
      - DB_HOST=${DB_HOST:-postgres}
      - DB_PORT=${DB_PORT:-5432}
      - DB_NAME=${DB_NAME:-gtfs_realtime}
      - DB_USER=${DB_USER:-gtfs_user}
      - DB_PASSWORD=${DB_PASSWORD:-gtfs_password}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
      - PYTHONUNBUFFERED=1
    networks:
      - gtfs-network
    restart: unless-stopped

  # ============================================
  # VISUALIZATION - Web Application
  # ============================================
  web-app:
    build:
      context: .
      dockerfile: project_alpha/Dockerfile.viz
    platform: linux/arm64
    container_name: gtfs-visualization
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "5001:8000"
    environment:
      - DB_HOST=${DB_HOST:-postgres}
      - DB_PORT=${DB_PORT:-5432}
      - DB_NAME=${DB_NAME:-gtfs_realtime}
      - DB_USER=${DB_USER:-gtfs_user}
      - DB_PASSWORD=${DB_PASSWORD:-gtfs_password}
      - FLASK_SECRET_KEY=${FLASK_SECRET_KEY:-dev-secret-key-change-in-production}
      - FLASK_ENV=${FLASK_ENV:-development}
      - FLASK_DEBUG=${FLASK_DEBUG:-True}
      - CORS_ORIGINS=${CORS_ORIGINS:-*}
      - PYTHONUNBUFFERED=1
    networks:
      - gtfs-network
    restart: unless-stopped

# ============================================
# NETWORKS
# ============================================
networks:
  gtfs-network:
    name: gtfs-network
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: ${NETWORK_SUBNET:-172.25.0.0/16}

# ============================================
# VOLUMES
# ============================================
volumes:
  postgres-data:
    driver: local
```

### project_alpha/Dockerfile.viz

```text
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install .

COPY project_alpha ./project_alpha

ENV PYTHONPATH=/app

WORKDIR /app/project_alpha/visualization

CMD ["python", "app.py"]
```

### project_alpha/__init__.py

```text

```

### project_alpha/config/__init__.py

```text

```

### project_alpha/config/settings.py

```text
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

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "gtfs_data"
    DB_USER: str = "user"
    DB_PASSWORD: str = "password"
    DB_RETENTION: int = 30  # Record time-to-live

    # Application configs
    POLLING_INTERVAL: int = 30
    LOG_LEVEL: str = "INFO"
    PROCESSING_BATCH_SIZE: int = 190
    PROCESSING_DELAY_MS: int = 100
    BATCH_SIZE: int = 500
    BATCH_TIMEOUT_SECONDS: int = 180
    CLEANUP_INTERVAL_HOURS: int = 24

    REDIS_URL: str = "redis://localhost:6379"
    
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
```

### project_alpha/data_ingestion/__init__.py

```text

```

### project_alpha/data_ingestion/data_verifier.py

```text
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
```

### project_alpha/data_ingestion/prototype.py

```text
# pip install gtfs-realtime-bindings pandas requests
import pandas as pd
from google.protobuf.json_format import MessageToDict
from google.transit import gtfs_realtime_pb2
from requests import get

"""
Summary of data:
- timestamp
- trip.tripId
- trip.startTime
- trip.startDate
- trip.routeId
- position.latitude
- position.longitude
- position.bearing
- position.speed
- vehicle.id
- vehicle.licensePlate

"""

# Sample GTFS-R URL from Malaysia's Open API
# As of September 2025 the api only offers vehicle position data (trip updates and alerts are not yet available)
feed_type = "vehicle-position"
URL = f"https://api.data.gov.my/gtfs-realtime/{feed_type}/prasarana?category=rapid-bus-kl"

# Parse the GTFS Realtime feed
feed = gtfs_realtime_pb2.FeedMessage()
response = get(URL, headers=None, timeout=10)

feed.ParseFromString(response.content)

# Extract and print vehicle position information
vehicle_positions = [MessageToDict(entity.vehicle) for entity in feed.entity]
print(f"Total vehicles: {len(vehicle_positions)}")
df = pd.json_normalize(vehicle_positions)
print(df.head(1))
print(df.columns)
```

### project_alpha/data_ingestion/raw_consumer.py

```text
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

from project_alpha.config.settings import settings

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
```

### project_alpha/data_ingestion/raw_data_ingestion.py

```text
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
```

### project_alpha/database/__init__.py

```text

```

### project_alpha/database/database.py

```text
"""
Database connection utilities
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from project_alpha.config.settings import settings

DATABASE_URL = (
    f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### project_alpha/database/models.py

```text
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(50), primary_key=True)
    license_plate = Column(String(20))
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

    positions = relationship("VehiclePosition", back_populates="vehicle", cascade="all, delete-orphan")
    current_position = relationship("CurrentVehiclePosition", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Vehicle(id='{self.id}')>"


class VehiclePosition(Base):
    __tablename__ = "vehicle_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=False, index=True)

    # Positional data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bearing = Column(Float)
    speed = Column(Float)

    # Trip
    trip_id = Column(String(100), ForeignKey("trips.trip_id"), index=True)
    route_id = Column(String(100), ForeignKey("routes.id"), index=True)
    stop_id = Column(String(100))
    current_status = Column(String(50))

    # Timestamps
    feed_timestamp = Column(DateTime, nullable=False)
    recorded_at = Column(DateTime, default=func.now(), index=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="positions")
    trip = relationship("Trip", back_populates="positions")
    route = relationship("Route", back_populates="positions")

    # Unique constraints
    __table_args__ = (UniqueConstraint("vehicle_id", "feed_timestamp", name="uq_vehicle_position_vehicle_ts"),)

    def __repr__(self) -> str:
        return f"<VehiclePosition(vehicle='{self.vehicle_id}', lat={self.latitude}, lon={self.longitude})>"


class CurrentVehiclePosition(Base):
    __tablename__ = "current_vehicle_positions"

    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), primary_key=True)

    # Current position
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bearing = Column(Float)
    speed = Column(Float)

    # Trip context 
    trip_id = Column(String(100), ForeignKey("trips.trip_id"), nullable=True)
    route_id = Column(String(100), ForeignKey("routes.id"), nullable=True)
    stop_id = Column(String(100))
    current_status = Column(String(50))

    # Timestamps
    feed_timestamp = Column(DateTime)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="current_position")
    route = relationship("Route")

    def __repr__(self) -> str:
        return f"<CurrentPosition(vehicle='{self.vehicle_id}')>"


class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(String(100), primary_key=True)
    route_id = Column(String(100), ForeignKey("routes.id"), nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    start_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    route = relationship("Route", back_populates="trips")
    positions = relationship("VehiclePosition", back_populates="trip")

    def __repr__(self) -> str:
        return f"<Trip(trip_id:'{self.trip_id}', route:'{self.route_id}')>"


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(100), primary_key=True)
    short_name = Column(String(50))
    long_name = Column(String(255))
    created_at = Column(DateTime, default=func.now())

    # Relationships
    trips = relationship("Trip", back_populates="route", cascade="all, delete-orphan")
    positions = relationship("VehiclePosition", back_populates="route")

    def __repr__(self) -> str:
        return f"<Route(id='{self.id}', name='{self.short_name}')>"
```

### project_alpha/foo.py

```text
def foo(bar: str) -> str:
    """Summary line.

    Extended description of function.

    Args:
        bar: Description of input argument.

    Returns:
        Description of return value
    """

    return bar


if __name__ == "__main__":  # pragma: no cover
    pass
```

### project_alpha/scripts/test_import.py

```text

# scripts/test_imports.py
"""Test that all imports work in Docker container"""
import subprocess
import sys

tests = [
    "from project_alpha.config.settings import settings",
    "from project_alpha.database.models import Vehicle",
    "from project_alpha.utils.logger import setup_logger",
    "print('✅ All imports successful!')",
]

for test in tests:
    result = subprocess.run(
        ["docker", "exec", "gtfs-raw-consumer", "python", "-c", test],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"✅ {test}")
    else:
        print(f"❌ {test}")
        print(f"   Error: {result.stderr}")
        sys.exit(1)

print("\n🎉 All tests passed!")
```

### project_alpha/scripts/test_visualization.py

```text
import requests
import time

BASE_URL = "http://localhost:5000"


def test_api_endpoints():
    """Test all API endpoints"""

    print("Testing API endpoints...")

    # Test current vehicles
    response = requests.get(f"{BASE_URL}/api/vehicles/current")
    print(f"✓ Current vehicles: {response.status_code} - {response.json().get('count', 0)} vehicles")

    # Test stats
    response = requests.get(f"{BASE_URL}/api/stats")
    print(f"✓ Stats: {response.status_code}")

    # Test routes
    response = requests.get(f"{BASE_URL}/api/routes")
    print(f"✓ Routes: {response.status_code}")

    print("\nAll tests passed! ✓")


if __name__ == "__main__":
    time.sleep(2)  # Wait for server to start
    test_api_endpoints()
```

### project_alpha/stream_processing/database_writer.py

```text
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

from project_alpha.config.settings import settings
from project_alpha.database.database import get_db
from project_alpha.database.models import Base, CurrentVehiclePosition, Route, Trip, Vehicle, VehiclePosition

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
```

### project_alpha/utils/logger.py

```text

```

### project_alpha/visualization/__init__.py

```text

```

### project_alpha/visualization/app.py

```text
"""
FastAPI Backend    
"""
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from sqlalchemy import desc
import uvicorn
from typing import Optional, List
from pathlib import Path

from project_alpha.database.database import get_db
from project_alpha.database.models import Vehicle, VehiclePosition, CurrentVehiclePosition, Route

TITLE = "Vehicle tracking API"
DESCRIPTION = "API for tracking vehicle position and routes"
VERSION = "0.0.1"

app = FastAPI(title=TITLE, description=DESCRIPTION, version=VERSION)

static_path = Path(__file__).parent / "static"
templates_path = Path(__file__).parent / "templates"

app.mount("/static", StaticFiles(directory=static_path), name="static")

templates = Jinja2Templates(directory=templates_path)

@app.get("/")
async def root(request: Request, db: Session = Depends(get_db)):
    """
    Root endpoint    
    """
    # Get real stats for template
    active_vehicles = db.query(CurrentVehiclePosition).count()
    total_routes = db.query(Route).count()

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "stats": {
                "active_vehicles": active_vehicles,
                "total_routes": total_routes
            },
            "updateInterval": 10
        }
    )


@app.get("/health")
async def health_check():
    """
    Basic health check    
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/vehicles/current")
async def get_current_vehicles(db: Session = Depends(get_db)):
    """
    Get all current vehicle positions with route information    
    """
    try:
        # Use proper join to get route data efficiently
        vehicles = (
            db.query(CurrentVehiclePosition, Route)
            .outerjoin(Route, CurrentVehiclePosition.route_id == Route.id)
            .all()
        )

        data = []
        for position, route in vehicles:
            vehicle_data = {
                "vehicle_id": position.vehicle_id,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "bearing": position.bearing,
                "speed": position.speed,
                "route": {
                    "id": route.id if route else None,
                    "short_name": route.short_name if route else None,
                    "long_name": route.long_name if route else None
                } if route else None,
                "trip_id": position.trip_id,
                "current_status": position.current_status,
                "last_update": position.feed_timestamp.isoformat() if position.feed_timestamp else None
            }
            data.append(vehicle_data)

        return JSONResponse({
            "success": True,
            "count": len(data),
            "vehicles": data,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles/{vehicle_id}/history")
async def get_vehicle_history(vehicle_id: str, db: Session = Depends(get_db)):
    """
    Get historical positions for a specific vehicle (last hour and max 100 records)
    """
    try:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"Vehicle: {vehicle_id} not found")

        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

        positions = (
            db.query(VehiclePosition)
            .filter(
                VehiclePosition.vehicle_id == vehicle_id,
                VehiclePosition.recorded_at >= one_hour_ago
            )
            .order_by(desc(VehiclePosition.recorded_at))
            .limit(100)
            .all()
        )

        history = []
        for position in positions:  
            history.append({
                "latitude": position.latitude,
                "longitude": position.longitude,
                "bearing": position.bearing,
                "speed": position.speed,
                "timestamp": position.feed_timestamp.isoformat() if position.feed_timestamp else None
            })

        return JSONResponse({
            "success": True,
            "vehicle_id": vehicle_id,
            "history": history
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/routes")
async def get_routes(db: Session = Depends(get_db)):
    """
    Get all available routes    
    """
    try:
        routes = db.query(Route).all()

        data = [{
            "id": r.id,
            "short_name": r.short_name,
            "long_name": r.long_name
        } for r in routes]

        return JSONResponse({
            "success": True,
            "routes": data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/stats")  
async def get_stats(db: Session = Depends(get_db)):
    """
    Get system stats    
    """
    try:
        total_vehicles = db.query(Vehicle).count()
        active_vehicles = db.query(CurrentVehiclePosition).count()  
        total_routes = db.query(Route).count()

        return JSONResponse({
            "success": True,
            "stats": {
                "total_vehicles": total_vehicles,
                "active_vehicles": active_vehicles,  
                "total_routes": total_routes,
                "last_updated": datetime.utcnow().isoformat()
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles")  
async def get_all_vehicles(
    db: Session = Depends(get_db),
    limit: Optional[int] = 100,
    skip: Optional[int] = 0
):
    """
    Get all vehicles with pagination (alternative endpoint)
    """
    try:
        vehicles_data = (
            db.query(CurrentVehiclePosition, Route)
            .outerjoin(Route, CurrentVehiclePosition.route_id == Route.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for position, route in vehicles_data:
            vehicle_data = {
                "vehicle_id": position.vehicle_id,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "bearing": position.bearing,
                "speed": position.speed,
                "trip_id": position.trip_id,
                "route_id": position.route_id,
                "stop_id": position.stop_id,
                "current_status": position.current_status,
                "feed_timestamp": position.feed_timestamp.isoformat() if position.feed_timestamp else None,
                "updated_at": position.updated_at.isoformat() if position.updated_at else None,
            }
            
            # Add route object if found
            if route:
                vehicle_data["route"] = {
                    "id": route.id,
                    "short_name": route.short_name,
                    "long_name": route.long_name,
                }
            
            result.append(vehicle_data)

        return JSONResponse({
            "success": True,
            "count": len(result),
            "vehicles": result
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/routes/{route_id}/vehicles")
async def get_vehicles_by_route(
    route_id: str, 
    db: Session = Depends(get_db), 
    limit: Optional[int] = 100, 
    skip: Optional[int] = 0
):
    """
    Get vehicles on a specific route
    """
    try:
        route = db.query(Route).filter(Route.id == route_id).first()
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")

        vehicles = (
            db.query(CurrentVehiclePosition)
            .filter(CurrentVehiclePosition.route_id == route_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for vehicle in vehicles:
            result.append({
                "vehicle_id": vehicle.vehicle_id,
                "latitude": vehicle.latitude,
                "longitude": vehicle.longitude,
                "bearing": vehicle.bearing,
                "speed": vehicle.speed,
                "trip_id": vehicle.trip_id,
                "route_id": vehicle.route_id,
                "stop_id": vehicle.stop_id,
                "current_status": vehicle.current_status,
                "feed_timestamp": vehicle.feed_timestamp.isoformat() if vehicle.feed_timestamp else None,
                "updated_at": vehicle.updated_at.isoformat() if vehicle.updated_at else None,
            })

        return JSONResponse({
            "success": True,
            "count": len(result),
            "vehicles": result
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/vehicles/historical")
async def get_historical_vehicles(
    start: datetime,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """
    Get historical vehicle positions for heatmap visualization
    """
    try:
        if end is None:
            end = datetime.utcnow()

        positions = db.query(VehiclePosition).filter(
            VehiclePosition.recorded_at >= start,
            VehiclePosition.recorded_at <= end
        ).all()

        data = []
        for position in positions:
            data.append({
                "vehicle_id": position.vehicle_id,
                "latitude": position.latitude,
                "longitude": position.longitude,
                "recorded_at": position.recorded_at.isoformat()
            })

        return JSONResponse({
            "success": True,
            "count": len(data),
            "positions": data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
```

### project_alpha/visualization/static/css/styles.css

```text
/* Enhanced Vehicle Markers */
.vehicle-marker.selected {
    transform: scale(1.3);
    z-index: 1000;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}


/* Marker Cluster Styles */
.marker-cluster-small {
    background-color: rgba(181, 226, 140, 0.6);
}
.marker-cluster-small div {
    background-color: rgba(110, 204, 57, 0.6);
}

.marker-cluster-medium {
    background-color: rgba(241, 211, 87, 0.6);
}
.marker-cluster-medium div {
    background-color: rgba(240, 194, 12, 0.6);
}

.marker-cluster-large {
    background-color: rgba(253, 156, 115, 0.6);
}
.marker-cluster-large div {
    background-color: rgba(241, 128, 23, 0.6);
}

.marker-cluster {
    background-clip: padding-box;
    border-radius: 20px;
}
.marker-cluster div {
    width: 30px;
    height: 30px;
    margin-left: 5px;
    margin-top: 5px;
    text-align: center;
    border-radius: 15px;
    font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
}
.marker-cluster span {
    line-height: 30px;
}

/* Heatmap controls */
.leaflet-control-time {
    background: white;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* Smooth transitions */
.vehicle-marker {
    transition: all 0.3s ease;
}

/* Custom scrollbar for info panel */
.info-panel::-webkit-scrollbar {
    width: 6px;
}

.info-panel::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.info-panel::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.info-panel::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
```

### project_alpha/visualization/static/js/map.js

```text
const { createApp } = Vue;

createApp({
    data() {
        return {
            map: null,
            markers: {},
            markerCluster: null,
            vehicles: [],
            routes: [],
            stats: {
                active_vehicles: 0,
                total_routes: 0
            },
            selectedVehicle: null,
            autoRefresh: true,
            updateInterval: 10,
            lastUpdate: null,
            loading: false,
            currentView: 'markers',
            timeRange: '10',
            customStartTime: null,
            customEndTime: null,
            selectedRoute: 'all',
            heatmapLayer: null,
            heatmapIntensity: 5,
            historicalData: []
        }
    },
    mounted() {
        this.initMap();
        this.loadRoutes();
        this.loadVehicles();
        this.startAutoRefresh();
    },
    methods: {
        initMap() {
            // Initialize Leaflet map with Kuala Lumpur as default center
            this.map = L.map('map').setView([3.1390, 101.6869], 12);
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            // Initialize marker cluster group
            this.markerCluster = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: true
            });
            this.map.addLayer(this.markerCluster);
            
            // Add scale control
            L.control.scale().addTo(this.map);
        },
        
        async loadRoutes() {
            try {
                const response = await fetch('/api/routes');
                const data = await response.json();
                if (data.success) {
                    this.routes = data.routes;
                }
            } catch (error) {
                console.error('Error loading routes:', error);
            }
        },
        
        async loadVehicles() {
            this.loading = true;
            try {
                const response = await fetch('/api/vehicles/current');
                const data = await response.json();
                
                if (data.success) {
                    this.vehicles = data.vehicles;
                    this.stats.active_vehicles = data.count;
                    this.updateVisualization();
                    this.lastUpdate = new Date();
                    this.updateConnectionStatus('Connected', 'text-green-500');
                }
            } catch (error) {
                console.error('Error loading vehicles:', error);
                this.updateConnectionStatus('Disconnected', 'text-red-500');
            } finally {
                this.loading = false;
            }
        },

        async loadHistoricalData() {
            if (this.currentView !== 'heatmap') return;

            try {
                let url = '/api/vehicles/historical?';
                const params = new URLSearchParams();
                
                if (this.timeRange === 'custom') {
                    if (this.customStartTime && this.customEndTime) {
                        params.append('start', new Date(this.customStartTime).toISOString());
                        params.append('end', new Date(this.customEndTime).toISOString());
                    }
                } else {
                    const minutes = parseInt(this.timeRange);
                    const endTime = new Date();
                    const startTime = new Date(endTime.getTime() - minutes * 60000);
                    params.append('start', startTime.toISOString());
                    params.append('end', endTime.toISOString());
                }

                const response = await fetch(url + params.toString());
                const data = await response.json();
                
                if (data.success) {
                    this.historicalData = data.positions;
                    this.updateHeatmap();
                }
            } catch (error) {
                console.error('Error loading historical data:', error);
            }
        },

        updateVisualization() {
            if (this.currentView === 'markers') {
                this.updateMarkers();
            } else {
                this.updateHeatmap();
            }
        },

        updateMarkers() {
            // Clear existing markers
            this.markerCluster.clearLayers();
            this.markers = {};

            const currentTime = new Date();
            const tenMinutesAgo = new Date(currentTime.getTime() - 10 * 60000);

            this.vehicles.forEach(vehicle => {
                // Filter by route if selected
                if (this.selectedRoute !== 'all' && vehicle.route_id !== this.selectedRoute) {
                    return;
                }

                const vehicleTime = vehicle.last_update ? new Date(vehicle.last_update) : new Date();
                const isRecent = vehicleTime >= tenMinutesAgo;

                const marker = L.marker([vehicle.latitude, vehicle.longitude], {
                    icon: this.createVehicleIcon(vehicle, isRecent),
                    rotationAngle: vehicle.bearing || 0
                });

                marker.on('click', () => {
                    this.selectVehicle(vehicle);
                });

                // Add popup with basic info
                marker.bindPopup(this.createPopupContent(vehicle));

                this.markers[vehicle.vehicle_id] = marker;
                this.markerCluster.addLayer(marker);
            });
        },

        updateHeatmap() {
            // Remove existing heatmap
            if (this.heatmapLayer) {
                this.map.removeLayer(this.heatmapLayer);
            }

            const points = this.historicalData.map(position => [
                position.latitude,
                position.longitude,
                this.heatmapIntensity / 10
            ]);

            if (points.length > 0) {
                this.heatmapLayer = L.heatLayer(points, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17,
                    gradient: {
                        0.4: 'blue',
                        0.6: 'cyan',
                        0.7: 'lime',
                        0.8: 'yellow',
                        1.0: 'red'
                    }
                }).addTo(this.map);
            }
        },

        createVehicleIcon(vehicle, isRecent) {
            const color = isRecent ? '#3b82f6' : '#f59e0b';
            const html = `
                <div class="vehicle-marker" style="
                    background-color: ${color};
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    transform: rotate(${vehicle.bearing || 0}deg);
                "></div>
            `;
            
            return L.divIcon({
                html: html,
                className: 'vehicle-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
        },

        createPopupContent(vehicle) {
            return `
                <div class="p-2 min-w-40">
                    <div class="font-semibold text-sm">Vehicle ${vehicle.vehicle_id}</div>
                    <div class="text-xs text-gray-600 mt-1">
                        ${vehicle.route ? `Route: ${vehicle.route.short_name || vehicle.route.id}` : 'No route info'}
                    </div>
                    <div class="text-xs text-gray-600">
                        Speed: ${vehicle.speed ? vehicle.speed.toFixed(1) + ' km/h' : 'N/A'}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        Updated: ${this.formatTime(vehicle.last_update)}
                    </div>
                </div>
            `;
        },

        selectVehicle(vehicle) {
            this.selectedVehicle = vehicle;
            
            // Highlight selected marker
            Object.keys(this.markers).forEach(id => {
                const marker = this.markers[id];
                if (marker.getElement()) {
                    marker.getElement().classList.remove('selected');
                }
            });

            const selectedMarker = this.markers[vehicle.vehicle_id];
            if (selectedMarker && selectedMarker.getElement()) {
                selectedMarker.getElement().classList.add('selected');
            }

            // Pan to vehicle
            this.map.panTo([vehicle.latitude, vehicle.longitude]);
        },

        closeVehicleInfo() {
            this.selectedVehicle = null;
            
            // Remove highlight from all markers
            Object.keys(this.markers).forEach(id => {
                const marker = this.markers[id];
                if (marker.getElement()) {
                    marker.getElement().classList.remove('selected');
                }
            });
        },

        async showVehicleHistory() {
            if (!this.selectedVehicle) return;
            
            try {
                const response = await fetch(`/api/vehicles/${this.selectedVehicle.vehicle_id}/history`);
                const data = await response.json();
                
                if (data.success && data.history.length > 0) {
                    // Create polyline from history
                    const points = data.history.map(p => [p.latitude, p.longitude]);
                    const polyline = L.polyline(points, {
                        color: '#3b82f6',
                        weight: 4,
                        opacity: 0.7
                    }).addTo(this.map);
                    
                    // Fit map to show the entire route
                    this.map.fitBounds(polyline.getBounds());

                    // Auto-remove after 30 seconds
                    setTimeout(() => {
                        this.map.removeLayer(polyline);
                    }, 30000);
                }
            } catch (error) {
                console.error('Error loading vehicle history:', error);
            }
        },

        filterVehicles() {
            this.updateVisualization();
        },

        onTimeRangeChange() {
            if (this.currentView === 'heatmap') {
                this.loadHistoricalData();
            } else {
                this.updateMarkers();
            }
        },

        refreshData() {
            if (this.currentView === 'markers') {
                this.loadVehicles();
            } else {
                this.loadHistoricalData();
            }
        },

        startAutoRefresh() {
            setInterval(() => {
                if (this.autoRefresh) {
                    this.refreshData();
                }
            }, this.updateInterval * 1000);
        },

        toggleAutoRefresh() {
            this.autoRefresh = !this.autoRefresh;
        },

        updateConnectionStatus(status, className) {
            const element = document.getElementById('connection-status');
            if (element) {
                element.textContent = status;
                element.className = `text-sm ${className}`;
            }
        },

        formatTime(timestamp) {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
        }
    },
    watch: {
        currentView(newView) {
            if (newView === 'heatmap') {
                this.loadHistoricalData();
            } else {
                if (this.heatmapLayer) {
                    this.map.removeLayer(this.heatmapLayer);
                    this.heatmapLayer = null;
                }
                this.updateMarkers();
            }
        },
        heatmapIntensity() {
            if (this.currentView === 'heatmap') {
                this.updateHeatmap();
            }
        }
    }
}).mount('#app');
```

### project_alpha/visualization/templates/base.html

```text
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}GTFS Real-time Tracker{% endblock %}</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <!-- Vue.js 3 -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ url_for('static', path='css/styles.css') }}">
    
    {% block extra_head %}{% endblock %}
</head>
<body class="bg-gray-100 font-sans">
    <nav class="bg-gray-800 text-white shadow-lg">
        <div class="container mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-bold">GTFS Real-time Tracker</h1>
                <div class="flex items-center space-x-4">
                    <span id="connection-status" class="text-sm"></span>
                    <span id="last-update" class="text-sm"></span>
                </div>
            </div>
        </div>
    </nav>
    
    <main class="flex-grow">
        {% block content %}{% endblock %}
    </main>

    <footer class="bg-gray-800 text-white py-4">
        <div class="container mx-auto text-center">
            <p class="text-sm">&copy; 2025 GTFS Real-time Tracker. All Rights Reserved.</p>
        </div>
    </footer>
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    {% block extra_scripts %}{% endblock %}
</body>
</html>
```

### project_alpha/visualization/templates/index.html

```text
{% extends "base.html" %}

{% block content %}
<div id="app" class="h-screen flex flex-col">
    <!-- Controls Panel -->
    <div class="bg-white shadow-lg p-4 border-b">
        <div class="container mx-auto">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <!-- View Toggles -->
                <div class="flex items-center space-x-4">
                    <div class="flex bg-gray-100 rounded-lg p-1">
                        <button 
                            @click="currentView = 'markers'"
                            :class="currentView === 'markers' ? 'bg-white shadow' : 'text-gray-600'"
                            class="px-3 py-1 rounded-md text-sm font-medium transition-all"
                        >
                            🚌 Live Vehicles
                        </button>
                        <button 
                            @click="currentView = 'heatmap'"
                            :class="currentView === 'heatmap' ? 'bg-white shadow' : 'text-gray-600'"
                            class="px-3 py-1 rounded-md text-sm font-medium transition-all"
                        >
                            🔥 Heatmap
                        </button>
                    </div>
                </div>

                <!-- Time Range Selector -->
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-600">Time Range:</span>
                        <select v-model="timeRange" @change="onTimeRangeChange" class="text-sm border rounded px-2 py-1">
                            <option value="10">Last 10 mins</option>
                            <option value="30">Last 30 mins</option>
                            <option value="60">Last 1 hour</option>
                            <option value="180">Last 3 hours</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <!-- Custom Time Range -->
                    <div v-if="timeRange === 'custom'" class="flex items-center space-x-2">
                        <input 
                            type="datetime-local" 
                            v-model="customStartTime"
                            class="text-sm border rounded px-2 py-1"
                        >
                        <span class="text-gray-400">to</span>
                        <input 
                            type="datetime-local" 
                            v-model="customEndTime"
                            class="text-sm border rounded px-2 py-1"
                        >
                    </div>
                </div>

                <!-- Stats & Controls -->
                <div class="flex items-center space-x-6">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{% raw %}{{ stats.active_vehicles }}{% endraw %}</div>
                        <div class="text-xs text-gray-500">Active Vehicles</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">{% raw %}{{ stats.total_routes }}{% endraw %}</div>
                        <div class="text-xs text-gray-500">Routes</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button 
                            @click="toggleAutoRefresh"
                            :class="autoRefresh ? 'bg-green-500' : 'bg-gray-400'"
                            class="px-3 py-1 text-white rounded text-sm font-medium transition-colors"
                        >
                            <span v-if="autoRefresh">🔄 Auto</span>
                            <span v-else>⏸️ Paused</span>
                        </button>
                        <button 
                            @click="refreshData"
                            class="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            <!-- Additional Filters -->
            <div class="mt-3 flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">Route Filter:</span>
                    <select v-model="selectedRoute" @change="filterVehicles" class="text-sm border rounded px-2 py-1">
                        <option value="all">All Routes</option>
                        <option v-for="route in routes" :value="route.id">{% raw %}{{ route.short_name || route.id }}{% endraw %}</option>
                    </select>
                </div>
                <div class="flex items-center space-x-2" v-if="currentView === 'heatmap'">
                    <span class="text-sm text-gray-600">Intensity:</span>
                    <input type="range" v-model="heatmapIntensity" min="1" max="10" class="w-20">
                    <span class="text-xs text-gray-500">{% raw %}{{ heatmapIntensity }}{% endraw %}/10</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Map Container -->
    <div class="flex-1 relative">
        <div id="map" class="w-full h-full"></div>
        
        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
            <div class="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
                <div class="spinner"></div>
                <span>Loading vehicle data...</span>
            </div>
        </div>

        <!-- Vehicle Info Panel -->
        <div v-if="selectedVehicle" 
             class="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 z-[1000] max-h-96 overflow-y-auto">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold text-gray-800">Vehicle Details</h3>
                <button @click="closeVehicleInfo" class="text-gray-500 hover:text-gray-700 transition-colors">
                    ✕
                </button>
            </div>
            
            <div class="space-y-3 text-sm">
                <div class="grid grid-cols-2 gap-2">
                    <div><span class="font-semibold text-gray-600">Vehicle ID:</span></div>
                    <div class="font-mono">{% raw %}{{ selectedVehicle.vehicle_id }}{% endraw %}</div>
                    
                    <div><span class="font-semibold text-gray-600">Route:</span></div>
                    <div>
                        <span v-if="selectedVehicle.route" class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {% raw %}{{ selectedVehicle.route.short_name || selectedVehicle.route.id }}{% endraw %}
                        </span>
                        <span v-else class="text-gray-400">N/A</span>
                    </div>
                    
                    <div><span class="font-semibold text-gray-600">Speed:</span></div>
                    <div>{% raw %}{{ selectedVehicle.speed ? selectedVehicle.speed.toFixed(1) + ' km/h' : 'N/A' }}{% endraw %}</div>
                    
                    <div><span class="font-semibold text-gray-600">Bearing:</span></div>
                    <div>{% raw %}{{ selectedVehicle.bearing ? selectedVehicle.bearing.toFixed(0) + '°' : 'N/A' }}{% endraw %}</div>
                    
                    <div><span class="font-semibold text-gray-600">Last Update:</span></div>
                    <div>{% raw %}{{ formatTime(selectedVehicle.last_update) }}{% endraw %}</div>
                </div>

                <div class="pt-2 border-t">
                    <button @click="showVehicleHistory" 
                            class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                        <span>📊 Show Travel History</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Legend -->
        <div class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[500]">
            <div class="text-sm font-semibold text-gray-700 mb-2">Legend</div>
            <div class="space-y-1 text-xs">
                <div class="flex items-center space-x-2" v-if="currentView === 'markers'">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span class="text-gray-600">Active Vehicle (last 10min)</span>
                </div>
                <div class="flex items-center space-x-2" v-if="currentView === 'markers'">
                    <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span class="text-gray-600">Older Position</span>
                </div>
                <div class="flex items-center space-x-2" v-if="currentView === 'heatmap'">
                    <div class="w-4 h-4 bg-gradient-to-r from-blue-400 via-green-400 to-red-500 rounded"></div>
                    <span class="text-gray-600">Vehicle Activity Heatmap</span>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block extra_scripts %}
<script src="{{ url_for('static', path='js/map.js') }}"></script>
{% endblock %}
```

### project_alpha/visualization/templates/map.html

```text

{% extends "base.html" %}

{% block title %}Live Vehicle Map - GTFS Realtime Tracker{% endblock %}

{% block content %}
<div id="app" class="container-fluid p-0">
    <div class="row g-0">
        <!-- Sidebar -->
        <div class="col-md-3 col-lg-2 bg-light sidebar">
            <div class="p-3">
                <h5 class="mb-3">🚌 Live Vehicles</h5>
                
                <!-- Route Filter -->
                <div class="mb-3">
                    <label class="form-label">Filter by Route:</label>
                    <select v-model="selectedRoute" class="form-select" @change="filterVehicles">
                        <option value="all">All Routes</option>
                        <option v-for="route in routes" :value="route.id">{{ route.short_name }} - {{ route.long_name }}</option>
                    </select>
                </div>

                <!-- Vehicle List -->
                <div class="vehicle-list">
                    <div v-for="vehicle in filteredVehicles" 
                         :key="vehicle.id"
                         class="vehicle-item card mb-2"
                         @mouseenter="highlightVehicle(vehicle.id)"
                         @mouseleave="unhighlightVehicle(vehicle.id)"
                         @click="focusVehicle(vehicle)">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{{ vehicle.route_id or 'N/A' }}</strong>
                                    <small class="text-muted d-block">{{ vehicle.id }}</small>
                                </div>
                                <div class="text-end">
                                    <span class="badge" :class="getStatusClass(vehicle.current_status)">
                                        {{ vehicle.current_status or 'Unknown' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="mt-3 pt-3 border-top">
                    <small class="text-muted">
                        <strong>{{ filteredVehicles.length }}</strong> vehicles active
                    </small>
                </div>
            </div>
        </div>

        <!-- Map -->
        <div class="col-md-9 col-lg-10">
            <div id="map" class="map-container"></div>
        </div>
    </div>
</div>
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', path='js/map.js') }}"></script>
{% endblock %}
```

### pyproject.toml

```text
[project]
name = "MyRapidTransitTracker"
version = "0.0.1"
description = "End-to-end data ingestion project with visualization"
authors = [{ name = "Iman", email = "mhdiman17@gmail.com" }]
readme = "README.md"
keywords = ['python']
requires-python = ">=3.9,<4.0"
classifiers = [
    "Intended Audience :: Developers",
    "Programming Language :: Python",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Software Development :: Libraries :: Python Modules",
]
dependencies = [
    "fastapi>=0.118.0",
    "flask>=3.1.2",
    "flask-cors>=6.0.1",
    "flask-sse>=1.0.0",
    "gtfs-realtime-bindings>=1.0.0",
    "httpx>=0.28.1",
    "kafka-python>=2.2.15",
    "pandas>=2.3.2",
    "psycopg2-binary>=2.9.10",
    "pydantic>=2.11.9",
    "pydantic-settings>=2.11.0",
    "python-dotenv>=1.1.1",
    "redis>=6.4.0",
    "repo-to-llm>=0.1.2",
    "requests>=2.32.5",
    "sqlalchemy>=2.0.43",
    "tenacity>=9.1.2",
    "uvicorn>=0.37.0",
]

[project.urls]
Homepage = "https://iman1704.github.io/MyRapidTransitTracker/"
Repository = "https://github.com/iman1704/MyRapidTransitTracker"
Documentation = "https://iman1704.github.io/MyRapidTransitTracker/"

[dependency-groups]
dev = [
    "pytest>=7.2.0",
    "pre-commit>=2.20.0",
    "tox-uv>=1.11.3",
    
    "mypy>=0.991",
    
    "ruff>=0.11.5",
    
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["project_alpha"]

[tool.mypy]
files = ["project_alpha"]
disallow_untyped_defs = true
disallow_any_unimported = true
no_implicit_optional = true
check_untyped_defs = true
warn_return_any = true
warn_unused_ignores = true
show_error_codes = true

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
target-version = "py39"
line-length = 120
fix = true

[tool.ruff.lint]
select = [
    # flake8-2020
    "YTT",
    # flake8-bandit
    "S",
    # flake8-bugbear
    "B",
    # flake8-builtins
    "A",
    # flake8-comprehensions
    "C4",
    # flake8-debugger
    "T10",
    # flake8-simplify
    "SIM",
    # isort
    "I",
    # mccabe
    "C90",
    # pycodestyle
    "E", "W",
    # pyflakes
    "F",
    # pygrep-hooks
    "PGH",
    # pyupgrade
    "UP",
    # ruff
    "RUF",
    # tryceratops
    "TRY",
]
ignore = [
    # LineTooLong
    "E501",
    # DoNotAssignLambda
    "E731",
]

[tool.pyrefly]
project-includes = ["project_alpha"]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101"]

[tool.ruff.format]
preview = true
```

### test_api.py

```text
#!/usr/bin/env python3
"""
Test script to verify the API endpoints for the vehicle tracking application
Updated for FastAPI backend
"""
import asyncio
import json
from http import HTTPStatus

import httpx


async def test_api_endpoints():
    """Test all API endpoints"""
    base_url = "http://localhost:5001"  # Changed from 5001 to 8000 (FastAPI default)
    
    print("Testing FastAPI endpoints...\n")
    
    # Test /api/stats endpoint
    print("1. Testing /api/stats endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/stats")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=4)}")
                if data.get('success'):
                    stats = data.get('stats', {})
                    print(f"   Active vehicles: {stats.get('active_vehicles', 'N/A')}")
                    print(f"   Total routes: {stats.get('total_routes', 'N/A')}")
                    print(f"   Total vehicles: {stats.get('total_vehicles', 'N/A')}")
                else:
                    print(f"   API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print()
    
    # Test /api/vehicles/current endpoint
    print("2. Testing /api/vehicles/current endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/vehicles/current")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    vehicles = data.get('vehicles', [])
                    count = data.get('count', 0)
                    print(f"   Number of vehicles returned: {count}")
                    print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
                    if vehicles:
                        print(f"   Sample vehicle: {json.dumps(vehicles[0], indent=4)}")
                else:
                    print(f"   API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print()
    
    # Test /api/vehicles endpoint (with pagination)
    print("3. Testing /api/vehicles endpoint (with pagination)...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/vehicles", params={"limit": 5})
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    vehicles = data.get('vehicles', [])
                    count = data.get('count', 0)
                    print(f"   Number of vehicles returned: {count}")
                    if vehicles:
                        print(f"   Sample vehicle: {json.dumps(vehicles[0], indent=4)}")
                else:
                    print(f"   API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print()
    
    # Test /api/routes endpoint
    print("4. Testing /api/routes endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/routes")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    routes = data.get('routes', [])
                    print(f"   Number of routes returned: {len(routes)}")
                    if routes:
                        print(f"   Sample route: {json.dumps(routes[0], indent=4)}")
                else:
                    print(f"   API returned success: false")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
            else:
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print()
    
    # Test /health endpoint
    print("5. Testing /health endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=4)}")
            else:
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print()
    
    # Test vehicle history endpoint (if vehicles exist)
    print("6. Testing vehicle history endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            # First get a vehicle ID to test with
            vehicles_response = await client.get(f"{base_url}/api/vehicles/current")
            if vehicles_response.status_code == 200:
                vehicles_data = vehicles_response.json()
                if vehicles_data.get('success') and vehicles_data.get('vehicles'):
                    vehicle_id = vehicles_data['vehicles'][0]['vehicle_id']
                    print(f"   Testing history for vehicle: {vehicle_id}")
                    
                    history_response = await client.get(f"{base_url}/api/vehicles/{vehicle_id}/history")
                    print(f"   Status: {history_response.status_code}")
                    if history_response.status_code == 200:
                        history_data = history_response.json()
                        if history_data.get('success'):
                            history = history_data.get('history', [])
                            print(f"   History entries returned: {len(history)}")
                            if history:
                                print(f"   Sample history entry: {json.dumps(history[0], indent=4)}")
                        else:
                            print(f"   API returned success: false")
                            print(f"   Error: {history_data.get('error', 'Unknown error')}")
                    else:
                        print(f"   Error: {history_response.text}")
                else:
                    print("   No vehicles available to test history endpoint")
            else:
                print("   Could not fetch vehicles to test history endpoint")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print()
    
    # Test routes vehicles endpoint (if routes exist)
    print("7. Testing route vehicles endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            # First get a route ID to test with
            routes_response = await client.get(f"{base_url}/api/routes")
            if routes_response.status_code == 200:
                routes_data = routes_response.json()
                if routes_data.get('success') and routes_data.get('routes'):
                    route_id = routes_data['routes'][0]['id']
                    print(f"   Testing vehicles for route: {route_id}")
                    
                    route_vehicles_response = await client.get(f"{base_url}/api/routes/{route_id}/vehicles")
                    print(f"   Status: {route_vehicles_response.status_code}")
                    if route_vehicles_response.status_code == 200:
                        route_vehicles_data = route_vehicles_response.json()
                        if route_vehicles_data.get('success'):
                            vehicles = route_vehicles_data.get('vehicles', [])
                            count = route_vehicles_data.get('count', 0)
                            print(f"   Vehicles on route: {count}")
                            if vehicles:
                                print(f"   Sample vehicle on route: {json.dumps(vehicles[0], indent=4)}")
                        else:
                            print(f"   API returned success: false")
                            print(f"   Error: {route_vehicles_data.get('error', 'Unknown error')}")
                    elif route_vehicles_response.status_code == 404:
                        print(f"   Route not found (this is expected if no vehicles are on this route)")
                    else:
                        print(f"   Error: {route_vehicles_response.text}")
                else:
                    print("   No routes available to test route vehicles endpoint")
            else:
                print("   Could not fetch routes to test route vehicles endpoint")
    except Exception as e:
        print(f"   Error: {str(e)}")


if __name__ == "__main__":
    print("FastAPI Endpoint Testing Script")
    print("===============================")
    asyncio.run(test_api_endpoints())
    print("\nTest completed.")
```

### tests/test_foo.py

```text
from project_alpha.foo import foo


def test_foo():
    assert foo("foo") == "foo"
```

### tests/test_server.py

```text

import requests
import time

def test_api_server():
    base_url = "http://localhost:5000"
    
    try:
        # Test health check
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        
        # Test root endpoint
        response = requests.get(f"{base_url}/")
        print(f"Root endpoint: {response.status_code} - {response.json()}")
        
        # Test vehicles endpoint
        response = requests.get(f"{base_url}/api/vehicles")
        print(f"Vehicles endpoint: {response.status_code}")
        
        # Test routes endpoint
        response = requests.get(f"{base_url}/api/routes")
        print(f"Routes endpoint: {response.status_code}")
        
        print("✅ All basic endpoint tests passed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    test_api_server()
```


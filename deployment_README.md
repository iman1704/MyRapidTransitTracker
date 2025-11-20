# GTFS Realtime Application - Docker Swarm Deployment Guide

This document provides a complete guide to deploying, managing, and monitoring the GTFS Realtime application on a Docker Swarm cluster provisioned on AWS using CloudFormation.

The infrastructure consists of a cost-optimized Docker Swarm cluster with one manager and two worker nodes, all running on ARM-based (`t4g`) EC2 instances. Stateful services like PostgreSQL, Kafka, and Redis are pinned to the manager node, which has dedicated EBS volumes for persistent storage.

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Deployment Steps](#2-deployment-steps)
    - [Phase 1: Provision the AWS Infrastructure](#phase-1-provision-the-aws-infrastructure)
    - [Phase 2: Build and Push Application Images](#phase-2-build-and-push-application-images)
    - [Phase 3: Configure the Application](#phase-3-configure-the-application)
    - [Phase 4: Deploy the Docker Stack](#phase-4-deploy-the-docker-stack)
    - [Alternative: Using Docker Secrets (Production Best Practice)](#alternative-using-docker-secrets-production-best-practice)
3. [Monitoring and Management](#3-monitoring-and-management)
    - [Cluster Health](#cluster-health)
    - [Service Status & Logs](#service-status--logs)
    - [Real-time Resource Monitoring](#real-time-resource-monitoring)
    - [Advanced Debugging Workflow](#advanced-debugging-workflow)
    - [Optional: Visual Monitoring (Swarmpit)](#optional-visual-monitoring-swarmpit)
    - [Applying Updates & Scaling](#applying-updates--scaling)
4. [Stopping and Deleting the Cluster](#4-stopping-and-deleting-the-cluster)

---

## 1. Prerequisites

Before you begin, ensure you have the following:

- **AWS Account & CLI:** An AWS account and the [AWS CLI installed and configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) on your local machine.
- **EC2 Key Pair:** An existing EC2 Key Pair in your desired AWS region. You will need its name and the corresponding `.pem` file.
- **Docker & Docker Buildx:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with the `buildx` plugin installed locally.
- **Docker Hub Account:** A Docker Hub account (or another container registry) to store your application images.

---

## 2. Deployment Steps

Follow these phases in order to deploy the application from scratch.

### Phase 1: Provision the AWS Infrastructure

We use the provided `cloudformation.yml` template to create the VPC, EC2 instances, EBS volumes, and security groups.

1.  **Deploy the CloudFormation Stack:**
    Open your terminal and run the following command. **Replace the placeholder values:**
    - `my-gtfs-swarm`: Choose a unique name for your stack.
    - `YourKeyPairName`: The name of your EC2 Key Pair.
    - `1.2.3.4/32`: **Crucially, replace this with your public IP address** to secure SSH access. You can find your IP by searching "what is my IP".
```bash
    aws cloudformation deploy \
      --template-file cloudformation.yml \
      --stack-name my-gtfs-swarm \
      --capabilities CAPABILITY_IAM \
      --parameter-overrides \
        KeyName=YourKeyPairName \
        AllowSSHFrom=1.2.3.4/32
```

2.  **Wait for Creation:** The process takes about 5-10 minutes. You can monitor the progress in the AWS CloudFormation console.

3.  **Get the Manager's Public IP:** This IP is the main entry point for managing the cluster.
```bash
    aws cloudformation describe-stacks \
      --stack-name my-gtfs-swarm \
      --query "Stacks[0].Outputs[?OutputKey=='ManagerPublicIP'].OutputValue" \
      --output text
```
    Keep this IP address handy for the next steps.

### Phase 2: Build and Push Application Images

The Swarm nodes will pull your application images from a registry. They must be built for the `linux/arm64` architecture to run on the `t4g` instances.

1.  **Log in to Docker Hub:**
```bash
    docker login
```

2.  **Build and Push Images:**
    Run these commands from the project root. **Replace `your-username` with your Docker Hub username.**
```bash
    # Build and push the Data Ingestion service
    docker buildx build --platform linux/arm64 -t your-username/gtfs-ingestion:latest -f Dockerfile.ingestion --push .

    # Build and push the Raw Consumer service
    docker buildx build --platform linux/arm64 -t your-username/gtfs-consumer:latest -f Dockerfile.consumer --push .

    # Build and push the Database Writer service
    docker buildx build --platform linux/arm64 -t your-username/gtfs-writer:latest -f Dockerfile.writer --push .

    # Build and push the Web Application (Endpoint) service
    docker buildx build --platform linux/arm64 -t your-username/gtfs-endpoint:latest -f MyRapidTransitTracker/Dockerfile.viz --push .
```

### Phase 3: Configure the Application

1.  **Update `docker-compose.yml`:** Ensure the `image:` value for the four application services (`data-ingestion`, `raw-consumer`, `database-writer`, `web-app`) matches the images you just pushed (e.g., `image: your-username/gtfs-ingestion:latest`).

2.  **Create an Environment File:** Create a file named `.env` and populate it with your secrets. **Do not commit this file to Git.**
```ini
    # .env

    # PostgreSQL Credentials
    DB_NAME=gtfs_realtime
    DB_USER=gtfs_user
    DB_PASSWORD=your_super_secret_and_strong_password

    # Kafka Topics
    KAFKA_INPUT_TOPIC=gtfs-realtime-raw
    KAFKA_OUTPUT_TOPIC=gtfs-realtime-parsed

    # GTFS API Credentials (VERY IMPORTANT)
    GTFS_API_URL=https://api.your-gtfs-provider.com/v1/realtime
    GTFS_API_KEY=your_actual_api_key
    
    # Frontend Configuration
    NEXT_PUBLIC_API_BASE_URL=http://<ManagerPublicIP>/api
```
    
    **Important:** Replace `<ManagerPublicIP>` with the actual public IP address of your manager node (from Phase 1, step 3). For example: `NEXT_PUBLIC_API_BASE_URL=http://54.123.45.67/api`

3.  **Pre-process the Compose File (Required for Docker Swarm):**
    Docker Swarm does **not** automatically read `.env` files like `docker-compose up` does. You must manually inject the environment variables before deployment.
    
    On your local machine, run:
```bash
    # Load environment variables and generate a processed compose file
    export $(grep -v '^#' /path/to/custom.env | xargs)
    docker-compose -f /path/to/custom-compose.yml config > docker-stack.yml

    # Fix the autogenerated file
    # Remove autogenerated "" around ports integers
    sed -i '' 's/published: "\([0-9]*\)"/published: \1/g' docker-stack.yml
    # Remove 'name:' parameter at top of file
    sed -i '' '/^name:/d' docker-stack.yml
```
    
    This creates a `docker-stack.yml` file with all variables substituted. **Verify it contains the actual values** (not `${VARIABLE}` placeholders) by opening the file and checking that environment variables are resolved.

### Phase 4: Deploy the Docker Stack

1.  **Transfer Files to the Manager:**
    Use `scp` to copy your **processed** configuration to the Swarm manager. Replace placeholders with your `.pem` file path and the manager's IP.
```bash
    scp -i /path/to/YourKeyPair.pem docker-stack.yml ec2-user@<ManagerPublicIP>:~/
```
    
    **Note:** We're transferring `docker-stack.yml` (the processed file), not `docker-compose.yml` or `.env`.

2.  **SSH into the Manager and Deploy:**
```bash
    # Connect to the manager
    ssh -i /path/to/YourKeyPair.pem ec2-user@<ManagerPublicIP>

    # Check whether the config is used by the docker stack
    docker stack config -c docker-stack.yml gtfs-app

    # If it is not loaded properly
    # Transfer the .env file from your local machine
    # Then run this command
    export $(grep -v '^#' .env | xargs)
    
    # Deploy the stack using the processed compose file
    docker stack deploy -c docker-stack.yml gtfs-app
```

3.  **Access Your Application:**
    After a few minutes, once all services are running, access the web application in your browser:
    `http://<ManagerPublicIP>:8080`

---

### Alternative: Using Docker Secrets (Production Best Practice)

For production environments, consider using Docker secrets instead of environment variables for sensitive data. This provides better security as secrets are encrypted at rest and in transit within the Swarm cluster.

1.  **Create secrets on the manager node:**
```bash
    # SSH into the manager first
    ssh -i /path/to/YourKeyPair.pem ec2-user@<ManagerPublicIP>
    
    # Create secrets from stdin
    echo "your_super_secret_password" | docker secret create db_password -
    echo "your_actual_api_key" | docker secret create gtfs_api_key -
    echo "gtfs_user" | docker secret create db_user -
```

2.  **Modify `docker-compose.yml` to use secrets:**
```yaml
    services:
      data-ingestion:
        # ... other config ...
        secrets:
          - gtfs_api_key
        environment:
          GTFS_API_KEY_FILE: /run/secrets/gtfs_api_key
          # Or if your app can't read files, use a wrapper script
      
      database-writer:
        # ... other config ...
        secrets:
          - db_password
          - db_user
        environment:
          DB_PASSWORD_FILE: /run/secrets/db_password
          DB_USER_FILE: /run/secrets/db_user
      
      postgres:
        # ... other config ...
        secrets:
          - db_password
        environment:
          POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    
    secrets:
      db_password:
        external: true
      db_user:
        external: true
      gtfs_api_key:
        external: true
```

3.  **Update your application code** to read from `/run/secrets/secret_name` files instead of environment variables directly. Most applications will need a small wrapper function:
```python
    # Example Python code
    def get_secret(secret_name, default=None):
        try:
            with open(f'/run/secrets/{secret_name}', 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            return os.getenv(secret_name, default)
    
    # Usage
    db_password = get_secret('db_password')
```

4.  **Deploy with secrets:**
```bash
    # No need to pre-process with docker-compose config
    # Just deploy directly
    docker stack deploy -c docker-compose.yml gtfs-app
```

**Benefits of Docker Secrets:**
- Secrets are encrypted during transit and at rest
- Secrets are only available to services that explicitly request them
- Secrets can be rotated without rebuilding images
- No risk of secrets leaking through environment variable inspection

---

## 3. Monitoring and Management

All management commands should be run from an SSH session on the Swarm manager node.

### Cluster Health
Before checking services, ensure your infrastructure nodes are healthy.
```bash
docker node ls
```
- **Status:** Should be `Ready`.
- **Availability:** Should be `Active`.
- **Manager Status:** One node should show `Leader`.

### Service Status & Logs
To check if services are running:
```bash
docker stack services gtfs-app
```
- **REPLICAS 1/1:** Service is healthy.
- **REPLICAS 0/1:** Service is failing or starting.

To view logs (vital for debugging application logic or connection errors):
```bash
# View the last 100 lines and follow new logs in real-time
docker service logs -f --tail 100 gtfs-app_web-app

# View timestamps with logs (helpful for correlating events)
docker service logs -t gtfs-app_database-writer
```

### Real-time Resource Monitoring
To see CPU and RAM usage for containers running on the current node (the Manager):
```bash
docker stats
```
*Note: To see stats for containers on worker nodes, you must SSH into the specific worker node IP.*

### Advanced Debugging Workflow

If a service refuses to start (stuck at `0/1` replicas) or behaves unexpectedly, follow this workflow:

1.  **Identify the Error:**
    List the tasks associated with the service to see the exit state and error message.
```bash
    docker service ps --no-trunc gtfs-app_kafka
```
    Look at the `ERROR` and `CURRENT STATE` columns. Common errors include:
    - `no such image`: The image name is wrong or the node can't reach Docker Hub.
    - `task: non-zero exit (1)` or `(137)`: The application crashed. Code 137 usually means Out Of Memory (OOM).

2.  **Inspect the Task:**
    If `service ps` isn't detailed enough, find the container ID and inspect it:
```bash
    # Get the ID of the container on the local node
    docker ps -a | grep gtfs-app_kafka
    
    # Inspect it for specific exit codes or config issues
    docker inspect <container-id>
```

3.  **Interactive Debugging (Shell Access):**
    To test network connectivity (e.g., "Can the web-app reach Postgres?"), you can execute a shell inside a **running** container.
```bash
    # Find the container ID
    docker ps | grep gtfs-app_web-app
    
    # Open a shell inside the container
    docker exec -it <container-id> /bin/sh
    
    # Inside the container, try to reach other services
    # (e.g., testing if the internal DNS 'db' resolves)
    ping db
    nc -zv kafka 9092
```

### Optional: Visual Monitoring (Swarmpit)
For a user-friendly, web-based dashboard to view logs, resource usage, and restart services, you can deploy Swarmpit.

1.  **Deploy Swarmpit:**
```bash
    docker run -it --rm \
      --name swarmpit-installer \
      --volume /var/run/docker.sock:/var/run/docker.sock \
      swarmpit/install:1.9
```
2.  Follow the interactive prompts (accept defaults).
3.  Access the dashboard at `http://<ManagerPublicIP>:888` (ensure port 888 is open in your Security Group if accessing externally, or use SSH tunneling).

### Applying Updates & Scaling
To update configuration or scale services:

1.  **Updates:** 
    - Edit `docker-compose.yml` or `.env` locally
    - **Regenerate the processed file:**
```bash
      export $(grep -v '^#' .env | xargs)
      docker-compose config > docker-stack.yml
```
    - Verify the variables are substituted correctly in `docker-stack.yml`
    - Transfer `docker-stack.yml` to the manager:
```bash
      scp -i /path/to/YourKeyPair.pem docker-stack.yml ec2-user@<ManagerPublicIP>:~/
```
    - SSH into the manager and re-deploy:
```bash
      docker stack deploy -c docker-stack.yml gtfs-app
```
    Docker Swarm performs a rolling update with zero downtime.
    
    **Note:** If you're using Docker secrets (see Alternative section above), you can skip the pre-processing step and deploy `docker-compose.yml` directly.

2.  **Scaling:** To run 3 instances of the consumer service, for example:
```bash
    docker service scale gtfs-app_raw-consumer=3
```
    *Note: Only scale stateless services (consumer, ingestion, web-app). Do not scale Postgres, Redis, or Kafka unless you have configured them for clustering.*

---

## 4. Stopping and Deleting the Cluster

### Option A: Stop the Application Only (Infrastructure Remains)
This removes all running services but keeps the EC2 instances and EBS volumes. **You will continue to be charged for these AWS resources.**

1.  **SSH into the Swarm manager.**
2.  Run the stack removal command:
```bash
    docker stack rm gtfs-app
```

Additionally you can clear up any data left by the docker stack to start with a clean slate. While still in SSH with the manager node:

1. Remove docker volumes:
```bash
    # List docker volumes
    docker volume ls

    # Remove each volume
    # Repeat this with each service
    docker volume rm <stack_name>_<service_name>
```
2. Delete the directory:
```bash
    # Delete the folder entirely
    sudo rm -rf /data/zookeeper/data/*
    sudo rm -rf /data/zookeeper/log/*
    sudo rm -rf /data/kafka/data/logs/*
    sudo rm -rf /data/postgres/data/*
    sudo rm -rf /data/redis/data/*

    # Verify it is empty
    ls -la /data/<volume_name>/data
```
    These are the volume names:
        - zookeeper
        - postgres
        - redis
        - zookeeper/log
        - kafka


### Option B: Destroy All Infrastructure (Complete Teardown)
This is a **destructive action** that will permanently delete all EC2 instances, EBS volumes, and networking components. **All data on the volumes will be lost.**

1.  **On your local machine**, run the following AWS CLI command:
```bash
    aws cloudformation delete-stack --stack-name my-gtfs-swarm
```
2.  Monitor the deletion progress in the AWS CloudFormation console. Once complete, all associated costs will stop.

---

## Troubleshooting Common Issues

### Issue: Frontend can't connect to backend API
- **Symptom:** Web app loads but shows "Failed to fetch" or connection errors
- **Solution:** Verify `NEXT_PUBLIC_API_BASE_URL` in your `.env` file uses the correct manager public IP and includes `/api` at the end
- **Check:** Regenerate `docker-stack.yml` after updating `.env` and redeploy

### Issue: Services show 0/1 replicas
- **Symptom:** Services fail to start after deployment
- **Solution:** Check logs with `docker service logs gtfs-app_<service-name>` and verify:
  - Image names are correct and accessible from Docker Hub
  - Environment variables are properly substituted in `docker-stack.yml`
  - Required secrets exist (if using Docker secrets)

### Issue: Variables showing as ${VARIABLE} in running containers
- **Symptom:** Application errors because it's reading literal `${DB_PASSWORD}` instead of the actual value
- **Solution:** This means `.env` wasn't processed. Always use `docker-compose config > docker-stack.yml` to pre-process the file before deployment

### Issue: "Permission denied" when accessing secrets
- **Symptom:** Application crashes with `/run/secrets/secret_name: Permission denied`
- **Solution:** Verify the secret exists with `docker secret ls` and that it's declared in the compose file under both the service and the top-level `secrets:` section

# Deployment Guide - AI Forecasting Platform

## Quick Start (Local Development)

### 1. Set Up Python Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required configuration:
- Database credentials
- AWS credentials (for production)
- SECRET_KEY (generate with: `openssl rand -hex 32`)

### 3. Set Up Database

```bash
# Install PostgreSQL if not already installed
# On Ubuntu:
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE ai_forecast;
CREATE USER ai_forecast_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_forecast TO ai_forecast_user;
\q

# Run migrations
alembic upgrade head
```

### 4. Start Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. Access API

- API Documentation: http://localhost:8000/docs
- OpenAPI Schema: http://localhost:8000/openapi.json
- Health Check: http://localhost:8000/health

### 6. Set Up Frontend

```bash
cd ..
# Frontend files are already in modules/ai-forecast/

# If using a web server (nginx, Apache), point document root to project root
# Or use Python's simple HTTP server for testing:
python3 -m http.server 8080

# Access at:
# - Full Platform: http://localhost:8080/ai-forecast.html
# - Integrated CF: Add cashflow-integration.js to your CF page
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
cd backend

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Docker Build

```bash
# Build production image
docker build -t ai-forecast-api:latest .

# Run container
docker run -d \
  --name ai-forecast-api \
  -p 8000:8000 \
  --env-file .env \
  ai-forecast-api:latest
```

## AWS Deployment

### Prerequisites

1. AWS Account: 127679825789
2. AWS CLI installed and configured
3. ECR repository created
4. RDS PostgreSQL instance
5. S3 bucket for model storage

### 1. Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  127679825789.dkr.ecr.eu-central-1.amazonaws.com

# Build and tag
docker build -t ai-forecast-api .
docker tag ai-forecast-api:latest \
  127679825789.dkr.ecr.eu-central-1.amazonaws.com/ai-forecast-api:latest

# Push to ECR
docker push 127679825789.dkr.ecr.eu-central-1.amazonaws.com/ai-forecast-api:latest
```

### 2. Set Up RDS

```bash
# Create RDS PostgreSQL instance via AWS Console or CLI:
aws rds create-db-instance \
  --db-instance-identifier ai-forecast-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password <your-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <your-sg-id> \
  --publicly-accessible

# Note the endpoint URL for .env configuration
```

### 3. Create S3 Bucket

```bash
aws s3 mb s3://ch-ai-forecast-models --region eu-central-1

# Configure bucket policy for model storage
```

### 4. Deploy to ECS

Create ECS task definition (task-definition.json):

```json
{
  "family": "ai-forecast-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "127679825789.dkr.ecr.eu-central-1.amazonaws.com/ai-forecast-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "DB_HOST", "value": "your-rds-endpoint"},
        {"name": "AWS_S3_BUCKET", "value": "ch-ai-forecast-models"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        },
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-forecast-api",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Deploy:

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create or update service
aws ecs create-service \
  --cluster your-cluster \
  --service-name ai-forecast-api \
  --task-definition ai-forecast-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### 5. Set Up Load Balancer

Create Application Load Balancer in AWS Console:
1. Target Group pointing to ECS service port 8000
2. Health check path: `/health`
3. SSL certificate for HTTPS

Update frontend API URL:
```javascript
apiBaseUrl: 'https://api.your-domain.com/api/v1'
```

## Database Migrations

### Create New Migration

```bash
# After modifying models in app/models/
alembic revision --autogenerate -m "Description of changes"

# Review generated migration in alembic/versions/
nano alembic/versions/xxx_description.py

# Apply migration
alembic upgrade head
```

### Rollback Migration

```bash
# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>

# View migration history
alembic history
```

## Monitoring

### Application Logs

```bash
# Docker Compose
docker-compose logs -f api

# ECS
aws logs tail /ecs/ai-forecast-api --follow
```

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Database Connection

```bash
# Check database connection
python3 << EOF
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("Database connected:", result.fetchone())

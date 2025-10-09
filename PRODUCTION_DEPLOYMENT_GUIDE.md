# 🚀 AI Forecasting Platform - Production Deployment Status

**Date:** October 9, 2025
**Status:** Infrastructure Ready - Final Configuration Needed

---

## ✅ Infrastructure Deployed

### 1. RDS PostgreSQL Database
- **Instance**: `ai-forecast-production`
- **Endpoint**: `ai-forecast-production.cifgmm0mqg5q.us-east-1.rds.amazonaws.com`
- **Port**: 5432
- **Database**: `ai_forecast`
- **Username**: `aiforecast`
- **Password**: `AIForecast2024!SecureDB#`
- **Status**: ✅ **Available**
- **Type**: PostgreSQL 15.12 on db.t3.micro
- **Storage**: 20GB encrypted
- **Backups**: 7-day retention

### 2. EC2 API Server
- **Instance ID**: `i-01eefcc60e5e84766`
- **Public IP**: **54.172.17.102**
- **Public DNS**: `ec2-54-172-17-102.compute-1.amazonaws.com`
- **Type**: t3.small (2 vCPU, 2GB RAM, 20GB SSD)
- **Status**: ✅ **Running**
- **Setup**: ✅ **Complete** (dependencies installed)

### 3. Security Configuration
- **API Security Group**: `sg-02e8a8c3ee73bb69f`
  - Port 22 (SSH) - Open
  - Port 8000 (API) - Open
  - Port 443 (HTTPS) - Open
- **Database Access**: Configured from API server
- **Secrets**: Stored in AWS Secrets Manager

---

## 🔧 Final Configuration Steps

SSH to the EC2 instance and run these commands:

### Step 1: SSH to Instance

```bash
# If you have the key locally
ssh -i ~/.ssh/ava-bastion-key-new.pem ubuntu@54.172.17.102

# Or via bastion host
ssh -J ubuntu@44.207.131.14 ubuntu@172.31.43.182
```

### Step 2: Create Production .env File

```bash
cd /opt/ai-forecast/backend

sudo tee .env << 'EOF'
# AI Forecasting Platform - Production Configuration
APP_NAME=AI Forecasting Platform
APP_VERSION=1.0.0
ENVIRONMENT=production

# Database Configuration - Production RDS
DB_HOST=ai-forecast-production.cifgmm0mqg5q.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=ai_forecast
DB_USER=aiforecast
DB_PASSWORD=AIForecast2024!SecureDB#

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Security
SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=http://localhost:3000,http://54.172.17.102:8000,http://ec2-54-172-17-102.compute-1.amazonaws.com:8000,https://*.amazonaws.com

# ML Configuration
MODEL_TRAINING_TIMEOUT_SECONDS=300
PREDICTION_BATCH_SIZE=1000
MIN_TRAINING_SAMPLES=50
MIN_TIMESERIES_DAYS=60

# Monitoring
LOG_LEVEL=INFO

# API Configuration
API_V1_PREFIX=/api/v1
DOCS_URL=/docs
OPENAPI_URL=/openapi.json
EOF

# Set permissions
sudo chmod 600 .env
sudo chown ubuntu:ubuntu .env
```

### Step 3: Run Database Migrations

```bash
cd /opt/ai-forecast/backend
source venv/bin/activate
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> [revision_id], Initial schema
```

### Step 4: Start the Backend Service

```bash
sudo systemctl enable ai-forecast-api
sudo systemctl start ai-forecast-api
sudo systemctl status ai-forecast-api
```

Expected output:
```
● ai-forecast-api.service - AI Forecasting Platform API
     Loaded: loaded
     Active: active (running)
```

### Step 5: Test the API

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected: {"status":"healthy","version":"1.0.0"}

# Test API docs (from your browser)
# Visit: http://54.172.17.102:8000/docs
```

---

## 📊 API Endpoints

Once running, the API will be available at:

**Base URL**: `http://54.172.17.102:8000`

### Documentation
- OpenAPI Docs: http://54.172.17.102:8000/docs
- ReDoc: http://54.172.17.102:8000/redoc
- OpenAPI JSON: http://54.172.17.102:8000/openapi.json

### Health Check
- GET http://54.172.17.102:8000/health

### Data Management
- POST http://54.172.17.102:8000/api/v1/data/upload/customers
- POST http://54.172.17.102:8000/api/v1/data/upload/invoices
- POST http://54.172.17.102:8000/api/v1/data/upload/payments
- GET http://54.172.17.102:8000/api/v1/data/stats

### Model Training
- POST http://54.172.17.102:8000/api/v1/models/train?model_type=payment_predictor
- POST http://54.172.17.102:8000/api/v1/models/train?model_type=cashflow_forecaster
- GET http://54.172.17.102:8000/api/v1/models/models

### Predictions
- POST http://54.172.17.102:8000/api/v1/predictions/invoice/{id}
- POST http://54.172.17.102:8000/api/v1/predictions/batch
- GET http://54.172.17.102:8000/api/v1/predictions/cashflow
- GET http://54.172.17.102:8000/api/v1/predictions/timeseries
- GET http://54.172.17.102:8000/api/v1/predictions/high-risk

---

## 🌐 Frontend Deployment

### Option 1: S3 Static Website

```bash
# Create S3 bucket
aws s3 mb s3://ai-forecast-frontend-prod

# Configure for static website
aws s3 website s3://ai-forecast-frontend-prod \
  --index-document ai-forecast.html

# Update frontend API URL
cd /mnt/c/Users/HP/Ch
sed -i "s|http://localhost:8000|http://54.172.17.102:8000|g" modules/ai-forecast/*.js

# Upload frontend files
aws s3 sync . s3://ai-forecast-frontend-prod \
  --exclude "*" \
  --include "ai-forecast.html" \
  --include "modules/ai-forecast/*" \
  --acl public-read

# Get website URL
echo "Frontend URL: http://ai-forecast-frontend-prod.s3-website-us-east-1.amazonaws.com"
```

### Option 2: Serve from EC2 (Nginx)

```bash
# SSH to EC2 instance
ssh -i ~/.ssh/ava-bastion-key-new.pem ubuntu@54.172.17.102

# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/ai-forecast << 'EOFNGINX'
server {
    listen 80;
    server_name 54.172.17.102 ec2-54-172-17-102.compute-1.amazonaws.com;

    # Frontend files
    location / {
        root /opt/ai-forecast;
        index ai-forecast.html;
        try_files $uri $uri/ =404;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API docs
    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }
}
EOFNGINX

# Enable site
sudo ln -s /etc/nginx/sites-available/ai-forecast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Frontend now available at: http://54.172.17.102
```

---

## 🧪 Testing Workflow

### 1. Test Backend is Running

```bash
curl http://54.172.17.102:8000/health
```

Expected:
```json
{"status":"healthy","version":"1.0.0"}
```

### 2. Upload Sample Data

Create sample CSV files:

**customers.csv**:
```csv
customer_code,name,segment,risk_score
CUST001,Test Customer A,A,0.2
CUST002,Test Customer B,B,0.5
```

**invoices.csv**:
```csv
customer_code,invoice_number,invoice_date,due_date,amount,currency,status
CUST001,INV001,2024-01-15,2024-02-15,10000,EUR,paid
CUST001,INV002,2024-02-20,2024-03-20,15000,EUR,pending
```

**payments.csv**:
```csv
invoice_number,payment_date,amount
INV001,2024-02-10,10000
```

Upload via API:
```bash
# Upload customers
curl -X POST http://54.172.17.102:8000/api/v1/data/upload/customers \
  -F "file=@customers.csv"

# Upload invoices
curl -X POST http://54.172.17.102:8000/api/v1/data/upload/invoices \
  -F "file=@invoices.csv"

# Upload payments
curl -X POST http://54.172.17.102:8000/api/v1/data/upload/payments \
  -F "file=@payments.csv"
```

### 3. Check Data Statistics

```bash
curl http://54.172.17.102:8000/api/v1/data/stats
```

### 4. Train Models (After Uploading Enough Data)

```bash
# Train payment predictor (needs 50+ paid invoices)
curl -X POST http://54.172.17.102:8000/api/v1/models/train?model_type=payment_predictor

# Train cash flow forecaster (needs 60+ days of payments)
curl -X POST http://54.172.17.102:8000/api/v1/models/train?model_type=cashflow_forecaster
```

### 5. Get Predictions

```bash
# Get cash flow forecast
curl http://54.172.17.102:8000/api/v1/predictions/cashflow?scenario=realistic&granularity=week
```

---

## 🔒 Security Checklist

- [x] RDS in private subnet (not publicly accessible)
- [x] Database credentials in Secrets Manager
- [x] Security groups properly configured
- [x] Encrypted RDS storage
- [ ] Update SECRET_KEY in .env (currently using default)
- [ ] Consider restricting CORS_ORIGINS to specific domains
- [ ] Set up HTTPS with SSL certificate (Let's Encrypt)
- [ ] Configure AWS WAF for API protection
- [ ] Enable CloudWatch monitoring and alarms
- [ ] Set up backup notifications

---

## 📈 Monitoring

### CloudWatch Logs

```bash
# View application logs
sudo journalctl -u ai-forecast-api -f

# View Nginx logs (if using)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### RDS Monitoring

```bash
# Check RDS metrics
aws rds describe-db-instances \
  --db-instance-identifier ai-forecast-production \
  --query 'DBInstances[0].[DBInstanceStatus,AllocatedStorage,DBInstanceClass]'
```

---

## 💰 Cost Estimate

**Monthly AWS Costs:**
- RDS db.t3.micro: ~$15
- EC2 t3.small: ~$15
- Data transfer: ~$5
- S3 storage: ~$1
- **Total: ~$36/month**

---

## 🆘 Troubleshooting

### API Won't Start

```bash
# Check logs
sudo journalctl -u ai-forecast-api -n 50

# Common issues:
# 1. Database connection - check .env DB_HOST/PASSWORD
# 2. Port in use - check if another service is on 8000
# 3. Permissions - ensure ubuntu user owns /opt/ai-forecast
```

### Can't Connect to Database

```bash
# Test database connection
psql -h ai-forecast-production.cifgmm0mqg5q.us-east-1.rds.amazonaws.com \
  -U aiforecast \
  -d ai_forecast

# If fails, check:
# 1. Security group allows traffic from EC2
# 2. RDS is in same VPC
# 3. Password is correct
```

### Frontend Can't Connect to API

- Check CORS settings in backend .env
- Verify API is running: `curl http://localhost:8000/health`
- Check browser console for CORS errors
- Update frontend apiBaseUrl to use public IP

---

## 📝 Next Steps

1. **SSH to EC2 and complete configuration** (Steps 2-4 above)
2. **Test API endpoints** with sample data
3. **Deploy frontend** (Option 1 or 2)
4. **Upload production data** (2-3 years historical)
5. **Train models** with production data
6. **Set up HTTPS** with SSL certificate
7. **Configure monitoring** and alerts
8. **Create backup schedule**

---

## 📞 Quick Reference

**RDS Endpoint**: `ai-forecast-production.cifgmm0mqg5q.us-east-1.rds.amazonaws.com:5432`
**EC2 Public IP**: `54.172.17.102`
**API Base URL**: `http://54.172.17.102:8000`
**API Docs**: `http://54.172.17.102:8000/docs`
**Database**: `ai_forecast`
**DB User**: `aiforecast`
**DB Password**: `AIForecast2024!SecureDB#` (stored in Secrets Manager)
**Instance ID**: `i-01eefcc60e5e84766`
**Security Group**: `sg-02e8a8c3ee73bb69f`

---

**Status**: ✅ Infrastructure deployed, ready for final configuration
**Time to Production**: ~15 minutes (Steps 2-5 above)

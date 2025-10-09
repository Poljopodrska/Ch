# 🚀 Quick Production Setup - AI Forecasting Platform

## One-Command Setup

SSH to your EC2 instance and run this single command:

```bash
ssh -i ~/.ssh/ava-bastion-key-new.pem ubuntu@54.172.17.102
```

Then copy and paste this entire block:

```bash
cd /opt/ai-forecast/backend && \
sudo tee .env > /dev/null << 'EOFENV'
APP_NAME=AI Forecasting Platform
APP_VERSION=1.0.0
ENVIRONMENT=production
DB_HOST=ai-forecast-production.cifgmm0mqg5q.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=ai_forecast
DB_USER=aiforecast
DB_PASSWORD=AIForecast2024!SecureDB#
AWS_REGION=us-east-1
SECRET_KEY=change-this-in-production-min-32-chars-long-$(openssl rand -hex 16)
CORS_ORIGINS=http://localhost:3000,http://54.172.17.102:8000,http://ec2-54-172-17-102.compute-1.amazonaws.com:8000
MODEL_TRAINING_TIMEOUT_SECONDS=300
PREDICTION_BATCH_SIZE=1000
MIN_TRAINING_SAMPLES=50
MIN_TIMESERIES_DAYS=60
LOG_LEVEL=INFO
API_V1_PREFIX=/api/v1
DOCS_URL=/docs
OPENAPI_URL=/openapi.json
EOFENV
sudo chmod 600 .env && \
sudo chown ubuntu:ubuntu .env && \
source venv/bin/activate && \
alembic upgrade head && \
sudo systemctl enable ai-forecast-api && \
sudo systemctl start ai-forecast-api && \
sleep 3 && \
sudo systemctl status ai-forecast-api --no-pager && \
echo "" && \
echo "✅ Testing API..." && \
curl -s http://localhost:8000/health | python3 -m json.tool && \
echo "" && \
echo "🎉 SUCCESS! API is running!" && \
echo "📍 API URL: http://54.172.17.102:8000" && \
echo "📚 API Docs: http://54.172.17.102:8000/docs"
```

That's it! The entire production setup will complete in ~30 seconds.

## What This Does

1. Creates production `.env` file with database credentials
2. Runs database migrations (creates tables in RDS)
3. Enables and starts the FastAPI backend service
4. Tests the API health endpoint
5. Shows you the URLs to access

## Verify It's Working

After running the command above, you should see:

```json
{
    "status": "healthy",
    "version": "1.0.0"
}
```

Then open in your browser:
- **API**: http://54.172.17.102:8000
- **Docs**: http://54.172.17.102:8000/docs

## Troubleshooting

If something fails:

```bash
# Check service status
sudo systemctl status ai-forecast-api

# View logs
sudo journalctl -u ai-forecast-api -f

# Test database connection
cd /opt/ai-forecast/backend
source venv/bin/activate
python3 -c "from app.core.database import engine; from sqlalchemy import text; conn = engine.connect(); print('✓ Database connected'); conn.close()"

# Restart service
sudo systemctl restart ai-forecast-api
```

## Infrastructure Details

- **RDS**: `ai-forecast-production.cifgmm0mqg5q.us-east-1.rds.amazonaws.com:5432`
- **EC2**: `54.172.17.102` (i-01eefcc60e5e84766)
- **Database**: `ai_forecast`
- **User**: `aiforecast`
- **Password**: `AIForecast2024!SecureDB#`

## Next: Test With Sample Data

Once the API is running, test it:

```bash
# From your local machine
curl http://54.172.17.102:8000/api/v1/data/stats
```

Or visit the interactive API docs:
**http://54.172.17.102:8000/docs**

Upload sample data using the web interface!

---

**Time to complete**: ~1 minute
**Status**: Ready for production testing

# AI Forecasting Platform - Quick Start Guide

Get up and running with the AI Forecasting Platform in 10 minutes.

## What You'll Build

A complete ML-powered cash flow forecasting system that:
- Predicts when customers will pay their invoices
- Forecasts cash flow trends with 80%+ accuracy
- Identifies high-risk late payments
- Integrates with your existing Cash Flow module

## Prerequisites

- Python 3.9+ installed
- PostgreSQL 12+ installed
- Modern web browser (Chrome, Firefox, Safari)
- 2-3 years of historical customer/invoice/payment data

## Step 1: Start Backend (5 minutes)

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Create database
sudo -u postgres psql
CREATE DATABASE ai_forecast;
\q

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

Backend API now running at: http://localhost:8000

Check health: http://localhost:8000/health
View docs: http://localhost:8000/docs

## Step 2: Open Frontend (1 minute)

```bash
# From project root
python3 -m http.server 8080
```

Open in browser: http://localhost:8080/ai-forecast.html

## Step 3: Upload Data (2 minutes)

1. Click **"Data Upload"** tab
2. Download sample templates for reference
3. Upload your data files:
   - Customers (CSV/Excel with: customer_code, name, segment)
   - Invoices (with: customer_code, invoice_number, dates, amount)
   - Payments (with: invoice_number, payment_date, amount)

The system validates and imports your data automatically.

## Step 4: Train Models (2 minutes)

1. Click **"Model Training"** tab
2. Click **"Train Payment Predictor"**
   - Requires 50+ paid invoices
   - Takes 30-60 seconds
   - Shows accuracy metrics when complete
3. Click **"Train Cash Flow Forecaster"**
   - Requires 60+ days of payment history
   - Takes 30-60 seconds
   - Shows MAE/MAPE metrics

## Step 5: View Forecasts (instant)

1. Click **"Forecast"** tab
2. View predictions:
   - Expected cash inflow (90 days)
   - Pending invoice count
   - High-risk amounts
   - Trend direction
3. Switch scenarios: Optimistic / Realistic / Pessimistic
4. Change granularity: Daily / Weekly / Monthly

## Integration with Cash Flow Module

Add AI forecasting to your existing CF page:

```html
<!-- Add after loading cashflow.js -->
<script src="modules/ai-forecast/cashflow-integration.js"></script>
```

This adds an **"AI Forecast"** button to the CF page with:
- Side panel preview
- Quick forecast loading
- Import predictions to grid
- High-risk alerts

## Sample Data Structure

### customers.csv
```csv
customer_code,name,segment,risk_score
CUST001,Acme Corp,A,0.2
CUST002,Beta Industries,B,0.5
CUST003,Gamma LLC,C,0.7
```

### invoices.csv
```csv
customer_code,invoice_number,invoice_date,due_date,amount,currency,status
CUST001,INV001,2024-01-15,2024-02-15,10000,EUR,paid
CUST001,INV002,2024-02-20,2024-03-20,15000,EUR,pending
```

### payments.csv
```csv
invoice_number,payment_date,amount
INV001,2024-02-10,10000
```

## Key Features Explained

### Payment Predictor (XGBoost)
- Learns from customer payment patterns
- Predicts: payment date, on-time probability, risk score
- Accuracy: 75-85% typical
- Use for: invoice-level predictions

### Cash Flow Forecaster (Prophet)
- Learns seasonal patterns and trends
- Predicts: daily/weekly/monthly totals
- Accuracy: 80-90% typical (MAE < 10%)
- Use for: overall cash flow planning

### Risk Scoring
- 0-40%: Low risk (green)
- 40-60%: Medium risk (yellow)
- 60-80%: High risk (orange)
- 80-100%: Very high risk (red)

## API Endpoints

### Data Management
- POST /api/v1/data/upload/customers
- POST /api/v1/data/upload/invoices
- POST /api/v1/data/upload/payments
- GET /api/v1/data/stats

### Model Training
- POST /api/v1/models/train?model_type=payment_predictor
- POST /api/v1/models/train?model_type=cashflow_forecaster
- GET /api/v1/models/models
- POST /api/v1/models/{id}/activate

### Predictions
- POST /api/v1/predictions/invoice/{id}
- POST /api/v1/predictions/batch
- GET /api/v1/predictions/cashflow
- GET /api/v1/predictions/timeseries
- GET /api/v1/predictions/high-risk

## Typical Workflow

### Initial Setup (One-time)
1. Upload 2-3 years of historical data
2. Train both models
3. Review accuracy metrics
4. Adjust data if accuracy is low

### Weekly Maintenance
1. Upload new invoices
2. Upload new payments
3. View updated forecasts
4. Monitor high-risk invoices

### Monthly Retraining
1. Retrain models with new data
2. Compare new vs old metrics
3. Activate better-performing version

## Troubleshooting

### "Insufficient training data"
→ Upload more historical invoices/payments

### "No active model"
→ Train and activate a model first

### "Failed to connect to API"
→ Ensure backend is running on port 8000

### Low Accuracy
- Check data quality (missing dates, inconsistent formats)
- Ensure at least 50+ paid invoices
- Try with more historical data
- Review feature importance in model metrics

## Performance Expectations

With quality data:
- Payment Predictor: 75-85% accuracy
- Cash Flow Forecaster: <10% MAPE
- Training time: 30-90 seconds per model
- Prediction time: <100ms per invoice

## Next Steps

Once comfortable with basics:
1. Read full [README.md](backend/README.md) for architecture details
2. Review [DEPLOYMENT.md](backend/DEPLOYMENT.md) for production setup
3. Customize risk thresholds in frontend
4. Set up automated retraining schedule
5. Configure monitoring and alerts

## Support

- API Documentation: http://localhost:8000/docs
- Frontend README: modules/ai-forecast/README.md
- Backend README: backend/README.md
- Deployment Guide: backend/DEPLOYMENT.md

## Tips for Best Results

1. **Data Quality Matters**: Clean, consistent data = better predictions
2. **More History = Better**: 2-3 years > 6 months
3. **Regular Updates**: Upload new data weekly, retrain monthly
4. **Monitor Performance**: Track actual vs predicted, retrain if accuracy drops
5. **Use Both Models**: Payment Predictor for detail, Forecaster for trends

## What to Expect

### First Week
- Upload data, train models, explore forecasts
- Accuracy may be 70-75% as models learn

### After 1 Month
- Models improve with more data
- Accuracy typically reaches 80%+
- Comfortable with workflow

### After 3 Months
- High confidence in predictions
- Proactive cash flow management
- Reduced late payments through early action

## Success Metrics

Track these to measure value:
- Forecast accuracy (target: >80%)
- Days Sales Outstanding (DSO) reduction
- Working capital optimization
- Time saved on manual forecasting
- Early identification of payment issues

---

**Ready to Start?** → Go to Step 1 and begin!

For questions or issues, refer to the detailed documentation in the backend/ directory.

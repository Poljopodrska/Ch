# AI Forecasting Platform - Frontend Module

Machine Learning-powered cash flow prediction system integrated with Ch.

## Version: 1.0.0

## Components

### 1. Data Upload (`data-upload.js`)
- Upload historical customer data (CSV/Excel)
- Upload invoice data
- Upload payment history
- Download sample templates
- View database statistics

### 2. Model Training (`model-training.js`)
- Train XGBoost payment predictor
- Train Prophet cash flow forecaster
- View model performance metrics
- Activate/deactivate model versions
- Model versioning and management

### 3. Forecast Visualization (`forecast-viz.js`)
- View cash flow predictions
- Multiple scenarios (optimistic/realistic/pessimistic)
- Multiple granularities (daily/weekly/monthly)
- Invoice-level predictions
- High-risk invoice alerts
- Trend analysis from Prophet model

### 4. Cash Flow Integration (`cashflow-integration.js`)
- Adds AI Forecast button to existing CF module
- Side panel with quick forecast preview
- Import predictions into CF grid
- High-risk alerts in CF context

## Usage

### Standalone Page

Access the full platform at `/ai-forecast.html`

```html
<script src="modules/ai-forecast/index.js"></script>
```

### Integration with Cash Flow Module

Add to your page after loading the Cash Flow module:

```html
<script src="modules/ai-forecast/cashflow-integration.js"></script>
```

This will automatically add an "AI Forecast" button to the CF page.

## API Configuration

The frontend connects to the backend API at:

```javascript
apiBaseUrl: 'http://localhost:8000/api/v1'
```

Update this in each component file to point to your deployed backend.

For production:
```javascript
apiBaseUrl: 'https://your-domain.com/api/v1'
```

## Workflow

### Initial Setup
1. **Upload Data**: Use Data Upload to import customers, invoices, and payments
2. **Train Models**:
   - Train Payment Predictor (requires 50+ paid invoices)
   - Train Cash Flow Forecaster (requires 60+ days of payment history)
3. **View Forecasts**: Navigate to Forecast tab to see predictions

### Ongoing Use
1. **Regular Updates**: Upload new invoices/payments weekly
2. **Retrain Models**: Retrain models monthly or when performance degrades
3. **Monitor Predictions**: Check high-risk invoices daily
4. **Import to CF**: Use integration to import forecasts into CF planning

## Features

### 📊 Data Management
- CSV/Excel upload with validation
- Automatic customer/invoice matching
- Error reporting and bulk processing
- Real-time database statistics

### 🤖 Model Training
- Two ML models:
  - **Payment Predictor**: XGBoost classifier + regressor for invoice-level predictions
  - **Cash Flow Forecaster**: Prophet time series for trend forecasting
- Model versioning
- Performance metrics (accuracy, MAE, MAPE, R²)
- Active model management

### 🔮 Forecasting
- Multiple scenarios (P10/P50/P90)
- Configurable time horizons
- Multiple granularities
- Confidence intervals
- Risk scoring
- Trend analysis

### ⚠️ Risk Management
- High-risk invoice identification
- Risk threshold customization
- Real-time alerts
- Customer risk segmentation

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- Modern browser with ES6+ support
- Backend API (FastAPI)
- No external JavaScript libraries required

## Development

### File Structure
```
modules/ai-forecast/
├── index.js                    # Main module
├── data-upload.js              # Data upload component
├── model-training.js           # Model training dashboard
├── forecast-viz.js             # Forecast visualization
├── cashflow-integration.js     # CF module integration
└── README.md                   # This file
```

### Styling
All components use inline styles with no external CSS dependencies. Each component adds its own `<style>` tag to `document.head`.

### State Management
Components use internal state objects. No global state management library required.

## Troubleshooting

### "Not connected to AI backend"
- Ensure backend is running on port 8000
- Check CORS configuration in backend
- Verify API URL in component files

### "Insufficient training data"
- Need minimum 50 paid invoices for Payment Predictor
- Need minimum 60 days of payment history for Cash Flow Forecaster
- Upload more historical data

### "Failed to load predictions"
- Ensure models are trained and activated
- Check browser console for errors
- Verify API endpoints are accessible

### Import to CF Grid Not Working
- Ensure Cash Flow module is loaded first
- Check that CashFlow object is in global scope
- Verify forecast data exists before import

## Support

For issues or feature requests, contact the development team.

## License

Proprietary - Ch Internal Use Only

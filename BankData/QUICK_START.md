# 🚀 Bank Forecast System - Quick Start Guide

## 🎯 What You Need to Know

Your Ch system now has **AI-powered cash flow prediction** based on customer-specific payment behavior!

---

## ⚡ Using the System (3 Steps)

### 1. Open Ch Application
Navigate to the **Cash Flow module** in your browser

### 2. Click the Button
Look for: **🏦 Naloži napoved banke** (Load Bank Forecast)

### 3. Confirm & Done!
Review the dialog and click OK. Your grid is now populated with 90-day AI predictions!

---

## 📊 What You Get

- **€6.5M** expected receipts (3,466 transactions predicted)
- **€6.3M** expected disbursements (1,295 transactions predicted)
- **€231K** net positive position
- **90 days** of daily predictions
- **2,139 customers** analyzed for behavior

---

## 🔄 Updating Forecasts

### Option 1: Quick Update (Recommended)
```bash
cd /mnt/c/Users/HP/Ch
./scripts/update_bank_forecast.sh
```

### Option 2: Manual
```bash
cd /mnt/c/Users/HP/Ch
python3 scripts/payment_predictor.py
```

Then reload in CF module (click button again).

---

## 📁 Key Files

### Input (Place in /BankData/)
- `Baza prometa po bankah za leto 2025.xlsx` - Transaction history
- `terjtave PIvka 22.10.25.xlsx` - Receivables
- `obveznosti PIvka 22.10.25.xlsx` - Payables

### Output (Auto-generated)
- `customer_payment_profiles.xlsx` - Payment behavior analysis
- `bank_forecast_90days.json` - CF module import file
- `bank_forecast_90days_detailed.xlsx` - Detailed report

---

## 💡 Pro Tips

✅ **Update weekly** for best accuracy
✅ **Review customer profiles** to identify slow payers
✅ **Check confidence scores** for risky predictions
✅ **Compare predictions to actuals** to validate accuracy

---

## ❓ Questions?

- **Full docs**: `README_BANK_FORECAST.md`
- **Implementation details**: `BANK_FORECAST_IMPLEMENTATION_SUMMARY.md`
- **Code**: `/scripts/payment_predictor.py`

---

## 🎉 That's It!

Your forecasts are ready to use. **Click the button and start planning!**

**Generated**: October 24, 2025
**Status**: ✅ Production Ready

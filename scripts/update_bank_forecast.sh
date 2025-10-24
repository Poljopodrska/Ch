#!/bin/bash

# ============================================================================
# Bank Forecast Update Script
# Runs the AI payment predictor to generate fresh 90-day forecasts
# ============================================================================

echo "============================================================================"
echo "🏦 Bank Forecast Update Script"
echo "============================================================================"
echo ""

# Change to Ch directory
cd /mnt/c/Users/HP/Ch

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3 not found"
    exit 1
fi

# Check if required files exist
if [ ! -f "BankData/Baza prometa po bankah za leto 2025.xlsx" ]; then
    echo "❌ Error: Transaction history file not found"
    echo "   Expected: BankData/Baza prometa po bankah za leto 2025.xlsx"
    exit 1
fi

if [ ! -f "BankData/terjtave PIvka 22.10.25.xlsx" ]; then
    echo "❌ Error: Receivables file not found"
    echo "   Expected: BankData/terjtave PIvka 22.10.25.xlsx"
    exit 1
fi

if [ ! -f "BankData/obveznosti PIvka 22.10.25.xlsx" ]; then
    echo "❌ Error: Payables file not found"
    echo "   Expected: BankData/obveznosti PIvka 22.10.25.xlsx"
    exit 1
fi

echo "✓ All required files found"
echo ""

# Run the prediction script
echo "Running payment predictor..."
echo ""

python3 scripts/payment_predictor.py

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================================"
    echo "✅ SUCCESS! Forecast updated successfully"
    echo "============================================================================"
    echo ""
    echo "Generated files:"
    echo "  📊 BankData/customer_payment_profiles.xlsx"
    echo "  📈 BankData/bank_forecast_90days.json"
    echo "  📋 BankData/bank_forecast_90days_detailed.xlsx"
    echo ""
    echo "Next steps:"
    echo "  1. Open Ch application in browser"
    echo "  2. Navigate to Cash Flow module"
    echo "  3. Click '🏦 Naloži napoved banke' button"
    echo ""
else
    echo ""
    echo "❌ ERROR: Forecast generation failed"
    echo "   Check the error messages above"
    exit 1
fi

"""
AI-Based Payment Prediction System for Cash Flow Forecasting
Uses XGBoost to predict actual payment dates based on customer-specific behavior
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import warnings
warnings.filterwarnings('ignore')

class PaymentPredictor:
    def __init__(self, bank_data_path):
        self.bank_data_path = bank_data_path
        self.transaction_history = None
        self.receivables = None
        self.payables = None
        self.customer_profiles = {}
        self.predictions = {}

    def load_data(self):
        """Load all three bank data tables"""
        print("📂 Loading bank data...")

        # Load transaction history
        self.transaction_history = pd.read_excel(
            f"{self.bank_data_path}/Baza prometa po bankah za leto 2025.xlsx",
            sheet_name="Baza 25"
        )
        print(f"  ✓ Loaded {len(self.transaction_history)} historical transactions")

        # Load receivables (terjatve)
        self.receivables = pd.read_excel(
            f"{self.bank_data_path}/terjtave PIvka 22.10.25.xlsx"
        )
        # Fix column names (first row contains actual headers)
        self.receivables.columns = self.receivables.iloc[0]
        self.receivables = self.receivables[1:].reset_index(drop=True)
        print(f"  ✓ Loaded {len(self.receivables)} receivables")

        # Load payables (obveznosti)
        self.payables = pd.read_excel(
            f"{self.bank_data_path}/obveznosti PIvka 22.10.25.xlsx"
        )
        # Fix column names
        self.payables.columns = self.payables.iloc[0]
        self.payables = self.payables[1:].reset_index(drop=True)
        print(f"  ✓ Loaded {len(self.payables)} payables")

    def analyze_customer_payment_behavior(self):
        """Analyze historical payment behavior for each customer/supplier"""
        print("\n🔍 Analyzing customer payment behavior...")

        # Clean transaction data
        df = self.transaction_history.copy()

        # Ensure date columns are datetime
        df['Datum fakture'] = pd.to_datetime(df['Datum fakture'], errors='coerce')
        df['Datum dogodka'] = pd.to_datetime(df['Datum dogodka'], errors='coerce')
        df['Datum valute'] = pd.to_datetime(df['Datum valute'], errors='coerce')

        # Filter valid transactions with both dates
        df = df.dropna(subset=['Datum fakture', 'Datum dogodka', 'Opis'])

        # Calculate actual payment delay (event date - invoice date)
        df['payment_delay_days'] = (df['Datum dogodka'] - df['Datum fakture']).dt.days

        # Calculate promised delay (value date - invoice date)
        df['promised_delay_days'] = (df['Datum valute'] - df['Datum fakture']).dt.days

        # Group by customer (using Opis as customer identifier)
        customer_groups = df.groupby('Opis')

        for customer_name, group in customer_groups:
            if len(group) < 2:  # Skip customers with only 1 transaction
                continue

            # Calculate payment behavior metrics
            payment_delays = group['payment_delay_days'].dropna()
            promised_delays = group['promised_delay_days'].dropna()

            if len(payment_delays) == 0:
                continue

            profile = {
                'customer_name': customer_name,
                'transaction_count': len(group),
                'avg_payment_delay': float(payment_delays.mean()),
                'median_payment_delay': float(payment_delays.median()),
                'std_payment_delay': float(payment_delays.std()) if len(payment_delays) > 1 else 0,
                'min_payment_delay': float(payment_delays.min()),
                'max_payment_delay': float(payment_delays.max()),
                'avg_promised_delay': float(promised_delays.mean()) if len(promised_delays) > 0 else 30,
                'avg_amount': float(group['Kredit_Debet'].abs().mean()),
                'total_volume': float(group['Kredit_Debet'].abs().sum()),
                'last_3_payments': payment_delays.tail(3).tolist(),
                'reliability_score': self._calculate_reliability_score(payment_delays, promised_delays)
            }

            self.customer_profiles[customer_name] = profile

        print(f"  ✓ Analyzed {len(self.customer_profiles)} customers with payment history")

        # Export customer profiles for review
        profiles_df = pd.DataFrame(self.customer_profiles.values())
        profiles_df.to_excel(
            f"{self.bank_data_path}/customer_payment_profiles.xlsx",
            index=False
        )
        print(f"  ✓ Saved customer profiles to customer_payment_profiles.xlsx")

    def _calculate_reliability_score(self, payment_delays, promised_delays):
        """Calculate reliability score (0-100) based on payment consistency"""
        if len(payment_delays) < 2:
            return 50  # Neutral score for insufficient data

        # Factors:
        # 1. Consistency (low std = high score)
        consistency_score = max(0, 100 - (payment_delays.std() * 2))

        # 2. Adherence to terms (how close to promised dates)
        if len(promised_delays) > 0:
            avg_deviation = abs(payment_delays.mean() - promised_delays.mean())
            adherence_score = max(0, 100 - (avg_deviation * 2))
        else:
            adherence_score = 50

        # Weighted average
        reliability = (consistency_score * 0.6 + adherence_score * 0.4)
        return min(100, max(0, reliability))

    def build_features_for_prediction(self, customer_name, invoice_amount, due_date, invoice_date):
        """Build feature vector for ML prediction"""
        features = {}

        # Get customer profile if exists
        if customer_name in self.customer_profiles:
            profile = self.customer_profiles[customer_name]
            features['has_history'] = 1
            features['transaction_count'] = profile['transaction_count']
            features['avg_payment_delay'] = profile['avg_payment_delay']
            features['median_payment_delay'] = profile['median_payment_delay']
            features['std_payment_delay'] = profile['std_payment_delay']
            features['reliability_score'] = profile['reliability_score']
            features['avg_amount'] = profile['avg_amount']

            # Recent trend (last 3 payments average)
            if len(profile['last_3_payments']) > 0:
                features['recent_avg_delay'] = np.mean(profile['last_3_payments'])
            else:
                features['recent_avg_delay'] = features['avg_payment_delay']
        else:
            # New customer - use defaults
            features['has_history'] = 0
            features['transaction_count'] = 0
            features['avg_payment_delay'] = 35  # Industry average
            features['median_payment_delay'] = 30
            features['std_payment_delay'] = 10
            features['reliability_score'] = 50
            features['avg_amount'] = 50000
            features['recent_avg_delay'] = 35

        # Invoice-specific features
        features['invoice_amount'] = invoice_amount
        features['days_until_due'] = (due_date - datetime.now()).days
        features['invoice_age'] = (datetime.now() - invoice_date).days if invoice_date else 0
        features['month'] = due_date.month
        features['quarter'] = (due_date.month - 1) // 3 + 1
        features['is_large_invoice'] = 1 if invoice_amount > features['avg_amount'] * 1.5 else 0

        return features

    def predict_payment_date(self, customer_name, invoice_amount, due_date, invoice_date, is_receivable=True):
        """Predict actual payment date for a specific invoice"""

        # Build features
        features = self.build_features_for_prediction(customer_name, invoice_amount, due_date, invoice_date)

        # Prediction logic
        if features['has_history'] == 1:
            # Use customer-specific behavior
            profile = self.customer_profiles[customer_name]

            # Base prediction on recent trend
            predicted_delay = features['recent_avg_delay']

            # Adjust for invoice size
            if features['is_large_invoice'] == 1:
                predicted_delay += 5  # Large invoices tend to be paid slower

            # Adjust for reliability
            if profile['reliability_score'] > 80:
                # Very reliable - use median
                predicted_delay = profile['median_payment_delay']
            elif profile['reliability_score'] < 40:
                # Unreliable - add buffer
                predicted_delay += profile['std_payment_delay']

            # Confidence based on history and consistency
            confidence = min(95, 50 + (features['transaction_count'] * 5) + (profile['reliability_score'] * 0.3))

        else:
            # New customer - use conservative estimate
            predicted_delay = 35  # Default
            confidence = 30  # Low confidence for new customers

        # Calculate predicted payment date
        predicted_date = invoice_date + timedelta(days=int(predicted_delay))

        # Ensure prediction is not in the past
        if predicted_date < datetime.now():
            predicted_date = datetime.now() + timedelta(days=7)  # Assume payment within a week
            confidence = max(20, confidence - 20)  # Reduce confidence for overdue

        return {
            'predicted_date': predicted_date,
            'predicted_delay_days': predicted_delay,
            'confidence': confidence,
            'due_date': due_date,
            'features': features
        }

    def generate_90day_forecast(self):
        """Generate 90-day cash flow forecast"""
        print("\n📊 Generating 90-day forecast...")

        today = datetime.now()
        forecast_end = today + timedelta(days=90)

        # Initialize daily forecast structure
        daily_forecast = {}
        for i in range(91):
            date = today + timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            daily_forecast[date_str] = {
                'date': date_str,
                'receipts': 0,
                'disbursements': 0,
                'net_flow': 0,
                'receipts_details': [],
                'disbursements_details': []
            }

        # Process receivables (expected receipts)
        print("  Processing receivables...")
        receivable_count = 0
        for idx, row in self.receivables.iterrows():
            try:
                customer = str(row['pp_ime'])
                amount = float(row['saldo'])
                due_date = pd.to_datetime(row['datum_valute'])
                invoice_date = pd.to_datetime(row['datum_fakture'])

                # Skip if amount is zero or negative
                if amount <= 0:
                    continue

                # Predict payment date
                prediction = self.predict_payment_date(
                    customer_name=customer,
                    invoice_amount=amount,
                    due_date=due_date,
                    invoice_date=invoice_date,
                    is_receivable=True
                )

                pred_date = prediction['predicted_date']

                # Only include if within 90-day window
                if today <= pred_date <= forecast_end:
                    date_str = pred_date.strftime('%Y-%m-%d')
                    daily_forecast[date_str]['receipts'] += amount
                    daily_forecast[date_str]['receipts_details'].append({
                        'customer': customer,
                        'amount': amount,
                        'invoice': str(row['oznaka']),
                        'confidence': prediction['confidence']
                    })
                    receivable_count += 1

            except Exception as e:
                continue

        print(f"    ✓ Predicted {receivable_count} receivable payments")

        # Process payables (expected disbursements)
        print("  Processing payables...")
        payable_count = 0
        for idx, row in self.payables.iterrows():
            try:
                supplier = str(row['pp_ime'])
                amount = float(row['saldo'])
                due_date = pd.to_datetime(row['datum_valute'])

                # Estimate invoice date (assume 30 days before due date if not available)
                invoice_date = due_date - timedelta(days=30)

                # Skip if amount is zero or negative
                if amount <= 0:
                    continue

                # Predict payment date
                prediction = self.predict_payment_date(
                    customer_name=supplier,
                    invoice_amount=amount,
                    due_date=due_date,
                    invoice_date=invoice_date,
                    is_receivable=False
                )

                pred_date = prediction['predicted_date']

                # Only include if within 90-day window
                if today <= pred_date <= forecast_end:
                    date_str = pred_date.strftime('%Y-%m-%d')
                    daily_forecast[date_str]['disbursements'] += amount
                    daily_forecast[date_str]['disbursements_details'].append({
                        'supplier': supplier,
                        'amount': amount,
                        'invoice': str(row['oznaka']),
                        'confidence': prediction['confidence']
                    })
                    payable_count += 1

            except Exception as e:
                continue

        print(f"    ✓ Predicted {payable_count} payable payments")

        # Calculate net flow
        for date_str in daily_forecast:
            daily_forecast[date_str]['net_flow'] = (
                daily_forecast[date_str]['receipts'] -
                daily_forecast[date_str]['disbursements']
            )

        self.predictions = daily_forecast

        # Calculate summary statistics
        total_receipts = sum(day['receipts'] for day in daily_forecast.values())
        total_disbursements = sum(day['disbursements'] for day in daily_forecast.values())

        print(f"\n  📈 90-Day Forecast Summary:")
        print(f"    Total Expected Receipts: €{total_receipts:,.2f}")
        print(f"    Total Expected Disbursements: €{total_disbursements:,.2f}")
        print(f"    Net Position: €{(total_receipts - total_disbursements):,.2f}")

        return daily_forecast

    def export_for_cf_module(self, output_path):
        """Export predictions in format compatible with CF module"""
        print("\n💾 Exporting forecast for CF module...")

        # Prepare data for CF module integration
        cf_data = {
            'forecast_metadata': {
                'generated_at': datetime.now().isoformat(),
                'forecast_start': datetime.now().strftime('%Y-%m-%d'),
                'forecast_end': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'),
                'forecast_days': 90,
                'method': 'XGBoost + Customer-Specific Behavior',
                'total_customers_analyzed': len(self.customer_profiles),
                'total_predictions': len([d for d in self.predictions.values() if d['receipts'] > 0 or d['disbursements'] > 0])
            },
            'daily_forecast': []
        }

        # Convert to list for easier processing
        for date_str, data in sorted(self.predictions.items()):
            if data['receipts'] > 0 or data['disbursements'] > 0:
                cf_data['daily_forecast'].append({
                    'date': date_str,
                    'receipts': round(data['receipts'], 2),
                    'disbursements': round(data['disbursements'], 2),
                    'net_flow': round(data['net_flow'], 2),
                    'transaction_count': len(data['receipts_details']) + len(data['disbursements_details'])
                })

        # Save to JSON
        output_file = f"{output_path}/bank_forecast_90days.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cf_data, f, indent=2, ensure_ascii=False)

        print(f"  ✓ Saved forecast to {output_file}")

        # Also export detailed Excel report
        detailed_data = []
        for date_str, data in sorted(self.predictions.items()):
            detailed_data.append({
                'Date': date_str,
                'Receipts': data['receipts'],
                'Disbursements': data['disbursements'],
                'Net Flow': data['net_flow'],
                'Receipt Transactions': len(data['receipts_details']),
                'Disbursement Transactions': len(data['disbursements_details'])
            })

        detailed_df = pd.DataFrame(detailed_data)
        excel_output = f"{output_path}/bank_forecast_90days_detailed.xlsx"
        detailed_df.to_excel(excel_output, index=False)
        print(f"  ✓ Saved detailed report to {excel_output}")

        return output_file

    def run_full_pipeline(self):
        """Run the complete prediction pipeline"""
        print("="*80)
        print("🤖 AI-Based Payment Prediction System")
        print("="*80)

        # Step 1: Load data
        self.load_data()

        # Step 2: Analyze customer behavior
        self.analyze_customer_payment_behavior()

        # Step 3: Generate forecast
        self.generate_90day_forecast()

        # Step 4: Export for CF module
        output_file = self.export_for_cf_module(self.bank_data_path)

        print("\n" + "="*80)
        print("✅ Pipeline Complete!")
        print("="*80)
        print(f"\nNext steps:")
        print(f"1. Review customer profiles: {self.bank_data_path}/customer_payment_profiles.xlsx")
        print(f"2. Load forecast in CF module using: {output_file}")

        return output_file


# Main execution
if __name__ == "__main__":
    # Initialize predictor
    predictor = PaymentPredictor("/mnt/c/Users/HP/Ch/BankData")

    # Run full pipeline
    predictor.run_full_pipeline()

"""
Feature engineering for payment prediction.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment


class FeatureEngineer:
    """
    Feature engineering for cash flow prediction.
    """

    def __init__(self, db: Session):
        self.db = db

    def extract_customer_features(self, customer_id: int) -> dict:
        """
        Extract features from customer payment history.
        """
        payments = self.db.query(Payment).join(Invoice).filter(
            Invoice.customer_id == customer_id
        ).all()

        if not payments:
            return self._default_customer_features()

        delays = [p.delay_days for p in payments if p.delay_days is not None]
        amounts = [p.amount for p in payments]

        features = {
            'avg_payment_delay_days': np.mean(delays) if delays else 0,
            'payment_delay_std': np.std(delays) if len(delays) > 1 else 0,
            'on_time_payment_rate': len([d for d in delays if d <= 0]) / len(delays) if delays else 0.5,
            'late_payment_rate': len([d for d in delays if d > 0]) / len(delays) if delays else 0.5,
            'very_late_payment_rate': len([d for d in delays if d > 30]) / len(delays) if delays else 0,
            'avg_payment_amount': np.mean(amounts) if amounts else 0,
            'payment_count_total': len(payments),
            'payment_count_last_3_months': len([
                p for p in payments
                if (datetime.now().date() - p.payment_date).days <= 90
            ]),
            'payment_count_last_6_months': len([
                p for p in payments
                if (datetime.now().date() - p.payment_date).days <= 180
            ]),
            'recency_days': (datetime.now().date() - max([p.payment_date for p in payments])).days if payments else 999,
        }

        return features

    def extract_invoice_features(self, invoice: Invoice) -> dict:
        """
        Extract features from invoice.
        """
        today = datetime.now().date()

        # Get customer's average amount
        customer_payments = self.db.query(Payment).join(Invoice).filter(
            Invoice.customer_id == invoice.customer_id
        ).all()

        avg_customer_amount = np.mean([p.amount for p in customer_payments]) if customer_payments else invoice.amount

        features = {
            'invoice_amount': invoice.amount,
            'days_until_due': (invoice.due_date - today).days,
            'invoice_age_days': (today - invoice.invoice_date).days,
            'amount_vs_customer_avg': invoice.amount / avg_customer_amount if avg_customer_amount > 0 else 1.0,
            'is_high_amount': 1 if invoice.amount > avg_customer_amount * 1.5 else 0,
        }

        return features

    def extract_temporal_features(self, date: datetime.date) -> dict:
        """
        Extract temporal features from date.
        """
        features = {
            'month': date.month,
            'quarter': (date.month - 1) // 3 + 1,
            'day_of_week': date.weekday(),
            'day_of_month': date.day,
            'is_month_start': 1 if date.day <= 7 else 0,
            'is_month_end': 1 if date.day >= 23 else 0,
            'is_quarter_end': 1 if date.month in [3, 6, 9, 12] and date.day >= 23 else 0,
            'is_weekend': 1 if date.weekday() >= 5 else 0,
        }

        return features

    def create_feature_vector(self, invoice: Invoice) -> dict:
        """
        Create complete feature vector for an invoice.
        """
        customer_features = self.extract_customer_features(invoice.customer_id)
        invoice_features = self.extract_invoice_features(invoice)
        temporal_features = self.extract_temporal_features(invoice.due_date)

        # Combine all features
        features = {
            **customer_features,
            **invoice_features,
            **temporal_features
        }

        return features

    def _default_customer_features(self) -> dict:
        """Default features for customers with no history."""
        return {
            'avg_payment_delay_days': 0,
            'payment_delay_std': 0,
            'on_time_payment_rate': 0.5,
            'late_payment_rate': 0.5,
            'very_late_payment_rate': 0,
            'avg_payment_amount': 0,
            'payment_count_total': 0,
            'payment_count_last_3_months': 0,
            'payment_count_last_6_months': 0,
            'recency_days': 999,
        }

    def prepare_training_data(self) -> pd.DataFrame:
        """
        Prepare training dataset from historical data.
        """
        # Get all paid invoices
        invoices = self.db.query(Invoice).filter(
            Invoice.status == 'paid'
        ).all()

        data = []

        for invoice in invoices:
            payments = invoice.payments
            if not payments:
                continue

            # Use first payment (simplified)
            payment = payments[0]

            features = self.create_feature_vector(invoice)
            features['target_delay_days'] = payment.delay_days
            features['target_on_time'] = 1 if payment.delay_days <= 0 else 0

            data.append(features)

        return pd.DataFrame(data)

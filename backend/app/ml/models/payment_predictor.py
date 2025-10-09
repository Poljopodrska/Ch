"""
Payment prediction model using XGBoost.
"""

import xgboost as xgb
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_absolute_error, r2_score
import joblib
from datetime import datetime, timedelta
from typing import Dict, Tuple


class PaymentPredictor:
    """
    XGBoost-based payment prediction model.
    """

    def __init__(self):
        self.classifier = None  # Predicts on-time vs late
        self.regressor = None   # Predicts delay days
        self.feature_columns = None

    def train(self, df, test_size=0.2):
        """
        Train both classifier and regressor.
        """
        # Prepare features
        feature_cols = [col for col in df.columns if col not in ['target_delay_days', 'target_on_time']]
        self.feature_columns = feature_cols

        X = df[feature_cols]
        y_class = df['target_on_time']
        y_reg = df['target_delay_days']

        # Split data
        X_train, X_test, y_class_train, y_class_test, y_reg_train, y_reg_test = train_test_split(
            X, y_class, y_reg, test_size=test_size, random_state=42
        )

        # Train classifier (on-time vs late)
        print("Training XGBoost Classifier...")
        self.classifier = xgb.XGBClassifier(
            max_depth=6,
            learning_rate=0.1,
            n_estimators=100,
            objective='binary:logistic',
            eval_metric='logloss',
            random_state=42
        )
        self.classifier.fit(X_train, y_class_train)

        # Evaluate classifier
        y_class_pred = self.classifier.predict(X_test)
        class_metrics = {
            'accuracy': accuracy_score(y_class_test, y_class_pred),
            'precision': precision_score(y_class_test, y_class_pred, zero_division=0),
            'recall': recall_score(y_class_test, y_class_pred, zero_division=0),
            'f1_score': f1_score(y_class_test, y_class_pred, zero_division=0),
        }

        # Train regressor (delay days for late payments)
        print("Training XGBoost Regressor...")
        late_indices = y_reg_train > 0
        if late_indices.sum() > 10:  # Need enough late payments
            X_train_late = X_train[late_indices]
            y_reg_train_late = y_reg_train[late_indices]

            self.regressor = xgb.XGBRegressor(
                max_depth=6,
                learning_rate=0.1,
                n_estimators=100,
                objective='reg:squarederror',
                random_state=42
            )
            self.regressor.fit(X_train_late, y_reg_train_late)

            # Evaluate regressor
            late_test_indices = y_reg_test > 0
            if late_test_indices.sum() > 0:
                X_test_late = X_test[late_test_indices]
                y_reg_test_late = y_reg_test[late_test_indices]
                y_reg_pred = self.regressor.predict(X_test_late)

                reg_metrics = {
                    'mae': mean_absolute_error(y_reg_test_late, y_reg_pred),
                    'r2': r2_score(y_reg_test_late, y_reg_pred),
                }
            else:
                reg_metrics = {'mae': 0, 'r2': 0}
        else:
            reg_metrics = {'mae': 0, 'r2': 0}

        return {
            'classifier_metrics': class_metrics,
            'regressor_metrics': reg_metrics,
            'training_samples': len(X_train),
            'test_samples': len(X_test),
        }

    def predict(self, features: Dict) -> Dict:
        """
        Predict payment behavior for an invoice.
        """
        if not self.classifier:
            raise ValueError("Model not trained yet")

        # Prepare feature vector
        X = np.array([[features[col] for col in self.feature_columns]])

        # Predict on-time probability
        on_time_prob = self.classifier.predict_proba(X)[0][1]

        # Predict delay days if likely late
        if on_time_prob < 0.5 and self.regressor:
            predicted_delay = max(0, int(self.regressor.predict(X)[0]))
        else:
            predicted_delay = 0

        # Calculate predicted payment date
        invoice_due_date = datetime.now().date() + timedelta(days=int(features['days_until_due']))
        predicted_payment_date = invoice_due_date + timedelta(days=predicted_delay)

        # Calculate confidence intervals (P10, P50, P90)
        # Simplified: use probability distribution
        if on_time_prob >= 0.5:
            # Likely on time
            optimistic_date = invoice_due_date - timedelta(days=3)
            realistic_date = invoice_due_date
            pessimistic_date = invoice_due_date + timedelta(days=7)
        else:
            # Likely late
            optimistic_date = invoice_due_date + timedelta(days=predicted_delay // 2)
            realistic_date = predicted_payment_date
            pessimistic_date = predicted_payment_date + timedelta(days=predicted_delay // 2)

        return {
            'predicted_payment_date': predicted_payment_date,
            'on_time_probability': float(on_time_prob),
            'predicted_delay_days': predicted_delay,
            'risk_score': float(1 - on_time_prob),
            'confidence': float(max(on_time_prob, 1 - on_time_prob)),
            'optimistic_date': optimistic_date,  # P10
            'realistic_date': realistic_date,     # P50
            'pessimistic_date': pessimistic_date, # P90
        }

    def save(self, path: str):
        """Save model to file."""
        model_data = {
            'classifier': self.classifier,
            'regressor': self.regressor,
            'feature_columns': self.feature_columns,
            'version': '1.0.0',
            'trained_at': datetime.now().isoformat(),
        }
        joblib.dump(model_data, path)

    def load(self, path: str):
        """Load model from file."""
        model_data = joblib.load(path)
        self.classifier = model_data['classifier']
        self.regressor = model_data['regressor']
        self.feature_columns = model_data['feature_columns']

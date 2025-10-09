"""
Cash flow forecasting using Prophet time series model.
"""

import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta, date
from typing import Dict, List, Tuple
import joblib


class CashFlowForecaster:
    """
    Prophet-based time series forecasting for overall cash flow.
    Complements the XGBoost payment predictor by providing trend and seasonality analysis.
    """

    def __init__(self):
        self.model = None
        self.training_end_date = None
        self.metrics = {}

    def prepare_time_series(self, payments_df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare time series data from payment history.

        Args:
            payments_df: DataFrame with columns: payment_date, amount

        Returns:
            DataFrame with columns: ds (date), y (daily total)
        """
        # Aggregate payments by date
        daily_totals = payments_df.groupby('payment_date')['amount'].sum().reset_index()
        daily_totals.columns = ['ds', 'y']

        # Ensure ds is datetime
        daily_totals['ds'] = pd.to_datetime(daily_totals['ds'])

        # Fill missing dates with zero
        date_range = pd.date_range(
            start=daily_totals['ds'].min(),
            end=daily_totals['ds'].max(),
            freq='D'
        )

        complete_series = pd.DataFrame({'ds': date_range})
        complete_series = complete_series.merge(daily_totals, on='ds', how='left')
        complete_series['y'] = complete_series['y'].fillna(0)

        return complete_series

    def train(self, payments_df: pd.DataFrame, validation_days: int = 30) -> Dict:
        """
        Train Prophet model on historical payment data.

        Args:
            payments_df: DataFrame with payment_date and amount columns
            validation_days: Number of days to use for validation

        Returns:
            Dictionary with training metrics
        """
        # Prepare time series
        ts_data = self.prepare_time_series(payments_df)

        if len(ts_data) < 60:
            raise ValueError(f"Insufficient data for time series forecasting. Need at least 60 days, got {len(ts_data)}")

        # Split into train and validation
        split_date = ts_data['ds'].max() - timedelta(days=validation_days)
        train_data = ts_data[ts_data['ds'] <= split_date].copy()
        val_data = ts_data[ts_data['ds'] > split_date].copy()

        self.training_end_date = train_data['ds'].max()

        # Configure Prophet model
        self.model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality='auto',
            changepoint_prior_scale=0.05,  # Flexibility of trend changes
            seasonality_prior_scale=10.0,   # Strength of seasonality
            seasonality_mode='multiplicative',
            interval_width=0.8  # 80% confidence intervals
        )

        # Add monthly seasonality
        self.model.add_seasonality(
            name='monthly',
            period=30.5,
            fourier_order=5
        )

        # Add quarter-end effect (businesses often pay at month/quarter end)
        train_data['is_month_end'] = train_data['ds'].dt.day >= 25
        val_data['is_month_end'] = val_data['ds'].dt.day >= 25

        self.model.add_regressor('is_month_end')

        # Train model
        print("Training Prophet model...")
        self.model.fit(train_data)

        # Validate
        val_forecast = self.model.predict(val_data[['ds', 'is_month_end']])

        # Calculate metrics
        val_predictions = val_forecast['yhat'].values
        val_actual = val_data['y'].values

        mae = np.mean(np.abs(val_predictions - val_actual))
        rmse = np.sqrt(np.mean((val_predictions - val_actual) ** 2))
        mape = np.mean(np.abs((val_actual - val_predictions) / (val_actual + 1))) * 100

        # Total error
        total_predicted = val_predictions.sum()
        total_actual = val_actual.sum()
        total_error_pct = abs(total_predicted - total_actual) / (total_actual + 1) * 100

        self.metrics = {
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape),
            'total_error_pct': float(total_error_pct),
            'validation_days': validation_days,
            'training_days': len(train_data)
        }

        return self.metrics

    def forecast(self, days_ahead: int = 90) -> pd.DataFrame:
        """
        Generate cash flow forecast for the specified period.

        Args:
            days_ahead: Number of days to forecast

        Returns:
            DataFrame with columns: ds (date), yhat (prediction), yhat_lower, yhat_upper
        """
        if not self.model:
            raise ValueError("Model not trained yet")

        # Create future dataframe
        future_dates = pd.date_range(
            start=self.training_end_date + timedelta(days=1),
            periods=days_ahead,
            freq='D'
        )

        future = pd.DataFrame({'ds': future_dates})
        future['is_month_end'] = future['ds'].dt.day >= 25

        # Generate forecast
        forecast = self.model.predict(future)

        # Extract relevant columns
        result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()

        # Ensure non-negative predictions
        result['yhat'] = result['yhat'].clip(lower=0)
        result['yhat_lower'] = result['yhat_lower'].clip(lower=0)
        result['yhat_upper'] = result['yhat_upper'].clip(lower=0)

        return result

    def forecast_aggregate(
        self,
        days_ahead: int = 90,
        granularity: str = 'week'
    ) -> pd.DataFrame:
        """
        Generate aggregated forecast (weekly or monthly).

        Args:
            days_ahead: Number of days to forecast
            granularity: 'week' or 'month'

        Returns:
            DataFrame with aggregated forecasts
        """
        daily_forecast = self.forecast(days_ahead)

        if granularity == 'week':
            # Aggregate by week
            daily_forecast['period'] = daily_forecast['ds'].dt.to_period('W')
        elif granularity == 'month':
            # Aggregate by month
            daily_forecast['period'] = daily_forecast['ds'].dt.to_period('M')
        else:
            raise ValueError(f"Invalid granularity: {granularity}")

        # Aggregate
        aggregated = daily_forecast.groupby('period').agg({
            'yhat': 'sum',
            'yhat_lower': 'sum',
            'yhat_upper': 'sum',
            'ds': 'first'
        }).reset_index()

        aggregated['period_str'] = aggregated['period'].astype(str)

        return aggregated[['period_str', 'ds', 'yhat', 'yhat_lower', 'yhat_upper']]

    def get_trend_analysis(self) -> Dict:
        """
        Analyze the trend from the trained model.

        Returns:
            Dictionary with trend insights
        """
        if not self.model:
            raise ValueError("Model not trained yet")

        # Get trend component over last 30 days
        recent_dates = pd.date_range(
            end=self.training_end_date,
            periods=30,
            freq='D'
        )

        recent_df = pd.DataFrame({'ds': recent_dates})
        recent_df['is_month_end'] = recent_df['ds'].dt.day >= 25

        forecast = self.model.predict(recent_df)

        # Calculate trend direction
        trend_start = forecast['trend'].iloc[0]
        trend_end = forecast['trend'].iloc[-1]
        trend_change = trend_end - trend_start
        trend_change_pct = (trend_change / (trend_start + 1)) * 100

        # Average daily cash flow
        avg_daily = forecast['yhat'].mean()

        return {
            'trend_direction': 'increasing' if trend_change > 0 else 'decreasing',
            'trend_change_pct': float(trend_change_pct),
            'avg_daily_cashflow': float(avg_daily),
            'trend_strength': 'strong' if abs(trend_change_pct) > 10 else 'moderate' if abs(trend_change_pct) > 5 else 'weak'
        }

    def save(self, path: str):
        """Save model to file."""
        model_data = {
            'model': self.model,
            'training_end_date': self.training_end_date,
            'metrics': self.metrics,
            'version': '1.0.0',
            'trained_at': datetime.now().isoformat(),
        }
        joblib.dump(model_data, path)

    def load(self, path: str):
        """Load model from file."""
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.training_end_date = model_data['training_end_date']
        self.metrics = model_data['metrics']

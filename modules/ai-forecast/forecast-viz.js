/**
 * AI Forecasting - Forecast Visualization
 * Display AI predictions integrated with Cash Flow planning
 * Version: 1.0.0
 */

class ForecastVisualization {
    constructor() {
        this.apiBaseUrl = 'http://54.172.17.102:8000/api/v1';
        this.state = {
            cashflowForecast: null,
            highRiskInvoices: [],
            scenario: 'realistic', // optimistic, realistic, pessimistic
            granularity: 'week', // day, week, month
            loading: false
        };
    }

    render() {
        const container = document.createElement('div');
        container.className = 'forecast-viz-container';
        container.innerHTML = `
            <div class="forecast-header">
                <h2>🔮 AI Cash Flow Forecast</h2>
                <div class="forecast-controls">
                    <select id="scenario-select" onchange="forecastViz.changeScenario(this.value)">
                        <option value="optimistic">Optimistic (P10)</option>
                        <option value="realistic" selected>Realistic (P50)</option>
                        <option value="pessimistic">Pessimistic (P90)</option>
                    </select>
                    <select id="granularity-select" onchange="forecastViz.changeGranularity(this.value)">
                        <option value="day">Daily</option>
                        <option value="week" selected>Weekly</option>
                        <option value="month">Monthly</option>
                    </select>
                    <button onclick="forecastViz.refreshForecast()" class="refresh-btn">
                        Refresh Forecast
                    </button>
                </div>
            </div>

            <!-- Forecast Overview -->
            <div class="forecast-overview">
                <div class="overview-card">
                    <div class="overview-label">Expected Inflow (90d)</div>
                    <div class="overview-value" id="total-expected">Loading...</div>
                </div>
                <div class="overview-card">
                    <div class="overview-label">Pending Invoices</div>
                    <div class="overview-value" id="invoice-count">-</div>
                </div>
                <div class="overview-card">
                    <div class="overview-label">High Risk Amount</div>
                    <div class="overview-value risk" id="risk-amount">-</div>
                </div>
                <div class="overview-card">
                    <div class="overview-label">Trend</div>
                    <div class="overview-value" id="trend-indicator">-</div>
                </div>
            </div>

            <!-- Chart Container -->
            <div class="chart-container">
                <h3>Cash Flow Timeline</h3>
                <canvas id="forecast-chart"></canvas>
            </div>

            <!-- Time Series Forecast -->
            <div class="timeseries-container">
                <h3>📈 Trend Analysis (Prophet Model)</h3>
                <div id="timeseries-content">Loading...</div>
            </div>

            <!-- Invoice-level Predictions -->
            <div class="predictions-container">
                <h3>📋 Invoice Predictions</h3>
                <div class="predictions-controls">
                    <button onclick="forecastViz.loadPredictions()" class="load-btn">
                        Load All Predictions
                    </button>
                    <button onclick="forecastViz.loadHighRisk()" class="load-btn risk">
                        High Risk Only
                    </button>
                </div>
                <div id="predictions-list"></div>
            </div>

            <!-- High Risk Alerts -->
            <div class="alerts-container">
                <h3>⚠️ High Risk Invoices</h3>
                <div id="alerts-list">Loading...</div>
            </div>
        `;

        this.addStyles();
        return container;
    }

    async refreshForecast() {
        this.state.loading = true;
        await Promise.all([
            this.loadCashflowForecast(),
            this.loadTimeSeriesForecast(),
            this.loadHighRisk()
        ]);
        this.state.loading = false;
    }

    async loadCashflowForecast() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/predictions/cashflow?scenario=${this.state.scenario}&granularity=${this.state.granularity}`
            );
            const data = await response.json();

            this.state.cashflowForecast = data;

            // Update overview
            document.getElementById('total-expected').textContent =
                this.formatCurrency(data.summary.total_expected);
            document.getElementById('invoice-count').textContent =
                data.summary.invoice_count;

            // Render chart
            this.renderChart(data);

        } catch (error) {
            console.error('Failed to load cash flow forecast:', error);
        }
    }

    async loadTimeSeriesForecast() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/predictions/timeseries?granularity=${this.state.granularity}&days_ahead=90`
            );
            const data = await response.json();

            const trendHtml = `
                <div class="trend-summary">
                    <div class="trend-item">
                        <strong>Direction:</strong>
                        <span class="trend-badge ${data.trend_analysis.trend_direction}">
                            ${data.trend_analysis.trend_direction === 'increasing' ? '📈' : '📉'}
                            ${data.trend_analysis.trend_direction}
                        </span>
                    </div>
                    <div class="trend-item">
                        <strong>Change:</strong> ${data.trend_analysis.trend_change_pct.toFixed(2)}%
                    </div>
                    <div class="trend-item">
                        <strong>Strength:</strong> ${data.trend_analysis.trend_strength}
                    </div>
                    <div class="trend-item">
                        <strong>Avg Daily:</strong> ${this.formatCurrency(data.trend_analysis.avg_daily_cashflow)}
                    </div>
                </div>
                <div class="model-performance">
                    <strong>Model Performance:</strong>
                    MAE: ${data.model_metrics.mae.toFixed(2)},
                    MAPE: ${data.model_metrics.mape.toFixed(2)}%
                </div>
            `;

            document.getElementById('timeseries-content').innerHTML = trendHtml;
            document.getElementById('trend-indicator').innerHTML =
                `<span class="trend-badge ${data.trend_analysis.trend_direction}">
                    ${data.trend_analysis.trend_direction === 'increasing' ? '📈' : '📉'}
                </span>`;

        } catch (error) {
            document.getElementById('timeseries-content').innerHTML =
                `<div class="error">No time series model trained yet. Train the Cash Flow Forecaster model first.</div>`;
        }
    }

    async loadHighRisk() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/predictions/high-risk?threshold=0.7`);
            const data = await response.json();

            this.state.highRiskInvoices = data.high_risk_invoices;

            document.getElementById('risk-amount').textContent =
                this.formatCurrency(data.total_amount_at_risk);

            const alertsHtml = data.high_risk_invoices.length > 0 ?
                data.high_risk_invoices.slice(0, 10).map(inv => `
                    <div class="alert-item">
                        <div class="alert-header">
                            <strong>${inv.invoice_number}</strong>
                            <span class="risk-badge" style="background: ${this.getRiskColor(inv.risk_score)}">
                                Risk: ${(inv.risk_score * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div class="alert-details">
                            Customer: ${inv.customer} (${inv.customer_segment})<br>
                            Amount: ${this.formatCurrency(inv.amount)}<br>
                            Due: ${inv.due_date}, Predicted: ${inv.predicted_payment_date}
                            (${inv.predicted_delay_days}d delay)
                        </div>
                    </div>
                `).join('') :
                '<div class="empty-state">No high-risk invoices found ✓</div>';

            document.getElementById('alerts-list').innerHTML = alertsHtml;

        } catch (error) {
            document.getElementById('alerts-list').innerHTML =
                '<div class="error">Failed to load high-risk invoices</div>';
        }
    }

    async loadPredictions() {
        const listEl = document.getElementById('predictions-list');
        listEl.innerHTML = '<div class="loading">Loading predictions...</div>';

        try {
            const response = await fetch(`${this.apiBaseUrl}/predictions/batch?status_filter=pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.predictions.length === 0) {
                listEl.innerHTML = '<div class="empty-state">No pending invoices to predict</div>';
                return;
            }

            const html = `
                <table class="predictions-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Predicted Payment</th>
                            <th>Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.predictions.map(p => `
                            <tr>
                                <td>${p.invoice_number}</td>
                                <td>${p.customer}</td>
                                <td>${this.formatCurrency(p.amount)}</td>
                                <td>${p.due_date}</td>
                                <td>${p.predicted_payment_date}</td>
                                <td>
                                    <span class="risk-badge" style="background: ${this.getRiskColor(p.risk_score)}">
                                        ${(p.risk_score * 100).toFixed(0)}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            listEl.innerHTML = html;

        } catch (error) {
            listEl.innerHTML = '<div class="error">Failed to load predictions</div>';
        }
    }

    renderChart(data) {
        const canvas = document.getElementById('forecast-chart');
        const ctx = canvas.getContext('2d');

        // Simple bar chart
        const chartData = data.cashflow.slice(0, 12); // Show first 12 periods

        canvas.width = canvas.offsetWidth;
        canvas.height = 300;

        const maxAmount = Math.max(...chartData.map(d => d.cumulative || d.amount));
        const barWidth = canvas.width / chartData.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bars
        chartData.forEach((item, i) => {
            const amount = item.cumulative || item.amount;
            const barHeight = (amount / maxAmount) * (canvas.height - 40);
            const x = i * barWidth;
            const y = canvas.height - barHeight - 20;

            ctx.fillStyle = '#2196f3';
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

            // Label
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const label = item.date ? item.date.substring(5) : item.period;
            ctx.fillText(label, x + barWidth / 2, canvas.height - 5);
        });
    }

    changeScenario(scenario) {
        this.state.scenario = scenario;
        this.loadCashflowForecast();
    }

    changeGranularity(granularity) {
        this.state.granularity = granularity;
        this.refreshForecast();
    }

    getRiskColor(riskScore) {
        if (riskScore >= 0.8) return '#d32f2f';
        if (riskScore >= 0.6) return '#f57c00';
        if (riskScore >= 0.4) return '#fbc02d';
        return '#388e3c';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('sl-SI', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    addStyles() {
        if (document.getElementById('forecast-viz-styles')) return;

        const style = document.createElement('style');
        style.id = 'forecast-viz-styles';
        style.textContent = `
            .forecast-viz-container {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
            }

            .forecast-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .forecast-header h2 {
                margin: 0;
            }

            .forecast-controls {
                display: flex;
                gap: 10px;
            }

            .forecast-controls select, .refresh-btn {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            .refresh-btn {
                background: #2196f3;
                color: white;
                border: none;
                cursor: pointer;
            }

            .forecast-overview {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .overview-card {
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }

            .overview-label {
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
            }

            .overview-value {
                font-size: 28px;
                font-weight: bold;
                color: #2196f3;
            }

            .overview-value.risk {
                color: #f44336;
            }

            .chart-container, .timeseries-container, .predictions-container, .alerts-container {
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .chart-container h3, .timeseries-container h3, .predictions-container h3, .alerts-container h3 {
                margin: 0 0 15px 0;
            }

            #forecast-chart {
                width: 100%;
                height: 300px;
            }

            .trend-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 15px;
            }

            .trend-item {
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }

            .trend-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 12px;
            }

            .trend-badge.increasing {
                background: #4caf50;
                color: white;
            }

            .trend-badge.decreasing {
                background: #f44336;
                color: white;
            }

            .model-performance {
                padding: 10px;
                background: #e3f2fd;
                border-radius: 4px;
                font-size: 13px;
            }

            .predictions-controls {
                margin-bottom: 15px;
            }

            .load-btn {
                padding: 8px 16px;
                background: #2196f3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
            }

            .load-btn.risk {
                background: #f44336;
            }

            .predictions-table {
                width: 100%;
                border-collapse: collapse;
            }

            .predictions-table th {
                background: #f5f5f5;
                padding: 10px;
                text-align: left;
                border-bottom: 2px solid #ddd;
            }

            .predictions-table td {
                padding: 10px;
                border-bottom: 1px solid #eee;
            }

            .risk-badge {
                padding: 4px 8px;
                border-radius: 12px;
                color: white;
                font-size: 11px;
                font-weight: bold;
            }

            .alert-item {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin-bottom: 10px;
                border-radius: 4px;
            }

            .alert-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .alert-details {
                font-size: 13px;
                color: #666;
                line-height: 1.6;
            }

            .empty-state, .loading, .error {
                text-align: center;
                padding: 40px;
                color: #999;
            }

            .error {
                color: #f44336;
            }
        `;

        document.head.appendChild(style);
    }

    init() {
        this.refreshForecast();
    }
}

// Global instance
const forecastViz = new ForecastVisualization();

/**
 * AI Forecast Integration with Cash Flow Module
 * Adds AI forecasting capabilities to the existing CF module
 * Version: 1.0.0
 */

const AIForecastIntegration = {
    apiBaseUrl: 'http://54.172.17.102:8000/api/v1',

    /**
     * Add AI Forecast button to Cash Flow module
     */
    addAIForecastButton() {
        // Find the CF toolbar or header
        const cfContainer = document.getElementById('cashflow-container');
        if (!cfContainer) {
            console.error('Cash flow container not found');
            return;
        }

        // Check if button already exists
        if (document.getElementById('ai-forecast-btn')) {
            return;
        }

        // Create AI Forecast button
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'position: fixed; top: 150px; right: 20px; z-index: 1000;';
        btnContainer.innerHTML = `
            <button id="ai-forecast-btn" class="ai-forecast-toggle-btn"
                    onclick="AIForecastIntegration.openForecastPanel()">
                AI Forecast
            </button>
        `;

        document.body.appendChild(btnContainer);

        // Add styles
        this.addStyles();
    },

    /**
     * Open AI forecast panel
     */
    openForecastPanel() {
        // Check if panel already exists
        let panel = document.getElementById('ai-forecast-panel');

        if (panel) {
            // Toggle visibility
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            return;
        }

        // Create panel
        panel = document.createElement('div');
        panel.id = 'ai-forecast-panel';
        panel.className = 'ai-forecast-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>AI Cash Flow Forecast</h3>
                <button onclick="AIForecastIntegration.closeForecastPanel()" class="close-btn">×</button>
            </div>
            <div class="panel-content">
                <div class="forecast-quick-stats">
                    <h4>Quick Stats</h4>
                    <div id="quick-stats-content">Loading...</div>
                </div>

                <div class="forecast-actions">
                    <button onclick="AIForecastIntegration.loadQuickForecast()" class="action-btn">
                        Load Forecast
                    </button>
                    <button onclick="AIForecastIntegration.importToGrid()" class="action-btn">
                        Import to Grid
                    </button>
                    <button onclick="AIForecastIntegration.openFullDashboard()" class="action-btn primary">
                        Full Dashboard
                    </button>
                </div>

                <div class="forecast-preview">
                    <h4>Next 30 Days Forecast</h4>
                    <div id="forecast-preview-content">
                        Click "Load Forecast" to see predictions
                    </div>
                </div>

                <div class="high-risk-preview">
                    <h4>[Alert] High Risk Invoices</h4>
                    <div id="high-risk-content">Loading...</div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Load initial data
        this.loadQuickStats();
        this.loadHighRiskPreview();
    },

    /**
     * Close forecast panel
     */
    closeForecastPanel() {
        const panel = document.getElementById('ai-forecast-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    },

    /**
     * Load quick stats
     */
    async loadQuickStats() {
        const statsEl = document.getElementById('quick-stats-content');
        if (!statsEl) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/data/stats`);
            const stats = await response.json();

            statsEl.innerHTML = `
                <div class="stat-row">
                    <span class="stat-label">Customers:</span>
                    <span class="stat-value">${stats.customers}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Invoices:</span>
                    <span class="stat-value">${stats.invoices}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Payments:</span>
                    <span class="stat-value">${stats.payments}</span>
                </div>
            `;
        } catch (error) {
            statsEl.innerHTML = '<div class="error-msg">Not connected to AI backend</div>';
        }
    },

    /**
     * Load high risk preview
     */
    async loadHighRiskPreview() {
        const riskEl = document.getElementById('high-risk-content');
        if (!riskEl) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/predictions/high-risk?threshold=0.7&limit=5`);
            const data = await response.json();

            if (data.high_risk_invoices.length === 0) {
                riskEl.innerHTML = '<div class="success-msg">[OK] No high-risk invoices</div>';
                return;
            }

            riskEl.innerHTML = `
                <div class="risk-summary">
                    Total at Risk: <strong>${this.formatCurrency(data.total_amount_at_risk)}</strong>
                </div>
                ${data.high_risk_invoices.map(inv => `
                    <div class="risk-item">
                        <div class="risk-header">
                            <strong>${inv.invoice_number}</strong>
                            <span class="risk-badge">${(inv.risk_score * 100).toFixed(0)}%</span>
                        </div>
                        <div class="risk-details">
                            ${inv.customer} - ${this.formatCurrency(inv.amount)}
                        </div>
                    </div>
                `).join('')}
            `;
        } catch (error) {
            riskEl.innerHTML = '<div class="error-msg">No predictions available yet</div>';
        }
    },

    /**
     * Load quick forecast
     */
    async loadQuickForecast() {
        const previewEl = document.getElementById('forecast-preview-content');
        if (!previewEl) return;

        previewEl.innerHTML = '<div class="loading">Loading forecast...</div>';

        try {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 30);

            const response = await fetch(
                `${this.apiBaseUrl}/predictions/cashflow?` +
                `start_date=${today.toISOString().split('T')[0]}&` +
                `end_date=${endDate.toISOString().split('T')[0]}&` +
                `scenario=realistic&granularity=week`
            );
            const data = await response.json();

            if (data.cashflow.length === 0) {
                previewEl.innerHTML = '<div class="info-msg">No pending invoices to forecast</div>';
                return;
            }

            // Store forecast data for import
            this.forecastData = data;

            previewEl.innerHTML = `
                <div class="forecast-summary">
                    <strong>Total Expected:</strong> ${this.formatCurrency(data.summary.total_expected)}<br>
                    <strong>Invoices:</strong> ${data.summary.invoice_count}
                </div>
                <table class="forecast-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Amount</th>
                            <th>Cumulative</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.cashflow.slice(0, 4).map(item => `
                            <tr>
                                <td>${item.date || item.period}</td>
                                <td>${this.formatCurrency(item.amount)}</td>
                                <td>${this.formatCurrency(item.cumulative)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            previewEl.innerHTML = '<div class="error-msg">Failed to load forecast</div>';
        }
    },

    /**
     * Import forecast to Cash Flow grid
     */
    importToGrid() {
        if (!this.forecastData) {
            alert('Please load forecast first');
            return;
        }

        if (!confirm('Import AI forecast to Cash Flow grid? This will update receipt values.')) {
            return;
        }

        // Access CashFlow module
        if (typeof CashFlow === 'undefined') {
            alert('Cash Flow module not loaded');
            return;
        }

        // Import logic: map forecast to CF grid dates
        const forecast = this.forecastData;

        forecast.cashflow.forEach(item => {
            const date = new Date(item.date || item.start_date);
            const month = date.getMonth() + 1;
            const day = date.getDate();

            // Update receipts for this date
            const key = `${this.state.currentYear}_${month}_${day}`;
            if (CashFlow.state.data.receipts.values[key] !== undefined) {
                CashFlow.state.data.receipts.values[key] = item.amount;
                CashFlow.state.editedCells.add(`receipts_${key}`);
            }
        });

        // Recalculate and re-render
        CashFlow.recalculateFormulas();
        CashFlow.renderCashFlowGrid();
        CashFlow.state.unsavedChanges = true;

        alert('Forecast imported successfully!');
        this.closeForecastPanel();
    },

    /**
     * Open full AI dashboard
     */
    openFullDashboard() {
        // Navigate to AI forecast module
        window.location.href = '/ai-forecast.html';
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('sl-SI', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    /**
     * Add styles
     */
    addStyles() {
        if (document.getElementById('ai-forecast-integration-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-forecast-integration-styles';
        style.textContent = `
            .ai-forecast-toggle-btn {
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                transition: transform 0.2s;
            }

            .ai-forecast-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
            }

            .ai-forecast-panel {
                position: fixed;
                right: 20px;
                top: 200px;
                width: 400px;
                max-height: 70vh;
                background: white;
                border: 2px solid #ddd;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                z-index: 9999;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .panel-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .panel-header h3 {
                margin: 0;
                font-size: 18px;
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }

            .panel-content {
                padding: 15px;
                overflow-y: auto;
            }

            .forecast-quick-stats, .forecast-actions, .forecast-preview, .high-risk-preview {
                margin-bottom: 20px;
            }

            .forecast-quick-stats h4, .forecast-preview h4, .high-risk-preview h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .stat-label {
                color: #666;
            }

            .stat-value {
                font-weight: bold;
            }

            .forecast-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .action-btn {
                padding: 10px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }

            .action-btn:hover {
                background: #e0e0e0;
            }

            .action-btn.primary {
                background: #2196f3;
                color: white;
                border-color: #2196f3;
            }

            .action-btn.primary:hover {
                background: #1976d2;
            }

            .forecast-summary, .risk-summary {
                padding: 10px;
                background: #f0f8ff;
                border-radius: 6px;
                margin-bottom: 10px;
                font-size: 13px;
                line-height: 1.6;
            }

            .forecast-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }

            .forecast-table th {
                background: #f5f5f5;
                padding: 6px;
                text-align: left;
                border-bottom: 2px solid #ddd;
            }

            .forecast-table td {
                padding: 6px;
                border-bottom: 1px solid #eee;
            }

            .risk-item {
                background: #fff3cd;
                padding: 8px;
                margin-bottom: 8px;
                border-radius: 4px;
                font-size: 12px;
            }

            .risk-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }

            .risk-badge {
                background: #f44336;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: bold;
            }

            .risk-details {
                color: #666;
                font-size: 11px;
            }

            .loading, .error-msg, .info-msg, .success-msg {
                padding: 10px;
                text-align: center;
                border-radius: 6px;
                font-size: 13px;
            }

            .loading {
                background: #f5f5f5;
                color: #666;
            }

            .error-msg {
                background: #ffebee;
                color: #c62828;
            }

            .info-msg {
                background: #e3f2fd;
                color: #1565c0;
            }

            .success-msg {
                background: #e8f5e9;
                color: #2e7d32;
            }
        `;

        document.head.appendChild(style);
    },

    /**
     * Initialize integration
     */
    init() {
        console.log('AI Forecast Integration initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.addAIForecastButton();
            });
        } else {
            this.addAIForecastButton();
        }
    }
};

// Auto-initialize when script loads
AIForecastIntegration.init();

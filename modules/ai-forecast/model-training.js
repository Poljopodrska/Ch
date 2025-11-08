/**
 * AI Forecasting - Model Training Dashboard
 * Train and manage ML models
 * Version: 1.0.0
 */

class ModelTraining {
    constructor() {
        this.apiBaseUrl = 'http://54.172.17.102:8000/api/v1';
        this.state = {
            models: [],
            training: false
        };
    }

    render() {
        const container = document.createElement('div');
        container.className = 'model-training-container';
        container.innerHTML = `
            <div class="model-training-header">
                <h2>Model Training</h2>
                <p>Train and manage forecasting models</p>
            </div>

            <!-- Training Actions -->
            <div class="training-actions">
                <div class="action-card">
                    <h3>Payment Predictor</h3>
                    <p>XGBoost model to predict invoice payment dates and risk</p>
                    <button onclick="modelTraining.trainModel('payment_predictor')"
                            id="train-payment-btn" class="train-btn">
                        Train Payment Predictor
                    </button>
                    <div id="payment-training-status" class="training-status"></div>
                </div>

                <div class="action-card">
                    <h3>Cash Flow Forecaster</h3>
                    <p>Prophet time series model for cash flow trends and seasonality</p>
                    <button onclick="modelTraining.trainModel('cashflow_forecaster')"
                            id="train-cashflow-btn" class="train-btn">
                        Train Cash Flow Forecaster
                    </button>
                    <div id="cashflow-training-status" class="training-status"></div>
                </div>
            </div>

            <!-- Model List -->
            <div class="models-section">
                <div class="models-header">
                    <h3>Trained Models</h3>
                    <button onclick="modelTraining.loadModels()" class="refresh-btn">
                        Refresh
                    </button>
                </div>
                <div id="models-list">Loading models...</div>
            </div>
        `;

        this.addStyles();
        return container;
    }

    async trainModel(modelType) {
        const btnId = modelType === 'payment_predictor' ? 'train-payment-btn' : 'train-cashflow-btn';
        const statusId = modelType === 'payment_predictor' ? 'payment-training-status' : 'cashflow-training-status';

        const btn = document.getElementById(btnId);
        const statusEl = document.getElementById(statusId);

        if (this.state.training) {
            alert('Another model is currently training. Please wait.');
            return;
        }

        if (!confirm(`Start training ${modelType}? This may take several minutes.`)) {
            return;
        }

        try {
            this.state.training = true;
            btn.disabled = true;
            btn.textContent = 'Training...';
            statusEl.innerHTML = '<div class="training-progress">[Processing] Training in progress...</div>';

            const response = await fetch(`${this.apiBaseUrl}/models/train?model_type=${modelType}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                statusEl.innerHTML = `
                    <div class="training-success">
                        [Success] Training completed successfully!<br>
                        <strong>Version:</strong> ${result.version}<br>
                        <strong>Model ID:</strong> ${result.model_id}<br>
                        <details>
                            <summary>View Metrics</summary>
                            <pre>${JSON.stringify(result.metrics, null, 2)}</pre>
                        </details>
                    </div>
                `;

                // Reload models list
                this.loadModels();
            } else {
                throw new Error(result.detail || 'Training failed');
            }
        } catch (error) {
            statusEl.innerHTML = `
                <div class="training-error">
                    [Error] Training failed: ${error.message}
                </div>
            `;
        } finally {
            this.state.training = false;
            btn.disabled = false;
            btn.textContent = modelType === 'payment_predictor' ?
                'Train Payment Predictor' : 'Train Cash Flow Forecaster';
        }
    }

    async loadModels() {
        const modelsListEl = document.getElementById('models-list');

        try {
            modelsListEl.innerHTML = '<div class="loading">Loading models...</div>';

            const response = await fetch(`${this.apiBaseUrl}/models/models`);
            const data = await response.json();

            if (data.models.length === 0) {
                modelsListEl.innerHTML = '<div class="empty-state">No models trained yet. Train your first model above!</div>';
                return;
            }

            this.state.models = data.models;

            modelsListEl.innerHTML = data.models.map(model => `
                <div class="model-card ${model.is_active ? 'active' : ''}">
                    <div class="model-header">
                        <div class="model-title">
                            <span class="model-icon">${model.name === 'payment_predictor' ? '[P]' : '[CF]'}</span>
                            <strong>${this.formatModelName(model.name)}</strong>
                            ${model.is_active ? '<span class="active-badge">ACTIVE</span>' : ''}
                        </div>
                        <div class="model-actions">
                            ${!model.is_active ? `
                                <button onclick="modelTraining.activateModel(${model.id})"
                                        class="activate-btn">
                                    Activate
                                </button>
                            ` : ''}
                            <button onclick="modelTraining.viewModelDetails(${model.id})"
                                    class="details-btn">
                                Details
                            </button>
                        </div>
                    </div>
                    <div class="model-info">
                        <div class="info-item">
                            <span class="info-label">Version:</span>
                            <span class="info-value">${model.version}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Type:</span>
                            <span class="info-value">${model.model_type}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Trained:</span>
                            <span class="info-value">${new Date(model.created_at).toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Training Samples:</span>
                            <span class="info-value">${model.training_samples}</span>
                        </div>
                    </div>
                    ${model.metrics ? `
                        <details class="model-metrics">
                            <summary>Performance Metrics</summary>
                            <pre>${JSON.stringify(model.metrics, null, 2)}</pre>
                        </details>
                    ` : ''}
                </div>
            `).join('');

        } catch (error) {
            modelsListEl.innerHTML = `<div class="error-message">Failed to load models: ${error.message}</div>`;
        }
    }

    async activateModel(modelId) {
        if (!confirm('Activate this model? It will replace the currently active model.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/models/models/${modelId}/activate`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                alert('Model activated successfully!');
                this.loadModels();
            } else {
                throw new Error(result.detail || 'Activation failed');
            }
        } catch (error) {
            alert(`Failed to activate model: ${error.message}`);
        }
    }

    async viewModelDetails(modelId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/models/models/${modelId}`);
            const model = await response.json();

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Model Details</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">×</button>
                    </div>
                    <div class="modal-body">
                        <table class="details-table">
                            <tr><th>ID</th><td>${model.id}</td></tr>
                            <tr><th>Name</th><td>${this.formatModelName(model.name)}</td></tr>
                            <tr><th>Version</th><td>${model.version}</td></tr>
                            <tr><th>Type</th><td>${model.model_type}</td></tr>
                            <tr><th>Status</th><td>${model.is_active ? '<span class="active-badge">ACTIVE</span>' : 'Inactive'}</td></tr>
                            <tr><th>Created</th><td>${new Date(model.created_at).toLocaleString()}</td></tr>
                            <tr><th>Training Samples</th><td>${model.training_samples}</td></tr>
                            <tr><th>Test Samples</th><td>${model.test_samples}</td></tr>
                        </table>
                        ${model.metrics ? `
                            <h4>Performance Metrics</h4>
                            <pre class="metrics-json">${JSON.stringify(model.metrics, null, 2)}</pre>
                        ` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        } catch (error) {
            alert(`Failed to load model details: ${error.message}`);
        }
    }

    formatModelName(name) {
        return name.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    addStyles() {
        if (document.getElementById('model-training-styles')) return;

        const style = document.createElement('style');
        style.id = 'model-training-styles';
        style.textContent = `
            .model-training-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .model-training-header {
                margin-bottom: 30px;
            }

            .model-training-header h2 {
                margin: 0 0 10px 0;
                font-size: 24px;
            }

            .training-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .action-card {
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
            }

            .action-card h3 {
                margin: 0 0 10px 0;
                font-size: 18px;
            }

            .action-card p {
                color: #666;
                margin: 0 0 15px 0;
                font-size: 14px;
            }

            .train-btn {
                width: 100%;
                padding: 12px;
                background: var(--ch-success);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
            }

            .train-btn:hover:not(:disabled) {
                background: #45a049;
            }

            .train-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }

            .training-status {
                margin-top: 15px;
                min-height: 40px;
            }

            .training-progress {
                padding: 10px;
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                border-radius: 4px;
                animation: pulse 1.5s infinite;
            }

            .training-success {
                padding: 10px;
                background: #e8f5e9;
                border-left: 4px solid #4caf50;
                border-radius: 4px;
                font-size: 13px;
                line-height: 1.8;
            }

            .training-error {
                padding: 10px;
                background: #ffebee;
                border-left: 4px solid #f44336;
                border-radius: 4px;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .models-section {
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
            }

            .models-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .models-header h3 {
                margin: 0;
            }

            .refresh-btn {
                padding: 8px 16px;
                background: #607d8b;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            .model-card {
                background: #f9f9f9;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            }

            .model-card.active {
                border-color: #4caf50;
                background: #f1f8f4;
            }

            .model-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .model-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
            }

            .model-icon {
                font-size: 20px;
            }

            .active-badge {
                background: var(--ch-success);
                color: white;
                padding: 3px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
            }

            .model-actions {
                display: flex;
                gap: 8px;
            }

            .activate-btn, .details-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .activate-btn {
                background: var(--ch-primary);
                color: white;
            }

            .details-btn {
                background: #9c27b0;
                color: white;
            }

            .model-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 10px;
            }

            .info-item {
                font-size: 13px;
            }

            .info-label {
                color: #666;
                margin-right: 5px;
            }

            .info-value {
                font-weight: bold;
            }

            .model-metrics {
                margin-top: 10px;
            }

            .model-metrics summary {
                cursor: pointer;
                color: var(--ch-primary);
                font-size: 13px;
            }

            .model-metrics pre {
                background: white;
                padding: 10px;
                border-radius: 4px;
                font-size: 12px;
                overflow-x: auto;
                margin-top: 8px;
            }

            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }

            .modal-content {
                background: white;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #ddd;
            }

            .modal-header h3 {
                margin: 0;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #999;
            }

            .modal-body {
                padding: 20px;
            }

            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }

            .details-table th {
                text-align: left;
                padding: 8px;
                background: var(--ch-gray-100);
                width: 40%;
            }

            .details-table td {
                padding: 8px;
                border-bottom: 1px solid #eee;
            }

            .metrics-json {
                background: var(--ch-gray-100);
                padding: 15px;
                border-radius: 4px;
                font-size: 12px;
                overflow-x: auto;
            }

            .empty-state, .loading {
                text-align: center;
                padding: 40px;
                color: #999;
            }
        `;

        document.head.appendChild(style);
    }

    init() {
        this.loadModels();
    }
}

// Global instance
const modelTraining = new ModelTraining();

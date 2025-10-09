/**
 * AI Forecasting - Data Upload Module
 * Upload historical customer, invoice, and payment data
 * Version: 1.0.0
 */

class DataUpload {
    constructor() {
        this.apiBaseUrl = 'http://54.172.17.102:8000/api/v1';
        this.state = {
            uploadProgress: {
                customers: { status: 'idle', count: 0, errors: [] },
                invoices: { status: 'idle', count: 0, errors: [] },
                payments: { status: 'idle', count: 0, errors: [] }
            }
        };
    }

    render() {
        const container = document.createElement('div');
        container.className = 'data-upload-container';
        container.innerHTML = `
            <div class="data-upload-header">
                <h2>📊 Data Upload</h2>
                <p>Upload historical data to train forecasting models</p>
            </div>

            <div class="upload-sections">
                <!-- Customers Upload -->
                <div class="upload-section">
                    <div class="upload-section-header">
                        <h3>👥 Customers</h3>
                        <span class="upload-status" id="customers-status">Ready</span>
                    </div>
                    <p class="upload-description">
                        Required columns: <code>customer_code</code>, <code>name</code><br>
                        Optional: <code>segment</code>, <code>risk_score</code>
                    </p>
                    <input type="file" id="customers-file" accept=".csv,.xlsx,.xls">
                    <button onclick="dataUpload.uploadFile('customers')" class="upload-btn">
                        Upload Customers
                    </button>
                    <div id="customers-result" class="upload-result"></div>
                </div>

                <!-- Invoices Upload -->
                <div class="upload-section">
                    <div class="upload-section-header">
                        <h3>📄 Invoices</h3>
                        <span class="upload-status" id="invoices-status">Ready</span>
                    </div>
                    <p class="upload-description">
                        Required: <code>customer_code</code>, <code>invoice_number</code>,
                        <code>invoice_date</code>, <code>due_date</code>, <code>amount</code><br>
                        Optional: <code>currency</code>, <code>product_category</code>, <code>status</code>
                    </p>
                    <input type="file" id="invoices-file" accept=".csv,.xlsx,.xls">
                    <button onclick="dataUpload.uploadFile('invoices')" class="upload-btn">
                        Upload Invoices
                    </button>
                    <div id="invoices-result" class="upload-result"></div>
                </div>

                <!-- Payments Upload -->
                <div class="upload-section">
                    <div class="upload-section-header">
                        <h3>💰 Payments</h3>
                        <span class="upload-status" id="payments-status">Ready</span>
                    </div>
                    <p class="upload-description">
                        Required: <code>invoice_number</code>, <code>payment_date</code>, <code>amount</code>
                    </p>
                    <input type="file" id="payments-file" accept=".csv,.xlsx,.xls">
                    <button onclick="dataUpload.uploadFile('payments')" class="upload-btn">
                        Upload Payments
                    </button>
                    <div id="payments-result" class="upload-result"></div>
                </div>
            </div>

            <!-- Data Statistics -->
            <div class="data-stats">
                <h3>📈 Current Database Statistics</h3>
                <div id="stats-content">Loading...</div>
                <button onclick="dataUpload.loadStats()" class="refresh-btn">Refresh Stats</button>
            </div>

            <!-- Sample Data Templates -->
            <div class="templates-section">
                <h3>📋 Sample Templates</h3>
                <button onclick="dataUpload.downloadTemplate('customers')" class="template-btn">
                    Download Customer Template
                </button>
                <button onclick="dataUpload.downloadTemplate('invoices')" class="template-btn">
                    Download Invoice Template
                </button>
                <button onclick="dataUpload.downloadTemplate('payments')" class="template-btn">
                    Download Payment Template
                </button>
            </div>
        `;

        this.addStyles();
        return container;
    }

    async uploadFile(dataType) {
        const fileInput = document.getElementById(`${dataType}-file`);
        const statusEl = document.getElementById(`${dataType}-status`);
        const resultEl = document.getElementById(`${dataType}-result`);

        if (!fileInput.files[0]) {
            alert('Please select a file first');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            statusEl.textContent = 'Uploading...';
            statusEl.className = 'upload-status uploading';
            resultEl.textContent = '';

            const response = await fetch(`${this.apiBaseUrl}/data/upload/${dataType}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                statusEl.textContent = 'Success';
                statusEl.className = 'upload-status success';

                resultEl.innerHTML = `
                    <div class="success-message">
                        ✓ Uploaded successfully<br>
                        Rows processed: ${result.rows_processed}<br>
                        Rows created: ${result.rows_created}
                        ${result.errors.length > 0 ? `<br>Errors: ${result.errors.length}` : ''}
                    </div>
                    ${result.errors.length > 0 ? `
                        <details>
                            <summary>View Errors</summary>
                            <pre>${result.errors.join('\n')}</pre>
                        </details>
                    ` : ''}
                `;

                // Refresh stats
                this.loadStats();
            } else {
                throw new Error(result.detail || 'Upload failed');
            }
        } catch (error) {
            statusEl.textContent = 'Failed';
            statusEl.className = 'upload-status error';
            resultEl.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        }
    }

    async loadStats() {
        const statsContent = document.getElementById('stats-content');

        try {
            const response = await fetch(`${this.apiBaseUrl}/data/stats`);
            const stats = await response.json();

            statsContent.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.customers}</div>
                        <div class="stat-label">Customers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.invoices}</div>
                        <div class="stat-label">Invoices</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.payments}</div>
                        <div class="stat-label">Payments</div>
                    </div>
                </div>
            `;
        } catch (error) {
            statsContent.innerHTML = `<div class="error-message">Failed to load stats: ${error.message}</div>`;
        }
    }

    downloadTemplate(dataType) {
        const templates = {
            customers: 'customer_code,name,segment,risk_score\nCUST001,Acme Corp,A,0.2\nCUST002,Beta Industries,B,0.5',
            invoices: 'customer_code,invoice_number,invoice_date,due_date,amount,currency,product_category,status\nCUST001,INV001,2024-01-15,2024-02-15,10000,EUR,Electronics,pending',
            payments: 'invoice_number,payment_date,amount\nINV001,2024-02-10,10000'
        };

        const csv = templates[dataType];
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_template.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    addStyles() {
        if (document.getElementById('data-upload-styles')) return;

        const style = document.createElement('style');
        style.id = 'data-upload-styles';
        style.textContent = `
            .data-upload-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .data-upload-header {
                margin-bottom: 30px;
            }

            .data-upload-header h2 {
                margin: 0 0 10px 0;
                font-size: 24px;
            }

            .data-upload-header p {
                margin: 0;
                color: #666;
            }

            .upload-sections {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .upload-section {
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                background: white;
            }

            .upload-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .upload-section-header h3 {
                margin: 0;
                font-size: 18px;
            }

            .upload-status {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }

            .upload-status.uploading {
                background: #ffa500;
                color: white;
            }

            .upload-status.success {
                background: #4caf50;
                color: white;
            }

            .upload-status.error {
                background: #f44336;
                color: white;
            }

            .upload-description {
                font-size: 13px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 15px;
            }

            .upload-description code {
                background: #f5f5f5;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
            }

            .upload-section input[type="file"] {
                display: block;
                width: 100%;
                margin-bottom: 10px;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            .upload-btn {
                width: 100%;
                padding: 10px;
                background: #2196f3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }

            .upload-btn:hover {
                background: #1976d2;
            }

            .upload-result {
                margin-top: 15px;
                font-size: 13px;
            }

            .success-message {
                padding: 10px;
                background: #e8f5e9;
                border-left: 4px solid #4caf50;
                border-radius: 4px;
                line-height: 1.8;
            }

            .error-message {
                padding: 10px;
                background: #ffebee;
                border-left: 4px solid #f44336;
                border-radius: 4px;
            }

            .data-stats {
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .data-stats h3 {
                margin: 0 0 15px 0;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 15px;
            }

            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }

            .stat-value {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .stat-label {
                font-size: 14px;
                opacity: 0.9;
            }

            .refresh-btn {
                padding: 8px 16px;
                background: #607d8b;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            .templates-section {
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
            }

            .templates-section h3 {
                margin: 0 0 15px 0;
            }

            .template-btn {
                padding: 8px 16px;
                background: #9c27b0;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
                margin-bottom: 10px;
            }

            .template-btn:hover {
                background: #7b1fa2;
            }

            details {
                margin-top: 10px;
            }

            details summary {
                cursor: pointer;
                color: #2196f3;
            }

            details pre {
                background: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 12px;
            }
        `;

        document.head.appendChild(style);
    }

    init() {
        this.loadStats();
    }
}

// Global instance
const dataUpload = new DataUpload();

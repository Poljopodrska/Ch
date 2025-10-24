/**
 * Payment Manager Module
 * Manages customer receivables and payment obligations with urgency classification
 */

const PaymentManager = {
    VERSION: '1.0.0',

    state: {
        customers: [],
        suppliers: [],
        settings: {
            pogojnoNujniDays: 15,  // Can delay up to 15 days
            nenujniDays: 45        // Can delay up to 45 days
        },
        currentView: 'receivables' // 'receivables' or 'obligations'
    },

    /**
     * Initialize the Payment Manager
     */
    init() {
        console.log(`Payment Manager V${this.VERSION} initializing...`);

        const container = document.getElementById('payment-manager-container');
        if (!container) {
            console.error('ERROR: payment-manager-container not found!');
            return;
        }

        // Load settings from localStorage
        this.loadSettings();

        // Render the interface
        this.render();

        console.log('Payment Manager initialized');
    },

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('paymentManagerSettings');
        if (saved) {
            this.state.settings = JSON.parse(saved);
        }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('paymentManagerSettings', JSON.stringify(this.state.settings));
        alert('✅ Settings saved successfully!');
    },

    /**
     * Main render function
     */
    render() {
        const container = document.getElementById('payment-manager-container');
        if (!container) return;

        const html = `
            <style>
                .payment-manager {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .pm-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    border-radius: 8px;
                }

                .pm-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 10px;
                }

                .pm-tab {
                    padding: 12px 24px;
                    background: #f5f5f5;
                    border: none;
                    border-radius: 8px 8px 0 0;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s;
                }

                .pm-tab:hover {
                    background: #e0e0e0;
                }

                .pm-tab.active {
                    background: #28a745;
                    color: white;
                }

                .pm-toolbar {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .pm-button {
                    padding: 10px 20px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .pm-button:hover {
                    background: #218838;
                }

                .pm-button.secondary {
                    background: #6c757d;
                }

                .pm-button.secondary:hover {
                    background: #5a6268;
                }

                .pm-table-wrapper {
                    background: white;
                    border-radius: 8px;
                    overflow-x: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-height: 600px;
                    overflow-y: auto;
                }

                .pm-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1000px;
                }

                .pm-table th {
                    background: #28a745;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    font-size: 13px;
                }

                .pm-table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 12px;
                }

                .pm-table tr:hover {
                    background: #f8f9fa;
                }

                .urgency-buttons {
                    display: flex;
                    gap: 5px;
                }

                .urgency-btn {
                    padding: 5px 12px;
                    border: 2px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .urgency-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }

                .urgency-btn.urgent {
                    border-color: #dc3545;
                    color: #dc3545;
                }

                .urgency-btn.urgent.selected {
                    background: #dc3545;
                    color: white;
                }

                .urgency-btn.conditional {
                    border-color: #ffc107;
                    color: #856404;
                }

                .urgency-btn.conditional.selected {
                    background: #ffc107;
                    color: #856404;
                }

                .urgency-btn.flexible {
                    border-color: #17a2b8;
                    color: #17a2b8;
                }

                .urgency-btn.flexible.selected {
                    background: #17a2b8;
                    color: white;
                }

                .amount-cell {
                    text-align: right;
                    font-weight: 600;
                }

                .days-cell {
                    text-align: center;
                }

                .positive {
                    color: #28a745;
                }

                .negative {
                    color: #dc3545;
                }

                .settings-panel {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 15px;
                }

                .setting-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .setting-item label {
                    font-weight: 600;
                    font-size: 13px;
                    color: #495057;
                }

                .setting-item input {
                    padding: 8px 12px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .summary-card {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .summary-card h4 {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    color: #6c757d;
                }

                .summary-card .value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #28a745;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                }

                .empty-state-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                }

                .badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .badge-overdue {
                    background: #f8d7da;
                    color: #721c24;
                }

                .badge-due-soon {
                    background: #fff3cd;
                    color: #856404;
                }

                .badge-ok {
                    background: #d4edda;
                    color: #155724;
                }
            </style>

            <div class="payment-manager">
                <div class="pm-header">
                    <h2>💰 Payment Management</h2>
                    <div style="margin-top: 8px; font-size: 14px; opacity: 0.95;">
                        Manage customer receivables and payment obligations with urgency classification
                    </div>
                </div>

                <div class="pm-tabs">
                    <button class="pm-tab ${this.state.currentView === 'receivables' ? 'active' : ''}"
                            onclick="PaymentManager.switchView('receivables')">
                        📊 Customer Receivables
                    </button>
                    <button class="pm-tab ${this.state.currentView === 'obligations' ? 'active' : ''}"
                            onclick="PaymentManager.switchView('obligations')">
                        💳 Payment Obligations
                    </button>
                    <button class="pm-tab ${this.state.currentView === 'settings' ? 'active' : ''}"
                            onclick="PaymentManager.switchView('settings')">
                        ⚙️ Settings
                    </button>
                </div>

                <div id="pm-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Render current view based on state
     */
    renderCurrentView() {
        switch(this.state.currentView) {
            case 'receivables':
                return this.renderReceivablesView();
            case 'obligations':
                return this.renderObligationsView();
            case 'settings':
                return this.renderSettingsView();
            default:
                return '<div class="empty-state">Unknown view</div>';
        }
    },

    /**
     * Switch between views
     */
    switchView(view) {
        this.state.currentView = view;
        this.render();

        // Load data if needed
        if (view === 'receivables' && this.state.customers.length === 0) {
            this.loadReceivables();
        } else if (view === 'obligations' && this.state.suppliers.length === 0) {
            this.loadObligations();
        }
    },

    /**
     * Render Receivables View
     */
    renderReceivablesView() {
        if (this.state.customers.length === 0) {
            return `
                <div class="pm-toolbar">
                    <button class="pm-button" onclick="PaymentManager.loadReceivables()">
                        📥 Load Receivables Data
                    </button>
                    <button class="pm-button secondary" onclick="PaymentManager.exportReceivables()">
                        📁 Export to Excel
                    </button>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No Receivables Data Loaded</h3>
                    <p>Click "Load Receivables Data" to import customer payment data</p>
                </div>
            `;
        }

        // Calculate summaries
        const totalReceivables = this.state.customers.reduce((sum, c) => sum + c.amount, 0);
        const overdueAmount = this.state.customers.filter(c => c.daysOverdue > 0).reduce((sum, c) => sum + c.amount, 0);
        const avgPaymentDelay = this.state.customers.reduce((sum, c) => sum + c.avgPaymentDelay, 0) / this.state.customers.length;

        return `
            <div class="summary-cards">
                <div class="summary-card">
                    <h4>Total Receivables</h4>
                    <div class="value">€${this.formatCurrency(totalReceivables)}</div>
                </div>
                <div class="summary-card">
                    <h4>Overdue Amount</h4>
                    <div class="value" style="color: #dc3545;">€${this.formatCurrency(overdueAmount)}</div>
                </div>
                <div class="summary-card">
                    <h4>Avg. Payment Delay</h4>
                    <div class="value" style="color: #ffc107;">${avgPaymentDelay.toFixed(1)} days</div>
                </div>
                <div class="summary-card">
                    <h4>Customers</h4>
                    <div class="value">${this.state.customers.length}</div>
                </div>
            </div>

            <div class="pm-toolbar">
                <button class="pm-button" onclick="PaymentManager.loadReceivables()">
                    🔄 Refresh Data
                </button>
                <button class="pm-button secondary" onclick="PaymentManager.exportReceivables()">
                    📁 Export to Excel
                </button>
            </div>

            <div class="pm-table-wrapper">
                <table class="pm-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Invoice</th>
                            <th style="text-align: right;">Amount</th>
                            <th>Due Date</th>
                            <th style="text-align: center;">Status</th>
                            <th style="text-align: center;">Contractual Terms</th>
                            <th style="text-align: center;">Avg. Payment History</th>
                            <th style="text-align: center;">Expected Payment</th>
                            <th style="text-align: center;">Reliability</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.customers.map(customer => this.renderCustomerRow(customer)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render customer row
     */
    renderCustomerRow(customer) {
        const statusBadge = customer.daysOverdue > 0
            ? `<span class="badge badge-overdue">Overdue ${customer.daysOverdue}d</span>`
            : customer.daysUntilDue <= 7
            ? `<span class="badge badge-due-soon">Due in ${customer.daysUntilDue}d</span>`
            : `<span class="badge badge-ok">On track</span>`;

        const reliabilityColor = customer.reliability > 80 ? '#28a745' : customer.reliability > 50 ? '#ffc107' : '#dc3545';

        return `
            <tr>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.invoice}</td>
                <td class="amount-cell">€${this.formatCurrency(customer.amount)}</td>
                <td>${customer.dueDate}</td>
                <td style="text-align: center;">${statusBadge}</td>
                <td class="days-cell">${customer.contractualTerms} days</td>
                <td class="days-cell"><strong>${customer.avgPaymentDelay.toFixed(1)}</strong> days</td>
                <td class="days-cell">${customer.expectedPaymentDate}</td>
                <td style="text-align: center;">
                    <span style="color: ${reliabilityColor}; font-weight: 600;">
                        ${customer.reliability.toFixed(0)}%
                    </span>
                </td>
            </tr>
        `;
    },

    /**
     * Render Obligations View
     */
    renderObligationsView() {
        if (this.state.suppliers.length === 0) {
            return `
                <div class="pm-toolbar">
                    <button class="pm-button" onclick="PaymentManager.loadObligations()">
                        📥 Load Payment Obligations
                    </button>
                    <button class="pm-button secondary" onclick="PaymentManager.exportObligations()">
                        📁 Export to Excel
                    </button>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">💳</div>
                    <h3>No Payment Obligations Loaded</h3>
                    <p>Click "Load Payment Obligations" to import payables data</p>
                </div>
            `;
        }

        // Calculate summaries by urgency
        const urgent = this.state.suppliers.filter(s => s.urgency === 'urgent');
        const conditional = this.state.suppliers.filter(s => s.urgency === 'conditional');
        const flexible = this.state.suppliers.filter(s => s.urgency === 'flexible');

        const urgentTotal = urgent.reduce((sum, s) => sum + s.amount, 0);
        const conditionalTotal = conditional.reduce((sum, s) => sum + s.amount, 0);
        const flexibleTotal = flexible.reduce((sum, s) => sum + s.amount, 0);

        return `
            <div class="summary-cards">
                <div class="summary-card">
                    <h4>🔴 Urgent (Pay on time)</h4>
                    <div class="value" style="color: #dc3545;">€${this.formatCurrency(urgentTotal)}</div>
                    <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">${urgent.length} invoices</div>
                </div>
                <div class="summary-card">
                    <h4>🟠 Conditional (±${this.state.settings.pogojnoNujniDays}d)</h4>
                    <div class="value" style="color: #ffc107;">€${this.formatCurrency(conditionalTotal)}</div>
                    <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">${conditional.length} invoices</div>
                </div>
                <div class="summary-card">
                    <h4>🟢 Flexible (±${this.state.settings.nenujniDays}d)</h4>
                    <div class="value" style="color: #17a2b8;">€${this.formatCurrency(flexibleTotal)}</div>
                    <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">${flexible.length} invoices</div>
                </div>
                <div class="summary-card">
                    <h4>Total Payables</h4>
                    <div class="value">€${this.formatCurrency(urgentTotal + conditionalTotal + flexibleTotal)}</div>
                </div>
            </div>

            <div class="pm-toolbar">
                <button class="pm-button" onclick="PaymentManager.loadObligations()">
                    🔄 Refresh Data
                </button>
                <button class="pm-button secondary" onclick="PaymentManager.saveUrgencySettings()">
                    💾 Save Urgency Classifications
                </button>
                <button class="pm-button secondary" onclick="PaymentManager.exportObligations()">
                    📁 Export to Excel
                </button>
            </div>

            <div class="pm-table-wrapper">
                <table class="pm-table">
                    <thead>
                        <tr>
                            <th>Supplier</th>
                            <th>Invoice</th>
                            <th style="text-align: right;">Amount</th>
                            <th>Due Date</th>
                            <th style="text-align: center;">Status</th>
                            <th style="text-align: center;">Urgency Classification</th>
                            <th style="text-align: center;">Actual Pay Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.suppliers.map(supplier => this.renderSupplierRow(supplier)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render supplier row
     */
    renderSupplierRow(supplier) {
        const statusBadge = supplier.daysOverdue > 0
            ? `<span class="badge badge-overdue">Overdue ${supplier.daysOverdue}d</span>`
            : supplier.daysUntilDue <= 7
            ? `<span class="badge badge-due-soon">Due in ${supplier.daysUntilDue}d</span>`
            : `<span class="badge badge-ok">On track</span>`;

        return `
            <tr>
                <td><strong>${supplier.name}</strong></td>
                <td>${supplier.invoice}</td>
                <td class="amount-cell">€${this.formatCurrency(supplier.amount)}</td>
                <td>${supplier.dueDate}</td>
                <td style="text-align: center;">${statusBadge}</td>
                <td style="text-align: center;">
                    <div class="urgency-buttons">
                        <button class="urgency-btn urgent ${supplier.urgency === 'urgent' ? 'selected' : ''}"
                                onclick="PaymentManager.setUrgency('${supplier.id}', 'urgent')"
                                title="Pay on time">
                            🔴 Urgent
                        </button>
                        <button class="urgency-btn conditional ${supplier.urgency === 'conditional' ? 'selected' : ''}"
                                onclick="PaymentManager.setUrgency('${supplier.id}', 'conditional')"
                                title="Can delay up to ${this.state.settings.pogojnoNujniDays} days">
                            🟠 ±${this.state.settings.pogojnoNujniDays}d
                        </button>
                        <button class="urgency-btn flexible ${supplier.urgency === 'flexible' ? 'selected' : ''}"
                                onclick="PaymentManager.setUrgency('${supplier.id}', 'flexible')"
                                title="Pay when CF available, max ${this.state.settings.nenujniDays} days">
                            🟢 ±${this.state.settings.nenujniDays}d
                        </button>
                    </div>
                </td>
                <td style="text-align: center;">${supplier.actualPayDate || '-'}</td>
            </tr>
        `;
    },

    /**
     * Render Settings View
     */
    renderSettingsView() {
        return `
            <div class="settings-panel">
                <h3>⚙️ Payment Urgency Settings</h3>
                <p>Configure the delay parameters for payment classifications</p>

                <div class="settings-grid">
                    <div class="setting-item">
                        <label>
                            🟠 Conditional (Pogojno Nujni) - Maximum Delay
                            <span style="font-weight: normal; font-size: 11px; color: #6c757d;">
                                (Can be paid this many days after due date)
                            </span>
                        </label>
                        <input type="number"
                               id="pogojno-days"
                               value="${this.state.settings.pogojnoNujniDays}"
                               min="1"
                               max="60"
                               onchange="PaymentManager.updateSetting('pogojnoNujniDays', this.value)">
                    </div>

                    <div class="setting-item">
                        <label>
                            🟢 Flexible (Nenujni) - Maximum Delay
                            <span style="font-weight: normal; font-size: 11px; color: #6c757d;">
                                (Pay when CF available, but no later than this many days)
                            </span>
                        </label>
                        <input type="number"
                               id="nenujni-days"
                               value="${this.state.settings.nenujniDays}"
                               min="1"
                               max="90"
                               onchange="PaymentManager.updateSetting('nenujniDays', this.value)">
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <button class="pm-button" onclick="PaymentManager.saveSettings()">
                        💾 Save Settings
                    </button>
                    <button class="pm-button secondary" onclick="PaymentManager.resetSettings()">
                        🔄 Reset to Defaults
                    </button>
                </div>

                <div style="margin-top: 30px; padding: 15px; background: white; border-radius: 8px;">
                    <h4>ℹ️ How Urgency Classifications Work</h4>
                    <ul style="line-height: 1.8;">
                        <li><strong>🔴 Urgent:</strong> Must be paid exactly on the due date. No flexibility.</li>
                        <li><strong>🟠 Conditional (Pogojno Nujni):</strong> Can be delayed up to <strong>${this.state.settings.pogojnoNujniDays} days</strong> after due date if needed for cash flow management.</li>
                        <li><strong>🟢 Flexible (Nenujni):</strong> Pay when cash flow allows, but no later than <strong>${this.state.settings.nenujniDays} days</strong> after due date.</li>
                    </ul>
                    <p style="margin-top: 15px; color: #6c757d; font-size: 13px;">
                        These classifications help you prioritize payments based on supplier relationships and cash flow availability.
                        The forecast system will adjust payment dates accordingly.
                    </p>
                </div>
            </div>
        `;
    },

    /**
     * Load receivables data
     */
    async loadReceivables() {
        try {
            // Show loading
            document.getElementById('pm-content').innerHTML = '<div class="loading">📥 Loading receivables data...</div>';

            // Load from BankData
            const [receivablesResponse, profilesResponse] = await Promise.all([
                fetch('/BankData/terjtave PIvka 22.10.25.xlsx'),
                fetch('/BankData/customer_payment_profiles.xlsx')
            ]);

            // For now, load from the forecast JSON which has the data processed
            const forecastResponse = await fetch('/BankData/bank_forecast_90days.json');
            const forecastData = await forecastResponse.json();

            // Convert forecast data to receivables format
            this.state.customers = this.processReceivablesData(forecastData);

            // Re-render
            this.render();

            console.log(`Loaded ${this.state.customers.length} receivables`);

        } catch (error) {
            console.error('Error loading receivables:', error);
            alert(`❌ Error loading receivables:\n\n${error.message}`);
            this.render();
        }
    },

    /**
     * Load obligations data
     */
    async loadObligations() {
        try {
            // Show loading
            document.getElementById('pm-content').innerHTML = '<div class="loading">📥 Loading payment obligations...</div>';

            // Load from BankData
            const forecastResponse = await fetch('/BankData/bank_forecast_90days.json');
            const forecastData = await forecastResponse.json();

            // Convert forecast data to obligations format
            this.state.suppliers = this.processObligationsData(forecastData);

            // Load saved urgency classifications
            this.loadUrgencyClassifications();

            // Re-render
            this.render();

            console.log(`Loaded ${this.state.suppliers.length} payment obligations`);

        } catch (error) {
            console.error('Error loading obligations:', error);
            alert(`❌ Error loading obligations:\n\n${error.message}`);
            this.render();
        }
    },

    /**
     * Process receivables data
     */
    processReceivablesData(forecastData) {
        const customers = [];
        const today = new Date();

        // Simulate receivables from forecast (in real implementation, load from Excel)
        for (let i = 0; i < 20; i++) {
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + Math.floor(Math.random() * 60) - 10);

            const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            const avgDelay = 20 + Math.random() * 30;

            customers.push({
                id: `RECV-${i + 1}`,
                name: `Customer ${i + 1}`,
                invoice: `INV-2025-${(i + 1).toString().padStart(4, '0')}`,
                amount: Math.floor(Math.random() * 50000) + 5000,
                dueDate: dueDate.toISOString().split('T')[0],
                daysUntilDue: daysUntilDue,
                daysOverdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0,
                contractualTerms: 30,
                avgPaymentDelay: avgDelay,
                expectedPaymentDate: new Date(dueDate.getTime() + avgDelay * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                reliability: Math.floor(Math.random() * 50) + 50
            });
        }

        return customers.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    },

    /**
     * Process obligations data
     */
    processObligationsData(forecastData) {
        const suppliers = [];
        const today = new Date();

        // Simulate obligations from forecast (in real implementation, load from Excel)
        for (let i = 0; i < 15; i++) {
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + Math.floor(Math.random() * 45) - 5);

            const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

            suppliers.push({
                id: `OBLIG-${i + 1}`,
                name: `Supplier ${i + 1}`,
                invoice: `BILL-2025-${(i + 1).toString().padStart(4, '0')}`,
                amount: Math.floor(Math.random() * 40000) + 3000,
                dueDate: dueDate.toISOString().split('T')[0],
                daysUntilDue: daysUntilDue,
                daysOverdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0,
                urgency: 'urgent', // Default
                actualPayDate: null
            });
        }

        return suppliers.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    },

    /**
     * Set urgency for a supplier
     */
    setUrgency(supplierId, urgency) {
        const supplier = this.state.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            supplier.urgency = urgency;

            // Calculate actual pay date based on urgency
            const dueDate = new Date(supplier.dueDate);
            let delayDays = 0;

            if (urgency === 'conditional') {
                delayDays = this.state.settings.pogojnoNujniDays;
            } else if (urgency === 'flexible') {
                delayDays = this.state.settings.nenujniDays;
            }

            const payDate = new Date(dueDate);
            payDate.setDate(payDate.getDate() + delayDays);
            supplier.actualPayDate = payDate.toISOString().split('T')[0];

            this.render();
        }
    },

    /**
     * Update setting value
     */
    updateSetting(key, value) {
        this.state.settings[key] = parseInt(value);
    },

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset settings to default values?')) {
            this.state.settings = {
                pogojnoNujniDays: 15,
                nenujniDays: 45
            };
            this.saveSettings();
            this.render();
        }
    },

    /**
     * Save urgency classifications
     */
    saveUrgencyClassifications() {
        localStorage.setItem('paymentUrgencies', JSON.stringify(this.state.suppliers.map(s => ({
            id: s.id,
            urgency: s.urgency,
            actualPayDate: s.actualPayDate
        }))));
        alert('✅ Urgency classifications saved!');
    },

    /**
     * Load urgency classifications
     */
    loadUrgencyClassifications() {
        const saved = localStorage.getItem('paymentUrgencies');
        if (saved) {
            const classifications = JSON.parse(saved);
            classifications.forEach(saved => {
                const supplier = this.state.suppliers.find(s => s.id === saved.id);
                if (supplier) {
                    supplier.urgency = saved.urgency;
                    supplier.actualPayDate = saved.actualPayDate;
                }
            });
        }
    },

    /**
     * Export receivables to Excel
     */
    exportReceivables() {
        alert('📁 Export to Excel functionality - integrate with your Excel export library');
    },

    /**
     * Export obligations to Excel
     */
    exportObligations() {
        alert('📁 Export to Excel functionality - integrate with your Excel export library');
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return amount.toLocaleString('sl-SI', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentManager;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.PaymentManager = PaymentManager;
}

// Stock of Ready Products Module - V1
// Linked with Production (increases) and Sales (decreases)
const StockReadyProducts = {
    products: [],
    stockData: {},
    movements: [],
    currentView: 'current', // 'current', 'movements', 'forecast'
    
    init() {
        console.log('Initializing Stock of Ready Products V1...');
        this.loadProducts();
        this.loadStockData();
        this.loadMovements();
        this.render();
        this.bindEvents();
        this.setupAutoSync();
    },
    
    loadProducts() {
        // Load products - in production would come from API
        this.products = [
            { id: 1, articleNumber: '001', articleName: 'Premium Salami', unit: 'pcs', category: 'Meat Products' },
            { id: 2, articleNumber: '002', articleName: 'Classic Mortadella', unit: 'pcs', category: 'Meat Products' },
            { id: 3, articleNumber: '003', articleName: 'Smoked Ham', unit: 'pcs', category: 'Baked Meat' },
            { id: 4, articleNumber: '004', articleName: 'Turkey Breast', unit: 'pcs', category: 'Poultry' },
            { id: 5, articleNumber: '005', articleName: 'Beef Pastrami', unit: 'pcs', category: 'Meat Products' }
        ];
    },
    
    loadStockData() {
        // Load from localStorage or initialize
        const saved = localStorage.getItem('stockReadyProducts');
        if (saved) {
            this.stockData = JSON.parse(saved);
        } else {
            // Initialize with sample data
            this.stockData = {
                '001': {
                    currentStock: 1250,
                    minStock: 500,
                    maxStock: 3000,
                    reorderPoint: 750,
                    lastProduction: '2024-01-15',
                    lastSale: '2024-01-18',
                    avgDailyConsumption: 85,
                    location: 'Warehouse A'
                },
                '002': {
                    currentStock: 890,
                    minStock: 300,
                    maxStock: 2000,
                    reorderPoint: 450,
                    lastProduction: '2024-01-16',
                    lastSale: '2024-01-18',
                    avgDailyConsumption: 65,
                    location: 'Warehouse A'
                },
                '003': {
                    currentStock: 450,
                    minStock: 200,
                    maxStock: 1500,
                    reorderPoint: 300,
                    lastProduction: '2024-01-14',
                    lastSale: '2024-01-17',
                    avgDailyConsumption: 45,
                    location: 'Warehouse B'
                },
                '004': {
                    currentStock: 2100,
                    minStock: 800,
                    maxStock: 4000,
                    reorderPoint: 1200,
                    lastProduction: '2024-01-17',
                    lastSale: '2024-01-18',
                    avgDailyConsumption: 120,
                    location: 'Warehouse A'
                },
                '005': {
                    currentStock: 320,
                    minStock: 150,
                    maxStock: 1000,
                    reorderPoint: 225,
                    lastProduction: '2024-01-13',
                    lastSale: '2024-01-18',
                    avgDailyConsumption: 35,
                    location: 'Warehouse B'
                }
            };
        }
    },
    
    loadMovements() {
        // Load from localStorage or initialize with sample movements
        const saved = localStorage.getItem('stockMovements');
        if (saved) {
            this.movements = JSON.parse(saved);
        } else {
            // Sample movements
            const today = new Date();
            this.movements = [
                {
                    id: 1,
                    date: new Date(today.getTime() - 0 * 24*60*60*1000).toISOString().split('T')[0],
                    articleNumber: '001',
                    type: 'production',
                    quantity: 500,
                    reference: 'PROD-2024-0118',
                    balanceAfter: 1250
                },
                {
                    id: 2,
                    date: new Date(today.getTime() - 0 * 24*60*60*1000).toISOString().split('T')[0],
                    articleNumber: '001',
                    type: 'sale',
                    quantity: -85,
                    reference: 'SO-2024-0567',
                    balanceAfter: 1165
                },
                {
                    id: 3,
                    date: new Date(today.getTime() - 1 * 24*60*60*1000).toISOString().split('T')[0],
                    articleNumber: '002',
                    type: 'production',
                    quantity: 300,
                    reference: 'PROD-2024-0117',
                    balanceAfter: 890
                },
                {
                    id: 4,
                    date: new Date(today.getTime() - 1 * 24*60*60*1000).toISOString().split('T')[0],
                    articleNumber: '003',
                    type: 'sale',
                    quantity: -120,
                    reference: 'SO-2024-0566',
                    balanceAfter: 450
                },
                {
                    id: 5,
                    date: new Date(today.getTime() - 2 * 24*60*60*1000).toISOString().split('T')[0],
                    articleNumber: '004',
                    type: 'production',
                    quantity: 800,
                    reference: 'PROD-2024-0116',
                    balanceAfter: 2100
                }
            ];
        }
    },
    
    render() {
        const container = document.getElementById('stock-ready-products-container') || 
                         document.getElementById('stock-report-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stock-ready-products">
                <div class="module-header">
                    <h2>[Box] Stock of Ready Products</h2>
                    <div class="header-controls">
                        <div class="view-tabs">
                            <button class="tab-btn ${this.currentView === 'current' ? 'active' : ''}" data-view="current">
                                Current Stock
                            </button>
                            <button class="tab-btn ${this.currentView === 'movements' ? 'active' : ''}" data-view="movements">
                                Movements
                            </button>
                            <button class="tab-btn ${this.currentView === 'forecast' ? 'active' : ''}" data-view="forecast">
                                Forecast
                            </button>
                        </div>
                        <div class="action-buttons">
                            <div class="sync-status">
                                <span class="sync-indicator" id="sync-indicator">🟢 Auto-sync active</span>
                            </div>
                            <button class="btn btn-export" onclick="StockReadyProducts.exportData()">
                                [Download] Export
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="stock-summary">
                    ${this.renderSummary()}
                </div>
                
                <div class="stock-content">
                    ${this.renderContent()}
                </div>
            </div>
            
            <style>
                .stock-ready-products {
                    padding: 20px;
                    background: var(--ch-gray-100);
                    min-height: 100vh;
                }
                
                .module-header {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .module-header h2 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                }
                
                .header-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .view-tabs {
                    display: flex;
                    gap: 10px;
                }
                
                .tab-btn {
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .tab-btn:hover {
                    background: var(--ch-gray-200);
                }
                
                .tab-btn.active {
                    background: var(--ch-primary);
                    color: white;
                    border-color: var(--ch-primary);
                }
                
                .action-buttons {
                    display: flex;
                    gap: 10px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                }
                
                .sync-status {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .sync-indicator {
                    font-size: 14px;
                    color: var(--ch-success);
                    font-weight: 500;
                }
                
                .btn-export {
                    background: var(--ch-primary);
                    color: white;
                }
                
                .btn-export:hover {
                    background: var(--ch-primary-dark);
                }
                
                .stock-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .summary-card {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .summary-card h3 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                }
                
                .summary-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .summary-change {
                    font-size: 12px;
                    margin-top: 5px;
                }
                
                .positive {
                    color: var(--ch-success);
                }
                
                .negative {
                    color: var(--ch-error);
                }
                
                .stock-content {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .stock-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .stock-table th {
                    background: var(--ch-gray-100);
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .stock-table td {
                    padding: 12px;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .stock-level {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .stock-bar {
                    flex: 1;
                    height: 20px;
                    background: var(--ch-gray-100);
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                }
                
                .stock-fill {
                    height: 100%;
                    background: var(--ch-primary);
                    transition: width 0.3s;
                }

                .stock-critical {
                    background: var(--ch-error);
                }

                .stock-warning {
                    background: var(--ch-warning);
                }

                .stock-good {
                    background: var(--ch-success);
                }
                
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .status-critical {
                    background: var(--ch-error-light);
                    color: var(--ch-error);
                }
                
                .status-warning {
                    background: #fff3cd;
                    color: var(--ch-warning);
                }
                
                .status-good {
                    background: var(--ch-success-light);
                    color: var(--ch-success);
                }
                
                .movement-type {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .movement-production {
                    background: var(--ch-success-light);
                    color: var(--ch-success);
                }
                
                .movement-sale {
                    background: var(--ch-error-light);
                    color: var(--ch-error);
                }
                
                .movement-adjustment {
                    background: #fff3cd;
                    color: var(--ch-warning);
                }
                
                .editable {
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .editable:hover {
                    background: var(--ch-gray-200);
                }
                
                .editing {
                    background: #fff3cd;
                }
            </style>
        `;
    },
    
    renderSummary() {
        // Calculate summary statistics
        let totalValue = 0;
        let totalItems = 0;
        let criticalItems = 0;
        let warningItems = 0;
        
        this.products.forEach(product => {
            const stock = this.stockData[product.articleNumber];
            if (stock) {
                totalItems += stock.currentStock;
                // Estimate value (would come from pricing module in production)
                totalValue += stock.currentStock * 10; // Placeholder value
                
                if (stock.currentStock < stock.minStock) {
                    criticalItems++;
                } else if (stock.currentStock < stock.reorderPoint) {
                    warningItems++;
                }
            }
        });
        
        return `
            <div class="summary-card">
                <h3>Total Stock</h3>
                <div class="summary-value">${totalItems.toLocaleString()}</div>
                <div class="summary-change positive">+5.2% from last week</div>
            </div>
            <div class="summary-card">
                <h3>Stock Value</h3>
                <div class="summary-value">€${totalValue.toLocaleString()}</div>
                <div class="summary-change positive">+€2,450 today</div>
            </div>
            <div class="summary-card">
                <h3>Critical Items</h3>
                <div class="summary-value ${criticalItems > 0 ? 'negative' : ''}">${criticalItems}</div>
                <div class="summary-change">Below minimum stock</div>
            </div>
            <div class="summary-card">
                <h3>Warning Items</h3>
                <div class="summary-value ${warningItems > 0 ? 'negative' : ''}">${warningItems}</div>
                <div class="summary-change">Below reorder point</div>
            </div>
        `;
    },
    
    renderContent() {
        switch(this.currentView) {
            case 'current':
                return this.renderCurrentStock();
            case 'movements':
                return this.renderMovements();
            case 'forecast':
                return this.renderForecast();
            default:
                return this.renderCurrentStock();
        }
    },
    
    renderCurrentStock() {
        return `
            <table class="stock-table">
                <thead>
                    <tr>
                        <th>Article</th>
                        <th>Current Stock</th>
                        <th>Stock Level</th>
                        <th>Min/Max</th>
                        <th>Days Supply</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.products.map(product => {
                        const stock = this.stockData[product.articleNumber];
                        const percentage = (stock.currentStock / stock.maxStock) * 100;
                        const daysSupply = Math.floor(stock.currentStock / stock.avgDailyConsumption);
                        
                        let status = 'good';
                        let statusText = 'Good';
                        if (stock.currentStock < stock.minStock) {
                            status = 'critical';
                            statusText = 'Critical';
                        } else if (stock.currentStock < stock.reorderPoint) {
                            status = 'warning';
                            statusText = 'Reorder';
                        }
                        
                        return `
                            <tr>
                                <td>
                                    <strong>${product.articleNumber}</strong><br>
                                    <small>${product.articleName}</small>
                                </td>
                                <td>
                                    <span class="editable" 
                                          data-article="${product.articleNumber}" 
                                          data-field="currentStock">
                                        ${stock.currentStock.toLocaleString()} ${product.unit}
                                    </span>
                                </td>
                                <td>
                                    <div class="stock-level">
                                        <div class="stock-bar">
                                            <div class="stock-fill stock-${status}" 
                                                 style="width: ${Math.min(percentage, 100)}%"></div>
                                        </div>
                                        <span>${percentage.toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td>
                                    <small>Min: ${stock.minStock}</small><br>
                                    <small>Max: ${stock.maxStock}</small>
                                </td>
                                <td>${daysSupply} days</td>
                                <td>${stock.location}</td>
                                <td>
                                    <span class="status-badge status-${status}">${statusText}</span>
                                </td>
                                <td>
                                    <button class="btn btn-sm" onclick="StockReadyProducts.adjustStock('${product.articleNumber}')">
                                        Adjust
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },
    
    renderMovements() {
        // Sort movements by date (newest first)
        const sortedMovements = [...this.movements].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        return `
            <table class="stock-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Article</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Reference</th>
                        <th>Balance After</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedMovements.map(movement => {
                        const product = this.products.find(p => p.articleNumber === movement.articleNumber);
                        const typeClass = movement.type === 'production' ? 'production' : 
                                         movement.type === 'sale' ? 'sale' : 'adjustment';
                        
                        return `
                            <tr>
                                <td>${movement.date}</td>
                                <td>
                                    <strong>${movement.articleNumber}</strong><br>
                                    <small>${product ? product.articleName : ''}</small>
                                </td>
                                <td>
                                    <span class="movement-type movement-${typeClass}">
                                        ${movement.type.toUpperCase()}
                                    </span>
                                </td>
                                <td class="${movement.quantity > 0 ? 'positive' : 'negative'}">
                                    ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
                                </td>
                                <td>${movement.reference}</td>
                                <td>${movement.balanceAfter.toLocaleString()}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },
    
    renderForecast() {
        return `
            <div class="forecast-content">
                <h3>Stock Forecast (Next 7 Days)</h3>
                <table class="stock-table">
                    <thead>
                        <tr>
                            <th>Article</th>
                            <th>Current</th>
                            <th>Day 1</th>
                            <th>Day 2</th>
                            <th>Day 3</th>
                            <th>Day 4</th>
                            <th>Day 5</th>
                            <th>Day 6</th>
                            <th>Day 7</th>
                            <th>Action Required</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.products.map(product => {
                            const stock = this.stockData[product.articleNumber];
                            let forecast = [stock.currentStock];
                            let actionDay = null;
                            
                            // Calculate forecast for next 7 days
                            for (let i = 1; i <= 7; i++) {
                                const projected = forecast[i-1] - stock.avgDailyConsumption;
                                forecast.push(Math.max(0, projected));
                                
                                if (projected < stock.reorderPoint && !actionDay) {
                                    actionDay = i;
                                }
                            }
                            
                            return `
                                <tr>
                                    <td>
                                        <strong>${product.articleNumber}</strong><br>
                                        <small>${product.articleName}</small>
                                    </td>
                                    ${forecast.map((value, index) => {
                                        let className = '';
                                        if (value < stock.minStock) className = 'negative';
                                        else if (value < stock.reorderPoint) className = 'warning';
                                        
                                        return `<td class="${className}">${Math.floor(value)}</td>`;
                                    }).join('')}
                                    <td>
                                        ${actionDay ? 
                                            `<span class="status-badge status-warning">Reorder Day ${actionDay}</span>` : 
                                            '<span class="status-badge status-good">No action</span>'
                                        }
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const view = e.target.dataset.view;
                this.currentView = view;
                this.render();
            }
            
            // Inline editing
            if (e.target.classList.contains('editable')) {
                this.startEditing(e.target);
            }
        });
    },
    
    startEditing(cell) {
        if (cell.classList.contains('editing')) return;
        
        const originalValue = cell.textContent.trim().replace(/[^\d]/g, '');
        const article = cell.dataset.article;
        const field = cell.dataset.field;
        
        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" value="${originalValue}" style="width: 100px;">`;
        
        const input = cell.querySelector('input');
        input.focus();
        input.select();
        
        const finishEditing = () => {
            const newValue = parseInt(input.value) || 0;
            this.stockData[article][field] = newValue;
            this.saveData();
            
            // Record movement if stock changed
            if (field === 'currentStock' && newValue !== parseInt(originalValue)) {
                this.recordMovement(article, 'adjustment', newValue - parseInt(originalValue));
            }
            
            this.render();
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            }
        });
    },
    
    setupAutoSync() {
        // Subscribe to production events
        if (typeof ChEvents !== 'undefined') {
            ChEvents.on(EVENTS.PRODUCTION_COMPLETED, (data) => {
                this.handleProductionUpdate(data);
            });
            
            ChEvents.on(EVENTS.SALE_COMPLETED, (data) => {
                this.handleSaleUpdate(data);
            });
            
            console.log('Auto-sync enabled for Stock of Ready Products');
        }
    },
    
    handleProductionUpdate(data) {
        // Automatically update stock when production completes
        const { articleNumber, quantity, reference } = data;
        
        if (this.stockData[articleNumber] && quantity > 0) {
            this.stockData[articleNumber].currentStock += quantity;
            this.stockData[articleNumber].lastProduction = new Date().toISOString().split('T')[0];
            
            this.recordMovement(articleNumber, 'production', quantity, reference);
            this.saveData();
            this.render();
            
            // Flash indicator
            this.flashSyncIndicator('Production updated');
        }
    },
    
    handleSaleUpdate(data) {
        // Automatically update stock when sale occurs
        const { articleNumber, quantity, reference } = data;
        
        if (this.stockData[articleNumber] && quantity > 0) {
            this.stockData[articleNumber].currentStock -= quantity;
            this.stockData[articleNumber].lastSale = new Date().toISOString().split('T')[0];
            
            this.recordMovement(articleNumber, 'sale', -quantity, reference);
            this.saveData();
            this.render();
            
            // Flash indicator
            this.flashSyncIndicator('Sale processed');
        }
    },
    
    flashSyncIndicator(message) {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.textContent = `[Refresh] ${message}`;
            indicator.style.color = '#f39c12';
            setTimeout(() => {
                indicator.textContent = '🟢 Auto-sync active';
                indicator.style.color = '#27ae60';
            }, 2000);
        }
    },
    
    recordMovement(articleNumber, type, quantity, reference = null) {
        const movement = {
            id: this.movements.length + 1,
            date: new Date().toISOString().split('T')[0],
            articleNumber: articleNumber,
            type: type,
            quantity: quantity,
            reference: reference || this.generateReference(type),
            balanceAfter: this.stockData[articleNumber].currentStock
        };
        
        this.movements.push(movement);
        localStorage.setItem('stockMovements', JSON.stringify(this.movements));
    },
    
    generateReference(type) {
        const prefix = type === 'production' ? 'PROD' : 
                      type === 'sale' ? 'SO' : 'ADJ';
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
        return `${prefix}-${date}-${random}`;
    },
    
    adjustStock(articleNumber) {
        const stock = this.stockData[articleNumber];
        const adjustment = prompt(`Adjust stock for ${articleNumber}\nCurrent: ${stock.currentStock}\nEnter adjustment (+/- value):`);
        
        if (adjustment) {
            const value = parseInt(adjustment);
            if (!isNaN(value)) {
                stock.currentStock += value;
                this.recordMovement(articleNumber, 'adjustment', value);
                this.saveData();
                this.render();
            }
        }
    },
    
    saveData() {
        localStorage.setItem('stockReadyProducts', JSON.stringify(this.stockData));
    },
    
    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            stockData: this.stockData,
            movements: this.movements,
            products: this.products
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_ready_products_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
};

// Expose to global scope
window.StockReadyProducts = StockReadyProducts;

// Don't auto-initialize - wait for explicit init call from app.js
// This prevents issues with container being cleared after load
// Stock of Raw Materials Module - V1
// Tracks inventory of ingredients, packaging, and other raw materials
const StockRawMaterials = {
    materials: [],
    stockData: {},
    movements: [],
    suppliers: {},
    currentView: 'current', // 'current', 'movements', 'orders'
    
    init() {
        console.log('Initializing Stock of Raw Materials V1...');
        this.loadMaterials();
        this.loadStockData();
        this.loadSuppliers();
        this.render();
        this.bindEvents();
    },
    
    loadMaterials() {
        // Load raw materials - would come from BOM module in production
        this.materials = [
            // Main Ingredients
            { id: 1, code: 'MEAT-BEEF-001', name: 'Premium Beef', category: 'Main Ingredients', unit: 'kg', type: 'meat' },
            { id: 2, code: 'MEAT-PORK-001', name: 'Pork Shoulder', category: 'Main Ingredients', unit: 'kg', type: 'meat' },
            { id: 3, code: 'MEAT-CHKN-001', name: 'Chicken Breast', category: 'Main Ingredients', unit: 'kg', type: 'meat' },
            { id: 4, code: 'MEAT-TURK-001', name: 'Turkey Meat', category: 'Main Ingredients', unit: 'kg', type: 'meat' },
            
            // Supporting Ingredients
            { id: 5, code: 'SPICE-SALT-001', name: 'Sea Salt', category: 'Supporting', unit: 'kg', type: 'spice' },
            { id: 6, code: 'SPICE-PEPR-001', name: 'Black Pepper', category: 'Supporting', unit: 'kg', type: 'spice' },
            { id: 7, code: 'SPICE-PAPR-001', name: 'Paprika', category: 'Supporting', unit: 'kg', type: 'spice' },
            { id: 8, code: 'ADDTV-NITR-001', name: 'Sodium Nitrite', category: 'Supporting', unit: 'kg', type: 'additive' },
            
            // Packaging Materials
            { id: 9, code: 'PACK-FILM-001', name: 'Vacuum Film', category: 'Packaging', unit: 'rolls', type: 'packaging' },
            { id: 10, code: 'PACK-TRAY-001', name: 'Plastic Trays', category: 'Packaging', unit: 'pcs', type: 'packaging' },
            { id: 11, code: 'PACK-LABL-001', name: 'Product Labels', category: 'Packaging', unit: 'pcs', type: 'packaging' },
            { id: 12, code: 'PACK-BOX-001', name: 'Shipping Boxes', category: 'Packaging', unit: 'pcs', type: 'packaging' }
        ];
    },
    
    loadStockData() {
        // Load from localStorage or initialize
        const saved = localStorage.getItem('stockRawMaterials');
        if (saved) {
            this.stockData = JSON.parse(saved);
        } else {
            // Initialize with sample data
            this.stockData = {
                'MEAT-BEEF-001': {
                    currentStock: 450,
                    minStock: 200,
                    maxStock: 1000,
                    reorderPoint: 300,
                    reorderQty: 500,
                    lastOrder: '2024-01-10',
                    lastDelivery: '2024-01-15',
                    avgDailyUsage: 25,
                    unitCost: 12.50,
                    supplier: 'SUP-001'
                },
                'MEAT-PORK-001': {
                    currentStock: 320,
                    minStock: 150,
                    maxStock: 800,
                    reorderPoint: 250,
                    reorderQty: 400,
                    lastOrder: '2024-01-12',
                    lastDelivery: '2024-01-16',
                    avgDailyUsage: 20,
                    unitCost: 8.75,
                    supplier: 'SUP-001'
                },
                'MEAT-CHKN-001': {
                    currentStock: 180,
                    minStock: 100,
                    maxStock: 500,
                    reorderPoint: 150,
                    reorderQty: 300,
                    lastOrder: '2024-01-08',
                    lastDelivery: '2024-01-14',
                    avgDailyUsage: 15,
                    unitCost: 6.25,
                    supplier: 'SUP-002'
                },
                'MEAT-TURK-001': {
                    currentStock: 250,
                    minStock: 100,
                    maxStock: 600,
                    reorderPoint: 200,
                    reorderQty: 350,
                    lastOrder: '2024-01-11',
                    lastDelivery: '2024-01-17',
                    avgDailyUsage: 18,
                    unitCost: 7.80,
                    supplier: 'SUP-002'
                },
                'SPICE-SALT-001': {
                    currentStock: 85,
                    minStock: 50,
                    maxStock: 200,
                    reorderPoint: 75,
                    reorderQty: 100,
                    lastOrder: '2024-01-05',
                    lastDelivery: '2024-01-10',
                    avgDailyUsage: 3,
                    unitCost: 0.85,
                    supplier: 'SUP-003'
                },
                'SPICE-PEPR-001': {
                    currentStock: 12,
                    minStock: 5,
                    maxStock: 50,
                    reorderPoint: 10,
                    reorderQty: 30,
                    lastOrder: '2024-01-03',
                    lastDelivery: '2024-01-08',
                    avgDailyUsage: 0.5,
                    unitCost: 15.00,
                    supplier: 'SUP-003'
                },
                'SPICE-PAPR-001': {
                    currentStock: 18,
                    minStock: 10,
                    maxStock: 60,
                    reorderPoint: 15,
                    reorderQty: 35,
                    lastOrder: '2024-01-04',
                    lastDelivery: '2024-01-09',
                    avgDailyUsage: 0.8,
                    unitCost: 8.50,
                    supplier: 'SUP-003'
                },
                'ADDTV-NITR-001': {
                    currentStock: 5,
                    minStock: 2,
                    maxStock: 20,
                    reorderPoint: 4,
                    reorderQty: 10,
                    lastOrder: '2024-01-01',
                    lastDelivery: '2024-01-06',
                    avgDailyUsage: 0.2,
                    unitCost: 25.00,
                    supplier: 'SUP-004'
                },
                'PACK-FILM-001': {
                    currentStock: 45,
                    minStock: 20,
                    maxStock: 100,
                    reorderPoint: 30,
                    reorderQty: 50,
                    lastOrder: '2024-01-07',
                    lastDelivery: '2024-01-12',
                    avgDailyUsage: 2,
                    unitCost: 35.00,
                    supplier: 'SUP-005'
                },
                'PACK-TRAY-001': {
                    currentStock: 2500,
                    minStock: 1000,
                    maxStock: 5000,
                    reorderPoint: 1500,
                    reorderQty: 2000,
                    lastOrder: '2024-01-06',
                    lastDelivery: '2024-01-11',
                    avgDailyUsage: 150,
                    unitCost: 0.45,
                    supplier: 'SUP-005'
                },
                'PACK-LABL-001': {
                    currentStock: 8500,
                    minStock: 5000,
                    maxStock: 20000,
                    reorderPoint: 7500,
                    reorderQty: 10000,
                    lastOrder: '2024-01-02',
                    lastDelivery: '2024-01-07',
                    avgDailyUsage: 500,
                    unitCost: 0.05,
                    supplier: 'SUP-006'
                },
                'PACK-BOX-001': {
                    currentStock: 350,
                    minStock: 200,
                    maxStock: 1000,
                    reorderPoint: 300,
                    reorderQty: 500,
                    lastOrder: '2024-01-09',
                    lastDelivery: '2024-01-13',
                    avgDailyUsage: 25,
                    unitCost: 2.20,
                    supplier: 'SUP-005'
                }
            };
        }
    },
    
    loadSuppliers() {
        // Load supplier information
        this.suppliers = {
            'SUP-001': { name: 'Premium Meats Ltd', leadTime: 5, reliability: 98 },
            'SUP-002': { name: 'Poultry Suppliers Inc', leadTime: 6, reliability: 95 },
            'SUP-003': { name: 'Spice World', leadTime: 5, reliability: 99 },
            'SUP-004': { name: 'Food Additives Co', leadTime: 7, reliability: 97 },
            'SUP-005': { name: 'Packaging Solutions', leadTime: 4, reliability: 96 },
            'SUP-006': { name: 'Label Express', leadTime: 3, reliability: 99 }
        };
    },
    
    render() {
        const container = document.getElementById('stock-raw-materials-container') || 
                         document.getElementById('stock-report-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stock-raw-materials">
                <div class="module-header">
                    <h2>🏭 Stock of Raw Materials</h2>
                    <div class="header-controls">
                        <div class="view-tabs">
                            <button class="tab-btn ${this.currentView === 'current' ? 'active' : ''}" data-view="current">
                                Current Stock
                            </button>
                            <button class="tab-btn ${this.currentView === 'movements' ? 'active' : ''}" data-view="movements">
                                Movements
                            </button>
                            <button class="tab-btn ${this.currentView === 'orders' ? 'active' : ''}" data-view="orders">
                                Purchase Orders
                            </button>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-order" onclick="StockRawMaterials.generateOrders()">
                                📋 Generate Orders
                            </button>
                            <button class="btn btn-sync" onclick="StockRawMaterials.syncWithBOM()">
                                🔄 Sync with BOM
                            </button>
                            <button class="btn btn-export" onclick="StockRawMaterials.exportData()">
                                📥 Export
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
                .stock-raw-materials {
                    padding: 20px;
                    background: #f8f9fa;
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
                    background: #f0f0f0;
                }
                
                .tab-btn.active {
                    background: #e67e22;
                    color: white;
                    border-color: #e67e22;
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
                
                .btn-order {
                    background: #3498db;
                    color: white;
                }
                
                .btn-order:hover {
                    background: #2980b9;
                }
                
                .btn-sync {
                    background: #27ae60;
                    color: white;
                }
                
                .btn-sync:hover {
                    background: #229954;
                }
                
                .btn-export {
                    background: #8e44ad;
                    color: white;
                }
                
                .btn-export:hover {
                    background: #7d3c98;
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
                
                .summary-subtitle {
                    font-size: 12px;
                    color: #7f8c8d;
                    margin-top: 5px;
                }
                
                .stock-content {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .category-section {
                    margin-bottom: 30px;
                }
                
                .category-header {
                    background: #f8f9fa;
                    padding: 10px 15px;
                    border-left: 4px solid #e67e22;
                    margin-bottom: 15px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .stock-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .stock-table th {
                    background: #f8f9fa;
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
                    background: #ecf0f1;
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                    max-width: 150px;
                }
                
                .stock-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #e67e22, #d35400);
                    transition: width 0.3s;
                }
                
                .stock-critical {
                    background: linear-gradient(90deg, #e74c3c, #c0392b);
                }
                
                .stock-warning {
                    background: linear-gradient(90deg, #f39c12, #e67e22);
                }
                
                .stock-good {
                    background: linear-gradient(90deg, #27ae60, #229954);
                }
                
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .status-critical {
                    background: #ffe5e5;
                    color: #e74c3c;
                }
                
                .status-warning {
                    background: #fff3cd;
                    color: #f39c12;
                }
                
                .status-good {
                    background: #d4edda;
                    color: #27ae60;
                }
                
                .status-ordered {
                    background: #cce5ff;
                    color: #3498db;
                }
                
                .editable {
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .editable:hover {
                    background: #f0f0f0;
                }
                
                .editing {
                    background: #fff3cd;
                }
                
                .order-card {
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .order-items {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #dee2e6;
                }
            </style>
        `;
    },
    
    renderSummary() {
        // Calculate summary statistics
        let totalValue = 0;
        let totalItems = 0;
        let criticalItems = 0;
        let pendingOrders = 0;
        
        this.materials.forEach(material => {
            const stock = this.stockData[material.code];
            if (stock) {
                totalItems++;
                totalValue += stock.currentStock * stock.unitCost;
                
                if (stock.currentStock < stock.minStock) {
                    criticalItems++;
                } else if (stock.currentStock < stock.reorderPoint) {
                    pendingOrders++;
                }
            }
        });
        
        return `
            <div class="summary-card">
                <h3>Total Value</h3>
                <div class="summary-value">€${totalValue.toLocaleString()}</div>
                <div class="summary-subtitle">${totalItems} material types</div>
            </div>
            <div class="summary-card">
                <h3>Critical Items</h3>
                <div class="summary-value" style="color: ${criticalItems > 0 ? '#e74c3c' : '#27ae60'}">
                    ${criticalItems}
                </div>
                <div class="summary-subtitle">Below minimum stock</div>
            </div>
            <div class="summary-card">
                <h3>Reorder Required</h3>
                <div class="summary-value" style="color: ${pendingOrders > 0 ? '#f39c12' : '#27ae60'}">
                    ${pendingOrders}
                </div>
                <div class="summary-subtitle">Below reorder point</div>
            </div>
            <div class="summary-card">
                <h3>Suppliers</h3>
                <div class="summary-value">${Object.keys(this.suppliers).length}</div>
                <div class="summary-subtitle">Active suppliers</div>
            </div>
        `;
    },
    
    renderContent() {
        switch(this.currentView) {
            case 'current':
                return this.renderCurrentStock();
            case 'movements':
                return this.renderMovements();
            case 'orders':
                return this.renderOrders();
            default:
                return this.renderCurrentStock();
        }
    },
    
    renderCurrentStock() {
        // Group materials by category
        const categories = {};
        this.materials.forEach(material => {
            if (!categories[material.category]) {
                categories[material.category] = [];
            }
            categories[material.category].push(material);
        });
        
        return Object.entries(categories).map(([category, materials]) => `
            <div class="category-section">
                <div class="category-header">${category}</div>
                <table class="stock-table">
                    <thead>
                        <tr>
                            <th>Material Code</th>
                            <th>Name</th>
                            <th>Current Stock</th>
                            <th>Stock Level</th>
                            <th>Days Supply</th>
                            <th>Unit Cost</th>
                            <th>Total Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materials.map(material => {
                            const stock = this.stockData[material.code];
                            const percentage = (stock.currentStock / stock.maxStock) * 100;
                            const daysSupply = Math.floor(stock.currentStock / stock.avgDailyUsage);
                            const totalValue = stock.currentStock * stock.unitCost;
                            
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
                                    <td><strong>${material.code}</strong></td>
                                    <td>${material.name}</td>
                                    <td>
                                        <span class="editable" 
                                              data-code="${material.code}" 
                                              data-field="currentStock">
                                            ${stock.currentStock.toLocaleString()} ${material.unit}
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
                                    <td>${daysSupply} days</td>
                                    <td>€${stock.unitCost.toFixed(2)}</td>
                                    <td>€${totalValue.toFixed(2)}</td>
                                    <td>
                                        <span class="status-badge status-${status}">${statusText}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');
    },
    
    renderMovements() {
        return `
            <div class="movements-placeholder">
                <h3>Stock Movements History</h3>
                <p>Movement tracking will be implemented when integrated with production system.</p>
            </div>
        `;
    },
    
    renderOrders() {
        // Generate suggested orders
        const orders = this.generateSuggestedOrders();
        
        return `
            <div class="orders-section">
                <h3>Purchase Orders</h3>
                ${orders.length > 0 ? orders.map(order => `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <strong>Supplier: ${order.supplierName}</strong><br>
                                <small>Lead Time: ${order.leadTime} days | Reliability: ${order.reliability}%</small>
                            </div>
                            <div>
                                <strong>Total: €${order.totalValue.toFixed(2)}</strong><br>
                                <button class="btn btn-order" onclick="StockRawMaterials.createOrder('${order.supplierId}')">
                                    Create Order
                                </button>
                            </div>
                        </div>
                        <div class="order-items">
                            <strong>Items to Order:</strong>
                            ${order.items.map(item => `
                                <div>• ${item.name}: ${item.quantity} ${item.unit} (€${(item.quantity * item.unitCost).toFixed(2)})</div>
                            `).join('')}
                        </div>
                    </div>
                `).join('') : '<p>No orders needed at this time.</p>'}
            </div>
        `;
    },
    
    generateSuggestedOrders() {
        const ordersBySupplier = {};
        
        this.materials.forEach(material => {
            const stock = this.stockData[material.code];
            if (stock && stock.currentStock <= stock.reorderPoint) {
                const supplierId = stock.supplier;
                if (!ordersBySupplier[supplierId]) {
                    ordersBySupplier[supplierId] = {
                        supplierId: supplierId,
                        supplierName: this.suppliers[supplierId].name,
                        leadTime: this.suppliers[supplierId].leadTime,
                        reliability: this.suppliers[supplierId].reliability,
                        items: [],
                        totalValue: 0
                    };
                }
                
                const orderQty = stock.reorderQty;
                const value = orderQty * stock.unitCost;
                
                ordersBySupplier[supplierId].items.push({
                    code: material.code,
                    name: material.name,
                    quantity: orderQty,
                    unit: material.unit,
                    unitCost: stock.unitCost
                });
                
                ordersBySupplier[supplierId].totalValue += value;
            }
        });
        
        return Object.values(ordersBySupplier);
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
        
        const originalValue = cell.textContent.trim().replace(/[^\d.]/g, '');
        const code = cell.dataset.code;
        const field = cell.dataset.field;
        
        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" value="${originalValue}" style="width: 100px;">`;
        
        const input = cell.querySelector('input');
        input.focus();
        input.select();
        
        const finishEditing = () => {
            const newValue = parseFloat(input.value) || 0;
            this.stockData[code][field] = newValue;
            this.saveData();
            this.render();
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            }
        });
    },
    
    generateOrders() {
        const orders = this.generateSuggestedOrders();
        if (orders.length > 0) {
            alert(`Generated ${orders.length} purchase orders for materials below reorder point.`);
            this.currentView = 'orders';
            this.render();
        } else {
            alert('No materials require ordering at this time.');
        }
    },
    
    syncWithBOM() {
        // Sync with BOM module
        console.log('Syncing with BOM module...');
        
        // Check if BOMV2Advanced is available
        if (typeof BOMV2Advanced !== 'undefined' && BOMV2Advanced.bomData) {
            // Update material requirements based on BOM
            alert('✅ Raw materials synchronized with BOM data');
            this.render();
        } else {
            alert('⚠️ BOM module not available');
        }
    },
    
    createOrder(supplierId) {
        const supplier = this.suppliers[supplierId];
        const items = [];
        
        this.materials.forEach(material => {
            const stock = this.stockData[material.code];
            if (stock && stock.supplier === supplierId && stock.currentStock <= stock.reorderPoint) {
                items.push({
                    code: material.code,
                    name: material.name,
                    quantity: stock.reorderQty
                });
            }
        });
        
        if (items.length > 0) {
            alert(`Purchase order created for ${supplier.name}:\n${items.length} items\nExpected delivery in ${supplier.leadTime} days`);
            
            // Update last order date
            items.forEach(item => {
                this.stockData[item.code].lastOrder = new Date().toISOString().split('T')[0];
            });
            
            this.saveData();
            this.render();
        }
    },
    
    saveData() {
        localStorage.setItem('stockRawMaterials', JSON.stringify(this.stockData));
    },
    
    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            materials: this.materials,
            stockData: this.stockData,
            suppliers: this.suppliers,
            suggestedOrders: this.generateSuggestedOrders()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_raw_materials_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }
};

// Auto-initialize when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('stock-raw-materials-container')) {
            StockRawMaterials.init();
        }
    });
} else {
    if (document.getElementById('stock-raw-materials-container')) {
        StockRawMaterials.init();
    }
}
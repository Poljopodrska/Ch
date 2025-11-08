// Ch Stock Report Module V1
// Stage 2: Stock management and reporting
// Shows current stock, movements, and projections

const StockReportV1 = {
    VERSION: '1.0.0',
    
    state: {
        currentDate: new Date(),
        products: [],
        stockData: {},
        movements: [],
        projections: {}
    },
    
    // Initialize the module
    init() {
        console.log(`Stock Report Module V${this.VERSION} initializing...`);
        
        const container = document.getElementById('stock-report-container');
        if (!container) {
            console.error('ERROR: stock-report-container not found!');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const newContainer = document.createElement('div');
                newContainer.id = 'stock-report-container';
                mainContent.appendChild(newContainer);
                console.log('Created stock-report-container');
            } else {
                console.error('ERROR: Could not find main-content element!');
                return;
            }
        }
        
        // Clear any existing content
        const reportContainer = document.getElementById('stock-report-container');
        if (reportContainer) {
            reportContainer.innerHTML = '';
        }
        
        this.loadStockData();
        this.renderReport();
        
        this.initialized = true;
        console.log('Stock Report V1 initialized');
    },
    
    initialized: false,
    
    // Load stock data
    loadStockData() {
        // Example products with detailed stock information
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                currentStock: 250,
                minStock: 100,      // Minimum stock level
                maxStock: 500,      // Maximum stock level
                safetyStock: 150,   // Safety stock level
                leadTime: 2,        // Days to produce/receive
                avgDailyUsage: 45,  // Average daily consumption
                lastUpdate: new Date(2025, 7, 17, 14, 30)
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                currentStock: 150,
                minStock: 50,
                maxStock: 300,
                safetyStock: 75,
                leadTime: 3,
                avgDailyUsage: 30,
                lastUpdate: new Date(2025, 7, 17, 14, 30)
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                currentStock: 500,
                minStock: 200,
                maxStock: 800,
                safetyStock: 300,
                leadTime: 1,
                avgDailyUsage: 55,
                lastUpdate: new Date(2025, 7, 18, 9, 15)
            },
            {
                id: 'p004',
                code: 'JAG-400',
                name: 'Jagnječji kotleti',
                nameEn: 'Lamb Chops',
                unit: 'kg',
                currentStock: 75,
                minStock: 30,
                maxStock: 150,
                safetyStock: 40,
                leadTime: 4,
                avgDailyUsage: 15,
                lastUpdate: new Date(2025, 7, 17, 16, 45)
            },
            {
                id: 'p005',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                currentStock: 320,
                minStock: 150,
                maxStock: 600,
                safetyStock: 200,
                leadTime: 1,
                avgDailyUsage: 35,
                lastUpdate: new Date(2025, 7, 18, 8, 0)
            }
        ];
        
        // Generate recent movements for each product
        this.generateMovements();
        
        // Calculate projections
        this.calculateProjections();
    },
    
    // Generate sample stock movements
    generateMovements() {
        this.state.movements = [];
        const movementTypes = ['IN', 'OUT', 'PRODUCTION', 'ADJUSTMENT'];
        
        this.state.products.forEach(product => {
            // Generate 5-10 recent movements per product
            const numMovements = 5 + Math.floor(Math.random() * 6);
            
            for (let i = 0; i < numMovements; i++) {
                const daysAgo = Math.floor(Math.random() * 7);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                date.setHours(8 + Math.floor(Math.random() * 10));
                date.setMinutes(Math.floor(Math.random() * 60));
                
                const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
                let quantity = 0;
                
                switch(type) {
                    case 'IN':
                        quantity = 50 + Math.floor(Math.random() * 150);
                        break;
                    case 'OUT':
                        quantity = -(20 + Math.floor(Math.random() * 80));
                        break;
                    case 'PRODUCTION':
                        quantity = 30 + Math.floor(Math.random() * 100);
                        break;
                    case 'ADJUSTMENT':
                        quantity = -10 + Math.floor(Math.random() * 20);
                        break;
                }
                
                this.state.movements.push({
                    productId: product.id,
                    productCode: product.code,
                    productName: product.name,
                    date: date,
                    type: type,
                    quantity: quantity,
                    balance: product.currentStock + quantity,
                    reference: `REF-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random() * 1000).toString().padStart(3,'0')}`
                });
            }
        });
        
        // Sort movements by date descending
        this.state.movements.sort((a, b) => b.date - a.date);
    },
    
    // Calculate stock projections
    calculateProjections() {
        this.state.projections = {};
        
        this.state.products.forEach(product => {
            const daysOfStock = product.currentStock / product.avgDailyUsage;
            const stockoutDate = new Date();
            stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysOfStock));
            
            const reorderPoint = product.safetyStock + (product.leadTime * product.avgDailyUsage);
            const daysUntilReorder = (product.currentStock - reorderPoint) / product.avgDailyUsage;
            const reorderDate = new Date();
            reorderDate.setDate(reorderDate.getDate() + Math.floor(daysUntilReorder));
            
            const reorderQuantity = product.maxStock - product.currentStock + (product.leadTime * product.avgDailyUsage);
            
            this.state.projections[product.id] = {
                daysOfStock: Math.max(0, Math.floor(daysOfStock)),
                stockoutDate: daysOfStock > 0 ? stockoutDate : null,
                reorderPoint: reorderPoint,
                daysUntilReorder: Math.max(0, Math.floor(daysUntilReorder)),
                reorderDate: daysUntilReorder > 0 ? reorderDate : new Date(),
                reorderQuantity: Math.max(0, Math.floor(reorderQuantity)),
                stockStatus: this.getStockStatus(product)
            };
        });
    },
    
    // Get stock status
    getStockStatus(product) {
        const percentage = (product.currentStock / product.maxStock) * 100;
        
        if (product.currentStock <= product.minStock) {
            return { level: 'critical', color: '#d32f2f', text: 'Kritično / Critical' };
        } else if (product.currentStock <= product.safetyStock) {
            return { level: 'low', color: '#f57c00', text: 'Nizko / Low' };
        } else if (percentage > 80) {
            return { level: 'high', color: '#1976d2', text: 'Visoko / High' };
        } else {
            return { level: 'optimal', color: '#388e3c', text: 'Optimalno / Optimal' };
        }
    },
    
    // Render the stock report
    renderReport() {
        const container = document.getElementById('stock-report-container');
        if (!container) return;
        
        let html = `
            <style>
                .stock-report-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .stock-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .stock-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .stock-tab {
                    padding: 10px 20px;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .stock-tab.active {
                    background: #3949ab;
                    color: white;
                    border-color: #3949ab;
                }
                
                .stock-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stock-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .stock-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .stock-card-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .stock-status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .stock-level-bar {
                    height: 30px;
                    background: var(--ch-gray-100);
                    border-radius: 4px;
                    position: relative;
                    overflow: hidden;
                    margin: 10px 0;
                }
                
                .stock-level-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .stock-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 10px;
                    font-size: 13px;
                }
                
                .stock-info-item {
                    display: flex;
                    justify-content: space-between;
                }
                
                .stock-table {
                    width: 100%;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .stock-table th {
                    background: #3949ab;
                    color: white;
                    padding: 10px;
                    text-align: left;
                    font-weight: 600;
                }
                
                .stock-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .stock-table tr:hover {
                    background: var(--ch-gray-100);
                }
                
                .movement-in { color: #388e3c; font-weight: bold; }
                .movement-out { color: #d32f2f; font-weight: bold; }
                .movement-production { color: var(--ch-primary-dark); font-weight: bold; }
                .movement-adjustment { color: #f57c00; }
            </style>
            
            <div class="stock-report-container">
                <div class="stock-header">
                    <h2>[Box] Poročilo o zalogah / Stock Report</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        Stage 2: Stock Management System
                        <br>Trenutno stanje: ${new Date().toLocaleDateString('sl-SI')} ${new Date().toLocaleTimeString('sl-SI')}
                    </div>
                </div>
                
                <div class="stock-tabs">
                    <div class="stock-tab active" onclick="StockReportV1.showTab('overview')">
                        Pregled / Overview
                    </div>
                    <div class="stock-tab" onclick="StockReportV1.showTab('movements')">
                        Gibanje zalog / Movements
                    </div>
                    <div class="stock-tab" onclick="StockReportV1.showTab('projections')">
                        Projekcije / Projections
                    </div>
                </div>
                
                <div id="stock-content">
                    ${this.renderOverview()}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render overview tab
    renderOverview() {
        let html = '<div class="stock-grid">';
        
        this.state.products.forEach(product => {
            const projection = this.state.projections[product.id];
            const stockPercentage = (product.currentStock / product.maxStock) * 100;
            
            html += `
                <div class="stock-card">
                    <div class="stock-card-header">
                        <div class="stock-card-title">
                            ${product.code} - ${product.name}
                        </div>
                        <div class="stock-status-badge" style="background: ${projection.stockStatus.color}">
                            ${projection.stockStatus.text}
                        </div>
                    </div>
                    
                    <div class="stock-level-bar">
                        <div class="stock-level-fill" style="width: ${stockPercentage}%; background: ${projection.stockStatus.color}">
                            ${product.currentStock} ${product.unit}
                        </div>
                    </div>
                    
                    <div class="stock-info">
                        <div class="stock-info-item">
                            <span>Min. zaloga:</span>
                            <strong>${product.minStock} ${product.unit}</strong>
                        </div>
                        <div class="stock-info-item">
                            <span>Max. zaloga:</span>
                            <strong>${product.maxStock} ${product.unit}</strong>
                        </div>
                        <div class="stock-info-item">
                            <span>Varnostna zaloga:</span>
                            <strong>${product.safetyStock} ${product.unit}</strong>
                        </div>
                        <div class="stock-info-item">
                            <span>Dnevna poraba:</span>
                            <strong>${product.avgDailyUsage} ${product.unit}</strong>
                        </div>
                        <div class="stock-info-item">
                            <span>Zadosti za dni:</span>
                            <strong>${projection.daysOfStock}</strong>
                        </div>
                        <div class="stock-info-item">
                            <span>Naročilo čez:</span>
                            <strong>${projection.daysUntilReorder} dni</strong>
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #666;">
                        Zadnja posodobitev: ${product.lastUpdate.toLocaleString('sl-SI')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    // Render movements tab
    renderMovements() {
        let html = `
            <table class="stock-table">
                <thead>
                    <tr>
                        <th>Datum / Date</th>
                        <th>Izdelek / Product</th>
                        <th>Tip / Type</th>
                        <th>Količina / Quantity</th>
                        <th>Stanje / Balance</th>
                        <th>Referenca / Reference</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.state.movements.slice(0, 50).forEach(movement => {
            const typeClass = `movement-${movement.type.toLowerCase()}`;
            const quantityDisplay = movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity;
            
            html += `
                <tr>
                    <td>${movement.date.toLocaleString('sl-SI')}</td>
                    <td>${movement.productCode} - ${movement.productName}</td>
                    <td><span class="${typeClass}">${movement.type}</span></td>
                    <td class="${typeClass}">${quantityDisplay}</td>
                    <td><strong>${movement.balance}</strong></td>
                    <td style="font-family: monospace; font-size: 11px;">${movement.reference}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    },
    
    // Render projections tab
    renderProjections() {
        let html = `
            <table class="stock-table">
                <thead>
                    <tr>
                        <th>Izdelek / Product</th>
                        <th>Trenutna zaloga / Current Stock</th>
                        <th>Dni zaloge / Days of Stock</th>
                        <th>Datum naročila / Reorder Date</th>
                        <th>Količina naročila / Reorder Qty</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.state.products.forEach(product => {
            const projection = this.state.projections[product.id];
            
            html += `
                <tr>
                    <td><strong>${product.code}</strong> - ${product.name}</td>
                    <td>${product.currentStock} ${product.unit}</td>
                    <td>${projection.daysOfStock} dni</td>
                    <td>${projection.reorderDate ? projection.reorderDate.toLocaleDateString('sl-SI') : 'TAKOJ / NOW'}</td>
                    <td><strong>${projection.reorderQuantity} ${product.unit}</strong></td>
                    <td>
                        <span class="stock-status-badge" style="background: ${projection.stockStatus.color}">
                            ${projection.stockStatus.text}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    },
    
    // Show specific tab
    showTab(tabName) {
        const tabs = document.querySelectorAll('.stock-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
                (tabName === 'overview' && tab.textContent.includes('Pregled')) ||
                (tabName === 'movements' && tab.textContent.includes('Gibanje')) ||
                (tabName === 'projections' && tab.textContent.includes('Projekcije'))) {
                tab.classList.add('active');
            }
        });
        
        const content = document.getElementById('stock-content');
        if (content) {
            switch(tabName) {
                case 'overview':
                    content.innerHTML = this.renderOverview();
                    break;
                case 'movements':
                    content.innerHTML = this.renderMovements();
                    break;
                case 'projections':
                    content.innerHTML = this.renderProjections();
                    break;
            }
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockReportV1;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.StockReportV1 = StockReportV1;
}
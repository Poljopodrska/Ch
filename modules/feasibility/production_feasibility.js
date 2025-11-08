// Production Feasibility Module - V1.0
// Integrates Production Planning, BOM, Stock, and Workforce to show feasibility
const ProductionFeasibility = {
    VERSION: '1.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(),
        currentWeek: Math.ceil(new Date().getDate() / 7),
        feasibilityData: {},
        selectedPeriod: 'week', // 'day', 'week', 'month'
        selectedTimeframe: null,
        alerts: [],
        thresholds: {
            stockWarning: 0.2,  // Warn when stock is below 20% of requirement
            stockCritical: 0,    // Critical when no stock
            workforceWarning: 0.8, // Warn when workforce is below 80% of requirement
            workforceCritical: 0.5 // Critical when workforce is below 50%
        }
    },
    
    init() {
        console.log(`Production Feasibility Module V${this.VERSION} initializing...`);
        this.calculateFeasibility();
        this.render();
        this.setupAutoRefresh();
        console.log('Production Feasibility initialized');
    },
    
    calculateFeasibility() {
        // Get data from all modules
        const productionPlan = this.getProductionPlan();
        const bomData = this.getBOMRequirements();
        const stockData = this.getStockLevels();
        const workforceData = this.getWorkforceAvailability();
        
        // Reset feasibility data
        this.state.feasibilityData = {};
        this.state.alerts = [];
        
        // Calculate feasibility for each product and time period
        if (productionPlan && productionPlan.products) {
            productionPlan.products.forEach(product => {
                this.state.feasibilityData[product.id] = this.analyzeProductFeasibility(
                    product,
                    productionPlan.data[product.id],
                    bomData[product.id],
                    stockData,
                    workforceData
                );
            });
        }
    },
    
    getProductionPlan() {
        // Get data from Production Planning module
        if (typeof ProductionPlanningV3 !== 'undefined' && ProductionPlanningV3.state) {
            return {
                products: ProductionPlanningV3.state.products,
                data: ProductionPlanningV3.state.data
            };
        }
        
        // Fallback sample data if module not loaded
        return {
            products: [
                { id: 'p001', code: 'PRD-001', name: 'Premium Salami' },
                { id: 'p002', code: 'PRD-002', name: 'Classic Mortadella' },
                { id: 'p003', code: 'PRD-003', name: 'Smoked Ham' }
            ],
            data: {
                'p001': {
                    productionPlan: {
                        months: {
                            1: { total: 1000 },
                            2: { total: 1200 }
                        }
                    }
                }
            }
        };
    },
    
    getBOMRequirements() {
        // Get BOM data
        if (typeof BOMV2Advanced !== 'undefined' && BOMV2Advanced.state) {
            const bomData = {};
            BOMV2Advanced.state.products.forEach(product => {
                const bom = BOMV2Advanced.state.bomData[product.id];
                if (bom) {
                    bomData[product.id] = {
                        mainIngredients: bom.ingredients?.main || {},
                        supportIngredients: bom.ingredients?.supporting || {},
                        packaging: bom.packaging || {},
                        workforce: bom.workforce || { operators: 2, hours: 8 },
                        energy: bom.energy || { electricity: 50, gas: 30 },
                        water: bom.water || 100
                    };
                }
            });
            return bomData;
        }
        
        // Fallback BOM data
        return {
            'p001': {
                mainIngredients: { 'MAT-001': 0.8, 'MAT-002': 0.15 },
                supportIngredients: { 'MAT-010': 0.05 },
                packaging: { 'PKG-001': 1 },
                workforce: { operators: 2, hours: 8 },
                energy: { electricity: 50, gas: 30 },
                water: 100
            }
        };
    },
    
    getStockLevels() {
        const stock = {
            rawMaterials: {},
            readyProducts: {}
        };
        
        // Get raw materials stock
        if (typeof StockRawMaterials !== 'undefined' && StockRawMaterials.stockData) {
            stock.rawMaterials = StockRawMaterials.stockData;
        } else {
            // Fallback data
            stock.rawMaterials = {
                'MAT-001': { currentStock: 5000 },
                'MAT-002': { currentStock: 2000 },
                'MAT-010': { currentStock: 500 },
                'PKG-001': { currentStock: 10000 }
            };
        }
        
        // Get ready products stock
        if (typeof StockReadyProducts !== 'undefined' && StockReadyProducts.stockData) {
            stock.readyProducts = StockReadyProducts.stockData;
        }
        
        return stock;
    },
    
    getWorkforceAvailability() {
        if (typeof WorkforceAvailability !== 'undefined' && WorkforceAvailability.state) {
            const availability = {};
            const year = this.state.currentYear;
            
            // Get availability for next 3 months
            for (let month = 0; month < 12; month++) {
                availability[month] = WorkforceAvailability.getMonthTotal(year, month);
            }
            
            return {
                workers: WorkforceAvailability.state.workers,
                availability: availability,
                currentCount: WorkforceAvailability.state.workers.length
            };
        }
        
        // Fallback data
        return {
            workers: [],
            availability: { 0: 110, 1: 105, 2: 108 },
            currentCount: 5
        };
    },
    
    analyzeProductFeasibility(product, productionData, bomRequirements, stockData, workforceData) {
        const analysis = {
            product: product,
            periods: {},
            overallStatus: 'feasible',
            issues: []
        };
        
        // Analyze each month
        for (let month = 1; month <= 12; month++) {
            if (productionData && productionData.productionPlan && productionData.productionPlan.months[month]) {
                const plannedQty = productionData.productionPlan.months[month].total || 0;
                
                if (plannedQty > 0) {
                    const periodAnalysis = {
                        plannedQuantity: plannedQty,
                        materials: {},
                        workforce: {},
                        utilities: {},
                        feasible: true,
                        issues: []
                    };
                    
                    // Check material requirements
                    if (bomRequirements) {
                        // Main ingredients
                        if (bomRequirements.mainIngredients) {
                            Object.entries(bomRequirements.mainIngredients).forEach(([material, qtyPerUnit]) => {
                                const required = plannedQty * qtyPerUnit;
                                const available = stockData.rawMaterials[material]?.currentStock || 0;
                                
                                periodAnalysis.materials[material] = {
                                    required: required,
                                    available: available,
                                    shortage: Math.max(0, required - available),
                                    status: available >= required ? 'ok' : available > 0 ? 'warning' : 'critical'
                                };
                                
                                if (available < required) {
                                    periodAnalysis.feasible = false;
                                    periodAnalysis.issues.push({
                                        type: 'material',
                                        item: material,
                                        shortage: required - available,
                                        severity: available === 0 ? 'critical' : 'warning'
                                    });
                                }
                            });
                        }
                        
                        // Supporting ingredients
                        if (bomRequirements.supportIngredients) {
                            Object.entries(bomRequirements.supportIngredients).forEach(([material, qtyPerUnit]) => {
                                const required = plannedQty * qtyPerUnit;
                                const available = stockData.rawMaterials[material]?.currentStock || 0;
                                
                                periodAnalysis.materials[material] = {
                                    required: required,
                                    available: available,
                                    shortage: Math.max(0, required - available),
                                    status: available >= required ? 'ok' : 'warning'
                                };
                                
                                if (available < required) {
                                    periodAnalysis.issues.push({
                                        type: 'material',
                                        item: material,
                                        shortage: required - available,
                                        severity: 'warning'
                                    });
                                }
                            });
                        }
                        
                        // Packaging
                        if (bomRequirements.packaging) {
                            Object.entries(bomRequirements.packaging).forEach(([material, qtyPerUnit]) => {
                                const required = plannedQty * qtyPerUnit;
                                const available = stockData.rawMaterials[material]?.currentStock || 0;
                                
                                periodAnalysis.materials[material] = {
                                    required: required,
                                    available: available,
                                    shortage: Math.max(0, required - available),
                                    status: available >= required ? 'ok' : 'warning'
                                };
                                
                                if (available < required) {
                                    periodAnalysis.issues.push({
                                        type: 'packaging',
                                        item: material,
                                        shortage: required - available,
                                        severity: 'warning'
                                    });
                                }
                            });
                        }
                        
                        // Workforce requirements
                        if (bomRequirements.workforce) {
                            const requiredHours = (plannedQty / 100) * bomRequirements.workforce.hours; // Assume 100 units per batch
                            const requiredWorkers = bomRequirements.workforce.operators;
                            const availableHours = workforceData.availability[month - 1] || 0;
                            
                            periodAnalysis.workforce = {
                                requiredHours: requiredHours,
                                requiredWorkers: requiredWorkers,
                                availableHours: availableHours * 8, // Convert days to hours
                                availableWorkers: workforceData.currentCount,
                                status: availableHours * 8 >= requiredHours ? 'ok' : 'warning'
                            };
                            
                            if (availableHours * 8 < requiredHours) {
                                periodAnalysis.issues.push({
                                    type: 'workforce',
                                    shortage: requiredHours - (availableHours * 8),
                                    severity: 'warning'
                                });
                            }
                        }
                    }
                    
                    analysis.periods[month] = periodAnalysis;
                    
                    if (!periodAnalysis.feasible) {
                        analysis.overallStatus = 'issues';
                    }
                }
            }
        }
        
        return analysis;
    },
    
    render() {
        const container = document.getElementById('feasibility-container');
        if (!container) {
            // Create container if it doesn't exist
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const div = document.createElement('div');
                div.id = 'feasibility-container';
                mainContent.appendChild(div);
            } else {
                return;
            }
        }
        
        document.getElementById('feasibility-container').innerHTML = `
            <div class="feasibility-module">
                <div class="module-header">
                    <h2>[Target] Production Feasibility Analysis</h2>
                    <div class="header-info">
                        Real-time analysis of production capability based on materials, workforce, and resources
                    </div>
                    <div class="header-controls">
                        <button onclick="ProductionFeasibility.refresh()" class="btn-refresh">
                            [Refresh] Refresh Analysis
                        </button>
                        <button onclick="ProductionFeasibility.exportReport()" class="btn-export">
                            [Download] Export Report
                        </button>
                    </div>
                </div>
                
                ${this.renderSummaryDashboard()}
                ${this.renderDetailedAnalysis()}
                ${this.renderAlerts()}
            </div>
            
            ${this.getStyles()}
        `;
    },
    
    renderSummaryDashboard() {
        // Calculate summary statistics
        let totalProducts = 0;
        let feasibleProducts = 0;
        let criticalIssues = 0;
        let warnings = 0;
        
        Object.values(this.state.feasibilityData).forEach(analysis => {
            totalProducts++;
            let hasIssues = false;
            
            Object.values(analysis.periods).forEach(period => {
                if (period.issues.length > 0) {
                    hasIssues = true;
                    period.issues.forEach(issue => {
                        if (issue.severity === 'critical') criticalIssues++;
                        else warnings++;
                    });
                }
            });
            
            if (!hasIssues) feasibleProducts++;
        });
        
        const feasibilityRate = totalProducts > 0 ? (feasibleProducts / totalProducts * 100) : 100;
        
        return `
            <div class="summary-dashboard">
                <div class="summary-card ${feasibilityRate === 100 ? 'status-ok' : feasibilityRate >= 75 ? 'status-warning' : 'status-critical'}">
                    <div class="card-value">${feasibilityRate.toFixed(0)}%</div>
                    <div class="card-label">Overall Feasibility</div>
                    <div class="card-detail">${feasibleProducts}/${totalProducts} products ready</div>
                </div>
                
                <div class="summary-card ${criticalIssues === 0 ? 'status-ok' : 'status-critical'}">
                    <div class="card-value">${criticalIssues}</div>
                    <div class="card-label">Critical Issues</div>
                    <div class="card-detail">Immediate attention needed</div>
                </div>
                
                <div class="summary-card ${warnings === 0 ? 'status-ok' : 'status-warning'}">
                    <div class="card-value">${warnings}</div>
                    <div class="card-label">Warnings</div>
                    <div class="card-detail">Potential problems</div>
                </div>
                
                <div class="summary-card status-info">
                    <div class="card-value">${this.getNextProductionDate()}</div>
                    <div class="card-label">Next Production</div>
                    <div class="card-detail">Scheduled start</div>
                </div>
            </div>
        `;
    },
    
    renderDetailedAnalysis() {
        let html = '<div class="detailed-analysis">';
        
        Object.entries(this.state.feasibilityData).forEach(([productId, analysis]) => {
            const product = analysis.product;
            const hasIssues = Object.values(analysis.periods).some(p => p.issues.length > 0);
            
            html += `
                <div class="product-analysis ${hasIssues ? 'has-issues' : 'all-clear'}">
                    <div class="product-header">
                        <div class="product-info">
                            <span class="product-code">${product.code}</span>
                            <span class="product-name">${product.name}</span>
                        </div>
                        <div class="product-status">
                            ${hasIssues ? 
                                '<span class="status-indicator status-warning">[!] Issues Found</span>' : 
                                '<span class="status-indicator status-ok">[OK] All Clear</span>'
                            }
                        </div>
                    </div>
                    
                    <div class="period-grid">
                        ${this.renderPeriodAnalysis(analysis.periods)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    renderPeriodAnalysis(periods) {
        let html = '<div class="periods">';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let month = 1; month <= 12; month++) {
            const period = periods[month];
            if (period && period.plannedQuantity > 0) {
                const feasible = period.issues.length === 0;
                const critical = period.issues.some(i => i.severity === 'critical');
                
                html += `
                    <div class="period-card ${feasible ? 'feasible' : critical ? 'critical' : 'warning'}"
                         onclick="ProductionFeasibility.showPeriodDetails('${month}', ${JSON.stringify(period).replace(/"/g, '&quot;')})">
                        <div class="period-month">${monthNames[month - 1]}</div>
                        <div class="period-quantity">${period.plannedQuantity} units</div>
                        <div class="period-status">
                            ${feasible ? 
                                '[OK]' : 
                                critical ? '[X]' : '[!]'
                            }
                        </div>
                        ${!feasible ? `
                            <div class="period-issues">
                                ${period.issues.length} issue${period.issues.length > 1 ? 's' : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        }
        
        html += '</div>';
        return html;
    },
    
    renderAlerts() {
        // Collect all critical issues
        const alerts = [];
        
        Object.entries(this.state.feasibilityData).forEach(([productId, analysis]) => {
            Object.entries(analysis.periods).forEach(([month, period]) => {
                period.issues.forEach(issue => {
                    if (issue.severity === 'critical') {
                        alerts.push({
                            product: analysis.product,
                            month: month,
                            issue: issue
                        });
                    }
                });
            });
        });
        
        if (alerts.length === 0) {
            return '';
        }
        
        return `
            <div class="alerts-section">
                <h3>🚨 Critical Alerts</h3>
                <div class="alerts-list">
                    ${alerts.map(alert => `
                        <div class="alert-item alert-critical">
                            <div class="alert-icon">[X]</div>
                            <div class="alert-content">
                                <div class="alert-title">
                                    ${alert.product.name} - Month ${alert.month}
                                </div>
                                <div class="alert-message">
                                    ${alert.issue.type === 'material' ? 
                                        `Missing ${alert.issue.shortage.toFixed(0)} units of ${alert.issue.item}` :
                                        alert.issue.type === 'workforce' ?
                                        `Short ${alert.issue.shortage.toFixed(0)} work hours` :
                                        `${alert.issue.type} shortage`
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    getStyles() {
        return `
            <style>
                .feasibility-module {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .module-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                .module-header h2 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                }
                
                .header-info {
                    opacity: 0.9;
                    margin-bottom: 15px;
                }
                
                .header-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .header-controls button {
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                }
                
                .header-controls button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                
                .summary-dashboard {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .summary-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    text-align: center;
                    border-left: 4px solid #ddd;
                    transition: transform 0.3s;
                }
                
                .summary-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.12);
                }
                
                .summary-card.status-ok {
                    border-left-color: #27ae60;
                }
                
                .summary-card.status-warning {
                    border-left-color: #f39c12;
                }
                
                .summary-card.status-critical {
                    border-left-color: #e74c3c;
                }
                
                .summary-card.status-info {
                    border-left-color: #3498db;
                }
                
                .card-value {
                    font-size: 36px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .card-label {
                    font-size: 14px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .card-detail {
                    font-size: 12px;
                    color: #95a5a6;
                }
                
                .detailed-analysis {
                    margin-bottom: 30px;
                }
                
                .product-analysis {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }
                
                .product-analysis.has-issues {
                    border: 2px solid #f39c12;
                }
                
                .product-analysis.all-clear {
                    border: 2px solid #27ae60;
                }
                
                .product-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #ecf0f1;
                }
                
                .product-info {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }
                
                .product-code {
                    font-weight: bold;
                    color: #2c3e50;
                    font-size: 16px;
                }
                
                .product-name {
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .status-indicator {
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .status-indicator.status-ok {
                    background: #d4edda;
                    color: #27ae60;
                }
                
                .status-indicator.status-warning {
                    background: #fff3cd;
                    color: #f39c12;
                }
                
                .periods {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 10px;
                }
                
                .period-card {
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 2px solid transparent;
                }
                
                .period-card:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .period-card.feasible {
                    background: #d4edda;
                    border-color: #27ae60;
                }
                
                .period-card.warning {
                    background: #fff3cd;
                    border-color: #f39c12;
                }
                
                .period-card.critical {
                    background: #ffe5e5;
                    border-color: #e74c3c;
                }
                
                .period-month {
                    font-weight: bold;
                    font-size: 14px;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .period-quantity {
                    font-size: 12px;
                    color: #7f8c8d;
                    margin-bottom: 8px;
                }
                
                .period-status {
                    font-size: 24px;
                }
                
                .period-issues {
                    font-size: 11px;
                    color: #e74c3c;
                    margin-top: 5px;
                    font-weight: 600;
                }
                
                .alerts-section {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }
                
                .alerts-section h3 {
                    margin: 0 0 15px 0;
                    color: #e74c3c;
                }
                
                .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .alert-item {
                    display: flex;
                    gap: 15px;
                    padding: 12px;
                    border-radius: 8px;
                    align-items: center;
                }
                
                .alert-item.alert-critical {
                    background: #ffe5e5;
                    border-left: 4px solid #e74c3c;
                }
                
                .alert-icon {
                    font-size: 20px;
                }
                
                .alert-content {
                    flex: 1;
                }
                
                .alert-title {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 3px;
                }
                
                .alert-message {
                    font-size: 13px;
                    color: #7f8c8d;
                }
                
                /* Simple and clean look */
                * {
                    box-sizing: border-box;
                }
                
                .feasibility-module {
                    max-width: 1400px;
                    margin: 0 auto;
                }
            </style>
        `;
    },
    
    getNextProductionDate() {
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
        return nextMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    
    showPeriodDetails(month, periodData) {
        // This could open a modal with detailed information
        console.log('Period details:', month, periodData);
        alert(`Details for month ${month}:\n\nPlanned: ${periodData.plannedQuantity} units\nIssues: ${periodData.issues.length}`);
    },
    
    refresh() {
        console.log('Refreshing feasibility analysis...');
        this.calculateFeasibility();
        this.render();
    },
    
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            feasibilityAnalysis: this.state.feasibilityData,
            alerts: this.state.alerts
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feasibility_report_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },
    
    setupAutoRefresh() {
        // Listen for changes in other modules
        if (typeof ChEvents !== 'undefined') {
            ChEvents.on('production:updated', () => this.refresh());
            ChEvents.on('stock:updated', () => this.refresh());
            ChEvents.on('workforce:updated', () => this.refresh());
        }
    }
};

// Export for use
window.ProductionFeasibility = ProductionFeasibility;
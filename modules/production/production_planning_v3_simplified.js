// Ch Production Planning Module V3 - Simplified with 4 Essential Rows
// Shows only current year with: Sales Plan, Stock, Production Plan, Actual Production
// Maintains expandable hierarchy: months → weeks → days

const ProductionPlanningV3 = {
    VERSION: '3.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentDay: new Date().getDate(),
        today: new Date(),
        
        // Expansion state for drill-down
        expanded: {
            months: new Set(),  // Which months are expanded to show weeks
            weeks: new Set()    // Which weeks are expanded to show days
        },
        
        // Data structure
        data: {},
        products: [],
        editedCells: new Set(),
        unsavedChanges: false
    },
    
    // Initialize the module
    init() {
        console.log(`Production Planning Module V${this.VERSION} - Simplified initializing...`);
        
        // Reset state for re-initialization
        if (this.initialized) {
            console.log('Production Planning V3 re-initializing, resetting state...');
            this.initialized = false;
            this.state.expanded.months.clear();
            this.state.expanded.weeks.clear();
            this.state.editedCells.clear();
        }
        
        const container = document.getElementById('production-planning-grid');
        if (!container) {
            console.error('ERROR: production-planning-grid container not found!');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const newContainer = document.createElement('div');
                newContainer.id = 'production-planning-grid';
                mainContent.appendChild(newContainer);
                console.log('Created production-planning-grid container');
            } else {
                console.error('ERROR: Could not find main-content element!');
                return;
            }
        }
        
        // Clear any existing content
        const gridContainer = document.getElementById('production-planning-grid');
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        
        // Load data
        this.loadProductionData();
        this.renderProductionGrid();
        
        this.initialized = true;
        console.log('Production Planning V3 Simplified initialized');
    },
    
    initialized: false,
    
    // Load production data
    loadProductionData() {
        // Load saved data from localStorage if available
        const savedData = localStorage.getItem('productionPlanningV3Data');
        const savedEditedCells = localStorage.getItem('productionV3EditedCells');
        
        if (savedData) {
            this.state.data = JSON.parse(savedData);
            if (savedEditedCells) {
                this.state.editedCells = new Set(JSON.parse(savedEditedCells));
            }
        }
        
        // Products
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                category: 'Fresh Meat',
                safetyStock: 500,      // Minimum stock level
                maxStock: 2000,        // Maximum stock capacity
                leadTime: 2            // Days to produce
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                category: 'Premium Meat',
                safetyStock: 300,
                maxStock: 1500,
                leadTime: 3
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                category: 'Poultry',
                safetyStock: 800,
                maxStock: 3000,
                leadTime: 1
            },
            {
                id: 'p004',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                category: 'Processed Meat',
                safetyStock: 400,
                maxStock: 1800,
                leadTime: 4
            }
        ];
        
        // Generate data if not loaded from storage
        if (!savedData) {
            this.state.products.forEach(product => {
                this.state.data[product.id] = this.generateProductData(product);
            });
        }
    },
    
    // Generate production data for a product (4 rows only)
    generateProductData(product) {
        const year = this.state.currentYear;
        
        return {
            salesPlan: this.generateRowData('salesPlan', product, year),
            stock: this.generateRowData('stock', product, year),
            productionPlan: this.generateRowData('productionPlan', product, year),
            actualProduction: this.generateRowData('actualProduction', product, year)
        };
    },
    
    // Generate data for a single row
    generateRowData(rowType, product, year) {
        const rowData = {
            label: this.getRowLabel(rowType),
            type: rowType,
            total: 0,
            editable: this.isRowEditable(rowType),
            months: {}
        };
        
        // Generate monthly data
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                label: this.getMonthName(month),
                shortLabel: this.getMonthShort(month),
                total: 0,
                editable: this.isMonthEditable(rowType, month),
                weeks: {}
            };
            
            // Generate weekly data
            const weeksInMonth = this.getCalendarWeeksInMonth(year, month);
            weeksInMonth.forEach(weekNum => {
                const weekData = {
                    label: `KW${weekNum}`,
                    total: 0,
                    editable: this.isMonthEditable(rowType, month),
                    days: {}
                };
                
                // Generate daily data
                const daysInWeek = this.getDaysOfWeekInMonth(year, month, weekNum);
                daysInWeek.forEach(day => {
                    const value = this.generateDailyValue(rowType, product, year, month, day);
                    const editable = this.isDayEditable(rowType, month, day);
                    
                    weekData.days[day] = {
                        label: day.toString(),
                        dayName: this.getDayShort(new Date(year, month - 1, day).getDay()),
                        value: value,
                        editable: editable,
                        originalValue: value
                    };
                    
                    weekData.total += value;
                });
                
                monthData.weeks[weekNum] = weekData;
                monthData.total += weekData.total;
            });
            
            rowData.months[month] = monthData;
            rowData.total += monthData.total;
        }
        
        return rowData;
    },
    
    // Generate daily values based on row type
    generateDailyValue(rowType, product, year, month, day) {
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isPast = new Date(year, month - 1, day) < new Date(this.state.today.getFullYear(), this.state.today.getMonth(), this.state.today.getDate());
        
        // Base values for different products
        const baseValues = {
            'p001': { sales: 45, stock: 600, production: 50 },
            'p002': { sales: 30, stock: 400, production: 35 },
            'p003': { sales: 60, stock: 1000, production: 65 },
            'p004': { sales: 35, stock: 500, production: 40 }
        };
        
        const base = baseValues[product.id] || { sales: 40, stock: 500, production: 45 };
        
        switch(rowType) {
            case 'salesPlan':
                // Sales are lower on weekends
                const salesFactor = isWeekend ? 0.3 : 1.0;
                const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6);
                return Math.round(base.sales * salesFactor * seasonalFactor * (0.9 + Math.random() * 0.2));
                
            case 'stock':
                // Stock levels fluctuate based on production and sales
                const stockVariation = 0.8 + Math.random() * 0.4;
                const stockLevel = base.stock + (Math.random() - 0.5) * 200;
                return Math.round(Math.max(product.safetyStock, Math.min(product.maxStock, stockLevel * stockVariation)));
                
            case 'productionPlan':
                // Production plan based on sales plan + stock requirements
                const plannedProduction = isWeekend ? base.production * 0.2 : base.production;
                return Math.round(plannedProduction * (0.95 + Math.random() * 0.1));
                
            case 'actualProduction':
                // Actual production (only for past dates)
                if (isPast) {
                    const actualFactor = isWeekend ? 0.15 : 0.9;
                    return Math.round(base.production * actualFactor * (0.85 + Math.random() * 0.15));
                }
                return 0; // No actual production for future dates
                
            default:
                return 0;
        }
    },
    
    // Get row label
    getRowLabel(rowType) {
        const labels = {
            'salesPlan': 'Sales Plan / Prodajni načrt',
            'stock': 'Stock / Zaloga',
            'productionPlan': 'Production Plan / Proizvodni načrt',
            'actualProduction': 'Actual Production / Dejanska proizvodnja'
        };
        return labels[rowType] || rowType;
    },
    
    // Check if row is editable
    isRowEditable(rowType) {
        // Sales Plan and Production Plan are editable
        // Stock is calculated, Actual Production is historical only
        return rowType === 'salesPlan' || rowType === 'productionPlan';
    },
    
    // Check if month is editable
    isMonthEditable(rowType, month) {
        if (!this.isRowEditable(rowType)) return false;
        
        // Can't edit past months for plans
        const today = this.state.today;
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        
        if (this.state.currentYear === currentYear) {
            return month >= currentMonth;
        }
        return true;
    },
    
    // Check if day is editable
    isDayEditable(rowType, month, day) {
        if (!this.isRowEditable(rowType)) return false;
        
        // Can't edit past days
        const today = this.state.today;
        const dateToCheck = new Date(this.state.currentYear, month - 1, day);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        return dateToCheck >= todayMidnight;
    },
    
    // Render the production planning grid
    renderProductionGrid() {
        const container = document.getElementById('production-planning-grid');
        if (!container) return;
        
        let html = `
            <style>
                .production-v3-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .production-v3-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .production-v3-controls {
                    margin: 20px 0;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .stock-indicators {
                    display: flex;
                    gap: 20px;
                    margin: 15px 0;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 5px;
                    font-size: 13px;
                }
                
                .stock-indicator {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .indicator-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                }
                
                .stock-critical { background: #f44336; }
                .stock-low { background: #ff9800; }
                .stock-normal { background: #4caf50; }
                .stock-high { background: #2196f3; }
                
                .save-button {
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .save-button:hover {
                    background: #45a049;
                }
                
                .save-button:disabled {
                    background: #cccccc;
                    cursor: not-allowed;
                }
                
                .calculate-button {
                    padding: 10px 20px;
                    background: #ff9800;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .export-button {
                    padding: 10px 20px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .unsaved-indicator {
                    padding: 5px 10px;
                    background: #ff9800;
                    color: white;
                    border-radius: 3px;
                    font-size: 12px;
                    display: none;
                }
                
                .unsaved-indicator.show {
                    display: inline-block;
                }
                
                .production-v3-table-wrapper {
                    background: white;
                    border-radius: 8px;
                    overflow-x: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .production-v3-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1400px;
                }
                
                .production-v3-table th {
                    background: #1565c0;
                    color: white;
                    padding: 8px 4px;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid #0d47a1;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    font-size: 12px;
                }
                
                .production-v3-table th.product-header {
                    text-align: left;
                    min-width: 200px;
                    background: #0d47a1;
                    padding: 8px;
                }
                
                .production-v3-table th.row-type-header {
                    text-align: left;
                    min-width: 150px;
                    background: #0d47a1;
                    padding: 8px;
                }
                
                /* Month headers with expand/collapse */
                .month-header {
                    background: #1976d2 !important;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                }
                
                .month-header:hover {
                    background: #1565c0 !important;
                }
                
                .week-header {
                    background: #42a5f5 !important;
                    font-size: 11px;
                    cursor: pointer;
                }
                
                .week-header:hover {
                    background: #1e88e5 !important;
                }
                
                .day-header {
                    background: #64b5f6 !important;
                    font-size: 10px;
                }
                
                .expand-icon {
                    display: inline-block;
                    width: 12px;
                    font-size: 10px;
                    margin-right: 2px;
                    transition: transform 0.3s;
                }
                
                .expand-icon.expanded {
                    transform: rotate(90deg);
                }
                
                .production-v3-table td {
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 50px;
                    font-size: 12px;
                    position: relative;
                }
                
                .product-cell {
                    text-align: left !important;
                    font-weight: 600;
                    background: #f8f9fa;
                    position: sticky;
                    left: 0;
                    z-index: 5;
                    padding: 8px !important;
                    border-right: 2px solid #1565c0;
                }
                
                .row-type-cell {
                    text-align: left !important;
                    background: #f0f0f0;
                    position: sticky;
                    left: 200px;
                    z-index: 4;
                    padding: 6px !important;
                    min-width: 150px;
                    border-right: 2px solid #666;
                    font-size: 11px;
                }
                
                /* Row type specific styling */
                .row-sales { background: #e3f2fd; }
                .row-stock { background: #fff3e0; }
                .row-production-plan { background: #e8f5e9; }
                .row-actual { background: #f5f5f5; }
                
                /* Cell styling based on data */
                .cell-past { 
                    background: #fafafa;
                    color: #7f8c8d;
                }
                
                .cell-current {
                    background: #fff3e0;
                    color: #e65100;
                    font-weight: bold;
                    border: 2px solid #ff9800;
                }
                
                .cell-future {
                    background: #e3f2fd;
                    color: #1565c0;
                }
                
                /* Stock level colors */
                .stock-critical-cell {
                    background: #ffebee !important;
                    color: #c62828;
                    font-weight: bold;
                }
                
                .stock-low-cell {
                    background: #fff3e0 !important;
                    color: #ef6c00;
                }
                
                .stock-normal-cell {
                    background: #e8f5e9 !important;
                    color: #2e7d32;
                }
                
                .stock-high-cell {
                    background: #e3f2fd !important;
                    color: #1565c0;
                }
                
                .cell-total {
                    background: #fff8e1;
                    font-weight: bold;
                    border-left: 2px solid #666;
                }
                
                /* Editable cells */
                .editable-cell {
                    cursor: pointer;
                    position: relative;
                }
                
                .editable-cell:hover {
                    background: #bbdefb !important;
                    box-shadow: inset 0 0 0 2px #2196f3;
                }
                
                .editable-cell.editing {
                    padding: 0 !important;
                }
                
                .cell-input {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                    text-align: center;
                    font-size: 11px;
                    padding: 6px 4px;
                    box-shadow: inset 0 0 0 2px #4CAF50;
                }
                
                .cell-input:focus {
                    outline: none;
                }
                
                .edited-cell {
                    background: #c8e6c9 !important;
                    font-weight: bold;
                }
                
                .edited-cell::after {
                    content: '*';
                    color: #4CAF50;
                    font-weight: bold;
                    position: absolute;
                    top: 1px;
                    right: 2px;
                    font-size: 10px;
                }
                
                .product-separator {
                    height: 3px;
                    background: #1565c0;
                }
                
                /* Row labels */
                .row-label-sales { color: #1565c0; font-weight: 600; }
                .row-label-stock { color: #ef6c00; font-weight: 600; }
                .row-label-production { color: #2e7d32; font-weight: 600; }
                .row-label-actual { color: #616161; font-weight: 600; }
            </style>
            
            <div class="production-v3-container">
                <div class="production-v3-header">
                    <h2>🏭 Production Planning - Simplified View</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        V3.0.0 - Current Year Focus: Sales, Stock, Production Plan & Actual
                        <br>Expandable: Click months → weeks → days | Edit sales & production plans
                    </div>
                </div>
                
                <div class="stock-indicators">
                    <div class="stock-indicator">
                        <span class="indicator-dot stock-critical"></span>
                        <span>Critical (< Safety Stock)</span>
                    </div>
                    <div class="stock-indicator">
                        <span class="indicator-dot stock-low"></span>
                        <span>Low</span>
                    </div>
                    <div class="stock-indicator">
                        <span class="indicator-dot stock-normal"></span>
                        <span>Normal</span>
                    </div>
                    <div class="stock-indicator">
                        <span class="indicator-dot stock-high"></span>
                        <span>High (Near Max)</span>
                    </div>
                </div>
                
                <div class="production-v3-controls">
                    <button class="save-button" onclick="ProductionPlanningV3.saveData()" id="save-btn" disabled>
                        💾 Save Plans
                    </button>
                    <button class="calculate-button" onclick="ProductionPlanningV3.calculateProduction()">
                        🔄 Auto-Calculate Production
                    </button>
                    <button class="export-button" onclick="ProductionPlanningV3.exportData()">
                        📁 Export Data
                    </button>
                    <button onclick="ProductionPlanningV3.resetData()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔄 Reset
                    </button>
                    <span class="unsaved-indicator" id="unsaved-indicator">
                        Unsaved changes
                    </span>
                </div>
                
                <div class="production-v3-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>📊 Simplified Production Planning:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>📈 <strong>Sales Plan:</strong> Expected sales (editable)</li>
                        <li>📦 <strong>Stock:</strong> Current inventory levels (auto-calculated)</li>
                        <li>🏭 <strong>Production Plan:</strong> Planned production (editable)</li>
                        <li>✅ <strong>Actual Production:</strong> Historical production data</li>
                        <li>🔄 <strong>Auto-Calculate:</strong> Automatically calculates production needs based on sales & stock</li>
                        <li>📅 <strong>Expandable:</strong> Click months → weeks → days for detailed view</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Set up event handlers
        setTimeout(() => {
            this.setupEventHandlers();
        }, 100);
    },
    
    // Render the table
    renderTable() {
        const headers = this.renderHeaders();
        const rows = this.renderAllProductRows();
        
        return `
            <table class="production-v3-table">
                ${headers}
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    },
    
    // Render headers with expandable months/weeks
    renderHeaders() {
        let monthHeaders = '<tr><th class="product-header" rowspan="2">Product</th><th class="row-type-header" rowspan="2">Data Type</th>';
        let subHeaders = '<tr>';
        
        // Build month headers with potential expansion
        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const isExpanded = this.state.expanded.months.has(monthKey);
            
            if (isExpanded) {
                // Show weeks for this month
                const weeksInMonth = this.getCalendarWeeksInMonth(this.state.currentYear, month);
                monthHeaders += `
                    <th class="month-header" colspan="${weeksInMonth.length}" 
                        onclick="ProductionPlanningV3.toggleMonth('${monthKey}')">
                        <span class="expand-icon expanded">▶</span>
                        ${this.getMonthShort(month)}
                    </th>
                `;
                
                // Add week sub-headers
                weeksInMonth.forEach(weekNum => {
                    const weekKey = `week-${month}-${weekNum}`;
                    const weekExpanded = this.state.expanded.weeks.has(weekKey);
                    
                    if (weekExpanded) {
                        // Show days for this week
                        const daysInWeek = this.getDaysOfWeekInMonth(this.state.currentYear, month, weekNum);
                        subHeaders += `
                            <th class="week-header" colspan="${daysInWeek.length}"
                                onclick="ProductionPlanningV3.toggleWeek('${weekKey}')">
                                <span class="expand-icon expanded">▶</span>KW${weekNum}
                            </th>
                        `;
                    } else {
                        subHeaders += `
                            <th class="week-header" 
                                onclick="ProductionPlanningV3.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▶</span>KW${weekNum}
                            </th>
                        `;
                    }
                });
            } else {
                monthHeaders += `
                    <th class="month-header" 
                        onclick="ProductionPlanningV3.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▶</span>
                        ${this.getMonthShort(month)}
                    </th>
                `;
                subHeaders += '<th>-</th>';
            }
        }
        
        monthHeaders += '<th rowspan="2">Total</th></tr>';
        subHeaders += '</tr>';
        
        // Add day headers if any week is expanded
        let dayHeaders = '';
        if ([...this.state.expanded.weeks].length > 0) {
            dayHeaders = '<tr><th></th><th></th>';
            
            for (let month = 1; month <= 12; month++) {
                const monthKey = `month-${month}`;
                if (this.state.expanded.months.has(monthKey)) {
                    const weeksInMonth = this.getCalendarWeeksInMonth(this.state.currentYear, month);
                    weeksInMonth.forEach(weekNum => {
                        const weekKey = `week-${month}-${weekNum}`;
                        if (this.state.expanded.weeks.has(weekKey)) {
                            const daysInWeek = this.getDaysOfWeekInMonth(this.state.currentYear, month, weekNum);
                            daysInWeek.forEach(day => {
                                const dayName = this.getDayShort(new Date(this.state.currentYear, month - 1, day).getDay());
                                dayHeaders += `<th class="day-header">${day}<br>${dayName}</th>`;
                            });
                        } else {
                            dayHeaders += '<th>-</th>';
                        }
                    });
                } else {
                    dayHeaders += '<th>-</th>';
                }
            }
            
            dayHeaders += '<th>-</th></tr>';
        }
        
        return '<thead>' + monthHeaders + subHeaders + dayHeaders + '</thead>';
    },
    
    // Render all product rows (4 rows per product)
    renderAllProductRows() {
        let html = '';
        
        this.state.products.forEach((product, index) => {
            html += this.renderProductRows(product);
            
            // Add separator between products
            if (index < this.state.products.length - 1) {
                html += '<tr class="product-separator"><td colspan="100"></td></tr>';
            }
        });
        
        return html;
    },
    
    // Render 4 rows for a single product
    renderProductRows(product) {
        const productData = this.state.data[product.id];
        let html = '';
        
        // Define the 4 rows we want to show
        const rows = ['salesPlan', 'stock', 'productionPlan', 'actualProduction'];
        
        rows.forEach((rowType, index) => {
            const rowData = productData[rowType];
            const isFirstRow = index === 0;
            
            html += `<tr class="row-${rowType}">`;
            
            // Product cell (only for first row)
            if (isFirstRow) {
                html += `
                    <td class="product-cell" rowspan="4">
                        <strong>${product.code}</strong><br>
                        ${product.name}<br>
                        <small>${product.nameEn}</small><br>
                        <em>${product.unit}</em><br>
                        <small style="color: #666;">
                            Safety: ${product.safetyStock} ${product.unit}<br>
                            Max: ${product.maxStock} ${product.unit}
                        </small>
                    </td>
                `;
            }
            
            // Row type cell
            html += `
                <td class="row-type-cell row-label-${rowType}">
                    ${this.getRowShortLabel(rowType)}
                </td>
            `;
            
            // Data cells based on expansion state
            html += this.renderDataCells(product.id, rowType);
            
            // Total cell
            html += `
                <td class="cell-total">
                    ${this.formatNumber(rowData.total)}
                </td>
            `;
            
            html += '</tr>';
        });
        
        return html;
    },
    
    // Get short row label
    getRowShortLabel(rowType) {
        const labels = {
            'salesPlan': '📈 Sales Plan',
            'stock': '📦 Stock',
            'productionPlan': '🏭 Production Plan',
            'actualProduction': '✅ Actual Production'
        };
        return labels[rowType] || rowType;
    },
    
    // Render data cells based on expansion state
    renderDataCells(productId, rowType) {
        let html = '';
        const product = this.state.products.find(p => p.id === productId);
        const rowData = this.state.data[productId][rowType];
        
        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const monthData = rowData.months[month];
            
            if (this.state.expanded.months.has(monthKey)) {
                // Month is expanded - show weeks
                const weeksInMonth = Object.keys(monthData.weeks);
                weeksInMonth.forEach(weekNum => {
                    const weekKey = `week-${month}-${weekNum}`;
                    const weekData = monthData.weeks[weekNum];
                    
                    if (this.state.expanded.weeks.has(weekKey)) {
                        // Week is expanded - show days
                        Object.keys(weekData.days).forEach(day => {
                            const dayData = weekData.days[day];
                            const cellClass = this.getCellClass(rowType, dayData.value, product, month, day);
                            const cellId = `cell-${productId}-${rowType}-${month}-${day}`;
                            const isEdited = this.state.editedCells.has(cellId);
                            const editedClass = isEdited ? 'edited-cell' : '';
                            const editableClass = dayData.editable ? 'editable-cell' : '';
                            
                            if (dayData.editable) {
                                html += `
                                    <td class="${cellClass} ${editableClass} ${editedClass}"
                                        data-cell-id="${cellId}"
                                        data-product="${productId}"
                                        data-row-type="${rowType}"
                                        data-month="${month}"
                                        data-day="${day}"
                                        data-editable="true"
                                        onclick="ProductionPlanningV3.startEditing(this)">
                                        ${dayData.value}
                                    </td>
                                `;
                            } else {
                                html += `<td class="${cellClass}">${dayData.value}</td>`;
                            }
                        });
                    } else {
                        // Week not expanded - show week total
                        const cellClass = this.getCellClass(rowType, weekData.total, product, month);
                        html += `<td class="${cellClass}">${this.formatNumber(weekData.total)}</td>`;
                    }
                });
            } else {
                // Month not expanded - show month total
                const cellClass = this.getCellClass(rowType, monthData.total, product, month);
                const cellId = `cell-${productId}-${rowType}-${month}`;
                const isEdited = this.state.editedCells.has(cellId);
                const editedClass = isEdited ? 'edited-cell' : '';
                const editableClass = monthData.editable ? 'editable-cell' : '';
                
                if (monthData.editable) {
                    html += `
                        <td class="${cellClass} ${editableClass} ${editedClass}"
                            data-cell-id="${cellId}"
                            data-product="${productId}"
                            data-row-type="${rowType}"
                            data-month="${month}"
                            data-editable="true"
                            onclick="ProductionPlanningV3.startEditingMonth(this)">
                            ${this.formatNumber(monthData.total)}
                        </td>
                    `;
                } else {
                    html += `<td class="${cellClass}">${this.formatNumber(monthData.total)}</td>`;
                }
            }
        }
        
        return html;
    },
    
    // Get cell class based on row type and value
    getCellClass(rowType, value, product, month, day) {
        // Check if past, current, or future
        const today = this.state.today;
        const dateToCheck = day ? 
            new Date(this.state.currentYear, month - 1, day) :
            new Date(this.state.currentYear, month - 1, 15); // Use middle of month for month cells
        
        const isPast = dateToCheck < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isCurrent = dateToCheck.toDateString() === today.toDateString();
        
        if (rowType === 'stock') {
            // Special coloring for stock levels
            if (value < product.safetyStock) {
                return 'stock-critical-cell';
            } else if (value < product.safetyStock * 1.5) {
                return 'stock-low-cell';
            } else if (value > product.maxStock * 0.9) {
                return 'stock-high-cell';
            } else {
                return 'stock-normal-cell';
            }
        }
        
        if (isCurrent) return 'cell-current';
        if (isPast) return 'cell-past';
        return 'cell-future';
    },
    
    // Toggle month expansion
    toggleMonth(monthKey) {
        if (this.state.expanded.months.has(monthKey)) {
            this.state.expanded.months.delete(monthKey);
            // Also collapse all weeks in this month
            const month = parseInt(monthKey.split('-')[1]);
            [...this.state.expanded.weeks].forEach(weekKey => {
                if (weekKey.startsWith(`week-${month}-`)) {
                    this.state.expanded.weeks.delete(weekKey);
                }
            });
        } else {
            this.state.expanded.months.add(monthKey);
        }
        this.renderProductionGrid();
    },
    
    // Toggle week expansion
    toggleWeek(weekKey) {
        if (this.state.expanded.weeks.has(weekKey)) {
            this.state.expanded.weeks.delete(weekKey);
        } else {
            this.state.expanded.weeks.add(weekKey);
        }
        this.renderProductionGrid();
    },
    
    // Start editing a cell (day level)
    startEditing(cell) {
        if (cell.classList.contains('editing')) return;
        
        const currentValue = parseInt(cell.textContent) || 0;
        
        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" class="cell-input" value="${currentValue}" min="0" step="1">`;
        
        const input = cell.querySelector('.cell-input');
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newValue = parseInt(input.value) || 0;
            this.saveEdit(cell, newValue);
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });
    },
    
    // Start editing a month cell
    startEditingMonth(cell) {
        if (cell.classList.contains('editing')) return;
        
        const currentValue = parseInt(cell.textContent.replace(/,/g, '')) || 0;
        
        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" class="cell-input" value="${currentValue}" min="0" step="1">`;
        
        const input = cell.querySelector('.cell-input');
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newValue = parseInt(input.value) || 0;
            this.saveMonthEdit(cell, newValue);
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });
    },
    
    // Save day edit
    saveEdit(cell, newValue) {
        const cellId = cell.dataset.cellId;
        const productId = cell.dataset.product;
        const rowType = cell.dataset.rowType;
        const month = parseInt(cell.dataset.month);
        const day = parseInt(cell.dataset.day);
        
        // Update the data
        const rowData = this.state.data[productId][rowType];
        let oldValue = 0;
        
        // Find the correct week for this day
        Object.keys(rowData.months[month].weeks).forEach(weekNum => {
            if (rowData.months[month].weeks[weekNum].days[day]) {
                oldValue = rowData.months[month].weeks[weekNum].days[day].value;
                rowData.months[month].weeks[weekNum].days[day].value = newValue;
                
                // Recalculate week total
                rowData.months[month].weeks[weekNum].total = Object.values(
                    rowData.months[month].weeks[weekNum].days
                ).reduce((sum, d) => sum + d.value, 0);
            }
        });
        
        // Emit event for actual production changes
        if (rowType === 'actualProduction' && newValue !== oldValue && typeof ChEvents !== 'undefined') {
            const difference = newValue - oldValue;
            if (difference > 0) {
                ChEvents.emit(EVENTS.PRODUCTION_COMPLETED, {
                    articleNumber: productId,
                    quantity: difference,
                    reference: `PROD-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`
                });
            }
        }
        
        // Recalculate month and year totals
        this.recalculateTotals(productId, rowType);
        
        // Mark as edited
        this.state.editedCells.add(cellId);
        this.state.unsavedChanges = true;
        this.updateSaveButton();
        
        // Re-render
        this.renderProductionGrid();
    },
    
    // Save month edit
    saveMonthEdit(cell, newValue) {
        const productId = cell.dataset.product;
        const rowType = cell.dataset.rowType;
        const month = parseInt(cell.dataset.month);
        
        const rowData = this.state.data[productId][rowType];
        const monthData = rowData.months[month];
        
        // Count editable days in the month
        let editableDays = 0;
        Object.values(monthData.weeks).forEach(week => {
            Object.values(week.days).forEach(day => {
                if (day.editable) editableDays++;
            });
        });
        
        // Distribute value across editable days
        const baseValuePerDay = Math.floor(newValue / editableDays);
        let remainder = newValue - (baseValuePerDay * editableDays);
        
        Object.values(monthData.weeks).forEach(week => {
            Object.keys(week.days).forEach(dayKey => {
                if (week.days[dayKey].editable) {
                    let dayValue = baseValuePerDay;
                    if (remainder > 0) {
                        dayValue++;
                        remainder--;
                    }
                    week.days[dayKey].value = dayValue;
                }
            });
            
            // Recalculate week total
            week.total = Object.values(week.days).reduce((sum, d) => sum + d.value, 0);
        });
        
        // Recalculate totals
        this.recalculateTotals(productId, rowType);
        
        // Mark as edited
        this.state.editedCells.add(`cell-${productId}-${rowType}-${month}`);
        this.state.unsavedChanges = true;
        this.updateSaveButton();
        
        // Re-render
        this.renderProductionGrid();
    },
    
    // Recalculate totals
    recalculateTotals(productId, rowType) {
        const rowData = this.state.data[productId][rowType];
        
        rowData.total = 0;
        Object.values(rowData.months).forEach(month => {
            month.total = 0;
            Object.values(month.weeks).forEach(week => {
                month.total += week.total;
            });
            rowData.total += month.total;
        });
    },
    
    // Calculate production based on sales and stock
    calculateProduction() {
        this.state.products.forEach(product => {
            const productData = this.state.data[product.id];
            const salesPlan = productData.salesPlan;
            const stock = productData.stock;
            const productionPlan = productData.productionPlan;
            
            // For each month, calculate required production
            for (let month = 1; month <= 12; month++) {
                const monthSales = salesPlan.months[month].total;
                const monthStock = stock.months[month].total;
                
                // Calculate required production to maintain safety stock
                const targetStock = product.safetyStock * 1.5; // Target 150% of safety stock
                const requiredProduction = Math.max(0, monthSales + (targetStock - monthStock));
                
                // Distribute across days
                const monthData = productionPlan.months[month];
                let totalDays = 0;
                Object.values(monthData.weeks).forEach(week => {
                    totalDays += Object.keys(week.days).length;
                });
                
                const productionPerDay = Math.round(requiredProduction / totalDays);
                
                // Update production plan
                Object.values(monthData.weeks).forEach(week => {
                    Object.keys(week.days).forEach(dayKey => {
                        if (week.days[dayKey].editable) {
                            week.days[dayKey].value = productionPerDay;
                        }
                    });
                    week.total = Object.values(week.days).reduce((sum, d) => sum + d.value, 0);
                });
                
                monthData.total = Object.values(monthData.weeks).reduce((sum, week) => sum + week.total, 0);
            }
            
            // Recalculate year total
            productionPlan.total = Object.values(productionPlan.months).reduce((sum, month) => sum + month.total, 0);
        });
        
        this.state.unsavedChanges = true;
        this.updateSaveButton();
        this.renderProductionGrid();
        
        alert('🔄 Production plan calculated based on sales plan and stock levels!');
    },
    
    // Update save button
    updateSaveButton() {
        const saveBtn = document.getElementById('save-btn');
        const indicator = document.getElementById('unsaved-indicator');
        
        if (saveBtn) {
            saveBtn.disabled = !this.state.unsavedChanges;
        }
        
        if (indicator) {
            if (this.state.unsavedChanges) {
                indicator.classList.add('show');
            } else {
                indicator.classList.remove('show');
            }
        }
    },
    
    // Save data
    saveData() {
        localStorage.setItem('productionPlanningV3Data', JSON.stringify(this.state.data));
        localStorage.setItem('productionV3EditedCells', JSON.stringify([...this.state.editedCells]));
        
        this.state.unsavedChanges = false;
        this.updateSaveButton();
        
        alert('✅ Production planning data saved successfully!');
    },
    
    // Export data
    exportData() {
        const exportData = {
            version: this.VERSION,
            exportDate: new Date().toISOString(),
            year: this.state.currentYear,
            products: this.state.products,
            data: this.state.data
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `production-planning-simplified-${this.state.currentYear}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Reset data
    resetData() {
        if (confirm('Are you sure you want to reset all production planning data? This will lose all your edits.')) {
            this.state.editedCells.clear();
            this.state.unsavedChanges = false;
            localStorage.removeItem('productionPlanningV3Data');
            localStorage.removeItem('productionV3EditedCells');
            
            // Regenerate default data
            this.state.products.forEach(product => {
                this.state.data[product.id] = this.generateProductData(product);
            });
            
            this.renderProductionGrid();
        }
    },
    
    // Setup event handlers
    setupEventHandlers() {
        // Auto-save reminder
        window.addEventListener('beforeunload', (e) => {
            if (this.state.unsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    },
    
    // Helper functions
    formatNumber(num) {
        return num.toLocaleString('sl-SI');
    },
    
    getMonthName(month) {
        const months = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
                       'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];
        return months[month - 1];
    },
    
    getMonthShort(month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
                       'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
        return months[month - 1];
    },
    
    getDayShort(dayOfWeek) {
        const days = ['N', 'P', 'T', 'S', 'Č', 'P', 'S'];
        return days[dayOfWeek];
    },
    
    getCalendarWeeksInMonth(year, month) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        const firstWeek = this.getWeekNumber(firstDay);
        const lastWeek = this.getWeekNumber(lastDay);
        
        const weeks = [];
        if (lastWeek < firstWeek) {
            for (let w = firstWeek; w <= 52; w++) weeks.push(w);
            for (let w = 1; w <= lastWeek; w++) weeks.push(w);
        } else {
            for (let w = firstWeek; w <= lastWeek; w++) weeks.push(w);
        }
        
        return weeks;
    },
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    getDaysOfWeekInMonth(year, month, weekNum) {
        const days = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            if (this.getWeekNumber(date) === weekNum) {
                days.push(day);
            }
        }
        
        return days;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionPlanningV3;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.ProductionPlanningV3 = ProductionPlanningV3;
}
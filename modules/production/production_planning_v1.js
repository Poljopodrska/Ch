// Ch Production Planning Module V1 - Based on Planning V4 structure
// Stage 1: Basic production planning table
// Future stages will add: stock calculation, BOM, capacity planning

const ProductionPlanningV1 = {
    VERSION: '1.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentDay: new Date().getDate(),
        today: new Date(),
        expanded: {
            months: new Set(),
            weeks: new Set()
        },
        data: {},
        products: [],
        stock: {} // Will be populated in Stage 2
    },
    
    // Initialize the module
    init() {
        console.log(`Production Planning Module V${this.VERSION} initializing...`);
        
        // Reset state for re-initialization
        if (this.initialized) {
            console.log('Production Planning re-initializing, resetting state...');
            this.initialized = false;
            this.state.expanded.months.clear();
            this.state.expanded.weeks.clear();
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
                console.error('ERROR: Could not find main-content element either!');
                return;
            }
        }
        
        // Clear any existing content
        const gridContainer = document.getElementById('production-planning-grid');
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        
        this.loadExampleData();
        this.renderGrid();
        
        this.initialized = true;
        console.log('Production Planning V1 initialized');
    },
    
    initialized: false,
    
    // Load example data
    loadExampleData() {
        const currentYear = this.state.currentYear;
        
        // Example products with production-specific data
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                category: 'Sveže meso',
                productGroup: 'Fresh Meat',      // Marketing grouping
                productionGroup: 'Line A',        // Production line grouping
                currentStock: 250                 // Current stock level
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                category: 'Premium meso',
                productGroup: 'Premium Cuts',
                productionGroup: 'Line A',
                currentStock: 150
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                category: 'Perutnina',
                productGroup: 'Poultry',
                productionGroup: 'Line B',
                currentStock: 500
            }
        ];
        
        // Generate production data for each product
        this.state.products.forEach(product => {
            this.state.data[product.id] = this.generateProductData(product.id, currentYear);
            // Initialize stock data (will be enhanced in Stage 2)
            this.state.stock[product.id] = product.currentStock;
        });
    },
    
    // Generate production data for a product
    generateProductData(productId, currentYear) {
        const data = {};
        
        // Generate for years N-1 to N+1 (3 years for production planning)
        for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (yearOffset === 0) {
                // Current year: actual + plan
                data[`${year}_actual`] = this.generateYearData(productId, year, yearOffset, false);
                // Plan only version
                data[`${year}_plan`] = this.generateYearData(productId, year, yearOffset, true);
            } else {
                data[year] = this.generateYearData(productId, year, yearOffset, false);
            }
        }
        
        return data;
    },
    
    // Generate data for a single year
    generateYearData(productId, year, yearOffset, planOnlyMode = false) {
        const yearData = {
            label: `${year}`,
            shortLabel: yearOffset === 0 ? (planOnlyMode ? 'N (Plan)' : 'N (Prod)') : 
                       yearOffset === -1 ? 'N-1' : 'N+1',
            total: 0,
            type: yearOffset < 0 ? 'historical' : yearOffset > 0 ? 'future' : 'current',
            isPlanOnly: planOnlyMode,
            months: {}
        };
        
        // Generate monthly data
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                label: this.getMonthName(month),
                shortLabel: this.getMonthShort(month),
                total: 0,
                type: this.getDataType(yearOffset, month, 15, planOnlyMode),
                weeks: {}
            };
            
            // Generate weekly data
            const weeksInMonth = this.getCalendarWeeksInMonth(year, month);
            weeksInMonth.forEach(weekNum => {
                const weekData = {
                    label: `KW${weekNum}`,
                    total: 0,
                    days: {}
                };
                
                // Generate daily data
                const daysInWeek = this.getDaysOfWeekInMonth(year, month, weekNum);
                daysInWeek.forEach(day => {
                    const dataType = this.getDataType(yearOffset, month, day, planOnlyMode);
                    const value = this.generateDailyValue(productId, year, month, day, yearOffset, dataType);
                    weekData.days[day] = {
                        label: day.toString(),
                        dayName: this.getDayShort(new Date(year, month - 1, day).getDay()),
                        value: value,
                        type: dataType
                    };
                    weekData.total += value;
                });
                
                monthData.weeks[weekNum] = weekData;
                monthData.total += weekData.total;
            });
            
            yearData.months[month] = monthData;
            yearData.total += monthData.total;
        }
        
        return yearData;
    },
    
    // Generate production values (slightly different from sales)
    generateDailyValue(productId, year, month, day, yearOffset, dataType) {
        const bases = {
            'p001': 45,  // Higher than sales to account for stock building
            'p002': 30,
            'p003': 55
        };
        
        const base = bases[productId] || 35;
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        
        // Production is typically Monday-Friday, reduced on Saturday, none on Sunday
        let dayFactor = 1;
        if (dayOfWeek === 6) dayFactor = 0.3;  // Saturday
        if (dayOfWeek === 0) dayFactor = 0;    // Sunday
        
        const seasonalFactor = 1 + 0.15 * Math.sin((month - 1) * Math.PI / 6);
        const yearGrowth = Math.pow(1.02, year - 2020);
        
        let randomFactor;
        if (dataType === 'actual' || dataType === 'historical') {
            randomFactor = 0.8 + Math.random() * 0.4;
        } else {
            randomFactor = 0.95 + Math.random() * 0.1; // Production plans are more stable
        }
        
        return Math.round(base * dayFactor * seasonalFactor * randomFactor * yearGrowth);
    },
    
    // Get data type based on today's date
    getDataType(yearOffset, month, day, planOnlyMode = false) {
        if (planOnlyMode) return 'plan';
        
        const today = this.state.today;
        const currentYear = today.getFullYear();
        const year = currentYear + yearOffset;
        
        if (yearOffset < 0) return 'historical';
        if (yearOffset > 0) return 'future';
        
        const dateToCheck = new Date(year, month - 1, day);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (dateToCheck < todayMidnight) {
            return 'actual';
        } else if (dateToCheck.getTime() === todayMidnight.getTime()) {
            return 'current';
        } else {
            return 'plan';
        }
    },
    
    // Render the production planning grid
    renderGrid() {
        const container = document.getElementById('production-planning-grid');
        if (!container) return;
        
        let html = `
            <style>
                .production-planning-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .production-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .production-header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                
                .production-info {
                    margin-top: 10px;
                    font-size: 14px;
                    opacity: 0.95;
                }
                
                .production-table-wrapper {
                    background: white;
                    border-radius: 8px;
                    overflow-x: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .production-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1400px;
                }
                
                .production-table th {
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
                
                .production-table td {
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 50px;
                    font-size: 12px;
                }
                
                .product-cell {
                    text-align: left !important;
                    font-weight: 600;
                    background: #f8f9fa;
                    position: sticky;
                    left: 0;
                    z-index: 5;
                    padding: 8px !important;
                    min-width: 200px;
                }
                
                .stock-indicator {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 11px;
                    margin-top: 4px;
                    background: #e3f2fd;
                    color: #1565c0;
                }
                
                /* Cell type styling */
                .cell-historical { background: #fafafa; color: #7f8c8d; }
                .cell-actual { background: #e8f5e9; color: #2e7d32; font-weight: 600; }
                .cell-current { background: #fff3e0; color: #e65100; font-weight: bold; }
                .cell-plan { background: #e3f2fd; color: #1565c0; }
                .cell-future { background: #f3e5f5; color: #6a1b9a; }
            </style>
            
            <div class="production-planning-container">
                <div class="production-header">
                    <h2>🏭 Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="production-info">
                        Stage 1: Basic Production Planning Table
                        <br>📦 Current Stock Levels Shown | Production = Sales Plan - Stock
                        <br>Future: BOM, Capacity Planning, Production Groups
                    </div>
                </div>
                
                <div class="production-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>Stage 1 Features:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>✅ Basic production planning table</li>
                        <li>✅ 3 years view: N-1, N (Actual+Plan), N (Plan), N+1</li>
                        <li>✅ Current stock shown for each product</li>
                        <li>📅 Today's date: <strong>${new Date().toLocaleDateString('sl-SI')}</strong></li>
                        <li>🔜 Coming: Stock calculation, BOM, Capacity planning</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render the table
    renderTable() {
        const headers = this.renderHeaders();
        const rows = this.renderAllProductRows();
        
        return `
            <table class="production-table">
                ${headers}
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    },
    
    // Render headers
    renderHeaders() {
        let monthHeaders = '<tr><th rowspan="2">Product</th><th rowspan="2">Year</th>';
        
        for (let month = 1; month <= 12; month++) {
            monthHeaders += `<th>${this.getMonthShort(month)}</th>`;
        }
        
        monthHeaders += '<th rowspan="2">Total</th></tr>';
        monthHeaders += '<tr>';
        
        for (let month = 1; month <= 12; month++) {
            monthHeaders += '<th>-</th>';
        }
        
        monthHeaders += '</tr>';
        
        return '<thead>' + monthHeaders + '</thead>';
    },
    
    // Render all product rows
    renderAllProductRows() {
        let html = '';
        
        this.state.products.forEach((product, index) => {
            html += this.renderProductRows(product);
            
            if (index < this.state.products.length - 1) {
                html += '<tr style="height: 3px; background: #1565c0;"><td colspan="100"></td></tr>';
            }
        });
        
        return html;
    },
    
    // Render rows for a single product
    renderProductRows(product) {
        let html = '';
        const currentYear = this.state.currentYear;
        let rowIndex = 0;
        
        for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (yearOffset === 0) {
                // Current year: two rows
                const actualData = this.state.data[product.id][`${year}_actual`];
                html += this.renderSingleRow(product, actualData, year, rowIndex === 0);
                rowIndex++;
                
                const planData = this.state.data[product.id][`${year}_plan`];
                html += this.renderSingleRow(product, planData, year, false);
                rowIndex++;
            } else {
                const yearData = this.state.data[product.id][year];
                html += this.renderSingleRow(product, yearData, year, rowIndex === 0);
                rowIndex++;
            }
        }
        
        return html;
    },
    
    // Render a single row
    renderSingleRow(product, yearData, year, isFirstRow) {
        let html = '<tr>';
        
        // Product cell (only for first row)
        if (isFirstRow) {
            html += `
                <td class="product-cell" rowspan="4">
                    <strong>${product.code}</strong><br>
                    ${product.name}<br>
                    <small>${product.nameEn}</small><br>
                    <span class="stock-indicator">Stock: ${product.currentStock} ${product.unit}</span>
                </td>
            `;
        }
        
        // Year cell
        html += `<td style="background: #f0f0f0; font-weight: 500;">
            ${year}<br><small>${yearData.shortLabel}</small>
        </td>`;
        
        // Month cells
        for (let month = 1; month <= 12; month++) {
            const monthData = yearData.months[month];
            const cellClass = `cell-${monthData.type}`;
            html += `<td class="${cellClass}">${this.formatNumber(monthData.total)}</td>`;
        }
        
        // Total cell
        html += `<td style="background: #fff8e1; font-weight: bold;">
            ${this.formatNumber(yearData.total)}
        </td>`;
        
        html += '</tr>';
        return html;
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
    module.exports = ProductionPlanningV1;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.ProductionPlanningV1 = ProductionPlanningV1;
}
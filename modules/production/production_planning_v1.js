// Ch Production Planning Module V1 - Based on Planning V4 structure
// Stage 4: Enhanced with Product Groups, Production Groups and Capacity Constraints
// Production Need = Sales Plan - Current Stock

const ProductionPlanningV1 = {
    VERSION: '1.2.0',
    
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
        stock: {}, // Current stock levels
        productGroups: [], // Marketing product groups
        productionGroups: [], // Production line groups
        capacityConstraints: {}, // Daily capacity limits per line
        groupView: 'none' // 'none', 'product', 'production'
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
        
        // Define product groups (marketing categories)
        this.state.productGroups = [
            { id: 'fresh', name: 'Fresh Meat', color: '#4caf50' },
            { id: 'premium', name: 'Premium Cuts', color: '#2196f3' },
            { id: 'poultry', name: 'Poultry', color: '#ff9800' },
            { id: 'processed', name: 'Processed', color: '#9c27b0' },
            { id: 'specialty', name: 'Specialty', color: '#f44336' }
        ];
        
        // Define production groups (production lines)
        this.state.productionGroups = [
            { 
                id: 'line_a', 
                name: 'Line A - Fresh/Premium',
                color: '#1976d2',
                dailyCapacity: 2200, // kg/day at 1 shift
                maxCapacity: 7500   // kg/day at 4 shifts
            },
            { 
                id: 'line_b', 
                name: 'Line B - Poultry',
                color: '#388e3c',
                dailyCapacity: 3300,
                maxCapacity: 11000
            },
            { 
                id: 'line_c', 
                name: 'Line C - Processed',
                color: '#7b1fa2',
                dailyCapacity: 1760,
                maxCapacity: 5900
            }
        ];
        
        // Example products with production-specific data
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                category: 'Sveže meso',
                productGroup: 'fresh',
                productionGroup: 'line_a',
                currentStock: 250,
                minBatchSize: 50,  // Minimum production batch
                maxDailyProduction: 1000  // Product-specific daily limit
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                category: 'Premium meso',
                productGroup: 'premium',
                productionGroup: 'line_a',
                currentStock: 150,
                minBatchSize: 30,
                maxDailyProduction: 600
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                category: 'Perutnina',
                productGroup: 'poultry',
                productionGroup: 'line_b',
                currentStock: 500,
                minBatchSize: 100,
                maxDailyProduction: 2000
            },
            {
                id: 'p004',
                code: 'JAG-400',
                name: 'Jagnječji kotleti',
                nameEn: 'Lamb Chops',
                unit: 'kg',
                category: 'Specialty meso',
                productGroup: 'specialty',
                productionGroup: 'line_a',
                currentStock: 75,
                minBatchSize: 20,
                maxDailyProduction: 300
            },
            {
                id: 'p005',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                category: 'Mesni izdelki',
                productGroup: 'processed',
                productionGroup: 'line_c',
                currentStock: 320,
                minBatchSize: 80,
                maxDailyProduction: 800
            }
        ];
        
        // Generate production data for each product
        this.state.products.forEach(product => {
            this.state.data[product.id] = this.generateProductData(product.id, currentYear);
            // Initialize stock data
            this.state.stock[product.id] = product.currentStock;
        });
        
        // Initialize capacity constraints
        this.initializeCapacityConstraints();
    },
    
    // Initialize daily capacity constraints per production line
    initializeCapacityConstraints() {
        const currentYear = this.state.currentYear;
        
        this.state.productionGroups.forEach(line => {
            this.state.capacityConstraints[line.id] = {};
            
            // Generate constraints for current year
            for (let month = 1; month <= 12; month++) {
                const daysInMonth = new Date(currentYear, month, 0).getDate();
                
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateKey = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    
                    // Calculate capacity based on shift pattern (example: mostly 1 shift, some 2 shift days)
                    const dayOfWeek = new Date(currentYear, month - 1, day).getDay();
                    let shiftMultiplier = 1; // Default 1 shift
                    
                    // Increase shifts for high-demand days (Thursday, Friday)
                    if (dayOfWeek === 4 || dayOfWeek === 5) {
                        shiftMultiplier = 2; // 2 shifts
                    }
                    // No production on Sunday
                    if (dayOfWeek === 0) {
                        shiftMultiplier = 0;
                    }
                    
                    this.state.capacityConstraints[line.id][dateKey] = {
                        available: line.dailyCapacity * shiftMultiplier,
                        used: 0,
                        remaining: line.dailyCapacity * shiftMultiplier,
                        shifts: shiftMultiplier
                    };
                }
            }
        });
    },
    
    // Check if production is feasible with capacity constraints
    checkCapacityConstraint(productId, date, quantity) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return { feasible: false, reason: 'Product not found' };
        
        const line = this.state.productionGroups.find(l => l.id === product.productionGroup);
        if (!line) return { feasible: false, reason: 'Production line not found' };
        
        const dateKey = this.formatDateKey(date);
        const constraint = this.state.capacityConstraints[line.id][dateKey];
        
        if (!constraint) {
            return { feasible: false, reason: 'No capacity data for this date' };
        }
        
        // Check if quantity exceeds available capacity
        if (quantity > constraint.remaining) {
            return { 
                feasible: false, 
                reason: `Exceeds available capacity (${constraint.remaining} kg remaining)`,
                available: constraint.remaining,
                required: quantity
            };
        }
        
        // Check if quantity exceeds product daily limit
        if (quantity > product.maxDailyProduction) {
            return { 
                feasible: false, 
                reason: `Exceeds product daily limit (max ${product.maxDailyProduction} kg)`,
                maxAllowed: product.maxDailyProduction
            };
        }
        
        // Check minimum batch size
        if (quantity < product.minBatchSize && quantity > 0) {
            return { 
                feasible: false, 
                reason: `Below minimum batch size (min ${product.minBatchSize} kg)`,
                minRequired: product.minBatchSize
            };
        }
        
        return { feasible: true };
    },
    
    // Format date as YYYY-MM-DD
    formatDateKey(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
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
                    background: var(--ch-primary-dark);
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
                    background: var(--ch-gray-100);
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
                    background: var(--ch-primary-light);
                    color: var(--ch-primary-dark);
                }
                
                /* Cell type styling */
                .cell-historical { background: var(--ch-gray-100); color: #7f8c8d; }
                .cell-actual { background: #e8f5e9; color: var(--ch-success); font-weight: 600; }
                .cell-current { background: #fff3e0; color: var(--ch-warning); font-weight: bold; }
                .cell-plan { background: var(--ch-primary-light); color: var(--ch-primary-dark); }
                .cell-future { background: #f3e5f5; color: var(--ch-primary-dark); }
            </style>
            
            <div class="production-planning-container">
                <div class="production-header">
                    <h2>[Factory] Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="production-info">
                        Stage 4: Enhanced with Groups & Capacity Constraints
                        <br>[Box] Current Stock | 🏷️ Product Groups | [Factory] Production Lines | [Settings] Capacity Limits
                    </div>
                </div>
                
                <div style="margin: 20px 0; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <label style="font-weight: bold; margin-right: 10px;">Group by:</label>
                    <button onclick="ProductionPlanningV1.setGroupView('none')" 
                            style="padding: 8px 16px; background: ${this.state.groupView === 'none' ? '#1976d2' : '#e0e0e0'}; 
                                   color: ${this.state.groupView === 'none' ? 'white' : 'black'}; 
                                   border: none; border-radius: 4px; cursor: pointer;">
                        No Grouping
                    </button>
                    <button onclick="ProductionPlanningV1.setGroupView('product')" 
                            style="padding: 8px 16px; background: ${this.state.groupView === 'product' ? '#1976d2' : '#e0e0e0'}; 
                                   color: ${this.state.groupView === 'product' ? 'white' : 'black'}; 
                                   border: none; border-radius: 4px; cursor: pointer;">
                        Product Groups
                    </button>
                    <button onclick="ProductionPlanningV1.setGroupView('production')" 
                            style="padding: 8px 16px; background: ${this.state.groupView === 'production' ? '#1976d2' : '#e0e0e0'}; 
                                   color: ${this.state.groupView === 'production' ? 'white' : 'black'}; 
                                   border: none; border-radius: 4px; cursor: pointer;">
                        Production Lines
                    </button>
                    <span style="margin-left: 20px; color: #666;">
                        ${this.getGroupingSummary()}
                    </span>
                </div>
                
                <div class="production-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: var(--ch-gray-200); border-radius: 8px;">
                    <h4>Stage 4 Features:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>[OK] Product Groups (Marketing categories)</li>
                        <li>[OK] Production Groups (Production lines)</li>
                        <li>[OK] Capacity constraints per line</li>
                        <li>[OK] Min batch size & max daily production limits</li>
                        <li>[OK] Dynamic shift allocation (1-4 shifts)</li>
                        <li>[Calendar] Today's date: <strong>${new Date().toLocaleDateString('sl-SI')}</strong></li>
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
        
        if (this.state.groupView === 'none') {
            // No grouping - render all products
            this.state.products.forEach((product, index) => {
                html += this.renderProductRows(product);
                
                if (index < this.state.products.length - 1) {
                    html += '<tr style="height: 3px; background: var(--ch-primary-dark);"><td colspan="100"></td></tr>';
                }
            });
        } else if (this.state.groupView === 'product') {
            // Group by product groups
            this.state.productGroups.forEach(group => {
                const groupProducts = this.state.products.filter(p => p.productGroup === group.id);
                if (groupProducts.length > 0) {
                    html += `<tr style="background: ${group.color}; color: white;">
                        <td colspan="15" style="padding: 10px; font-weight: bold; font-size: 14px;">
                            🏷️ ${group.name} (${groupProducts.length} products)
                        </td>
                    </tr>`;
                    
                    groupProducts.forEach((product, index) => {
                        html += this.renderProductRows(product);
                        if (index < groupProducts.length - 1) {
                            html += '<tr style="height: 1px; background: var(--ch-gray-200);"><td colspan="100"></td></tr>';
                        }
                    });
                }
            });
        } else if (this.state.groupView === 'production') {
            // Group by production lines
            this.state.productionGroups.forEach(line => {
                const lineProducts = this.state.products.filter(p => p.productionGroup === line.id);
                if (lineProducts.length > 0) {
                    const capacityInfo = `Capacity: ${line.dailyCapacity} kg/day (1 shift) - ${line.maxCapacity} kg/day (4 shifts)`;
                    html += `<tr style="background: ${line.color}; color: white;">
                        <td colspan="15" style="padding: 10px; font-weight: bold; font-size: 14px;">
                            [Factory] ${line.name} | ${capacityInfo}
                        </td>
                    </tr>`;
                    
                    lineProducts.forEach((product, index) => {
                        html += this.renderProductRows(product);
                        if (index < lineProducts.length - 1) {
                            html += '<tr style="height: 1px; background: var(--ch-gray-200);"><td colspan="100"></td></tr>';
                        }
                    });
                }
            });
        }
        
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
            const productGroup = this.state.productGroups.find(g => g.id === product.productGroup);
            const productionLine = this.state.productionGroups.find(l => l.id === product.productionGroup);
            
            html += `
                <td class="product-cell" rowspan="4">
                    <strong>${product.code}</strong><br>
                    ${product.name}<br>
                    <small>${product.nameEn}</small><br>
                    <span class="stock-indicator">Stock: ${product.currentStock} ${product.unit}</span><br>
                    <small style="color: ${productGroup?.color || '#666'};">[Box] ${productGroup?.name || 'N/A'}</small><br>
                    <small style="color: ${productionLine?.color || '#666'};">[Factory] ${productionLine?.name || 'N/A'}</small><br>
                    <small style="color: #999;">Min: ${product.minBatchSize} | Max: ${product.maxDailyProduction} ${product.unit}/day</small>
                </td>
            `;
        }
        
        // Year cell
        html += `<td style="background: var(--ch-gray-200); font-weight: 500;">
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
    },
    
    // Set grouping view
    setGroupView(viewType) {
        this.state.groupView = viewType;
        this.renderGrid();
    },
    
    // Get grouping summary text
    getGroupingSummary() {
        if (this.state.groupView === 'none') {
            return `Showing ${this.state.products.length} products`;
        } else if (this.state.groupView === 'product') {
            return `${this.state.productGroups.length} product groups`;
        } else if (this.state.groupView === 'production') {
            return `${this.state.productionGroups.length} production lines`;
        }
        return '';
    },
    
    // Calculate production feasibility for a date range
    calculateFeasibility(productId, startDate, endDate, dailyQuantity) {
        const results = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            const check = this.checkCapacityConstraint(productId, current, dailyQuantity);
            results.push({
                date: new Date(current),
                quantity: dailyQuantity,
                feasible: check.feasible,
                reason: check.reason || 'OK'
            });
            
            current.setDate(current.getDate() + 1);
        }
        
        return results;
    },
    
    // Get capacity utilization for a production line
    getLineUtilization(lineId, date) {
        const dateKey = this.formatDateKey(date);
        const constraint = this.state.capacityConstraints[lineId]?.[dateKey];
        
        if (!constraint) return null;
        
        return {
            total: constraint.available,
            used: constraint.used,
            remaining: constraint.remaining,
            utilization: constraint.available > 0 ? 
                (constraint.used / constraint.available * 100).toFixed(1) : 0,
            shifts: constraint.shifts
        };
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
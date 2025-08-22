// Ch Planning Module V4 - Horizontal Layout with 6 Year Rows per Product
// Each product has 6 rows: N-2, N-1, N (Actual+Plan), N (Plan only), N+1, N+2
// Months shown by default → expandable to weeks → expandable to days

const PlanningV4 = {
    VERSION: '4.0.5',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentWeek: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7),
        currentDay: new Date().getDate(),
        today: new Date(),
        expanded: {
            months: new Set(),  // Which months are expanded to show weeks
            weeks: new Set(),   // Which weeks are expanded to show days
            customers: new Set()  // Which products have expanded customer view
        },
        data: {},
        products: [],
        customerData: {},  // Customer-specific planning data
        showCustomerView: true  // Enable customer expansion feature
    },
    
    // Initialize the planning module
    init() {
        console.log(`Planning Module V${this.VERSION} - 5 rows per product initializing...`);
        
        // Reset state for re-initialization
        if (this.initialized) {
            console.log('Planning V4 re-initializing, resetting state...');
            this.initialized = false;
            this.state.expanded.months.clear();
            this.state.expanded.weeks.clear();
        }
        
        const container = document.getElementById('planning-grid');
        if (!container) {
            console.error('ERROR: planning-grid container not found!');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const newContainer = document.createElement('div');
                newContainer.id = 'planning-grid';
                mainContent.appendChild(newContainer);
                console.log('Created planning-grid container');
            } else {
                console.error('ERROR: Could not find main-content element either!');
                return;
            }
        }
        
        // Clear any existing content
        const gridContainer = document.getElementById('planning-grid');
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        
        this.loadExampleData();
        this.renderPlanningGrid();
        
        this.initialized = true;
        console.log('Planning V4 initialized - 5 year rows per product');
    },
    
    initialized: false,
    
    // Load example data
    loadExampleData() {
        const currentYear = this.state.currentYear;
        
        // Example products with Slovenian names
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                category: 'Sveže meso'
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                category: 'Premium meso'
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                category: 'Perutnina'
            },
            {
                id: 'p004',
                code: 'JAG-400',
                name: 'Jagnječji kotleti',
                nameEn: 'Lamb Chops',
                unit: 'kg',
                category: 'Specialitete'
            },
            {
                id: 'p005',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                category: 'Mesni izdelki'
            }
        ];
        
        // Generate data for each product
        this.state.products.forEach(product => {
            this.state.data[product.id] = this.generateProductData(product.id, currentYear);
        });
    },
    
    // Generate hierarchical data for a product
    generateProductData(productId, currentYear) {
        const data = {};
        
        // Generate data for years N-2 to N+2, plus extra row for N (plan only)
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            // For year N, create two versions: actual+plan and plan-only
            if (yearOffset === 0) {
                // First version: N (Actual + Plan)
                data[`${year}_actual`] = this.generateYearData(productId, year, yearOffset, false);
                // Second version: N (Plan only)
                data[`${year}_plan`] = this.generateYearData(productId, year, yearOffset, true);
            } else {
                // Other years: just one version
                data[year] = this.generateYearData(productId, year, yearOffset, false);
            }
        }
        
        return data;
    },
    
    // Generate data for a single year
    generateYearData(productId, year, yearOffset, planOnlyMode = false) {
        const yearData = {
            label: `${year}`,
            shortLabel: yearOffset === 0 ? (planOnlyMode ? 'N (Plan)' : 'N (Act+Plan)') : this.getYearLabel(yearOffset),
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
            
            // Generate weekly data (calendar weeks)
            const weeksInMonth = this.getCalendarWeeksInMonth(year, month);
            weeksInMonth.forEach(weekNum => {
                const weekData = {
                    label: `KW${weekNum}`, // Calendar Week
                    total: 0,
                    days: {}
                };
                
                // Generate daily data for this week in this month
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
    
    // Get calendar weeks that contain days from this month
    getCalendarWeeksInMonth(year, month) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        const firstWeek = this.getWeekNumber(firstDay);
        const lastWeek = this.getWeekNumber(lastDay);
        
        const weeks = [];
        if (lastWeek < firstWeek) {
            // Year boundary case
            for (let w = firstWeek; w <= 52; w++) {
                weeks.push(w);
            }
            for (let w = 1; w <= lastWeek; w++) {
                weeks.push(w);
            }
        } else {
            for (let w = firstWeek; w <= lastWeek; w++) {
                weeks.push(w);
            }
        }
        
        return weeks;
    },
    
    // Get ISO week number
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Get days of a specific week that fall within a month
    getDaysOfWeekInMonth(year, month, weekNum) {
        const days = [];
        const daysInMonth = this.getDaysInMonth(year, month);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            if (this.getWeekNumber(date) === weekNum) {
                days.push(day);
            }
        }
        
        return days;
    },
    
    // Generate realistic daily values
    generateDailyValue(productId, year, month, day, yearOffset, dataType) {
        const bases = {
            'p001': 40,
            'p002': 25,
            'p003': 50,
            'p004': 15,
            'p005': 30
        };
        
        const base = bases[productId] || 30;
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        let dayFactor = 1;
        if (dayOfWeek === 6) dayFactor = 0.5;
        if (dayOfWeek === 0) dayFactor = 0.2;
        
        const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6);
        const yearGrowth = Math.pow(1.03, year - 2020);
        
        // Different variation for actual (sales) vs plan data
        let randomFactor;
        if (dataType === 'actual' || dataType === 'historical') {
            // Actual sales data has more variation
            randomFactor = 0.7 + Math.random() * 0.6;
        } else {
            // Plan data is smoother
            randomFactor = 0.9 + Math.random() * 0.2;
        }
        
        return Math.round(base * dayFactor * seasonalFactor * randomFactor * yearGrowth);
    },
    
    // Get data type based on today's date
    getDataType(yearOffset, month, day, planOnlyMode = false) {
        // If plan only mode, always return plan
        if (planOnlyMode) return 'plan';
        
        const today = this.state.today;
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const year = currentYear + yearOffset;
        
        // Past years are always historical/actual
        if (yearOffset < 0) return 'historical';
        
        // Future years are always plan
        if (yearOffset > 0) return 'future';
        
        // For current year (N), compare with today's date
        const dateToCheck = new Date(year, month - 1, day);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (dateToCheck < todayMidnight) {
            return 'actual';  // Past data = actual sales
        } else if (dateToCheck.getTime() === todayMidnight.getTime()) {
            return 'current'; // Today
        } else {
            return 'plan';    // Future data = plan
        }
    },
    
    // Render the planning grid
    renderPlanningGrid() {
        const container = document.getElementById('planning-grid');
        if (!container) return;
        
        let html = `
            <style>
                .planning-v4-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .planning-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .planning-header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                
                .planning-info {
                    margin-top: 10px;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .planning-table-wrapper {
                    background: white;
                    border-radius: 8px;
                    overflow-x: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .planning-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1400px;
                }
                
                .planning-table th {
                    background: #34495e;
                    color: white;
                    padding: 8px 4px;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid #2c3e50;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    font-size: 12px;
                }
                
                .planning-table th.product-header {
                    text-align: left;
                    min-width: 200px;
                    background: #2c3e50;
                    padding: 8px;
                }
                
                .planning-table th.year-header {
                    text-align: left;
                    min-width: 80px;
                    background: #2c3e50;
                    padding: 8px;
                }
                
                .planning-table td {
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 50px;
                    font-size: 12px;
                }
                
                .planning-table td.product-cell {
                    text-align: left;
                    font-weight: 600;
                    background: #f8f9fa;
                    position: sticky;
                    left: 0;
                    z-index: 5;
                    padding: 8px;
                    border-right: 2px solid #34495e;
                }
                
                .planning-table td.year-cell {
                    text-align: left;
                    font-weight: 500;
                    background: #f0f0f0;
                    position: sticky;
                    left: 200px;
                    z-index: 4;
                    padding: 6px;
                    min-width: 80px;
                    border-right: 2px solid #666;
                }
                
                /* Product group styling */
                .product-group {
                    border-bottom: 3px solid #34495e;
                }
                
                .product-header-row td {
                    background: #ecf0f1;
                    font-weight: bold;
                    padding: 10px;
                }
                
                /* Month headers */
                .month-header {
                    background: #546e7a !important;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                }
                
                .month-header:hover {
                    background: #455a64 !important;
                }
                
                .week-header {
                    background: #607d8b !important;
                    font-size: 11px;
                    cursor: pointer;
                }
                
                .week-header:hover {
                    background: #546e7a !important;
                }
                
                .day-header {
                    background: #78909c !important;
                    font-size: 10px;
                }
                
                /* Data cell types */
                .cell-historical {
                    background: #fafafa;
                    color: #7f8c8d;
                }
                
                .cell-actual {
                    background: #e3f2fd;
                    color: #1565c0;
                    font-weight: 600;
                }
                
                .cell-current {
                    background: #fff3e0;
                    color: #e65100;
                    font-weight: bold;
                    border: 2px solid #ff9800;
                }
                
                .cell-plan {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                
                .cell-future {
                    background: #f3e5f5;
                    color: #6a1b9a;
                }
                
                .cell-total {
                    background: #fff8e1;
                    font-weight: bold;
                    border-left: 2px solid #666;
                }
                
                .editable {
                    cursor: text;
                }
                
                .editable:hover {
                    background: #fff9c4 !important;
                    outline: 2px solid #fdd835;
                }
                
                .editable:focus {
                    outline: 2px solid #2196f3;
                    background: white !important;
                }
                
                /* Year row styling */
                .year-n-2 { background: #f5f5f5; }
                .year-n-1 { background: #fafafa; }
                .year-n { background: #fff8e1; font-weight: 600; }
                .year-n-plan { background: #e3f2fd; font-style: italic; }
                .year-n1 { background: #f1f8e9; }
                .year-n2 { background: #e8f5e9; }
                
                .expand-icon {
                    display: inline-block;
                    width: 12px;
                    font-size: 10px;
                    margin-right: 2px;
                }
                
                .product-separator {
                    height: 3px;
                    background: #34495e;
                }
            </style>
            
            <div class="planning-v4-container">
                <div class="planning-header">
                    <h2>📊 Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="planning-info">
                        Meseci → Kliknite za tedne (KW = Koledarski teden) → Kliknite za dneve
                        <br>Months → Click for weeks (KW = Calendar Week) → Click for days
                        <br><strong>Podatki do danes = Dejanske prodaje | Data until today = Actual sales</strong>
                    </div>
                </div>
                
                <div class="planning-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>Legenda / Legend:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>📅 Vsak izdelek ima 6 vrstic: N-2, N-1, N (Dejanske+Plan), N (Samo Plan), N+1, N+2</li>
                        <li>📊 N (Act+Plan): Dejanske prodaje do danes, plan za naprej</li>
                        <li>📈 N (Plan): Samo planski podatki za celotno leto</li>
                        <li>🔽 Kliknite mesec za prikaz tednov (KW = koledarski teden)</li>
                        <li>🔽 Kliknite teden za prikaz dni</li>
                        <li>✏️ Zelene celice (prihodnost) lahko urejate</li>
                        <li>🗓️ Današnji datum: <strong>${new Date().toLocaleDateString('sl-SI')}</strong></li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render the table
    renderTable() {
        // Build headers and rows
        const headers = this.renderHeaders();
        const rows = this.renderAllProductRows();
        
        return `
            <table class="planning-table">
                ${headers}
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    },
    
    // Render headers
    renderHeaders() {
        let monthHeaders = '<tr><th class="product-header" rowspan="2">Izdelek / Product</th><th class="year-header" rowspan="2">Leto / Year</th>';
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
                        onclick="PlanningV4.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▼</span>
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
                                onclick="PlanningV4.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▼</span>KW${weekNum}
                            </th>
                        `;
                    } else {
                        subHeaders += `
                            <th class="week-header" 
                                onclick="PlanningV4.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▶</span>KW${weekNum}
                            </th>
                        `;
                    }
                });
            } else {
                monthHeaders += `
                    <th class="month-header" 
                        onclick="PlanningV4.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▶</span>
                        ${this.getMonthShort(month)}
                    </th>
                `;
                subHeaders += '<th>-</th>';
            }
        }
        
        monthHeaders += '<th rowspan="2">Skupaj / Total</th></tr>';
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
                                const date = new Date(this.state.currentYear, month - 1, day);
                                const dayName = this.getDayShort(date.getDay());
                                const weekendClass = WeekUtils.isWeekend(date) ? 'weekend' : '';
                                dayHeaders += `<th class="day-header ${weekendClass}">${day}<br>${dayName}</th>`;
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
    
    // Render all product rows
    renderAllProductRows() {
        let html = '';
        
        this.state.products.forEach((product, index) => {
            // Add product group
            html += this.renderProductRows(product);
            
            // Add separator between products (except last)
            if (index < this.state.products.length - 1) {
                html += '<tr class="product-separator"><td colspan="100"></td></tr>';
            }
        });
        
        return html;
    },
    
    // Render 6 rows for a single product (now includes N plan-only row)
    renderProductRows(product) {
        let html = '';
        const currentYear = this.state.currentYear;
        let rowIndex = 0;
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            // For year N, render two rows
            if (yearOffset === 0) {
                // First row: N (Actual + Plan)
                const actualData = this.state.data[product.id][`${year}_actual`];
                html += this.renderSingleRow(product, actualData, year, 'year-n', rowIndex === 0, rowIndex);
                rowIndex++;
                
                // Second row: N (Plan only)
                const planData = this.state.data[product.id][`${year}_plan`];
                html += this.renderSingleRow(product, planData, year, 'year-n-plan', false, rowIndex);
                rowIndex++;
            } else {
                // Other years: single row
                const yearData = this.state.data[product.id][year];
                const yearClass = yearOffset === -2 ? 'year-n-2' : 
                                 yearOffset === -1 ? 'year-n-1' :
                                 yearOffset === 1 ? 'year-n1' : 'year-n2';
                html += this.renderSingleRow(product, yearData, year, yearClass, rowIndex === 0, rowIndex);
                rowIndex++;
            }
        }
        
        // Add customer rows if expanded
        if (this.state.expanded.customers.has(product.id) && window.CRMData) {
            html += this.renderCustomerRows(product);
        }
        
        return html;
    },
    
    // Render customer-specific rows for a product
    renderCustomerRows(product) {
        const customers = window.CRMData.getCustomers();
        let html = `
            <tr class="customer-header-row">
                <td colspan="100" style="background: #e3f2fd; padding: 8px; font-weight: 600;">
                    👥 Customer Breakdown for ${product.name}
                </td>
            </tr>
        `;
        
        // Show top 5 customers
        const topCustomers = customers.slice(0, 5);
        
        topCustomers.forEach(customer => {
            const customerData = this.getCustomerPlanningData(product.id, customer.id);
            html += `
                <tr class="customer-row" style="background: #f5f5f5;">
                    <td class="customer-name" style="padding-left: 20px; font-size: 13px;">
                        <strong>${customer.code}</strong><br>
                        ${customer.name}<br>
                        <small style="color: #666;">${customer.type}</small><br>
                        <small style="color: #888;">Discount: ${customer.discount}%</small>
                    </td>
                    <td class="year-cell">
                        ${this.state.currentYear}<br>
                        <small>Customer Plan</small>
                    </td>
            `;
            
            // Add month cells for customer
            for (let month = 1; month <= 12; month++) {
                const monthValue = customerData.months[month] || 0;
                const isEditable = month >= this.state.currentMonth;
                
                if (isEditable) {
                    html += `
                        <td class="cell-future editable customer-cell" 
                            contenteditable="true"
                            style="background: #e8f5e9; font-size: 12px;"
                            onblur="PlanningV4.updateCustomerMonth('${product.id}', '${customer.id}', ${month}, this.textContent)"
                            onkeypress="if(event.key==='Enter'){event.preventDefault();this.blur();}">
                            ${this.formatNumber(monthValue)}
                        </td>
                    `;
                } else {
                    html += `
                        <td class="cell-actual customer-cell" style="font-size: 12px;">
                            ${this.formatNumber(monthValue)}
                        </td>
                    `;
                }
            }
            
            // Total for customer
            const customerTotal = Object.values(customerData.months).reduce((sum, val) => sum + val, 0);
            html += `
                <td class="cell-total" style="font-size: 12px; font-weight: 600;">
                    ${this.formatNumber(customerTotal)}
                </td>
            </tr>
            `;
        });
        
        // Add summary row
        html += `
            <tr class="customer-summary-row" style="background: #fff3e0; font-weight: 600;">
                <td style="padding-left: 20px;">Total (Top 5)</td>
                <td>Summary</td>
        `;
        
        for (let month = 1; month <= 12; month++) {
            let monthTotal = 0;
            topCustomers.forEach(customer => {
                const customerData = this.getCustomerPlanningData(product.id, customer.id);
                monthTotal += customerData.months[month] || 0;
            });
            html += `<td style="font-size: 12px;">${this.formatNumber(monthTotal)}</td>`;
        }
        
        const grandTotal = topCustomers.reduce((total, customer) => {
            const customerData = this.getCustomerPlanningData(product.id, customer.id);
            return total + Object.values(customerData.months).reduce((sum, val) => sum + val, 0);
        }, 0);
        
        html += `
                <td class="cell-total">${this.formatNumber(grandTotal)}</td>
            </tr>
        `;
        
        return html;
    },
    
    // Get or generate customer planning data
    getCustomerPlanningData(productId, customerId) {
        const key = `${productId}_${customerId}`;
        
        if (!this.state.customerData[key]) {
            // Generate sample data based on customer discount
            const customer = window.CRMData.getCustomerById(customerId);
            const baseData = this.state.data[productId][this.state.currentYear + '_plan'];
            
            this.state.customerData[key] = {
                months: {}
            };
            
            // Calculate customer-specific volumes based on their order history
            for (let month = 1; month <= 12; month++) {
                const baseValue = baseData.months[month].total || 0;
                // Higher discount customers typically order more
                const volumeFactor = 1 + (customer.discount / 100);
                const randomVariation = 0.8 + Math.random() * 0.4; // 80-120% variation
                
                this.state.customerData[key].months[month] = 
                    Math.round(baseValue * 0.15 * volumeFactor * randomVariation); // Each customer ~15% of total
            }
        }
        
        return this.state.customerData[key];
    },
    
    // Toggle customer view for a product
    toggleCustomerView(productId) {
        if (this.state.expanded.customers.has(productId)) {
            this.state.expanded.customers.delete(productId);
        } else {
            this.state.expanded.customers.add(productId);
        }
        this.renderPlanningGrid();
    },
    
    // Update customer month value
    updateCustomerMonth(productId, customerId, month, newValue) {
        const value = parseInt(newValue.replace(/[^\d]/g, '')) || 0;
        const key = `${productId}_${customerId}`;
        
        if (!this.state.customerData[key]) {
            this.state.customerData[key] = { months: {} };
        }
        
        this.state.customerData[key].months[month] = value;
        
        // Save to localStorage
        this.saveCustomerData();
        
        // Could trigger recalculation of totals if needed
        console.log(`Updated customer ${customerId} for product ${productId}, month ${month}: ${value}`);
    },
    
    // Save customer data to localStorage
    saveCustomerData() {
        localStorage.setItem('ch_planning_customer_data', JSON.stringify(this.state.customerData));
    },
    
    // Render a single row
    renderSingleRow(product, yearData, year, yearClass, isFirstRow, rowIndex) {
        let html = `<tr class="${yearClass}">`;
        
        // Product cell (only for first year row)
        if (isFirstRow) {
            const hasCustomerView = this.state.showCustomerView && window.CRMData;
            const isExpanded = this.state.expanded.customers.has(product.id);
            
            html += `
                <td class="product-cell" rowspan="6">
                    <strong>${product.code}</strong><br>
                    ${product.name}<br>
                    <small>${product.nameEn}</small><br>
                    <em>${product.unit}</em>
                    ${hasCustomerView ? `
                        <div style="margin-top: 8px;">
                            <button class="expand-customers-btn" 
                                    onclick="PlanningV4.toggleCustomerView('${product.id}')"
                                    style="background: #2196f3; color: white; border: none; 
                                           padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;"
                                    title="Show customer breakdown">
                                <span>${isExpanded ? '▼' : '▶'}</span> 👥 Customers
                            </button>
                        </div>
                    ` : ''}
                </td>
            `;
        }
        
        // Year cell
        html += `
            <td class="year-cell">
                ${year}<br>
                <small>${yearData.shortLabel}</small>
            </td>
        `;
        
        // Data cells for each month/week/day
        const dataKey = yearData.isPlanOnly ? `${year}_plan` : 
                       (year === this.state.currentYear && !yearData.isPlanOnly) ? `${year}_actual` : 
                       year.toString();
        html += this.renderDataCells(product.id, dataKey);
        
        // Total cell
        html += `
            <td class="cell-total">
                ${this.formatNumber(yearData.total)}
            </td>
        `;
        
        html += '</tr>';
        return html;
    },
    
    // Render data cells based on expansion state
    renderDataCells(productId, year) {
        let html = '';
        const yearData = this.state.data[productId][year];
        
        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const monthData = yearData.months[month];
            
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
                            const date = new Date(this.state.currentYear, month - 1, day);
                            const weekendClass = WeekUtils.isWeekend(date) ? 'weekend-cell' : '';
                            const cellClass = `cell-${dayData.type}`;
                            const isEditable = dayData.type === 'plan' || dayData.type === 'future';
                            
                            if (isEditable) {
                                html += `
                                    <td class="${cellClass} editable ${weekendClass}" 
                                        contenteditable="true"
                                        onblur="PlanningV4.updateDayValue('${productId}', ${year}, ${month}, ${day}, this.textContent)"
                                        onkeypress="if(event.key==='Enter'){event.preventDefault();this.blur();}">
                                        ${dayData.value}
                                    </td>
                                `;
                            } else {
                                html += `<td class="${cellClass} ${weekendClass}">${dayData.value}</td>`;
                            }
                        });
                    } else {
                        // Week not expanded - show week total
                        const cellClass = `cell-${monthData.type}`;
                        html += `<td class="${cellClass}">${this.formatNumber(weekData.total)}</td>`;
                    }
                });
            } else {
                // Month not expanded - show month total
                const cellClass = `cell-${monthData.type}`;
                const isEditable = monthData.type === 'plan' || monthData.type === 'future';
                
                if (isEditable) {
                    html += `
                        <td class="${cellClass} editable" 
                            contenteditable="true"
                            onblur="PlanningV4.updateMonthValue('${productId}', ${year}, ${month}, this.textContent)"
                            onkeypress="if(event.key==='Enter'){event.preventDefault();this.blur();}">
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
        this.renderPlanningGrid();
    },
    
    // Toggle week expansion
    toggleWeek(weekKey) {
        if (this.state.expanded.weeks.has(weekKey)) {
            this.state.expanded.weeks.delete(weekKey);
        } else {
            this.state.expanded.weeks.add(weekKey);
        }
        this.renderPlanningGrid();
    },
    
    // Update day value
    updateDayValue(productId, year, month, day, newValue) {
        const value = parseInt(newValue) || 0;
        const weekNum = this.getWeekNumber(new Date(year, month - 1, day));
        
        let oldValue = 0;
        if (this.state.data[productId][year].months[month].weeks[weekNum] &&
            this.state.data[productId][year].months[month].weeks[weekNum].days[day]) {
            oldValue = this.state.data[productId][year].months[month].weeks[weekNum].days[day].value;
            this.state.data[productId][year].months[month].weeks[weekNum].days[day].value = value;
            
            // Emit sale event for actual sales
            const monthData = this.state.data[productId][year].months[month];
            if (monthData.type === 'actual' && value !== oldValue && typeof ChEvents !== 'undefined') {
                const difference = value - oldValue;
                if (difference > 0) {
                    ChEvents.emit(EVENTS.SALE_COMPLETED, {
                        articleNumber: productId,
                        quantity: difference,
                        reference: `SO-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`
                    });
                }
            }
            
            this.recalculateTotals(productId, year, month);
        }
    },
    
    // Update month value (distribute to days)
    updateMonthValue(productId, year, month, newValue) {
        const value = parseInt(newValue.replace(/[^\d]/g, '')) || 0;
        const monthData = this.state.data[productId][year].months[month];
        
        // Count total days in month
        let totalDays = 0;
        Object.values(monthData.weeks).forEach(week => {
            totalDays += Object.keys(week.days).length;
        });
        
        // Distribute value evenly across days
        const valuePerDay = Math.round(value / totalDays);
        
        Object.values(monthData.weeks).forEach(week => {
            Object.keys(week.days).forEach(day => {
                week.days[day].value = valuePerDay;
            });
        });
        
        this.recalculateTotals(productId, year, month);
        this.renderPlanningGrid();
    },
    
    // Recalculate totals
    recalculateTotals(productId, year, month) {
        const yearData = this.state.data[productId][year];
        const monthData = yearData.months[month];
        
        // Recalculate week totals
        Object.values(monthData.weeks).forEach(week => {
            week.total = Object.values(week.days).reduce((sum, day) => sum + day.value, 0);
        });
        
        // Recalculate month total
        monthData.total = Object.values(monthData.weeks).reduce((sum, week) => sum + week.total, 0);
        
        // Recalculate year total
        yearData.total = Object.values(yearData.months).reduce((sum, month) => sum + month.total, 0);
    },
    
    // Helper functions
    formatNumber(num) {
        return num.toLocaleString('sl-SI');
    },
    
    getYearLabel(offset) {
        switch(offset) {
            case -2: return 'N-2';
            case -1: return 'N-1';
            case 0: return 'N';
            case 1: return 'N+1';
            case 2: return 'N+2';
            default: return '';
        }
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
    
    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningV4;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.PlanningV4 = PlanningV4;
}

// Note: Initialization is handled by app.js when the planning view is loaded
// This prevents double initialization and ensures proper timing
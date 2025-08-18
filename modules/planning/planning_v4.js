// Ch Planning Module V4 - Horizontal Expandable Planning
// Columns expand horizontally: Year → Months → Weeks → Days
// Products are rows, time periods are columns

const PlanningV4 = {
    VERSION: '4.0.2',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentWeek: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7),
        currentDay: new Date().getDate(),
        expanded: {
            years: new Set(),   // Which years are expanded to show months
            months: new Set(),  // Which months are expanded to show weeks
            weeks: new Set()    // Which weeks are expanded to show days
        },
        viewLevel: 'year', // 'year', 'month', 'week', 'day'
        data: {},
        products: []
    },
    
    // Initialize the planning module
    init() {
        console.log(`Planning Module V${this.VERSION} - Horizontal Layout initializing...`);
        
        const container = document.getElementById('planning-grid');
        if (!container) {
            console.error('ERROR: planning-grid container not found!');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const newContainer = document.createElement('div');
                newContainer.id = 'planning-grid';
                mainContent.appendChild(newContainer);
                console.log('Created planning-grid container');
            }
        }
        
        this.loadExampleData();
        this.renderPlanningGrid();
        
        console.log('Planning V4 Horizontal initialized');
    },
    
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
        
        // Generate data for years N-2 to N+2
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            data[year] = {
                label: `${year}`,
                shortLabel: this.getYearLabel(yearOffset),
                total: 0,
                type: yearOffset < 0 ? 'historical' : yearOffset > 0 ? 'future' : 'current',
                months: {}
            };
            
            // Generate monthly data
            for (let month = 1; month <= 12; month++) {
                const monthData = {
                    label: this.getMonthName(month),
                    shortLabel: this.getMonthShort(month),
                    total: 0,
                    type: this.getDataType(yearOffset, month, 15),
                    weeks: {}
                };
                
                // Generate weekly data
                const weeksInMonth = this.getWeeksInMonth(year, month);
                for (let week = 1; week <= weeksInMonth; week++) {
                    const weekData = {
                        label: `T${week}`,
                        total: 0,
                        days: {}
                    };
                    
                    // Generate daily data
                    const daysInWeek = week === weeksInMonth ? this.getDaysInLastWeek(year, month) : 7;
                    const startDay = (week - 1) * 7 + 1;
                    
                    for (let dayOffset = 0; dayOffset < daysInWeek; dayOffset++) {
                        const day = startDay + dayOffset;
                        if (day <= this.getDaysInMonth(year, month)) {
                            const value = this.generateDailyValue(productId, year, month, day, yearOffset);
                            weekData.days[day] = {
                                label: day.toString(),
                                dayName: this.getDayShort(new Date(year, month - 1, day).getDay()),
                                value: value,
                                type: this.getDataType(yearOffset, month, day)
                            };
                            weekData.total += value;
                        }
                    }
                    
                    monthData.weeks[week] = weekData;
                    monthData.total += weekData.total;
                }
                
                data[year].months[month] = monthData;
                data[year].total += monthData.total;
            }
        }
        
        return data;
    },
    
    // Generate realistic daily values
    generateDailyValue(productId, year, month, day, yearOffset) {
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
        const randomFactor = 0.8 + Math.random() * 0.4;
        const yearGrowth = Math.pow(1.03, year - 2020);
        
        return Math.round(base * dayFactor * seasonalFactor * randomFactor * yearGrowth);
    },
    
    // Get data type
    getDataType(yearOffset, month, day) {
        const currentMonth = this.state.currentMonth;
        const currentDay = this.state.currentDay;
        
        if (yearOffset < 0) return 'historical';
        if (yearOffset > 0) return 'future';
        
        if (month < currentMonth) return 'actual';
        if (month > currentMonth) return 'plan';
        
        if (day < currentDay) return 'actual';
        if (day === currentDay) return 'current';
        return 'plan';
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
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .planning-header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                
                .view-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .view-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .view-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .view-btn.active {
                    background: white;
                    color: #667eea;
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
                    min-width: 1200px;
                }
                
                .planning-table th {
                    background: #34495e;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid #2c3e50;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .planning-table th.product-header {
                    text-align: left;
                    min-width: 200px;
                    background: #2c3e50;
                }
                
                .planning-table td {
                    padding: 8px;
                    border: 1px solid #ecf0f1;
                    text-align: center;
                    min-width: 60px;
                }
                
                .planning-table td.product-cell {
                    text-align: left;
                    font-weight: 600;
                    background: #f8f9fa;
                    position: sticky;
                    left: 0;
                    z-index: 5;
                }
                
                /* Column group headers */
                .year-header {
                    background: #34495e;
                    cursor: pointer;
                    user-select: none;
                }
                
                .year-header:hover {
                    background: #2c3e50;
                }
                
                .month-header {
                    background: #546e7a;
                    font-size: 12px;
                    cursor: pointer;
                }
                
                .month-header:hover {
                    background: #455a64;
                }
                
                .week-header {
                    background: #607d8b;
                    font-size: 11px;
                    cursor: pointer;
                }
                
                .day-header {
                    background: #78909c;
                    font-size: 10px;
                }
                
                /* Data cell types */
                .cell-historical {
                    background: #f5f5f5;
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
                }
                
                .editable {
                    cursor: text;
                }
                
                .editable:hover {
                    background: #fff9c4;
                    outline: 2px solid #fdd835;
                }
                
                .editable:focus {
                    outline: 2px solid #2196f3;
                    background: white;
                }
                
                .expand-icon {
                    display: inline-block;
                    width: 16px;
                    transition: transform 0.3s;
                    margin-right: 4px;
                }
                
                .expanded .expand-icon {
                    transform: rotate(90deg);
                }
                
                /* Year labels */
                .year-n-2 { background: #fafafa !important; }
                .year-n-1 { background: #f5f5f5 !important; }
                .year-n { background: #fff8e1 !important; }
                .year-n1 { background: #f1f8e9 !important; }
                .year-n2 { background: #e8f5e9 !important; }
                
                .info-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    margin-left: 8px;
                    background: #e3f2fd;
                    color: #1976d2;
                }
            </style>
            
            <div class="planning-v4-container">
                <div class="planning-header">
                    <h2>📊 Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="view-controls">
                        <button class="view-btn ${this.state.viewLevel === 'year' ? 'active' : ''}" 
                                onclick="PlanningV4.setViewLevel('year')">Letni pregled</button>
                        <button class="view-btn ${this.state.viewLevel === 'month' ? 'active' : ''}" 
                                onclick="PlanningV4.setViewLevel('month')">Mesečni pregled</button>
                        <button class="view-btn ${this.state.viewLevel === 'week' ? 'active' : ''}" 
                                onclick="PlanningV4.setViewLevel('week')">Tedenski pregled</button>
                        <button class="view-btn ${this.state.viewLevel === 'day' ? 'active' : ''}" 
                                onclick="PlanningV4.setViewLevel('day')">Dnevni pregled</button>
                    </div>
                </div>
                
                <div class="planning-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>Navodila / Instructions:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>📅 Kliknite na leto/mesec/teden za razširitev</li>
                        <li>✏️ Zelene celice lahko urejate (prihodnje načrtovanje)</li>
                        <li>📊 Vsote se samodejno posodabljajo</li>
                        <li>🔄 Preklapljajte med pogledi z gumbi zgoraj</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render the table based on current view level
    renderTable() {
        const currentYear = this.state.currentYear;
        
        // Build column headers based on view level
        let columnHeaders = '';
        let dataRows = '';
        
        if (this.state.viewLevel === 'year') {
            // Year view - show only years
            columnHeaders = this.renderYearHeaders();
        } else if (this.state.viewLevel === 'month') {
            // Month view - show years and their months
            columnHeaders = this.renderMonthHeaders();
        } else if (this.state.viewLevel === 'week') {
            // Week view - show expanded months with weeks
            columnHeaders = this.renderWeekHeaders();
        } else {
            // Day view - show full detail
            columnHeaders = this.renderDayHeaders();
        }
        
        // Build product rows
        dataRows = this.renderProductRows();
        
        return `
            <table class="planning-table">
                ${columnHeaders}
                <tbody>
                    ${dataRows}
                </tbody>
            </table>
        `;
    },
    
    // Render year-level headers
    renderYearHeaders() {
        const currentYear = this.state.currentYear;
        let headerHtml = '<thead><tr><th class="product-header">Izdelek / Product</th>';
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            const yearClass = `year-n${yearOffset === 0 ? '' : yearOffset > 0 ? yearOffset : yearOffset}`;
            headerHtml += `
                <th class="year-header ${yearClass}" onclick="PlanningV4.toggleYear(${year})">
                    <span class="expand-icon">▶</span>
                    ${year}<br>
                    <small>${this.getYearLabel(yearOffset)}</small>
                </th>
            `;
        }
        
        headerHtml += '<th>Skupaj / Total</th></tr></thead>';
        return headerHtml;
    },
    
    // Render month-level headers
    renderMonthHeaders() {
        const currentYear = this.state.currentYear;
        let headerHtml = '<thead>';
        
        // First row - year groups
        headerHtml += '<tr><th class="product-header" rowspan="2">Izdelek / Product</th>';
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            const isExpanded = this.state.expanded.years.has(year);
            const colspan = isExpanded ? 12 : 1;
            const yearClass = `year-n${yearOffset === 0 ? '' : yearOffset > 0 ? yearOffset : yearOffset}`;
            
            headerHtml += `
                <th class="year-header ${yearClass} ${isExpanded ? 'expanded' : ''}" 
                    colspan="${colspan}" 
                    onclick="PlanningV4.toggleYear(${year})">
                    <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    ${year} ${this.getYearLabel(yearOffset)}
                </th>
            `;
        }
        
        headerHtml += '<th rowspan="2">Skupaj</th></tr>';
        
        // Second row - months (if year is expanded)
        headerHtml += '<tr>';
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            if (this.state.expanded.years.has(year)) {
                for (let month = 1; month <= 12; month++) {
                    const monthKey = `${year}-${month}`;
                    headerHtml += `
                        <th class="month-header" onclick="PlanningV4.toggleMonth('${monthKey}')">
                            <span class="expand-icon">▶</span>
                            ${this.getMonthShort(month)}
                        </th>
                    `;
                }
            } else {
                headerHtml += `<th class="year-total">${year}</th>`;
            }
        }
        
        headerHtml += '</tr></thead>';
        return headerHtml;
    },
    
    // Render week-level headers
    renderWeekHeaders() {
        const currentYear = this.state.currentYear;
        let headerHtml = '<thead>';
        
        // Complex header for weeks view
        // We'll show months and their weeks when expanded
        headerHtml += '<tr><th class="product-header">Izdelek / Product</th>';
        
        let totalCols = 0;
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (this.state.expanded.years.has(year)) {
                for (let month = 1; month <= 12; month++) {
                    const monthKey = `${year}-${month}`;
                    if (this.state.expanded.months.has(monthKey)) {
                        const weeksInMonth = this.getWeeksInMonth(year, month);
                        headerHtml += `
                            <th class="month-header expanded" colspan="${weeksInMonth}" 
                                onclick="PlanningV4.toggleMonth('${monthKey}')">
                                <span class="expand-icon">▼</span>
                                ${this.getMonthShort(month)} ${year}
                            </th>
                        `;
                        totalCols += weeksInMonth;
                    } else {
                        headerHtml += `
                            <th class="month-header" onclick="PlanningV4.toggleMonth('${monthKey}')">
                                <span class="expand-icon">▶</span>
                                ${this.getMonthShort(month)}
                            </th>
                        `;
                        totalCols++;
                    }
                }
            } else {
                headerHtml += `
                    <th class="year-header" onclick="PlanningV4.toggleYear(${year})">
                        <span class="expand-icon">▶</span>
                        ${year}
                    </th>
                `;
                totalCols++;
            }
        }
        
        headerHtml += '<th>Skupaj</th></tr>';
        
        // Week headers row
        headerHtml += '<tr><th class="product-header">Teden / Week</th>';
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (this.state.expanded.years.has(year)) {
                for (let month = 1; month <= 12; month++) {
                    const monthKey = `${year}-${month}`;
                    if (this.state.expanded.months.has(monthKey)) {
                        const weeksInMonth = this.getWeeksInMonth(year, month);
                        for (let week = 1; week <= weeksInMonth; week++) {
                            headerHtml += `<th class="week-header">T${week}</th>`;
                        }
                    } else {
                        headerHtml += `<th>-</th>`;
                    }
                }
            } else {
                headerHtml += `<th>-</th>`;
            }
        }
        
        headerHtml += '<th>-</th></tr></thead>';
        return headerHtml;
    },
    
    // Render day-level headers (full detail)
    renderDayHeaders() {
        // This would be very wide - simplified for now
        return this.renderWeekHeaders(); // Use week view for now
    },
    
    // Render product rows
    renderProductRows() {
        let html = '';
        
        this.state.products.forEach(product => {
            html += `
                <tr>
                    <td class="product-cell">
                        <strong>${product.code}</strong><br>
                        ${product.name}
                        <span class="info-badge">${product.unit}</span>
                    </td>
                    ${this.renderProductData(product.id)}
                    <td class="cell-total">
                        ${this.formatNumber(this.getProductTotal(product.id))}
                    </td>
                </tr>
            `;
        });
        
        return html;
    },
    
    // Render product data cells based on view level
    renderProductData(productId) {
        const currentYear = this.state.currentYear;
        let html = '';
        
        if (this.state.viewLevel === 'year') {
            // Year view - show year totals
            for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
                const year = currentYear + yearOffset;
                const yearData = this.state.data[productId][year];
                const cellClass = `cell-${yearData.type}`;
                
                html += `
                    <td class="${cellClass}">
                        ${this.formatNumber(yearData.total)}
                    </td>
                `;
            }
        } else if (this.state.viewLevel === 'month') {
            // Month view - show months for expanded years
            for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
                const year = currentYear + yearOffset;
                const yearData = this.state.data[productId][year];
                
                if (this.state.expanded.years.has(year)) {
                    // Show all months
                    for (let month = 1; month <= 12; month++) {
                        const monthData = yearData.months[month];
                        const cellClass = `cell-${monthData.type}`;
                        const isEditable = monthData.type === 'plan' || monthData.type === 'future';
                        
                        if (isEditable) {
                            html += `
                                <td class="${cellClass} editable" 
                                    contenteditable="true"
                                    onblur="PlanningV4.updateMonthValue('${productId}', ${year}, ${month}, this.textContent)">
                                    ${this.formatNumber(monthData.total)}
                                </td>
                            `;
                        } else {
                            html += `
                                <td class="${cellClass}">
                                    ${this.formatNumber(monthData.total)}
                                </td>
                            `;
                        }
                    }
                } else {
                    // Show year total
                    const cellClass = `cell-${yearData.type}`;
                    html += `
                        <td class="${cellClass}">
                            ${this.formatNumber(yearData.total)}
                        </td>
                    `;
                }
            }
        } else if (this.state.viewLevel === 'week') {
            // Week view - show weeks for expanded months
            for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
                const year = currentYear + yearOffset;
                const yearData = this.state.data[productId][year];
                
                if (this.state.expanded.years.has(year)) {
                    for (let month = 1; month <= 12; month++) {
                        const monthKey = `${year}-${month}`;
                        const monthData = yearData.months[month];
                        
                        if (this.state.expanded.months.has(monthKey)) {
                            // Show all weeks
                            Object.keys(monthData.weeks).forEach(week => {
                                const weekData = monthData.weeks[week];
                                const cellClass = `cell-${monthData.type}`;
                                
                                html += `
                                    <td class="${cellClass}">
                                        ${this.formatNumber(weekData.total)}
                                    </td>
                                `;
                            });
                        } else {
                            // Show month total
                            const cellClass = `cell-${monthData.type}`;
                            html += `
                                <td class="${cellClass}">
                                    ${this.formatNumber(monthData.total)}
                                </td>
                            `;
                        }
                    }
                } else {
                    // Show year total
                    const cellClass = `cell-${yearData.type}`;
                    html += `
                        <td class="${cellClass}">
                            ${this.formatNumber(yearData.total)}
                        </td>
                    `;
                }
            }
        }
        
        return html;
    },
    
    // Toggle year expansion
    toggleYear(year) {
        if (this.state.expanded.years.has(year)) {
            this.state.expanded.years.delete(year);
            // Also collapse all months in this year
            for (let month = 1; month <= 12; month++) {
                this.state.expanded.months.delete(`${year}-${month}`);
            }
        } else {
            this.state.expanded.years.add(year);
        }
        this.renderPlanningGrid();
    },
    
    // Toggle month expansion
    toggleMonth(monthKey) {
        if (this.state.expanded.months.has(monthKey)) {
            this.state.expanded.months.delete(monthKey);
            // Also collapse all weeks in this month
            const [year, month] = monthKey.split('-');
            for (let week = 1; week <= 5; week++) {
                this.state.expanded.weeks.delete(`${monthKey}-${week}`);
            }
        } else {
            this.state.expanded.months.add(monthKey);
        }
        this.renderPlanningGrid();
    },
    
    // Set view level
    setViewLevel(level) {
        this.state.viewLevel = level;
        
        // Auto-expand some items for demonstration
        if (level === 'month' && this.state.expanded.years.size === 0) {
            this.state.expanded.years.add(this.state.currentYear);
        } else if (level === 'week' && this.state.expanded.months.size === 0) {
            this.state.expanded.years.add(this.state.currentYear);
            this.state.expanded.months.add(`${this.state.currentYear}-${this.state.currentMonth}`);
        }
        
        this.renderPlanningGrid();
    },
    
    // Update month value
    updateMonthValue(productId, year, month, newValue) {
        const value = parseInt(newValue.replace(/[^\d]/g, '')) || 0;
        // For simplicity, distribute evenly across weeks/days
        const monthData = this.state.data[productId][year].months[month];
        const weeksCount = Object.keys(monthData.weeks).length;
        const valuePerWeek = Math.round(value / weeksCount);
        
        Object.keys(monthData.weeks).forEach(week => {
            const weekData = monthData.weeks[week];
            const daysCount = Object.keys(weekData.days).length;
            const valuePerDay = Math.round(valuePerWeek / daysCount);
            
            Object.keys(weekData.days).forEach(day => {
                weekData.days[day].value = valuePerDay;
            });
            
            weekData.total = valuePerWeek;
        });
        
        monthData.total = value;
        this.recalculateYearTotal(productId, year);
        this.renderPlanningGrid();
    },
    
    // Recalculate year total
    recalculateYearTotal(productId, year) {
        const yearData = this.state.data[productId][year];
        yearData.total = Object.values(yearData.months).reduce((sum, month) => sum + month.total, 0);
    },
    
    // Helper functions
    getProductTotal(productId) {
        const productData = this.state.data[productId];
        return Object.values(productData).reduce((sum, year) => sum + year.total, 0);
    },
    
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
        const days = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
        return days[dayOfWeek];
    },
    
    getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = this.getDaysInMonth(year, month);
        return Math.ceil((firstDay + daysInMonth) / 7);
    },
    
    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    },
    
    getDaysInLastWeek(year, month) {
        const daysInMonth = this.getDaysInMonth(year, month);
        const firstDay = new Date(year, month - 1, 1).getDay();
        return (firstDay + daysInMonth) % 7 || 7;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningV4;
}

// Auto-initialize
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PlanningV4.init());
} else if (typeof document !== 'undefined') {
    setTimeout(() => PlanningV4.init(), 100);
}
// Ch Planning Module V4 - Row-based Expandable Planning
// Supports: Product → Year → Month → Week → Day expansion
// No view buttons - pure row expansion hierarchy

const PlanningV4 = {
    VERSION: '4.0.1',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentWeek: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7),
        expanded: {
            products: new Set(), // Start with all collapsed
            years: new Set(),
            months: new Set(),
            weeks: new Set()
        },
        data: {},
        products: []
    },
    
    // Initialize the planning module
    init() {
        console.log(`Planning Module V${this.VERSION} initializing...`);
        
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
        
        console.log('Planning V4 initialized - click rows to expand');
    },
    
    // Load example data with full hierarchy
    loadExampleData() {
        const currentYear = this.state.currentYear;
        
        // Example products with Slovenian names
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka / Pork Shoulder',
                unit: 'kg',
                category: 'Sveže meso'
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file / Beef Tenderloin',
                unit: 'kg',
                category: 'Premium meso'
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi / Chicken Breast',
                unit: 'kg',
                category: 'Perutnina'
            },
            {
                id: 'p004',
                code: 'JAG-400',
                name: 'Jagnječji kotleti / Lamb Chops',
                unit: 'kg',
                category: 'Specialitete'
            },
            {
                id: 'p005',
                code: 'KLB-500',
                name: 'Domača klobasa / Homemade Sausage',
                unit: 'kg',
                category: 'Mesni izdelki'
            }
        ];
        
        // Generate hierarchical data for each product
        this.state.products.forEach(product => {
            this.state.data[product.id] = this.generateProductData(product.id, currentYear);
        });
    },
    
    // Generate complete hierarchical data for a product
    generateProductData(productId, currentYear) {
        const data = {};
        
        // Generate data for years N-2 to N+2
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            data[year] = {
                label: this.getYearLabel(yearOffset),
                total: 0,
                months: {}
            };
            
            // Generate monthly data
            for (let month = 1; month <= 12; month++) {
                const monthData = {
                    label: this.getMonthName(month),
                    total: 0,
                    weeks: {}
                };
                
                // Calculate weeks in month
                const weeksInMonth = this.getWeeksInMonth(year, month);
                
                // Generate weekly data
                for (let week = 1; week <= weeksInMonth; week++) {
                    const weekData = {
                        label: `Teden ${week}`,
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
                                label: this.getDayName(new Date(year, month - 1, day).getDay()),
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
            'p001': 40,  // Pork shoulder
            'p002': 25,  // Beef tenderloin
            'p003': 50,  // Chicken breast
            'p004': 15,  // Lamb chops
            'p005': 30   // Sausage
        };
        
        const base = bases[productId] || 30;
        
        // Weekend reduction
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        let dayFactor = 1;
        if (dayOfWeek === 6) dayFactor = 0.5; // Saturday
        if (dayOfWeek === 0) dayFactor = 0.2; // Sunday
        
        // Seasonal variation
        const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6);
        
        // Random variation
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        // Growth over years
        const yearGrowth = Math.pow(1.03, year - 2020);
        
        return Math.round(base * dayFactor * seasonalFactor * randomFactor * yearGrowth);
    },
    
    // Get data type based on time
    getDataType(yearOffset, month, day) {
        const currentMonth = this.state.currentMonth;
        const currentDay = new Date().getDate();
        
        if (yearOffset < 0) return 'historical';
        if (yearOffset > 0) return 'future';
        
        // Current year
        if (month < currentMonth) return 'actual';
        if (month > currentMonth) return 'plan';
        
        // Current month
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
                
                .planning-table {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .planning-table table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .planning-table th {
                    background: #34495e;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #2c3e50;
                }
                
                .planning-table td {
                    padding: 10px;
                    border-bottom: 1px solid #ecf0f1;
                }
                
                .expandable-row {
                    cursor: pointer;
                    transition: background 0.3s;
                    user-select: none;
                }
                
                .expandable-row:hover {
                    background: #f8f9fa !important;
                }
                
                .expand-icon {
                    display: inline-block;
                    width: 20px;
                    transition: transform 0.3s;
                    font-size: 12px;
                }
                
                .expanded .expand-icon {
                    transform: rotate(90deg);
                }
                
                /* Indentation for hierarchy levels */
                .level-0 { background: #ecf0f1; font-weight: bold; } /* Product */
                .level-1 { padding-left: 30px !important; background: #f8f9fa; } /* Year */
                .level-2 { padding-left: 60px !important; background: #ffffff; } /* Month */
                .level-3 { padding-left: 90px !important; background: #fafbfc; } /* Week */
                .level-4 { padding-left: 120px !important; background: #ffffff; } /* Day */
                
                /* Data type colors */
                .data-historical { color: #7f8c8d; }
                .data-actual { color: #2980b9; font-weight: 600; }
                .data-current { color: #e67e22; font-weight: bold; background: #fff3e0; }
                .data-plan { color: #27ae60; }
                .data-future { color: #95a5a6; font-style: italic; }
                
                .value-cell {
                    text-align: right;
                    font-family: 'Courier New', monospace;
                    min-width: 100px;
                }
                
                .editable {
                    cursor: text;
                    position: relative;
                    padding: 4px 8px;
                    border: 1px solid transparent;
                    border-radius: 4px;
                }
                
                .editable:hover {
                    background: #fff9c4;
                    border-color: #fdd835;
                }
                
                .editable:focus {
                    outline: none;
                    background: white;
                    border-color: #2196f3;
                    box-shadow: 0 0 0 2px rgba(33,150,243,0.2);
                }
                
                .info-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    margin-left: 10px;
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                /* Year color coding */
                .year-n-2 { background: #f5f5f5 !important; }
                .year-n-1 { background: #fafafa !important; }
                .year-n { background: #fff8e1 !important; }
                .year-n1 { background: #f1f8e9 !important; }
                .year-n2 { background: #e8f5e9 !important; }
                
                /* Status indicators */
                .status-icon {
                    margin-right: 5px;
                }
                
                .total-row {
                    font-weight: bold;
                    background: #e3f2fd !important;
                }
            </style>
            
            <div class="planning-v4-container">
                <div class="planning-header">
                    <h2>📊 Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="planning-info">
                        Kliknite na vrstice za razširitev: Izdelek → Leto → Mesec → Teden → Dan
                        <br>Click rows to expand: Product → Year → Month → Week → Day
                    </div>
                </div>
                
                <div class="planning-table">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50%;">Izdelek / Obdobje / Product / Period</th>
                                <th style="width: 20%; text-align: right;">Količina / Quantity (kg)</th>
                                <th style="width: 15%;">Status</th>
                                <th style="width: 15%;">Tip / Type</th>
                            </tr>
                        </thead>
                        <tbody id="planning-tbody">
                            ${this.renderTableRows()}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>Navodila / Instructions:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>🖱️ Kliknite na ▶ za razširitev vrstice / Click ▶ to expand row</li>
                        <li>📅 Struktura: Izdelek → Leto (N-2 do N+2) → Mesec → Teden → Dan</li>
                        <li>✏️ Zelene celice lahko urejate (prihodnje načrtovanje) / Green cells are editable</li>
                        <li>📊 Vsote se samodejno posodabljajo / Totals update automatically</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render table rows based on expanded state
    renderTableRows() {
        let html = '';
        
        this.state.products.forEach(product => {
            // Product row (always visible)
            const productExpanded = this.state.expanded.products.has(product.id);
            const productTotal = this.getProductTotal(product.id);
            
            html += `
                <tr class="expandable-row level-0 ${productExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('product', '${product.id}')">
                    <td>
                        <span class="expand-icon">${productExpanded ? '▼' : '▶'}</span>
                        <strong>${product.code}</strong> - ${product.name}
                        <span class="info-badge">${product.category}</span>
                    </td>
                    <td class="value-cell">
                        <strong>${this.formatNumber(productTotal)}</strong>
                    </td>
                    <td>
                        <span class="status-icon">📦</span>Izdelek
                    </td>
                    <td>${product.unit}</td>
                </tr>
            `;
            
            if (productExpanded) {
                html += this.renderYearRows(product.id);
            }
        });
        
        return html;
    },
    
    // Render year rows for a product
    renderYearRows(productId) {
        let html = '';
        const productData = this.state.data[productId];
        const currentYear = this.state.currentYear;
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            const yearData = productData[year];
            const yearKey = `${productId}-${year}`;
            const yearExpanded = this.state.expanded.years.has(yearKey);
            
            const yearClass = yearOffset === -2 ? 'year-n-2' : 
                             yearOffset === -1 ? 'year-n-1' :
                             yearOffset === 0 ? 'year-n' :
                             yearOffset === 1 ? 'year-n1' : 'year-n2';
            
            html += `
                <tr class="expandable-row level-1 ${yearClass} ${yearExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('year', '${yearKey}')">
                    <td>
                        <span class="expand-icon">${yearExpanded ? '▼' : '▶'}</span>
                        <strong>${year}</strong> - ${yearData.label}
                    </td>
                    <td class="value-cell data-${yearOffset < 0 ? 'historical' : yearOffset > 0 ? 'future' : 'actual'}">
                        ${this.formatNumber(yearData.total)}
                    </td>
                    <td>${this.getYearStatus(yearOffset)}</td>
                    <td>${this.getYearType(yearOffset)}</td>
                </tr>
            `;
            
            if (yearExpanded) {
                html += this.renderMonthRows(productId, year);
            }
        }
        
        return html;
    },
    
    // Render month rows for a year
    renderMonthRows(productId, year) {
        let html = '';
        const yearData = this.state.data[productId][year];
        
        for (let month = 1; month <= 12; month++) {
            const monthData = yearData.months[month];
            const monthKey = `${productId}-${year}-${month}`;
            const monthExpanded = this.state.expanded.months.has(monthKey);
            const monthType = this.getMonthType(year, month);
            
            html += `
                <tr class="expandable-row level-2 ${monthExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('month', '${monthKey}')">
                    <td>
                        <span class="expand-icon">${monthExpanded ? '▼' : '▶'}</span>
                        ${monthData.label} ${year}
                    </td>
                    <td class="value-cell data-${monthType}">
                        ${this.formatNumber(monthData.total)}
                    </td>
                    <td>${this.getMonthStatus(year, month)}</td>
                    <td>Mesec / Month</td>
                </tr>
            `;
            
            if (monthExpanded) {
                html += this.renderWeekRows(productId, year, month);
            }
        }
        
        return html;
    },
    
    // Render week rows for a month
    renderWeekRows(productId, year, month) {
        let html = '';
        const monthData = this.state.data[productId][year].months[month];
        
        Object.keys(monthData.weeks).forEach(week => {
            const weekData = monthData.weeks[week];
            const weekKey = `${productId}-${year}-${month}-${week}`;
            const weekExpanded = this.state.expanded.weeks.has(weekKey);
            
            html += `
                <tr class="expandable-row level-3 ${weekExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('week', '${weekKey}')">
                    <td>
                        <span class="expand-icon">${weekExpanded ? '▼' : '▶'}</span>
                        ${weekData.label}
                    </td>
                    <td class="value-cell">
                        ${this.formatNumber(weekData.total)}
                    </td>
                    <td>📅 ${Object.keys(weekData.days).length} dni</td>
                    <td>Teden / Week</td>
                </tr>
            `;
            
            if (weekExpanded) {
                html += this.renderDayRows(productId, year, month, week);
            }
        });
        
        return html;
    },
    
    // Render day rows for a week
    renderDayRows(productId, year, month, week) {
        let html = '';
        const weekData = this.state.data[productId][year].months[month].weeks[week];
        
        Object.keys(weekData.days).forEach(day => {
            const dayData = weekData.days[day];
            const isEditable = dayData.type === 'plan' || dayData.type === 'future';
            const dayKey = `${productId}-${year}-${month}-${day}`;
            
            html += `
                <tr class="level-4">
                    <td>
                        ${day}. ${this.getMonthName(month)} - ${dayData.label}
                    </td>
                    <td class="value-cell data-${dayData.type}">
                        ${isEditable ? 
                            `<span class="editable" contenteditable="true" 
                                   onblur="PlanningV4.updateValue('${productId}', ${year}, ${month}, ${day}, this.textContent)"
                                   onkeypress="if(event.key==='Enter'){event.preventDefault();this.blur();}">${this.formatNumber(dayData.value)}</span>` :
                            this.formatNumber(dayData.value)
                        }
                    </td>
                    <td>${this.getDayStatus(dayData.type)}</td>
                    <td>Dan / Day</td>
                </tr>
            `;
        });
        
        return html;
    },
    
    // Toggle expand/collapse
    toggleExpand(level, key) {
        event.stopPropagation();
        
        const expandSet = {
            'product': this.state.expanded.products,
            'year': this.state.expanded.years,
            'month': this.state.expanded.months,
            'week': this.state.expanded.weeks
        }[level];
        
        if (expandSet.has(key)) {
            expandSet.delete(key);
            // Collapse all children
            if (level === 'product') {
                // Collapse all years for this product
                const productId = key;
                [...this.state.expanded.years].forEach(yearKey => {
                    if (yearKey.startsWith(productId + '-')) {
                        this.state.expanded.years.delete(yearKey);
                    }
                });
                [...this.state.expanded.months].forEach(monthKey => {
                    if (monthKey.startsWith(productId + '-')) {
                        this.state.expanded.months.delete(monthKey);
                    }
                });
                [...this.state.expanded.weeks].forEach(weekKey => {
                    if (weekKey.startsWith(productId + '-')) {
                        this.state.expanded.weeks.delete(weekKey);
                    }
                });
            }
        } else {
            expandSet.add(key);
        }
        
        this.renderPlanningGrid();
    },
    
    // Update value (for editable cells)
    updateValue(productId, year, month, day, newValue) {
        const value = parseInt(newValue.replace(/[^\d]/g, '')) || 0;
        const weekNum = Math.ceil(day / 7);
        this.state.data[productId][year].months[month].weeks[weekNum].days[day].value = value;
        
        // Recalculate totals
        this.recalculateTotals(productId, year, month);
        this.renderPlanningGrid();
        
        console.log(`Updated: Product ${productId}, ${year}-${month}-${day} = ${value} kg`);
    },
    
    // Recalculate totals after update
    recalculateTotals(productId, year, month) {
        const yearData = this.state.data[productId][year];
        const monthData = yearData.months[month];
        
        // Recalculate week totals
        Object.keys(monthData.weeks).forEach(week => {
            const weekData = monthData.weeks[week];
            weekData.total = Object.values(weekData.days).reduce((sum, day) => sum + day.value, 0);
        });
        
        // Recalculate month total
        monthData.total = Object.values(monthData.weeks).reduce((sum, week) => sum + week.total, 0);
        
        // Recalculate year total
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
            case 0: return 'N (Trenutno/Current)';
            case 1: return 'N+1';
            case 2: return 'N+2';
            default: return `N${offset > 0 ? '+' : ''}${offset}`;
        }
    },
    
    getYearStatus(offset) {
        if (offset < 0) return '📊 Zaključeno';
        if (offset === 0) return '🔄 V teku';
        return '📅 Načrtovano';
    },
    
    getYearType(offset) {
        if (offset < 0) return 'Preteklo';
        if (offset === 0) return 'Trenutno';
        return 'Prihodnje';
    },
    
    getMonthStatus(year, month) {
        const currentYear = this.state.currentYear;
        const currentMonth = this.state.currentMonth;
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return '✅ Končano';
        }
        if (year === currentYear && month === currentMonth) {
            return '⏳ Aktivno';
        }
        return '📝 Plan';
    },
    
    getMonthType(year, month) {
        const currentYear = this.state.currentYear;
        const currentMonth = this.state.currentMonth;
        
        if (year < currentYear) return 'historical';
        if (year > currentYear) return 'future';
        
        if (month < currentMonth) return 'actual';
        if (month === currentMonth) return 'current';
        return 'plan';
    },
    
    getDayStatus(type) {
        const statuses = {
            'historical': '📚 Arhiv',
            'actual': '✓ Dejanski',
            'current': '📍 Danes',
            'plan': '📝 Plan',
            'future': '🔮 Napoved'
        };
        return statuses[type] || type;
    },
    
    getMonthName(month) {
        const months = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
                       'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];
        return months[month - 1];
    },
    
    getDayName(dayOfWeek) {
        const days = ['Nedelja', 'Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek', 'Sobota'];
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
        const fullWeeks = Math.floor((firstDay + daysInMonth) / 7);
        return (firstDay + daysInMonth) % 7 || 7;
    }
};

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningV4;
}

// Auto-initialize if script is loaded directly
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PlanningV4.init());
} else if (typeof document !== 'undefined') {
    // Document already loaded
    setTimeout(() => PlanningV4.init(), 100);
}
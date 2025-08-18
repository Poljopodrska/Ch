// Ch Planning Module V4 - Multi-level Expandable Planning
// Supports: Yearly → Monthly → Weekly → Daily views
// Each level can be expanded/collapsed independently

const PlanningV4 = {
    VERSION: '4.0.0',
    
    state: {
        currentView: 'yearly',
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentWeek: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7),
        expanded: {
            products: new Set(['p001']), // Expanded products
            years: new Set(), // Expanded years (for monthly view)
            months: new Set(), // Expanded months (for weekly view)
            weeks: new Set() // Expanded weeks (for daily view)
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
        this.attachEventListeners();
        
        console.log('Planning V4 initialized with expandable hierarchy');
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
                    
                    // Generate daily data (assuming 5-7 working days per week)
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
            'p001': 40,  // Pork shoulder - daily average
            'p002': 25,  // Beef tenderloin
            'p003': 50,  // Chicken breast
            'p004': 15,  // Lamb chops
            'p005': 30   // Sausage
        };
        
        const base = bases[productId] || 30;
        
        // Weekend reduction (Saturday 50%, Sunday 20%)
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        let dayFactor = 1;
        if (dayOfWeek === 6) dayFactor = 0.5; // Saturday
        if (dayOfWeek === 0) dayFactor = 0.2; // Sunday
        
        // Seasonal variation
        const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6);
        
        // Random daily variation
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
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
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
                }
                
                .expandable-row:hover {
                    background: #f8f9fa;
                }
                
                .expand-icon {
                    display: inline-block;
                    width: 20px;
                    transition: transform 0.3s;
                }
                
                .expanded .expand-icon {
                    transform: rotate(90deg);
                }
                
                /* Level-specific styling */
                .level-0 { background: #ecf0f1; font-weight: bold; } /* Product */
                .level-1 { background: #f8f9fa; padding-left: 30px !important; } /* Year */
                .level-2 { background: #ffffff; padding-left: 60px !important; } /* Month */
                .level-3 { background: #fafbfc; padding-left: 90px !important; } /* Week */
                .level-4 { background: #ffffff; padding-left: 120px !important; } /* Day */
                
                /* Data type colors */
                .data-historical { color: #7f8c8d; }
                .data-actual { color: #2980b9; font-weight: 600; }
                .data-current { color: #e67e22; font-weight: bold; background: #fff3e0; }
                .data-plan { color: #27ae60; }
                .data-future { color: #95a5a6; font-style: italic; }
                
                .value-cell {
                    text-align: right;
                    font-family: 'Courier New', monospace;
                }
                
                .editable {
                    cursor: text;
                    position: relative;
                }
                
                .editable:hover {
                    background: #fff9c4;
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
                
                .hierarchy-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                
                .hierarchy-year { background: #9c27b0; }
                .hierarchy-month { background: #2196f3; }
                .hierarchy-week { background: #4caf50; }
                .hierarchy-day { background: #ff9800; }
            </style>
            
            <div class="planning-v4-container">
                <div style="background: #4CAF50; color: white; padding: 15px; text-align: center; font-weight: bold; margin-bottom: 20px; border-radius: 8px;">
                    🚀 PLANNING V4.0.0 - MULTI-LEVEL EXPANDABLE PLANNING 🚀
                    <br>Click on rows to expand: Year → Month → Week → Day
                </div>
                
                <div class="planning-header">
                    <h2>📊 Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="view-controls">
                        <button onclick="PlanningV4.setViewLevel('yearly')" class="view-btn ${this.state.currentView === 'yearly' ? 'active' : ''}">Letno / Yearly</button>
                        <button onclick="PlanningV4.setViewLevel('monthly')" class="view-btn ${this.state.currentView === 'monthly' ? 'active' : ''}">Mesečno / Monthly</button>
                        <button onclick="PlanningV4.setViewLevel('weekly')" class="view-btn ${this.state.currentView === 'weekly' ? 'active' : ''}">Tedensko / Weekly</button>
                        <button onclick="PlanningV4.setViewLevel('daily')" class="view-btn ${this.state.currentView === 'daily' ? 'active' : ''}">Dnevno / Daily</button>
                    </div>
                </div>
                
                <div class="planning-table">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40%;">Izdelek / Obdobje</th>
                                <th style="width: 15%;">Količina (kg)</th>
                                <th style="width: 15%;">Status</th>
                                <th style="width: 30%;">Opombe</th>
                            </tr>
                        </thead>
                        <tbody id="planning-tbody">
                            ${this.renderTableRows()}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>Legenda / Legend:</h4>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <span><span class="hierarchy-indicator hierarchy-year"></span>Leto / Year</span>
                        <span><span class="hierarchy-indicator hierarchy-month"></span>Mesec / Month</span>
                        <span><span class="hierarchy-indicator hierarchy-week"></span>Teden / Week</span>
                        <span><span class="hierarchy-indicator hierarchy-day"></span>Dan / Day</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render table rows based on current view and expanded state
    renderTableRows() {
        let html = '';
        
        this.state.products.forEach(product => {
            // Product row (always visible)
            const productExpanded = this.state.expanded.products.has(product.id);
            html += `
                <tr class="expandable-row level-0 ${productExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('product', '${product.id}')">
                    <td>
                        <span class="expand-icon">${productExpanded ? '▼' : '▶'}</span>
                        <strong>${product.code}</strong> - ${product.name}
                        <span class="info-badge">${product.category}</span>
                    </td>
                    <td class="value-cell">
                        ${this.formatNumber(this.getProductTotal(product.id))}
                    </td>
                    <td>
                        <span style="color: #27ae60;">✓ Aktivno</span>
                    </td>
                    <td>Klikni za razširitev</td>
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
            
            html += `
                <tr class="expandable-row level-1 ${yearExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('year', '${yearKey}')">
                    <td>
                        <span class="hierarchy-indicator hierarchy-year"></span>
                        <span class="expand-icon">${yearExpanded ? '▼' : '▶'}</span>
                        ${year} (${yearData.label})
                    </td>
                    <td class="value-cell data-${yearOffset < 0 ? 'historical' : yearOffset > 0 ? 'future' : 'actual'}">
                        ${this.formatNumber(yearData.total)}
                    </td>
                    <td>${this.getYearStatus(yearOffset)}</td>
                    <td>${this.getYearNote(yearOffset)}</td>
                </tr>
            `;
            
            if (yearExpanded && (this.state.currentView === 'monthly' || this.state.currentView === 'weekly' || this.state.currentView === 'daily')) {
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
            
            html += `
                <tr class="expandable-row level-2 ${monthExpanded ? 'expanded' : ''}" 
                    onclick="PlanningV4.toggleExpand('month', '${monthKey}')">
                    <td>
                        <span class="hierarchy-indicator hierarchy-month"></span>
                        <span class="expand-icon">${monthExpanded ? '▼' : '▶'}</span>
                        ${monthData.label}
                    </td>
                    <td class="value-cell">
                        ${this.formatNumber(monthData.total)}
                    </td>
                    <td>${this.getMonthStatus(year, month)}</td>
                    <td>Tednov: ${Object.keys(monthData.weeks).length}</td>
                </tr>
            `;
            
            if (monthExpanded && (this.state.currentView === 'weekly' || this.state.currentView === 'daily')) {
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
                        <span class="hierarchy-indicator hierarchy-week"></span>
                        <span class="expand-icon">${weekExpanded ? '▼' : '▶'}</span>
                        ${weekData.label}
                    </td>
                    <td class="value-cell">
                        ${this.formatNumber(weekData.total)}
                    </td>
                    <td>Delovnih dni: ${Object.keys(weekData.days).length}</td>
                    <td>Povprečje: ${this.formatNumber(Math.round(weekData.total / Object.keys(weekData.days).length))} kg/dan</td>
                </tr>
            `;
            
            if (weekExpanded && this.state.currentView === 'daily') {
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
            
            html += `
                <tr class="level-4">
                    <td>
                        <span class="hierarchy-indicator hierarchy-day"></span>
                        ${day}. ${this.getMonthName(month)} - ${dayData.label}
                    </td>
                    <td class="value-cell data-${dayData.type} ${isEditable ? 'editable' : ''}" 
                        ${isEditable ? `contenteditable="true" onblur="PlanningV4.updateValue('${productId}', ${year}, ${month}, ${day}, this.textContent)"` : ''}>
                        ${this.formatNumber(dayData.value)}
                    </td>
                    <td>
                        <span class="data-${dayData.type}">${this.getDataTypeLabel(dayData.type)}</span>
                    </td>
                    <td>${isEditable ? '✏️ Lahko uredite' : '🔒 Zaklenjeno'}</td>
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
        } else {
            expandSet.add(key);
        }
        
        this.renderPlanningGrid();
    },
    
    // Set view level and expand accordingly
    setViewLevel(level) {
        this.state.currentView = level;
        
        // Auto-expand first items for demo
        if (level === 'monthly' || level === 'weekly' || level === 'daily') {
            this.state.expanded.years.add('p001-' + this.state.currentYear);
        }
        if (level === 'weekly' || level === 'daily') {
            this.state.expanded.months.add('p001-' + this.state.currentYear + '-' + this.state.currentMonth);
        }
        if (level === 'daily') {
            this.state.expanded.weeks.add('p001-' + this.state.currentYear + '-' + this.state.currentMonth + '-1');
        }
        
        this.renderPlanningGrid();
    },
    
    // Update value (for editable cells)
    updateValue(productId, year, month, day, newValue) {
        const value = parseInt(newValue) || 0;
        this.state.data[productId][year].months[month].weeks[Math.ceil(day / 7)].days[day].value = value;
        
        // Recalculate totals
        this.recalculateTotals(productId, year, month);
        
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
            case -2: return 'N-2 (Zgodovina)';
            case -1: return 'N-1 (Lani)';
            case 0: return 'N (Trenutno)';
            case 1: return 'N+1 (Prihodnje)';
            case 2: return 'N+2 (Čez 2 leti)';
            default: return `N${offset > 0 ? '+' : ''}${offset}`;
        }
    },
    
    getYearStatus(offset) {
        if (offset < 0) return '📊 Zaključeno';
        if (offset === 0) return '🔄 V teku';
        return '📅 Načrtovano';
    },
    
    getYearNote(offset) {
        if (offset < 0) return 'Zgodovinski podatki';
        if (offset === 0) return 'Trenutno leto';
        return 'Napoved za prihodnost';
    },
    
    getMonthStatus(year, month) {
        const currentYear = this.state.currentYear;
        const currentMonth = this.state.currentMonth;
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return '✅ Zaključeno';
        }
        if (year === currentYear && month === currentMonth) {
            return '⏳ V teku';
        }
        return '📝 Načrtovano';
    },
    
    getMonthName(month) {
        const months = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
                       'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];
        return months[month - 1];
    },
    
    getDayName(dayOfWeek) {
        const days = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
        return days[dayOfWeek];
    },
    
    getDataTypeLabel(type) {
        const labels = {
            'historical': 'Zgodovinski',
            'actual': 'Dejanski',
            'current': 'Trenutni',
            'plan': 'Načrtovan',
            'future': 'Prihodnji'
        };
        return labels[type] || type;
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
    },
    
    // Attach event listeners
    attachEventListeners() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case '1': this.setViewLevel('yearly'); break;
                    case '2': this.setViewLevel('monthly'); break;
                    case '3': this.setViewLevel('weekly'); break;
                    case '4': this.setViewLevel('daily'); break;
                }
            }
        });
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
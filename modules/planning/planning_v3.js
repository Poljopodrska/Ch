// Ch Planning Module V3 - Macro/Micro Row Structure
// Each product is a macro row containing micro rows for years

const PlanningV3 = {
    VERSION: '3.0.0',
    
    state: {
        currentView: 'monthly',
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        expandedProducts: new Set(['p001']), // Start with first product expanded
        data: {},
        products: []
    },
    
    // Initialize with example data
    init() {
        console.log(`Planning Module V${this.VERSION} initializing...`);
        this.loadExampleData();
        this.renderPlanningGrid();
    },
    
    // Load example data for demonstration
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
        
        // Generate realistic data for each product
        this.state.products.forEach(product => {
            this.state.data[product.id] = {};
            
            // Generate data for each year
            for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
                const year = currentYear + yearOffset;
                this.state.data[product.id][year] = {
                    yearLabel: this.getYearLabel(yearOffset),
                    months: {}
                };
                
                // Generate monthly data
                for (let month = 1; month <= 12; month++) {
                    let value = null;
                    let type = 'future';
                    let editable = false;
                    
                    if (yearOffset < 0) {
                        // Historical data (N-2, N-1)
                        value = this.generateHistoricalValue(product.id, year, month);
                        type = 'historical';
                    } else if (yearOffset === 0) {
                        // Current year
                        if (month < this.state.currentMonth) {
                            // Actual data
                            value = this.generateActualValue(product.id, year, month);
                            type = 'actual';
                        } else if (month === this.state.currentMonth) {
                            // Current month - partially actual
                            value = this.generateActualValue(product.id, year, month);
                            type = 'current';
                        } else {
                            // Future months - planned
                            value = this.generatePlannedValue(product.id, year, month);
                            type = 'plan';
                            editable = true;
                        }
                    } else {
                        // Future years (N+1, N+2)
                        value = this.generatePlannedValue(product.id, year, month);
                        type = 'future';
                        editable = true;
                    }
                    
                    this.state.data[product.id][year].months[month] = {
                        value: value,
                        type: type,
                        editable: editable
                    };
                }
                
                // Calculate year total
                this.state.data[product.id][year].total = this.calculateYearTotal(product.id, year);
            }
        });
    },
    
    // Generate realistic historical values
    generateHistoricalValue(productId, year, month) {
        // Base value depends on product
        const bases = {
            'p001': 1200, // Pork shoulder
            'p002': 800,  // Beef tenderloin
            'p003': 1500, // Chicken breast
            'p004': 400,  // Lamb chops
            'p005': 900   // Sausage
        };
        
        const base = bases[productId] || 1000;
        
        // Add seasonal variation
        const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6);
        
        // Add some random variation
        const randomFactor = 0.9 + Math.random() * 0.2;
        
        // Year-over-year growth (3-5% per year)
        const yearGrowth = Math.pow(1.04, year - 2020);
        
        return Math.round(base * seasonalFactor * randomFactor * yearGrowth);
    },
    
    // Generate actual values (current year, past months)
    generateActualValue(productId, year, month) {
        // Similar to historical but with slightly more variation
        const base = this.generateHistoricalValue(productId, year, month);
        const actualVariation = 0.95 + Math.random() * 0.1;
        return Math.round(base * actualVariation);
    },
    
    // Generate planned values
    generatePlannedValue(productId, year, month) {
        // Start with historical average and add growth
        const base = this.generateHistoricalValue(productId, year, month);
        const planGrowth = 1.05; // 5% planned growth
        return Math.round(base * planGrowth);
    },
    
    // Calculate year total
    calculateYearTotal(productId, year) {
        const yearData = this.state.data[productId][year];
        let total = 0;
        
        for (let month = 1; month <= 12; month++) {
            if (yearData.months[month] && yearData.months[month].value) {
                total += yearData.months[month].value;
            }
        }
        
        return total;
    },
    
    // Get year label
    getYearLabel(offset) {
        switch(offset) {
            case -2: return 'N-2';
            case -1: return 'N-1';
            case 0: return 'N (trenutno)';
            case 1: return 'N+1';
            case 2: return 'N+2';
            default: return `N${offset > 0 ? '+' : ''}${offset}`;
        }
    },
    
    // Render the planning grid
    renderPlanningGrid() {
        const container = document.getElementById('planning-grid');
        if (!container) return;
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 
                       'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
        
        let html = `
            <div class="planning-v3-container">
                <!-- YELLOW DEPLOYMENT INDICATOR -->
                <div style="background: #FFD700; padding: 15px; text-align: center; font-weight: bold; margin-bottom: 20px; border: 2px solid red;">
                    ⚠️ PLANNING V3 (v0.3.0) - THIS IS THE NEW VERSION! ⚠️
                </div>
                
                <div class="planning-header">
                    <h2>Načrtovanje proizvodnje / Production Planning</h2>
                    <div class="view-controls">
                        <button onclick="PlanningV3.changeView('monthly')" class="view-btn active">Mesečno</button>
                        <button onclick="PlanningV3.changeView('quarterly')" class="view-btn">Četrtletno</button>
                        <button onclick="PlanningV3.changeView('yearly')" class="view-btn">Letno</button>
                    </div>
                </div>
                
                <div class="planning-table">
                    <table>
                        <thead>
                            <tr>
                                <th class="product-header" colspan="2">Izdelek / Product</th>
                                ${months.map(m => `<th class="month-header">${m}</th>`).join('')}
                                <th class="total-header">Skupaj</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Render each product as a macro row
        this.state.products.forEach(product => {
            const isExpanded = this.state.expandedProducts.has(product.id);
            
            // Macro row (product header)
            html += `
                <tr class="macro-row ${isExpanded ? 'expanded' : ''}" data-product="${product.id}">
                    <td colspan="2" class="product-cell">
                        <button class="expand-toggle" onclick="PlanningV3.toggleProduct('${product.id}')">
                            ${isExpanded ? '▼' : '▶'}
                        </button>
                        <div class="product-info">
                            <span class="product-code">${product.code}</span>
                            <span class="product-name">${product.name}</span>
                            <span class="product-unit">(${product.unit})</span>
                        </div>
                    </td>
                    ${this.renderProductSummary(product.id)}
                </tr>
            `;
            
            // Micro rows (years) - only show if expanded
            if (isExpanded) {
                for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
                    const year = this.state.currentYear + yearOffset;
                    html += this.renderYearRow(product.id, year, yearOffset);
                }
            }
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="planning-legend">
                    <div class="legend-item">
                        <span class="cell-type historical"></span>
                        <span>Zgodovinski podatki (N-2, N-1)</span>
                    </div>
                    <div class="legend-item">
                        <span class="cell-type actual"></span>
                        <span>Dejanski podatki (N)</span>
                    </div>
                    <div class="legend-item">
                        <span class="cell-type current"></span>
                        <span>Trenutni mesec</span>
                    </div>
                    <div class="legend-item">
                        <span class="cell-type plan"></span>
                        <span>Načrt tekočega leta</span>
                    </div>
                    <div class="legend-item">
                        <span class="cell-type future"></span>
                        <span>Prihodnji načrt (N+1, N+2)</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render product summary (shows current year total or average)
    renderProductSummary(productId) {
        const currentYear = this.state.currentYear;
        const currentYearData = this.state.data[productId][currentYear];
        
        let html = '';
        for (let month = 1; month <= 12; month++) {
            const monthData = currentYearData.months[month];
            const displayValue = monthData.value ? 
                monthData.value.toLocaleString('sl-SI') : '-';
            
            html += `<td class="summary-cell">${displayValue}</td>`;
        }
        
        html += `<td class="total-cell">${currentYearData.total.toLocaleString('sl-SI')}</td>`;
        
        return html;
    },
    
    // Render a year row (micro row)
    renderYearRow(productId, year, yearOffset) {
        const yearData = this.state.data[productId][year];
        const yearLabel = this.getYearLabel(yearOffset);
        
        let rowClass = 'micro-row';
        if (yearOffset < 0) rowClass += ' historical-year';
        else if (yearOffset === 0) rowClass += ' current-year';
        else rowClass += ' future-year';
        
        let html = `
            <tr class="${rowClass}" data-product="${productId}" data-year="${year}">
                <td class="indent"></td>
                <td class="year-label">
                    <span class="year-text">${yearLabel}</span>
                    <span class="year-number">${year}</span>
                </td>
        `;
        
        // Render each month
        for (let month = 1; month <= 12; month++) {
            const monthData = yearData.months[month];
            html += this.renderMonthCell(productId, year, month, monthData);
        }
        
        // Year total
        html += `
                <td class="total-cell ${yearOffset >= 0 ? 'editable-total' : ''}">
                    ${yearData.total.toLocaleString('sl-SI')}
                </td>
            </tr>
        `;
        
        return html;
    },
    
    // Render a month cell
    renderMonthCell(productId, year, month, monthData) {
        const cellClass = `month-cell cell-type-${monthData.type}`;
        
        if (monthData.editable) {
            return `
                <td class="${cellClass} editable">
                    <input type="number" 
                           value="${monthData.value || ''}"
                           onchange="PlanningV3.updateValue('${productId}', ${year}, ${month}, this.value)"
                           placeholder="0">
                </td>
            `;
        } else {
            const displayValue = monthData.value ? 
                monthData.value.toLocaleString('sl-SI') : '-';
            
            return `
                <td class="${cellClass}">
                    ${displayValue}
                </td>
            `;
        }
    },
    
    // Toggle product expansion
    toggleProduct(productId) {
        if (this.state.expandedProducts.has(productId)) {
            this.state.expandedProducts.delete(productId);
        } else {
            this.state.expandedProducts.add(productId);
        }
        this.renderPlanningGrid();
    },
    
    // Update a value
    updateValue(productId, year, month, value) {
        const numValue = parseFloat(value) || 0;
        this.state.data[productId][year].months[month].value = numValue;
        
        // Recalculate total
        this.state.data[productId][year].total = this.calculateYearTotal(productId, year);
        
        // Re-render the grid
        this.renderPlanningGrid();
        
        console.log(`Updated: ${productId} - ${year}/${month} = ${numValue}`);
    },
    
    // Change view (monthly, quarterly, yearly)
    changeView(view) {
        this.state.currentView = view;
        this.renderPlanningGrid();
    }
};

// Make it globally available
window.PlanningV3 = PlanningV3;
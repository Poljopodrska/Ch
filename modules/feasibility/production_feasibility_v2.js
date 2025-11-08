// Production Feasibility Module V2 - With Expandable Grid like Production Planning
const ProductionFeasibility = {
    VERSION: '2.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        expandedMonths: new Set(),  // Store as "month-N" where N is 1-12
        expandedWeeks: new Set(),   // Store as "week-M-W" where M is month, W is week
        products: [],
        feasibilityData: {},
        selectedDetail: null
    },
    
    init() {
        console.log(`Production Feasibility Module V${this.VERSION} initializing...`);
        this.loadProducts();
        this.calculateFeasibility();
        this.render();
        this.setupEventListeners();
        console.log('Production Feasibility initialized');
    },
    
    loadProducts() {
        // Get products from Production Planning if available
        if (typeof ProductionPlanningV3 !== 'undefined' && ProductionPlanningV3.state) {
            this.state.products = ProductionPlanningV3.state.products;
        } else {
            // Fallback products
            this.state.products = [
                { id: 'p001', code: 'PRD-001', name: 'Premium Salami', unit: 'kg' },
                { id: 'p002', code: 'PRD-002', name: 'Classic Mortadella', unit: 'kg' },
                { id: 'p003', code: 'PRD-003', name: 'Smoked Ham', unit: 'kg' }
            ];
        }
    },
    
    calculateFeasibility() {
        this.state.feasibilityData = {};
        
        this.state.products.forEach(product => {
            this.state.feasibilityData[product.id] = {
                workforce: this.calculateWorkforceFeasibility(product.id),
                materials: this.calculateMaterialsFeasibility(product.id)
            };
        });
    },
    
    calculateWorkforceFeasibility(productId) {
        const data = {};
        
        // Get production plan
        const productionPlan = this.getProductionPlan(productId);
        const bomData = this.getBOMData(productId);
        const workforceAvailability = this.getWorkforceData();
        
        // Calculate for each month
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                required: 0,
                available: 0,
                status: 'ok',
                weeks: {}
            };
            
            // Get planned production for this month
            const plannedQty = productionPlan?.months?.[month]?.total || 0;
            
            // Calculate required workforce (hours)
            if (plannedQty > 0 && bomData?.workforce) {
                // Assume production rate of 100 units per 8-hour shift with specified operators
                const batchesNeeded = Math.ceil(plannedQty / 100);
                monthData.required = batchesNeeded * bomData.workforce.hours * bomData.workforce.operators;
            }
            
            // Get available workforce
            monthData.available = (workforceAvailability[month - 1] || 0) * 8; // Convert days to hours
            
            // Determine status
            if (monthData.required === 0) {
                monthData.status = 'none';
            } else if (monthData.available >= monthData.required) {
                if (monthData.available > monthData.required * 1.5) {
                    monthData.status = 'excess';
                } else {
                    monthData.status = 'ok';
                }
            } else if (monthData.available >= monthData.required * 0.8) {
                monthData.status = 'warning';
            } else {
                monthData.status = 'critical';
            }
            
            // Calculate weekly breakdown
            const weeksInMonth = this.getWeeksInMonth(month);
            for (let week = 1; week <= weeksInMonth; week++) {
                const weekData = {
                    required: Math.floor(monthData.required / weeksInMonth),
                    available: Math.floor(monthData.available / weeksInMonth),
                    status: monthData.status,
                    days: {}
                };
                
                // Calculate daily breakdown
                const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, week);
                daysInWeek.forEach(day => {
                    const dayData = {
                        required: Math.floor(weekData.required / daysInWeek.length),
                        available: Math.floor(weekData.available / daysInWeek.length),
                        status: weekData.status
                    };
                    weekData.days[day] = dayData;
                });
                
                monthData.weeks[week] = weekData;
            }
            
            data[month] = monthData;
        }
        
        return data;
    },
    
    calculateMaterialsFeasibility(productId) {
        const data = {};
        
        // Get production plan and BOM
        const productionPlan = this.getProductionPlan(productId);
        const bomData = this.getBOMData(productId);
        const stockLevels = this.getStockData();
        
        // Calculate for each month
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                materials: {},
                overallStatus: 'ok',
                weeks: {}
            };
            
            // Get planned production for this month
            const plannedQty = productionPlan?.months?.[month]?.total || 0;
            
            if (plannedQty > 0 && bomData) {
                // Check main ingredients
                if (bomData.mainIngredients) {
                    Object.entries(bomData.mainIngredients).forEach(([material, qtyPerUnit]) => {
                        const required = plannedQty * qtyPerUnit;
                        const available = stockLevels[material]?.currentStock || 0;
                        
                        monthData.materials[material] = {
                            required: required,
                            available: available,
                            status: this.getMaterialStatus(required, available),
                            type: 'main'
                        };
                    });
                }
                
                // Check supporting ingredients
                if (bomData.supportIngredients) {
                    Object.entries(bomData.supportIngredients).forEach(([material, qtyPerUnit]) => {
                        const required = plannedQty * qtyPerUnit;
                        const available = stockLevels[material]?.currentStock || 0;
                        
                        monthData.materials[material] = {
                            required: required,
                            available: available,
                            status: this.getMaterialStatus(required, available),
                            type: 'support'
                        };
                    });
                }
                
                // Check packaging
                if (bomData.packaging) {
                    Object.entries(bomData.packaging).forEach(([material, qtyPerUnit]) => {
                        const required = plannedQty * qtyPerUnit;
                        const available = stockLevels[material]?.currentStock || 0;
                        
                        monthData.materials[material] = {
                            required: required,
                            available: available,
                            status: this.getMaterialStatus(required, available),
                            type: 'packaging'
                        };
                    });
                }
                
                // Determine overall status
                const statuses = Object.values(monthData.materials).map(m => m.status);
                if (statuses.includes('critical')) {
                    monthData.overallStatus = 'critical';
                } else if (statuses.includes('warning')) {
                    monthData.overallStatus = 'warning';
                } else if (statuses.includes('excess')) {
                    monthData.overallStatus = 'excess';
                } else if (statuses.length === 0) {
                    monthData.overallStatus = 'none';
                } else {
                    monthData.overallStatus = 'ok';
                }
            } else {
                monthData.overallStatus = 'none';
            }
            
            // Calculate weekly breakdown
            const weeksInMonth = this.getWeeksInMonth(month);
            for (let week = 1; week <= weeksInMonth; week++) {
                const weekData = {
                    materials: {},
                    overallStatus: monthData.overallStatus,
                    days: {}
                };
                
                // Distribute materials across weeks
                Object.entries(monthData.materials).forEach(([material, matData]) => {
                    weekData.materials[material] = {
                        required: matData.required / weeksInMonth,
                        available: matData.available / weeksInMonth,
                        status: matData.status,
                        type: matData.type
                    };
                });
                
                // Calculate daily breakdown
                const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, week);
                daysInWeek.forEach(day => {
                    const dayData = {
                        materials: {},
                        overallStatus: weekData.overallStatus
                    };
                    
                    Object.entries(weekData.materials).forEach(([material, matData]) => {
                        dayData.materials[material] = {
                            required: matData.required / daysInWeek.length,
                            available: matData.available / daysInWeek.length,
                            status: matData.status,
                            type: matData.type
                        };
                    });
                    
                    weekData.days[day] = dayData;
                });
                
                monthData.weeks[week] = weekData;
            }
            
            data[month] = monthData;
        }
        
        return data;
    },
    
    getMaterialStatus(required, available) {
        if (required === 0) return 'none';
        if (available >= required) {
            if (available > required * 2) return 'excess';
            return 'ok';
        }
        if (available >= required * 0.5) return 'warning';
        return 'critical';
    },
    
    getProductionPlan(productId) {
        if (typeof ProductionPlanningV3 !== 'undefined' && ProductionPlanningV3.state?.data?.[productId]) {
            return ProductionPlanningV3.state.data[productId].productionPlan;
        }
        
        // Fallback data
        return {
            months: {
                1: { total: 1000 },
                2: { total: 1200 },
                3: { total: 1100 },
                4: { total: 900 },
                5: { total: 1300 },
                6: { total: 1400 }
            }
        };
    },
    
    getBOMData(productId) {
        if (typeof BOMV2Advanced !== 'undefined' && BOMV2Advanced.state?.bomData?.[productId]) {
            const bom = BOMV2Advanced.state.bomData[productId];
            return {
                mainIngredients: bom.ingredients?.main || {},
                supportIngredients: bom.ingredients?.supporting || {},
                packaging: bom.packaging || {},
                workforce: bom.workforce || { operators: 2, hours: 8 }
            };
        }
        
        // Fallback BOM
        return {
            mainIngredients: { 'MAT-001': 0.8, 'MAT-002': 0.15 },
            supportIngredients: { 'MAT-010': 0.05 },
            packaging: { 'PKG-001': 1 },
            workforce: { operators: 2, hours: 8 }
        };
    },
    
    getStockData() {
        const stock = {};
        
        if (typeof StockRawMaterials !== 'undefined' && StockRawMaterials.stockData) {
            Object.assign(stock, StockRawMaterials.stockData);
        } else {
            // Fallback stock
            stock['MAT-001'] = { currentStock: 5000 };
            stock['MAT-002'] = { currentStock: 2000 };
            stock['MAT-010'] = { currentStock: 500 };
            stock['PKG-001'] = { currentStock: 10000 };
        }
        
        return stock;
    },
    
    getWorkforceData() {
        const availability = {};
        
        if (typeof WorkforceAvailability !== 'undefined' && WorkforceAvailability.state) {
            for (let month = 0; month < 12; month++) {
                availability[month] = WorkforceAvailability.getMonthTotal(this.state.currentYear, month);
            }
        } else {
            // Fallback: assume 5 workers, 22 days per month
            for (let month = 0; month < 12; month++) {
                availability[month] = 110; // 5 workers * 22 days
            }
        }
        
        return availability;
    },
    
    render() {
        const container = document.getElementById('feasibility-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="feasibility-v2-container">
                <div class="feasibility-header">
                    <h2>[Target] Production Feasibility Analysis</h2>
                    <div class="header-info">
                        Click on months to expand weeks, click on weeks to expand days. Click on any cell to see details.
                    </div>
                </div>
                
                <div class="feasibility-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <!-- Detail Popup -->
                <div id="feasibility-detail-popup" class="detail-popup" style="display: none;">
                    <div class="popup-content">
                        <div class="popup-header">
                            <h3 id="popup-title">Details</h3>
                            <button onclick="ProductionFeasibility.closeDetail()">✕</button>
                        </div>
                        <div id="popup-body">
                            <!-- Details will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.getStyles()}
        `;
    },
    
    renderTable() {
        const headers = this.renderHeaders();
        const rows = this.renderAllProductRows();
        
        return `
            <table class="feasibility-table">
                ${headers}
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    },
    
    renderHeaders() {
        let monthHeaders = '<tr><th class="product-header" rowspan="2">Product</th><th class="type-header" rowspan="2">Type</th>';
        let subHeaders = '<tr>';
        
        // Build month headers with potential expansion
        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const isExpanded = this.state.expandedMonths.has(monthKey);
            const monthName = this.getMonthShort(month);
            
            if (isExpanded) {
                // Show weeks for this month
                const weeksInMonth = this.getWeeksInMonth(month);
                monthHeaders += `
                    <th class="month-header" colspan="${weeksInMonth}" 
                        onclick="ProductionFeasibility.toggleMonth('${monthKey}')">
                        <span class="expand-icon expanded">▶</span>
                        ${monthName}
                    </th>
                `;
                
                // Add week sub-headers
                for (let week = 1; week <= weeksInMonth; week++) {
                    const weekKey = `week-${month}-${week}`;
                    const weekExpanded = this.state.expandedWeeks.has(weekKey);
                    
                    if (weekExpanded) {
                        // Show days for this week
                        const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, week);
                        subHeaders += `
                            <th class="week-header" colspan="${daysInWeek.length}"
                                onclick="ProductionFeasibility.toggleWeek('${weekKey}')">
                                <span class="expand-icon expanded">▶</span>W${week}
                            </th>
                        `;
                    } else {
                        subHeaders += `
                            <th class="week-header" 
                                onclick="ProductionFeasibility.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▶</span>W${week}
                            </th>
                        `;
                    }
                }
            } else {
                monthHeaders += `
                    <th class="month-header" 
                        onclick="ProductionFeasibility.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▶</span>
                        ${monthName}
                    </th>
                `;
                subHeaders += '<th>-</th>';
            }
        }
        
        monthHeaders += '</tr>';
        subHeaders += '</tr>';
        
        // Add day headers if any week is expanded
        let dayHeaders = '';
        if ([...this.state.expandedWeeks].length > 0) {
            dayHeaders = '<tr><th></th><th></th>';
            
            for (let month = 1; month <= 12; month++) {
                const monthKey = `month-${month}`;
                if (this.state.expandedMonths.has(monthKey)) {
                    const weeksInMonth = this.getWeeksInMonth(month);
                    for (let week = 1; week <= weeksInMonth; week++) {
                        const weekKey = `week-${month}-${week}`;
                        if (this.state.expandedWeeks.has(weekKey)) {
                            const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, week);
                            daysInWeek.forEach(day => {
                                const date = new Date(this.state.currentYear, month - 1, day);
                                const dayName = this.getDayShort(date.getDay());
                                const weekendClass = WeekUtils.isWeekend(date) ? 'weekend' : '';
                                dayHeaders += `<th class="day-header ${weekendClass}">${day}<br>${dayName}</th>`;
                            });
                        } else {
                            dayHeaders += '<th>-</th>';
                        }
                    }
                } else {
                    dayHeaders += '<th>-</th>';
                }
            }
            
            dayHeaders += '</tr>';
        }
        
        return '<thead>' + monthHeaders + subHeaders + dayHeaders + '</thead>';
    },
    
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
    
    renderProductRows(product) {
        const workforceData = this.state.feasibilityData[product.id].workforce;
        const materialsData = this.state.feasibilityData[product.id].materials;
        
        let html = '';
        
        // Workforce row
        html += `<tr class="workforce-row">`;
        html += `
            <td class="product-cell" rowspan="2">
                <strong>${product.code}</strong><br>
                ${product.name}<br>
                <small>${product.unit}</small>
            </td>
            <td class="type-cell">
                <span class="type-label workforce">[Users] Workforce</span>
            </td>
        `;
        html += this.renderDataCells(product.id, 'workforce', workforceData);
        html += '</tr>';
        
        // Materials row
        html += `<tr class="materials-row">`;
        html += `
            <td class="type-cell">
                <span class="type-label materials">[Box] Materials</span>
            </td>
        `;
        html += this.renderDataCells(product.id, 'materials', materialsData);
        html += '</tr>';
        
        return html;
    },
    
    renderDataCells(productId, type, data) {
        let html = '';
        
        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const monthData = data[month];
            
            if (this.state.expandedMonths.has(monthKey)) {
                // Month is expanded - show weeks
                const weeksInMonth = this.getWeeksInMonth(month);
                for (let week = 1; week <= weeksInMonth; week++) {
                    const weekKey = `week-${month}-${week}`;
                    const weekData = monthData.weeks[week];
                    
                    if (this.state.expandedWeeks.has(weekKey)) {
                        // Week is expanded - show days
                        const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, week);
                        daysInWeek.forEach(day => {
                            const dayData = weekData.days[day];
                            const date = new Date(this.state.currentYear, month - 1, day);
                            const weekendClass = WeekUtils.isWeekend(date) ? 'weekend-cell' : '';
                            const status = type === 'workforce' ? dayData.status : dayData.overallStatus;
                            const cellClass = `cell-${status}`;
                            
                            html += `
                                <td class="${cellClass} clickable ${weekendClass}" 
                                    onclick="ProductionFeasibility.showDetail('${productId}', '${type}', ${month}, ${week}, ${day})">
                                    ${this.getStatusIcon(status)}
                                </td>
                            `;
                        });
                    } else {
                        // Week not expanded - show week summary
                        const status = type === 'workforce' ? weekData.status : weekData.overallStatus;
                        const cellClass = `cell-${status}`;
                        
                        html += `
                            <td class="${cellClass} clickable" 
                                onclick="ProductionFeasibility.showDetail('${productId}', '${type}', ${month}, ${week}, null)">
                                ${this.getStatusIcon(status)}
                            </td>
                        `;
                    }
                }
            } else {
                // Month not expanded - show month summary
                const status = type === 'workforce' ? monthData.status : monthData.overallStatus;
                const cellClass = `cell-${status}`;
                
                html += `
                    <td class="${cellClass} clickable" 
                        onclick="ProductionFeasibility.showDetail('${productId}', '${type}', ${month}, null, null)">
                        ${this.getStatusIcon(status)}
                    </td>
                `;
            }
        }
        
        return html;
    },
    
    getStatusIcon(status) {
        switch(status) {
            case 'ok': return '[OK]';
            case 'warning': return '[X]';  // Under capacity - show red cross
            case 'critical': return '[X]'; // Under capacity - show red cross
            case 'excess': return '[OK]';   // Over capacity is OK - show checkmark
            case 'none': return '➖';     // No production - keep dash
            default: return '[X]';         // Default to red cross for any issues
        }
    },
    
    showDetail(productId, type, month, week, day) {
        const product = this.state.products.find(p => p.id === productId);
        const data = this.state.feasibilityData[productId][type];
        
        let detailData;
        let periodLabel;
        
        if (day !== null) {
            detailData = data[month].weeks[week].days[day];
            periodLabel = `${this.getMonthName(month)} ${day}`;
        } else if (week !== null) {
            detailData = data[month].weeks[week];
            periodLabel = `${this.getMonthName(month)} Week ${week}`;
        } else {
            detailData = data[month];
            periodLabel = this.getMonthName(month);
        }
        
        const popup = document.getElementById('feasibility-detail-popup');
        const title = document.getElementById('popup-title');
        const body = document.getElementById('popup-body');
        
        title.innerHTML = `${product.name} - ${type === 'workforce' ? '[Users] Workforce' : '[Box] Materials'} - ${periodLabel}`;
        
        if (type === 'workforce') {
            body.innerHTML = this.renderWorkforceDetail(detailData);
        } else {
            body.innerHTML = this.renderMaterialsDetail(detailData);
        }
        
        popup.style.display = 'block';
    },
    
    renderWorkforceDetail(data) {
        const status = data.status;
        const statusColor = this.getStatusColor(status);
        
        return `
            <div class="detail-content">
                <div class="detail-status" style="background: ${statusColor}">
                    ${this.getStatusIcon(status)} ${this.getStatusText(status)}
                </div>
                
                <div class="detail-numbers">
                    <div class="detail-item">
                        <label>Required Hours:</label>
                        <span class="value">${data.required.toFixed(1)} hrs</span>
                    </div>
                    <div class="detail-item">
                        <label>Available Hours:</label>
                        <span class="value">${data.available.toFixed(1)} hrs</span>
                    </div>
                    <div class="detail-item">
                        <label>Difference:</label>
                        <span class="value ${data.available >= data.required ? 'positive' : 'negative'}">
                            ${(data.available - data.required).toFixed(1)} hrs
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Coverage:</label>
                        <span class="value">
                            ${data.required > 0 ? ((data.available / data.required) * 100).toFixed(0) : 100}%
                        </span>
                    </div>
                </div>
                
                ${status === 'critical' || status === 'warning' ? `
                    <div class="detail-recommendation">
                        <strong>Recommendation:</strong><br>
                        ${status === 'critical' ? 
                            'Urgent: Schedule overtime or hire temporary workers' : 
                            'Consider adjusting schedule or redistributing workload'
                        }
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    renderMaterialsDetail(data) {
        const status = data.overallStatus;
        const statusColor = this.getStatusColor(status);
        
        let materialsHtml = '';
        if (data.materials) {
            Object.entries(data.materials).forEach(([material, matData]) => {
                const matStatus = this.getStatusIcon(matData.status);
                materialsHtml += `
                    <tr>
                        <td>${material}</td>
                        <td>${matData.type}</td>
                        <td>${matData.required.toFixed(1)}</td>
                        <td>${matData.available.toFixed(1)}</td>
                        <td>${matStatus}</td>
                    </tr>
                `;
            });
        }
        
        return `
            <div class="detail-content">
                <div class="detail-status" style="background: ${statusColor}">
                    ${this.getStatusIcon(status)} ${this.getStatusText(status)}
                </div>
                
                ${materialsHtml ? `
                    <table class="materials-detail-table">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Available</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materialsHtml}
                        </tbody>
                    </table>
                ` : '<p>No material requirements for this period</p>'}
                
                ${status === 'critical' || status === 'warning' ? `
                    <div class="detail-recommendation">
                        <strong>Recommendation:</strong><br>
                        ${status === 'critical' ? 
                            'Urgent: Order missing materials immediately' : 
                            'Consider reordering materials to maintain safety stock'
                        }
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    getStatusColor(status) {
        switch(status) {
            case 'ok': return '#d4edda';
            case 'warning': return '#fff3cd';
            case 'critical': return '#f8d7da';
            case 'excess': return '#cce5ff';
            case 'none': return '#f8f9fa';
            default: return '#ffffff';
        }
    },
    
    getStatusText(status) {
        switch(status) {
            case 'ok': return 'All Clear';
            case 'warning': return 'Warning';
            case 'critical': return 'Critical Issue';
            case 'excess': return 'Excess Capacity';
            case 'none': return 'No Activity';
            default: return 'Unknown';
        }
    },
    
    closeDetail() {
        document.getElementById('feasibility-detail-popup').style.display = 'none';
    },
    
    toggleMonth(monthKey) {
        if (this.state.expandedMonths.has(monthKey)) {
            this.state.expandedMonths.delete(monthKey);
            // Also collapse all weeks in this month
            const month = parseInt(monthKey.split('-')[1]);
            [...this.state.expandedWeeks].forEach(weekKey => {
                if (weekKey.startsWith(`week-${month}-`)) {
                    this.state.expandedWeeks.delete(weekKey);
                }
            });
        } else {
            this.state.expandedMonths.add(monthKey);
        }
        this.render();
    },
    
    toggleWeek(weekKey) {
        if (this.state.expandedWeeks.has(weekKey)) {
            this.state.expandedWeeks.delete(weekKey);
        } else {
            this.state.expandedWeeks.add(weekKey);
        }
        this.render();
    },
    
    getWeeksInMonth(month) {
        // Simplified: assume 4 weeks per month
        return 4;
    },
    
    getDaysInWeek(year, month, week) {
        // Simplified: return 7 days for each week
        const startDay = (week - 1) * 7 + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const endDay = Math.min(startDay + 6, daysInMonth);
        
        const days = [];
        for (let d = startDay; d <= endDay; d++) {
            days.push(d);
        }
        return days;
    },
    
    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1];
    },
    
    getMonthShort(month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    },
    
    getDayShort(dayOfWeek) {
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return days[dayOfWeek];
    },
    
    setupEventListeners() {
        // Listen for changes in other modules
        if (typeof ChEvents !== 'undefined') {
            ChEvents.on('production:updated', () => this.refresh());
            ChEvents.on('stock:updated', () => this.refresh());
            ChEvents.on('workforce:updated', () => this.refresh());
            ChEvents.on('bom:updated', () => this.refresh());
        }
    },
    
    refresh() {
        this.calculateFeasibility();
        this.render();
    },
    
    getStyles() {
        return `
            <style>
                .feasibility-v2-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .feasibility-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .feasibility-header h2 {
                    margin: 0 0 10px 0;
                }
                
                .header-info {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .feasibility-table-wrapper {
                    background: white;
                    border-radius: 8px;
                    overflow-x: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .feasibility-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1400px;
                }
                
                .feasibility-table th {
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
                
                .feasibility-table th.product-header {
                    text-align: left;
                    min-width: 200px;
                    background: #2c3e50;
                    padding: 8px;
                }
                
                .feasibility-table th.type-header {
                    text-align: left;
                    min-width: 120px;
                    background: #2c3e50;
                    padding: 8px;
                }
                
                /* Month headers */
                .month-header {
                    background: #546e7a !important;
                    cursor: pointer;
                    user-select: none;
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
                
                .feasibility-table td {
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 50px;
                    font-size: 20px;
                }
                
                .product-cell {
                    text-align: left !important;
                    font-weight: 600;
                    background: var(--ch-gray-100);
                    position: sticky;
                    left: 0;
                    z-index: 5;
                }
                
                .type-cell {
                    text-align: left !important;
                    background: var(--ch-gray-200);
                    position: sticky;
                    left: 200px;
                    z-index: 4;
                }
                
                .type-label {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .type-label.workforce {
                    background: var(--ch-primary-light);
                    color: var(--ch-primary-dark);
                }
                
                .type-label.materials {
                    background: #f3e5f5;
                    color: var(--ch-primary);
                }
                
                /* Status cells */
                .cell-ok {
                    background: #d4edda;
                }
                
                .cell-warning {
                    background: #fff3cd;
                }
                
                .cell-critical {
                    background: #f8d7da;
                }
                
                .cell-excess {
                    background: #cce5ff;
                }
                
                .cell-none {
                    background: var(--ch-gray-100);
                    opacity: 0.5;
                }
                
                .clickable {
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .clickable:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    z-index: 2;
                    position: relative;
                }
                
                .product-separator {
                    height: 3px;
                    background: #34495e;
                }
                
                /* Detail Popup */
                .detail-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .popup-content {
                    background: white;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80%;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                }
                
                .popup-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .popup-header h3 {
                    margin: 0;
                    color: #2c3e50;
                }
                
                .popup-header button {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6c757d;
                }
                
                .popup-header button:hover {
                    color: #2c3e50;
                }
                
                #popup-body {
                    padding: 20px;
                }
                
                .detail-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .detail-status {
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .detail-numbers {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    background: var(--ch-gray-100);
                    border-radius: 4px;
                }
                
                .detail-item label {
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .detail-item .value {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .detail-item .value.positive {
                    color: #28a745;
                }
                
                .detail-item .value.negative {
                    color: #dc3545;
                }
                
                .materials-detail-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .materials-detail-table th {
                    background: var(--ch-gray-100);
                    padding: 10px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .materials-detail-table td {
                    padding: 8px 10px;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .detail-recommendation {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #ffc107;
                    font-size: 14px;
                }
            </style>
        `;
    }
};

// Export for use
window.ProductionFeasibility = ProductionFeasibility;
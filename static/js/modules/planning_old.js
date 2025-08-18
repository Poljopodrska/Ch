// Ch Project Production Planning Module
const Planning = {
    currentView: 'weekly',
    historyYears: 2,
    futureYears: 2,
    products: [],
    planningData: {},
    historicalData: {},
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    currentWeek: null,
    
    // Initialize the planning module
    async init() {
        console.log('Initializing Planning module...');
        this.currentWeek = this.getWeekNumber(new Date());
        await this.loadProducts();
        await this.loadPlanningData();
        await this.loadHistoricalData();
        this.setupEventListeners();
        this.updateView();
    },
    
    // Load products from pricing module or storage
    async loadProducts() {
        try {
            // Try to get from Pricing module first
            if (window.Pricing && window.Pricing.products) {
                this.products = window.Pricing.products;
            } else {
                // Load from localStorage or API
                const savedData = localStorage.getItem('ch_products');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    this.products = data.products || [];
                } else {
                    // Default products
                    this.products = [
                        { id: 1, article_name: "Premium Salami", unit_type: "pcs" },
                        { id: 2, article_name: "Traditional Ham", unit_type: "pcs" },
                        { id: 3, article_name: "Baked Pork Roll", unit_type: "pcs" }
                    ];
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    },
    
    // Load planning data
    async loadPlanningData() {
        try {
            const savedData = localStorage.getItem('ch_planning_data');
            if (savedData) {
                this.planningData = JSON.parse(savedData);
            } else {
                this.planningData = {};
            }
        } catch (error) {
            console.error('Error loading planning data:', error);
            this.planningData = {};
        }
    },
    
    // Load historical data
    async loadHistoricalData() {
        try {
            const savedData = localStorage.getItem('ch_historical_data');
            if (savedData) {
                this.historicalData = JSON.parse(savedData);
            } else {
                // Generate sample historical data
                this.generateSampleHistoricalData();
            }
        } catch (error) {
            console.error('Error loading historical data:', error);
            this.historicalData = {};
        }
    },
    
    // Generate sample historical data
    generateSampleHistoricalData() {
        this.historicalData = {};
        
        this.products.forEach(product => {
            this.historicalData[product.id] = {};
            
            // Generate 2 years of historical data
            for (let year = this.currentYear - 2; year < this.currentYear; year++) {
                for (let month = 0; month < 12; month++) {
                    for (let day = 1; day <= 31; day++) {
                        const date = new Date(year, month, day);
                        if (date.getMonth() === month && this.isWorkingDay(date)) {
                            const dateKey = this.getDateKey(date);
                            // Random sales between 2-8 units per day
                            this.historicalData[product.id][dateKey] = Math.round((Math.random() * 6 + 2) * 100) / 100;
                        }
                    }
                }
            }
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Time view buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                if (view) {
                    this.changeView(view);
                }
            });
        });
    },
    
    // Change time view
    changeView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.updateView();
    },
    
    // Update the planning view
    updateView() {
        const historySelect = document.getElementById('history-years');
        const futureSelect = document.getElementById('future-years');
        
        if (historySelect) this.historyYears = parseInt(historySelect.value);
        if (futureSelect) this.futureYears = parseInt(futureSelect.value);
        
        this.renderPlanningGrid();
        this.updateSummary();
    },
    
    // Render the planning grid
    renderPlanningGrid() {
        const gridContainer = document.getElementById('planning-grid');
        if (!gridContainer) return;
        
        const timeColumns = this.generateTimeColumns();
        
        let html = `
            <table class="planning-table">
                <thead>
                    <tr>
                        <th class="fixed-column product-column">Product</th>
                        <th class="fixed-column unit-column">Unit</th>
                        ${timeColumns.map(col => `
                            <th class="${col.type}-column ${col.isCurrent ? 'current-period' : ''}" 
                                title="${this.getColumnTooltip(col)}">
                                ${col.label}
                            </th>
                        `).join('')}
                        <th class="fixed-column total-column">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.products.forEach(product => {
            html += this.renderProductRow(product, timeColumns);
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr class="totals-row">
                        <td colspan="2" class="fixed-column">Totals</td>
                        ${timeColumns.map(col => `
                            <td class="${col.type}-column ${col.isCurrent ? 'current-period' : ''}">
                                <div class="column-total" id="total-${this.getColumnId(col)}">0</div>
                            </td>
                        `).join('')}
                        <td class="fixed-column total-column">
                            <div class="grand-total" id="grand-total">0</div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        gridContainer.innerHTML = html;
        
        // Calculate totals
        this.calculateTotals();
    },
    
    // Render a product row
    renderProductRow(product, timeColumns) {
        let html = `
            <tr class="product-row" data-product-id="${product.id}">
                <td class="fixed-column product-name">${product.article_name}</td>
                <td class="fixed-column unit-type">${product.unit_type || 'pcs'}</td>
        `;
        
        let rowTotal = 0;
        
        timeColumns.forEach(col => {
            const cellContent = this.getCellContent(product, col);
            rowTotal += cellContent.value || 0;
            
            html += `
                <td class="${col.type}-column ${col.isCurrent ? 'current-period' : ''} ${cellContent.className}">
                    ${cellContent.html}
                </td>
            `;
        });
        
        html += `
                <td class="fixed-column total-column">
                    <div class="row-total">${rowTotal.toFixed(2)}</div>
                </td>
            </tr>
        `;
        
        return html;
    },
    
    // Get cell content based on time period
    getCellContent(product, column) {
        const now = new Date();
        const isHistory = column.type === 'history';
        const isFuture = column.type === 'future';
        const isCurrent = column.type === 'current';
        
        let value = 0;
        let html = '';
        let className = '';
        
        if (isHistory) {
            // Historical data (read-only)
            value = this.getHistoricalValue(product.id, column);
            html = `
                <div class="historical-value">
                    <span class="value">${value.toFixed(2)}</span>
                    <span class="lock-icon">🔒</span>
                </div>
            `;
            className = 'historical-cell';
        } else if (isCurrent) {
            // Current year - split between actual and plan
            const actual = this.getActualValue(product.id, column, now);
            const planned = this.getPlannedValue(product.id, column);
            value = actual + planned;
            
            if (this.isPastPeriod(column, now)) {
                // Past period - show actual only
                html = `<div class="actual-value">${actual.toFixed(2)}</div>`;
                className = 'actual-cell';
            } else if (this.isCurrentPeriod(column, now)) {
                // Current period - show both actual and plan
                html = `
                    <div class="split-value">
                        <span class="actual" title="Actual">${actual.toFixed(2)}</span>
                        <span class="divider">|</span>
                        <input type="number" 
                               class="plan-input mini" 
                               value="${planned.toFixed(4)}"
                               step="0.0001"
                               data-product="${product.id}"
                               data-column='${JSON.stringify(column)}'
                               onchange="Planning.updatePlanValue(this)">
                    </div>
                `;
                className = 'current-cell';
            } else {
                // Future part of current year
                html = this.getPlanInput(product.id, column, planned);
                className = 'plan-cell';
            }
        } else {
            // Future years - all planned
            const planned = this.getPlannedValue(product.id, column);
            value = planned;
            html = this.getPlanInput(product.id, column, planned);
            className = 'future-cell';
        }
        
        return { value, html, className };
    },
    
    // Get plan input HTML
    getPlanInput(productId, column, value) {
        return `
            <input type="number" 
                   class="plan-input" 
                   value="${value.toFixed(4)}"
                   step="0.0001"
                   data-product="${productId}"
                   data-column='${JSON.stringify(column)}'
                   onchange="Planning.updatePlanValue(this)">
        `;
    },
    
    // Update plan value
    updatePlanValue(input) {
        const productId = input.dataset.product;
        const column = JSON.parse(input.dataset.column);
        const value = parseFloat(input.value) || 0;
        
        // Save the plan value
        this.savePlanValue(productId, column, value);
        
        // If this is an aggregated view, distribute to lower levels
        if (this.currentView !== 'daily') {
            this.distributePlanValue(productId, column, value);
        }
        
        // Recalculate totals
        this.calculateTotals();
        this.updateSummary();
    },
    
    // Save plan value
    savePlanValue(productId, column, value) {
        if (!this.planningData[productId]) {
            this.planningData[productId] = {};
        }
        
        const key = this.getColumnKey(column);
        this.planningData[productId][key] = {
            value: value,
            view: this.currentView,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        this.savePlanningData();
    },
    
    // Distribute plan value to lower time periods
    distributePlanValue(productId, column, totalValue) {
        const workingDays = this.getWorkingDaysInPeriod(column.startDate, column.endDate);
        const dailyValue = totalValue / workingDays;
        
        // Create daily distributions
        const current = new Date(column.startDate);
        while (current <= column.endDate) {
            if (this.isWorkingDay(current)) {
                const dayKey = this.getDateKey(current);
                if (!this.planningData[productId]) {
                    this.planningData[productId] = {};
                }
                this.planningData[productId][dayKey] = {
                    value: dailyValue,
                    view: 'daily',
                    timestamp: new Date().toISOString()
                };
            }
            current.setDate(current.getDate() + 1);
        }
    },
    
    // Get working days in period
    getWorkingDaysInPeriod(startDate, endDate) {
        let count = 0;
        const current = new Date(startDate);
        
        while (current <= endDate) {
            if (this.isWorkingDay(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count || 1; // Avoid division by zero
    },
    
    // Check if date is a working day (Monday-Friday)
    isWorkingDay(date) {
        const day = date.getDay();
        return day >= 1 && day <= 5;
    },
    
    // Generate time columns
    generateTimeColumns() {
        const columns = [];
        const now = new Date();
        
        // Historical columns
        for (let y = this.historyYears; y > 0; y--) {
            columns.push(...this.getYearColumns(this.currentYear - y, 'history'));
        }
        
        // Current year columns
        columns.push(...this.getYearColumns(this.currentYear, 'current'));
        
        // Future columns
        for (let y = 1; y <= this.futureYears; y++) {
            columns.push(...this.getYearColumns(this.currentYear + y, 'future'));
        }
        
        return columns;
    },
    
    // Get columns for a year
    getYearColumns(year, type) {
        const columns = [];
        
        switch (this.currentView) {
            case 'yearly':
                columns.push({
                    label: year.toString(),
                    year: year,
                    type: type,
                    startDate: new Date(year, 0, 1),
                    endDate: new Date(year, 11, 31),
                    isCurrent: year === this.currentYear
                });
                break;
                
            case 'monthly':
                for (let m = 0; m < 12; m++) {
                    columns.push({
                        label: `${this.getMonthShortName(m)} ${year}`,
                        year: year,
                        month: m,
                        type: type,
                        startDate: new Date(year, m, 1),
                        endDate: new Date(year, m + 1, 0),
                        isCurrent: year === this.currentYear && m === this.currentMonth
                    });
                }
                break;
                
            case 'weekly':
                const weeks = this.getWeeksInYear(year);
                weeks.forEach((week, index) => {
                    columns.push({
                        label: `W${week.week}`,
                        year: year,
                        week: week.week,
                        type: type,
                        startDate: week.start,
                        endDate: week.end,
                        isCurrent: year === this.currentYear && week.week === this.currentWeek
                    });
                });
                break;
                
            case 'daily':
                // For daily view, only show current month +/- 1
                if (Math.abs(year - this.currentYear) <= 1) {
                    const startMonth = year < this.currentYear ? 11 : (year > this.currentYear ? 0 : Math.max(0, this.currentMonth - 1));
                    const endMonth = year < this.currentYear ? 11 : (year > this.currentYear ? 0 : Math.min(11, this.currentMonth + 1));
                    
                    for (let m = startMonth; m <= endMonth; m++) {
                        const daysInMonth = new Date(year, m + 1, 0).getDate();
                        for (let d = 1; d <= daysInMonth; d++) {
                            const date = new Date(year, m, d);
                            if (this.isWorkingDay(date)) {
                                columns.push({
                                    label: `${d}/${m + 1}`,
                                    year: year,
                                    month: m,
                                    day: d,
                                    type: type,
                                    startDate: date,
                                    endDate: date,
                                    isCurrent: this.isToday(date)
                                });
                            }
                        }
                    }
                }
                break;
        }
        
        return columns;
    },
    
    // Get weeks in year
    getWeeksInYear(year) {
        const weeks = [];
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        // Find first Monday
        let current = new Date(startDate);
        while (current.getDay() !== 1) {
            current.setDate(current.getDate() + 1);
        }
        
        let weekNum = 1;
        while (current.getFullYear() === year) {
            const weekStart = new Date(current);
            const weekEnd = new Date(current);
            weekEnd.setDate(weekEnd.getDate() + 4); // Friday
            
            weeks.push({
                week: weekNum,
                start: weekStart,
                end: weekEnd
            });
            
            weekNum++;
            current.setDate(current.getDate() + 7);
        }
        
        return weeks;
    },
    
    // Get week number
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Helper functions
    getMonthShortName(month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month];
    },
    
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    },
    
    getColumnKey(column) {
        if (column.day) {
            return this.getDateKey(column.startDate);
        } else if (column.week) {
            return `${column.year}-W${column.week}`;
        } else if (column.month !== undefined) {
            return `${column.year}-${String(column.month + 1).padStart(2, '0')}`;
        } else {
            return column.year.toString();
        }
    },
    
    getColumnId(column) {
        return this.getColumnKey(column).replace(/[^a-zA-Z0-9]/g, '_');
    },
    
    getColumnTooltip(column) {
        const start = column.startDate.toLocaleDateString();
        const end = column.endDate.toLocaleDateString();
        return `${start} - ${end}`;
    },
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },
    
    isPastPeriod(column, referenceDate) {
        return column.endDate < referenceDate;
    },
    
    isCurrentPeriod(column, referenceDate) {
        return column.startDate <= referenceDate && column.endDate >= referenceDate;
    },
    
    // Get historical value
    getHistoricalValue(productId, column) {
        const data = this.historicalData[productId] || {};
        let total = 0;
        
        const current = new Date(column.startDate);
        while (current <= column.endDate) {
            const key = this.getDateKey(current);
            total += data[key] || 0;
            current.setDate(current.getDate() + 1);
        }
        
        return total;
    },
    
    // Get actual value (current year)
    getActualValue(productId, column, upToDate) {
        const data = this.historicalData[productId] || {};
        let total = 0;
        
        const current = new Date(column.startDate);
        const endDate = new Date(Math.min(column.endDate, upToDate));
        
        while (current <= endDate) {
            const key = this.getDateKey(current);
            total += data[key] || 0;
            current.setDate(current.getDate() + 1);
        }
        
        return total;
    },
    
    // Get planned value
    getPlannedValue(productId, column) {
        const data = this.planningData[productId] || {};
        
        // First check if we have a value for this exact column
        const key = this.getColumnKey(column);
        if (data[key]) {
            return data[key].value;
        }
        
        // Otherwise, aggregate from daily values
        let total = 0;
        const current = new Date(column.startDate);
        
        while (current <= column.endDate) {
            if (this.isWorkingDay(current)) {
                const dayKey = this.getDateKey(current);
                if (data[dayKey]) {
                    total += data[dayKey].value;
                }
            }
            current.setDate(current.getDate() + 1);
        }
        
        return total;
    },
    
    // Calculate totals
    calculateTotals() {
        const timeColumns = this.generateTimeColumns();
        let grandTotal = 0;
        
        timeColumns.forEach(col => {
            let columnTotal = 0;
            
            this.products.forEach(product => {
                const cellContent = this.getCellContent(product, col);
                columnTotal += cellContent.value || 0;
            });
            
            const totalElement = document.getElementById(`total-${this.getColumnId(col)}`);
            if (totalElement) {
                totalElement.textContent = columnTotal.toFixed(2);
            }
            
            grandTotal += columnTotal;
        });
        
        const grandTotalElement = document.getElementById('grand-total');
        if (grandTotalElement) {
            grandTotalElement.textContent = grandTotal.toFixed(2);
        }
    },
    
    // Update summary statistics
    updateSummary() {
        const totalUnits = this.calculateTotalPlannedUnits();
        const workingDays = this.calculateTotalWorkingDays();
        const dailyAverage = workingDays > 0 ? totalUnits / workingDays : 0;
        
        document.getElementById('total-units').textContent = totalUnits.toFixed(2);
        document.getElementById('working-days').textContent = workingDays;
        document.getElementById('daily-average').textContent = dailyAverage.toFixed(2);
        document.getElementById('capacity-util').textContent = '85%'; // Mock value
    },
    
    // Calculate total planned units
    calculateTotalPlannedUnits() {
        let total = 0;
        
        Object.values(this.planningData).forEach(productData => {
            Object.values(productData).forEach(entry => {
                if (entry.view === 'daily') {
                    total += entry.value;
                }
            });
        });
        
        return total;
    },
    
    // Calculate total working days
    calculateTotalWorkingDays() {
        const startYear = this.currentYear - this.historyYears;
        const endYear = this.currentYear + this.futureYears;
        let total = 0;
        
        for (let year = startYear; year <= endYear; year++) {
            total += this.getWorkingDaysInYear(year);
        }
        
        return total;
    },
    
    // Get working days in year
    getWorkingDaysInYear(year) {
        return this.getWorkingDaysInPeriod(
            new Date(year, 0, 1),
            new Date(year, 11, 31)
        );
    },
    
    // Save planning data
    savePlanningData() {
        localStorage.setItem('ch_planning_data', JSON.stringify(this.planningData));
    },
    
    // Auto-distribute functionality
    autoDistribute() {
        const modal = document.getElementById('distribute-modal');
        if (modal) {
            // Populate product select
            const select = modal.querySelector('select[name="product_id"]');
            select.innerHTML = '<option value="">Select product...</option>';
            this.products.forEach(product => {
                select.innerHTML += `<option value="${product.id}">${product.article_name}</option>`;
            });
            
            // Populate year select
            const yearSelect = modal.querySelector('select[name="year"]');
            yearSelect.innerHTML = '';
            for (let y = this.currentYear; y <= this.currentYear + 3; y++) {
                yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
            }
            
            modal.style.display = 'block';
        }
    },
    
    // Close distribute modal
    closeDistributeModal() {
        const modal = document.getElementById('distribute-modal');
        if (modal) modal.style.display = 'none';
    },
    
    // Update distribute preview
    updateDistributePreview() {
        const form = document.getElementById('distribute-form');
        const preview = document.getElementById('distribute-preview');
        
        const productId = form.elements['product_id'].value;
        const periodType = form.elements['period_type'].value;
        const totalUnits = parseFloat(form.elements['total_units'].value) || 0;
        const year = parseInt(form.elements['year'].value);
        const workingDaysOnly = form.elements['working_days_only'].checked;
        
        if (!productId || !year || totalUnits === 0) {
            preview.innerHTML = '<p>Select options above to see distribution preview</p>';
            return;
        }
        
        let workingDays = 0;
        let dailyUnits = 0;
        
        switch (periodType) {
            case 'yearly':
                workingDays = this.getWorkingDaysInYear(year);
                dailyUnits = totalUnits / workingDays;
                preview.innerHTML = `
                    <p>Total units: <strong>${totalUnits.toFixed(4)}</strong></p>
                    <p>Working days in ${year}: <strong>${workingDays}</strong></p>
                    <p>Units per working day: <strong>${dailyUnits.toFixed(4)}</strong></p>
                `;
                break;
                
            case 'monthly':
                workingDays = this.getWorkingDaysInPeriod(
                    new Date(year, 0, 1),
                    new Date(year, 0, 31)
                );
                dailyUnits = totalUnits / workingDays;
                preview.innerHTML = `
                    <p>Monthly total: <strong>${totalUnits.toFixed(4)}</strong></p>
                    <p>Avg working days per month: <strong>${workingDays}</strong></p>
                    <p>Units per working day: <strong>${dailyUnits.toFixed(4)}</strong></p>
                    <p><em>This will be applied to each month of ${year}</em></p>
                `;
                break;
                
            case 'weekly':
                workingDays = 5; // Always 5 working days per week
                dailyUnits = totalUnits / workingDays;
                preview.innerHTML = `
                    <p>Weekly total: <strong>${totalUnits.toFixed(4)}</strong></p>
                    <p>Working days per week: <strong>${workingDays}</strong></p>
                    <p>Units per working day: <strong>${dailyUnits.toFixed(4)}</strong></p>
                    <p><em>This will be applied to each week of ${year}</em></p>
                `;
                break;
        }
    },
    
    // Apply distribution
    applyDistribution(event) {
        event.preventDefault();
        const form = event.target;
        
        const productId = form.elements['product_id'].value;
        const periodType = form.elements['period_type'].value;
        const totalUnits = parseFloat(form.elements['total_units'].value) || 0;
        const year = parseInt(form.elements['year'].value);
        const workingDaysOnly = form.elements['working_days_only'].checked;
        
        // Apply distribution logic based on period type
        switch (periodType) {
            case 'yearly':
                this.distributeYearly(productId, year, totalUnits, workingDaysOnly);
                break;
            case 'monthly':
                this.distributeMonthly(productId, year, totalUnits, workingDaysOnly);
                break;
            case 'weekly':
                this.distributeWeekly(productId, year, totalUnits, workingDaysOnly);
                break;
        }
        
        this.closeDistributeModal();
        this.updateView();
        
        return false;
    },
    
    // Distribute yearly
    distributeYearly(productId, year, totalUnits, workingDaysOnly) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const workingDays = this.getWorkingDaysInPeriod(startDate, endDate);
        const dailyUnits = totalUnits / workingDays;
        
        const current = new Date(startDate);
        while (current <= endDate) {
            if (!workingDaysOnly || this.isWorkingDay(current)) {
                const key = this.getDateKey(current);
                if (!this.planningData[productId]) {
                    this.planningData[productId] = {};
                }
                this.planningData[productId][key] = {
                    value: dailyUnits,
                    view: 'daily',
                    timestamp: new Date().toISOString()
                };
            }
            current.setDate(current.getDate() + 1);
        }
        
        this.savePlanningData();
    },
    
    // Export plan
    exportPlan() {
        const headers = ['Product', 'Date', 'Period Type', 'Planned Units'];
        let csv = headers.join(',') + '\n';
        
        this.products.forEach(product => {
            const productData = this.planningData[product.id] || {};
            
            Object.entries(productData).forEach(([key, data]) => {
                const row = [
                    `"${product.article_name}"`,
                    key,
                    data.view,
                    data.value.toFixed(4)
                ];
                csv += row.join(',') + '\n';
            });
        });
        
        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ch_production_plan_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    // Import plan
    importPlan() {
        const modal = document.getElementById('import-plan-modal');
        if (modal) modal.style.display = 'block';
    },
    
    // Close import modal
    closeImportModal() {
        const modal = document.getElementById('import-plan-modal');
        if (modal) modal.style.display = 'none';
    },
    
    // Save plan
    savePlan() {
        this.savePlanningData();
        alert('Production plan saved successfully!');
    }
};

// Make Planning available globally
window.Planning = Planning;
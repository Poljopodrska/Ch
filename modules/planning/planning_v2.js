// Ch Planning Module V2 - Enhanced with sublines structure
// Supports: Daily, Weekly, Monthly, Yearly planning
// MANGO RULE Compliant - Works for any product in any country

const PlanningV2 = {
    // Module version from package.json
    VERSION: '2.0.0',
    
    // Current state
    state: {
        currentView: 'monthly', // daily, weekly, monthly, yearly
        currentProduct: null,
        currentYear: new Date().getFullYear(),
        currentPeriod: null, // Current time unit (day/week/month)
        planData: {},
        actualData: {},
        historicalData: {},
        expandedProducts: new Set(),
        lockedPeriods: new Set()
    },
    
    // Time granularity configuration
    timeConfig: {
        daily: {
            name: 'Daily',
            units: 365,
            format: 'DD/MM',
            aggregation: 'sum',
            expand: 'weekly'
        },
        weekly: {
            name: 'Weekly',
            units: 52,
            format: 'W##',
            aggregation: 'sum',
            expand: 'monthly',
            collapse: 'daily'
        },
        monthly: {
            name: 'Monthly',
            units: 12,
            format: 'MMM',
            aggregation: 'sum',
            expand: 'yearly',
            collapse: 'weekly'
        },
        yearly: {
            name: 'Yearly',
            units: 1,
            format: 'YYYY',
            aggregation: 'sum',
            collapse: 'monthly'
        }
    },
    
    // Initialize the planning module
    init() {
        console.log(`Planning Module V${this.VERSION} initializing...`);
        this.detectCurrentPeriod();
        this.loadSavedState();
        this.setupEventListeners();
        this.renderPlanningGrid();
    },
    
    // Detect current time period
    detectCurrentPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const week = this.getWeekNumber(now);
        const day = now.getDate();
        
        this.state.currentPeriod = {
            year: year,
            month: month,
            week: week,
            day: day,
            timestamp: now.toISOString()
        };
        
        console.log('Current period detected:', this.state.currentPeriod);
    },
    
    // Get week number for a date
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    },
    
    // Change view granularity
    changeView(newView) {
        if (this.timeConfig[newView]) {
            console.log(`Changing view from ${this.state.currentView} to ${newView}`);
            this.state.currentView = newView;
            this.updateViewButtons();
            this.renderPlanningGrid();
        }
    },
    
    // Expand to higher time category
    expandTimeCategory() {
        const current = this.timeConfig[this.state.currentView];
        if (current.expand) {
            this.changeView(current.expand);
        }
    },
    
    // Collapse to lower time category
    collapseTimeCategory() {
        const current = this.timeConfig[this.state.currentView];
        if (current.collapse) {
            this.changeView(current.collapse);
        }
    },
    
    // Render the main planning grid
    renderPlanningGrid() {
        const container = document.getElementById('planning-grid');
        if (!container) {
            console.error('Planning grid container not found');
            return;
        }
        
        const view = this.state.currentView;
        const config = this.timeConfig[view];
        
        // Build grid HTML
        let html = `
            <div class="planning-grid-v2" data-view="${view}">
                <div class="grid-controls">
                    <button onclick="PlanningV2.collapseTimeCategory()" 
                            ${!config.collapse ? 'disabled' : ''}>
                        ← ${config.collapse ? 'Show ' + this.timeConfig[config.collapse].name : ''}
                    </button>
                    <span class="current-view">${config.name} View</span>
                    <button onclick="PlanningV2.expandTimeCategory()"
                            ${!config.expand ? 'disabled' : ''}>
                        ${config.expand ? 'Show ' + this.timeConfig[config.expand].name : ''} →
                    </button>
                </div>
                
                ${this.renderProductRows()}
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render product rows with sublines
    renderProductRows() {
        const products = this.getProducts();
        let html = '<div class="product-rows">';
        
        products.forEach(product => {
            html += this.renderProductWithSublines(product);
        });
        
        html += '</div>';
        return html;
    },
    
    // Render single product with all sublines
    renderProductWithSublines(product) {
        const currentYear = this.state.currentYear;
        const isExpanded = this.state.expandedProducts.has(product.id);
        
        let html = `
            <div class="product-section" data-product-id="${product.id}">
                <div class="product-header">
                    <button class="expand-btn" onclick="PlanningV2.toggleProduct('${product.id}')">
                        ${isExpanded ? '▼' : '▶'}
                    </button>
                    <span class="product-name">${product.name}</span>
                    <span class="product-code">(${product.code})</span>
                </div>
                
                <div class="product-sublines ${isExpanded ? 'expanded' : 'collapsed'}">
        `;
        
        // Historical data rows (N-2, N-1)
        html += this.renderHistoricalRow(product, currentYear - 2, 'N-2');
        html += this.renderHistoricalRow(product, currentYear - 1, 'N-1');
        
        // Current year split row (actual + plan)
        html += this.renderCurrentYearRow(product, currentYear);
        
        // Next year plan row (N+1)
        html += this.renderFutureRow(product, currentYear + 1, 'N+1');
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Render historical data row
    renderHistoricalRow(product, year, label) {
        const periods = this.getPeriodsForView(year);
        
        let html = `
            <div class="subline historical" data-year="${year}">
                <div class="subline-header">
                    <span class="year-label">${label} (${year})</span>
                    <span class="data-type">Historical Sales</span>
                </div>
                <div class="period-cells">
        `;
        
        periods.forEach(period => {
            const value = this.getHistoricalValue(product.id, year, period);
            html += `
                <div class="cell historical locked" title="${year} ${period.label}">
                    <span class="value">${value || '-'}</span>
                    🔒
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Render current year row (split between actual and plan)
    renderCurrentYearRow(product, year) {
        const periods = this.getPeriodsForView(year);
        const splitPoint = this.getCurrentPeriodIndex();
        
        let html = `
            <div class="subline current-year" data-year="${year}">
                <div class="subline-header">
                    <span class="year-label">N (${year})</span>
                    <span class="data-type">Actual / Plan</span>
                </div>
                <div class="period-cells">
        `;
        
        periods.forEach((period, index) => {
            if (index < splitPoint) {
                // Past - actual data
                const value = this.getActualValue(product.id, year, period);
                html += `
                    <div class="cell actual locked" title="${year} ${period.label} (Actual)">
                        <span class="value">${value || '-'}</span>
                        🔒
                    </div>
                `;
            } else {
                // Future - plan data
                const value = this.getPlanValue(product.id, year, period);
                html += `
                    <div class="cell plan editable" 
                         data-product="${product.id}"
                         data-year="${year}"
                         data-period="${period.id}">
                        <input type="number" 
                               value="${value || ''}"
                               onchange="PlanningV2.updatePlanValue(this)"
                               placeholder="0">
                        📝
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Render future year row
    renderFutureRow(product, year, label) {
        const periods = this.getPeriodsForView(year);
        
        let html = `
            <div class="subline future" data-year="${year}">
                <div class="subline-header">
                    <span class="year-label">${label} (${year})</span>
                    <span class="data-type">Plan</span>
                </div>
                <div class="period-cells">
        `;
        
        periods.forEach(period => {
            const value = this.getPlanValue(product.id, year, period);
            html += `
                <div class="cell future-plan editable"
                     data-product="${product.id}"
                     data-year="${year}"
                     data-period="${period.id}">
                    <input type="number"
                           value="${value || ''}"
                           onchange="PlanningV2.updatePlanValue(this)"
                           placeholder="0">
                    📝
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Get periods for current view
    getPeriodsForView(year) {
        const view = this.state.currentView;
        const periods = [];
        
        switch(view) {
            case 'daily':
                // Generate days for the year
                for (let d = 1; d <= 365; d++) {
                    periods.push({
                        id: `d${d}`,
                        label: `Day ${d}`
                    });
                }
                break;
                
            case 'weekly':
                // Generate 52 weeks
                for (let w = 1; w <= 52; w++) {
                    periods.push({
                        id: `w${w}`,
                        label: `W${w.toString().padStart(2, '0')}`
                    });
                }
                break;
                
            case 'monthly':
                // Generate 12 months
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                months.forEach((month, index) => {
                    periods.push({
                        id: `m${index + 1}`,
                        label: month
                    });
                });
                break;
                
            case 'yearly':
                // Single year period
                periods.push({
                    id: `y${year}`,
                    label: year.toString()
                });
                break;
        }
        
        return periods;
    },
    
    // Get current period index for split
    getCurrentPeriodIndex() {
        const view = this.state.currentView;
        const current = this.state.currentPeriod;
        
        switch(view) {
            case 'daily':
                // Days from start of year
                const startOfYear = new Date(current.year, 0, 1);
                const now = new Date();
                return Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
                
            case 'weekly':
                return current.week;
                
            case 'monthly':
                return current.month;
                
            case 'yearly':
                return 1; // Current year is always index 0
                
            default:
                return 0;
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
    
    // Update plan value
    updatePlanValue(input) {
        const product = input.dataset.product;
        const year = input.dataset.year;
        const period = input.dataset.period;
        const value = parseFloat(input.value) || 0;
        
        // Store in plan data
        if (!this.state.planData[product]) {
            this.state.planData[product] = {};
        }
        if (!this.state.planData[product][year]) {
            this.state.planData[product][year] = {};
        }
        this.state.planData[product][year][period] = value;
        
        console.log(`Updated plan: Product ${product}, Year ${year}, Period ${period} = ${value}`);
        this.autoSave();
    },
    
    // Get historical value
    getHistoricalValue(productId, year, period) {
        return this.state.historicalData[productId]?.[year]?.[period.id] || null;
    },
    
    // Get actual value
    getActualValue(productId, year, period) {
        return this.state.actualData[productId]?.[year]?.[period.id] || null;
    },
    
    // Get plan value
    getPlanValue(productId, year, period) {
        return this.state.planData[productId]?.[year]?.[period.id] || null;
    },
    
    // Get products (mock data for now)
    getProducts() {
        // This should come from API
        return [
            { id: 'p001', code: 'BF-001', name: 'Beef Tenderloin' },
            { id: 'p002', code: 'PK-001', name: 'Pork Shoulder' },
            { id: 'p003', code: 'CH-001', name: 'Chicken Breast' },
            { id: 'p004', code: 'LB-001', name: 'Lamb Rack' }
        ];
    },
    
    // Update view buttons
    updateViewButtons() {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.state.currentView);
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.savePlan();
            }
            if (e.key === 'Escape') {
                this.collapseAllProducts();
            }
        });
    },
    
    // Collapse all products
    collapseAllProducts() {
        this.state.expandedProducts.clear();
        this.renderPlanningGrid();
    },
    
    // Auto-save functionality
    autoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.savePlan(true);
        }, 2000);
    },
    
    // Save plan
    savePlan(isAutoSave = false) {
        const planData = {
            version: this.VERSION,
            timestamp: new Date().toISOString(),
            view: this.state.currentView,
            data: this.state.planData
        };
        
        localStorage.setItem('ch_planning_data', JSON.stringify(planData));
        
        if (!isAutoSave) {
            this.showNotification('Plan saved successfully', 'success');
        }
        
        console.log('Plan saved:', planData);
    },
    
    // Load saved state
    loadSavedState() {
        const saved = localStorage.getItem('ch_planning_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.state.planData = data.data || {};
                console.log('Loaded saved plan data');
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
        
        // Load mock historical data
        this.loadMockHistoricalData();
    },
    
    // Load mock historical data
    loadMockHistoricalData() {
        // This should come from API
        const products = this.getProducts();
        const currentYear = this.state.currentYear;
        
        products.forEach(product => {
            // Generate some random historical data
            for (let yearOffset = -2; yearOffset <= 0; yearOffset++) {
                const year = currentYear + yearOffset;
                
                if (!this.state.historicalData[product.id]) {
                    this.state.historicalData[product.id] = {};
                }
                if (!this.state.actualData[product.id]) {
                    this.state.actualData[product.id] = {};
                }
                
                const dataStore = yearOffset < 0 ? this.state.historicalData : this.state.actualData;
                
                if (!dataStore[product.id][year]) {
                    dataStore[product.id][year] = {};
                }
                
                // Generate monthly data
                for (let month = 1; month <= 12; month++) {
                    // Only generate for past months in current year
                    if (year === currentYear && month > this.state.currentPeriod.month) {
                        break;
                    }
                    
                    dataStore[product.id][year][`m${month}`] = 
                        Math.floor(Math.random() * 1000) + 500;
                }
            }
        });
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    // Export plan
    exportPlan() {
        const exportData = {
            version: this.VERSION,
            exportDate: new Date().toISOString(),
            view: this.state.currentView,
            currentPeriod: this.state.currentPeriod,
            planData: this.state.planData,
            products: this.getProducts()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                             { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ch_plan_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        this.showNotification('Plan exported successfully', 'success');
    },
    
    // Import plan
    importPlan() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        this.state.planData = data.planData || {};
                        this.renderPlanningGrid();
                        this.showNotification('Plan imported successfully', 'success');
                    } catch (error) {
                        this.showNotification('Error importing plan', 'error');
                        console.error('Import error:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
};

// Export for use in other modules
window.PlanningV2 = PlanningV2;

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PlanningV2.init());
} else {
    PlanningV2.init();
}
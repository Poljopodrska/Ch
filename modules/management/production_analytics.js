// Production Analytics Module - Sub-module of Management Summary
const ProductionAnalytics = {
    VERSION: '1.0.0',
    
    state: {
        selectedProduct: 'all',
        selectedGroup: 'all',
        selectedPeriod: 'month', // 'day', 'week', 'month', 'quarter', 'year'
        dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            end: new Date()
        },
        chartInstances: {},
        products: [],
        productGroups: []
    },
    
    init() {
        console.log(`Production Analytics Module V${this.VERSION} initializing...`);
        this.loadProducts();
        this.loadProductionData();
        this.render();
        this.initCharts();
    },
    
    loadProducts() {
        // Load products from planning module if available
        if (typeof PlanningV4 !== 'undefined' && PlanningV4.state.products) {
            this.state.products = PlanningV4.state.products;
        } else {
            // Default products
            this.state.products = [
                { id: 'p001', code: 'SVP-100', name: 'Svinjska plečka', group: 'meat' },
                { id: 'p002', code: 'GOV-200', name: 'Goveji file', group: 'meat' },
                { id: 'p003', code: 'PIŠ-300', name: 'Piščančje prsi', group: 'poultry' },
                { id: 'p004', code: 'JAG-400', name: 'Jagnječji kotleti', group: 'specialty' },
                { id: 'p005', code: 'KLB-500', name: 'Domača klobasa', group: 'processed' }
            ];
        }
        
        // Define product groups (2 levels)
        this.state.productGroups = [
            {
                id: 'fresh',
                name: 'Fresh Products',
                subgroups: [
                    { id: 'meat', name: 'Fresh Meat' },
                    { id: 'poultry', name: 'Poultry' }
                ]
            },
            {
                id: 'processed',
                name: 'Processed Products',
                subgroups: [
                    { id: 'processed', name: 'Sausages & Processed' },
                    { id: 'specialty', name: 'Specialty Items' }
                ]
            }
        ];
    },
    
    loadProductionData() {
        // This would load from actual data source
        // For now, generate sample data
        this.state.productionData = this.generateSampleData();
    },
    
    generateSampleData() {
        const data = {};
        const today = new Date();
        const startDate = new Date(today.getFullYear(), 0, 1);
        
        this.state.products.forEach(product => {
            data[product.id] = {
                daily: [],
                plan: [],
                actual: []
            };
            
            // Generate daily data for current year
            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
                const dayOfWeek = d.getDay();
                const baseValue = Math.random() * 100 + 50;
                const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.5 : 1;
                
                const plannedValue = Math.round(baseValue * weekendFactor);
                const actualValue = Math.round(plannedValue * (0.8 + Math.random() * 0.4));
                
                data[product.id].daily.push({
                    date: new Date(d),
                    plan: plannedValue,
                    actual: actualValue
                });
            }
        });
        
        return data;
    },
    
    render() {
        const container = document.getElementById('management-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="production-analytics-container">
                <div class="analytics-header">
                    <button class="back-button" onclick="ManagementSummary.backToLanding()">
                        ← Back to Summary
                    </button>
                    <h1>[Factory] Production Analytics</h1>
                    <p class="header-subtitle">Comprehensive production KPIs and performance metrics</p>
                </div>
                
                <div class="controls-panel">
                    <div class="control-group">
                        <label>Product/Group:</label>
                        <select id="product-selector" onchange="ProductionAnalytics.onProductChange(this.value)">
                            <option value="all">All Products</option>
                            <optgroup label="Product Groups">
                                ${this.renderGroupOptions()}
                            </optgroup>
                            <optgroup label="Individual Products">
                                ${this.state.products.map(p => 
                                    `<option value="${p.id}">${p.code} - ${p.name}</option>`
                                ).join('')}
                            </optgroup>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <label>Period:</label>
                        <select id="period-selector" onchange="ProductionAnalytics.onPeriodChange(this.value)">
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month" selected>Monthly</option>
                            <option value="quarter">Quarterly</option>
                            <option value="year">Yearly</option>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <label>Date Range:</label>
                        <input type="date" id="date-start" value="${this.formatDate(this.state.dateRange.start)}"
                               onchange="ProductionAnalytics.onDateChange('start', this.value)">
                        <span>to</span>
                        <input type="date" id="date-end" value="${this.formatDate(this.state.dateRange.end)}"
                               onchange="ProductionAnalytics.onDateChange('end', this.value)">
                    </div>
                </div>
                
                <div class="kpi-cards">
                    <div class="kpi-card">
                        <div class="kpi-icon">[Chart]</div>
                        <div class="kpi-value" id="total-production">0</div>
                        <div class="kpi-label">Total Production</div>
                        <div class="kpi-change positive">+12.5% vs Plan</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">[Up]</div>
                        <div class="kpi-value" id="daily-average">0</div>
                        <div class="kpi-label">Daily Average</div>
                        <div class="kpi-change negative">-5.2% vs Last Period</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">[Target]</div>
                        <div class="kpi-value" id="plan-achievement">0%</div>
                        <div class="kpi-label">Plan Achievement</div>
                        <div class="kpi-change positive">Above Target</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">⚡</div>
                        <div class="kpi-value" id="efficiency">0%</div>
                        <div class="kpi-label">Efficiency Rate</div>
                        <div class="kpi-change neutral">Stable</div>
                    </div>
                </div>
                
                <div class="charts-grid">
                    <div class="chart-container">
                        <h3>[Up] Daily Production Trend</h3>
                        <canvas id="daily-production-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>[Target] Plan vs Actual Comparison</h3>
                        <canvas id="plan-vs-actual-chart"></canvas>
                    </div>
                    
                    <div class="chart-container full-width">
                        <h3>[Chart] Production by Product/Group</h3>
                        <canvas id="product-breakdown-chart"></canvas>
                    </div>
                </div>
                
                <div class="data-table-container">
                    <h3>[Clipboard] Detailed Production Data</h3>
                    <div id="production-data-table"></div>
                </div>
            </div>
            
            ${this.getStyles()}
        `;
    },
    
    renderGroupOptions() {
        let html = '';
        this.state.productGroups.forEach(group => {
            html += `<option value="group-${group.id}">${group.name} (All)</option>`;
            group.subgroups.forEach(subgroup => {
                html += `<option value="subgroup-${subgroup.id}">  └─ ${subgroup.name}</option>`;
            });
        });
        return html;
    },
    
    initCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            this.loadChartJS(() => this.createCharts());
        } else {
            this.createCharts();
        }
    },
    
    loadChartJS(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = callback;
        document.head.appendChild(script);
    },
    
    createCharts() {
        // Daily Production Trend Chart
        const dailyCtx = document.getElementById('daily-production-chart');
        if (dailyCtx) {
            this.state.chartInstances.daily = new Chart(dailyCtx, {
                type: 'line',
                data: this.getDailyChartData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        // Plan vs Actual Chart
        const planActualCtx = document.getElementById('plan-vs-actual-chart');
        if (planActualCtx) {
            this.state.chartInstances.planActual = new Chart(planActualCtx, {
                type: 'bar',
                data: this.getPlanVsActualData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        // Product Breakdown Chart
        const breakdownCtx = document.getElementById('product-breakdown-chart');
        if (breakdownCtx) {
            this.state.chartInstances.breakdown = new Chart(breakdownCtx, {
                type: 'bar',
                data: this.getProductBreakdownData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        this.updateKPIs();
        this.updateDataTable();
    },
    
    getDailyChartData() {
        const labels = [];
        const actualData = [];
        const planData = [];
        
        // Get last 30 days of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Aggregate data for selected product/group
            let dayActual = 0;
            let dayPlan = 0;
            
            if (this.state.selectedProduct === 'all') {
                this.state.products.forEach(product => {
                    const productData = this.state.productionData[product.id];
                    const dayData = productData.daily.find(dd => 
                        dd.date.toDateString() === d.toDateString()
                    );
                    if (dayData) {
                        dayActual += dayData.actual;
                        dayPlan += dayData.plan;
                    }
                });
            }
            
            actualData.push(dayActual);
            planData.push(dayPlan);
        }
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Actual Production',
                    data: actualData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Planned Production',
                    data: planData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderDash: [5, 5],
                    tension: 0.4
                }
            ]
        };
    },
    
    getPlanVsActualData() {
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const planData = [450, 480, 520, 490];
        const actualData = [420, 510, 480, 505];
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Plan',
                    data: planData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)'
                },
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)'
                }
            ]
        };
    },
    
    getProductBreakdownData() {
        const labels = this.state.products.map(p => p.code);
        const data = this.state.products.map(p => {
            const productData = this.state.productionData[p.id];
            return productData.daily.reduce((sum, d) => sum + d.actual, 0);
        });
        
        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ]
            }]
        };
    },
    
    updateKPIs() {
        // Calculate KPIs based on selected product/period
        let totalProduction = 0;
        let totalPlan = 0;
        let dayCount = 0;
        
        this.state.products.forEach(product => {
            const productData = this.state.productionData[product.id];
            productData.daily.forEach(day => {
                if (day.date >= this.state.dateRange.start && day.date <= this.state.dateRange.end) {
                    totalProduction += day.actual;
                    totalPlan += day.plan;
                    dayCount++;
                }
            });
        });
        
        const dailyAverage = dayCount > 0 ? Math.round(totalProduction / dayCount) : 0;
        const planAchievement = totalPlan > 0 ? Math.round((totalProduction / totalPlan) * 100) : 0;
        const efficiency = Math.round(85 + Math.random() * 10); // Simulated
        
        document.getElementById('total-production').textContent = totalProduction.toLocaleString();
        document.getElementById('daily-average').textContent = dailyAverage.toLocaleString();
        document.getElementById('plan-achievement').textContent = planAchievement + '%';
        document.getElementById('efficiency').textContent = efficiency + '%';
    },
    
    updateDataTable() {
        const tableContainer = document.getElementById('production-data-table');
        if (!tableContainer) return;
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Period Total</th>
                        <th>Plan</th>
                        <th>Actual</th>
                        <th>Variance</th>
                        <th>Achievement %</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.state.products.forEach(product => {
            const productData = this.state.productionData[product.id];
            let periodPlan = 0;
            let periodActual = 0;
            
            productData.daily.forEach(day => {
                if (day.date >= this.state.dateRange.start && day.date <= this.state.dateRange.end) {
                    periodPlan += day.plan;
                    periodActual += day.actual;
                }
            });
            
            const variance = periodActual - periodPlan;
            const achievement = periodPlan > 0 ? Math.round((periodActual / periodPlan) * 100) : 0;
            const varianceClass = variance >= 0 ? 'positive' : 'negative';
            
            html += `
                <tr>
                    <td><strong>${product.code}</strong> - ${product.name}</td>
                    <td>${(periodPlan + periodActual).toLocaleString()}</td>
                    <td>${periodPlan.toLocaleString()}</td>
                    <td>${periodActual.toLocaleString()}</td>
                    <td class="${varianceClass}">${variance >= 0 ? '+' : ''}${variance.toLocaleString()}</td>
                    <td class="${achievement >= 100 ? 'positive' : 'negative'}">${achievement}%</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = html;
    },
    
    onProductChange(value) {
        this.state.selectedProduct = value;
        this.updateCharts();
        this.updateKPIs();
        this.updateDataTable();
    },
    
    onPeriodChange(value) {
        this.state.selectedPeriod = value;
        this.updateCharts();
        this.updateKPIs();
    },
    
    onDateChange(type, value) {
        this.state.dateRange[type] = new Date(value);
        this.updateCharts();
        this.updateKPIs();
        this.updateDataTable();
    },
    
    updateCharts() {
        // Update chart data
        if (this.state.chartInstances.daily) {
            this.state.chartInstances.daily.data = this.getDailyChartData();
            this.state.chartInstances.daily.update();
        }
        
        if (this.state.chartInstances.planActual) {
            this.state.chartInstances.planActual.data = this.getPlanVsActualData();
            this.state.chartInstances.planActual.update();
        }
        
        if (this.state.chartInstances.breakdown) {
            this.state.chartInstances.breakdown.data = this.getProductBreakdownData();
            this.state.chartInstances.breakdown.update();
        }
    },
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    getStyles() {
        return `
            <style>
                .production-analytics-container {
                    padding: 30px;
                    max-width: 1600px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .analytics-header {
                    text-align: center;
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .analytics-header h1 {
                    font-size: 32px;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                .controls-panel {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    display: flex;
                    gap: 30px;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .control-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .control-group label {
                    font-weight: 600;
                    color: #546e7a;
                }
                
                .control-group select,
                .control-group input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }
                
                .kpi-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .kpi-card {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .kpi-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #3498db, #2ecc71);
                }
                
                .kpi-icon {
                    font-size: 36px;
                    margin-bottom: 10px;
                    opacity: 0.8;
                }
                
                .kpi-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .kpi-label {
                    font-size: 14px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                }
                
                .kpi-change {
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .kpi-change.positive {
                    color: #27ae60;
                }
                
                .kpi-change.negative {
                    color: #e74c3c;
                }
                
                .kpi-change.neutral {
                    color: #95a5a6;
                }
                
                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .chart-container {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .chart-container.full-width {
                    grid-column: 1 / -1;
                }
                
                .chart-container h3 {
                    margin-bottom: 20px;
                    color: #2c3e50;
                    font-size: 18px;
                }
                
                .chart-container canvas {
                    max-height: 300px;
                }
                
                .data-table-container {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .data-table-container h3 {
                    margin-bottom: 20px;
                    color: #2c3e50;
                    font-size: 18px;
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .data-table th {
                    background: #f8f9fa;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #546e7a;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .data-table td {
                    padding: 12px;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .data-table tbody tr:hover {
                    background: #f8f9fa;
                }
                
                .data-table .positive {
                    color: #27ae60;
                    font-weight: 600;
                }
                
                .data-table .negative {
                    color: #e74c3c;
                    font-weight: 600;
                }
                
                .back-button {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    padding: 10px 20px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #495057;
                    transition: all 0.3s;
                }
                
                .back-button:hover {
                    background: #e9ecef;
                    transform: translateY(-50%) translateX(-2px);
                }
            </style>
        `;
    }
};

// Export
window.ProductionAnalytics = ProductionAnalytics;
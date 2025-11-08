// Ch Production Planning Module V2 - Advanced with Expandable Hierarchy
// Same brilliant system as Sales Planning - expandable months → weeks → days
// Full inline editing with production-specific features

const ProductionPlanningV2 = {
    VERSION: '2.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentWeek: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7),
        currentDay: new Date().getDate(),
        today: new Date(),
        
        // Expansion state for drill-down
        expanded: {
            months: new Set(),  // Which months are expanded to show weeks
            weeks: new Set()    // Which weeks are expanded to show days
        },
        
        // Production data
        data: {},
        products: [],
        editedCells: new Set(),
        unsavedChanges: false,
        
        // Production-specific settings
        productionSettings: {
            shifts: {
                morning: { start: '06:00', end: '14:00', efficiency: 1.0 },
                afternoon: { start: '14:00', end: '22:00', efficiency: 0.95 },
                night: { start: '22:00', end: '06:00', efficiency: 0.85 }
            },
            productionLines: [
                { id: 'line_a', name: 'Line A - Fresh Meat', capacity: 500, unit: 'kg/hour' },
                { id: 'line_b', name: 'Line B - Processed', capacity: 300, unit: 'kg/hour' },
                { id: 'line_c', name: 'Line C - Packaging', capacity: 800, unit: 'units/hour' }
            ],
            maintenanceWindows: [],
            efficiency: {
                target: 0.85,  // 85% OEE target
                current: 0.82
            }
        }
    },
    
    // Initialize the module
    init() {
        console.log(`Production Planning Module V${this.VERSION} - Advanced Hierarchy initializing...`);
        
        // Reset state for re-initialization
        if (this.initialized) {
            console.log('Production Planning V2 re-initializing, resetting state...');
            this.initialized = false;
            this.state.expanded.months.clear();
            this.state.expanded.weeks.clear();
            this.state.editedCells.clear();
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
                console.error('ERROR: Could not find main-content element!');
                return;
            }
        }
        
        // Clear any existing content
        const gridContainer = document.getElementById('production-planning-grid');
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        
        // Load saved data or example data
        this.loadProductionData();
        this.renderProductionGrid();
        
        this.initialized = true;
        console.log('Production Planning V2 initialized');
    },
    
    initialized: false,
    
    // Load production data
    loadProductionData() {
        const currentYear = this.state.currentYear;
        
        // Load saved data from localStorage if available
        const savedData = localStorage.getItem('productionPlanningData');
        const savedEditedCells = localStorage.getItem('productionEditedCells');
        
        if (savedData) {
            this.state.data = JSON.parse(savedData);
            if (savedEditedCells) {
                this.state.editedCells = new Set(JSON.parse(savedEditedCells));
            }
        }
        
        // Example products for production
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                category: 'Fresh Meat',
                productionLine: 'line_a',
                cycleTime: 2.5,  // minutes per unit
                batchSize: 50,   // kg per batch
                setupTime: 30    // minutes
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                category: 'Premium Meat',
                productionLine: 'line_a',
                cycleTime: 3.5,
                batchSize: 30,
                setupTime: 45
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                category: 'Poultry',
                productionLine: 'line_b',
                cycleTime: 2.0,
                batchSize: 100,
                setupTime: 20
            },
            {
                id: 'p004',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                category: 'Processed Meat',
                productionLine: 'line_b',
                cycleTime: 4.0,
                batchSize: 40,
                setupTime: 60
            }
        ];
        
        // Generate production data if not loaded from storage
        if (!savedData) {
            this.state.products.forEach(product => {
                this.state.data[product.id] = this.generateProductData(product.id, currentYear);
            });
        }
    },
    
    // Generate production data for a product
    generateProductData(productId, currentYear) {
        const data = {};
        const product = this.state.products.find(p => p.id === productId);
        
        // Generate data for years N-2 to N+2, with special handling for current year
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (yearOffset === 0) {
                // Current year: two versions - actual production and planned production
                data[`${year}_actual`] = this.generateYearData(productId, year, yearOffset, false);
                data[`${year}_plan`] = this.generateYearData(productId, year, yearOffset, true);
            } else {
                // Other years: single version
                data[year] = this.generateYearData(productId, year, yearOffset, false);
            }
        }
        
        return data;
    },
    
    // Generate data for a single year
    generateYearData(productId, year, yearOffset, planOnlyMode = false) {
        const product = this.state.products.find(p => p.id === productId);
        const yearData = {
            label: `${year}`,
            shortLabel: yearOffset === -2 ? 'N-2' : 
                       yearOffset === -1 ? 'N-1' : 
                       yearOffset === 0 ? (planOnlyMode ? 'N (Plan)' : 'N (Act+Plan)') :
                       yearOffset === 1 ? 'N+1' : 'N+2',
            total: 0,
            type: yearOffset < 0 ? 'historical' : yearOffset > 0 ? 'future' : 'current',
            isPlanOnly: planOnlyMode,
            editable: yearOffset >= 0,
            capacity: 0,  // Total capacity for the year
            efficiency: 0, // Average efficiency
            months: {}
        };
        
        // Generate monthly data
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                label: this.getMonthName(month),
                shortLabel: this.getMonthShort(month),
                total: 0,
                capacity: 0,
                efficiency: 0,
                type: this.getDataType(yearOffset, month, 15, planOnlyMode),
                editable: this.isEditable(yearOffset, month, 15, planOnlyMode),
                weeks: {}
            };
            
            // Generate weekly data
            const weeksInMonth = this.getCalendarWeeksInMonth(year, month);
            weeksInMonth.forEach(weekNum => {
                const weekData = {
                    label: `KW${weekNum}`,
                    total: 0,
                    capacity: 0,
                    efficiency: 0,
                    editable: this.isEditable(yearOffset, month, 15, planOnlyMode),
                    days: {}
                };
                
                // Generate daily data with production-specific calculations
                const daysInWeek = this.getDaysOfWeekInMonth(year, month, weekNum);
                daysInWeek.forEach(day => {
                    const dataType = this.getDataType(yearOffset, month, day, planOnlyMode);
                    const editable = this.isEditable(yearOffset, month, day, planOnlyMode);
                    
                    // Calculate production value based on capacity and efficiency
                    const dayOfWeek = new Date(year, month - 1, day).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    
                    // Base production calculation
                    const dailyCapacity = this.calculateDailyCapacity(product, isWeekend);
                    const efficiency = this.calculateEfficiency(dataType, isWeekend);
                    const value = Math.round(dailyCapacity * efficiency);
                    
                    weekData.days[day] = {
                        label: day.toString(),
                        dayName: this.getDayShort(dayOfWeek),
                        value: value,
                        capacity: dailyCapacity,
                        efficiency: efficiency,
                        type: dataType,
                        editable: editable,
                        originalValue: value,
                        shifts: isWeekend ? ['morning'] : ['morning', 'afternoon'],
                        isWeekend: isWeekend
                    };
                    
                    weekData.total += value;
                    weekData.capacity += dailyCapacity;
                });
                
                // Calculate average efficiency for the week
                if (daysInWeek.length > 0) {
                    const totalEfficiency = daysInWeek.reduce((sum, day) => 
                        sum + weekData.days[day].efficiency, 0);
                    weekData.efficiency = totalEfficiency / daysInWeek.length;
                }
                
                monthData.weeks[weekNum] = weekData;
                monthData.total += weekData.total;
                monthData.capacity += weekData.capacity;
            });
            
            // Calculate average efficiency for the month
            const weekCount = Object.keys(monthData.weeks).length;
            if (weekCount > 0) {
                const totalEfficiency = Object.values(monthData.weeks).reduce((sum, week) => 
                    sum + week.efficiency, 0);
                monthData.efficiency = totalEfficiency / weekCount;
            }
            
            yearData.months[month] = monthData;
            yearData.total += monthData.total;
            yearData.capacity += monthData.capacity;
        }
        
        // Calculate average efficiency for the year
        yearData.efficiency = yearData.capacity > 0 ? yearData.total / yearData.capacity : 0;
        
        return yearData;
    },
    
    // Calculate daily production capacity
    calculateDailyCapacity(product, isWeekend) {
        const line = this.state.productionSettings.productionLines.find(
            l => l.id === product.productionLine
        );
        if (!line) return 100; // Default if no line found
        
        // Calculate based on shifts and line capacity
        const shiftsPerDay = isWeekend ? 1 : 2; // Reduced shifts on weekends
        const hoursPerShift = 8;
        const setupTimeHours = product.setupTime / 60;
        const effectiveHours = (shiftsPerDay * hoursPerShift) - setupTimeHours;
        
        // Calculate based on cycle time and batch size
        const batchesPerHour = 60 / product.cycleTime;
        const capacityPerHour = batchesPerHour * product.batchSize;
        
        return Math.round(effectiveHours * capacityPerHour * 0.85); // 85% availability
    },
    
    // Calculate production efficiency
    calculateEfficiency(dataType, isWeekend) {
        let baseEfficiency = 0.85; // Target OEE
        
        // Adjust based on data type
        if (dataType === 'historical' || dataType === 'actual') {
            // Historical data shows realistic efficiency
            baseEfficiency = 0.75 + Math.random() * 0.15; // 75-90%
        } else if (dataType === 'plan' || dataType === 'future') {
            // Planned data assumes better efficiency
            baseEfficiency = 0.80 + Math.random() * 0.10; // 80-90%
        }
        
        // Weekend adjustment
        if (isWeekend) {
            baseEfficiency *= 0.9; // 10% lower on weekends
        }
        
        return Math.min(baseEfficiency, 0.95); // Cap at 95%
    },
    
    // Check if data is editable
    isEditable(yearOffset, month, day, planOnlyMode) {
        // Historical data (N-2, N-1) is not editable
        if (yearOffset < 0) return false;
        
        // Plan-only mode is always editable
        if (planOnlyMode) return true;
        
        // For current year, only future dates and plans are editable
        if (yearOffset === 0) {
            const today = this.state.today;
            const dateToCheck = new Date(today.getFullYear(), month - 1, day);
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            return dateToCheck >= todayMidnight;
        }
        
        // Future years are editable
        return yearOffset > 0;
    },
    
    // Get data type based on date
    getDataType(yearOffset, month, day, planOnlyMode = false) {
        if (planOnlyMode) return 'plan';
        
        const today = this.state.today;
        const currentYear = today.getFullYear();
        const year = currentYear + yearOffset;
        
        if (yearOffset < 0) return 'historical';
        if (yearOffset > 0) return 'future';
        
        // For current year, compare with today's date
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
    renderProductionGrid() {
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
                
                .production-controls {
                    margin: 20px 0;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .production-info-bar {
                    display: flex;
                    gap: 20px;
                    margin: 15px 0;
                    padding: 10px;
                    background: var(--ch-primary-light);
                    border-radius: 5px;
                    font-size: 13px;
                }
                
                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .info-label {
                    font-weight: 600;
                    color: var(--ch-primary-dark);
                }
                
                .save-button {
                    padding: 10px 20px;
                    background: var(--ch-success);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .save-button:hover {
                    background: #45a049;
                }
                
                .save-button:disabled {
                    background: #cccccc;
                    cursor: not-allowed;
                }
                
                .export-button {
                    padding: 10px 20px;
                    background: var(--ch-primary);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .capacity-button {
                    padding: 10px 20px;
                    background: var(--ch-warning);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .unsaved-indicator {
                    padding: 5px 10px;
                    background: var(--ch-warning);
                    color: white;
                    border-radius: 3px;
                    font-size: 12px;
                    display: none;
                }
                
                .unsaved-indicator.show {
                    display: inline-block;
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
                
                .production-table th.product-header {
                    text-align: left;
                    min-width: 200px;
                    background: var(--ch-primary-dark);
                    padding: 8px;
                }
                
                .production-table th.year-header {
                    text-align: left;
                    min-width: 100px;
                    background: var(--ch-primary-dark);
                    padding: 8px;
                }
                
                /* Month headers with expand/collapse */
                .month-header {
                    background: var(--ch-primary-dark) !important;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                }
                
                .month-header:hover {
                    background: var(--ch-primary-dark) !important;
                }
                
                .week-header {
                    background: var(--ch-primary-light) !important;
                    font-size: 11px;
                    cursor: pointer;
                }
                
                .week-header:hover {
                    background: #1e88e5 !important;
                }
                
                .day-header {
                    background: var(--ch-primary-light) !important;
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
                
                .production-table td {
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 50px;
                    font-size: 12px;
                    position: relative;
                }
                
                .product-cell {
                    text-align: left !important;
                    font-weight: 600;
                    background: var(--ch-gray-100);
                    position: sticky;
                    left: 0;
                    z-index: 5;
                    padding: 8px !important;
                    border-right: 2px solid #1565c0;
                }
                
                .year-cell {
                    text-align: left !important;
                    font-weight: 500;
                    background: var(--ch-gray-200);
                    position: sticky;
                    left: 200px;
                    z-index: 4;
                    padding: 6px !important;
                    min-width: 100px;
                    border-right: 2px solid #666;
                    font-size: 11px;
                }
                
                /* Cell type styling for production */
                .cell-historical {
                    background: var(--ch-gray-100);
                    color: #7f8c8d;
                }
                
                .cell-actual {
                    background: #e8f5e9;
                    color: var(--ch-success);
                    font-weight: 600;
                }
                
                .cell-current {
                    background: #fff3e0;
                    color: var(--ch-warning);
                    font-weight: bold;
                    border: 2px solid #ff9800;
                }
                
                .cell-plan {
                    background: var(--ch-primary-light);
                    color: var(--ch-primary-dark);
                }
                
                .cell-future {
                    background: #f3e5f5;
                    color: var(--ch-primary-dark);
                }
                
                .cell-total {
                    background: #fff8e1;
                    font-weight: bold;
                    border-left: 2px solid #666;
                }
                
                /* Editable cells */
                .editable-cell {
                    cursor: pointer;
                    position: relative;
                }
                
                .editable-cell:hover {
                    background: var(--ch-primary-light) !important;
                    box-shadow: inset 0 0 0 2px var(--ch-primary);
                }
                
                .editable-cell.editing {
                    padding: 0 !important;
                }
                
                .cell-input {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                    text-align: center;
                    font-size: 11px;
                    padding: 6px 4px;
                    box-shadow: inset 0 0 0 2px #4CAF50;
                }
                
                .cell-input:focus {
                    outline: none;
                }
                
                .edited-cell {
                    background: #c8e6c9 !important;
                    font-weight: bold;
                }
                
                .edited-cell::after {
                    content: '*';
                    color: var(--ch-success);
                    font-weight: bold;
                    position: absolute;
                    top: 1px;
                    right: 2px;
                    font-size: 10px;
                }
                
                /* Efficiency indicator */
                .efficiency-indicator {
                    font-size: 9px;
                    color: #666;
                    display: block;
                    margin-top: 2px;
                }
                
                .efficiency-good {
                    color: var(--ch-success);
                }
                
                .efficiency-warning {
                    color: #ff9800;
                }
                
                .efficiency-bad {
                    color: #f44336;
                }
                
                /* Year row styling */
                .year-n-2 { background: var(--ch-gray-100); }
                .year-n-1 { background: var(--ch-gray-100); }
                .year-n { background: #fff8e1; font-weight: 600; }
                .year-n-plan { background: var(--ch-primary-light); font-style: italic; }
                .year-n1 { background: #f1f8e9; }
                .year-n2 { background: #e8f5e9; }
                
                .product-separator {
                    height: 3px;
                    background: var(--ch-primary-dark);
                }
            </style>
            
            <div class="production-planning-container">
                <div class="production-header">
                    <h2>[Factory] Načrtovanje proizvodnje / Production Planning</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        V2.0.0 - Advanced Production Planning with Expandable Hierarchy
                        <br>Click months → weeks → days | Edit future production values | Track capacity & efficiency
                    </div>
                </div>
                
                <div class="production-info-bar">
                    <div class="info-item">
                        <span class="info-label">Total Capacity:</span>
                        <span id="total-capacity">0 kg</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Avg Efficiency:</span>
                        <span id="avg-efficiency">0%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Active Lines:</span>
                        <span id="active-lines">3</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Shift Pattern:</span>
                        <span id="shift-pattern">2 Shifts</span>
                    </div>
                </div>
                
                <div class="production-controls">
                    <button class="save-button" onclick="ProductionPlanningV2.saveData()" id="save-btn" disabled>
                        [Save] Save Production Plan
                    </button>
                    <button class="export-button" onclick="ProductionPlanningV2.exportData()">
                        [Folder] Export Plan
                    </button>
                    <button class="capacity-button" onclick="ProductionPlanningV2.showCapacitySettings()">
                        [Settings] Capacity Settings
                    </button>
                    <button onclick="ProductionPlanningV2.optimizePlan()" style="padding: 10px 20px; background: #9c27b0; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        [Target] Optimize Plan
                    </button>
                    <button onclick="ProductionPlanningV2.resetData()" style="padding: 10px 20px; background: var(--ch-error); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        [Refresh] Reset
                    </button>
                    <span class="unsaved-indicator" id="unsaved-indicator">
                        Unsaved changes
                    </span>
                </div>
                
                <div class="production-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: var(--ch-gray-200); border-radius: 8px;">
                    <h4>[Chart] Production Planning Features:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>[Calendar] <strong>Expandable Hierarchy:</strong> Click months to see weeks, click weeks to see days</li>
                        <li>✏️ <strong>Inline Editing:</strong> Click any blue/purple cell to edit future production</li>
                        <li>[Factory] <strong>Capacity Planning:</strong> Track production capacity and efficiency per line</li>
                        <li>👷 <strong>Shift Management:</strong> Plan production across multiple shifts</li>
                        <li>[Up] <strong>Efficiency Tracking:</strong> Monitor OEE and production efficiency</li>
                        <li>[Target] <strong>Optimization:</strong> Auto-optimize based on capacity and demand</li>
                        <li>[Save] <strong>Data Persistence:</strong> All changes are saved locally</li>
                        <li>🔗 <strong>BOM Integration:</strong> Links to Bill of Materials for resource planning</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Set up event handlers after DOM is ready
        setTimeout(() => {
            this.setupEventHandlers();
            this.updateInfoBar();
        }, 100);
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
    
    // Render headers with expandable months/weeks
    renderHeaders() {
        let monthHeaders = '<tr><th class="product-header" rowspan="2">Product</th><th class="year-header" rowspan="2">Year</th>';
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
                        onclick="ProductionPlanningV2.toggleMonth('${monthKey}')">
                        <span class="expand-icon expanded">▶</span>
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
                                onclick="ProductionPlanningV2.toggleWeek('${weekKey}')">
                                <span class="expand-icon expanded">▶</span>KW${weekNum}
                            </th>
                        `;
                    } else {
                        subHeaders += `
                            <th class="week-header" 
                                onclick="ProductionPlanningV2.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▶</span>KW${weekNum}
                            </th>
                        `;
                    }
                });
            } else {
                monthHeaders += `
                    <th class="month-header" 
                        onclick="ProductionPlanningV2.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▶</span>
                        ${this.getMonthShort(month)}
                    </th>
                `;
                subHeaders += '<th>-</th>';
            }
        }
        
        monthHeaders += '<th rowspan="2">Total</th><th rowspan="2">Capacity</th><th rowspan="2">Eff%</th></tr>';
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
                                const dayName = this.getDayShort(new Date(this.state.currentYear, month - 1, day).getDay());
                                dayHeaders += `<th class="day-header">${day}<br>${dayName}</th>`;
                            });
                        } else {
                            dayHeaders += '<th>-</th>';
                        }
                    });
                } else {
                    dayHeaders += '<th>-</th>';
                }
            }
            
            dayHeaders += '<th>-</th><th>-</th><th>-</th></tr>';
        }
        
        return '<thead>' + monthHeaders + subHeaders + dayHeaders + '</thead>';
    },
    
    // Render all product rows
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
    
    // Render rows for a single product (6 rows: N-2, N-1, N(Actual), N(Plan), N+1, N+2)
    renderProductRows(product) {
        let html = '';
        const currentYear = this.state.currentYear;
        let rowIndex = 0;
        
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (yearOffset === 0) {
                // Current year: two rows
                const actualData = this.state.data[product.id][`${year}_actual`];
                const yearClass = 'year-n';
                html += this.renderSingleRow(product, actualData, year, yearClass, rowIndex === 0, rowIndex);
                rowIndex++;
                
                const planData = this.state.data[product.id][`${year}_plan`];
                html += this.renderSingleRow(product, planData, year, 'year-n-plan', false, rowIndex);
                rowIndex++;
            } else {
                const yearData = this.state.data[product.id][year];
                const yearClass = yearOffset === -2 ? 'year-n-2' : 
                                 yearOffset === -1 ? 'year-n-1' :
                                 yearOffset === 1 ? 'year-n1' : 'year-n2';
                html += this.renderSingleRow(product, yearData, year, yearClass, rowIndex === 0, rowIndex);
                rowIndex++;
            }
        }
        
        return html;
    },
    
    // Render a single row
    renderSingleRow(product, yearData, year, yearClass, isFirstRow, rowIndex) {
        let html = `<tr class="${yearClass}">`;
        
        // Product cell (only for first year row)
        if (isFirstRow) {
            html += `
                <td class="product-cell" rowspan="6">
                    <strong>${product.code}</strong><br>
                    ${product.name}<br>
                    <small>${product.nameEn}</small><br>
                    <em>${product.unit}</em><br>
                    <small style="color: #666;">Line: ${product.productionLine.toUpperCase()}</small>
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
        
        // Data cells based on expansion state
        const dataKey = yearData.isPlanOnly ? `${year}_plan` : 
                       (year === this.state.currentYear && !yearData.isPlanOnly) ? `${year}_actual` : 
                       year.toString();
        html += this.renderDataCells(product.id, dataKey);
        
        // Total, Capacity, and Efficiency cells
        html += `
            <td class="cell-total">
                ${this.formatNumber(yearData.total)}
            </td>
            <td class="cell-total" style="background: #e8f5e9;">
                ${this.formatNumber(yearData.capacity)}
            </td>
            <td class="cell-total ${this.getEfficiencyClass(yearData.efficiency)}">
                ${(yearData.efficiency * 100).toFixed(1)}%
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
                            const cellClass = `cell-${dayData.type}`;
                            const cellId = `cell-${productId}-${year}-${month}-${day}`;
                            const isEdited = this.state.editedCells.has(cellId);
                            const editedClass = isEdited ? 'edited-cell' : '';
                            const editableClass = dayData.editable ? 'editable-cell' : '';
                            
                            if (dayData.editable) {
                                html += `
                                    <td class="${cellClass} ${editableClass} ${editedClass}"
                                        data-cell-id="${cellId}"
                                        data-product="${productId}"
                                        data-year="${year}"
                                        data-month="${month}"
                                        data-day="${day}"
                                        data-editable="true"
                                        onclick="ProductionPlanningV2.startEditing(this)">
                                        ${dayData.value}
                                        <span class="efficiency-indicator ${this.getEfficiencyClass(dayData.efficiency)}">
                                            ${(dayData.efficiency * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                `;
                            } else {
                                html += `
                                    <td class="${cellClass}">
                                        ${dayData.value}
                                        <span class="efficiency-indicator">
                                            ${(dayData.efficiency * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                `;
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
                const cellId = `cell-${productId}-${year}-${month}`;
                const isEdited = this.state.editedCells.has(cellId);
                const editedClass = isEdited ? 'edited-cell' : '';
                const editableClass = monthData.editable ? 'editable-cell' : '';
                
                if (monthData.editable) {
                    html += `
                        <td class="${cellClass} ${editableClass} ${editedClass}"
                            data-cell-id="${cellId}"
                            data-product="${productId}"
                            data-year="${year}"
                            data-month="${month}"
                            data-editable="true"
                            onclick="ProductionPlanningV2.startEditingMonth(this)">
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
    
    // Get efficiency class for styling
    getEfficiencyClass(efficiency) {
        if (efficiency >= 0.85) return 'efficiency-good';
        if (efficiency >= 0.70) return 'efficiency-warning';
        return 'efficiency-bad';
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
        this.renderProductionGrid();
    },
    
    // Toggle week expansion
    toggleWeek(weekKey) {
        if (this.state.expanded.weeks.has(weekKey)) {
            this.state.expanded.weeks.delete(weekKey);
        } else {
            this.state.expanded.weeks.add(weekKey);
        }
        this.renderProductionGrid();
    },
    
    // Start editing a cell
    startEditing(cell) {
        if (cell.classList.contains('editing')) return;
        
        const currentValue = parseInt(cell.textContent) || 0;
        
        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" class="cell-input" value="${currentValue}" min="0" step="1">`;
        
        const input = cell.querySelector('.cell-input');
        input.focus();
        input.select();
        
        // Handle save on Enter or blur
        const saveEdit = () => {
            const newValue = parseInt(input.value) || 0;
            this.saveEdit(cell, newValue);
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });
    },
    
    // Start editing a month cell (distributes value across days)
    startEditingMonth(cell) {
        if (cell.classList.contains('editing')) return;
        
        const currentValue = parseInt(cell.textContent.replace(/,/g, '')) || 0;
        
        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" class="cell-input" value="${currentValue}" min="0" step="1">`;
        
        const input = cell.querySelector('.cell-input');
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newValue = parseInt(input.value) || 0;
            this.saveMonthEdit(cell, newValue);
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });
    },
    
    // Save an edit for a day
    saveEdit(cell, newValue) {
        const cellId = cell.dataset.cellId;
        const productId = cell.dataset.product;
        const year = cell.dataset.year;
        const month = parseInt(cell.dataset.month);
        const day = parseInt(cell.dataset.day);
        
        // Update the data
        const yearKey = year.includes('_') ? year : 
                       (parseInt(year) === this.state.currentYear ? `${year}_actual` : year);
        
        if (this.state.data[productId] && this.state.data[productId][yearKey]) {
            // Find the correct week for this day
            const monthData = this.state.data[productId][yearKey].months[month];
            Object.keys(monthData.weeks).forEach(weekNum => {
                if (monthData.weeks[weekNum].days[day]) {
                    const oldValue = monthData.weeks[weekNum].days[day].value;
                    monthData.weeks[weekNum].days[day].value = newValue;
                    
                    // Recalculate week total
                    monthData.weeks[weekNum].total = Object.values(monthData.weeks[weekNum].days)
                        .reduce((sum, d) => sum + d.value, 0);
                }
            });
            
            // Recalculate month and year totals
            this.recalculateTotals(productId, yearKey);
            
            // Mark as edited
            this.state.editedCells.add(cellId);
            this.state.unsavedChanges = true;
            this.updateSaveButton();
        }
        
        // Re-render the grid
        this.renderProductionGrid();
    },
    
    // Save a month edit (distributes across days)
    saveMonthEdit(cell, newValue) {
        const productId = cell.dataset.product;
        const year = cell.dataset.year;
        const month = parseInt(cell.dataset.month);
        
        const yearKey = year.includes('_') ? year : 
                       (parseInt(year) === this.state.currentYear ? `${year}_actual` : year);
        
        if (this.state.data[productId] && this.state.data[productId][yearKey]) {
            const monthData = this.state.data[productId][yearKey].months[month];
            
            // Count total working days in the month
            let totalDays = 0;
            Object.values(monthData.weeks).forEach(week => {
                totalDays += Object.keys(week.days).length;
            });
            
            // Distribute value proportionally across days
            const baseValuePerDay = Math.floor(newValue / totalDays);
            let remainder = newValue - (baseValuePerDay * totalDays);
            
            Object.values(monthData.weeks).forEach(week => {
                Object.keys(week.days).forEach(day => {
                    let dayValue = baseValuePerDay;
                    if (remainder > 0) {
                        dayValue++;
                        remainder--;
                    }
                    week.days[day].value = dayValue;
                });
                
                // Recalculate week total
                week.total = Object.values(week.days).reduce((sum, d) => sum + d.value, 0);
            });
            
            // Recalculate totals
            this.recalculateTotals(productId, yearKey);
            
            // Mark as edited
            this.state.editedCells.add(`cell-${productId}-${year}-${month}`);
            this.state.unsavedChanges = true;
            this.updateSaveButton();
        }
        
        // Re-render the grid
        this.renderProductionGrid();
    },
    
    // Recalculate totals
    recalculateTotals(productId, yearKey) {
        const yearData = this.state.data[productId][yearKey];
        
        yearData.total = 0;
        yearData.capacity = 0;
        
        Object.values(yearData.months).forEach(month => {
            month.total = 0;
            month.capacity = 0;
            
            Object.values(month.weeks).forEach(week => {
                month.total += week.total;
                month.capacity += week.capacity;
            });
            
            yearData.total += month.total;
            yearData.capacity += month.capacity;
        });
        
        // Recalculate efficiency
        yearData.efficiency = yearData.capacity > 0 ? yearData.total / yearData.capacity : 0;
        
        Object.values(yearData.months).forEach(month => {
            month.efficiency = month.capacity > 0 ? month.total / month.capacity : 0;
        });
    },
    
    // Update save button state
    updateSaveButton() {
        const saveBtn = document.getElementById('save-btn');
        const indicator = document.getElementById('unsaved-indicator');
        
        if (saveBtn) {
            saveBtn.disabled = !this.state.unsavedChanges;
        }
        
        if (indicator) {
            if (this.state.unsavedChanges) {
                indicator.classList.add('show');
            } else {
                indicator.classList.remove('show');
            }
        }
    },
    
    // Update info bar
    updateInfoBar() {
        // Calculate totals across all products for current year
        let totalCapacity = 0;
        let totalProduction = 0;
        
        this.state.products.forEach(product => {
            const yearData = this.state.data[product.id][`${this.state.currentYear}_plan`];
            if (yearData) {
                totalCapacity += yearData.capacity;
                totalProduction += yearData.total;
            }
        });
        
        const avgEfficiency = totalCapacity > 0 ? totalProduction / totalCapacity : 0;
        
        // Update display
        const capacityEl = document.getElementById('total-capacity');
        if (capacityEl) capacityEl.textContent = `${this.formatNumber(totalCapacity)} kg`;
        
        const efficiencyEl = document.getElementById('avg-efficiency');
        if (efficiencyEl) efficiencyEl.textContent = `${(avgEfficiency * 100).toFixed(1)}%`;
    },
    
    // Save data
    saveData() {
        localStorage.setItem('productionPlanningData', JSON.stringify(this.state.data));
        localStorage.setItem('productionEditedCells', JSON.stringify([...this.state.editedCells]));
        
        this.state.unsavedChanges = false;
        this.updateSaveButton();
        
        alert('[OK] Production planning data saved successfully!');
    },
    
    // Export data
    exportData() {
        const exportData = {
            version: this.VERSION,
            exportDate: new Date().toISOString(),
            products: this.state.products,
            productionData: this.state.data,
            settings: this.state.productionSettings
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `production-planning-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Show capacity settings dialog
    showCapacitySettings() {
        alert('[Settings] Capacity Settings\n\nProduction Lines:\n' +
              this.state.productionSettings.productionLines.map(line => 
                  `${line.name}: ${line.capacity} ${line.unit}`
              ).join('\n') +
              '\n\nShift Configuration:\n' +
              Object.entries(this.state.productionSettings.shifts).map(([key, shift]) => 
                  `${key}: ${shift.start}-${shift.end} (Efficiency: ${shift.efficiency * 100}%)`
              ).join('\n'));
    },
    
    // Optimize production plan
    optimizePlan() {
        // Simple optimization: level production across days to meet monthly targets
        this.state.products.forEach(product => {
            const yearKey = `${this.state.currentYear}_plan`;
            const yearData = this.state.data[product.id][yearKey];
            
            if (yearData) {
                Object.values(yearData.months).forEach(month => {
                    const monthTotal = month.total;
                    let workingDays = 0;
                    
                    // Count working days
                    Object.values(month.weeks).forEach(week => {
                        Object.values(week.days).forEach(day => {
                            if (!day.isWeekend) workingDays++;
                        });
                    });
                    
                    // Level production
                    const dailyTarget = Math.round(monthTotal / workingDays);
                    
                    Object.values(month.weeks).forEach(week => {
                        Object.values(week.days).forEach(day => {
                            if (!day.isWeekend) {
                                day.value = dailyTarget;
                            } else {
                                day.value = Math.round(dailyTarget * 0.3); // 30% on weekends
                            }
                        });
                        
                        // Recalculate week total
                        week.total = Object.values(week.days).reduce((sum, d) => sum + d.value, 0);
                    });
                });
                
                this.recalculateTotals(product.id, yearKey);
            }
        });
        
        this.state.unsavedChanges = true;
        this.updateSaveButton();
        this.renderProductionGrid();
        
        alert('[Target] Production plan optimized!\n\nProduction has been leveled across working days to improve efficiency.');
    },
    
    // Reset data
    resetData() {
        if (confirm('Are you sure you want to reset all production planning data? This will lose all your edits.')) {
            this.state.editedCells.clear();
            this.state.unsavedChanges = false;
            localStorage.removeItem('productionPlanningData');
            localStorage.removeItem('productionEditedCells');
            
            // Regenerate default data
            this.state.products.forEach(product => {
                this.state.data[product.id] = this.generateProductData(product.id, this.state.currentYear);
            });
            
            this.renderProductionGrid();
        }
    },
    
    // Setup event handlers
    setupEventHandlers() {
        // Auto-save reminder
        window.addEventListener('beforeunload', (e) => {
            if (this.state.unsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
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
            // Year boundary case
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
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionPlanningV2;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.ProductionPlanningV2 = ProductionPlanningV2;
}
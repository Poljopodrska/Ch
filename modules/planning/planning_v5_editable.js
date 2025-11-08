// Ch Planning Module V5 - Fully Editable Sales Planning
// Enhanced with inline editing capabilities for all planning data
// Users can click and edit any future planning values

const PlanningV5Editable = {
    VERSION: '5.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentDay: new Date().getDate(),
        today: new Date(),
        expanded: {
            months: new Set(),
            weeks: new Set()
        },
        data: {},
        products: [],
        editedCells: new Set(), // Track which cells have been edited
        unsavedChanges: false
    },
    
    // Initialize the planning module
    init() {
        console.log(`Planning Module V${this.VERSION} - Editable Sales Planning initializing...`);
        
        // Reset state for re-initialization
        if (this.initialized) {
            console.log('Planning V5 re-initializing, resetting state...');
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
                console.error('ERROR: Could not find main-content element!');
                return;
            }
        }
        
        // Clear any existing content
        const gridContainer = document.getElementById('planning-grid');
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        
        this.loadExampleData();
        this.renderGrid();
        
        this.initialized = true;
        console.log('Planning V5 Editable initialized');
    },
    
    initialized: false,
    
    // Load example data with editable structure
    loadExampleData() {
        const currentYear = this.state.currentYear;
        
        // Example products
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
            }
        ];
        
        // Generate planning data for each product
        this.state.products.forEach(product => {
            this.state.data[product.id] = this.generateProductData(product.id, currentYear);
        });
    },
    
    // Generate planning data for a product
    generateProductData(productId, currentYear) {
        const data = {};
        
        // Generate for years N-2 to N+2 (5 years)
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (yearOffset === 0) {
                // Current year: two rows - actual+plan and plan only
                data[`${year}_actual`] = this.generateYearData(productId, year, yearOffset, false);
                data[`${year}_plan`] = this.generateYearData(productId, year, yearOffset, true);
            } else {
                data[year] = this.generateYearData(productId, year, yearOffset, false);
            }
        }
        
        return data;
    },
    
    // Generate data for a single year
    generateYearData(productId, year, yearOffset, planOnlyMode = false) {
        const yearData = {
            label: `${year}`,
            shortLabel: yearOffset === -2 ? 'N-2' : 
                       yearOffset === -1 ? 'N-1' : 
                       yearOffset === 0 ? (planOnlyMode ? 'N (Plan)' : 'N (A+P)') :
                       yearOffset === 1 ? 'N+1' : 'N+2',
            total: 0,
            type: yearOffset < 0 ? 'historical' : yearOffset > 0 ? 'future' : 'current',
            isPlanOnly: planOnlyMode,
            editable: yearOffset >= 0, // Current and future years are editable
            months: {}
        };
        
        // Generate monthly data
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                label: this.getMonthName(month),
                shortLabel: this.getMonthShort(month),
                total: 0,
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
                    editable: this.isEditable(yearOffset, month, 15, planOnlyMode),
                    days: {}
                };
                
                // Generate daily data
                const daysInWeek = this.getDaysOfWeekInMonth(year, month, weekNum);
                daysInWeek.forEach(day => {
                    const dataType = this.getDataType(yearOffset, month, day, planOnlyMode);
                    const editable = this.isEditable(yearOffset, month, day, planOnlyMode);
                    const value = this.generateDailyValue(productId, year, month, day, yearOffset, dataType);
                    
                    weekData.days[day] = {
                        label: day.toString(),
                        dayName: this.getDayShort(new Date(year, month - 1, day).getDay()),
                        value: value,
                        type: dataType,
                        editable: editable,
                        originalValue: value
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
    
    // Check if a data point is editable
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
    
    // Generate sales values with some base logic
    generateDailyValue(productId, year, month, day, yearOffset, dataType) {
        const bases = {
            'p001': 40,  // Pork shoulder base
            'p002': 25,  // Beef tenderloin base
            'p003': 50   // Chicken breast base
        };
        
        const base = bases[productId] || 30;
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        
        // Weekend factor
        let dayFactor = 1;
        if (dayOfWeek === 0) dayFactor = 0.3;  // Sunday
        if (dayOfWeek === 6) dayFactor = 0.7;  // Saturday
        
        // Seasonal factor
        const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6);
        
        // Growth factor for future years
        const yearGrowth = Math.pow(1.05, yearOffset);
        
        // Random variation
        const randomFactor = dataType === 'actual' ? 
            (0.8 + Math.random() * 0.4) : (0.9 + Math.random() * 0.2);
        
        return Math.round(base * dayFactor * seasonalFactor * randomFactor * yearGrowth);
    },
    
    // Get data type based on today's date
    getDataType(yearOffset, month, day, planOnlyMode = false) {
        if (planOnlyMode) return 'plan';
        
        const today = this.state.today;
        const currentYear = today.getFullYear();
        const year = currentYear + yearOffset;
        
        if (yearOffset < 0) return 'historical';
        if (yearOffset > 0) return 'future';
        
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
    
    // Render the planning grid
    renderGrid() {
        const container = document.getElementById('planning-grid');
        if (!container) return;
        
        let html = `
            <style>
                .planning-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .planning-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .planning-controls {
                    margin: 20px 0;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .save-button {
                    padding: 10px 20px;
                    background: #4CAF50;
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
                
                .unsaved-indicator {
                    padding: 5px 10px;
                    background: #ff9800;
                    color: white;
                    border-radius: 3px;
                    font-size: 12px;
                    display: none;
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
                    background: #1565c0;
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
                
                .planning-table td {
                    padding: 4px 2px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 60px;
                    font-size: 11px;
                    position: relative;
                }
                
                .product-cell {
                    text-align: left !important;
                    font-weight: 600;
                    background: #f8f9fa;
                    position: sticky;
                    left: 0;
                    z-index: 5;
                    padding: 8px !important;
                    min-width: 180px;
                }
                
                .year-cell {
                    background: #f0f0f0;
                    font-weight: 500;
                    font-size: 10px;
                }
                
                /* Editable cells */
                .editable-cell {
                    cursor: pointer;
                    position: relative;
                }
                
                .editable-cell:hover {
                    background: #e3f2fd !important;
                    box-shadow: inset 0 0 0 2px #2196f3;
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
                    padding: 4px 2px;
                    box-shadow: inset 0 0 0 2px #4CAF50;
                }
                
                .cell-input:focus {
                    outline: none;
                }
                
                .edited-cell {
                    background: #e8f5e9 !important;
                    font-weight: bold;
                }
                
                .edited-cell::after {
                    content: '*';
                    color: #4CAF50;
                    font-weight: bold;
                    position: absolute;
                    top: 1px;
                    right: 2px;
                    font-size: 10px;
                }
                
                /* Cell type styling */
                .cell-historical { background: #fafafa; color: #7f8c8d; }
                .cell-actual { background: #e8f5e9; color: #2e7d32; font-weight: 600; }
                .cell-current { background: #fff3e0; color: #e65100; font-weight: bold; }
                .cell-plan { background: #e3f2fd; color: #1565c0; }
                .cell-future { background: #f3e5f5; color: #6a1b9a; }
                
                .total-cell {
                    background: #fff8e1 !important;
                    font-weight: bold;
                    font-size: 12px;
                }
            </style>
            
            <div class="planning-container">
                <div class="planning-header">
                    <h2>[Up] Načrtovanje prodaje / Sales Planning</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        V5.0.0 - Fully Editable Sales Planning Module
                        <br>Click any future planning cell to edit values
                    </div>
                </div>
                
                <div class="planning-controls">
                    <button class="save-button" onclick="PlanningV5Editable.saveData()" id="save-btn" disabled>
                        [Save] Save Changes
                    </button>
                    <button onclick="PlanningV5Editable.exportData()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        [Folder] Export Data
                    </button>
                    <button onclick="PlanningV5Editable.resetData()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        [Refresh] Reset to Default
                    </button>
                    <span class="unsaved-indicator" id="unsaved-indicator">
                        Unsaved changes
                    </span>
                </div>
                
                <div class="planning-table-wrapper">
                    ${this.renderTable()}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                    <h4>📝 Editing Instructions:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li>[OK] <strong>Click any blue or purple cell</strong> to edit future planning values</li>
                        <li>[Calendar] <strong>Historical data</strong> (gray/green) is read-only</li>
                        <li>⭐ <strong>Edited cells</strong> show with green background and * marker</li>
                        <li>[Save] <strong>Save button</strong> becomes active when you make changes</li>
                        <li>🔢 <strong>Enter numbers only</strong> - values are automatically formatted</li>
                        <li>⌨️ <strong>Press Enter or click outside</strong> to confirm edit</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Set up edit handlers after DOM is ready
        setTimeout(() => {
            this.setupEditHandlers();
        }, 100);
    },
    
    // Render the table
    renderTable() {
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
        let monthHeaders = '<tr><th rowspan="2">Izdelek</th><th rowspan="2">Leto</th>';
        
        for (let month = 1; month <= 12; month++) {
            monthHeaders += `<th>${this.getMonthShort(month)}</th>`;
        }
        
        monthHeaders += '<th rowspan="2">Skupaj</th></tr>';
        monthHeaders += '<tr>';
        
        for (let month = 1; month <= 12; month++) {
            monthHeaders += '<th>-</th>';
        }
        
        monthHeaders += '</tr>';
        
        return '<thead>' + monthHeaders + '</thead>';
    },
    
    // Render all product rows
    renderAllProductRows() {
        let html = '';
        
        this.state.products.forEach((product, index) => {
            html += this.renderProductRows(product);
            
            if (index < this.state.products.length - 1) {
                html += '<tr style="height: 3px; background: #1565c0;"><td colspan="100"></td></tr>';
            }
        });
        
        return html;
    },
    
    // Render rows for a single product
    renderProductRows(product) {
        let html = '';
        const currentYear = this.state.currentYear;
        let rowIndex = 0;
        
        // Render 6 rows: N-2, N-1, N (Actual+Plan), N (Plan), N+1, N+2
        for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
            const year = currentYear + yearOffset;
            
            if (yearOffset === 0) {
                // Current year: two rows
                const actualData = this.state.data[product.id][`${year}_actual`];
                html += this.renderSingleRow(product, actualData, year, rowIndex === 0);
                rowIndex++;
                
                const planData = this.state.data[product.id][`${year}_plan`];
                html += this.renderSingleRow(product, planData, year, false);
                rowIndex++;
            } else {
                const yearData = this.state.data[product.id][year];
                html += this.renderSingleRow(product, yearData, year, rowIndex === 0);
                rowIndex++;
            }
        }
        
        return html;
    },
    
    // Render a single row
    renderSingleRow(product, yearData, year, isFirstRow) {
        let html = '<tr>';
        
        // Product cell (only for first row)
        if (isFirstRow) {
            html += `
                <td class="product-cell" rowspan="6">
                    <strong>${product.code}</strong><br>
                    ${product.name}<br>
                    <small>${product.nameEn}</small>
                </td>
            `;
        }
        
        // Year cell
        html += `<td class="year-cell">
            ${year}<br><small>${yearData.shortLabel}</small>
        </td>`;
        
        // Month cells
        for (let month = 1; month <= 12; month++) {
            const monthData = yearData.months[month];
            const cellClass = `cell-${monthData.type}`;
            const editableClass = monthData.editable ? 'editable-cell' : '';
            const cellId = `cell-${product.id}-${year}-${month}`;
            const isEdited = this.state.editedCells.has(cellId);
            const editedClass = isEdited ? 'edited-cell' : '';
            
            html += `<td class="${cellClass} ${editableClass} ${editedClass}" 
                         data-cell-id="${cellId}"
                         data-product="${product.id}"
                         data-year="${year}"
                         data-month="${month}"
                         data-editable="${monthData.editable}">
                         ${this.formatNumber(monthData.total)}
                     </td>`;
        }
        
        // Total cell
        html += `<td class="total-cell">
            ${this.formatNumber(yearData.total)}
        </td>`;
        
        html += '</tr>';
        return html;
    },
    
    // Set up edit handlers for editable cells
    setupEditHandlers() {
        const editableCells = document.querySelectorAll('.editable-cell');
        
        editableCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                if (cell.dataset.editable === 'true') {
                    this.startEditing(cell);
                }
            });
        });
    },
    
    // Start editing a cell
    startEditing(cell) {
        if (cell.classList.contains('editing')) return;
        
        const currentValue = cell.textContent.trim().replace(/,/g, '');
        
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
                saveEdit();
            }
        });
    },
    
    // Save an edit
    saveEdit(cell, newValue) {
        const cellId = cell.dataset.cellId;
        const productId = cell.dataset.product;
        const year = parseInt(cell.dataset.year);
        const month = parseInt(cell.dataset.month);
        
        // Update the data
        const yearKey = year === this.state.currentYear && cell.textContent.includes('Plan') ? 
                       `${year}_plan` : year;
        
        if (this.state.data[productId] && this.state.data[productId][yearKey]) {
            const oldValue = this.state.data[productId][yearKey].months[month].total;
            this.state.data[productId][yearKey].months[month].total = newValue;
            
            // Recalculate year total
            this.recalculateYearTotal(productId, yearKey);
            
            // Mark as edited
            this.state.editedCells.add(cellId);
            
            // Mark as unsaved changes
            this.state.unsavedChanges = true;
            this.updateSaveButton();
        }
        
        // Update cell display
        cell.classList.remove('editing');
        cell.classList.add('edited-cell');
        cell.innerHTML = this.formatNumber(newValue);
        
        // Re-attach event handler
        cell.addEventListener('click', () => {
            if (cell.dataset.editable === 'true') {
                this.startEditing(cell);
            }
        });
        
        // Update total column
        this.updateTotalCell(cell.closest('tr'));
    },
    
    // Recalculate year total
    recalculateYearTotal(productId, yearKey) {
        if (!this.state.data[productId] || !this.state.data[productId][yearKey]) return;
        
        let total = 0;
        for (let month = 1; month <= 12; month++) {
            total += this.state.data[productId][yearKey].months[month].total;
        }
        this.state.data[productId][yearKey].total = total;
    },
    
    // Update total cell in a row
    updateTotalCell(row) {
        const totalCell = row.querySelector('.total-cell');
        if (totalCell) {
            const cells = row.querySelectorAll('td[data-month]');
            let total = 0;
            cells.forEach(cell => {
                const value = parseInt(cell.textContent.replace(/,/g, '')) || 0;
                total += value;
            });
            totalCell.innerHTML = this.formatNumber(total);
        }
    },
    
    // Update save button state
    updateSaveButton() {
        const saveBtn = document.getElementById('save-btn');
        const indicator = document.getElementById('unsaved-indicator');
        
        if (saveBtn) {
            saveBtn.disabled = !this.state.unsavedChanges;
        }
        
        if (indicator) {
            indicator.style.display = this.state.unsavedChanges ? 'inline-block' : 'none';
        }
    },
    
    // Save data
    saveData() {
        console.log('Saving planning data...', this.state.data);
        
        // Here you would normally send to an API
        // For now, we'll save to localStorage
        localStorage.setItem('planningData', JSON.stringify(this.state.data));
        localStorage.setItem('planningEditedCells', JSON.stringify([...this.state.editedCells]));
        
        this.state.unsavedChanges = false;
        this.updateSaveButton();
        
        // Show confirmation
        alert('[OK] Planning data saved successfully!');
    },
    
    // Export data
    exportData() {
        const dataStr = JSON.stringify(this.state.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-planning-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Reset data
    resetData() {
        if (confirm('Are you sure you want to reset all data to default values? This will lose all your edits.')) {
            this.state.editedCells.clear();
            this.state.unsavedChanges = false;
            localStorage.removeItem('planningData');
            localStorage.removeItem('planningEditedCells');
            
            this.loadExampleData();
            this.renderGrid();
        }
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
    module.exports = PlanningV5Editable;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.PlanningV5Editable = PlanningV5Editable;
}
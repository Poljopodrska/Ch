// Ch Cash Flow Module - Razširljivo časovno načrtovanje denarnega toka
// Uporablja enako razširljivo hierarhijo kot proizvodno načrtovanje: meseci → tedni → dnevi

const CashFlow = {
    VERSION: '1.1.0',

    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
        currentDay: new Date().getDate(),
        today: new Date(),

        // Expansion state for drill-down
        expanded: {
            months: new Set(),  // Which months are expanded to show weeks
            weeks: new Set(),   // Which weeks are expanded to show days
            rows: new Set()     // Which rows are expanded (e.g., 'disbursements')
        },

        // Data structure
        data: {},
        editedCells: new Set(),
        unsavedChanges: false
    },

    // Initialize the module
    init() {
        console.log(`Cash Flow Module V${this.VERSION} initializing...`);

        // Reset state for re-initialization
        if (this.initialized) {
            console.log('Cash Flow re-initializing, resetting state...');
            this.initialized = false;
            this.state.expanded.months.clear();
            this.state.expanded.weeks.clear();
            this.state.editedCells.clear();
        }

        const container = document.getElementById('cashflow-container');
        if (!container) {
            console.error('ERROR: cashflow-container not found!');
            return;
        }

        // Clear any existing content
        container.innerHTML = '';

        // Load data
        this.loadCashFlowData();

        // Calculate all formulas
        this.recalculateFormulas();

        this.renderCashFlowGrid();

        this.initialized = true;
        console.log('Cash Flow Module initialized');
    },

    initialized: false,

    // Load cash flow data
    loadCashFlowData() {
        // Load saved data from localStorage if available
        const savedData = localStorage.getItem('cashFlowData');
        const savedEditedCells = localStorage.getItem('cashFlowEditedCells');

        if (savedData) {
            this.state.data = JSON.parse(savedData);
            if (savedEditedCells) {
                this.state.editedCells = new Set(JSON.parse(savedEditedCells));
            }
        } else {
            // Generate default data
            this.state.data = this.generateCashFlowData();
        }
    },

    // Generate cash flow data
    generateCashFlowData() {
        const year = this.state.currentYear;

        return {
            cashBeginning: this.generateRowData('cashBeginning', year),
            receipts: this.generateRowData('receipts', year),
            disbursements: this.generateRowData('disbursements', year),
            disbursementsNujni: this.generateRowData('disbursementsNujni', year),
            disbursementsPogojnoNujni: this.generateRowData('disbursementsPogojnoNujni', year),
            disbursementsNenujni: this.generateRowData('disbursementsNenujni', year),
            netCashFlow: this.generateRowData('netCashFlow', year),
            cashEnding: this.generateRowData('cashEnding', year)
        };
    },

    // Generate data for a single row
    generateRowData(rowType, year) {
        const rowData = {
            label: this.getRowLabel(rowType),
            type: rowType,
            total: 0,
            editable: this.isRowEditable(rowType),
            months: {}
        };

        // Generate monthly data
        for (let month = 1; month <= 12; month++) {
            const monthData = {
                label: this.getMonthName(month),
                shortLabel: this.getMonthShort(month),
                total: 0,
                editable: this.isMonthEditable(rowType, month),
                weeks: {}
            };

            // Generate weekly data
            const weeksInMonth = this.getCalendarWeeksInMonth(year, month);
            weeksInMonth.forEach(weekNum => {
                const weekData = {
                    label: `KW${weekNum}`,
                    total: 0,
                    editable: this.isMonthEditable(rowType, month),
                    days: {}
                };

                // Generate daily data
                const daysInWeek = this.getDaysOfWeekInMonth(year, month, weekNum);
                daysInWeek.forEach(day => {
                    const value = this.generateDailyValue(rowType, year, month, day);
                    const editable = this.isDayEditable(rowType, month, day);

                    weekData.days[day] = {
                        label: day.toString(),
                        dayName: this.getDayShort(new Date(year, month - 1, day).getDay()),
                        value: value,
                        editable: editable,
                        originalValue: value
                    };

                    weekData.total += value;
                });

                monthData.weeks[weekNum] = weekData;
                monthData.total += weekData.total;
            });

            rowData.months[month] = monthData;
            rowData.total += monthData.total;
        }

        return rowData;
    },

    // Generate daily values based on row type
    generateDailyValue(rowType, year, month, day) {
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isPast = new Date(year, month - 1, day) < new Date(this.state.today.getFullYear(), this.state.today.getMonth(), this.state.today.getDate());

        // NO MOCK DATA - Start with zeros
        // Users should load actual data via "Load Bank Forecast" button

        switch(rowType) {
            case 'cashBeginning':
                // Beginning cash - calculated from previous period
                if (month === 1 && day === 1) {
                    // Starting balance - set to 0, will be calculated from actual data
                    return 0;
                }
                return 0; // Will be calculated

            case 'receipts':
                // Start empty - load via Bank Forecast
                return 0;

            case 'disbursements':
                // Parent disbursements - sum of all categories (will be calculated)
                return 0;

            case 'disbursementsNujni':
                // Start empty - load via Bank Forecast
                return 0;

            case 'disbursementsPogojnoNujni':
                // Start empty - load via Bank Forecast
                return 0;

            case 'disbursementsNenujni':
                // Start empty - load via Bank Forecast
                return 0;

            case 'netCashFlow':
                // Calculated: receipts - all disbursements
                return 0; // Will be calculated

            case 'cashEnding':
                // Calculated: beginning + net cash flow
                return 0; // Will be calculated

            default:
                return 0;
        }
    },

    // Get row label
    getRowLabel(rowType) {
        const labels = {
            'cashBeginning': 'Začetno stanje',
            'receipts': 'Prejemki',
            'disbursements': 'Izplačila',
            'disbursementsNujni': 'Izplačila - Nujni',
            'disbursementsPogojnoNujni': 'Izplačila - Pogojno nujni',
            'disbursementsNenujni': 'Izplačila - Nenujni',
            'netCashFlow': 'Neto denarni tok',
            'cashEnding': 'Končno stanje'
        };
        return labels[rowType] || rowType;
    },

    // Check if row is editable
    isRowEditable(rowType) {
        // Receipts and all disbursement sub-categories are directly editable
        // Parent disbursements and others are calculated
        return rowType === 'receipts' ||
               rowType === 'disbursementsNujni' ||
               rowType === 'disbursementsPogojnoNujni' ||
               rowType === 'disbursementsNenujni';
    },

    // Check if month is editable
    isMonthEditable(rowType, month) {
        if (!this.isRowEditable(rowType)) return false;

        // Can't edit past months
        const today = this.state.today;
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        if (this.state.currentYear === currentYear) {
            return month >= currentMonth;
        }
        return true;
    },

    // Check if day is editable
    isDayEditable(rowType, month, day) {
        if (!this.isRowEditable(rowType)) return false;

        // Can't edit past days
        const today = this.state.today;
        const dateToCheck = new Date(this.state.currentYear, month - 1, day);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return dateToCheck >= todayMidnight;
    },

    // Render the cash flow grid
    renderCashFlowGrid() {
        const container = document.getElementById('cashflow-container');
        if (!container) return;

        let html = `
            <style>
                .cashflow-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .cashflow-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: var(--ch-primary);
                    color: white;
                    border-radius: var(--radius-md);
                }

                .cashflow-controls {
                    margin: 20px 0;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
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
                    opacity: 0.9;
                }

                .save-button:disabled {
                    background: var(--ch-gray-400);
                    cursor: not-allowed;
                }

                .calculate-button {
                    padding: 10px 20px;
                    background: var(--ch-warning);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
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

                .cashflow-table-wrapper {
                    background: white;
                    border-radius: 8px;
                    overflow-x: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .cashflow-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1400px;
                }

                .cashflow-table th {
                    background: var(--ch-primary);
                    color: white;
                    padding: 8px 4px;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid var(--ch-primary-dark);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    font-size: 12px;
                }

                .cashflow-table th.row-type-header {
                    text-align: left;
                    min-width: 200px;
                    background: var(--ch-primary-dark);
                    padding: 8px;
                }

                /* Month headers with expand/collapse */
                .month-header {
                    background: var(--ch-primary) !important;
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
                    background: var(--ch-primary) !important;
                }

                .day-header {
                    background: var(--ch-primary-pale) !important;
                    font-size: 10px;
                    color: var(--ch-text-primary);
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

                .cashflow-table td {
                    padding: 6px 4px;
                    border: 1px solid var(--ch-border-light);
                    text-align: center;
                    min-width: 50px;
                    font-size: 12px;
                    position: relative;
                }

                .row-type-cell {
                    text-align: left !important;
                    background: var(--ch-gray-200);
                    position: sticky;
                    left: 0;
                    z-index: 4;
                    padding: 6px !important;
                    min-width: 200px;
                    border-right: 2px solid var(--ch-gray-600);
                    font-size: 11px;
                    font-weight: 600;
                }

                /* Row type specific styling */
                .row-cashBeginning { background: var(--ch-primary-pale); }
                .row-receipts { background: var(--ch-success-pale); }
                .row-disbursements { background: var(--ch-error-pale); }
                .row-disbursementsNujni { background: #ffebee; }
                .row-disbursementsPogojnoNujni { background: var(--ch-warning-pale); }
                .row-disbursementsNenujni { background: #fce4ec; }
                .row-netCashFlow { background: var(--ch-gray-100); }
                .row-cashEnding { background: var(--ch-primary-pale); }

                /* Expandable row styling */
                .row-expandable {
                    cursor: pointer;
                    font-weight: 700;
                }

                .row-expandable:hover {
                    background: var(--ch-error-light) !important;
                    opacity: 0.8;
                }

                .row-child {
                    padding-left: 20px !important;
                }

                /* Cell styling based on data */
                .cell-past {
                    background: var(--ch-gray-100);
                    color: var(--ch-text-secondary);
                }

                .cell-current {
                    background: var(--ch-warning-pale);
                    color: var(--ch-warning-dark);
                    font-weight: bold;
                    border: 2px solid var(--ch-warning);
                }

                .cell-future {
                    background: var(--ch-primary-light);
                    color: var(--ch-primary-dark);
                }

                .cell-total {
                    background: var(--ch-warning-pale);
                    font-weight: bold;
                    border-left: 2px solid var(--ch-gray-600);
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
                    box-shadow: inset 0 0 0 2px var(--ch-success);
                }

                .cell-input:focus {
                    outline: none;
                }

                .edited-cell {
                    background: var(--ch-success-pale) !important;
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

                /* Positive/Negative values */
                .cell-positive {
                    color: var(--ch-success);
                }

                .cell-negative {
                    color: var(--ch-error);
                }

                .weekend-cell {
                    background: var(--ch-gray-100) !important;
                }
            </style>

            <div class="cashflow-container">
                <div class="cashflow-header">
                    <h2>Cash Flow Planning</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        V1.1.0 - Razširljiv časovno-osnovni denarni tok | Klikni mesece → tedne → dneve
                    </div>
                </div>

                <div class="cashflow-controls">
                    <button class="export-button" onclick="CashFlow.exportData()">
                        Export
                    </button>
                    <button onclick="CashFlow.loadBankForecast()" style="padding: 10px 20px; background: var(--ch-success); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: bold; box-shadow: var(--shadow-md);">
                        Load Bank Forecast
                    </button>
                    <button onclick="window.open('/ai-forecast.html', '_blank')" style="padding: 10px 20px; background: var(--ch-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: bold; box-shadow: var(--shadow-md);">
                        AI Forecast
                    </button>
                </div>

                <div class="cashflow-table-wrapper">
                    ${this.renderTable()}
                </div>

                <div style="margin-top: 20px; padding: 15px; background: var(--ch-gray-200); border-radius: 8px;">
                    <h4>Cash Flow Planning:</h4>
                    <ul style="margin: 10px 0; line-height: 1.6;">
                        <li><strong>Začetno stanje:</strong> Začetna gotovina za obdobje (samodejno izračunano)</li>
                        <li><strong>Prejemki:</strong> Prilivi gotovine iz prodaje in drugih virov (urejanje)</li>
                        <li><strong>Izplačila:</strong> Skupna izplačila (klikni za razširitev na kategorije)</li>
                        <li style="margin-left: 20px;"><strong>Nujni:</strong> Nujni stroški in obveznosti (urejanje)</li>
                        <li style="margin-left: 20px;"><strong>Pogojno nujni:</strong> Pogojno nujni izdatki (urejanje)</li>
                        <li style="margin-left: 20px;"><strong>Nenujni:</strong> Nenujni izdatki (urejanje)</li>
                        <li><strong>Neto denarni tok:</strong> Prejemki - Vsa izplačila (samodejno izračunano)</li>
                        <li><strong>Končno stanje:</strong> Začetno stanje + Neto denarni tok (samodejno izračunano)</li>
                        <li><strong>Razširljivo:</strong> Klikni mesece → tedne → dneve in vrstice za podroben pogled</li>
                        <li><strong>Napoved banke:</strong> Uvozi napovedi plačil na podlagi analiz vedenja strank (AI)</li>
                    </ul>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Set up event handlers
        setTimeout(() => {
            this.setupEventHandlers();
        }, 100);
    },

    // Render the table
    renderTable() {
        const headers = this.renderHeaders();
        const rows = this.renderAllRows();

        return `
            <table class="cashflow-table">
                ${headers}
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    },

    // Render headers with expandable months/weeks
    renderHeaders() {
        let monthHeaders = '<tr><th class="row-type-header" rowspan="2">Postavka denarnega toka</th>';
        let subHeaders = '<tr>';

        // Build month headers with potential expansion
        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const isExpanded = this.state.expanded.months.has(monthKey);

            if (isExpanded) {
                // Show weeks for this month
                const weeksInMonth = this.getCalendarWeeksInMonth(this.state.currentYear, month);

                // Calculate correct colspan: sum of (days in expanded weeks + 1 for non-expanded weeks)
                let monthColspan = 0;
                weeksInMonth.forEach(weekNum => {
                    const weekKey = `week-${month}-${weekNum}`;
                    const weekExpanded = this.state.expanded.weeks.has(weekKey);
                    if (weekExpanded) {
                        const daysInWeek = this.getDaysOfWeekInMonth(this.state.currentYear, month, weekNum);
                        monthColspan += daysInWeek.length;
                    } else {
                        monthColspan += 1;
                    }
                });

                monthHeaders += `
                    <th class="month-header" colspan="${monthColspan}"
                        onclick="CashFlow.toggleMonth('${monthKey}')">
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
                                onclick="CashFlow.toggleWeek('${weekKey}')">
                                <span class="expand-icon expanded">▶</span>KW${weekNum}
                            </th>
                        `;
                    } else {
                        subHeaders += `
                            <th class="week-header"
                                onclick="CashFlow.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▶</span>KW${weekNum}
                            </th>
                        `;
                    }
                });
            } else {
                monthHeaders += `
                    <th class="month-header"
                        onclick="CashFlow.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▶</span>
                        ${this.getMonthShort(month)}
                    </th>
                `;
                subHeaders += '<th>-</th>';
            }
        }

        monthHeaders += '<th rowspan="2">Skupaj</th></tr>';
        subHeaders += '</tr>';

        // Add day headers if any week is expanded
        let dayHeaders = '';
        if ([...this.state.expanded.weeks].length > 0) {
            dayHeaders = '<tr><th></th>';

            for (let month = 1; month <= 12; month++) {
                const monthKey = `month-${month}`;
                if (this.state.expanded.months.has(monthKey)) {
                    const weeksInMonth = this.getCalendarWeeksInMonth(this.state.currentYear, month);
                    weeksInMonth.forEach(weekNum => {
                        const weekKey = `week-${month}-${weekNum}`;
                        if (this.state.expanded.weeks.has(weekKey)) {
                            const daysInWeek = this.getDaysOfWeekInMonth(this.state.currentYear, month, weekNum);
                            daysInWeek.forEach(day => {
                                const date = new Date(this.state.currentYear, month - 1, day);
                                const dayName = this.getDayShort(date.getDay());
                                const weekendClass = this.isWeekend(date) ? 'weekend' : '';
                                dayHeaders += `<th class="day-header ${weekendClass}">${day}<br>${dayName}</th>`;
                            });
                        } else {
                            dayHeaders += '<th>-</th>';
                        }
                    });
                } else {
                    dayHeaders += '<th>-</th>';
                }
            }

            dayHeaders += '<th>-</th></tr>';
        }

        return '<thead>' + monthHeaders + subHeaders + dayHeaders + '</thead>';
    },

    // Render all rows
    renderAllRows() {
        let html = '';

        const rows = [
            'cashBeginning',
            'receipts',
            'disbursements', // Parent row
            'netCashFlow',
            'cashEnding'
        ];

        const disbursementChildren = [
            'disbursementsNujni',
            'disbursementsPogojnoNujni',
            'disbursementsNenujni'
        ];

        rows.forEach((rowType) => {
            const rowData = this.state.data[rowType];

            // Check if this is an expandable row
            const isExpandable = rowType === 'disbursements';
            const isExpanded = this.state.expanded.rows.has('disbursements');

            html += `<tr class="row-${rowType} ${isExpandable ? 'row-expandable' : ''}">`;

            // Row type cell
            if (isExpandable) {
                html += `
                    <td class="row-type-cell" onclick="CashFlow.toggleRow('disbursements')">
                        <span class="expand-icon ${isExpanded ? 'expanded' : ''}">▶</span>
                        ${this.getRowShortLabel(rowType)}
                    </td>
                `;
            } else {
                html += `
                    <td class="row-type-cell">
                        ${this.getRowShortLabel(rowType)}
                    </td>
                `;
            }

            // Data cells based on expansion state
            html += this.renderDataCells(rowType);

            // Total cell
            html += `
                <td class="cell-total ${this.getCellValueClass(rowType, rowData.total)}">
                    ${this.formatCurrency(rowData.total)}
                </td>
            `;

            html += '</tr>';

            // If disbursements is expanded, show child rows
            if (isExpandable && isExpanded) {
                disbursementChildren.forEach((childType) => {
                    const childData = this.state.data[childType];

                    html += `<tr class="row-${childType} row-child">`;

                    // Row type cell with indentation
                    html += `
                        <td class="row-type-cell row-child">
                            ${this.getRowShortLabel(childType)}
                        </td>
                    `;

                    // Data cells
                    html += this.renderDataCells(childType);

                    // Total cell
                    html += `
                        <td class="cell-total ${this.getCellValueClass(childType, childData.total)}">
                            ${this.formatCurrency(childData.total)}
                        </td>
                    `;

                    html += '</tr>';
                });
            }
        });

        return html;
    },

    // Get short row label
    getRowShortLabel(rowType) {
        const labels = {
            'cashBeginning': 'Začetno stanje',
            'receipts': 'Prejemki',
            'disbursements': 'Izplačila',
            'disbursementsNujni': '[U] Nujni',
            'disbursementsPogojnoNujni': '[C] Pogojno nujni',
            'disbursementsNenujni': '[F] Nenujni',
            'netCashFlow': 'Neto denarni tok',
            'cashEnding': 'Končno stanje'
        };
        return labels[rowType] || rowType;
    },

    // Render data cells based on expansion state
    renderDataCells(rowType) {
        let html = '';
        const rowData = this.state.data[rowType];

        for (let month = 1; month <= 12; month++) {
            const monthKey = `month-${month}`;
            const monthData = rowData.months[month];

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
                            const date = new Date(this.state.currentYear, month - 1, day);
                            const weekendClass = this.isWeekend(date) ? 'weekend-cell' : '';
                            const cellClass = this.getCellClass(rowType, month, day);
                            const valueClass = this.getCellValueClass(rowType, dayData.value);
                            const cellId = `cell-${rowType}-${month}-${day}`;
                            const isEdited = this.state.editedCells.has(cellId);
                            const editedClass = isEdited ? 'edited-cell' : '';
                            const editableClass = dayData.editable ? 'editable-cell' : '';

                            if (dayData.editable) {
                                html += `
                                    <td class="${cellClass} ${editableClass} ${editedClass} ${weekendClass} ${valueClass}"
                                        data-cell-id="${cellId}"
                                        data-row-type="${rowType}"
                                        data-month="${month}"
                                        data-day="${day}"
                                        data-editable="true"
                                        onclick="CashFlow.startEditing(this)">
                                        ${this.formatCurrency(dayData.value)}
                                    </td>
                                `;
                            } else {
                                html += `<td class="${cellClass} ${weekendClass} ${valueClass}">${this.formatCurrency(dayData.value)}</td>`;
                            }
                        });
                    } else {
                        // Week not expanded - show week total
                        const cellClass = this.getCellClass(rowType, month);
                        const valueClass = this.getCellValueClass(rowType, weekData.total);
                        html += `<td class="${cellClass} ${valueClass}">${this.formatCurrency(weekData.total)}</td>`;
                    }
                });
            } else {
                // Month not expanded - show month total
                const cellClass = this.getCellClass(rowType, month);
                const valueClass = this.getCellValueClass(rowType, monthData.total);
                const cellId = `cell-${rowType}-${month}`;
                const isEdited = this.state.editedCells.has(cellId);
                const editedClass = isEdited ? 'edited-cell' : '';
                const editableClass = monthData.editable ? 'editable-cell' : '';

                if (monthData.editable) {
                    html += `
                        <td class="${cellClass} ${editableClass} ${editedClass} ${valueClass}"
                            data-cell-id="${cellId}"
                            data-row-type="${rowType}"
                            data-month="${month}"
                            data-editable="true"
                            onclick="CashFlow.startEditingMonth(this)">
                            ${this.formatCurrency(monthData.total)}
                        </td>
                    `;
                } else {
                    html += `<td class="${cellClass} ${valueClass}">${this.formatCurrency(monthData.total)}</td>`;
                }
            }
        }

        return html;
    },

    // Get cell class based on row type and date
    getCellClass(rowType, month, day) {
        // Check if past, current, or future
        const today = this.state.today;
        const dateToCheck = day ?
            new Date(this.state.currentYear, month - 1, day) :
            new Date(this.state.currentYear, month - 1, 15);

        const isPast = dateToCheck < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isCurrent = dateToCheck.toDateString() === today.toDateString();

        if (isCurrent) return 'cell-current';
        if (isPast) return 'cell-past';
        return 'cell-future';
    },

    // Get value class for positive/negative
    getCellValueClass(rowType, value) {
        if (rowType === 'disbursements' || rowType.includes('disbursements')) {
            return value > 0 ? 'cell-negative' : '';
        }
        if (rowType === 'netCashFlow') {
            return value >= 0 ? 'cell-positive' : 'cell-negative';
        }
        return '';
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
        this.renderCashFlowGrid();
    },

    // Toggle week expansion
    toggleWeek(weekKey) {
        if (this.state.expanded.weeks.has(weekKey)) {
            this.state.expanded.weeks.delete(weekKey);
        } else {
            this.state.expanded.weeks.add(weekKey);
        }
        this.renderCashFlowGrid();
    },

    // Toggle row expansion
    toggleRow(rowKey) {
        if (this.state.expanded.rows.has(rowKey)) {
            this.state.expanded.rows.delete(rowKey);
        } else {
            this.state.expanded.rows.add(rowKey);
        }
        this.renderCashFlowGrid();
    },

    // Start editing a cell (day level)
    startEditing(cell) {
        if (cell.classList.contains('editing')) return;

        const currentValue = parseInt(cell.textContent.replace(/[^0-9-]/g, '')) || 0;

        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" class="cell-input" value="${currentValue}" step="1000">`;

        const input = cell.querySelector('.cell-input');
        input.focus();
        input.select();

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

    // Start editing a month cell
    startEditingMonth(cell) {
        if (cell.classList.contains('editing')) return;

        const currentValue = parseInt(cell.textContent.replace(/[^0-9-]/g, '')) || 0;

        cell.classList.add('editing');
        cell.innerHTML = `<input type="number" class="cell-input" value="${currentValue}" step="1000">`;

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

    // Save day edit
    saveEdit(cell, newValue) {
        const cellId = cell.dataset.cellId;
        const rowType = cell.dataset.rowType;
        const month = parseInt(cell.dataset.month);
        const day = parseInt(cell.dataset.day);

        // Update the data
        const rowData = this.state.data[rowType];

        // Find the correct week for this day
        Object.keys(rowData.months[month].weeks).forEach(weekNum => {
            if (rowData.months[month].weeks[weekNum].days[day]) {
                rowData.months[month].weeks[weekNum].days[day].value = newValue;

                // Recalculate week total
                rowData.months[month].weeks[weekNum].total = Object.values(
                    rowData.months[month].weeks[weekNum].days
                ).reduce((sum, d) => sum + d.value, 0);
            }
        });

        // Recalculate totals for this row
        this.recalculateTotals(rowType);

        // Recalculate all formulas (disbursements, net CF, cash ending, etc.)
        this.recalculateFormulas();

        // Mark as edited
        this.state.editedCells.add(cellId);
        this.state.unsavedChanges = true;
        this.updateSaveButton();

        // Re-render
        this.renderCashFlowGrid();
    },

    // Save month edit
    saveMonthEdit(cell, newValue) {
        const rowType = cell.dataset.rowType;
        const month = parseInt(cell.dataset.month);

        const rowData = this.state.data[rowType];
        const monthData = rowData.months[month];

        // Count editable days in the month
        let editableDays = 0;
        Object.values(monthData.weeks).forEach(week => {
            Object.values(week.days).forEach(day => {
                if (day.editable) editableDays++;
            });
        });

        // Distribute value across editable days
        const baseValuePerDay = Math.floor(newValue / editableDays);
        let remainder = newValue - (baseValuePerDay * editableDays);

        Object.values(monthData.weeks).forEach(week => {
            Object.keys(week.days).forEach(dayKey => {
                if (week.days[dayKey].editable) {
                    let dayValue = baseValuePerDay;
                    if (remainder > 0) {
                        dayValue++;
                        remainder--;
                    } else if (remainder < 0) {
                        dayValue--;
                        remainder++;
                    }
                    week.days[dayKey].value = dayValue;
                }
            });

            // Recalculate week total
            week.total = Object.values(week.days).reduce((sum, d) => sum + d.value, 0);
        });

        // Recalculate totals for this row
        this.recalculateTotals(rowType);

        // Recalculate all formulas (disbursements, net CF, cash ending, etc.)
        this.recalculateFormulas();

        // Mark as edited
        this.state.editedCells.add(`cell-${rowType}-${month}`);
        this.state.unsavedChanges = true;
        this.updateSaveButton();

        // Re-render
        this.renderCashFlowGrid();
    },

    // Recalculate totals
    recalculateTotals(rowType) {
        const rowData = this.state.data[rowType];

        rowData.total = 0;
        Object.values(rowData.months).forEach(month => {
            month.total = 0;
            Object.values(month.weeks).forEach(week => {
                month.total += week.total;
            });
            rowData.total += month.total;
        });
    },

    // Recalculate formulas (internal method without alert)
    recalculateFormulas() {
        // For each period, calculate:
        // disbursements (parent) = nujni + pogojno nujni + nenujni
        // netCashFlow = receipts - disbursements
        // cashEnding = cashBeginning + netCashFlow
        // next period's cashBeginning = previous period's cashEnding

        const receipts = this.state.data.receipts;
        const disbursements = this.state.data.disbursements;
        const disbursementsNujni = this.state.data.disbursementsNujni;
        const disbursementsPogojnoNujni = this.state.data.disbursementsPogojnoNujni;
        const disbursementsNenujni = this.state.data.disbursementsNenujni;
        const netCashFlow = this.state.data.netCashFlow;
        const cashBeginning = this.state.data.cashBeginning;
        const cashEnding = this.state.data.cashEnding;

        // Get initial cash beginning value (first day of year)
        const firstWeekOfYear = Object.keys(cashBeginning.months[1].weeks)[0];
        const firstDayOfYear = Object.keys(cashBeginning.months[1].weeks[firstWeekOfYear].days)[0];
        let runningCash = cashBeginning.months[1].weeks[firstWeekOfYear].days[firstDayOfYear].value;

        for (let month = 1; month <= 12; month++) {
            const weeksInMonth = this.getCalendarWeeksInMonth(this.state.currentYear, month);
            weeksInMonth.forEach(weekNum => {
                const daysInWeek = this.getDaysOfWeekInMonth(this.state.currentYear, month, weekNum);
                daysInWeek.forEach(day => {
                    const receipt = receipts.months[month].weeks[weekNum].days[day].value;
                    const disbursementNujni = disbursementsNujni.months[month].weeks[weekNum].days[day].value;
                    const disbursementPogojnoNujni = disbursementsPogojnoNujni.months[month].weeks[weekNum].days[day].value;
                    const disbursementNenujni = disbursementsNenujni.months[month].weeks[weekNum].days[day].value;

                    const totalDisbursements = disbursementNujni + disbursementPogojnoNujni + disbursementNenujni;

                    // Update parent disbursements row
                    disbursements.months[month].weeks[weekNum].days[day].value = totalDisbursements;

                    // Set cash beginning for this day
                    cashBeginning.months[month].weeks[weekNum].days[day].value = runningCash;

                    // Calculate net cash flow
                    netCashFlow.months[month].weeks[weekNum].days[day].value = receipt - totalDisbursements;

                    // Calculate cash ending
                    cashEnding.months[month].weeks[weekNum].days[day].value = runningCash + (receipt - totalDisbursements);

                    // Cash ending becomes next day's cash beginning
                    runningCash = cashEnding.months[month].weeks[weekNum].days[day].value;
                });

                // Recalculate week totals
                ['cashBeginning', 'disbursements', 'netCashFlow', 'cashEnding'].forEach(type => {
                    const weekData = this.state.data[type].months[month].weeks[weekNum];
                    weekData.total = Object.values(weekData.days).reduce((sum, d) => sum + d.value, 0);
                });
            });

            // Recalculate month totals
            [
                'cashBeginning',
                'receipts',
                'disbursements',
                'disbursementsNujni',
                'disbursementsPogojnoNujni',
                'disbursementsNenujni',
                'netCashFlow',
                'cashEnding'
            ].forEach(type => {
                this.recalculateTotals(type);
            });
        }
    },

    // Recalculate all derived values (user-triggered with alert)
    recalculateAll() {
        this.recalculateFormulas();
        this.state.unsavedChanges = true;
        this.updateSaveButton();
        this.renderCashFlowGrid();
        alert('[Updated] Vsi izračuni denarnega toka posodobljeni!');
    },

    // Update save button
    updateSaveButton() {
        const saveBtn = document.getElementById('cf-save-btn');
        const indicator = document.getElementById('cf-unsaved-indicator');

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

    // Save data
    saveData() {
        localStorage.setItem('cashFlowData', JSON.stringify(this.state.data));
        localStorage.setItem('cashFlowEditedCells', JSON.stringify([...this.state.editedCells]));

        this.state.unsavedChanges = false;
        this.updateSaveButton();

        alert('[Success] Podatki denarnega toka uspešno shranjeni!');
    },

    // Export data
    exportData() {
        const exportData = {
            version: this.VERSION,
            exportDate: new Date().toISOString(),
            year: this.state.currentYear,
            data: this.state.data
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `denarni-tok-${this.state.currentYear}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    },

    // Reset data
    resetData() {
        if (confirm('Ali ste prepričani, da želite ponastaviti vse podatke o denarnem toku? To bo izbrisalo vse vaše spremembe.')) {
            this.state.editedCells.clear();
            this.state.unsavedChanges = false;
            localStorage.removeItem('cashFlowData');
            localStorage.removeItem('cashFlowEditedCells');

            // Regenerate default data
            this.state.data = this.generateCashFlowData();

            // Recalculate all formulas
            this.recalculateFormulas();

            this.renderCashFlowGrid();
        }
    },

    // Setup event handlers
    setupEventHandlers() {
        // Auto-save reminder
        window.addEventListener('beforeunload', (e) => {
            if (this.state.unsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Imate neshranjene spremembe. Ste prepričani, da želite zapustiti stran?';
            }
        });
    },

    // Helper functions
    formatCurrency(num) {
        return num.toLocaleString('sl-SI', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    },

    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
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
    },

    // ========================================================================
    // BANK FORECAST INTEGRATION
    // ========================================================================

    /**
     * Load AI-based bank forecast from payment predictor
     */
    async loadBankForecast() {
        console.log('Loading bank forecast...');

        try {
            // Load the forecast JSON
            const response = await fetch('/BankData/bank_forecast_90days.json');
            if (!response.ok) {
                throw new Error(`Failed to load forecast: ${response.status}`);
            }

            const forecastData = await response.json();

            // Show metadata
            const metadata = forecastData.forecast_metadata;
            console.log('Forecast metadata:', metadata);

            // Confirm with user
            const confirmed = confirm(
                `[AI] Load AI Bank Forecast?\n\n` +
                `Generated: ${new Date(metadata.generated_at).toLocaleString('sl-SI')}\n` +
                `Period: ${metadata.forecast_days} days\n` +
                `Customers Analyzed: ${metadata.total_customers_analyzed}\n` +
                `Predictions: ${metadata.total_predictions}\n\n` +
                `This will update Receipts and Disbursements with predicted values.\n` +
                `Continue?`
            );

            if (!confirmed) {
                return;
            }

            // Process and import forecast data
            this.importBankForecastData(forecastData.daily_forecast);

        } catch (error) {
            console.error('Error loading bank forecast:', error);
            alert(`[Error] Error loading bank forecast:\n\n${error.message}\n\n` +
                  `Make sure the forecast file exists at:\n/BankData/bank_forecast_90days.json`);
        }
    },

    /**
     * Import bank forecast data into CF grid
     */
    importBankForecastData(dailyForecast) {
        console.log(`Importing ${dailyForecast.length} days of forecast data...`);

        let receiptsUpdated = 0;
        let disbursementsUpdated = 0;
        let totalReceipts = 0;
        let totalDisbursements = 0;
        const monthsWithData = new Set();

        // Process each day in the forecast
        dailyForecast.forEach(dayData => {
            const date = new Date(dayData.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();

            // Only import if within current year view
            if (year !== this.state.currentYear) {
                return;
            }

            // Find the week number for this day
            const weekNum = this.getWeekNumber(date);

            try {
                // Update Receipts
                if (dayData.receipts > 0) {
                    const receiptsRow = this.state.data.receipts;
                    if (receiptsRow.months[month] &&
                        receiptsRow.months[month].weeks[weekNum] &&
                        receiptsRow.months[month].weeks[weekNum].days[day]) {

                        receiptsRow.months[month].weeks[weekNum].days[day].value = dayData.receipts;
                        receiptsUpdated++;
                        totalReceipts += dayData.receipts;
                        monthsWithData.add(month);
                    }
                }

                // Update Disbursements (distribute across categories)
                if (dayData.disbursements > 0) {
                    // Distribute disbursements: 60% Nujni, 25% Pogojno Nujni, 15% Nenujni
                    const nujni = dayData.disbursements * 0.60;
                    const pogojnoNujni = dayData.disbursements * 0.25;
                    const nenujni = dayData.disbursements * 0.15;

                    // Update Nujni
                    const nujniRow = this.state.data.disbursementsNujni;
                    if (nujniRow.months[month] &&
                        nujniRow.months[month].weeks[weekNum] &&
                        nujniRow.months[month].weeks[weekNum].days[day]) {

                        nujniRow.months[month].weeks[weekNum].days[day].value = nujni;
                    }

                    // Update Pogojno Nujni
                    const pogojnoRow = this.state.data.disbursementsPogojnoNujni;
                    if (pogojnoRow.months[month] &&
                        pogojnoRow.months[month].weeks[weekNum] &&
                        pogojnoRow.months[month].weeks[weekNum].days[day]) {

                        pogojnoRow.months[month].weeks[weekNum].days[day].value = pogojnoNujni;
                    }

                    // Update Nenujni
                    const nenujniRow = this.state.data.disbursementsNenujni;
                    if (nenujniRow.months[month] &&
                        nenujniRow.months[month].weeks[weekNum] &&
                        nenujniRow.months[month].weeks[weekNum].days[day]) {

                        nenujniRow.months[month].weeks[weekNum].days[day].value = nenujni;
                    }

                    disbursementsUpdated++;
                    totalDisbursements += dayData.disbursements;
                    monthsWithData.add(month);
                }

            } catch (error) {
                console.error(`Error processing date ${dayData.date}:`, error);
            }
        });

        console.log(`✓ Updated ${receiptsUpdated} receipt days`);
        console.log(`✓ Updated ${disbursementsUpdated} disbursement days`);

        // Auto-expand months with data so user can see the changes
        monthsWithData.forEach(month => {
            this.state.expanded.months.add(`month-${month}`);
        });

        // Recalculate all totals and formulas
        ['receipts', 'disbursementsNujni', 'disbursementsPogojnoNujni', 'disbursementsNenujni'].forEach(type => {
            this.recalculateTotals(type);
        });

        this.recalculateFormulas();

        // Mark as having unsaved changes
        this.state.unsavedChanges = true;

        // Re-render the grid
        this.renderCashFlowGrid();

        // Show detailed summary
        const monthNames = Array.from(monthsWithData).map(m => this.getMonthShort(m)).join(', ');
        alert(`[Success] Bank Forecast Imported Successfully!\n\n` +
              `Summary:\n` +
              `• Receipts: ${receiptsUpdated} days updated\n` +
              `• Disbursements: ${disbursementsUpdated} days updated\n` +
              `• Total Expected Receipts: €${this.formatCurrency(totalReceipts)}\n` +
              `• Total Expected Disbursements: €${this.formatCurrency(totalDisbursements)}\n` +
              `• Net Position: €${this.formatCurrency(totalReceipts - totalDisbursements)}\n\n` +
              `Months Updated: ${monthNames}\n\n` +
              `Note: Months have been auto-expanded to show the data.\n` +
              `Note: Click month headers to expand weeks, then weeks to see daily values.`);
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CashFlow;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.CashFlow = CashFlow;
}

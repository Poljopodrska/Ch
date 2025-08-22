// Workforce Availability Module - V1
// Track employee availability with timeline view
const WorkforceAvailability = {
    VERSION: '1.0.0',
    
    state: {
        workers: [],
        availabilityData: {},
        currentView: 'month', // 'month', 'week', 'day'
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        expandedMonths: new Set(),
        expandedWeeks: new Set(),
        editingCell: null,
        
        // Reason codes for unavailability
        reasons: {
            'available': { code: 'A', label: 'Available', color: '#27ae60', value: 1 },
            'holiday': { code: 'H', label: 'Holiday', color: '#3498db', value: 0 },
            'sick': { code: 'S', label: 'Sick Leave', color: '#e74c3c', value: 0 },
            'leaving': { code: 'L', label: 'Leaving Company', color: '#95a5a6', value: 0 },
            'elsewhere': { code: 'E', label: 'Needed Elsewhere', color: '#f39c12', value: 0.5 },
            'partial': { code: 'P', label: 'Partial Availability', color: '#9b59b6', value: 0.5 },
            'training': { code: 'T', label: 'Training', color: '#1abc9c', value: 0.3 }
        }
    },
    
    init() {
        console.log(`Workforce Availability Module V${this.VERSION} initializing...`);
        
        this.loadWorkers();
        this.loadAvailabilityData();
        this.render();
        this.bindEvents();
        
        console.log('Workforce Availability initialized');
    },
    
    loadWorkers() {
        // Load from localStorage or use defaults
        const saved = localStorage.getItem('workforceWorkers');
        if (saved) {
            this.state.workers = JSON.parse(saved);
        } else {
            // Default workers
            this.state.workers = [
                { id: 'w001', name: 'Ana Novak', department: 'Production', role: 'Operator' },
                { id: 'w002', name: 'Marko Horvat', department: 'Production', role: 'Supervisor' },
                { id: 'w003', name: 'Petra Kovač', department: 'Quality', role: 'Inspector' },
                { id: 'w004', name: 'Ivan Krajnc', department: 'Packaging', role: 'Operator' },
                { id: 'w005', name: 'Maja Potočnik', department: 'Production', role: 'Operator' }
            ];
        }
    },
    
    loadAvailabilityData() {
        // Load from localStorage or generate defaults
        const saved = localStorage.getItem('workforceAvailability');
        if (saved) {
            this.state.availabilityData = JSON.parse(saved);
        } else {
            this.generateDefaultAvailability();
        }
    },
    
    generateDefaultAvailability() {
        this.state.availabilityData = {};
        const year = this.state.currentYear;
        
        this.state.workers.forEach(worker => {
            this.state.availabilityData[worker.id] = {};
            
            // Generate for current year
            for (let month = 0; month < 12; month++) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dayOfWeek = date.getDay();
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    // Default: Available Mon-Fri (1), Weekend off (0)
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        this.state.availabilityData[worker.id][dateKey] = {
                            value: 0,
                            reason: 'weekend'
                        };
                    } else {
                        this.state.availabilityData[worker.id][dateKey] = {
                            value: 1,
                            reason: 'available'
                        };
                    }
                }
            }
        });
    },
    
    render() {
        const container = document.getElementById('workforce-container') || 
                         document.getElementById('main-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="workforce-availability">
                <div class="module-header">
                    <h2>👥 Workforce Availability</h2>
                    <div class="header-controls">
                        <div class="view-controls">
                            <button class="btn btn-nav" onclick="WorkforceAvailability.previousPeriod()">
                                ← Previous
                            </button>
                            <span class="current-period">${this.getCurrentPeriodLabel()}</span>
                            <button class="btn btn-nav" onclick="WorkforceAvailability.nextPeriod()">
                                Next →
                            </button>
                        </div>
                        <div class="view-tabs">
                            <button class="tab-btn ${this.state.currentView === 'day' ? 'active' : ''}" 
                                    onclick="WorkforceAvailability.setView('day')">
                                Day
                            </button>
                            <button class="tab-btn ${this.state.currentView === 'week' ? 'active' : ''}" 
                                    onclick="WorkforceAvailability.setView('week')">
                                Week
                            </button>
                            <button class="tab-btn ${this.state.currentView === 'month' ? 'active' : ''}" 
                                    onclick="WorkforceAvailability.setView('month')">
                                Month
                            </button>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-add" onclick="WorkforceAvailability.showAddWorker()">
                                ➕ Add Worker
                            </button>
                            <button class="btn btn-export" onclick="WorkforceAvailability.exportData()">
                                📥 Export
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="legend">
                    ${this.renderLegend()}
                </div>
                
                <div class="workforce-grid">
                    ${this.renderGrid()}
                </div>
                
                <div id="worker-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="WorkforceAvailability.closeModal()">&times;</span>
                        <h3>Add New Worker</h3>
                        <div class="form-group">
                            <label>Name:</label>
                            <input type="text" id="worker-name" placeholder="Enter name">
                        </div>
                        <div class="form-group">
                            <label>Department:</label>
                            <input type="text" id="worker-department" placeholder="Enter department">
                        </div>
                        <div class="form-group">
                            <label>Role:</label>
                            <input type="text" id="worker-role" placeholder="Enter role">
                        </div>
                        <button class="btn btn-save" onclick="WorkforceAvailability.addWorker()">
                            Save Worker
                        </button>
                    </div>
                </div>
                
                <div id="availability-editor" class="availability-popup" style="display: none;">
                    <div class="popup-content">
                        <h4>Set Availability</h4>
                        <div class="availability-options">
                            ${Object.entries(this.state.reasons).map(([key, reason]) => `
                                <div class="availability-option" 
                                     onclick="WorkforceAvailability.setAvailability('${key}')"
                                     style="border-left: 4px solid ${reason.color}">
                                    <span class="option-label">${reason.label}</span>
                                    <span class="option-value">${reason.value}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="custom-value">
                            <label>Custom value (0-1):</label>
                            <input type="number" id="custom-availability" min="0" max="1" step="0.1">
                            <button onclick="WorkforceAvailability.setCustomAvailability()">Set</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .workforce-availability {
                    padding: 20px;
                    background: #f8f9fa;
                    min-height: 100vh;
                }
                
                .module-header {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .module-header h2 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                }
                
                .header-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .view-controls {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .current-period {
                    font-weight: 600;
                    color: #2c3e50;
                    min-width: 150px;
                    text-align: center;
                }
                
                .view-tabs {
                    display: flex;
                    gap: 10px;
                }
                
                .tab-btn {
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .tab-btn:hover {
                    background: #f0f0f0;
                }
                
                .tab-btn.active {
                    background: #3498db;
                    color: white;
                    border-color: #3498db;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 10px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                }
                
                .btn-nav {
                    background: #ecf0f1;
                    color: #2c3e50;
                }
                
                .btn-nav:hover {
                    background: #bdc3c7;
                }
                
                .btn-add {
                    background: #27ae60;
                    color: white;
                }
                
                .btn-add:hover {
                    background: #229954;
                }
                
                .btn-export {
                    background: #8e44ad;
                    color: white;
                }
                
                .btn-export:hover {
                    background: #7d3c98;
                }
                
                .legend {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .legend-items {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .legend-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                }
                
                .workforce-grid {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    overflow-x: auto;
                }
                
                .workforce-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }
                
                .workforce-table th {
                    background: #f8f9fa;
                    padding: 10px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #dee2e6;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .workforce-table td {
                    padding: 8px;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .worker-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-width: 200px;
                }
                
                .worker-details {
                    flex: 1;
                }
                
                .worker-name {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .worker-role {
                    font-size: 12px;
                    color: #7f8c8d;
                }
                
                .btn-remove {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .btn-remove:hover {
                    background: #c0392b;
                }
                
                .availability-cell {
                    text-align: center;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    font-weight: 500;
                    min-width: 60px;
                }
                
                .availability-cell:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .month-header {
                    background: #546e7a !important;
                    color: white !important;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                    font-weight: 600;
                }
                
                .month-header:hover {
                    background: #455a64 !important;
                }
                
                .week-header {
                    background: #607d8b !important;
                    color: white !important;
                    font-size: 11px;
                    cursor: pointer;
                    user-select: none;
                }
                
                .week-header:hover {
                    background: #546e7a !important;
                }
                
                .day-header {
                    background: #78909c !important;
                    color: white !important;
                    font-size: 10px;
                }
                
                .month-collapsed, .week-collapsed {
                    background: #90a4ae !important;
                }
                
                .expandable {
                    cursor: pointer;
                    user-select: none;
                }
                
                .expand-icon {
                    display: inline-block;
                    margin-right: 5px;
                    transition: transform 0.2s;
                    font-size: 12px;
                }
                
                .expanded .expand-icon {
                    transform: rotate(90deg);
                }
                
                .modal {
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    width: 400px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                
                .close {
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    color: #aaa;
                }
                
                .close:hover {
                    color: #000;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #2c3e50;
                }
                
                .form-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                .btn-save {
                    background: #27ae60;
                    color: white;
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                }
                
                .btn-save:hover {
                    background: #229954;
                }
                
                .availability-popup {
                    position: fixed;
                    z-index: 1001;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    padding: 15px;
                    min-width: 250px;
                }
                
                .popup-content h4 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                }
                
                .availability-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 15px;
                }
                
                .availability-option {
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    transition: background 0.2s;
                }
                
                .availability-option:hover {
                    background: #f0f0f0;
                }
                
                .option-value {
                    font-weight: 600;
                }
                
                .custom-value {
                    border-top: 1px solid #dee2e6;
                    padding-top: 10px;
                }
                
                .custom-value label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 12px;
                    color: #7f8c8d;
                }
                
                .custom-value input {
                    width: 100px;
                    padding: 4px;
                    margin-right: 10px;
                }
                
                .custom-value button {
                    padding: 4px 12px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .summary-row {
                    background: #f8f9fa;
                    font-weight: 600;
                }
                
                .weekend {
                    background: #ecf0f1;
                }
            </style>
        `;
    },
    
    renderLegend() {
        return `
            <div class="legend-items">
                <strong>Availability Legend:</strong>
                ${Object.entries(this.state.reasons).map(([key, reason]) => `
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${reason.color}"></div>
                        <span>${reason.label} (${reason.value})</span>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderGrid() {
        const year = this.state.currentYear;
        const month = this.state.currentMonth;
        
        return `
            <table class="workforce-table">
                ${this.renderHeaders()}
                <tbody>
                    ${this.state.workers.map(worker => this.renderWorkerRow(worker)).join('')}
                    ${this.renderSummaryRow()}
                </tbody>
            </table>
        `;
    },
    
    renderHeaders() {
        let mainHeaders = '<tr><th rowspan="3">Worker</th>';
        let weekHeaders = '<tr>';
        let dayHeaders = '<tr>';
        
        // Build month headers with expansion like Sales Planning
        for (let month = 0; month < 12; month++) {
            const monthKey = `month-${this.state.currentYear}-${month}`;
            const isMonthExpanded = this.state.expandedMonths.has(monthKey);
            const monthName = new Date(this.state.currentYear, month, 1).toLocaleString('default', { month: 'short' });
            
            if (isMonthExpanded) {
                // Month is expanded - show weeks
                const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                let totalColspan = 0;
                
                // Calculate colspan for month
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${this.state.currentYear}-${month}-${w}`;
                    const isWeekExpanded = this.state.expandedWeeks.has(weekKey);
                    
                    if (isWeekExpanded) {
                        const days = this.getDaysInWeek(this.state.currentYear, month, w);
                        totalColspan += days.length;
                    } else {
                        totalColspan += 1;
                    }
                }
                
                mainHeaders += `
                    <th class="month-header expandable expanded" colspan="${totalColspan}"
                        onclick="WorkforceAvailability.toggleExpand('${monthKey}')">
                        <span class="expand-icon">▼</span> ${monthName}
                    </th>
                `;
                
                // Add week headers
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${this.state.currentYear}-${month}-${w}`;
                    const isWeekExpanded = this.state.expandedWeeks.has(weekKey);
                    const days = this.getDaysInWeek(this.state.currentYear, month, w);
                    
                    if (isWeekExpanded) {
                        weekHeaders += `
                            <th class="week-header expandable expanded" colspan="${days.length}"
                                onclick="WorkforceAvailability.toggleExpand('${weekKey}')">
                                <span class="expand-icon">▼</span> W${w + 1}
                            </th>
                        `;
                        
                        // Add day headers
                        days.forEach(day => {
                            const date = new Date(this.state.currentYear, month, day);
                            const dayName = date.toLocaleString('default', { weekday: 'short' });
                            dayHeaders += `<th class="day-header">${dayName.substring(0,2)}<br>${day}</th>`;
                        });
                    } else {
                        weekHeaders += `
                            <th class="week-header expandable" 
                                onclick="WorkforceAvailability.toggleExpand('${weekKey}')">
                                <span class="expand-icon">▶</span> W${w + 1}
                            </th>
                        `;
                        dayHeaders += `<th class="week-collapsed"></th>`;
                    }
                }
            } else {
                // Month not expanded
                mainHeaders += `
                    <th class="month-header expandable" 
                        onclick="WorkforceAvailability.toggleExpand('${monthKey}')">
                        <span class="expand-icon">▶</span> ${monthName}
                    </th>
                `;
                weekHeaders += `<th class="month-collapsed"></th>`;
                dayHeaders += `<th class="month-collapsed"></th>`;
            }
        }
        
        mainHeaders += '<th rowspan="3">Total</th></tr>';
        weekHeaders += '</tr>';
        dayHeaders += '</tr>';
        
        return `<thead>${mainHeaders}${weekHeaders}${dayHeaders}</thead>`;
    },
    
    generateHeaders() {
        const headers = [];
        const year = this.state.currentYear;
        const month = this.state.currentMonth;
        
        if (this.state.currentView === 'month') {
            // Show months
            for (let m = 0; m < 12; m++) {
                const monthKey = `${year}-${m}`;
                const monthName = new Date(year, m, 1).toLocaleString('default', { month: 'short' });
                
                if (this.state.expandedMonths.has(monthKey)) {
                    // Month is expanded - show weeks
                    headers.push({
                        key: monthKey,
                        label: monthName,
                        type: 'month',
                        expandable: true,
                        expanded: true
                    });
                    
                    // Add weeks for this month
                    const weeksInMonth = this.getWeeksInMonth(year, m);
                    for (let w = 0; w < weeksInMonth; w++) {
                        const weekKey = `${monthKey}-w${w}`;
                        headers.push({
                            key: weekKey,
                            label: `W${w + 1}`,
                            type: 'week',
                            month: m,
                            week: w,
                            expandable: false
                        });
                    }
                } else {
                    headers.push({
                        key: monthKey,
                        label: monthName,
                        type: 'month',
                        month: m,
                        expandable: true,
                        expanded: false
                    });
                }
            }
        } else if (this.state.currentView === 'week') {
            // Show weeks for current month
            const weeksInMonth = this.getWeeksInMonth(year, month);
            for (let w = 0; w < weeksInMonth; w++) {
                const weekKey = `${year}-${month}-w${w}`;
                
                if (this.state.expandedWeeks.has(weekKey)) {
                    // Week is expanded - show days
                    headers.push({
                        key: weekKey,
                        label: `Week ${w + 1}`,
                        type: 'week',
                        expandable: true,
                        expanded: true
                    });
                    
                    // Add days for this week
                    const days = this.getDaysInWeek(year, month, w);
                    days.forEach(day => {
                        const date = new Date(year, month, day);
                        const dayName = date.toLocaleString('default', { weekday: 'short' });
                        headers.push({
                            key: `${year}-${month}-${day}`,
                            label: `${dayName} ${day}`,
                            type: 'day',
                            date: date,
                            day: day,
                            expandable: false
                        });
                    });
                } else {
                    headers.push({
                        key: weekKey,
                        label: `Week ${w + 1}`,
                        type: 'week',
                        week: w,
                        expandable: true,
                        expanded: false
                    });
                }
            }
        } else {
            // Day view - show individual days for current month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month, d);
                const dayName = date.toLocaleString('default', { weekday: 'short' });
                headers.push({
                    key: `${year}-${month}-${d}`,
                    label: `${dayName} ${d}`,
                    type: 'day',
                    date: date,
                    day: d,
                    expandable: false
                });
            }
        }
        
        return headers;
    },
    
    renderWorkerRow(worker) {
        let html = '<tr>';
        let totalAvailable = 0;
        
        // Worker info cell
        html += `
            <td>
                <div class="worker-info">
                    <div class="worker-details">
                        <div class="worker-name">${worker.name}</div>
                        <div class="worker-role">${worker.department} - ${worker.role}</div>
                    </div>
                    <button class="btn-remove" onclick="WorkforceAvailability.removeWorker('${worker.id}')">
                        Remove
                    </button>
                </div>
            </td>
        `;
        
        // Render cells for each month
        for (let month = 0; month < 12; month++) {
            const monthKey = `month-${this.state.currentYear}-${month}`;
            const isMonthExpanded = this.state.expandedMonths.has(monthKey);
            
            if (isMonthExpanded) {
                // Month is expanded - show weeks
                const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${this.state.currentYear}-${month}-${w}`;
                    const isWeekExpanded = this.state.expandedWeeks.has(weekKey);
                    
                    if (isWeekExpanded) {
                        // Week is expanded - show days
                        const days = this.getDaysInWeek(this.state.currentYear, month, w);
                        days.forEach(day => {
                            const date = new Date(this.state.currentYear, month, day);
                            const dateKey = this.getDateKey(date);
                            const data = this.state.availabilityData[worker.id] ? 
                                        this.state.availabilityData[worker.id][dateKey] : null;
                            const value = data ? data.value : 0;
                            const reason = data ? data.reason : 'available';
                            const reasonData = this.state.reasons[reason] || this.state.reasons.available;
                            
                            totalAvailable += value;
                            
                            html += `
                                <td class="availability-cell day-cell" 
                                    style="background: ${this.getColorForValue(value, reasonData.color)}; 
                                           color: ${value > 0.5 ? 'white' : '#2c3e50'};"
                                    onclick="WorkforceAvailability.editAvailability('${worker.id}', '${dateKey}', event)"
                                    title="${reasonData.label}">
                                    ${value.toFixed(1)}
                                </td>
                            `;
                        });
                    } else {
                        // Week not expanded - show week average
                        const weekValue = this.getWeekAverage(worker.id, this.state.currentYear, month, w);
                        totalAvailable += weekValue;
                        
                        html += `
                            <td class="availability-cell week-cell" 
                                style="background: ${this.getColorForValue(weekValue, '#3498db')}; 
                                       color: ${weekValue > 0.5 ? 'white' : '#2c3e50'};"
                                onclick="WorkforceAvailability.editWeek('${worker.id}', ${this.state.currentYear}, ${month}, ${w}, event)">
                                ${weekValue.toFixed(1)}
                            </td>
                        `;
                    }
                }
            } else {
                // Month not expanded - show month average
                const monthValue = this.getMonthAverage(worker.id, this.state.currentYear, month);
                totalAvailable += monthValue;
                
                html += `
                    <td class="availability-cell month-cell" 
                        style="background: ${this.getColorForValue(monthValue, '#2980b9')}; 
                               color: ${monthValue > 0.5 ? 'white' : '#2c3e50'};"
                        onclick="WorkforceAvailability.editMonth('${worker.id}', ${this.state.currentYear}, ${month}, event)">
                        ${monthValue.toFixed(1)}
                    </td>
                `;
            }
        }
        
        // Total cell
        html += `
            <td style="text-align: center; font-weight: 600;">
                ${totalAvailable.toFixed(1)}
            </td>
        `;
        
        html += '</tr>';
        return html;
    },
    
    renderSummaryRow() {
        let html = '<tr class="summary-row"><td><strong>Total Workforce</strong></td>';
        let grandTotal = 0;
        
        // Calculate totals for each column
        for (let month = 0; month < 12; month++) {
            const monthKey = `month-${this.state.currentYear}-${month}`;
            const isMonthExpanded = this.state.expandedMonths.has(monthKey);
            
            if (isMonthExpanded) {
                const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${this.state.currentYear}-${month}-${w}`;
                    const isWeekExpanded = this.state.expandedWeeks.has(weekKey);
                    
                    if (isWeekExpanded) {
                        const days = this.getDaysInWeek(this.state.currentYear, month, w);
                        days.forEach(day => {
                            const dayTotal = this.getDayTotal(this.state.currentYear, month, day);
                            grandTotal += dayTotal;
                            html += `<td style="text-align: center;"><strong>${dayTotal.toFixed(1)}</strong></td>`;
                        });
                    } else {
                        const weekTotal = this.getWeekTotal(this.state.currentYear, month, w);
                        grandTotal += weekTotal;
                        html += `<td style="text-align: center;"><strong>${weekTotal.toFixed(1)}</strong></td>`;
                    }
                }
            } else {
                const monthTotal = this.getMonthTotal(this.state.currentYear, month);
                grandTotal += monthTotal;
                html += `<td style="text-align: center;"><strong>${monthTotal.toFixed(1)}</strong></td>`;
            }
        }
        
        html += `<td style="text-align: center;"><strong>${grandTotal.toFixed(1)}</strong></td></tr>`;
        return html;
    },
    
    getAvailabilityForPeriod(workerId, header) {
        if (header.type === 'day') {
            const dateKey = this.getDateKey(header.date || new Date(this.state.currentYear, this.state.currentMonth, header.day));
            const data = this.state.availabilityData[workerId][dateKey];
            return data ? data.value : 0;
        } else if (header.type === 'week') {
            // Calculate average for week
            const days = this.getDaysInWeek(this.state.currentYear, header.month || this.state.currentMonth, header.week);
            let total = 0;
            days.forEach(day => {
                const date = new Date(this.state.currentYear, header.month || this.state.currentMonth, day);
                const dateKey = this.getDateKey(date);
                const data = this.state.availabilityData[workerId][dateKey];
                total += data ? data.value : 0;
            });
            return total / days.length;
        } else if (header.type === 'month') {
            // Calculate average for month
            const daysInMonth = new Date(this.state.currentYear, header.month + 1, 0).getDate();
            let total = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(this.state.currentYear, header.month, day);
                const dateKey = this.getDateKey(date);
                const data = this.state.availabilityData[workerId][dateKey];
                total += data ? data.value : 0;
            }
            return total / daysInMonth;
        }
        return 0;
    },
    
    getReasonForPeriod(workerId, header) {
        if (header.type === 'day') {
            const dateKey = this.getDateKey(header.date || new Date(this.state.currentYear, this.state.currentMonth, header.day));
            const data = this.state.availabilityData[workerId][dateKey];
            return data ? data.reason : 'available';
        }
        return 'available';
    },
    
    getColorForValue(value, baseColor) {
        // Adjust color opacity based on value
        if (value === 0) return '#ecf0f1';
        if (value === 1) return baseColor;
        
        // For partial values, lighten the color
        const opacity = value;
        return baseColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    },
    
    calculateColumnTotal(header) {
        let total = 0;
        this.state.workers.forEach(worker => {
            total += this.getAvailabilityForPeriod(worker.id, header);
        });
        return total;
    },
    
    calculateOverallTotal() {
        let total = 0;
        let count = 0;
        
        this.state.workers.forEach(worker => {
            const headers = this.generateHeaders();
            headers.forEach(header => {
                total += this.getAvailabilityForPeriod(worker.id, header);
                count++;
            });
        });
        
        return count > 0 ? total : 0;
    },
    
    getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstWeek = Math.ceil((firstDay.getDate() + firstDay.getDay()) / 7);
        const lastWeek = Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);
        return lastWeek - firstWeek + 1;
    },
    
    getDaysInWeek(year, month, week) {
        const days = [];
        const firstDay = new Date(year, month, 1);
        const startOffset = firstDay.getDay();
        const weekStart = week * 7 - startOffset + 1;
        const weekEnd = Math.min(weekStart + 6, new Date(year, month + 1, 0).getDate());
        
        for (let d = Math.max(1, weekStart); d <= weekEnd; d++) {
            days.push(d);
        }
        return days;
    },
    
    getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    getCurrentPeriodLabel() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        if (this.state.currentView === 'month') {
            return `${this.state.currentYear}`;
        } else {
            return `${monthNames[this.state.currentMonth]} ${this.state.currentYear}`;
        }
    },
    
    setView(view) {
        this.state.currentView = view;
        this.render();
    },
    
    previousPeriod() {
        if (this.state.currentView === 'month') {
            this.state.currentYear--;
        } else {
            this.state.currentMonth--;
            if (this.state.currentMonth < 0) {
                this.state.currentMonth = 11;
                this.state.currentYear--;
            }
        }
        this.render();
    },
    
    nextPeriod() {
        if (this.state.currentView === 'month') {
            this.state.currentYear++;
        } else {
            this.state.currentMonth++;
            if (this.state.currentMonth > 11) {
                this.state.currentMonth = 0;
                this.state.currentYear++;
            }
        }
        this.render();
    },
    
    toggleExpand(key) {
        if (key.startsWith('week-')) {
            // Week expansion
            if (this.state.expandedWeeks.has(key)) {
                this.state.expandedWeeks.delete(key);
            } else {
                this.state.expandedWeeks.add(key);
            }
        } else if (key.startsWith('month-')) {
            // Month expansion
            if (this.state.expandedMonths.has(key)) {
                this.state.expandedMonths.delete(key);
                // Also collapse all weeks in this month
                const parts = key.split('-');
                const year = parts[1];
                const month = parts[2];
                [...this.state.expandedWeeks].forEach(weekKey => {
                    if (weekKey.startsWith(`week-${year}-${month}-`)) {
                        this.state.expandedWeeks.delete(weekKey);
                    }
                });
            } else {
                this.state.expandedMonths.add(key);
            }
        }
        this.render();
    },
    
    getMonthAverage(workerId, year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let total = 0;
        let count = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const data = this.state.availabilityData[workerId] ? 
                        this.state.availabilityData[workerId][dateKey] : null;
            if (data) {
                total += data.value;
                count++;
            }
        }
        
        return count > 0 ? total / count : 0;
    },
    
    getWeekAverage(workerId, year, month, week) {
        const days = this.getDaysInWeek(year, month, week);
        let total = 0;
        let count = 0;
        
        days.forEach(day => {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const data = this.state.availabilityData[workerId] ? 
                        this.state.availabilityData[workerId][dateKey] : null;
            if (data) {
                total += data.value;
                count++;
            }
        });
        
        return count > 0 ? total / count : 0;
    },
    
    getDayTotal(year, month, day) {
        let total = 0;
        const date = new Date(year, month, day);
        const dateKey = this.getDateKey(date);
        
        this.state.workers.forEach(worker => {
            const data = this.state.availabilityData[worker.id] ? 
                        this.state.availabilityData[worker.id][dateKey] : null;
            if (data) {
                total += data.value;
            }
        });
        
        return total;
    },
    
    getWeekTotal(year, month, week) {
        const days = this.getDaysInWeek(year, month, week);
        let total = 0;
        
        this.state.workers.forEach(worker => {
            days.forEach(day => {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                const data = this.state.availabilityData[worker.id] ? 
                            this.state.availabilityData[worker.id][dateKey] : null;
                if (data) {
                    total += data.value;
                }
            });
        });
        
        return total / days.length; // Average for the week
    },
    
    getMonthTotal(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let total = 0;
        let count = 0;
        
        this.state.workers.forEach(worker => {
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                const data = this.state.availabilityData[worker.id] ? 
                            this.state.availabilityData[worker.id][dateKey] : null;
                if (data) {
                    total += data.value;
                    count++;
                }
            }
        });
        
        return count > 0 ? total / (daysInMonth / count) : 0; // Weighted average
    },
    
    editWeek(workerId, year, month, week, event) {
        // Create a composite key for week editing
        const weekKey = `week-${year}-${month}-${week}`;
        this.editAvailability(workerId, weekKey, event);
    },
    
    editMonth(workerId, year, month, event) {
        // Create a composite key for month editing
        const monthKey = `month-${year}-${month}`;
        this.editAvailability(workerId, monthKey, event);
    },
    
    editAvailability(workerId, periodKey, event) {
        const popup = document.getElementById('availability-editor');
        const rect = event.target.getBoundingClientRect();
        
        // Store current editing context
        this.state.editingCell = { workerId, periodKey };
        
        // Position popup near clicked cell
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom + 5}px`;
        popup.style.display = 'block';
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', this.closePopup, { once: true });
        }, 100);
    },
    
    closePopup(event) {
        const popup = document.getElementById('availability-editor');
        if (!popup.contains(event.target)) {
            popup.style.display = 'none';
        }
    },
    
    setAvailability(reason) {
        if (!this.state.editingCell) return;
        
        const { workerId, periodKey } = this.state.editingCell;
        const reasonData = this.state.reasons[reason];
        
        // Apply to all days in the period
        this.applyAvailabilityToPeriod(workerId, periodKey, reasonData.value, reason);
        
        // Close popup and re-render
        document.getElementById('availability-editor').style.display = 'none';
        this.saveData();
        this.render();
    },
    
    setCustomAvailability() {
        const input = document.getElementById('custom-availability');
        const value = parseFloat(input.value);
        
        if (isNaN(value) || value < 0 || value > 1) {
            alert('Please enter a value between 0 and 1');
            return;
        }
        
        if (!this.state.editingCell) return;
        
        const { workerId, periodKey } = this.state.editingCell;
        
        // Determine reason based on value
        let reason = 'available';
        if (value === 0) reason = 'elsewhere';
        else if (value < 0.5) reason = 'partial';
        
        this.applyAvailabilityToPeriod(workerId, periodKey, value, reason);
        
        // Close popup and re-render
        document.getElementById('availability-editor').style.display = 'none';
        this.saveData();
        this.render();
    },
    
    applyAvailabilityToPeriod(workerId, periodKey, value, reason) {
        // Parse the period key to determine what to update
        if (periodKey.includes('-') && periodKey.split('-').length === 3 && 
            !isNaN(periodKey.split('-')[0]) && periodKey.split('-')[0].length === 4) {
            // Date key format: YYYY-MM-DD
            if (!this.state.availabilityData[workerId]) {
                this.state.availabilityData[workerId] = {};
            }
            this.state.availabilityData[workerId][periodKey] = { value, reason };
        } else if (periodKey.startsWith('week-')) {
            // Week format: week-YYYY-M-W
            const parts = periodKey.split('-');
            const year = parseInt(parts[1]);
            const month = parseInt(parts[2]);
            const week = parseInt(parts[3]);
            const days = this.getDaysInWeek(year, month, week);
            
            days.forEach(day => {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                if (!this.state.availabilityData[workerId]) {
                    this.state.availabilityData[workerId] = {};
                }
                this.state.availabilityData[workerId][dateKey] = { value, reason };
            });
        } else if (periodKey.startsWith('month-')) {
            // Month format: month-YYYY-M
            const parts = periodKey.split('-');
            const year = parseInt(parts[1]);
            const month = parseInt(parts[2]);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                if (!this.state.availabilityData[workerId]) {
                    this.state.availabilityData[workerId] = {};
                }
                // Only apply to weekdays for month-level changes if setting available
                const dayOfWeek = date.getDay();
                if (reason === 'available' && (dayOfWeek === 0 || dayOfWeek === 6)) {
                    // Keep weekends as unavailable when bulk setting to available
                    this.state.availabilityData[workerId][dateKey] = { value: 0, reason: 'weekend' };
                } else {
                    this.state.availabilityData[workerId][dateKey] = { value, reason };
                }
            }
        }
    },
    
    showAddWorker() {
        document.getElementById('worker-modal').style.display = 'flex';
    },
    
    closeModal() {
        document.getElementById('worker-modal').style.display = 'none';
    },
    
    addWorker() {
        const name = document.getElementById('worker-name').value.trim();
        const department = document.getElementById('worker-department').value.trim();
        const role = document.getElementById('worker-role').value.trim();
        
        if (!name) {
            alert('Please enter a worker name');
            return;
        }
        
        const newWorker = {
            id: `w${Date.now()}`,
            name: name,
            department: department || 'General',
            role: role || 'Worker'
        };
        
        this.state.workers.push(newWorker);
        
        // Initialize availability for new worker
        this.initializeWorkerAvailability(newWorker.id);
        
        // Save and re-render
        this.saveWorkers();
        this.saveData();
        this.closeModal();
        this.render();
        
        // Clear form
        document.getElementById('worker-name').value = '';
        document.getElementById('worker-department').value = '';
        document.getElementById('worker-role').value = '';
    },
    
    initializeWorkerAvailability(workerId) {
        this.state.availabilityData[workerId] = {};
        const year = this.state.currentYear;
        
        // Initialize for current year
        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();
                const dateKey = this.getDateKey(date);
                
                // Default: Available Mon-Fri (1), Weekend off (0)
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    this.state.availabilityData[workerId][dateKey] = {
                        value: 0,
                        reason: 'weekend'
                    };
                } else {
                    this.state.availabilityData[workerId][dateKey] = {
                        value: 1,
                        reason: 'available'
                    };
                }
            }
        }
    },
    
    removeWorker(workerId) {
        if (confirm('Are you sure you want to remove this worker?')) {
            this.state.workers = this.state.workers.filter(w => w.id !== workerId);
            delete this.state.availabilityData[workerId];
            
            this.saveWorkers();
            this.saveData();
            this.render();
        }
    },
    
    saveWorkers() {
        localStorage.setItem('workforceWorkers', JSON.stringify(this.state.workers));
    },
    
    saveData() {
        localStorage.setItem('workforceAvailability', JSON.stringify(this.state.availabilityData));
    },
    
    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            workers: this.state.workers,
            availability: this.state.availabilityData,
            period: {
                year: this.state.currentYear,
                month: this.state.currentMonth,
                view: this.state.currentView
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workforce_availability_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },
    
    bindEvents() {
        // Close popups on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('availability-editor').style.display = 'none';
                document.getElementById('worker-modal').style.display = 'none';
            }
        });
    }
};

// Expose to global scope
window.WorkforceAvailability = WorkforceAvailability;
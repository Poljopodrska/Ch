// Workforce Availability Module - V2 (Matching Production Planning Structure)
const WorkforceAvailability = {
    VERSION: '2.0.0',
    
    state: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(),
        expandedMonths: new Set(),  // Store as "month-N" where N is 0-11
        expandedWeeks: new Set(),   // Store as "week-M-W" where M is month, W is week
        workers: [],
        availabilityData: {},
        editingCell: null,
        reasons: {
            available: { value: 1.0, label: 'Available', color: '#27ae60' },
            holiday: { value: 0, label: 'Holiday', color: '#e74c3c' },
            sick: { value: 0, label: 'Sick Leave', color: '#e67e22' },
            training: { value: 0.5, label: 'Training', color: '#f39c12' },
            meeting: { value: 0.7, label: 'Meetings', color: 'var(--ch-primary)' },
            partial: { value: 0.5, label: 'Partial', color: 'var(--ch-primary-dark)' },
            elsewhere: { value: 0, label: 'Elsewhere', color: '#95a5a6' },
            weekend: { value: 0, label: 'Weekend', color: '#34495e' }
        }
    },
    
    init() {
        console.log(`Workforce Availability Module V${this.VERSION} initializing...`);
        this.loadData();
        this.render();
        console.log('Workforce module initialized');
    },
    
    loadData() {
        // Load from localStorage
        const savedWorkers = localStorage.getItem('workforceWorkers');
        const savedAvailability = localStorage.getItem('workforceAvailability');
        const savedExpanded = localStorage.getItem('workforceExpanded');
        
        if (savedWorkers) {
            this.state.workers = JSON.parse(savedWorkers);
        } else {
            // Default workers
            this.state.workers = [
                { id: 'w1', name: 'Janez Novak', department: 'Production', role: 'Operator' },
                { id: 'w2', name: 'Marija Kranjc', department: 'Production', role: 'Supervisor' },
                { id: 'w3', name: 'Peter Horvat', department: 'Quality', role: 'Inspector' },
                { id: 'w4', name: 'Ana Potočnik', department: 'Packaging', role: 'Operator' },
                { id: 'w5', name: 'Miha Zupan', department: 'Logistics', role: 'Coordinator' }
            ];
        }
        
        if (savedAvailability) {
            this.state.availabilityData = JSON.parse(savedAvailability);
        } else {
            this.initializeDefaultAvailability();
        }
        
        if (savedExpanded) {
            const expanded = JSON.parse(savedExpanded);
            this.state.expandedMonths = new Set(expanded.months || []);
            this.state.expandedWeeks = new Set(expanded.weeks || []);
        }
    },
    
    initializeDefaultAvailability() {
        this.state.availabilityData = {};
        
        // Initialize with Mon-Fri availability for all workers
        this.state.workers.forEach(worker => {
            this.state.availabilityData[worker.id] = {};
            
            // Set availability for the whole year
            const year = this.state.currentYear;
            for (let month = 0; month < 12; month++) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dayOfWeek = date.getDay();
                    const dateKey = this.getDateKey(date);
                    
                    // Monday-Friday: available, Weekend: not available
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        this.state.availabilityData[worker.id][dateKey] = {
                            value: 0,
                            reason: 'weekend'
                        };
                    } else {
                        this.state.availabilityData[worker.id][dateKey] = {
                            value: 1.0,
                            reason: 'available'
                        };
                    }
                }
            }
        });
    },
    
    render() {
        const container = document.getElementById('workforce-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="workforce-module">
                <div class="module-header">
                    <h2>[Users] Workforce Availability</h2>
                    <div class="header-controls">
                        <button onclick="WorkforceAvailability.addWorker()">➕ Add Worker</button>
                        <button onclick="WorkforceAvailability.exportData()">[Download] Export</button>
                        <button onclick="WorkforceAvailability.resetView()">[Refresh] Reset View</button>
                    </div>
                </div>
                
                <div class="workforce-legend">
                    ${this.renderLegend()}
                </div>
                
                <div class="workforce-grid">
                    ${this.renderGrid()}
                </div>
                
                <!-- Availability Editor Popup -->
                <div id="availability-editor" class="availability-popup" style="display: none;">
                    <div class="popup-content">
                        <h4>Set Availability</h4>
                        <div class="availability-options">
                            ${Object.entries(this.state.reasons).map(([key, reason]) => `
                                <button class="reason-btn" 
                                        style="background: ${reason.color}; color: white;"
                                        onclick="WorkforceAvailability.setAvailability('${key}')">
                                    ${reason.label} (${reason.value})
                                </button>
                            `).join('')}
                        </div>
                        <div class="custom-value">
                            <input type="number" id="custom-availability" 
                                   min="0" max="1" step="0.1" placeholder="Custom (0-1)">
                            <button onclick="WorkforceAvailability.setCustomAvailability()">Set</button>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.getStyles()}
        `;
    },
    
    getStyles() {
        return `
            <style>
                .workforce-module {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .module-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .module-header h2 {
                    margin: 0 0 10px 0;
                }
                
                .header-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .header-controls button {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .header-controls button:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .workforce-legend {
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
                    align-items: center;
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
                    overflow-x: auto;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .workforce-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1400px;
                }
                
                .workforce-table th {
                    background: #2c3e50;
                    color: white;
                    padding: 8px 4px;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid #34495e;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    font-size: 12px;
                }
                
                .workforce-table th.worker-header {
                    text-align: left;
                    min-width: 200px;
                    background: #34495e;
                    padding: 8px;
                }
                
                /* Month headers - exactly like Production Planning */
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
                    background: var(--ch-primary) !important;
                    font-size: 11px;
                    cursor: pointer;
                }
                
                .week-header:hover {
                    background: var(--ch-primary) !important;
                }
                
                .day-header {
                    background: var(--ch-primary-pale) !important;
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
                
                .workforce-table td {
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    text-align: center;
                    min-width: 50px;
                    font-size: 12px;
                }
                
                .worker-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 5px;
                }
                
                .worker-details {
                    text-align: left;
                }
                
                .worker-name {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .worker-role {
                    font-size: 11px;
                    color: #7f8c8d;
                }
                
                .btn-remove {
                    padding: 4px 8px;
                    background: var(--ch-error);
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                }
                
                .availability-cell {
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                
                .availability-cell:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    z-index: 5;
                    position: relative;
                }
                
                .summary-row {
                    background: var(--ch-gray-100);
                    font-weight: bold;
                }
                
                .availability-popup {
                    position: fixed;
                    background: white;
                    border: 2px solid var(--ch-primary);
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 1000;
                }
                
                .popup-content h4 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                }
                
                .availability-options {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    margin-bottom: 10px;
                }
                
                .reason-btn {
                    padding: 8px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .custom-value {
                    display: flex;
                    gap: 5px;
                }
                
                .custom-value input {
                    flex: 1;
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                }
                
                .custom-value button {
                    padding: 5px 10px;
                    background: var(--ch-primary);
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
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
    
    // Render headers exactly like Production Planning
    renderHeaders() {
        let monthHeaders = '<tr><th class="worker-header" rowspan="2">Worker</th>';
        let subHeaders = '<tr>';
        
        // Build month headers with potential expansion
        for (let month = 0; month < 12; month++) {
            const monthKey = `month-${month}`;
            const isExpanded = this.state.expandedMonths.has(monthKey);
            const monthName = new Date(this.state.currentYear, month, 1).toLocaleString('default', { month: 'short' });
            
            if (isExpanded) {
                // Show weeks for this month
                const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                monthHeaders += `
                    <th class="month-header" colspan="${weeksInMonth}" 
                        onclick="WorkforceAvailability.toggleMonth('${monthKey}')">
                        <span class="expand-icon expanded">▶</span>
                        ${monthName}
                    </th>
                `;
                
                // Add week sub-headers
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${month}-${w}`;
                    const weekExpanded = this.state.expandedWeeks.has(weekKey);
                    
                    if (weekExpanded) {
                        // Show days for this week
                        const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, w);
                        subHeaders += `
                            <th class="week-header" colspan="${daysInWeek.length}"
                                onclick="WorkforceAvailability.toggleWeek('${weekKey}')">
                                <span class="expand-icon expanded">▶</span>W${w + 1}
                            </th>
                        `;
                    } else {
                        subHeaders += `
                            <th class="week-header" 
                                onclick="WorkforceAvailability.toggleWeek('${weekKey}')">
                                <span class="expand-icon">▶</span>W${w + 1}
                            </th>
                        `;
                    }
                }
            } else {
                monthHeaders += `
                    <th class="month-header" 
                        onclick="WorkforceAvailability.toggleMonth('${monthKey}')">
                        <span class="expand-icon">▶</span>
                        ${monthName}
                    </th>
                `;
                subHeaders += '<th>-</th>';
            }
        }
        
        monthHeaders += '<th rowspan="2">Total</th></tr>';
        subHeaders += '</tr>';
        
        // Add day headers if any week is expanded
        let dayHeaders = '';
        if ([...this.state.expandedWeeks].length > 0) {
            dayHeaders = '<tr><th></th>';
            
            for (let month = 0; month < 12; month++) {
                const monthKey = `month-${month}`;
                if (this.state.expandedMonths.has(monthKey)) {
                    const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                    for (let w = 0; w < weeksInMonth; w++) {
                        const weekKey = `week-${month}-${w}`;
                        if (this.state.expandedWeeks.has(weekKey)) {
                            const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, w);
                            daysInWeek.forEach(day => {
                                const date = new Date(this.state.currentYear, month, day);
                                const dayName = date.toLocaleString('default', { weekday: 'short' });
                                const weekendClass = WeekUtils.isWeekend(date) ? 'weekend' : '';
                                dayHeaders += `<th class="day-header ${weekendClass}">${day}<br>${dayName.substr(0, 2)}</th>`;
                            });
                        } else {
                            dayHeaders += '<th>-</th>';
                        }
                    }
                } else {
                    dayHeaders += '<th>-</th>';
                }
            }
            
            dayHeaders += '<th>-</th></tr>';
        }
        
        return '<thead>' + monthHeaders + subHeaders + dayHeaders + '</thead>';
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
        
        // Render cells based on expansion state
        for (let month = 0; month < 12; month++) {
            const monthKey = `month-${month}`;
            if (this.state.expandedMonths.has(monthKey)) {
                // Month is expanded - show weeks
                const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${month}-${w}`;
                    if (this.state.expandedWeeks.has(weekKey)) {
                        // Week is expanded - show days
                        const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, w);
                        daysInWeek.forEach(day => {
                            const date = new Date(this.state.currentYear, month, day);
                            const dateKey = this.getDateKey(date);
                            const data = this.state.availabilityData[worker.id] ? 
                                        this.state.availabilityData[worker.id][dateKey] : null;
                            const value = data ? data.value : 0;
                            const reason = data ? data.reason : 'available';
                            const reasonData = this.state.reasons[reason] || this.state.reasons.available;
                            
                            totalAvailable += value;
                            
                            const weekendClass = WeekUtils.isWeekend(date) ? 'weekend-cell' : '';
                            
                            html += `
                                <td class="availability-cell day-cell ${weekendClass}" 
                                    style="background: ${this.getColorForValue(value, reasonData.color)}; 
                                           color: ${value > 0.5 ? 'white' : '#2c3e50'};"
                                    onclick="WorkforceAvailability.editAvailability('${worker.id}', '${dateKey}', event)"
                                    title="${reasonData.label}">
                                    ${value.toFixed(1)}
                                </td>
                            `;
                        });
                    } else {
                        // Week not expanded - show week sum
                        const weekValue = this.getWeekSum(worker.id, this.state.currentYear, month, w);
                        totalAvailable += weekValue;
                        
                        // For coloring, calculate the average for visual representation
                        const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, w).length;
                        const avgValue = weekValue / daysInWeek;
                        
                        html += `
                            <td class="availability-cell week-cell" 
                                style="background: ${this.getColorForValue(avgValue, 'var(--ch-primary)')}; 
                                       color: ${avgValue > 0.5 ? 'white' : '#2c3e50'};"
                                onclick="WorkforceAvailability.editWeek('${worker.id}', ${this.state.currentYear}, ${month}, ${w}, event)">
                                ${weekValue.toFixed(1)}
                            </td>
                        `;
                    }
                }
            } else {
                // Month not expanded - show month sum
                const monthValue = this.getMonthSum(worker.id, this.state.currentYear, month);
                totalAvailable += monthValue;
                
                // For coloring, calculate the average for visual representation
                const daysInMonth = new Date(this.state.currentYear, month + 1, 0).getDate();
                const avgValue = monthValue / daysInMonth;
                
                html += `
                    <td class="availability-cell month-cell" 
                        style="background: ${this.getColorForValue(avgValue, 'var(--ch-primary-dark)')}; 
                               color: ${avgValue > 0.5 ? 'white' : '#2c3e50'};"
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
            const monthKey = `month-${month}`;
            if (this.state.expandedMonths.has(monthKey)) {
                const weeksInMonth = this.getWeeksInMonth(this.state.currentYear, month);
                for (let w = 0; w < weeksInMonth; w++) {
                    const weekKey = `week-${month}-${w}`;
                    if (this.state.expandedWeeks.has(weekKey)) {
                        const daysInWeek = this.getDaysInWeek(this.state.currentYear, month, w);
                        daysInWeek.forEach(day => {
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
    
    // Toggle functions exactly like Production Planning
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
        this.saveData();
        this.render();
    },
    
    toggleWeek(weekKey) {
        if (this.state.expandedWeeks.has(weekKey)) {
            this.state.expandedWeeks.delete(weekKey);
        } else {
            this.state.expandedWeeks.add(weekKey);
        }
        this.saveData();
        this.render();
    },
    
    // Helper functions
    getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Simple calculation: divide month into weeks
        return Math.ceil(daysInMonth / 7);
    },
    
    getDaysInWeek(year, month, week) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = week * 7 + 1;
        const endDay = Math.min(startDay + 6, daysInMonth);
        
        const days = [];
        for (let d = startDay; d <= endDay; d++) {
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
    
    getDayName(dayOfWeek) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dayOfWeek];
    },
    
    getColorForValue(value, baseColor) {
        // Adjust opacity based on value
        if (value === 0) return '#ecf0f1';
        if (value === 1) return baseColor;
        
        // For partial values, lighten the color
        const opacity = 0.3 + (value * 0.7);
        return baseColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    },
    
    // Compatibility aliases (keep old names for any existing references)
    getMonthAverage(workerId, year, month) {
        return this.getMonthSum(workerId, year, month);
    },
    
    getWeekAverage(workerId, year, month, week) {
        return this.getWeekSum(workerId, year, month, week);
    },
    
    getMonthSum(workerId, year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let total = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const data = this.state.availabilityData[workerId] ? 
                        this.state.availabilityData[workerId][dateKey] : null;
            if (data) {
                total += data.value;
            }
        }
        
        return total;
    },
    
    getWeekSum(workerId, year, month, week) {
        const days = this.getDaysInWeek(year, month, week);
        let total = 0;
        
        days.forEach(day => {
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const data = this.state.availabilityData[workerId] ? 
                        this.state.availabilityData[workerId][dateKey] : null;
            if (data) {
                total += data.value;
            }
        });
        
        return total;
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
        
        return total; // Return sum, not average
    },
    
    getMonthTotal(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let total = 0;
        
        this.state.workers.forEach(worker => {
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateKey = this.getDateKey(date);
                const data = this.state.availabilityData[worker.id] ? 
                            this.state.availabilityData[worker.id][dateKey] : null;
                if (data) {
                    total += data.value;
                }
            }
        });
        
        return total; // Return sum, not average
    },
    
    editWeek(workerId, year, month, week, event) {
        const weekKey = `week-${month}-${week}`;
        this.editAvailability(workerId, weekKey, event);
    },
    
    editMonth(workerId, year, month, event) {
        const monthKey = `month-${month}`;
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
            // Week format: week-M-W
            const parts = periodKey.split('-');
            const month = parseInt(parts[1]);
            const week = parseInt(parts[2]);
            const days = this.getDaysInWeek(this.state.currentYear, month, week);
            
            days.forEach(day => {
                const date = new Date(this.state.currentYear, month, day);
                const dateKey = this.getDateKey(date);
                if (!this.state.availabilityData[workerId]) {
                    this.state.availabilityData[workerId] = {};
                }
                this.state.availabilityData[workerId][dateKey] = { value, reason };
            });
        } else if (periodKey.startsWith('month-')) {
            // Month format: month-M
            const parts = periodKey.split('-');
            const month = parseInt(parts[1]);
            const daysInMonth = new Date(this.state.currentYear, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(this.state.currentYear, month, day);
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
    
    addWorker() {
        const name = prompt('Enter worker name:');
        if (!name) return;
        
        const department = prompt('Enter department:') || 'Production';
        const role = prompt('Enter role:') || 'Operator';
        
        const newWorker = {
            id: 'w' + Date.now(),
            name: name,
            department: department,
            role: role
        };
        
        this.state.workers.push(newWorker);
        
        // Initialize availability for new worker
        this.state.availabilityData[newWorker.id] = {};
        const year = this.state.currentYear;
        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();
                const dateKey = this.getDateKey(date);
                
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    this.state.availabilityData[newWorker.id][dateKey] = {
                        value: 0,
                        reason: 'weekend'
                    };
                } else {
                    this.state.availabilityData[newWorker.id][dateKey] = {
                        value: 1.0,
                        reason: 'available'
                    };
                }
            }
        }
        
        this.saveData();
        this.render();
    },
    
    removeWorker(workerId) {
        if (!confirm('Are you sure you want to remove this worker?')) return;
        
        this.state.workers = this.state.workers.filter(w => w.id !== workerId);
        delete this.state.availabilityData[workerId];
        
        this.saveData();
        this.render();
    },
    
    resetView() {
        this.state.expandedMonths.clear();
        this.state.expandedWeeks.clear();
        this.saveData();
        this.render();
    },
    
    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            year: this.state.currentYear,
            workers: this.state.workers,
            availability: this.state.availabilityData
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workforce_availability_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },
    
    saveData() {
        localStorage.setItem('workforceWorkers', JSON.stringify(this.state.workers));
        localStorage.setItem('workforceAvailability', JSON.stringify(this.state.availabilityData));
        localStorage.setItem('workforceExpanded', JSON.stringify({
            months: [...this.state.expandedMonths],
            weeks: [...this.state.expandedWeeks]
        }));
    }
};

// Export for use
window.WorkforceAvailability = WorkforceAvailability;
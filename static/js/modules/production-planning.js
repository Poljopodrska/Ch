// Production Planning Module with Multi-Level BOM and Yield Tracking
const ProductionPlanning = {
    bomData: null,
    requirementsCalculated: false,
    currentView: 'bom-tree',
    
    // Initialize the module
    async init() {
        console.log('Production Planning module initializing...');
        try {
            await this.loadBOMData();
            this.setupEventHandlers();
            this.renderCurrentView();
            console.log('Production Planning module initialized successfully');
        } catch (error) {
            console.error('Error initializing Production Planning:', error);
        }
    },
    
    // Load BOM data
    async loadBOMData() {
        try {
            const response = await fetch('data/bom.json');
            this.bomData = await response.json();
            console.log('BOM data loaded:', this.bomData);
        } catch (error) {
            console.error('Error loading BOM data:', error);
            // Fallback to empty structure
            this.bomData = {
                bom_items: [],
                bom_relationships: [],
                production_requirements: [],
                production_orders: []
            };
        }
    },
    
    // Setup event handlers
    setupEventHandlers() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]')) {
                this.switchView(e.target.dataset.view);
            }
        });
    },
    
    // Switch between views
    switchView(viewName) {
        this.currentView = viewName;
        
        // Update active tab
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });
        
        this.renderCurrentView();
    },
    
    // Render the current view
    renderCurrentView() {
        const container = document.getElementById('production-content');
        if (!container) return;
        
        switch (this.currentView) {
            case 'bom-tree':
                container.innerHTML = this.renderBOMTreeView();
                break;
            case 'requirements':
                container.innerHTML = this.renderRequirementsView();
                break;
            case 'timeline':
                container.innerHTML = this.renderTimelineView();
                break;
            case 'editor':
                container.innerHTML = this.renderEditorView();
                break;
            default:
                container.innerHTML = this.renderBOMTreeView();
        }
        
        // Initialize view-specific functionality
        this.initializeCurrentView();
    },
    
    // Initialize view-specific features
    initializeCurrentView() {
        switch (this.currentView) {
            case 'bom-tree':
                this.renderBOMTrees();
                break;
            case 'requirements':
                this.calculateAndDisplayRequirements();
                break;
            case 'timeline':
                this.renderProductionTimeline();
                break;
        }
    },
    
    // Render BOM Tree View
    renderBOMTreeView() {
        return `
            <div class="bom-tree-container">
                <div class="view-header">
                    <h3>Bill of Materials Structure</h3>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="ProductionPlanning.calculateRequirements()">
                            <span class="icon">🧮</span> Calculate Requirements
                        </button>
                        <button class="btn btn-secondary" onclick="ProductionPlanning.expandAllNodes()">
                            <span class="icon">📂</span> Expand All
                        </button>
                        <button class="btn btn-secondary" onclick="ProductionPlanning.collapseAllNodes()">
                            <span class="icon">📁</span> Collapse All
                        </button>
                    </div>
                </div>
                
                <div class="bom-trees-grid" id="bom-trees">
                    <!-- BOM trees will be rendered here -->
                </div>
            </div>
        `;
    },
    
    // Render Requirements View
    renderRequirementsView() {
        return `
            <div class="requirements-container">
                <div class="view-header">
                    <h3>Production Requirements vs Inventory</h3>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="ProductionPlanning.calculateRequirements()">
                            <span class="icon">🔄</span> Recalculate
                        </button>
                        <button class="btn btn-secondary" onclick="ProductionPlanning.exportRequirements()">
                            <span class="icon">📊</span> Export
                        </button>
                    </div>
                </div>
                
                <div class="requirements-summary" id="requirements-summary">
                    <!-- Summary will be rendered here -->
                </div>
                
                <div class="requirements-table-container">
                    <table class="requirements-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Required Date</th>
                                <th>Required Qty</th>
                                <th>Current Stock</th>
                                <th>Net Need</th>
                                <th>Start Production</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="requirements-list">
                            <!-- Requirements will be rendered here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // Render Timeline View
    renderTimelineView() {
        return `
            <div class="timeline-container">
                <div class="view-header">
                    <h3>Production Timeline</h3>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="ProductionPlanning.generateTimeline()">
                            <span class="icon">📅</span> Generate Timeline
                        </button>
                        <button class="btn btn-secondary" onclick="ProductionPlanning.optimizeSchedule()">
                            <span class="icon">⚡</span> Optimize
                        </button>
                    </div>
                </div>
                
                <div class="timeline-controls">
                    <div class="control-group">
                        <label>Time Range:</label>
                        <input type="date" id="timeline-start" value="${this.getDateString(new Date())}">
                        <span>to</span>
                        <input type="date" id="timeline-end" value="${this.getDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}">
                    </div>
                    <div class="control-group">
                        <label>View:</label>
                        <select id="timeline-granularity">
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="hours">Hours</option>
                        </select>
                    </div>
                </div>
                
                <div class="timeline-view" id="production-timeline">
                    <!-- Timeline will be rendered here -->
                </div>
            </div>
        `;
    },
    
    // Render Editor View
    renderEditorView() {
        return `
            <div class="editor-container">
                <div class="view-header">
                    <h3>BOM Editor</h3>
                    <div class="view-actions">
                        <button class="btn btn-primary" onclick="ProductionPlanning.addNewItem()">
                            <span class="icon">➕</span> Add Item
                        </button>
                        <button class="btn btn-secondary" onclick="ProductionPlanning.saveBOM()">
                            <span class="icon">💾</span> Save BOM
                        </button>
                    </div>
                </div>
                
                <div class="editor-grid">
                    <div class="items-panel">
                        <h4>Items</h4>
                        <div id="items-list">
                            <!-- Items list will be rendered here -->
                        </div>
                    </div>
                    
                    <div class="relationships-panel">
                        <h4>Relationships</h4>
                        <div id="relationships-form">
                            <!-- Relationship editor will be rendered here -->
                        </div>
                    </div>
                    
                    <div class="visual-editor">
                        <h4>Visual Editor</h4>
                        <div id="visual-bom-editor">
                            <!-- Visual BOM editor will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render BOM trees for all finished products
    renderBOMTrees() {
        const container = document.getElementById('bom-trees');
        if (!container) return;
        
        const finishedProducts = this.bomData.bom_items.filter(item => item.item_type === 'finished');
        
        container.innerHTML = finishedProducts.map(product => `
            <div class="bom-tree-card">
                <div class="tree-header">
                    <h4>${product.item_name} (${product.item_code})</h4>
                    <span class="inventory-badge">Stock: ${product.current_inventory} ${product.unit_type}</span>
                </div>
                <div class="bom-tree">
                    ${this.renderBOMTree(product.id, 0)}
                </div>
            </div>
        `).join('');
    },
    
    // Render a single BOM tree recursively
    renderBOMTree(itemId, level = 0, processedItems = new Set()) {
        // Prevent infinite loops
        if (processedItems.has(itemId)) {
            return '<div class="bom-cycle">⚠️ Circular reference detected</div>';
        }
        
        const newProcessedItems = new Set(processedItems);
        newProcessedItems.add(itemId);
        
        const item = this.getBOMItem(itemId);
        if (!item) return '';
        
        const children = this.getChildRelationships(itemId);
        const hasChildren = children.length > 0;
        
        return `
            <div class="bom-node level-${level}" data-item-id="${itemId}">
                <div class="bom-item ${hasChildren ? 'expandable' : ''}" onclick="ProductionPlanning.toggleNode(this)">
                    <div class="item-info">
                        <span class="item-name">${item.item_name}</span>
                        <span class="item-code">(${item.item_code})</span>
                        <span class="item-type badge badge-${item.item_type}">${item.item_type}</span>
                    </div>
                    <div class="item-details">
                        <span class="inventory">📦 ${item.current_inventory} ${item.unit_type}</span>
                        <span class="safety-stock">🛡️ ${item.safety_stock} ${item.unit_type}</span>
                    </div>
                    ${hasChildren ? '<span class="expand-icon">▼</span>' : ''}
                </div>
                
                ${hasChildren ? `
                    <div class="bom-children">
                        ${children.map(relationship => {
                            const childItem = this.getBOMItem(relationship.child_id);
                            return `
                                <div class="bom-relationship">
                                    <div class="relationship-info">
                                        <span class="quantity">${relationship.quantity_required} ${childItem?.unit_type || ''}</span>
                                        <span class="yield">→ ${relationship.yield_percentage}% yield</span>
                                        <span class="proportion">(${relationship.proportion_percentage}%)</span>
                                        <span class="time">⏱️ ${relationship.production_time_hours}h</span>
                                    </div>
                                    ${this.renderBOMTree(relationship.child_id, level + 1, newProcessedItems)}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    // Calculate production requirements using BOM explosion
    calculateRequirements() {
        console.log('Calculating production requirements...');
        
        const requirements = new Map();
        const productionOrders = [];
        
        // Process each production requirement
        this.bomData.production_requirements.forEach(req => {
            this.explodeBOM(
                req.item_id,
                req.required_quantity,
                new Date(req.required_date),
                requirements,
                productionOrders,
                0
            );
        });
        
        this.calculatedRequirements = Array.from(requirements.values());
        this.calculatedOrders = productionOrders;
        this.requirementsCalculated = true;
        
        console.log('Requirements calculated:', this.calculatedRequirements);
        console.log('Production orders:', this.calculatedOrders);
        
        // Update UI if we're in requirements view
        if (this.currentView === 'requirements') {
            this.displayCalculatedRequirements();
        }
        
        return this.calculatedRequirements;
    },
    
    // Explode BOM recursively to calculate material requirements
    explodeBOM(itemId, quantity, requiredDate, requirements, orders, level = 0) {
        const item = this.getBOMItem(itemId);
        if (!item) return;
        
        const children = this.getChildRelationships(itemId);
        
        // If this is a raw material (no children), add to requirements
        if (children.length === 0) {
            const key = `${itemId}-${requiredDate.toISOString()}`;
            if (requirements.has(key)) {
                requirements.get(key).required_quantity += quantity;
            } else {
                requirements.set(key, {
                    item_id: itemId,
                    item: item,
                    required_date: requiredDate,
                    required_quantity: quantity,
                    current_inventory: item.current_inventory,
                    safety_stock: item.safety_stock,
                    net_need: Math.max(0, quantity + item.safety_stock - item.current_inventory),
                    level: level
                });
            }
            return;
        }
        
        // Process each child relationship
        children.forEach(relationship => {
            const childItem = this.getBOMItem(relationship.child_id);
            if (!childItem) return;
            
            // Calculate required quantity considering yield loss
            const requiredFromChild = (quantity * relationship.quantity_required) / (relationship.yield_percentage / 100);
            
            // Calculate when to start production (subtract production time)
            const startDate = this.subtractWorkingDays(requiredDate, Math.ceil(relationship.production_time_hours / 8));
            
            // Add production order
            orders.push({
                item_id: itemId,
                item: item,
                child_id: relationship.child_id,
                child_item: childItem,
                start_date: startDate,
                completion_date: requiredDate,
                quantity: quantity,
                production_time_hours: relationship.production_time_hours,
                yield_percentage: relationship.yield_percentage,
                level: level
            });
            
            // Recursively explode child BOM
            this.explodeBOM(
                relationship.child_id,
                requiredFromChild,
                startDate,
                requirements,
                orders,
                level + 1
            );
        });
    },
    
    // Display calculated requirements in the table
    displayCalculatedRequirements() {
        const tbody = document.getElementById('requirements-list');
        if (!tbody || !this.calculatedRequirements) return;
        
        tbody.innerHTML = this.calculatedRequirements
            .sort((a, b) => new Date(a.required_date) - new Date(b.required_date))
            .map(req => {
                const statusClass = req.net_need > 0 ? 'shortage' : 'sufficient';
                const statusText = req.net_need > 0 ? 'Need Production' : 'Sufficient Stock';
                
                return `
                    <tr class="requirement-row ${statusClass}">
                        <td>
                            <div class="item-cell">
                                <strong>${req.item.item_name}</strong>
                                <small>${req.item.item_code}</small>
                            </div>
                        </td>
                        <td><span class="badge badge-${req.item.item_type}">${req.item.item_type}</span></td>
                        <td>${this.formatDate(req.required_date)}</td>
                        <td class="number">${req.required_quantity.toFixed(4)} ${req.item.unit_type}</td>
                        <td class="number">${req.current_inventory.toFixed(4)} ${req.item.unit_type}</td>
                        <td class="number ${req.net_need > 0 ? 'negative' : 'positive'}">
                            ${req.net_need > 0 ? req.net_need.toFixed(4) : '0.0000'} ${req.item.unit_type}
                        </td>
                        <td>${this.calculateStartDate(req.required_date, req.item)}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    </tr>
                `;
            }).join('');
        
        this.updateRequirementsSummary();
    },
    
    // Update requirements summary
    updateRequirementsSummary() {
        const container = document.getElementById('requirements-summary');
        if (!container || !this.calculatedRequirements) return;
        
        const totalItems = this.calculatedRequirements.length;
        const shortageItems = this.calculatedRequirements.filter(req => req.net_need > 0).length;
        const sufficientItems = totalItems - shortageItems;
        
        container.innerHTML = `
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-value">${totalItems}</div>
                    <div class="summary-label">Total Items</div>
                </div>
                <div class="summary-card shortage">
                    <div class="summary-value">${shortageItems}</div>
                    <div class="summary-label">Need Production</div>
                </div>
                <div class="summary-card sufficient">
                    <div class="summary-value">${sufficientItems}</div>
                    <div class="summary-label">Sufficient Stock</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${Math.round((sufficientItems / totalItems) * 100)}%</div>
                    <div class="summary-label">Stock Coverage</div>
                </div>
            </div>
        `;
    },
    
    // Helper functions
    getBOMItem(itemId) {
        return this.bomData.bom_items.find(item => item.id === itemId);
    },
    
    getChildRelationships(parentId) {
        return this.bomData.bom_relationships.filter(rel => rel.parent_id === parentId);
    },
    
    getParentRelationships(childId) {
        return this.bomData.bom_relationships.filter(rel => rel.child_id === childId);
    },
    
    subtractWorkingDays(date, days) {
        const result = new Date(date);
        let remainingDays = days;
        
        while (remainingDays > 0) {
            result.setDate(result.getDate() - 1);
            // Skip weekends (Saturday = 6, Sunday = 0)
            if (result.getDay() !== 0 && result.getDay() !== 6) {
                remainingDays--;
            }
        }
        
        return result;
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US');
    },
    
    getDateString(date) {
        return date.toISOString().split('T')[0];
    },
    
    calculateStartDate(requiredDate, item) {
        // Simple calculation - in real implementation, would consider production time
        const startDate = this.subtractWorkingDays(new Date(requiredDate), 2);
        return this.formatDate(startDate);
    },
    
    // UI Event Handlers
    toggleNode(element) {
        const node = element.closest('.bom-node');
        const children = node.querySelector('.bom-children');
        const icon = element.querySelector('.expand-icon');
        
        if (children) {
            const isExpanded = children.style.display !== 'none';
            children.style.display = isExpanded ? 'none' : 'block';
            icon.textContent = isExpanded ? '▶' : '▼';
        }
    },
    
    expandAllNodes() {
        document.querySelectorAll('.bom-children').forEach(children => {
            children.style.display = 'block';
        });
        document.querySelectorAll('.expand-icon').forEach(icon => {
            icon.textContent = '▼';
        });
    },
    
    collapseAllNodes() {
        document.querySelectorAll('.bom-children').forEach(children => {
            children.style.display = 'none';
        });
        document.querySelectorAll('.expand-icon').forEach(icon => {
            icon.textContent = '▶';
        });
    },
    
    calculateAndDisplayRequirements() {
        this.calculateRequirements();
        this.displayCalculatedRequirements();
    },
    
    // Placeholder methods for timeline and editor functionality
    renderProductionTimeline() {
        console.log('Rendering production timeline...');
        // Implementation will be added in next iteration
    },
    
    generateTimeline() {
        console.log('Generating timeline...');
        // Implementation will be added in next iteration
    },
    
    addNewItem() {
        console.log('Adding new item...');
        // Implementation will be added in next iteration
    },
    
    saveBOM() {
        console.log('Saving BOM...');
        // Implementation will be added in next iteration
    },
    
    exportRequirements() {
        if (!this.calculatedRequirements) {
            alert('Please calculate requirements first');
            return;
        }
        
        // Export as CSV
        const csvContent = this.exportRequirementsAsCSV();
        this.downloadFile(csvContent, 'production_requirements.csv', 'text/csv');
    },
    
    exportRequirementsAsCSV() {
        const headers = ['Item Code', 'Item Name', 'Type', 'Required Date', 'Required Qty', 'Current Stock', 'Net Need', 'Unit'];
        const rows = this.calculatedRequirements.map(req => [
            req.item.item_code,
            req.item.item_name,
            req.item.item_type,
            this.formatDate(req.required_date),
            req.required_quantity.toFixed(4),
            req.current_inventory.toFixed(4),
            req.net_need.toFixed(4),
            req.item.unit_type
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.ProductionPlanning = ProductionPlanning;
}
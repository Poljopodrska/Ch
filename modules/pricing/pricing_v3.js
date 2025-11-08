// Pricing Module V3 - With cost breakdown and coverage visualization
const PricingV3 = {
    VERSION: '3.0.0',
    
    state: {
        expanded: {
            groups: new Set(['fresh', 'processed']),
            subgroups: new Set(),
            customerPricing: new Set() // Track which products have expanded customer view
        },
        products: [],
        productGroups: [],
        pricingData: {},
        editMode: false,
        showCustomerPricing: true
    },
    
    init() {
        try {
            console.log(`Pricing Module V${this.VERSION} initializing...`);
            this.loadProductStructure();
            console.log('Product structure loaded:', this.state.productGroups.length, 'groups');
            this.loadPricingData();
            console.log('Pricing data loaded:', Object.keys(this.state.pricingData).length, 'products');
            this.loadSavedPricingData();
            this.render();
            console.log('Pricing V3 render complete');
        } catch (error) {
            console.error('Error in PricingV3.init:', error);
            console.error('Stack:', error.stack);
        }
    },
    
    loadProductStructure() {
        // Define 2-level product group hierarchy
        this.state.productGroups = [
            {
                id: 'fresh',
                name: 'Sveži izdelki / Fresh Products',
                icon: '[Meat]',
                subgroups: [
                    {
                        id: 'meat',
                        name: 'Sveže meso / Fresh Meat',
                        icon: '[Meat]',
                        products: [
                            { id: 'p001', code: 'SVP-100', name: 'Svinjska plečka', nameEn: 'Pork Shoulder', unit: 'kg' },
                            { id: 'p002', code: 'GOV-200', name: 'Goveji file', nameEn: 'Beef Tenderloin', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'poultry',
                        name: 'Perutnina / Poultry',
                        icon: '[Chicken]',
                        products: [
                            { id: 'p003', code: 'PIŠ-300', name: 'Piščančje prsi', nameEn: 'Chicken Breast', unit: 'kg' },
                            { id: 'p007', code: 'PIŠ-301', name: 'Piščančja bedra', nameEn: 'Chicken Thighs', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'specialty',
                        name: 'Specialitete / Specialty',
                        icon: '🍖',
                        products: [
                            { id: 'p004', code: 'JAG-400', name: 'Jagnječji kotleti', nameEn: 'Lamb Chops', unit: 'kg' },
                            { id: 'p008', code: 'DIV-401', name: 'Divjačinski file', nameEn: 'Venison Fillet', unit: 'kg' }
                        ]
                    }
                ]
            },
            {
                id: 'processed',
                name: 'Predelani izdelki / Processed Products',
                icon: '[Food]',
                subgroups: [
                    {
                        id: 'sausages',
                        name: 'Klobase / Sausages',
                        icon: '[Food]',
                        products: [
                            { id: 'p005', code: 'KLB-500', name: 'Domača klobasa', nameEn: 'Homemade Sausage', unit: 'kg' },
                            { id: 'p009', code: 'KLB-501', name: 'Kranjska klobasa', nameEn: 'Carniolan Sausage', unit: 'kg' },
                            { id: 'p010', code: 'KLB-502', name: 'Čevapčiči', nameEn: 'Cevapcici', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'cured',
                        name: 'Suhomesnati izdelki / Cured Meats',
                        icon: '🥓',
                        products: [
                            { id: 'p006', code: 'SUH-600', name: 'Pršut', nameEn: 'Prosciutto', unit: 'kg' },
                            { id: 'p011', code: 'SUH-601', name: 'Panceta', nameEn: 'Pancetta', unit: 'kg' },
                            { id: 'p012', code: 'SUH-602', name: 'Salama', nameEn: 'Salami', unit: 'kg' }
                        ]
                    }
                ]
            }
        ];
        
        // Flatten products list
        this.state.products = [];
        this.state.productGroups.forEach(group => {
            group.subgroups.forEach(subgroup => {
                this.state.products.push(...subgroup.products);
            });
        });
    },
    
    loadPricingData() {
        // Generate pricing data with cost breakdown for all products
        this.state.products.forEach(product => {
            const base = this.getBaseData(product.id);
            
            this.state.pricingData[product.id] = {
                // Cost breakdown
                productionCost: base.production,
                goh: base.goh,           // General Overheads
                moh: base.moh,           // Marketing Overheads
                loh: base.loh,           // Logistics Overheads
                profit: base.profit,
                
                // Calculated totals
                totalCost: base.production + base.goh + base.moh + base.loh,
                sellingPrice: base.selling,
                
                // Coverage calculation
                coverage: 0,
                coverageDetails: {},
                
                // VAT
                vat: 22,
                priceWithVat: 0
            };
            
            // Calculate coverage and final prices
            this.calculateCoverage(product.id);
        });
    },
    
    getBaseData(productId) {
        const baseData = {
            'p001': { production: 3.0, goh: 0.8, moh: 0.5, loh: 0.4, profit: 1.5, selling: 7.2 },
            'p002': { production: 12.0, goh: 2.5, moh: 1.8, loh: 1.2, profit: 4.0, selling: 28.5 },
            'p003': { production: 3.8, goh: 0.9, moh: 0.6, loh: 0.5, profit: 1.8, selling: 9.2 },
            'p004': { production: 15.0, goh: 3.0, moh: 2.0, loh: 1.5, profit: 5.0, selling: 35.0 },
            'p005': { production: 4.5, goh: 1.0, moh: 0.7, loh: 0.6, profit: 2.0, selling: 10.5 },
            'p006': { production: 18.0, goh: 3.5, moh: 2.5, loh: 2.0, profit: 6.0, selling: 42.0 },
            'p007': { production: 2.8, goh: 0.7, moh: 0.5, loh: 0.4, profit: 1.4, selling: 6.8 },
            'p008': { production: 20.0, goh: 4.0, moh: 3.0, loh: 2.5, profit: 7.0, selling: 45.0 },
            'p009': { production: 5.0, goh: 1.1, moh: 0.8, loh: 0.7, profit: 2.2, selling: 11.5 },
            'p010': { production: 3.5, goh: 0.8, moh: 0.6, loh: 0.5, profit: 1.5, selling: 8.9 },
            'p011': { production: 8.0, goh: 1.8, moh: 1.3, loh: 1.0, profit: 3.0, selling: 19.5 },
            'p012': { production: 10.0, goh: 2.2, moh: 1.6, loh: 1.3, profit: 3.5, selling: 24.0 }
        };
        
        return baseData[productId] || { 
            production: 5.0, goh: 1.0, moh: 0.8, loh: 0.6, profit: 2.0, selling: 10.0 
        };
    },
    
    calculateCoverage(productId) {
        const data = this.state.pricingData[productId];
        
        // Calculate what portion of each cost is covered by selling price
        const totalNeeded = data.productionCost + data.goh + data.moh + data.loh + data.profit;
        
        data.coverageDetails = {
            production: Math.min(100, (data.sellingPrice / data.productionCost) * 100),
            goh: Math.min(100, ((data.sellingPrice - data.productionCost) / data.goh) * 100),
            moh: Math.min(100, ((data.sellingPrice - data.productionCost - data.goh) / data.moh) * 100),
            loh: Math.min(100, ((data.sellingPrice - data.productionCost - data.goh - data.moh) / data.loh) * 100),
            profit: Math.min(100, ((data.sellingPrice - data.totalCost) / data.profit) * 100)
        };
        
        // Overall coverage percentage
        data.coverage = Math.min(100, (data.sellingPrice / totalNeeded) * 100);
        
        // Calculate cumulative coverage for visualization
        let remaining = data.sellingPrice;
        data.cumulativeCoverage = {
            production: Math.min(data.productionCost, remaining),
            goh: 0,
            moh: 0,
            loh: 0,
            profit: 0
        };
        
        remaining -= data.cumulativeCoverage.production;
        if (remaining > 0) {
            data.cumulativeCoverage.goh = Math.min(data.goh, remaining);
            remaining -= data.cumulativeCoverage.goh;
        }
        if (remaining > 0) {
            data.cumulativeCoverage.moh = Math.min(data.moh, remaining);
            remaining -= data.cumulativeCoverage.moh;
        }
        if (remaining > 0) {
            data.cumulativeCoverage.loh = Math.min(data.loh, remaining);
            remaining -= data.cumulativeCoverage.loh;
        }
        if (remaining > 0) {
            data.cumulativeCoverage.profit = Math.min(data.profit, remaining);
        }
        
        // Calculate price with VAT
        data.priceWithVat = data.sellingPrice * (1 + data.vat / 100);
    },
    
    render() {
        try {
            const container = document.getElementById('pricing-container');
            if (!container) {
                console.error('Pricing container not found');
                return;
            }
            
            console.log('Rendering pricing V3 module to container');
            container.innerHTML = `
            <div class="pricing-v3-container">
                <div class="pricing-header">
                    <h1>[Money] Cenik izdelkov s stroškovno analizo / Product Pricing with Cost Analysis</h1>
                    <div class="header-controls">
                        <button class="btn-expand-all" onclick="PricingV3.expandAll()">
                            📂 Expand All
                        </button>
                        <button class="btn-collapse-all" onclick="PricingV3.collapseAll()">
                            [Folder] Collapse All
                        </button>
                        <button class="btn-edit ${this.state.editMode ? 'active' : ''}" 
                                onclick="PricingV3.toggleEditMode()">
                            ${this.state.editMode ? '[Save] Save' : '✏️ Edit Prices'}
                        </button>
                    </div>
                </div>
                
                <div class="pricing-legend">
                    <h3>[Chart] Legenda stroškov / Cost Legend:</h3>
                    <div class="legend-items">
                        <span class="legend-item">
                            <span class="legend-color" style="background: var(--ch-success);"></span>
                            Proizvodna cena / Production Cost
                        </span>
                        <span class="legend-item">
                            <span class="legend-color" style="background: var(--ch-primary);"></span>
                            GOH (General Overheads)
                        </span>
                        <span class="legend-item">
                            <span class="legend-color" style="background: var(--ch-warning);"></span>
                            MOH (Marketing Overheads)
                        </span>
                        <span class="legend-item">
                            <span class="legend-color" style="background: var(--ch-primary);"></span>
                            LOH (Logistics Overheads)
                        </span>
                        <span class="legend-item">
                            <span class="legend-color" style="background: var(--ch-error);"></span>
                            Profit / Dobiček
                        </span>
                    </div>
                </div>
                
                <div class="pricing-list">
                    ${this.renderPricingHierarchy()}
                </div>
                
                <div class="pricing-summary">
                    <div class="summary-card">
                        <h3>[Chart] Povzetek / Summary</h3>
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-label">Število izdelkov / Products:</span>
                                <span class="stat-value">${this.state.products.length}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Povprečno pokritje / Avg Coverage:</span>
                                <span class="stat-value">${this.calculateAverageCoverage()}%</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Izdelki s polnim pokritjem / Full Coverage:</span>
                                <span class="stat-value">${this.countFullCoverage()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.getStyles()}
        `;
            console.log('Container HTML set successfully');
        } catch (error) {
            console.error('Error in PricingV3.render:', error);
            console.error('Stack:', error.stack);
        }
    },
    
    renderPricingHierarchy() {
        let html = '';
        
        this.state.productGroups.forEach(group => {
            const isGroupExpanded = this.state.expanded.groups.has(group.id);
            
            html += `
                <div class="group-container">
                    <div class="group-header" onclick="PricingV3.toggleGroup('${group.id}')">
                        <span class="expand-icon">${isGroupExpanded ? '▼' : '▶'}</span>
                        <span class="group-icon">${group.icon}</span>
                        <span class="group-name">${group.name}</span>
                        <span class="group-count">(${this.getGroupProductCount(group)} izdelkov)</span>
                    </div>
                    
                    <div class="group-content ${isGroupExpanded ? 'expanded' : 'collapsed'}">
                        ${this.renderSubgroups(group)}
                    </div>
                </div>
            `;
        });
        
        return html;
    },
    
    renderSubgroups(group) {
        let html = '';
        
        group.subgroups.forEach(subgroup => {
            const isSubgroupExpanded = this.state.expanded.subgroups.has(subgroup.id);
            
            html += `
                <div class="subgroup-container">
                    <div class="subgroup-header" onclick="PricingV3.toggleSubgroup('${subgroup.id}')">
                        <span class="expand-icon">${isSubgroupExpanded ? '▼' : '▶'}</span>
                        <span class="subgroup-icon">${subgroup.icon}</span>
                        <span class="subgroup-name">${subgroup.name}</span>
                        <span class="subgroup-count">(${subgroup.products.length})</span>
                    </div>
                    
                    <div class="subgroup-content ${isSubgroupExpanded ? 'expanded' : 'collapsed'}">
                        <table class="pricing-table">
                            <thead>
                                <tr>
                                    <th rowspan="2">Šifra<br>Code</th>
                                    <th rowspan="2">Izdelek<br>Product</th>
                                    <th colspan="5">Stroškovna struktura / Cost Structure (€)</th>
                                    <th rowspan="2">Prodajna<br>cena<br>Selling</th>
                                    <th rowspan="2">Pokritje<br>Coverage</th>
                                    <th rowspan="2" style="min-width: 250px;">Vizualizacija pokritja<br>Coverage Visualization</th>
                                </tr>
                                <tr>
                                    <th class="cost-header production">Proizv.</th>
                                    <th class="cost-header goh">GOH</th>
                                    <th class="cost-header moh">MOH</th>
                                    <th class="cost-header loh">LOH</th>
                                    <th class="cost-header profit">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderProducts(subgroup.products)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        return html;
    },
    
    renderProducts(products) {
        let html = '';
        
        products.forEach(product => {
            const pricing = this.state.pricingData[product.id];
            const coverageClass = pricing.coverage >= 100 ? 'full' : 
                                 pricing.coverage >= 80 ? 'good' : 
                                 pricing.coverage >= 60 ? 'medium' : 'low';
            
            html += `
                <tr class="product-row">
                    <td class="code">
                        ${product.code}
                        ${this.state.showCustomerPricing ? `
                            <br>
                            <button class="expand-customers-btn" 
                                    onclick="PricingV3.toggleCustomerPricing('${product.id}')"
                                    title="Show customer pricing">
                                <span class="expand-icon">
                                    ${this.state.expanded.customerPricing.has(product.id) ? '▼' : '▶'}
                                </span>
                                [Users]
                            </button>
                        ` : ''}
                    </td>
                    <td class="name">
                        <strong>${product.name}</strong>
                        <br><small>${product.nameEn}</small>
                    </td>
                    <td class="cost production">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.productionCost}" 
                                    onchange="PricingV3.updateCost('${product.id}', 'productionCost', this.value)">` :
                            `€${pricing.productionCost.toFixed(2)}`}
                    </td>
                    <td class="cost goh">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.goh}" 
                                    onchange="PricingV3.updateCost('${product.id}', 'goh', this.value)">` :
                            `€${pricing.goh.toFixed(2)}`}
                    </td>
                    <td class="cost moh">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.moh}" 
                                    onchange="PricingV3.updateCost('${product.id}', 'moh', this.value)">` :
                            `€${pricing.moh.toFixed(2)}`}
                    </td>
                    <td class="cost loh">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.loh}" 
                                    onchange="PricingV3.updateCost('${product.id}', 'loh', this.value)">` :
                            `€${pricing.loh.toFixed(2)}`}
                    </td>
                    <td class="cost profit">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.profit}" 
                                    onchange="PricingV3.updateCost('${product.id}', 'profit', this.value)">` :
                            `€${pricing.profit.toFixed(2)}`}
                    </td>
                    <td class="selling">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.sellingPrice}" 
                                    onchange="PricingV3.updateCost('${product.id}', 'sellingPrice', this.value)">` :
                            `€${pricing.sellingPrice.toFixed(2)}`}
                    </td>
                    <td class="coverage ${coverageClass}">
                        ${pricing.coverage.toFixed(0)}%
                    </td>
                    <td class="visualization">
                        ${this.renderCoverageChart(pricing)}
                    </td>
                </tr>
                ${this.state.expanded.customerPricing.has(product.id) ? 
                    this.renderCustomerPricingRows(product.id) : ''}
            `;
        });
        
        return html;
    },
    
    renderCoverageChart(pricing) {
        const totalNeeded = pricing.productionCost + pricing.goh + pricing.moh + pricing.loh + pricing.profit;
        const maxWidth = 200; // pixels
        
        // Calculate percentages for each segment
        const segments = [
            {
                type: 'production',
                label: 'Prod',
                needed: pricing.productionCost,
                covered: pricing.cumulativeCoverage.production,
                color: 'var(--ch-success)'
            },
            {
                type: 'goh',
                label: 'GOH',
                needed: pricing.goh,
                covered: pricing.cumulativeCoverage.goh,
                color: 'var(--ch-primary)'
            },
            {
                type: 'moh',
                label: 'MOH',
                needed: pricing.moh,
                covered: pricing.cumulativeCoverage.moh,
                color: 'var(--ch-warning)'
            },
            {
                type: 'loh',
                label: 'LOH',
                needed: pricing.loh,
                covered: pricing.cumulativeCoverage.loh,
                color: 'var(--ch-primary)'
            },
            {
                type: 'profit',
                label: 'Profit',
                needed: pricing.profit,
                covered: pricing.cumulativeCoverage.profit,
                color: 'var(--ch-error)'
            }
        ];
        
        let html = '<div class="coverage-chart">';
        
        segments.forEach(segment => {
            const segmentWidth = (segment.needed / totalNeeded) * maxWidth;
            const coveredWidth = (segment.covered / segment.needed) * segmentWidth;
            
            html += `
                <div class="chart-segment" style="width: ${segmentWidth}px;">
                    <div class="segment-background" style="background: ${segment.color}20; width: ${segmentWidth}px;"></div>
                    <div class="segment-covered" style="background: ${segment.color}; width: ${coveredWidth}px;"></div>
                    <span class="segment-label">${segment.label}</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add percentage indicator
        html += `<div class="coverage-percentage">${pricing.coverage.toFixed(0)}% covered</div>`;
        
        return html;
    },
    
    toggleGroup(groupId) {
        if (this.state.expanded.groups.has(groupId)) {
            this.state.expanded.groups.delete(groupId);
            const group = this.state.productGroups.find(g => g.id === groupId);
            if (group) {
                group.subgroups.forEach(sg => {
                    this.state.expanded.subgroups.delete(sg.id);
                });
            }
        } else {
            this.state.expanded.groups.add(groupId);
        }
        this.render();
    },
    
    toggleSubgroup(subgroupId) {
        if (this.state.expanded.subgroups.has(subgroupId)) {
            this.state.expanded.subgroups.delete(subgroupId);
        } else {
            this.state.expanded.subgroups.add(subgroupId);
        }
        this.render();
    },
    
    toggleCustomerPricing(productId) {
        if (this.state.expanded.customerPricing.has(productId)) {
            this.state.expanded.customerPricing.delete(productId);
        } else {
            this.state.expanded.customerPricing.add(productId);
        }
        this.render();
    },
    
    renderCustomerPricingRows(productId) {
        // Check if CRM data is available
        if (!window.CRMData) {
            return `
                <tr class="customer-pricing-row">
                    <td colspan="10" style="padding: 20px; text-align: center; background: var(--ch-gray-100);">
                        <em>CRM module not loaded. Go to Sales → CRM to load customer data.</em>
                    </td>
                </tr>
            `;
        }
        
        const customers = window.CRMData.getCustomers();
        const basePricing = this.state.pricingData[productId];
        
        let html = `
            <tr class="customer-pricing-header">
                <td colspan="10" style="background: var(--ch-primary-light); padding: 10px;">
                    <strong>[Users] Customer-Specific Pricing</strong>
                </td>
            </tr>
        `;
        
        customers.forEach(customer => {
            const customerPricing = window.CRMData.getCustomerPricing(customer.id, productId);
            if (!customerPricing) return;
            
            const coverageClass = customerPricing.coverage >= 100 ? 'full' : 
                                 customerPricing.coverage >= 80 ? 'good' : 
                                 customerPricing.coverage >= 60 ? 'medium' : 'low';
            
            html += `
                <tr class="customer-pricing-row">
                    <td colspan="2" class="customer-name">
                        <strong>${customer.name}</strong>
                        <br><small>${customer.type} | ${customer.responsiblePerson}</small>
                    </td>
                    <td class="cost">${basePricing.productionCost.toFixed(2)}</td>
                    <td class="cost">${basePricing.goh.toFixed(2)}</td>
                    <td class="cost">${basePricing.moh.toFixed(2)}</td>
                    <td class="cost">${basePricing.loh.toFixed(2)}</td>
                    <td class="cost">${customerPricing.profit.toFixed(2)}</td>
                    <td class="selling">
                        <span style="text-decoration: line-through; color: #999;">€${customerPricing.basePrice.toFixed(2)}</span>
                        <br>
                        <strong style="color: var(--ch-success);">€${customerPricing.netPrice.toFixed(2)}</strong>
                        <span class="discount-badge">-${customerPricing.discount}%</span>
                    </td>
                    <td class="coverage ${coverageClass}">
                        ${customerPricing.coverage.toFixed(0)}%
                    </td>
                    <td class="visualization">
                        ${this.renderCoverageChart(customerPricing)}
                    </td>
                </tr>
            `;
        });
        
        return html;
    },
    
    expandAll() {
        this.state.productGroups.forEach(group => {
            this.state.expanded.groups.add(group.id);
            group.subgroups.forEach(subgroup => {
                this.state.expanded.subgroups.add(subgroup.id);
            });
        });
        this.render();
    },
    
    collapseAll() {
        this.state.expanded.groups.clear();
        this.state.expanded.subgroups.clear();
        this.render();
    },
    
    toggleEditMode() {
        this.state.editMode = !this.state.editMode;
        if (!this.state.editMode) {
            this.savePricingData();
        }
        this.render();
    },
    
    updateCost(productId, field, value) {
        const pricing = this.state.pricingData[productId];
        const numValue = parseFloat(value) || 0;
        
        pricing[field] = numValue;
        
        // Recalculate total cost
        pricing.totalCost = pricing.productionCost + pricing.goh + pricing.moh + pricing.loh;
        
        // Recalculate coverage
        this.calculateCoverage(productId);
    },
    
    savePricingData() {
        localStorage.setItem('ch_pricing_data_v3', JSON.stringify(this.state.pricingData));
        console.log('Pricing data saved');
    },
    
    loadSavedPricingData() {
        const saved = localStorage.getItem('ch_pricing_data_v3');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(this.state.pricingData, data);
                // Recalculate coverage for all products
                this.state.products.forEach(product => {
                    this.calculateCoverage(product.id);
                });
                console.log('Pricing data loaded from storage');
            } catch (e) {
                console.error('Error loading saved pricing data:', e);
            }
        }
    },
    
    getGroupProductCount(group) {
        return group.subgroups.reduce((total, sg) => total + sg.products.length, 0);
    },
    
    calculateAverageCoverage() {
        const coverages = Object.values(this.state.pricingData).map(p => p.coverage);
        const avg = coverages.reduce((sum, c) => sum + c, 0) / coverages.length;
        return avg.toFixed(1);
    },
    
    countFullCoverage() {
        return Object.values(this.state.pricingData).filter(p => p.coverage >= 100).length;
    },
    
    getStyles() {
        return `
            <style>
                .pricing-v3-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                
                .pricing-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .pricing-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                
                .header-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .header-controls button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                }
                
                .header-controls button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                
                .header-controls button.active {
                    background: var(--ch-success);
                }
                
                .pricing-legend {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .pricing-legend h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 16px;
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
                    font-size: 13px;
                }
                
                .legend-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
                
                .pricing-list {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                
                .group-container {
                    margin-bottom: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .group-header {
                    background: var(--ch-gray-100);
                    padding: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 18px;
                    font-weight: 600;
                    transition: background 0.3s;
                }
                
                .group-header:hover {
                    background: var(--ch-gray-200);
                }
                
                .group-content {
                    padding: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }
                
                .group-content.expanded {
                    max-height: 5000px;
                    padding: 15px;
                    transition: max-height 0.5s ease-in;
                }
                
                .subgroup-container {
                    margin: 10px 0;
                    border: 1px solid #e8e8e8;
                    border-radius: 6px;
                    overflow: hidden;
                }
                
                .subgroup-header {
                    background: var(--ch-gray-100);
                    padding: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    transition: background 0.3s;
                }
                
                .subgroup-header:hover {
                    background: var(--ch-gray-200);
                }
                
                .subgroup-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }
                
                .subgroup-content.expanded {
                    max-height: 3000px;
                    transition: max-height 0.5s ease-in;
                    overflow-x: auto;
                }
                
                .expand-icon {
                    width: 20px;
                    font-size: 12px;
                    color: #666;
                }
                
                .pricing-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    min-width: 1200px;
                }
                
                .pricing-table thead {
                    background: var(--ch-gray-100);
                }
                
                .pricing-table th {
                    padding: 8px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    color: #546e7a;
                    border: 1px solid #dee2e6;
                }
                
                .cost-header {
                    text-align: center !important;
                    min-width: 60px;
                }
                
                .cost-header.production { background: var(--ch-success)10; }
                .cost-header.goh { background: var(--ch-primary)10; }
                .cost-header.moh { background: var(--ch-warning)10; }
                .cost-header.loh { background: var(--ch-primary)10; }
                .cost-header.profit { background: var(--ch-error)10; }
                
                .pricing-table td {
                    padding: 8px;
                    border: 1px solid #e9ecef;
                    font-size: 13px;
                }
                
                .product-row:hover {
                    background: var(--ch-gray-100);
                }
                
                .product-row .code {
                    font-weight: 600;
                    color: var(--ch-primary);
                }
                
                .product-row .name small {
                    color: #888;
                    font-style: italic;
                }
                
                .product-row .cost,
                .product-row .selling {
                    text-align: right;
                    font-weight: 600;
                }
                
                .product-row .coverage {
                    text-align: center;
                    font-weight: bold;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .coverage.full { background: var(--ch-success); color: white; }
                .coverage.good { background: #8BC34A; color: white; }
                .coverage.medium { background: #FFC107; color: #333; }
                .coverage.low { background: #FF5722; color: white; }
                
                .pricing-table input {
                    width: 60px;
                    padding: 4px;
                    border: 1px solid var(--ch-primary);
                    border-radius: 4px;
                    text-align: right;
                    font-size: 12px;
                }
                
                /* Coverage Chart Styles */
                .coverage-chart {
                    display: flex;
                    height: 25px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                    background: var(--ch-gray-100);
                }
                
                .chart-segment {
                    position: relative;
                    display: inline-block;
                    height: 100%;
                }
                
                .segment-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    opacity: 0.3;
                }
                
                .segment-covered {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    transition: width 0.3s;
                }
                
                .segment-label {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 9px;
                    font-weight: bold;
                    color: #333;
                    white-space: nowrap;
                    pointer-events: none;
                    text-shadow: 0 0 2px white;
                }
                
                .coverage-percentage {
                    font-size: 11px;
                    text-align: center;
                    margin-top: 4px;
                    color: #666;
                    font-weight: 600;
                }
                
                .pricing-summary {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .summary-card h3 {
                    margin-bottom: 20px;
                    color: #2c3e50;
                    font-size: 20px;
                }
                
                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                
                .stat {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: var(--ch-gray-100);
                    border-radius: 8px;
                    border-left: 4px solid var(--ch-primary);
                }
                
                .stat-label {
                    color: #666;
                    font-size: 14px;
                }
                
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--ch-primary);
                }
                
                .group-content.collapsed,
                .subgroup-content.collapsed {
                    display: none;
                }
            </style>
        `;
    }
};

// Export
window.PricingV3 = PricingV3;
// Pricing Module V2 - With 2-level product groups and expandable hierarchy
const PricingV2 = {
    VERSION: '2.0.0',
    
    state: {
        expanded: {
            groups: new Set(['fresh', 'processed']), // Start with main groups expanded
            subgroups: new Set()
        },
        products: [],
        productGroups: [],
        pricingData: {},
        editMode: false
    },
    
    init() {
        try {
            console.log(`Pricing Module V${this.VERSION} initializing...`);
            this.loadProductStructure();
            console.log('Product structure loaded:', this.state.productGroups.length, 'groups');
            this.loadPricingData();
            console.log('Pricing data loaded:', Object.keys(this.state.pricingData).length, 'products');
            this.loadSavedPricingData(); // Load any saved pricing overrides
            this.render();
            console.log('Pricing V2 render complete');
        } catch (error) {
            console.error('Error in PricingV2.init:', error);
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
        
        // Flatten products list for easy access
        this.state.products = [];
        this.state.productGroups.forEach(group => {
            group.subgroups.forEach(subgroup => {
                this.state.products.push(...subgroup.products);
            });
        });
    },
    
    loadPricingData() {
        // Generate pricing data for all products
        this.state.products.forEach(product => {
            this.state.pricingData[product.id] = {
                costPrice: this.generatePrice(product.id, 'cost'),
                sellingPrice: this.generatePrice(product.id, 'selling'),
                margin: 0,
                marginPercent: 0,
                vat: 22, // Slovenia VAT
                priceWithVat: 0
            };
            
            // Calculate derived values
            const data = this.state.pricingData[product.id];
            data.margin = data.sellingPrice - data.costPrice;
            data.marginPercent = ((data.margin / data.costPrice) * 100).toFixed(1);
            data.priceWithVat = data.sellingPrice * (1 + data.vat / 100);
        });
    },
    
    generatePrice(productId, type) {
        const basePrices = {
            'p001': { cost: 4.5, selling: 7.2 },   // Pork shoulder
            'p002': { cost: 18.0, selling: 28.5 }, // Beef tenderloin
            'p003': { cost: 5.8, selling: 9.2 },   // Chicken breast
            'p004': { cost: 22.0, selling: 35.0 }, // Lamb chops
            'p005': { cost: 6.5, selling: 10.5 },  // Homemade sausage
            'p006': { cost: 25.0, selling: 42.0 }, // Prosciutto
            'p007': { cost: 4.2, selling: 6.8 },   // Chicken thighs
            'p008': { cost: 28.0, selling: 45.0 }, // Venison
            'p009': { cost: 7.0, selling: 11.5 },  // Kranjska
            'p010': { cost: 5.5, selling: 8.9 },   // Cevapcici
            'p011': { cost: 12.0, selling: 19.5 }, // Pancetta
            'p012': { cost: 15.0, selling: 24.0 }  // Salami
        };
        
        const prices = basePrices[productId] || { cost: 10, selling: 15 };
        return type === 'cost' ? prices.cost : prices.selling;
    },
    
    render() {
        try {
            const container = document.getElementById('pricing-container');
            if (!container) {
                console.error('Pricing container not found');
                return;
            }
            
            console.log('Rendering pricing module to container');
            container.innerHTML = `
            <div class="pricing-v2-container">
                <div class="pricing-header">
                    <h1>[Money] Cenik izdelkov / Product Pricing</h1>
                    <div class="header-controls">
                        <button class="btn-expand-all" onclick="PricingV2.expandAll()">
                            📂 Expand All
                        </button>
                        <button class="btn-collapse-all" onclick="PricingV2.collapseAll()">
                            [Folder] Collapse All
                        </button>
                        <button class="btn-edit ${this.state.editMode ? 'active' : ''}" 
                                onclick="PricingV2.toggleEditMode()">
                            ${this.state.editMode ? '[Save] Save' : '✏️ Edit Prices'}
                        </button>
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
                                <span class="stat-label">Povprečna marža / Avg Margin:</span>
                                <span class="stat-value">${this.calculateAverageMargin()}%</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Skupine / Groups:</span>
                                <span class="stat-value">${this.state.productGroups.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.getStyles()}
        `;
            console.log('Container HTML set successfully');
        } catch (error) {
            console.error('Error in PricingV2.render:', error);
            console.error('Stack:', error.stack);
        }
    },
    
    renderPricingHierarchy() {
        let html = '';
        
        this.state.productGroups.forEach(group => {
            const isGroupExpanded = this.state.expanded.groups.has(group.id);
            
            html += `
                <div class="group-container">
                    <div class="group-header" onclick="PricingV2.toggleGroup('${group.id}')">
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
                    <div class="subgroup-header" onclick="PricingV2.toggleSubgroup('${subgroup.id}')">
                        <span class="expand-icon">${isSubgroupExpanded ? '▼' : '▶'}</span>
                        <span class="subgroup-icon">${subgroup.icon}</span>
                        <span class="subgroup-name">${subgroup.name}</span>
                        <span class="subgroup-count">(${subgroup.products.length})</span>
                    </div>
                    
                    <div class="subgroup-content ${isSubgroupExpanded ? 'expanded' : 'collapsed'}">
                        <table class="pricing-table">
                            <thead>
                                <tr>
                                    <th>Šifra / Code</th>
                                    <th>Izdelek / Product</th>
                                    <th>Enota / Unit</th>
                                    <th>Nabavna cena / Cost</th>
                                    <th>Prodajna cena / Selling</th>
                                    <th>Marža / Margin</th>
                                    <th>Marža % / Margin %</th>
                                    <th>DDV / VAT</th>
                                    <th>Cena z DDV / Price +VAT</th>
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
            const marginClass = pricing.marginPercent >= 30 ? 'good' : 
                               pricing.marginPercent >= 20 ? 'medium' : 'low';
            
            html += `
                <tr class="product-row">
                    <td class="code">${product.code}</td>
                    <td class="name">
                        <strong>${product.name}</strong>
                        <br><small>${product.nameEn}</small>
                    </td>
                    <td class="unit">${product.unit}</td>
                    <td class="cost">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.costPrice}" 
                                    onchange="PricingV2.updatePrice('${product.id}', 'cost', this.value)">` :
                            `€${pricing.costPrice.toFixed(2)}`}
                    </td>
                    <td class="selling">
                        ${this.state.editMode ? 
                            `<input type="number" step="0.01" value="${pricing.sellingPrice}" 
                                    onchange="PricingV2.updatePrice('${product.id}', 'selling', this.value)">` :
                            `€${pricing.sellingPrice.toFixed(2)}`}
                    </td>
                    <td class="margin">€${pricing.margin.toFixed(2)}</td>
                    <td class="margin-percent ${marginClass}">${pricing.marginPercent}%</td>
                    <td class="vat">${pricing.vat}%</td>
                    <td class="total">€${pricing.priceWithVat.toFixed(2)}</td>
                </tr>
            `;
        });
        
        return html;
    },
    
    toggleGroup(groupId) {
        if (this.state.expanded.groups.has(groupId)) {
            this.state.expanded.groups.delete(groupId);
            // Collapse all subgroups when group is collapsed
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
            // Save to localStorage when exiting edit mode
            this.savePricingData();
        }
        this.render();
    },
    
    updatePrice(productId, type, value) {
        const pricing = this.state.pricingData[productId];
        const numValue = parseFloat(value) || 0;
        
        if (type === 'cost') {
            pricing.costPrice = numValue;
        } else if (type === 'selling') {
            pricing.sellingPrice = numValue;
        }
        
        // Recalculate derived values
        pricing.margin = pricing.sellingPrice - pricing.costPrice;
        pricing.marginPercent = pricing.costPrice > 0 ? 
            ((pricing.margin / pricing.costPrice) * 100).toFixed(1) : 0;
        pricing.priceWithVat = pricing.sellingPrice * (1 + pricing.vat / 100);
    },
    
    savePricingData() {
        localStorage.setItem('ch_pricing_data', JSON.stringify(this.state.pricingData));
        console.log('Pricing data saved');
    },
    
    loadSavedPricingData() {
        const saved = localStorage.getItem('ch_pricing_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(this.state.pricingData, data);
                console.log('Pricing data loaded from storage');
            } catch (e) {
                console.error('Error loading saved pricing data:', e);
            }
        }
    },
    
    getGroupProductCount(group) {
        return group.subgroups.reduce((total, sg) => total + sg.products.length, 0);
    },
    
    calculateAverageMargin() {
        const margins = Object.values(this.state.pricingData).map(p => parseFloat(p.marginPercent));
        const avg = margins.reduce((sum, m) => sum + m, 0) / margins.length;
        return avg.toFixed(1);
    },
    
    getStyles() {
        return `
            <style>
                .pricing-v2-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .pricing-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .pricing-header h1 {
                    margin: 0;
                    font-size: 28px;
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
                    max-height: 2000px;
                    transition: max-height 0.5s ease-in;
                }
                
                .expand-icon {
                    width: 20px;
                    font-size: 12px;
                    color: #666;
                }
                
                .group-icon, .subgroup-icon {
                    font-size: 20px;
                }
                
                .group-name, .subgroup-name {
                    flex: 1;
                }
                
                .group-count, .subgroup-count {
                    color: #888;
                    font-size: 14px;
                    font-weight: normal;
                }
                
                .pricing-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                
                .pricing-table thead {
                    background: var(--ch-gray-100);
                }
                
                .pricing-table th {
                    padding: 10px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 600;
                    color: #546e7a;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .pricing-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e9ecef;
                    font-size: 14px;
                }
                
                .product-row:hover {
                    background: var(--ch-gray-100);
                }
                
                .product-row .code {
                    font-weight: 600;
                    color: var(--ch-primary);
                }
                
                .product-row .name {
                    min-width: 200px;
                }
                
                .product-row .name small {
                    color: #888;
                    font-style: italic;
                }
                
                .product-row .cost,
                .product-row .selling,
                .product-row .margin,
                .product-row .total {
                    font-weight: 600;
                    text-align: right;
                }
                
                .product-row .margin-percent {
                    text-align: center;
                    font-weight: bold;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .margin-percent.good {
                    background: #c8e6c9;
                    color: var(--ch-success);
                }
                
                .margin-percent.medium {
                    background: #fff3e0;
                    color: var(--ch-warning);
                }
                
                .margin-percent.low {
                    background: #ffebee;
                    color: var(--ch-error);
                }
                
                .pricing-table input {
                    width: 80px;
                    padding: 4px;
                    border: 1px solid var(--ch-primary);
                    border-radius: 4px;
                    text-align: right;
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
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
window.PricingV2 = PricingV2;
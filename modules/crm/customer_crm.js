// Customer CRM Module - Integrated with Pricing and Sales
const CustomerCRM = {
    VERSION: '1.0.0',
    
    state: {
        customers: [],
        customerPricing: {},
        selectedCustomer: null,
        editMode: false,
        searchQuery: '',
        sortBy: 'name',
        expandedCustomers: new Set(),
        integrationMode: false // When true, shows compact view for integration
    },
    
    init(options = {}) {
        console.log(`CRM Module V${this.VERSION} initializing...`);
        this.state.integrationMode = options.integrationMode || false;
        this.loadCustomers();
        this.loadCustomerPricing();
        
        if (!this.state.integrationMode) {
            this.render();
        }
        
        // Make CRM data available globally for other modules
        window.CRMData = {
            getCustomers: () => this.state.customers,
            getCustomerPricing: (customerId, productId) => this.getCustomerPricing(customerId, productId),
            getCustomerById: (id) => this.state.customers.find(c => c.id === id)
        };
    },
    
    loadCustomers() {
        // Load saved customers or use defaults
        const saved = localStorage.getItem('ch_crm_customers');
        if (saved) {
            this.state.customers = JSON.parse(saved);
        } else {
            // Default customers
            this.state.customers = [
                {
                    id: 'c001',
                    code: 'MER-001',
                    name: 'Mercator d.d.',
                    type: 'Retail Chain',
                    country: 'Slovenia',
                    city: 'Ljubljana',
                    address: 'Dunajska cesta 107',
                    phone: '+386 1 560 1000',
                    email: 'nabava@mercator.si',
                    website: 'www.mercator.si',
                    taxId: 'SI45884595',
                    responsiblePerson: 'Ana Novak',
                    creditLimit: 100000,
                    paymentTerms: 30,
                    discount: 5,
                    rating: 'A',
                    status: 'active',
                    notes: 'Largest retail chain in Slovenia',
                    totalRevenue: 458000,
                    lastOrder: '2024-01-15',
                    orderCount: 156
                },
                {
                    id: 'c002',
                    code: 'SPA-002',
                    name: 'Spar Slovenija d.o.o.',
                    type: 'Retail Chain',
                    country: 'Slovenia',
                    city: 'Ljubljana',
                    address: 'Letališka cesta 26',
                    phone: '+386 1 568 4300',
                    email: 'info@spar.si',
                    website: 'www.spar.si',
                    taxId: 'SI35512024',
                    responsiblePerson: 'Marko Horvat',
                    creditLimit: 80000,
                    paymentTerms: 45,
                    discount: 3,
                    rating: 'A',
                    status: 'active',
                    notes: 'Second largest retail chain',
                    totalRevenue: 385000,
                    lastOrder: '2024-01-18',
                    orderCount: 142
                },
                {
                    id: 'c003',
                    code: 'TUS-003',
                    name: 'Tuš d.o.o.',
                    type: 'Retail Chain',
                    country: 'Slovenia',
                    city: 'Celje',
                    address: 'Cesta v Trnovlje 10a',
                    phone: '+386 3 426 4000',
                    email: 'nabava@tus.si',
                    website: 'www.tus.si',
                    taxId: 'SI55905757',
                    responsiblePerson: 'Petra Krajnc',
                    creditLimit: 75000,
                    paymentTerms: 30,
                    discount: 4,
                    rating: 'B',
                    status: 'active',
                    notes: 'Regional chain, strong in Štajerska',
                    totalRevenue: 295000,
                    lastOrder: '2024-01-20',
                    orderCount: 98
                },
                {
                    id: 'c004',
                    code: 'LEC-004',
                    name: 'E.Leclerc Ljubljana',
                    type: 'Hypermarket',
                    country: 'Slovenia',
                    city: 'Ljubljana',
                    address: 'Jurčkova cesta 233',
                    phone: '+386 1 585 2600',
                    email: 'ljubljana@leclerc.si',
                    website: 'www.leclerc.si',
                    taxId: 'SI88957420',
                    responsiblePerson: 'Janez Kos',
                    creditLimit: 50000,
                    paymentTerms: 60,
                    discount: 2,
                    rating: 'B',
                    status: 'active',
                    notes: 'French hypermarket chain',
                    totalRevenue: 178000,
                    lastOrder: '2024-01-12',
                    orderCount: 67
                },
                {
                    id: 'c005',
                    code: 'HOF-005',
                    name: 'Hofer d.o.o.',
                    type: 'Discount Store',
                    country: 'Slovenia',
                    city: 'Lukovica',
                    address: 'Krašnja 1',
                    phone: '+386 1 834 6600',
                    email: 'info@hofer.si',
                    website: 'www.hofer.si',
                    taxId: 'SI47978457',
                    responsiblePerson: 'Eva Potočnik',
                    creditLimit: 60000,
                    paymentTerms: 15,
                    discount: 1,
                    rating: 'A',
                    status: 'active',
                    notes: 'Discount chain (Aldi)',
                    totalRevenue: 312000,
                    lastOrder: '2024-01-22',
                    orderCount: 124
                },
                {
                    id: 'c006',
                    code: 'RES-006',
                    name: 'Gostilna Pri Kolovratu',
                    type: 'Restaurant',
                    country: 'Slovenia',
                    city: 'Ljubljana',
                    address: 'Ciril-Metodov trg 17',
                    phone: '+386 1 438 0760',
                    email: 'info@prikolovratu.si',
                    website: 'www.prikolovratu.si',
                    taxId: 'SI12345678',
                    responsiblePerson: 'Tomaž Kavčič',
                    creditLimit: 10000,
                    paymentTerms: 15,
                    discount: 8,
                    rating: 'A',
                    status: 'active',
                    notes: 'Premium restaurant, quality focused',
                    totalRevenue: 45000,
                    lastOrder: '2024-01-21',
                    orderCount: 89
                },
                {
                    id: 'c007',
                    code: 'MEA-007',
                    name: 'Mesnica Jelen',
                    type: 'Butcher Shop',
                    country: 'Slovenia',
                    city: 'Maribor',
                    address: 'Partizanska cesta 21',
                    phone: '+386 2 229 1000',
                    email: 'info@mesnica-jelen.si',
                    website: 'www.mesnica-jelen.si',
                    taxId: 'SI87654321',
                    responsiblePerson: 'Aleš Jelen',
                    creditLimit: 15000,
                    paymentTerms: 7,
                    discount: 10,
                    rating: 'B',
                    status: 'active',
                    notes: 'Local butcher chain',
                    totalRevenue: 68000,
                    lastOrder: '2024-01-19',
                    orderCount: 156
                },
                {
                    id: 'c008',
                    code: 'HTL-008',
                    name: 'Hotel Union',
                    type: 'Hotel',
                    country: 'Slovenia',
                    city: 'Ljubljana',
                    address: 'Miklošičeva cesta 1',
                    phone: '+386 1 308 1270',
                    email: 'purchasing@union-hotels.eu',
                    website: 'www.union-hotels.eu',
                    taxId: 'SI24681357',
                    responsiblePerson: 'Nina Zupan',
                    creditLimit: 25000,
                    paymentTerms: 30,
                    discount: 6,
                    rating: 'A',
                    status: 'active',
                    notes: 'Premium hotel, regular orders',
                    totalRevenue: 92000,
                    lastOrder: '2024-01-17',
                    orderCount: 78
                }
            ];
        }
    },
    
    loadCustomerPricing() {
        // Load saved customer-specific pricing or generate
        const saved = localStorage.getItem('ch_crm_customer_pricing');
        if (saved) {
            this.state.customerPricing = JSON.parse(saved);
        } else {
            // Generate customer-specific pricing based on discounts
            this.generateCustomerPricing();
        }
    },
    
    generateCustomerPricing() {
        // Get base pricing from PricingV3 if available
        const baseProducts = [
            'p001', 'p002', 'p003', 'p004', 'p005', 
            'p006', 'p007', 'p008', 'p009', 'p010', 'p011', 'p012'
        ];
        
        this.state.customers.forEach(customer => {
            if (!this.state.customerPricing[customer.id]) {
                this.state.customerPricing[customer.id] = {};
            }
            
            baseProducts.forEach(productId => {
                const basePrice = this.getBaseProductPrice(productId);
                const discount = customer.discount || 0;
                
                // Calculate customer-specific pricing
                const customerPrice = {
                    productId: productId,
                    customerId: customer.id,
                    basePrice: basePrice.selling,
                    discount: discount,
                    netPrice: basePrice.selling * (1 - discount / 100),
                    
                    // Cost breakdown (same as base, but adjusted selling price)
                    productionCost: basePrice.production,
                    goh: basePrice.goh,
                    moh: basePrice.moh,
                    loh: basePrice.loh,
                    profit: 0, // Will be calculated
                    
                    // Volume pricing tiers
                    volumeTiers: [
                        { minQty: 1, maxQty: 99, discount: discount },
                        { minQty: 100, maxQty: 499, discount: discount + 2 },
                        { minQty: 500, maxQty: 999, discount: discount + 4 },
                        { minQty: 1000, maxQty: null, discount: discount + 6 }
                    ],
                    
                    // Historical data
                    lastPurchasePrice: basePrice.selling * (1 - (discount - 1) / 100),
                    lastPurchaseDate: this.generateRandomDate(),
                    totalQuantityPurchased: Math.floor(Math.random() * 5000) + 100,
                    averageOrderSize: Math.floor(Math.random() * 200) + 50
                };
                
                // Calculate profit based on customer price
                const totalCost = customerPrice.productionCost + customerPrice.goh + 
                                 customerPrice.moh + customerPrice.loh;
                customerPrice.profit = Math.max(0, customerPrice.netPrice - totalCost);
                
                // Calculate coverage
                customerPrice.coverage = this.calculateCoverage(customerPrice);
                
                this.state.customerPricing[customer.id][productId] = customerPrice;
            });
        });
    },
    
    getBaseProductPrice(productId) {
        // Base pricing data (matches PricingV3)
        const basePrices = {
            'p001': { production: 3.0, goh: 0.8, moh: 0.5, loh: 0.4, selling: 7.2 },
            'p002': { production: 12.0, goh: 2.5, moh: 1.8, loh: 1.2, selling: 28.5 },
            'p003': { production: 3.8, goh: 0.9, moh: 0.6, loh: 0.5, selling: 9.2 },
            'p004': { production: 15.0, goh: 3.0, moh: 2.0, loh: 1.5, selling: 35.0 },
            'p005': { production: 4.5, goh: 1.0, moh: 0.7, loh: 0.6, selling: 10.5 },
            'p006': { production: 18.0, goh: 3.5, moh: 2.5, loh: 2.0, selling: 42.0 },
            'p007': { production: 2.8, goh: 0.7, moh: 0.5, loh: 0.4, selling: 6.8 },
            'p008': { production: 20.0, goh: 4.0, moh: 3.0, loh: 2.5, selling: 45.0 },
            'p009': { production: 5.0, goh: 1.1, moh: 0.8, loh: 0.7, selling: 11.5 },
            'p010': { production: 3.5, goh: 0.8, moh: 0.6, loh: 0.5, selling: 8.9 },
            'p011': { production: 8.0, goh: 1.8, moh: 1.3, loh: 1.0, selling: 19.5 },
            'p012': { production: 10.0, goh: 2.2, moh: 1.6, loh: 1.3, selling: 24.0 }
        };
        
        return basePrices[productId] || { 
            production: 5.0, goh: 1.0, moh: 0.8, loh: 0.6, selling: 10.0 
        };
    },
    
    calculateCoverage(pricing) {
        const totalCost = pricing.productionCost + pricing.goh + pricing.moh + pricing.loh;
        const totalNeeded = totalCost + (pricing.profit > 0 ? pricing.profit : 2.0); // Min profit target
        
        pricing.cumulativeCoverage = {
            production: Math.min(pricing.productionCost, pricing.netPrice),
            goh: 0,
            moh: 0,
            loh: 0,
            profit: 0
        };
        
        let remaining = pricing.netPrice - pricing.cumulativeCoverage.production;
        
        if (remaining > 0) {
            pricing.cumulativeCoverage.goh = Math.min(pricing.goh, remaining);
            remaining -= pricing.cumulativeCoverage.goh;
        }
        if (remaining > 0) {
            pricing.cumulativeCoverage.moh = Math.min(pricing.moh, remaining);
            remaining -= pricing.cumulativeCoverage.moh;
        }
        if (remaining > 0) {
            pricing.cumulativeCoverage.loh = Math.min(pricing.loh, remaining);
            remaining -= pricing.cumulativeCoverage.loh;
        }
        if (remaining > 0) {
            pricing.cumulativeCoverage.profit = remaining;
        }
        
        return Math.min(100, (pricing.netPrice / totalNeeded) * 100);
    },
    
    generateRandomDate() {
        const start = new Date(2023, 0, 1);
        const end = new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
            .toISOString().split('T')[0];
    },
    
    render() {
        const container = document.getElementById('crm-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="crm-container">
                <div class="crm-header">
                    <h1>[Users] Customer Relationship Management</h1>
                    <div class="header-controls">
                        <input type="text" class="search-input" placeholder="[Search] Search customers..." 
                               value="${this.state.searchQuery}"
                               onkeyup="CustomerCRM.handleSearch(this.value)">
                        <button class="btn-add" onclick="CustomerCRM.showAddCustomer()">
                            ➕ Add Customer
                        </button>
                        <button class="btn-export" onclick="CustomerCRM.exportData()">
                            [Download] Export
                        </button>
                    </div>
                </div>
                
                <div class="crm-stats">
                    ${this.renderStats()}
                </div>
                
                <div class="crm-content">
                    ${this.renderCustomerList()}
                </div>
            </div>
            
            ${this.getStyles()}
        `;
    },
    
    renderStats() {
        const totalRevenue = this.state.customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
        const activeCustomers = this.state.customers.filter(c => c.status === 'active').length;
        const avgOrderValue = totalRevenue / this.state.customers.reduce((sum, c) => sum + (c.orderCount || 1), 0);
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${this.state.customers.length}</div>
                    <div class="stat-label">Total Customers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${activeCustomers}</div>
                    <div class="stat-label">Active Customers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">€${(totalRevenue / 1000).toFixed(0)}k</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">€${avgOrderValue.toFixed(0)}</div>
                    <div class="stat-label">Avg Order Value</div>
                </div>
            </div>
        `;
    },
    
    renderCustomerList() {
        const filteredCustomers = this.filterCustomers();
        
        return `
            <div class="customer-table-wrapper">
                <table class="customer-table">
                    <thead>
                        <tr>
                            <th onclick="CustomerCRM.sort('code')">Code ↕</th>
                            <th onclick="CustomerCRM.sort('name')">Customer Name ↕</th>
                            <th onclick="CustomerCRM.sort('type')">Type ↕</th>
                            <th>Location</th>
                            <th>Contact</th>
                            <th onclick="CustomerCRM.sort('responsiblePerson')">Responsible ↕</th>
                            <th onclick="CustomerCRM.sort('totalRevenue')">Revenue ↕</th>
                            <th onclick="CustomerCRM.sort('rating')">Rating ↕</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredCustomers.map(customer => this.renderCustomerRow(customer)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    renderCustomerRow(customer) {
        const isExpanded = this.state.expandedCustomers.has(customer.id);
        const ratingColor = customer.rating === 'A' ? 'green' : customer.rating === 'B' ? 'orange' : 'red';
        
        return `
            <tr class="customer-row ${isExpanded ? 'expanded' : ''}">
                <td class="code">${customer.code}</td>
                <td class="name">
                    <div class="customer-name" onclick="CustomerCRM.toggleCustomer('${customer.id}')">
                        <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                        <strong>${customer.name}</strong>
                    </div>
                </td>
                <td class="type">${customer.type}</td>
                <td class="location">${customer.city}, ${customer.country}</td>
                <td class="contact">
                    <div class="contact-info">
                        📧 ${customer.email}<br>
                        📞 ${customer.phone}
                    </div>
                </td>
                <td class="responsible">${customer.responsiblePerson}</td>
                <td class="revenue">€${(customer.totalRevenue / 1000).toFixed(0)}k</td>
                <td class="rating">
                    <span class="rating-badge" style="background: ${ratingColor}">
                        ${customer.rating}
                    </span>
                </td>
                <td class="actions">
                    <button onclick="CustomerCRM.editCustomer('${customer.id}')" title="Edit">✏️</button>
                    <button onclick="CustomerCRM.viewPricing('${customer.id}')" title="View Pricing">[Money]</button>
                    <button onclick="CustomerCRM.viewHistory('${customer.id}')" title="History">[Chart]</button>
                </td>
            </tr>
            ${isExpanded ? this.renderCustomerDetails(customer) : ''}
        `;
    },
    
    renderCustomerDetails(customer) {
        return `
            <tr class="customer-details">
                <td colspan="9">
                    <div class="details-container">
                        <div class="details-section">
                            <h3>[Clipboard] Customer Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Tax ID:</label>
                                    <span>${customer.taxId}</span>
                                </div>
                                <div class="info-item">
                                    <label>Credit Limit:</label>
                                    <span>€${customer.creditLimit.toLocaleString()}</span>
                                </div>
                                <div class="info-item">
                                    <label>Payment Terms:</label>
                                    <span>${customer.paymentTerms} days</span>
                                </div>
                                <div class="info-item">
                                    <label>Discount:</label>
                                    <span>${customer.discount}%</span>
                                </div>
                                <div class="info-item">
                                    <label>Last Order:</label>
                                    <span>${customer.lastOrder}</span>
                                </div>
                                <div class="info-item">
                                    <label>Total Orders:</label>
                                    <span>${customer.orderCount}</span>
                                </div>
                            </div>
                            <div class="notes">
                                <label>Notes:</label>
                                <p>${customer.notes}</p>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h3>[Money] Product Pricing Overview</h3>
                            <div class="pricing-preview">
                                ${this.renderCustomerPricingPreview(customer.id)}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },
    
    renderCustomerPricingPreview(customerId) {
        // Show first 3 products with customer pricing
        const products = ['p001', 'p002', 'p003'];
        const productNames = {
            'p001': 'Svinjska plečka',
            'p002': 'Goveji file',
            'p003': 'Piščančje prsi'
        };
        
        let html = '<div class="pricing-preview-grid">';
        
        products.forEach(productId => {
            const pricing = this.state.customerPricing[customerId]?.[productId];
            if (!pricing) return;
            
            const coverageClass = pricing.coverage >= 100 ? 'full' : 
                                 pricing.coverage >= 80 ? 'good' : 
                                 pricing.coverage >= 60 ? 'medium' : 'low';
            
            html += `
                <div class="pricing-preview-item">
                    <div class="product-name">${productNames[productId]}</div>
                    <div class="pricing-info">
                        <span class="base-price">Base: €${pricing.basePrice.toFixed(2)}</span>
                        <span class="arrow">→</span>
                        <span class="net-price">Net: €${pricing.netPrice.toFixed(2)}</span>
                        <span class="discount-badge">-${pricing.discount}%</span>
                    </div>
                    ${this.renderMiniCoverageChart(pricing)}
                </div>
            `;
        });
        
        html += '</div>';
        html += '<div class="view-all-link"><a href="#" onclick="CustomerCRM.viewPricing(\'' + customerId + '\')">View all products →</a></div>';
        
        return html;
    },
    
    renderMiniCoverageChart(pricing) {
        const totalNeeded = pricing.productionCost + pricing.goh + pricing.moh + pricing.loh + 
                          (pricing.profit > 0 ? pricing.profit : 2.0);
        const maxWidth = 150;
        
        const segments = [
            { type: 'production', color: '#4CAF50', needed: pricing.productionCost, covered: pricing.cumulativeCoverage.production },
            { type: 'goh', color: 'var(--ch-primary)', needed: pricing.goh, covered: pricing.cumulativeCoverage.goh },
            { type: 'moh', color: '#FF9800', needed: pricing.moh, covered: pricing.cumulativeCoverage.moh },
            { type: 'loh', color: 'var(--ch-primary-dark)', needed: pricing.loh, covered: pricing.cumulativeCoverage.loh },
            { type: 'profit', color: '#F44336', needed: pricing.profit || 2.0, covered: pricing.cumulativeCoverage.profit }
        ];
        
        let html = '<div class="mini-coverage-chart">';
        
        segments.forEach(segment => {
            const segmentWidth = (segment.needed / totalNeeded) * maxWidth;
            const coveredWidth = (segment.covered / segment.needed) * segmentWidth;
            
            html += `
                <div class="mini-segment" style="width: ${segmentWidth}px;">
                    <div class="mini-bg" style="background: ${segment.color}20; width: ${segmentWidth}px;"></div>
                    <div class="mini-fill" style="background: ${segment.color}; width: ${coveredWidth}px;"></div>
                </div>
            `;
        });
        
        html += `</div><div class="coverage-label">${pricing.coverage.toFixed(0)}% coverage</div>`;
        
        return html;
    },
    
    filterCustomers() {
        let customers = [...this.state.customers];
        
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            customers = customers.filter(c => 
                c.name.toLowerCase().includes(query) ||
                c.code.toLowerCase().includes(query) ||
                c.city.toLowerCase().includes(query) ||
                c.responsiblePerson.toLowerCase().includes(query)
            );
        }
        
        // Sort
        customers.sort((a, b) => {
            const field = this.state.sortBy;
            if (field === 'totalRevenue') {
                return b[field] - a[field];
            }
            return (a[field] || '').toString().localeCompare((b[field] || '').toString());
        });
        
        return customers;
    },
    
    toggleCustomer(customerId) {
        if (this.state.expandedCustomers.has(customerId)) {
            this.state.expandedCustomers.delete(customerId);
        } else {
            this.state.expandedCustomers.add(customerId);
        }
        this.render();
    },
    
    handleSearch(query) {
        this.state.searchQuery = query;
        this.render();
    },
    
    sort(field) {
        this.state.sortBy = field;
        this.render();
    },
    
    showAddCustomer() {
        // Would open a modal to add new customer
        alert('Add Customer form would open here');
    },
    
    editCustomer(customerId) {
        const customer = this.state.customers.find(c => c.id === customerId);
        alert(`Edit customer: ${customer.name}`);
    },
    
    viewPricing(customerId) {
        // Switch to pricing view with customer filter
        const customer = this.state.customers.find(c => c.id === customerId);
        alert(`View pricing for: ${customer.name}\n\nThis would show all products with customer-specific pricing`);
    },
    
    viewHistory(customerId) {
        const customer = this.state.customers.find(c => c.id === customerId);
        alert(`Order history for: ${customer.name}\n\nTotal orders: ${customer.orderCount}\nTotal revenue: €${customer.totalRevenue}`);
    },
    
    exportData() {
        const data = JSON.stringify(this.state.customers, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crm_customers.json';
        a.click();
    },
    
    saveCustomers() {
        localStorage.setItem('ch_crm_customers', JSON.stringify(this.state.customers));
    },
    
    saveCustomerPricing() {
        localStorage.setItem('ch_crm_customer_pricing', JSON.stringify(this.state.customerPricing));
    },
    
    getCustomerPricing(customerId, productId) {
        return this.state.customerPricing[customerId]?.[productId] || null;
    },
    
    // Integration method for other modules
    renderCustomerPricingForProduct(productId, container) {
        let html = '<div class="customer-pricing-integration">';
        html += '<h4>[Users] Customer-Specific Pricing</h4>';
        
        this.state.customers.forEach(customer => {
            const pricing = this.getCustomerPricing(customer.id, productId);
            if (!pricing) return;
            
            html += `
                <div class="customer-price-row">
                    <div class="customer-info">
                        <strong>${customer.name}</strong>
                        <span class="customer-type">${customer.type}</span>
                    </div>
                    <div class="price-info">
                        <span class="base">€${pricing.basePrice.toFixed(2)}</span>
                        <span class="discount">-${pricing.discount}%</span>
                        <span class="net">€${pricing.netPrice.toFixed(2)}</span>
                    </div>
                    ${this.renderMiniCoverageChart(pricing)}
                </div>
            `;
        });
        
        html += '</div>';
        
        if (container) {
            container.innerHTML = html;
        }
        
        return html;
    },
    
    getStyles() {
        return `
            <style>
                .crm-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                
                .crm-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .crm-header h1 {
                    margin: 0;
                    font-size: 28px;
                }
                
                .header-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                
                .search-input {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    width: 250px;
                    font-size: 14px;
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
                
                .crm-stats {
                    margin-bottom: 20px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    font-size: 13px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                }
                
                .crm-content {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .customer-table-wrapper {
                    overflow-x: auto;
                }
                
                .customer-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .customer-table thead {
                    background: var(--ch-gray-100);
                }
                
                .customer-table th {
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #546e7a;
                    border-bottom: 2px solid #dee2e6;
                    cursor: pointer;
                    user-select: none;
                }
                
                .customer-table th:hover {
                    background: #eceff1;
                }
                
                .customer-table td {
                    padding: 12px;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .customer-row:hover {
                    background: var(--ch-gray-100);
                }
                
                .customer-row.expanded {
                    background: var(--ch-primary-light);
                }
                
                .customer-name {
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .expand-icon {
                    font-size: 10px;
                    color: #666;
                }
                
                .contact-info {
                    font-size: 12px;
                    line-height: 1.4;
                }
                
                .rating-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .actions button {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    margin: 0 2px;
                }
                
                .actions button:hover {
                    transform: scale(1.2);
                }
                
                .customer-details td {
                    background: var(--ch-gray-100);
                    padding: 0;
                }
                
                .details-container {
                    padding: 20px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                }
                
                .details-section h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 16px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .info-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .info-item label {
                    font-size: 11px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                
                .info-item span {
                    font-size: 14px;
                    color: #2c3e50;
                    font-weight: 600;
                }
                
                .notes {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #dee2e6;
                }
                
                .notes label {
                    font-size: 12px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                }
                
                .notes p {
                    margin: 8px 0 0 0;
                    color: #546e7a;
                    font-size: 14px;
                }
                
                .pricing-preview-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .pricing-preview-item {
                    padding: 10px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                }
                
                .product-name {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }
                
                .pricing-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                
                .base-price {
                    color: #7f8c8d;
                }
                
                .arrow {
                    color: #bdc3c7;
                }
                
                .net-price {
                    color: var(--ch-success);
                    font-weight: 600;
                }
                
                .discount-badge {
                    background: var(--ch-error);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                }
                
                .mini-coverage-chart {
                    display: flex;
                    height: 15px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    overflow: hidden;
                    background: var(--ch-gray-100);
                }
                
                .mini-segment {
                    position: relative;
                    display: inline-block;
                    height: 100%;
                }
                
                .mini-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    opacity: 0.3;
                }
                
                .mini-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                }
                
                .coverage-label {
                    font-size: 11px;
                    color: #666;
                    margin-top: 4px;
                    text-align: center;
                }
                
                .view-all-link {
                    margin-top: 10px;
                    text-align: right;
                }
                
                .view-all-link a {
                    color: var(--ch-primary);
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .view-all-link a:hover {
                    text-decoration: underline;
                }
                
                /* Integration styles */
                .customer-pricing-integration {
                    margin-top: 15px;
                    padding: 15px;
                    background: var(--ch-gray-100);
                    border-radius: 8px;
                }
                
                .customer-pricing-integration h4 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 14px;
                }
                
                .customer-price-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 15px;
                    align-items: center;
                    padding: 10px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .customer-info strong {
                    display: block;
                    color: #2c3e50;
                    font-size: 13px;
                }
                
                .customer-type {
                    color: #7f8c8d;
                    font-size: 11px;
                }
                
                .price-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }
                
                .price-info .base {
                    color: #95a5a6;
                    text-decoration: line-through;
                }
                
                .price-info .discount {
                    background: var(--ch-error);
                    color: white;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 10px;
                }
                
                .price-info .net {
                    color: var(--ch-success);
                    font-weight: bold;
                }
            </style>
        `;
    }
};

// Export
window.CustomerCRM = CustomerCRM;
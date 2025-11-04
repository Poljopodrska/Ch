// Pricing Module V4 - Price Levels System (LC, C0, Cmin, CP)
// New pricing policy with 4 price levels instead of overhead breakdown
const PricingV4 = {
    VERSION: '4.0.1',

    state: {
        expanded: {
            groups: new Set(['fresh', 'processed']),
            subgroups: new Set(),
            products: new Set(), // Track which products show customer rows
            customerDetails: new Set() // Track which customer rows show detailed breakdown
        },
        products: [],
        productGroups: [],
        pricingData: {}, // Product base data (LC, C0, Cmin)
        customerPricing: {}, // Customer-specific pricing (CP, discounts, realized)
        editMode: false,

        // Industry factors (controlled quarterly)
        industryFactors: {
            ohFactor: 1.25,      // Overhead factor (LC * 1.25 = C0)
            minProfitMargin: 0.0425,  // 4.25% minimum profit
            competitorAvg: 0.0625     // 6.25% competitor average
        }
    },

    init() {
        try {
            console.log(`Pricing Module V${this.VERSION} initializing...`);
            this.loadProductStructure();
            console.log('Product structure loaded:', this.state.productGroups.length, 'groups');
            this.loadPricingData();
            console.log('Pricing data loaded:', Object.keys(this.state.pricingData).length, 'products');
            this.loadCustomerPricing();
            console.log('Customer pricing loaded:', Object.keys(this.state.customerPricing).length, 'product-customer combinations');
            this.render();
            console.log('Pricing V4 render complete');
        } catch (error) {
            console.error('Error in PricingV4.init:', error);
            console.error('Stack:', error.stack);
        }
    },

    loadProductStructure() {
        // Define 2-level product group hierarchy with real meat products
        this.state.productGroups = [
            {
                id: 'fresh',
                name: 'Sveži izdelki / Fresh Products',
                icon: '🥩',
                subgroups: [
                    {
                        id: 'poultry',
                        name: 'Perutnina / Poultry',
                        icon: '🐔',
                        products: [
                            { id: 'p001', code: 'PIŠ-FILE', name: 'Piščančji file', nameEn: 'Chicken Fillet', unit: 'kg' },
                            { id: 'p002', code: 'PIŠ-PRSI', name: 'Piščančje prsi', nameEn: 'Chicken Breast', unit: 'kg' },
                            { id: 'p003', code: 'PIŠ-BEDRA', name: 'Piščančja bedra', nameEn: 'Chicken Thighs', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'pork',
                        name: 'Svinjina / Pork',
                        icon: '🐖',
                        products: [
                            { id: 'p004', code: 'SVP-PLEČKA', name: 'Svinjska plečka', nameEn: 'Pork Shoulder', unit: 'kg' },
                            { id: 'p005', code: 'SVP-FILE', name: 'Svinjski file', nameEn: 'Pork Tenderloin', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'beef',
                        name: 'Govedina / Beef',
                        icon: '🐄',
                        products: [
                            { id: 'p006', code: 'GOV-FILE', name: 'Goveji file', nameEn: 'Beef Tenderloin', unit: 'kg' }
                        ]
                    }
                ]
            },
            {
                id: 'processed',
                name: 'Predelani izdelki / Processed Products',
                icon: '🌭',
                subgroups: [
                    {
                        id: 'sausages',
                        name: 'Klobase / Sausages',
                        icon: '🌭',
                        products: [
                            { id: 'p007', code: 'KLB-KRANJSKA', name: 'Kranjska klobasa', nameEn: 'Carniolan Sausage', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'cured',
                        name: 'Suhomesnati izdelki / Cured Meats',
                        icon: '🥓',
                        products: [
                            { id: 'p008', code: 'SUH-PRŠUT', name: 'Pršut', nameEn: 'Prosciutto', unit: 'kg' }
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
        // Load base product data (LC, C0, Cmin) - same for all customers
        this.state.products.forEach(product => {
            const base = this.getBaseProductData(product.id);

            // Calculate price levels
            const lc = base.lc;
            const c0 = lc * this.state.industryFactors.ohFactor;
            const cmin = c0 / (1 - this.state.industryFactors.minProfitMargin);

            this.state.pricingData[product.id] = {
                lc: lc,
                c0: c0,
                cmin: cmin
            };
        });
    },

    loadCustomerPricing() {
        // Load customer-specific pricing data
        const customerData = this.getCustomerPricingData();

        this.state.customerPricing = {};

        Object.entries(customerData).forEach(([productId, customers]) => {
            this.state.customerPricing[productId] = {};

            customers.forEach(custData => {
                const base = this.state.pricingData[productId];
                const strategicCmin = custData.strategicCmin;
                const cp = strategicCmin / (1 - custData.totalDiscounts / 100);
                const realizedPrice = cp * (1 - custData.totalDiscounts / 100);

                this.state.customerPricing[productId][custData.customerId] = {
                    customerId: custData.customerId,
                    customerName: custData.customerName,
                    customerType: custData.customerType,

                    // Price levels (LC, C0, Cmin inherited from product base)
                    strategicCmin: strategicCmin,
                    cp: cp,

                    // Discounts
                    totalDiscounts: custData.totalDiscounts,
                    discountBreakdown: custData.discountBreakdown,

                    // Realized price
                    realizedPrice: realizedPrice,

                    // Coverage
                    coverage: {
                        vsC0: (realizedPrice / base.c0) * 100,
                        vsCmin: (realizedPrice / base.cmin) * 100,
                        buffer: ((realizedPrice - base.cmin) / base.cmin) * 100
                    },

                    // Cumulative coverage for visualization
                    cumulativeCoverage: this.calculateCumulativeCoverage(
                        base.lc, base.c0, base.cmin, strategicCmin, cp, realizedPrice
                    )
                };
            });
        });
    },

    calculateCumulativeCoverage(lc, c0, cmin, strategicCmin, cp, realizedPrice) {
        const coverage = {
            lc: Math.min(lc, realizedPrice),
            c0: 0,
            cmin: 0,
            buffer: 0,
            discounts: cp - realizedPrice
        };

        let remaining = realizedPrice;

        // Cover LC
        coverage.lc = Math.min(lc, remaining);
        remaining -= coverage.lc;

        // Cover OH (C0 - LC)
        if (remaining > 0) {
            const ohCost = c0 - lc;
            coverage.c0 = Math.min(ohCost, remaining);
            remaining -= coverage.c0;
        }

        // Cover min profit (Cmin - C0)
        if (remaining > 0) {
            const minProfit = cmin - c0;
            coverage.cmin = Math.min(minProfit, remaining);
            remaining -= coverage.cmin;
        }

        // Buffer above Cmin
        if (remaining > 0) {
            coverage.buffer = remaining;
        }

        return coverage;
    },

    getBaseProductData(productId) {
        // Base LC costs for products (same for all customers)
        const baseData = {
            'p001': { lc: 5.44 },  // Chicken Fillet
            'p002': { lc: 3.80 },  // Chicken Breast
            'p003': { lc: 2.80 },  // Chicken Thighs
            'p004': { lc: 3.20 },  // Pork Shoulder
            'p005': { lc: 6.40 },  // Pork Tenderloin
            'p006': { lc: 12.80 }, // Beef Tenderloin
            'p007': { lc: 4.80 },  // Kranjska Sausage
            'p008': { lc: 16.00 }  // Prosciutto
        };

        return baseData[productId] || { lc: 5.0 };
    },

    getCustomerPricingData() {
        // Customer-specific pricing (multiple customers per product)
        return {
            'p001': [ // Chicken Fillet
                {
                    customerId: 'c001',
                    customerName: 'Plodine',
                    customerType: 'Trgovska veriga / Retail Chain',
                    strategicCmin: 7.25,
                    totalDiscounts: 29,
                    discountBreakdown: { invoice: 15, marketing: 3, yearEnd: 11 }
                },
                {
                    customerId: 'c002',
                    customerName: 'Lidl',
                    customerType: 'Diskont / Discount',
                    strategicCmin: 7.10,
                    totalDiscounts: 32,
                    discountBreakdown: { invoice: 18, marketing: 5, yearEnd: 9 }
                },
                {
                    customerId: 'c003',
                    customerName: 'Kaufland',
                    customerType: 'Hipermarket / Hypermarket',
                    strategicCmin: 7.50,
                    totalDiscounts: 28,
                    discountBreakdown: { invoice: 15, marketing: 5, yearEnd: 8 }
                }
            ],
            'p002': [ // Chicken Breast
                {
                    customerId: 'c002',
                    customerName: 'Lidl',
                    customerType: 'Diskont / Discount',
                    strategicCmin: 6.20,
                    totalDiscounts: 30,
                    discountBreakdown: { invoice: 16, marketing: 5, yearEnd: 9 }
                },
                {
                    customerId: 'c004',
                    customerName: 'Spar',
                    customerType: 'Supermarket',
                    strategicCmin: 6.50,
                    totalDiscounts: 25,
                    discountBreakdown: { invoice: 12, marketing: 5, yearEnd: 8 }
                }
            ],
            'p003': [ // Chicken Thighs
                {
                    customerId: 'c001',
                    customerName: 'Plodine',
                    customerType: 'Trgovska veriga / Retail Chain',
                    strategicCmin: 4.60,
                    totalDiscounts: 27,
                    discountBreakdown: { invoice: 15, marketing: 4, yearEnd: 8 }
                },
                {
                    customerId: 'c005',
                    customerName: 'Konzum',
                    customerType: 'Supermarket',
                    strategicCmin: 4.80,
                    totalDiscounts: 24,
                    discountBreakdown: { invoice: 12, marketing: 4, yearEnd: 8 }
                }
            ],
            'p004': [ // Pork Shoulder
                {
                    customerId: 'c002',
                    customerName: 'Lidl',
                    customerType: 'Diskont / Discount',
                    strategicCmin: 5.30,
                    totalDiscounts: 28,
                    discountBreakdown: { invoice: 16, marketing: 4, yearEnd: 8 }
                },
                {
                    customerId: 'c003',
                    customerName: 'Kaufland',
                    customerType: 'Hipermarket / Hypermarket',
                    strategicCmin: 5.50,
                    totalDiscounts: 26,
                    discountBreakdown: { invoice: 14, marketing: 4, yearEnd: 8 }
                }
            ],
            'p005': [ // Pork Tenderloin
                {
                    customerId: 'c001',
                    customerName: 'Plodine',
                    customerType: 'Trgovska veriga / Retail Chain',
                    strategicCmin: 10.80,
                    totalDiscounts: 29,
                    discountBreakdown: { invoice: 15, marketing: 5, yearEnd: 9 }
                },
                {
                    customerId: 'c006',
                    customerName: 'Metro',
                    customerType: 'Cash & Carry',
                    strategicCmin: 11.20,
                    totalDiscounts: 22,
                    discountBreakdown: { invoice: 10, marketing: 4, yearEnd: 8 }
                }
            ],
            'p006': [ // Beef Tenderloin
                {
                    customerId: 'c006',
                    customerName: 'Metro',
                    customerType: 'Cash & Carry',
                    strategicCmin: 22.50,
                    totalDiscounts: 25,
                    discountBreakdown: { invoice: 12, marketing: 5, yearEnd: 8 }
                },
                {
                    customerId: 'c001',
                    customerName: 'Plodine',
                    customerType: 'Trgovska veriga / Retail Chain',
                    strategicCmin: 23.00,
                    totalDiscounts: 30,
                    discountBreakdown: { invoice: 16, marketing: 5, yearEnd: 9 }
                }
            ],
            'p007': [ // Kranjska Sausage
                {
                    customerId: 'c004',
                    customerName: 'Spar',
                    customerType: 'Supermarket',
                    strategicCmin: 8.30,
                    totalDiscounts: 26,
                    discountBreakdown: { invoice: 14, marketing: 4, yearEnd: 8 }
                },
                {
                    customerId: 'c002',
                    customerName: 'Lidl',
                    customerType: 'Diskont / Discount',
                    strategicCmin: 8.00,
                    totalDiscounts: 29,
                    discountBreakdown: { invoice: 16, marketing: 5, yearEnd: 8 }
                }
            ],
            'p008': [ // Prosciutto
                {
                    customerId: 'c007',
                    customerName: 'Mercator',
                    customerType: 'Trgovska veriga / Retail Chain',
                    strategicCmin: 29.50,
                    totalDiscounts: 32,
                    discountBreakdown: { invoice: 18, marketing: 5, yearEnd: 9 }
                },
                {
                    customerId: 'c006',
                    customerName: 'Metro',
                    customerType: 'Cash & Carry',
                    strategicCmin: 30.00,
                    totalDiscounts: 28,
                    discountBreakdown: { invoice: 15, marketing: 5, yearEnd: 8 }
                }
            ]
        };
    },

    render() {
        try {
            const container = document.getElementById('pricing-container');
            if (!container) {
                console.error('Pricing container not found');
                return;
            }

            console.log('Rendering pricing V4 module to container');
            container.innerHTML = `
            <div class="pricing-v4-container">
                <div class="pricing-header">
                    <div>
                        <h1>💰 Nova cjenovna politika / New Pricing Policy</h1>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
                            Sistem cjenovnih nivoa: LC → C0 → Cmin → CP
                        </p>
                    </div>
                    <div class="header-controls">
                        <button class="btn-expand-all" onclick="PricingV4.expandAll()">
                            📂 Expand All
                        </button>
                        <button class="btn-collapse-all" onclick="PricingV4.collapseAll()">
                            📁 Collapse All
                        </button>
                        <button class="btn-info" onclick="PricingV4.showPolicyInfo()">
                            ℹ️ Policy Info
                        </button>
                    </div>
                </div>

                <div class="pricing-legend">
                    <h3>📊 Nivoi cijena / Price Levels:</h3>
                    <div class="legend-items">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #4CAF50;"></span>
                            <div class="legend-text">
                                <strong>LC</strong> - Lastna cena (Production cost without OH)
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #2196F3;"></span>
                            <div class="legend-text">
                                <strong>C0</strong> - Pokriva proizvodnju + OH (Break-even)
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #FF9800;"></span>
                            <div class="legend-text">
                                <strong>Cmin</strong> - Minimalna cijena s 4.25% dobiti (Minimum acceptable)
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #9C27B0;"></span>
                            <div class="legend-text">
                                <strong>Buffer</strong> - Rezerva iznad Cmin (Strategic buffer)
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #F44336;"></span>
                            <div class="legend-text">
                                <strong>Rabati</strong> - Razlika CP → Realized (Discounts)
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pricing-list">
                    ${this.renderPricingHierarchy()}
                </div>

                <div class="pricing-summary">
                    ${this.renderSummary()}
                </div>
            </div>

            ${this.getStyles()}
        `;
            console.log('Container HTML set successfully');
        } catch (error) {
            console.error('Error in PricingV4.render:', error);
            console.error('Stack:', error.stack);
        }
    },

    renderPricingHierarchy() {
        let html = '';

        this.state.productGroups.forEach(group => {
            const isGroupExpanded = this.state.expanded.groups.has(group.id);

            html += `
                <div class="group-container">
                    <div class="group-header" onclick="PricingV4.toggleGroup('${group.id}')">
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
                    <div class="subgroup-header" onclick="PricingV4.toggleSubgroup('${subgroup.id}')">
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
                                    <th colspan="3">Nivoi cijena / Price Levels (€/kg)</th>
                                    <th rowspan="2">Kupci<br>Customers</th>
                                </tr>
                                <tr>
                                    <th class="price-level lc">LC</th>
                                    <th class="price-level c0">C0</th>
                                    <th class="price-level cmin">Cmin</th>
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
            const customers = this.state.customerPricing[product.id] || {};
            const customerCount = Object.keys(customers).length;
            const isExpanded = this.state.expanded.products.has(product.id);

            html += `
                <tr class="product-row">
                    <td class="code">
                        ${product.code}
                    </td>
                    <td class="name">
                        <strong>${product.name}</strong>
                        <br><small>${product.nameEn}</small>
                    </td>
                    <td class="price-level lc">€${pricing.lc.toFixed(2)}</td>
                    <td class="price-level c0">€${pricing.c0.toFixed(2)}</td>
                    <td class="price-level cmin">€${pricing.cmin.toFixed(2)}</td>
                    <td class="customers-cell">
                        <button class="expand-customers-btn ${isExpanded ? 'expanded' : ''}"
                                onclick="PricingV4.toggleProduct('${product.id}')"
                                title="Show customers">
                            <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                            <span class="customer-count">👥 ${customerCount} kupci</span>
                        </button>
                    </td>
                </tr>
                ${isExpanded ? this.renderCustomerRows(product.id, pricing) : ''}
            `;
        });

        return html;
    },

    renderCustomerRows(productId, basePrice) {
        const customers = this.state.customerPricing[productId] || {};
        let html = '';

        Object.values(customers).forEach(custPricing => {
            const coverageClass = custPricing.coverage.vsCmin >= 100 ? 'full' :
                                 custPricing.coverage.vsCmin >= 95 ? 'good' :
                                 custPricing.coverage.vsCmin >= 90 ? 'medium' : 'low';

            const detailKey = `${productId}_${custPricing.customerId}`;
            const isDetailExpanded = this.state.expanded.customerDetails.has(detailKey);

            html += `
                <tr class="customer-row">
                    <td colspan="2" class="customer-info">
                        <button class="expand-detail-btn ${isDetailExpanded ? 'expanded' : ''}"
                                onclick="PricingV4.toggleCustomerDetail('${detailKey}')"
                                title="Show detailed breakdown">
                            <span class="expand-icon">${isDetailExpanded ? '▼' : '▶'}</span>
                        </button>
                        <strong>👤 ${custPricing.customerName}</strong>
                        <br><small>${custPricing.customerType}</small>
                    </td>
                    <td class="price-level strategic">
                        €${custPricing.strategicCmin.toFixed(2)}
                        ${custPricing.strategicCmin > basePrice.cmin ?
                            `<span class="buffer-badge">+${((custPricing.strategicCmin - basePrice.cmin) / basePrice.cmin * 100).toFixed(1)}%</span>` : ''}
                    </td>
                    <td class="cp-price">
                        €${custPricing.cp.toFixed(2)}
                        <br><span class="discount-badge">-${custPricing.totalDiscounts}%</span>
                    </td>
                    <td class="realized-cell">
                        <strong>€${custPricing.realizedPrice.toFixed(2)}</strong>
                        <br><span class="coverage ${coverageClass}">${custPricing.coverage.vsCmin.toFixed(1)}% vs Cmin</span>
                    </td>
                    <td class="visualization-cell">
                        ${this.renderPriceFlowChart(basePrice, custPricing)}
                    </td>
                </tr>
                ${isDetailExpanded ? this.renderDetailedBreakdown(productId, custPricing, basePrice) : ''}
            `;
        });

        return html;
    },

    renderPriceFlowChart(basePrice, custPricing) {
        const maxWidth = 280;
        const totalSpan = custPricing.cp;

        const lcWidth = (basePrice.lc / totalSpan) * maxWidth;
        const ohWidth = ((basePrice.c0 - basePrice.lc) / totalSpan) * maxWidth;
        const minProfitWidth = ((basePrice.cmin - basePrice.c0) / totalSpan) * maxWidth;
        const bufferWidth = ((custPricing.strategicCmin - basePrice.cmin) / totalSpan) * maxWidth;
        const discountWidth = ((custPricing.cp - custPricing.realizedPrice) / totalSpan) * maxWidth;

        const coveredLc = Math.min(basePrice.lc, custPricing.realizedPrice);
        const coveredOh = Math.max(0, Math.min(basePrice.c0 - basePrice.lc, custPricing.realizedPrice - basePrice.lc));
        const coveredMinProfit = Math.max(0, Math.min(basePrice.cmin - basePrice.c0, custPricing.realizedPrice - basePrice.c0));
        const coveredBuffer = Math.max(0, Math.min(custPricing.strategicCmin - basePrice.cmin, custPricing.realizedPrice - basePrice.cmin));

        const lcCoveredWidth = (coveredLc / basePrice.lc) * lcWidth;
        const ohCoveredWidth = ohWidth > 0 ? (coveredOh / (basePrice.c0 - basePrice.lc)) * ohWidth : 0;
        const minProfitCoveredWidth = minProfitWidth > 0 ? (coveredMinProfit / (basePrice.cmin - basePrice.c0)) * minProfitWidth : 0;
        const bufferCoveredWidth = bufferWidth > 0 ? (coveredBuffer / (custPricing.strategicCmin - basePrice.cmin)) * bufferWidth : 0;

        let html = '<div class="price-flow-chart">';

        html += `
            <div class="flow-segment" style="width: ${lcWidth}px;" title="LC: €${basePrice.lc.toFixed(2)}">
                <div class="segment-background" style="background: #4CAF5030; width: ${lcWidth}px;"></div>
                <div class="segment-covered" style="background: #4CAF50; width: ${lcCoveredWidth}px;"></div>
                <span class="segment-label">LC</span>
            </div>
        `;

        if (ohWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${ohWidth}px;" title="OH: €${(basePrice.c0 - basePrice.lc).toFixed(2)}">
                    <div class="segment-background" style="background: #2196F330; width: ${ohWidth}px;"></div>
                    <div class="segment-covered" style="background: #2196F3; width: ${ohCoveredWidth}px;"></div>
                    <span class="segment-label">OH</span>
                </div>
            `;
        }

        if (minProfitWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${minProfitWidth}px;" title="Min Profit: €${(basePrice.cmin - basePrice.c0).toFixed(2)}">
                    <div class="segment-background" style="background: #FF980030; width: ${minProfitWidth}px;"></div>
                    <div class="segment-covered" style="background: #FF9800; width: ${minProfitCoveredWidth}px;"></div>
                    <span class="segment-label">Min</span>
                </div>
            `;
        }

        if (bufferWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${bufferWidth}px;" title="Buffer: €${(custPricing.strategicCmin - basePrice.cmin).toFixed(2)}">
                    <div class="segment-background" style="background: #9C27B030; width: ${bufferWidth}px;"></div>
                    <div class="segment-covered" style="background: #9C27B0; width: ${bufferCoveredWidth}px;"></div>
                    <span class="segment-label">Buf</span>
                </div>
            `;
        }

        if (discountWidth > 0) {
            html += `
                <div class="flow-segment discount-segment" style="width: ${discountWidth}px;" title="Discounts: €${(custPricing.cp - custPricing.realizedPrice).toFixed(2)}">
                    <div class="segment-background" style="background: #F4433630; width: ${discountWidth}px;"></div>
                    <div class="segment-covered" style="background: #F44336; width: ${discountWidth}px;"></div>
                    <span class="segment-label">-${custPricing.totalDiscounts}%</span>
                </div>
            `;
        }

        html += '</div>';
        html += `
            <div class="flow-indicator">
                <span class="flow-arrow">CP ${custPricing.cp.toFixed(2)} →</span>
                <span class="flow-result">→ ${custPricing.realizedPrice.toFixed(2)} Realized</span>
            </div>
        `;

        return html;
    },

    renderDetailedBreakdown(productId, custPricing, basePrice) {
        const product = this.state.products.find(p => p.id === productId);

        return `
            <tr class="detail-row">
                <td colspan="6">
                    <div class="detailed-breakdown">
                        <h4>📊 Detaljni obračun / Detailed Breakdown: ${product.name} → ${custPricing.customerName}</h4>

                        <div class="breakdown-grid">
                            <div class="breakdown-section">
                                <h5>💶 Kalkulacija cijena / Price Calculation</h5>
                                <table class="breakdown-table">
                                    <tr>
                                        <td>LC (Lastna cena):</td>
                                        <td class="value">€${basePrice.lc.toFixed(2)}</td>
                                        <td class="note">Production cost without OH</td>
                                    </tr>
                                    <tr>
                                        <td>× OH Factor (${this.state.industryFactors.ohFactor}):</td>
                                        <td class="value">+€${(basePrice.c0 - basePrice.lc).toFixed(2)}</td>
                                        <td class="note">General overheads</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= C0 (Break-even):</strong></td>
                                        <td class="value"><strong>€${basePrice.c0.toFixed(2)}</strong></td>
                                        <td class="note">Covers all costs, no profit</td>
                                    </tr>
                                    <tr>
                                        <td>÷ (1 - ${(this.state.industryFactors.minProfitMargin * 100).toFixed(2)}%):</td>
                                        <td class="value">+€${(basePrice.cmin - basePrice.c0).toFixed(2)}</td>
                                        <td class="note">Minimum 4.25% profit</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= Cmin (Calculated):</strong></td>
                                        <td class="value"><strong>€${basePrice.cmin.toFixed(2)}</strong></td>
                                        <td class="note">Minimum acceptable price</td>
                                    </tr>
                                    <tr>
                                        <td>Strategic adjustment:</td>
                                        <td class="value">+€${(custPricing.strategicCmin - basePrice.cmin).toFixed(2)}</td>
                                        <td class="note">Buffer for this customer</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= Cmin (Strategic):</strong></td>
                                        <td class="value"><strong>€${custPricing.strategicCmin.toFixed(2)}</strong></td>
                                        <td class="note">Adjusted minimum price</td>
                                    </tr>
                                    <tr>
                                        <td>÷ (1 - ${custPricing.totalDiscounts}%):</td>
                                        <td class="value">+€${(custPricing.cp - custPricing.strategicCmin).toFixed(2)}</td>
                                        <td class="note">Inflate for discounts</td>
                                    </tr>
                                    <tr class="total">
                                        <td><strong>= CP (Customer Price):</strong></td>
                                        <td class="value"><strong>€${custPricing.cp.toFixed(2)}</strong></td>
                                        <td class="note">Quoted price</td>
                                    </tr>
                                </table>
                            </div>

                            <div class="breakdown-section">
                                <h5>📉 Rabati / Discounts</h5>
                                <table class="breakdown-table">
                                    ${Object.entries(custPricing.discountBreakdown).map(([key, value]) => `
                                        <tr>
                                            <td>${this.getDiscountLabel(key)}:</td>
                                            <td class="value">${value}%</td>
                                            <td class="note">€${(custPricing.cp * value / 100).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                    <tr class="subtotal">
                                        <td><strong>Total rabati:</strong></td>
                                        <td class="value"><strong>${custPricing.totalDiscounts}%</strong></td>
                                        <td class="note"><strong>€${(custPricing.cp - custPricing.realizedPrice).toFixed(2)}</strong></td>
                                    </tr>
                                    <tr class="total">
                                        <td><strong>Realized Price:</strong></td>
                                        <td class="value" colspan="2"><strong>€${custPricing.realizedPrice.toFixed(2)}</strong></td>
                                    </tr>
                                </table>
                            </div>

                            <div class="breakdown-section">
                                <h5>✅ Pokritje / Coverage Analysis</h5>
                                <table class="breakdown-table">
                                    <tr>
                                        <td>Coverage vs C0:</td>
                                        <td class="value ${custPricing.coverage.vsC0 >= 100 ? 'good' : 'bad'}">
                                            ${custPricing.coverage.vsC0.toFixed(1)}%
                                        </td>
                                        <td class="note">${custPricing.coverage.vsC0 >= 100 ? '✓ Covers break-even' : '✗ Below break-even'}</td>
                                    </tr>
                                    <tr>
                                        <td>Coverage vs Cmin:</td>
                                        <td class="value ${custPricing.coverage.vsCmin >= 100 ? 'good' : 'bad'}">
                                            ${custPricing.coverage.vsCmin.toFixed(1)}%
                                        </td>
                                        <td class="note">${custPricing.coverage.vsCmin >= 100 ? '✓ Meets minimum' : '✗ Below minimum'}</td>
                                    </tr>
                                    <tr>
                                        <td>Buffer above Cmin:</td>
                                        <td class="value ${custPricing.coverage.buffer >= 0 ? 'good' : 'bad'}">
                                            ${custPricing.coverage.buffer > 0 ? '+' : ''}${custPricing.coverage.buffer.toFixed(1)}%
                                        </td>
                                        <td class="note">€${(custPricing.realizedPrice - basePrice.cmin).toFixed(2)}</td>
                                    </tr>
                                </table>

                                <div class="coverage-status">
                                    ${custPricing.coverage.vsCmin >= 100 ?
                                        '<div class="status-good">✓ Cijena je prihvatljiva / Price is acceptable</div>' :
                                        '<div class="status-bad">⚠ Potrebno odobrenje voditelja industrije / Requires Industry Manager approval</div>'}
                                </div>
                            </div>
                        </div>

                        <div class="breakdown-note">
                            <strong>Napomena:</strong> Prosjek svih cijena (pondreriranih s količinama) treba biti na nivou Cmin!
                            <br><em>Note: Average of all prices (weighted by quantities) must be at Cmin level!</em>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    },

    getDiscountLabel(key) {
        const labels = {
            invoice: 'Rabat na fakturi / Invoice discount',
            marketing: 'Marketing / Marketing fee',
            yearEnd: 'Godišnji bonus / Year-end bonus'
        };
        return labels[key] || key;
    },

    renderSummary() {
        // Collect all customer pricing records
        const allCustomerPricing = [];
        Object.values(this.state.customerPricing).forEach(customers => {
            Object.values(customers).forEach(custPricing => {
                allCustomerPricing.push(custPricing);
            });
        });

        const avgCoverage = allCustomerPricing.reduce((sum, p) => sum + p.coverage.vsCmin, 0) / allCustomerPricing.length;
        const fullCoverage = allCustomerPricing.filter(p => p.coverage.vsCmin >= 100).length;
        const needsApproval = allCustomerPricing.filter(p => p.coverage.vsCmin < 100).length;

        return `
            <div class="summary-card">
                <h3>📊 Sažetak / Summary</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Broj artikala / Products:</span>
                        <span class="stat-value">${this.state.products.length}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Kombinacije kupac-artikl / Customer-Product combinations:</span>
                        <span class="stat-value">${allCustomerPricing.length}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Prosječno pokritje Cmin / Avg Cmin Coverage:</span>
                        <span class="stat-value ${avgCoverage >= 100 ? 'good' : 'warning'}">${avgCoverage.toFixed(1)}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Potpuno pokritje / Full coverage:</span>
                        <span class="stat-value good">${fullCoverage}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Potrebno odobrenje / Needs approval:</span>
                        <span class="stat-value ${needsApproval > 0 ? 'warning' : 'good'}">${needsApproval}</span>
                    </div>
                </div>

                <div class="policy-reminder">
                    <strong>🎯 Cilj:</strong> Uvijek težiti ka većoj cijeni od Cmin zbog drugih slučajeva gdje nećemo moći postići Cmin
                    <br><em>Goal: Always aim for higher price than Cmin to compensate for cases where Cmin cannot be achieved</em>
                </div>
            </div>
        `;
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

    toggleProduct(productId) {
        if (this.state.expanded.products.has(productId)) {
            this.state.expanded.products.delete(productId);
        } else {
            this.state.expanded.products.add(productId);
        }
        this.render();
    },

    toggleCustomerDetail(detailKey) {
        if (this.state.expanded.customerDetails.has(detailKey)) {
            this.state.expanded.customerDetails.delete(detailKey);
        } else {
            this.state.expanded.customerDetails.add(detailKey);
        }
        this.render();
    },

    expandAll() {
        this.state.productGroups.forEach(group => {
            this.state.expanded.groups.add(group.id);
            group.subgroups.forEach(subgroup => {
                this.state.expanded.subgroups.add(subgroup.id);
                subgroup.products.forEach(product => {
                    this.state.expanded.products.add(product.id);
                });
            });
        });
        this.render();
    },

    collapseAll() {
        this.state.expanded.groups.clear();
        this.state.expanded.subgroups.clear();
        this.state.expanded.products.clear();
        this.state.expanded.customerDetails.clear();
        this.render();
    },

    showPolicyInfo() {
        alert(`Nova cjenovna politika / New Pricing Policy

Tri cijene / Three Prices:

C0 - Cijena koja samo pokriva ukupne troškove proizvodnje (zajedno s općim troškovima – OH)
     Price that only covers total production costs (together with general overheads)
     Approval to go lower: Director of Sales or General Director

Cmin - Cijena nakon uračunanih svih (potencialnih) odobrenja kupcu + minimalna dobit 4.25%
       Price after all (potential) discounts to customer + minimum profit 4.25%
       Approval to go lower: Industry Manager

CP - Prodajna cijena, povećana za sva (potencialna) odobrenja kupcu
     Sales price, inflated for all (potential) discounts to customer

⚠️ VAŽNO: Transferna cijena Delamaris ZG ↔ Pivka d.d. je NEBITNA!
          Važna je marža od početka do kraja, ne mjesto gdje se ostvarila.`);
    },

    getGroupProductCount(group) {
        return group.subgroups.reduce((total, sg) => total + sg.products.length, 0);
    },

    getStyles() {
        return `
            <style>
                .pricing-v4-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1800px;
                    margin: 0 auto;
                    background: #f5f7fa;
                }

                .pricing-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .pricing-header h1 {
                    margin: 0;
                    font-size: 26px;
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
                    font-weight: 500;
                }

                .header-controls button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }

                .pricing-legend {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .pricing-legend h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 18px;
                }

                .legend-items {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                }

                .legend-color {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    flex-shrink: 0;
                }

                .legend-text {
                    font-size: 13px;
                    line-height: 1.4;
                }

                .legend-text strong {
                    display: block;
                    font-size: 14px;
                    margin-bottom: 2px;
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
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                }

                .group-header {
                    background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
                    padding: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 18px;
                    font-weight: 600;
                    transition: all 0.3s;
                    border-bottom: 2px solid #e0e0e0;
                }

                .group-header:hover {
                    background: linear-gradient(135deg, #eeeeee 0%, #e8e8e8 100%);
                }

                .group-content {
                    padding: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }

                .group-content.expanded {
                    max-height: 10000px;
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
                    background: #fafafa;
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
                    background: #f0f0f0;
                }

                .subgroup-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }

                .subgroup-content.expanded {
                    max-height: 10000px;
                    transition: max-height 0.5s ease-in;
                    overflow-x: auto;
                }

                .expand-icon {
                    width: 20px;
                    font-size: 12px;
                    color: #666;
                    display: inline-block;
                }

                .pricing-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    min-width: 1000px;
                    font-size: 13px;
                }

                .pricing-table thead {
                    background: #263238;
                    color: white;
                }

                .pricing-table th {
                    padding: 10px 8px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid #37474f;
                }

                .price-level {
                    text-align: center !important;
                    min-width: 70px;
                }

                .price-level.lc { background: #4CAF5020; }
                .price-level.c0 { background: #2196F320; }
                .price-level.cmin { background: #FF980020; }
                .price-level.strategic { background: #9C27B020; text-align: right; }

                .pricing-table td {
                    padding: 10px 8px;
                    border: 1px solid #e9ecef;
                }

                .product-row {
                    background: white;
                    transition: background 0.2s;
                }

                .product-row:hover {
                    background: #f8f9fa;
                }

                .product-row .code {
                    font-weight: 600;
                    color: #2196f3;
                }

                .product-row .name small {
                    color: #888;
                    font-style: italic;
                }

                .customers-cell {
                    text-align: center;
                }

                .expand-customers-btn {
                    background: #e3f2fd;
                    border: 1px solid #2196f3;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    color: #1976d2;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }

                .expand-customers-btn:hover {
                    background: #bbdefb;
                }

                .expand-customers-btn.expanded {
                    background: #2196f3;
                    color: white;
                }

                .customer-row {
                    background: #f8f9fa;
                    border-left: 3px solid #2196f3;
                }

                .customer-row:hover {
                    background: #eceff1;
                }

                .customer-info {
                    padding-left: 40px !important;
                    position: relative;
                }

                .expand-detail-btn {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: 1px solid #ccc;
                    width: 20px;
                    height: 20px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 10px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .expand-detail-btn:hover {
                    background: #e3f2fd;
                    border-color: #2196f3;
                }

                .expand-detail-btn.expanded {
                    background: #2196f3;
                    border-color: #2196f3;
                    color: white;
                }

                .customer-info strong {
                    color: #1976d2;
                }

                .cp-price {
                    text-align: right;
                    color: #9C27B0;
                    font-weight: 600;
                }

                .realized-cell {
                    text-align: right;
                }

                .realized-cell strong {
                    color: #2e7d32;
                    font-size: 14px;
                }

                .buffer-badge {
                    display: inline-block;
                    background: #9C27B0;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    margin-left: 4px;
                }

                .discount-badge {
                    display: inline-block;
                    background: #F44336;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .coverage {
                    font-size: 11px;
                    font-weight: bold;
                    padding: 3px 6px;
                    border-radius: 3px;
                }

                .coverage.full { background: #4CAF50; color: white; }
                .coverage.good { background: #8BC34A; color: white; }
                .coverage.medium { background: #FFC107; color: #333; }
                .coverage.low { background: #FF5722; color: white; }

                .visualization-cell {
                    min-width: 300px;
                }

                /* Price Flow Chart */
                .price-flow-chart {
                    display: flex;
                    height: 30px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                    background: #fafafa;
                    margin-bottom: 4px;
                }

                .flow-segment {
                    position: relative;
                    display: inline-block;
                    height: 100%;
                    border-right: 1px solid rgba(0,0,0,0.1);
                }

                .flow-segment.discount-segment {
                    border-left: 2px dashed #F44336;
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
                    font-size: 10px;
                    font-weight: bold;
                    color: #333;
                    white-space: nowrap;
                    pointer-events: none;
                    text-shadow: 0 0 3px white, 0 0 3px white;
                }

                .flow-indicator {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #666;
                    font-weight: 600;
                    margin-top: 2px;
                }

                .flow-arrow {
                    color: #9C27B0;
                }

                .flow-result {
                    color: #2e7d32;
                }

                /* Detailed Breakdown */
                .detail-row {
                    background: #f8f9fa;
                }

                .detailed-breakdown {
                    padding: 20px;
                    background: white;
                    border: 2px solid #e3f2fd;
                    border-radius: 8px;
                    margin: 10px;
                }

                .detailed-breakdown h4 {
                    margin: 0 0 20px 0;
                    color: #1976d2;
                    font-size: 18px;
                    border-bottom: 2px solid #e3f2fd;
                    padding-bottom: 10px;
                }

                .breakdown-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .breakdown-section h5 {
                    margin: 0 0 10px 0;
                    color: #37474f;
                    font-size: 15px;
                    border-bottom: 1px solid #e0e0e0;
                    padding-bottom: 5px;
                }

                .breakdown-table {
                    width: 100%;
                    font-size: 13px;
                }

                .breakdown-table td {
                    padding: 6px 8px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .breakdown-table .value {
                    text-align: right;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .breakdown-table .value.good {
                    color: #2e7d32;
                }

                .breakdown-table .value.bad {
                    color: #c62828;
                }

                .breakdown-table .note {
                    color: #666;
                    font-size: 11px;
                    font-style: italic;
                }

                .breakdown-table .subtotal {
                    border-top: 1px solid #bbb;
                    background: #f5f5f5;
                }

                .breakdown-table .total {
                    border-top: 2px solid #333;
                    background: #e3f2fd;
                    font-size: 14px;
                }

                .coverage-status {
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 6px;
                    text-align: center;
                    font-weight: 600;
                }

                .status-good {
                    background: #c8e6c9;
                    color: #2e7d32;
                }

                .status-bad {
                    background: #ffcdd2;
                    color: #c62828;
                }

                .breakdown-note {
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    border-radius: 4px;
                    font-size: 13px;
                }

                /* Summary */
                .pricing-summary {
                    background: white;
                    border-radius: 10px;
                    padding: 25px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .summary-card h3 {
                    margin: 0 0 20px 0;
                    color: #2c3e50;
                    font-size: 20px;
                }

                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .stat {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #2196f3;
                }

                .stat-label {
                    color: #666;
                    font-size: 13px;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2196f3;
                }

                .stat-value.good {
                    color: #4CAF50;
                }

                .stat-value.warning {
                    color: #FF9800;
                }

                .policy-reminder {
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                    padding: 15px;
                    border-radius: 4px;
                    font-size: 13px;
                    line-height: 1.6;
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
window.PricingV4 = PricingV4;

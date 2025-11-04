// Pricing Module V4 - Price Levels System (LC, C0, Cmin, CP)
// New pricing policy with 4 price levels instead of overhead breakdown
const PricingV4 = {
    VERSION: '4.0.0',

    state: {
        expanded: {
            groups: new Set(['fresh', 'processed']),
            subgroups: new Set(),
            productDetails: new Set() // Track which products show detailed breakdown
        },
        products: [],
        productGroups: [],
        pricingData: {},
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
            this.loadSavedPricingData();
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
                            { id: 'p005', code: 'SVP-FILE', name: 'Svinjski file', nameEn: 'Pork Tenderloin', unit: 'kg' },
                            { id: 'p006', code: 'SVP-REBRA', name: 'Svinjska rebra', nameEn: 'Pork Ribs', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'beef',
                        name: 'Govedina / Beef',
                        icon: '🐄',
                        products: [
                            { id: 'p007', code: 'GOV-FILE', name: 'Goveji file', nameEn: 'Beef Tenderloin', unit: 'kg' },
                            { id: 'p008', code: 'GOV-ZREZEK', name: 'Goveji zrezek', nameEn: 'Beef Steak', unit: 'kg' }
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
                            { id: 'p009', code: 'KLB-KRANJSKA', name: 'Kranjska klobasa', nameEn: 'Carniolan Sausage', unit: 'kg' },
                            { id: 'p010', code: 'KLB-ČEVAPI', name: 'Čevapčiči', nameEn: 'Cevapcici', unit: 'kg' }
                        ]
                    },
                    {
                        id: 'cured',
                        name: 'Suhomesnati izdelki / Cured Meats',
                        icon: '🥓',
                        products: [
                            { id: 'p011', code: 'SUH-PRŠUT', name: 'Pršut', nameEn: 'Prosciutto', unit: 'kg' },
                            { id: 'p012', code: 'SUH-SALAMA', name: 'Salama', nameEn: 'Salami', unit: 'kg' }
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
        // Generate pricing data with price levels for all products
        this.state.products.forEach(product => {
            const base = this.getBaseData(product.id);

            // Calculate price levels
            const lc = base.lc;  // Lastna cena (production cost without OH)
            const c0 = lc * this.state.industryFactors.ohFactor;  // LC + OH
            const cmin = c0 / (1 - this.state.industryFactors.minProfitMargin);  // C0 + 4.25% profit
            const strategicCmin = base.strategicCmin || cmin;  // Can be adjusted higher
            const cp = strategicCmin / (1 - base.totalDiscounts / 100);  // Inflated for discounts

            this.state.pricingData[product.id] = {
                // Base costs
                lc: lc,                    // Lastna cena (production cost)

                // Price levels
                c0: c0,                    // Break-even (LC + OH)
                cmin: cmin,                // Minimum acceptable (C0 + 4.25% profit)
                strategicCmin: strategicCmin,  // Strategic adjustment
                cp: cp,                    // Customer price (quoted)

                // Customer-specific data
                totalDiscounts: base.totalDiscounts,  // Total % of discounts
                discountBreakdown: base.discountBreakdown || {},

                // Actual realized price (after discounts)
                realizedPrice: cp * (1 - base.totalDiscounts / 100),

                // Coverage metrics
                coverage: {
                    vsC0: 0,      // How well realized price covers C0
                    vsCmin: 0,    // How well realized price covers Cmin
                    buffer: 0     // Buffer above Cmin
                },

                // Customer info (for presentation)
                customerName: base.customerName || 'Plodine',
                customerType: base.customerType || 'Trgovska veriga / Retail Chain'
            };

            // Calculate coverage
            this.calculateCoverage(product.id);
        });
    },

    getBaseData(productId) {
        // Real pricing examples from the presentation
        const baseData = {
            // POULTRY - Using Chicken Fillet example from presentation
            'p001': {
                lc: 5.44,           // Calculated backward: 6.80 / 1.25
                totalDiscounts: 29,  // 15% invoice + 3% marketing + 11% year-end
                strategicCmin: 7.25, // Raised from 7.10 to create buffer
                customerName: 'Plodine',
                customerType: 'Trgovska veriga / Retail Chain',
                discountBreakdown: {
                    invoice: 15,
                    marketing: 3,
                    yearEnd: 11
                }
            },
            'p002': {
                lc: 3.80,
                totalDiscounts: 25,
                strategicCmin: 6.20,
                customerName: 'Kaufland',
                customerType: 'Hipermarket / Hypermarket',
                discountBreakdown: { invoice: 12, marketing: 5, yearEnd: 8 }
            },
            'p003': {
                lc: 2.80,
                totalDiscounts: 22,
                strategicCmin: 4.60,
                customerName: 'Spar',
                customerType: 'Supermarket',
                discountBreakdown: { invoice: 10, marketing: 4, yearEnd: 8 }
            },

            // PORK
            'p004': {
                lc: 3.20,
                totalDiscounts: 27,
                strategicCmin: 5.30,
                customerName: 'Lidl',
                customerType: 'Diskont / Discount',
                discountBreakdown: { invoice: 15, marketing: 4, yearEnd: 8 }
            },
            'p005': {
                lc: 6.40,
                totalDiscounts: 28,
                strategicCmin: 10.80,
                customerName: 'Plodine',
                customerType: 'Trgovska veriga / Retail Chain',
                discountBreakdown: { invoice: 15, marketing: 5, yearEnd: 8 }
            },
            'p006': {
                lc: 2.80,
                totalDiscounts: 24,
                strategicCmin: 4.80,
                customerName: 'Konzum',
                customerType: 'Supermarket',
                discountBreakdown: { invoice: 12, marketing: 4, yearEnd: 8 }
            },

            // BEEF
            'p007': {
                lc: 12.80,
                totalDiscounts: 30,
                strategicCmin: 22.50,
                customerName: 'Metro',
                customerType: 'Cash & Carry',
                discountBreakdown: { invoice: 18, marketing: 4, yearEnd: 8 }
            },
            'p008': {
                lc: 9.60,
                totalDiscounts: 26,
                strategicCmin: 16.50,
                customerName: 'Plodine',
                customerType: 'Trgovska veriga / Retail Chain',
                discountBreakdown: { invoice: 14, marketing: 4, yearEnd: 8 }
            },

            // PROCESSED - SAUSAGES
            'p009': {
                lc: 4.80,
                totalDiscounts: 26,
                strategicCmin: 8.30,
                customerName: 'Spar',
                customerType: 'Supermarket',
                discountBreakdown: { invoice: 14, marketing: 4, yearEnd: 8 }
            },
            'p010': {
                lc: 3.60,
                totalDiscounts: 23,
                strategicCmin: 6.00,
                customerName: 'Kaufland',
                customerType: 'Hipermarket / Hypermarket',
                discountBreakdown: { invoice: 12, marketing: 3, yearEnd: 8 }
            },

            // CURED MEATS
            'p011': {
                lc: 16.00,
                totalDiscounts: 32,
                strategicCmin: 29.50,
                customerName: 'Mercator',
                customerType: 'Trgovska veriga / Retail Chain',
                discountBreakdown: { invoice: 18, marketing: 5, yearEnd: 9 }
            },
            'p012': {
                lc: 11.20,
                totalDiscounts: 28,
                strategicCmin: 19.80,
                customerName: 'Lidl',
                customerType: 'Diskont / Discount',
                discountBreakdown: { invoice: 16, marketing: 4, yearEnd: 8 }
            }
        };

        return baseData[productId] || {
            lc: 5.0,
            totalDiscounts: 25,
            strategicCmin: 8.0,
            customerName: 'Generic Customer',
            customerType: 'Retail',
            discountBreakdown: { invoice: 15, marketing: 5, yearEnd: 5 }
        };
    },

    calculateCoverage(productId) {
        const data = this.state.pricingData[productId];

        // Calculate coverage metrics
        data.coverage.vsC0 = (data.realizedPrice / data.c0) * 100;
        data.coverage.vsCmin = (data.realizedPrice / data.cmin) * 100;
        data.coverage.buffer = ((data.realizedPrice - data.cmin) / data.cmin) * 100;

        // Calculate cumulative coverage for visualization
        // Shows how CP "flows down" through discounts to realized price, covering each level
        data.cumulativeCoverage = {
            lc: Math.min(data.lc, data.realizedPrice),
            c0: 0,
            cmin: 0,
            buffer: 0,
            discounts: data.cp - data.realizedPrice  // Amount "lost" to discounts
        };

        let remaining = data.realizedPrice;

        // First cover LC
        data.cumulativeCoverage.lc = Math.min(data.lc, remaining);
        remaining -= data.cumulativeCoverage.lc;

        // Then cover OH (difference between C0 and LC)
        if (remaining > 0) {
            const ohCost = data.c0 - data.lc;
            data.cumulativeCoverage.c0 = Math.min(ohCost, remaining);
            remaining -= data.cumulativeCoverage.c0;
        }

        // Then cover minimum profit (difference between Cmin and C0)
        if (remaining > 0) {
            const minProfit = data.cmin - data.c0;
            data.cumulativeCoverage.cmin = Math.min(minProfit, remaining);
            remaining -= data.cumulativeCoverage.cmin;
        }

        // Anything left is buffer above Cmin
        if (remaining > 0) {
            data.cumulativeCoverage.buffer = remaining;
        }
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
                                    <th rowspan="2">Kupec<br>Customer</th>
                                    <th colspan="4">Nivoi cijena / Price Levels (€/kg)</th>
                                    <th rowspan="2">CP<br>Quoted</th>
                                    <th rowspan="2">Rabati<br>Discounts</th>
                                    <th rowspan="2">Realized<br>Net</th>
                                    <th rowspan="2">Pokritje<br>vs Cmin</th>
                                    <th rowspan="2" style="min-width: 300px;">Vizualizacija toka cijene<br>Price Flow Visualization</th>
                                </tr>
                                <tr>
                                    <th class="price-level lc">LC</th>
                                    <th class="price-level c0">C0</th>
                                    <th class="price-level cmin">Cmin</th>
                                    <th class="price-level strategic">Strategic</th>
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
            const coverageClass = pricing.coverage.vsCmin >= 100 ? 'full' :
                                 pricing.coverage.vsCmin >= 95 ? 'good' :
                                 pricing.coverage.vsCmin >= 90 ? 'medium' : 'low';

            const isExpanded = this.state.expanded.productDetails.has(product.id);

            html += `
                <tr class="product-row">
                    <td class="code">
                        <button class="expand-details-btn"
                                onclick="PricingV4.toggleProductDetails('${product.id}')"
                                title="Show detailed breakdown">
                            <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                        </button>
                        ${product.code}
                    </td>
                    <td class="name">
                        <strong>${product.name}</strong>
                        <br><small>${product.nameEn}</small>
                    </td>
                    <td class="customer">
                        <strong>${pricing.customerName}</strong>
                        <br><small>${pricing.customerType}</small>
                    </td>
                    <td class="price-level lc">€${pricing.lc.toFixed(2)}</td>
                    <td class="price-level c0">€${pricing.c0.toFixed(2)}</td>
                    <td class="price-level cmin">€${pricing.cmin.toFixed(2)}</td>
                    <td class="price-level strategic">
                        €${pricing.strategicCmin.toFixed(2)}
                        ${pricing.strategicCmin > pricing.cmin ?
                            `<span class="buffer-badge">+${((pricing.strategicCmin - pricing.cmin) / pricing.cmin * 100).toFixed(1)}%</span>` : ''}
                    </td>
                    <td class="cp-price">€${pricing.cp.toFixed(2)}</td>
                    <td class="discounts">
                        <span class="discount-badge">${pricing.totalDiscounts}%</span>
                    </td>
                    <td class="realized">
                        <strong>€${pricing.realizedPrice.toFixed(2)}</strong>
                    </td>
                    <td class="coverage ${coverageClass}">
                        ${pricing.coverage.vsCmin.toFixed(1)}%
                    </td>
                    <td class="visualization">
                        ${this.renderPriceFlowChart(pricing)}
                    </td>
                </tr>
                ${isExpanded ? this.renderDetailedBreakdown(product.id) : ''}
            `;
        });

        return html;
    },

    renderPriceFlowChart(pricing) {
        const maxWidth = 280; // pixels

        // Calculate the total span (from 0 to CP)
        const totalSpan = pricing.cp;

        // Calculate widths for each component
        const lcWidth = (pricing.lc / totalSpan) * maxWidth;
        const ohWidth = ((pricing.c0 - pricing.lc) / totalSpan) * maxWidth;
        const minProfitWidth = ((pricing.cmin - pricing.c0) / totalSpan) * maxWidth;
        const bufferWidth = ((pricing.strategicCmin - pricing.cmin) / totalSpan) * maxWidth;
        const discountWidth = ((pricing.cp - pricing.realizedPrice) / totalSpan) * maxWidth;

        // What's actually covered
        const coveredLc = Math.min(pricing.lc, pricing.realizedPrice);
        const coveredOh = Math.max(0, Math.min(pricing.c0 - pricing.lc, pricing.realizedPrice - pricing.lc));
        const coveredMinProfit = Math.max(0, Math.min(pricing.cmin - pricing.c0, pricing.realizedPrice - pricing.c0));
        const coveredBuffer = Math.max(0, Math.min(pricing.strategicCmin - pricing.cmin, pricing.realizedPrice - pricing.cmin));

        const lcCoveredWidth = (coveredLc / pricing.lc) * lcWidth;
        const ohCoveredWidth = ohWidth > 0 ? (coveredOh / (pricing.c0 - pricing.lc)) * ohWidth : 0;
        const minProfitCoveredWidth = minProfitWidth > 0 ? (coveredMinProfit / (pricing.cmin - pricing.c0)) * minProfitWidth : 0;
        const bufferCoveredWidth = bufferWidth > 0 ? (coveredBuffer / (pricing.strategicCmin - pricing.cmin)) * bufferWidth : 0;

        let html = '<div class="price-flow-chart">';

        // LC segment
        html += `
            <div class="flow-segment" style="width: ${lcWidth}px;" title="LC: €${pricing.lc.toFixed(2)}">
                <div class="segment-background" style="background: #4CAF5030; width: ${lcWidth}px;"></div>
                <div class="segment-covered" style="background: #4CAF50; width: ${lcCoveredWidth}px;"></div>
                <span class="segment-label">LC</span>
            </div>
        `;

        // OH segment (C0 - LC)
        if (ohWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${ohWidth}px;" title="OH: €${(pricing.c0 - pricing.lc).toFixed(2)}">
                    <div class="segment-background" style="background: #2196F330; width: ${ohWidth}px;"></div>
                    <div class="segment-covered" style="background: #2196F3; width: ${ohCoveredWidth}px;"></div>
                    <span class="segment-label">OH</span>
                </div>
            `;
        }

        // Min Profit segment (Cmin - C0)
        if (minProfitWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${minProfitWidth}px;" title="Min Profit: €${(pricing.cmin - pricing.c0).toFixed(2)}">
                    <div class="segment-background" style="background: #FF980030; width: ${minProfitWidth}px;"></div>
                    <div class="segment-covered" style="background: #FF9800; width: ${minProfitCoveredWidth}px;"></div>
                    <span class="segment-label">Min</span>
                </div>
            `;
        }

        // Buffer segment (Strategic - Cmin)
        if (bufferWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${bufferWidth}px;" title="Buffer: €${(pricing.strategicCmin - pricing.cmin).toFixed(2)}">
                    <div class="segment-background" style="background: #9C27B030; width: ${bufferWidth}px;"></div>
                    <div class="segment-covered" style="background: #9C27B0; width: ${bufferCoveredWidth}px;"></div>
                    <span class="segment-label">Buf</span>
                </div>
            `;
        }

        // Discount segment (CP - Realized)
        if (discountWidth > 0) {
            html += `
                <div class="flow-segment discount-segment" style="width: ${discountWidth}px;" title="Discounts: €${(pricing.cp - pricing.realizedPrice).toFixed(2)}">
                    <div class="segment-background" style="background: #F4433630; width: ${discountWidth}px;"></div>
                    <div class="segment-covered" style="background: #F44336; width: ${discountWidth}px;"></div>
                    <span class="segment-label">-${pricing.totalDiscounts}%</span>
                </div>
            `;
        }

        html += '</div>';

        // Add flow indicator
        html += `
            <div class="flow-indicator">
                <span class="flow-arrow">CP ${pricing.cp.toFixed(2)} →</span>
                <span class="flow-result">→ ${pricing.realizedPrice.toFixed(2)} Realized</span>
            </div>
        `;

        return html;
    },

    renderDetailedBreakdown(productId) {
        const product = this.state.products.find(p => p.id === productId);
        const pricing = this.state.pricingData[productId];

        return `
            <tr class="detail-row">
                <td colspan="12">
                    <div class="detailed-breakdown">
                        <h4>📊 Detaljni obračun / Detailed Breakdown: ${product.name}</h4>

                        <div class="breakdown-grid">
                            <div class="breakdown-section">
                                <h5>💶 Kalkulacija cijena / Price Calculation</h5>
                                <table class="breakdown-table">
                                    <tr>
                                        <td>LC (Lastna cena):</td>
                                        <td class="value">€${pricing.lc.toFixed(2)}</td>
                                        <td class="note">Production cost without OH</td>
                                    </tr>
                                    <tr>
                                        <td>× OH Factor (${this.state.industryFactors.ohFactor}):</td>
                                        <td class="value">+€${(pricing.c0 - pricing.lc).toFixed(2)}</td>
                                        <td class="note">General overheads</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= C0 (Break-even):</strong></td>
                                        <td class="value"><strong>€${pricing.c0.toFixed(2)}</strong></td>
                                        <td class="note">Covers all costs, no profit</td>
                                    </tr>
                                    <tr>
                                        <td>÷ (1 - ${(this.state.industryFactors.minProfitMargin * 100).toFixed(2)}%):</td>
                                        <td class="value">+€${(pricing.cmin - pricing.c0).toFixed(2)}</td>
                                        <td class="note">Minimum 4.25% profit</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= Cmin (Calculated):</strong></td>
                                        <td class="value"><strong>€${pricing.cmin.toFixed(2)}</strong></td>
                                        <td class="note">Minimum acceptable price</td>
                                    </tr>
                                    <tr>
                                        <td>Strategic adjustment:</td>
                                        <td class="value">+€${(pricing.strategicCmin - pricing.cmin).toFixed(2)}</td>
                                        <td class="note">Buffer for difficult customers</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= Cmin (Strategic):</strong></td>
                                        <td class="value"><strong>€${pricing.strategicCmin.toFixed(2)}</strong></td>
                                        <td class="note">Adjusted minimum price</td>
                                    </tr>
                                    <tr>
                                        <td>÷ (1 - ${pricing.totalDiscounts}%):</td>
                                        <td class="value">+€${(pricing.cp - pricing.strategicCmin).toFixed(2)}</td>
                                        <td class="note">Inflate for discounts</td>
                                    </tr>
                                    <tr class="total">
                                        <td><strong>= CP (Customer Price):</strong></td>
                                        <td class="value"><strong>€${pricing.cp.toFixed(2)}</strong></td>
                                        <td class="note">Quoted price</td>
                                    </tr>
                                </table>
                            </div>

                            <div class="breakdown-section">
                                <h5>📉 Rabati / Discounts</h5>
                                <table class="breakdown-table">
                                    ${Object.entries(pricing.discountBreakdown).map(([key, value]) => `
                                        <tr>
                                            <td>${this.getDiscountLabel(key)}:</td>
                                            <td class="value">${value}%</td>
                                            <td class="note">€${(pricing.cp * value / 100).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                    <tr class="subtotal">
                                        <td><strong>Total rabati:</strong></td>
                                        <td class="value"><strong>${pricing.totalDiscounts}%</strong></td>
                                        <td class="note"><strong>€${(pricing.cp - pricing.realizedPrice).toFixed(2)}</strong></td>
                                    </tr>
                                    <tr class="total">
                                        <td><strong>Realized Price:</strong></td>
                                        <td class="value" colspan="2"><strong>€${pricing.realizedPrice.toFixed(2)}</strong></td>
                                    </tr>
                                </table>
                            </div>

                            <div class="breakdown-section">
                                <h5>✅ Pokritje / Coverage Analysis</h5>
                                <table class="breakdown-table">
                                    <tr>
                                        <td>Coverage vs C0:</td>
                                        <td class="value ${pricing.coverage.vsC0 >= 100 ? 'good' : 'bad'}">
                                            ${pricing.coverage.vsC0.toFixed(1)}%
                                        </td>
                                        <td class="note">${pricing.coverage.vsC0 >= 100 ? '✓ Covers break-even' : '✗ Below break-even'}</td>
                                    </tr>
                                    <tr>
                                        <td>Coverage vs Cmin:</td>
                                        <td class="value ${pricing.coverage.vsCmin >= 100 ? 'good' : 'bad'}">
                                            ${pricing.coverage.vsCmin.toFixed(1)}%
                                        </td>
                                        <td class="note">${pricing.coverage.vsCmin >= 100 ? '✓ Meets minimum' : '✗ Below minimum'}</td>
                                    </tr>
                                    <tr>
                                        <td>Buffer above Cmin:</td>
                                        <td class="value ${pricing.coverage.buffer >= 0 ? 'good' : 'bad'}">
                                            ${pricing.coverage.buffer > 0 ? '+' : ''}${pricing.coverage.buffer.toFixed(1)}%
                                        </td>
                                        <td class="note">€${(pricing.realizedPrice - pricing.cmin).toFixed(2)}</td>
                                    </tr>
                                </table>

                                <div class="coverage-status">
                                    ${pricing.coverage.vsCmin >= 100 ?
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
        const allPricing = Object.values(this.state.pricingData);
        const avgCoverage = allPricing.reduce((sum, p) => sum + p.coverage.vsCmin, 0) / allPricing.length;
        const fullCoverage = allPricing.filter(p => p.coverage.vsCmin >= 100).length;
        const needsApproval = allPricing.filter(p => p.coverage.vsCmin < 100).length;

        return `
            <div class="summary-card">
                <h3>📊 Sažetak / Summary</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Broj artikala / Products:</span>
                        <span class="stat-value">${this.state.products.length}</span>
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

    toggleProductDetails(productId) {
        if (this.state.expanded.productDetails.has(productId)) {
            this.state.expanded.productDetails.delete(productId);
        } else {
            this.state.expanded.productDetails.add(productId);
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
        this.state.expanded.productDetails.clear();
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

    savePricingData() {
        localStorage.setItem('ch_pricing_data_v4', JSON.stringify(this.state.pricingData));
        console.log('Pricing data V4 saved');
    },

    loadSavedPricingData() {
        const saved = localStorage.getItem('ch_pricing_data_v4');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(this.state.pricingData, data);
                this.state.products.forEach(product => {
                    this.calculateCoverage(product.id);
                });
                console.log('Pricing data V4 loaded from storage');
            } catch (e) {
                console.error('Error loading saved pricing data V4:', e);
            }
        }
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
                    max-height: 5000px;
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
                    min-width: 1400px;
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
                .price-level.strategic { background: #9C27B020; }

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

                .expand-details-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px 5px;
                    margin-right: 5px;
                    font-size: 12px;
                }

                .product-row .name small {
                    color: #888;
                    font-style: italic;
                }

                .product-row .customer {
                    font-size: 12px;
                }

                .product-row .customer strong {
                    color: #1976d2;
                }

                .product-row .price-level,
                .product-row .cp-price,
                .product-row .realized {
                    text-align: right;
                    font-weight: 600;
                }

                .cp-price {
                    color: #9C27B0;
                }

                .realized {
                    color: #2e7d32;
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

                .discounts {
                    text-align: center;
                }

                .coverage {
                    text-align: center;
                    font-weight: bold;
                    padding: 6px;
                    border-radius: 4px;
                }

                .coverage.full { background: #4CAF50; color: white; }
                .coverage.good { background: #8BC34A; color: white; }
                .coverage.medium { background: #FFC107; color: #333; }
                .coverage.low { background: #FF5722; color: white; }

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

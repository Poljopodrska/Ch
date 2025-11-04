// Pricing Module V4 - Price Levels System (LC, C0, Cmin, CP)
// New pricing policy with 4 price levels instead of overhead breakdown
const PricingV4 = {
    VERSION: '4.0.2',

    state: {
        language: localStorage.getItem('pricingLanguage') || 'sl', // 'sl' or 'hr'
        expanded: {
            groups: new Set(), // Start with all industries collapsed
            products: new Set(), // Track which products show customer rows
            customerDetails: new Set() // Track which customer rows show detailed breakdown
        },
        products: [],
        productGroups: [],
        pricingData: {}, // Product base data (LC, C0, Cmin)
        customerPricing: {}, // Customer-specific pricing (CP, discounts, realized)
        editMode: false,

        // Industry factors (controlled quarterly) - per industry production price factor
        industryProductionFactors: {
            'fresh-meat': 1.20,      // LC × 1.20 = Production price threshold for fresh meat
            'meat-products': 1.25,   // LC × 1.25 = Production price threshold for meat products
            'delamaris': 1.15        // LC × 1.15 = Production price threshold for Delamaris
        },

        // Global factors
        industryFactors: {
            ohFactor: 1.25,      // Overhead factor (LC * 1.25 = C0)
            minProfitMargin: 0.0425,  // 4.25% minimum profit
            competitorAvg: 0.0625     // 6.25% competitor average
        }
    },

    // Translations
    t: {
        sl: {
            // Header
            title: 'Nova cjenovna politika',
            subtitle: 'Sistem cjenovnih nivoa: LC → C0 → Cmin → CP',
            uploadData: 'Naloži podatke',
            expandAll: 'Razširi vse',
            collapseAll: 'Skrči vse',
            policyInfo: 'Informacije o politiki',
            editFactors: 'Uredi faktorje industrije',

            // Price levels
            priceLevels: 'Nivoi cijena',
            lcLabel: 'LC - Lastna cena',
            lcDesc: 'Stroški proizvodnje brez režij',
            c0Label: 'C0 - Prag pokritja',
            c0Desc: 'Pokriva proizvodnju + režije',
            cminLabel: 'Cmin - Minimalna cijena',
            cminDesc: 'Minimalna s 4.25% dobiti',
            bufferLabel: 'Buffer - Rezerva',
            bufferDesc: 'Rezerva nad Cmin',
            discountsLabel: 'Rabati',
            discountsDesc: 'Razlika CP → Realizirano',

            // Table headers
            code: 'Šifra',
            product: 'Izdelek',
            industry: 'Industrija',
            customers: 'Kupci',
            customer: 'Kupec',
            strategicCmin: 'Strateški Cmin',
            cp: 'CP',
            realized: 'Realizirano',
            aboveProduction: 'Iznad proizvodne cijene',
            aboveC0: 'Iznad C0',
            aboveCmin: 'Iznad Cmin',
            visualization: 'Vizualizacija',

            // Customer table
            showCustomers: 'Prikaži kupce',
            showDetails: 'Prikaži podrobnosti',
            vsCmin: 'vs Cmin',

            // Detailed breakdown
            detailedBreakdown: 'Detaljni obračun',
            priceCalculation: 'Kalkulacija cijena',
            productionCost: 'Stroški proizvodnje brez režij',
            ohFactor: 'Faktor režij',
            generalOverheads: 'Splošne režije',
            breakEven: 'Prag pokritja',
            coversAllCosts: 'Pokriva vse stroške, brez dobička',
            minProfit: 'Minimalni dobiček 4.25%',
            minAcceptable: 'Minimalna sprejemljiva cijena',
            strategicAdjustment: 'Strateška prilagoditev',
            bufferForCustomer: 'Rezerva za tega kupca',
            adjustedMin: 'Prilagojena minimalna cijena',
            inflateForDiscounts: 'Povečanje za rabate',
            quotedPrice: 'Ponudbena cijena',
            customerPrice: 'CP (Ponudbena cijena)',
            discounts: 'Rabati',
            totalDiscounts: 'Skupaj rabati',
            realizedPrice: 'Realizirana cijena',
            afterDiscounts: 'Po rabatoih',

            // Discount types
            invoiceDiscount: 'Fakturni rabat',
            marketingDiscount: 'Marketing rabat',
            yearEndDiscount: 'Letni rabat',

            // Coverage analysis
            coverageAnalysis: 'Analiza pokritja',
            coverageVsC0: 'Pokritje vs C0',
            coverageVsCmin: 'Pokritje vs Cmin',
            bufferAboveCmin: 'Rezerva nad Cmin',
            approvalRequired: 'Zahtevano odobritev',
            needsApproval: 'Potrebna odobritev',
            belowC0Warning: 'Cena pod C0 - ne pokriva stroškov',
            belowCminWarning: 'Cena pod Cmin - ne ustvarja minimalnega dobička',
            aboveCminGood: 'Cena nad Cmin - sprejemljivo',

            // Upload modal
            uploadTitle: 'Naloži Excel podatke',
            excelFormatRequired: 'Zahtevan Excel format',
            sheet1: 'List 1',
            products: 'Izdelki',
            sheet2: 'List 2',
            customerPricing: 'Cene_Kupci',
            industrijaOptions: 'Industrija možnosti',
            selectFile: 'Izberite Excel datoteko',
            cancel: 'Prekliči',
            processData: 'Obdelaj podatke',
            fileSelected: 'Datoteka izbrana',
            processing: 'Obdelava...',
            success: 'Uspešno',
            error: 'Napaka',

            // Industries
            freshMeat: 'Sveže meso',
            meatProducts: 'Mesni izdelki in pečeno meso',
            delamaris: 'Delamaris',

            // Product names (Slovenian)
            chickenFillet: 'Piščančji file',
            chickenBreast: 'Piščančje prsi',
            chickenThighs: 'Piščančja bedra',
            porkShoulder: 'Svinjska plečka',
            porkTenderloin: 'Svinjski file',
            beefTenderloin: 'Goveji file',
            carniolan: 'Kranjska klobasa',
            prosciutto: 'Pršut',
            tunaOlive: 'Tuna v oljčnem olju',
            sardines: 'Sardine',

            // Summary
            summary: 'Povzetek',
            totalProducts: 'Skupaj izdelkov',
            avgCoverage: 'Povprečno pokritje',
            fullCoverage: 'Polno pokritje',
            needsApprovalCount: 'Potrebna odobritev',

            // Units
            kg: 'kg',
            pcs: 'kos'
        },
        hr: {
            // Header
            title: 'Nova cijenovna politika',
            subtitle: 'Sustav cjenovnih razina: LC → C0 → Cmin → CP',
            uploadData: 'Učitaj podatke',
            expandAll: 'Proširi sve',
            collapseAll: 'Sažmi sve',
            policyInfo: 'Informacije o politici',
            editFactors: 'Uredi faktore industrije',

            // Price levels
            priceLevels: 'Razine cijena',
            lcLabel: 'LC - Vlastita cijena',
            lcDesc: 'Troškovi proizvodnje bez režija',
            c0Label: 'C0 - Prag pokrića',
            c0Desc: 'Pokriva proizvodnju + režije',
            cminLabel: 'Cmin - Minimalna cijena',
            cminDesc: 'Minimalna sa 4.25% dobiti',
            bufferLabel: 'Buffer - Rezerva',
            bufferDesc: 'Rezerva iznad Cmin',
            discountsLabel: 'Rabati',
            discountsDesc: 'Razlika CP → Realizirano',

            // Table headers
            code: 'Šifra',
            product: 'Proizvod',
            industry: 'Industrija',
            customers: 'Kupci',
            customer: 'Kupac',
            strategicCmin: 'Strateški Cmin',
            cp: 'CP',
            realized: 'Realizirano',
            aboveProduction: 'Iznad proizvodne cijene',
            aboveC0: 'Iznad C0',
            aboveCmin: 'Iznad Cmin',
            visualization: 'Vizualizacija',

            // Customer table
            showCustomers: 'Prikaži kupce',
            showDetails: 'Prikaži detalje',
            vsCmin: 'vs Cmin',

            // Detailed breakdown
            detailedBreakdown: 'Detaljan obračun',
            priceCalculation: 'Kalkulacija cijena',
            productionCost: 'Troškovi proizvodnje bez režija',
            ohFactor: 'Faktor režija',
            generalOverheads: 'Opće režije',
            breakEven: 'Prag pokrića',
            coversAllCosts: 'Pokriva sve troškove, bez dobiti',
            minProfit: 'Minimalna dobit 4.25%',
            minAcceptable: 'Minimalna prihvatljiva cijena',
            strategicAdjustment: 'Strateško prilagođavanje',
            bufferForCustomer: 'Rezerva za ovog kupca',
            adjustedMin: 'Prilagođena minimalna cijena',
            inflateForDiscounts: 'Povećanje za rabate',
            quotedPrice: 'Ponudbena cijena',
            customerPrice: 'CP (Ponudbena cijena)',
            discounts: 'Rabati',
            totalDiscounts: 'Ukupno rabati',
            realizedPrice: 'Realizirana cijena',
            afterDiscounts: 'Nakon rabata',

            // Discount types
            invoiceDiscount: 'Fakturni rabat',
            marketingDiscount: 'Marketing rabat',
            yearEndDiscount: 'Godišnji rabat',

            // Coverage analysis
            coverageAnalysis: 'Analiza pokrića',
            coverageVsC0: 'Pokriće vs C0',
            coverageVsCmin: 'Pokriće vs Cmin',
            bufferAboveCmin: 'Rezerva iznad Cmin',
            approvalRequired: 'Potrebno odobrenje',
            needsApproval: 'Potrebno odobrenje',
            belowC0Warning: 'Cijena ispod C0 - ne pokriva troškove',
            belowCminWarning: 'Cijena ispod Cmin - ne stvara minimalnu dobit',
            aboveCminGood: 'Cijena iznad Cmin - prihvatljivo',

            // Upload modal
            uploadTitle: 'Učitaj Excel podatke',
            excelFormatRequired: 'Potreban Excel format',
            sheet1: 'List 1',
            products: 'Proizvodi',
            sheet2: 'List 2',
            customerPricing: 'Cijene_Kupci',
            industrijaOptions: 'Industrija opcije',
            selectFile: 'Odaberite Excel datoteku',
            cancel: 'Otkaži',
            processData: 'Obradi podatke',
            fileSelected: 'Datoteka odabrana',
            processing: 'Obrada...',
            success: 'Uspješno',
            error: 'Greška',

            // Industries
            freshMeat: 'Svježe meso',
            meatProducts: 'Mesni proizvodi i pečeno meso',
            delamaris: 'Delamaris',

            // Product names (Croatian)
            chickenFillet: 'Pileći file',
            chickenBreast: 'Pileća prsa',
            chickenThighs: 'Pileća bedra',
            porkShoulder: 'Svinjska pleća',
            porkTenderloin: 'Svinjski file',
            beefTenderloin: 'Goveđi file',
            carniolan: 'Kranjska kobasica',
            prosciutto: 'Pršut',
            tunaOlive: 'Tuna u maslinovom ulju',
            sardines: 'Srdele',

            // Summary
            summary: 'Sažetak',
            totalProducts: 'Ukupno proizvoda',
            avgCoverage: 'Prosječno pokriće',
            fullCoverage: 'Potpuno pokriće',
            needsApprovalCount: 'Potrebno odobrenje',

            // Units
            kg: 'kg',
            pcs: 'kom'
        }
    },

    // Get translation
    getText(key) {
        return this.t[this.state.language][key] || key;
    },

    // Switch language
    switchLanguage(lang) {
        if (lang === 'sl' || lang === 'hr') {
            this.state.language = lang;
            localStorage.setItem('pricingLanguage', lang);
            this.render(); // Re-render with new language
        }
    },

    init() {
        try {
            console.log(`Pricing Module V${this.VERSION} initializing...`);

            // Load industry production factors from localStorage
            const savedFactors = localStorage.getItem('industryProductionFactors');
            if (savedFactors) {
                try {
                    this.state.industryProductionFactors = JSON.parse(savedFactors);
                    console.log('Loaded production factors from localStorage:', this.state.industryProductionFactors);
                } catch (e) {
                    console.error('Error parsing saved factors, using defaults:', e);
                }
            }

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
        // Initialize empty industry structure - will be populated from database/Excel
        this.state.productGroups = [
            {
                id: 'fresh-meat',
                nameSl: 'Sveže meso',
                nameHr: 'Svježe meso',
                icon: '🐔',
                products: []
            },
            {
                id: 'meat-products',
                nameSl: 'Mesni izdelki in pečeno meso',
                nameHr: 'Mesni proizvodi i pečeno meso',
                icon: '🌭',
                products: []
            },
            {
                id: 'delamaris',
                nameSl: 'Delamaris',
                nameHr: 'Delamaris',
                icon: '🐟',
                products: []
            }
        ];

        // Flatten products list (will be empty until data is loaded)
        this.state.products = [];
        this.state.productGroups.forEach(group => {
            this.state.products.push(...group.products);
        });
    },

    // Get product or group name based on current language
    getName(item) {
        return this.state.language === 'sl' ? item.nameSl : item.nameHr;
    },

    loadPricingData() {
        // Initialize empty pricing data - will be populated from Excel upload
        this.state.pricingData = {};
    },

    loadCustomerPricing() {
        // Initialize empty customer pricing - will be populated from Excel upload
        this.state.customerPricing = {};
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
                        <h1>💰 ${this.getText('title')}</h1>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
                            ${this.getText('subtitle')}
                        </p>
                    </div>
                    <div class="header-controls">
                        <button class="language-btn ${this.state.language === 'sl' ? 'active' : ''}"
                                onclick="PricingV4.switchLanguage('sl')"
                                title="Slovenščina">
                            🇸🇮
                        </button>
                        <button class="language-btn ${this.state.language === 'hr' ? 'active' : ''}"
                                onclick="PricingV4.switchLanguage('hr')"
                                title="Hrvatski">
                            🇭🇷
                        </button>
                        <button class="btn-upload" onclick="PricingV4.showUploadModal()">
                            📤 ${this.getText('uploadData')}
                        </button>
                        <button class="btn-expand-all" onclick="PricingV4.expandAll()">
                            📂 ${this.getText('expandAll')}
                        </button>
                        <button class="btn-collapse-all" onclick="PricingV4.collapseAll()">
                            📁 ${this.getText('collapseAll')}
                        </button>
                        <button class="btn-info" onclick="PricingV4.showPolicyInfo()">
                            ℹ️ ${this.getText('policyInfo')}
                        </button>
                        <button class="btn-edit-factors" onclick="PricingV4.showFactorsModal()">
                            ⚙️ ${this.getText('editFactors')}
                        </button>
                    </div>
                </div>

                <div class="pricing-legend">
                    <h3>📊 ${this.getText('priceLevels')}:</h3>
                    <div class="legend-items">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #4CAF50;"></span>
                            <div class="legend-text">
                                <strong>${this.getText('lcLabel')}</strong> - ${this.getText('lcDesc')}
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #2196F3;"></span>
                            <div class="legend-text">
                                <strong>${this.getText('c0Label')}</strong> - ${this.getText('c0Desc')}
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #FF9800;"></span>
                            <div class="legend-text">
                                <strong>${this.getText('cminLabel')}</strong> - ${this.getText('cminDesc')}
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #9C27B0;"></span>
                            <div class="legend-text">
                                <strong>${this.getText('bufferLabel')}</strong> - ${this.getText('bufferDesc')}
                            </div>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #F44336;"></span>
                            <div class="legend-text">
                                <strong>${this.getText('discountsLabel')}</strong> - ${this.getText('discountsDesc')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pricing-list">
                    ${this.renderPricingHierarchy()}
                </div>

                <!-- Upload Modal -->
                <div id="upload-modal" class="upload-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>📤 ${this.getText('uploadTitle')}</h2>
                            <button class="modal-close" onclick="PricingV4.closeUploadModal()">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="upload-info">
                                <h3>📋 ${this.getText('excelFormatRequired')}:</h3>
                                <div class="format-section">
                                    <h4>${this.getText('sheet1')}: "Izdelki" (${this.getText('products')})</h4>
                                    <table class="format-table">
                                        <tr>
                                            <th>šifra</th>
                                            <th>naziv</th>
                                            <th>enota</th>
                                            <th>industrija</th>
                                            <th>lc</th>
                                            <th>aktiven</th>
                                        </tr>
                                        <tr>
                                            <td colspan="6" style="text-align: center; font-style: italic; color: #666;">
                                                (${this.state.language === 'sl' ? 'aktiven: DA ali NE' : 'aktiven: DA ili NE'})
                                            </td>
                                        </tr>
                                    </table>
                                    <p class="format-note"><strong>${this.getText('industrijaOptions')}:</strong> ${this.getName({nameSl: this.t.sl.freshMeat, nameHr: this.t.hr.freshMeat})}, ${this.getName({nameSl: this.t.sl.meatProducts, nameHr: this.t.hr.meatProducts})}, ${this.getText('delamaris')}</p>
                                </div>
                                <div class="format-section">
                                    <h4>${this.getText('sheet2')}: "Cene_Kupci" (${this.getText('customerPricing')})</h4>
                                    <table class="format-table">
                                        <tr>
                                            <th>šifra</th>
                                            <th>kupec_id</th>
                                            <th>kupec_naziv</th>
                                            <th>kupec_tip</th>
                                            <th>strategic_cmin</th>
                                            <th>popust_faktura</th>
                                            <th>popust_marketing</th>
                                            <th>popust_letni</th>
                                            <th>aktiven</th>
                                        </tr>
                                        <tr>
                                            <td colspan="9" style="text-align: center; font-style: italic; color: #666;">
                                                (${this.state.language === 'sl' ? 'rabati v %, aktiven: DA ali NE' : 'rabati u %, aktiven: DA ili NE'})
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                            <div class="upload-area">
                                <input type="file" id="excel-file-input" accept=".xlsx,.xls" style="display: none;" onchange="PricingV4.handleFileSelect(event)">
                                <button class="btn-select-file" onclick="document.getElementById('excel-file-input').click()">
                                    📁 ${this.getText('selectFile')}
                                </button>
                                <div id="file-name" class="file-name"></div>
                                <div id="upload-status" class="upload-status"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-cancel" onclick="PricingV4.closeUploadModal()">${this.getText('cancel')}</button>
                            <button class="btn-process" id="process-btn" onclick="PricingV4.processExcelFile()" disabled>${this.getText('processData')}</button>
                        </div>
                    </div>
                </div>

                <!-- Industry Production Factors Modal -->
                <div id="factors-modal" class="upload-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>⚙️ ${this.getText('editFactors')}</h2>
                            <button class="modal-close" onclick="PricingV4.closeFactorsModal()">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="factors-info">
                                <p style="margin-bottom: 20px; color: #666;">
                                    ${this.state.language === 'sl'
                                        ? 'Faktor proizvodnje določa prag: Realizirana cijena mora biti ≥ (LC × Faktor)'
                                        : 'Faktor proizvodnje određuje prag: Realizirana cijena mora biti ≥ (LC × Faktor)'}
                                </p>
                            </div>
                            <table class="factors-table">
                                <thead>
                                    <tr>
                                        <th>${this.getText('industry')}</th>
                                        <th>${this.state.language === 'sl' ? 'Faktor proizvodnje' : 'Faktor proizvodnje'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>🐔 ${this.state.language === 'sl' ? 'Sveže meso' : 'Svježe meso'}</td>
                                        <td>
                                            <input type="number"
                                                   id="factor-fresh-meat"
                                                   class="factor-input"
                                                   value="${this.state.industryProductionFactors['fresh-meat']}"
                                                   step="0.01"
                                                   min="0.01">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>🥩 ${this.state.language === 'sl' ? 'Mesni izdelki in pečeno meso' : 'Mesni proizvodi i pečeno meso'}</td>
                                        <td>
                                            <input type="number"
                                                   id="factor-meat-products"
                                                   class="factor-input"
                                                   value="${this.state.industryProductionFactors['meat-products']}"
                                                   step="0.01"
                                                   min="0.01">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>🐟 Delamaris</td>
                                        <td>
                                            <input type="number"
                                                   id="factor-delamaris"
                                                   class="factor-input"
                                                   value="${this.state.industryProductionFactors['delamaris']}"
                                                   step="0.01"
                                                   min="0.01">
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div id="factors-status" class="upload-status"></div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-cancel" onclick="PricingV4.closeFactorsModal()">${this.getText('cancel')}</button>
                            <button class="btn-process" onclick="PricingV4.saveProductionFactors()">${this.getText('save') || 'Spremi / Shrani'}</button>
                        </div>
                    </div>
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

        // Render each industry
        this.state.productGroups.forEach(group => {
            const isGroupExpanded = this.state.expanded.groups.has(group.id);
            const productCountText = this.state.language === 'sl' ? 'izdelkov' : 'proizvoda';

            html += `
                <div class="group-container">
                    <div class="group-header" onclick="PricingV4.toggleGroup('${group.id}')">
                        <span class="expand-icon">${isGroupExpanded ? '▼' : '▶'}</span>
                        <span class="group-icon">${group.icon}</span>
                        <span class="group-name">${this.getName(group)}</span>
                        <span class="group-count">(${group.products.length} ${productCountText})</span>
                    </div>

                    <div class="group-content ${isGroupExpanded ? 'expanded' : 'collapsed'}">
                        <!-- Products Table -->
                        <table class="pricing-table">
                            <thead>
                                <tr>
                                    <th rowspan="2">${this.getText('code')}</th>
                                    <th rowspan="2">${this.getText('product')}</th>
                                    <th colspan="3">${this.getText('priceLevels')} (€)</th>
                                    <th colspan="3" class="status-columns-header">${this.state.language === 'sl' ? 'Status' : 'Status'}</th>
                                    <th rowspan="2">${this.getText('customers')}</th>
                                </tr>
                                <tr>
                                    <th class="price-level lc">LC</th>
                                    <th class="price-level c0">C0</th>
                                    <th class="price-level cmin">Cmin</th>
                                    <th class="status-header-small">${this.getText('aboveProduction')}</th>
                                    <th class="status-header-small">${this.getText('aboveC0')}</th>
                                    <th class="status-header-small">${this.getText('aboveCmin')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderProducts(group.products)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        return html;
    },

    calculateTopLevelSummary() {
        let totalProducts = 0;
        let totalCustomerCombinations = 0;
        let totalLC = 0;
        let totalC0 = 0;
        let totalCmin = 0;
        let totalCP = 0;
        let totalRealized = 0;
        let fullCoverageCount = 0;
        let belowCminCount = 0;

        this.state.productGroups.forEach(group => {
            group.products.forEach(product => {
                totalProducts++;
                const pricing = this.state.pricingData[product.id];
                const customers = this.state.customerPricing[product.id] || {};
                const customerCount = Object.keys(customers).length;

                totalCustomerCombinations += customerCount;
                totalLC += pricing.lc * customerCount;
                totalC0 += pricing.c0 * customerCount;
                totalCmin += pricing.cmin * customerCount;

                Object.values(customers).forEach(custPricing => {
                    totalCP += custPricing.cp;
                    totalRealized += custPricing.realizedPrice;

                    if (custPricing.coverage.vsCmin >= 100) {
                        fullCoverageCount++;
                    } else {
                        belowCminCount++;
                    }
                });
            });
        });

        const avgCoverage = totalCustomerCombinations > 0
            ? (totalRealized / totalCmin) * 100
            : 0;

        return {
            totalProducts,
            totalCustomerCombinations,
            avgLC: totalLC / totalCustomerCombinations,
            avgC0: totalC0 / totalCustomerCombinations,
            avgCmin: totalCmin / totalCustomerCombinations,
            avgCP: totalCP / totalCustomerCombinations,
            avgRealized: totalRealized / totalCustomerCombinations,
            avgCoverage,
            fullCoverageCount,
            belowCminCount
        };
    },

    calculateIndustrySummary(group) {
        let totalCustomers = 0;
        let totalLC = 0;
        let totalC0 = 0;
        let totalCmin = 0;
        let totalCP = 0;
        let totalRealized = 0;
        let fullCoverageCount = 0;
        let belowCminCount = 0;

        group.products.forEach(product => {
            const pricing = this.state.pricingData[product.id];
            const customers = this.state.customerPricing[product.id] || {};
            const customerCount = Object.keys(customers).length;

            totalCustomers += customerCount;
            totalLC += pricing.lc * customerCount;
            totalC0 += pricing.c0 * customerCount;
            totalCmin += pricing.cmin * customerCount;

            Object.values(customers).forEach(custPricing => {
                totalCP += custPricing.cp;
                totalRealized += custPricing.realizedPrice;

                if (custPricing.coverage.vsCmin >= 100) {
                    fullCoverageCount++;
                } else {
                    belowCminCount++;
                }
            });
        });

        const avgCoverage = totalCustomers > 0
            ? (totalRealized / totalCmin) * 100
            : 0;

        return {
            totalProducts: group.products.length,
            totalCustomers,
            avgLC: totalLC / totalCustomers,
            avgC0: totalC0 / totalCustomers,
            avgCmin: totalCmin / totalCustomers,
            avgCP: totalCP / totalCustomers,
            avgRealized: totalRealized / totalCustomers,
            avgCoverage,
            fullCoverageCount,
            belowCminCount
        };
    },

    renderTopLevelSummary(summary) {
        const summaryText = this.state.language === 'sl' ? 'Skupni pregled' : 'Ukupni pregled';
        const industriesText = this.state.language === 'sl' ? 'industrije' : 'industrije';
        const productsText = this.state.language === 'sl' ? 'izdelkov' : 'proizvoda';
        const customersText = this.state.language === 'sl' ? 'kupcev' : 'kupaca';
        const avgCoverageText = this.state.language === 'sl' ? 'Povprečno pokritje' : 'Prosječno pokriće';
        const fullCoverageText = this.state.language === 'sl' ? 'Polno pokritje' : 'Potpuno pokriće';
        const needsApprovalText = this.state.language === 'sl' ? 'Potrebna odobritev' : 'Potrebno odobrenje';

        return `
            <div class="top-level-summary">
                <h3>📊 ${summaryText}</h3>
                <div class="summary-grid">
                    <div class="summary-metric">
                        <div class="metric-label">${this.state.productGroups.length} ${industriesText}</div>
                        <div class="metric-value">${summary.totalProducts} ${productsText}</div>
                    </div>
                    <div class="summary-metric">
                        <div class="metric-label">${customersText}</div>
                        <div class="metric-value">${summary.totalCustomerCombinations}</div>
                    </div>
                    <div class="summary-metric">
                        <div class="metric-label">${avgCoverageText}</div>
                        <div class="metric-value ${summary.avgCoverage >= 100 ? 'good' : 'warning'}">
                            ${summary.avgCoverage.toFixed(1)}%
                        </div>
                    </div>
                    <div class="summary-metric">
                        <div class="metric-label">✅ ${fullCoverageText}</div>
                        <div class="metric-value good">${summary.fullCoverageCount}</div>
                    </div>
                    <div class="summary-metric">
                        <div class="metric-label">⚠️ ${needsApprovalText}</div>
                        <div class="metric-value ${summary.belowCminCount > 0 ? 'warning' : 'good'}">
                            ${summary.belowCminCount}
                        </div>
                    </div>
                </div>
                <div class="summary-pricing">
                    <div class="pricing-flow-summary">
                        <span class="flow-item">LC: €${summary.avgLC.toFixed(2)}</span>
                        <span class="flow-arrow">→</span>
                        <span class="flow-item">C0: €${summary.avgC0.toFixed(2)}</span>
                        <span class="flow-arrow">→</span>
                        <span class="flow-item">Cmin: €${summary.avgCmin.toFixed(2)}</span>
                        <span class="flow-arrow">→</span>
                        <span class="flow-item">CP: €${summary.avgCP.toFixed(2)}</span>
                        <span class="flow-arrow">→</span>
                        <span class="flow-item realized">€${summary.avgRealized.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderIndustrySummaryRow(summary, group) {
        const summaryText = this.state.language === 'sl' ? 'Pregled industrije' : 'Pregled industrije';

        return `
            <div class="industry-summary-row">
                <div class="industry-summary-header">
                    <h4>${group.icon} ${summaryText}: ${this.getName(group)}</h4>
                </div>
                <div class="industry-summary-content">
                    <div class="summary-stats-row">
                        <div class="stat-item">
                            <span class="stat-label">${this.getText('products')}:</span>
                            <span class="stat-value">${summary.totalProducts}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">${this.getText('customers')}:</span>
                            <span class="stat-value">${summary.totalCustomers}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">${this.getText('coverageVsCmin')}:</span>
                            <span class="stat-value ${summary.avgCoverage >= 100 ? 'good' : 'warning'}">
                                ${summary.avgCoverage.toFixed(1)}%
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">✅:</span>
                            <span class="stat-value good">${summary.fullCoverageCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">⚠️:</span>
                            <span class="stat-value ${summary.belowCminCount > 0 ? 'warning' : 'good'}">
                                ${summary.belowCminCount}
                            </span>
                        </div>
                    </div>
                    <div class="industry-pricing-flow">
                        <span class="price-tag lc">LC: €${summary.avgLC.toFixed(2)}</span>
                        <span class="arrow">→</span>
                        <span class="price-tag c0">C0: €${summary.avgC0.toFixed(2)}</span>
                        <span class="arrow">→</span>
                        <span class="price-tag cmin">Cmin: €${summary.avgCmin.toFixed(2)}</span>
                        <span class="arrow">→</span>
                        <span class="price-tag cp">CP: €${summary.avgCP.toFixed(2)}</span>
                        <span class="arrow">→</span>
                        <span class="price-tag realized">€${summary.avgRealized.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderProducts(products) {
        let html = '';
        const customersText = this.state.language === 'sl' ? 'kupci' : 'kupci';

        products.forEach(product => {
            const pricing = this.state.pricingData[product.id];
            const customers = this.state.customerPricing[product.id] || {};
            const customerCount = Object.keys(customers).length;
            const isExpanded = this.state.expanded.products.has(product.id);

            // Get the industry for this product to determine production factor
            let industryId = 'fresh-meat'; // default
            this.state.productGroups.forEach(group => {
                if (group.products.find(p => p.id === product.id)) {
                    industryId = group.id;
                }
            });
            const productionFactor = this.state.industryProductionFactors[industryId] || 1.20;
            const productionPrice = pricing.lc * productionFactor;

            // Calculate aggregate status across all customers
            let allAboveProduction = true;
            let allAboveC0 = true;
            let allAboveCmin = true;
            let hasCustomers = false;

            Object.values(customers).forEach(custPricing => {
                hasCustomers = true;
                if (custPricing.realizedPrice < productionPrice) allAboveProduction = false;
                if (custPricing.realizedPrice < pricing.c0) allAboveC0 = false;
                if (custPricing.realizedPrice < pricing.cmin) allAboveCmin = false;
            });

            // If no customers, show neutral status
            const productionStatus = !hasCustomers ? 'neutral' : (allAboveProduction ? 'pass' : 'fail');
            const c0Status = !hasCustomers ? 'neutral' : (allAboveC0 ? 'pass' : 'fail');
            const cminStatus = !hasCustomers ? 'neutral' : (allAboveCmin ? 'pass' : 'fail');

            html += `
                <tr class="product-row">
                    <td class="code">
                        ${product.code}
                    </td>
                    <td class="name">
                        <strong>${this.getName(product)}</strong>
                    </td>
                    <td class="price-level lc">€${pricing.lc.toFixed(2)}</td>
                    <td class="price-level c0">€${pricing.c0.toFixed(2)}</td>
                    <td class="price-level cmin">€${pricing.cmin.toFixed(2)}</td>
                    <td class="status-check-product ${productionStatus}">
                        <span class="status-icon">${!hasCustomers ? '—' : (allAboveProduction ? '✓' : '✗')}</span>
                    </td>
                    <td class="status-check-product ${c0Status}">
                        <span class="status-icon">${!hasCustomers ? '—' : (allAboveC0 ? '✓' : '✗')}</span>
                    </td>
                    <td class="status-check-product ${cminStatus}">
                        <span class="status-icon">${!hasCustomers ? '—' : (allAboveCmin ? '✓' : '✗')}</span>
                    </td>
                    <td class="customers-cell">
                        <button class="expand-customers-btn ${isExpanded ? 'expanded' : ''}"
                                onclick="PricingV4.toggleProduct('${product.id}')"
                                title="${this.getText('showCustomers')}">
                            <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                            <span class="customer-count">👥 ${customerCount} ${customersText}</span>
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

        // Get the industry for this product to determine production factor
        const product = this.state.products.find(p => p.id === productId);
        let industryId = 'fresh-meat'; // default
        this.state.productGroups.forEach(group => {
            if (group.products.find(p => p.id === productId)) {
                industryId = group.id;
            }
        });
        const productionFactor = this.state.industryProductionFactors[industryId] || 1.20;

        // Add customer table header row
        html += `
            <tr class="customer-header-row">
                <th colspan="2">${this.getText('customer')}</th>
                <th>${this.getText('strategicCmin')}</th>
                <th>${this.getText('cp')}</th>
                <th>${this.getText('realized')}</th>
                <th class="status-header" title="${this.getText('aboveProduction')} (LC × ${productionFactor.toFixed(2)})">${this.getText('aboveProduction')}</th>
                <th class="status-header">${this.getText('aboveC0')}</th>
                <th class="status-header">${this.getText('aboveCmin')}</th>
            </tr>
        `;

        Object.values(customers).forEach(custPricing => {
            const detailKey = `${productId}_${custPricing.customerId}`;
            const isDetailExpanded = this.state.expanded.customerDetails.has(detailKey);

            // Calculate production price threshold (LC × industry factor)
            const productionPrice = basePrice.lc * productionFactor;

            // Check if price is above thresholds
            const aboveProduction = custPricing.realizedPrice >= productionPrice;
            const aboveC0 = custPricing.realizedPrice >= basePrice.c0;
            const aboveCmin = custPricing.realizedPrice >= basePrice.cmin;

            html += `
                <tr class="customer-row">
                    <td colspan="2" class="customer-info">
                        <button class="expand-detail-btn ${isDetailExpanded ? 'expanded' : ''}"
                                onclick="PricingV4.toggleCustomerDetail('${detailKey}')"
                                title="${this.getText('showDetails')}">
                            <span class="expand-icon">${isDetailExpanded ? '▼' : '▶'}</span>
                        </button>
                        <strong>👤 ${custPricing.customerName}</strong>
                        <br><small>${custPricing.customerType}</small>
                    </td>
                    <td class="price-simple strategic">
                        €${custPricing.strategicCmin.toFixed(2)}
                    </td>
                    <td class="price-simple cp">
                        €${custPricing.cp.toFixed(2)}
                    </td>
                    <td class="price-simple realized">
                        €${custPricing.realizedPrice.toFixed(2)}
                    </td>
                    <td class="status-check ${aboveProduction ? 'pass' : 'fail'}">
                        <span class="status-icon">${aboveProduction ? '✓' : '✗'}</span>
                    </td>
                    <td class="status-check ${aboveC0 ? 'pass' : 'fail'}">
                        <span class="status-icon">${aboveC0 ? '✓' : '✗'}</span>
                    </td>
                    <td class="status-check ${aboveCmin ? 'pass' : 'fail'}">
                        <span class="status-icon">${aboveCmin ? '✓' : '✗'}</span>
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
            </div>
        `;

        if (ohWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${ohWidth}px;" title="OH: €${(basePrice.c0 - basePrice.lc).toFixed(2)}">
                    <div class="segment-background" style="background: #2196F330; width: ${ohWidth}px;"></div>
                    <div class="segment-covered" style="background: #2196F3; width: ${ohCoveredWidth}px;"></div>
                </div>
            `;
        }

        if (minProfitWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${minProfitWidth}px;" title="Min Profit: €${(basePrice.cmin - basePrice.c0).toFixed(2)}">
                    <div class="segment-background" style="background: #FF980030; width: ${minProfitWidth}px;"></div>
                    <div class="segment-covered" style="background: #FF9800; width: ${minProfitCoveredWidth}px;"></div>
                </div>
            `;
        }

        if (bufferWidth > 0) {
            html += `
                <div class="flow-segment" style="width: ${bufferWidth}px;" title="Buffer: €${(custPricing.strategicCmin - basePrice.cmin).toFixed(2)}">
                    <div class="segment-background" style="background: #9C27B030; width: ${bufferWidth}px;"></div>
                    <div class="segment-covered" style="background: #9C27B0; width: ${bufferCoveredWidth}px;"></div>
                </div>
            `;
        }

        if (discountWidth > 0) {
            html += `
                <div class="flow-segment discount-segment" style="width: ${discountWidth}px;" title="Discounts: €${(custPricing.cp - custPricing.realizedPrice).toFixed(2)}">
                    <div class="segment-background" style="background: #F4433630; width: ${discountWidth}px;"></div>
                    <div class="segment-covered" style="background: #F44336; width: ${discountWidth}px;"></div>
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
                <td colspan="8">
                    <div class="detailed-breakdown">
                        <h4>📊 ${this.getText('detailedBreakdown')}: ${this.getName(product)} → ${custPricing.customerName}</h4>

                        <div class="breakdown-grid">
                            <div class="breakdown-section">
                                <h5>💶 ${this.getText('priceCalculation')}</h5>
                                <table class="breakdown-table">
                                    <tr>
                                        <td>LC (${this.getText('lcLabel').split(' - ')[1]}):</td>
                                        <td class="value">€${basePrice.lc.toFixed(2)}</td>
                                        <td class="note">${this.getText('productionCost')}</td>
                                    </tr>
                                    <tr>
                                        <td>× ${this.getText('ohFactor')} (${this.state.industryFactors.ohFactor}):</td>
                                        <td class="value">+€${(basePrice.c0 - basePrice.lc).toFixed(2)}</td>
                                        <td class="note">${this.getText('generalOverheads')}</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= C0 (${this.getText('breakEven')}):</strong></td>
                                        <td class="value"><strong>€${basePrice.c0.toFixed(2)}</strong></td>
                                        <td class="note">${this.getText('coversAllCosts')}</td>
                                    </tr>
                                    <tr>
                                        <td>÷ (1 - ${(this.state.industryFactors.minProfitMargin * 100).toFixed(2)}%):</td>
                                        <td class="value">+€${(basePrice.cmin - basePrice.c0).toFixed(2)}</td>
                                        <td class="note">${this.getText('minProfit')}</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= Cmin:</strong></td>
                                        <td class="value"><strong>€${basePrice.cmin.toFixed(2)}</strong></td>
                                        <td class="note">${this.getText('minAcceptable')}</td>
                                    </tr>
                                    <tr>
                                        <td>${this.getText('strategicAdjustment')}:</td>
                                        <td class="value">+€${(custPricing.strategicCmin - basePrice.cmin).toFixed(2)}</td>
                                        <td class="note">${this.getText('bufferForCustomer')}</td>
                                    </tr>
                                    <tr class="subtotal">
                                        <td><strong>= Cmin (${this.getText('strategicCmin')}):</strong></td>
                                        <td class="value"><strong>€${custPricing.strategicCmin.toFixed(2)}</strong></td>
                                        <td class="note">${this.getText('adjustedMin')}</td>
                                    </tr>
                                    <tr>
                                        <td>÷ (1 - ${custPricing.totalDiscounts}%):</td>
                                        <td class="value">+€${(custPricing.cp - custPricing.strategicCmin).toFixed(2)}</td>
                                        <td class="note">${this.getText('inflateForDiscounts')}</td>
                                    </tr>
                                    <tr class="total">
                                        <td><strong>= ${this.getText('customerPrice')}:</strong></td>
                                        <td class="value"><strong>€${custPricing.cp.toFixed(2)}</strong></td>
                                        <td class="note">${this.getText('quotedPrice')}</td>
                                    </tr>
                                </table>
                            </div>

                            <div class="breakdown-section">
                                <h5>📉 ${this.getText('discounts')}</h5>
                                <table class="breakdown-table">
                                    ${Object.entries(custPricing.discountBreakdown).map(([key, value]) => `
                                        <tr>
                                            <td>${this.getDiscountLabel(key)}:</td>
                                            <td class="value">${value}%</td>
                                            <td class="note">€${(custPricing.cp * value / 100).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                    <tr class="subtotal">
                                        <td><strong>${this.getText('totalDiscounts')}:</strong></td>
                                        <td class="value"><strong>${custPricing.totalDiscounts}%</strong></td>
                                        <td class="note"><strong>€${(custPricing.cp - custPricing.realizedPrice).toFixed(2)}</strong></td>
                                    </tr>
                                    <tr class="total">
                                        <td><strong>${this.getText('realizedPrice')}:</strong></td>
                                        <td class="value" colspan="2"><strong>€${custPricing.realizedPrice.toFixed(2)}</strong></td>
                                    </tr>
                                </table>
                            </div>

                            <div class="breakdown-section">
                                <h5>✅ ${this.getText('coverageAnalysis')}</h5>
                                <table class="breakdown-table">
                                    <tr>
                                        <td>${this.getText('coverageVsC0')}:</td>
                                        <td class="value ${custPricing.coverage.vsC0 >= 100 ? 'good' : 'bad'}">
                                            ${custPricing.coverage.vsC0.toFixed(1)}%
                                        </td>
                                        <td class="note">${custPricing.coverage.vsC0 >= 100 ? '✓' : '✗'}</td>
                                    </tr>
                                    <tr>
                                        <td>${this.getText('coverageVsCmin')}:</td>
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
        } else {
            this.state.expanded.groups.add(groupId);
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
            group.products.forEach(product => {
                this.state.expanded.products.add(product.id);
            });
        });
        this.render();
    },

    collapseAll() {
        this.state.expanded.groups.clear();
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
        return group.products.length;
    },

    // Excel Upload Functions
    showUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    closeUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.style.display = 'none';
            // Reset file input
            document.getElementById('excel-file-input').value = '';
            document.getElementById('file-name').textContent = '';
            document.getElementById('upload-status').innerHTML = '';
            document.getElementById('process-btn').disabled = true;
            this.state.uploadedFile = null;
        }
    },

    showFactorsModal() {
        const modal = document.getElementById('factors-modal');
        if (modal) {
            // Update input values with current factors
            document.getElementById('factor-fresh-meat').value = this.state.industryProductionFactors['fresh-meat'];
            document.getElementById('factor-meat-products').value = this.state.industryProductionFactors['meat-products'];
            document.getElementById('factor-delamaris').value = this.state.industryProductionFactors['delamaris'];
            document.getElementById('factors-status').innerHTML = '';
            modal.style.display = 'flex';
        }
    },

    closeFactorsModal() {
        const modal = document.getElementById('factors-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('factors-status').innerHTML = '';
        }
    },

    saveProductionFactors() {
        const statusDiv = document.getElementById('factors-status');

        try {
            // Get values from inputs
            const freshMeat = parseFloat(document.getElementById('factor-fresh-meat').value);
            const meatProducts = parseFloat(document.getElementById('factor-meat-products').value);
            const delamaris = parseFloat(document.getElementById('factor-delamaris').value);

            // Validate - only check for valid numbers, allow any positive value
            if (isNaN(freshMeat) || isNaN(meatProducts) || isNaN(delamaris)) {
                statusDiv.innerHTML = '<div class="error">❌ Invalid factor values</div>';
                return;
            }

            if (freshMeat <= 0 || meatProducts <= 0 || delamaris <= 0) {
                statusDiv.innerHTML = '<div class="error">❌ Factors must be positive numbers</div>';
                return;
            }

            // Update state
            this.state.industryProductionFactors['fresh-meat'] = freshMeat;
            this.state.industryProductionFactors['meat-products'] = meatProducts;
            this.state.industryProductionFactors['delamaris'] = delamaris;

            // Save to localStorage
            localStorage.setItem('industryProductionFactors', JSON.stringify(this.state.industryProductionFactors));

            statusDiv.innerHTML = '<div class="success">✅ Factors updated successfully!</div>';

            // Close modal and re-render after short delay
            setTimeout(() => {
                this.closeFactorsModal();
                this.render();
            }, 1500);

        } catch (error) {
            console.error('Error saving factors:', error);
            statusDiv.innerHTML = '<div class="error">❌ Error saving factors</div>';
        }
    },

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileNameDiv = document.getElementById('file-name');
        const statusDiv = document.getElementById('upload-status');
        const processBtn = document.getElementById('process-btn');

        // Check file extension
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        if (fileExt !== 'xlsx' && fileExt !== 'xls') {
            statusDiv.innerHTML = '<div class="error">❌ Please select an Excel file (.xlsx or .xls)</div>';
            processBtn.disabled = true;
            return;
        }

        fileNameDiv.textContent = `Selected: ${fileName}`;
        statusDiv.innerHTML = '<div class="info">✓ File selected. Click "Process Data" to load.</div>';
        processBtn.disabled = false;

        // Store file for processing
        this.state.uploadedFile = file;
    },

    async processExcelFile() {
        if (!this.state.uploadedFile) {
            alert('No file selected');
            return;
        }

        const statusDiv = document.getElementById('upload-status');
        statusDiv.innerHTML = '<div class="processing">⏳ Processing Excel file...</div>';

        try {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                throw new Error('XLSX library not loaded. Please include SheetJS library.');
            }

            const file = this.state.uploadedFile;
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    console.log('Available sheets in Excel:', workbook.SheetNames);

                    // Use first sheet only
                    if (workbook.SheetNames.length === 0) {
                        throw new Error('No sheets found in Excel file');
                    }

                    // Read first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const firstSheet = workbook.Sheets[firstSheetName];
                    const izdelkiData = XLSX.utils.sheet_to_json(firstSheet);

                    console.log('Excel data from first sheet:', izdelkiData);

                    // Validate and load data (no customer pricing for now)
                    const result = this.validateAndLoadData(izdelkiData, []);

                    if (result.success) {
                        statusDiv.innerHTML = `<div class="success">✅ Success! Loaded ${result.productsCount} products and ${result.customerPricingCount} customer-product combinations.</div>`;
                        setTimeout(() => {
                            this.closeUploadModal();
                            this.render();
                        }, 2000);
                    } else {
                        statusDiv.innerHTML = `<div class="error">❌ ${result.error}</div>`;
                    }

                } catch (error) {
                    console.error('Error parsing Excel:', error);
                    statusDiv.innerHTML = `<div class="error">❌ Error parsing Excel: ${error.message}</div>`;
                }
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                statusDiv.innerHTML = '<div class="error">❌ Error reading file</div>';
            };

            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error('Error processing file:', error);
            statusDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
        }
    },

    // Helper function to parse European number format (comma as decimal separator)
    parseEuropeanNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        // Convert to string and replace comma with period
        const stringValue = value.toString().trim().replace(',', '.');
        const parsed = parseFloat(stringValue);
        return isNaN(parsed) ? 0 : parsed;
    },

    validateAndLoadData(izdelkiData, ceneKupciData) {
        try {
            // Validate Izdelki data
            const requiredIzdelkiCols = ['šifra', 'naziv', 'enota', 'industrija', 'lc', 'aktiven'];
            if (izdelkiData.length === 0) {
                return { success: false, error: 'No data found in Izdelki sheet' };
            }

            const firstRow = izdelkiData[0];
            const missingCols = requiredIzdelkiCols.filter(col => !(col in firstRow));
            if (missingCols.length > 0) {
                return { success: false, error: `Missing columns in Izdelki: ${missingCols.join(', ')}` };
            }

            // Validate Cene_Kupci data (optional for now)
            if (ceneKupciData.length > 0) {
                const requiredCeneCols = ['šifra', 'kupec_id', 'kupec_naziv', 'kupec_tip', 'strategic_cmin',
                                           'popust_faktura', 'popust_marketing', 'popust_letni', 'aktiven'];
                const firstCeneRow = ceneKupciData[0];
                const missingCeneCols = requiredCeneCols.filter(col => !(col in firstCeneRow));
                if (missingCeneCols.length > 0) {
                    return { success: false, error: `Missing columns in Cene_Kupci: ${missingCeneCols.join(', ')}` };
                }
            }

            // Build new data structure
            const newProductGroups = {};
            const validIndustries = ['Sveže meso', 'Mesni izdelki in pečeno meso', 'Delamaris'];

            izdelkiData.forEach((row, index) => {
                const aktivenValue = row.aktiven ? row.aktiven.toString().toUpperCase().trim() : '';
                if (!aktivenValue || (aktivenValue !== 'TRUE' && aktivenValue !== 'DA')) {
                    return; // Skip inactive products
                }

                const industrija = row.industrija.trim();
                if (!validIndustries.includes(industrija)) {
                    throw new Error(`Invalid industrija at row ${index + 2}: "${industrija}". Must be one of: ${validIndustries.join(', ')}`);
                }

                if (!newProductGroups[industrija]) {
                    newProductGroups[industrija] = [];
                }

                newProductGroups[industrija].push({
                    id: `p${index + 1}`,
                    code: row.šifra.toString().trim(),
                    name: row.naziv.toString().trim(),
                    nameEn: row.naziv.toString().trim(), // Use same name for now
                    unit: row.enota.toString().trim(),
                    lc: this.parseEuropeanNumber(row.lc)
                });
            });

            // Build product groups structure
            const industryMapping = {
                'Sveže meso': { id: 'fresh-meat', icon: '🥩', nameEn: 'Fresh Meat' },
                'Mesni izdelki in pečeno meso': { id: 'meat-products', icon: '🌭', nameEn: 'Meat Products and Roasted Meat' },
                'Delamaris': { id: 'delamaris', icon: '🐟', nameEn: 'Delamaris' }
            };

            this.state.productGroups = [];
            Object.entries(newProductGroups).forEach(([industrija, products]) => {
                const mapping = industryMapping[industrija];
                this.state.productGroups.push({
                    id: mapping.id,
                    name: industrija,
                    nameEn: mapping.nameEn,
                    icon: mapping.icon,
                    products: products
                });
            });

            // Flatten products
            this.state.products = [];
            this.state.productGroups.forEach(group => {
                this.state.products.push(...group.products);
            });

            // Load base pricing data (C0, Cmin calculations)
            this.state.pricingData = {};
            this.state.products.forEach(product => {
                const lc = product.lc;
                const c0 = lc * this.state.industryFactors.ohFactor;
                const cmin = c0 / (1 - this.state.industryFactors.minProfitMargin);

                this.state.pricingData[product.id] = {
                    lc: lc,
                    c0: c0,
                    cmin: cmin
                };
            });

            // Load customer pricing
            this.state.customerPricing = {};
            const productCodeMap = {};
            this.state.products.forEach(p => {
                productCodeMap[p.code] = p.id;
            });

            ceneKupciData.forEach((row, index) => {
                const aktivenValue = row.aktiven ? row.aktiven.toString().toUpperCase().trim() : '';
                if (!aktivenValue || (aktivenValue !== 'TRUE' && aktivenValue !== 'DA')) {
                    return; // Skip inactive
                }

                const productCode = row.šifra.toString().trim();
                const productId = productCodeMap[productCode];

                if (!productId) {
                    console.warn(`Product code "${productCode}" in Cene_Kupci row ${index + 2} not found in Izdelki sheet`);
                    return;
                }

                if (!this.state.customerPricing[productId]) {
                    this.state.customerPricing[productId] = {};
                }

                const customerId = row.kupec_id.toString().trim();
                const strategicCmin = this.parseEuropeanNumber(row.strategic_cmin);
                const discountInvoice = this.parseEuropeanNumber(row.popust_faktura);
                const discountMarketing = this.parseEuropeanNumber(row.popust_marketing);
                const discountYearEnd = this.parseEuropeanNumber(row.popust_letni);
                const totalDiscounts = discountInvoice + discountMarketing + discountYearEnd;
                const cp = strategicCmin / (1 - totalDiscounts / 100);
                const realizedPrice = cp * (1 - totalDiscounts / 100);
                const base = this.state.pricingData[productId];

                this.state.customerPricing[productId][customerId] = {
                    customerId: customerId,
                    customerName: row.kupec_naziv.toString().trim(),
                    customerType: row.kupec_tip.toString().trim(),
                    strategicCmin: strategicCmin,
                    cp: cp,
                    totalDiscounts: totalDiscounts,
                    discountBreakdown: {
                        invoice: discountInvoice,
                        marketing: discountMarketing,
                        yearEnd: discountYearEnd
                    },
                    realizedPrice: realizedPrice,
                    coverage: {
                        vsC0: (realizedPrice / base.c0) * 100,
                        vsCmin: (realizedPrice / base.cmin) * 100,
                        buffer: ((realizedPrice - base.cmin) / base.cmin) * 100
                    },
                    cumulativeCoverage: this.calculateCumulativeCoverage(
                        base.lc, base.c0, base.cmin, strategicCmin, cp, realizedPrice
                    )
                };
            });

            // Count results
            let customerPricingCount = 0;
            Object.values(this.state.customerPricing).forEach(customers => {
                customerPricingCount += Object.keys(customers).length;
            });

            return {
                success: true,
                productsCount: this.state.products.length,
                customerPricingCount: customerPricingCount
            };

        } catch (error) {
            console.error('Validation error:', error);
            return { success: false, error: error.message };
        }
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

                .language-btn {
                    padding: 8px 12px !important;
                    font-size: 20px !important;
                    min-width: 45px;
                    border: 2px solid rgba(255,255,255,0.3) !important;
                }

                .language-btn.active {
                    background: rgba(255,255,255,0.4) !important;
                    border-color: rgba(255,255,255,0.8) !important;
                    box-shadow: 0 0 10px rgba(255,255,255,0.3);
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

                .status-columns-header {
                    text-align: center !important;
                    background: #455a64 !important;
                }

                .status-header-small {
                    font-size: 9px !important;
                    text-align: center !important;
                    padding: 6px 4px !important;
                    white-space: normal !important;
                    line-height: 1.2;
                    max-width: 60px;
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

                .customer-header-row {
                    background: #37474f !important;
                    color: white;
                    font-weight: 600;
                }

                .customer-header-row th {
                    padding: 8px;
                    font-size: 11px;
                    text-align: center;
                    border: 1px solid #546e7a;
                }

                .status-header {
                    font-size: 10px !important;
                    white-space: nowrap;
                }

                .customer-info {
                    padding-left: 40px !important;
                    position: relative;
                }

                .price-simple {
                    text-align: right;
                    font-weight: 600;
                    font-size: 14px;
                }

                .price-simple.strategic {
                    background: #9C27B010;
                }

                .price-simple.cp {
                    background: #2196F310;
                }

                .price-simple.realized {
                    background: #4CAF5010;
                    color: #2e7d32;
                }

                .status-check {
                    text-align: center;
                    font-size: 20px;
                    padding: 8px;
                }

                .status-check.pass {
                    background: #e8f5e9;
                    color: #2e7d32;
                }

                .status-check.fail {
                    background: #ffebee;
                    color: #c62828;
                }

                .status-icon {
                    font-weight: bold;
                    font-size: 22px;
                }

                /* Product-level status columns */
                .status-check-product {
                    text-align: center;
                    font-size: 18px;
                    padding: 10px 4px;
                    min-width: 50px;
                }

                .status-check-product.pass {
                    background: #e8f5e9;
                    color: #2e7d32;
                }

                .status-check-product.fail {
                    background: #ffebee;
                    color: #c62828;
                }

                .status-check-product.neutral {
                    background: #f5f5f5;
                    color: #9e9e9e;
                }

                .status-check-product .status-icon {
                    font-weight: bold;
                    font-size: 20px;
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

                /* Excel Upload Modal */
                .upload-modal {
                    display: none;
                    position: fixed;
                    z-index: 10000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    background-color: rgba(0,0,0,0.5);
                    align-items: center;
                    justify-content: center;
                }

                .modal-content {
                    background: white;
                    margin: auto;
                    padding: 0;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 900px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    animation: modalFadeIn 0.3s;
                }

                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px 25px;
                    border-radius: 10px 10px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 22px;
                }

                .close-modal {
                    color: white;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    background: none;
                    border: none;
                    padding: 0;
                    line-height: 1;
                    transition: transform 0.2s;
                }

                .close-modal:hover {
                    transform: scale(1.2);
                }

                .modal-body {
                    padding: 25px;
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .modal-section {
                    margin-bottom: 25px;
                }

                .modal-section h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 18px;
                    border-bottom: 2px solid #e0e0e0;
                    padding-bottom: 10px;
                }

                .format-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 13px;
                    background: white;
                }

                .format-table th,
                .format-table td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                }

                .format-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #333;
                }

                .format-table tr:nth-child(even) {
                    background: #fafafa;
                }

                .format-table code {
                    background: #e3f2fd;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                }

                .info-box {
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .info-box strong {
                    color: #1976d2;
                }

                .warning-box {
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .upload-area {
                    background: #f8f9fa;
                    border: 2px dashed #2196f3;
                    border-radius: 8px;
                    padding: 30px;
                    text-align: center;
                    margin: 20px 0;
                }

                .btn-upload,
                .btn-select-file,
                .btn-process,
                .btn-cancel {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s;
                }

                .btn-upload {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }

                .btn-upload:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }

                .btn-select-file {
                    background: #2196f3;
                    color: white;
                    margin: 10px 0;
                }

                .btn-select-file:hover {
                    background: #1976d2;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(33,150,243,0.4);
                }

                .btn-process {
                    background: #4CAF50;
                    color: white;
                }

                .btn-process:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(76,175,80,0.4);
                }

                .btn-process:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-cancel {
                    background: #f44336;
                    color: white;
                }

                .btn-cancel:hover {
                    background: #d32f2f;
                    transform: translateY(-2px);
                }

                .modal-footer {
                    padding: 20px 25px;
                    background: #f8f9fa;
                    border-radius: 0 0 10px 10px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }

                /* Factors table styling */
                .factors-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }

                .factors-table thead {
                    background: #37474f;
                    color: white;
                }

                .factors-table th {
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }

                .factors-table tbody tr {
                    border-bottom: 1px solid #e0e0e0;
                }

                .factors-table tbody tr:hover {
                    background: #f5f5f5;
                }

                .factors-table td {
                    padding: 15px 12px;
                }

                .factor-input {
                    width: 120px;
                    padding: 8px 12px;
                    font-size: 16px;
                    font-weight: 600;
                    border: 2px solid #ccc;
                    border-radius: 4px;
                    text-align: center;
                    transition: border-color 0.3s;
                }

                .factor-input:focus {
                    outline: none;
                    border-color: #2196f3;
                    box-shadow: 0 0 5px rgba(33,150,243,0.3);
                }

                .factors-info {
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #2196f3;
                }

                .btn-edit-factors {
                    background: #ff9800;
                    color: white;
                    padding: 10px 18px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s;
                }

                .btn-edit-factors:hover {
                    background: #f57c00;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(255,152,0,0.3);
                }

                .file-name {
                    margin: 15px 0;
                    padding: 10px;
                    background: #e8f5e9;
                    border-radius: 4px;
                    display: none;
                    align-items: center;
                    gap: 10px;
                }

                .file-name.show {
                    display: flex;
                }

                .upload-status {
                    margin: 15px 0;
                    padding: 12px;
                    border-radius: 4px;
                    display: none;
                    font-size: 14px;
                }

                .upload-status.show {
                    display: block;
                }

                .upload-status.success {
                    background: #c8e6c9;
                    color: #2e7d32;
                    border-left: 4px solid #4CAF50;
                }

                .upload-status.error {
                    background: #ffcdd2;
                    color: #c62828;
                    border-left: 4px solid #f44336;
                }

                .upload-status.info {
                    background: #e3f2fd;
                    color: #1976d2;
                    border-left: 4px solid #2196f3;
                }

                .upload-status.processing {
                    background: #fff3cd;
                    color: #f57c00;
                    border-left: 4px solid #ffc107;
                }

                /* Top-level summary styling */
                .top-level-summary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .top-level-summary h3 {
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 600;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .summary-metric {
                    background: rgba(255, 255, 255, 0.15);
                    padding: 16px;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }

                .summary-metric .metric-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: 0.9;
                    margin-bottom: 8px;
                    display: block;
                }

                .summary-metric .metric-value {
                    font-size: 28px;
                    font-weight: 700;
                    display: block;
                }

                .summary-pricing {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 16px;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }

                .pricing-flow-summary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .pricing-flow-summary .flow-item {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .pricing-flow-summary .flow-item.realized {
                    background: rgba(76, 175, 80, 0.3);
                    font-size: 16px;
                    padding: 10px 20px;
                }

                .pricing-flow-summary .flow-arrow {
                    font-size: 18px;
                    opacity: 0.7;
                }

                /* Industry summary styling */
                .industry-summary-row {
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    padding: 20px;
                    border: 2px solid #e9ecef;
                }

                .industry-summary-header {
                    margin-bottom: 16px;
                }

                .industry-summary-header h4 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #495057;
                }

                .industry-summary-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .summary-stats-row {
                    display: flex;
                    gap: 24px;
                    flex-wrap: wrap;
                }

                .stat-item {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }

                .stat-item .stat-label {
                    font-size: 13px;
                    color: #6c757d;
                    font-weight: 500;
                }

                .stat-item .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #212529;
                }

                .stat-item .stat-value.good {
                    color: #28a745;
                }

                .stat-item .stat-value.warning {
                    color: #ffc107;
                }

                .stat-item .stat-value.danger {
                    color: #dc3545;
                }

                .industry-pricing-flow {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: white;
                    border-radius: 6px;
                    flex-wrap: wrap;
                }

                .industry-pricing-flow .price-tag {
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 13px;
                    white-space: nowrap;
                }

                .industry-pricing-flow .price-tag.lc {
                    background: #e3f2fd;
                    color: #1976d2;
                }

                .industry-pricing-flow .price-tag.c0 {
                    background: #fff3e0;
                    color: #f57c00;
                }

                .industry-pricing-flow .price-tag.cmin {
                    background: #fce4ec;
                    color: #c2185b;
                }

                .industry-pricing-flow .price-tag.cp {
                    background: #f3e5f5;
                    color: #7b1fa2;
                }

                .industry-pricing-flow .price-tag.realized {
                    background: #e8f5e9;
                    color: #2e7d32;
                    font-size: 15px;
                    font-weight: 700;
                }

                .industry-pricing-flow .arrow {
                    color: #adb5bd;
                    font-size: 16px;
                }

                #excel-file-input {
                    display: none;
                }
            </style>
        `;
    }
};

// Export
window.PricingV4 = PricingV4;

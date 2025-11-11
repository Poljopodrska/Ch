// Customer CRM Module - Integrated with Pricing and Sales

// API Base URL - dynamically set based on environment
const CRM_API_BASE_URL = (() => {
    if (window.location.protocol === 'file:') {
        return ''; // Will use mock API
    }
    // Check if we're on a standard port (80/443) - use /api proxy
    const port = window.location.port;
    if (!port || port === '80' || port === '443') {
        return ''; // Use relative URLs - assumes reverse proxy
    }
    // Otherwise use explicit port 8000
    return `${window.location.protocol}//${window.location.hostname}:8000`;
})();

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
    
    async init(options = {}) {
        console.log(`CRM Module V${this.VERSION} initializing...`);
        this.state.integrationMode = options.integrationMode || false;
        await this.loadCustomers();
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
    
    async loadCustomers() {
        console.log('[CRM] Loading customers from database API...');
        try {
            // Fetch customers from database API
            const response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/`);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const dbCustomers = await response.json();
            console.log(`[CRM] Loaded ${dbCustomers.length} customers from database`);

            // Map database fields to CRM structure
            this.state.customers = dbCustomers.map(dbCustomer => {
                // Parse notes for additional fields (website, discount, orderCount)
                let notesObj = {};
                try {
                    if (dbCustomer.notes && dbCustomer.notes.startsWith('{')) {
                        notesObj = JSON.parse(dbCustomer.notes);
                    }
                } catch (e) {
                    console.warn('[CRM] Could not parse notes as JSON for customer:', dbCustomer.id);
                }

                return {
                    id: dbCustomer.id,
                    code: dbCustomer.customer_code || `CUS${dbCustomer.id}`,
                    name: dbCustomer.name,
                    type: dbCustomer.customer_type || 'General',
                    country: dbCustomer.country || '',
                    city: dbCustomer.city || '',
                    address: dbCustomer.address || '',
                    phone: dbCustomer.phone || '',
                    email: dbCustomer.email || '',
                    website: notesObj.website || '',
                    taxId: dbCustomer.tax_id || '',
                    responsiblePerson: dbCustomer.account_manager || '',
                    creditLimit: dbCustomer.credit_limit || 0,
                    paymentTerms: dbCustomer.payment_terms_days || 30,
                    discount: notesObj.discount || 0,
                    rating: dbCustomer.segment || 'C',
                    status: dbCustomer.is_active ? 'active' : 'inactive',
                    notes: notesObj.notes || dbCustomer.notes || '',
                    totalRevenue: dbCustomer.lifetime_value || 0,
                    lastOrder: dbCustomer.last_order_date || '',
                    orderCount: notesObj.orderCount || 0
                };
            });

            console.log('[CRM] Successfully mapped customers to CRM structure');

        } catch (error) {
            console.error('[CRM] Failed to load customers from API:', error);
            console.log('[CRM] Showing empty customer list');

            // Show empty list if API fails
            this.state.customers = [];
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

    async saveCustomer(customer) {
        console.log('[CRM] Saving customer to database API:', customer.name);
        try {
            // Prepare notes object with additional fields
            const notesObj = {
                website: customer.website,
                discount: customer.discount,
                orderCount: customer.orderCount,
                notes: customer.notes
            };

            // Map CRM fields to database schema
            const dbCustomer = {
                name: customer.name,
                customer_code: customer.code || `CUS${Date.now()}`,
                customer_type: customer.type,
                country: customer.country,
                city: customer.city,
                address: customer.address,
                phone: customer.phone,
                email: customer.email,
                tax_id: customer.taxId,
                account_manager: customer.responsiblePerson,
                credit_limit: customer.creditLimit,
                payment_terms_days: customer.paymentTerms,
                segment: customer.rating,
                is_active: customer.status === 'active',
                notes: JSON.stringify(notesObj),
                lifetime_value: customer.totalRevenue,
                last_order_date: customer.lastOrder || null
            };

            let response;
            let method;
            let url;

            // Check if this is a new customer (no id or id starts with 'c')
            const isNewCustomer = !customer.id || (typeof customer.id === 'string' && customer.id.startsWith('c'));

            if (isNewCustomer) {
                // POST for new customers
                method = 'POST';
                url = '/api/v1/customers/';
                console.log('[CRM] Creating new customer');
            } else {
                // PUT for existing customers
                method = 'PUT';
                url = `/api/v1/customers/${customer.id}`;
                dbCustomer.id = customer.id;
                console.log('[CRM] Updating existing customer:', customer.id);
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dbCustomer)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const savedCustomer = await response.json();
            console.log('[CRM] Customer saved successfully:', savedCustomer.id);

            // Update customer in state with the returned ID
            if (isNewCustomer) {
                customer.id = savedCustomer.id;
                customer.code = savedCustomer.customer_code;
                this.state.customers.push(customer);
            } else {
                const index = this.state.customers.findIndex(c => c.id === customer.id);
                if (index !== -1) {
                    this.state.customers[index] = customer;
                }
            }

            return savedCustomer;

        } catch (error) {
            console.error('[CRM] Failed to save customer:', error);
            alert(`Failed to save customer: ${error.message}`);
            throw error;
        }
    },

    async deleteCustomer(customerId) {
        console.log('[CRM] Deleting customer:', customerId);
        try {
            const response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/${customerId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            console.log('[CRM] Customer deleted successfully:', customerId);

            // Remove customer from state
            this.state.customers = this.state.customers.filter(c => c.id !== customerId);

            return true;

        } catch (error) {
            console.error('[CRM] Failed to delete customer:', error);
            alert(`Failed to delete customer: ${error.message}`);
            throw error;
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
                    <h1>Upravljanje strank (CRM)</h1>
                    <div class="header-controls">
                        <input type="text" class="search-input" placeholder="Iskanje strank..."
                               value="${this.state.searchQuery}"
                               onkeyup="CustomerCRM.handleSearch(this.value)">
                        <button class="btn-add" onclick="CustomerCRM.showAddCustomer()">
                            Dodaj stranko
                        </button>
                        <button class="btn-export" onclick="CustomerCRM.downloadTemplate()">
                            Prenesi vzorec Excel
                        </button>
                        <button class="btn-export" onclick="CustomerCRM.openUploadModal()">
                            Uvozi iz Excel
                        </button>
                        <button class="btn-export" onclick="CustomerCRM.exportData()">
                            Izvozi
                        </button>
                    </div>
                </div>

                <div class="crm-content">
                    ${this.renderCustomerList()}
                </div>
            </div>

            <!-- Upload Modal -->
            <div id="customer-upload-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: var(--ch-text-primary);">Uvoz strank iz Excel</h3>
                        <button onclick="CustomerCRM.closeUploadModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--ch-text-secondary);">&times;</button>
                    </div>

                    <div style="margin-bottom: 20px; padding: 15px; background: var(--ch-gray-50); border-radius: 8px;">
                        <h4 style="margin-bottom: 10px; color: var(--ch-text-primary);">Navodila:</h4>
                        <ol style="margin-left: 20px; color: var(--ch-text-secondary);">
                            <li>Prenesite vzorec Excel datoteke s klikom na "Prenesi vzorec Excel"</li>
                            <li>Izpolnite vrstice z vašimi strankami (vrstica 2 je primer)</li>
                            <li>Naložite izpolnjeno datoteko spodaj</li>
                        </ol>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--ch-text-primary);">Izberi Excel datoteko (.xlsx)</label>
                        <input type="file" id="customer-excel-file" accept=".xlsx,.xls" onchange="CustomerCRM.previewExcelFile(this.files[0])"
                               style="padding: 10px; border: 2px dashed var(--ch-border-medium); border-radius: 8px; width: 100%;">
                    </div>

                    <div id="customer-upload-preview" style="margin-top: 20px; display: none;">
                        <h4 style="margin-bottom: 10px;">Predogled:</h4>
                        <div id="customer-upload-preview-content" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--ch-border-medium); border-radius: 8px; padding: 10px;">
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button onclick="CustomerCRM.closeUploadModal()" class="btn btn-outline">
                            Prekliči
                        </button>
                        <button onclick="CustomerCRM.processUpload()" id="customer-upload-confirm-btn" class="btn btn-primary" disabled>
                            Uvozi stranke
                        </button>
                    </div>
                </div>
            </div>

            <!-- Customer Add/Edit Modal -->
            <div id="customer-modal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2 id="modal-title">Dodaj stranko</h2>
                        <button class="close-btn" onclick="CustomerCRM.closeModal()">&times;</button>
                    </div>

                    <form id="customer-form" onsubmit="CustomerCRM.handleFormSubmit(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="customer-code">Šifra stranke *</label>
                                <input type="text" id="customer-code" required placeholder="npr. CU001">
                            </div>

                            <div class="form-group">
                                <label for="customer-name">Ime stranke *</label>
                                <input type="text" id="customer-name" required placeholder="npr. Poslovni partner d.o.o.">
                            </div>

                            <div class="form-group">
                                <label for="customer-type">Tip stranke</label>
                                <select id="customer-type">
                                    <option value="Retail">Retail</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Distribution">Distribution</option>
                                    <option value="Food Service">Food Service</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="customer-email">Email</label>
                                <input type="email" id="customer-email" placeholder="npr. info@stranka.si">
                            </div>

                            <div class="form-group">
                                <label for="customer-phone">Telefon</label>
                                <input type="tel" id="customer-phone" placeholder="npr. +386 1 234 5678">
                            </div>

                            <div class="form-group">
                                <label for="customer-contact">Kontaktna oseba</label>
                                <input type="text" id="customer-contact" placeholder="npr. Janez Novak">
                            </div>

                            <!-- Address Fields -->
                            <div class="form-group">
                                <label for="customer-address">Ulica in hišna številka</label>
                                <input type="text" id="customer-address" placeholder="npr. Slovenska cesta 123">
                            </div>

                            <div class="form-group">
                                <label for="customer-postal-code">Poštna številka</label>
                                <input type="text" id="customer-postal-code" placeholder="npr. 10000">
                            </div>

                            <div class="form-group">
                                <label for="customer-city">Mesto</label>
                                <input type="text" id="customer-city" placeholder="npr. Zagreb">
                            </div>

                            <div class="form-group">
                                <label for="customer-country">Država</label>
                                <input type="text" id="customer-country" value="Croatia" placeholder="Croatia">
                            </div>

                            <div class="form-group">
                                <label for="customer-tax-id">Davčna številka</label>
                                <input type="text" id="customer-tax-id" placeholder="npr. SI12345678">
                            </div>

                            <div class="form-group">
                                <label for="customer-payment-terms">Plačilni pogoji (dni)</label>
                                <input type="number" id="customer-payment-terms" value="30" min="0">
                            </div>

                            <div class="form-group">
                                <label for="customer-credit-limit">Kreditni limit (€)</label>
                                <input type="number" id="customer-credit-limit" value="10000" min="0" step="100">
                            </div>

                            <div class="form-group">
                                <label for="customer-discount">Popust (%)</label>
                                <input type="number" id="customer-discount" value="0" min="0" max="100" step="0.1">
                            </div>

                            <div class="form-group">
                                <label for="customer-responsible">Odgovorna oseba</label>
                                <input type="text" id="customer-responsible" placeholder="npr. Marko Horvat">
                            </div>

                            <div class="form-group full-width">
                                <label for="customer-notes">Opombe</label>
                                <textarea id="customer-notes" rows="3" placeholder="Dodatne opombe o stranki"></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" onclick="CustomerCRM.closeModal()">Prekliči</button>
                            <button type="submit" class="btn-save">Shrani</button>
                        </div>
                    </form>
                </div>
            </div>

            ${this.getStyles()}
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
        // Open modal to add new customer
        const modal = document.getElementById('customer-modal');
        modal.style.display = 'flex';
        document.getElementById('modal-title').textContent = 'Dodaj stranko';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-form').dataset.customerId = '';
        document.getElementById('customer-country').value = 'Croatia'; // Default to Croatia
    },

    closeModal() {
        const modal = document.getElementById('customer-modal');
        modal.style.display = 'none';
        document.getElementById('customer-form').reset();
    },

    async handleFormSubmit(event) {
        event.preventDefault();

        try {
            // Collect form data
            const customerData = {
                id: document.getElementById('customer-form').dataset.customerId || null,
                code: document.getElementById('customer-code').value,
                name: document.getElementById('customer-name').value,
                type: document.getElementById('customer-type').value,
                email: document.getElementById('customer-email').value,
                phone: document.getElementById('customer-phone').value,
                contactPerson: document.getElementById('customer-contact').value,
                address: document.getElementById('customer-address').value,
                postal_code: document.getElementById('customer-postal-code').value,
                city: document.getElementById('customer-city').value,
                country: document.getElementById('customer-country').value,
                taxId: document.getElementById('customer-tax-id').value,
                paymentTerms: parseInt(document.getElementById('customer-payment-terms').value) || 30,
                creditLimit: parseFloat(document.getElementById('customer-credit-limit').value) || 10000,
                discount: parseFloat(document.getElementById('customer-discount').value) || 0,
                responsiblePerson: document.getElementById('customer-responsible').value,
                notes: document.getElementById('customer-notes').value,
                status: 'active',
                rating: 'B', // Default rating
                totalRevenue: 0,
                orderCount: 0,
                lastOrder: null,
                website: ''
            };

            console.log('[CRM] Submitting customer data:', customerData);

            // Save to database
            await this.saveCustomer(customerData);

            // Close modal and refresh
            this.closeModal();
            await this.loadCustomers();
            this.render();

            alert('Stranka uspešno shranjena!');

        } catch (error) {
            console.error('[CRM] Error saving customer:', error);
            alert(`Napaka pri shranjevanju stranke: ${error.message}`);
        }
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

                /* Modal Styles */
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 2000;
                    align-items: center;
                    justify-content: center;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                .modal-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 20px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 22px;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 32px;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                #customer-form {
                    padding: 30px;
                    overflow-y: auto;
                    max-height: calc(90vh - 160px);
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group.full-width {
                    grid-column: 1 / -1;
                }

                .form-group label {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--ch-text-primary);
                    font-size: 14px;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 10px 12px;
                    border: 2px solid var(--ch-border-medium);
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--ch-primary);
                }

                .form-group textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 30px;
                    background: var(--ch-gray-50);
                    border-top: 1px solid var(--ch-border-light);
                }

                .btn-cancel,
                .btn-save {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel {
                    background: var(--ch-gray-200);
                    color: var(--ch-text-primary);
                }

                .btn-cancel:hover {
                    background: var(--ch-gray-300);
                }

                .btn-save {
                    background: var(--ch-primary);
                    color: white;
                }

                .btn-save:hover {
                    background: var(--ch-primary-dark);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
            </style>
        `;
    },

    downloadTemplate() {
        // Create sample Excel file with headers and one example row
        const sampleData = [
            {
                'Customer Name': 'Example Company Ltd.',
                'Customer Code': 'CUST001',
                'Type': 'Retail Chain',
                'Country': 'Slovenia',
                'City': 'Ljubljana',
                'Address': 'Example Street 123',
                'Phone': '+386 1 234 5678',
                'Email': 'info@example.com',
                'Tax ID': 'SI12345678',
                'Account Manager': 'John Doe',
                'Credit Limit': 50000,
                'Payment Terms (days)': 30,
                'Segment (A/B/C)': 'B',
                'Notes': 'This is a sample - delete this row and add your customers'
            }
        ];

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(sampleData);

        // Set column widths
        ws['!cols'] = [
            { wch: 30 }, // Customer Name
            { wch: 15 }, // Customer Code
            { wch: 20 }, // Type
            { wch: 15 }, // Country
            { wch: 20 }, // City
            { wch: 35 }, // Address
            { wch: 18 }, // Phone
            { wch: 30 }, // Email
            { wch: 15 }, // Tax ID
            { wch: 20 }, // Account Manager
            { wch: 15 }, // Credit Limit
            { wch: 20 }, // Payment Terms
            { wch: 15 }, // Segment
            { wch: 50 }  // Notes
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');

        // Generate and download
        XLSX.writeFile(wb, 'customers_template.xlsx');
    },

    openUploadModal() {
        const modal = document.getElementById('customer-upload-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset file input
            const fileInput = document.getElementById('customer-excel-file');
            if (fileInput) fileInput.value = '';
            const preview = document.getElementById('customer-upload-preview');
            if (preview) preview.style.display = 'none';
            const confirmBtn = document.getElementById('customer-upload-confirm-btn');
            if (confirmBtn) confirmBtn.disabled = true;
            this.uploadedData = null;
        }
    },

    closeUploadModal() {
        const modal = document.getElementById('customer-upload-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    async previewExcelFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    alert('Excel datoteka je prazna!');
                    return;
                }

                // Validate and map columns
                this.uploadedData = jsonData.map((row, index) => {
                    const customer = {
                        name: row['Customer Name'] || '',
                        customer_code: row['Customer Code'] || 'CUS' + Date.now() + '_' + index,
                        customer_type: row['Type'] || 'General',
                        country: row['Country'] || '',
                        city: row['City'] || '',
                        address: row['Address'] || '',
                        phone: row['Phone'] || '',
                        email: row['Email'] || '',
                        tax_id: row['Tax ID'] || '',
                        account_manager: row['Account Manager'] || '',
                        credit_limit: parseFloat(row['Credit Limit']) || 0,
                        payment_terms_days: parseInt(row['Payment Terms (days)']) || 30,
                        segment: (row['Segment (A/B/C)'] || 'C').toUpperCase(),
                        notes: row['Notes'] || ''
                    };

                    // Validate required fields
                    if (!customer.name) {
                        throw new Error(`Vrstica ${index + 2}: Manjka ime stranke`);
                    }

                    // Validate segment
                    if (!['A', 'B', 'C'].includes(customer.segment)) {
                        customer.segment = 'C';
                    }

                    return customer;
                });

                // Show preview
                const previewHtml = `
                    <p style="margin-bottom: 10px; color: var(--ch-success);">
                        <strong>Najdenih ${this.uploadedData.length} strank</strong>
                    </p>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--ch-gray-100);">
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Ime</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Tip</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Mesto</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Segment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.uploadedData.slice(0, 5).map(c => `
                                <tr>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.name}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.customer_type}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.city}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.segment}</td>
                                </tr>
                            `).join('')}
                            ${this.uploadedData.length > 5 ? `
                                <tr>
                                    <td colspan="4" style="padding: 5px; text-align: center; font-style: italic;">
                                        ... in še ${this.uploadedData.length - 5} strank
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                `;

                document.getElementById('customer-upload-preview-content').innerHTML = previewHtml;
                document.getElementById('customer-upload-preview').style.display = 'block';
                document.getElementById('customer-upload-confirm-btn').disabled = false;

            } catch (error) {
                alert('Napaka pri branju Excel datoteke: ' + error.message);
                console.error('Excel parsing error:', error);
            }
        };

        reader.readAsArrayBuffer(file);
    },

    async processUpload() {
        if (!this.uploadedData || this.uploadedData.length === 0) {
            alert('Ni podatkov za uvoz!');
            return;
        }

        const confirmMsg = `Ali ste prepričani, da želite uvoziti ${this.uploadedData.length} strank?`;
        if (!confirm(confirmMsg)) {
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Upload each customer
        for (const customerData of this.uploadedData) {
            try {
                const response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData)
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error('Failed to upload customer:', customerData.name);
                }
            } catch (error) {
                errorCount++;
                console.error('Error uploading customer:', error);
            }
        }

        // Reload customers
        await this.loadCustomers();
        this.render();
        this.closeUploadModal();

        // Show result
        alert(`Uvoz zaključen!\nUspešno: ${successCount}\nNapake: ${errorCount}`);
    }
};

// Export
window.CustomerCRM = CustomerCRM;
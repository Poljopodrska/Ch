// Customer CRM Module - Integrated with Pricing and Sales
// Styled to match Nabava (Suppliers) module

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
    VERSION: '2.0.0',
    customers: [],

    async init() {
        console.log(`CRM Module V${this.VERSION} initializing...`);
        this.render();
        await this.loadCustomers();
    },

    render() {
        const container = document.getElementById('crm-container');
        if (!container) {
            console.error('CRM container not found');
            return;
        }

        container.innerHTML = `
            <style>
                .customers-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 20px;
                    border-radius: var(--radius-md);
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .customers-content {
                    background: var(--ch-white);
                    border-radius: var(--radius-md);
                    padding: 20px;
                    box-shadow: var(--shadow-md);
                }

                .customers-controls {
                    margin-bottom: 20px;
                    display: flex;
                    gap: 10px;
                }

                .customers-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                .customers-table th {
                    background: var(--ch-primary);
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid var(--ch-border-medium);
                }

                .customers-table td {
                    padding: 12px;
                    border-bottom: 1px solid var(--ch-border-light);
                }

                .customers-table tr:hover {
                    background: var(--ch-gray-50);
                }

                .payment-terms {
                    font-weight: 600;
                    color: var(--ch-primary-dark);
                }

                .days-late {
                    font-weight: 600;
                }

                .days-late.positive {
                    color: var(--ch-error);
                }

                .days-late.negative {
                    color: var(--ch-success);
                }

                .days-late.neutral {
                    color: var(--ch-text-secondary);
                }

                .btn-edit, .btn-delete {
                    padding: 6px 12px;
                    margin-right: 5px;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    border: none;
                    font-size: 13px;
                }

                .btn-edit {
                    background: var(--ch-primary);
                    color: white;
                }

                .btn-edit:hover {
                    background: var(--ch-primary-dark);
                }

                .btn-delete {
                    background: var(--ch-error);
                    color: white;
                }

                .btn-delete:hover {
                    background: var(--ch-error-light);
                }

                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                }

                .modal.active {
                    display: flex;
                }

                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: var(--radius-lg);
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .modal-header h3 {
                    margin: 0;
                    color: var(--ch-text-primary);
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--ch-text-secondary);
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: var(--ch-text-primary);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 10px;
                    border: 1px solid var(--ch-border-medium);
                    border-radius: var(--radius-sm);
                    font-size: 14px;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--ch-primary);
                    box-shadow: 0 0 0 3px var(--ch-primary-pale);
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
            </style>

            <div class="customers-header">
                <h2>Stranke</h2>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="CustomerCRM.openAddModal()">
                        Dodaj stranko
                    </button>
                    <button class="btn btn-outline" onclick="CustomerCRM.downloadTemplate()" style="background: white; color: var(--ch-primary);">
                        Prenesi vzorec Excel
                    </button>
                    <button class="btn btn-outline" onclick="CustomerCRM.openUploadModal()" style="background: white; color: var(--ch-primary);">
                        Uvozi iz Excel
                    </button>
                </div>
            </div>

            <div class="customers-content">
                <div class="customers-controls">
                    <input type="text" id="search-customer" placeholder="Iskanje stranke..."
                           style="flex: 1; padding: 10px; border: 1px solid var(--ch-border-medium); border-radius: var(--radius-sm);">
                </div>

                <table class="customers-table">
                    <thead>
                        <tr>
                            <th>Naziv stranke</th>
                            <th>Tip stranke</th>
                            <th>Kontakt oseba</th>
                            <th>Email</th>
                            <th>Telefon</th>
                            <th>Plačilni pogoji (dni)</th>
                            <th>Povprečna zamuda (dni)</th>
                            <th>Mesto</th>
                            <th>Država</th>
                            <th>Dejanja</th>
                        </tr>
                    </thead>
                    <tbody id="customers-tbody">
                        <tr>
                            <td colspan="10" style="text-align: center; padding: 40px;">
                                Nalaganje strank...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Add/Edit Modal -->
            <div id="customer-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="customer-modal-title">Dodaj stranko</h3>
                        <button class="close-btn" onclick="CustomerCRM.closeModal()">&times;</button>
                    </div>

                    <form id="customer-form" onsubmit="CustomerCRM.saveCustomer(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="customer-name">Naziv stranke *</label>
                                <input type="text" id="customer-name" required>
                            </div>

                            <div class="form-group">
                                <label for="customer-type">Tip stranke *</label>
                                <select id="customer-type" required>
                                    <option value="Retail">Retail</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Distribution">Distribution</option>
                                    <option value="Food Service">Food Service</option>
                                    <option value="HoReCa">HoReCa</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="customer-contact-person">Kontakt oseba</label>
                                <input type="text" id="customer-contact-person">
                            </div>

                            <div class="form-group">
                                <label for="customer-email">Email</label>
                                <input type="email" id="customer-email">
                            </div>

                            <div class="form-group">
                                <label for="customer-phone">Telefon</label>
                                <input type="tel" id="customer-phone">
                            </div>

                            <div class="form-group">
                                <label for="customer-payment-terms">Plačilni pogoji (dni) *</label>
                                <input type="number" id="customer-payment-terms" min="0" required value="30"
                                       placeholder="npr. 30, 60, 90">
                                <small style="color: var(--ch-text-secondary); margin-top: 5px;">
                                    Dogovorjeni rok plačila v dneh
                                </small>
                            </div>

                            <div class="form-group">
                                <label for="customer-address">Ulica in hišna številka</label>
                                <input type="text" id="customer-address" placeholder="npr. Slovenska cesta 123">
                            </div>

                            <div class="form-group">
                                <label for="customer-postal-code">Poštna številka</label>
                                <input type="text" id="customer-postal-code" placeholder="npr. 1000">
                            </div>

                            <div class="form-group">
                                <label for="customer-city">Mesto</label>
                                <input type="text" id="customer-city" placeholder="npr. Ljubljana">
                            </div>

                            <div class="form-group">
                                <label for="customer-country">Država</label>
                                <input type="text" id="customer-country" value="Slovenia" placeholder="Slovenia">
                            </div>

                            <div class="form-group">
                                <label for="customer-tax-id">Davčna številka</label>
                                <input type="text" id="customer-tax-id" placeholder="npr. SI12345678">
                            </div>

                            <div class="form-group">
                                <label for="customer-credit-limit">Kreditni limit (€)</label>
                                <input type="number" id="customer-credit-limit" min="0" step="100" value="10000">
                            </div>

                            <div class="form-group">
                                <label for="customer-account-manager">Odgovorna oseba</label>
                                <input type="text" id="customer-account-manager" placeholder="npr. Janez Novak">
                            </div>

                            <div class="form-group">
                                <label for="customer-notes">Opombe</label>
                                <textarea id="customer-notes" rows="3"></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="CustomerCRM.closeModal()">
                                Prekliči
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Shrani
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Upload Modal -->
            <div id="customer-upload-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Uvoz strank iz Excel</h3>
                        <button class="close-btn" onclick="CustomerCRM.closeUploadModal()">&times;</button>
                    </div>

                    <div style="margin-bottom: 20px; padding: 15px; background: var(--ch-gray-50); border-radius: var(--radius-sm);">
                        <h4 style="margin-bottom: 10px; color: var(--ch-text-primary);">Navodila:</h4>
                        <ol style="margin-left: 20px; color: var(--ch-text-secondary);">
                            <li>Prenesite vzorec Excel datoteke s klikom na "Prenesi vzorec Excel"</li>
                            <li>Izpolnite vrstice z vašimi strankami (vrstica 2 je primer)</li>
                            <li>Naložite izpolnjeno datoteko spodaj</li>
                        </ol>
                    </div>

                    <div class="form-group">
                        <label for="customer-excel-file">Izberi Excel datoteko (.xlsx)</label>
                        <input type="file" id="customer-excel-file" accept=".xlsx,.xls"
                               style="padding: 10px; border: 2px dashed var(--ch-border-medium); border-radius: var(--radius-sm); width: 100%;">
                    </div>

                    <div id="customer-upload-preview" style="margin-top: 20px; display: none;">
                        <h4 style="margin-bottom: 10px;">Predogled:</h4>
                        <div id="customer-upload-preview-content" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--ch-border-medium); border-radius: var(--radius-sm); padding: 10px;">
                        </div>
                    </div>

                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="CustomerCRM.closeUploadModal()">
                            Prekliči
                        </button>
                        <button type="button" class="btn btn-primary" onclick="CustomerCRM.processUpload()" id="customer-upload-confirm-btn" disabled>
                            Uvozi stranke
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Setup search
        document.getElementById('search-customer').addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        // Setup file upload preview
        document.getElementById('customer-excel-file')?.addEventListener('change', (e) => {
            this.previewExcelFile(e.target.files[0]);
        });
    },

    async loadCustomers() {
        try {
            const response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/`);
            if (response.ok) {
                this.customers = await response.json();
                console.log('Loaded customers from database:', this.customers);
            } else {
                console.warn('API not available, showing empty list');
                this.customers = [];
            }
            this.displayCustomers();
        } catch (error) {
            console.error('Error loading customers:', error);
            this.customers = [];
            this.displayCustomers();
        }
    },

    displayCustomers(customers = this.customers) {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        if (customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px; color: var(--ch-text-secondary);">
                        Ni najdenih strank
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = customers.map(customer => {
            // Determine color class for average days late
            const avgDaysLate = customer.average_days_late || 0;
            let daysLateClass = 'neutral';
            if (avgDaysLate > 0) daysLateClass = 'positive'; // late = red
            else if (avgDaysLate < 0) daysLateClass = 'negative'; // early = green

            return `
                <tr>
                    <td><strong>${customer.name}</strong></td>
                    <td>${customer.customer_type || '-'}</td>
                    <td>${customer.contact_person || '-'}</td>
                    <td>${customer.email || '-'}</td>
                    <td>${customer.phone || '-'}</td>
                    <td class="payment-terms">${customer.payment_terms_days || 30} dni</td>
                    <td class="days-late ${daysLateClass}">${avgDaysLate.toFixed(1)} dni</td>
                    <td>${customer.city || '-'}</td>
                    <td>${customer.country || '-'}</td>
                    <td>
                        <button class="btn-edit" onclick="CustomerCRM.editCustomer(${customer.id})">
                            Uredi
                        </button>
                        <button class="btn-delete" onclick="CustomerCRM.deleteCustomer(${customer.id})">
                            Izbriši
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterCustomers(searchTerm) {
        const filtered = this.customers.filter(customer => {
            const term = searchTerm.toLowerCase();
            return customer.name.toLowerCase().includes(term) ||
                   (customer.contact_person && customer.contact_person.toLowerCase().includes(term)) ||
                   (customer.email && customer.email.toLowerCase().includes(term)) ||
                   (customer.city && customer.city.toLowerCase().includes(term));
        });
        this.displayCustomers(filtered);
    },

    openAddModal() {
        document.getElementById('customer-modal-title').textContent = 'Dodaj stranko';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-form').dataset.customerId = '';
        document.getElementById('customer-country').value = 'Slovenia';
        document.getElementById('customer-payment-terms').value = '30';
        document.getElementById('customer-credit-limit').value = '10000';
        document.getElementById('customer-modal').classList.add('active');
    },

    editCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (!customer) return;

        document.getElementById('customer-modal-title').textContent = 'Uredi stranko';
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-type').value = customer.customer_type || 'Retail';
        document.getElementById('customer-contact-person').value = customer.contact_person || '';
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-payment-terms').value = customer.payment_terms_days || 30;
        document.getElementById('customer-address').value = customer.address || '';
        document.getElementById('customer-postal-code').value = customer.postal_code || '';
        document.getElementById('customer-city').value = customer.city || '';
        document.getElementById('customer-country').value = customer.country || 'Slovenia';
        document.getElementById('customer-tax-id').value = customer.tax_id || '';
        document.getElementById('customer-credit-limit').value = customer.credit_limit || 10000;
        document.getElementById('customer-account-manager').value = customer.account_manager || '';
        document.getElementById('customer-notes').value = customer.notes || '';
        document.getElementById('customer-form').dataset.customerId = id;
        document.getElementById('customer-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('customer-modal').classList.remove('active');
    },

    async saveCustomer(event) {
        event.preventDefault();

        const form = event.target;
        const customerId = form.dataset.customerId;

        const customerData = {
            name: document.getElementById('customer-name').value,
            customer_type: document.getElementById('customer-type').value,
            contact_person: document.getElementById('customer-contact-person').value,
            email: document.getElementById('customer-email').value,
            phone: document.getElementById('customer-phone').value,
            payment_terms_days: parseInt(document.getElementById('customer-payment-terms').value),
            address: document.getElementById('customer-address').value,
            postal_code: document.getElementById('customer-postal-code').value,
            city: document.getElementById('customer-city').value,
            country: document.getElementById('customer-country').value,
            tax_id: document.getElementById('customer-tax-id').value,
            credit_limit: parseFloat(document.getElementById('customer-credit-limit').value) || 10000,
            account_manager: document.getElementById('customer-account-manager').value,
            notes: document.getElementById('customer-notes').value
        };

        // For new customers, generate a customer_code
        if (!customerId) {
            customerData.customer_code = 'CUS' + Date.now();
        }

        try {
            let response;
            if (customerId) {
                // Update existing customer
                response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/${customerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData)
                });
            } else {
                // Create new customer
                response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData)
                });
            }

            if (response.ok) {
                await this.loadCustomers();
                this.closeModal();
                alert('Stranka uspešno shranjena!');
            } else {
                const errorData = await response.json();
                alert(`Napaka pri shranjevanju stranke: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            // For demo, just update local data
            if (customerId) {
                const customer = this.customers.find(c => c.id === parseInt(customerId));
                if (customer) {
                    Object.assign(customer, customerData);
                }
            } else {
                customerData.id = Math.max(...this.customers.map(c => c.id), 0) + 1;
                this.customers.push(customerData);
            }
            this.displayCustomers();
            this.closeModal();
            alert('Stranka uspešno shranjena (lokalno)!');
        }
    },

    async deleteCustomer(id) {
        if (!confirm('Ali ste prepričani, da želite izbrisati to stranko?')) {
            return;
        }

        try {
            const response = await fetch(`${CRM_API_BASE_URL}/api/v1/customers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadCustomers();
                alert('Stranka izbrisana!');
            } else {
                const errorData = await response.json();
                alert(`Napaka pri brisanju stranke: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            // For demo, just update local data
            this.customers = this.customers.filter(c => c.id !== id);
            this.displayCustomers();
            alert('Stranka izbrisana (lokalno)!');
        }
    },

    downloadTemplate() {
        // Create sample Excel file with headers and one example row
        const sampleData = [
            {
                'Naziv stranke': 'Primer d.o.o.',
                'Tip stranke': 'Retail',
                'Kontakt oseba': 'Janez Novak',
                'Email': 'janez@primer.si',
                'Telefon': '+386 1 234 5678',
                'Plačilni pogoji (dni)': 30,
                'Ulica in hišna številka': 'Slovenska cesta 123',
                'Poštna številka': '1000',
                'Mesto': 'Ljubljana',
                'Država': 'Slovenia',
                'Davčna številka': 'SI12345678',
                'Kreditni limit (€)': 10000,
                'Odgovorna oseba': 'Marko Horvat',
                'Opombe': 'To je vzorec - izbrišite to vrstico in dodajte svoje stranke'
            }
        ];

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(sampleData);

        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, // Naziv stranke
            { wch: 15 }, // Tip stranke
            { wch: 20 }, // Kontakt oseba
            { wch: 25 }, // Email
            { wch: 18 }, // Telefon
            { wch: 20 }, // Plačilni pogoji
            { wch: 30 }, // Ulica in hišna številka
            { wch: 15 }, // Poštna številka
            { wch: 20 }, // Mesto
            { wch: 15 }, // Država
            { wch: 18 }, // Davčna številka
            { wch: 15 }, // Kreditni limit
            { wch: 20 }, // Odgovorna oseba
            { wch: 40 }  // Opombe
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Stranke');

        // Generate and download
        XLSX.writeFile(wb, 'stranke_vzorec.xlsx');
    },

    openUploadModal() {
        document.getElementById('customer-upload-modal').classList.add('active');
        // Reset file input
        const fileInput = document.getElementById('customer-excel-file');
        if (fileInput) fileInput.value = '';
        document.getElementById('customer-upload-preview').style.display = 'none';
        document.getElementById('customer-upload-confirm-btn').disabled = true;
        this.uploadedData = null;
    },

    closeUploadModal() {
        document.getElementById('customer-upload-modal').classList.remove('active');
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
                        name: row['Naziv stranke'] || '',
                        customer_type: row['Tip stranke'] || 'Retail',
                        contact_person: row['Kontakt oseba'] || '',
                        email: row['Email'] || '',
                        phone: row['Telefon'] || '',
                        payment_terms_days: parseInt(row['Plačilni pogoji (dni)']) || 30,
                        address: row['Ulica in hišna številka'] || '',
                        postal_code: row['Poštna številka'] || '',
                        city: row['Mesto'] || '',
                        country: row['Država'] || 'Slovenia',
                        tax_id: row['Davčna številka'] || '',
                        credit_limit: parseFloat(row['Kreditni limit (€)']) || 10000,
                        account_manager: row['Odgovorna oseba'] || '',
                        notes: row['Opombe'] || '',
                        customer_code: 'CUS' + Date.now() + '_' + index
                    };

                    // Validate required fields
                    if (!customer.name) {
                        throw new Error(`Vrstica ${index + 2}: Manjka naziv stranke`);
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
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Naziv</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Tip</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Plačilni pogoji</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Mesto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.uploadedData.slice(0, 5).map(c => `
                                <tr>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.name}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.customer_type}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.payment_terms_days} dni</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${c.city}</td>
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
        this.closeUploadModal();

        // Show result
        alert(`Uvoz zaključen!\nUspešno: ${successCount}\nNapake: ${errorCount}`);
    }
};

// Export
window.CustomerCRM = CustomerCRM;

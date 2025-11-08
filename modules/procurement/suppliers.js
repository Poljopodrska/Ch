/**
 * Suppliers Module
 * Manages supplier information including payment terms
 */

const SuppliersModule = {
    suppliers: [],

    init() {
        console.log('Initializing Suppliers module...');
        this.render();
        this.loadSuppliers();
    },

    render() {
        const container = document.getElementById('suppliers-container');
        if (!container) {
            console.error('Suppliers container not found');
            return;
        }

        container.innerHTML = `
            <style>
                .suppliers-header {
                    background: var(--ch-primary);
                    color: white;
                    padding: 20px;
                    border-radius: var(--radius-md);
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .suppliers-content {
                    background: var(--ch-white);
                    border-radius: var(--radius-md);
                    padding: 20px;
                    box-shadow: var(--shadow-md);
                }

                .suppliers-controls {
                    margin-bottom: 20px;
                    display: flex;
                    gap: 10px;
                }

                .suppliers-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                .suppliers-table th {
                    background: var(--ch-primary);
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid var(--ch-border-medium);
                }

                .suppliers-table td {
                    padding: 12px;
                    border-bottom: 1px solid var(--ch-border-light);
                }

                .suppliers-table tr:hover {
                    background: var(--ch-gray-50);
                }

                .payment-delay {
                    font-weight: 600;
                    color: var(--ch-primary-dark);
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

            <div class="suppliers-header">
                <h2>Dobavitelji</h2>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="SuppliersModule.openAddModal()">
                        Dodaj dobavitelja
                    </button>
                    <button class="btn btn-outline" onclick="SuppliersModule.downloadTemplate()" style="background: white; color: var(--ch-primary);">
                        Prenesi vzorec Excel
                    </button>
                    <button class="btn btn-outline" onclick="SuppliersModule.openUploadModal()" style="background: white; color: var(--ch-primary);">
                        Uvozi iz Excel
                    </button>
                </div>
            </div>

            <div class="suppliers-content">
                <div class="suppliers-controls">
                    <input type="text" id="search-supplier" placeholder="Iskanje dobavitelja..."
                           style="flex: 1; padding: 10px; border: 1px solid var(--ch-border-medium); border-radius: var(--radius-sm);">
                </div>

                <table class="suppliers-table">
                    <thead>
                        <tr>
                            <th>Naziv dobavitelja</th>
                            <th>Kaj dobavlja</th>
                            <th>Kontakt oseba</th>
                            <th>Email</th>
                            <th>Telefon</th>
                            <th>Plačilni pogoji (dni)</th>
                            <th>Dopustna dodatna zamuda (dni)</th>
                            <th>Naslov</th>
                            <th>Dejanja</th>
                        </tr>
                    </thead>
                    <tbody id="suppliers-tbody">
                        <tr>
                            <td colspan="9" style="text-align: center; padding: 40px;">
                                Nalaganje dobaviteljev...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Add/Edit Modal -->
            <div id="supplier-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Dodaj dobavitelja</h3>
                        <button class="close-btn" onclick="SuppliersModule.closeModal()">&times;</button>
                    </div>

                    <form id="supplier-form" onsubmit="SuppliersModule.saveSupplier(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="supplier-name">Naziv dobavitelja *</label>
                                <input type="text" id="supplier-name" required>
                            </div>

                            <div class="form-group">
                                <label for="supplier-supplies">Kaj dobavlja *</label>
                                <input type="text" id="supplier-supplies" required
                                       placeholder="npr. Surovine, Embalaža, Komponente">
                                <small style="color: var(--ch-text-secondary); margin-top: 5px;">
                                    Kratki opis kaj dobavitelj dobavlja
                                </small>
                            </div>

                            <div class="form-group">
                                <label for="supplier-contact">Kontakt oseba</label>
                                <input type="text" id="supplier-contact">
                            </div>

                            <div class="form-group">
                                <label for="supplier-email">Email</label>
                                <input type="email" id="supplier-email">
                            </div>

                            <div class="form-group">
                                <label for="supplier-phone">Telefon</label>
                                <input type="tel" id="supplier-phone">
                            </div>

                            <div class="form-group">
                                <label for="supplier-payment-terms">Plačilni pogoji (dni) *</label>
                                <input type="number" id="supplier-payment-terms" min="0" required
                                       placeholder="npr. 30, 60, 90">
                                <small style="color: var(--ch-text-secondary); margin-top: 5px;">
                                    Kdaj mora biti plačilo opravljeno (npr. 30 dni po prejemu računa)
                                </small>
                            </div>

                            <div class="form-group">
                                <label for="supplier-additional-delay">Dopustna dodatna zamuda (dni) *</label>
                                <input type="number" id="supplier-additional-delay" min="0" required
                                       placeholder="npr. 10, 15, 30">
                                <small style="color: var(--ch-text-secondary); margin-top: 5px;">
                                    Koliko dni lahko dodatno zamudimo s plačilom brez posledic
                                </small>
                            </div>

                            <div class="form-group">
                                <label for="supplier-address">Naslov</label>
                                <textarea id="supplier-address" rows="3"></textarea>
                            </div>

                            <div class="form-group">
                                <label for="supplier-notes">Opombe</label>
                                <textarea id="supplier-notes" rows="3"></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="SuppliersModule.closeModal()">
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
            <div id="supplier-upload-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Uvoz dobaviteljev iz Excel</h3>
                        <button class="close-btn" onclick="SuppliersModule.closeUploadModal()">&times;</button>
                    </div>

                    <div style="margin-bottom: 20px; padding: 15px; background: var(--ch-gray-50); border-radius: var(--radius-sm);">
                        <h4 style="margin-bottom: 10px; color: var(--ch-text-primary);">Navodila:</h4>
                        <ol style="margin-left: 20px; color: var(--ch-text-secondary);">
                            <li>Prenesite vzorec Excel datoteke s klikom na "Prenesi vzorec Excel"</li>
                            <li>Izpolnite vrstice z vašimi dobavitelji (vrstica 2 je primer)</li>
                            <li>Naložite izpolnjeno datoteko spodaj</li>
                        </ol>
                    </div>

                    <div class="form-group">
                        <label for="supplier-excel-file">Izberi Excel datoteko (.xlsx)</label>
                        <input type="file" id="supplier-excel-file" accept=".xlsx,.xls"
                               style="padding: 10px; border: 2px dashed var(--ch-border-medium); border-radius: var(--radius-sm); width: 100%;">
                    </div>

                    <div id="upload-preview" style="margin-top: 20px; display: none;">
                        <h4 style="margin-bottom: 10px;">Predogled:</h4>
                        <div id="upload-preview-content" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--ch-border-medium); border-radius: var(--radius-sm); padding: 10px;">
                        </div>
                    </div>

                    <div class="form-actions" style="margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="SuppliersModule.closeUploadModal()">
                            Prekliči
                        </button>
                        <button type="button" class="btn btn-primary" onclick="SuppliersModule.processUpload()" id="upload-confirm-btn" disabled>
                            Uvozi dobavitelje
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Setup search
        document.getElementById('search-supplier').addEventListener('input', (e) => {
            this.filterSuppliers(e.target.value);
        });

        // Setup file upload preview
        document.getElementById('supplier-excel-file')?.addEventListener('change', (e) => {
            this.previewExcelFile(e.target.files[0]);
        });
    },

    async loadSuppliers() {
        try {
            const response = await fetch('/api/v1/suppliers/');
            if (response.ok) {
                this.suppliers = await response.json();
                console.log('Loaded suppliers from database:', this.suppliers);
            } else {
                console.warn('API not available, showing empty list');
                // If API not ready, show empty list
                this.suppliers = [];
            }
            this.displaySuppliers();
        } catch (error) {
            console.error('Error loading suppliers:', error);
            // Show empty list on error
            this.suppliers = [];
            this.displaySuppliers();
        }
    },


    displaySuppliers(suppliers = this.suppliers) {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;

        if (suppliers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--ch-text-secondary);">
                        Ni najdenih dobaviteljev
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = suppliers.map(supplier => `
            <tr>
                <td><strong>${supplier.name}</strong></td>
                <td>${supplier.supplies || '-'}</td>
                <td>${supplier.contact_person || '-'}</td>
                <td>${supplier.email || '-'}</td>
                <td>${supplier.phone || '-'}</td>
                <td class="payment-delay">${supplier.payment_terms_days} dni</td>
                <td class="payment-delay">${supplier.additional_delay_days || 0} dni</td>
                <td>${supplier.address || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="SuppliersModule.editSupplier(${supplier.id})">
                        Uredi
                    </button>
                    <button class="btn-delete" onclick="SuppliersModule.deleteSupplier(${supplier.id})">
                        Izbriši
                    </button>
                </td>
            </tr>
        `).join('');
    },

    filterSuppliers(searchTerm) {
        const filtered = this.suppliers.filter(supplier => {
            const term = searchTerm.toLowerCase();
            return supplier.name.toLowerCase().includes(term) ||
                   (supplier.contact_person && supplier.contact_person.toLowerCase().includes(term)) ||
                   (supplier.email && supplier.email.toLowerCase().includes(term));
        });
        this.displaySuppliers(filtered);
    },

    openAddModal() {
        document.getElementById('modal-title').textContent = 'Dodaj dobavitelja';
        document.getElementById('supplier-form').reset();
        document.getElementById('supplier-form').dataset.supplierId = '';
        document.getElementById('supplier-modal').classList.add('active');
    },

    editSupplier(id) {
        const supplier = this.suppliers.find(s => s.id === id);
        if (!supplier) return;

        document.getElementById('modal-title').textContent = 'Uredi dobavitelja';
        document.getElementById('supplier-name').value = supplier.name;
        document.getElementById('supplier-supplies').value = supplier.supplies || '';
        document.getElementById('supplier-contact').value = supplier.contact_person || '';
        document.getElementById('supplier-email').value = supplier.email || '';
        document.getElementById('supplier-phone').value = supplier.phone || '';
        document.getElementById('supplier-payment-terms').value = supplier.payment_terms_days;
        document.getElementById('supplier-additional-delay').value = supplier.additional_delay_days || 0;
        document.getElementById('supplier-address').value = supplier.address || '';
        document.getElementById('supplier-notes').value = supplier.notes || '';
        document.getElementById('supplier-form').dataset.supplierId = id;
        document.getElementById('supplier-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('supplier-modal').classList.remove('active');
    },

    async saveSupplier(event) {
        event.preventDefault();

        const form = event.target;
        const supplierId = form.dataset.supplierId;

        const supplierData = {
            name: document.getElementById('supplier-name').value,
            supplies: document.getElementById('supplier-supplies').value,
            contact_person: document.getElementById('supplier-contact').value,
            email: document.getElementById('supplier-email').value,
            phone: document.getElementById('supplier-phone').value,
            payment_terms_days: parseInt(document.getElementById('supplier-payment-terms').value),
            additional_delay_days: parseInt(document.getElementById('supplier-additional-delay').value),
            address: document.getElementById('supplier-address').value,
            notes: document.getElementById('supplier-notes').value
        };

        // For new suppliers, generate a supplier_code
        if (!supplierId) {
            supplierData.supplier_code = 'SUP' + Date.now();
        }

        try {
            let response;
            if (supplierId) {
                // Update existing supplier
                response = await fetch(`/api/v1/suppliers/${supplierId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplierData)
                });
            } else {
                // Create new supplier
                response = await fetch('/api/v1/suppliers/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplierData)
                });
            }

            if (response.ok) {
                await this.loadSuppliers();
                this.closeModal();
                alert('Dobavitelj uspešno shranjen!');
            } else {
                const errorData = await response.json();
                alert(`Napaka pri shranjevanju dobavitelja: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
            // For demo, just update local data
            if (supplierId) {
                const supplier = this.suppliers.find(s => s.id === parseInt(supplierId));
                if (supplier) {
                    Object.assign(supplier, supplierData);
                }
            } else {
                supplierData.id = Math.max(...this.suppliers.map(s => s.id), 0) + 1;
                this.suppliers.push(supplierData);
            }
            this.displaySuppliers();
            this.closeModal();
            alert('Dobavitelj uspešno shranjen (lokalno)!');
        }
    },

    async deleteSupplier(id) {
        if (!confirm('Ali ste prepričani, da želite izbrisati tega dobavitelja?')) {
            return;
        }

        try {
            const response = await fetch(`/api/v1/suppliers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadSuppliers();
                alert('Dobavitelj izbrisan!');
            } else {
                const errorData = await response.json();
                alert(`Napaka pri brisanju dobavitelja: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
            // For demo, just update local data
            this.suppliers = this.suppliers.filter(s => s.id !== id);
            this.displaySuppliers();
            alert('Dobavitelj izbrisan (lokalno)!');
        }
    },

    downloadTemplate() {
        // Create sample Excel file with headers and one example row
        const sampleData = [
            {
                'Naziv dobavitelja': 'Primer d.o.o.',
                'Kaj dobavlja': 'Surovine in embalaža',
                'Kontakt oseba': 'Janez Novak',
                'Email': 'janez@primer.si',
                'Telefon': '+386 1 234 5678',
                'Plačilni pogoji (dni)': 30,
                'Dopustna dodatna zamuda (dni)': 15,
                'Naslov': 'Primerjeva ulica 1, 1000 Ljubljana',
                'Opombe': 'To je vzorec - izbrišite to vrstico in dodajte svoje dobavitelje'
            }
        ];

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(sampleData);

        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, // Naziv dobavitelja
            { wch: 30 }, // Kaj dobavlja
            { wch: 20 }, // Kontakt oseba
            { wch: 25 }, // Email
            { wch: 18 }, // Telefon
            { wch: 20 }, // Plačilni pogoji
            { wch: 28 }, // Dopustna dodatna zamuda
            { wch: 35 }, // Naslov
            { wch: 40 }  // Opombe
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dobavitelji');

        // Generate and download
        XLSX.writeFile(wb, 'dobavitelji_vzorec.xlsx');
    },

    openUploadModal() {
        document.getElementById('supplier-upload-modal').classList.add('active');
        // Reset file input
        const fileInput = document.getElementById('supplier-excel-file');
        if (fileInput) fileInput.value = '';
        document.getElementById('upload-preview').style.display = 'none';
        document.getElementById('upload-confirm-btn').disabled = true;
        this.uploadedData = null;
    },

    closeUploadModal() {
        document.getElementById('supplier-upload-modal').classList.remove('active');
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
                    const supplier = {
                        name: row['Naziv dobavitelja'] || '',
                        supplies: row['Kaj dobavlja'] || '',
                        contact_person: row['Kontakt oseba'] || '',
                        email: row['Email'] || '',
                        phone: row['Telefon'] || '',
                        payment_terms_days: parseInt(row['Plačilni pogoji (dni)']) || 30,
                        additional_delay_days: parseInt(row['Dopustna dodatna zamuda (dni)']) || 0,
                        address: row['Naslov'] || '',
                        notes: row['Opombe'] || '',
                        supplier_code: 'SUP' + Date.now() + '_' + index
                    };

                    // Validate required fields
                    if (!supplier.name) {
                        throw new Error(`Vrstica ${index + 2}: Manjka naziv dobavitelja`);
                    }

                    return supplier;
                });

                // Show preview
                const previewHtml = `
                    <p style="margin-bottom: 10px; color: var(--ch-success);">
                        <strong>Najdenih ${this.uploadedData.length} dobaviteljev</strong>
                    </p>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--ch-gray-100);">
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Naziv</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Kaj dobavlja</th>
                                <th style="padding: 5px; text-align: left; border: 1px solid var(--ch-border-medium);">Plačilni pogoji</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.uploadedData.slice(0, 5).map(s => `
                                <tr>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${s.name}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${s.supplies}</td>
                                    <td style="padding: 5px; border: 1px solid var(--ch-border-medium);">${s.payment_terms_days} + ${s.additional_delay_days} dni</td>
                                </tr>
                            `).join('')}
                            ${this.uploadedData.length > 5 ? `
                                <tr>
                                    <td colspan="3" style="padding: 5px; text-align: center; font-style: italic;">
                                        ... in še ${this.uploadedData.length - 5} dobaviteljev
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                `;

                document.getElementById('upload-preview-content').innerHTML = previewHtml;
                document.getElementById('upload-preview').style.display = 'block';
                document.getElementById('upload-confirm-btn').disabled = false;

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

        const confirmMsg = `Ali ste prepričani, da želite uvoziti ${this.uploadedData.length} dobaviteljev?`;
        if (!confirm(confirmMsg)) {
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Upload each supplier
        for (const supplierData of this.uploadedData) {
            try {
                const response = await fetch('/api/v1/suppliers/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplierData)
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error('Failed to upload supplier:', supplierData.name);
                }
            } catch (error) {
                errorCount++;
                console.error('Error uploading supplier:', error);
            }
        }

        // Reload suppliers
        await this.loadSuppliers();
        this.closeUploadModal();

        // Show result
        alert(`Uvoz zaključen!\nUspešno: ${successCount}\nNapake: ${errorCount}`);
    }
};

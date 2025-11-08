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
                <button class="btn btn-primary" onclick="SuppliersModule.openAddModal()">
                    Dodaj dobavitelja
                </button>
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
        `;

        // Setup search
        document.getElementById('search-supplier').addEventListener('input', (e) => {
            this.filterSuppliers(e.target.value);
        });
    },

    async loadSuppliers() {
        try {
            const response = await fetch('/api/suppliers');
            if (response.ok) {
                this.suppliers = await response.json();
            } else {
                // If API not ready, use sample data
                this.suppliers = this.getSampleSuppliers();
            }
            this.displaySuppliers();
        } catch (error) {
            console.error('Error loading suppliers:', error);
            // Use sample data
            this.suppliers = this.getSampleSuppliers();
            this.displaySuppliers();
        }
    },

    getSampleSuppliers() {
        return [
            {
                id: 1,
                name: 'Dobavitelj A d.o.o.',
                supplies: 'Surovine za proizvodnjo',
                contact_person: 'Janez Novak',
                email: 'janez@dobavitelj-a.si',
                phone: '01 234 5678',
                payment_terms_days: 30,
                additional_delay_days: 15,
                address: 'Poslovna cesta 123, 1000 Ljubljana',
                notes: 'Glavni dobavitelj surovin'
            },
            {
                id: 2,
                name: 'Trgovina B s.p.',
                supplies: 'Embalaža in pakirni material',
                contact_person: 'Marija Horvat',
                email: 'marija@trgovina-b.si',
                phone: '02 345 6789',
                payment_terms_days: 60,
                additional_delay_days: 10,
                address: 'Industrijska 45, 2000 Maribor',
                notes: 'Dobavitelj embalaže'
            },
            {
                id: 3,
                name: 'Podjetje C d.d.',
                supplies: 'Komponente in polizdelki',
                contact_person: 'Peter Kovač',
                email: 'peter@podjetje-c.si',
                phone: '03 456 7890',
                payment_terms_days: 90,
                additional_delay_days: 30,
                address: 'Obrtniška 67, 3000 Celje',
                notes: 'Dobavitelj komponent'
            }
        ];
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

        try {
            let response;
            if (supplierId) {
                // Update existing supplier
                response = await fetch(`/api/suppliers/${supplierId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplierData)
                });
            } else {
                // Create new supplier
                response = await fetch('/api/suppliers', {
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
                alert('Napaka pri shranjevanju dobavitelja');
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
            const response = await fetch(`/api/suppliers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadSuppliers();
                alert('Dobavitelj izbrisan!');
            } else {
                alert('Napaka pri brisanju dobavitelja');
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
            // For demo, just update local data
            this.suppliers = this.suppliers.filter(s => s.id !== id);
            this.displaySuppliers();
            alert('Dobavitelj izbrisan (lokalno)!');
        }
    }
};

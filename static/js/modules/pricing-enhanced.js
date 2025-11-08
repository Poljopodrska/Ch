// Ch Project Enhanced Pricing Module with Dual Chart Visualization
const Pricing = {
    products: [],
    categories: [],
    currentFilter: 'all',
    
    // Initialize the pricing module
    async init() {
        console.log('Initializing Enhanced Pricing module...');
        await this.loadData();
        this.renderProducts();
        this.updateStats();
    },
    
    // Load data from JSON file
    async loadData() {
        try {
            // In development mode, load from mock data or localStorage
            if (ChConfig.mode === 'development') {
                // First try localStorage
                const savedData = localStorage.getItem('ch_products');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    this.products = data.products || [];
                    this.categories = data.categories || [];
                } else {
                    // Load from JSON file
                    try {
                        const response = await fetch('data/products.json');
                        if (response.ok) {
                            const data = await response.json();
                            this.products = data.products || [];
                            this.categories = data.categories || [];
                        } else {
                            this.createDefaultData();
                        }
                    } catch (error) {
                        this.createDefaultData();
                    }
                }
            } else {
                // In production, would load from API
                const response = await fetch('/api/v1/products');
                const data = await response.json();
                this.products = data.products;
                this.categories = data.categories;
            }
        } catch (error) {
            console.log('Loading default data...');
            this.createDefaultData();
        }
    },
    
    // Create default data for demo
    createDefaultData() {
        this.categories = [
            { id: 1, name: "Meat Products", code: "meat" },
            { id: 2, name: "Baked Meat", code: "baked" },
            { id: 3, name: "Dairy Products", code: "dairy" }
        ];
        
        this.products = [
            {
                id: 1,
                article_number: "001",
                article_name: "Premium Salami",
                category_id: 1,
                pack_size: "500g",
                unit_type: "pcs",
                group_1: "Meat Products",
                group_2: "Posebne",
                production_cost: 4.8523,
                production_overhead: 1.8234,
                logistics_overhead: 2.4156,
                marketing_overhead: 1.2078,
                general_overhead: 1.2078,
                profit_overhead: 0.6039,
                sales_price: 13.2000
            },
            {
                id: 2,
                article_number: "002",
                article_name: "Traditional Ham",
                category_id: 1,
                pack_size: "300g",
                unit_type: "pcs",
                group_1: "Meat Products",
                group_2: "Classic",
                production_cost: 3.5234,
                production_overhead: 1.2156,
                logistics_overhead: 1.8234,
                marketing_overhead: 0.9117,
                general_overhead: 0.9117,
                profit_overhead: 0.4559,
                sales_price: 8.5000
            },
            {
                id: 3,
                article_number: "003",
                article_name: "Baked Pork Roll",
                category_id: 2,
                pack_size: "1kg",
                unit_type: "pcs",
                group_1: "Baked Meat",
                group_2: "Premium",
                production_cost: 6.2345,
                production_overhead: 2.1234,
                logistics_overhead: 2.8345,
                marketing_overhead: 1.4173,
                general_overhead: 1.4173,
                profit_overhead: 0.7086,
                sales_price: 15.8000
            }
        ];
    },
    
    // Render products table
    renderProducts() {
        const tbody = document.getElementById('products-list');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const filteredProducts = this.currentFilter === 'all' 
            ? this.products 
            : this.products.filter(p => {
                const category = this.categories.find(c => c.id === p.category_id);
                return category && category.code === this.currentFilter;
            });
        
        filteredProducts.forEach(product => {
            const row = this.createProductRow(product);
            tbody.appendChild(row);
        });
    },
    
    // Create a product row with enhanced visualization
    createProductRow(product) {
        const row = document.createElement('tr');
        const totalCost = this.calculateTotalCost(product);
        const margin = product.sales_price - totalCost;
        const marginPercent = product.sales_price > 0 ? (margin / product.sales_price * 100) : 0;
        
        row.innerHTML = `
            <td class="col-article">${product.article_number}</td>
            <td class="col-name">${product.article_name}</td>
            <td class="col-pack">${product.pack_size || '-'}</td>
            <td class="col-group">${product.group_1 || '-'}</td>
            <td class="col-group">${product.group_2 || '-'}</td>
            <td class="col-dual-chart">${this.renderDualChart(product)}</td>
            <td class="col-cost">€${product.production_cost.toFixed(4)}</td>
            <td class="col-cost">€${product.production_overhead.toFixed(4)}</td>
            <td class="col-cost">€${product.logistics_overhead.toFixed(4)}</td>
            <td class="col-cost">€${product.marketing_overhead.toFixed(4)}</td>
            <td class="col-cost">€${product.general_overhead.toFixed(4)}</td>
            <td class="col-cost">€${product.profit_overhead.toFixed(4)}</td>
            <td class="col-total">€${totalCost.toFixed(4)}</td>
            <td class="col-price">€${product.sales_price.toFixed(4)}</td>
            <td class="col-margin">
                <div class="margin-info ${margin >= 0 ? 'positive' : 'negative'}">
                    <span class="margin-eur">€${margin.toFixed(4)}</span>
                    <span class="margin-percent">(${marginPercent.toFixed(2)}%)</span>
                </div>
            </td>
            <td class="col-actions">
                <button class="btn-icon" onclick="Pricing.editProduct(${product.id})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="Pricing.deleteProduct(${product.id})" title="Delete">🗑️</button>
            </td>
        `;
        
        return row;
    },
    
    // Render dual chart visualization
    renderDualChart(product) {
        const costs = [
            { name: 'Production', value: product.production_cost, color: '#e74c3c' },
            { name: 'Prod OH', value: product.production_overhead, color: '#f39c12' },
            { name: 'Logistics', value: product.logistics_overhead, color: '#f1c40f' },
            { name: 'Marketing', value: product.marketing_overhead, color: '#27ae60' },
            { name: 'General', value: product.general_overhead, color: 'var(--ch-primary)' },
            { name: 'Profit', value: product.profit_overhead, color: 'var(--ch-primary-dark)' }
        ];
        
        const totalCost = costs.reduce((sum, c) => sum + c.value, 0);
        const salesPrice = product.sales_price;
        const coverage = totalCost > 0 ? Math.min((salesPrice / totalCost) * 100, 100) : 0;
        
        let html = '<div class="dual-chart-container">';
        
        // Cost Breakdown Chart
        html += '<div class="chart-section cost-chart">';
        html += '<div class="chart-label">Cost Breakdown</div>';
        html += '<div class="cost-bar">';
        
        let accumulated = 0;
        costs.forEach((cost, index) => {
            const width = totalCost > 0 ? (cost.value / totalCost) * 100 : 0;
            const isCovered = accumulated + cost.value <= salesPrice;
            accumulated += cost.value;
            
            html += `
                <div class="cost-segment ${isCovered ? 'covered' : 'uncovered'}" 
                     style="width: ${width}%; background: ${cost.color};"
                     data-cost="${cost.value.toFixed(4)}"
                     data-name="${cost.name}">
                    <span class="segment-value">${cost.value.toFixed(2)}</span>
                </div>
            `;
        });
        
        html += '</div>';
        html += `<div class="chart-total">Total: €${totalCost.toFixed(4)}</div>`;
        html += '</div>';
        
        // Price Coverage Chart
        html += '<div class="chart-section coverage-chart">';
        html += '<div class="chart-label">Price Coverage</div>';
        html += '<div class="coverage-bar">';
        html += `<div class="coverage-fill" style="width: ${coverage}%;">`;
        
        // Show covered portions in the coverage bar
        accumulated = 0;
        costs.forEach((cost, index) => {
            const costWidth = totalCost > 0 ? (cost.value / totalCost) * 100 : 0;
            const remainingCoverage = Math.max(0, salesPrice - accumulated);
            const coveredAmount = Math.min(cost.value, remainingCoverage);
            const coveredWidth = cost.value > 0 ? (coveredAmount / cost.value) * costWidth : 0;
            
            if (coveredAmount > 0) {
                html += `<div class="coverage-segment" 
                             style="width: ${coveredWidth}%; background: ${cost.color};"
                             title="${cost.name}: €${coveredAmount.toFixed(4)} covered">
                        </div>`;
            }
            accumulated += cost.value;
        });
        
        html += '</div>';
        
        // Coverage indicator line
        if (coverage < 100) {
            html += `<div class="coverage-line" style="left: ${coverage}%;">
                        <span class="coverage-percent">${coverage.toFixed(1)}%</span>
                     </div>`;
        }
        
        html += '</div>';
        html += `<div class="chart-price">Price: €${salesPrice.toFixed(4)}</div>`;
        html += '</div>';
        
        html += '</div>';
        
        return html;
    },
    
    // Check if a cost is covered
    isCostCovered(cost, allCosts, salesPrice) {
        let accumulated = 0;
        for (let c of allCosts) {
            if (c === cost) {
                return accumulated + c.value <= salesPrice;
            }
            accumulated += c.value;
        }
        return false;
    },
    
    // Calculate total cost
    calculateTotalCost(product) {
        return product.production_cost + 
               product.production_overhead + 
               product.logistics_overhead + 
               product.marketing_overhead + 
               product.general_overhead + 
               product.profit_overhead;
    },
    
    // Update statistics
    updateStats() {
        const totalProducts = this.products.length;
        let profitable = 0;
        let lossMaking = 0;
        let totalMarginPercent = 0;
        
        this.products.forEach(product => {
            const totalCost = this.calculateTotalCost(product);
            const margin = product.sales_price - totalCost;
            const marginPercent = product.sales_price > 0 ? (margin / product.sales_price * 100) : 0;
            
            if (margin >= 0) {
                profitable++;
            } else {
                lossMaking++;
            }
            
            totalMarginPercent += marginPercent;
        });
        
        const avgMargin = totalProducts > 0 ? totalMarginPercent / totalProducts : 0;
        
        // Update UI
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('profitable-products').textContent = profitable;
        document.getElementById('loss-products').textContent = lossMaking;
        document.getElementById('avg-margin').textContent = avgMargin.toFixed(2) + '%';
    },
    
    // Filter by category
    filterByCategory(category) {
        this.currentFilter = category;
        
        // Update button states
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.renderProducts();
    },
    
    // Show add product modal
    showAddProduct() {
        document.getElementById('modal-title').textContent = 'Add Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        
        // Set default values with 4 decimal places
        const form = document.getElementById('product-form');
        ['production_cost', 'production_overhead', 'logistics_overhead', 
         'marketing_overhead', 'general_overhead', 'profit_overhead', 'sales_price'].forEach(field => {
            if (form.elements[field]) {
                form.elements[field].value = '0.0000';
            }
        });
        
        this.calculateTotal();
        this.renderPreview();
        document.getElementById('product-modal').style.display = 'block';
    },
    
    // Edit product
    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;
        
        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        
        // Fill form fields
        const form = document.getElementById('product-form');
        Object.keys(product).forEach(key => {
            const input = form.elements[key];
            if (input && key !== 'id') {
                if (typeof product[key] === 'number' && key !== 'category_id') {
                    input.value = product[key].toFixed(4);
                } else {
                    input.value = product[key] || '';
                }
            }
        });
        
        this.calculateTotal();
        this.renderPreview();
        document.getElementById('product-modal').style.display = 'block';
    },
    
    // Save product
    saveProduct(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const product = {
            id: formData.get('id') || Date.now(),
            article_number: formData.get('article_number'),
            article_name: formData.get('article_name'),
            category_id: parseInt(formData.get('category_id')),
            pack_size: formData.get('pack_size'),
            unit_type: formData.get('unit_type') || 'pcs',
            group_1: formData.get('group_1'),
            group_2: formData.get('group_2'),
            production_cost: parseFloat(formData.get('production_cost')) || 0,
            production_overhead: parseFloat(formData.get('production_overhead')) || 0,
            logistics_overhead: parseFloat(formData.get('logistics_overhead')) || 0,
            marketing_overhead: parseFloat(formData.get('marketing_overhead')) || 0,
            general_overhead: parseFloat(formData.get('general_overhead')) || 0,
            profit_overhead: parseFloat(formData.get('profit_overhead')) || 0,
            sales_price: parseFloat(formData.get('sales_price')) || 0
        };
        
        const existingIndex = this.products.findIndex(p => p.id == product.id);
        if (existingIndex >= 0) {
            this.products[existingIndex] = product;
        } else {
            product.id = Date.now();
            this.products.push(product);
        }
        
        this.saveData();
        this.closeModal();
        this.renderProducts();
        this.updateStats();
        
        return false;
    },
    
    // Delete product
    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveData();
            this.renderProducts();
            this.updateStats();
        }
    },
    
    // Calculate total in form
    calculateTotal() {
        const form = document.getElementById('product-form');
        const costs = [
            'production_cost',
            'production_overhead',
            'logistics_overhead',
            'marketing_overhead',
            'general_overhead',
            'profit_overhead'
        ];
        
        let total = 0;
        costs.forEach(cost => {
            total += parseFloat(form.elements[cost].value) || 0;
        });
        
        const salesPrice = parseFloat(form.elements['sales_price'].value) || 0;
        const margin = salesPrice - total;
        const marginPercent = salesPrice > 0 ? (margin / salesPrice * 100) : 0;
        
        document.getElementById('total-cost-display').value = '€' + total.toFixed(4);
        document.getElementById('margin-eur-display').value = '€' + margin.toFixed(4);
        document.getElementById('margin-percent-display').value = marginPercent.toFixed(2) + '%';
        
        // Color code margin fields
        const marginClass = margin >= 0 ? 'positive' : 'negative';
        document.getElementById('margin-eur-display').className = 'readonly-field ' + marginClass;
        document.getElementById('margin-percent-display').className = 'readonly-field ' + marginClass;
        
        // Update preview
        this.renderPreview();
    },
    
    // Render preview in modal
    renderPreview() {
        const form = document.getElementById('product-form');
        const previewContainer = document.getElementById('preview-chart');
        
        if (!previewContainer) return;
        
        // Create temporary product object
        const product = {
            production_cost: parseFloat(form.elements['production_cost'].value) || 0,
            production_overhead: parseFloat(form.elements['production_overhead'].value) || 0,
            logistics_overhead: parseFloat(form.elements['logistics_overhead'].value) || 0,
            marketing_overhead: parseFloat(form.elements['marketing_overhead'].value) || 0,
            general_overhead: parseFloat(form.elements['general_overhead'].value) || 0,
            profit_overhead: parseFloat(form.elements['profit_overhead'].value) || 0,
            sales_price: parseFloat(form.elements['sales_price'].value) || 0
        };
        
        previewContainer.innerHTML = this.renderDualChart(product);
    },
    
    // Close modal
    closeModal() {
        document.getElementById('product-modal').style.display = 'none';
    },
    
    // Save data to localStorage (for development)
    saveData() {
        if (ChConfig.mode === 'development') {
            localStorage.setItem('ch_products', JSON.stringify({
                categories: this.categories,
                products: this.products
            }));
        }
    },
    
    // Export to Excel
    exportToExcel() {
        // Create CSV content with 4 decimal places
        const headers = [
            'Article Number', 'Article Name', 'Category', 'Pack Size', 'Unit Type', 'Group 1', 'Group 2',
            'Production Cost', 'Production OH', 'Logistics OH', 'Marketing OH', 'General OH', 'Profit OH',
            'Total Cost', 'Sales Price', 'Margin EUR', 'Margin %'
        ];
        
        let csv = headers.join(',') + '\n';
        
        this.products.forEach(product => {
            const category = this.categories.find(c => c.id === product.category_id);
            const totalCost = this.calculateTotalCost(product);
            const margin = product.sales_price - totalCost;
            const marginPercent = product.sales_price > 0 ? (margin / product.sales_price * 100) : 0;
            
            const row = [
                product.article_number,
                `"${product.article_name}"`,
                category ? category.name : '',
                product.pack_size || '',
                product.unit_type || 'pcs',
                product.group_1 || '',
                product.group_2 || '',
                product.production_cost.toFixed(4),
                product.production_overhead.toFixed(4),
                product.logistics_overhead.toFixed(4),
                product.marketing_overhead.toFixed(4),
                product.general_overhead.toFixed(4),
                product.profit_overhead.toFixed(4),
                totalCost.toFixed(4),
                product.sales_price.toFixed(4),
                margin.toFixed(4),
                marginPercent.toFixed(2)
            ];
            
            csv += row.join(',') + '\n';
        });
        
        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ch_products_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    // Show import dialog
    showImportDialog() {
        document.getElementById('import-modal').style.display = 'block';
    },
    
    // Close import modal
    closeImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        document.getElementById('excel-file').value = '';
        document.getElementById('file-info').style.display = 'none';
        document.getElementById('import-btn').disabled = true;
    },
    
    // Handle file selection
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('file-info').textContent = `Selected: ${file.name}`;
            document.getElementById('file-info').style.display = 'block';
            document.getElementById('import-btn').disabled = false;
        }
    },
    
    // Import Excel (mock implementation)
    importExcel() {
        alert('Excel import functionality would parse the file and import products with 4 decimal place precision.\n\nIn a real implementation, this would use a library like SheetJS.');
        this.closeImportModal();
    },
    
    // Download template
    downloadTemplate() {
        const template = `Article Number,Article Name,Category,Pack Size,Unit Type,Group 1,Group 2,Production Cost,Production OH,Logistics OH,Marketing OH,General OH,Profit OH,Sales Price
001,Sample Product,Meat Products,500g,pcs,Group A,Subgroup 1,4.5234,1.5678,2.0123,1.0456,1.0456,0.5228,12.0000`;
        
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ch_products_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    // Refresh data
    refreshData() {
        this.loadData().then(() => {
            this.renderProducts();
            this.updateStats();
        });
    }
};

// Make Pricing available globally
window.Pricing = Pricing;
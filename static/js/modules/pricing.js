// Ch Project Pricing Module
const Pricing = {
    products: [],
    categories: [],
    currentFilter: 'all',
    
    // Initialize the pricing module
    async init() {
        console.log('Initializing Pricing module...');
        await this.loadData();
        this.renderProducts();
        this.updateStats();
    },
    
    // Load data from JSON file
    async loadData() {
        try {
            // In development mode, load from mock data
            if (ChConfig.mode === 'development') {
                const response = await fetch('data/products.json');
                if (!response.ok) {
                    // Create default data if file doesn't exist
                    this.createDefaultData();
                    return;
                }
                const data = await response.json();
                this.products = data.products || [];
                this.categories = data.categories || [];
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
                group_1: "Meat Products",
                group_2: "Posebne",
                production_cost: 4.80,
                production_overhead: 1.80,
                logistics_overhead: 2.40,
                marketing_overhead: 1.20,
                general_overhead: 1.20,
                profit_overhead: 0.60,
                sales_price: 13.20
            },
            {
                id: 2,
                article_number: "002",
                article_name: "Traditional Ham",
                category_id: 1,
                pack_size: "300g",
                group_1: "Meat Products",
                group_2: "Classic",
                production_cost: 3.50,
                production_overhead: 1.20,
                logistics_overhead: 1.80,
                marketing_overhead: 0.90,
                general_overhead: 0.90,
                profit_overhead: 0.45,
                sales_price: 8.50
            },
            {
                id: 3,
                article_number: "003",
                article_name: "Baked Pork Roll",
                category_id: 2,
                pack_size: "1kg",
                group_1: "Baked Meat",
                group_2: "Premium",
                production_cost: 6.20,
                production_overhead: 2.10,
                logistics_overhead: 2.80,
                marketing_overhead: 1.40,
                general_overhead: 1.40,
                profit_overhead: 0.70,
                sales_price: 15.80
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
    
    // Create a product row
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
            <td class="col-cost-bar">${this.renderCostBar(product)}</td>
            <td class="col-cost">€${product.production_cost.toFixed(2)}</td>
            <td class="col-cost">€${product.production_overhead.toFixed(2)}</td>
            <td class="col-cost">€${product.logistics_overhead.toFixed(2)}</td>
            <td class="col-cost">€${product.marketing_overhead.toFixed(2)}</td>
            <td class="col-cost">€${product.general_overhead.toFixed(2)}</td>
            <td class="col-cost">€${product.profit_overhead.toFixed(2)}</td>
            <td class="col-total">€${totalCost.toFixed(2)}</td>
            <td class="col-price">€${product.sales_price.toFixed(2)}</td>
            <td class="col-margin">
                <div class="margin-info ${margin >= 0 ? 'positive' : 'negative'}">
                    <span class="margin-eur">€${margin.toFixed(2)}</span>
                    <span class="margin-percent">(${marginPercent.toFixed(1)}%)</span>
                </div>
            </td>
            <td class="col-actions">
                <button class="btn-icon" onclick="Pricing.editProduct(${product.id})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="Pricing.deleteProduct(${product.id})" title="Delete">🗑️</button>
            </td>
        `;
        
        return row;
    },
    
    // Render cost breakdown bar with coverage indicator
    renderCostBar(product) {
        const costs = [
            { name: 'Production', value: product.production_cost, color: '#e74c3c' },
            { name: 'Prod OH', value: product.production_overhead, color: '#f39c12' },
            { name: 'Logistics', value: product.logistics_overhead, color: '#f1c40f' },
            { name: 'Marketing', value: product.marketing_overhead, color: '#27ae60' },
            { name: 'General', value: product.general_overhead, color: '#3498db' },
            { name: 'Profit', value: product.profit_overhead, color: '#9b59b6' }
        ];
        
        const totalCost = costs.reduce((sum, c) => sum + c.value, 0);
        const salesPrice = product.sales_price;
        const maxWidth = 200; // pixels
        
        let html = '<div class="cost-bar-wrapper">';
        html += '<div class="cost-bar-container">';
        
        let accumulated = 0;
        let coverageMarked = false;
        
        // Render stacked bars
        costs.forEach((cost, index) => {
            const startPoint = accumulated;
            accumulated += cost.value;
            const width = totalCost > 0 ? (cost.value / totalCost) * maxWidth : 0;
            const isCovered = startPoint < salesPrice;
            
            // Check if coverage line should be within this segment
            if (!coverageMarked && accumulated > salesPrice && salesPrice > startPoint) {
                const segmentCoverage = salesPrice - startPoint;
                const coverageWidth = (segmentCoverage / cost.value) * width;
                
                html += `<div class="cost-segment ${isCovered ? 'covered' : 'uncovered'}" 
                             style="width: ${coverageWidth}px; background: ${cost.color};"
                             title="${cost.name}: €${cost.value.toFixed(2)} (partially covered)">
                        </div>`;
                
                html += '<div class="coverage-indicator" title="Sales price coverage limit"></div>';
                
                html += `<div class="cost-segment uncovered" 
                             style="width: ${width - coverageWidth}px; background: ${cost.color};"
                             title="${cost.name}: €${cost.value.toFixed(2)} (uncovered)">
                        </div>`;
                
                coverageMarked = true;
            } else {
                html += `<div class="cost-segment ${isCovered ? 'covered' : 'uncovered'}" 
                             style="width: ${width}px; background: ${cost.color};"
                             title="${cost.name}: €${cost.value.toFixed(2)}">
                        </div>`;
            }
        });
        
        // If sales price covers all costs, add indicator at the end
        if (!coverageMarked && salesPrice >= totalCost) {
            html += '<div class="coverage-indicator full-coverage" title="All costs covered"></div>';
        }
        
        html += '</div>';
        
        // Add cost labels below the bar
        html += '<div class="cost-bar-labels">';
        html += `<span class="label-total">Total: €${totalCost.toFixed(2)}</span>`;
        html += `<span class="label-price">Price: €${salesPrice.toFixed(2)}</span>`;
        html += '</div>';
        
        html += '</div>';
        
        return html;
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
        document.getElementById('avg-margin').textContent = avgMargin.toFixed(1) + '%';
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
        this.calculateTotal();
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
                input.value = product[key];
            }
        });
        
        this.calculateTotal();
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
        
        document.getElementById('total-cost-display').value = '€' + total.toFixed(2);
        document.getElementById('margin-eur-display').value = '€' + margin.toFixed(2);
        document.getElementById('margin-percent-display').value = marginPercent.toFixed(1) + '%';
        
        // Color code margin fields
        const marginClass = margin >= 0 ? 'positive' : 'negative';
        document.getElementById('margin-eur-display').className = 'readonly-field ' + marginClass;
        document.getElementById('margin-percent-display').className = 'readonly-field ' + marginClass;
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
        // Create CSV content
        const headers = [
            'Article Number', 'Article Name', 'Category', 'Pack Size', 'Group 1', 'Group 2',
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
                product.group_1 || '',
                product.group_2 || '',
                product.production_cost.toFixed(2),
                product.production_overhead.toFixed(2),
                product.logistics_overhead.toFixed(2),
                product.marketing_overhead.toFixed(2),
                product.general_overhead.toFixed(2),
                product.profit_overhead.toFixed(2),
                totalCost.toFixed(2),
                product.sales_price.toFixed(2),
                margin.toFixed(2),
                marginPercent.toFixed(1)
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
        alert('Excel import functionality would be implemented here.\n\nIn a real implementation, this would parse the Excel file and import the products.');
        this.closeImportModal();
    },
    
    // Download template
    downloadTemplate() {
        const template = `Article Number,Article Name,Category,Pack Size,Group 1,Group 2,Production Cost,Production OH,Logistics OH,Marketing OH,General OH,Profit OH,Sales Price
001,Sample Product,Meat Products,500g,Group A,Subgroup 1,4.50,1.50,2.00,1.00,1.00,0.50,12.00`;
        
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
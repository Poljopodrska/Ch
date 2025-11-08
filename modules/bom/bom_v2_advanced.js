// Ch BOM (Bill of Materials) Module V2 - Advanced Database-Ready Structure
// Complete BOM with ingredients, energy, water, packaging, and workforce
// Fully editable with form-based interface

const BOMV2Advanced = {
    VERSION: '2.0.0',
    
    state: {
        products: [],
        selectedProduct: null,
        editMode: false,
        unsavedChanges: false,
        
        // Database-ready structure
        bomDatabase: {
            products: {},
            ingredients: {},
            energy: {},
            water: {},
            packaging: {},
            workforce: {}
        },
        
        // Energy types available
        energyTypes: [
            { id: 'electricity', name: 'Electricity', unit: 'kWh' },
            { id: 'natural_gas', name: 'Natural Gas', unit: 'm³' },
            { id: 'steam', name: 'Steam', unit: 'kg' },
            { id: 'compressed_air', name: 'Compressed Air', unit: 'm³' },
            { id: 'diesel', name: 'Diesel', unit: 'L' },
            { id: 'propane', name: 'Propane', unit: 'kg' }
        ],
        
        // Packaging types
        packagingTypes: [
            { id: 'primary', name: 'Primary Packaging' },
            { id: 'secondary', name: 'Secondary Packaging' },
            { id: 'tertiary', name: 'Tertiary Packaging' },
            { id: 'labels', name: 'Labels & Stickers' }
        ],
        
        // Workforce categories
        workforceCategories: [
            { id: 'production', name: 'Production Workers' },
            { id: 'quality', name: 'Quality Control' },
            { id: 'packaging_workers', name: 'Packaging Workers' },
            { id: 'supervision', name: 'Supervision' }
        ]
    },
    
    // Initialize the module
    init() {
        console.log(`BOM Module V${this.VERSION} - Advanced initializing...`);
        
        const container = document.getElementById('bom-container');
        if (!container) {
            console.error('ERROR: bom-container not found!');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const newContainer = document.createElement('div');
                newContainer.id = 'bom-container';
                mainContent.appendChild(newContainer);
                console.log('Created bom-container');
            } else {
                console.error('ERROR: Could not find main-content element!');
                return;
            }
        }
        
        // Clear any existing content
        const bomContainer = document.getElementById('bom-container');
        if (bomContainer) {
            bomContainer.innerHTML = '';
        }
        
        this.loadExampleData();
        this.renderBOM();
        this.setupProductionListener();
        
        this.initialized = true;
        console.log('BOM V2 Advanced initialized');
    },
    
    // Setup listener for production events
    setupProductionListener() {
        if (typeof ChEvents !== 'undefined') {
            ChEvents.on(EVENTS.PRODUCTION_COMPLETED, (data) => {
                this.calculateAndEmitConsumption(data);
            });
            console.log('BOM listening for production events');
        }
    },
    
    // Calculate material consumption based on BOM
    calculateAndEmitConsumption(productionData) {
        const { articleNumber, quantity } = productionData;
        
        // Get BOM for this product
        const bom = this.getBOMForProduct(articleNumber);
        if (!bom) return;
        
        // Calculate consumption for each material
        const consumption = {
            ingredients: {},
            energy: {},
            water: {},
            packaging: {}
        };
        
        // Main ingredients
        if (bom.ingredients && bom.ingredients.main) {
            bom.ingredients.main.forEach(item => {
                consumption.ingredients[item.code] = item.quantity * quantity;
            });
        }
        
        // Supporting ingredients
        if (bom.ingredients && bom.ingredients.supporting) {
            bom.ingredients.supporting.forEach(item => {
                consumption.ingredients[item.code] = item.quantity * quantity;
            });
        }
        
        // Energy consumption (if defined)
        if (bom.energy) {
            bom.energy.forEach(item => {
                const energyType = item.type || item.id;
                consumption.energy[energyType] = (item.consumption || item.quantity) * quantity;
            });
        }
        
        // Water consumption (if defined)
        if (bom.water) {
            if (bom.water.total) {
                consumption.water['total'] = bom.water.total * quantity;
            } else if (Array.isArray(bom.water)) {
                bom.water.forEach(item => {
                    consumption.water[item.type] = item.quantity * quantity;
                });
            }
        }
        
        // Packaging materials
        if (bom.packaging) {
            bom.packaging.forEach(item => {
                consumption.packaging[item.code] = item.quantity * quantity;
            });
        }
        
        // Emit consumption event for raw materials to handle
        if (typeof ChEvents !== 'undefined') {
            ChEvents.emit(EVENTS.BOM_CONSUMED, {
                articleNumber: articleNumber,
                quantity: quantity,
                consumption: consumption,
                reference: productionData.reference
            });
        }
    },
    
    // Get BOM for a specific product
    getBOMForProduct(articleNumber) {
        // Map article numbers to product IDs
        const productMap = {
            '001': 'p001',
            '002': 'p002',
            '003': 'p003',
            '004': 'p004',
            '005': 'p005'
        };
        
        const productId = productMap[articleNumber];
        if (!productId) return null;
        
        return this.state.bomDatabase.products[productId];
    },
    
    initialized: false,
    
    // Load example data
    loadExampleData() {
        // Sample products matching article numbers 001-005
        this.state.products = [
            {
                id: 'p001',
                code: '001',
                name: 'Premium Salami',
                nameEn: 'Premium Salami',
                unit: 'pcs',
                category: 'Meat Products'
            },
            {
                id: 'p002',
                code: '002',
                name: 'Classic Mortadella',
                nameEn: 'Classic Mortadella',
                unit: 'pcs',
                category: 'Meat Products'
            },
            {
                id: 'p003',
                code: '003',
                name: 'Smoked Ham',
                nameEn: 'Smoked Ham',
                unit: 'pcs',
                category: 'Poultry'
            },
            {
                id: 'p004',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                category: 'Processed Meat'
            }
        ];
        
        // Load saved BOM data from localStorage if available
        const savedBOM = localStorage.getItem('bomDatabase');
        if (savedBOM) {
            this.state.bomDatabase = JSON.parse(savedBOM);
        } else {
            // Generate default BOM data for each product
            this.generateDefaultBOMData();
        }
    },
    
    // Generate default BOM data with actual material codes
    generateDefaultBOMData() {
        // Define specific BOMs for each product
        const productBOMs = {
            'p001': { // Premium Salami
                ingredients: {
                    main: [
                        { 
                            code: 'MEAT-BEEF-001',
                            name: 'Premium Beef',
                            quantity: 0.6,
                            unit: 'kg'
                        },
                        {
                            code: 'MEAT-PORK-001',
                            name: 'Pork Shoulder',
                            quantity: 0.3,
                            unit: 'kg'
                        }
                    ],
                    supporting: [
                        {
                            code: 'SPICE-SALT-001',
                            name: 'Sea Salt',
                            quantity: 0.02,
                            unit: 'kg'
                        },
                        {
                            code: 'SPICE-PEPR-001',
                            name: 'Black Pepper',
                            quantity: 0.005,
                            unit: 'kg'
                        },
                        {
                            code: 'SPICE-PAPR-001',
                            name: 'Paprika',
                            quantity: 0.008,
                            unit: 'kg'
                        },
                        {
                            code: 'ADDTV-NITR-001',
                            name: 'Sodium Nitrite',
                            quantity: 0.001,
                            unit: 'kg'
                        }
                    ]
                },
                packaging: [
                    {
                        code: 'PACK-FILM-001',
                        name: 'Vacuum Film',
                        quantity: 0.02,
                        unit: 'rolls'
                    },
                    {
                        code: 'PACK-LABL-001',
                        name: 'Product Labels',
                        quantity: 2,
                        unit: 'pcs'
                    }
                ]
            },
            'p002': { // Classic Mortadella
                ingredients: {
                    main: [
                        {
                            code: 'MEAT-PORK-001',
                            name: 'Pork Shoulder',
                            quantity: 0.8,
                            unit: 'kg'
                        }
                    ],
                    supporting: [
                        {
                            code: 'SPICE-SALT-001',
                            name: 'Sea Salt',
                            quantity: 0.025,
                            unit: 'kg'
                        },
                        {
                            code: 'SPICE-PEPR-001',
                            name: 'Black Pepper',
                            quantity: 0.003,
                            unit: 'kg'
                        },
                        {
                            code: 'ADDTV-NITR-001',
                            name: 'Sodium Nitrite',
                            quantity: 0.001,
                            unit: 'kg'
                        }
                    ]
                },
                packaging: [
                    {
                        code: 'PACK-TRAY-001',
                        name: 'Plastic Trays',
                        quantity: 1,
                        unit: 'pcs'
                    },
                    {
                        code: 'PACK-FILM-001',
                        name: 'Vacuum Film',
                        quantity: 0.01,
                        unit: 'rolls'
                    },
                    {
                        code: 'PACK-LABL-001',
                        name: 'Product Labels',
                        quantity: 1,
                        unit: 'pcs'
                    }
                ]
            },
            'p003': { // Smoked Ham
                ingredients: {
                    main: [
                        {
                            code: 'MEAT-PORK-001',
                            name: 'Pork Shoulder',
                            quantity: 1.0,
                            unit: 'kg'
                        }
                    ],
                    supporting: [
                        {
                            code: 'SPICE-SALT-001',
                            name: 'Sea Salt',
                            quantity: 0.03,
                            unit: 'kg'
                        },
                        {
                            code: 'SPICE-PAPR-001',
                            name: 'Paprika',
                            quantity: 0.01,
                            unit: 'kg'
                        }
                    ]
                },
                packaging: [
                    {
                        code: 'PACK-BOX-001',
                        name: 'Shipping Boxes',
                        quantity: 0.5,
                        unit: 'pcs'
                    },
                    {
                        code: 'PACK-FILM-001',
                        name: 'Vacuum Film',
                        quantity: 0.02,
                        unit: 'rolls'
                    }
                ]
            }
        };
        
        // Apply BOMs to products
        this.state.products.forEach(product => {
            const productId = product.id;
            const bom = productBOMs[productId] || productBOMs['p001']; // Default to p001 if not defined
            
            // Store complete BOM
            this.state.bomDatabase.products[productId] = bom;
            
            // Also store in separate sections for compatibility
            this.state.bomDatabase.ingredients[productId] = bom.ingredients;
            
            // Energy consumption
            this.state.bomDatabase.energy[productId] = [
                {
                    id: `${productId}_energy_1`,
                    type: 'electricity',
                    consumption: 0.5,
                    unit: 'kWh',
                    costPerUnit: 0.12,
                    process: 'Processing & Cooling'
                },
                {
                    id: `${productId}_energy_2`,
                    type: 'natural_gas',
                    consumption: 0.1,
                    unit: 'm³',
                    costPerUnit: 0.65,
                    process: 'Heating'
                }
            ];
            
            // Water consumption
            this.state.bomDatabase.water[productId] = {
                process: 2.5,        // Liters for processing
                cleaning: 1.5,       // Liters for cleaning
                cooling: 0.5,        // Liters for cooling
                total: 4.5,          // Total liters
                costPerLiter: 0.002,
                recycled: 30         // Percentage recycled
            };
            
            // Packaging materials
            this.state.bomDatabase.packaging[productId] = [
                {
                    id: `${productId}_pack_1`,
                    type: 'primary',
                    material: 'Vacuum Bag',
                    quantity: 1,
                    unit: 'piece',
                    costPerUnit: 0.15,
                    weight: 0.005,      // kg
                    recyclable: true
                },
                {
                    id: `${productId}_pack_2`,
                    type: 'secondary',
                    material: 'Cardboard Box',
                    quantity: 0.1,
                    unit: 'piece',
                    costPerUnit: 0.50,
                    weight: 0.15,
                    recyclable: true
                },
                {
                    id: `${productId}_pack_3`,
                    type: 'labels',
                    material: 'Product Label',
                    quantity: 1,
                    unit: 'piece',
                    costPerUnit: 0.02,
                    weight: 0.001,
                    recyclable: false
                }
            ];
            
            // Workforce consumption
            this.state.bomDatabase.workforce[productId] = [
                {
                    id: `${productId}_work_1`,
                    category: 'production',
                    timePerUnit: 0.05,  // hours
                    workers: 2,
                    costPerHour: 15,
                    skill: 'Medium'
                },
                {
                    id: `${productId}_work_2`,
                    category: 'quality',
                    timePerUnit: 0.01,
                    workers: 1,
                    costPerHour: 18,
                    skill: 'High'
                },
                {
                    id: `${productId}_work_3`,
                    category: 'packaging_workers',
                    timePerUnit: 0.02,
                    workers: 1,
                    costPerHour: 12,
                    skill: 'Low'
                }
            ];
        });
    },
    
    // Render the BOM interface
    renderBOM() {
        const container = document.getElementById('bom-container');
        if (!container) return;
        
        const html = `
            <style>
                .bom-container {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .bom-header {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%);
                    color: white;
                    border-radius: 8px;
                }
                
                .bom-layout {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 20px;
                    min-height: 600px;
                }
                
                .product-list {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 15px;
                }
                
                .product-list h3 {
                    margin-bottom: 15px;
                    color: #4a148c;
                    font-size: 16px;
                }
                
                .product-item {
                    padding: 10px;
                    margin-bottom: 5px;
                    background: #f5f5f5;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .product-item:hover {
                    background: #e1bee7;
                    transform: translateX(5px);
                }
                
                .product-item.active {
                    background: #7b1fa2;
                    color: white;
                    font-weight: bold;
                }
                
                .bom-form {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                }
                
                .form-tabs {
                    display: flex;
                    gap: 5px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #e0e0e0;
                }
                
                .tab-button {
                    padding: 10px 20px;
                    background: #f5f5f5;
                    border: none;
                    border-radius: 5px 5px 0 0;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                }
                
                .tab-button:hover {
                    background: #e0e0e0;
                }
                
                .tab-button.active {
                    background: #7b1fa2;
                    color: white;
                }
                
                .tab-content {
                    display: none;
                    animation: fadeIn 0.3s;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .form-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f9f9f9;
                    border-radius: 5px;
                }
                
                .form-section h4 {
                    margin-bottom: 15px;
                    color: #4a148c;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                
                .ingredient-group {
                    margin-bottom: 15px;
                }
                
                .ingredient-group h5 {
                    margin-bottom: 10px;
                    color: #666;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .ingredient-item,
                .energy-item,
                .packaging-item,
                .workforce-item {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
                    gap: 10px;
                    margin-bottom: 10px;
                    align-items: center;
                }
                
                .water-section {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .editable-input {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 13px;
                    transition: all 0.3s;
                }
                
                .editable-input:focus {
                    outline: none;
                    border-color: #7b1fa2;
                    box-shadow: 0 0 0 2px rgba(123, 31, 162, 0.1);
                }
                
                .editable-input:hover {
                    background: #f5f5f5;
                }
                
                .add-button {
                    padding: 8px 16px;
                    background: #4caf50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.3s;
                }
                
                .add-button:hover {
                    background: #45a049;
                }
                
                .remove-button {
                    padding: 5px 10px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }
                
                .remove-button:hover {
                    background: #d32f2f;
                }
                
                .save-section {
                    margin-top: 20px;
                    padding: 15px;
                    background: #f0f0f0;
                    border-radius: 5px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .save-button {
                    padding: 10px 25px;
                    background: #7b1fa2;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                }
                
                .save-button:hover {
                    background: #4a148c;
                }
                
                .save-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .export-button {
                    padding: 10px 25px;
                    background: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .export-button:hover {
                    background: #1976d2;
                }
                
                .unsaved-indicator {
                    padding: 5px 10px;
                    background: #ff9800;
                    color: white;
                    border-radius: 3px;
                    font-size: 12px;
                    display: none;
                }
                
                .unsaved-indicator.show {
                    display: inline-block;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 50px;
                    color: #999;
                }
                
                .cost-summary {
                    margin-top: 20px;
                    padding: 15px;
                    background: #fff3e0;
                    border-radius: 5px;
                    border-left: 4px solid #ff9800;
                }
                
                .cost-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                
                .cost-total {
                    font-weight: bold;
                    font-size: 16px;
                    color: #e65100;
                    border-top: 2px solid #ffcc80;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                
                select.editable-input {
                    cursor: pointer;
                }
            </style>
            
            <div class="bom-container">
                <div class="bom-header">
                    <h2>[Clipboard] Bill of Materials (BOM) - Advanced Management</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        V2.0.0 - Database-Ready Structure with Complete Resource Tracking
                    </div>
                </div>
                
                <div class="bom-layout">
                    <!-- Product List -->
                    <div class="product-list">
                        <h3>[Box] Products</h3>
                        <div id="product-list-items">
                            ${this.renderProductList()}
                        </div>
                    </div>
                    
                    <!-- BOM Form -->
                    <div class="bom-form">
                        <div id="bom-form-content">
                            ${this.renderBOMForm()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Set up event handlers
        setTimeout(() => {
            this.setupEventHandlers();
        }, 100);
    },
    
    // Render product list
    renderProductList() {
        let html = '';
        
        this.state.products.forEach(product => {
            const isActive = this.state.selectedProduct === product.id;
            html += `
                <div class="product-item ${isActive ? 'active' : ''}" 
                     data-product-id="${product.id}"
                     onclick="BOMV2Advanced.selectProduct('${product.id}')">
                    <strong>${product.code}</strong><br>
                    ${product.name}<br>
                    <small>${product.nameEn}</small>
                </div>
            `;
        });
        
        return html;
    },
    
    // Render BOM form
    renderBOMForm() {
        if (!this.state.selectedProduct) {
            return `
                <div class="empty-state">
                    <h3>Select a Product</h3>
                    <p>Choose a product from the list to view and edit its Bill of Materials</p>
                </div>
            `;
        }
        
        const product = this.state.products.find(p => p.id === this.state.selectedProduct);
        if (!product) return '';
        
        return `
            <h3>BOM for: ${product.name} (${product.code})</h3>
            <p style="color: #666; margin-bottom: 20px;">Unit: ${product.unit}</p>
            
            <!-- Tabs -->
            <div class="form-tabs">
                <button class="tab-button active" onclick="BOMV2Advanced.switchTab('ingredients')">
                    [Meat] Ingredients
                </button>
                <button class="tab-button" onclick="BOMV2Advanced.switchTab('energy')">
                    ⚡ Energy
                </button>
                <button class="tab-button" onclick="BOMV2Advanced.switchTab('water')">
                    💧 Water
                </button>
                <button class="tab-button" onclick="BOMV2Advanced.switchTab('packaging')">
                    [Box] Packaging
                </button>
                <button class="tab-button" onclick="BOMV2Advanced.switchTab('workforce')">
                    👷 Workforce
                </button>
                <button class="tab-button" onclick="BOMV2Advanced.switchTab('summary')">
                    [Money] Cost Summary
                </button>
            </div>
            
            <!-- Tab Contents -->
            <div id="tab-ingredients" class="tab-content active">
                ${this.renderIngredientsTab()}
            </div>
            
            <div id="tab-energy" class="tab-content">
                ${this.renderEnergyTab()}
            </div>
            
            <div id="tab-water" class="tab-content">
                ${this.renderWaterTab()}
            </div>
            
            <div id="tab-packaging" class="tab-content">
                ${this.renderPackagingTab()}
            </div>
            
            <div id="tab-workforce" class="tab-content">
                ${this.renderWorkforceTab()}
            </div>
            
            <div id="tab-summary" class="tab-content">
                ${this.renderSummaryTab()}
            </div>
            
            <!-- Save Section -->
            <div class="save-section">
                <div>
                    <button class="save-button" onclick="BOMV2Advanced.saveBOM()" id="save-btn">
                        [Save] Save BOM
                    </button>
                    <button class="export-button" onclick="BOMV2Advanced.exportBOM()">
                        [Folder] Export to JSON
                    </button>
                    <button class="export-button" onclick="BOMV2Advanced.exportToSQL()" style="background: #4caf50;">
                        🗄️ Generate SQL
                    </button>
                </div>
                <span class="unsaved-indicator ${this.state.unsavedChanges ? 'show' : ''}" id="unsaved-indicator">
                    Unsaved changes
                </span>
            </div>
        `;
    },
    
    // Render Ingredients tab
    renderIngredientsTab() {
        const productId = this.state.selectedProduct;
        const ingredients = this.state.bomDatabase.ingredients[productId] || { main: [], supporting: [] };
        
        return `
            <div class="form-section">
                <div class="ingredient-group">
                    <h5>[Meat] MAIN INGREDIENTS (Primary Raw Materials)</h5>
                    <div id="main-ingredients">
                        ${this.renderIngredientItems(ingredients.main, 'main')}
                    </div>
                    <button class="add-button" onclick="BOMV2Advanced.addIngredient('main')">
                        + Add Main Ingredient
                    </button>
                </div>
                
                <div class="ingredient-group" style="margin-top: 25px;">
                    <h5>🧂 SUPPORTING INGREDIENTS (Spices, Additives, etc.)</h5>
                    <div id="supporting-ingredients">
                        ${this.renderIngredientItems(ingredients.supporting, 'supporting')}
                    </div>
                    <button class="add-button" onclick="BOMV2Advanced.addIngredient('supporting')">
                        + Add Supporting Ingredient
                    </button>
                </div>
            </div>
        `;
    },
    
    // Render ingredient items
    renderIngredientItems(items, type) {
        if (!items || items.length === 0) {
            return '<p style="color: #999; font-size: 13px;">No ingredients added yet</p>';
        }
        
        let html = '<div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 5px; font-size: 11px; color: #666; font-weight: 600;">';
        html += '<div>Name</div><div>Quantity</div><div>Unit</div><div>Cost/Unit</div><div>Supplier</div><div></div>';
        html += '</div>';
        
        items.forEach(item => {
            html += `
                <div class="ingredient-item">
                    <input type="text" class="editable-input" value="${item.name}" 
                           onchange="BOMV2Advanced.updateIngredient('${item.id}', 'name', this.value)"
                           placeholder="Ingredient name">
                    <input type="number" class="editable-input" value="${item.quantity}" step="0.001"
                           onchange="BOMV2Advanced.updateIngredient('${item.id}', 'quantity', this.value)"
                           placeholder="Qty">
                    <input type="text" class="editable-input" value="${item.unit}" 
                           onchange="BOMV2Advanced.updateIngredient('${item.id}', 'unit', this.value)"
                           placeholder="Unit">
                    <input type="number" class="editable-input" value="${item.cost}" step="0.01"
                           onchange="BOMV2Advanced.updateIngredient('${item.id}', 'cost', this.value)"
                           placeholder="Cost">
                    <input type="text" class="editable-input" value="${item.supplier}" 
                           onchange="BOMV2Advanced.updateIngredient('${item.id}', 'supplier', this.value)"
                           placeholder="Supplier">
                    <button class="remove-button" onclick="BOMV2Advanced.removeIngredient('${item.id}', '${type}')">
                        Remove
                    </button>
                </div>
            `;
        });
        
        return html;
    },
    
    // Render Energy tab
    renderEnergyTab() {
        const productId = this.state.selectedProduct;
        const energy = this.state.bomDatabase.energy[productId] || [];
        
        return `
            <div class="form-section">
                <h4>⚡ Energy Consumption per Unit</h4>
                <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 2fr auto; gap: 10px; margin-bottom: 5px; font-size: 11px; color: #666; font-weight: 600;">
                    <div>Type</div><div>Consumption</div><div>Unit</div><div>Cost/Unit</div><div>Process</div><div></div>
                </div>
                <div id="energy-items">
                    ${this.renderEnergyItems(energy)}
                </div>
                <button class="add-button" onclick="BOMV2Advanced.addEnergy()">
                    + Add Energy Type
                </button>
            </div>
        `;
    },
    
    // Render energy items
    renderEnergyItems(items) {
        if (!items || items.length === 0) {
            return '<p style="color: #999; font-size: 13px;">No energy consumption defined</p>';
        }
        
        let html = '';
        items.forEach(item => {
            const energyType = this.state.energyTypes.find(t => t.id === item.type);
            html += `
                <div class="energy-item">
                    <select class="editable-input" onchange="BOMV2Advanced.updateEnergy('${item.id}', 'type', this.value)">
                        ${this.state.energyTypes.map(type => 
                            `<option value="${type.id}" ${type.id === item.type ? 'selected' : ''}>
                                ${type.name}
                            </option>`
                        ).join('')}
                    </select>
                    <input type="number" class="editable-input" value="${item.consumption}" step="0.01"
                           onchange="BOMV2Advanced.updateEnergy('${item.id}', 'consumption', this.value)"
                           placeholder="Amount">
                    <input type="text" class="editable-input" value="${item.unit}" readonly
                           style="background: #f5f5f5;">
                    <input type="number" class="editable-input" value="${item.costPerUnit}" step="0.001"
                           onchange="BOMV2Advanced.updateEnergy('${item.id}', 'costPerUnit', this.value)"
                           placeholder="Cost">
                    <input type="text" class="editable-input" value="${item.process}" 
                           onchange="BOMV2Advanced.updateEnergy('${item.id}', 'process', this.value)"
                           placeholder="Process description">
                    <button class="remove-button" onclick="BOMV2Advanced.removeEnergy('${item.id}')">
                        Remove
                    </button>
                </div>
            `;
        });
        
        return html;
    },
    
    // Render Water tab
    renderWaterTab() {
        const productId = this.state.selectedProduct;
        const water = this.state.bomDatabase.water[productId] || {
            process: 0,
            cleaning: 0,
            cooling: 0,
            total: 0,
            costPerLiter: 0,
            recycled: 0
        };
        
        return `
            <div class="form-section">
                <h4>💧 Water Consumption per Unit (Liters)</h4>
                <div class="water-section">
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px;">
                            Process Water
                        </label>
                        <input type="number" class="editable-input" value="${water.process}" step="0.1"
                               onchange="BOMV2Advanced.updateWater('process', this.value)"
                               style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px;">
                            Cleaning Water
                        </label>
                        <input type="number" class="editable-input" value="${water.cleaning}" step="0.1"
                               onchange="BOMV2Advanced.updateWater('cleaning', this.value)"
                               style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px;">
                            Cooling Water
                        </label>
                        <input type="number" class="editable-input" value="${water.cooling}" step="0.1"
                               onchange="BOMV2Advanced.updateWater('cooling', this.value)"
                               style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px; font-weight: bold;">
                            Total Water (L)
                        </label>
                        <input type="number" class="editable-input" value="${water.total}" readonly
                               style="width: 100%; background: #f0f0f0; font-weight: bold;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px;">
                            Cost per Liter (€)
                        </label>
                        <input type="number" class="editable-input" value="${water.costPerLiter}" step="0.0001"
                               onchange="BOMV2Advanced.updateWater('costPerLiter', this.value)"
                               style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; color: #666; font-size: 13px;">
                            Recycled Water (%)
                        </label>
                        <input type="number" class="editable-input" value="${water.recycled}" step="1" min="0" max="100"
                               onchange="BOMV2Advanced.updateWater('recycled', this.value)"
                               style="width: 100%;">
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render Packaging tab
    renderPackagingTab() {
        const productId = this.state.selectedProduct;
        const packaging = this.state.bomDatabase.packaging[productId] || [];
        
        return `
            <div class="form-section">
                <h4>[Box] Packaging Materials per Unit</h4>
                <div style="display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 5px; font-size: 11px; color: #666; font-weight: 600;">
                    <div>Type</div><div>Material</div><div>Qty</div><div>Unit</div><div>Cost</div><div>Weight(kg)</div><div>Recyclable</div><div></div>
                </div>
                <div id="packaging-items">
                    ${this.renderPackagingItems(packaging)}
                </div>
                <button class="add-button" onclick="BOMV2Advanced.addPackaging()">
                    + Add Packaging Material
                </button>
            </div>
        `;
    },
    
    // Render packaging items
    renderPackagingItems(items) {
        if (!items || items.length === 0) {
            return '<p style="color: #999; font-size: 13px;">No packaging materials defined</p>';
        }
        
        let html = '';
        items.forEach(item => {
            html += `
                <div class="packaging-item" style="display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 1fr 1fr auto; gap: 10px;">
                    <select class="editable-input" onchange="BOMV2Advanced.updatePackaging('${item.id}', 'type', this.value)">
                        ${this.state.packagingTypes.map(type => 
                            `<option value="${type.id}" ${type.id === item.type ? 'selected' : ''}>
                                ${type.name}
                            </option>`
                        ).join('')}
                    </select>
                    <input type="text" class="editable-input" value="${item.material}" 
                           onchange="BOMV2Advanced.updatePackaging('${item.id}', 'material', this.value)"
                           placeholder="Material name">
                    <input type="number" class="editable-input" value="${item.quantity}" step="0.01"
                           onchange="BOMV2Advanced.updatePackaging('${item.id}', 'quantity', this.value)"
                           placeholder="Qty">
                    <input type="text" class="editable-input" value="${item.unit}" 
                           onchange="BOMV2Advanced.updatePackaging('${item.id}', 'unit', this.value)"
                           placeholder="Unit">
                    <input type="number" class="editable-input" value="${item.costPerUnit}" step="0.001"
                           onchange="BOMV2Advanced.updatePackaging('${item.id}', 'costPerUnit', this.value)"
                           placeholder="Cost">
                    <input type="number" class="editable-input" value="${item.weight}" step="0.001"
                           onchange="BOMV2Advanced.updatePackaging('${item.id}', 'weight', this.value)"
                           placeholder="Weight">
                    <select class="editable-input" onchange="BOMV2Advanced.updatePackaging('${item.id}', 'recyclable', this.value)">
                        <option value="true" ${item.recyclable ? 'selected' : ''}>Yes</option>
                        <option value="false" ${!item.recyclable ? 'selected' : ''}>No</option>
                    </select>
                    <button class="remove-button" onclick="BOMV2Advanced.removePackaging('${item.id}')">
                        Remove
                    </button>
                </div>
            `;
        });
        
        return html;
    },
    
    // Render Workforce tab
    renderWorkforceTab() {
        const productId = this.state.selectedProduct;
        const workforce = this.state.bomDatabase.workforce[productId] || [];
        
        return `
            <div class="form-section">
                <h4>👷 Workforce Requirements per Unit</h4>
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr auto; gap: 10px; margin-bottom: 5px; font-size: 11px; color: #666; font-weight: 600;">
                    <div>Category</div><div>Time (hrs)</div><div>Workers</div><div>Cost/hr</div><div>Skill Level</div><div></div>
                </div>
                <div id="workforce-items">
                    ${this.renderWorkforceItems(workforce)}
                </div>
                <button class="add-button" onclick="BOMV2Advanced.addWorkforce()">
                    + Add Workforce Category
                </button>
            </div>
        `;
    },
    
    // Render workforce items
    renderWorkforceItems(items) {
        if (!items || items.length === 0) {
            return '<p style="color: #999; font-size: 13px;">No workforce requirements defined</p>';
        }
        
        let html = '';
        items.forEach(item => {
            html += `
                <div class="workforce-item">
                    <select class="editable-input" onchange="BOMV2Advanced.updateWorkforce('${item.id}', 'category', this.value)">
                        ${this.state.workforceCategories.map(cat => 
                            `<option value="${cat.id}" ${cat.id === item.category ? 'selected' : ''}>
                                ${cat.name}
                            </option>`
                        ).join('')}
                    </select>
                    <input type="number" class="editable-input" value="${item.timePerUnit}" step="0.01"
                           onchange="BOMV2Advanced.updateWorkforce('${item.id}', 'timePerUnit', this.value)"
                           placeholder="Hours">
                    <input type="number" class="editable-input" value="${item.workers}" step="1" min="1"
                           onchange="BOMV2Advanced.updateWorkforce('${item.id}', 'workers', this.value)"
                           placeholder="Count">
                    <input type="number" class="editable-input" value="${item.costPerHour}" step="0.01"
                           onchange="BOMV2Advanced.updateWorkforce('${item.id}', 'costPerHour', this.value)"
                           placeholder="Cost">
                    <select class="editable-input" onchange="BOMV2Advanced.updateWorkforce('${item.id}', 'skill', this.value)">
                        <option value="Low" ${item.skill === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${item.skill === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${item.skill === 'High' ? 'selected' : ''}>High</option>
                    </select>
                    <button class="remove-button" onclick="BOMV2Advanced.removeWorkforce('${item.id}')">
                        Remove
                    </button>
                </div>
            `;
        });
        
        return html;
    },
    
    // Render Summary tab
    renderSummaryTab() {
        const costs = this.calculateTotalCosts();
        
        return `
            <div class="cost-summary">
                <h4>[Money] Cost Summary per Unit</h4>
                
                <div class="cost-item">
                    <span>Main Ingredients:</span>
                    <span>€${costs.mainIngredients.toFixed(3)}</span>
                </div>
                
                <div class="cost-item">
                    <span>Supporting Ingredients:</span>
                    <span>€${costs.supportingIngredients.toFixed(3)}</span>
                </div>
                
                <div class="cost-item">
                    <span>Energy:</span>
                    <span>€${costs.energy.toFixed(3)}</span>
                </div>
                
                <div class="cost-item">
                    <span>Water:</span>
                    <span>€${costs.water.toFixed(3)}</span>
                </div>
                
                <div class="cost-item">
                    <span>Packaging:</span>
                    <span>€${costs.packaging.toFixed(3)}</span>
                </div>
                
                <div class="cost-item">
                    <span>Workforce:</span>
                    <span>€${costs.workforce.toFixed(3)}</span>
                </div>
                
                <div class="cost-item cost-total">
                    <span>TOTAL COST PER UNIT:</span>
                    <span>€${costs.total.toFixed(2)}</span>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px;">
                    <h5 style="margin-bottom: 10px; color: #666;">Resource Efficiency Metrics</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
                        <div>
                            <strong>Total Weight:</strong> ${costs.totalWeight.toFixed(3)} kg
                        </div>
                        <div>
                            <strong>Water per Unit:</strong> ${costs.totalWater.toFixed(1)} L
                        </div>
                        <div>
                            <strong>Energy per Unit:</strong> ${costs.totalEnergy.toFixed(2)} kWh eq.
                        </div>
                        <div>
                            <strong>Labor Hours:</strong> ${costs.totalLabor.toFixed(3)} hrs
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Calculate total costs
    calculateTotalCosts() {
        const productId = this.state.selectedProduct;
        if (!productId) return { 
            mainIngredients: 0, supportingIngredients: 0, energy: 0, 
            water: 0, packaging: 0, workforce: 0, total: 0,
            totalWeight: 0, totalWater: 0, totalEnergy: 0, totalLabor: 0
        };
        
        let costs = {
            mainIngredients: 0,
            supportingIngredients: 0,
            energy: 0,
            water: 0,
            packaging: 0,
            workforce: 0,
            total: 0,
            totalWeight: 0,
            totalWater: 0,
            totalEnergy: 0,
            totalLabor: 0
        };
        
        // Calculate ingredient costs
        const ingredients = this.state.bomDatabase.ingredients[productId];
        if (ingredients) {
            if (ingredients.main) {
                ingredients.main.forEach(item => {
                    costs.mainIngredients += (item.quantity || 0) * (item.cost || 0);
                    costs.totalWeight += (item.quantity || 0);
                });
            }
            if (ingredients.supporting) {
                ingredients.supporting.forEach(item => {
                    costs.supportingIngredients += (item.quantity || 0) * (item.cost || 0);
                    costs.totalWeight += (item.quantity || 0);
                });
            }
        }
        
        // Calculate energy costs
        const energy = this.state.bomDatabase.energy[productId];
        if (energy) {
            energy.forEach(item => {
                costs.energy += (item.consumption || 0) * (item.costPerUnit || 0);
                // Convert all to kWh equivalent for total
                costs.totalEnergy += (item.consumption || 0);
            });
        }
        
        // Calculate water costs
        const water = this.state.bomDatabase.water[productId];
        if (water) {
            costs.totalWater = (water.process || 0) + (water.cleaning || 0) + (water.cooling || 0);
            costs.water = costs.totalWater * (water.costPerLiter || 0);
        }
        
        // Calculate packaging costs
        const packaging = this.state.bomDatabase.packaging[productId];
        if (packaging) {
            packaging.forEach(item => {
                costs.packaging += (item.quantity || 0) * (item.costPerUnit || 0);
                costs.totalWeight += (item.weight || 0);
            });
        }
        
        // Calculate workforce costs
        const workforce = this.state.bomDatabase.workforce[productId];
        if (workforce) {
            workforce.forEach(item => {
                const laborCost = (item.timePerUnit || 0) * (item.workers || 0) * (item.costPerHour || 0);
                costs.workforce += laborCost;
                costs.totalLabor += (item.timePerUnit || 0) * (item.workers || 0);
            });
        }
        
        // Calculate total
        costs.total = costs.mainIngredients + costs.supportingIngredients + 
                     costs.energy + costs.water + costs.packaging + costs.workforce;
        
        return costs;
    },
    
    // Event handlers
    selectProduct(productId) {
        this.state.selectedProduct = productId;
        this.renderBOM();
    },
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`tab-${tabName}`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Highlight active button
        event.target.classList.add('active');
    },
    
    // Update functions
    updateIngredient(itemId, field, value) {
        const productId = this.state.selectedProduct;
        const ingredients = this.state.bomDatabase.ingredients[productId];
        
        // Find in main or supporting
        let item = ingredients.main.find(i => i.id === itemId);
        if (!item) {
            item = ingredients.supporting.find(i => i.id === itemId);
        }
        
        if (item) {
            if (field === 'quantity' || field === 'cost') {
                item[field] = parseFloat(value) || 0;
            } else {
                item[field] = value;
            }
            this.markUnsaved();
        }
    },
    
    addIngredient(type) {
        const productId = this.state.selectedProduct;
        const newIngredient = {
            id: `${productId}_${type}_${Date.now()}`,
            name: '',
            quantity: 0,
            unit: 'kg',
            cost: 0,
            supplier: ''
        };
        
        this.state.bomDatabase.ingredients[productId][type].push(newIngredient);
        this.markUnsaved();
        this.renderBOM();
    },
    
    removeIngredient(itemId, type) {
        const productId = this.state.selectedProduct;
        const ingredients = this.state.bomDatabase.ingredients[productId][type];
        const index = ingredients.findIndex(i => i.id === itemId);
        
        if (index > -1) {
            ingredients.splice(index, 1);
            this.markUnsaved();
            this.renderBOM();
        }
    },
    
    updateEnergy(itemId, field, value) {
        const productId = this.state.selectedProduct;
        const energy = this.state.bomDatabase.energy[productId];
        const item = energy.find(i => i.id === itemId);
        
        if (item) {
            if (field === 'type') {
                item[field] = value;
                // Update unit based on energy type
                const energyType = this.state.energyTypes.find(t => t.id === value);
                if (energyType) {
                    item.unit = energyType.unit;
                }
            } else if (field === 'consumption' || field === 'costPerUnit') {
                item[field] = parseFloat(value) || 0;
            } else {
                item[field] = value;
            }
            this.markUnsaved();
            
            // Re-render if type changed (to update unit)
            if (field === 'type') {
                this.renderBOM();
            }
        }
    },
    
    addEnergy() {
        const productId = this.state.selectedProduct;
        const newEnergy = {
            id: `${productId}_energy_${Date.now()}`,
            type: 'electricity',
            consumption: 0,
            unit: 'kWh',
            costPerUnit: 0,
            process: ''
        };
        
        if (!this.state.bomDatabase.energy[productId]) {
            this.state.bomDatabase.energy[productId] = [];
        }
        
        this.state.bomDatabase.energy[productId].push(newEnergy);
        this.markUnsaved();
        this.renderBOM();
    },
    
    removeEnergy(itemId) {
        const productId = this.state.selectedProduct;
        const energy = this.state.bomDatabase.energy[productId];
        const index = energy.findIndex(i => i.id === itemId);
        
        if (index > -1) {
            energy.splice(index, 1);
            this.markUnsaved();
            this.renderBOM();
        }
    },
    
    updateWater(field, value) {
        const productId = this.state.selectedProduct;
        if (!this.state.bomDatabase.water[productId]) {
            this.state.bomDatabase.water[productId] = {
                process: 0,
                cleaning: 0,
                cooling: 0,
                total: 0,
                costPerLiter: 0,
                recycled: 0
            };
        }
        
        const water = this.state.bomDatabase.water[productId];
        water[field] = parseFloat(value) || 0;
        
        // Recalculate total
        water.total = water.process + water.cleaning + water.cooling;
        
        this.markUnsaved();
        
        // Update total field display
        if (field !== 'total') {
            this.renderBOM();
        }
    },
    
    updatePackaging(itemId, field, value) {
        const productId = this.state.selectedProduct;
        const packaging = this.state.bomDatabase.packaging[productId];
        const item = packaging.find(i => i.id === itemId);
        
        if (item) {
            if (field === 'recyclable') {
                item[field] = value === 'true';
            } else if (field === 'quantity' || field === 'costPerUnit' || field === 'weight') {
                item[field] = parseFloat(value) || 0;
            } else {
                item[field] = value;
            }
            this.markUnsaved();
        }
    },
    
    addPackaging() {
        const productId = this.state.selectedProduct;
        const newPackaging = {
            id: `${productId}_pack_${Date.now()}`,
            type: 'primary',
            material: '',
            quantity: 0,
            unit: 'piece',
            costPerUnit: 0,
            weight: 0,
            recyclable: true
        };
        
        if (!this.state.bomDatabase.packaging[productId]) {
            this.state.bomDatabase.packaging[productId] = [];
        }
        
        this.state.bomDatabase.packaging[productId].push(newPackaging);
        this.markUnsaved();
        this.renderBOM();
    },
    
    removePackaging(itemId) {
        const productId = this.state.selectedProduct;
        const packaging = this.state.bomDatabase.packaging[productId];
        const index = packaging.findIndex(i => i.id === itemId);
        
        if (index > -1) {
            packaging.splice(index, 1);
            this.markUnsaved();
            this.renderBOM();
        }
    },
    
    updateWorkforce(itemId, field, value) {
        const productId = this.state.selectedProduct;
        const workforce = this.state.bomDatabase.workforce[productId];
        const item = workforce.find(i => i.id === itemId);
        
        if (item) {
            if (field === 'timePerUnit' || field === 'workers' || field === 'costPerHour') {
                item[field] = parseFloat(value) || 0;
            } else {
                item[field] = value;
            }
            this.markUnsaved();
        }
    },
    
    addWorkforce() {
        const productId = this.state.selectedProduct;
        const newWorkforce = {
            id: `${productId}_work_${Date.now()}`,
            category: 'production',
            timePerUnit: 0,
            workers: 1,
            costPerHour: 0,
            skill: 'Medium'
        };
        
        if (!this.state.bomDatabase.workforce[productId]) {
            this.state.bomDatabase.workforce[productId] = [];
        }
        
        this.state.bomDatabase.workforce[productId].push(newWorkforce);
        this.markUnsaved();
        this.renderBOM();
    },
    
    removeWorkforce(itemId) {
        const productId = this.state.selectedProduct;
        const workforce = this.state.bomDatabase.workforce[productId];
        const index = workforce.findIndex(i => i.id === itemId);
        
        if (index > -1) {
            workforce.splice(index, 1);
            this.markUnsaved();
            this.renderBOM();
        }
    },
    
    // Mark as unsaved
    markUnsaved() {
        this.state.unsavedChanges = true;
        const indicator = document.getElementById('unsaved-indicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    },
    
    // Save BOM
    saveBOM() {
        localStorage.setItem('bomDatabase', JSON.stringify(this.state.bomDatabase));
        this.state.unsavedChanges = false;
        
        const indicator = document.getElementById('unsaved-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
        
        alert('[OK] BOM data saved successfully!');
    },
    
    // Export BOM
    exportBOM() {
        const dataStr = JSON.stringify(this.state.bomDatabase, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `bom-database-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Export to SQL
    exportToSQL() {
        let sql = '-- BOM Database SQL Export\n';
        sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
        
        // Create tables
        sql += this.generateSQLSchema();
        
        // Insert data
        sql += '\n-- Insert BOM Data\n';
        sql += this.generateSQLInserts();
        
        const dataBlob = new Blob([sql], {type: 'text/sql'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `bom-database-${new Date().toISOString().split('T')[0]}.sql`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Generate SQL schema
    generateSQLSchema() {
        return `
-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS bom_ingredients (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    ingredient_type ENUM('main', 'supporting') NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10,4),
    supplier VARCHAR(100),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Energy consumption table
CREATE TABLE IF NOT EXISTS bom_energy (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    energy_type VARCHAR(50) NOT NULL,
    consumption DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10,4),
    process_description VARCHAR(200),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Water consumption table
CREATE TABLE IF NOT EXISTS bom_water (
    product_id VARCHAR(50) PRIMARY KEY,
    process_water DECIMAL(10,2),
    cleaning_water DECIMAL(10,2),
    cooling_water DECIMAL(10,2),
    total_water DECIMAL(10,2),
    cost_per_liter DECIMAL(10,6),
    recycled_percentage DECIMAL(5,2),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Packaging materials table
CREATE TABLE IF NOT EXISTS bom_packaging (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    packaging_type VARCHAR(50) NOT NULL,
    material VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10,4),
    weight_kg DECIMAL(10,4),
    recyclable BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Workforce requirements table
CREATE TABLE IF NOT EXISTS bom_workforce (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    time_per_unit DECIMAL(10,4) NOT NULL,
    workers INT NOT NULL,
    cost_per_hour DECIMAL(10,2),
    skill_level ENUM('Low', 'Medium', 'High'),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_bom_ingredients_product ON bom_ingredients(product_id);
CREATE INDEX idx_bom_energy_product ON bom_energy(product_id);
CREATE INDEX idx_bom_packaging_product ON bom_packaging(product_id);
CREATE INDEX idx_bom_workforce_product ON bom_workforce(product_id);
`;
    },
    
    // Generate SQL inserts
    generateSQLInserts() {
        let sql = '';
        
        // Insert products
        sql += '\n-- Insert products\n';
        this.state.products.forEach(product => {
            sql += `INSERT INTO products (id, code, name, name_en, unit, category) VALUES `;
            sql += `('${product.id}', '${product.code}', '${product.name}', '${product.nameEn}', '${product.unit}', '${product.category}');\n`;
        });
        
        // Insert ingredients
        sql += '\n-- Insert ingredients\n';
        Object.keys(this.state.bomDatabase.ingredients).forEach(productId => {
            const ingredients = this.state.bomDatabase.ingredients[productId];
            
            // Main ingredients
            if (ingredients.main) {
                ingredients.main.forEach(item => {
                    sql += `INSERT INTO bom_ingredients (id, product_id, ingredient_type, name, quantity, unit, cost_per_unit, supplier) VALUES `;
                    sql += `('${item.id}', '${productId}', 'main', '${item.name}', ${item.quantity}, '${item.unit}', ${item.cost}, '${item.supplier}');\n`;
                });
            }
            
            // Supporting ingredients
            if (ingredients.supporting) {
                ingredients.supporting.forEach(item => {
                    sql += `INSERT INTO bom_ingredients (id, product_id, ingredient_type, name, quantity, unit, cost_per_unit, supplier) VALUES `;
                    sql += `('${item.id}', '${productId}', 'supporting', '${item.name}', ${item.quantity}, '${item.unit}', ${item.cost}, '${item.supplier}');\n`;
                });
            }
        });
        
        // More inserts for other tables...
        // (Energy, Water, Packaging, Workforce)
        
        return sql;
    },
    
    // Setup event handlers
    setupEventHandlers() {
        // Auto-save reminder
        window.addEventListener('beforeunload', (e) => {
            if (this.state.unsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BOMV2Advanced;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.BOMV2Advanced = BOMV2Advanced;
}
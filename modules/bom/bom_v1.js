// Ch BOM (Bill of Materials) Module V1
// Stage 3: BOM with shelf life and production capacity
// Includes full shelf life and factory shelf life (1/3 of full)

const BOMV1 = {
    VERSION: '1.0.0',
    
    state: {
        products: [],
        bomData: {},
        capacityData: {},
        productionLines: [],
        shifts: {
            1: { name: '1 Shift', hours: 8, productivity: 1.0, cleaningTime: 1 },
            2: { name: '2 Shifts', hours: 16, productivity: 0.95, cleaningTime: 1.5 },
            3: { name: '3 Shifts', hours: 22, productivity: 0.90, cleaningTime: 2 },
            4: { name: '4 Shifts (24h)', hours: 24, productivity: 0.85, cleaningTime: 2.5 }
        }
    },
    
    // Initialize the module
    init() {
        console.log(`BOM Module V${this.VERSION} initializing...`);
        
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
        
        this.loadBOMData();
        this.loadCapacityData();
        this.renderBOM();
        
        this.initialized = true;
        console.log('BOM V1 initialized');
    },
    
    initialized: false,
    
    // Load BOM data with shelf life information
    loadBOMData() {
        // Product definitions with shelf life
        this.state.products = [
            {
                id: 'p001',
                code: 'SVP-100',
                name: 'Svinjska plečka',
                nameEn: 'Pork Shoulder',
                unit: 'kg',
                category: 'Fresh Meat',
                fullShelfLife: 14,  // days
                factoryShelfLife: 5, // 1/3 of full shelf life (rounded up)
                productGroup: 'Fresh Meat',
                productionGroup: 'Line A'
            },
            {
                id: 'p002',
                code: 'GOV-200',
                name: 'Goveji file',
                nameEn: 'Beef Tenderloin',
                unit: 'kg',
                category: 'Premium Meat',
                fullShelfLife: 21,
                factoryShelfLife: 7,
                productGroup: 'Premium Cuts',
                productionGroup: 'Line A'
            },
            {
                id: 'p003',
                code: 'PIŠ-300',
                name: 'Piščančje prsi',
                nameEn: 'Chicken Breast',
                unit: 'kg',
                category: 'Poultry',
                fullShelfLife: 7,
                factoryShelfLife: 3,
                productGroup: 'Poultry',
                productionGroup: 'Line B'
            },
            {
                id: 'p004',
                code: 'JAG-400',
                name: 'Jagnječji kotleti',
                nameEn: 'Lamb Chops',
                unit: 'kg',
                category: 'Specialty Meat',
                fullShelfLife: 10,
                factoryShelfLife: 4,
                productGroup: 'Specialty',
                productionGroup: 'Line A'
            },
            {
                id: 'p005',
                code: 'KLB-500',
                name: 'Domača klobasa',
                nameEn: 'Homemade Sausage',
                unit: 'kg',
                category: 'Processed Meat',
                fullShelfLife: 30,
                factoryShelfLife: 10,
                productGroup: 'Processed',
                productionGroup: 'Line C'
            },
            {
                id: 'p006',
                code: 'SAL-600',
                name: 'Salama',
                nameEn: 'Salami',
                unit: 'kg',
                category: 'Cured Meat',
                fullShelfLife: 90,
                factoryShelfLife: 30,
                productGroup: 'Cured',
                productionGroup: 'Line C'
            }
        ];
        
        // BOM (ingredients/components) for each product
        this.state.bomData = {
            'p001': [
                { componentId: 'raw_pork', name: 'Raw Pork', quantity: 1.05, unit: 'kg', lossRate: 0.05 },
                { componentId: 'salt', name: 'Salt', quantity: 0.02, unit: 'kg', lossRate: 0 },
                { componentId: 'spices', name: 'Spices Mix', quantity: 0.01, unit: 'kg', lossRate: 0 }
            ],
            'p002': [
                { componentId: 'raw_beef', name: 'Raw Beef', quantity: 1.1, unit: 'kg', lossRate: 0.1 },
                { componentId: 'marinade', name: 'Marinade', quantity: 0.05, unit: 'L', lossRate: 0.02 }
            ],
            'p003': [
                { componentId: 'raw_chicken', name: 'Raw Chicken', quantity: 1.08, unit: 'kg', lossRate: 0.08 },
                { componentId: 'salt', name: 'Salt', quantity: 0.01, unit: 'kg', lossRate: 0 }
            ],
            'p004': [
                { componentId: 'raw_lamb', name: 'Raw Lamb', quantity: 1.12, unit: 'kg', lossRate: 0.12 },
                { componentId: 'herbs', name: 'Herbs Mix', quantity: 0.02, unit: 'kg', lossRate: 0 },
                { componentId: 'oil', name: 'Olive Oil', quantity: 0.03, unit: 'L', lossRate: 0 }
            ],
            'p005': [
                { componentId: 'pork_meat', name: 'Pork Meat', quantity: 0.7, unit: 'kg', lossRate: 0.02 },
                { componentId: 'beef_meat', name: 'Beef Meat', quantity: 0.3, unit: 'kg', lossRate: 0.02 },
                { componentId: 'casing', name: 'Natural Casing', quantity: 0.1, unit: 'm', lossRate: 0.05 },
                { componentId: 'spice_mix', name: 'Sausage Spices', quantity: 0.03, unit: 'kg', lossRate: 0 }
            ],
            'p006': [
                { componentId: 'pork_meat', name: 'Pork Meat', quantity: 0.6, unit: 'kg', lossRate: 0.15 },
                { componentId: 'beef_meat', name: 'Beef Meat', quantity: 0.4, unit: 'kg', lossRate: 0.15 },
                { componentId: 'curing_salt', name: 'Curing Salt', quantity: 0.025, unit: 'kg', lossRate: 0 },
                { componentId: 'starter_culture', name: 'Starter Culture', quantity: 0.002, unit: 'kg', lossRate: 0 }
            ]
        };
    },
    
    // Load production capacity data
    loadCapacityData() {
        // Production lines with capacity per hour
        this.state.productionLines = [
            {
                id: 'line_a',
                name: 'Line A - Fresh Meat',
                products: ['p001', 'p002', 'p004'],
                baseCapacity: 100, // kg/hour at 100% efficiency
                setupTime: 30, // minutes
                cleaningTime: 45 // minutes between shifts
            },
            {
                id: 'line_b',
                name: 'Line B - Poultry',
                products: ['p003'],
                baseCapacity: 150, // kg/hour
                setupTime: 20,
                cleaningTime: 30
            },
            {
                id: 'line_c',
                name: 'Line C - Processed',
                products: ['p005', 'p006'],
                baseCapacity: 80, // kg/hour
                setupTime: 45,
                cleaningTime: 60
            }
        ];
        
        // Calculate capacity for each shift scenario
        this.calculateShiftCapacities();
    },
    
    // Calculate production capacity for different shift scenarios
    calculateShiftCapacities() {
        this.state.capacityData = {};
        
        this.state.productionLines.forEach(line => {
            this.state.capacityData[line.id] = {};
            
            Object.keys(this.state.shifts).forEach(shiftNum => {
                const shift = this.state.shifts[shiftNum];
                const effectiveHours = shift.hours - shift.cleaningTime - (line.setupTime / 60);
                const dailyCapacity = Math.round(line.baseCapacity * effectiveHours * shift.productivity);
                
                this.state.capacityData[line.id][shiftNum] = {
                    shiftName: shift.name,
                    totalHours: shift.hours,
                    effectiveHours: effectiveHours.toFixed(1),
                    productivity: (shift.productivity * 100).toFixed(0) + '%',
                    dailyCapacity: dailyCapacity,
                    weeklyCapacity: dailyCapacity * 5, // 5 working days
                    monthlyCapacity: dailyCapacity * 22 // ~22 working days
                };
            });
        });
    },
    
    // Render the BOM interface
    renderBOM() {
        const container = document.getElementById('bom-container');
        if (!container) return;
        
        let html = `
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
                
                .bom-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .bom-tab {
                    padding: 10px 20px;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .bom-tab.active {
                    background: #7b1fa2;
                    color: white;
                    border-color: #7b1fa2;
                }
                
                .bom-table {
                    width: 100%;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }
                
                .bom-table th {
                    background: #6a1b9a;
                    color: white;
                    padding: 10px;
                    text-align: left;
                    font-weight: 600;
                }
                
                .bom-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .bom-table tr:hover {
                    background: #f5f5f5;
                }
                
                .shelf-life-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    margin: 0 2px;
                }
                
                .shelf-full { background: #e8f5e9; color: #2e7d32; }
                .shelf-factory { background: #fff3e0; color: #f57c00; }
                
                .capacity-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                
                .capacity-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .capacity-header {
                    font-weight: bold;
                    color: #6a1b9a;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .capacity-shifts {
                    display: grid;
                    gap: 10px;
                }
                
                .shift-row {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    gap: 10px;
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                
                .shift-label {
                    font-weight: 600;
                    color: #555;
                }
                
                .component-list {
                    padding-left: 20px;
                    margin: 10px 0;
                    background: #f9f9f9;
                    border-left: 3px solid #7b1fa2;
                    border-radius: 4px;
                }
                
                .component-item {
                    padding: 5px 10px;
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .component-item:last-child {
                    border-bottom: none;
                }
            </style>
            
            <div class="bom-container">
                <div class="bom-header">
                    <h2>📋 BOM & Proizvodna kapaciteta / BOM & Production Capacity</h2>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        Stage 3: Bill of Materials with Shelf Life & Production Capacity
                        <br>Full Shelf Life | Factory Shelf Life (1/3) | 4 Shift Scenarios
                    </div>
                </div>
                
                <div class="bom-tabs">
                    <div class="bom-tab active" onclick="BOMV1.showTab('products')">
                        Izdelki & Rok / Products & Shelf Life
                    </div>
                    <div class="bom-tab" onclick="BOMV1.showTab('bom')">
                        BOM / Bill of Materials
                    </div>
                    <div class="bom-tab" onclick="BOMV1.showTab('capacity')">
                        Kapaciteta / Capacity
                    </div>
                </div>
                
                <div id="bom-content">
                    ${this.renderProductsTab()}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Render products tab with shelf life
    renderProductsTab() {
        let html = `
            <table class="bom-table">
                <thead>
                    <tr>
                        <th>Šifra / Code</th>
                        <th>Izdelek / Product</th>
                        <th>Kategorija / Category</th>
                        <th>Rok uporabe (dni) / Shelf Life (days)</th>
                        <th>Proizvodna skupina / Production Group</th>
                        <th>Tržna skupina / Product Group</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.state.products.forEach(product => {
            html += `
                <tr>
                    <td><strong>${product.code}</strong></td>
                    <td>
                        ${product.name}
                        <br><small style="color: #666;">${product.nameEn}</small>
                    </td>
                    <td>${product.category}</td>
                    <td>
                        <span class="shelf-life-badge shelf-full">
                            Polni / Full: ${product.fullShelfLife}d
                        </span>
                        <span class="shelf-life-badge shelf-factory">
                            Tovarniški / Factory: ${product.factoryShelfLife}d
                        </span>
                    </td>
                    <td><strong>${product.productionGroup}</strong></td>
                    <td>${product.productGroup}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <div style="padding: 15px; background: #f0f0f0; border-radius: 8px;">
                <h4>📝 Razlaga / Explanation:</h4>
                <ul style="margin: 10px 0; line-height: 1.8;">
                    <li><strong>Polni rok uporabe / Full Shelf Life:</strong> Celoten rok uporabe izdelka od proizvodnje do končne uporabe</li>
                    <li><strong>Tovarniški rok / Factory Shelf Life:</strong> 1/3 polnega roka - čas, ki ga izdelek preživi v tovarni pred distribucijo</li>
                    <li><strong>Proizvodna skupina / Production Group:</strong> Linija, na kateri se izdelek proizvaja (Line A, B, C)</li>
                    <li><strong>Tržna skupina / Product Group:</strong> Marketinška kategorizacija izdelkov</li>
                </ul>
            </div>
        `;
        
        return html;
    },
    
    // Render BOM tab
    renderBOMTab() {
        let html = '<div>';
        
        this.state.products.forEach(product => {
            const bom = this.state.bomData[product.id] || [];
            
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #6a1b9a; margin-bottom: 10px;">
                        ${product.code} - ${product.name}
                    </h3>
                    <div class="component-list">
            `;
            
            if (bom.length > 0) {
                bom.forEach(component => {
                    const totalNeeded = component.quantity * (1 + component.lossRate);
                    html += `
                        <div class="component-item">
                            <div>
                                <strong>${component.name}</strong>
                                <small style="color: #666;"> (${component.componentId})</small>
                            </div>
                            <div>
                                <span style="color: #1976d2;">${component.quantity} ${component.unit}</span>
                                ${component.lossRate > 0 ? `
                                    <small style="color: #f57c00;">
                                        +${(component.lossRate * 100).toFixed(0)}% izguba = ${totalNeeded.toFixed(3)} ${component.unit}
                                    </small>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
            } else {
                html += '<div style="padding: 10px; color: #666;">No BOM data available</div>';
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    // Render capacity tab
    renderCapacityTab() {
        let html = '<div class="capacity-grid">';
        
        this.state.productionLines.forEach(line => {
            const lineCapacity = this.state.capacityData[line.id];
            
            html += `
                <div class="capacity-card">
                    <div class="capacity-header">
                        ${line.name}
                    </div>
                    <div style="margin: 10px 0; font-size: 13px; color: #666;">
                        Osnovna kapaciteta: <strong>${line.baseCapacity} kg/h</strong><br>
                        Čas priprave: ${line.setupTime} min | Čiščenje: ${line.cleaningTime} min<br>
                        Izdelki: ${line.products.map(pid => {
                            const prod = this.state.products.find(p => p.id === pid);
                            return prod ? prod.code : pid;
                        }).join(', ')}
                    </div>
                    <div class="capacity-shifts">
            `;
            
            Object.keys(lineCapacity).forEach(shiftNum => {
                const shift = lineCapacity[shiftNum];
                html += `
                    <div class="shift-row">
                        <div class="shift-label">${shift.shiftName}:</div>
                        <div>
                            <strong>${shift.dailyCapacity} kg/dan</strong>
                            <br>
                            <small style="color: #666;">
                                ${shift.effectiveHours}h × ${shift.productivity} = 
                                ${shift.weeklyCapacity} kg/teden
                            </small>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            
            <table class="bom-table">
                <thead>
                    <tr>
                        <th>Linija / Line</th>
                        <th>1 Izmena / 1 Shift</th>
                        <th>2 Izmeni / 2 Shifts</th>
                        <th>3 Izmene / 3 Shifts</th>
                        <th>4 Izmene / 4 Shifts (24h)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.state.productionLines.forEach(line => {
            const lineCapacity = this.state.capacityData[line.id];
            html += `
                <tr>
                    <td><strong>${line.name}</strong></td>
            `;
            
            for (let i = 1; i <= 4; i++) {
                const shift = lineCapacity[i];
                html += `
                    <td>
                        <strong>${shift.dailyCapacity} kg/dan</strong><br>
                        <small>${shift.monthlyCapacity.toLocaleString('sl-SI')} kg/mesec</small>
                    </td>
                `;
            }
            
            html += '</tr>';
        });
        
        html += `
                </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                <h4>⚙️ Proizvodni parametri / Production Parameters:</h4>
                <ul style="margin: 10px 0; line-height: 1.8;">
                    <li><strong>1 izmena:</strong> 8 ur, 100% produktivnost, 1h čiščenje</li>
                    <li><strong>2 izmeni:</strong> 16 ur, 95% produktivnost, 1.5h čiščenje</li>
                    <li><strong>3 izmene:</strong> 22 ur, 90% produktivnost, 2h čiščenje</li>
                    <li><strong>4 izmene:</strong> 24 ur, 85% produktivnost, 2.5h čiščenje</li>
                </ul>
            </div>
        `;
        
        return html;
    },
    
    // Show specific tab
    showTab(tabName) {
        const tabs = document.querySelectorAll('.bom-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
                (tabName === 'products' && tab.textContent.includes('Izdelki')) ||
                (tabName === 'bom' && tab.textContent.includes('BOM')) ||
                (tabName === 'capacity' && tab.textContent.includes('Kapaciteta'))) {
                tab.classList.add('active');
            }
        });
        
        const content = document.getElementById('bom-content');
        if (content) {
            switch(tabName) {
                case 'products':
                    content.innerHTML = this.renderProductsTab();
                    break;
                case 'bom':
                    content.innerHTML = this.renderBOMTab();
                    break;
                case 'capacity':
                    content.innerHTML = this.renderCapacityTab();
                    break;
            }
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BOMV1;
}

// Make globally available
if (typeof window !== 'undefined') {
    window.BOMV1 = BOMV1;
}
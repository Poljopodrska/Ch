// Ch Project Main Application
const ChApp = {
    config: null,
    currentView: 'dashboard',
    
    // Initialize application
    init(options) {
        console.log(`Ch Project ${ChConfig.version} - Initializing...`);
        this.config = { ...ChConfig, ...options };
        
        // Set up navigation
        this.setupNavigation();
        
        // Load initial view
        this.loadView('dashboard');
        
        // Update status
        this.updateStatus('Ready');
        
        console.log('Ch Project initialized successfully');
    },
    
    // Set up navigation handlers
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('href').substring(1);
                this.loadView(view);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.loadView(e.state.view, false);
            }
        });
    },
    
    // Load a view
    async loadView(viewName, pushState = true) {
        const mainContent = document.getElementById('main-content');
        
        // Show loading state
        mainContent.innerHTML = `
            <div class="loading">
                <h2>Loading ${viewName}...</h2>
            </div>
        `;
        
        try {
            // Get view content
            const content = await this.getViewContent(viewName);
            
            // Simulate API delay in development
            if (this.config.mode === 'development') {
                await this.delay(this.config.development.mockDelay);
            }
            
            // Update content
            mainContent.innerHTML = content;
            this.currentView = viewName;
            
            // Update URL
            if (pushState) {
                history.pushState({ view: viewName }, '', `#${viewName}`);
            }
            
            // Update status
            this.updateStatus(`Viewing: ${viewName}`);
            
        } catch (error) {
            console.error('Error loading view:', error);
            mainContent.innerHTML = `
                <div class="alert alert-error">
                    <h3>Error Loading View</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    },
    
    // Get view content
    async getViewContent(viewName) {
        switch (viewName) {
            case 'dashboard':
                return this.getDashboardView();
            case 'pricing':
                return this.getPricingView();
            case 'planning':
                return this.getPlanningView();
            case 'production-planning':
                return this.getProductionPlanningView();
            case 'meat-planner-legacy':
                return this.getLegacyMeatPlannerView();
            case 'modules':
                return this.getModulesView();
            case 'settings':
                return this.getSettingsView();
            case 'about':
                return this.getAboutView();
            default:
                throw new Error(`Unknown view: ${viewName}`);
        }
    },
    
    // Dashboard view
    async getDashboardView() {
        const data = await MockAPI.getDashboardData();
        return `
            <h2>Dashboard</h2>
            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">System Status</div>
                    <div class="card-content">
                        <p>Mode: <span class="badge badge-primary">${this.config.mode}</span></p>
                        <p>Version: <strong>${this.config.version}</strong></p>
                        <p>API: <code>${this.config.api[this.config.mode]}</code></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">Quick Stats</div>
                    <div class="card-content">
                        <p>Active Modules: <strong>${data.activeModules}</strong></p>
                        <p>Total Operations: <strong>${data.totalOperations}</strong></p>
                        <p>Last Update: <strong>${data.lastUpdate}</strong></p>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">Recent Activity</div>
                <div class="card-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.recentActivity.map(activity => `
                                <tr>
                                    <td>${activity.time}</td>
                                    <td>${activity.action}</td>
                                    <td><span class="badge badge-${activity.status}">${activity.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // Pricing view
    async getPricingView() {
        // Use ModuleLoader for better file:// support
        try {
            let html;
            
            if (window.ModuleLoader) {
                // Use the module loader for file:// compatibility
                html = await ModuleLoader.load('pricing');
            } else {
                // Fallback to fetch for production
                const response = await fetch('modules/pricing/pricing.html');
                html = await response.text();
                
                // Initialize after loading
                setTimeout(() => {
                    Pricing.init();
                }, 100);
            }
            
            return html;
        } catch (error) {
            console.error('Error loading pricing module:', error);
            return `
                <div class="alert alert-error">
                    <h3>Error Loading Pricing Module</h3>
                    <p>Could not load the pricing module. Please refresh the page.</p>
                    <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
                </div>
            `;
        }
    },
    
    // Planning view - Now with embedded HTML
    async getPlanningView() {
        console.log('Loading Planning V3 module...');
        
        const currentYear = new Date().getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 
                       'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
        
        // Generate the planning HTML directly
        const html = `
            <div class="planning-module-container">
                <!-- Big indicator that V3 is loading -->
                <div style="background: #4CAF50; color: white; padding: 15px; text-align: center; margin-bottom: 20px; font-size: 18px;">
                    ✅ PLANNING V3.3 - MACRO/MICRO ROWS - 5 PRODUCTS
                </div>
                
                <div style="background: #FFD700; padding: 15px; text-align: center; font-weight: bold; margin-bottom: 20px; border: 2px solid red;">
                    ⚠️ PLANNING MODULE WITH 5 SLOVENIAN PRODUCTS ⚠️
                </div>
                
                <h2>Načrtovanje proizvodnje / Production Planning</h2>
                
                <div style="margin: 20px 0;">
                    <button onclick="alert('Monthly view')" style="padding: 10px 20px; margin-right: 10px;">Mesečno</button>
                    <button onclick="alert('Quarterly view')" style="padding: 10px 20px; margin-right: 10px;">Četrtletno</button>
                    <button onclick="alert('Yearly view')" style="padding: 10px 20px;">Letno</button>
                </div>
                
                <!-- Main Planning Table -->
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: #34495e; color: white;">
                            <th style="padding: 10px; border: 1px solid #2c3e50;" colspan="2">Izdelek / Product</th>
                            ${months.map(m => '<th style="padding: 10px; border: 1px solid #2c3e50;">' + m + '</th>').join('')}
                            <th style="padding: 10px; border: 1px solid #2c3e50;">Skupaj</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Product 1: Pork Shoulder -->
                        <tr style="background: #3498db; color: white; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">
                                <span style="cursor: pointer;">▼</span> SVP-100 - Svinjska plečka / Pork Shoulder (kg)
                            </td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1200</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1150</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1300</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1250</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1400</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1350</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1300</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1250</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1200</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1150</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1300</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1400</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">15,250</td>
                        </tr>
                        <!-- Micro rows for Product 1 -->
                        <tr style="background: #f8f9fa;">
                            <td style="width: 50px;"></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">N-2 (${currentYear-2})</td>
                            ${months.map(() => '<td style="padding: 8px; border: 1px solid #ddd; color: #666;">1100</td>').join('')}
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">13,200</td>
                        </tr>
                        <tr style="background: #f8f9fa;">
                            <td></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">N-1 (${currentYear-1})</td>
                            ${months.map(() => '<td style="padding: 8px; border: 1px solid #ddd; color: #666;">1150</td>').join('')}
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">13,800</td>
                        </tr>
                        <tr style="background: #fff9e6;">
                            <td></td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">N (${currentYear})</td>
                            ${months.map((m, i) => {
                                const isActual = i < 7; // Assume we're in August
                                const style = isActual ? 'background: #e3f2fd; color: #1565c0;' : 'background: #fff8e1; color: #f57c00;';
                                return '<td style="padding: 8px; border: 1px solid #ddd; ' + style + '">1200</td>';
                            }).join('')}
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">14,400</td>
                        </tr>
                        <tr style="background: #e8f5e9;">
                            <td></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">N+1 (${currentYear+1})</td>
                            ${months.map(() => '<td style="padding: 8px; border: 1px solid #ddd; color: #558b2f;"><input type="number" value="1250" style="width: 60px;"></td>').join('')}
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">15,000</td>
                        </tr>
                        <tr style="background: #e8f5e9;">
                            <td></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">N+2 (${currentYear+2})</td>
                            ${months.map(() => '<td style="padding: 8px; border: 1px solid #ddd; color: #558b2f;"><input type="number" value="1300" style="width: 60px;"></td>').join('')}
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">15,600</td>
                        </tr>
                        
                        <!-- Product 2: Beef Tenderloin (collapsed) -->
                        <tr style="background: #ecf0f1; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">
                                <span style="cursor: pointer;">▶</span> GOV-200 - Goveji file / Beef Tenderloin (kg)
                            </td>
                            <td style="padding: 8px; border: 1px solid #ddd;">800</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">750</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">850</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">820</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">900</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">880</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">850</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">800</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">780</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">750</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">820</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">900</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">9,900</td>
                        </tr>
                        
                        <!-- Product 3: Chicken Breast (collapsed) -->
                        <tr style="background: #ecf0f1; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">
                                <span style="cursor: pointer;">▶</span> PIŠ-300 - Piščančje prsi / Chicken Breast (kg)
                            </td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1500</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1450</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1600</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1550</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1700</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1650</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1600</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1550</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1500</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1450</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1550</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1700</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">18,800</td>
                        </tr>
                        
                        <!-- Product 4: Lamb Chops (collapsed) -->
                        <tr style="background: #ecf0f1; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">
                                <span style="cursor: pointer;">▶</span> JAG-400 - Jagnječji kotleti / Lamb Chops (kg)
                            </td>
                            <td style="padding: 8px; border: 1px solid #ddd;">400</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">380</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">420</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">410</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">450</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">440</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">420</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">400</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">390</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">380</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">410</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">450</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">4,950</td>
                        </tr>
                        
                        <!-- Product 5: Sausage (collapsed) -->
                        <tr style="background: #ecf0f1; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">
                                <span style="cursor: pointer;">▶</span> KLB-500 - Domača klobasa / Homemade Sausage (kg)
                            </td>
                            <td style="padding: 8px; border: 1px solid #ddd;">900</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">850</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">950</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">920</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1000</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">980</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">950</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">900</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">880</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">850</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">920</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1000</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">11,100</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f0f0;">
                    <h4>Legend:</h4>
                    <div>▼ = Expanded product showing 5 years (N-2 to N+2)</div>
                    <div>▶ = Collapsed product (click to expand)</div>
                    <div style="display: inline-block; width: 20px; height: 20px; background: #e3f2fd;"></div> Actual data (past months)
                    <div style="display: inline-block; width: 20px; height: 20px; background: #fff8e1;"></div> Planned data (future months)
                    <div style="display: inline-block; width: 20px; height: 20px; background: #e8f5e9;"></div> Future years (editable)
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Production Planning view
    async getProductionPlanningView() {
        // Use ModuleLoader for better file:// support
        try {
            let html;
            
            if (window.ModuleLoader) {
                // Use the module loader for file:// compatibility
                html = await ModuleLoader.load('production-planning');
            } else {
                // Fallback to fetch for production
                const response = await fetch('modules/production-planning/production-planning.html');
                html = await response.text();
            }
            
            // Initialize after loading
            setTimeout(() => {
                if (window.ProductionPlanning) {
                    ProductionPlanning.init();
                }
            }, 100);
            
            return html;
        } catch (error) {
            console.error('Error loading production planning module:', error);
            return `
                <div class="alert alert-error">
                    <h3>Error Loading Production Planning Module</h3>
                    <p>Could not load the production planning module. Please refresh the page.</p>
                    <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
                </div>
            `;
        }
    },
    
    // Legacy Meat Planner view
    async getLegacyMeatPlannerView() {
        try {
            let html;
            
            if (window.ModuleLoader) {
                // Use the module loader for file:// compatibility
                html = await ModuleLoader.load('meat-planner-legacy');
            } else {
                // Fallback to fetch for production
                const response = await fetch('modules/meat-planner-legacy/meat-planner-legacy.html');
                html = await response.text();
            }
            
            // Update status to indicate legacy module
            this.updateStatus('Legacy module loaded');
            
            return html;
        } catch (error) {
            console.error('Error loading legacy meat planner module:', error);
            return `
                <div class="alert alert-error">
                    <h3>Error Loading Legacy Meat Planner</h3>
                    <p>Could not load the legacy meat production planner. This may be due to:</p>
                    <ul>
                        <li>Missing meat-production-planner files</li>
                        <li>Browser security restrictions</li>
                        <li>File permission issues</li>
                    </ul>
                    <p><strong>Solution:</strong> Ensure the meat-production-planner folder is copied to the Ch project directory.</p>
                    <p style="font-size: 0.9em; color: #666;">Error: ${error.message}</p>
                </div>
            `;
        }
    },
    
    // Modules view
    async getModulesView() {
        const modules = await MockAPI.getModules();
        return `
            <h2>Modules</h2>
            <div class="alert alert-info">
                <strong>Module System:</strong> Each module operates independently following constitutional principles.
            </div>
            <div class="grid grid-3">
                ${modules.map(module => `
                    <div class="module-card" onclick="ChApp.showModuleDetails('${module.id}')">
                        <div class="module-icon">${module.icon}</div>
                        <div class="module-title">${module.name}</div>
                        <div class="module-description">${module.description}</div>
                        <div style="margin-top: 1rem;">
                            <span class="badge badge-${module.status === 'active' ? 'success' : 'warning'}">
                                ${module.status}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // Settings view
    getSettingsView() {
        return `
            <h2>Settings</h2>
            <div class="card">
                <div class="card-header">Application Settings</div>
                <div class="card-content">
                    <form onsubmit="return false;">
                        <div class="form-group">
                            <label class="form-label">Application Mode</label>
                            <input type="text" class="form-control" value="${this.config.mode}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Version</label>
                            <input type="text" class="form-control" value="${this.config.version}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Theme</label>
                            <select class="form-control">
                                <option>Default</option>
                                <option>Dark</option>
                                <option>Light</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" ${this.config.ui.animations ? 'checked' : ''}>
                                Enable Animations
                            </label>
                        </div>
                        <button class="btn btn-primary" onclick="ChApp.saveSettings()">Save Settings</button>
                    </form>
                </div>
            </div>
        `;
    },
    
    // About view
    getAboutView() {
        return `
            <h2>About Ch Project</h2>
            <div class="card">
                <div class="card-header">Ch Project Information</div>
                <div class="card-content">
                    <h3>Version ${this.config.version}</h3>
                    <p>Ch Project is built following constitutional principles with LLM-first development approach.</p>
                    
                    <h4>Core Principles:</h4>
                    <ul>
                        <li>LLM-First Development</li>
                        <li>Privacy-First Architecture</li>
                        <li>Module Independence</li>
                        <li>Error Isolation</li>
                        <li>Version Visibility</li>
                    </ul>
                    
                    <h4>MANGO TEST:</h4>
                    <p><em>"Any feature in Ch project works for any use case in any country"</em></p>
                    
                    <h4>Development Mode:</h4>
                    <p>Currently running in <strong>${this.config.mode}</strong> mode.</p>
                    <p>Double-click <code>ch_app.html</code> to run the application.</p>
                </div>
            </div>
        `;
    },
    
    // Show module details
    showModuleDetails(moduleId) {
        if (moduleId === 'pricing') {
            // Navigate to pricing module
            this.loadView('pricing');
            // Update nav
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#pricing');
            });
        } else {
            alert(`Module Details: ${moduleId}\n\nThis would show detailed information about the module.`);
        }
    },
    
    // Save settings
    saveSettings() {
        this.updateStatus('Settings saved (mock)');
        alert('Settings saved successfully!\n\nNote: In development mode, settings are not persisted.');
    },
    
    // Update status indicator
    updateStatus(status) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    },
    
    // Utility: delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
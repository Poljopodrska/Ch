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
            case 'stock-report':
                return this.getStockReportView();
            case 'bom':
                return this.getBOMView();
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
        // Use mock data directly in production to avoid MockAPI dependency
        const data = {
            activeModules: 5,
            totalOperations: 1234,
            lastUpdate: new Date().toLocaleString('sl-SI'),
            recentActivity: [
                { time: '10:30', action: 'Planning module loaded', status: 'success' },
                { time: '10:25', action: 'System initialized', status: 'success' },
                { time: '10:20', action: 'Database connected', status: 'info' }
            ]
        };
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
    
    // Planning view - Now with V4 expandable hierarchy
    async getPlanningView() {
        console.log('Loading Planning V4 module...');
        
        // Create container for planning module
        const html = `
            <div id="planning-grid">
                <!-- Planning V4 will be loaded here -->
            </div>
        `;
        
        // Load the planning V4 module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if PlanningV4 is already loaded
                if (typeof PlanningV4 !== 'undefined') {
                    console.log('PlanningV4 already loaded, initializing...');
                    PlanningV4.init();
                    console.log('Planning V4 initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/planning/planning_v4.js"]');
                if (existingScript) {
                    console.log('Planning V4 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load planning_v4.js module
                const script = document.createElement('script');
                script.src = 'modules/planning/planning_v4.js';
                script.onload = () => {
                    console.log('Planning V4 script loaded');
                    if (typeof PlanningV4 !== 'undefined') {
                        PlanningV4.init();
                        console.log('Planning V4 initialized');
                    } else {
                        console.error('PlanningV4 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load planning_v4.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Planning V4:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Production Planning view
    async getProductionPlanningView() {
        console.log('Loading Production Planning V1 module...');
        
        // Create container for production planning module
        const html = `
            <div id="production-planning-grid">
                <!-- Production Planning V1 will be loaded here -->
            </div>
        `;
        
        // Load the production planning module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if ProductionPlanningV1 is already loaded
                if (typeof ProductionPlanningV1 !== 'undefined') {
                    console.log('ProductionPlanningV1 already loaded, initializing...');
                    ProductionPlanningV1.init();
                    console.log('Production Planning V1 initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/production/production_planning_v1.js"]');
                if (existingScript) {
                    console.log('Production Planning V1 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load production_planning_v1.js module
                const script = document.createElement('script');
                script.src = 'modules/production/production_planning_v1.js';
                script.onload = () => {
                    console.log('Production Planning V1 script loaded');
                    if (typeof ProductionPlanningV1 !== 'undefined') {
                        ProductionPlanningV1.init();
                        console.log('Production Planning V1 initialized');
                    } else {
                        console.error('ProductionPlanningV1 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load production_planning_v1.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Production Planning V1:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Stock Report view
    async getStockReportView() {
        console.log('Loading Stock Report V1 module...');
        
        // Create container for stock report module
        const html = `
            <div id="stock-report-container">
                <!-- Stock Report V1 will be loaded here -->
            </div>
        `;
        
        // Load the stock report module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if StockReportV1 is already loaded
                if (typeof StockReportV1 !== 'undefined') {
                    console.log('StockReportV1 already loaded, initializing...');
                    StockReportV1.init();
                    console.log('Stock Report V1 initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/stock/stock_report_v1.js"]');
                if (existingScript) {
                    console.log('Stock Report V1 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load stock_report_v1.js module
                const script = document.createElement('script');
                script.src = 'modules/stock/stock_report_v1.js';
                script.onload = () => {
                    console.log('Stock Report V1 script loaded');
                    if (typeof StockReportV1 !== 'undefined') {
                        StockReportV1.init();
                        console.log('Stock Report V1 initialized');
                    } else {
                        console.error('StockReportV1 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load stock_report_v1.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Stock Report V1:', error);
            }
        }, 100);
        
        return html;
    },
    
    // BOM view
    async getBOMView() {
        console.log('Loading BOM V1 module...');
        
        // Create container for BOM module
        const html = `
            <div id="bom-container">
                <!-- BOM V1 will be loaded here -->
            </div>
        `;
        
        // Load the BOM module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if BOMV1 is already loaded
                if (typeof BOMV1 !== 'undefined') {
                    console.log('BOMV1 already loaded, initializing...');
                    BOMV1.init();
                    console.log('BOM V1 initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/bom/bom_v1.js"]');
                if (existingScript) {
                    console.log('BOM V1 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load bom_v1.js module
                const script = document.createElement('script');
                script.src = 'modules/bom/bom_v1.js';
                script.onload = () => {
                    console.log('BOM V1 script loaded');
                    if (typeof BOMV1 !== 'undefined') {
                        BOMV1.init();
                        console.log('BOM V1 initialized');
                    } else {
                        console.error('BOMV1 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load bom_v1.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading BOM V1:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Modules view
    async getModulesView() {
        // Use mock data directly in production
        const modules = [
            { id: 'pricing', name: 'Cene', icon: '💰', description: 'Product pricing management', status: 'active' },
            { id: 'planning', name: 'Načrtovanje', icon: '📊', description: 'Production planning with macro/micro rows', status: 'active' },
            { id: 'production', name: 'BOM in proizvodnja', icon: '🏭', description: 'Bill of materials and production', status: 'active' },
            { id: 'reports', name: 'Poročila', icon: '📈', description: 'Analytics and reporting', status: 'planned' },
            { id: 'inventory', name: 'Zaloge', icon: '📦', description: 'Inventory management', status: 'planned' }
        ];
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
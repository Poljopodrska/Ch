// Ch Project Main Application
const ChApp = {
    config: null,
    currentView: 'pricing',
    
    // Initialize application
    init(options) {
        console.log(`Ch Project ${ChConfig.version} - Initializing...`);
        this.config = { ...ChConfig, ...options };
        
        // Set up navigation
        this.setupNavigation();
        
        // Load initial view - Pricing is now default
        this.loadView('pricing');
        
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
            case 'workforce':
                return this.getWorkforceView();
            case 'feasibility':
                return this.getFeasibilityView();
            case 'management':
                return this.getManagementView();
            default:
                // Default to pricing if unknown view
                return this.getPricingView();
        }
    },
    
    // Pricing view - V2 with 2-level product hierarchy
    async getPricingView() {
        console.log('Loading Pricing V2 module with product hierarchy...');
        
        // Create container for pricing module
        const html = `
            <div id="pricing-container">
                <!-- Pricing V2 will be loaded here -->
            </div>
        `;
        
        // Load the pricing V2 module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if PricingV3 is already loaded
                if (typeof PricingV3 !== 'undefined') {
                    console.log('PricingV3 already loaded, initializing...');
                    PricingV3.init();
                    console.log('Pricing V3 initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/pricing/pricing_v3.js"]');
                if (existingScript) {
                    console.log('Pricing V3 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load pricing_v3.js module (with cost breakdown)
                const script = document.createElement('script');
                script.src = 'modules/pricing/pricing_v3.js';
                script.onload = () => {
                    console.log('Pricing V3 script loaded');
                    if (typeof PricingV3 !== 'undefined') {
                        PricingV3.init();
                        console.log('Pricing V3 initialized');
                    } else if (typeof PricingV2 !== 'undefined') {
                        // Fallback to V2
                        PricingV2.init();
                        console.log('Pricing V2 initialized (fallback)');
                    } else {
                        console.error('PricingV3 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load pricing_v2.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Pricing V2:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Planning view - V4 with expandable hierarchy (months → weeks → days)
    async getPlanningView() {
        console.log('Loading Planning V4 module with expandable hierarchy...');
        
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
    
    // Production Planning view - V3 Simplified (4 rows only)
    async getProductionPlanningView() {
        console.log('Loading Production Planning V3 Simplified module...');
        
        // Create container for production planning module
        const html = `
            <div id="production-planning-grid">
                <!-- Production Planning V3 Simplified will be loaded here -->
            </div>
        `;
        
        // Load the production planning module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if ProductionPlanningV3 is already loaded
                if (typeof ProductionPlanningV3 !== 'undefined') {
                    console.log('ProductionPlanningV3 already loaded, initializing...');
                    ProductionPlanningV3.init();
                    console.log('Production Planning V3 Simplified initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/production/production_planning_v3_simplified.js"]');
                if (existingScript) {
                    console.log('Production Planning V3 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load production_planning_v3_simplified.js module
                const script = document.createElement('script');
                script.src = 'modules/production/production_planning_v3_simplified.js';
                script.onload = () => {
                    console.log('Production Planning V3 Simplified script loaded');
                    if (typeof ProductionPlanningV3 !== 'undefined') {
                        ProductionPlanningV3.init();
                        console.log('Production Planning V3 Simplified initialized');
                    } else {
                        console.error('ProductionPlanningV3 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load production_planning_v3_simplified.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Production Planning V3:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Stock Report view - Now with two stock modules
    async getStockReportView() {
        console.log('Loading Stock modules...');
        
        // Create container with tabs for both stock types
        const html = `
            <div class="stock-module-container">
                <div class="stock-tabs">
                    <button class="stock-tab-btn active" onclick="ChApp.switchStockView('ready')">
                        📦 Ready Products
                    </button>
                    <button class="stock-tab-btn" onclick="ChApp.switchStockView('raw')">
                        🏭 Raw Materials
                    </button>
                </div>
                <div id="stock-report-container">
                    <!-- Stock modules will be loaded here -->
                </div>
            </div>
            <style>
                .stock-module-container {
                    padding: 20px;
                }
                .stock-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stock-tab-btn {
                    padding: 10px 20px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.3s;
                }
                .stock-tab-btn:hover {
                    background: #f0f0f0;
                }
                .stock-tab-btn.active {
                    background: #3498db;
                    color: white;
                    border-color: #3498db;
                }
            </style>
        `;
        
        // Load the default stock module (Ready Products) after DOM is ready
        setTimeout(() => {
            this.loadStockModule('ready');
        }, 100);
        
        return html;
    },
    
    // Switch between stock views
    switchStockView(type) {
        // Update tab buttons
        document.querySelectorAll('.stock-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Load the appropriate module
        this.loadStockModule(type);
    },
    
    // Load specific stock module
    async loadStockModule(type) {
        const container = document.getElementById('stock-report-container');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '<div class="loading">Loading...</div>';
        
        try {
            let moduleName, scriptPath, moduleObj;
            
            if (type === 'ready') {
                moduleName = 'StockReadyProducts';
                scriptPath = 'modules/stock/stock_ready_products.js';
                moduleObj = window.StockReadyProducts;
            } else if (type === 'raw') {
                moduleName = 'StockRawMaterials';
                scriptPath = 'modules/stock/stock_raw_materials.js';
                moduleObj = window.StockRawMaterials;
            }
            
            // Check if module is already loaded
            if (moduleObj) {
                console.log(`${moduleName} already loaded, re-initializing...`);
                // Clear loading message before init
                container.innerHTML = '';
                moduleObj.init();
                return;
            }
            
            // Check if script is already loading
            const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
            if (existingScript) {
                console.log(`${moduleName} script already in DOM, checking if loaded...`);
                // Try to init after a small delay
                setTimeout(() => {
                    const loadedModule = window[moduleName];
                    if (loadedModule) {
                        container.innerHTML = '';
                        loadedModule.init();
                        console.log(`${moduleName} initialized from existing script`);
                    }
                }, 100);
                return;
            }
            
            // Load the module script
            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = () => {
                console.log(`${moduleName} script loaded`);
                // Small delay to ensure script is fully evaluated
                setTimeout(() => {
                    const loadedModule = window[moduleName];
                    if (loadedModule) {
                        // Clear loading message before init
                        container.innerHTML = '';
                        loadedModule.init();
                        console.log(`${moduleName} initialized`);
                    } else {
                        console.error(`${moduleName} not found after loading script`);
                        container.innerHTML = `<div class="alert alert-error">Module ${moduleName} not found</div>`;
                    }
                }, 50);
            };
            script.onerror = (e) => {
                console.error(`Failed to load ${scriptPath}:`, e);
                container.innerHTML = `<div class="alert alert-error">Failed to load ${type} stock module</div>`;
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error loading stock module:', error);
            container.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
        }
    },
    
    // BOM view
    async getBOMView() {
        console.log('Loading BOM V2 Advanced module...');
        
        // Create container for BOM module
        const html = `
            <div id="bom-container">
                <!-- BOM V2 Advanced will be loaded here -->
            </div>
        `;
        
        // Load the BOM module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if BOMV2Advanced is already loaded
                if (typeof BOMV2Advanced !== 'undefined') {
                    console.log('BOMV2Advanced already loaded, initializing...');
                    BOMV2Advanced.init();
                    console.log('BOM V2 Advanced initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/bom/bom_v2_advanced.js"]');
                if (existingScript) {
                    console.log('BOM V2 Advanced script already in DOM, waiting for load...');
                    return;
                }
                
                // Load bom_v2_advanced.js module
                const script = document.createElement('script');
                script.src = 'modules/bom/bom_v2_advanced.js';
                script.onload = () => {
                    console.log('BOM V2 Advanced script loaded');
                    if (typeof BOMV2Advanced !== 'undefined') {
                        BOMV2Advanced.init();
                        console.log('BOM V2 Advanced initialized');
                    } else {
                        console.error('BOMV2Advanced not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load bom_v2_advanced.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading BOM V2 Advanced:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Feasibility view
    async getFeasibilityView() {
        console.log('Loading Production Feasibility module...');
        
        // Create container for feasibility module
        const html = `
            <div id="feasibility-container">
                <!-- Production Feasibility will be loaded here -->
            </div>
        `;
        
        // Load the feasibility module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if ProductionFeasibility is already loaded
                if (typeof ProductionFeasibility !== 'undefined') {
                    console.log('ProductionFeasibility already loaded, initializing...');
                    ProductionFeasibility.init();
                    console.log('Production Feasibility initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/feasibility/production_feasibility_v2.js"]');
                if (existingScript) {
                    console.log('Production Feasibility script already in DOM, waiting for load...');
                    // Try to init after a small delay
                    setTimeout(() => {
                        if (typeof ProductionFeasibility !== 'undefined') {
                            ProductionFeasibility.init();
                            console.log('Production Feasibility initialized from existing script');
                        }
                    }, 100);
                    return;
                }
                
                // Load production_feasibility_v2.js module (new version with expandable grid)
                const script = document.createElement('script');
                script.src = 'modules/feasibility/production_feasibility_v2.js';
                script.onload = () => {
                    console.log('Production Feasibility script loaded');
                    if (typeof ProductionFeasibility !== 'undefined') {
                        ProductionFeasibility.init();
                        console.log('Production Feasibility initialized');
                    } else {
                        console.error('ProductionFeasibility not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load production_feasibility.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Production Feasibility:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Workforce view
    async getWorkforceView() {
        console.log('Loading Workforce Availability module...');
        
        // Create container for workforce module
        const html = `
            <div id="workforce-container">
                <!-- Workforce Availability will be loaded here -->
            </div>
        `;
        
        // Load the workforce module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if WorkforceAvailability is already loaded
                if (typeof WorkforceAvailability !== 'undefined') {
                    console.log('WorkforceAvailability already loaded, initializing...');
                    WorkforceAvailability.init();
                    console.log('Workforce Availability initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/workforce/workforce_availability_v2.js"]');
                if (existingScript) {
                    console.log('Workforce Availability V2 script already in DOM, waiting for load...');
                    // Try to init after a small delay
                    setTimeout(() => {
                        if (typeof WorkforceAvailability !== 'undefined') {
                            WorkforceAvailability.init();
                            console.log('Workforce Availability initialized from existing script');
                        }
                    }, 100);
                    return;
                }
                
                // Load workforce_availability_v2.js module (new version matching Production Planning)
                const script = document.createElement('script');
                script.src = 'modules/workforce/workforce_availability_v2.js';
                script.onload = () => {
                    console.log('Workforce Availability V2 script loaded');
                    if (typeof WorkforceAvailability !== 'undefined') {
                        WorkforceAvailability.init();
                        console.log('Workforce Availability V2 initialized');
                    } else {
                        console.error('WorkforceAvailability not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load workforce_availability_v2.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Workforce Availability:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Management Summary view
    async getManagementView() {
        console.log('Loading Management Summary module...');
        
        // Create container for management module
        const html = `
            <div id="management-container">
                <!-- Management Summary will be loaded here -->
            </div>
        `;
        
        // Load the management module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if ManagementSummary is already loaded
                if (typeof ManagementSummary !== 'undefined') {
                    console.log('ManagementSummary already loaded, initializing...');
                    ManagementSummary.init();
                    console.log('Management Summary initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/management/management_summary.js"]');
                if (existingScript) {
                    console.log('Management Summary script already in DOM, waiting for load...');
                    setTimeout(() => {
                        if (typeof ManagementSummary !== 'undefined') {
                            ManagementSummary.init();
                            console.log('Management Summary initialized from existing script');
                        }
                    }, 100);
                    return;
                }
                
                // Load management_summary.js module
                const script = document.createElement('script');
                script.src = 'modules/management/management_summary.js';
                script.onload = () => {
                    console.log('Management Summary script loaded');
                    if (typeof ManagementSummary !== 'undefined') {
                        ManagementSummary.init();
                        console.log('Management Summary initialized');
                    } else {
                        console.error('ManagementSummary not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load management_summary.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Management Summary:', error);
            }
        }, 100);
        
        return html;
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
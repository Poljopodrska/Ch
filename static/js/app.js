// Ch Project Main Application
const ChApp = {
    // ===== CONFIGURATION =====
    FINANCE_PASSWORD_ENABLED: false,  // Set to true to enable Finance password protection
    FINANCE_PASSWORD: 'Marina',       // Password for Finance module
    // =========================

    config: null,
    currentView: 'pricing',

    // Initialize application
    init(options) {
        console.log(`Ch Project ${ChConfig.version} - Initializing...`);
        this.config = { ...ChConfig, ...options };
        
        // Set up navigation
        this.setupNavigation();
        
        // Update status
        this.updateStatus('Ready');
        
        console.log('Ch Project initialized successfully');
    },
    
    // Set up navigation handlers
    setupNavigation() {
        // Try to restore previous state from localStorage (page refresh persistence)
        const savedMainTab = localStorage.getItem('chCurrentMainTab');
        const savedSubTab = localStorage.getItem('chCurrentSubTab');

        this.currentMainTab = savedMainTab || 'production';
        this.currentSubTab = savedSubTab || 'production-planning';

        // Handle main tab clicks
        const mainTabs = document.querySelectorAll('.main-tab');
        mainTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const mainCategory = tab.getAttribute('data-main');
                this.switchMainTab(mainCategory);
            });
        });

        // Handle sub-tab clicks
        this.setupSubTabHandlers();

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.loadView(e.state.view, false);
            }
        });

        // Initialize with saved or default view
        if (savedMainTab && savedSubTab) {
            console.log(`Restoring previous state: ${savedMainTab} -> ${savedSubTab}`);
            this.switchMainTab(savedMainTab);
            // The switchMainTab will load the appropriate sub-tab
        } else {
            this.loadView('production-planning');
        }
    },
    
    setupSubTabHandlers() {
        const subTabs = document.querySelectorAll('.sub-tabs .nav-link');
        subTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const view = tab.getAttribute('data-view');
                this.loadView(view);
                
                // Update active state for sub-tabs
                subTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentSubTab = view;
            });
        });
    },
    
    switchMainTab(mainCategory) {
        // Special handling for Finance module - PASSWORD PROTECTION (can be disabled above)
        if (mainCategory === 'finance' && this.FINANCE_PASSWORD_ENABLED) {
            console.log('Finance tab clicked, checking authentication...');
            // Check if user is authenticated for Finance module
            if (!this.checkFinanceAuth()) {
                console.log('Not authenticated, showing password prompt...');
                // Show password prompt
                const password = prompt('Prosim, vnesite geslo za dostop do finančnega modula:');
                if (password !== this.FINANCE_PASSWORD) {
                    alert('Napačno geslo. Dostop zavrnjen.');
                    // Don't change tab
                    return;
                }
                // Store authentication time
                sessionStorage.setItem('financeAuthTime', Date.now().toString());
                console.log('Authentication successful');
            } else {
                console.log('Already authenticated');
            }
        }
        
        // Now update the current tab
        this.currentMainTab = mainCategory;

        // Save state to localStorage for page refresh persistence
        localStorage.setItem('chCurrentMainTab', mainCategory);

        // Update main tab active state
        const mainTabs = document.querySelectorAll('.main-tab');
        mainTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-main') === mainCategory) {
                tab.classList.add('active');
            }
        });

        // Update sub-tabs based on main category
        this.renderSubTabs(mainCategory);
    },
    
    renderSubTabs(mainCategory) {
        const subTabsContainer = document.getElementById('sub-tabs');
        let subTabsHTML = '';
        
        switch (mainCategory) {
            case 'sales':
                subTabsHTML = `
                    <button class="nav-link active" data-view="crm">
                        <span class="nav-text">CRM</span>
                    </button>
                    <button class="nav-link" data-view="pricing">
                        <span class="nav-text">Cene</span>
                    </button>
                    <button class="nav-link" data-view="planning">
                        <span class="nav-text">Načrtovanje prodaje</span>
                    </button>
                `;
                this.currentSubTab = 'crm';
                break;

            case 'production':
                subTabsHTML = `
                    <button class="nav-link active" data-view="production-planning">
                        <span class="nav-text">Načrtovanje proizvodnje</span>
                    </button>
                    <button class="nav-link" data-view="stock-report">
                        <span class="nav-text">Poročilo o zalogi</span>
                    </button>
                    <button class="nav-link" data-view="bom">
                        <span class="nav-text">Kosovnica</span>
                    </button>
                    <button class="nav-link" data-view="workforce">
                        <span class="nav-text">Delovna sila</span>
                    </button>
                    <button class="nav-link" data-view="feasibility">
                        <span class="nav-text">Izvedljivost</span>
                    </button>
                `;
                this.currentSubTab = 'production-planning';
                break;

            case 'management':
                subTabsHTML = `
                    <button class="nav-link active" data-view="management-production">
                        <span class="nav-text">Analitika proizvodnje</span>
                    </button>
                    <button class="nav-link" data-view="management-sales">
                        <span class="nav-text">Prodaja in marža</span>
                    </button>
                `;
                this.currentSubTab = 'management-production';
                break;
                
            case 'finance':
                // Finance is already authenticated in switchMainTab
                subTabsHTML = `
                    <button class="nav-link active" data-view="finance-overview">
                        <span class="nav-text">V delu</span>
                    </button>
                    <button class="nav-link" data-view="finance-cf">
                        <span class="nav-text">Denarni tok</span>
                    </button>
                `;
                this.currentSubTab = 'finance-overview';
                break;

            case 'nabava':
                subTabsHTML = `
                    <button class="nav-link active" data-view="suppliers">
                        <span class="nav-text">Dobavitelji</span>
                    </button>
                `;
                this.currentSubTab = 'suppliers';
                break;
        }
        
        subTabsContainer.innerHTML = subTabsHTML;
        
        // Set up event handlers for new sub-tabs
        this.setupSubTabHandlers();
        
        // Load the default view for this category
        this.loadView(this.currentSubTab);
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
            this.currentSubTab = viewName;

            // Save sub-tab state to localStorage for page refresh persistence
            localStorage.setItem('chCurrentSubTab', viewName);

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
            case 'crm':
                return this.getCRMView();
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
            case 'management-production':
                return this.getManagementProductionView();
            case 'management-sales':
                return this.getManagementSalesView();
            case 'finance-overview':
                return this.getFinanceOverviewView();
            case 'finance-cf':
                return this.getFinanceCFView();
            case 'finance-payments':
                return this.getFinancePaymentsView();
            case 'suppliers':
                return this.getSuppliersView();
            default:
                // Default to production planning if unknown view
                return this.getProductionPlanningView();
        }
    },
    
    // Pricing view - V4 with Price Levels (LC, C0, Cmin, CP)
    async getPricingView() {
        console.log('Loading Pricing V4 module with price levels...');

        // Create container for pricing module
        const html = `
            <div id="pricing-container">
                <!-- Pricing V4 will be loaded here -->
            </div>
        `;

        // Load the pricing V4 module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if PricingV4 is already loaded
                if (typeof PricingV4 !== 'undefined') {
                    console.log('PricingV4 already loaded, initializing...');
                    PricingV4.init();
                    console.log('Pricing V4 initialized');
                    return;
                }

                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/pricing/pricing_v4_price_levels.js"]');
                if (existingScript) {
                    console.log('Pricing V4 script already in DOM, waiting for load...');
                    return;
                }

                // Load pricing_v4_price_levels.js module (with price level system)
                const script = document.createElement('script');
                script.src = 'modules/pricing/pricing_v4_price_levels.js';
                script.onload = () => {
                    console.log('Pricing V4 script loaded');
                    if (typeof PricingV4 !== 'undefined') {
                        PricingV4.init();
                        console.log('Pricing V4 initialized');
                    } else if (typeof PricingV3 !== 'undefined') {
                        // Fallback to V3
                        PricingV3.init();
                        console.log('Pricing V3 initialized (fallback)');
                    } else {
                        console.error('PricingV4 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load pricing_v4_price_levels.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Pricing V2:', error);
            }
        }, 100);
        
        return html;
    },
    
    // CRM view
    async getCRMView() {
        console.log('Loading CRM module...');
        
        const html = `
            <div id="crm-container">
                <!-- CRM will be loaded here -->
            </div>
        `;
        
        // Load the CRM module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if CustomerCRM is already loaded
                if (typeof CustomerCRM !== 'undefined') {
                    console.log('CustomerCRM already loaded, initializing...');
                    CustomerCRM.init();
                    console.log('CRM initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/crm/customer_crm.js"]');
                if (existingScript) {
                    console.log('CRM script already in DOM, waiting for load...');
                    return;
                }
                
                // Load customer_crm.js module
                const script = document.createElement('script');
                script.src = 'modules/crm/customer_crm.js';
                script.onload = () => {
                    console.log('CRM script loaded');
                    if (typeof CustomerCRM !== 'undefined') {
                        CustomerCRM.init();
                        console.log('CRM initialized');
                        
                        // Also initialize CRM for integration mode
                        CustomerCRM.init({ integrationMode: true });
                    } else {
                        console.error('CustomerCRM not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load customer_crm.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading CRM:', error);
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
                        Ready Products
                    </button>
                    <button class="stock-tab-btn" onclick="ChApp.switchStockView('raw')">
                        Raw Materials
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
                    background: var(--ch-primary);
                    color: white;
                    border-color: var(--ch-primary);
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
    
    // Management Production Analytics view (direct to Production Analytics)
    async getManagementProductionView() {
        console.log('Loading Management Production Analytics...');
        
        const html = `
            <div id="management-container">
                <!-- Production Analytics will be loaded here -->
            </div>
        `;
        
        // Load ProductionAnalytics directly
        setTimeout(async () => {
            try {
                if (typeof ProductionAnalytics !== 'undefined') {
                    ProductionAnalytics.init();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = 'modules/management/production_analytics.js';
                script.onload = () => {
                    if (typeof ProductionAnalytics !== 'undefined') {
                        ProductionAnalytics.init();
                    }
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Production Analytics:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Management Sales & Margin view (placeholder)
    async getManagementSalesView() {
        console.log('Loading Management Sales & Margin...');
        
        const html = `
            <div id="management-container">
                <div class="coming-soon-container">
                    <div class="coming-soon-header">
                        <h1>Sales & Margin Analytics</h1>
                        <p class="header-subtitle">Comprehensive sales performance and margin analysis</p>
                    </div>
                    
                    <div class="coming-soon-content">
                        <h2>Coming Soon</h2>
                        <p>Sales & Margin analytics module is under development</p>

                        <div class="planned-features">
                            <h3>Planned Features:</h3>
                            <ul>
                                <li>Revenue tracking and analysis</li>
                                <li>Margin analysis by product and category</li>
                                <li>Customer insights and segmentation</li>
                                <li>Sales trend analysis</li>
                                <li>Performance vs targets</li>
                                <li>Profitability reports</li>
                            </ul>
                        </div>
                        
                        <div class="navigation-hint">
                            <p>Use the <strong>Sales</strong> tab above to access Pricing and Sales Planning modules.</p>
                        </div>
                    </div>
                </div>
                
                <style>
                    .coming-soon-container {
                        padding: 30px;
                        max-width: 800px;
                        margin: 0 auto;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    
                    .coming-soon-header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 25px;
                        background: var(--ch-primary);
                        color: white;
                        border-radius: 10px;
                    }
                    
                    .coming-soon-header h1 {
                        margin: 0 0 10px 0;
                        font-size: 32px;
                    }
                    
                    .header-subtitle {
                        margin: 0;
                        opacity: 0.9;
                        font-size: 18px;
                    }
                    
                    .coming-soon-content {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    
                    .coming-soon-icon {
                        font-size: 80px;
                        margin-bottom: 20px;
                    }
                    
                    .coming-soon-content h2 {
                        color: #2c3e50;
                        margin-bottom: 10px;
                        font-size: 28px;
                    }
                    
                    .coming-soon-content > p {
                        color: #7f8c8d;
                        margin-bottom: 30px;
                        font-size: 16px;
                    }
                    
                    .planned-features {
                        background: #f8f9fa;
                        padding: 25px;
                        border-radius: 8px;
                        margin: 30px 0;
                        text-align: left;
                    }
                    
                    .planned-features h3 {
                        color: #2c3e50;
                        margin-bottom: 15px;
                        text-align: center;
                    }
                    
                    .planned-features ul {
                        list-style: none;
                        padding: 0;
                    }
                    
                    .planned-features li {
                        padding: 8px 0;
                        color: #546e7a;
                        font-size: 15px;
                    }
                    
                    .navigation-hint {
                        background: var(--ch-primary-pale);
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid var(--ch-primary);
                        margin-top: 20px;
                    }

                    .navigation-hint p {
                        margin: 0;
                        color: var(--ch-primary-dark);
                        font-size: 14px;
                    }
                </style>
            </div>
        `;
        
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
    },
    
    // Finance authentication methods
    checkFinanceAuth() {
        // Check if user is authenticated (session storage for current session only)
        const authTime = sessionStorage.getItem('financeAuthTime');
        if (authTime) {
            const elapsed = Date.now() - parseInt(authTime);
            // Session valid for 30 minutes
            if (elapsed < 30 * 60 * 1000) {
                return true;
            }
        }
        return false;
    },
    
    
    // Finance view methods
    async getFinanceOverviewView() {
        const html = `
            <div id="finance-overview-content">
                <!-- Finance Matching Module will be loaded here -->
            </div>
        `;
        
        // Load the Finance Matching module after DOM is ready
        setTimeout(() => {
            // Check if FinanceMatching is already loaded
            if (typeof FinanceMatching !== 'undefined') {
                console.log('FinanceMatching already loaded, initializing...');
                FinanceMatching.init();
                return;
            }
            
            // Load finance_matching.js module with cache busting
            const script = document.createElement('script');
            script.src = 'modules/finance/finance_matching.js?v=' + Date.now();
            script.onload = () => {
                console.log('Finance Matching module loaded');
                if (typeof FinanceMatching !== 'undefined') {
                    FinanceMatching.init();
                } else {
                    console.error('FinanceMatching not found after loading script');
                }
            };
            script.onerror = (e) => {
                console.error('Failed to load finance_matching.js:', e);
            };
            document.head.appendChild(script);
        }, 100);
        
        return html;
    },
    
    async getFinanceCFView() {
        console.log('Loading Cash Flow module...');

        const html = `
            <div id="cashflow-container">
                <!-- Cash Flow module will be loaded here -->
            </div>
        `;

        // Load the Cash Flow module after DOM is ready
        setTimeout(() => {
            // Check if CashFlow is already loaded
            if (typeof CashFlow !== 'undefined') {
                console.log('CashFlow already loaded, initializing...');
                CashFlow.init();
                return;
            }

            // Load cashflow.js module
            const script = document.createElement('script');
            script.src = 'modules/finance/cashflow.js?v=' + Date.now();
            script.onload = () => {
                console.log('Cash Flow module loaded');
                if (typeof CashFlow !== 'undefined') {
                    CashFlow.init();
                } else {
                    console.error('CashFlow not found after loading script');
                }
            };
            script.onerror = (e) => {
                console.error('Failed to load cashflow.js:', e);
            };
            document.head.appendChild(script);
        }, 100);

        return html;
    },

    async getFinancePaymentsView() {
        console.log('Loading Payment Manager module...');

        const html = `
            <div id="payment-manager-container">
                <!-- Payment Manager module will be loaded here -->
            </div>
        `;

        // Load the Payment Manager module after DOM is ready
        setTimeout(() => {
            // Check if PaymentManager is already loaded
            if (typeof PaymentManager !== 'undefined') {
                console.log('PaymentManager already loaded, initializing...');
                PaymentManager.init();
                return;
            }

            // Load payment-manager.js module
            const script = document.createElement('script');
            script.src = 'modules/finance/payment-manager.js?v=' + Date.now();
            script.onload = () => {
                console.log('Payment Manager module loaded');
                if (typeof PaymentManager !== 'undefined') {
                    PaymentManager.init();
                } else {
                    console.error('PaymentManager not found after loading script');
                }
            };
            script.onerror = (e) => {
                console.error('Failed to load payment-manager.js:', e);
            };
            document.head.appendChild(script);
        }, 100);

        return html;
    },

    // Suppliers view
    async getSuppliersView() {
        console.log('Loading Suppliers module...');

        const html = `
            <div id="suppliers-container">
                <!-- Suppliers module will be loaded here -->
            </div>
        `;

        setTimeout(async () => {
            const script = document.createElement('script');
            script.src = 'modules/procurement/suppliers.js?v=' + Date.now();
            script.onload = () => {
                console.log('Suppliers module loaded');
                if (typeof SuppliersModule !== 'undefined') {
                    SuppliersModule.init();
                } else {
                    console.error('SuppliersModule not found after loading script');
                }
            };
            script.onerror = (e) => {
                console.error('Failed to load suppliers.js:', e);
            };
            document.head.appendChild(script);
        }, 100);

        return html;
    }
};
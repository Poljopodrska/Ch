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
            default:
                // Default to pricing if unknown view
                return this.getPricingView();
        }
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
    
    // Planning view - Now with V5 Editable functionality
    async getPlanningView() {
        console.log('Loading Planning V5 Editable module...');
        
        // Create container for planning module
        const html = `
            <div id="planning-grid">
                <!-- Planning V5 Editable will be loaded here -->
            </div>
        `;
        
        // Load the planning V5 editable module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if PlanningV5Editable is already loaded
                if (typeof PlanningV5Editable !== 'undefined') {
                    console.log('PlanningV5Editable already loaded, initializing...');
                    PlanningV5Editable.init();
                    console.log('Planning V5 Editable initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/planning/planning_v5_editable.js"]');
                if (existingScript) {
                    console.log('Planning V5 Editable script already in DOM, waiting for load...');
                    return;
                }
                
                // Load planning_v5_editable.js module
                const script = document.createElement('script');
                script.src = 'modules/planning/planning_v5_editable.js';
                script.onload = () => {
                    console.log('Planning V5 Editable script loaded');
                    if (typeof PlanningV5Editable !== 'undefined') {
                        PlanningV5Editable.init();
                        console.log('Planning V5 Editable initialized');
                    } else {
                        console.error('PlanningV5Editable not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load planning_v5_editable.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Planning V5 Editable:', error);
            }
        }, 100);
        
        return html;
    },
    
    // Production Planning view
    async getProductionPlanningView() {
        console.log('Loading Production Planning V2 module...');
        
        // Create container for production planning module
        const html = `
            <div id="production-planning-grid">
                <!-- Production Planning V2 will be loaded here -->
            </div>
        `;
        
        // Load the production planning module after DOM is ready
        setTimeout(async () => {
            try {
                // Check if ProductionPlanningV2 is already loaded
                if (typeof ProductionPlanningV2 !== 'undefined') {
                    console.log('ProductionPlanningV2 already loaded, initializing...');
                    ProductionPlanningV2.init();
                    console.log('Production Planning V2 initialized');
                    return;
                }
                
                // Check if script is already loading
                const existingScript = document.querySelector('script[src="modules/production/production_planning_v2.js"]');
                if (existingScript) {
                    console.log('Production Planning V2 script already in DOM, waiting for load...');
                    return;
                }
                
                // Load production_planning_v2.js module
                const script = document.createElement('script');
                script.src = 'modules/production/production_planning_v2.js';
                script.onload = () => {
                    console.log('Production Planning V2 script loaded');
                    if (typeof ProductionPlanningV2 !== 'undefined') {
                        ProductionPlanningV2.init();
                        console.log('Production Planning V2 initialized');
                    } else {
                        console.error('ProductionPlanningV2 not found after loading script');
                    }
                };
                script.onerror = (e) => {
                    console.error('Failed to load production_planning_v2.js:', e);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading Production Planning V2:', error);
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
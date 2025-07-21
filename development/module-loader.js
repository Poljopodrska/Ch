// Development Module Loader for file:// protocol
// This allows modular development while maintaining production structure

window.ModuleLoader = {
    // Cache for loaded modules
    cache: {},
    
    // Check if we're in development mode
    isDevelopment() {
        return window.location.protocol === 'file:' || 
               window.location.hostname === 'localhost';
    },
    
    // Load module HTML content
    async loadModuleHTML(moduleName) {
        const cacheKey = `${moduleName}_html`;
        
        // Return cached version if available
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        if (this.isDevelopment() && window.location.protocol === 'file:') {
            // For file:// protocol, we need to use embedded content
            // This will be populated by module bundles
            if (window.ModuleContent && window.ModuleContent[moduleName]) {
                this.cache[cacheKey] = window.ModuleContent[moduleName].html;
                return this.cache[cacheKey];
            } else {
                throw new Error(`Module ${moduleName} not found. Make sure the module bundle is loaded.`);
            }
        } else {
            // For HTTP(S), use fetch normally
            try {
                const response = await fetch(`modules/${moduleName}/${moduleName}.html`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const html = await response.text();
                this.cache[cacheKey] = html;
                return html;
            } catch (error) {
                throw new Error(`Failed to load module ${moduleName}: ${error.message}`);
            }
        }
    },
    
    // Initialize a module after loading
    async initializeModule(moduleName) {
        // Convert module name to proper case (pricing -> Pricing)
        const moduleObjectName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        
        // Check if module object exists
        if (window[moduleObjectName] && typeof window[moduleObjectName].init === 'function') {
            try {
                await window[moduleObjectName].init();
                console.log(`Module ${moduleName} initialized successfully`);
            } catch (error) {
                console.error(`Error initializing module ${moduleName}:`, error);
            }
        }
    },
    
    // Main load function
    async load(moduleName) {
        try {
            const html = await this.loadModuleHTML(moduleName);
            
            // Wait a bit for DOM to settle before initializing
            setTimeout(() => {
                this.initializeModule(moduleName);
            }, 100);
            
            return html;
        } catch (error) {
            console.error(`Module loading error:`, error);
            throw error;
        }
    }
};

// Initialize module content storage
window.ModuleContent = window.ModuleContent || {};
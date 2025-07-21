// Auto-generated bundle for legacy meat planner module
// This file is for development mode only (file:// protocol)

(function() {
    // Ensure ModuleContent exists
    window.ModuleContent = window.ModuleContent || {};
    
    // Embed the legacy meat planner module HTML content
    window.ModuleContent['meat-planner-legacy'] = {
        html: `<!-- Legacy Meat Production Planner Module -->
<div class="legacy-module-container">
    <!-- Legacy Warning Notice -->
    <div class="legacy-notice">
        <span class="icon-warning">⚠️</span>
        <div>
            <strong>Temporary Legacy Module</strong> - This will be replaced with the integrated Ch Production Planning system.
            Data is stored locally and may not sync with other Ch modules.
        </div>
    </div>
    
    <!-- Iframe Container -->
    <div class="iframe-container">
        <div class="iframe-loading" id="iframe-loading">
            <div class="spinner"></div>
            <span>Loading Meat Production Planner...</span>
        </div>
        
        <iframe 
            id="meat-planner-frame"
            src="meat-production-planner/standalone-app.html"
            frameborder="0"
            width="100%"
            height="700px"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            onload="LegacyMeatPlanner.onIframeLoaded()"
            onerror="LegacyMeatPlanner.onIframeError()">
            <p>Your browser does not support iframes. Please update to a modern browser to use the Legacy Meat Planner.</p>
        </iframe>
    </div>
    
    <!-- Migration Information -->
    <div class="migration-info">
        <h4>🚀 Migration to Ch Production Planning</h4>
        <p><strong>Current Status:</strong> This legacy module provides immediate access to meat production planning while we develop the integrated Ch solution.</p>
        <ul>
            <li><strong>Data Storage:</strong> Uses local browser storage (data stays on your computer)</li>
            <li><strong>Features:</strong> Full meat production planning, cost analysis, and worker scheduling</li>
            <li><strong>Migration Path:</strong> Data will be migrated to PostgreSQL when the new system is ready</li>
            <li><strong>Timeline:</strong> Planned replacement with native Ch module by Q2 2025</li>
        </ul>
    </div>
</div>

<script>
// Legacy Meat Planner Integration
window.LegacyMeatPlanner = {
    onIframeLoaded() {
        console.log('Legacy Meat Planner loaded successfully');
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('iframe-loading');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 1000);
        }
        
        // Try to establish communication with iframe
        this.setupIframeCommunication();
    },
    
    onIframeError() {
        console.error('Failed to load Legacy Meat Planner');
        
        const loadingOverlay = document.getElementById('iframe-loading');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = \`
                <span style="color: #d32f2f;">❌</span>
                <span>Failed to load Legacy Meat Planner. Please check the file path.</span>
            \`;
        }
    },
    
    setupIframeCommunication() {
        // Listen for messages from the iframe
        window.addEventListener('message', (event) => {
            // Only accept messages from our iframe
            const iframe = document.getElementById('meat-planner-frame');
            if (event.source !== iframe.contentWindow) return;
            
            console.log('Message from Legacy Meat Planner:', event.data);
            
            // Handle different message types
            switch (event.data.type) {
                case 'data_export':
                    this.handleDataExport(event.data.payload);
                    break;
                case 'user_action':
                    this.logUserAction(event.data.payload);
                    break;
                default:
                    console.log('Unknown message type:', event.data.type);
            }
        });
        
        // Send initialization message to iframe
        setTimeout(() => {
            const iframe = document.getElementById('meat-planner-frame');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'ch_integration_init',
                    source: 'ch_parent',
                    config: {
                        version: '0.1.0',
                        mode: 'legacy_integration'
                    }
                }, '*');
            }
        }, 2000);
    },
    
    handleDataExport(data) {
        console.log('Handling data export from Legacy Meat Planner:', data);
        
        // In future, this could sync data to PostgreSQL
        // For now, just log the action
        if (window.ChApp && window.ChApp.updateStatus) {
            window.ChApp.updateStatus('Legacy data exported');
        }
    },
    
    logUserAction(action) {
        console.log('Legacy Meat Planner user action:', action);
        
        // Track usage for migration planning
        const usageData = JSON.parse(localStorage.getItem('ch_legacy_usage') || '[]');
        usageData.push({
            timestamp: new Date().toISOString(),
            action: action,
            module: 'meat_planner_legacy'
        });
        
        // Keep only last 100 actions
        if (usageData.length > 100) {
            usageData.splice(0, usageData.length - 100);
        }
        
        localStorage.setItem('ch_legacy_usage', JSON.stringify(usageData));
    },
    
    // Method to extract data for migration (can be called from Ch console)
    extractLegacyData() {
        const iframe = document.getElementById('meat-planner-frame');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'ch_extract_data',
                source: 'ch_parent'
            }, '*');
        }
    },
    
    // Check if legacy module is responsive
    healthCheck() {
        const iframe = document.getElementById('meat-planner-frame');
        if (!iframe) return false;
        
        try {
            // Check if iframe is loaded and responsive
            return iframe.contentDocument !== null;
        } catch (e) {
            console.warn('Legacy module health check failed:', e);
            return false;
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Legacy Meat Planner module initialized');
    });
} else {
    console.log('Legacy Meat Planner module initialized');
}
</script>`
    };
    
    console.log('Legacy Meat Planner module bundle loaded');
})();
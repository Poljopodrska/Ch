// Ch Project Version Management
// Dynamic version loading to prevent hardcoding (Constitutional Requirement)

const ChVersion = {
    // Current version - should match package.json
    current: '0.3.2',
    
    // Build and deployment info
    buildId: null,
    deploymentId: null,
    deploymentTime: null,
    
    // Initialize version system
    async init() {
        try {
            // Try to get version from API if in production
            if (window.location.protocol !== 'file:') {
                const response = await fetch('/version');
                if (response.ok) {
                    const data = await response.json();
                    // Parse version string (e.g., "v0.2.0-build123")
                    const versionMatch = data.version.match(/v?(\d+\.\d+\.\d+)(?:-(.+))?/);
                    if (versionMatch) {
                        this.current = versionMatch[1];
                        this.buildId = versionMatch[2] || 'unknown';
                    }
                }
            }
            
            // Update all version displays
            this.updateDisplay();
            
        } catch (error) {
            console.warn('Could not fetch version from API, using default:', error);
            this.updateDisplay();
        }
    },
    
    // Update version display in UI
    updateDisplay() {
        // Update all elements with class 'version-display'
        const versionElements = document.querySelectorAll('.version-display');
        versionElements.forEach(element => {
            element.textContent = `v${this.current}`;
        });
        
        // Update with build info if available
        const fullVersionElements = document.querySelectorAll('.version-full');
        fullVersionElements.forEach(element => {
            let fullVersion = `v${this.current}`;
            if (this.buildId && this.buildId !== 'unknown' && this.buildId !== 'local') {
                fullVersion += `-${this.buildId}`;
            }
            element.textContent = fullVersion;
        });
        
        // Update deployment info if available
        const deploymentElements = document.querySelectorAll('.deployment-info');
        deploymentElements.forEach(element => {
            if (this.deploymentId) {
                element.textContent = `Deployment: ${this.deploymentId}`;
            }
        });
    },
    
    // Get formatted version string
    getVersionString() {
        let version = `v${this.current}`;
        if (this.buildId && this.buildId !== 'local') {
            version += `-${this.buildId}`;
        }
        return version;
    },
    
    // Get full version info object
    getVersionInfo() {
        return {
            version: this.current,
            buildId: this.buildId,
            deploymentId: this.deploymentId,
            deploymentTime: this.deploymentTime,
            formatted: this.getVersionString()
        };
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChVersion.init());
} else {
    ChVersion.init();
}

// Export for use in other modules
window.ChVersion = ChVersion;
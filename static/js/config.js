// Ch Project Configuration
const ChConfig = {
    version: '0.5.1', // Should match package.json
    mode: window.location.protocol === 'file:' ? 'development' : 'production',
    api: {
        development: 'mock://', // Uses mock_api.js
        production: '/api/v1'   // Future ECS endpoint
    },
    features: {
        modules: true,
        settings: true,
        about: true,
        dashboard: true
    },
    ui: {
        theme: 'default',
        animations: true,
        autoSave: false
    },
    development: {
        mockDelay: 300, // Simulate API delay in ms
        debugMode: true,
        showErrors: true
    }
};

// Freeze configuration to prevent modifications
Object.freeze(ChConfig);
Object.freeze(ChConfig.api);
Object.freeze(ChConfig.features);
Object.freeze(ChConfig.ui);
Object.freeze(ChConfig.development);
// Ch Project Configuration
const ChConfig = {
    version: '0.6.2', // Should match package.json
    mode: window.location.protocol === 'file:' ? 'development' : 'production',
    api: {
        development: 'mock://', // Uses mock_api.js
        production: window.location.protocol === 'file:' ? 'mock://' : `http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/api/v1`   // Backend via load balancer
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
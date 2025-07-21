// Mock API for Ch Project Development Mode
const MockAPI = {
    // Simulate API delay
    async delay(ms = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Get dashboard data
    async getDashboardData() {
        await this.delay();
        return {
            activeModules: 5,
            totalOperations: 1847,
            lastUpdate: new Date().toLocaleString(),
            recentActivity: [
                { time: '1 min ago', action: 'BOM calculation completed', status: 'success' },
                { time: '3 min ago', action: 'Production requirements updated', status: 'success' },
                { time: '5 min ago', action: 'Module initialized', status: 'success' },
                { time: '8 min ago', action: 'Configuration updated', status: 'success' },
                { time: '12 min ago', action: 'Health check passed', status: 'success' }
            ]
        };
    },
    
    // Get modules list
    async getModules() {
        await this.delay();
        return [
            {
                id: 'pricing',
                name: 'Pricing Tool',
                description: 'Smart Excel system for production planning and cost analysis',
                icon: '💰',
                status: 'active'
            },
            {
                id: 'production-planning',
                name: 'BOM & Production',
                description: 'Multi-level BOM with yield tracking and backwards calculation',
                icon: '🏭',
                status: 'active'
            },
            {
                id: 'planning',
                name: 'Planning Tool',
                description: 'Historical data and future production planning',
                icon: '📅',
                status: 'active'
            },
            {
                id: 'core',
                name: 'Core System',
                description: 'Essential system functions and utilities',
                icon: '🔧',
                status: 'active'
            },
            {
                id: 'analytics',
                name: 'Analytics',
                description: 'Data analysis and reporting module',
                icon: '📊',
                status: 'active'
            },
            {
                id: 'integration',
                name: 'Integration',
                description: 'External system connectors',
                icon: '🔌',
                status: 'active'
            },
            {
                id: 'automation',
                name: 'Automation',
                description: 'Workflow automation engine',
                icon: '🤖',
                status: 'active'
            },
            {
                id: 'security',
                name: 'Security',
                description: 'Access control and encryption',
                icon: '🔐',
                status: 'inactive'
            },
            {
                id: 'reporting',
                name: 'Reporting',
                description: 'Custom report generation',
                icon: '📝',
                status: 'inactive'
            }
        ];
    },
    
    // Get module details
    async getModuleDetails(moduleId) {
        await this.delay();
        const modules = await this.getModules();
        const module = modules.find(m => m.id === moduleId);
        
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }
        
        return {
            ...module,
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            configuration: {
                enabled: module.status === 'active',
                autoStart: true,
                priority: 'normal'
            },
            metrics: {
                uptime: '99.9%',
                requests: Math.floor(Math.random() * 10000),
                errors: Math.floor(Math.random() * 10),
                avgResponseTime: Math.floor(Math.random() * 100) + 'ms'
            }
        };
    },
    
    // Save settings (mock)
    async saveSettings(settings) {
        await this.delay(500); // Simulate longer operation
        console.log('Mock: Saving settings', settings);
        return {
            success: true,
            message: 'Settings saved successfully'
        };
    },
    
    // Health check
    async healthCheck() {
        await this.delay();
        return {
            status: 'healthy',
            version: ChConfig.version,
            mode: ChConfig.mode,
            timestamp: new Date().toISOString(),
            services: {
                core: 'operational',
                database: 'mock',
                cache: 'mock',
                queue: 'mock'
            }
        };
    }
};

// Make MockAPI available globally
window.MockAPI = MockAPI;
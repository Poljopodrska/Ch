// Management Summary Landing Page Module
const ManagementSummary = {
    VERSION: '1.0.0',
    
    state: {
        currentView: 'landing', // 'landing', 'production', 'sales'
    },
    
    init() {
        console.log(`Management Summary Module V${this.VERSION} initializing...`);
        this.render();
    },
    
    render() {
        const container = document.getElementById('management-container');
        if (!container) return;
        
        switch(this.state.currentView) {
            case 'production':
                this.renderProductionView();
                break;
            case 'sales':
                this.renderSalesView();
                break;
            default:
                this.renderLandingPage();
        }
    },
    
    renderLandingPage() {
        const container = document.getElementById('management-container');
        
        container.innerHTML = `
            <div class="management-summary-container">
                <div class="management-header">
                    <h1>[Chart] Management Summary</h1>
                    <p class="header-subtitle">Executive dashboards and analytics</p>
                </div>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card production-card" onclick="ManagementSummary.openProduction()">
                        <div class="card-icon">[Factory]</div>
                        <div class="card-content">
                            <h2>Production</h2>
                            <p>Production analytics, KPIs, and performance tracking</p>
                            <ul class="feature-list">
                                <li>✓ Actual vs Plan comparison</li>
                                <li>✓ Daily production charts</li>
                                <li>✓ Product & group analysis</li>
                                <li>✓ Period summaries</li>
                            </ul>
                        </div>
                        <div class="card-action">
                            <span>Open Dashboard →</span>
                        </div>
                    </div>
                    
                    <div class="dashboard-card sales-card" onclick="ManagementSummary.openSales()">
                        <div class="card-icon">[Money]</div>
                        <div class="card-content">
                            <h2>Sales & Margin</h2>
                            <p>Sales performance, margins, and revenue analytics</p>
                            <ul class="feature-list">
                                <li>✓ Revenue tracking</li>
                                <li>✓ Margin analysis</li>
                                <li>✓ Customer insights</li>
                                <li>✓ Trend analysis</li>
                            </ul>
                        </div>
                        <div class="card-action">
                            <span>Open Dashboard →</span>
                        </div>
                    </div>
                </div>
                
                <div class="quick-stats">
                    <h3>Today's Snapshot</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${this.getTodayProduction()}</div>
                            <div class="stat-label">Units Produced</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getTodayEfficiency()}%</div>
                            <div class="stat-label">Efficiency</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getTodaySales()}</div>
                            <div class="stat-label">Sales (€)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getTodayMargin()}%</div>
                            <div class="stat-label">Avg Margin</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.getLandingStyles()}
        `;
    },
    
    renderProductionView() {
        // This will be handled by the production analytics module
        if (typeof ProductionAnalytics !== 'undefined') {
            ProductionAnalytics.init();
        } else {
            this.loadProductionModule();
        }
    },
    
    renderSalesView() {
        const container = document.getElementById('management-container');
        
        container.innerHTML = `
            <div class="management-summary-container">
                <div class="management-header">
                    <button class="back-button" onclick="ManagementSummary.backToLanding()">
                        ← Back to Summary
                    </button>
                    <h1>[Money] Sales & Margin Analytics</h1>
                </div>
                
                <div class="coming-soon">
                    <div class="coming-soon-icon">[Warning]</div>
                    <h2>Coming Soon</h2>
                    <p>Sales & Margin analytics module is under development</p>
                    <button class="btn-primary" onclick="ManagementSummary.backToLanding()">
                        Back to Dashboard
                    </button>
                </div>
            </div>
            
            ${this.getCommonStyles()}
        `;
    },
    
    openProduction() {
        this.state.currentView = 'production';
        this.render();
    },
    
    openSales() {
        this.state.currentView = 'sales';
        this.render();
    },
    
    backToLanding() {
        this.state.currentView = 'landing';
        this.render();
    },
    
    loadProductionModule() {
        const script = document.createElement('script');
        script.src = 'modules/management/production_analytics.js';
        script.onload = () => {
            if (typeof ProductionAnalytics !== 'undefined') {
                ProductionAnalytics.init();
            }
        };
        document.head.appendChild(script);
    },
    
    // Helper methods for quick stats
    getTodayProduction() {
        // Would get from actual data
        return '1,245';
    },
    
    getTodayEfficiency() {
        return '92';
    },
    
    getTodaySales() {
        return '45,670';
    },
    
    getTodayMargin() {
        return '24.5';
    },
    
    getLandingStyles() {
        return `
            <style>
                .management-summary-container {
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .management-header {
                    text-align: center;
                    margin-bottom: 40px;
                    position: relative;
                }
                
                .management-header h1 {
                    font-size: 36px;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                .header-subtitle {
                    color: #7f8c8d;
                    font-size: 18px;
                }
                
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 30px;
                    margin-bottom: 40px;
                }
                
                .dashboard-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    position: relative;
                    overflow: hidden;
                }
                
                .dashboard-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                
                .production-card {
                    border-color: #3498db;
                    background: linear-gradient(135deg, #fff 0%, #e3f2fd 100%);
                }
                
                .production-card:hover {
                    border-color: #2196f3;
                }
                
                .sales-card {
                    border-color: #27ae60;
                    background: linear-gradient(135deg, #fff 0%, #e8f5e9 100%);
                }
                
                .sales-card:hover {
                    border-color: #4caf50;
                }
                
                .card-icon {
                    font-size: 60px;
                    margin-bottom: 20px;
                    opacity: 0.8;
                }
                
                .card-content h2 {
                    font-size: 28px;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                .card-content p {
                    color: #7f8c8d;
                    margin-bottom: 20px;
                    font-size: 16px;
                }
                
                .feature-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .feature-list li {
                    padding: 8px 0;
                    color: #546e7a;
                    font-size: 14px;
                }
                
                .card-action {
                    margin-top: 20px;
                    text-align: right;
                    color: #3498db;
                    font-weight: 600;
                }
                
                .production-card .card-action {
                    color: #2196f3;
                }
                
                .sales-card .card-action {
                    color: #4caf50;
                }
                
                .quick-stats {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                }
                
                .quick-stats h3 {
                    font-size: 24px;
                    color: #2c3e50;
                    margin-bottom: 25px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 25px;
                }
                
                .stat-item {
                    text-align: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    font-size: 14px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                }
                
                ${this.getCommonStyles()}
            </style>
        `;
    },
    
    getCommonStyles() {
        return `
            .back-button {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                padding: 10px 20px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                color: #495057;
                transition: all 0.3s;
            }
            
            .back-button:hover {
                background: #e9ecef;
                transform: translateY(-50%) translateX(-2px);
            }
            
            .coming-soon {
                text-align: center;
                padding: 100px 20px;
                background: white;
                border-radius: 15px;
                margin-top: 30px;
            }
            
            .coming-soon-icon {
                font-size: 80px;
                margin-bottom: 20px;
            }
            
            .coming-soon h2 {
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .coming-soon p {
                color: #7f8c8d;
                margin-bottom: 30px;
            }
            
            .btn-primary {
                padding: 12px 30px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-primary:hover {
                background: #2980b9;
                transform: translateY(-2px);
            }
        `;
    }
};

// Export
window.ManagementSummary = ManagementSummary;
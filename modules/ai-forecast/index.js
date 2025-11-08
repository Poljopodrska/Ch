/**
 * AI Forecasting Platform - Main Module
 * Integrates data upload, model training, and forecast visualization
 * Version: 1.0.0
 */

class AIForecastModule {
    constructor() {
        this.currentView = 'forecast'; // forecast, data, models
        this.components = {
            forecast: null,
            dataUpload: null,
            modelTraining: null
        };
    }

    render() {
        const container = document.createElement('div');
        container.className = 'ai-forecast-module';
        container.innerHTML = `
            <div class="ai-forecast-nav">
                <div class="nav-title">
                    <h1>AI Forecasting Platform</h1>
                    <p>Machine Learning-Powered Cash Flow Predictions</p>
                </div>
                <div class="nav-tabs">
                    <button onclick="aiForecastModule.switchView('forecast')"
                            class="nav-tab active" id="tab-forecast">
                        Forecast
                    </button>
                    <button onclick="aiForecastModule.switchView('data')"
                            class="nav-tab" id="tab-data">
                        Data Upload
                    </button>
                    <button onclick="aiForecastModule.switchView('models')"
                            class="nav-tab" id="tab-models">
                        Model Training
                    </button>
                </div>
            </div>
            <div class="ai-forecast-content" id="ai-forecast-content">
                <!-- Content will be dynamically loaded -->
            </div>
        `;

        this.addStyles();
        return container;
    }

    switchView(view) {
        this.currentView = view;

        // Update tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab-${view}`).classList.add('active');

        // Load content
        const contentEl = document.getElementById('ai-forecast-content');

        switch (view) {
            case 'forecast':
                if (!this.components.forecast) {
                    this.components.forecast = new ForecastVisualization();
                }
                contentEl.innerHTML = '';
                contentEl.appendChild(this.components.forecast.render());
                this.components.forecast.init();
                break;

            case 'data':
                if (!this.components.dataUpload) {
                    this.components.dataUpload = new DataUpload();
                }
                contentEl.innerHTML = '';
                contentEl.appendChild(this.components.dataUpload.render());
                this.components.dataUpload.init();
                break;

            case 'models':
                if (!this.components.modelTraining) {
                    this.components.modelTraining = new ModelTraining();
                }
                contentEl.innerHTML = '';
                contentEl.appendChild(this.components.modelTraining.render());
                this.components.modelTraining.init();
                break;
        }
    }

    addStyles() {
        if (document.getElementById('ai-forecast-main-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-forecast-main-styles';
        style.textContent = `
            .ai-forecast-module {
                min-height: 100vh;
                background: #f5f5f5;
            }

            .ai-forecast-nav {
                background: white;
                border-bottom: 2px solid #ddd;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .nav-title {
                margin-bottom: 20px;
            }

            .nav-title h1 {
                margin: 0 0 5px 0;
                font-size: 28px;
                color: #333;
            }

            .nav-title p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }

            .nav-tabs {
                display: flex;
                gap: 10px;
            }

            .nav-tab {
                padding: 12px 24px;
                background: #f5f5f5;
                border: 2px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s;
            }

            .nav-tab:hover {
                background: #e0e0e0;
            }

            .nav-tab.active {
                background: white;
                border-color: #2196f3;
                color: #2196f3;
            }

            .ai-forecast-content {
                padding: 20px;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .nav-tabs {
                    flex-direction: column;
                }

                .nav-tab {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
    }

    init() {
        // Initialize with forecast view
        this.switchView('forecast');
    }
}

// Global instance
const aiForecastModule = new AIForecastModule();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const appContainer = document.getElementById('app') || document.body;
        // Clear loading screen
        appContainer.innerHTML = '';
        appContainer.appendChild(aiForecastModule.render());
        aiForecastModule.init();
    });
} else {
    const appContainer = document.getElementById('app') || document.body;
    // Clear loading screen
    appContainer.innerHTML = '';
    appContainer.appendChild(aiForecastModule.render());
    aiForecastModule.init();
}

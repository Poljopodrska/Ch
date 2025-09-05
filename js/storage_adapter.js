/**
 * Ch Storage Adapter
 * ==================
 * 
 * Seamlessly intercepts localStorage calls and routes them to the backend.
 * Frontend modules work unchanged - they still call localStorage.getItem/setItem.
 * This adapter transparently handles backend synchronization.
 * 
 * Key Features:
 * - Zero frontend changes required
 * - Maintains localStorage as fallback
 * - Automatic backend sync
 * - Offline capability
 */

class ChStorageAdapter {
    constructor() {
        this.backendUrl = 'http://localhost:8001/api';
        this.isOnline = true;
        this.syncQueue = [];
        this.initialized = false;
        
        // Check backend availability
        this.checkBackendStatus();
        
        // Initialize after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async checkBackendStatus() {
        try {
            const response = await fetch(`${this.backendUrl}/health`, {
                method: 'GET',
                timeout: 3000
            });
            this.isOnline = response.ok;
            console.log(`Ch Backend: ${this.isOnline ? 'Online' : 'Offline'}`);
        } catch (error) {
            this.isOnline = false;
            console.log('Ch Backend: Offline (using localStorage only)');
        }
    }
    
    init() {
        if (this.initialized) return;
        
        console.log('Ch Storage Adapter: Initializing...');
        
        // Store original localStorage methods
        this.originalLocalStorage = {
            getItem: localStorage.getItem.bind(localStorage),
            setItem: localStorage.setItem.bind(localStorage),
            removeItem: localStorage.removeItem.bind(localStorage),
            clear: localStorage.clear.bind(localStorage)
        };
        
        // Override localStorage methods
        this.overrideLocalStorage();
        
        // Sync existing localStorage to backend
        this.syncExistingData();
        
        this.initialized = true;
        console.log('Ch Storage Adapter: Ready');
    }
    
    overrideLocalStorage() {
        const self = this;
        
        // Override getItem
        localStorage.getItem = function(key) {
            return self.getItem(key);
        };
        
        // Override setItem  
        localStorage.setItem = function(key, value) {
            return self.setItem(key, value);
        };
        
        // Override removeItem
        localStorage.removeItem = function(key) {
            return self.removeItem(key);
        };
        
        // Override clear
        localStorage.clear = function() {
            return self.clear();
        };
    }
    
    getItem(key) {
        try {
            // First try original localStorage (immediate response)
            const localValue = this.originalLocalStorage.getItem(key);
            
            // If backend is online, fetch from backend asynchronously
            if (this.isOnline) {
                this.syncFromBackend(key);
            }
            
            return localValue;
        } catch (error) {
            console.error(`Storage error getting ${key}:`, error);
            return null;
        }
    }
    
    setItem(key, value) {
        try {
            // Always save to localStorage first (immediate)
            this.originalLocalStorage.setItem(key, value);
            
            // If backend is online, sync to backend
            if (this.isOnline) {
                this.syncToBackend(key, value);
            } else {
                // Queue for later sync when back online
                this.syncQueue.push({ action: 'set', key, value });
            }
            
            return true;
        } catch (error) {
            console.error(`Storage error setting ${key}:`, error);
            return false;
        }
    }
    
    removeItem(key) {
        try {
            // Remove from localStorage first
            this.originalLocalStorage.removeItem(key);
            
            // If backend is online, sync removal
            if (this.isOnline) {
                this.removeFromBackend(key);
            } else {
                this.syncQueue.push({ action: 'remove', key });
            }
            
            return true;
        } catch (error) {
            console.error(`Storage error removing ${key}:`, error);
            return false;
        }
    }
    
    clear() {
        try {
            // Clear localStorage first
            this.originalLocalStorage.clear();
            
            // If backend is online, clear backend
            if (this.isOnline) {
                this.clearBackend();
            } else {
                this.syncQueue.push({ action: 'clear' });
            }
            
            return true;
        } catch (error) {
            console.error('Storage error clearing:', error);
            return false;
        }
    }
    
    async syncFromBackend(key) {
        if (!this.isOnline) return;
        
        try {
            const response = await fetch(`${this.backendUrl}/storage/${key}`, {
                method: 'GET'
            });
            
            if (response.ok) {
                const data = await response.json();
                const valueStr = typeof data === 'string' ? data : JSON.stringify(data);
                
                // Update localStorage with backend data if different
                const currentLocal = this.originalLocalStorage.getItem(key);
                if (currentLocal !== valueStr) {
                    this.originalLocalStorage.setItem(key, valueStr);
                    console.log(`Synced ${key} from backend`);
                }
            }
        } catch (error) {
            console.error(`Error syncing ${key} from backend:`, error);
            this.isOnline = false;
        }
    }
    
    async syncToBackend(key, value) {
        if (!this.isOnline) return;
        
        try {
            const data = this.parseValue(value);
            
            const response = await fetch(`${this.backendUrl}/storage/${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log(`Synced ${key} to backend`);
            }
        } catch (error) {
            console.error(`Error syncing ${key} to backend:`, error);
            this.isOnline = false;
            this.syncQueue.push({ action: 'set', key, value });
        }
    }
    
    async removeFromBackend(key) {
        if (!this.isOnline) return;
        
        try {
            const response = await fetch(`${this.backendUrl}/storage/${key}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log(`Removed ${key} from backend`);
            }
        } catch (error) {
            console.error(`Error removing ${key} from backend:`, error);
            this.isOnline = false;
        }
    }
    
    async clearBackend() {
        if (!this.isOnline) return;
        
        try {
            const response = await fetch(`${this.backendUrl}/storage/clear`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('Cleared backend storage');
            }
        } catch (error) {
            console.error('Error clearing backend storage:', error);
            this.isOnline = false;
        }
    }
    
    async syncExistingData() {
        if (!this.isOnline) return;
        
        try {
            const allData = {};
            
            // Collect all localStorage data
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = this.originalLocalStorage.getItem(key);
                allData[key] = this.parseValue(value);
            }
            
            if (Object.keys(allData).length > 0) {
                const response = await fetch(`${this.backendUrl}/sync/all`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(allData)
                });
                
                if (response.ok) {
                    console.log('Synced existing localStorage to backend');
                }
            }
        } catch (error) {
            console.error('Error syncing existing data:', error);
            this.isOnline = false;
        }
    }
    
    parseValue(value) {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    }
    
    // Process queued operations when back online
    async processQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) return;
        
        console.log(`Processing ${this.syncQueue.length} queued operations`);
        
        while (this.syncQueue.length > 0) {
            const operation = this.syncQueue.shift();
            
            try {
                switch (operation.action) {
                    case 'set':
                        await this.syncToBackend(operation.key, operation.value);
                        break;
                    case 'remove':
                        await this.removeFromBackend(operation.key);
                        break;
                    case 'clear':
                        await this.clearBackend();
                        break;
                }
            } catch (error) {
                console.error('Error processing queued operation:', error);
                // Re-queue failed operation
                this.syncQueue.unshift(operation);
                break;
            }
        }
    }
    
    // Enhanced calculation methods for frontend modules
    async calculatePricing(productId, pricingData) {
        if (!this.isOnline) {
            // Use frontend calculation as fallback
            return this.fallbackPricingCalculation(pricingData);
        }
        
        try {
            const response = await fetch(`${this.backendUrl}/calculations/pricing/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pricingData)
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error in backend pricing calculation:', error);
        }
        
        // Fallback to frontend calculation
        return this.fallbackPricingCalculation(pricingData);
    }
    
    fallbackPricingCalculation(data) {
        const productionCost = parseFloat(data.production_cost || 0);
        const goh = parseFloat(data.goh || 0);
        const moh = parseFloat(data.moh || 0);
        const loh = parseFloat(data.loh || 0);
        const profit = parseFloat(data.profit || 0);
        const vatRate = parseFloat(data.vat || 22);
        
        const totalCost = productionCost + goh + moh + loh;
        const sellingPrice = totalCost + profit;
        const priceWithVat = sellingPrice * (1 + vatRate / 100);
        const margin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice * 100) : 0;
        
        return {
            production_cost: productionCost,
            goh, moh, loh, profit,
            total_cost: totalCost,
            selling_price: sellingPrice,
            vat_rate: vatRate,
            price_with_vat: priceWithVat,
            margin_percentage: margin
        };
    }
    
    // Periodically check backend status and process queue
    startPeriodicSync() {
        setInterval(async () => {
            await this.checkBackendStatus();
            if (this.isOnline) {
                await this.processQueue();
            }
        }, 30000); // Check every 30 seconds
    }
}

// Initialize the storage adapter
const chStorageAdapter = new ChStorageAdapter();

// Start periodic sync
chStorageAdapter.startPeriodicSync();

// Make available globally for modules that need enhanced calculations
if (typeof window !== 'undefined') {
    window.ChStorage = chStorageAdapter;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChStorageAdapter;
}

console.log('Ch Storage Adapter loaded - localStorage calls will be intercepted and synced to backend');
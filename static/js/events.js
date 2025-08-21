// Global Event System for Module Communication
// Enables automatic synchronization between modules
const ChEvents = {
    listeners: {},
    
    // Subscribe to an event
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        console.log(`Subscribed to ${event}`);
    },
    
    // Unsubscribe from an event
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    },
    
    // Emit an event
    emit(event, data) {
        console.log(`Event emitted: ${event}`, data);
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
};

// Event types
const EVENTS = {
    PRODUCTION_COMPLETED: 'production:completed',
    PRODUCTION_UPDATED: 'production:updated',
    SALE_COMPLETED: 'sale:completed',
    SALE_UPDATED: 'sale:updated',
    STOCK_ADJUSTED: 'stock:adjusted',
    BOM_CONSUMED: 'bom:consumed',
    ORDER_PLACED: 'order:placed',
    ORDER_RECEIVED: 'order:received'
};
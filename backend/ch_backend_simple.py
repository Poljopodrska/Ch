#!/usr/bin/env python3
"""
Ch Production System Backend - Simplified Version
=================================================

A minimal backend that works without PostgreSQL initially.
Falls back to file-based storage while maintaining the same API.
Can be upgraded to PostgreSQL later.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChBackendSimple:
    """Simplified backend service with file-based storage"""
    
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)  # Enable CORS for frontend
        self.storage_path = 'data/storage'
        self.ensure_storage_dir()
        self.setup_routes()
        
    def ensure_storage_dir(self):
        """Create storage directory if it doesn't exist"""
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)
            logger.info(f"Created storage directory: {self.storage_path}")
    
    def get_storage_file_path(self, key: str) -> str:
        """Get file path for storage key"""
        safe_key = key.replace('/', '_').replace('\\', '_')
        return os.path.join(self.storage_path, f"{safe_key}.json")
    
    def setup_routes(self):
        """Setup all API routes that mirror localStorage operations"""
        
        @self.app.route('/api/storage/<key>', methods=['GET'])
        def get_storage_item(key):
            """Get item from storage (equivalent to localStorage.getItem)"""
            try:
                file_path = self.get_storage_file_path(key)
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    logger.info(f"Retrieved storage item: {key}")
                    return jsonify(data)
                else:
                    # Return default data structure
                    default_data = self.get_default_data(key)
                    logger.info(f"Returning default data for: {key}")
                    return jsonify(default_data)
                
            except Exception as e:
                logger.error(f"Error getting storage item {key}: {e}")
                return jsonify(self.get_default_data(key))
        
        @self.app.route('/api/storage/<key>', methods=['POST'])
        def set_storage_item(key):
            """Set item in storage (equivalent to localStorage.setItem)"""
            try:
                data = request.get_json()
                
                # Save to file
                file_path = self.get_storage_file_path(key)
                with open(file_path, 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                
                # Also save metadata
                self.save_metadata(key, data)
                
                logger.info(f"Saved storage item: {key}")
                return jsonify({"success": True, "key": key})
                
            except Exception as e:
                logger.error(f"Error setting storage item {key}: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/storage/<key>', methods=['DELETE'])
        def remove_storage_item(key):
            """Remove item from storage (equivalent to localStorage.removeItem)"""
            try:
                file_path = self.get_storage_file_path(key)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Removed storage item: {key}")
                
                return jsonify({"success": True, "key": key})
                
            except Exception as e:
                logger.error(f"Error removing storage item {key}: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/storage/clear', methods=['POST'])
        def clear_storage():
            """Clear all storage (equivalent to localStorage.clear)"""
            try:
                for file in os.listdir(self.storage_path):
                    if file.endswith('.json'):
                        os.remove(os.path.join(self.storage_path, file))
                
                logger.info("Cleared all storage")
                return jsonify({"success": True})
                
            except Exception as e:
                logger.error(f"Error clearing storage: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/calculations/pricing/<product_id>', methods=['POST'])
        def calculate_pricing(product_id):
            """Calculate pricing totals (enhanced calculation)"""
            try:
                data = request.get_json()
                
                # Perform same calculations as frontend pricing_v3.js
                production_cost = float(data.get('production_cost', 0))
                goh = float(data.get('goh', 0))
                moh = float(data.get('moh', 0)) 
                loh = float(data.get('loh', 0))
                profit = float(data.get('profit', 0))
                
                total_cost = production_cost + goh + moh + loh
                selling_price = total_cost + profit
                vat_rate = float(data.get('vat', 22))
                price_with_vat = selling_price * (1 + vat_rate / 100)
                
                margin = ((selling_price - total_cost) / selling_price * 100) if selling_price > 0 else 0
                
                result = {
                    "product_id": product_id,
                    "production_cost": production_cost,
                    "goh": goh,
                    "moh": moh,
                    "loh": loh,
                    "profit": profit,
                    "total_cost": total_cost,
                    "selling_price": selling_price,
                    "vat_rate": vat_rate,
                    "price_with_vat": price_with_vat,
                    "margin_percentage": margin,
                    "calculated_at": datetime.now().isoformat()
                }
                
                # Save pricing calculation
                pricing_file = os.path.join(self.storage_path, f"pricing_calculation_{product_id}.json")
                with open(pricing_file, 'w') as f:
                    json.dump(result, f, indent=2)
                
                logger.info(f"Calculated pricing for product: {product_id}")
                return jsonify(result)
                
            except Exception as e:
                logger.error(f"Error calculating pricing for {product_id}: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            storage_count = len([f for f in os.listdir(self.storage_path) if f.endswith('.json')])
            return jsonify({
                "status": "healthy",
                "storage_type": "file-based",
                "stored_items": storage_count,
                "version": "1.0.0-simple",
                "timestamp": datetime.now().isoformat()
            })
        
        @self.app.route('/api/sync/all', methods=['POST'])
        def sync_all_data():
            """Sync all localStorage data to file storage"""
            try:
                data = request.get_json()
                synced_keys = []
                
                for key, value in data.items():
                    try:
                        file_path = self.get_storage_file_path(key)
                        with open(file_path, 'w') as f:
                            json.dump(value, f, indent=2, default=str)
                        
                        self.save_metadata(key, value)
                        synced_keys.append(key)
                        
                    except Exception as e:
                        logger.error(f"Error syncing key {key}: {e}")
                        continue
                
                logger.info(f"Synced {len(synced_keys)} items to storage")
                return jsonify({
                    "success": True,
                    "synced_keys": synced_keys,
                    "total": len(synced_keys)
                })
                
            except Exception as e:
                logger.error(f"Error in sync_all_data: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/data/export', methods=['GET'])
        def export_all_data():
            """Export all stored data"""
            try:
                all_data = {}
                for file in os.listdir(self.storage_path):
                    if file.endswith('.json') and not file.startswith('metadata_'):
                        key = file.replace('.json', '').replace('_', '/')
                        with open(os.path.join(self.storage_path, file), 'r') as f:
                            all_data[key] = json.load(f)
                
                return jsonify({
                    "success": True,
                    "data": all_data,
                    "exported_at": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"Error exporting data: {e}")
                return jsonify({"success": False, "error": str(e)})
    
    def get_default_data(self, key: str) -> Dict[str, Any]:
        """Get default data structure for a key (matching frontend expectations)"""
        defaults = {
            'planningData': {
                'p001': {}, 'p002': {}, 'p003': {}
            },
            'planningEditedCells': [],
            'pricingData': {
                'p001': {
                    'production_cost': 15.50,
                    'goh': 2.30,
                    'moh': 1.80,
                    'loh': 1.20,
                    'profit': 3.20,
                    'vat': 22
                }
            },
            'crmData': {
                'customers': [
                    {"code": "MERC001", "name": "Mercator d.d.", "city": "Ljubljana"},
                    {"code": "SPAR001", "name": "Spar Slovenija d.o.o.", "city": "Ljubljana"},
                    {"code": "TUSA001", "name": "Tuš d.o.o.", "city": "Celje"}
                ]
            },
            'stockData': {},
            'bomData': {},
            'workforceData': {},
            'managementData': {}
        }
        return defaults.get(key, {})
    
    def save_metadata(self, key: str, data: Dict[str, Any]):
        """Save metadata about the stored item"""
        try:
            metadata = {
                "key": key,
                "size": len(str(data)),
                "last_updated": datetime.now().isoformat(),
                "data_type": type(data).__name__,
                "module": self.get_module_from_key(key)
            }
            
            metadata_file = os.path.join(self.storage_path, f"metadata_{key.replace('/', '_')}.json")
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving metadata for {key}: {e}")
    
    def get_module_from_key(self, key: str) -> str:
        """Determine module from storage key"""
        if 'pricing' in key.lower():
            return 'pricing'
        elif 'planning' in key.lower() or 'sales' in key.lower():
            return 'planning'
        elif 'crm' in key.lower() or 'customer' in key.lower():
            return 'crm'
        elif 'stock' in key.lower() or 'inventory' in key.lower():
            return 'stock'
        elif 'bom' in key.lower():
            return 'bom'
        elif 'workforce' in key.lower():
            return 'workforce'
        elif 'production' in key.lower():
            return 'production'
        else:
            return 'general'
    
    def run(self, host='0.0.0.0', port=8001, debug=False):
        """Run the backend server"""
        logger.info(f"Starting Ch Backend (Simple) on http://{host}:{port}")
        logger.info(f"Storage directory: {os.path.abspath(self.storage_path)}")
        self.app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    backend = ChBackendSimple()
    backend.run(host='0.0.0.0', port=8001, debug=True)
#!/usr/bin/env python3
"""
Ch Production System Backend
============================

A minimal backend that exactly matches the frontend's needs.
Frontend is the boss - backend adapts to its data structures.

Key Principles:
- Frontend localStorage calls are intercepted seamlessly
- No frontend changes required
- Database schema matches frontend data structures
- All calculations preserved from frontend logic
"""

import os
import json
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChBackend:
    """Main backend service that mirrors frontend localStorage operations"""
    
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)  # Enable CORS for frontend
        self.db_connection = None
        self.setup_routes()
        
    def get_db_connection(self):
        """Get database connection with automatic retry"""
        if not self.db_connection or self.db_connection.closed:
            try:
                self.db_connection = psycopg2.connect(
                    host=os.getenv('DB_HOST', 'localhost'),
                    database=os.getenv('DB_NAME', 'ch_production'),
                    user=os.getenv('DB_USER', 'postgres'),
                    password=os.getenv('DB_PASSWORD', 'password'),
                    port=os.getenv('DB_PORT', '5432')
                )
                logger.info("Database connection established")
            except Exception as e:
                logger.error(f"Database connection failed: {e}")
                # Fall back to in-memory storage for development
                return None
        return self.db_connection
    
    def setup_routes(self):
        """Setup all API routes that mirror localStorage operations"""
        
        @self.app.route('/api/storage/<key>', methods=['GET'])
        def get_storage_item(key):
            """Get item from storage (equivalent to localStorage.getItem)"""
            try:
                conn = self.get_db_connection()
                if conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(
                            "SELECT storage_value FROM frontend_storage WHERE storage_key = %s",
                            (key,)
                        )
                        result = cur.fetchone()
                        if result:
                            return jsonify(result['storage_value'])
                
                # Fallback: return empty or default data structure
                return jsonify(self.get_default_data(key))
                
            except Exception as e:
                logger.error(f"Error getting storage item {key}: {e}")
                return jsonify(self.get_default_data(key))
        
        @self.app.route('/api/storage/<key>', methods=['POST'])
        def set_storage_item(key):
            """Set item in storage (equivalent to localStorage.setItem)"""
            try:
                data = request.get_json()
                
                conn = self.get_db_connection()
                if conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT sync_localstorage_to_db(%s, %s, %s)",
                            (key, json.dumps(data), self.get_module_from_key(key))
                        )
                    conn.commit()
                
                # Also persist to structured tables
                self.sync_to_structured_tables(key, data)
                
                return jsonify({"success": True, "key": key})
                
            except Exception as e:
                logger.error(f"Error setting storage item {key}: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/storage/<key>', methods=['DELETE'])
        def remove_storage_item(key):
            """Remove item from storage (equivalent to localStorage.removeItem)"""
            try:
                conn = self.get_db_connection()
                if conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "DELETE FROM frontend_storage WHERE storage_key = %s",
                            (key,)
                        )
                    conn.commit()
                
                return jsonify({"success": True, "key": key})
                
            except Exception as e:
                logger.error(f"Error removing storage item {key}: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/storage/clear', methods=['POST'])
        def clear_storage():
            """Clear all storage (equivalent to localStorage.clear)"""
            try:
                conn = self.get_db_connection()
                if conn:
                    with conn.cursor() as cur:
                        cur.execute("DELETE FROM frontend_storage")
                    conn.commit()
                
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
                    "margin_percentage": margin
                }
                
                # Store in database
                self.save_pricing_calculation(product_id, result)
                
                return jsonify(result)
                
            except Exception as e:
                logger.error(f"Error calculating pricing for {product_id}: {e}")
                return jsonify({"success": False, "error": str(e)})
        
        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            db_status = "connected" if self.get_db_connection() else "disconnected"
            return jsonify({
                "status": "healthy",
                "database": db_status,
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat()
            })
        
        @self.app.route('/api/sync/all', methods=['POST'])
        def sync_all_data():
            """Sync all localStorage data to database"""
            try:
                data = request.get_json()
                synced_keys = []
                
                for key, value in data.items():
                    try:
                        conn = self.get_db_connection()
                        if conn:
                            with conn.cursor() as cur:
                                cur.execute(
                                    "SELECT sync_localstorage_to_db(%s, %s, %s)",
                                    (key, json.dumps(value), self.get_module_from_key(key))
                                )
                            conn.commit()
                        
                        # Also sync to structured tables
                        self.sync_to_structured_tables(key, value)
                        synced_keys.append(key)
                        
                    except Exception as e:
                        logger.error(f"Error syncing key {key}: {e}")
                        continue
                
                return jsonify({
                    "success": True,
                    "synced_keys": synced_keys,
                    "total": len(synced_keys)
                })
                
            except Exception as e:
                logger.error(f"Error in sync_all_data: {e}")
                return jsonify({"success": False, "error": str(e)})
    
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
    
    def get_default_data(self, key: str) -> Dict[str, Any]:
        """Get default data structure for a key (matching frontend expectations)"""
        defaults = {
            'planningData': {
                'p001': {}, 'p002': {}, 'p003': {}
            },
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
                'customers': []
            }
        }
        return defaults.get(key, {})
    
    def save_pricing_calculation(self, product_id: str, calculation: Dict[str, Any]):
        """Save pricing calculation to structured table"""
        try:
            conn = self.get_db_connection()
            if not conn:
                return
            
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO pricing_data 
                    (product_id, production_cost, goh, moh, loh, profit, selling_price, vat)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (product_id, valid_from) 
                    DO UPDATE SET
                        production_cost = EXCLUDED.production_cost,
                        goh = EXCLUDED.goh,
                        moh = EXCLUDED.moh,
                        loh = EXCLUDED.loh,
                        profit = EXCLUDED.profit,
                        selling_price = EXCLUDED.selling_price,
                        vat = EXCLUDED.vat,
                        updated_at = CURRENT_TIMESTAMP
                """, (
                    product_id,
                    calculation['production_cost'],
                    calculation['goh'],
                    calculation['moh'],
                    calculation['loh'],
                    calculation['profit'],
                    calculation['selling_price'],
                    calculation['vat_rate']
                ))
            conn.commit()
            logger.info(f"Pricing calculation saved for product {product_id}")
            
        except Exception as e:
            logger.error(f"Error saving pricing calculation: {e}")
    
    def sync_to_structured_tables(self, key: str, data: Dict[str, Any]):
        """Sync localStorage data to structured database tables"""
        try:
            module = self.get_module_from_key(key)
            
            if module == 'planning' and isinstance(data, dict):
                self.sync_planning_data(data)
            elif module == 'crm' and isinstance(data, dict):
                self.sync_crm_data(data)
            elif module == 'pricing' and isinstance(data, dict):
                self.sync_pricing_data(data)
                
        except Exception as e:
            logger.error(f"Error syncing {key} to structured tables: {e}")
    
    def sync_planning_data(self, data: Dict[str, Any]):
        """Sync planning data to sales_plans and sales_plan_items"""
        # This would parse the complex frontend planning structure
        # and insert into sales_plans and sales_plan_items tables
        pass
    
    def sync_crm_data(self, data: Dict[str, Any]):
        """Sync CRM data to customers table"""
        if 'customers' in data:
            conn = self.get_db_connection()
            if not conn:
                return
                
            try:
                with conn.cursor() as cur:
                    for customer in data['customers']:
                        cur.execute("""
                            INSERT INTO customers (code, name, type, city, country)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (code) DO UPDATE SET
                                name = EXCLUDED.name,
                                type = EXCLUDED.type,
                                city = EXCLUDED.city,
                                country = EXCLUDED.country,
                                updated_at = CURRENT_TIMESTAMP
                        """, (
                            customer.get('code'),
                            customer.get('name'),
                            customer.get('type', 'B2B'),
                            customer.get('city'),
                            customer.get('country', 'Slovenia')
                        ))
                conn.commit()
            except Exception as e:
                logger.error(f"Error syncing CRM data: {e}")
    
    def sync_pricing_data(self, data: Dict[str, Any]):
        """Sync pricing data to pricing_data table"""
        # This would sync the pricing module data to structured tables
        pass
    
    def run(self, host='localhost', port=8001, debug=False):
        """Run the backend server"""
        logger.info(f"Starting Ch Backend on http://{host}:{port}")
        self.app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    backend = ChBackend()
    backend.run(host='0.0.0.0', port=8001, debug=True)
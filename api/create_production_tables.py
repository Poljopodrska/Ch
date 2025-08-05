#!/usr/bin/env python3
"""
Create Production Planning tables for Ch project
Run this to set up the database schema for the production planning module
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'ch-production-db.cifgmm0mqg5q.us-east-1.rds.amazonaws.com'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'ch_production'),
    'user': os.getenv('DB_USER', 'ch_admin'),
    'password': os.getenv('DB_PASSWORD', 'LLJW8cLuLv1yyJlRt6aUioSzq')
}

def create_tables():
    """Create all production planning tables"""
    conn = None
    cur = None
    
    try:
        # Connect to database
        print(f"Connecting to database {DB_CONFIG['database']} at {DB_CONFIG['host']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Read and execute the schema file
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'production_planning_schema.sql')
        print(f"Reading schema from {schema_path}...")
        
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("Creating tables...")
        cur.execute(schema_sql)
        
        # Verify tables were created
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'products', 'cost_categories', 'product_cost_periods',
                'recipes', 'recipe_ingredients', 'recipe_outputs',
                'recipe_overheads', 'production_plans', 'production_plan_items',
                'surplus_inventory', 'translations'
            )
            ORDER BY table_name;
        """)
        
        created_tables = cur.fetchall()
        print(f"\nSuccessfully created/verified {len(created_tables)} tables:")
        for table in created_tables:
            print(f"  - {table[0]}")
        
        # Insert some sample data for testing
        print("\nInserting sample data...")
        
        # Sample products (universal - works for meat, wine, manufacturing)
        cur.execute("""
            INSERT INTO products (name, description, product_type, unit, can_be_sold) VALUES 
            ('Raw Material A', 'Basic input material', 'RAW_MATERIAL', 'kg', false),
            ('Raw Material B', 'Secondary input material', 'RAW_MATERIAL', 'kg', false),
            ('Intermediate Product 1', 'First stage product', 'INTERMEDIATE', 'kg', false),
            ('Final Product X', 'Ready for sale', 'END_PRODUCT', 'kg', true),
            ('Final Product Y', 'Alternative end product', 'END_PRODUCT', 'kg', true)
            ON CONFLICT DO NOTHING
            RETURNING id, name;
        """)
        
        products = cur.fetchall()
        if products:
            print(f"  - Created {len(products)} sample products")
        
        # Commit changes
        conn.commit()
        print("\nProduction planning schema created successfully!")
        
        return True
        
    except Exception as e:
        print(f"\nError creating tables: {str(e)}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def verify_connection():
    """Verify database connection before creating tables"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        print(f"Connected to PostgreSQL: {version.split(',')[0]}")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Cannot connect to database: {str(e)}")
        print("\nNote: This database is only accessible from AWS environment.")
        print("To create tables locally, use create_production_tables_simple.py")
        return False

if __name__ == "__main__":
    print("Ch Project - Production Planning Schema Setup")
    print("=" * 50)
    
    if verify_connection():
        create_tables()
    else:
        print("\nPlease check your database configuration and try again.")
        sys.exit(1)
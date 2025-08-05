#!/usr/bin/env python3
"""
Database setup script for Ch Production Planning
This script should be run from within the AWS environment (ECS container)
or any environment that has access to the RDS instance
"""

import os
import sys
import asyncio
import asyncpg
from datetime import datetime

async def setup_database():
    """Set up the production planning database schema"""
    
    # Database configuration from environment
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL and all(k in os.environ for k in ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']):
        DATABASE_URL = f"postgresql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}@{os.environ['DB_HOST']}:5432/{os.environ['DB_NAME']}"
    
    if not DATABASE_URL:
        print("Error: Database configuration not found in environment variables")
        return False
    
    try:
        print(f"Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'production_planning_schema.sql')
        
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("Creating production planning tables...")
        
        # Execute schema
        await conn.execute(schema_sql)
        
        # Verify tables were created
        tables = await conn.fetch("""
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
        
        print(f"\nCreated/verified {len(tables)} tables:")
        for table in tables:
            print(f"  - {table['table_name']}")
        
        await conn.close()
        
        print("\nDatabase setup completed successfully!")
        print("\nThe production planning API is now available at:")
        print("  GET  /api/production/system-info")
        print("  GET  /api/production/products")
        print("  POST /api/production/products")
        print("  GET  /api/production/recipes")
        print("  POST /api/production/translate")
        
        return True
        
    except Exception as e:
        print(f"\nError setting up database: {str(e)}")
        return False

if __name__ == "__main__":
    print("Ch Project - Production Planning Database Setup")
    print("=" * 50)
    
    # Run the async setup
    success = asyncio.run(setup_database())
    
    if not success:
        sys.exit(1)
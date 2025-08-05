#!/usr/bin/env python3
"""
Simple script to output SQL for creating production planning tables
Can be run manually on the database
"""

import os

def main():
    print("Ch Project - Production Planning Schema")
    print("=" * 50)
    print("\nTo create the production planning tables, run the following SQL:")
    print("\n1. Connect to your PostgreSQL database")
    print("2. Execute the SQL from: database/production_planning_schema.sql")
    print("\nAlternatively, you can run this SQL directly:")
    
    # Read and display the schema
    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'production_planning_schema.sql')
    
    try:
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("\n--- BEGIN SQL ---")
        print(schema_sql)
        print("--- END SQL ---")
        
        print("\nDatabase tables to be created:")
        print("- products (universal product catalog)")
        print("- cost_categories (DIRECT, POH, etc.)")
        print("- product_cost_periods (time-based pricing)")
        print("- recipes (production recipes)")
        print("- recipe_ingredients (recipe inputs)")
        print("- recipe_outputs (yield planning)")
        print("- recipe_overheads (overhead costs)")
        print("- production_plans (planning records)")
        print("- production_plan_items (plan details)")
        print("- surplus_inventory (surplus tracking)")
        print("- translations (LLM translation cache)")
        
    except Exception as e:
        print(f"\nError reading schema file: {e}")
        print("Please ensure you're running this from the Ch repository folder")

if __name__ == "__main__":
    main()
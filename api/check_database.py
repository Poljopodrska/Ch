#!/usr/bin/env python3
"""
Check database connection and create Ch database if needed
"""

import psycopg2
import os
from psycopg2 import sql

# RDS instance connection (using postgres default database first)
DB_CONFIG = {
    'host': 'ch-production-db.cifgmm0mqg5q.us-east-1.rds.amazonaws.com',
    'port': 5432,
    'database': 'postgres',  # Connect to default postgres database first
    'user': 'ch_admin',
    'password': 'LLJW8cLuLv1yyJlRt6aUioSzq'
}

def check_and_create_database():
    """Check if ch_production database exists and create if not"""
    conn = None
    cur = None
    
    try:
        # Connect to postgres database
        print(f"Connecting to RDS instance at {DB_CONFIG['host']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True  # Need autocommit for CREATE DATABASE
        cur = conn.cursor()
        
        # Check if ch_production database exists
        cur.execute("""
            SELECT datname FROM pg_database 
            WHERE datname = 'ch_production'
        """)
        
        db_exists = cur.fetchone()
        
        if db_exists:
            print("✓ Database 'ch_production' already exists")
        else:
            print("Database 'ch_production' not found. Creating...")
            cur.execute(sql.SQL("CREATE DATABASE {}").format(
                sql.Identifier('ch_production')
            ))
            print("✓ Database 'ch_production' created successfully")
        
        # Now connect to ch_production database
        cur.close()
        conn.close()
        
        # Update connection to use ch_production
        DB_CONFIG['database'] = 'ch_production'
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Check what tables exist
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cur.fetchall()
        
        print(f"\nExisting tables in ch_production: {len(tables)}")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check if production planning tables exist
        production_tables = [
            'products', 'cost_categories', 'recipes', 
            'translations', 'production_plans'
        ]
        
        existing_prod_tables = [t[0] for t in tables if t[0] in production_tables]
        
        if existing_prod_tables:
            print(f"\nProduction planning tables found: {existing_prod_tables}")
        else:
            print("\nNo production planning tables found. Run create_production_tables.py to create them.")
        
        return True
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        return False
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Ch Project - Database Check")
    print("=" * 50)
    
    if check_and_create_database():
        print("\nDatabase check completed successfully!")
        print("\nNext steps:")
        print("1. Run create_production_tables.py to create the production planning schema")
        print("2. The API endpoints will be available at /api/production/*")
    else:
        print("\nDatabase check failed. Please check the connection details.")
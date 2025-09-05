#!/usr/bin/env python3
"""
Database Setup Script for Ch Production System
==============================================

Creates database, runs schema, and verifies connection.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Create database if it doesn't exist"""
    try:
        # Connect to postgres db to create ch_production db
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database='postgres',
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'ch_production'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute('CREATE DATABASE ch_production')
            print("✅ Database 'ch_production' created successfully")
        else:
            print("✅ Database 'ch_production' already exists")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        sys.exit(1)

def run_schema():
    """Run database schema"""
    try:
        # Connect to ch_production database
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'ch_production'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
        
        cursor = conn.cursor()
        
        # Read and execute schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'db_schema.sql')
        if os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
            
            cursor.execute(schema_sql)
            conn.commit()
            print("✅ Database schema applied successfully")
        else:
            print(f"❌ Schema file not found: {schema_path}")
            sys.exit(1)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error applying schema: {e}")
        sys.exit(1)

def verify_setup():
    """Verify database setup"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'ch_production'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
        
        cursor = conn.cursor()
        
        # Check if key tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('products', 'pricing_data', 'customers', 'frontend_storage')
        """)
        
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        
        print(f"✅ Found {len(table_names)} core tables: {', '.join(table_names)}")
        
        # Check if functions exist
        cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'sync_localstorage_to_db'
        """)
        
        functions = cursor.fetchall()
        if functions:
            print("✅ Database functions created successfully")
        
        cursor.close()
        conn.close()
        
        print("🎉 Database setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("Setting up Ch Production System database...")
    
    # Load environment variables from .env file if it exists
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✅ Environment variables loaded from .env")
    except ImportError:
        print("⚠️ python-dotenv not installed, using system environment variables")
    
    create_database()
    run_schema()
    verify_setup()
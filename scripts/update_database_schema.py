#!/usr/bin/env python3
"""
Automatic Database Schema Updater for Ch Project
Updates DATABASE_SCHEMA.md with current database structure
"""

import os
import sys
import psycopg2
import json
from datetime import datetime
from typing import Dict, List, Any

def get_database_connection():
    """Get database connection from environment variables"""
    # Try DATABASE_URL first
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Convert SQLAlchemy URL format to psycopg2 format if needed
        if database_url.startswith('postgresql+psycopg2://'):
            database_url = database_url.replace('postgresql+psycopg2://', 'postgresql://')
        return psycopg2.connect(database_url)
    
    # Fall back to individual components
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'ch_project'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    
    return psycopg2.connect(**db_config)

def get_table_structure(cursor, table_name: str) -> List[Dict[str, Any]]:
    """Get detailed structure for a specific table"""
    query = """
    SELECT 
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default,
        CASE 
            WHEN pk.column_name IS NOT NULL THEN 'PK'
            WHEN fk.column_name IS NOT NULL THEN 'FK→' || fk.foreign_table_name || '.' || fk.foreign_column_name
            WHEN uk.column_name IS NOT NULL THEN 'UNIQUE'
            ELSE ''
        END as key_type
    FROM information_schema.columns c
    LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku 
            ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_name = %s 
            AND tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.column_name = pk.column_name
    LEFT JOIN (
        SELECT 
            ku.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku 
            ON tc.constraint_name = ku.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = %s 
            AND tc.constraint_type = 'FOREIGN KEY'
    ) fk ON c.column_name = fk.column_name
    LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku 
            ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_name = %s 
            AND tc.constraint_type = 'UNIQUE'
    ) uk ON c.column_name = uk.column_name
    WHERE c.table_name = %s
    ORDER BY c.ordinal_position;
    """
    
    cursor.execute(query, (table_name, table_name, table_name, table_name))
    return cursor.fetchall()

def get_table_comment(cursor, table_name: str) -> str:
    """Get table comment/description"""
    query = """
    SELECT obj_description(c.oid) 
    FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = %s AND n.nspname = 'public';
    """
    cursor.execute(query, (table_name,))
    result = cursor.fetchone()
    return result[0] if result and result[0] else f"*{table_name.replace('_', ' ').title()} table*"

def format_column_type(column_info) -> str:
    """Format column data type with length/precision"""
    data_type = column_info[1]
    max_length = column_info[2]
    precision = column_info[3]
    scale = column_info[4]
    
    if data_type in ['character varying', 'varchar'] and max_length:
        return f"varchar({max_length})"
    elif data_type in ['character', 'char'] and max_length:
        return f"char({max_length})"
    elif data_type == 'numeric' and precision and scale:
        return f"decimal({precision},{scale})"
    elif data_type == 'timestamp without time zone':
        return 'timestamp'
    elif data_type == 'timestamp with time zone':
        return 'timestamptz'
    else:
        return data_type

def format_column_default(default_value: str) -> str:
    """Format column default value"""
    if not default_value:
        return ""
    
    if 'nextval' in default_value:
        return "auto-increment"
    elif default_value == 'CURRENT_TIMESTAMP' or 'now()' in default_value:
        return "CURRENT_TIMESTAMP"
    else:
        return default_value

def generate_schema_markdown(cursor) -> str:
    """Generate complete DATABASE_SCHEMA.md content"""
    
    # Get all user tables (excluding system tables)
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    
    tables = [row[0] for row in cursor.fetchall()]
    
    # Generate markdown content
    content = f"""# Ch Project Database Schema
*Auto-generated every 30 minutes - DO NOT EDIT MANUALLY*  
*Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## Overview
This document contains the current database schema for the Ch project.
All tables, columns, types, and relationships are automatically extracted from the database.

## Tables

"""

    # Process each table
    for table_name in tables:
        table_comment = get_table_comment(cursor, table_name)
        table_structure = get_table_structure(cursor, table_name)
        
        content += f"### {table_name}\n"
        content += f"{table_comment}\n\n"
        content += "| Column | Type | Nullable | Default | Key |\n"
        content += "|--------|------|----------|---------|-----|\n"
        
        for column in table_structure:
            col_name = column[0]
            col_type = format_column_type(column)
            nullable = "YES" if column[5] == 'YES' else "NO"
            default = format_column_default(column[6])
            key_type = column[7] or ""
            
            content += f"| {col_name} | {col_type} | {nullable} | {default} | {key_type} |\n"
        
        content += "\n"
    
    # Add footer information
    content += """## Notes
- Database schema follows PostgreSQL best practices
- All queries should be optimized for performance
- Consider indexing strategies for large datasets

## Usage
- Web Claude: Reference this for TS specification writing
- Claude Code: Use for implementation queries
- Auto-updates: Every 30 minutes from database

## Setup Instructions
1. Set DATABASE_URL environment variable
2. Run: `crontab -e` (Linux/Mac) or Task Scheduler (Windows)
3. Add: `*/30 * * * * cd /mnt/c/Users/HP/Ch/scripts && python3 update_database_schema.py`
4. Schema will auto-update every 30 minutes
"""

    return content

def update_schema_file(content: str):
    """Update the DATABASE_SCHEMA.md file"""
    schema_file_path = "/mnt/c/Users/HP/Ch/essentials/DATABASE_SCHEMA.md"
    
    try:
        with open(schema_file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Database schema updated successfully at {datetime.now().strftime('%H:%M:%S')}")
        return True
    except Exception as e:
        print(f"❌ Error writing schema file: {e}")
        return False

def main():
    """Main execution function"""
    try:
        # Test database connection
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Test connection with a simple query
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()[0]
        print(f"✅ Connected to database: {db_version[:50]}...")
        
        # Generate schema content
        schema_content = generate_schema_markdown(cursor)
        
        # Update schema file
        success = update_schema_file(schema_content)
        
        # Close connection
        cursor.close()
        conn.close()
        
        if success:
            print(f"✅ Schema update completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            sys.exit(0)
        else:
            print("❌ Schema update failed")
            sys.exit(1)
            
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        print("💡 Check your DATABASE_URL or DB_* environment variables")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
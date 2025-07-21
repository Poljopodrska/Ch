-- AGP Planning System - Complete PostgreSQL Schema
-- Combines Meat Production Planner + Smart Excel Planning & Pricing System

-- Enable UUID extension for better scalability
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER MANAGEMENT (for multi-user capability)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCT HIERARCHY & CATEGORIES
-- =====================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Delamaris, Sveže meso, Mesni izdelki, Pečeno meso
    parent_id INTEGER REFERENCES categories(id),
    level INTEGER NOT NULL DEFAULT 1, -- 1 for main category, 2 for subcategory
    display_order INTEGER,
    color VARCHAR(7), -- hex color for UI
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products with full cost structure
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    article_number VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    pack_size VARCHAR(50),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES categories(id),
    
    -- Cost components (from Smart Excel)
    production_cost DECIMAL(10,2) DEFAULT 0,
    production_oh DECIMAL(10,2) DEFAULT 0, -- Production Overhead
    marketing_oh DECIMAL(10,2) DEFAULT 0,  -- Marketing Overhead
    general_oh DECIMAL(10,2) DEFAULT 0,    -- General Overhead
    logistics_oh DECIMAL(10,2) DEFAULT 0,  -- Logistics Overhead
    
    -- Pricing
    theoretical_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    min_price DECIMAL(10,2), -- minimum acceptable price
    
    -- Planning metadata
    lead_time_days INTEGER DEFAULT 0,
    min_batch_size INTEGER DEFAULT 1,
    shelf_life_days INTEGER,
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- CUSTOMERS
-- =====================================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    color VARCHAR(7), -- hex color for UI display
    
    -- Customer categorization
    customer_type VARCHAR(50), -- retail, wholesale, internal
    region VARCHAR(100),
    
    -- Credit and payment terms
    credit_limit DECIMAL(12,2),
    payment_terms_days INTEGER DEFAULT 30,
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer-specific pricing
CREATE TABLE customer_product_prices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER REFERENCES products(id),
    special_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id, valid_from)
);

-- =====================================================
-- WORKERS & CAPACITY
-- =====================================================
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    
    -- Capacity planning
    standard_hours_per_day DECIMAL(4,2) DEFAULT 8,
    efficiency_factor DECIMAL(3,2) DEFAULT 1.0, -- 1.0 = 100% efficiency
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Worker availability calendar
CREATE TABLE worker_availability (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id),
    date DATE NOT NULL,
    available BOOLEAN DEFAULT true,
    hours_available DECIMAL(4,2), -- NULL means not available
    absence_type VARCHAR(50), -- vacation, sick, holiday, other
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, date)
);

-- =====================================================
-- PRODUCTION CALENDAR & CAPACITY
-- =====================================================
CREATE TABLE production_calendar (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    is_production_day BOOLEAN DEFAULT true,
    
    -- Capacity constraints
    max_production_hours DECIMAL(6,2),
    available_workers INTEGER,
    
    -- Status and comments
    status VARCHAR(50), -- normal, reduced, closed, holiday
    comment TEXT, -- e.g., "Sobota", "Praznik", "Vzdrževanje"
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PLANNING DATA (Multi-purpose, scalable)
-- =====================================================
CREATE TABLE planning_data (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    customer_id INTEGER REFERENCES customers(id),
    
    -- Flexible date fields for different zoom levels
    plan_date DATE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    week INTEGER NOT NULL,
    day_of_week INTEGER, -- 1-7 (Monday-Sunday)
    
    -- Planning types
    data_type VARCHAR(50) NOT NULL, -- sales_plan, sales_actual, production_plan, production_actual, inventory_actual
    
    -- Values
    quantity DECIMAL(12,2) DEFAULT 0,
    value_amount DECIMAL(12,2), -- monetary value
    
    -- Metadata
    version INTEGER DEFAULT 1, -- for tracking plan versions
    is_locked BOOLEAN DEFAULT false, -- prevent editing of historical data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Ensure unique entries
    UNIQUE(product_id, customer_id, plan_date, data_type, version)
);

-- Index for fast queries
CREATE INDEX idx_planning_data_date ON planning_data(plan_date);
CREATE INDEX idx_planning_data_year_month ON planning_data(year, month);
CREATE INDEX idx_planning_data_year_week ON planning_data(year, week);

-- =====================================================
-- INVENTORY TRACKING
-- =====================================================
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- production, sale, adjustment, return
    quantity DECIMAL(12,2) NOT NULL, -- positive for IN, negative for OUT
    
    -- Reference to source
    reference_type VARCHAR(50), -- sales_order, production_order, adjustment
    reference_id INTEGER,
    
    -- Running balance
    balance_before DECIMAL(12,2),
    balance_after DECIMAL(12,2),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- KPI CALCULATIONS (for dashboard)
-- =====================================================
CREATE TABLE kpi_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    
    -- KPI values
    total_revenue DECIMAL(12,2),
    total_quantity DECIMAL(12,2),
    total_margin_absolute DECIMAL(12,2),
    total_margin_relative DECIMAL(5,2),
    
    -- Weighted averages
    weighted_poh DECIMAL(5,2), -- Production Overhead
    weighted_moh DECIMAL(5,2), -- Marketing Overhead
    weighted_goh DECIMAL(5,2), -- General Overhead
    weighted_loh DECIMAL(5,2), -- Logistics Overhead
    
    -- By category breakdowns (stored as JSONB for flexibility)
    category_breakdown JSONB,
    customer_breakdown JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EXCEL IMPORT/EXPORT LOGS
-- =====================================================
CREATE TABLE import_export_logs (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(20) NOT NULL, -- import, export
    file_name VARCHAR(255),
    file_size INTEGER,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL, -- pending, processing, completed, failed
    records_processed INTEGER,
    records_failed INTEGER,
    
    -- Error handling
    error_details JSONB,
    
    -- Metadata
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Current inventory view
CREATE VIEW current_inventory AS
SELECT 
    p.id,
    p.name,
    p.unit,
    COALESCE(
        (SELECT balance_after 
         FROM inventory_transactions 
         WHERE product_id = p.id 
         ORDER BY transaction_date DESC, created_at DESC 
         LIMIT 1), 
        0
    ) as current_stock
FROM products p
WHERE p.active = true;

-- Weekly planning summary
CREATE VIEW weekly_planning_summary AS
SELECT 
    pd.year,
    pd.week,
    pd.product_id,
    p.name as product_name,
    pd.data_type,
    SUM(pd.quantity) as total_quantity,
    SUM(pd.value_amount) as total_value
FROM planning_data pd
JOIN products p ON pd.product_id = p.id
GROUP BY pd.year, pd.week, pd.product_id, p.name, pd.data_type;

-- Worker availability summary
CREATE VIEW worker_availability_summary AS
SELECT 
    wa.date,
    COUNT(CASE WHEN wa.available = true THEN 1 END) as available_workers,
    COUNT(*) as total_workers
FROM worker_availability wa
JOIN workers w ON wa.worker_id = w.id
WHERE w.active = true
GROUP BY wa.date;

-- =====================================================
-- TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all relevant tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_data_updated_at BEFORE UPDATE ON planning_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate year/month/week from date
CREATE OR REPLACE FUNCTION calculate_date_parts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.year = EXTRACT(YEAR FROM NEW.plan_date);
    NEW.month = EXTRACT(MONTH FROM NEW.plan_date);
    NEW.week = EXTRACT(WEEK FROM NEW.plan_date);
    NEW.day_of_week = EXTRACT(ISODOW FROM NEW.plan_date);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_planning_date_parts BEFORE INSERT OR UPDATE ON planning_data
    FOR EACH ROW EXECUTE FUNCTION calculate_date_parts();

-- =====================================================
-- INITIAL DATA SEED
-- =====================================================

-- Insert categories
INSERT INTO categories (name, level, display_order, color) VALUES
('Delamaris', 1, 1, '#3B82F6'),
('Sveže meso', 1, 2, '#10B981'),
('Mesni izdelki', 1, 3, '#F59E0B'),
('Pečeno meso', 1, 4, '#EF4444');

-- Insert your existing customers
INSERT INTO customers (name, color) VALUES
('Pivka brand Razni', '#3B82F6'),
('Fragaria', '#10B981'),
('Mlinar', '#F59E0B'),
('Delamaris ZG razni', '#EF4444'),
('RieFein', '#8B5CF6'),
('Drugi', '#EC4899');

-- Insert your existing workers
INSERT INTO workers (name) VALUES
('Tinkara Gatej'),
('Nuša Gregorc'),
('Dženana Japić'),
('Suzana Osmanovska'),
('Valentina Rakita'),
('Radosav Jevtić');

-- Insert your existing products (with category assignment needed)
INSERT INTO products (name, unit, category_id) VALUES
('Trakci file beder sveži', 'kg', 2),
('Trakci file beder zmrznjeni Pivka', 'kg', 2),
('Trakci file prsi sveži', 'kg', 2),
('Trakci file prsi zmrznjeni Pivka', 'kg', 2),
('Čevapčiči RF', 'kg', 3),
('Pleskavica z ajvarjem RF', 'kg', 3),
('Ražnjiči 120 g RF', 'kg', 3),
('Ražnjiči 160 g RF', 'kg', 3),
('Čevapčiči Pivka', 'kg', 3),
('Burger Pivka', 'kg', 3),
('Perutničke Pivka', 'kg', 3);

-- Initialize production calendar for next 365 days
INSERT INTO production_calendar (date, is_production_day, comment)
SELECT 
    generate_series::date,
    CASE 
        WHEN EXTRACT(DOW FROM generate_series) IN (0, 6) THEN false -- weekends off
        ELSE true 
    END as is_production_day,
    CASE 
        WHEN EXTRACT(DOW FROM generate_series) = 6 THEN 'Sobota'
        WHEN EXTRACT(DOW FROM generate_series) = 0 THEN 'Nedelja'
        ELSE NULL
    END as comment
FROM generate_series(
    CURRENT_DATE, 
    CURRENT_DATE + INTERVAL '365 days', 
    '1 day'::interval
);
-- Ch Production System Database Schema
-- Designed to match frontend data structures exactly
-- Version: 1.0.0
-- Date: 2025-08-23

-- =====================================================
-- PRODUCTS & HIERARCHY (matching pricing module)
-- =====================================================

CREATE TABLE IF NOT EXISTS product_groups (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_subgroups (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES product_groups(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(20) PRIMARY KEY, -- Frontend uses string IDs like 'p001'
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'TOSM1000'
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    unit VARCHAR(20) NOT NULL, -- 'kos', 'kg', etc.
    subgroup_id INTEGER REFERENCES product_subgroups(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRICING DATA (matching pricing_v3 structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_data (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(20) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Cost breakdown (matching frontend)
    production_cost DECIMAL(10,2) NOT NULL,
    goh DECIMAL(10,2) NOT NULL, -- General Overheads
    moh DECIMAL(10,2) NOT NULL, -- Marketing Overheads
    loh DECIMAL(10,2) NOT NULL, -- Logistics Overheads
    profit DECIMAL(10,2) NOT NULL,
    
    -- Calculated totals
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (production_cost + goh + moh + loh) STORED,
    selling_price DECIMAL(10,2) NOT NULL,
    
    -- Coverage
    coverage DECIMAL(5,2) DEFAULT 0,
    coverage_details JSONB DEFAULT '{}',
    
    -- VAT
    vat DECIMAL(5,2) DEFAULT 22,
    price_with_vat DECIMAL(10,2) GENERATED ALWAYS AS (selling_price * (1 + vat/100)) STORED,
    
    -- Version tracking
    version INTEGER DEFAULT 1,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, valid_from)
);

-- =====================================================
-- CUSTOMERS (matching CRM module)
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'B2B', -- 'B2B', 'B2C', 'Retail', 'Wholesale'
    
    -- Contact info
    address TEXT,
    city VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Slovenia',
    phone VARCHAR(30),
    email VARCHAR(100),
    
    -- Business terms
    payment_terms INTEGER DEFAULT 30, -- days
    credit_limit DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Additional
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer-specific pricing (matching CRM module)
CREATE TABLE IF NOT EXISTS customer_pricing (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id VARCHAR(20) REFERENCES products(id) ON DELETE CASCADE,
    
    base_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    special_price DECIMAL(10,2),
    
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(customer_id, product_id, valid_from)
);

-- =====================================================
-- SALES PLANNING (matching planning_v5_editable)
-- =====================================================

CREATE TABLE IF NOT EXISTS sales_plans (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    week INTEGER CHECK (week >= 1 AND week <= 53),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'confirmed', 'locked'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(year, month, week)
);

CREATE TABLE IF NOT EXISTS sales_plan_items (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES sales_plans(id) ON DELETE CASCADE,
    product_id VARCHAR(20) REFERENCES products(id),
    customer_id INTEGER REFERENCES customers(id),
    
    -- Daily quantities (Monday-Sunday)
    monday DECIMAL(10,2) DEFAULT 0,
    tuesday DECIMAL(10,2) DEFAULT 0,
    wednesday DECIMAL(10,2) DEFAULT 0,
    thursday DECIMAL(10,2) DEFAULT 0,
    friday DECIMAL(10,2) DEFAULT 0,
    saturday DECIMAL(10,2) DEFAULT 0,
    sunday DECIMAL(10,2) DEFAULT 0,
    
    -- Calculated weekly total
    weekly_total DECIMAL(10,2) GENERATED ALWAYS AS 
        (monday + tuesday + wednesday + thursday + friday + saturday + sunday) STORED,
    
    -- Pricing
    unit_price DECIMAL(10,2),
    total_value DECIMAL(12,2),
    
    -- Metadata for edited cells (frontend tracking)
    edited_cells JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(plan_id, product_id, customer_id)
);

-- =====================================================
-- PRODUCTION PLANNING (matching production modules)
-- =====================================================

CREATE TABLE IF NOT EXISTS production_plans (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    week INTEGER CHECK (week >= 1 AND week <= 53),
    status VARCHAR(20) DEFAULT 'draft',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(year, month, week)
);

CREATE TABLE IF NOT EXISTS production_plan_items (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES production_plans(id) ON DELETE CASCADE,
    product_id VARCHAR(20) REFERENCES products(id),
    
    -- Daily production
    monday DECIMAL(10,2) DEFAULT 0,
    tuesday DECIMAL(10,2) DEFAULT 0,
    wednesday DECIMAL(10,2) DEFAULT 0,
    thursday DECIMAL(10,2) DEFAULT 0,
    friday DECIMAL(10,2) DEFAULT 0,
    saturday DECIMAL(10,2) DEFAULT 0,
    sunday DECIMAL(10,2) DEFAULT 0,
    
    weekly_total DECIMAL(10,2) GENERATED ALWAYS AS 
        (monday + tuesday + wednesday + thursday + friday + saturday + sunday) STORED,
    
    -- Production metrics
    production_time_hours DECIMAL(10,2),
    workers_needed INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(plan_id, product_id)
);

-- =====================================================
-- STOCK/INVENTORY (matching stock modules)
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_levels (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(20) REFERENCES products(id),
    
    -- Current levels
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2) DEFAULT 0,
    
    -- Raw materials specific
    raw_material_stock DECIMAL(10,2) DEFAULT 0,
    raw_material_unit VARCHAR(20),
    
    -- Ready products specific
    ready_product_stock DECIMAL(10,2) DEFAULT 0,
    
    -- Location
    warehouse VARCHAR(50) DEFAULT 'Main',
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, warehouse)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(20) REFERENCES products(id),
    movement_type VARCHAR(20), -- 'in', 'out', 'adjustment', 'production', 'sale'
    quantity DECIMAL(10,2) NOT NULL,
    
    -- Reference to source
    reference_type VARCHAR(20), -- 'production', 'sales_order', 'manual'
    reference_id INTEGER,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

-- =====================================================
-- BOM (Bill of Materials - matching BOM module)
-- =====================================================

CREATE TABLE IF NOT EXISTS bom_headers (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(20) REFERENCES products(id),
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    
    yield_quantity DECIMAL(10,2) DEFAULT 1,
    yield_unit VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, version)
);

CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER REFERENCES bom_headers(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(20) REFERENCES products(id),
    
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    
    -- Percentage if needed
    percentage DECIMAL(5,2),
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- WORKFORCE (matching workforce module)
-- =====================================================

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    
    hourly_rate DECIMAL(10,2),
    weekly_hours DECIMAL(5,2) DEFAULT 40,
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workforce_planning (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    week INTEGER CHECK (week >= 1 AND week <= 53),
    employee_id INTEGER REFERENCES employees(id),
    
    -- Daily assignments
    monday_hours DECIMAL(5,2) DEFAULT 0,
    tuesday_hours DECIMAL(5,2) DEFAULT 0,
    wednesday_hours DECIMAL(5,2) DEFAULT 0,
    thursday_hours DECIMAL(5,2) DEFAULT 0,
    friday_hours DECIMAL(5,2) DEFAULT 0,
    saturday_hours DECIMAL(5,2) DEFAULT 0,
    sunday_hours DECIMAL(5,2) DEFAULT 0,
    
    weekly_total_hours DECIMAL(5,2) GENERATED ALWAYS AS 
        (monday_hours + tuesday_hours + wednesday_hours + thursday_hours + 
         friday_hours + saturday_hours + sunday_hours) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(year, month, week, employee_id)
);

-- =====================================================
-- FEASIBILITY ANALYSIS (matching feasibility module)
-- =====================================================

CREATE TABLE IF NOT EXISTS feasibility_analyses (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES production_plans(id),
    
    total_production_hours DECIMAL(10,2),
    available_hours DECIMAL(10,2),
    capacity_utilization DECIMAL(5,2),
    
    material_availability JSONB DEFAULT '{}',
    workforce_availability JSONB DEFAULT '{}',
    
    feasible BOOLEAN DEFAULT true,
    issues TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MANAGEMENT SUMMARY DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS management_summaries (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    period_date DATE,
    
    -- KPIs
    total_revenue DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    gross_profit DECIMAL(12,2),
    gross_margin DECIMAL(5,2),
    
    -- Production metrics
    production_volume DECIMAL(10,2),
    capacity_utilization DECIMAL(5,2),
    
    -- Sales metrics
    orders_count INTEGER,
    customers_count INTEGER,
    
    -- Inventory metrics
    inventory_value DECIMAL(12,2),
    inventory_turnover DECIMAL(5,2),
    
    data JSONB DEFAULT '{}', -- Additional flexible data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(period_type, period_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_subgroup ON products(subgroup_id);
CREATE INDEX idx_pricing_product_date ON pricing_data(product_id, valid_from);
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_sales_plans_date ON sales_plans(year, month, week);
CREATE INDEX idx_production_plans_date ON production_plans(year, month, week);
CREATE INDEX idx_stock_product ON stock_levels(product_id);
CREATE INDEX idx_bom_product ON bom_headers(product_id);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Current pricing view
CREATE OR REPLACE VIEW current_pricing AS
SELECT p.*, pd.*
FROM products p
LEFT JOIN pricing_data pd ON p.id = pd.product_id
WHERE pd.valid_to IS NULL OR pd.valid_to >= CURRENT_DATE;

-- Stock status view
CREATE OR REPLACE VIEW stock_status AS
SELECT 
    p.code,
    p.name,
    p.unit,
    sl.current_stock,
    sl.min_stock,
    sl.max_stock,
    CASE 
        WHEN sl.current_stock < sl.min_stock THEN 'LOW'
        WHEN sl.current_stock > sl.max_stock THEN 'EXCESS'
        ELSE 'NORMAL'
    END as status
FROM products p
LEFT JOIN stock_levels sl ON p.id = sl.product_id;

-- Weekly sales summary view
CREATE OR REPLACE VIEW weekly_sales_summary AS
SELECT 
    sp.year,
    sp.week,
    p.code AS product_code,
    p.name AS product_name,
    c.name AS customer_name,
    spi.weekly_total,
    spi.unit_price,
    spi.total_value
FROM sales_plan_items spi
JOIN sales_plans sp ON spi.plan_id = sp.id
JOIN products p ON spi.product_id = p.id
LEFT JOIN customers c ON spi.customer_id = c.id;

-- =====================================================
-- FRONTEND DATA SYNCHRONIZATION TABLES
-- =====================================================

-- Table to store raw localStorage data from frontend
CREATE TABLE IF NOT EXISTS frontend_storage (
    id SERIAL PRIMARY KEY,
    storage_key VARCHAR(255) UNIQUE NOT NULL,
    storage_value JSONB NOT NULL,
    module VARCHAR(50),
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Audit log for changes
CREATE TABLE IF NOT EXISTS data_audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    record_id VARCHAR(50),
    action VARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STORED PROCEDURES FOR DATA OPERATIONS
-- =====================================================

-- Function to sync localStorage data to database
CREATE OR REPLACE FUNCTION sync_localstorage_to_db(
    p_key VARCHAR,
    p_value JSONB,
    p_module VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO frontend_storage (storage_key, storage_value, module)
    VALUES (p_key, p_value, p_module)
    ON CONFLICT (storage_key) DO UPDATE
    SET storage_value = p_value,
        last_synced = CURRENT_TIMESTAMP,
        version = frontend_storage.version + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate pricing totals
CREATE OR REPLACE FUNCTION calculate_pricing_totals(
    p_product_id VARCHAR
) RETURNS TABLE(
    total_cost DECIMAL,
    selling_price DECIMAL,
    margin_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.total_cost,
        pd.selling_price,
        CASE 
            WHEN pd.selling_price > 0 THEN 
                ((pd.selling_price - pd.total_cost) / pd.selling_price * 100)::DECIMAL
            ELSE 0::DECIMAL
        END AS margin_percentage
    FROM pricing_data pd
    WHERE pd.product_id = p_product_id
        AND (pd.valid_to IS NULL OR pd.valid_to >= CURRENT_DATE)
    ORDER BY pd.valid_from DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA SEEDING (matching frontend)
-- =====================================================

-- Insert example customers (matching CRM module)
INSERT INTO customers (code, name, type, city, country, payment_terms) VALUES
    ('MERC001', 'Mercator d.d.', 'B2B', 'Ljubljana', 'Slovenia', 30),
    ('SPAR001', 'Spar Slovenija d.o.o.', 'B2B', 'Ljubljana', 'Slovenia', 45),
    ('TUSA001', 'Tuš d.o.o.', 'B2B', 'Celje', 'Slovenia', 30),
    ('LIDL001', 'Lidl Slovenija d.o.o.', 'B2B', 'Ljubljana', 'Slovenia', 60),
    ('HOFE001', 'Hofer d.o.o.', 'B2B', 'Ljubljana', 'Slovenia', 45),
    ('LECT001', 'E.Leclerc Ljubljana', 'B2B', 'Ljubljana', 'Slovenia', 30),
    ('PETR001', 'Petrol d.d.', 'B2B', 'Ljubljana', 'Slovenia', 30),
    ('KOOP001', 'KZ Krka z.o.o.', 'B2B', 'Novo mesto', 'Slovenia', 30)
ON CONFLICT (code) DO NOTHING;

-- Insert product groups
INSERT INTO product_groups (code, name, name_en) VALUES
    ('MEAT', 'Meso', 'Meat'),
    ('DAIRY', 'Mlečni izdelki', 'Dairy Products'),
    ('BREAD', 'Pekovski izdelki', 'Bakery Products')
ON CONFLICT (code) DO NOTHING;

-- Insert product subgroups
INSERT INTO product_subgroups (group_id, code, name, name_en) VALUES
    ((SELECT id FROM product_groups WHERE code = 'MEAT'), 'FRESH', 'Sveže meso', 'Fresh Meat'),
    ((SELECT id FROM product_groups WHERE code = 'MEAT'), 'PROC', 'Predelano meso', 'Processed Meat'),
    ((SELECT id FROM product_groups WHERE code = 'DAIRY'), 'MILK', 'Mleko', 'Milk'),
    ((SELECT id FROM product_groups WHERE code = 'DAIRY'), 'CHEESE', 'Sir', 'Cheese')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PERMISSIONS (for future multi-user support)
-- =====================================================

-- Create role for application
-- CREATE ROLE ch_app WITH LOGIN PASSWORD 'secure_password';
-- GRANT ALL ON SCHEMA public TO ch_app;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO ch_app;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ch_app;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
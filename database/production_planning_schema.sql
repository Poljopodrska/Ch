-- Production Planning Module Database Schema for Ch Project
-- This schema supports universal production planning (meat, wine, manufacturing, etc.)
-- with time-based costs, yield planning, and multilingual support

-- 1. Products table - Universal for any product type
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_type VARCHAR(50) CHECK (product_type IN ('RAW_MATERIAL', 'INTERMEDIATE', 'END_PRODUCT', 'MULTI_PURPOSE')),
    unit VARCHAR(20) NOT NULL, -- kg, l, pieces, etc.
    can_be_sold BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Cost Categories
CREATE TABLE IF NOT EXISTS cost_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- DIRECT, POH, LOH, MOH, DOH, GOH, PROFIT
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) CHECK (category_type IN ('DIRECT', 'POH', 'LOH', 'MOH', 'DOH', 'GOH', 'PROFIT')),
    allocation_method VARCHAR(20) CHECK (allocation_method IN ('DIRECT', 'PERCENTAGE', 'PER_UNIT', 'PER_HOUR')),
    is_production_cost BOOLEAN DEFAULT true
);

-- Insert default cost categories
INSERT INTO cost_categories (code, name, category_type, allocation_method, is_production_cost) VALUES 
('DIRECT', 'Direct Production Costs', 'DIRECT', 'DIRECT', true),
('POH', 'Production Overheads', 'POH', 'PERCENTAGE', true),
('LOH', 'Logistics Overheads', 'LOH', 'PERCENTAGE', true),
('MOH', 'Marketing Overheads', 'MOH', 'PERCENTAGE', false),
('DOH', 'Distribution Overheads', 'DOH', 'PERCENTAGE', false),
('GOH', 'General Overheads', 'GOH', 'PERCENTAGE', false),
('PROFIT', 'Profit Margin', 'PROFIT', 'PERCENTAGE', false)
ON CONFLICT (code) DO NOTHING;

-- 3. Time-Based Product Costs
CREATE TABLE IF NOT EXISTS product_cost_periods (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    cost_per_unit DECIMAL(10,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    cost_type VARCHAR(20) CHECK (cost_type IN ('PURCHASE', 'CALCULATED', 'FORECAST')),
    supplier_id INTEGER, -- for future use
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_periods_active ON product_cost_periods(product_id, valid_from, valid_to) WHERE is_active = true;

-- 4. Recipes - Universal recipe system
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    output_product_id INTEGER REFERENCES products(id),
    output_quantity DECIMAL(10,3) NOT NULL,
    production_time_hours DECIMAL(8,2) DEFAULT 0, -- production time in hours
    direct_labor_hours DECIMAL(8,2) DEFAULT 0,
    direct_labor_cost_per_hour DECIMAL(8,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Recipe Ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    input_product_id INTEGER REFERENCES products(id),
    quantity_needed DECIMAL(10,3) NOT NULL,
    waste_percentage DECIMAL(5,2) DEFAULT 0, -- 5% = 5.00
    cost_category_id INTEGER REFERENCES cost_categories(id) DEFAULT 1, -- DIRECT
    notes TEXT
);

-- 6. Recipe Outputs - For Yield Planning
CREATE TABLE IF NOT EXISTS recipe_outputs (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    output_product_id INTEGER REFERENCES products(id),
    output_quantity DECIMAL(10,3) NOT NULL,
    output_percentage DECIMAL(5,2), -- % of total output
    is_primary_product BOOLEAN DEFAULT false,
    can_be_wasted BOOLEAN DEFAULT false,
    notes TEXT
);

-- 7. Recipe Overheads
CREATE TABLE IF NOT EXISTS recipe_overheads (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    cost_category_id INTEGER REFERENCES cost_categories(id),
    cost_type VARCHAR(50), -- LABOR, EQUIPMENT, FACILITY, OTHER
    cost_per_batch DECIMAL(10,2) NOT NULL,
    allocation_basis VARCHAR(50), -- per_kg, per_hour, percentage
    cost_center VARCHAR(100),
    notes TEXT
);

-- 8. Production Plans
CREATE TABLE IF NOT EXISTS production_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    plan_type VARCHAR(20) CHECK (plan_type IN ('SALES_DRIVEN', 'CAPACITY_DRIVEN')),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_plan_items (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES production_plans(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    target_quantity DECIMAL(10,3) NOT NULL,
    calculated_cost DECIMAL(10,2),
    production_date DATE,
    customer_id INTEGER, -- if sales-driven
    notes TEXT
);

-- 9. Surplus Inventory
CREATE TABLE IF NOT EXISTS surplus_inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity_available DECIMAL(10,3) NOT NULL,
    production_date DATE,
    expiry_date DATE,
    cost_per_unit DECIMAL(10,2),
    status VARCHAR(20) CHECK (status IN ('FRESH', 'AGING', 'NEAR_EXPIRY', 'WASTE')),
    disposal_cost DECIMAL(8,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Translations Cache
CREATE TABLE IF NOT EXISTS translations (
    id SERIAL PRIMARY KEY,
    source_text TEXT NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    context VARCHAR(100), -- UI, PRODUCT_NAME, ERROR_MESSAGE, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_text, target_language, context)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(source_text, target_language, context);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_plans_updated_at BEFORE UPDATE ON production_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
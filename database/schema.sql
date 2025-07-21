-- Ch Production Database Schema

-- Categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table with cost breakdown
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    article_number VARCHAR(20) UNIQUE NOT NULL,
    article_name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES product_categories(id),
    pack_size VARCHAR(50),
    group_1 VARCHAR(100),
    group_2 VARCHAR(100),
    unit_type VARCHAR(50) DEFAULT 'pcs',
    -- Cost components (all in EUR, 4 decimal places)
    production_cost DECIMAL(12,4) DEFAULT 0,
    production_overhead DECIMAL(12,4) DEFAULT 0,
    logistics_overhead DECIMAL(12,4) DEFAULT 0,
    marketing_overhead DECIMAL(12,4) DEFAULT 0,
    general_overhead DECIMAL(12,4) DEFAULT 0,
    profit_overhead DECIMAL(12,4) DEFAULT 0,
    -- Pricing
    sales_price DECIMAL(12,4) DEFAULT 0,
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOM Items (all materials - raw, intermediate, finished)
CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('raw', 'intermediate', 'finished')),
    unit_type VARCHAR(20) NOT NULL,
    current_inventory DECIMAL(12,4) DEFAULT 0,
    safety_stock DECIMAL(12,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOM Relationships (parent-child with yield)
CREATE TABLE IF NOT EXISTS bom_relationships (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES bom_items(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES bom_items(id) ON DELETE CASCADE,
    quantity_required DECIMAL(12,4) NOT NULL,
    yield_percentage DECIMAL(5,2) DEFAULT 100,
    proportion_percentage DECIMAL(5,2),
    production_time_hours DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, child_id)
);

-- Sales Planning
CREATE TABLE IF NOT EXISTS sales_plans (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    planned_units DECIMAL(12,4) DEFAULT 0,
    actual_units DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, plan_date, plan_type)
);

-- Sales History
CREATE TABLE IF NOT EXISTS sales_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    units_sold DECIMAL(12,4) DEFAULT 0,
    revenue DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, sale_date)
);

-- Production Plans
CREATE TABLE IF NOT EXISTS production_plans (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES bom_items(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    planned_quantity DECIMAL(12,4) NOT NULL,
    actual_quantity DECIMAL(12,4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article_number);
CREATE INDEX IF NOT EXISTS idx_bom_parent ON bom_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_bom_child ON bom_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_sales_plans_date ON sales_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_sales_history_date ON sales_history(sale_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bom_items_updated_at ON bom_items;
CREATE TRIGGER update_bom_items_updated_at BEFORE UPDATE ON bom_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON product_categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
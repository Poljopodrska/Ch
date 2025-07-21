-- Insert categories
INSERT INTO product_categories (name, code, display_order) VALUES
('Meat Products', 'meat', 1),
('Baked Meat', 'baked', 2),
('Dairy Products', 'dairy', 3)
ON CONFLICT (code) DO NOTHING;

-- Insert sample products
INSERT INTO products (article_number, article_name, category_id, pack_size, unit_type,
    production_cost, production_overhead, logistics_overhead, 
    marketing_overhead, general_overhead, profit_overhead, sales_price) VALUES
('001', 'Premium Salami', 1, '500g', 'pcs', 4.8000, 1.8000, 2.4000, 1.2000, 1.2000, 0.6000, 13.2000),
('002', 'Classic Mortadella', 1, '300g', 'pcs', 3.5000, 1.0000, 1.5000, 0.8000, 1.0000, 0.2000, 8.5000),
('003', 'Smoked Ham', 2, '1kg', 'pcs', 8.0000, 3.0000, 3.5000, 2.0000, 2.5000, 1.0000, 22.0000),
('004', 'Chicken Breast', 1, '400g', 'pcs', 5.2000, 1.5000, 1.8000, 1.0000, 1.3000, 0.7000, 12.5000),
('005', 'Beef Tenderloin', 1, '800g', 'pcs', 12.0000, 4.0000, 4.2000, 2.5000, 3.0000, 1.8000, 28.5000)
ON CONFLICT (article_number) DO NOTHING;

-- Insert BOM items
INSERT INTO bom_items (item_code, item_name, item_type, unit_type, current_inventory, safety_stock) VALUES
('RAW-CHICKEN-01', 'Raw Chicken', 'raw', 'kg', 500.0000, 100.0000),
('INT-CHICKEN-CLEAN-01', 'Cleaned Chicken', 'intermediate', 'kg', 200.0000, 50.0000),
('INT-CHICKEN-PARTS-01', 'Chicken Parts', 'intermediate', 'kg', 150.0000, 30.0000),
('INT-MINCED-MEAT-01', 'Minced Meat', 'intermediate', 'kg', 80.0000, 20.0000),
('FIN-HAMBURGER-01', 'Hamburger', 'finished', 'pcs', 1000.0000, 200.0000),
('RAW-SPICES-01', 'Spice Mix', 'raw', 'kg', 25.0000, 5.0000),
('RAW-BUN-01', 'Hamburger Bun', 'raw', 'pcs', 2000.0000, 500.0000),
('RAW-PORK-01', 'Raw Pork Shoulder', 'raw', 'kg', 300.0000, 75.0000),
('INT-GROUND-PORK-01', 'Ground Pork', 'intermediate', 'kg', 120.0000, 25.0000),
('FIN-SAUSAGE-01', 'Italian Sausage', 'finished', 'pcs', 800.0000, 150.0000)
ON CONFLICT (item_code) DO NOTHING;

-- Insert BOM relationships
INSERT INTO bom_relationships (parent_id, child_id, quantity_required, yield_percentage, production_time_hours) VALUES
-- Raw Chicken → Cleaned Chicken (ID 1 → 2)
(1, 2, 1.0000, 71.00, 2.0),
-- Cleaned Chicken → Chicken Parts (ID 2 → 3)
(2, 3, 1.0000, 70.00, 4.0),
-- Chicken Parts → Minced Meat (ID 3 → 4)
(3, 4, 1.0000, 70.00, 2.0),
-- Components for Hamburger (ID 5)
(4, 5, 0.1500, 100.00, 0.5), -- Minced Meat → Hamburger (150g per burger)
(6, 5, 0.0100, 100.00, 0.0), -- Spices → Hamburger (10g per burger)
(7, 5, 1.0000, 100.00, 0.0), -- Bun → Hamburger (1 per burger)
-- Raw Pork → Ground Pork (ID 8 → 9)
(8, 9, 1.0000, 85.00, 3.0),
-- Ground Pork → Italian Sausage (ID 9 → 10)
(9, 10, 0.2000, 100.00, 1.0), -- 200g ground pork per sausage
(6, 10, 0.0050, 100.00, 0.0)  -- 5g spices per sausage
ON CONFLICT (parent_id, child_id) DO NOTHING;

-- Sample sales history (last 30 days)
INSERT INTO sales_history (product_id, sale_date, units_sold, revenue)
SELECT 
    p.id,
    d.date,
    FLOOR(RANDOM() * 100 + 50)::INTEGER,
    (FLOOR(RANDOM() * 100 + 50) * p.sales_price)::DECIMAL(12,4)
FROM products p
CROSS JOIN generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    '1 day'::interval
) AS d(date)
ON CONFLICT (product_id, sale_date) DO NOTHING;

-- Sample weekly sales plans (next 4 weeks)
INSERT INTO sales_plans (product_id, plan_date, plan_type, planned_units)
SELECT 
    p.id,
    d.date,
    'weekly',
    FLOOR(RANDOM() * 500 + 200)::INTEGER
FROM products p
CROSS JOIN generate_series(
    date_trunc('week', CURRENT_DATE),
    date_trunc('week', CURRENT_DATE) + INTERVAL '3 weeks',
    '1 week'::interval
) AS d(date)
ON CONFLICT (product_id, plan_date, plan_type) DO NOTHING;

-- Sample production plans (next 2 weeks)
INSERT INTO production_plans (item_id, plan_date, planned_quantity, status)
SELECT 
    b.id,
    d.date,
    FLOOR(RANDOM() * 200 + 100)::INTEGER,
    CASE 
        WHEN d.date < CURRENT_DATE THEN 'completed'
        WHEN d.date = CURRENT_DATE THEN 'in_progress'
        ELSE 'planned'
    END
FROM bom_items b
CROSS JOIN generate_series(
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '7 days',
    '1 day'::interval
) AS d(date)
WHERE b.item_type IN ('intermediate', 'finished');
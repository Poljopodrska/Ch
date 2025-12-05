"""Add pricing tables (industries, products, base prices, customer prices)

Revision ID: 001
Revises:
Create Date: 2025-12-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use raw SQL with IF NOT EXISTS to make migration idempotent
    connection = op.get_bind()

    # Create industries table
    connection.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS industries (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name_sl VARCHAR(255) NOT NULL,
            name_hr VARCHAR(255) NOT NULL,
            icon VARCHAR(10),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """))

    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_industries_code ON industries(code)"))
    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_industries_id ON industries(id)"))

    # Create products table
    connection.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name_sl VARCHAR(255) NOT NULL,
            name_hr VARCHAR(255) NOT NULL,
            unit VARCHAR(20) NOT NULL,
            industry_id INTEGER NOT NULL REFERENCES industries(id),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """))

    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_products_code ON products(code)"))
    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_products_id ON products(id)"))

    # Create industry_production_factors table
    connection.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS industry_production_factors (
            id SERIAL PRIMARY KEY,
            industry_id INTEGER UNIQUE NOT NULL REFERENCES industries(id),
            production_factor DOUBLE PRECISION NOT NULL DEFAULT 1.20,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
    """))

    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_industry_production_factors_industry_id ON industry_production_factors(industry_id)"))

    # Create product_base_prices table
    connection.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS product_base_prices (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id),
            lc DOUBLE PRECISION NOT NULL,
            c0 DOUBLE PRECISION NOT NULL,
            cmin DOUBLE PRECISION NOT NULL,
            oh_factor DOUBLE PRECISION NOT NULL DEFAULT 1.25,
            min_profit_margin DOUBLE PRECISION NOT NULL DEFAULT 0.0425,
            valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            valid_to TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by VARCHAR(100),
            notes VARCHAR(500)
        )
    """))

    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_product_base_prices_product_id ON product_base_prices(product_id)"))

    # Create customer_product_prices table (if customers table exists)
    connection.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS customer_product_prices (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id),
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            strategic_cmin DOUBLE PRECISION NOT NULL,
            discount_invoice DOUBLE PRECISION NOT NULL DEFAULT 0,
            discount_marketing DOUBLE PRECISION NOT NULL DEFAULT 0,
            discount_yearend DOUBLE PRECISION NOT NULL DEFAULT 0,
            total_discounts DOUBLE PRECISION NOT NULL,
            cp DOUBLE PRECISION NOT NULL,
            realized_price DOUBLE PRECISION NOT NULL,
            coverage_vs_c0 DOUBLE PRECISION,
            coverage_vs_cmin DOUBLE PRECISION,
            valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            valid_to TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by VARCHAR(100),
            notes VARCHAR(500)
        )
    """))

    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_customer_product_prices_customer_id ON customer_product_prices(customer_id)"))
    connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_customer_product_prices_product_id ON customer_product_prices(product_id)"))

    # Insert default industries (using ON CONFLICT to avoid duplicates)
    connection.execute(sa.text("""
        INSERT INTO industries (code, name_sl, name_hr, icon, is_active) VALUES
        ('fresh-meat', 'Sveže meso', 'Svježe meso', '🥩', true),
        ('meat-products', 'Mesni izdelki', 'Mesni proizvodi', '🌭', true),
        ('delamaris', 'Delamaris', 'Delamaris', '🐟', true)
        ON CONFLICT (code) DO NOTHING
    """))

    # Insert default production factors (1.20 for all)
    connection.execute(sa.text("""
        INSERT INTO industry_production_factors (industry_id, production_factor)
        SELECT id, 1.20 FROM industries
        ON CONFLICT (industry_id) DO NOTHING
    """))


def downgrade() -> None:
    op.drop_index(op.f('ix_customer_product_prices_product_id'), table_name='customer_product_prices')
    op.drop_index(op.f('ix_customer_product_prices_customer_id'), table_name='customer_product_prices')
    op.drop_table('customer_product_prices')
    op.drop_index(op.f('ix_product_base_prices_product_id'), table_name='product_base_prices')
    op.drop_table('product_base_prices')
    op.drop_index(op.f('ix_industry_production_factors_industry_id'), table_name='industry_production_factors')
    op.drop_table('industry_production_factors')
    op.drop_index(op.f('ix_products_id'), table_name='products')
    op.drop_index(op.f('ix_products_code'), table_name='products')
    op.drop_table('products')
    op.drop_index(op.f('ix_industries_id'), table_name='industries')
    op.drop_index(op.f('ix_industries_code'), table_name='industries')
    op.drop_table('industries')

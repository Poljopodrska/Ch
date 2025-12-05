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
    # Create industries table
    op.create_table('industries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name_sl', sa.String(length=255), nullable=False),
        sa.Column('name_hr', sa.String(length=255), nullable=False),
        sa.Column('icon', sa.String(length=10), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_industries_code'), 'industries', ['code'], unique=True)
    op.create_index(op.f('ix_industries_id'), 'industries', ['id'], unique=False)

    # Create products table
    op.create_table('products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name_sl', sa.String(length=255), nullable=False),
        sa.Column('name_hr', sa.String(length=255), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('industry_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['industry_id'], ['industries.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_code'), 'products', ['code'], unique=True)
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)

    # Create industry_production_factors table
    op.create_table('industry_production_factors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('industry_id', sa.Integer(), nullable=False),
        sa.Column('production_factor', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['industry_id'], ['industries.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_industry_production_factors_industry_id'), 'industry_production_factors', ['industry_id'], unique=True)

    # Create product_base_prices table
    op.create_table('product_base_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('lc', sa.Float(), nullable=False),
        sa.Column('c0', sa.Float(), nullable=False),
        sa.Column('cmin', sa.Float(), nullable=False),
        sa.Column('oh_factor', sa.Float(), nullable=False),
        sa.Column('min_profit_margin', sa.Float(), nullable=False),
        sa.Column('valid_from', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('valid_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_base_prices_product_id'), 'product_base_prices', ['product_id'], unique=False)

    # Create customer_product_prices table (if customers table exists)
    # Note: This depends on the customers table existing
    op.create_table('customer_product_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('strategic_cmin', sa.Float(), nullable=False),
        sa.Column('discount_invoice', sa.Float(), nullable=False),
        sa.Column('discount_marketing', sa.Float(), nullable=False),
        sa.Column('discount_yearend', sa.Float(), nullable=False),
        sa.Column('total_discounts', sa.Float(), nullable=False),
        sa.Column('cp', sa.Float(), nullable=False),
        sa.Column('realized_price', sa.Float(), nullable=False),
        sa.Column('coverage_vs_c0', sa.Float(), nullable=True),
        sa.Column('coverage_vs_cmin', sa.Float(), nullable=True),
        sa.Column('valid_from', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('valid_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_product_prices_customer_id'), 'customer_product_prices', ['customer_id'], unique=False)
    op.create_index(op.f('ix_customer_product_prices_product_id'), 'customer_product_prices', ['product_id'], unique=False)

    # Insert default industries
    op.execute("""
        INSERT INTO industries (code, name_sl, name_hr, icon, is_active) VALUES
        ('fresh-meat', 'Sveže meso', 'Svježe meso', '🥩', true),
        ('meat-products', 'Mesni izdelki', 'Mesni proizvodi', '🌭', true),
        ('delamaris', 'Delamaris', 'Delamaris', '🐟', true)
    """)

    # Insert default production factors (1.20 for all)
    op.execute("""
        INSERT INTO industry_production_factors (industry_id, production_factor)
        SELECT id, 1.20 FROM industries
    """)


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

"""
Product model for pricing system.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    """
    Product model representing items in the pricing system.
    """

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., PIŠ-FILE
    name_sl = Column(String(255), nullable=False)  # Slovenian name
    name_hr = Column(String(255), nullable=False)  # Croatian name
    unit = Column(String(20), nullable=False)  # kg, pcs, etc.
    industry_id = Column(Integer, ForeignKey("industries.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    industry = relationship("Industry", back_populates="products")
    base_prices = relationship("ProductBasePrice", back_populates="product", cascade="all, delete-orphan")
    customer_prices = relationship("CustomerProductPrice", back_populates="product", cascade="all, delete-orphan")
    sales_history = relationship("InvoiceLineItem", back_populates="product")

    def __repr__(self):
        return f"<Product {self.code}: {self.name_sl}>"


class Industry(Base):
    """
    Industry/category for products (Sveže meso, Mesni izdelki, Delamaris).
    """

    __tablename__ = "industries"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # fresh-meat, meat-products, delamaris
    name_sl = Column(String(255), nullable=False)
    name_hr = Column(String(255), nullable=False)
    icon = Column(String(10))  # emoji
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    products = relationship("Product", back_populates="industry")
    production_factor = relationship("IndustryProductionFactor", back_populates="industry", uselist=False)

    def __repr__(self):
        return f"<Industry {self.code}: {self.name_sl}>"


class IndustryProductionFactor(Base):
    """
    Production price factor for each industry (LC × factor = production price threshold).
    Used to calculate 'Cijena iznad Proizvodne cijene' status.
    This is a 3×2 table (3 industries, 1 factor value each).
    """

    __tablename__ = "industry_production_factors"

    id = Column(Integer, primary_key=True, index=True)
    industry_id = Column(Integer, ForeignKey("industries.id"), unique=True, nullable=False, index=True)

    # The production factor: realized price must be >= (LC × production_factor)
    production_factor = Column(Float, nullable=False, default=1.20)  # Default 1.20 (20% above LC)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    industry = relationship("Industry", back_populates="production_factor")

    def __repr__(self):
        return f"<IndustryProductionFactor {self.industry.code if self.industry else 'N/A'}: {self.production_factor}>"


class ProductBasePrice(Base):
    """
    Base pricing data for a product (LC, C0, Cmin).
    Tracks history with validity dates.
    """

    __tablename__ = "product_base_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Base price components
    lc = Column(Float, nullable=False)  # Lastna cena (production cost without overheads)

    # Calculated fields (can be stored for performance)
    c0 = Column(Float, nullable=False)  # Break-even: LC × OH factor
    cmin = Column(Float, nullable=False)  # Minimum acceptable: C0 / (1 - min_profit_margin)

    # Factors used for calculation
    oh_factor = Column(Float, nullable=False, default=1.25)
    min_profit_margin = Column(Float, nullable=False, default=0.0425)  # 4.25%

    # Validity period
    valid_from = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    valid_to = Column(DateTime(timezone=True), nullable=True)  # NULL = unlimited

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100))  # User who created this price
    notes = Column(String(500))  # Optional notes about price change

    # Relationships
    product = relationship("Product", back_populates="base_prices")

    def __repr__(self):
        return f"<ProductBasePrice {self.product_id}: LC={self.lc}, valid_from={self.valid_from}>"


class CustomerProductPrice(Base):
    """
    Customer-specific pricing (Strategic Cmin, CP, discounts).
    Tracks history with validity dates.
    """

    __tablename__ = "customer_product_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)  # FK to customers table
    # Note: customer_name and customer_type moved to Customer model - access via relationship

    # Strategic pricing
    strategic_cmin = Column(Float, nullable=False)  # Strategic minimum (can be > calculated Cmin)

    # Discounts
    discount_invoice = Column(Float, nullable=False, default=0)  # % (e.g., 15)
    discount_marketing = Column(Float, nullable=False, default=0)  # %
    discount_yearend = Column(Float, nullable=False, default=0)  # %
    total_discounts = Column(Float, nullable=False)  # Sum of all discounts

    # Calculated fields
    cp = Column(Float, nullable=False)  # Customer Price: strategic_cmin / (1 - total_discounts/100)
    realized_price = Column(Float, nullable=False)  # CP × (1 - total_discounts/100)

    # Coverage metrics (can be calculated on-the-fly or stored)
    coverage_vs_c0 = Column(Float)  # %
    coverage_vs_cmin = Column(Float)  # %

    # Validity period
    valid_from = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    valid_to = Column(DateTime(timezone=True), nullable=True)  # NULL = unlimited

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100))
    notes = Column(String(500))

    # Relationships
    product = relationship("Product", back_populates="customer_prices")
    customer = relationship("Customer", back_populates="product_prices")

    def __repr__(self):
        return f"<CustomerProductPrice {self.product_id}-{self.customer_id}: CP={self.cp}>"

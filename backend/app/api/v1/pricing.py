"""
Pricing API endpoints for managing products, prices, and history.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import pandas as pd

from app.core.database import get_db
from app.models.product import Product, Industry, ProductBasePrice, CustomerProductPrice, IndustryProductionFactor

router = APIRouter()


# Pydantic schemas for request/response
class IndustryCreate(BaseModel):
    code: str
    name_sl: str
    name_hr: str
    icon: Optional[str] = None

class IndustryResponse(BaseModel):
    id: int
    code: str
    name_sl: str
    name_hr: str
    icon: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    code: str
    name_sl: str
    name_hr: str
    unit: str
    industry_code: str

class ProductResponse(BaseModel):
    id: int
    code: str
    name_sl: str
    name_hr: str
    unit: str
    industry_id: int
    is_active: bool

    class Config:
        from_attributes = True


class ProductBasePriceCreate(BaseModel):
    product_code: str
    lc: float
    oh_factor: float = 1.25
    min_profit_margin: float = 0.0425
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    notes: Optional[str] = None


class ProductBasePriceResponse(BaseModel):
    id: int
    product_id: int
    lc: float
    c0: float
    cmin: float
    oh_factor: float
    min_profit_margin: float
    valid_from: datetime
    valid_to: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerProductPriceCreate(BaseModel):
    product_code: str
    customer_id: str
    customer_name: str
    customer_type: str
    strategic_cmin: float
    discount_invoice: float
    discount_marketing: float
    discount_yearend: float
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    notes: Optional[str] = None


class CustomerProductPriceResponse(BaseModel):
    id: int
    product_id: int
    customer_id: str
    customer_name: str
    customer_type: str
    strategic_cmin: float
    discount_invoice: float
    discount_marketing: float
    discount_yearend: float
    total_discounts: float
    cp: float
    realized_price: float
    coverage_vs_c0: Optional[float]
    coverage_vs_cmin: Optional[float]
    valid_from: datetime
    valid_to: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True


# ============================================================================
# Industry Endpoints
# ============================================================================

@router.get("/industries", response_model=List[IndustryResponse])
async def list_industries(db: Session = Depends(get_db)):
    """Get all industries."""
    industries = db.query(Industry).filter(Industry.is_active == True).all()
    return industries


@router.post("/industries", response_model=IndustryResponse)
async def create_industry(industry: IndustryCreate, db: Session = Depends(get_db)):
    """Create a new industry."""
    # Check if already exists
    existing = db.query(Industry).filter(Industry.code == industry.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Industry {industry.code} already exists")

    db_industry = Industry(**industry.dict())
    db.add(db_industry)
    db.commit()
    db.refresh(db_industry)
    return db_industry


# ============================================================================
# Product Endpoints
# ============================================================================

@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    industry_code: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all products, optionally filtered by industry."""
    query = db.query(Product)

    if active_only:
        query = query.filter(Product.is_active == True)

    if industry_code:
        industry = db.query(Industry).filter(Industry.code == industry_code).first()
        if not industry:
            raise HTTPException(status_code=404, detail=f"Industry {industry_code} not found")
        query = query.filter(Product.industry_id == industry.id)

    products = query.all()
    return products


@router.get("/products/{product_code}", response_model=ProductResponse)
async def get_product(product_code: str, db: Session = Depends(get_db)):
    """Get a specific product by code."""
    product = db.query(Product).filter(Product.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_code} not found")
    return product


@router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    # Check if product already exists
    existing = db.query(Product).filter(Product.code == product.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product {product.code} already exists")

    # Get industry
    industry = db.query(Industry).filter(Industry.code == product.industry_code).first()
    if not industry:
        raise HTTPException(status_code=404, detail=f"Industry {product.industry_code} not found")

    db_product = Product(
        code=product.code,
        name_sl=product.name_sl,
        name_hr=product.name_hr,
        unit=product.unit,
        industry_id=industry.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# ============================================================================
# Base Price Endpoints
# ============================================================================

@router.get("/products/{product_code}/base-prices", response_model=List[ProductBasePriceResponse])
async def get_product_base_prices(
    product_code: str,
    include_history: bool = False,
    db: Session = Depends(get_db)
):
    """Get base prices for a product. By default returns only current price."""
    product = db.query(Product).filter(Product.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_code} not found")

    query = db.query(ProductBasePrice).filter(ProductBasePrice.product_id == product.id)

    if not include_history:
        # Get current price only (valid_to is NULL or in future)
        now = datetime.now(timezone.utc)
        query = query.filter(
            and_(
                ProductBasePrice.valid_from <= now,
                or_(
                    ProductBasePrice.valid_to == None,
                    ProductBasePrice.valid_to > now
                )
            )
        )

    prices = query.order_by(ProductBasePrice.valid_from.desc()).all()
    return prices


@router.post("/products/{product_code}/base-prices", response_model=ProductBasePriceResponse)
async def create_product_base_price(
    product_code: str,
    price: ProductBasePriceCreate,
    db: Session = Depends(get_db)
):
    """Create a new base price for a product. Automatically closes previous price."""
    product = db.query(Product).filter(Product.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_code} not found")

    # Calculate C0 and Cmin
    lc = price.lc
    c0 = lc * price.oh_factor
    cmin = c0 / (1 - price.min_profit_margin)

    # Set valid_from to now if not provided
    valid_from = price.valid_from if price.valid_from else datetime.now(timezone.utc)

    # Close any existing open-ended prices
    now = datetime.now(timezone.utc)
    existing_open_prices = db.query(ProductBasePrice).filter(
        and_(
            ProductBasePrice.product_id == product.id,
            ProductBasePrice.valid_to == None,
            ProductBasePrice.valid_from < valid_from
        )
    ).all()

    for old_price in existing_open_prices:
        old_price.valid_to = valid_from

    # Create new price
    db_price = ProductBasePrice(
        product_id=product.id,
        lc=lc,
        c0=c0,
        cmin=cmin,
        oh_factor=price.oh_factor,
        min_profit_margin=price.min_profit_margin,
        valid_from=valid_from,
        valid_to=price.valid_to,
        notes=price.notes
    )

    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price


# ============================================================================
# Customer Price Endpoints
# ============================================================================

@router.get("/products/{product_code}/customer-prices", response_model=List[CustomerProductPriceResponse])
async def get_product_customer_prices(
    product_code: str,
    customer_id: Optional[str] = None,
    include_history: bool = False,
    db: Session = Depends(get_db)
):
    """Get customer-specific prices for a product."""
    product = db.query(Product).filter(Product.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_code} not found")

    query = db.query(CustomerProductPrice).filter(CustomerProductPrice.product_id == product.id)

    if customer_id:
        query = query.filter(CustomerProductPrice.customer_id == customer_id)

    if not include_history:
        # Get current prices only
        now = datetime.now(timezone.utc)
        query = query.filter(
            and_(
                CustomerProductPrice.is_active == True,
                CustomerProductPrice.valid_from <= now,
                or_(
                    CustomerProductPrice.valid_to == None,
                    CustomerProductPrice.valid_to > now
                )
            )
        )

    prices = query.order_by(CustomerProductPrice.customer_id, CustomerProductPrice.valid_from.desc()).all()
    return prices


@router.post("/products/{product_code}/customer-prices", response_model=CustomerProductPriceResponse)
async def create_customer_product_price(
    product_code: str,
    price: CustomerProductPriceCreate,
    db: Session = Depends(get_db)
):
    """Create a new customer-specific price for a product."""
    product = db.query(Product).filter(Product.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_code} not found")

    # Get current base price to calculate coverage
    now = datetime.now(timezone.utc)
    base_price = db.query(ProductBasePrice).filter(
        and_(
            ProductBasePrice.product_id == product.id,
            ProductBasePrice.valid_from <= now,
            or_(
                ProductBasePrice.valid_to == None,
                ProductBasePrice.valid_to > now
            )
        )
    ).first()

    if not base_price:
        raise HTTPException(status_code=400, detail=f"No base price found for product {product_code}")

    # Calculate prices
    total_discounts = price.discount_invoice + price.discount_marketing + price.discount_yearend
    cp = price.strategic_cmin / (1 - total_discounts / 100)
    realized_price = cp * (1 - total_discounts / 100)

    # Calculate coverage
    coverage_vs_c0 = (realized_price / base_price.c0) * 100
    coverage_vs_cmin = (realized_price / base_price.cmin) * 100

    # Set valid_from to now if not provided
    valid_from = price.valid_from if price.valid_from else now

    # Close previous prices for same customer
    existing_open_prices = db.query(CustomerProductPrice).filter(
        and_(
            CustomerProductPrice.product_id == product.id,
            CustomerProductPrice.customer_id == price.customer_id,
            CustomerProductPrice.valid_to == None,
            CustomerProductPrice.valid_from < valid_from
        )
    ).all()

    for old_price in existing_open_prices:
        old_price.valid_to = valid_from
        old_price.is_active = False

    # Create new price
    db_price = CustomerProductPrice(
        product_id=product.id,
        customer_id=price.customer_id,
        customer_name=price.customer_name,
        customer_type=price.customer_type,
        strategic_cmin=price.strategic_cmin,
        discount_invoice=price.discount_invoice,
        discount_marketing=price.discount_marketing,
        discount_yearend=price.discount_yearend,
        total_discounts=total_discounts,
        cp=cp,
        realized_price=realized_price,
        coverage_vs_c0=coverage_vs_c0,
        coverage_vs_cmin=coverage_vs_cmin,
        valid_from=valid_from,
        valid_to=price.valid_to,
        is_active=True,
        notes=price.notes
    )

    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price


# ============================================================================
# Excel Upload Endpoint
# ============================================================================

@router.post("/upload-excel")
async def upload_excel_pricing(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload Excel file with pricing data.
    Expected sheets: 'Izdelki' and 'Cene_Kupci'.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")

    try:
        # Read Excel file
        contents = await file.read()
        xl = pd.ExcelFile(contents)

        # Check required sheets
        if 'Izdelki' not in xl.sheet_names:
            raise HTTPException(status_code=400, detail="Missing required sheet: 'Izdelki'")
        if 'Cene_Kupci' not in xl.sheet_names:
            raise HTTPException(status_code=400, detail="Missing required sheet: 'Cene_Kupci'")

        izdelki_df = pd.read_excel(contents, sheet_name='Izdelki')
        cene_kupci_df = pd.read_excel(contents, sheet_name='Cene_Kupci')

        # Validate columns
        required_izdelki_cols = ['šifra', 'naziv', 'enota', 'industrija', 'lc', 'aktiven']
        required_cene_cols = ['šifra', 'kupec_id', 'kupec_naziv', 'kupec_tip', 'strategic_cmin',
                              'popust_faktura', 'popust_marketing', 'popust_letni', 'aktiven']

        missing_izdelki = set(required_izdelki_cols) - set(izdelki_df.columns)
        missing_cene = set(required_cene_cols) - set(cene_kupci_df.columns)

        if missing_izdelki:
            raise HTTPException(status_code=400, detail=f"Missing columns in Izdelki: {missing_izdelki}")
        if missing_cene:
            raise HTTPException(status_code=400, detail=f"Missing columns in Cene_Kupci: {missing_cene}")

        # Process products
        products_created = 0
        base_prices_created = 0
        customer_prices_created = 0

        for _, row in izdelki_df.iterrows():
            if str(row['aktiven']).upper() not in ['DA', 'YES', 'TRUE', '1']:
                continue

            # Get or create industry
            industry = db.query(Industry).filter(Industry.name_sl == row['industrija']).first()
            if not industry:
                # Try Croatian name too
                industry = db.query(Industry).filter(Industry.name_hr == row['industrija']).first()

            if not industry:
                raise HTTPException(status_code=400, detail=f"Unknown industry: {row['industrija']}")

            # Get or create product
            product = db.query(Product).filter(Product.code == row['šifra']).first()
            if not product:
                product = Product(
                    code=row['šifra'],
                    name_sl=row['naziv'],
                    name_hr=row['naziv'],  # Same for now, can be different if needed
                    unit=row['enota'],
                    industry_id=industry.id,
                    is_active=True
                )
                db.add(product)
                db.flush()
                products_created += 1

            # Create base price
            lc = float(row['lc'])
            oh_factor = 1.25
            min_profit_margin = 0.0425
            c0 = lc * oh_factor
            cmin = c0 / (1 - min_profit_margin)

            # Check for existing open price
            now = datetime.now(timezone.utc)
            existing = db.query(ProductBasePrice).filter(
                and_(
                    ProductBasePrice.product_id == product.id,
                    ProductBasePrice.valid_to == None
                )
            ).first()

            if existing:
                existing.valid_to = now

            base_price = ProductBasePrice(
                product_id=product.id,
                lc=lc,
                c0=c0,
                cmin=cmin,
                oh_factor=oh_factor,
                min_profit_margin=min_profit_margin,
                valid_from=now,
                valid_to=None
            )
            db.add(base_price)
            base_prices_created += 1

        # Process customer prices
        for _, row in cene_kupci_df.iterrows():
            if str(row['aktiven']).upper() not in ['DA', 'YES', 'TRUE', '1']:
                continue

            product = db.query(Product).filter(Product.code == row['šifra']).first()
            if not product:
                continue  # Skip if product doesn't exist

            # Get current base price
            base_price = db.query(ProductBasePrice).filter(
                and_(
                    ProductBasePrice.product_id == product.id,
                    ProductBasePrice.valid_to == None
                )
            ).first()

            if not base_price:
                continue

            # Calculate prices
            strategic_cmin = float(row['strategic_cmin'])
            discount_invoice = float(row['popust_faktura'])
            discount_marketing = float(row['popust_marketing'])
            discount_yearend = float(row['popust_letni'])
            total_discounts = discount_invoice + discount_marketing + discount_yearend

            cp = strategic_cmin / (1 - total_discounts / 100)
            realized_price = cp * (1 - total_discounts / 100)
            coverage_vs_c0 = (realized_price / base_price.c0) * 100
            coverage_vs_cmin = (realized_price / base_price.cmin) * 100

            # Close existing price for this customer
            now = datetime.now(timezone.utc)
            existing = db.query(CustomerProductPrice).filter(
                and_(
                    CustomerProductPrice.product_id == product.id,
                    CustomerProductPrice.customer_id == row['kupec_id'],
                    CustomerProductPrice.valid_to == None
                )
            ).first()

            if existing:
                existing.valid_to = now
                existing.is_active = False

            # Create new price
            customer_price = CustomerProductPrice(
                product_id=product.id,
                customer_id=row['kupec_id'],
                customer_name=row['kupec_naziv'],
                customer_type=row['kupec_tip'],
                strategic_cmin=strategic_cmin,
                discount_invoice=discount_invoice,
                discount_marketing=discount_marketing,
                discount_yearend=discount_yearend,
                total_discounts=total_discounts,
                cp=cp,
                realized_price=realized_price,
                coverage_vs_c0=coverage_vs_c0,
                coverage_vs_cmin=coverage_vs_cmin,
                valid_from=now,
                valid_to=None,
                is_active=True
            )
            db.add(customer_price)
            customer_prices_created += 1

        db.commit()

        return {
            "status": "success",
            "message": "Pricing data uploaded successfully",
            "products_created": products_created,
            "base_prices_created": base_prices_created,
            "customer_prices_created": customer_prices_created
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}")


@router.post("/upload-simple-excel")
async def upload_simple_excel_pricing(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload Excel file with simple 3-column format (Article Code, Article Name, LC Price).
    Handles files with or without headers.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")

    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(contents, sheet_name=0)  # Read first sheet

        # Auto-detect columns
        headers = df.columns.tolist()

        # Find article code column (can be __EMPTY, šifra, article, etc.)
        code_col = None
        name_col = None
        lc_col = None

        for h in headers:
            h_str = str(h)
            if h_str == '__EMPTY' and code_col is None:
                code_col = h
            elif h_str == '__EMPTY_1' and name_col is None:
                name_col = h
            elif h_str.upper() == 'LC':
                lc_col = h
            elif not code_col and any(x in h_str.lower() for x in ['šifra', 'artikel', 'article', 'number', 'broj']):
                code_col = h
            elif not name_col and any(x in h_str.lower() for x in ['naziv', 'name', 'ime']):
                name_col = h
            elif not lc_col and any(x in h_str.lower() for x in ['cena', 'price', 'cijena']):
                lc_col = h

        if not code_col or not name_col or not lc_col:
            raise HTTPException(
                status_code=400,
                detail=f"Could not identify required columns. Found: {headers}"
            )

        # Get or create "imported-products" industry
        industry = db.query(Industry).filter(Industry.code == 'imported-products').first()
        if not industry:
            industry = Industry(
                code='imported-products',
                name_sl='Uvoženi proizvodi',
                name_hr='Uvezeni proizvodi',
                icon='[Upload]',
                is_active=True
            )
            db.add(industry)
            db.flush()

        # Process products
        products_created = 0
        products_updated = 0
        base_prices_created = 0
        now = datetime.now(timezone.utc)

        for _, row in df.iterrows():
            try:
                code = str(row[code_col]).strip() if pd.notna(row[code_col]) else ''
                name = str(row[name_col]).strip() if pd.notna(row[name_col]) else ''
                lc_value = float(row[lc_col]) if pd.notna(row[lc_col]) else 0

                # Skip invalid rows
                if not code or not name or lc_value <= 0:
                    continue

                # Get or create product
                product = db.query(Product).filter(Product.code == code).first()
                if not product:
                    product = Product(
                        code=code,
                        name_sl=name,
                        name_hr=name,
                        unit='kg',
                        industry_id=industry.id,
                        is_active=True
                    )
                    db.add(product)
                    db.flush()
                    products_created += 1
                else:
                    # Update existing product
                    product.name_sl = name
                    product.name_hr = name
                    product.is_active = True
                    products_updated += 1

                # Calculate prices
                oh_factor = 1.25
                min_profit_margin = 0.0425
                c0 = lc_value * oh_factor
                cmin = c0 / (1 - min_profit_margin)

                # Close existing open prices
                existing = db.query(ProductBasePrice).filter(
                    and_(
                        ProductBasePrice.product_id == product.id,
                        ProductBasePrice.valid_to == None
                    )
                ).first()

                if existing:
                    existing.valid_to = now

                # Create new base price
                base_price = ProductBasePrice(
                    product_id=product.id,
                    lc=lc_value,
                    c0=c0,
                    cmin=cmin,
                    oh_factor=oh_factor,
                    min_profit_margin=min_profit_margin,
                    valid_from=now,
                    valid_to=None
                )
                db.add(base_price)
                base_prices_created += 1

            except Exception as e:
                print(f"Error processing row: {e}")
                continue

        db.commit()

        return {
            "status": "success",
            "message": "Simple pricing data uploaded successfully",
            "products_created": products_created,
            "products_updated": products_updated,
            "base_prices_created": base_prices_created
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}")


@router.get("/products-with-prices")
async def get_products_with_prices(db: Session = Depends(get_db)):
    """
    Get all active products grouped by industry with their current base prices.
    Returns data in format suitable for the pricing UI.
    """
    try:
        # Get all active industries
        industries = db.query(Industry).filter(Industry.is_active == True).all()

        result = {
            "industries": [],
            "products": []
        }

        now = datetime.now(timezone.utc)

        for industry in industries:
            industry_data = {
                "id": industry.code,
                "code": industry.code,
                "nameSl": industry.name_sl,
                "nameHr": industry.name_hr,
                "icon": industry.icon,
                "products": []
            }

            # Get products for this industry
            products = db.query(Product).filter(
                and_(
                    Product.industry_id == industry.id,
                    Product.is_active == True
                )
            ).all()

            for product in products:
                # Get current base price
                base_price = db.query(ProductBasePrice).filter(
                    and_(
                        ProductBasePrice.product_id == product.id,
                        ProductBasePrice.valid_from <= now,
                        or_(
                            ProductBasePrice.valid_to == None,
                            ProductBasePrice.valid_to > now
                        )
                    )
                ).first()

                if base_price:
                    product_data = {
                        "id": f"db-{product.id}",
                        "code": product.code,
                        "nameSl": product.name_sl,
                        "nameHr": product.name_hr,
                        "unit": product.unit,
                        "lc": base_price.lc
                    }
                    industry_data["products"].append(product_data)

            if industry_data["products"]:  # Only add industry if it has products
                result["industries"].append(industry_data)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")


# ============================================================================
# Pricing History Endpoints
# ============================================================================

@router.get("/history/product/{product_code}")
async def get_product_pricing_history(
    product_code: str,
    db: Session = Depends(get_db)
):
    """Get complete pricing history for a product."""
    product = db.query(Product).filter(Product.code == product_code).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_code} not found")

    # Get all base prices
    base_prices = db.query(ProductBasePrice).filter(
        ProductBasePrice.product_id == product.id
    ).order_by(ProductBasePrice.valid_from.desc()).all()

    # Get all customer prices
    customer_prices = db.query(CustomerProductPrice).filter(
        CustomerProductPrice.product_id == product.id
    ).order_by(CustomerProductPrice.customer_id, CustomerProductPrice.valid_from.desc()).all()

    return {
        "product": {
            "code": product.code,
            "name_sl": product.name_sl,
            "name_hr": product.name_hr,
            "unit": product.unit
        },
        "base_price_history": [
            {
                "id": bp.id,
                "lc": bp.lc,
                "c0": bp.c0,
                "cmin": bp.cmin,
                "valid_from": bp.valid_from,
                "valid_to": bp.valid_to,
                "created_at": bp.created_at,
                "notes": bp.notes
            }
            for bp in base_prices
        ],
        "customer_price_history": [
            {
                "id": cp.id,
                "customer_id": cp.customer_id,
                "customer_name": cp.customer_name,
                "strategic_cmin": cp.strategic_cmin,
                "cp": cp.cp,
                "realized_price": cp.realized_price,
                "total_discounts": cp.total_discounts,
                "coverage_vs_cmin": cp.coverage_vs_cmin,
                "valid_from": cp.valid_from,
                "valid_to": cp.valid_to,
                "is_active": cp.is_active,
                "notes": cp.notes
            }
            for cp in customer_prices
        ]
    }


# ========================================
# Industry Production Factors
# ========================================

class IndustryProductionFactorResponse(BaseModel):
    id: int
    industry_id: int
    industry_code: str
    industry_name_sl: str
    industry_name_hr: str
    production_factor: float

    class Config:
        from_attributes = True


class IndustryProductionFactorUpdate(BaseModel):
    production_factor: float


@router.get("/production-factors", response_model=List[IndustryProductionFactorResponse])
async def get_production_factors(db: Session = Depends(get_db)):
    """
    Get all industry production factors.
    Returns a 3×2 table: 3 industries with their production factors.
    """
    factors = db.query(IndustryProductionFactor).join(Industry).all()

    return [
        {
            "id": factor.id,
            "industry_id": factor.industry_id,
            "industry_code": factor.industry.code,
            "industry_name_sl": factor.industry.name_sl,
            "industry_name_hr": factor.industry.name_hr,
            "production_factor": factor.production_factor
        }
        for factor in factors
    ]


@router.put("/production-factors/{industry_code}", response_model=IndustryProductionFactorResponse)
async def update_production_factor(
    industry_code: str,
    update: IndustryProductionFactorUpdate,
    db: Session = Depends(get_db)
):
    """
    Update the production factor for a specific industry.
    The production factor is used to calculate: LC × production_factor = production price threshold.
    """
    # Find industry
    industry = db.query(Industry).filter(Industry.code == industry_code).first()
    if not industry:
        raise HTTPException(status_code=404, detail=f"Industry with code '{industry_code}' not found")

    # Find or create production factor
    factor = db.query(IndustryProductionFactor).filter(
        IndustryProductionFactor.industry_id == industry.id
    ).first()

    if not factor:
        # Create new factor if doesn't exist
        factor = IndustryProductionFactor(
            industry_id=industry.id,
            production_factor=update.production_factor
        )
        db.add(factor)
    else:
        # Update existing factor
        factor.production_factor = update.production_factor

    db.commit()
    db.refresh(factor)

    return {
        "id": factor.id,
        "industry_id": factor.industry_id,
        "industry_code": industry.code,
        "industry_name_sl": industry.name_sl,
        "industry_name_hr": industry.name_hr,
        "production_factor": factor.production_factor
    }

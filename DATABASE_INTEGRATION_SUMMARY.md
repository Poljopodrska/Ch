# Pricing V4 Database Integration Summary

**Date:** 2025-11-04
**Version:** 4.0.2
**Status:** ✅ BACKEND COMPLETE - FRONTEND INTEGRATION NEEDED

---

## 🎯 Overview

The Pricing V4 module now has **complete database backend integration** with comprehensive price history tracking. All pricing data (products, base prices, customer prices) is now stored in PostgreSQL with full audit trail.

---

## 📊 Database Schema

### Tables Created

#### 1. **industries**
Product categories (Industrije)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| code | VARCHAR(50) | Unique code (fresh-meat, meat-products, delamaris) |
| name_sl | VARCHAR(255) | Slovenian name |
| name_hr | VARCHAR(255) | Croatian name |
| icon | VARCHAR(10) | Emoji icon (🐔, 🥩, 🐟) |
| is_active | BOOLEAN | Active flag |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Seeded Data:**
- Sveže meso / Svježe meso (🐔)
- Mesni izdelki in pečeno meso / Mesni proizvodi i pečeno meso (🥩)
- Delamaris / Delamaris (🐟)

#### 2. **products**
Product master data

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| code | VARCHAR(50) | Unique product code (e.g., PIŠ-FILE) |
| name_sl | VARCHAR(255) | Slovenian name |
| name_hr | VARCHAR(255) | Croatian name |
| unit | VARCHAR(20) | Unit of measure (kg, kos/kom) |
| industry_id | INTEGER | FK to industries |
| is_active | BOOLEAN | Active flag |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### 3. **product_base_prices**
Base pricing with history (LC, C0, Cmin)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| product_id | INTEGER | FK to products |
| lc | FLOAT | Lastna cena (production cost without OH) |
| c0 | FLOAT | Break-even price (LC × OH factor) |
| cmin | FLOAT | Minimum acceptable (C0 / (1 - min_profit_margin)) |
| oh_factor | FLOAT | Overhead factor (default: 1.25) |
| min_profit_margin | FLOAT | Minimum profit % (default: 0.0425 = 4.25%) |
| **valid_from** | TIMESTAMP | **Price valid from (defaults to NOW)** |
| **valid_to** | TIMESTAMP | **Price valid until (NULL = unlimited)** |
| created_at | TIMESTAMP | When this record was created |
| created_by | VARCHAR(100) | User who created this price |
| notes | VARCHAR(500) | Optional notes about price change |

**Key Features:**
- ✅ History tracking: All price changes preserved
- ✅ Automatic closure: New price closes previous (sets valid_to)
- ✅ Default validity: From upload time, unlimited end
- ✅ Query current prices: WHERE valid_from <= NOW AND (valid_to IS NULL OR valid_to > NOW)

#### 4. **customer_product_prices**
Customer-specific pricing with history

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| product_id | INTEGER | FK to products |
| customer_id | VARCHAR(50) | Customer ID (e.g., c001) |
| customer_name | VARCHAR(255) | Customer name |
| customer_type | VARCHAR(100) | Type (Trgovska veriga, etc.) |
| strategic_cmin | FLOAT | Strategic minimum price |
| discount_invoice | FLOAT | Invoice discount % |
| discount_marketing | FLOAT | Marketing discount % |
| discount_yearend | FLOAT | Year-end discount % |
| total_discounts | FLOAT | Sum of all discounts |
| cp | FLOAT | Customer Price (quoted) |
| realized_price | FLOAT | Price after discounts |
| coverage_vs_c0 | FLOAT | Coverage % vs C0 |
| coverage_vs_cmin | FLOAT | Coverage % vs Cmin |
| **valid_from** | TIMESTAMP | **Price valid from (defaults to NOW)** |
| **valid_to** | TIMESTAMP | **Price valid until (NULL = unlimited)** |
| is_active | BOOLEAN | Active flag |
| created_at | TIMESTAMP | When this record was created |
| created_by | VARCHAR(100) | User who created this price |
| notes | VARCHAR(500) | Optional notes |

**Key Features:**
- ✅ Per-customer pricing with full discount breakdown
- ✅ Auto-calculated: CP, realized_price, coverage metrics
- ✅ History per customer: Track all price changes per customer
- ✅ Active flag: Quick filter for current prices

---

## 🔌 API Endpoints

Base URL: `/api/v1/pricing`

### Industries

#### `GET /industries`
List all active industries

**Response:**
```json
[
  {
    "id": 1,
    "code": "fresh-meat",
    "name_sl": "Sveže meso",
    "name_hr": "Svježe meso",
    "icon": "🐔",
    "is_active": true
  }
]
```

---

### Products

#### `GET /products`
List all products

**Query Parameters:**
- `industry_code` (optional): Filter by industry
- `active_only` (optional, default: true): Show only active products

**Response:**
```json
[
  {
    "id": 1,
    "code": "PIŠ-FILE",
    "name_sl": "Piščančji file",
    "name_hr": "Pileći file",
    "unit": "kg",
    "industry_id": 1,
    "is_active": true
  }
]
```

#### `GET /products/{product_code}`
Get specific product

#### `POST /products`
Create new product

**Request:**
```json
{
  "code": "PIŠ-FILE",
  "name_sl": "Piščančji file",
  "name_hr": "Pileći file",
  "unit": "kg",
  "industry_code": "fresh-meat"
}
```

---

### Base Prices

#### `GET /products/{product_code}/base-prices?include_history=false`
Get base prices for a product

**Query Parameters:**
- `include_history` (default: false): If true, returns all historical prices

**Response (current price only):**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "lc": 5.44,
    "c0": 6.80,
    "cmin": 7.10,
    "oh_factor": 1.25,
    "min_profit_margin": 0.0425,
    "valid_from": "2025-11-04T12:00:00Z",
    "valid_to": null,
    "created_at": "2025-11-04T12:00:00Z"
  }
]
```

#### `POST /products/{product_code}/base-prices`
Create new base price (automatically closes previous)

**Request:**
```json
{
  "product_code": "PIŠ-FILE",
  "lc": 5.44,
  "oh_factor": 1.25,
  "min_profit_margin": 0.0425,
  "valid_from": null,
  "valid_to": null,
  "notes": "Price increase due to raw material cost"
}
```

**Notes:**
- `valid_from`: If null, defaults to NOW
- `valid_to`: If null, unlimited validity
- Previous open-ended prices automatically closed

---

### Customer Prices

#### `GET /products/{product_code}/customer-prices?customer_id=c001&include_history=false`
Get customer-specific prices

**Query Parameters:**
- `customer_id` (optional): Filter by customer
- `include_history` (default: false): Include historical prices

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "customer_id": "c001",
    "customer_name": "Plodine",
    "customer_type": "Trgovska veriga",
    "strategic_cmin": 7.25,
    "discount_invoice": 15.0,
    "discount_marketing": 3.0,
    "discount_yearend": 11.0,
    "total_discounts": 29.0,
    "cp": 10.21,
    "realized_price": 7.25,
    "coverage_vs_c0": 106.6,
    "coverage_vs_cmin": 102.1,
    "valid_from": "2025-11-04T12:00:00Z",
    "valid_to": null,
    "is_active": true
  }
]
```

#### `POST /products/{product_code}/customer-prices`
Create new customer price

**Request:**
```json
{
  "product_code": "PIŠ-FILE",
  "customer_id": "c001",
  "customer_name": "Plodine",
  "customer_type": "Trgovska veriga",
  "strategic_cmin": 7.25,
  "discount_invoice": 15.0,
  "discount_marketing": 3.0,
  "discount_yearend": 11.0,
  "valid_from": null,
  "valid_to": null,
  "notes": "New contract terms"
}
```

**Auto-calculated fields:**
- `total_discounts` = sum of all discounts
- `cp` = strategic_cmin / (1 - total_discounts/100)
- `realized_price` = cp × (1 - total_discounts/100)
- `coverage_vs_c0` = (realized_price / c0) × 100
- `coverage_vs_cmin` = (realized_price / cmin) × 100

---

### Excel Upload

#### `POST /upload-excel`
Bulk upload pricing data from Excel

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (Excel file)

**Excel Format:**

**Sheet 1: "Izdelki"**
| šifra | naziv | enota | industrija | lc | aktiven |
|-------|-------|-------|-----------|-----|---------|
| PIŠ-FILE | Piščančji file | kg | Sveže meso | 5.44 | DA |

**Sheet 2: "Cene_Kupci"**
| šifra | kupec_id | kupec_naziv | kupec_tip | strategic_cmin | popust_faktura | popust_marketing | popust_letni | aktiven |
|-------|----------|-------------|-----------|----------------|----------------|------------------|--------------|---------|
| PIŠ-FILE | c001 | Plodine | Trgovska veriga | 7.25 | 15 | 3 | 11 | DA |

**Response:**
```json
{
  "status": "success",
  "message": "Pricing data uploaded successfully",
  "products_created": 10,
  "base_prices_created": 10,
  "customer_prices_created": 21
}
```

**Important Notes:**
- `aktiven`: DA, YES, TRUE, or 1 (case-insensitive)
- Automatically closes previous prices (sets valid_to)
- All calculations done server-side
- Validates industry names against database

---

### Pricing History

#### `GET /history/product/{product_code}`
Get complete pricing history for a product

**Response:**
```json
{
  "product": {
    "code": "PIŠ-FILE",
    "name_sl": "Piščančji file",
    "name_hr": "Pileći file",
    "unit": "kg"
  },
  "base_price_history": [
    {
      "id": 2,
      "lc": 5.60,
      "c0": 7.00,
      "cmin": 7.31,
      "valid_from": "2025-11-04T14:00:00Z",
      "valid_to": null,
      "created_at": "2025-11-04T14:00:00Z",
      "notes": "Price increase"
    },
    {
      "id": 1,
      "lc": 5.44,
      "c0": 6.80,
      "cmin": 7.10,
      "valid_from": "2025-11-04T12:00:00Z",
      "valid_to": "2025-11-04T14:00:00Z",
      "created_at": "2025-11-04T12:00:00Z",
      "notes": "Initial price"
    }
  ],
  "customer_price_history": [
    {
      "id": 2,
      "customer_id": "c001",
      "customer_name": "Plodine",
      "strategic_cmin": 7.50,
      "cp": 10.56,
      "realized_price": 7.50,
      "total_discounts": 29.0,
      "coverage_vs_cmin": 102.6,
      "valid_from": "2025-11-04T14:00:00Z",
      "valid_to": null,
      "is_active": true,
      "notes": "Contract renewal"
    },
    {
      "id": 1,
      "customer_id": "c001",
      "customer_name": "Plodine",
      "strategic_cmin": 7.25,
      "cp": 10.21,
      "realized_price": 7.25,
      "total_discounts": 29.0,
      "coverage_vs_cmin": 102.1,
      "valid_from": "2025-11-04T12:00:00Z",
      "valid_to": "2025-11-04T14:00:00Z",
      "is_active": false,
      "notes": "Initial price"
    }
  ]
}
```

---

## 🚀 Setup Instructions

### 1. Create Database Tables

```bash
cd /mnt/c/Users/HP/Ch/backend
python create_pricing_tables.py
```

**This will:**
- Create all 4 tables (industries, products, product_base_prices, customer_product_prices)
- Seed 3 industries
- Display confirmation

### 2. Start Backend Server

Ensure your FastAPI backend is running and the pricing endpoints are registered.

### 3. Upload Initial Data

Use the Excel upload endpoint to populate initial pricing data:

```bash
curl -X POST http://your-backend-url/api/v1/pricing/upload-excel \
  -H "Content-Type: multipart/form-data" \
  -F "file=@pricing_data.xlsx"
```

---

## 📝 Price Validity Logic

### How It Works

**Default Behavior:**
- New prices start **immediately** (valid_from = NOW)
- New prices have **unlimited validity** (valid_to = NULL)
- Previous open prices are **automatically closed** (valid_to set to new price's valid_from)

**Example Timeline:**

```
Time          | Action                    | Database State
-------------|---------------------------|------------------
12:00        | Upload LC=5.44            | Price1: 12:00 → NULL
14:00        | Upload LC=5.60            | Price1: 12:00 → 14:00
             |                           | Price2: 14:00 → NULL
16:00        | Query current price       | Returns Price2 (active)
16:00        | Query with history=true   | Returns Price1 + Price2
```

### Custom Validity Periods

You can specify custom validity periods:

```json
{
  "lc": 5.44,
  "valid_from": "2025-12-01T00:00:00Z",
  "valid_to": "2026-01-31T23:59:59Z",
  "notes": "Special promotion price"
}
```

**Use cases:**
- **Seasonal pricing**: Set valid_from and valid_to for specific periods
- **Promotional prices**: Temporary price with automatic expiry
- **Future prices**: Schedule price changes in advance

---

## 🔍 Querying Prices

### Get Current Price (Most Common)

```sql
SELECT * FROM product_base_prices
WHERE product_id = 1
  AND valid_from <= NOW()
  AND (valid_to IS NULL OR valid_to > NOW())
ORDER BY valid_from DESC
LIMIT 1;
```

### Get Price at Specific Date

```sql
SELECT * FROM product_base_prices
WHERE product_id = 1
  AND valid_from <= '2025-11-01'
  AND (valid_to IS NULL OR valid_to > '2025-11-01')
ORDER BY valid_from DESC
LIMIT 1;
```

### Get All Price History

```sql
SELECT * FROM product_base_prices
WHERE product_id = 1
ORDER BY valid_from DESC;
```

---

## 🎨 Frontend Integration (Next Steps)

### Required Changes to pricing_v4_price_levels.js

1. **Replace loadProductStructure()** - Fetch from `/api/v1/pricing/products`
2. **Replace loadPricingData()** - Fetch from `/api/v1/pricing/products/{code}/base-prices`
3. **Replace loadCustomerPricing()** - Fetch from `/api/v1/pricing/products/{code}/customer-prices`
4. **Update processExcelFile()** - POST to `/api/v1/pricing/upload-excel`
5. **Add price history view** - Use `/api/v1/pricing/history/product/{code}`

### Example API Call

```javascript
async loadProductsFromAPI() {
    try {
        const response = await fetch('/api/v1/pricing/products');
        const products = await response.json();

        // Group by industry
        const groupedByIndustry = {};
        for (const product of products) {
            const industry = product.industry;
            if (!groupedByIndustry[industry.code]) {
                groupedByIndustry[industry.code] = {
                    ...industry,
                    products: []
                };
            }
            groupedByIndustry[industry.code].products.push(product);
        }

        this.state.productGroups = Object.values(groupedByIndustry);
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}
```

---

## 📊 Benefits Summary

### ✅ What's Now Possible

1. **Complete Price History**
   - Track every price change
   - See who changed what and when
   - Audit trail for compliance

2. **Time-Based Queries**
   - "What was the price on date X?"
   - "When did price change from A to B?"
   - Historical reporting

3. **Automatic Price Management**
   - New prices close old prices automatically
   - No manual cleanup needed
   - Prevents overlapping validity periods

4. **Flexible Validity**
   - Immediate pricing (default)
   - Scheduled future prices
   - Promotional/seasonal pricing
   - Unlimited or time-bound validity

5. **Multi-Customer Tracking**
   - Per-customer price history
   - Compare customer prices over time
   - Analyze pricing strategies

6. **Performance Optimization**
   - Pre-calculated coverage metrics
   - Indexed queries (product_id, customer_id, valid_from)
   - Efficient current price lookup

---

## 🔧 Database Indexes

The following indexes are automatically created:

- `products.code` (unique)
- `industries.code` (unique)
- `product_base_prices.product_id`
- `customer_product_prices.product_id`
- `customer_product_prices.customer_id`
- `customers.customer_code` (if customer table exists)

**Query Performance:**
- Current price lookup: O(log n) with index
- Historical queries: Full scan, but limited by product_id
- Excel upload: Bulk insert with transactional integrity

---

## 📖 Example Usage

### Scenario: Price Increase

**Step 1:** Check current price
```bash
GET /api/v1/pricing/products/PIŠ-FILE/base-prices
# Returns: LC=5.44, valid_from=12:00, valid_to=NULL
```

**Step 2:** Create new price
```bash
POST /api/v1/pricing/products/PIŠ-FILE/base-prices
{
  "lc": 5.60,
  "notes": "Raw material cost increase"
}
```

**Step 3:** Verify history
```bash
GET /api/v1/pricing/products/PIŠ-FILE/base-prices?include_history=true
# Returns:
# - LC=5.60, valid_from=14:00, valid_to=NULL (current)
# - LC=5.44, valid_from=12:00, valid_to=14:00 (historical)
```

---

## 🎯 Next Steps

### Frontend Integration
1. Update pricing module to use API endpoints
2. Add price history view UI component
3. Display validity dates in pricing tables
4. Add "View History" button per product

### Backend Enhancements
1. Add authentication/authorization
2. Add user audit fields (created_by, updated_by)
3. Add bulk update endpoints
4. Add pricing analytics endpoints

### Reporting
1. Price change report (what changed when)
2. Customer price comparison report
3. Coverage trend analysis
4. Margin analysis over time

---

## ✅ Completion Checklist

- [x] Database schema designed with history tracking
- [x] SQLAlchemy models created
- [x] FastAPI endpoints implemented
- [x] Price validity with valid_from/valid_to
- [x] Automatic price closure logic
- [x] Excel upload with DA/NE support
- [x] Pricing history API endpoint
- [x] Database migration script
- [x] Industries seeded
- [ ] Frontend connected to API
- [ ] Price history UI view
- [ ] User testing with real data

---

**STATUS: BACKEND COMPLETE ✅**
**NEXT: Frontend Integration**

---

*End of Database Integration Summary*

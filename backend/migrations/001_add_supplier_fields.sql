-- Migration: Add supplies and additional_delay_days fields to suppliers table
-- Date: 2025-11-08
-- Description: Adds new fields for supplier management

-- Add supplies column (what the supplier provides)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplies VARCHAR(500);

-- Add additional_delay_days column (acceptable delay beyond payment terms)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS additional_delay_days INTEGER DEFAULT 0;

-- Add comment to explain the fields
COMMENT ON COLUMN suppliers.supplies IS 'Short description of what the supplier provides (e.g., Surovine za proizvodnjo, Embalaža)';
COMMENT ON COLUMN suppliers.additional_delay_days IS 'Additional days we can delay beyond payment_terms_days without consequences';

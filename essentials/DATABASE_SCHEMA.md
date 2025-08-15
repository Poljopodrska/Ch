# Ch Project Database Schema
*Auto-generated every 30 minutes - DO NOT EDIT MANUALLY*  
*Last Updated: 2025-07-21 19:26:41*

## Overview
This document contains the current database schema for the Ch project.
All tables, columns, types, and relationships are automatically extracted from the database.

## Tables

### advice_log
*Advice Log table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farmer_id | integer | NO |  | FK→farmers.id |
| field_id | integer | YES |  | FK→fields.id |
| advice_text | text | NO |  |  |
| status | varchar(20) | YES | 'pending'::character varying |  |
| timestamp | timestamp | NO |  |  |
| approved_by | integer | YES |  |  |

### chat_messages
*Chat Messages table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| wa_phone_number | character varying | NO |  |  |
| role | character varying | NO |  |  |
| content | text | NO |  |  |
| timestamp | timestamp | NO |  |  |

### chicken_products
*Chicken Products table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| a1_article_no | bigint | YES |  |  |
| category | text | YES |  |  |
| customer_no | bigint | YES |  |  |
| customer_name | text | YES |  |  |
| a2_article_no | text | YES |  |  |
| a2_name | text | YES |  |  |
| a1_name | text | YES |  |  |
| quantity | double precision | YES |  |  |
| price_eur | double precision | YES |  |  |
| turnover_eur | double precision | YES |  |  |
| production_cost_incl_LOH_eur | double precision | YES |  |  |
| margin_eur | double precision | YES |  |  |
| relative_margin | double precision | YES |  |  |
| group_1a | text | YES |  |  |
| group_2a | text | YES |  |  |
| pl_or_brand | text | YES |  |  |
| kept_or_cancelled | text | YES |  |  |

### consultation_triggers
*Consultation Triggers table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| trigger_type | varchar(20) | YES |  |  |
| trigger_value | varchar(100) | YES |  |  |
| description | text | YES |  |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP |  |

### conversation_state
*Conversation State table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| phone_number | varchar(20) | NO |  | PK |
| current_step | integer | YES | 0 |  |
| expected_yield | double precision | YES |  |  |
| soil_analysis | boolean | YES |  |  |
| fertilizer_stock | boolean | YES |  |  |
| npk_ratio | varchar(20) | YES |  |  |
| last_updated | timestamp | YES | CURRENT_TIMESTAMP |  |

### cp_products
*Cp Products table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| product_name | varchar(512) | NO |  | UNIQUE |
| application_rate | varchar(50) | YES |  |  |
| target_issue | varchar(100) | YES |  |  |
| approved_crops | varchar(200) | YES |  |  |
| crop_hr | varchar(255) | YES |  | UNIQUE |
| crop_lat | varchar(255) | YES |  |  |
| pest_hr | varchar(255) | YES |  | UNIQUE |
| pest_lat | varchar(255) | YES |  |  |
| dose | text | YES |  |  |
| pre_harvest_interval | varchar(100) | YES |  |  |
| remarks | text | YES |  |  |
| expiry | varchar(20) | YES |  |  |
| source_file | varchar(100) | YES |  |  |
| country | varchar(50) | YES | 'Croatia'::character varying | UNIQUE |
| material_id | integer | YES |  | FK→material_catalog.id |

### crop_nutrient_needs
*Crop Nutrient Needs table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| crop | varchar(100) | NO |  |  |
| expected_yield_t_ha | decimal(10,2) | YES |  |  |
| p2o5_need_per_ton_kg_ton | varchar(50) | YES |  |  |
| k2o_need_per_ton_kg_ton | varchar(50) | YES |  |  |
| n_to_reach_expected_yield_kg_ha | decimal(10,2) | YES |  |  |
| n_change_per_ton_yield_kg_ha_ton | varchar(50) | YES |  |  |
| n_minimum_regarding_kg_ha | varchar(50) | YES |  |  |
| n_maximum_regarding_kg_ha | varchar(50) | YES |  |  |
| other_elements_per_ton | text | YES |  |  |
| notes | text | YES |  |  |

### crop_technology
*Crop Technology table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| crop_name | varchar(50) | NO |  |  |
| stage | varchar(50) | NO |  |  |
| action | varchar(100) | NO |  |  |
| timing | varchar(100) | NO |  |  |
| inputs | text | YES |  |  |
| notes | text | YES |  |  |

### farm_machinery
*Farm Machinery table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farm_id | integer | YES |  | FK→farmers.id |
| category | varchar(50) | YES |  |  |
| subcategory | varchar(50) | YES |  |  |
| year_of_production | integer | YES |  |  |
| year_of_purchase | integer | YES |  |  |
| purchase_price | double precision | YES |  |  |
| producer | varchar(50) | YES |  |  |
| model | varchar(50) | YES |  |  |
| horsepower_tractor | integer | YES |  |  |
| has_navigation | boolean | YES |  |  |
| navigation_producer | varchar(50) | YES |  |  |
| navigation_model | varchar(50) | YES |  |  |
| navigation_reads_maps | boolean | YES |  |  |
| navigation_reads_maps_producer | varchar(50) | YES |  |  |
| navigation_reads_maps_model | varchar(50) | YES |  |  |
| horsepower_harvester | integer | YES |  |  |
| harvesting_width_cereals | double precision | YES |  |  |
| harvesting_width_maize | double precision | YES |  |  |
| harvesting_width_sunflower | double precision | YES |  |  |
| can_map_yield | boolean | YES |  |  |
| sowing_units_maize | integer | YES |  |  |
| can_add_fertilizer_maize | boolean | YES |  |  |
| can_add_microgranules_maize | boolean | YES |  |  |
| distance_between_units_cm | double precision | YES |  |  |
| distance_variable | boolean | YES |  |  |
| can_read_prescription_maps_maize | boolean | YES |  |  |
| distance_between_rows_cereals | double precision | YES |  |  |
| can_add_fertilizer_cereals | boolean | YES |  |  |
| can_add_microgranules_cereals | boolean | YES |  |  |
| width_sowing_cereals | double precision | YES |  |  |
| can_read_prescription_maps_cereals | boolean | YES |  |  |
| plough_bodies | integer | YES |  |  |
| plough_size | integer | YES |  |  |
| podrivač_width | double precision | YES |  |  |
| sjetvospremač_producer | varchar(50) | YES |  |  |
| sjetvospremač_model | varchar(50) | YES |  |  |
| sjetvospremač_width | double precision | YES |  |  |
| rotobrana_width | double precision | YES |  |  |
| fertilizer_spreader_producer | varchar(50) | YES |  |  |
| fertilizer_spreader_model | varchar(50) | YES |  |  |
| can_read_prescription_maps_spreader | boolean | YES |  |  |
| can_adjust_quantity_from_cabin | boolean | YES |  |  |
| cultivation_width_maize | double precision | YES |  |  |
| can_add_fertilizer_cultivation | boolean | YES |  |  |
| sprayer_width | double precision | YES |  |  |
| has_section_control | boolean | YES |  |  |
| can_read_prescription_maps_sprayer | boolean | YES |  |  |
| notes | text | YES |  |  |

### farm_organic_fertilizers
*Farm Organic Fertilizers table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farm_id | integer | YES |  | FK→farmers.id |
| fertilizer_id | integer | YES |  | FK→fertilizers.id |
| npk_composition | varchar(20) | YES |  |  |
| analysis_date | date | YES |  |  |
| notes | text | YES |  |  |

### farmers
*Farmers table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| state_farm_number | varchar(50) | YES |  | UNIQUE |
| state_farm_number | varchar(50) | YES |  | UNIQUE |
| state_farm_number | varchar(50) | YES |  | UNIQUE |
| farm_name | varchar(100) | YES |  |  |
| manager_name | varchar(50) | YES |  |  |
| manager_last_name | varchar(50) | YES |  |  |
| street_and_no | varchar(100) | YES |  |  |
| village | varchar(100) | YES |  |  |
| postal_code | varchar(20) | YES |  |  |
| city | varchar(100) | YES |  |  |
| country | varchar(50) | YES |  | UNIQUE |
| vat_no | varchar(50) | YES |  | UNIQUE |
| email | varchar(100) | YES |  |  |
| phone | varchar(20) | YES |  |  |
| wa_phone_number | varchar(20) | YES |  |  |
| notes | text | YES |  |  |

### fertilizers
*Fertilizers table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| product_name | varchar(100) | NO |  |  |
| npk_composition | varchar(20) | YES |  |  |
| notes | text | YES |  |  |
| common_name | varchar(50) | YES |  |  |
| is_organic | boolean | YES | false |  |
| is_calcification | boolean | YES | false |  |
| ca_content | double precision | YES |  |  |
| country | varchar(50) | YES | 'Croatia'::character varying |  |
| producer | varchar(50) | YES |  |  |
| formulations | varchar(20) | YES |  |  |
| granulation | varchar(50) | YES |  |  |
| material_id | integer | YES |  | FK→material_catalog.id |

### fertilizing_plans
*Fertilizing Plans table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| year | integer | NO |  |  |
| crop_name | varchar(100) | NO |  |  |
| p2o5_kg_ha | double precision | YES |  |  |
| p2o5_kg_field | double precision | YES |  |  |
| k2o_kg_ha | double precision | YES |  |  |
| k2o_kg_field | double precision | YES |  |  |
| n_kg_ha | double precision | YES |  |  |
| n_kg_field | double precision | YES |  |  |
| fertilizer_recommendation | text | YES |  |  |

### field_crops
*Field Crops table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| start_year_int | integer | NO |  |  |
| crop_name | varchar(100) | NO |  |  |
| variety | varchar(100) | YES |  |  |
| expected_yield_t_ha | double precision | YES |  |  |
| start_date | date | YES |  |  |
| end_date | date | YES |  |  |

### field_soil_data
*Field Soil Data table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| analysis_date | date | NO |  |  |
| ph | double precision | YES |  |  |
| p2o5_mg_100g | double precision | YES |  |  |
| k2o_mg_100g | double precision | YES |  |  |
| organic_matter_percent | double precision | YES |  |  |
| analysis_method | varchar(50) | YES |  |  |
| analysis_institution | varchar(100) | YES |  |  |

### fields
*Fields table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farmer_id | integer | YES |  | FK→farmers.id |
| farmer_id | integer | YES |  | FK→farmers.id |
| farmer_id | integer | YES |  | FK→farmers.id |
| farmer_id | integer | YES |  | FK→farmers.id |
| field_name | varchar(100) | NO |  |  |
| area_ha | double precision | NO |  |  |
| latitude | double precision | YES |  |  |
| longitude | double precision | YES |  |  |
| blok_id | character varying | YES |  |  |
| raba | character varying | YES |  |  |
| nup_m2 | double precision | YES |  |  |
| povprecna_nmv | double precision | YES |  |  |
| povprecna_ekspozicija | character varying | YES |  |  |
| povprecni_naklon | double precision | YES |  |  |
| notes | text | YES |  |  |
| country | character varying | YES | 'Croatia'::character varying |  |
| field_state_id | character varying | YES |  | UNIQUE |

### growth_stage_reports
*Growth Stage Reports table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| crop_name | varchar(100) | NO |  |  |
| variety | varchar(100) | YES |  |  |
| growth_stage | varchar(100) | NO |  |  |
| date_reported | date | NO |  |  |
| farmer_id | integer | NO |  | FK→farmers.id |
| farmer_id | integer | NO |  | FK→farmers.id |
| farmer_id | integer | NO |  | FK→farmers.id |
| farmer_id | integer | NO |  | FK→farmers.id |
| reported_via | varchar(50) | YES |  |  |
| notes | text | YES |  |  |

### incoming_messages
*Incoming Messages table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farmer_id | integer | NO |  | FK→farmers.id |
| phone_number | varchar(20) | NO |  |  |
| message_text | text | NO |  |  |
| timestamp | timestamp | NO |  |  |
| role | varchar(10) | YES | 'user'::character varying |  |

### inventory
*Inventory table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farmer_id | integer | YES |  | FK→farmers.id |
| material_id | integer | YES |  | FK→material_catalog.id |
| material_id | integer | YES |  | FK→material_catalog.id |
| quantity | double precision | YES |  |  |
| unit | character varying | YES |  |  |
| purchase_date | date | YES |  |  |
| purchase_price | double precision | YES |  |  |
| source_invoice_id | integer | YES |  | FK→invoices.id |
| notes | text | YES |  |  |

### inventory_deductions
*Inventory Deductions table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| task_id | integer | NO |  | FK→tasks.id |
| inventory_id | integer | NO |  | FK→inventory.id |
| quantity_used | double precision | NO |  |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP |  |

### invoices
*Invoices table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farmer_id | integer | YES |  | FK→farmers.id |
| upload_date | timestamp | YES | CURRENT_TIMESTAMP |  |
| file_path | varchar(255) | YES |  |  |
| extracted_data | jsonb | YES |  |  |
| status | varchar(20) | YES | 'pending'::character varying |  |
| needs_verification | boolean | YES | false |  |
| notes | text | YES |  |  |

### material_catalog
*Material Catalog table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| name | character varying | NO |  | UNIQUE |
| brand | character varying | YES |  |  |
| group_name | character varying | YES |  |  |
| formulation | character varying | YES |  |  |
| unit | character varying | YES |  |  |
| notes | text | YES |  |  |

### message_store
*Message Store table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| session_id | text | NO |  |  |
| message | jsonb | NO |  |  |

### orders
*Orders table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| user_id | integer | YES |  | FK→users.id |
| total_amount | decimal(10,2) | YES |  |  |
| order_date | timestamp | YES | CURRENT_TIMESTAMP |  |

### other_inputs
*Other Inputs table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| product_name | varchar(100) | NO |  |  |
| category | varchar(50) | YES |  |  |
| description | text | YES |  |  |
| notes | text | YES |  |  |
| country | varchar(50) | YES | 'Croatia'::character varying |  |
| material_id | integer | YES |  | FK→material_catalog.id |

### pending_messages
*Pending Messages table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| farmer_id | integer | YES |  | FK→farmers.id |
| phone_number | varchar(20) | YES |  |  |
| message_text | text | YES |  |  |
| status | varchar(20) | YES | 'pending'::character varying |  |
| requires_consultation | boolean | YES | false |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP |  |

### pivka_companies
*Pivka Companies table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| name | text | YES |  | UNIQUE |

### pivka_crm
*Pivka Crm table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| email | text | YES |  |  |
| notes | text | YES |  |  |
| source | text | YES |  |  |
| status | text | YES | 'new'::text |  |
| date_created | timestamp | YES | CURRENT_TIMESTAMP |  |
| company_address | text | YES |  |  |
| website | text | YES |  |  |
| company_website | text | YES |  |  |
| first_name | text | YES |  |  |
| last_name | text | YES |  |  |
| company_id | integer | YES |  |  |
| source_event | text | YES |  |  |
| source_date_range | text | YES |  |  |

### pivka_crm_phones
*Pivka Crm Phones table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| contact_id | integer | YES |  | FK→pivka_crm.id |
| phone | text | YES |  |  |
| type | text | YES |  |  |

### seeds
*Seeds table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| name | varchar(100) | NO |  | UNIQUE |
| crop_type | varchar(50) | YES |  | UNIQUE |
| notes | text | YES |  |  |
| producer | varchar(100) | YES |  | UNIQUE |
| maturity_group | varchar(50) | YES |  |  |
| purpose | varchar(100) | YES |  |  |
| plant_density_from | integer | YES |  |  |
| plant_density_to | integer | YES |  |  |
| unit_for_sowing_rate | varchar(50) | YES |  |  |
| country | varchar(50) | YES | 'Croatia'::character varying |  |
| material_id | integer | YES |  | FK→material_catalog.id |

### task_fields
*Task Fields table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| task_id | integer | NO |  |  |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |

### task_material_dose
*Task Material Dose table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| task_type | text | NO |  | PK |
| material_id | integer | NO |  | PK |
| material_id | integer | NO |  | PK |
| crop_name | text | NO |  | PK |
| year | integer | NO |  | PK |
| farmer_id | integer | NO |  | PK |
| rate_per_ha | double precision | NO |  |  |
| rate_unit | text | NO |  |  |
| custom_material_name | text | YES |  |  |

### task_materials
*Task Materials table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| task_id | integer | NO |  | PK |
| inventory_id | integer | NO |  | PK |
| quantity | double precision | YES |  |  |
| custom_material_name | character varying | YES |  |  |
| material_id | integer | NO |  | FK→material_catalog.id |

### task_synonyms
*Task Synonyms table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| synonym_text | text | NO |  |  |
| language | text | YES |  |  |
| task_type_id | integer | NO |  | FK→task_types.id |

### task_types
*Task Types table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| name | character varying | NO |  | UNIQUE |
| description | text | YES |  |  |
| name_hr | character varying | YES |  |  |
| name_sl | character varying | YES |  |  |

### tasks
*Tasks table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| task_type | varchar(50) | NO |  |  |
| description | text | YES |  |  |
| quantity | double precision | YES |  |  |
| date_performed | date | YES |  |  |
| status | varchar(20) | YES | 'pending'::character varying |  |
| inventory_id | integer | YES |  | FK→inventory.id |
| notes | text | YES |  |  |
| crop_name | varchar(50) | YES |  |  |
| machinery_id | integer | YES |  | FK→farm_machinery.id |
| rate_per_ha | double precision | YES |  |  |
| rate_unit | text | YES |  |  |
| is_inventory_tracked | boolean | YES | true |  |

### unanswered_questions
*Unanswered Questions table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| question | text | NO |  |  |
| error_message | text | YES |  |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP |  |

### users
*Users table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| username | varchar(50) | NO |  | UNIQUE |
| email | varchar(100) | NO |  |  |
| created_at | timestamp | YES | CURRENT_TIMESTAMP |  |

### variety_trial_data
*Variety Trial Data table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| name | varchar(50) | YES |  |  |
| crop_type | varchar(50) | YES |  |  |
| producer | varchar(50) | YES |  |  |
| maturity_group | varchar(50) | YES |  |  |
| purpose | varchar(50) | YES |  |  |
| plant_density_from | integer | YES |  |  |
| plant_density_to | integer | YES |  |  |
| unit_for_sowing_rate | varchar(20) | YES |  |  |
| location | varchar(100) | YES |  |  |
| sowing_date | date | YES |  |  |
| harvest_date | date | YES |  |  |
| plants_per_ha | integer | YES |  |  |
| moisture_at_harvest | double precision | YES |  |  |
| yield_kg_ha | double precision | YES |  |  |
| soil_type | varchar(50) | YES |  |  |
| weather_conditions | varchar(100) | YES |  |  |
| fertilization_used | varchar(100) | YES |  |  |
| pest_resistance | varchar(50) | YES |  |  |
| disease_incidence | varchar(100) | YES |  |  |
| notes | text | YES |  |  |

### weather_data
*Weather Data table*

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| id | integer | NO | auto-increment | PK |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| field_id | integer | NO |  | FK→fields.id |
| fetch_date | timestamp | NO |  |  |
| latitude | double precision | NO |  |  |
| longitude | double precision | NO |  |  |
| current_temp_c | double precision | YES |  |  |
| current_soil_temp_10cm_c | double precision | YES |  |  |
| current_precip_mm | double precision | YES |  |  |
| current_humidity | double precision | YES |  |  |
| forecast | jsonb | YES |  |  |

## Notes
- Database schema follows PostgreSQL best practices
- All queries should be optimized for performance
- Consider indexing strategies for large datasets

## Usage
- Web Claude: Reference this for TS specification writing
- Claude Code: Use for implementation queries
- Auto-updates: Every 30 minutes from database

## Setup Instructions
1. Set DATABASE_URL environment variable
2. Run: `crontab -e` (Linux/Mac) or Task Scheduler (Windows)
3. Add: `*/30 * * * * cd /mnt/c/Users/HP/Ch/scripts && python3 update_database_schema.py`
4. Schema will auto-update every 30 minutes

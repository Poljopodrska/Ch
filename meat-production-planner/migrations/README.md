# AGP Planner Migration Guide

This guide explains how to migrate your existing data from the browser localStorage to the PostgreSQL database.

## Prerequisites

1. PostgreSQL installed and running
2. Database created (see main README)
3. Node.js installed
4. Backend dependencies installed (`cd backend && npm install`)

## Migration Steps

### 1. Export localStorage Data

1. Open the production planner (`production-planner.html`) in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run this command to copy all localStorage data:
   ```javascript
   copy(JSON.stringify(localStorage))
   ```

5. Create a file called `localstorage-export.json` in the migrations folder and paste the data

### 2. Configure Database Connection

Create a `.env` file in the migrations folder:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meat_planner
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Run the Migration

```bash
cd migrations
node migrate-localstorage-to-db.js
```

The migration script will:
- Create an admin user
- Import all products with their colors
- Import all customers
- Import workers
- Migrate all planning data (sales and production)
- Migrate production calendar (disabled dates)
- Migrate worker availability (vacations)
- Migrate production comments

### 4. Verify Migration

After migration completes:

1. Start the backend server:
   ```bash
   cd ../backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd ../frontend
   npm start
   ```

3. Login with admin credentials (update password first via database)

4. Check that all your data has been migrated:
   - Products appear with correct colors
   - Planning data shows historical entries
   - Worker availability is preserved
   - Production calendar shows disabled dates

## Manual Data Export (Alternative Method)

If you prefer to export specific data manually:

### Export Planning Data Only
```javascript
copy(localStorage.getItem('meatPlannerData'))
```

### Export Individual Components
```javascript
// Get planning data
const data = JSON.parse(localStorage.getItem('meatPlannerData') || '{}');

// Export specific parts
copy(JSON.stringify(data.planningData));      // Sales and production plans
copy(JSON.stringify(data.workerAvailability)); // Worker vacations
copy(JSON.stringify(data.disabledDates));      // Non-production days
copy(JSON.stringify(data.productionComments)); // Daily comments
```

## Troubleshooting

### "Failed to connect to database"
- Check PostgreSQL is running
- Verify database credentials in .env file
- Ensure database exists: `createdb meat_planner`

### "Invalid localStorage data format"
- Make sure you copied the entire localStorage object
- Check that the JSON is valid (no syntax errors)
- Try the manual export method instead

### Missing Data After Migration
- Check the console output for any errors
- Verify that products and customers exist in the database
- Some data might be skipped if referenced entities don't exist

## Data Mapping

The migration maps localStorage data to the database as follows:

| localStorage | Database Table | Notes |
|-------------|----------------|-------|
| Product articles | products | Creates with default colors |
| Customer names | customers | Creates with assigned colors |
| planningData.sales | planning_data | Type: 'sales_plan' |
| planningData.production | planning_data | Type: 'production_plan' |
| workerAvailability | worker_availability | Vacation days marked as unavailable |
| disabledDates | production_calendar | Marked as non-production days |
| productionComments | production_notes | Daily production comments |

## Post-Migration Steps

1. **Update Admin Password**: 
   ```sql
   UPDATE users SET password_hash = '$2b$10$...' WHERE username = 'admin';
   ```

2. **Add Product Costs**: The migration doesn't include cost data. Add via the UI or:
   ```sql
   UPDATE products SET 
     production_cost = 10.50,
     production_oh = 2.00,
     marketing_oh = 1.50,
     general_oh = 1.00,
     logistics_oh = 0.50,
     actual_price = 18.00
   WHERE article_number = 'K12';
   ```

3. **Create Additional Users**: Use the admin account to create user accounts for your team

4. **Configure Categories**: Set up product categories and subcategories for better organization

5. **Import Historical Data**: If you have Excel files with historical data, use the Import feature
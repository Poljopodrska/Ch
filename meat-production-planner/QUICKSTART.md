# AGP Planner - Quick Start Guide

## ✅ Current Status

The system is now configured to use **SQLite** for local development, avoiding PostgreSQL connection issues between WSL and Windows. For production on AWS, it will automatically switch to PostgreSQL RDS.

## 🚀 Starting the Application

### 1. Backend API (Already running on port 3001)
```bash
cd backend
npm start
```

### 2. Frontend Application
```bash
cd frontend
npm start
```

## 📊 Database

- **Development**: SQLite (automatic, no setup needed)
- **Production**: PostgreSQL on AWS RDS
- **Database file**: `backend/development.db`

### Sample Data Loaded:
- 6 Products (Klasična klobasa, Kranjska klobasa, etc.)
- 4 Customers (Mercator, Spar, Lidl, Hofer)
- 6 Workers (Ana Novak, Marko Kovač, etc.)
- 2 Users:
  - **Admin**: username=`admin`, password=`admin123`
  - **User**: username=`user`, password=`user123`

## 🔑 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| User | user | user123 |

## 📁 Key Files

- **Backend API**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`
- **Database**: `backend/development.db`
- **Environment**: `backend/.env`

## 🛠️ Common Commands

### Reset Database
```bash
rm backend/development.db
cd backend && npm start  # Will recreate database
node scripts/seed-data.js  # Re-add sample data
```

### View Database
```bash
# Install SQLite CLI if needed
sudo apt-get install sqlite3

# Open database
sqlite3 backend/development.db

# Some useful commands
.tables  # List all tables
.schema products  # Show table structure
SELECT * FROM products;  # View data
.quit  # Exit
```

## 🚧 Production Deployment

When ready for AWS deployment:

1. Set environment variable: `USE_POSTGRES=true`
2. Configure AWS RDS credentials in `.env`
3. The system will automatically use PostgreSQL

## 📝 Next Steps

1. Open frontend: `http://localhost:3000`
2. Login with admin credentials
3. Start adding your real data:
   - Products with cost breakdown
   - Customer pricing
   - Production planning
   - Worker schedules

The system is now ready for use! 🎉
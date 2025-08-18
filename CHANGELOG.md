# Ch Production Planner Changelog

All notable changes to the Ch Production Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### To Be Implemented
- Real-time data synchronization
- Advanced reporting features
- Mobile application support
- Multi-language support expansion

---

## [v0.4.0] - 2025-08-18 - Multi-Level Expandable Planning System

### 🚀 Major Feature - Hierarchical Planning with 4 Levels
- **NEW**: Complete rewrite of planning module as Planning V4
- **ADDED**: Multi-level expandable hierarchy: Yearly → Monthly → Weekly → Daily
- **ENHANCED**: Interactive drill-down capability for detailed production planning
- **IMPROVED**: Visual hierarchy with color-coded indicators for each level

### Added
- Planning V4 module (`planning_v4.js`) with full hierarchical data structure
- Four-level expandable planning views:
  - **Yearly**: High-level annual overview per product
  - **Monthly**: Month-by-month breakdown with totals
  - **Weekly**: Weekly planning within each month
  - **Daily**: Day-by-day production scheduling
- Dynamic expand/collapse functionality for each level
- Editable cells for future planning periods
- Automatic total calculations across all hierarchy levels
- Visual indicators for different time periods (historical, actual, current, planned, future)
- Keyboard shortcuts (Ctrl+1/2/3/4) for quick view switching

### Changed
- Upgraded from Planning V3 static tables to V4 dynamic hierarchy
- Improved data structure to support drill-down analytics
- Enhanced UI with gradient headers and modern styling
- Better separation of concerns between view levels

### Technical Details
- Files modified:
  - `modules/planning/planning_v4.js` - New planning module with full hierarchy
  - `static/js/app.js` - Updated to load Planning V4
  - `api/main.py` - Version bump to 0.4.0
  - `static/js/config.js` - Version bump to 0.4.0
  - `package.json` - Version bump to 0.4.0

### Features
- **Expandable Rows**: Click on any row to expand/collapse its children
- **Smart Defaults**: Auto-expands first product to demonstrate hierarchy
- **Data Persistence**: Editable cells for future planning
- **Responsive Design**: Works across different screen sizes
- **Performance**: Efficient rendering with minimal DOM manipulation

---

## [v0.3.0] - 2025-08-15 - Planning V3 with Macro/Micro Rows

### 🚀 Major Feature - Enhanced Planning Module
- **NEW**: Planning V3 with hierarchical macro/micro row structure
- **ADDED**: Expandable/collapsible product rows with 5-year planning horizon
- **IMPROVED**: Visual indicators with color-coded years (N-2 to N+2)
- **FIXED**: Module loading issues that prevented planning visibility

### Added
- Hierarchical planning structure with macro (product) and micro (year) rows
- Auto-expand feature for first product on page load
- Visual success banners confirming deployment and module status
- Enhanced debugging with console logging for module loading
- Inline CSS for guaranteed table styling

### Changed
- Upgraded from planning_v2.js to planning_v3.js
- Improved module loading with async/await pattern
- Enhanced user experience with automatic visual feedback

### Fixed
- Critical bug where planning module wasn't loading properly
- CSS styling issues that made tables invisible
- Module import errors in app.js

### Technical Details
- Files modified:
  - `static/js/app.js` - Fixed module loading
  - `modules/planning_v3.js` - New planning module with hierarchical structure
  - `templates/index.html` - Added deployment verification banners

---

## [v0.2.0] - 2025-07-21 - PostgreSQL Database Integration

### 💾 Infrastructure - Database Layer Implementation
- **MILESTONE**: Migrated from JSON file storage to PostgreSQL RDS
- **SECURITY**: Encrypted database with VPC-only access
- **SCALABILITY**: Enterprise-grade persistent storage

### Added
- RDS PostgreSQL 15.8 instance (db.t3.small, 30GB encrypted storage)
- Database connection pooling for optimal performance
- Schema with products, categories, and BOM tables
- Sample data with 3 products and cost breakdowns
- Health check endpoint for database connectivity

### Changed
- Data persistence from temporary JSON files to PostgreSQL
- API endpoints now serve data from database
- Added environment-based configuration for database credentials

### Infrastructure
- **Database**: ch-production-db.cifgmm0mqg5q.us-east-1.rds.amazonaws.com
- **Backup**: 7-day retention with automated snapshots
- **Cost Impact**: ~$19/month (RDS + storage)

### API Endpoints
- `/health/database` - Database connection status
- `/api/v1/products` - Product data from PostgreSQL
- `/api/admin/init-database` - Schema initialization

---

## [v0.1.1] - 2025-07-21 - CI/CD Pipeline Activation

### 🔄 Automation - Full CI/CD Implementation
- **ACHIEVEMENT**: Fully automated deployment pipeline
- **WORKFLOW**: GitHub → CodeBuild → ECR → ECS
- **SPEED**: 3-4 minutes from push to production

### Added
- GitHub repository: https://github.com/Poljopodrska/Ch
- GitHub webhook for automatic build triggers
- CodeBuild project for Docker image building
- Automatic ECS service updates on new image push

### Metrics
- Build time: ~50 seconds
- ECS deployment: 2-3 minutes
- Total deployment: <4 minutes

---

## [v0.1.0] - 2025-07-21 - Initial AWS Deployment

### 🎉 Launch - Production Deployment on AWS

**Application URL**: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com

### Infrastructure Created
- **ECR Repository**: ch-production/core
- **ECS Cluster**: ch-production (Fargate)
- **ECS Service**: ch-production-service (1 task running)
- **ALB**: ch-alb-2140286266.us-east-1.elb.amazonaws.com
- **Target Group**: ch-production-tg
- **Security Groups**: ch-alb-sg, ch-app-sg
- **CodeBuild**: ch-production-docker-build

### Deployment Details
- **Docker Image**: 127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:v0.1.0-initial
- **Task Definition**: ch-production-task:1
- **CPU**: 512 units
- **Memory**: 1024 MB
- **Port**: 8080

### Verified Endpoints
- `/` - Main application (returns HTML)
- `/health` - Health check endpoint ✅
- `/version` - Version endpoint (v0.1.0-local) ✅
- `/api/deployment/verify` - Deployment verification ✅
- `/api/v1/legacy/meat-planner/sync` - Legacy meat planner sync
- `/api/v1/products` - Products API
- `/api/v1/planning` - Planning API

### Architecture Summary
```
GitHub → CodeBuild → ECR → ECS (Fargate) → ALB → Internet
         (Manual)            ↓
                    ch-production cluster
```

The Ch application is now live and accessible on AWS, completely separate from the AVA infrastructure.

---

## Version History Summary

| Version | Date       | Type          | Summary                                    |
|---------|------------|---------------|---------------------------------------------|
| v0.3.0  | 2025-08-15 | Major Feature | Planning V3 with macro/micro rows          |
| v0.2.0  | 2025-07-21 | Infrastructure| PostgreSQL database integration            |
| v0.1.1  | 2025-07-21 | Automation    | CI/CD pipeline activation                  |
| v0.1.0  | 2025-07-21 | Launch        | Initial AWS deployment                     |

---

## Contributing

When adding to this changelog:
1. Add new entries at the top under `[Unreleased]`
2. When releasing, move items to a new version section
3. Follow the format: `## [version] - YYYY-MM-DD - Brief Description`
4. Use emoji indicators for entry types:
   - 🎉 Launch/Major Release
   - 🚀 New Features
   - 💾 Infrastructure
   - 🔄 Automation/CI/CD
   - 🐛 Bug Fixes
   - 🔒 Security
   - 📝 Documentation
   - ⚠️ Breaking Changes
   - 🚨 Emergency/Critical Fixes

## Links
- [GitHub Repository](https://github.com/Poljopodrska/Ch)
- [Production URL](http://ch-alb-2140286266.us-east-1.elb.amazonaws.com)
- [AWS Console](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ch-production)
# Legacy Module Migration Plan

## Overview
This document outlines the migration strategy for legacy modules integrated into the Ch project, specifically the MeatProductionPlanner.

## Current Legacy Modules

### 1. MeatProductionPlanner (meat-planner-legacy)
**Status**: ⚠️ Temporary integration via iframe  
**Target**: Full integration by Q2 2025  
**Priority**: High

#### Current Implementation
- **Integration Method**: Iframe wrapper with sandboxed execution
- **Data Storage**: Browser localStorage (isolated per user/browser)
- **Communication**: PostMessage API for limited parent-child interaction
- **Security**: Sandboxed iframe with restricted permissions
- **Status Indicator**: Orange "TEMP" badge in navigation

#### Functionality Provided
- ✅ Meat production planning and scheduling
- ✅ Cost analysis and pricing calculations
- ✅ Worker availability management
- ✅ Sales planning and forecasting
- ✅ Dashboard with KPIs and analytics
- ✅ Import/export capabilities
- ✅ Customer management

#### Technical Architecture
```
Ch Project
├── Navigation: "Meat Planner (Legacy)" with TEMP badge
├── Wrapper: modules/meat-planner-legacy/
│   ├── HTML wrapper with warning notices
│   ├── Iframe container with loading states
│   └── PostMessage communication bridge
└── Legacy App: meat-production-planner/standalone-app.html
    ├── React-based standalone application
    ├── localStorage data persistence
    └── Complete feature set from original app
```

#### Data Structure
- **Products**: Article numbers, costs, pricing, categories
- **Workers**: Availability, schedules, productivity metrics
- **Production Plans**: Weekly schedules, quantities, deadlines
- **Customers**: Contact info, orders, delivery preferences
- **Sales Data**: Historical and planned sales figures

#### Migration Steps (Planned)

##### Phase 1: Data Extraction and Analysis (Q1 2025)
1. **Audit Current Usage**
   - Track user interactions via PostMessage logs
   - Analyze localStorage data structures
   - Document business process workflows
   - Identify most-used features

2. **Extract Data Schema**
   - Map localStorage structure to PostgreSQL schema
   - Identify data relationships and dependencies
   - Document business logic and calculations
   - Plan data validation and cleanup

##### Phase 2: Core Feature Recreation (Q2 2025)
1. **Ch Native Components**
   - Rewrite UI using Ch design system
   - Integrate with Ch BOM and production planning
   - Connect to PostgreSQL for persistence
   - Implement Ch authentication and authorization

2. **Feature Parity**
   - Production planning with BOM integration
   - Cost analysis using Ch pricing module
   - Worker management with Ch user system
   - Sales planning with Ch planning module

##### Phase 3: Data Migration and Testing (Q2 2025)
1. **Migration Tools**
   - Build data extraction utilities
   - Create PostgreSQL migration scripts
   - Develop data validation tools
   - Implement rollback procedures

2. **Testing and Validation**
   - Parallel testing (legacy vs new)
   - User acceptance testing
   - Performance benchmarking
   - Data integrity verification

##### Phase 4: Cutover and Cleanup (Q3 2025)
1. **Production Deployment**
   - Deploy new Ch native module
   - Migrate user data
   - Train users on new interface
   - Monitor for issues

2. **Legacy Removal**
   - Remove iframe wrapper
   - Clean up temporary files
   - Update documentation
   - Archive legacy code

#### Data Mapping Strategy

##### Products Migration
```sql
-- Legacy localStorage to PostgreSQL
Legacy: products[{id, article_number, name, costs...}]
Ch:     products table + bom_items integration

Migration:
- Map legacy products to Ch BOM items
- Convert cost structure to Ch cost categories
- Preserve article numbers and names
- Link to Ch pricing module
```

##### Production Plans Migration
```sql
-- Legacy planning to Ch BOM system
Legacy: production_plans[{week, products, quantities}]
Ch:     production_requirements + production_orders

Migration:
- Convert weekly plans to daily requirements
- Map products to BOM hierarchy
- Calculate raw material needs
- Integrate with Ch inventory system
```

##### Workers Migration
```sql
-- Legacy workers to Ch user system
Legacy: workers[{id, name, availability, skills}]
Ch:     users table + worker_availability extension

Migration:
- Create Ch user accounts for workers
- Preserve availability schedules
- Map skills to Ch competency system
- Integrate with Ch authentication
```

#### Benefits of Migration
1. **Integration**: Seamless data flow between Ch modules
2. **Consistency**: Unified user interface and experience
3. **Scalability**: PostgreSQL for multi-user environments
4. **Security**: Ch authentication and authorization
5. **Maintenance**: Single codebase instead of dual systems

#### Risks and Mitigation
- **Data Loss**: Complete backup before migration, parallel testing
- **User Disruption**: Gradual rollout, training, support documentation
- **Feature Gaps**: Thorough requirements analysis, user feedback loops
- **Performance**: Load testing, optimization, monitoring

#### Success Metrics
- [ ] Zero data loss during migration
- [ ] Feature parity with legacy system
- [ ] User adoption > 90% within 30 days
- [ ] Performance equal or better than legacy
- [ ] No critical bugs in first month

## Migration Commands and Tools

### Data Extraction (For Migration Team)
```javascript
// Run in browser console while in legacy module
LegacyMeatPlanner.extractLegacyData();

// Export usage statistics
const usage = JSON.parse(localStorage.getItem('ch_legacy_usage') || '[]');
console.log('Usage data:', usage);

// Export all localStorage data
const allData = {};
for (let key in localStorage) {
    if (key.startsWith('agp_') || key.startsWith('meatplanner_')) {
        allData[key] = localStorage.getItem(key);
    }
}
console.log('Legacy data:', allData);
```

### Health Monitoring
```javascript
// Check legacy module status
if (window.LegacyMeatPlanner) {
    console.log('Health check:', LegacyMeatPlanner.healthCheck());
}
```

## Communication Protocol

### Parent → Iframe Messages
```javascript
// Initialize integration
{
    type: 'ch_integration_init',
    source: 'ch_parent',
    config: { version: '0.1.0', mode: 'legacy_integration' }
}

// Request data export
{
    type: 'ch_extract_data',
    source: 'ch_parent'
}
```

### Iframe → Parent Messages
```javascript
// Data export
{
    type: 'data_export',
    payload: { products: [...], workers: [...], plans: [...] }
}

// User action tracking
{
    type: 'user_action',
    payload: { action: 'create_product', timestamp: '...', details: {...} }
}
```

## Timeline Summary

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| **Integration** | ✅ Completed | Legacy module accessible via Ch interface |
| **Analysis** | Q1 2025 | Data audit, usage patterns, requirements |
| **Development** | Q2 2025 | Ch native module with feature parity |
| **Migration** | Q2 2025 | Data migration tools and procedures |
| **Cutover** | Q3 2025 | Production deployment and legacy removal |

## Contact and Support

- **Migration Lead**: Development Team
- **Documentation**: This file and inline code comments
- **Issues**: Report via Ch issue tracking system
- **Questions**: Development team channel

---

*This document will be updated as migration progresses. Last updated: 2025-01-21*
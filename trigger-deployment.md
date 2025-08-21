# Deployment Instructions for v0.5.8

## Problem Fixed
The modules were incorrectly assigned. Now fixed:
- **Sales Planning**: Uses V4 (with expandable months → weeks → days)  
- **Production Planning**: Uses V2 (with expandable hierarchy and production features)

## Current Status
- ✅ Code fixed and pushed to GitHub
- ❌ AWS deployment still shows old version (0.5.7)

## To Deploy the Latest Version

### Option 1: Manual Docker Deployment
If you have Docker and AWS CLI configured:
```bash
./deploy-update.sh
```

### Option 2: Trigger AWS CodeBuild
1. Go to AWS Console → CodeBuild
2. Find your Ch project
3. Click "Start build"
4. This will pull latest from GitHub and deploy

### Option 3: Force ECS Update (Quick)
If the image is already in ECR but ECS hasn't updated:
```bash
aws ecs update-service \
  --cluster ch-production \
  --service ch-production-service \
  --force-new-deployment \
  --region us-east-1
```

## What Was Fixed

### Sales Planning (V4)
- ✅ Expandable hierarchy: months → weeks → days
- ✅ Click to expand/collapse
- ✅ Inline editing for future values

### Production Planning (V2) 
- ✅ Same expandable hierarchy system
- ✅ Production-specific features (capacity, efficiency, shifts)
- ✅ OEE tracking and optimization

## Version Details
- Current GitHub: **v0.5.8**
- Current AWS: **v0.5.7** (needs deployment)

The fixed code will show:
1. Sales Planning with full expandable hierarchy
2. Production Planning with full expandable hierarchy + production features
3. Version 0.5.8 in the UI
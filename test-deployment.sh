#!/bin/bash
set -e

echo "Testing automated deployment pipeline..."

# 1. Get current version
CURRENT_VERSION=$(curl -s http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
echo "Current version: $CURRENT_VERSION"

# 2. Update version in code
echo "Updating version to 0.1.2..."
sed -i 's/VERSION = "0.1.[0-9]"/VERSION = "0.1.2"/' api/main.py

# 3. Show the change
echo "Version updated in api/main.py:"
grep "VERSION = " api/main.py

# 4. Commit and push
git add api/main.py
git commit -m "test: automated deployment v0.1.2" || echo "No changes to commit"
git push origin main || echo "Push may require manual authentication"

# 5. Wait for CodeBuild to start
echo "Waiting for CodeBuild to start..."
sleep 15

# Get latest build
BUILD_ID=$(aws codebuild list-builds-for-project \
    --project-name ch-production-docker-build \
    --sort-order DESCENDING \
    --region us-east-1 \
    --query 'ids[0]' \
    --output text)

if [ "$BUILD_ID" != "None" ]; then
    echo "Build started: $BUILD_ID"
    echo "Monitoring build progress..."
    
    # Wait for build to complete (max 10 minutes)
    COUNTER=0
    while [ $COUNTER -lt 60 ]; do
        STATUS=$(aws codebuild batch-get-builds \
            --ids "$BUILD_ID" \
            --region us-east-1 \
            --query 'builds[0].buildStatus' \
            --output text)
        
        echo "Build status: $STATUS"
        
        if [ "$STATUS" = "SUCCEEDED" ]; then
            echo "✅ Build completed successfully!"
            break
        elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "STOPPED" ]; then
            echo "❌ Build failed!"
            exit 1
        fi
        
        sleep 10
        COUNTER=$((COUNTER + 1))
    done
    
    # 6. Wait for ECS deployment
    echo "Waiting for ECS deployment..."
    aws ecs wait services-stable \
        --cluster ch-production \
        --services ch-production-service \
        --region us-east-1 || echo "ECS wait timed out"
    
    # 7. Verify new version
    echo "Verifying deployment..."
    sleep 20
    NEW_VERSION=$(curl -s http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "New version: $NEW_VERSION"
    
    if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
        echo "✅ Deployment successful! Version changed from $CURRENT_VERSION to $NEW_VERSION"
    else
        echo "⚠️ Version unchanged - deployment may have failed or version was already up to date"
    fi
else
    echo "❌ No build found - webhook may not be configured"
fi
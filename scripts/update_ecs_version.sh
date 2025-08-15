#!/bin/bash

# Update ECS Task Definition with Version
# Following AVA OLO pattern for version tracking

set -e

# Get version from package.json
VERSION=$(grep '"version"' package.json | cut -d '"' -f 4)
echo "Current version: v${VERSION}"

# Get current date for deployment tracking
DEPLOY_DATE=$(date +%Y%m%d-%H%M%S)

# Update task definition with version tag
echo "Updating ECS task definition with version v${VERSION}..."

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-task-definition \
    --task-definition ch-production-task \
    --query 'taskDefinition' \
    --output json)

# Update the container image tag with version
UPDATED_TASK_DEF=$(echo "$CURRENT_TASK_DEF" | jq \
    --arg VERSION "$VERSION" \
    --arg DEPLOY_DATE "$DEPLOY_DATE" \
    '.containerDefinitions[0].image = "127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:v\($VERSION)" |
     .containerDefinitions[0].environment += [
        {"name": "APP_VERSION", "value": "v\($VERSION)"},
        {"name": "DEPLOYMENT_ID", "value": "v\($VERSION)-\($DEPLOY_DATE)"}
     ] |
     del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

# Register new task definition
echo "$UPDATED_TASK_DEF" > /tmp/ch-task-def.json

NEW_TASK_DEF=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/ch-task-def.json \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo "New task definition created: $NEW_TASK_DEF"

# Update service to use new task definition
echo "Updating ECS service..."
aws ecs update-service \
    --cluster ch-production \
    --service ch-production-service \
    --task-definition "$NEW_TASK_DEF" \
    --force-new-deployment \
    --query 'service.deployments[0].status' \
    --output text

echo "Deployment initiated with version v${VERSION}"

# Tag the deployment in git
git tag -a "v${VERSION}-deployed" -m "Deployed version ${VERSION} at ${DEPLOY_DATE}"

echo "✅ Version v${VERSION} deployment started successfully"
echo "Deployment ID: v${VERSION}-${DEPLOY_DATE}"
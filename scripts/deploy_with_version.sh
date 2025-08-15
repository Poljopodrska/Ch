#!/bin/bash

# Deploy with version in deployment name
# Following AVA OLO pattern

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Ch Project Deployment with Version Tracking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get version from package.json
VERSION=$(grep '"version"' package.json | cut -d '"' -f 4)
DEPLOYMENT_TIME=$(date +%Y%m%d-%H%M%S)
DEPLOYMENT_ID="v${VERSION}-${DEPLOYMENT_TIME}"

echo -e "${YELLOW}📦 Version:${NC} v${VERSION}"
echo -e "${YELLOW}🕐 Deployment Time:${NC} ${DEPLOYMENT_TIME}"
echo -e "${YELLOW}🏷️  Deployment ID:${NC} ${DEPLOYMENT_ID}"
echo ""

# Update ECS task definition to include version
echo -e "${GREEN}1. Updating ECS Task Definition...${NC}"

# Get current task definition
TASK_DEF_JSON=$(aws ecs describe-task-definition \
    --task-definition ch-production-task \
    --query 'taskDefinition' \
    --output json)

# Update with version information
UPDATED_TASK_DEF=$(echo "$TASK_DEF_JSON" | jq \
    --arg VERSION "$VERSION" \
    --arg DEPLOYMENT_ID "$DEPLOYMENT_ID" \
    '.family = "ch-production-task-v\($VERSION)" |
     .containerDefinitions[0].image = "127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:v\($VERSION)" |
     .containerDefinitions[0].environment = (
        (.containerDefinitions[0].environment // []) | 
        map(select(.name != "APP_VERSION" and .name != "DEPLOYMENT_ID")) + 
        [
            {"name": "APP_VERSION", "value": "v\($VERSION)"},
            {"name": "DEPLOYMENT_ID", "value": "\($DEPLOYMENT_ID)"}
        ]
     ) |
     del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

# Save to temp file
echo "$UPDATED_TASK_DEF" > /tmp/ch-task-def-${VERSION}.json

# Register new task definition
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/ch-task-def-${VERSION}.json \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition created:${NC} ${NEW_TASK_DEF_ARN}"
echo ""

# Update ECS service
echo -e "${GREEN}2. Updating ECS Service...${NC}"

aws ecs update-service \
    --cluster ch-production \
    --service ch-production-service \
    --task-definition "${NEW_TASK_DEF_ARN}" \
    --force-new-deployment \
    --output json > /tmp/ecs-update-${VERSION}.json

DEPLOYMENT_STATUS=$(cat /tmp/ecs-update-${VERSION}.json | jq -r '.service.deployments[0].status')

echo -e "${GREEN}✅ Deployment initiated:${NC} ${DEPLOYMENT_STATUS}"
echo ""

# Tag in git
echo -e "${GREEN}3. Creating Git Tag...${NC}"
git tag -a "v${VERSION}-deployed-${DEPLOYMENT_TIME}" -m "Deployed version ${VERSION} at ${DEPLOYMENT_TIME}"
echo -e "${GREEN}✅ Git tag created:${NC} v${VERSION}-deployed-${DEPLOYMENT_TIME}"
echo ""

# Wait for deployment
echo -e "${GREEN}4. Monitoring Deployment...${NC}"
echo "Waiting for service to stabilize..."

WAIT_TIME=0
MAX_WAIT=300  # 5 minutes

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    RUNNING_COUNT=$(aws ecs describe-services \
        --cluster ch-production \
        --services ch-production-service \
        --query 'services[0].runningCount' \
        --output text)
    
    DESIRED_COUNT=$(aws ecs describe-services \
        --cluster ch-production \
        --services ch-production-service \
        --query 'services[0].desiredCount' \
        --output text)
    
    if [ "$RUNNING_COUNT" == "$DESIRED_COUNT" ]; then
        echo -e "${GREEN}✅ Service stable:${NC} $RUNNING_COUNT/$DESIRED_COUNT tasks running"
        break
    fi
    
    echo "   Status: $RUNNING_COUNT/$DESIRED_COUNT tasks running..."
    sleep 10
    WAIT_TIME=$((WAIT_TIME + 10))
done

echo ""

# Verify deployment
echo -e "${GREEN}5. Verifying Deployment...${NC}"

ALB_URL="http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"

# Check version endpoint
DEPLOYED_VERSION=$(curl -s ${ALB_URL}/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)

if [[ "$DEPLOYED_VERSION" == "v${VERSION}"* ]]; then
    echo -e "${GREEN}✅ Version verified:${NC} ${DEPLOYED_VERSION}"
else
    echo -e "${RED}⚠️  Version mismatch:${NC} Expected v${VERSION}, got ${DEPLOYED_VERSION}"
fi

# Check health
HEALTH_STATUS=$(curl -s ${ALB_URL}/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HEALTH_STATUS" == "healthy" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}⚠️  Health check status:${NC} ${HEALTH_STATUS}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 Deployment Complete!${NC}"
echo -e "   Version: ${GREEN}v${VERSION}${NC}"
echo -e "   Deployment ID: ${GREEN}${DEPLOYMENT_ID}${NC}"
echo -e "   URL: ${GREEN}${ALB_URL}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
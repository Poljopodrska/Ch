#!/bin/bash
# Quick deployment update script for Ch Production
# This triggers a new deployment with the latest code from GitHub

echo "========================================"
echo "CH PRODUCTION - DEPLOY UPDATE v0.5.7"
echo "========================================"
echo "Starting at: $(date)"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="127679825789"
CLUSTER_NAME="ch-production"
SERVICE_NAME="ch-production-service"
ECR_REPO="ch-production/core"
VERSION="0.5.7"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}IMPORTANT: This script requires:${NC}"
echo "1. Docker installed and running"
echo "2. AWS CLI configured with proper credentials"
echo "3. Network access to AWS"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: Login to ECR
echo -e "\n${YELLOW}Step 1: Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ECR login failed. Check AWS credentials.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ECR login successful${NC}"

# Step 2: Build Docker image
echo -e "\n${YELLOW}Step 2: Building Docker image with latest code...${NC}"
docker build -t ch-production:v$VERSION .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker build successful${NC}"

# Step 3: Tag images
echo -e "\n${YELLOW}Step 3: Tagging images...${NC}"
docker tag ch-production:v$VERSION $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker tag ch-production:v$VERSION $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:v$VERSION
echo -e "${GREEN}✅ Images tagged${NC}"

# Step 4: Push to ECR
echo -e "\n${YELLOW}Step 4: Pushing to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:v$VERSION
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Push to ECR failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Images pushed to ECR${NC}"

# Step 5: Force new deployment
echo -e "\n${YELLOW}Step 5: Triggering ECS deployment...${NC}"
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment \
    --region $AWS_REGION
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ECS update failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Deployment triggered${NC}"

# Step 6: Wait for deployment
echo -e "\n${YELLOW}Step 6: Waiting for deployment to complete...${NC}"
echo "This may take 2-3 minutes..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${YELLOW}⚠️ Deployment may still be in progress. Check AWS Console.${NC}"
fi

# Final message
echo -e "\n${GREEN}========================================"
echo "DEPLOYMENT UPDATE COMPLETE!"
echo "========================================"
echo "Version: v$VERSION"
echo "URL: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"
echo "========================================${NC}"
echo ""
echo "The new BOM system should now be visible at:"
echo "http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/#bom"
echo ""
echo "Note: It may take 1-2 minutes for changes to be fully visible."
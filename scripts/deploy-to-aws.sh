#!/bin/bash
# Complete AWS Deployment Script for Ch Production

set -e

echo "========================================"
echo "CH PRODUCTION AWS DEPLOYMENT"
echo "========================================"
echo "Starting at: $(date)"
echo ""

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="127679825789"
CLUSTER_NAME="ch-production"
SERVICE_NAME="ch-production-service"
ALB_NAME="ch-alb"
ECR_REPO="ch-production/core"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 successful${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Phase 1: Create ECR Repository
echo -e "\n${YELLOW}Phase 1: Creating ECR Repository...${NC}"
aws ecr create-repository \
    --repository-name $ECR_REPO \
    --region $AWS_REGION 2>/dev/null || echo "ECR repository may already exist"
check_result "ECR repository creation"

# Phase 2: Create ECS Cluster
echo -e "\n${YELLOW}Phase 2: Creating ECS Cluster...${NC}"
aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --capacity-providers FARGATE \
    --region $AWS_REGION || echo "Cluster may already exist"
check_result "ECS cluster creation"

# Phase 3: Create CloudWatch Log Group
echo -e "\n${YELLOW}Phase 3: Creating CloudWatch Log Group...${NC}"
aws logs create-log-group \
    --log-group-name /ecs/ch-production \
    --region $AWS_REGION 2>/dev/null || echo "Log group may already exist"
check_result "CloudWatch log group creation"

# Phase 4: Get VPC and Subnets
echo -e "\n${YELLOW}Phase 4: Getting VPC and Subnet information...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[?IsDefault==\`true\`].VpcId" --output text --region $AWS_REGION)
if [ -z "$VPC_ID" ]; then
    VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
fi
echo "VPC ID: $VPC_ID"

# Get at least 2 subnets in different AZs
SUBNET_1=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0].SubnetId" --output text --region $AWS_REGION)
SUBNET_2=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[1].SubnetId" --output text --region $AWS_REGION)
echo "Subnet 1: $SUBNET_1"
echo "Subnet 2: $SUBNET_2"

# Phase 5: Create Security Groups
echo -e "\n${YELLOW}Phase 5: Creating Security Groups...${NC}"

# Create ALB security group
echo "Creating ALB security group..."
ALB_SG=$(aws ec2 create-security-group \
    --group-name ch-alb-sg \
    --description "Security group for Ch ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region $AWS_REGION 2>/dev/null) || ALB_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=ch-alb-sg" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)
echo "ALB Security Group: $ALB_SG"

# Add inbound rule for HTTP
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || echo "Rule may already exist"

# Create ECS tasks security group
echo "Creating ECS tasks security group..."
ECS_SG=$(aws ec2 create-security-group \
    --group-name ch-ecs-tasks-sg \
    --description "Security group for Ch ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region $AWS_REGION 2>/dev/null) || ECS_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=ch-ecs-tasks-sg" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)
echo "ECS Tasks Security Group: $ECS_SG"

# Allow ALB to reach ECS tasks
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG \
    --protocol tcp \
    --port 8080 \
    --source-group $ALB_SG \
    --region $AWS_REGION 2>/dev/null || echo "Rule may already exist"

# Phase 6: Create Application Load Balancer
echo -e "\n${YELLOW}Phase 6: Creating Application Load Balancer...${NC}"
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name $ALB_NAME \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SG \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text \
    --region $AWS_REGION 2>/dev/null) || ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION)
echo "ALB ARN: $ALB_ARN"

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)
echo "ALB DNS: $ALB_DNS"

# Phase 7: Create Target Group
echo -e "\n${YELLOW}Phase 7: Creating Target Group...${NC}"
TG_ARN=$(aws elbv2 create-target-group \
    --name ch-production-tg \
    --protocol HTTP \
    --port 8080 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-enabled \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text \
    --region $AWS_REGION 2>/dev/null) || TG_ARN=$(aws elbv2 describe-target-groups --names ch-production-tg --query 'TargetGroups[0].TargetGroupArn' --output text --region $AWS_REGION)
echo "Target Group ARN: $TG_ARN"

# Phase 8: Create ALB Listener
echo -e "\n${YELLOW}Phase 8: Creating ALB Listener...${NC}"
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region $AWS_REGION 2>/dev/null || echo "Listener may already exist"
check_result "ALB listener creation"

# Phase 9: Build and Push Docker Image
echo -e "\n${YELLOW}Phase 9: Building and Pushing Docker Image...${NC}"
echo "Note: This requires Docker to be running locally"

# Get ECR login
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
echo "Building Docker image..."
docker build -t ch-production .

# Tag images
echo "Tagging images..."
docker tag ch-production:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker tag ch-production:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:v0.1.0-initial

# Push to ECR
echo "Pushing to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:v0.1.0-initial

# Phase 10: Register Task Definition
echo -e "\n${YELLOW}Phase 10: Registering ECS Task Definition...${NC}"
aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region $AWS_REGION
check_result "Task definition registration"

# Phase 11: Create ECS Service
echo -e "\n${YELLOW}Phase 11: Creating ECS Service...${NC}"
aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition ch-production-task:1 \
    --desired-count 1 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=$TG_ARN,containerName=ch-production-container,containerPort=8080 \
    --region $AWS_REGION
check_result "ECS service creation"

# Phase 12: Wait for Service Stability
echo -e "\n${YELLOW}Phase 12: Waiting for service to become stable...${NC}"
echo "This may take 2-3 minutes..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION
check_result "Service stabilization"

# Phase 13: Test Deployment
echo -e "\n${YELLOW}Phase 13: Testing Deployment...${NC}"
echo "ALB URL: http://$ALB_DNS"
echo ""

# Wait a bit for ALB to be ready
sleep 10

# Test endpoints
echo "Testing /health endpoint..."
curl -f http://$ALB_DNS/health && echo ""
check_result "Health endpoint test"

echo -e "\nTesting /version endpoint..."
curl -f http://$ALB_DNS/version && echo ""
check_result "Version endpoint test"

# Save deployment information
echo -e "\n${YELLOW}Saving deployment information...${NC}"
cat > deployment-info.txt << EOF
Deployment Date: $(date)
AWS Region: $AWS_REGION
AWS Account ID: $AWS_ACCOUNT_ID
ECS Cluster: $CLUSTER_NAME
ECS Service: $SERVICE_NAME
ALB URL: http://$ALB_DNS
ECR Repository: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO
VPC ID: $VPC_ID
Subnets: $SUBNET_1, $SUBNET_2
ALB Security Group: $ALB_SG
ECS Security Group: $ECS_SG
Target Group ARN: $TG_ARN
EOF

echo -e "\n${GREEN}========================================"
echo "DEPLOYMENT COMPLETE!"
echo "========================================"
echo "ALB URL: http://$ALB_DNS"
echo "Health Check: http://$ALB_DNS/health"
echo "Version Check: http://$ALB_DNS/version"
echo "========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Create CodeBuild project in AWS Console"
echo "2. Set up GitHub webhook for automatic deployments"
echo "3. Update SYSTEM_CHANGELOG.md with ALB URL"
echo ""
echo "Deployment information saved to: deployment-info.txt"
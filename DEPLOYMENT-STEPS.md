# Ch Production AWS Deployment - Step by Step Guide

## Prerequisites
- AWS CLI configured with credentials
- Docker Desktop running
- Git installed

## Phase 1: GitHub Repository Setup
```bash
# Create repository on GitHub first, then:
cd C:\Users\HP\Ch
git init
git add .
git commit -m "Initial Ch production system"
git branch -M main
git remote add origin https://github.com/[YOUR-USERNAME]/ch-production.git
git push -u origin main
```

## Phase 2: Discover AWS Resources
```bash
# Run discovery script to find existing resources
chmod +x scripts/discover-aws-resources.sh
./scripts/discover-aws-resources.sh
```

## Phase 3: Create AWS Infrastructure
Run these commands one by one:

### 3.1 Create ECR Repository
```bash
aws ecr create-repository \
    --repository-name ch-production/core \
    --region us-east-1
```

### 3.2 Create ECS Cluster
```bash
aws ecs create-cluster \
    --cluster-name ch-production \
    --capacity-providers FARGATE \
    --region us-east-1
```

### 3.3 Create CloudWatch Log Group
```bash
aws logs create-log-group \
    --log-group-name /ecs/ch-production \
    --region us-east-1
```

### 3.4 Get VPC ID
```bash
# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[?IsDefault==\`true\`].VpcId" --output text --region us-east-1)
echo "VPC ID: $VPC_ID"
```

### 3.5 Get Subnet IDs
```bash
# Get first two subnets
SUBNET_1=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0].SubnetId" --output text --region us-east-1)
SUBNET_2=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[1].SubnetId" --output text --region us-east-1)
echo "Subnets: $SUBNET_1, $SUBNET_2"
```

### 3.6 Create Security Groups
```bash
# ALB Security Group
ALB_SG=$(aws ec2 create-security-group \
    --group-name ch-alb-sg \
    --description "Security group for Ch ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region us-east-1)
echo "ALB SG: $ALB_SG"

# Allow HTTP traffic
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

# ECS Tasks Security Group
ECS_SG=$(aws ec2 create-security-group \
    --group-name ch-ecs-tasks-sg \
    --description "Security group for Ch ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region us-east-1)
echo "ECS SG: $ECS_SG"

# Allow ALB to reach ECS tasks
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG \
    --protocol tcp \
    --port 8080 \
    --source-group $ALB_SG \
    --region us-east-1
```

### 3.7 Create Application Load Balancer
```bash
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ch-alb \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SG \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text \
    --region us-east-1)
echo "ALB ARN: $ALB_ARN"

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region us-east-1)
echo "ALB URL: http://$ALB_DNS"
```

### 3.8 Create Target Group
```bash
TG_ARN=$(aws elbv2 create-target-group \
    --name ch-production-tg \
    --protocol HTTP \
    --port 8080 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text \
    --region us-east-1)
echo "Target Group ARN: $TG_ARN"
```

### 3.9 Create ALB Listener
```bash
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region us-east-1
```

## Phase 4: Build and Push Docker Image

### 4.1 Login to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 127679825789.dkr.ecr.us-east-1.amazonaws.com
```

### 4.2 Build Docker Image
```bash
cd C:\Users\HP\Ch
docker build -t ch-production .
```

### 4.3 Tag and Push
```bash
# Tag images
docker tag ch-production:latest 127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:latest
docker tag ch-production:latest 127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:v0.1.0-initial

# Push to ECR
docker push 127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:latest
docker push 127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core:v0.1.0-initial
```

## Phase 5: Deploy to ECS

### 5.1 Register Task Definition
```bash
aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region us-east-1
```

### 5.2 Create ECS Service
```bash
aws ecs create-service \
    --cluster ch-production \
    --service-name ch-production-service \
    --task-definition ch-production-task:1 \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=$TG_ARN,containerName=ch-production-container,containerPort=8080 \
    --region us-east-1
```

### 5.3 Wait for Service to Stabilize
```bash
aws ecs wait services-stable \
    --cluster ch-production \
    --services ch-production-service \
    --region us-east-1
```

## Phase 6: Verify Deployment

### 6.1 Test Endpoints
```bash
# Test health endpoint
curl http://$ALB_DNS/health

# Test version endpoint
curl http://$ALB_DNS/version

# Test main application
curl http://$ALB_DNS/
```

### 6.2 Check ECS Service Status
```bash
aws ecs describe-services \
    --cluster ch-production \
    --services ch-production-service \
    --query 'services[0].runningCount' \
    --region us-east-1
```

## Phase 7: Set Up CodeBuild (AWS Console)

1. Go to AWS CodeBuild Console
2. Create build project:
   - Name: `ch-production-docker-build`
   - Source: GitHub
   - Repository: `ch-production`
   - Environment: Ubuntu Standard 7.0
   - Privileged: Yes (for Docker)
   - Service role: Create new
   - Buildspec: Use buildspec.yml

3. Enable webhook for automatic builds on push

## Phase 8: Update Documentation

Update `essentials/SYSTEM_CHANGELOG.md` with:
- ALB URL
- Deployment timestamp
- Infrastructure details

## Troubleshooting

### If ECS service won't start:
```bash
# Check task status
aws ecs describe-tasks \
    --cluster ch-production \
    --tasks $(aws ecs list-tasks --cluster ch-production --service-name ch-production-service --query 'taskArns[0]' --output text) \
    --region us-east-1
```

### If health checks fail:
- Check security group rules
- Verify container is running on port 8080
- Check CloudWatch logs:
```bash
aws logs tail /ecs/ch-production --follow
```

## Important URLs to Save
- ALB URL: `http://[your-alb-dns]`
- ECR Repository: `127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core`
- ECS Console: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/ch-production
- CodeBuild Console: https://console.aws.amazon.com/codesuite/codebuild/projects
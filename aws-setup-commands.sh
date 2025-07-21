#!/bin/bash

# AWS ECS Infrastructure Setup for Ch Project
# Run these commands in order to set up the complete infrastructure

set -e

echo "Setting up Ch Project AWS Infrastructure..."
echo "==========================================="

# 1. Create ECR Repository
echo "1. Creating ECR Repository..."
aws ecr create-repository --repository-name ch-production/core \
  --region us-east-1

# 2. Create ECS Cluster
echo "2. Creating ECS Cluster..."
aws ecs create-cluster --cluster-name ch-production \
  --capacity-providers FARGATE \
  --region us-east-1

# 3. Create Application Load Balancer
echo "3. Creating Application Load Balancer..."
# Note: Replace [subnet-ids-from-ava] and [sg-id-from-ava] with actual values from AVA
aws elbv2 create-load-balancer \
  --name ch-alb \
  --subnets subnet-06f97da7ea4b231c8 subnet-0123456789abcdef0 \
  --security-groups sg-0123456789abcdef0 \
  --region us-east-1

# 4. Get VPC ID for target group
echo "4. Getting VPC ID..."
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text --region us-east-1)

# 5. Create target group
echo "5. Creating Target Group..."
aws elbv2 create-target-group \
  --name ch-production-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --region us-east-1

# 6. Create CloudWatch Log Group
echo "6. Creating CloudWatch Log Group..."
aws logs create-log-group \
  --log-group-name /ecs/ch-production \
  --region us-east-1

# 7. Register ECS Task Definition
echo "7. Registering ECS Task Definition..."
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1

# 8. Create ECS Service (will be updated after getting actual subnet/sg IDs)
echo "8. Creating ECS Service..."
echo "Note: Update subnet and security group IDs before running:"
echo "aws ecs create-service \\"
echo "  --cluster ch-production \\"
echo "  --service-name ch-production-service \\"
echo "  --task-definition ch-production-task:1 \\"
echo "  --desired-count 1 \\"
echo "  --launch-type FARGATE \\"
echo "  --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}' \\"
echo "  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:xxx,containerName=ch-production-container,containerPort=8080"

echo ""
echo "Infrastructure setup initiated!"
echo "Next steps:"
echo "1. Get actual subnet and security group IDs from AVA setup"
echo "2. Update the ECS service creation command"
echo "3. Set up CodeBuild project via AWS Console"
echo "4. Configure GitHub webhook"
echo "5. Test initial deployment"
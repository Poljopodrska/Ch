#!/bin/bash
set -e

echo "Setting up Ch Production AWS Infrastructure..."

# Variables
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="127679825789"
CLUSTER_NAME="ch-production"
SERVICE_NAME="ch-production-service"
ALB_NAME="ch-alb"

# Create ECR repository
echo "Creating ECR repository..."
aws ecr create-repository \
    --repository-name ch-production/core \
    --region $AWS_REGION || echo "ECR repository may already exist"

# Create ECS cluster
echo "Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --capacity-providers FARGATE \
    --region $AWS_REGION || echo "Cluster may already exist"

# Create CloudWatch log group
echo "Creating CloudWatch log group..."
aws logs create-log-group \
    --log-group-name /ecs/ch-production \
    --region $AWS_REGION || echo "Log group may already exist"

echo "Infrastructure setup complete!"
echo "Next steps:"
echo "1. Create ALB and target group in AWS Console"
echo "2. Create CodeBuild project"
echo "3. Create ECS task definition and service"
echo "4. Set up GitHub webhook"
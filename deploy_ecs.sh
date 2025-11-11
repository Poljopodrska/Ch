#!/bin/bash

# Ch Application - AWS ECS Deployment Script
# Deploys the updated code to AWS ECS

set -e

echo "🚀 Starting deployment of Ch Application..."

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="ch-production/core"
ECS_CLUSTER="ch-production"
ECS_SERVICE="ch-production-service"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"

echo "📦 ECR Repository: ${ECR_URI}"

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build Docker image
echo "🏗️ Building Docker image..."
docker build -t ch-production:latest .

# Tag the image
echo "🏷️ Tagging image..."
docker tag ch-production:latest ${ECR_URI}:latest
docker tag ch-production:latest ${ECR_URI}:$(date +%Y%m%d-%H%M%S)

# Push to ECR
echo "📤 Pushing image to ECR..."
docker push ${ECR_URI}:latest
docker push ${ECR_URI}:$(date +%Y%m%d-%H%M%S)

# Update ECS service to force new deployment
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster ${ECS_CLUSTER} \
    --service ${ECS_SERVICE} \
    --force-new-deployment \
    --region ${AWS_REGION}

echo "✅ Deployment initiated successfully!"
echo ""
echo "📊 Monitor deployment status with:"
echo "   aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION}"
echo ""
echo "🌐 Your application will be live at:"
echo "   http://ch-alb-2140286266.us-east-1.elb.amazonaws.com"
echo ""
echo "⏱️  Deployment usually takes 2-3 minutes"
echo ""

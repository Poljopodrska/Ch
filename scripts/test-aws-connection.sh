#!/bin/bash
# Test AWS connection and create initial resources

echo "Testing AWS Connection..."
echo "========================"

# Test AWS CLI
echo "1. Testing AWS CLI configuration..."
aws sts get-caller-identity --region us-east-1
if [ $? -eq 0 ]; then
    echo "✅ AWS CLI is configured correctly"
else
    echo "❌ AWS CLI is not configured. Please run 'aws configure'"
    exit 1
fi

# Create ECR repository
echo -e "\n2. Creating ECR repository..."
aws ecr create-repository \
    --repository-name ch-production/core \
    --region us-east-1 \
    --output json 2>/dev/null || echo "Repository may already exist"

# List existing resources
echo -e "\n3. Checking existing resources..."
echo "Existing ECS Clusters:"
aws ecs list-clusters --region us-east-1 --output table

echo -e "\nExisting ECR Repositories:"
aws ecr describe-repositories --region us-east-1 --output table 2>/dev/null || echo "No repositories found"

echo -e "\nExisting ALBs:"
aws elbv2 describe-load-balancers --region us-east-1 --query "LoadBalancers[*].[LoadBalancerName,DNSName]" --output table

echo -e "\n✅ AWS connection test complete!"
echo "Run ./scripts/deploy-to-aws.sh to deploy Ch production"
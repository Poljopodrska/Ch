#!/bin/bash
# Discover existing AWS resources from AVA setup

echo "Discovering AWS Resources..."
echo "=========================="

# Get default VPC
echo "1. Getting VPC information..."
VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[?IsDefault==\`true\`].VpcId" --output text --region us-east-1)
if [ -z "$VPC_ID" ]; then
    VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text --region us-east-1)
fi
echo "VPC ID: $VPC_ID"

# Get subnets in the VPC
echo -e "\n2. Getting subnet information..."
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]" --output table --region us-east-1)
echo "$SUBNETS"

# Get security groups
echo -e "\n3. Getting security groups..."
# Look for AVA-related security groups
AVA_SGS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[?contains(GroupName, 'ava') || contains(GroupName, 'ecs') || contains(GroupName, 'alb')].[GroupId,GroupName,Description]" --output table --region us-east-1)
echo "AVA-related security groups:"
echo "$AVA_SGS"

# Get all security groups for reference
echo -e "\nAll security groups:"
ALL_SGS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[*].[GroupId,GroupName,Description]" --output table --region us-east-1)
echo "$ALL_SGS"

# Get existing ALBs
echo -e "\n4. Getting existing ALBs..."
ALBS=$(aws elbv2 describe-load-balancers --query "LoadBalancers[*].[LoadBalancerName,DNSName,State.Code]" --output table --region us-east-1)
echo "$ALBS"

# Get existing ECS clusters
echo -e "\n5. Getting existing ECS clusters..."
CLUSTERS=$(aws ecs list-clusters --query "clusterArns[*]" --output table --region us-east-1)
echo "$CLUSTERS"

# Get existing ECR repositories
echo -e "\n6. Getting existing ECR repositories..."
REPOS=$(aws ecr describe-repositories --query "repositories[*].[repositoryName,repositoryUri]" --output table --region us-east-1 2>/dev/null || echo "No ECR repositories found")
echo "$REPOS"

# Save discovered resources
echo -e "\n7. Saving discovered resources..."
cat > discovered-resources.txt << EOF
VPC_ID=$VPC_ID
# Add subnet IDs discovered above
# Add security group IDs discovered above
EOF

echo -e "\nDiscovery complete! Check the output above and update discovered-resources.txt with the resources you want to use."
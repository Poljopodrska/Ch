#!/bin/bash
set -e

echo "Creating RDS PostgreSQL instance for Ch Production..."

# Variables
DB_INSTANCE_ID="ch-production-db"
DB_NAME="ch_production"
DB_USERNAME="ch_admin"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region us-east-1)

# Save credentials
echo "DB_PASSWORD=$DB_PASSWORD" > .env.production
echo "Database password saved to .env.production"

# Create DB subnet group
echo "Creating DB subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region us-east-1)
aws rds create-db-subnet-group \
    --db-subnet-group-name ch-production-subnet-group \
    --db-subnet-group-description "Subnet group for Ch production database" \
    --subnet-ids $SUBNET_IDS \
    --region us-east-1 || echo "Subnet group may already exist"

# Create security group for RDS
echo "Creating security group for RDS..."
RDS_SG=$(aws ec2 create-security-group \
    --group-name ch-rds-sg \
    --description "Security group for Ch RDS instance" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region us-east-1 2>/dev/null || aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=ch-rds-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region us-east-1)

# Get ECS tasks security group
ECS_SG=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=ch-app-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region us-east-1)

# Allow access from ECS tasks
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG \
    --protocol tcp \
    --port 5432 \
    --source-group $ECS_SG \
    --region us-east-1 2>/dev/null || echo "Security group rule may already exist"

# Create RDS instance
echo "Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.small \
    --engine postgres \
    --engine-version 15.8 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --db-name $DB_NAME \
    --allocated-storage 30 \
    --storage-type gp3 \
    --storage-encrypted \
    --vpc-security-group-ids $RDS_SG \
    --db-subnet-group-name ch-production-subnet-group \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "sun:04:00-sun:05:00" \
    --no-publicly-accessible \
    --auto-minor-version-upgrade \
    --region us-east-1

echo "Waiting for RDS instance to be available (this may take 5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region us-east-1

# Get endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region us-east-1)

echo "RDS instance created!"
echo "Endpoint: $DB_ENDPOINT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "Password: Saved in .env.production"

# Save connection info
cat > database-info.txt << EOF
DB_HOST=$DB_ENDPOINT
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
EOF

echo "Connection info saved to database-info.txt"
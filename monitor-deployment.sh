#!/bin/bash

# Function to check deployment status
check_deployment() {
    echo "=== Ch Production Deployment Status ==="
    echo "Time: $(date)"
    
    # 1. Check latest build
    echo -e "\n📦 Latest Build:"
    BUILD_ID=$(aws codebuild list-builds-for-project \
        --project-name ch-production-docker-build \
        --region us-east-1 \
        --query 'ids[0]' \
        --output text)
    
    if [ "$BUILD_ID" != "None" ]; then
        aws codebuild batch-get-builds \
            --ids "$BUILD_ID" \
            --region us-east-1 \
            --query 'builds[0].[buildStatus,startTime,endTime]' \
            --output table
    else
        echo "No builds found"
    fi
    
    # 2. Check ECS service
    echo -e "\n🚀 ECS Service Status:"
    aws ecs describe-services \
        --cluster ch-production \
        --services ch-production-service \
        --region us-east-1 \
        --query 'services[0].[status,runningCount,desiredCount,deployments[0].status]' \
        --output table
    
    # 3. Check application health
    echo -e "\n❤️ Application Health:"
    curl -s http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/health | python3 -m json.tool || echo "Health check failed"
    
    # 4. Check version
    echo -e "\n📌 Current Version:"
    curl -s http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/version | python3 -m json.tool || echo "Version check failed"
    
    # 5. Check target health
    echo -e "\n🎯 Target Health:"
    aws elbv2 describe-target-health \
        --target-group-arn arn:aws:elasticloadbalancing:us-east-1:127679825789:targetgroup/ch-production-tg/037af2482166b855 \
        --region us-east-1 \
        --query 'TargetHealthDescriptions[].{Target:Target.Id,Health:TargetHealth.State}' \
        --output table
}

# Run monitoring
check_deployment
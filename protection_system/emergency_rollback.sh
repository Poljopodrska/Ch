#!/bin/bash
# Ch Production Emergency Rollback
# Adapted from AVA OLO

set -e

if [ "$1" == "--help" ]; then
    echo "Usage: ./emergency_rollback.sh [task-revision]"
    echo "Example: ./emergency_rollback.sh 5"
    exit 0
fi

CLUSTER="ch-production"
SERVICE="ch-production-service"
REGION="us-east-1"

if [ -z "$1" ]; then
    echo "Please specify task revision to rollback to"
    exit 1
fi

echo "Rolling back to task revision $1..."
aws ecs update-service \
    --cluster $CLUSTER \
    --service $SERVICE \
    --task-definition ch-production-task:$1 \
    --force-new-deployment \
    --region $REGION

echo "Rollback initiated. Monitor ECS console for status."
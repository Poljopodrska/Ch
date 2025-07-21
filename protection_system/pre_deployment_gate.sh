#!/bin/bash
# Ch Production Pre-Deployment Gate
# Adapted from AVA OLO

set -e

echo "========================================="
echo "CH PRODUCTION PRE-DEPLOYMENT GATE"
echo "========================================="

# Configuration
ALB_URL="${CH_SERVICE_URL:-http://ch-alb-2140286266.us-east-1.elb.amazonaws.com}"
REQUIRED_ENDPOINTS=("/health" "/version" "/" "/api/deployment/verify")

echo "Checking service at: $ALB_URL"

# Check each endpoint
FAILED=0
for endpoint in "${REQUIRED_ENDPOINTS[@]}"; do
    echo "Testing $endpoint..."
    if curl -f -s "$ALB_URL$endpoint" > /dev/null; then
        echo "✅ $endpoint - OK"
    else
        echo "❌ $endpoint - FAILED"
        FAILED=1
    fi
done

# Check specific functionality
echo -e "\nChecking legacy endpoints..."
if curl -f -s "$ALB_URL/api/v1/legacy/meat-planner/data" > /dev/null; then
    echo "✅ Legacy meat planner endpoint - OK"
else
    echo "❌ Legacy meat planner endpoint - FAILED"
    FAILED=1
fi

# Check static assets
echo -e "\nChecking static assets..."
if curl -f -s "$ALB_URL/static/css/main.css" > /dev/null; then
    echo "✅ Static assets - OK"
else
    echo "❌ Static assets - FAILED"
    FAILED=1
fi

if [ $FAILED -eq 0 ]; then
    echo -e "\n========================================="
    echo "✅ ALL CHECKS PASSED - SAFE TO DEPLOY"
    echo "========================================="
    exit 0
else
    echo -e "\n========================================="
    echo "❌ SOME CHECKS FAILED - DO NOT DEPLOY"
    echo "========================================="
    exit 1
fi
# Ch Production Deployment Guide

## Initial Setup (One-time)

1. **Run AWS setup script:**
   ```bash
   chmod +x scripts/aws-setup.sh
   ./scripts/aws-setup.sh
   ```

2. **Create ALB in AWS Console:**
   - Name: ch-alb
   - Scheme: Internet-facing
   - Use same VPC/subnets as AVA

3. **Create Target Group:**
   - Name: ch-production-tg
   - Type: IP
   - Port: 8080
   - Health check: /health

4. **Create CodeBuild Project:**
   - Name: ch-production-docker-build
   - Source: GitHub (ch-production repo)
   - Use buildspec.yml
   - Environment: Standard 7.0

5. **Register Task Definition:**
   ```bash
   aws ecs register-task-definition \
     --cli-input-json file://ecs-task-definition.json
   ```

6. **Create ECS Service:**
   ```bash
   aws ecs create-service \
     --cluster ch-production \
     --service-name ch-production-service \
     --task-definition ch-production-task:1 \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
     --load-balancers targetGroupArn=arn:xxx,containerName=ch-production-container,containerPort=8080
   ```

## Deployment Process

1. **Make changes locally**

2. **Test protection gate:**
   ```bash
   ./protection_system/pre_deployment_gate.sh
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature"
   git push origin main
   ```

4. **Monitor deployment:**
   - CodeBuild: https://console.aws.amazon.com/codesuite/codebuild
   - ECS: https://console.aws.amazon.com/ecs

## Verification

After deployment:
```bash
# Get ALB URL
aws elbv2 describe-load-balancers --names ch-alb

# Test endpoints
curl http://ch-alb-xxxxx.us-east-1.elb.amazonaws.com/health
curl http://ch-alb-xxxxx.us-east-1.elb.amazonaws.com/version
```

## Emergency Rollback

```bash
./protection_system/emergency_rollback.sh [revision-number]
```
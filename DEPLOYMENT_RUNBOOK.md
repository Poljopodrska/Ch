# Ch Production Deployment Runbook

## Automatic Deployment (Normal Flow)
1. Make changes locally
2. Test with pre-deployment gate:
   ```bash
   ./protection_system/pre_deployment_gate.sh
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin main
   ```
4. Monitor deployment:
   ```bash
   ./monitor-deployment.sh
   ```

## Manual Deployment (If Needed)
```bash
aws codebuild start-build --project-name ch-production-docker-build --region us-east-1
```

## Rollback Procedure
```bash
# Get current task definition revision
aws ecs describe-services --cluster ch-production --services ch-production-service --query 'services[0].taskDefinition'

# Rollback to previous revision (e.g., revision 5)
./protection_system/emergency_rollback.sh 5
```

## Monitoring Commands
- View builds: `aws codebuild list-builds-for-project --project-name ch-production-docker-build`
- View ECS tasks: `aws ecs list-tasks --cluster ch-production`
- View logs: `aws logs tail /ecs/ch-production --follow`

## Troubleshooting
- **Build failed**: Check CodeBuild logs
- **Task not starting**: Check ECS task logs
- **Unhealthy targets**: Check ALB target group

## URLs and Resources
- **Production URL**: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com
- **Health Check**: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/health
- **Version Check**: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/version

## AWS Resources
- **ECR Repository**: 127679825789.dkr.ecr.us-east-1.amazonaws.com/ch-production/core
- **ECS Cluster**: ch-production
- **ECS Service**: ch-production-service
- **CodeBuild Project**: ch-production-docker-build
- **ALB**: ch-alb
- **Target Group**: ch-production-tg
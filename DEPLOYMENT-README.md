# Ch Production AWS Deployment

## 🎯 Goal
Deploy Ch application to AWS ECS with complete CI/CD pipeline, separate from AVA infrastructure.

## 📋 What You'll Get
- **Production URL**: `http://ch-alb-[random].us-east-1.elb.amazonaws.com`
- **Auto-deployment**: Git push → Live in 5 minutes
- **Complete separation**: Own ECS cluster, ALB, ECR (not shared with AVA)
- **MeatProductionPlanner**: Integrated and accessible

## 🚀 Deployment Steps

### Step 1: GitHub Repository (5 minutes)
```bash
# Create empty repo on GitHub: "ch-production"
# Then run:
./scripts/setup-github.sh
```

### Step 2: Deploy to AWS (15 minutes)
```bash
# Option A: Full automated deployment
./scripts/deploy-to-aws.sh

# Option B: Test first
./scripts/test-aws-connection.sh
./scripts/discover-aws-resources.sh
./scripts/deploy-to-aws.sh
```

### Step 3: Setup Auto-deployment (10 minutes)
1. Go to [AWS CodeBuild Console](https://console.aws.amazon.com/codesuite/codebuild)
2. Create project: `ch-production-docker-build`
3. Connect to GitHub repository
4. Enable webhook for automatic builds

### Step 4: Verify Deployment
```bash
# Your ALB URL will be shown after deployment
curl http://ch-alb-xxxxx.us-east-1.elb.amazonaws.com/health
curl http://ch-alb-xxxxx.us-east-1.elb.amazonaws.com/version
```

## 📁 Files Created for Deployment

### Core Files
- `Dockerfile` - Production container configuration
- `requirements.txt` - Python dependencies
- `buildspec.yml` - CodeBuild pipeline
- `ecs-task-definition.json` - ECS configuration
- `.dockerignore` - Build optimization

### API Updates
- `api/main.py` - Production endpoints with health checks
- Legacy MeatProductionPlanner endpoints
- Deployment verification endpoints

### Scripts
- `scripts/deploy-to-aws.sh` - Automated deployment
- `scripts/discover-aws-resources.sh` - Find existing resources
- `scripts/test-aws-connection.sh` - Verify AWS setup
- `scripts/setup-github.sh` - GitHub initialization

### Documentation
- `DEPLOYMENT-STEPS.md` - Detailed manual steps
- `DEPLOY-NOW.md` - Quick start guide
- `deployment-info.txt` - Created after deployment with all resource IDs

### Protection Systems
- `protection_system/pre_deployment_gate.sh` - Deployment validation
- `protection_system/emergency_rollback.sh` - Quick rollback

## 🏗️ Infrastructure Created

### AWS Resources
- **ECR Repository**: `ch-production/core`
- **ECS Cluster**: `ch-production` (Fargate)
- **ALB**: `ch-alb` (Internet-facing)
- **Target Group**: `ch-production-tg`
- **Security Groups**: `ch-alb-sg`, `ch-ecs-tasks-sg`
- **CloudWatch Logs**: `/ecs/ch-production`

### Resource Allocation
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB
- Fargate Spot: Not used (for stability)

## 🔄 CI/CD Pipeline

### Workflow
1. `git push` to main branch
2. GitHub webhook triggers CodeBuild
3. CodeBuild builds Docker image
4. Image pushed to ECR
5. ECS service updated
6. New version live in ~5 minutes

### Version Tracking
- Build ID: Git commit hash
- Deployment ID: Timestamp
- Version format: `v0.1.0-abc1234`

## 🛡️ Security

### Network Security
- ALB: Public internet access on port 80
- ECS Tasks: Private, only accessible from ALB
- Security groups restrict traffic flow

### Container Security
- Non-root user in container
- Minimal base image (python:3.11-slim)
- No secrets in image

## 🔍 Monitoring

### Health Checks
- Docker: Every 30s via curl
- ALB: Every 30s on `/health`
- ECS: Container health monitoring

### Logs
- CloudWatch: `/ecs/ch-production`
- Container stdout/stderr captured
- Structured JSON logging ready

## 🚨 Troubleshooting

### Common Issues

1. **ECS service won't start**
   - Check CloudWatch logs
   - Verify security groups
   - Check task definition

2. **Health checks failing**
   - Verify port 8080 is correct
   - Check security group rules
   - Review container logs

3. **Can't push to ECR**
   - Run ECR login command
   - Check IAM permissions
   - Verify repository exists

### Debug Commands
```bash
# View service status
aws ecs describe-services --cluster ch-production --services ch-production-service

# View task logs
aws logs tail /ecs/ch-production --follow

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn [tg-arn]
```

## 🎉 Success Criteria

When deployment is complete, you should see:
- ✅ ALB URL responding to /health
- ✅ Version endpoint showing build info
- ✅ Ch application loading at root URL
- ✅ MeatProductionPlanner accessible
- ✅ ECS service stable with 1 running task

## 📞 Next Steps After Deployment

1. Save ALB URL in team documentation
2. Set up custom domain (optional)
3. Configure monitoring alerts
4. Test auto-deployment with git push
5. Update SYSTEM_CHANGELOG.md with production URL

---

**Ready to deploy? Start with Step 1 above!** 🚀

**Deployment typically takes 20-30 minutes total including all setup.**
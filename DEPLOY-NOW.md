# 🚀 Ch Production Deployment - Quick Start

## Prerequisites Check
```bash
# 1. Check AWS CLI
aws sts get-caller-identity

# 2. Check Docker
docker --version

# 3. Check Git
git --version
```

## Option A: Automated Deployment (Recommended)
```bash
# Run complete deployment
cd C:\Users\HP\Ch
./scripts/deploy-to-aws.sh
```

## Option B: Test First, Then Deploy
```bash
# 1. Test AWS connection
./scripts/test-aws-connection.sh

# 2. Discover existing resources
./scripts/discover-aws-resources.sh

# 3. Run full deployment
./scripts/deploy-to-aws.sh
```

## Option C: Manual Step-by-Step
Follow the detailed guide in `DEPLOYMENT-STEPS.md`

## After Deployment

1. **Save the ALB URL** shown at the end of deployment
2. **Create CodeBuild Project** in AWS Console:
   - Name: `ch-production-docker-build`
   - Source: GitHub
   - Webhook: Enable for pushes to main
   
3. **Test the deployment**:
   ```bash
   # Replace with your actual ALB URL
   curl http://ch-alb-xxxxx.us-east-1.elb.amazonaws.com/health
   ```

4. **Update SYSTEM_CHANGELOG.md** with the ALB URL

## Troubleshooting

If deployment fails:
- Check `deployment-info.txt` for resource IDs
- View CloudWatch logs: `/ecs/ch-production`
- Check ECS service events in AWS Console

## Emergency Rollback
```bash
./protection_system/emergency_rollback.sh [task-revision]
```

---
**Ready to deploy? Start with Option A above!** 🚀
# Ch Production System

## Live URL
http://ch-alb-2140286266.us-east-1.elb.amazonaws.com

## Deployment
Changes pushed to `main` branch automatically deploy via AWS CodeBuild (once GitHub webhook is configured).

### Setup GitHub Integration
1. Create a GitHub personal access token with `repo` and `admin:repo_hook` scopes
2. Save token to `.github-token` file
3. Run `./setup-github-integration.sh`

### Manual Deployment
```bash
aws codebuild start-build --project-name ch-production-docker-build --region us-east-1
```

## Local Development
1. Double-click `ch_app.html` for local development
2. Test changes with `./protection_system/pre_deployment_gate.sh`
3. Push to deploy

## Monitoring
- Deployment status: `./monitor-deployment.sh`
- Application health: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/health
- Current version: http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/version

## Architecture
- **Platform**: AWS ECS Fargate
- **Load Balancer**: Application Load Balancer (ALB)
- **Container Registry**: Amazon ECR
- **CI/CD**: AWS CodeBuild
- **Region**: us-east-1

## Key Endpoints
- `/` - Main application
- `/health` - Health check
- `/version` - Version info
- `/api/deployment/verify` - Deployment verification
- `/api/v1/legacy/meat-planner/*` - Legacy meat planner endpoints

## Development Scripts
- `monitor-deployment.sh` - Check deployment status
- `test-deployment.sh` - Test automated deployment
- `protection_system/pre_deployment_gate.sh` - Pre-deployment checks

## Resources
See [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) for detailed deployment procedures.
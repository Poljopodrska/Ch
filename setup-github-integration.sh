#!/bin/bash
set -e

echo "Setting up GitHub integration for CodeBuild..."

# Check if token file exists
if [ ! -f ".github-token" ]; then
    echo "ERROR: Create .github-token file with your GitHub personal access token"
    echo "See github-setup-instructions.md for details"
    exit 1
fi

GITHUB_TOKEN=$(cat .github-token | tr -d '\n')

# Import source credentials
echo "Importing GitHub credentials to CodeBuild..."
aws codebuild import-source-credentials \
    --token "$GITHUB_TOKEN" \
    --server-type GITHUB \
    --auth-type PERSONAL_ACCESS_TOKEN \
    --region us-east-1

# Update project to use GitHub with webhook
echo "Updating CodeBuild project with webhook..."
cat > github-project-update.json << EOF
{
  "name": "ch-production-docker-build",
  "source": {
    "type": "GITHUB",
    "location": "https://github.com/HP2706/Ch.git",
    "buildspec": "buildspec.yml",
    "reportBuildStatus": true,
    "gitCloneDepth": 1
  },
  "sourceVersion": "main"
}
EOF

aws codebuild update-project \
    --cli-input-json file://github-project-update.json \
    --region us-east-1

# Create webhook
echo "Creating webhook..."
aws codebuild create-webhook \
    --project-name ch-production-docker-build \
    --filter-groups '[
        [
            {
                "type": "EVENT",
                "pattern": "PUSH"
            },
            {
                "type": "HEAD_REF",
                "pattern": "^refs/heads/main$"
            }
        ]
    ]' \
    --region us-east-1

# Clean up
rm -f github-project-update.json

echo "GitHub integration complete!"
echo "Webhook URL has been created and GitHub will automatically configure it."
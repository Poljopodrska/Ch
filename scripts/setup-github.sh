#!/bin/bash
# Setup GitHub repository for Ch Production

echo "GitHub Repository Setup for Ch Production"
echo "========================================"
echo ""
echo "Prerequisites:"
echo "1. Create a new repository on GitHub named 'ch-production'"
echo "2. Do NOT initialize with README, .gitignore, or license"
echo ""
echo "Press Enter when you've created the empty repository on GitHub..."
read

echo -e "\nInitializing Git repository..."
git init

echo -e "\nAdding all files..."
git add .

echo -e "\nCreating initial commit..."
git commit -m "Initial Ch production system - Complete AWS ECS infrastructure"

echo -e "\nSetting main branch..."
git branch -M main

echo -e "\nNow you need to add the remote origin."
echo "Replace [YOUR-USERNAME] with your GitHub username:"
echo ""
echo "git remote add origin https://github.com/[YOUR-USERNAME]/ch-production.git"
echo ""
echo "Example:"
echo "git remote add origin https://github.com/johndoe/ch-production.git"
echo ""
echo "Enter the complete command:"
read REMOTE_CMD

# Execute the remote command
eval $REMOTE_CMD

echo -e "\nPushing to GitHub..."
git push -u origin main

echo -e "\n✅ GitHub repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Run ./scripts/deploy-to-aws.sh to deploy to AWS"
echo "2. After deployment, set up CodeBuild with this GitHub repository"
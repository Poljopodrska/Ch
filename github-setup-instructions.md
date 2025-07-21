# GitHub Integration Setup

## Steps to Create Personal Access Token:
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "ch-production-codebuild"
4. Select scopes:
   - repo (all)
   - admin:repo_hook (all)
5. Generate token and SAVE IT (you won't see it again)

## Store token securely:
Create a file `.github-token` (add to .gitignore):
```
ghp_YOUR_TOKEN_HERE
```

## Next Steps:
After creating the token, run:
```bash
./setup-github-integration.sh
```
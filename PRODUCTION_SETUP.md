# Production Setup Guide

## GitHub Personal Access Token Setup

To enable the Lambda function to trigger GitHub Actions workflows, you need to create a Personal Access Token (PAT):

### Step 1: Create GitHub PAT
1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set expiration (recommended: 90 days)
4. Select these scopes:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **actions:write** (Write access to GitHub Actions)

### Step 2: Add to AWS Lambda
```bash
# Update the Lambda function environment variables
aws lambda update-function-configuration \
  --function-name playwright-aws-lab-test-runner-XXXXX \
  --environment Variables='{
    "S3_BUCKET_NAME":"your-bucket-name",
    "GITHUB_TOKEN":"ghp_your_token_here",
    "GITHUB_OWNER":"your-username", 
    "GITHUB_REPO":"playwright-aws-lab"
  }'
```

### Step 3: Test the Setup
```bash
# Trigger the Lambda manually
aws lambda invoke \
  --function-name playwright-aws-lab-test-runner-XXXXX \
  --payload '{"trigger": "manual"}' \
  response.json

cat response.json
```

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   EventBridge   │───▶│   AWS Lambda     │───▶│ GitHub Actions  │
│  (Schedule)     │    │ (github-trigger) │    │ (test-only.yml) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Run Playwright │
                                               │  Upload to S3   │
                                               └─────────────────┘
```

## Cost Estimation (Free Tier)

- **Lambda**: 1M requests/month free ✅
- **EventBridge**: 14M invocations/month free ✅  
- **S3**: 5GB storage free ✅
- **GitHub Actions**: 2000 minutes/month free ✅

**Total Cost**: $0.00/month 🎉

## Manual Testing Commands

```bash
# Test Lambda ping
aws lambda invoke --function-name FUNCTION_NAME --payload '{"test":"ping"}' response.json

# Test GitHub trigger  
aws lambda invoke --function-name FUNCTION_NAME --payload '{"trigger":"manual"}' response.json

# Check S3 artifacts
aws s3 ls s3://your-bucket-name/ --recursive

# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow
```

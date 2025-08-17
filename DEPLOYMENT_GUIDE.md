# 🚀 AWS Deployment Guide - Step by Step

## Prerequisites ✅
- [x] AWS CLI installed
- [x] Terraform installed  
- [x] Tests running locally (`npm test` passing)

## Step 1: Configure AWS Credentials

Run the setup script:
```bash
./scripts/setup-aws.sh
```

**Or manually configure:**
```bash
# Configure AWS CLI with your credentials
~/.local/bin/aws configure

# Enter these when prompted:
AWS Access Key ID: [Your Access Key from IAM]
AWS Secret Access Key: [Your Secret Key from IAM]
Default region name: us-east-1
Default output format: json
```

## Step 2: Deploy Infrastructure

```bash
# 1. Initialize Terraform (one-time setup)
npm run tf:init

# 2. Review what will be created
npm run tf:plan

# 3. Deploy to AWS (creates Lambda, S3, IAM roles)
npm run tf:apply
```

**Expected output:**
```
Apply complete! Resources: 12 added, 0 changed, 0 destroyed.

Outputs:
lambda_function_name = "playwright-aws-lab-test-runner-xxxxx"
s3_bucket_name = "playwright-aws-lab-test-artifacts-xxxxx"
estimated_daily_cost = "~$0.06 (₹5 for 100 test runs)"
```

## Step 3: Test Lambda Deployment

```bash
# Test locally first
npm run test:lambda

# Test on AWS Lambda
~/.local/bin/aws lambda invoke \
  --function-name $(cd infra && ~/.local/bin/terraform output -raw lambda_function_name) \
  --payload '{"testFile": "tests/amazon/robust.spec.ts"}' \
  response.json

# View results
cat response.json
```

## Step 4: Monitor & Debug

### View CloudWatch Logs:
```bash
~/.local/bin/aws logs tail /aws/lambda/playwright-aws-lab-test-runner --follow
```

### Check S3 Artifacts:
```bash
BUCKET_NAME=$(cd infra && ~/.local/bin/terraform output -raw s3_bucket_name)
~/.local/bin/aws s3 ls s3://$BUCKET_NAME --recursive
```

### Download Test Videos/Screenshots:
```bash
~/.local/bin/aws s3 sync s3://$BUCKET_NAME/test-runs/ ./downloaded-artifacts/
```

## Troubleshooting

### If AWS credentials fail:
1. Double-check Access Key ID and Secret Key
2. Ensure IAM user has these policies:
   - `AWSLambdaFullAccess`
   - `AmazonS3FullAccess` 
   - `CloudWatchFullAccess`

### If Terraform fails:
```bash
# Check AWS connection
~/.local/bin/aws sts get-caller-identity

# Reset Terraform state
cd infra && rm -rf .terraform* terraform.tfstate*
npm run tf:init
```

### If Lambda deployment fails:
```bash
# Check Lambda logs
~/.local/bin/aws logs tail /aws/lambda/playwright-aws-lab-test-runner

# Rebuild and redeploy
npm run build:lambda
cd infra && ~/.local/bin/terraform apply -auto-approve
```

## Clean Up (When Done)

```bash
# Destroy all AWS resources
npm run tf:destroy

# Verify cleanup
~/.local/bin/aws s3 ls | grep playwright-aws-lab
~/.local/bin/aws lambda list-functions | grep playwright-aws-lab
```

## Cost Monitoring

After deployment, check your costs:
1. Go to [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)
2. Filter by service: Lambda, S3, CloudWatch
3. Expected: <$0.10/day for normal usage

---

**Need help?** Check the troubleshooting section or re-run `./scripts/setup-aws.sh`

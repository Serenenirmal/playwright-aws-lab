#!/bin/bash

# Update Lambda function with GitHub token
# Replace GITHUB_TOKEN_HERE with your actual token

GITHUB_TOKEN="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"

~/.local/bin/aws lambda update-function-configuration \
  --function-name playwright-aws-lab-test-runner-ocxmgmso \
  --environment Variables="{S3_BUCKET_NAME=playwright-aws-lab-test-artifacts-ocxmgmso,GITHUB_TOKEN=${GITHUB_TOKEN},GITHUB_OWNER=Serenenirmal,GITHUB_REPO=playwright-aws-lab}"

echo "Lambda function updated successfully!"

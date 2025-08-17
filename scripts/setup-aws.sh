#!/bin/bash

# AWS Setup Script for Playwright Lambda Lab
# Run this script after getting your AWS credentials

echo "🚀 Setting up AWS for Playwright Lambda Lab"
echo "============================================"

# Check if AWS CLI is available
if ! command -v ~/.local/bin/aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Check if Terraform is available  
if ! command -v ~/.local/bin/terraform &> /dev/null; then
    echo "❌ Terraform not found. Please install it first."
    exit 1
fi

echo "✅ AWS CLI and Terraform found"

# Prompt for AWS credentials
echo ""
echo "📋 Please enter your AWS credentials:"
echo "(You can find these in AWS IAM Console > Users > playwright-tester > Security credentials)"
echo ""

read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""

# Configure AWS CLI
echo "🔧 Configuring AWS CLI..."
~/.local/bin/aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
~/.local/bin/aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
~/.local/bin/aws configure set default.region us-east-1
~/.local/bin/aws configure set default.output json

# Test credentials
echo "🧪 Testing AWS credentials..."
if ~/.local/bin/aws sts get-caller-identity; then
    echo "✅ AWS credentials configured successfully!"
    echo ""
    
    # Initialize Terraform
    echo "🏗️ Initializing Terraform..."
    cd infra
    ~/.local/bin/terraform init
    
    if [ $? -eq 0 ]; then
        echo "✅ Terraform initialized successfully!"
        echo ""
        echo "🎯 Next steps:"
        echo "1. Review the infrastructure plan: npm run tf:plan"
        echo "2. Deploy to AWS: npm run tf:apply"
        echo "3. Test the deployment: npm run test:lambda"
        echo ""
        echo "💰 Estimated cost: ₹5/day for 100 test runs"
    else
        echo "❌ Terraform initialization failed"
        exit 1
    fi
else
    echo "❌ AWS credentials test failed. Please check your credentials."
    exit 1
fi

echo "🎉 Setup complete! Your Playwright Lambda lab is ready to deploy."

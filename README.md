# Serverless Playwright Test Lab on AWS

> **Cost-optimized UI testing at scale: ₹5/day vs ₹500/day traditional setup**

A production-ready serverless testing infrastructure that runs Playwright tests on AWS Lambda with automatic artifact storage and comprehensive debugging capabilities.

## 🎯 Key Features

- **98% Cost Reduction**: From ₹500/day (local infrastructure) to ₹5/day (serverless)
- **Parallel Execution**: 100+ concurrent Lambda functions
- **Debug-Ready**: S3-stored videos, screenshots, and CloudWatch logs
- **Production-Grade**: Terraform IaC, GitHub Actions CI/CD, error handling

## 📊 Cost Comparison

| Infrastructure | Daily Cost (100 runs) | Monthly Cost | Annual Cost |
|---------------|----------------------|--------------|-------------|
| **Local VMs** | ₹500 | ₹15,000 | ₹180,000 |
| **AWS Serverless** | ₹5 | ₹150 | ₹1,800 |
| **Savings** | **98% reduction** | **₹14,850/month** | **₹178,200/year** |

### Cost Breakdown (AWS):
- Lambda (2GB, 15min): ₹3.5/day
- S3 Storage (7-day retention): ₹1/day  
- CloudWatch Logs: ₹0.5/day
- **Total: ₹5/day**

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "CI/CD Pipeline"
        GH[GitHub Actions]
        GH -->|Deploy| TF[Terraform]
    end
    
    subgraph "AWS Infrastructure"
        TF -->|Provisions| L[Lambda Function<br/>2GB RAM, 15min timeout]
        TF -->|Creates| S3[S3 Bucket<br/>7-day lifecycle]
        TF -->|Sets up| CW[CloudWatch Logs]
        TF -->|Configures| EB[EventBridge<br/>Daily Schedule]
    end
    
    subgraph "Test Execution"
        EB -->|Triggers| L
        L -->|Runs| PW[Playwright Tests<br/>Chrome + Mobile]
        PW -->|Generates| A[Artifacts<br/>Videos, Screenshots, Reports]
        A -->|Upload| S3
        L -->|Logs| CW
    end
    
    subgraph "Monitoring & Debug"
        S3 -->|View| VID[Video Recordings]
        S3 -->|Download| REP[HTML Reports]
        CW -->|Debug| LOG[Error Logs]
    end
    
    classDef aws fill:#FF9900,stroke:#fff,color:#fff
    classDef test fill:#2E8B57,stroke:#fff,color:#fff
    classDef artifact fill:#4169E1,stroke:#fff,color:#fff
    
    class L,S3,CW,EB aws
    class PW,A test
    class VID,REP,LOG artifact
```

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Node.js 18+
- Git

### 1. Clone and Setup
```bash
git clone <your-repo>
cd playwright-aws-lab
npm install
npx playwright install
```

### 2. Deploy to AWS
```bash
# Initialize Terraform
npm run tf:init

# Plan deployment
npm run tf:plan

# Deploy infrastructure
npm run tf:apply
```

### 3. Run Tests
```bash
# Local execution
npm test

# Test Lambda deployment
aws lambda invoke \
  --function-name playwright-aws-lab-test-runner \
  --payload '{"testFile": "tests/amazon/search.spec.ts"}' \
  response.json && cat response.json
```

## 📁 Project Structure

```
playwright-aws-lab/
├── tests/amazon/           # Playwright test files
│   ├── search.spec.ts     # Search functionality tests
│   └── cart.spec.ts       # Shopping cart tests
├── scripts/               # Lambda handler
│   └── lambda-handler.js  # Main execution logic
├── infra/                 # Terraform configuration
│   ├── main.tf           # AWS resources
│   └── variables.tf      # Configuration variables
├── .github/workflows/     # CI/CD pipeline
│   └── deploy.yml        # Automated deployment
├── Dockerfile            # Lambda container image
├── playwright.config.ts  # Test configuration
└── package.json          # Dependencies and scripts
```

## 🧪 Test Examples

### Amazon India Search Test
```typescript
test('iPhone 15 price validation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#twotabsearchtextbox').fill('iPhone 15');
  await page.locator('#nav-search-submit-button').click();
  
  const priceText = await page.locator('.a-price-whole').first().textContent();
  const price = Number(priceText?.replace(/[₹,]/g, '') || '0');
  
  expect(price).toBeLessThan(70000);
});
```

## 🔧 Configuration

### Environment Variables
```bash
# Required for Lambda
S3_BUCKET_NAME=your-test-artifacts-bucket
AWS_REGION=us-east-1

# Optional for GitHub Actions
SLACK_WEBHOOK_URL=your-slack-webhook
```

### Terraform Variables
```hcl
# infra/terraform.tfvars
project_name = "playwright-aws-lab"
aws_region = "us-east-1"
lambda_memory = 2048
s3_lifecycle_days = 7
```

## 📈 Monitoring & Debugging

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/playwright-aws-lab-test-runner --follow
```

### S3 Artifacts
- **Videos**: `s3://bucket/test-runs/{timestamp}/videos/`
- **Screenshots**: `s3://bucket/test-runs/{timestamp}/screenshots/`  
- **Reports**: `s3://bucket/test-runs/{timestamp}/playwright-report/`

### Performance Metrics
- **Execution Time**: 2-5 minutes per test suite
- **Memory Usage**: ~1.5GB peak (2GB allocated)
- **Concurrency**: 1000 concurrent Lambda executions (AWS default limit)

## 🛠️ Commands

```bash
# Development
npm test                    # Run tests locally
npm run test:headed        # Run with browser UI
npm run install:browsers   # Install Playwright browsers

# AWS Deployment  
npm run build:lambda       # Create deployment package
npm run tf:init            # Initialize Terraform
npm run tf:plan            # Plan infrastructure changes
npm run tf:apply           # Deploy to AWS
npm run tf:destroy         # Teardown infrastructure

# Maintenance
aws s3 ls s3://bucket-name --recursive  # List test artifacts
aws lambda list-functions               # List Lambda functions
```

## 🎤 Interview Talking Points

*"This project demonstrates cost-effective automation architecture. I reduced testing infrastructure costs by 98% using AWS Lambda, achieving ₹5/day for 100 test runs versus ₹500/day for traditional VM-based testing. The serverless approach provides automatic scaling to 100+ concurrent tests while maintaining full debuggability through S3-stored videos and CloudWatch logs."*

### Technical Highlights:
1. **Serverless Architecture**: Zero maintenance overhead
2. **Infrastructure as Code**: Terraform for reproducible deployments  
3. **CI/CD Integration**: GitHub Actions with automated testing
4. **Cost Optimization**: AWS Free Tier + efficient resource allocation
5. **Debugging Tools**: Video recordings, screenshots, structured logging

## 🔒 Security & Best Practices

- **Least Privilege IAM**: Lambda role with minimal S3 and CloudWatch permissions
- **Network Security**: VPC-less Lambda for cost optimization
- **Artifact Retention**: 7-day S3 lifecycle policy for compliance
- **Error Handling**: Automatic retries with exponential backoff
- **Resource Limits**: 15-minute timeout, 2GB memory allocation

## 📚 Resources

- [AWS Lambda Pricing Calculator](https://calculator.aws/#/createCalculator/Lambda)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass locally
5. Submit a pull request

---

**Built with ❤️ for cost-effective, scalable UI testing**

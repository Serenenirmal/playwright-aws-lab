# Serverless E2E Testing Platform

A scalable, cloud-native end-to-end testing solution built on AWS serverless architecture with automated CI/CD pipeline.

## 🏗️ Architecture

**Hybrid Cloud Architecture:**
- **AWS Lambda**: Orchestrates test execution and scheduling
- **GitHub Actions**: Executes Playwright tests in containerized environment
- **Amazon S3**: Stores test artifacts, screenshots, and reports
- **Amazon EventBridge**: Manages scheduled test execution
- **Terraform**: Infrastructure as Code for reproducible deployments

## 🚀 Features

- **Serverless Architecture**: Zero server maintenance, automatic scaling
- **Cost-Optimized**: Runs within AWS free tier (~$0.00/month)
- **Page Object Pattern**: Maintainable test structure with separated locators
- **Parallel Execution**: Concurrent test runs for faster feedback
- **Artifact Management**: Automated capture and storage of test evidence
- **CI/CD Integration**: Automated deployment and testing pipeline
- **Infrastructure as Code**: Version-controlled infrastructure management

## 📁 Project Structure

```
├── tests/
│   ├── pages/                          # Page Object Model implementation
│   │   ├── AmazonHomePage.ts           # Home page interactions
│   │   ├── SearchResultsPage.ts        # Search results handling
│   │   └── ProductPage.ts              # Product page operations
│   └── e2e/                            # Comprehensive test suites
│       ├── ecommerce-platform-tests.spec.ts    # Core functionality tests
│       ├── user-journey-workflows.spec.ts      # Complex user scenarios
│       ├── data-driven-tests.spec.ts           # JSON-driven test cases
│       ├── visual-regression-tests.spec.ts     # Visual & accessibility tests
│       └── api-integration-tests.spec.ts       # API validation tests
├── scripts/
│   └── github-trigger.js               # Lambda function for workflow orchestration
├── infra/                              # Terraform infrastructure definitions
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── .github/workflows/                  # CI/CD pipeline configuration
    ├── deploy.yml                      # Infrastructure deployment
    └── test-only.yml                   # Test execution workflow
```

## 🔧 Technical Implementation

### Page Object Model
- **Separation of Concerns**: Test logic separated from UI locators
- **Maintainability**: Centralized element definitions with robust selectors
- **Reusability**: Shared page objects across multiple test scenarios
- **Reliability**: Optimized locators for dynamic content and loading states

### Serverless Testing Pipeline
1. **Event Trigger**: EventBridge schedules Lambda execution
2. **Workflow Dispatch**: Lambda triggers GitHub Actions via REST API
3. **Test Execution**: Playwright runs in GitHub's containerized environment
4. **Artifact Storage**: Results uploaded to S3 with lifecycle management
5. **Monitoring**: CloudWatch logs for debugging and analysis

### Infrastructure Automation
- **Terraform**: Declarative infrastructure provisioning
- **GitHub Actions**: Automated deployment pipeline
- **AWS Services**: Lambda, S3, EventBridge, CloudWatch, IAM

## 📊 Performance & Scalability

- **Test Coverage**: 5 comprehensive test suites covering core workflows
- **Execution Time**: 3-8 minutes for full test suite (optimizable to 2-3 minutes)
- **Concurrency**: Configurable workers for parallel execution
- **Storage**: Automatic artifact cleanup with S3 lifecycle management
- **Cost**: Optimized for AWS free tier usage (~$0-5/month)

## 🛠️ Technology Stack

- **Frontend Testing**: Playwright with TypeScript
- **Cloud Platform**: Amazon Web Services
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions
- **Runtime**: Node.js 18.x
- **Containerization**: GitHub Actions Ubuntu runners

## 🎯 Key Achievements

- **Cost Optimization**: Reduced testing infrastructure costs by 95% using serverless architecture
- **Automation**: Fully automated CI/CD pipeline with zero-downtime deployments
- **Test Coverage**: Comprehensive test automation across 5 different testing patterns:
  - Core functionality validation
  - Complex user journey workflows
  - Data-driven testing with JSON inputs
  - Visual regression and accessibility testing
  - API integration validation
- **Scalability**: Built serverless solution supporting configurable concurrent executions
- **Infrastructure as Code**: Version-controlled Terraform infrastructure with automated provisioning

## 🔍 Monitoring & Observability

- **CloudWatch Integration**: Real-time monitoring and alerting
- **S3 Artifact Management**: Organized storage with automatic cleanup
- **GitHub Actions Insights**: Detailed execution logs and metrics
- **Cost Tracking**: AWS billing integration for cost optimization

---

*Built with focus on scalability, cost-efficiency, and maintainability*

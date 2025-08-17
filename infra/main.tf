terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for test artifacts
resource "aws_s3_bucket" "test_artifacts" {
  bucket = "${var.project_name}-test-artifacts-${random_string.bucket_suffix.result}"
  tags   = var.tags
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "test_artifacts" {
  bucket = aws_s3_bucket.test_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "test_artifacts" {
  bucket = aws_s3_bucket.test_artifacts.id

  rule {
    id     = "delete_old_artifacts"
    status = "Enabled"

    expiration {
      days = var.s3_lifecycle_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}

resource "aws_s3_bucket_versioning" "test_artifacts" {
  bucket = aws_s3_bucket.test_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.test_artifacts.arn}/*"
      }
    ]
  })
}

# Attach basic Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Lambda function
resource "aws_lambda_function" "playwright_test" {
  filename         = "../lambda.zip"
  function_name    = "${var.project_name}-test-runner"
  role            = aws_iam_role.lambda_role.arn
  handler         = "scripts/lambda-handler.handler"
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory
  
  environment {
    variables = {
      S3_BUCKET_NAME = aws_s3_bucket.test_artifacts.bucket
      NODE_ENV       = "production"
    }
  }

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-test-runner"
  retention_in_days = 7
  tags              = var.tags
}

# EventBridge rule for scheduled execution (optional)
resource "aws_cloudwatch_event_rule" "daily_test" {
  name                = "${var.project_name}-daily-test"
  description         = "Trigger Playwright tests daily"
  schedule_expression = "cron(0 6 * * ? *)"  # 6 AM UTC daily
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.daily_test.name
  target_id = "PlaywrightTestTarget"
  arn       = aws_lambda_function.playwright_test.arn

  input = jsonencode({
    testFile = "tests/amazon/search.spec.ts"
    scheduled = true
  })
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.playwright_test.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_test.arn
}

# Outputs
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.playwright_test.function_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for test artifacts"
  value       = aws_s3_bucket.test_artifacts.bucket
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda logs"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "estimated_daily_cost" {
  description = "Estimated daily cost in USD"
  value       = "~$0.06 (₹5 for 100 test runs)"
}

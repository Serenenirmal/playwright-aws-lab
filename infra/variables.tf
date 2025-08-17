variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "playwright-aws-lab"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 900  # 15 minutes
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 2048
}

variable "s3_lifecycle_days" {
  description = "Number of days to retain test artifacts in S3"
  type        = number
  default     = 7
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "playwright-aws-lab"
    Environment = "dev"
    ManagedBy   = "terraform"
    Purpose     = "automated-testing"
  }
}

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

# GitHub integration variables for triggering workflows
variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
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

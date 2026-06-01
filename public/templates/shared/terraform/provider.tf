terraform {
  backend "s3" {}
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.5.0"
    }
  }
}
provider "aws" {
  region = "us-east-1"

  dynamic "assume_role" {
    for_each = terraform.workspace == "production" ? [] : [1]
    content {
      role_arn = terraform.workspace == "qa" ? local.provider_env_roles["qa"] : local.provider_env_roles["default"]
    }
  }
}

data "aws_caller_identity" "current" {}
output "current_aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}

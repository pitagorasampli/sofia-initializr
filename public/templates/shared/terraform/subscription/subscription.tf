variable endpoint { type = string }
variable sqs { type = string }
variable protocol { type = string }
variable topic { type = string }
variable account_id { type = string }

resource "aws_sns_topic_subscription" "subs-sqs" {
    count                = var.topic != "" ? 1 : 0
    endpoint             = var.endpoint
    protocol             = var.protocol
    raw_message_delivery = "false"
    topic_arn            = "arn:aws:sns:us-east-1:${var.account_id}:${terraform.workspace}-${var.topic}"
}

resource "aws_sqs_queue_policy" "policy" {
    count     = var.topic != "" ? 1 : 0
    queue_url = "https://sqs.us-east-1.amazonaws.com/${var.account_id}/${var.sqs}"
    policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "sqs:SendMessage",
    "Resource": "${var.endpoint}",
    "Condition": { "ArnEquals": { "aws:SourceArn": "arn:aws:sns:us-east-1:${var.account_id}:${terraform.workspace}-${var.topic}" } }
  }]
}
POLICY
}

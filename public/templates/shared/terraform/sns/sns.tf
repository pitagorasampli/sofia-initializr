resource "aws_sns_topic" "topics" {
    name = "${var.sns_name}-event"
}

resource "aws_sns_topic_policy" "policy" {
    arn = aws_sns_topic.topics.arn
    policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "__default_policy_ID",
  "Statement": [{
    "Sid": "__default_statement_ID",
    "Effect": "Allow",
    "Principal": { "AWS": "*" },
    "Action": ["SNS:Subscribe","SNS:Publish","SNS:GetTopicAttributes","SNS:DeleteTopic"],
    "Resource": "${aws_sns_topic.topics.arn}",
    "Condition": { "StringEquals": { "AWS:SourceOwner": "${var.account_id}" } }
  }]
}
POLICY
}

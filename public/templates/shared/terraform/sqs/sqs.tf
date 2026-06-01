resource "aws_sqs_queue" "sqs" {
    content_based_deduplication       = var.content_based_deduplication
    fifo_queue                        = var.fifo
    kms_data_key_reuse_period_seconds = "300"
    max_message_size                  = "262144"
    message_retention_seconds         = var.message_retention_seconds
    name                              = var.fifo == false ? var.name : "${var.name}.fifo"
    receive_wait_time_seconds         = "20"
    delay_seconds                     = var.delay_seconds
    redrive_policy = jsonencode({
        deadLetterTargetArn = aws_sqs_queue.dlq.arn
        maxReceiveCount     = var.max-receive-count
    })
    visibility_timeout_seconds        = var.visibility_timeout_seconds
}

resource "aws_sqs_queue" "dlq" {
    content_based_deduplication       = var.content_based_deduplication
    fifo_queue                        = var.fifo
    kms_data_key_reuse_period_seconds = "300"
    max_message_size                  = "262144"
    message_retention_seconds         = var.dlq_message_retention_seconds
    name                              = var.fifo == false ? "${var.name}-dlq" : "${var.name}-dlq.fifo"
    receive_wait_time_seconds         = "20"
    visibility_timeout_seconds        = "900"
}

module "subscription" {
    depends_on = [aws_sqs_queue.sqs]
    source = "../subscription"
    endpoint = aws_sqs_queue.sqs.arn
    sqs = aws_sqs_queue.sqs.name
    protocol = var.protocol
    topic = var.topic_subscription
    account_id = var.account_id
}

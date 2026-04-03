import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { BaseStack } from "./base-stack";
import type { EnvironmentConfig } from "./config";

interface SlackStackProps extends cdk.StackProps {
  readonly table: dynamodb.ITable;
}

export class SlackStack extends BaseStack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: SlackStackProps) {
    super(scope, id, config, props);

    const dlq = new sqs.Queue(this, "SlackDLQ", {
      queueName: `${config.prefix}-slack-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const queue = new sqs.Queue(this, "SlackQueue", {
      queueName: `${config.prefix}-slack-queue`,
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
    });

    const ackHandler = new lambda.Function(this, "AckHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../packages/slack/dist"),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        SQS_QUEUE_URL: queue.queueUrl,
        DYNAMODB_TABLE_NAME: props.table.tableName,
      },
    });

    queue.grantSendMessages(ackHandler);

    const processorHandler = new lambda.Function(this, "ProcessorHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.processor",
      code: lambda.Code.fromAsset("../packages/slack/dist"),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DYNAMODB_TABLE_NAME: props.table.tableName,
      },
    });

    processorHandler.addEventSource(new SqsEventSource(queue, { batchSize: 1 }));
    props.table.grantReadWriteData(processorHandler);

    const api = new apigateway.RestApi(this, "SlackApi", {
      restApiName: `${config.prefix}-slack`,
    });

    api.root.addResource("slack").addResource("events").addMethod(
      "POST",
      new apigateway.LambdaIntegration(ackHandler),
    );

    new cdk.CfnOutput(this, "SlackEventsUrl", { value: `${api.url}slack/events` });
    new cdk.CfnOutput(this, "DLQArn", { value: dlq.queueArn });
  }
}

import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { BaseStack } from "./base-stack";
import type { EnvironmentConfig } from "./config";

interface ApiStackProps extends cdk.StackProps {
  readonly table: dynamodb.ITable;
  readonly userPoolId: string;
  readonly userPoolArn: string;
}

export class ApiStack extends BaseStack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, config: EnvironmentConfig, props: ApiStackProps) {
    super(scope, id, config, props);

    const handler = new lambda.Function(this, "ApiHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../packages/api/dist"),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DYNAMODB_TABLE_NAME: props.table.tableName,
        COGNITO_USER_POOL_ID: props.userPoolId,
      },
    });

    props.table.grantReadWriteData(handler);

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "CognitoAuth", {
      cognitoUserPools: [
        cdk.aws_cognito.UserPool.fromUserPoolArn(this, "ImportedPool", props.userPoolArn),
      ],
    });

    this.api = new apigateway.RestApi(this, "HrApi", {
      restApiName: `${config.prefix}-api`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    this.api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(handler),
      defaultMethodOptions: {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      },
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: this.api.url });
  }
}

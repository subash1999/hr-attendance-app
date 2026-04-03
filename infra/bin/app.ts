#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { getConfig, type Stage } from "../lib/config";
import { DatabaseStack } from "../lib/database-stack";
import { AuthStack } from "../lib/auth-stack";
import { ApiStack } from "../lib/api-stack";
import { SlackStack } from "../lib/slack-stack";
import { WebStack } from "../lib/web-stack";
import { SchedulerStack } from "../lib/scheduler-stack";
import { EmailStack } from "../lib/email-stack";

const app = new cdk.App();

const stage = (app.node.tryGetContext("stage") as Stage) ?? "dev";
const config = getConfig(stage);

const env: cdk.Environment = {
  region: config.region,
  account: process.env["CDK_DEFAULT_ACCOUNT"],
};

const dbStack = new DatabaseStack(app, `${config.prefix}-database`, config, { env });
new AuthStack(app, `${config.prefix}-auth`, config, { env });
new ApiStack(app, `${config.prefix}-api`, config, {
  env,
  table: dbStack.table,
  userPoolId: "placeholder-pool-id",
  userPoolArn: "arn:aws:cognito-idp:ap-northeast-1:000000000000:userpool/placeholder",
});
new SlackStack(app, `${config.prefix}-slack`, config, { env, table: dbStack.table });
new WebStack(app, `${config.prefix}-web`, config, { env });
new SchedulerStack(app, `${config.prefix}-scheduler`, config, { env });
new EmailStack(app, `${config.prefix}-email`, config, { env });

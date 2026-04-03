import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { parseAppConfig, type AppConfig } from "@hr-attendance-app/types";

export type Stage = "dev" | "prod";

export interface EnvironmentConfig {
  stage: Stage;
  prefix: string;
  tableName: string;
  region: string;
  removalPolicy: "destroy" | "retain";
  deploymentMode: "single" | "multi";
  appConfig: AppConfig;
}

/**
 * Load config.yaml from the repo root and derive CDK environment config.
 * Stage can be overridden by CDK context (defaults to config.yaml value).
 */
export function getConfig(stageOverride?: Stage): EnvironmentConfig {
  const configPath = resolve(__dirname, "../../config.yaml");
  let appConfig: AppConfig;
  try {
    const content = readFileSync(configPath, "utf-8");
    const raw = parseYaml(content) as unknown;
    appConfig = parseAppConfig(raw);
  } catch {
    // Fallback to defaults if config.yaml is missing
    appConfig = parseAppConfig({});
  }

  const stage = stageOverride ?? appConfig.deployment.stage;
  const prefix = stage === "prod" ? "hr-attendance-app" : "hr-attendance-app-dev";

  return {
    stage,
    prefix,
    tableName: `${prefix}-table`,
    region: appConfig.deployment.awsRegion,
    removalPolicy: stage === "prod" ? "retain" : "destroy",
    deploymentMode: appConfig.deployment.mode,
    appConfig,
  };
}

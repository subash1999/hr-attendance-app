import { z } from "zod";
import { DEFAULT_SALARY_STATEMENT } from "./policy.js";

// ─── Branding Config ───

export const BrandingConfigSchema = z.object({
  appName: z.string().min(1).default("HR Attendance App"),
  appShortName: z.string().min(1).default("HR App"),
  salaryStatementTitle: z.string().default(DEFAULT_SALARY_STATEMENT.title),
  salaryStatementFooter: z.string().default(DEFAULT_SALARY_STATEMENT.footer),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color").default("#58C2D9"),
  logo: z.string().optional(),
});

// ─── Region Config ───

export const RegionEntrySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(10),
  timezone: z.string().min(1),
  currency: z.string().min(3).max(3),
  template: z.string().optional(),
});

// ─── Slack Config ───

export const SlackConfigSchema = z.object({
  appId: z.string().optional(),
  signingSecret: z.string().optional(),
});

// ─── Deployment Config ───

export const DeploymentConfigSchema = z.object({
  mode: z.enum(["single", "multi"]).default("single"),
  awsRegion: z.string().default("ap-northeast-1"),
  stage: z.enum(["dev", "prod"]).default("dev"),
  /** Company-wide accounting currency for payroll equivalents and financial reporting. */
  accountingCurrency: z.string().min(3).max(3).default("JPY"),
  domain: z.string().optional(),
  certificateArn: z.string().optional(),
});

const DEFAULT_REGIONS: z.infer<typeof RegionEntrySchema>[] = [
  { name: "Japan", code: "JP", timezone: "Asia/Tokyo", currency: "JPY" },
  { name: "Nepal", code: "NP", timezone: "Asia/Kathmandu", currency: "NPR" },
];

// ─── Top-Level App Config ───

export const AppConfigSchema = z.object({
  app: BrandingConfigSchema.default({
    appName: "HR Attendance App",
    appShortName: "HR App",
    salaryStatementTitle: DEFAULT_SALARY_STATEMENT.title,
    salaryStatementFooter: DEFAULT_SALARY_STATEMENT.footer,
    themeColor: "#58C2D9",
  }),
  deployment: DeploymentConfigSchema.default({
    mode: "single",
    awsRegion: "ap-northeast-1",
    stage: "dev",
    accountingCurrency: "JPY",
  }),
  slack: SlackConfigSchema.default({}),
  regions: z.array(RegionEntrySchema).default(DEFAULT_REGIONS),
});

// ─── Inferred Types ───

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
export type RegionEntry = z.infer<typeof RegionEntrySchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;

/**
 * Parse and validate raw config data against the schema.
 * Returns the validated config with defaults applied.
 */
export function parseAppConfig(raw: unknown): AppConfig {
  return AppConfigSchema.parse(raw);
}

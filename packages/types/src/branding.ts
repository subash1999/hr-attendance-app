import type { BrandingConfig } from "./app-config.js";
import { DEFAULT_SALARY_STATEMENT } from "./policy.js";

/** Centralized branding configuration. Change these values to rebrand the app. */
export const AppBranding = {
  appName: "HR Attendance App",
  appShortName: "HR App",
  salaryStatementTitle: DEFAULT_SALARY_STATEMENT.title,
  salaryStatementFooter: DEFAULT_SALARY_STATEMENT.footer,
  themeColor: "#58C2D9",
} as const;

export interface Branding {
  readonly appName: string;
  readonly appShortName: string;
  readonly salaryStatementTitle: string;
  readonly salaryStatementFooter: string;
  readonly themeColor: string;
}

/**
 * Create branding from a validated config object.
 * Used at build time / startup to apply config.yaml branding.
 */
export function createBranding(config: BrandingConfig): Branding {
  return {
    appName: config.appName,
    appShortName: config.appShortName,
    salaryStatementTitle: config.salaryStatementTitle,
    salaryStatementFooter: config.salaryStatementFooter,
    themeColor: config.themeColor,
  };
}

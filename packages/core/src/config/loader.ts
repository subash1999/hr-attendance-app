import { parseAppConfig } from "@hr-attendance-app/types";
import type { AppConfig } from "@hr-attendance-app/types";

/**
 * Parse config from a raw object (e.g., already-parsed YAML).
 * Validates against the schema and applies defaults.
 */
export function loadConfigFromObject(raw: unknown): AppConfig {
  return parseAppConfig(raw);
}

/**
 * Get the default config (all defaults applied, no file needed).
 */
export function getDefaultConfig(): AppConfig {
  return parseAppConfig({});
}

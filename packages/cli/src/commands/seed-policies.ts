import { Command } from "commander";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import chalk from "chalk";

export const seedPoliciesCommand = new Command("seed-policies")
  .description("Seed policy data (company + group policies) into the database")
  .option("--endpoint <url>", "DynamoDB endpoint", "http://localhost:8000")
  .option("--tenant <id>", "Tenant ID", "default")
  .action((options: { endpoint: string; tenant: string }) => {
    console.log(chalk.bold("\n  Seeding policies...\n"));

    const seedScript = resolve(process.cwd(), "scripts/seed-policies.ts");
    try {
      execSync(`npx tsx ${seedScript}`, {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
          ...process.env,
          DYNAMODB_ENDPOINT: options.endpoint,
          TENANT_ID: options.tenant,
        },
      });
      console.log(chalk.green("\n  Policy seed data loaded successfully.\n"));
    } catch (err) {
      console.error(chalk.red("  Policy seeding failed:"), err);
      process.exit(1);
    }
  });

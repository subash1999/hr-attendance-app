/**
 * Seeds DynamoDB with policy data from the policies/seed/ definitions.
 * Run: npx tsx scripts/seed-policies.ts
 *
 * Populates:
 *   - Company-level (org) policy
 *   - All group-level policies (JP + NP employment types)
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createTenantKeys } from "@hr-attendance-app/data";
import {
  orgPolicy,
  jpFulltimePolicy, jpContractPolicy, jpOutsourcedPolicy,
  jpParttimePolicy, jpSalesPolicy, jpInternPolicy,
  npFulltimePolicy, npPaidInternPolicy, npUnpaidInternPolicy,
} from "@hr-attendance-app/core";

const ENDPOINT = process.env["DYNAMODB_ENDPOINT"] ?? "http://localhost:8000";
const TABLE_NAME = process.env["DYNAMODB_TABLE_NAME"] ?? "hr-attendance-app-dev-table";
const REGION = process.env["AWS_REGION"] ?? "ap-northeast-1";
const TENANT_ID = process.env["TENANT_ID"] ?? "default";

const rawClient = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
const client = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const keys = createTenantKeys(TENANT_ID);

const put = async (item: Record<string, unknown>): Promise<void> => {
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
};

/** Group name → seed policy mapping */
const GROUP_POLICIES: Record<string, Record<string, unknown>> = {
  "jp-fulltime": jpFulltimePolicy,
  "jp-contract": jpContractPolicy,
  "jp-gyoumu-itaku": jpOutsourcedPolicy,
  "jp-parttime": jpParttimePolicy,
  "jp-sales": jpSalesPolicy,
  "jp-intern": jpInternPolicy,
  "np-fulltime": npFulltimePolicy,
  "np-paid-intern": npPaidInternPolicy,
  "np-unpaid-intern": npUnpaidInternPolicy,
};

const seedPolicies = async (): Promise<void> => {
  console.log("Seeding policy data...");

  // Company-level (org) policy
  await put({
    PK: keys.POLICY,
    SK: keys.POLICY_COMPANY,
    ...orgPolicy,
  });
  console.log("  Seeded company (org) policy.");

  // Group-level policies
  for (const [groupName, policy] of Object.entries(GROUP_POLICIES)) {
    await put({
      PK: keys.POLICY,
      SK: keys.POLICY_GROUP(groupName),
      ...policy,
    });
    console.log(`  Seeded group policy: ${groupName}`);
  }

  console.log(`Seeded ${Object.keys(GROUP_POLICIES).length + 1} policy records.`);
};

seedPolicies().catch((err) => {
  console.error("Policy seed failed:", err);
  process.exit(1);
});

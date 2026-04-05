import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { RawPolicy } from "@hr-attendance-app/types";
import type { PolicyRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoPolicyRepository implements PolicyRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async getCompanyPolicy(): Promise<RawPolicy> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.POLICY, SK: this.keys.POLICY_COMPANY },
    }));
    return (result.Item as RawPolicy | undefined) ?? {};
  }

  async getGroupPolicy(groupName: string): Promise<RawPolicy | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.POLICY, SK: this.keys.POLICY_GROUP(groupName) },
    }));
    return (result.Item as RawPolicy | undefined) ?? null;
  }

  async getUserPolicy(userId: string): Promise<RawPolicy | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.POLICY, SK: this.keys.POLICY_USER(userId) },
    }));
    return (result.Item as RawPolicy | undefined) ?? null;
  }

  async saveGroupPolicy(groupName: string, policy: RawPolicy): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.POLICY,
        SK: this.keys.POLICY_GROUP(groupName),
        ...policy,
      },
    }));
  }

  async saveUserPolicy(userId: string, policy: RawPolicy): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.POLICY,
        SK: this.keys.POLICY_USER(userId),
        ...policy,
      },
    }));
  }
}

import type { BankApprovalStatus, BankEntry } from "@willdesign-hr/types";

export interface BankQueryOptions {
  readonly approvalStatus?: BankApprovalStatus;
  readonly yearMonth?: string;
}

export interface BankRepository {
  save(entry: BankEntry): Promise<BankEntry>;
  findByEmployee(employeeId: string, options?: BankQueryOptions): Promise<readonly BankEntry[]>;
  findActive(employeeId: string): Promise<readonly BankEntry[]>;
  update(id: string, updates: Partial<BankEntry>): Promise<BankEntry>;
}

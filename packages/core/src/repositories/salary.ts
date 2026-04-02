import type { SalaryRecord } from "@willdesign-hr/types";

export interface SalaryRepository {
  getHistory(employeeId: string): Promise<readonly SalaryRecord[]>;
  getEffective(employeeId: string, yearMonth: string): Promise<SalaryRecord | null>;
  addEntry(entry: SalaryRecord): Promise<SalaryRecord>;
}

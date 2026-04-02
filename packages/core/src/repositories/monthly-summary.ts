import type { MonthlySummary } from "@willdesign-hr/types";

export interface MonthlySummaryRepository {
  findByEmployeeAndMonth(employeeId: string, yearMonth: string): Promise<MonthlySummary | null>;
  save(summary: MonthlySummary): Promise<MonthlySummary>;
}

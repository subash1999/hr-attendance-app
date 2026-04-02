import type { DailyReport } from "@willdesign-hr/types";

export interface ReportRepository {
  save(report: DailyReport): Promise<DailyReport>;
  findByEmployeeAndDate(employeeId: string, date: string): Promise<readonly DailyReport[]>;
  findLatestVersion(employeeId: string, date: string): Promise<DailyReport | null>;
}

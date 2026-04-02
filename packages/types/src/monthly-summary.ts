import type { Currency } from "./payroll.js";

export interface MonthlySummary {
  readonly employeeId: string;
  readonly yearMonth: string;
  readonly workedHours: number;
  readonly requiredHours: number;
  readonly overtimeHours: number;
  readonly deficitHours: number;
  readonly surplusHours: number;
  readonly leavesTaken: number;
  readonly flagCount: number;
  readonly netPay: number;
  readonly currency: Currency;
  readonly createdAt: string;
}

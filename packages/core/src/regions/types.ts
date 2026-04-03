import type { Holiday, LeavePolicy, RawPolicy } from "@hr-attendance-app/types";
import type {
  OvertimePayInput, OvertimePayResult,
  AgreementLimitsInput, AgreementLimitsResult,
} from "../overtime/calculator.js";

// Re-export for convenience
export type { OvertimePayInput, OvertimePayResult, AgreementLimitsInput, AgreementLimitsResult };

// ─── Strategy Interfaces ───

export interface OvertimeStrategy {
  calculatePay(input: OvertimePayInput): OvertimePayResult;
  checkLimits(input: AgreementLimitsInput): AgreementLimitsResult;
}

export interface LeaveAccrualStrategy {
  getAccrualDays(policy: LeavePolicy, tenureMonths: number): number;
}

export interface HolidayGeneratorStrategy {
  generate(year: number): readonly Holiday[];
}

export interface PayrollDeductionStrategy {
  calculateDeficitDeduction(monthlySalary: number, monthlyHours: number, deficitHours: number): number;
}

// ─── Region Config ───

export interface RegionConfig {
  readonly code: string;
  readonly name: string;
  readonly currency: string;
  readonly timezone: string;
  readonly overtimeStrategy: OvertimeStrategy;
  readonly leaveAccrualStrategy: LeaveAccrualStrategy;
  readonly holidayGenerator: HolidayGeneratorStrategy | null;
  readonly payrollDeductionStrategy: PayrollDeductionStrategy;
  readonly defaultPolicy: RawPolicy;
  readonly laborConstants: Readonly<Record<string, number>>;
}

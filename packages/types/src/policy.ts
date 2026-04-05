import type { LeaveAccrualRule, LeaveType } from "./leave.js";
import type { SalaryType } from "./payroll.js";

export interface HoursPolicy {
  readonly dailyMinimum: number;
  readonly weeklyMinimum: number;
  readonly monthlyMinimum: number;
  readonly workArrangement: "OFFICE" | "REMOTE" | "HYBRID";
  readonly timeType: "FIXED" | "FLEX" | "FULL_FLEX";
  readonly coreHoursStart?: string;
  readonly coreHoursEnd?: string;
}

export interface LeavePolicy {
  readonly accrualSchedule: readonly LeaveAccrualRule[];
  readonly startConditionMonths: number;
  readonly annualCap: number;
  readonly carryOverMonths: number;
  readonly leaveTypes: readonly LeaveType[];
  readonly mandatoryUsageDays: number;
  readonly terminationHandling: "FORFEIT" | "LABOR_LAW";
}

export interface OvertimeRates {
  readonly standard: number;
  readonly lateNight: number;
  readonly holiday: number;
  readonly excess60h: number;
}

export interface OvertimePolicy {
  readonly deemedHours: number;
  readonly rates: OvertimeRates;
  readonly monthlyLimit: number;
  readonly yearlyLimit: number;
}

export interface BonusScheduleEntry {
  readonly month: number;
  readonly multiplier: number;
}

export interface AllowanceTypeDefinition {
  readonly type: string;
  readonly name: string;
  readonly defaultAmount: number;
}

export interface CompensationPolicy {
  readonly salaryType: SalaryType;
  readonly bonusSchedule: readonly BonusScheduleEntry[];
  readonly allowanceTypes: readonly AllowanceTypeDefinition[];
  readonly commissionTracking: boolean;
}

export interface ProbationPolicy {
  readonly durationMonths: number;
  readonly leaveAllowed: boolean;
  readonly noticePeriodDays: number;
}

export interface FlagPolicy {
  readonly dailyThreshold: boolean;
  readonly weeklyThreshold: boolean;
  readonly monthlyThreshold: boolean;
  readonly gracePeriodMinutes: number;
}

export interface PaymentPolicy {
  readonly deadlineDay: number;
  readonly alertDaysBefore: number;
  readonly settlementDeadlineDay: number;
}

export interface ReportPolicy {
  readonly submissionDeadline: string;
  readonly reminderTime: string;
}

export const DEFAULT_SALARY_STATEMENT: SalaryStatementPolicy = {
  title: "Salary Statement",
  footer: "This is an automated statement. Please contact HR for any questions.",
  greeting: "Dear",
  headerBgColor: "#000000",
  headerTextColor: "#FFFFFF",
  accentColor: "#58C2D9",
  showOvertimePay: true,
  showAllowances: true,
  showBonus: true,
  showCommission: true,
  showDeficitDeduction: true,
  showTransferFees: true,
  showExchangeRate: true,
};

export interface SalaryStatementPolicy {
  readonly title: string;
  readonly footer: string;
  readonly greeting: string;
  readonly headerBgColor: string;
  readonly headerTextColor: string;
  readonly accentColor: string;
  readonly showOvertimePay: boolean;
  readonly showAllowances: boolean;
  readonly showBonus: boolean;
  readonly showCommission: boolean;
  readonly showDeficitDeduction: boolean;
  readonly showTransferFees: boolean;
  readonly showExchangeRate: boolean;
}

export interface EffectivePolicy {
  readonly hours: HoursPolicy;
  readonly leave: LeavePolicy;
  readonly overtime: OvertimePolicy;
  readonly compensation: CompensationPolicy;
  readonly probation: ProbationPolicy;
  readonly flags: FlagPolicy;
  readonly payment: PaymentPolicy;
  readonly report: ReportPolicy;
  readonly salaryStatement: SalaryStatementPolicy;
}

export interface RawPolicy {
  readonly hours?: Partial<HoursPolicy>;
  readonly leave?: Partial<LeavePolicy>;
  readonly overtime?: Partial<OvertimePolicy>;
  readonly compensation?: Partial<CompensationPolicy>;
  readonly probation?: Partial<ProbationPolicy>;
  readonly flags?: Partial<FlagPolicy>;
  readonly payment?: Partial<PaymentPolicy>;
  readonly report?: Partial<ReportPolicy>;
  readonly salaryStatement?: Partial<SalaryStatementPolicy>;
  readonly effectiveFrom?: string;
  /** Mark policy as deprecated — still applied to historical periods but locked from editing. */
  readonly deprecated?: boolean;
  /** ISO date when this policy was deprecated. */
  readonly deprecatedAt?: string;
}

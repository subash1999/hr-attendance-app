import type { LeavePolicy } from "@hr-attendance-app/types";
import {
  PAYMENT,
  WorkArrangements, LeaveTypes, TerminationHandlings,
  DEFAULT_SALARY_STATEMENT,
} from "@hr-attendance-app/types";
import type {
  RegionConfig,
  OvertimeStrategy, OvertimePayInput, OvertimePayResult,
  AgreementLimitsInput, AgreementLimitsResult,
  LeaveAccrualStrategy,
  PayrollDeductionStrategy,
} from "../types.js";
import { regionRegistry } from "../registry.js";

// ─── NP Overtime Strategy (no overtime tracking) ───

const npOvertimeStrategy: OvertimeStrategy = {
  calculatePay(input: OvertimePayInput): OvertimePayResult {
    const standardPay = input.regularHours * input.hourlyRate * input.rates.standard;
    return {
      standardPay,
      lateNightPay: 0,
      holidayPay: 0,
      excess60hPay: 0,
      totalPay: standardPay,
    };
  },

  checkLimits(_input: AgreementLimitsInput): AgreementLimitsResult {
    return {
      monthlyWarning: false,
      monthlyExceeded: false,
      yearlyWarning: false,
      yearlyExceeded: false,
      monthlyUtilization: 0,
      yearlyUtilization: 0,
    };
  },
};

// ─── NP Leave Accrual Strategy (flat 1 day/month after probation) ───

const npLeaveAccrualStrategy: LeaveAccrualStrategy = {
  getAccrualDays(policy: LeavePolicy, tenureMonths: number): number {
    if (tenureMonths < policy.startConditionMonths) return 0;
    if (policy.accrualSchedule.length === 0) return 0;
    return policy.accrualSchedule[0]!.daysGranted;
  },
};

// ─── NP Payroll Deduction (ceiling rounding) ───

const npPayrollDeduction: PayrollDeductionStrategy = {
  calculateDeficitDeduction(monthlySalary: number, monthlyHours: number, deficitHours: number): number {
    if (deficitHours <= 0) return 0;
    const hourlyRate = monthlySalary / monthlyHours;
    return Math.ceil(hourlyRate * deficitHours);
  },
};

// ─── NP Region Config ───

export const npRegionConfig: RegionConfig = {
  code: "NP",
  name: "Nepal",
  currency: "NPR",
  timezone: "Asia/Kathmandu",
  overtimeStrategy: npOvertimeStrategy,
  leaveAccrualStrategy: npLeaveAccrualStrategy,
  holidayGenerator: null,
  payrollDeductionStrategy: npPayrollDeduction,
  defaultPolicy: {
    hours: {
      workArrangement: WorkArrangements.REMOTE,
    },
    leave: {
      accrualSchedule: [{ tenureMonths: 3, daysGranted: 1 }],
      startConditionMonths: 3,
      annualCap: 20,
      carryOverMonths: 0,
      leaveTypes: [LeaveTypes.PAID, LeaveTypes.UNPAID],
      mandatoryUsageDays: 0,
      terminationHandling: TerminationHandlings.FORFEIT,
    },
    overtime: {
      deemedHours: 0,
      rates: { standard: 1.0, lateNight: 0, holiday: 1.0, excess60h: 1.0 },
      monthlyLimit: 0,
      yearlyLimit: 0,
    },
    compensation: {
      bonusSchedule: [],
      allowanceTypes: [],
      commissionTracking: false,
    },
    payment: {
      deadlineDay: PAYMENT.NP_DEADLINE_DAY,
      alertDaysBefore: PAYMENT.ALERT_DAYS_BEFORE,
      settlementDeadlineDay: PAYMENT.SETTLEMENT_DEADLINE_DAY,
    },
    salaryStatement: {
      ...DEFAULT_SALARY_STATEMENT,
      showOvertimePay: false,
      showAllowances: false,
      showBonus: false,
      showCommission: false,
    },
  },
  laborConstants: {},
};

// Auto-register on import
regionRegistry.register(npRegionConfig);

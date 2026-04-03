import type { LeavePolicy } from "@hr-attendance-app/types";
import {
  JP_LABOR, PAYMENT, HOURS,
  WorkArrangements, TimeTypes, LeaveTypes, TerminationHandlings,
  SalaryTypes, AllowanceTypes,
  PROBATION, DEFAULT_SALARY_STATEMENT,
} from "@hr-attendance-app/types";
import type {
  RegionConfig,
  OvertimeStrategy, OvertimePayInput, OvertimePayResult,
  AgreementLimitsInput, AgreementLimitsResult,
  LeaveAccrualStrategy,
  HolidayGeneratorStrategy,
  PayrollDeductionStrategy,
} from "../types.js";
import { generateJpHolidays } from "../../holidays/jp-generator.js";
import { regionRegistry } from "../registry.js";

// ─── JP Overtime Strategy ───

const jpOvertimeStrategy: OvertimeStrategy = {
  calculatePay(input: OvertimePayInput): OvertimePayResult {
    const standardPay = input.regularHours * input.hourlyRate * input.rates.standard;
    const lateNightPay = input.lateNightHours * input.hourlyRate * (input.rates.standard + input.rates.lateNight);
    const holidayPay = input.holidayHours * input.hourlyRate * input.rates.holiday;

    const excess60hHours = Math.max(0, input.monthlyOvertimeTotal - JP_LABOR.EXCESS_OVERTIME_THRESHOLD);
    const excess60hPay = excess60hHours * input.hourlyRate * input.rates.excess60h;

    return {
      standardPay,
      lateNightPay,
      holidayPay,
      excess60hPay,
      totalPay: standardPay + lateNightPay + holidayPay + excess60hPay,
    };
  },

  checkLimits(input: AgreementLimitsInput): AgreementLimitsResult {
    const monthlyUtil = input.monthlyLimit > 0 ? input.monthlyHours / input.monthlyLimit : 0;
    const yearlyUtil = input.yearlyLimit > 0 ? input.yearlyHours / input.yearlyLimit : 0;

    return {
      monthlyWarning: monthlyUtil >= JP_LABOR.OVERTIME_WARNING_UTILIZATION && monthlyUtil < 1,
      monthlyExceeded: input.monthlyHours >= input.monthlyLimit,
      yearlyWarning: yearlyUtil >= JP_LABOR.OVERTIME_WARNING_UTILIZATION && yearlyUtil < 1,
      yearlyExceeded: input.yearlyHours >= input.yearlyLimit,
      monthlyUtilization: monthlyUtil,
      yearlyUtilization: yearlyUtil,
    };
  },
};

// ─── JP Leave Accrual Strategy ───

const jpLeaveAccrualStrategy: LeaveAccrualStrategy = {
  getAccrualDays(policy: LeavePolicy, tenureMonths: number): number {
    if (tenureMonths < policy.startConditionMonths) return 0;
    let days = 0;
    for (const tier of policy.accrualSchedule) {
      if (tenureMonths >= tier.tenureMonths) {
        days = tier.daysGranted;
      }
    }
    return days;
  },
};

// ─── JP Holiday Generator Strategy ───

const jpHolidayGenerator: HolidayGeneratorStrategy = {
  generate: generateJpHolidays,
};

// ─── JP Payroll Deduction (standard rounding) ───

const jpPayrollDeduction: PayrollDeductionStrategy = {
  calculateDeficitDeduction(monthlySalary: number, monthlyHours: number, deficitHours: number): number {
    if (deficitHours <= 0) return 0;
    const hourlyRate = monthlySalary / monthlyHours;
    return Math.round(hourlyRate * deficitHours);
  },
};

// ─── JP Region Config ───

export const jpRegionConfig: RegionConfig = {
  code: "JP",
  name: "Japan",
  currency: "JPY",
  timezone: "Asia/Tokyo",
  overtimeStrategy: jpOvertimeStrategy,
  leaveAccrualStrategy: jpLeaveAccrualStrategy,
  holidayGenerator: jpHolidayGenerator,
  payrollDeductionStrategy: jpPayrollDeduction,
  defaultPolicy: {
    hours: {
      dailyMinimum: HOURS.DAILY_MINIMUM,
      weeklyMinimum: HOURS.WEEKLY_MINIMUM,
      monthlyMinimum: HOURS.MONTHLY_FULL_TIME,
      workArrangement: WorkArrangements.OFFICE,
      timeType: TimeTypes.FIXED,
      coreHoursStart: "10:00",
      coreHoursEnd: "15:00",
    },
    leave: {
      accrualSchedule: [
        { tenureMonths: 6, daysGranted: 10 },
        { tenureMonths: 18, daysGranted: 11 },
        { tenureMonths: 30, daysGranted: 12 },
        { tenureMonths: 42, daysGranted: 14 },
        { tenureMonths: 54, daysGranted: 16 },
        { tenureMonths: 66, daysGranted: 18 },
        { tenureMonths: 78, daysGranted: 20 },
      ],
      startConditionMonths: 6,
      annualCap: 40,
      carryOverMonths: 24,
      leaveTypes: [
        LeaveTypes.PAID, LeaveTypes.UNPAID, LeaveTypes.SHIFT_PERMISSION,
        LeaveTypes.CREDITED_ABSENCE, LeaveTypes.BEREAVEMENT,
        LeaveTypes.MATERNITY, LeaveTypes.NURSING,
        LeaveTypes.MENSTRUAL, LeaveTypes.COMPANY_SPECIFIC,
      ],
      mandatoryUsageDays: JP_LABOR.MANDATORY_LEAVE_DAYS,
      terminationHandling: TerminationHandlings.LABOR_LAW,
    },
    overtime: {
      deemedHours: 0,
      rates: {
        standard: JP_LABOR.OVERTIME_RATE_STANDARD,
        lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
        holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
        excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
      },
      monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
    },
    compensation: {
      salaryType: SalaryTypes.MONTHLY,
      bonusSchedule: [
        { month: 6, multiplier: 1 },
        { month: 12, multiplier: 1 },
      ],
      allowanceTypes: [
        { type: AllowanceTypes.TRANSPORTATION, name: "Transportation", defaultAmount: 0 },
        { type: AllowanceTypes.HOUSING, name: "Housing", defaultAmount: 0 },
        { type: AllowanceTypes.POSITION, name: "Position", defaultAmount: 0 },
      ],
      commissionTracking: false,
    },
    probation: {
      durationMonths: PROBATION.DEFAULT_DURATION_MONTHS,
      leaveAllowed: false,
      noticePeriodDays: PROBATION.DEFAULT_NOTICE_DAYS,
    },
    flags: {
      dailyThreshold: true,
      weeklyThreshold: true,
      monthlyThreshold: true,
      gracePeriodMinutes: 15,
    },
    payment: {
      deadlineDay: PAYMENT.JP_DEADLINE_DAY,
      alertDaysBefore: PAYMENT.ALERT_DAYS_BEFORE,
      settlementDeadlineDay: PAYMENT.SETTLEMENT_DEADLINE_DAY,
    },
    report: {
      submissionDeadline: "18:00",
      reminderTime: "17:00",
    },
    salaryStatement: { ...DEFAULT_SALARY_STATEMENT },
  },
  laborConstants: { ...JP_LABOR },
};

// Auto-register on import
regionRegistry.register(jpRegionConfig);

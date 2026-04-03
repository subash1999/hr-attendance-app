import type { RawPolicy } from "@hr-attendance-app/types";
import {
  WorkArrangements,
  TimeTypes,
  SalaryTypes,
  HOURS,
  PROBATION,
  PAYMENT,
} from "@hr-attendance-app/types";

/**
 * Company-wide defaults (org level).
 * Region-agnostic base policy. Region-specific values (overtime rates,
 * leave accrual, payment deadlines) come from the region's defaultPolicy
 * and are merged via the 4-level cascade: region → company → group → employee.
 *
 * This org policy defines structural defaults that apply across all regions.
 */
export const orgPolicy: RawPolicy = {
  hours: {
    dailyMinimum: HOURS.DAILY_MINIMUM,
    weeklyMinimum: HOURS.WEEKLY_MINIMUM,
    monthlyMinimum: HOURS.MONTHLY_FULL_TIME,
    workArrangement: WorkArrangements.OFFICE,
    timeType: TimeTypes.FIXED,
    coreHoursStart: "10:00",
    coreHoursEnd: "15:00",
  },
  compensation: {
    salaryType: SalaryTypes.MONTHLY,
    bonusSchedule: [],
    allowanceTypes: [],
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
    alertDaysBefore: PAYMENT.ALERT_DAYS_BEFORE,
    settlementDeadlineDay: PAYMENT.SETTLEMENT_DEADLINE_DAY,
  },
  report: {
    submissionDeadline: "18:00",
    reminderTime: "17:00",
  },
};

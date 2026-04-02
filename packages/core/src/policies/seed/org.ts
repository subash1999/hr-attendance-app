import type { RawPolicy } from "@willdesign-hr/types";

/**
 * Company-wide defaults (org level).
 * All groups inherit from this unless overridden.
 */
export const orgPolicy: RawPolicy = {
  hours: {
    dailyMinimum: 8,
    weeklyMinimum: 40,
    monthlyMinimum: 160,
    workArrangement: "OFFICE",
    timeType: "FIXED",
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
      "PAID",
      "UNPAID",
      "SHIFT_PERMISSION",
      "CREDITED_ABSENCE",
      "BEREAVEMENT",
      "MATERNITY",
      "NURSING",
      "MENSTRUAL",
      "COMPANY_SPECIFIC",
    ],
    mandatoryUsageDays: 5,
    terminationHandling: "LABOR_LAW",
  },
  overtime: {
    deemedHours: 0,
    rates: {
      standard: 1.25,
      lateNight: 0.25,
      holiday: 1.35,
      excess60h: 1.5,
    },
    monthlyLimit: 45,
    yearlyLimit: 360,
  },
  compensation: {
    salaryType: "MONTHLY",
    bonusSchedule: [
      { month: 6, multiplier: 1 },
      { month: 12, multiplier: 1 },
    ],
    allowanceTypes: [
      { type: "TRANSPORTATION", name: "Transportation", defaultAmount: 0 },
      { type: "HOUSING", name: "Housing", defaultAmount: 0 },
      { type: "POSITION", name: "Position", defaultAmount: 0 },
    ],
    commissionTracking: false,
  },
  probation: {
    durationMonths: 3,
    leaveAllowed: false,
    noticePeriodDays: 14,
  },
  flags: {
    dailyThreshold: true,
    weeklyThreshold: true,
    monthlyThreshold: true,
    gracePeriodMinutes: 15,
  },
  payment: {
    deadlineDay: 31,
    alertDaysBefore: 5,
    settlementDeadlineDay: 15,
  },
  report: {
    submissionDeadline: "18:00",
    reminderTime: "17:00",
  },
};

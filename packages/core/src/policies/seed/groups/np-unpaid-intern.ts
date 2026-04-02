import type { RawPolicy } from "@willdesign-hr/types";

/** Nepal unpaid intern — tracked hours, no pay, no leave. */
export const npUnpaidInternPolicy: RawPolicy = {
  hours: {
    monthlyMinimum: 80,
    workArrangement: "REMOTE",
  },
  leave: {
    accrualSchedule: [],
    startConditionMonths: 0,
    annualCap: 0,
    carryOverMonths: 0,
    leaveTypes: [],
    mandatoryUsageDays: 0,
    terminationHandling: "FORFEIT",
  },
  overtime: {
    deemedHours: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  compensation: {
    salaryType: "MONTHLY",
    bonusSchedule: [],
    allowanceTypes: [],
    commissionTracking: false,
  },
  payment: {
    deadlineDay: 15,
    alertDaysBefore: 5,
    settlementDeadlineDay: 15,
  },
};

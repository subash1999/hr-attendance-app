import type { RawPolicy } from "@willdesign-hr/types";

/** Shared Nepal contractor policy base — remote, FORFEIT leave, flat rates. */
export const npBasePolicy: RawPolicy = {
  hours: {
    workArrangement: "REMOTE",
  },
  leave: {
    accrualSchedule: [{ tenureMonths: 3, daysGranted: 1 }],
    startConditionMonths: 3,
    annualCap: 20,
    carryOverMonths: 0,
    leaveTypes: ["PAID", "UNPAID"],
    mandatoryUsageDays: 0,
    terminationHandling: "FORFEIT",
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
    deadlineDay: 15,
    alertDaysBefore: 5,
    settlementDeadlineDay: 15,
  },
};

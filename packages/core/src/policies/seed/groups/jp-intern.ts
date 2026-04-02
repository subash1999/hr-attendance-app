import type { RawPolicy } from "@willdesign-hr/types";

/** JP intern — reduced hours, no bonus, no overtime. */
export const jpInternPolicy: RawPolicy = {
  hours: {
    monthlyMinimum: 80,
  },
  overtime: {
    deemedHours: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  compensation: {
    bonusSchedule: [],
    commissionTracking: false,
  },
  leave: {
    mandatoryUsageDays: 0,
  },
};

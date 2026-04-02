import type { RawPolicy } from "@willdesign-hr/types";

/** パートタイム — JP part-time. Pro-rata hours, salary type hourly. */
export const jpParttimePolicy: RawPolicy = {
  hours: {
    monthlyMinimum: 80,
  },
  compensation: {
    salaryType: "HOURLY",
    bonusSchedule: [],
    commissionTracking: false,
  },
  overtime: {
    deemedHours: 0,
  },
};

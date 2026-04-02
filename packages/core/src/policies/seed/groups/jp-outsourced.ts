import type { RawPolicy } from "@willdesign-hr/types";

/** 業務委託 — JP outsourced contractor. No overtime tracking, no leave. */
export const jpOutsourcedPolicy: RawPolicy = {
  overtime: {
    deemedHours: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  leave: {
    accrualSchedule: [],
    startConditionMonths: 0,
    annualCap: 0,
    carryOverMonths: 0,
    leaveTypes: ["UNPAID"],
    mandatoryUsageDays: 0,
    terminationHandling: "FORFEIT",
  },
};

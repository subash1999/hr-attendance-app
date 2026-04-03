import { describe, it, expect } from "vitest";
import { resolveCascade, resolveCascadeWithRegion } from "../src/policies/resolver.js";
import { TerminationHandlings, SalaryTypes, WorkArrangements } from "@hr-attendance-app/types";
import {
  orgPolicy,
  jpFulltimePolicy,
  jpContractPolicy,
  jpOutsourcedPolicy,
  jpParttimePolicy,
  jpSalesPolicy,
  jpInternPolicy,
  npFulltimePolicy,
  npPaidInternPolicy,
  npUnpaidInternPolicy,
} from "../src/policies/seed/index.js";
import { jpRegionConfig } from "../src/regions/jp/index.js";
import { npRegionConfig } from "../src/regions/np/index.js";

const jpDefaults = jpRegionConfig.defaultPolicy;
const npDefaults = npRegionConfig.defaultPolicy;

describe("Seed policy cascade", () => {
  it("org policy has structural defaults (hours, compensation, probation, flags, payment, report)", () => {
    expect(orgPolicy.hours).toBeDefined();
    expect(orgPolicy.compensation).toBeDefined();
    expect(orgPolicy.probation).toBeDefined();
    expect(orgPolicy.flags).toBeDefined();
    expect(orgPolicy.payment).toBeDefined();
    expect(orgPolicy.report).toBeDefined();
  });

  it("region defaults provide leave, overtime, and salary statement config", () => {
    expect(jpDefaults.leave).toBeDefined();
    expect(jpDefaults.overtime).toBeDefined();
    expect(jpDefaults.salaryStatement).toBeDefined();
    expect(npDefaults.leave).toBeDefined();
    expect(npDefaults.overtime).toBeDefined();
    expect(npDefaults.salaryStatement).toBeDefined();
  });

  it("JP full-time resolves with deemed overtime 45h via 4-level cascade", () => {
    const resolved = resolveCascadeWithRegion(jpDefaults, orgPolicy, jpFulltimePolicy, null);
    expect(resolved.overtime?.deemedHours).toBe(45);
    expect(resolved.overtime?.rates?.standard).toBe(1.25);
    expect(resolved.hours?.monthlyMinimum).toBe(160);
  });

  it("JP contract resolves with 30-day notice period", () => {
    const resolved = resolveCascadeWithRegion(jpDefaults, orgPolicy, jpContractPolicy, null);
    expect(resolved.probation?.noticePeriodDays).toBe(30);
    expect(resolved.overtime?.deemedHours).toBe(45);
  });

  it("JP outsourced has no leave accrual", () => {
    const resolved = resolveCascadeWithRegion(jpDefaults, orgPolicy, jpOutsourcedPolicy, null);
    expect(resolved.leave?.accrualSchedule).toEqual([]);
    expect(resolved.leave?.terminationHandling).toBe(TerminationHandlings.FORFEIT);
    expect(resolved.overtime?.monthlyLimit).toBe(0);
  });

  it("JP part-time resolves with 80h/mo and hourly salary", () => {
    const resolved = resolveCascadeWithRegion(jpDefaults, orgPolicy, jpParttimePolicy, null);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
    expect(resolved.compensation?.salaryType).toBe(SalaryTypes.HOURLY);
    expect(resolved.hours?.dailyMinimum).toBe(8);
  });

  it("JP sales has commission tracking enabled", () => {
    const resolved = resolveCascadeWithRegion(jpDefaults, orgPolicy, jpSalesPolicy, null);
    expect(resolved.compensation?.commissionTracking).toBe(true);
    expect(resolved.overtime?.deemedHours).toBe(45);
  });

  it("JP intern has no overtime limits and no mandatory leave", () => {
    const resolved = resolveCascadeWithRegion(jpDefaults, orgPolicy, jpInternPolicy, null);
    expect(resolved.overtime?.monthlyLimit).toBe(0);
    expect(resolved.leave?.mandatoryUsageDays).toBe(0);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
  });

  it("NP full-time resolves with remote work and FORFEIT leave", () => {
    const resolved = resolveCascadeWithRegion(npDefaults, orgPolicy, npFulltimePolicy, null);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
    expect(resolved.leave?.terminationHandling).toBe(TerminationHandlings.FORFEIT);
    expect(resolved.leave?.startConditionMonths).toBe(3);
    expect(resolved.overtime?.rates?.standard).toBe(1.0);
    expect(resolved.payment?.deadlineDay).toBe(15);
  });

  it("NP paid intern has 80h/mo minimum", () => {
    const resolved = resolveCascadeWithRegion(npDefaults, orgPolicy, npPaidInternPolicy, null);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
    expect(resolved.leave?.terminationHandling).toBe(TerminationHandlings.FORFEIT);
  });

  it("NP unpaid intern has no leave types", () => {
    const resolved = resolveCascadeWithRegion(npDefaults, orgPolicy, npUnpaidInternPolicy, null);
    expect(resolved.leave?.leaveTypes).toEqual([]);
    expect(resolved.leave?.annualCap).toBe(0);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
  });

  it("36 Agreement limits present in JP region defaults", () => {
    expect(jpDefaults.overtime?.monthlyLimit).toBe(45);
    expect(jpDefaults.overtime?.yearlyLimit).toBe(360);
  });

  it("NP salary statement hides overtime and bonus by default", () => {
    expect(npDefaults.salaryStatement?.showOvertimePay).toBe(false);
    expect(npDefaults.salaryStatement?.showBonus).toBe(false);
    expect(npDefaults.salaryStatement?.showDeficitDeduction).toBe(true);
  });

  it("user override on top of group works in 4-level cascade", () => {
    const userOverride = { hours: { monthlyMinimum: 140 } };
    const resolved = resolveCascadeWithRegion(npDefaults, orgPolicy, npFulltimePolicy, userOverride);
    expect(resolved.hours?.monthlyMinimum).toBe(140);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
  });

  it("3-level cascade still works for backward compat", () => {
    const resolved = resolveCascade(orgPolicy, npFulltimePolicy, null);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
  });
});

import { describe, it, expect, vi } from "vitest";
import { PolicyService } from "../src/policies/service.js";
import type { PolicyRepository } from "../src/repositories/policy.js";
import type { EmployeeRepository } from "../src/repositories/employee.js";
import { RegionRegistry } from "../src/regions/registry.js";
import type { RawPolicy, Employee } from "@hr-attendance-app/types";
import { HOURS } from "@hr-attendance-app/types";

const mockEmployee: Employee = {
  id: "EMP001",
  name: "Test User",
  email: "test@example.com",
  slackId: "U_TEST",
  employmentType: "JP_FULL_TIME",
  region: "JP",
  timezone: "Asia/Tokyo",
  languagePreference: "en",
  managerId: null,
  joinDate: "2024-01-01",
  probationEndDate: null,
  status: "ACTIVE",
  role: "EMPLOYEE",
  terminationDate: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const regionDefaults: RawPolicy = {
  hours: {
    dailyMinimum: HOURS.DAILY_MINIMUM,
    weeklyMinimum: HOURS.WEEKLY_MINIMUM,
    monthlyMinimum: HOURS.MONTHLY_FULL_TIME,
  },
  overtime: {
    deemedHours: 0,
    rates: { standard: 1.25, lateNight: 0.25, holiday: 1.35, excess60h: 1.5 },
    monthlyLimit: 45,
    yearlyLimit: 360,
  },
};

const createMockPolicyRepo = (overrides?: Partial<PolicyRepository>): PolicyRepository => ({
  getCompanyPolicy: vi.fn().mockResolvedValue({}),
  getGroupPolicy: vi.fn().mockResolvedValue(null),
  getUserPolicy: vi.fn().mockResolvedValue(null),
  saveCompanyPolicy: vi.fn().mockResolvedValue(undefined),
  saveGroupPolicy: vi.fn().mockResolvedValue(undefined),
  saveUserPolicy: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createMockEmployeeRepo = (employee: Employee | null = mockEmployee): EmployeeRepository => ({
  findById: vi.fn().mockResolvedValue(employee),
  findBySlackId: vi.fn().mockResolvedValue(null),
  findByManagerId: vi.fn().mockResolvedValue([]),
  findAll: vi.fn().mockResolvedValue(employee ? [employee] : []),
  create: vi.fn(),
  update: vi.fn(),
});

const createRegistry = (): RegionRegistry => {
  const registry = new RegionRegistry();
  registry.register({
    code: "JP",
    name: "Japan",
    currency: "JPY",
    timezone: "Asia/Tokyo",
    overtimeStrategy: {} as never,
    leaveAccrualStrategy: {} as never,
    holidayGenerator: null,
    payrollDeductionStrategy: {} as never,
    defaultPolicy: regionDefaults,
    laborConstants: {},
  });
  return registry;
};

describe("PolicyService", () => {
  describe("resolveForEmployee", () => {
    it("returns region defaults when no overrides exist", async () => {
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo(),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });

      const result = await service.resolveForEmployee("EMP001");
      expect(result.hours.dailyMinimum).toBe(HOURS.DAILY_MINIMUM);
      expect(result.hours.monthlyMinimum).toBe(HOURS.MONTHLY_FULL_TIME);
      expect(result.overtime.rates.standard).toBe(1.25);
    });

    it("applies company overrides on top of region defaults", async () => {
      const companyPolicy: RawPolicy = { hours: { dailyMinimum: 7 } };
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({
          getCompanyPolicy: vi.fn().mockResolvedValue(companyPolicy),
        }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });

      const result = await service.resolveForEmployee("EMP001");
      expect(result.hours.dailyMinimum).toBe(7);
      expect(result.hours.monthlyMinimum).toBe(HOURS.MONTHLY_FULL_TIME);
    });

    it("applies group overrides on top of company", async () => {
      const groupPolicy: RawPolicy = { hours: { monthlyMinimum: 80 } };
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({
          getGroupPolicy: vi.fn().mockResolvedValue(groupPolicy),
        }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });

      const result = await service.resolveForEmployee("EMP001");
      expect(result.hours.monthlyMinimum).toBe(80);
      expect(result.hours.dailyMinimum).toBe(HOURS.DAILY_MINIMUM);
    });

    it("applies user overrides as highest priority", async () => {
      const groupPolicy: RawPolicy = { hours: { monthlyMinimum: 80 } };
      const userPolicy: RawPolicy = { hours: { monthlyMinimum: 120 } };
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({
          getGroupPolicy: vi.fn().mockResolvedValue(groupPolicy),
          getUserPolicy: vi.fn().mockResolvedValue(userPolicy),
        }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });

      const result = await service.resolveForEmployee("EMP001");
      expect(result.hours.monthlyMinimum).toBe(120);
    });

    it("throws when employee is not found", async () => {
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo(),
        employeeRepo: createMockEmployeeRepo(null),
        regionRegistry: createRegistry(),
      });

      await expect(service.resolveForEmployee("MISSING")).rejects.toThrow("Employee not found");
    });
  });

  describe("save operations", () => {
    it("saveCompanyPolicy delegates to repository", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({ saveCompanyPolicy: saveFn }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });
      const policy: RawPolicy = { hours: { dailyMinimum: 7 } };
      await service.saveCompanyPolicy(policy);
      expect(saveFn).toHaveBeenCalledWith(policy);
    });

    it("saveGroupPolicy delegates to repository", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({ saveGroupPolicy: saveFn }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });
      const policy: RawPolicy = { hours: { monthlyMinimum: 80 } };
      await service.saveGroupPolicy("jp-parttime", policy);
      expect(saveFn).toHaveBeenCalledWith("jp-parttime", policy);
    });

    it("saveUserPolicy delegates to repository", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({ saveUserPolicy: saveFn }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });
      const policy: RawPolicy = { hours: { monthlyMinimum: 120 } };
      await service.saveUserPolicy("EMP001", policy);
      expect(saveFn).toHaveBeenCalledWith("EMP001", policy);
    });
  });

  describe("get operations", () => {
    it("getCompanyPolicy returns repo data", async () => {
      const companyPolicy: RawPolicy = { hours: { dailyMinimum: 7 } };
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo({
          getCompanyPolicy: vi.fn().mockResolvedValue(companyPolicy),
        }),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });
      const result = await service.getCompanyPolicy();
      expect(result).toEqual(companyPolicy);
    });

    it("getGroupPolicy returns null for unknown group", async () => {
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo(),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });
      const result = await service.getGroupPolicy("unknown");
      expect(result).toBeNull();
    });

    it("getUserPolicy returns null for unknown user", async () => {
      const service = new PolicyService({
        policyRepo: createMockPolicyRepo(),
        employeeRepo: createMockEmployeeRepo(),
        regionRegistry: createRegistry(),
      });
      const result = await service.getUserPolicy("MISSING");
      expect(result).toBeNull();
    });
  });
});

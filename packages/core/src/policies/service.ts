import type { EffectivePolicy, RawPolicy } from "@hr-attendance-app/types";
import type { PolicyRepository } from "../repositories/policy.js";
import type { EmployeeRepository } from "../repositories/employee.js";
import type { RegionRegistry } from "../regions/registry.js";
import { resolveCascadeWithRegion } from "./resolver.js";

export interface PolicyServiceDeps {
  readonly policyRepo: PolicyRepository;
  readonly employeeRepo: EmployeeRepository;
  readonly regionRegistry: RegionRegistry;
}

export class PolicyService {
  private readonly deps: PolicyServiceDeps;

  constructor(deps: PolicyServiceDeps) {
    this.deps = deps;
  }

  /**
   * Resolve the effective policy for an employee via the 4-level cascade:
   * region defaults → company overrides → group overrides → employee overrides.
   */
  async resolveForEmployee(employeeId: string, referenceDate?: Date): Promise<EffectivePolicy> {
    const employee = await this.deps.employeeRepo.findById(employeeId);
    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    const regionConfig = this.deps.regionRegistry.getOrThrow(employee.region);
    const regionDefaults: RawPolicy = regionConfig.defaultPolicy;

    const [companyPolicy, groupPolicy, userPolicy] = await Promise.all([
      this.deps.policyRepo.getCompanyPolicy(),
      this.deps.policyRepo.getGroupPolicy(employee.employmentType),
      this.deps.policyRepo.getUserPolicy(employeeId),
    ]);

    const merged = resolveCascadeWithRegion(
      regionDefaults,
      companyPolicy,
      groupPolicy,
      userPolicy,
      referenceDate,
    );

    return merged as EffectivePolicy;
  }
}

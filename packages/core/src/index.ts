// @willdesign-hr/core — Business logic, services, repository interfaces (ports)
// Zero AWS dependencies — pure TypeScript

export type {
  EmployeeRepository,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  AttendanceRepository,
  LeaveRepository,
  LeaveQueryOptions,
  SalaryRepository,
  ReportRepository,
  FlagRepository,
  FlagQueryOptions,
  BankRepository,
  BankQueryOptions,
  AuditRepository,
  AuditQueryOptions,
  HolidayRepository,
  OverrideRepository,
  PolicyRepository,
  RoleRepository,
  MonthlySummaryRepository,
  DocumentRepository,
  EmailAdapter,
  AuthProviderAdapter,
  CreateAuthUserInput,
} from "./repositories/index.js";

export { deepMergePolicy, resolveCascade } from "./policies/resolver.js";

export {
  ROLE_HIERARCHY,
  getRoleLevel,
  hasMinimumRole,
  hasPermission,
  authorize,
} from "./permissions/engine.js";

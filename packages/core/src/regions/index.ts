export type {
  RegionConfig,
  OvertimeStrategy, OvertimePayInput, OvertimePayResult,
  AgreementLimitsInput, AgreementLimitsResult,
  LeaveAccrualStrategy,
  HolidayGeneratorStrategy,
  PayrollDeductionStrategy,
} from "./types.js";

export { RegionRegistry, regionRegistry } from "./registry.js";

// Import region modules to trigger auto-registration
import "./jp/index.js";
import "./np/index.js";

export { jpRegionConfig } from "./jp/index.js";
export { npRegionConfig } from "./np/index.js";

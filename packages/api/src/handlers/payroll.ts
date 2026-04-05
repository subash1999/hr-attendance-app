import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { API_PAYROLL, API_PAYROLL_REPORT, ErrorCodes, ErrorMessages, Permissions } from "@hr-attendance-app/types";

export function payrollRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_PAYROLL_REPORT,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.SALARY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const yearMonth = pathParams["yearMonth"] ?? "";
        const report = await deps.services.monthlyPayrollReport.generate(yearMonth);
        return buildResponse(200, report);
      }),
    },
    {
      method: "GET",
      path: API_PAYROLL,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        const yearMonth = pathParams["yearMonth"] ?? "";
        const breakdown = await deps.services.payroll.getBreakdown(auth.actorId, yearMonth);
        if (!breakdown) {
          return buildResponse(200, { employeeId: auth.actorId, yearMonth, message: "No salary record found" });
        }
        return buildResponse(200, breakdown);
      }),
    },
  ];
}

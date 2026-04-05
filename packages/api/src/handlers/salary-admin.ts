import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission, calculateBlendedSalary } from "@hr-attendance-app/core";
import type { SalaryRecord } from "@hr-attendance-app/types";
import {
  ErrorCodes, ErrorMessages, Permissions,
  API_ADMIN_SALARY, API_ADMIN_SALARY_EFFECTIVE,
  KeyPatterns, nowIso, nowMs,
} from "@hr-attendance-app/types";
import type { CreateSalaryEntryBody } from "@hr-attendance-app/types";

export function salaryAdminRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_ADMIN_SALARY,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.SALARY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const employeeId = pathParams["employeeId"] ?? "";
        const history = await deps.services.payroll.getSalaryHistory(employeeId);
        return buildResponse(200, history);
      }),
    },
    {
      method: "POST",
      path: API_ADMIN_SALARY,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.SALARY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const employeeId = pathParams["employeeId"] ?? "";
        const input = body as CreateSalaryEntryBody | null;
        if (!input?.amount || !input.effectiveFrom || !input.salaryType || !input.changeType) {
          return handleError(ErrorCodes.VALIDATION, "amount, effectiveFrom, salaryType, and changeType are required");
        }

        const entry: SalaryRecord = {
          id: KeyPatterns.salary(employeeId, nowMs()),
          employeeId,
          amount: input.amount,
          currency: input.currency as SalaryRecord["currency"],
          salaryType: input.salaryType,
          changeType: input.changeType,
          effectiveFrom: input.effectiveFrom,
          agreementDocumentId: input.agreementDocumentId,
          createdAt: nowIso(),
        };

        const saved = await deps.services.payroll.addSalaryEntry(entry);
        return buildResponse(201, saved);
      }),
    },
    {
      method: "GET",
      path: API_ADMIN_SALARY_EFFECTIVE,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.SALARY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const employeeId = pathParams["employeeId"] ?? "";
        const yearMonth = pathParams["yearMonth"] ?? "";
        const history = await deps.services.payroll.getSalaryHistory(employeeId);
        const blendResult = calculateBlendedSalary(history as SalaryRecord[], yearMonth);
        return buildResponse(200, blendResult);
      }),
    },
  ];
}

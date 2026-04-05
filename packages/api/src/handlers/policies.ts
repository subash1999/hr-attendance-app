import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import type { RawPolicy } from "@hr-attendance-app/types";
import {
  ErrorCodes, ErrorMessages, Permissions,
  API_POLICIES, API_POLICY_EFFECTIVE, API_POLICY_COMPANY, API_POLICY_USER,
} from "@hr-attendance-app/types";

export function policyRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    // ── Effective (resolved cascade for current user) ──
    {
      method: "GET",
      path: API_POLICY_EFFECTIVE,
      handler: withAuth(getDeps, async ({ auth, deps }) => {
        const policy = await deps.services.policy.resolveForEmployee(auth.actorId);
        return buildResponse(200, policy);
      }),
    },

    // ── Company-level policy ──
    {
      method: "GET",
      path: API_POLICY_COMPANY,
      handler: withAuth(getDeps, async ({ auth, deps }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const policy = await deps.services.policy.getCompanyPolicy();
        return buildResponse(200, policy);
      }),
    },
    {
      method: "PUT",
      path: API_POLICY_COMPANY,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const policy = body as RawPolicy | null;
        if (!policy) return handleError(ErrorCodes.VALIDATION, "Request body required");
        await deps.services.policy.saveCompanyPolicy(policy);
        return buildResponse(200, { message: "Company policy updated" });
      }),
    },

    // ── Group-level policy ──
    {
      method: "GET",
      path: API_POLICIES,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const groupName = pathParams["groupName"] ?? "";
        const raw = await deps.services.policy.getGroupPolicy(groupName);
        return buildResponse(200, { groupName, raw: raw ?? {} });
      }),
    },
    {
      method: "PUT",
      path: API_POLICIES,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const groupName = pathParams["groupName"] ?? "";
        const policy = body as RawPolicy | null;
        if (!policy) return handleError(ErrorCodes.VALIDATION, "Request body required");
        await deps.services.policy.saveGroupPolicy(groupName, policy);
        return buildResponse(200, { groupName, message: "Group policy updated" });
      }),
    },

    // ── User-level policy ──
    {
      method: "GET",
      path: API_POLICY_USER,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const userId = pathParams["userId"] ?? "";
        const raw = await deps.services.policy.getUserPolicy(userId);
        return buildResponse(200, { userId, raw: raw ?? {} });
      }),
    },
    {
      method: "PUT",
      path: API_POLICY_USER,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const userId = pathParams["userId"] ?? "";
        const policy = body as RawPolicy | null;
        if (!policy) return handleError(ErrorCodes.VALIDATION, "Request body required");
        await deps.services.policy.saveUserPolicy(userId, policy);
        return buildResponse(200, { userId, message: "User policy updated" });
      }),
    },
  ];
}

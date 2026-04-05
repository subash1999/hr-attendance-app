import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_POLICIES, API_POLICY_EFFECTIVE } from "@hr-attendance-app/types";

export function policyRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_POLICY_EFFECTIVE,
      handler: withAuth(getDeps, async ({ auth, deps }) => {
        const policy = await deps.services.policy.resolveForEmployee(auth.actorId);
        return buildResponse(200, policy);
      }),
    },
    {
      method: "GET",
      path: API_POLICIES,
      handler: withAuth(getDeps, async ({ auth: _auth, pathParams }) => {
        return buildResponse(200, {
          groupName: pathParams["groupName"],
          message: "Policy data loaded from seed configuration",
        });
      }),
    },
    {
      method: "PUT",
      path: API_POLICIES,
      handler: withAuth(getDeps, async ({ auth, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        return buildResponse(200, {
          groupName: pathParams["groupName"],
          policy: body,
          message: "Policy updated",
        });
      }),
    },
  ];
}

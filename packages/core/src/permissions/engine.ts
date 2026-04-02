import type { AuthContext, AuthorizationResult, ResourceContext, Role } from "@willdesign-hr/types";

export const ROLE_HIERARCHY: readonly Role[] = [
  "EMPLOYEE",
  "MANAGER",
  "HR_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function getRoleLevel(role: Role): number {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? -1 : index;
}

export function hasMinimumRole(actorRole: Role, minimumRole: Role): boolean {
  if (isSuperAdmin(actorRole)) return true;
  const actorLevel = getRoleLevel(actorRole);
  const requiredLevel = getRoleLevel(minimumRole);
  if (actorLevel === -1 || requiredLevel === -1) return false;
  return actorLevel >= requiredLevel;
}

export function hasPermission(actor: AuthContext, permission: string): boolean {
  if (isSuperAdmin(actor.actorRole)) return true;
  return actor.actorCustomPermissions.includes(permission);
}

// Action-specific authorization (read vs write/delete) deferred to handler middleware
export function authorize(
  actor: AuthContext,
  _action: string,
  resource: ResourceContext,
): AuthorizationResult {
  if (isSuperAdmin(actor.actorRole)) {
    return { allowed: true, reason: "super_admin bypass" };
  }

  // Admin has full access
  if (hasMinimumRole(actor.actorRole, "ADMIN")) {
    return { allowed: true, reason: "admin role grants full access" };
  }

  // Resource owner can always access their own data
  if (actor.actorId === resource.resourceOwnerId) {
    return { allowed: true, reason: "own resource access" };
  }

  // PUBLIC data is visible to all authenticated users
  if (resource.sensitivityLevel === "PUBLIC") {
    return { allowed: true, reason: "public data" };
  }

  // Manager can access direct reports' data
  if (
    actor.actorRole === "MANAGER" ||
    actor.actorRole === "HR_MANAGER"
  ) {
    if (resource.ownerManagerId === actor.actorId) {
      return { allowed: true, reason: "manager of resource owner" };
    }
  }

  // CONFIDENTIAL/SENSITIVE data requires manager+ relationship or admin
  if (
    resource.sensitivityLevel === "CONFIDENTIAL" ||
    resource.sensitivityLevel === "SENSITIVE"
  ) {
    return {
      allowed: false,
      reason: `${resource.sensitivityLevel} data requires manager relationship or admin role`,
    };
  }

  // INTERNAL data — deny if not owner, not manager, not admin
  return {
    allowed: false,
    reason: "insufficient access: not owner, not manager of owner, not admin",
  };
}

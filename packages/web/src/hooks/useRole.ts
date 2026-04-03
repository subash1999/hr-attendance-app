/**
 * Role-based access hooks for conditional UI rendering.
 * Uses the RBAC hierarchy from @willdesign-hr/types.
 */
import { useAuth } from "./useAuth";
import { Roles } from "@willdesign-hr/types";

export const ROLE_LEVELS: Record<string, number> = {
  [Roles.EMPLOYEE]: 0,
  [Roles.MANAGER]: 1,
  [Roles.HR_MANAGER]: 2,
  [Roles.ADMIN]: 3,
  [Roles.SUPER_ADMIN]: 4,
};

function getRoleLevel(role: string | null): number {
  return ROLE_LEVELS[role ?? Roles.EMPLOYEE] ?? 0;
}

/** Returns the current user's numeric role level. */
export function useRoleLevel(): number {
  const { role } = useAuth();
  return getRoleLevel(role);
}

/** Returns true if the current user's role is at least the given minimum. */
export function useHasMinimumRole(minimumRole: string): boolean {
  const level = useRoleLevel();
  return level >= getRoleLevel(minimumRole);
}

/** Returns true if user is at least a MANAGER. */
export function useIsManager(): boolean {
  return useHasMinimumRole(Roles.MANAGER);
}

/** Returns true if user is at least an ADMIN. */
export function useIsAdmin(): boolean {
  return useHasMinimumRole(Roles.ADMIN);
}

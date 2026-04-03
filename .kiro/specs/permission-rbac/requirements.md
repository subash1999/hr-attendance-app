# Requirements Document

## Introduction
Replace the hierarchical `hasMinimumRole` authorization model with a granular, permission-based RBAC system. Each action in the system is gated by a named permission constant (e.g., `Permissions.LEAVE_APPROVE`). Roles map to default permission sets via `ROLE_PERMISSIONS`, while `actorCustomPermissions` on `AuthContext` allows per-user overrides. The frontend mirrors this model with a `useHasPermission` hook and permission-based route/nav guards.

## Requirements

### Requirement 1: Permission Constants Definition
**Objective:** As a developer, I want a single, typed set of permission constants in `@willdesign-hr/types`, so that all packages reference the same permission identifiers with no magic strings.

#### Acceptance Criteria
1. The `@willdesign-hr/types` package shall export a `Permissions` constant object containing at minimum: `EMPLOYEE_LIST_ALL`, `EMPLOYEE_UPDATE`, `LEAVE_APPROVE`, `FLAG_RESOLVE`, `BANK_APPROVE`, `ATTENDANCE_LOCK`, `ONBOARD`, `OFFBOARD`, `AUDIT_VIEW`, `POLICY_UPDATE`, `HOLIDAY_MANAGE`.
2. The `@willdesign-hr/types` package shall export a `Permission` type derived from the `Permissions` constant values.
3. The `Permissions` constant shall be declared `as const` so that each value is a string literal type.

### Requirement 2: Role-to-Permission Mapping
**Objective:** As a system administrator, I want each role to have a default set of permissions, so that newly assigned roles automatically grant the correct capabilities without per-user configuration.

#### Acceptance Criteria
1. The `@willdesign-hr/types` package shall export a `ROLE_PERMISSIONS` mapping from each `Role` to a readonly array of `Permission` values.
2. The `ROLE_PERMISSIONS` mapping shall follow cumulative inclusion: `MANAGER` permissions shall include all `EMPLOYEE` permissions plus manager-specific ones; `HR_MANAGER` shall include all `MANAGER` permissions; `ADMIN` shall include all `HR_MANAGER` permissions; `SUPER_ADMIN` shall include all permissions.
3. The `EMPLOYEE` role shall have no action permissions beyond self-access (empty permission set or self-only permissions).
4. The `MANAGER` role shall include `LEAVE_APPROVE`, `FLAG_RESOLVE`, `BANK_APPROVE`, and `EMPLOYEE_LIST_ALL` (scoped to direct reports by handler logic).
5. The `ADMIN` role shall include all `MANAGER` permissions plus `EMPLOYEE_UPDATE`, `ONBOARD`, `OFFBOARD`, `AUDIT_VIEW`, `POLICY_UPDATE`, `HOLIDAY_MANAGE`, and `ATTENDANCE_LOCK`.

### Requirement 3: Permission Engine Enhancement
**Objective:** As the authorization system, I want `hasPermission` to check both role-derived and custom permissions, so that authorization works correctly for default roles and per-user overrides.

#### Acceptance Criteria
1. When `hasPermission(actor, permission)` is called, the Permission Engine shall return `true` if the actor's `actorCustomPermissions` array includes the requested permission.
2. When `hasPermission(actor, permission)` is called, the Permission Engine shall return `true` if the actor's role has the requested permission in `ROLE_PERMISSIONS`.
3. When the actor's role is `SUPER_ADMIN`, the Permission Engine shall return `true` for any permission check.
4. When the actor has neither the custom permission nor the role-derived permission, the Permission Engine shall return `false`.
5. The Permission Engine shall continue to export `hasMinimumRole` and `ROLE_HIERARCHY` as internal utilities for backward compatibility, but they shall not be the primary authorization mechanism in handlers.

### Requirement 4: Backend Handler Authorization Migration
**Objective:** As a backend system, I want all API handlers to use `hasPermission` instead of `hasMinimumRole`, so that authorization is granular and can be overridden per user.

#### Acceptance Criteria
1. When a request is made to admin endpoints (`POST /api/onboard`, `POST /api/offboard/:id`, `GET /api/audit/:targetId`), the Admin Handler shall check `hasPermission(auth, Permissions.ONBOARD)`, `hasPermission(auth, Permissions.OFFBOARD)`, and `hasPermission(auth, Permissions.AUDIT_VIEW)` respectively instead of `hasMinimumRole(role, Roles.ADMIN)`.
2. When a request is made to `GET /api/employees` (list all), the Employee Handler shall check `hasPermission(auth, Permissions.EMPLOYEE_LIST_ALL)` instead of `hasMinimumRole(role, Roles.ADMIN)`.
3. When a request is made to `PATCH /api/employees/:id`, the Employee Handler shall check `hasPermission(auth, Permissions.EMPLOYEE_UPDATE)` instead of `hasMinimumRole(role, Roles.ADMIN)`.
4. When a request is made to `PATCH /api/leave/:id` (approve/reject), the Leave Handler shall check `hasPermission(auth, Permissions.LEAVE_APPROVE)` instead of `hasMinimumRole(role, Roles.MANAGER)`.
5. When a request is made to `GET /api/leave?pending=true`, the Leave Handler shall check `hasPermission(auth, Permissions.LEAVE_APPROVE)` instead of `hasMinimumRole(role, Roles.MANAGER)`.
6. When a request is made to `GET /api/flags` (pending list) or `PATCH /api/flags/:id`, the Flag Handler shall check `hasPermission(auth, Permissions.FLAG_RESOLVE)` instead of `hasMinimumRole(role, Roles.MANAGER)`.
7. When a request is made to `POST /api/bank/approve`, the Bank Handler shall check `hasPermission(auth, Permissions.BANK_APPROVE)` instead of `hasMinimumRole(role, Roles.MANAGER)`.
8. When a request is made to `PUT /api/policies/:groupName`, the Policy Handler shall check `hasPermission(auth, Permissions.POLICY_UPDATE)` instead of `hasMinimumRole(role, Roles.ADMIN)`.
9. When a request is made to `POST /api/holidays` or `DELETE /api/holidays/:region/:date`, the Holiday Handler shall check `hasPermission(auth, Permissions.HOLIDAY_MANAGE)`.
10. If a permission check fails, the handler shall return `ErrorCodes.FORBIDDEN` with the message "Insufficient permissions".
11. When a request is made to `GET /api/employees` by a user with `EMPLOYEE_LIST_ALL` permission but not `EMPLOYEE_UPDATE`, the Employee Handler shall return the employee list (the handler shall differentiate between list-all scope and manager-scoped report listing using the permission).

### Requirement 5: Frontend Permission Hook
**Objective:** As a frontend developer, I want a `useHasPermission` hook that checks permissions from the auth context, so that UI elements can be conditionally rendered based on granular permissions instead of role levels.

#### Acceptance Criteria
1. The `useAuth` hook shall expose a `permissions` array (derived from the user's role via `ROLE_PERMISSIONS` plus any custom permissions from the token).
2. The `useHasPermission(permission)` hook shall return `true` when the current user's permissions include the requested permission.
3. The `useHasPermission(permission)` hook shall return `false` when the current user's permissions do not include the requested permission.
4. The `useIsManager` and `useIsAdmin` hooks shall remain available but shall be implemented in terms of permission checks (e.g., `useIsManager` returns `true` if user has any manager-level permission).

### Requirement 6: Frontend Route and Navigation Guards
**Objective:** As the frontend application, I want route guards and navigation filtering to use permissions instead of role levels, so that the UI accurately reflects the user's actual capabilities.

#### Acceptance Criteria
1. The `RoleGuard` component shall accept a `requiredPermission` prop (of type `Permission`) as an alternative to `minRole`.
2. When `requiredPermission` is specified, the `RoleGuard` shall use `useHasPermission` to determine access instead of `useHasMinimumRole`.
3. The `Layout` navigation item configuration shall use a `requiredPermission` field instead of `minRole` to filter visible navigation items.
4. When a navigation item has a `requiredPermission`, the Layout shall show the item only if `useHasPermission` returns `true` for that permission.
5. The Team page route shall be guarded by a permission that all managers have (e.g., `Permissions.LEAVE_APPROVE` or a dedicated `TEAM_VIEW` permission).
6. The Admin page route shall be guarded by a permission that all admins have (e.g., `Permissions.ONBOARD` or a dedicated `ADMIN_VIEW` permission).

### Requirement 7: Conditional UI Rendering by Permission
**Objective:** As a user, I want UI sections to appear or hide based on my specific permissions, so that I only see actions I can actually perform.

#### Acceptance Criteria
1. When the user has `Permissions.LEAVE_APPROVE`, the Leave Page shall display the "Pending Approvals" section.
2. When the user does not have `Permissions.LEAVE_APPROVE`, the Leave Page shall hide the "Pending Approvals" section.
3. When replacing `useIsManager()` with `useHasPermission(Permissions.LEAVE_APPROVE)` on the Leave Page, the behavior shall be functionally identical for default role mappings.

### Requirement 8: Auth Context Permission Propagation
**Objective:** As the authentication system, I want permissions to be available in both backend `AuthContext` and frontend auth state, so that permission checks work end-to-end.

#### Acceptance Criteria
1. The backend `hasPermission` function shall resolve effective permissions by checking `ROLE_PERMISSIONS[role]` at call time, while `parseAuthContext` shall continue to extract `actorCustomPermissions` from JWT claims when available.
2. The frontend `login` function shall accept permissions (derived from the token's role) and store them in auth state.
3. When the dev-auth login endpoint returns a mock token, it shall include the role's default permissions so that local development works without Cognito.

### Requirement 9: Backward Compatibility
**Objective:** As a developer, I want the migration to be non-breaking, so that existing tests and internal utilities continue to work during and after the transition.

#### Acceptance Criteria
1. The `hasMinimumRole` function shall remain exported from `@willdesign-hr/core` and shall continue to function correctly.
2. The `ROLE_HIERARCHY` constant shall remain exported from `@willdesign-hr/core`.
3. The `authorize` function in the ABAC engine shall continue to work, using `hasMinimumRole` internally for resource-level checks.
4. All existing permission engine tests shall continue to pass after the migration.

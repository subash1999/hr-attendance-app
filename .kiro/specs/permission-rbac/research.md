# Research & Design Decisions

## Summary
- **Feature**: `permission-rbac`
- **Discovery Scope**: Extension
- **Key Findings**:
  - `AuthContext.actorCustomPermissions` already exists and flows through the entire backend — the plumbing is ready
  - `hasPermission()` in `core/src/permissions/engine.ts` only checks custom permissions + SUPER_ADMIN bypass; role-derived lookup must be added
  - Existing tests use `leave:approve` style strings for custom permissions — new `Permissions` constants should use the same `namespace:action` format for consistency
  - Frontend derives role from token at login time; permissions can be derived client-side from `ROLE_PERMISSIONS` using the same shared types package

## Research Log

### Permission String Format Convention
- **Context**: Existing tests in `core/__tests__/permissions.test.ts` use `"leave:approve"`, `"holiday:manage"` as permission strings
- **Sources Consulted**: Existing codebase (`permissions.test.ts` lines 52-53), industry convention (AWS IAM `service:action`, CASL `subject:action`)
- **Findings**: The `namespace:action` format is already established in tests. Using matching constants avoids test breakage and follows industry convention.
- **Implications**: `Permissions` constant values use `"employee:list_all"`, `"leave:approve"`, etc. — not SCREAMING_SNAKE_CASE values.

### ROLE_PERMISSIONS Placement
- **Context**: Both backend (`core`) and frontend (`web`) need access to role-permission mappings
- **Sources Consulted**: Package dependency graph: `types ← (no deps)`, `core ← types`, `web ← types`
- **Findings**: `@willdesign-hr/types` is the only package importable by all consumers. `core` cannot be imported by `web` (architecture rule). Placing `ROLE_PERMISSIONS` in `types` makes it universally accessible.
- **Implications**: `Permissions`, `Permission` type, and `ROLE_PERMISSIONS` all go in `types/src/permissions.ts`

### Employee List Scoping Strategy
- **Context**: `GET /api/employees` currently uses cascading `hasMinimumRole` checks — ADMIN gets all, MANAGER gets direct reports, EMPLOYEE gets forbidden
- **Sources Consulted**: `packages/api/src/handlers/employees.ts` lines 43-51
- **Findings**: The `EMPLOYEE_LIST_ALL` permission replaces the ADMIN check. For managers, the handler falls through to a manager-scoped query using `auth.data.actorId`. No separate `EMPLOYEE_LIST_REPORTS` permission needed — the handler logic remains: if `EMPLOYEE_LIST_ALL` → findAll, else if actor has reports → findByManagerId.
- **Implications**: Keep the cascading pattern but replace role checks with permission checks. The second branch doesn't need a permission — it's a self-scoped query (manager sees own direct reports).

### Frontend Permission Resolution
- **Context**: Frontend currently gets `role` from login, derives capabilities via `ROLE_LEVELS` numeric comparison
- **Sources Consulted**: `packages/web/src/hooks/useAuth.ts`, `packages/web/src/hooks/useRole.ts`, `packages/web/src/components/auth/LoginPage.tsx`
- **Findings**: Two options: (a) server returns permissions in login response, (b) client derives from role using shared `ROLE_PERMISSIONS`. Option (b) is simpler — no API change needed for dev-auth, and `ROLE_PERMISSIONS` is already shared via `@willdesign-hr/types`.
- **Implications**: Frontend `login()` accepts `role`, then derives permissions from `ROLE_PERMISSIONS[role]` internally. Custom permissions can be added later when Cognito integration includes them in the JWT.

### Holiday Handler Missing Auth Checks
- **Context**: `POST /api/holidays` and `DELETE /api/holidays/:region/:date` have no permission checks today
- **Sources Consulted**: `packages/api/src/handlers/holidays.ts` lines 25-58
- **Findings**: These endpoints accept any authenticated user. Adding `HOLIDAY_MANAGE` permission is a new restriction, not just a migration. This is intentional per Requirement 4.9.
- **Implications**: No backward compatibility concern — this tightens security on endpoints that were unintentionally open.

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A. Extend existing files | Add constants to `types/permissions.ts`, enhance `hasPermission` in `core/permissions/engine.ts`, update handlers in-place | Minimal files changed, follows existing patterns | None significant — files are small | **Selected** |
| B. New permission module | Create separate `role-permissions.ts` in types, `permission-checker.ts` in core | Cleaner separation | Over-engineering for ~30 lines of new code | Rejected |

## Design Decisions

### Decision: Permission String Format
- **Context**: Need to choose format for `Permissions` constant values
- **Alternatives Considered**:
  1. SCREAMING_SNAKE_CASE values: `"LEAVE_APPROVE"` (matches constant keys)
  2. namespace:action format: `"leave:approve"` (matches existing test data)
- **Selected Approach**: `namespace:action` format
- **Rationale**: Existing tests already use this format. Aligns with IAM-style conventions. Enables future namespace-based filtering.
- **Trade-offs**: Constant key differs from value (`Permissions.LEAVE_APPROVE = "leave:approve"`), but this is standard practice
- **Follow-up**: None — straightforward

### Decision: Derive Permissions Client-Side
- **Context**: Frontend needs permissions for UI guards
- **Alternatives Considered**:
  1. Server returns permissions array in login response
  2. Client derives from role using shared `ROLE_PERMISSIONS` constant
- **Selected Approach**: Client-side derivation
- **Rationale**: No API changes needed. `ROLE_PERMISSIONS` is the single source of truth shared via types package. Custom permissions from Cognito JWT can be merged later.
- **Trade-offs**: Server and client must stay in sync via shared package (already the pattern). Custom per-user permissions require future JWT claim parsing.
- **Follow-up**: When Cognito integration adds custom claims, merge them in `LoginPage` at login time

### Decision: Keep Cascading Logic in Employee Handler
- **Context**: Employee list endpoint has two behaviors — full list (admin) vs scoped list (manager)
- **Alternatives Considered**:
  1. Single `EMPLOYEE_LIST_ALL` permission with cascading handler logic
  2. Two permissions: `EMPLOYEE_LIST_ALL` + `EMPLOYEE_LIST_REPORTS`
- **Selected Approach**: Single permission with cascading logic
- **Rationale**: The manager-scoped query is not a separate "permission" — it's a data scope limitation. Introducing a second permission adds complexity with no benefit.
- **Trade-offs**: Handler still has an `if/else` branch, but this is the same pattern as today
- **Follow-up**: None

## Risks & Mitigations
- **Risk**: Holiday endpoints gain new restrictions — could break existing workflows → **Mitigation**: Only ADMIN+ roles use these endpoints in practice; migration is seamless since admins have `HOLIDAY_MANAGE`
- **Risk**: Frontend permission derivation drifts from backend → **Mitigation**: Both use the same `ROLE_PERMISSIONS` from `@willdesign-hr/types`; single source of truth
- **Risk**: Existing tests use hardcoded `"leave:approve"` strings that must match new constants → **Mitigation**: `Permissions.LEAVE_APPROVE` value is `"leave:approve"` — exact match

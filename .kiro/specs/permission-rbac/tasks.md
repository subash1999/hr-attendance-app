# Implementation Plan

- [x] 1. Define permission constants and role-to-permission mapping in the shared types package
- [x] 1.1 Add the permission constants object with all 11 named permissions using namespace:action format, export the derived Permission type, and declare the object as const for string literal inference
  - Include permissions for: employee listing, employee update, leave approval, flag resolution, bank approval, attendance locking, onboarding, offboarding, audit viewing, policy update, and holiday management
  - Export both the constants object and the type from the package barrel
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 (P) Add the role-to-permission mapping that assigns default permissions to each of the five roles with cumulative inclusion
  - Employee role gets no action permissions (empty set)
  - Manager role gets employee listing, leave approval, flag resolution, and bank approval
  - HR Manager inherits all manager permissions (identical for now, extensible later)
  - Admin inherits all HR Manager permissions plus employee update, onboarding, offboarding, audit view, policy update, holiday management, and attendance locking
  - Super Admin gets all permissions dynamically derived from the constants object
  - Export only the final mapping, keep intermediate arrays module-scoped
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.3 (P) Write tests verifying the permission constants and role-permission mapping
  - Verify the constants object contains exactly 11 permission entries
  - Verify each role's permission set matches the expected cumulative inclusion
  - Verify Employee has zero permissions, Super Admin has all permissions
  - Verify unknown role lookup returns undefined (treated as no permissions)
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Enhance the permission engine to check role-derived permissions
- [x] 2.1 Update the hasPermission function to check both custom permissions and role-derived permissions via the mapping
  - Preserve existing check order: Super Admin bypass first, then custom permissions check
  - Add role-derived permission lookup as the third check using the role-permission mapping
  - Return false for unknown roles with no custom permissions (graceful handling)
  - Keep hasMinimumRole, getRoleLevel, ROLE_HIERARCHY unchanged and exported
  - Keep the authorize ABAC function unchanged (it continues using hasMinimumRole internally)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.3_

- [x] 2.2 (P) Write tests for the enhanced permission engine
  - Test that hasPermission returns true when the actor's role grants the permission via the mapping
  - Test that hasPermission returns true when the actor has the permission in custom permissions
  - Test that hasPermission returns true for Super Admin with any permission string
  - Test that hasPermission returns false when neither role nor custom permissions include the requested permission
  - Test that hasPermission returns false for unknown roles with empty custom permissions
  - Verify all existing hasMinimumRole and authorize tests still pass without changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.4_

- [x] 3. Migrate backend handler authorization from role hierarchy to permission checks
- [x] 3.1 Replace role hierarchy checks with permission checks in the admin handler
  - Onboarding endpoint: gate with the onboard permission instead of minimum admin role
  - Offboarding endpoint: gate with the offboard permission instead of minimum admin role
  - Audit endpoint: gate with the audit view permission instead of minimum admin role
  - Use unified forbidden message "Insufficient permissions" for all failures
  - _Requirements: 4.1, 4.10_

- [x] 3.2 (P) Replace role hierarchy checks with permission checks in the employee handler
  - List all employees: check employee update permission for full list access (admin scope)
  - List manager reports: check employee list all permission for scoped access (manager scope)
  - Update employee: gate with the employee update permission instead of minimum admin role
  - Maintain cascading logic: employee update permission → findAll, else employee list all permission → findByManagerId, else 403
  - _Requirements: 4.2, 4.3, 4.11_

- [x] 3.3 (P) Replace role hierarchy checks with permission checks in the leave handler
  - Pending leave list: gate with leave approve permission instead of minimum manager role
  - Approve/reject leave: gate with leave approve permission instead of minimum manager role
  - _Requirements: 4.4, 4.5_

- [x] 3.4 (P) Replace role hierarchy checks with permission checks in the flags handler
  - Pending flags list: gate with flag resolve permission instead of minimum manager role
  - Resolve flag: gate with flag resolve permission instead of minimum manager role
  - _Requirements: 4.6_

- [x] 3.5 (P) Replace role hierarchy checks with permission checks in the bank handler
  - Bank approval: gate with bank approve permission instead of minimum manager role
  - _Requirements: 4.7_

- [x] 3.6 (P) Replace role hierarchy checks with permission checks in the policies handler
  - Policy update: gate with policy update permission instead of minimum admin role
  - _Requirements: 4.8_

- [x] 3.7 (P) Add permission checks to the holidays handler (new restriction, not migration)
  - Holiday create: gate with holiday manage permission (currently has no auth check)
  - Holiday delete: gate with holiday manage permission (currently has no auth check)
  - _Requirements: 4.9_

- [x] 4. Add permissions to frontend auth state and create the permission hook
- [x] 4.1 Extend the auth context to include a permissions array derived from the user's role at login time
  - Add permissions field to the auth state interface
  - Derive permissions from the role-permission mapping when the login function is called
  - Initialize permissions as empty array for unauthenticated state
  - Clear permissions on logout
  - _Requirements: 5.1, 8.2_

- [x] 4.2 Add the useHasPermission hook that checks the current user's permissions
  - Accept a typed permission parameter (not a plain string) for compile-time safety
  - Return true when the user's permissions include the requested permission, false otherwise
  - Update useIsManager to return true if user has the leave approve permission
  - Update useIsAdmin to return true if user has the onboard permission
  - Preserve useHasMinimumRole and useRoleLevel for backward compatibility but mark as unused in new code
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 5. Update frontend route guards and navigation to use permissions
- [x] 5.1 Update the route guard component to accept a required permission prop as an alternative to minimum role
  - When required permission is specified, use the permission hook for access check
  - When only minimum role is specified, fall back to existing role-level check
  - Required permission takes precedence if both are provided
  - _Requirements: 6.1, 6.2_

- [x] 5.2 (P) Update the layout navigation configuration to filter items by permission instead of role level
  - Replace the minimum role field with required permission field on nav item configuration
  - Team page nav item: require the leave approve permission (visible to all managers)
  - Admin page nav item: require the onboard permission (visible to all admins)
  - Filter navigation items using permission check instead of role level comparison
  - _Requirements: 6.3, 6.4_

- [x] 5.3 Update route definitions to use permission-based guards instead of role-based guards
  - Team page route: guard with leave approve permission
  - Admin page route: guard with onboard permission
  - _Requirements: 6.5, 6.6_

- [x] 6. Update conditional UI rendering to use permission checks
- [x] 6.1 Replace the role-based check on the leave page with a permission check for leave approval visibility
  - Replace the isManager hook call with useHasPermission for the leave approve permission
  - Rename the variable to reflect the capability (e.g., canApproveLeave) instead of the role
  - Pending approvals section renders only when user has leave approve permission
  - Behavior is functionally identical for default role mappings
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Write integration and frontend tests to verify the complete permission system
- [x] 7.1 Write handler integration tests verifying permission-based authorization
  - Admin endpoint returns 403 when actor lacks onboard permission
  - Admin endpoint returns 201 when actor has onboard permission via role
  - Employee with custom leave approve permission can access pending leave requests
  - Holiday create returns 403 for employee role (new restriction)
  - Employee list returns all employees for admin, scoped list for manager
  - _Requirements: 4.1, 4.2, 4.4, 4.9, 4.11_

- [x] 7.2 (P) Write frontend tests verifying permission hooks, guards, and conditional rendering
  - useHasPermission returns true for manager role checking leave approve
  - useHasPermission returns false for manager role checking onboard
  - Route guard with required permission redirects when permission not present
  - Layout renders team nav item for manager, hides admin nav item
  - Leave page renders pending approvals section when user has leave approve permission
  - _Requirements: 5.2, 5.3, 6.2, 6.4, 7.1, 7.2_

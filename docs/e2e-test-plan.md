# E2E Playwright Test Suite — Master Test Plan

## Instructions for Implementation

This plan describes a comprehensive Playwright E2E test suite for the HR Attendance App. The goal is to test every page, every user action, every form, every modal, every role-based access control, every error state, and validate mutations at 3 layers: UI, API, and DynamoDB.

### What needs to happen:
1. Install Playwright in `packages/web/`
2. Create the test infrastructure (config, fixtures, page objects)
3. Implement 14 spec files covering 300+ test assertions
4. Every mutation must be validated at UI + API + DB layers
5. Cross-user effects must be verified (action by user A visible to user B)

### Prerequisites:
- Docker running with DynamoDB Local on port 8000
- Backend API running on port 3001 (`npm run dev:api`)
- Frontend Vite dev server on port 5174 (`npm run dev:web`)
- Seed data loaded (`npx tsx scripts/seed-data.ts`)

### Key issue to fix FIRST:
The attendance check-in/checkout/break workflow has display issues — work hours and break time are not shown properly on the dashboard. The clock widget state machine needs to be verified end-to-end: IDLE → CLOCKED_IN → ON_BREAK → CLOCKED_IN → IDLE, with elapsed time tracking correctly displayed.

---

## Tech Stack
- **Frontend**: React 19 + styled-components + react-i18next + React Query
- **Backend**: Express.js + DynamoDB (single-table design)
- **Auth**: Dev-mode login via `POST /api/dev-auth/login` with `{ employeeId }`
- **DB**: DynamoDB Local (port 8000), table `hr-attendance-app-dev-table`
- **Tenant**: All keys prefixed with `T#default#` for multi-tenant isolation

## Test Users (seeded in DynamoDB)
| ID | Name | Role | Permissions | Region |
|----|------|------|-------------|--------|
| ADMIN001 | Tanaka Admin | SUPER_ADMIN | All 11 | JP |
| MGR001 | Suzuki Manager | MANAGER | EMPLOYEE_LIST_ALL, LEAVE_APPROVE, FLAG_RESOLVE, BANK_APPROVE | JP |
| JP001 | Yamada Taro | EMPLOYEE | None | JP |
| NP001 | Ram Sharma | EMPLOYEE | None | NP |

## Routes & Permissions
| Route | Required Permission | Accessible By |
|-------|-------------------|---------------|
| `/` | None (public) | Everyone |
| `/login` | None (public) | Everyone |
| `/dashboard` | Authenticated | All roles |
| `/attendance` | Authenticated | All roles |
| `/leave` | Authenticated | All roles |
| `/reports` | Authenticated | All roles |
| `/payroll` | Authenticated | All roles |
| `/team` | LEAVE_APPROVE | MANAGER, ADMIN, SUPER_ADMIN |
| `/admin` | ONBOARD | ADMIN, SUPER_ADMIN |
| `/settings` | Authenticated | All roles |

## File Structure
```
packages/web/e2e/
├── playwright.config.ts
├── fixtures/
│   ├── auth.ts              — API-based login + sessionStorage injection
│   └── db.ts                — DynamoDB direct queries for state validation
├── pages/
│   ├── home.page.ts
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   ├── attendance.page.ts
│   ├── leave.page.ts
│   ├── team.page.ts
│   ├── admin.page.ts
│   └── settings.page.ts
└── specs/
    ├── 01-public.spec.ts
    ├── 02-auth.spec.ts
    ├── 03-access-control.spec.ts
    ├── 04-dashboard.spec.ts
    ├── 05-attendance.spec.ts
    ├── 06-leave.spec.ts
    ├── 07-reports.spec.ts
    ├── 08-payroll.spec.ts
    ├── 09-team.spec.ts
    ├── 10-admin.spec.ts
    ├── 11-settings.spec.ts
    ├── 12-cross-effects.spec.ts
    ├── 13-error-handling.spec.ts
    └── 14-responsive.spec.ts
```

---

## Auth Fixture Design (`fixtures/auth.ts`)

Login via API (not UI) to save time:
1. `fetch("http://localhost:3001/api/dev-auth/login", { method: "POST", body: JSON.stringify({ employeeId }) })`
2. Get back `{ token, employee: { id, role } }`
3. Inject into browser: `sessionStorage.setItem("hr-app-auth", JSON.stringify({ token, employeeId: employee.id, role: employee.role }))`
4. Set language: `localStorage.setItem("hr-app-language", "en")`

Four Playwright fixtures via `test.extend()`:
- `employeePage` — logged in as JP001 (EMPLOYEE)
- `managerPage` — logged in as MGR001 (MANAGER)
- `adminPage` — logged in as ADMIN001 (SUPER_ADMIN)
- `employeeNPPage` — logged in as NP001 (EMPLOYEE, NP region)

## DB Validation Helper (`fixtures/db.ts`)

Direct DynamoDB queries using `@aws-sdk/lib-dynamodb` + `createTenantKeys("default")` from `@hr-attendance-app/data`.

```
TABLE: hr-attendance-app-dev-table
ENDPOINT: http://localhost:8000
TENANT: "default"
```

Helper functions:
- `getEmployee(id)` → PK: `T#default#EMP#{id}`, SK: `PROFILE`
- `getAttendanceState(id)` → PK: `T#default#EMP#{id}`, SK: `ATT_STATE`
- `getAttendanceEvents(id, date)` → PK + SK prefix `ATT#{date}`
- `getLeaveRequests(id)` → PK + SK prefix `LEAVE#`
- `getLeaveBalance(id)` → PK + SK `LEAVE_BALANCE`
- `getFlags(id)` → PK + SK prefix `FLAG#`
- `getBankEntries(id)` → PK + SK prefix `BANK#`
- `getReports(id, date)` → PK + SK prefix `REPORT#{date}`
- `getSalary(id)` → PK + SK prefix `SALARY#`
- `getHolidays(region, year)` → PK: `T#default#REGION#{region}` + SK prefix `HOL#`
- `getRoleDefinition(name)` → PK: `T#default#ROLE#{name}`, SK: `DEFINITION`
- `getAttendanceLocks(yearMonth)` → PK: `T#default#LOCK#{yearMonth}`
- `countEmployees()` → GSI2 query on `T#default#ORG#EMP`
- `resetSeedData()` → re-runs seed script for clean state

## Three-Layer Validation Pattern

Every mutation test validates at 3 layers:
1. **UI** — Toast message, badge update, list change, form reset
2. **API** — Fetch endpoint directly from test, verify response
3. **DB** — Query DynamoDB directly, verify record matches

---

## SPEC 1: `01-public.spec.ts` (15 tests)

### Homepage — Content
- [ ] Navbar: logo "HR Attendance App", language select, "Log In" button
- [ ] Hero: h1 "Streamline Your HR Operations", subtitle, "Get Started" button
- [ ] 6 feature cards (Attendance Tracking, Leave Management, Payroll & Reports, Team Management, Policy Engine, Multi-Region Support)
- [ ] Each card: SVG icon (not emoji), title, description
- [ ] Deploy section: "Flexible Deployment", 2 cards (Cloud Hosted, Self-Hosted)
- [ ] Footer: brand name + "Built for modern HR teams."

### Homepage — Interactions
- [ ] "Get Started" → navigates to /login
- [ ] "Log In" → navigates to /login
- [ ] Language: select "日本語" → hero becomes "人事業務を効率化"
- [ ] Language: select "नेपाली" → Nepali text
- [ ] Language: back to "English" → restores

### Login Page
- [ ] Dev mode default: employee dropdown with 4 employees, info chips
- [ ] Prod mode: email + password fields + "Forgot password?"
- [ ] Mode switcher toggle works
- [ ] Language select in top-right corner

---

## SPEC 2: `02-auth.spec.ts` (16 tests)

### Login (Dev Mode)
- [ ] Select each of 4 employees → login → /dashboard
- [ ] Sidebar shows correct nav items per role

### Login (Prod Mode)
- [ ] Email + password fields visible
- [ ] Submit → "Invalid email or password" error (red text)

### Session
- [ ] Login → refresh → still on /dashboard
- [ ] sessionStorage has "hr-app-auth" with {token, employeeId, role}

### Logout
- [ ] Sidebar footer: "Log Out" button
- [ ] Click → redirected to / (homepage)
- [ ] After logout: /dashboard → /login
- [ ] sessionStorage cleared

---

## SPEC 3: `03-access-control.spec.ts` (16 tests)

### Nav Visibility
- [ ] Employee: 6 items (no Team, no Admin)
- [ ] Manager: 7 items (has Team, no Admin)
- [ ] Super Admin: 8 items (all)

### Route Guards
- [ ] Employee → /team → /dashboard redirect
- [ ] Employee → /admin → /dashboard redirect
- [ ] Manager → /team → allowed
- [ ] Manager → /admin → /dashboard redirect
- [ ] Admin → both allowed
- [ ] Unauthenticated → any protected → /login
- [ ] Authenticated → / → /dashboard

---

## SPEC 4: `04-dashboard.spec.ts` (18 tests)

### Clock Widget State Machine — with DB validation
- [ ] IDLE: "Clock In" visible. **DB**: state="IDLE"
- [ ] Click "Clock In" → "Clock Out" + "Break". **DB**: state="CLOCKED_IN", CLOCK_IN event created with source="web"
- [ ] Elapsed timer appears and ticks (verify increment after 2s)
- [ ] Click "Break" → "Back" button. **DB**: state="ON_BREAK", BREAK_START event
- [ ] Click "Back" → "Clock Out" + "Break". **DB**: state="CLOCKED_IN", BREAK_END event
- [ ] Click "Clock Out" → "Clock In". **DB**: state="IDLE", 4 events total
- [ ] Double-click: button disabled during isPending → only 1 event

### Stats & Links
- [ ] 4 stat cards (Hours Today/Week/Month, Leave Balance=8 for JP001)
- [ ] Quick links: New Leave → /leave, Reports → /reports, Payroll → /payroll
- [ ] Manager: "View Team" → /team. Employee: NOT visible
- [ ] Upcoming holidays section

---

## SPEC 5: `05-attendance.spec.ts` (16 tests)

### Calendar
- [ ] Monthly calendar renders
- [ ] Click date → detail heading updates
- [ ] Event dates highlighted

### Day Detail
- [ ] No events → empty state
- [ ] Events: action type, timestamp, source

### Edit (Unlocked)
- [ ] Edit button visible → click → modal with textarea
- [ ] Empty textarea → submit disabled
- [ ] Fill + submit → toast "Edit saved" → modal closes
- [ ] Close/backdrop → no save

### Locked Month
- [ ] "Locked" badge + notice message
- [ ] Edit buttons hidden (not in DOM)

---

## SPEC 6: `06-leave.spec.ts` (22 tests)

### Tabs
- [ ] 3 tabs: My Leave, Calendar, Balance

### Request Form — with DB validation
- [ ] 9 leave type options
- [ ] Fill dates → submit → toast + **DB**: PENDING record + **API**: in list + **UI**: PENDING badge
- [ ] Form clears after success

### Edge Cases
- [ ] Empty dates → no submit
- [ ] PAID + balance=0 → zero balance warning

### Manager Approvals — with DB validation
- [ ] Employee: no approvals section
- [ ] Manager: approve → toast + **DB**: status=APPROVED, approvedBy=MGR001 + **API**: not in pending + **UI**: employee sees APPROVED

---

## SPEC 7: `07-reports.spec.ts` (10 tests)

- [ ] Textarea + date (defaults today) + submit
- [ ] Empty → no submit; fill → toast "Report submitted" → cleared
- [ ] **DB**: report version=1; submit again → version=2
- [ ] History: empty state → after submit shows report

---

## SPEC 8: `08-payroll.spec.ts` (7 tests)

- [ ] Month selector defaults to current
- [ ] Base Salary + Net Amount when data exists
- [ ] JP001: 300,000 JPY from seed
- [ ] Empty state for months without data

---

## SPEC 9: `09-team.spec.ts` (20 tests) — Manager

### Tabs: Overview, Approvals, Calendar, Reports

### Overview
- [ ] Member cards with name, type, region, status badges

### Approvals
- [ ] Leave: approve → toast
- [ ] Flags: 5 resolution options; "Use Bank"/"Partial Bank" → offset input
- [ ] Bank: approve → toast

### Calendar & Reports
- [ ] Calendar with leave dates
- [ ] Reports filtered by date

---

## SPEC 10: `10-admin.spec.ts` (45 tests) — Super Admin

### Onboarding (12) — with DB validation
- [ ] 3-step wizard: Personal → Employment → Salary
- [ ] Validation: empty name blocks, invalid email blocks, salary ≤ 0 blocks
- [ ] Submit → toast + **DB**: employee ACTIVE + salary + att_state IDLE + **API**: in employees list

### Offboarding (10) — with DB validation
- [ ] Active employees only; For Cause → cure period field
- [ ] Preview modal → Confirm → toast + **DB**: status=INACTIVE + **API**: excluded from active

### Policies (5)
- [ ] 9 groups × 9 domains; submit → toast + **DB**: updated

### Roles (8) — with DB validation
- [ ] SUPER_ADMIN locked; toggle + submit → toast + **DB**: permissions match

### Holidays (7) — with DB validation
- [ ] JP/NP tabs; add → toast + **DB**: exists; delete → toast + **DB**: removed

### Attendance Lock (10) — with DB validation
- [ ] Company/Group/Employee scopes; lock → **DB**: record; unlock → **DB**: removed

---

## SPEC 11: `11-settings.spec.ts` (10 tests)

- [ ] Profile: name, email, type, region, probation badge (JP001)
- [ ] Language: select → text changes → localStorage persists → survives refresh
- [ ] Notification toggles

---

## SPEC 12: `12-cross-effects.spec.ts` (22 tests) — Multi-user side effects

### Onboard → Visibility (UI + API + DB)
- [ ] Admin onboards "Test User" → **DB**: record exists → **API**: in list → **UI**: manager sees in team, admin sees in offboard dropdown

### Offboard → Visibility (UI + API + DB)
- [ ] Admin offboards JP001 → **DB**: INACTIVE → **API**: excluded → **UI**: manager doesn't see, admin dropdown excludes

### Leave → Approval Flow (UI + API + DB)
- [ ] Employee submits → **DB**: PENDING → **UI**: manager sees in queue → Manager approves → **DB**: APPROVED + balance updated → **UI**: employee sees APPROVED badge

### Clock → Team Status (UI + DB)
- [ ] Employee clocks in → **DB**: CLOCKED_IN → **UI**: manager sees "Working"
- [ ] Break → ON_BREAK → "On Break"; Clock out → IDLE → "Idle"
- [ ] **DB**: 4 events in chronological order

### Lock → Employee (UI + DB)
- [ ] Admin locks month → **DB**: COMPANY record → **UI**: employee sees Locked, no edit buttons
- [ ] Admin unlocks → **DB**: removed → **UI**: employee sees edit buttons

### Holiday → Dashboard (UI + DB)
- [ ] Admin adds JP holiday → **DB**: exists → **UI**: JP employee sees it, NP employee doesn't
- [ ] Delete → **DB**: removed → **UI**: gone from dashboard

### Role Change → Access (UI + DB)
- [ ] Admin removes LEAVE_APPROVE from MANAGER → **DB**: permission gone → **UI**: manager can't access /team
- [ ] Restore → **DB**: permission back → **UI**: manager can access /team

### Report → Team (UI + DB)
- [ ] Employee submits → **DB**: exists → **UI**: manager sees in team reports

### Flag/Bank Resolution (UI + DB)
- [ ] Manager resolves flag → **DB**: RESOLVED → **UI**: employee sees resolved badge
- [ ] Manager approves bank → **DB**: APPROVED → **UI**: employee sees approved badge

### Full Workflow Integrity
- [ ] Onboard → Clock in/out → Leave → Approve → Lock month
- [ ] **DB/API/UI** all consistent across all user roles

---

## SPEC 13: `13-error-handling.spec.ts` (18 tests)

### API Errors (mock via `page.route()`)
- [ ] 400/401/403/404/500 → toast with error message
- [ ] Network timeout → error toast

### Validation
- [ ] Onboarding: empty name, invalid email, salary ≤ 0
- [ ] Offboarding: no employee → disabled behavior

### Toast
- [ ] Auto-dismiss 4s; close button; stack; success=green, error=red

### Loading
- [ ] Spinner during data fetch; "Submitting..." during mutations

---

## SPEC 14: `14-responsive.spec.ts` (16 tests)

### Mobile (375px)
- [ ] Single-column features, hidden hero visual, bottom nav, hamburger menu, overlay sidebar

### Tablet (768px)
- [ ] 2-column features, collapsed sidebar (60px)

### Desktop (1440px)
- [ ] 3-column features, expanded sidebar (240px), admin sidebar nav, max-width respected

---

## Implementation Order

1. `npm i -D @playwright/test` in `packages/web/`
2. `playwright.config.ts` — baseURL, webServer, projects
3. `fixtures/auth.ts` + `fixtures/db.ts` — foundation
4. All page objects in `pages/`
5. Foundation specs: `01-public` → `02-auth` → `03-access-control`
6. Core specs: `04-dashboard` → `05-attendance` → `06-leave`
7. Feature specs: `07-reports` → `08-payroll` → `09-team` → `10-admin` → `11-settings`
8. Advanced specs: `12-cross-effects` → `13-error-handling` → `14-responsive`

## Run Commands
```bash
npx playwright test                              # all
npx playwright test specs/02-auth.spec.ts         # single
npx playwright test --reporter=html               # visual report
npx playwright test --project=chromium            # single browser
```

## Key Source Files
- `packages/web/src/hooks/useAuth.ts` — sessionStorage key `hr-app-auth`
- `packages/web/src/hooks/apiClient.ts` — API error handling
- `packages/web/src/i18n/index.ts` — localStorage key `hr-app-language`
- `packages/api/src/dev-auth.ts` — dev login endpoint
- `packages/web/src/components/common/Layout.tsx` — sidebar nav + logout
- `packages/web/src/components/auth/RoleGuard.tsx` — route guards
- `packages/web/src/theme/theme.ts` — breakpoints
- `packages/data/src/dynamo/keys.ts` — DynamoDB key patterns
- `scripts/seed-data.ts` — test user data

## Total: ~300+ test assertions across 14 spec files
## Validation: 3-layer (UI + API + DB) for every mutation

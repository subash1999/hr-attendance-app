# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines

- Think in English, generate responses in English. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow

- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Claude Rules

- Never add Co-Authored-By lines to git commit messages
- Always run /simplify command before committing code
- Alert when Claude needs more context and compact context to perform a task
- Always use `const` arrow function pattern for all functions (`export const myFunc = () => { ... }`) — never use `function` declarations. Applies to React components, utility functions, handlers, hooks, backend services, and all code across the monorepo
- Never use magic strings or numbers in code — always use named constants from `@hr-attendance-app/types` constants module
- Always use styled-components for frontend styling — never create CSS files. Use `theme.ts` for design tokens, `primitives.ts` for shared components (Card, Button, FormField, etc.), and co-located styled components for page-specific styles
- Never use inline date operations (`new Date()`, `Date.now()`, `.toISOString()`, `.slice(0,10)`, `.getFullYear()`) — always use shared `date-utils` from `@hr-attendance-app/types`: `nowIso()`, `nowMs()`, `todayDate()`, `isoToDateStr()`, `dateToIso()`, `dateToDateStr()`, `yearFromDate()`, `daysInMonth()`, `formatYearMonth()`, `addDays()`, `addMonths()`, `addYears()`, `timestampId()`. For frontend display, use `packages/web/src/utils/date.ts` (formatDate, formatDateTime, formatRelative) and `packages/web/src/utils/currency.ts` (formatAmount)
- Never display raw ISO strings to users — use `utils/date.ts` functions: `formatDate`/`formatDateTime` for display, `localDateToIso`/`isoToLocalDate` for form input conversion. All dates stored as ISO UTC, displayed in user's locale
- All user-facing text must use i18n `t()` calls — never hardcode strings in JSX. Keys go in `i18n/en.json`, `ja.json`, `ne.json` with structure `section.key` (e.g. `t("leave.newRequest")`)
- Handlers must NEVER call repositories directly — always go through a service (handler → service → repository)
- All API endpoints, typed bodies, query params, and frontend routes defined in `packages/types/src/api-routes.ts` — single source of truth shared by backend and frontend
- All DynamoDB key patterns use `KeyPatterns` and `KeyPrefixes` from `@hr-attendance-app/types` — never construct keys with inline template literals
- Prefer querying NotebookLM MCP for requirement, design, or contract lookups to save context tokens — fall back to reading spec files directly only when NotebookLM is unavailable

## Policy System Rules

### Policy Architecture
The app uses a 4-level cascade: **Region defaults → Company overrides → Group overrides → Employee overrides**. Each level is a `RawPolicy` (partial). The resolved `EffectivePolicy` has all fields filled.

- **Region defaults**: Defined in `packages/core/src/regions/{jp,np}/config.ts` → `defaultPolicy`
- **Company policy**: Stored in DynamoDB (`PK: POLICY, SK: COMPANY`)
- **Group policies**: Stored in DynamoDB (`PK: POLICY, SK: GROUP#{groupName}`), seeded from `packages/core/src/policies/seed/`
- **User policies**: Stored in DynamoDB (`PK: POLICY, SK: USER#{userId}`)

### Policy Field Documentation Requirements
- Every policy field MUST have a description in `packages/web/src/i18n/en.json` under `admin.policy.fieldDesc.{fieldName}`
- When adding a new policy field: add the field to the TypeScript interface in `packages/types/src/policy.ts`, add the i18n description, and document its effect on application logic
- Field descriptions must explain: what the field controls, what values are valid, and which services/calculations consume it

### Policy Deprecation Rules
- **NEVER delete a policy group or rename a policy field** in production — historical payroll, flags, and leave records depend on the policy that was effective at the time
- To deprecate a policy: set `deprecated: true` and `deprecatedAt: <ISO date>` on the `RawPolicy`. The UI will show a warning banner and disable editing
- Deprecated policies remain applied to historical periods (any `yearMonth` before `deprecatedAt`)
- To migrate to a new policy name: (1) create the new policy group, (2) update affected employees' `employmentType` to point to the new group, (3) deprecate the old group. Never delete the old group
- Pre-production: deletion is acceptable. Post-production: deprecate + migrate only
- The `deprecated` and `deprecatedAt` fields are metadata — they do NOT affect the cascade resolution. The PolicyService resolves them the same way; the UI enforces the read-only constraint

### Active Policy Groups
| Group Name | Region | Description |
|---|---|---|
| jp-fulltime | JP | Full-time employees, 160h/mo, deemed OT 45h |
| jp-contract | JP | Contract workers, 160h/mo, deemed OT 45h, 3mo probation |
| jp-gyoumu-itaku | JP | Outsourced (gyoumu itaku), no OT tracking, no leave |
| jp-parttime | JP | Part-time, hourly pay, ~90h/mo |
| jp-sales | JP | Sales staff, deemed OT 45h, commission tracking |
| jp-intern | JP | Interns, ~90h/mo, no bonus, no OT |
| np-fulltime | NP | Nepal full-time, 160h/mo, remote, forfeit leave |
| np-paid-intern | NP | Nepal paid intern, 80h/mo |
| np-unpaid-intern | NP | Nepal unpaid intern, 90h/mo, no pay, no leave |

### Seeding
- `hr-app seed` seeds all data including policies from `packages/core/src/policies/seed/`
- `hr-app seed-policies` seeds only policy data (company + all group policies)
- Seed scripts: `scripts/seed-data.ts` (full), `scripts/seed-policies.ts` (policies only)

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)

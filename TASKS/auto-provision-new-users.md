# Auto-Provision New Users on First Login

## Description

When a user attempts to log in via the magic-link flow with an email address that does **not** already exist in the `employees` table, automatically create an employee record for them — provided the email domain is on the allow-list (e.g. `@example.com`). The new employee is created with sensible defaults (hire date = today, role = Employee, tier-0 PTO rate, zero carryover). An administrator can adjust these values later through the admin panel.

Currently the `/api/auth/request-link` endpoint returns a non-functional `token=missing-user` magic link for unknown emails. This feature replaces that behaviour with real user provisioning.

## Priority

🟡 Medium Priority

This is a core-feature enhancement to the existing authentication system. It depends on the completed `authentication.md` and `database-schema.md` foundation tasks.

## Checklist

### Phase 1 — Server-Side Domain Allow-List (Setup & Config)

- [x] Define `ALLOWED_EMAIL_DOMAINS` constant in `shared/businessRules.ts` (default: `["example.com"]`)
- [x] Add `isAllowedEmailDomain(email: string): boolean` helper in `shared/businessRules.ts`
- [x] Write Vitest unit tests for `isAllowedEmailDomain` (valid domain, invalid domain, case-insensitive, malformed input)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Unit tests green, build clean.

### Phase 2 — Auto-Provision Logic in Auth Endpoint

- [x] In `/api/auth/request-link` handler, when `employee` is `null`, check `isAllowedEmailDomain(identifier)`
- [x] If domain is allowed, create a new `Employee` record:
  - `name` = the email address (admin can update later)
  - `identifier` = the email address
  - `hire_date` = today's date (YYYY-MM-DD)
  - `pto_rate` = `PTO_EARNING_SCHEDULE[0].dailyRate` (tier 0)
  - `carryover_hours` = `0`
  - `role` = `"Employee"`
- [x] After creating the record, continue the normal magic-link flow (generate JWT, return link)
- [x] If domain is **not** allowed, keep existing behaviour (silent rejection / `missing-user` link)
- [x] Add structured logging for provisioned users: `"Auto-provisioned new employee: <email> (ID: <id>)"`
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Manual test — request a magic link for an unknown `@example.com` address; confirm employee is created and the returned link works.

### Phase 3 — Unit & Integration Tests

- [x] Vitest test for auto-provision path in the auth endpoint (mock repository, verify employee creation)
- [x] Vitest test confirming disallowed domain is rejected (no employee created, appropriate response)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: All unit tests green.

### Phase 4 — E2E Tests

- [x] Playwright test: login with a new `@example.com` email → verify dashboard loads → verify employee exists via API
- [x] Playwright test: login with a non-allowed domain → verify rejection / no provisioning
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: E2E suite green.

### Phase 5 — Documentation & Quality Gates

- [ ] Update API documentation (if any) describing auto-provision behaviour
- [ ] Update README.md or TASKS/README.md to mark this task complete
- [ ] Manual testing of the full flow (request link → validate token → session created)
- [ ] Code review and linting
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

**Validation**: Docs updated, full manual walkthrough successful.

## Implementation Notes

- **Name**: Set to the full email address. The administrator can update it later via the admin panel.
- **Date handling**: Use `formatDate` from `shared/dateUtils.ts` to produce the hire date string — never use `new Date()` directly.
- **Business rules**: Import `PTO_EARNING_SCHEDULE` from `shared/businessRules.ts` for the default PTO rate.
- **Security**: The allow-list prevents arbitrary users from self-registering. Only emails matching an allowed domain are provisioned.
- **Admin adjustability**: All auto-provisioned values (name, hire date, PTO rate, carryover) can be edited via the existing admin employee-editing UI.
- **Idempotency**: The `identifier` column has a `UNIQUE` constraint, so duplicate provisioning attempts will fail gracefully at the database level.

## Questions and Concerns

1.
2.
3.

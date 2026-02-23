# Admin Month Lock Enforcement

## Description

When an administrator acknowledges an employee's month (via `POST /api/admin-acknowledgements`), that month becomes **locked** and no further edits may be made to PTO entries, monthly hours, or employee acknowledgements for that employee/month combination. This must be enforced at both the business-rules layer (`shared/businessRules.ts`) and the server layer (`server/server.mts`). When an edit attempt is rejected, the error response must indicate **who** locked the month and **when** it was locked.

## Priority

🔥 High Priority

This is a data-integrity enforcement feature that directly affects the PTO calculations and admin review workflows — both of which are high-priority foundation areas.

## Checklist

### Stage 1: Business Rules Layer

- [x] Update `validateMonthEditable` in `shared/businessRules.ts` to accept lock metadata (admin name, locked-at timestamp) and return it in the error
- [x] Add a new validation message key (e.g. `month.locked`) to `VALIDATION_MESSAGES` with a template that includes the admin name and lock timestamp
- [x] Add unit tests in `tests/sharedBusinessRules.test.ts` for the updated `validateMonthEditable` function
- [x] **Validation**: `pnpm run build && pnpm run lint` pass; new unit tests pass

### Stage 2: Server Enforcement — PTO Endpoints

- [x] Create a reusable helper function (e.g. `checkMonthLocked`) in `server/server.mts` that queries `admin_acknowledgements` for a given employee ID and month (YYYY-MM), returning lock info or null
- [x] Guard `POST /api/pto` — before creating/updating/unscheduling a PTO entry, derive the month from the request date and call `checkMonthLocked`
- [x] Guard `PUT /api/pto/:id` — before updating a PTO entry, derive the month from the existing entry's date and call `checkMonthLocked`
- [x] Guard `DELETE /api/pto/:id` — before deleting a PTO entry, derive the month and call `checkMonthLocked`
- [x] Return HTTP 409 with error payload `{ error: "month_locked", lockedBy: "<admin name>", lockedAt: "<ISO timestamp>" }` when a locked month is detected
- [x] **Validation**: manual testing with seeded admin acknowledgement; `pnpm run build && pnpm run lint` pass

### Stage 3: Server Enforcement — Hours & Acknowledgement Endpoints

- [x] Guard `POST /api/hours` — before creating/updating monthly hours, call `checkMonthLocked` for the submitted month
- [x] Guard `POST /api/acknowledgements` — before creating an employee acknowledgement, call `checkMonthLocked` for the submitted month
- [x] **Validation**: manual testing; build and lint pass

### Stage 4: Testing

- [x] Add unit tests for `checkMonthLocked` helper
- [x] Add integration/E2E tests: submit PTO for a locked month → expect 409
- [x] Add integration/E2E tests: submit hours for a locked month → expect 409
- [x] Add integration/E2E tests: submit acknowledgement for a locked month → expect 409
- [x] Verify existing E2E tests still pass
- [x] **Validation**: `pnpm test` and `pnpm test:e2e` pass

### Stage 5: Documentation & Quality Gates

- [x] Update API documentation (README.md) to describe lock behaviour
- [x] ✅ `pnpm run build` passes
- [x] ✅ `pnpm run lint` passes
- [x] ✅ Manual testing of functionality
- [x] ✅ Error cases handled
- [x] ✅ Input validation implemented
- [x] ✅ Documentation updated

## Implementation Notes

- The `admin_acknowledgements` table already stores `employee_id`, `month`, `admin_id`, and `acknowledged_at`. No schema changes are required.
- The `AdminAcknowledgement` TypeORM entity has a `admin` relation (`ManyToOne` to `Employee`) that can be used to resolve the admin's name for the error message.
- The reusable `checkMonthLocked` helper should load the admin's name eagerly (join) so the error message is self-contained.
- Derive the YYYY-MM from a date string using `date.substring(0, 7)`.
- The existing `validateMonthEditable(isAcknowledged)` in `businessRules.ts` currently takes a boolean. It should be enhanced to accept optional metadata (`lockedBy`, `lockedAt`) so the returned `ValidationError` can carry richer information.
- HTTP 409 (Conflict) is the appropriate status code because the client's request conflicts with the current state of the resource (the month is locked).

## Questions and Concerns

1.
2.
3.

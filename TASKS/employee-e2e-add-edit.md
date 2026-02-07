# Employee E2E Add/Edit Flow

## Description
Create an end-to-end Playwright test that adds a new employee and then edits that same employee through the admin panel UI. This task covers the UI integration wiring between the `employee-form` component and the admin panel, plus any API contract alignment required to make the flow stable and testable.

## Priority
🟡 Medium Priority

## Checklist

### Stage 1: Component Contract (Manual Playground Test)
- [x] Confirm no database schema changes are required for employee add/edit
- [x] Verify employee create/update endpoints accept all fields used by the form
- [x] Add server-side validation for employee identifier format (email address) and required fields
- [x] Test `employee-form` validation and submission in playground (test.ts)
- [x] Confirm `employee-submit` event includes all fields and `isEdit` toggles correctly
- [x] Confirm edit mode populates values and updates button/title via `employee` + `is-edit` attributes
- [x] Run `npm run test` to ensure no regressions

### Stage 2: Admin Panel Integration (Manual UI Test)
- [x] Wire `employee-form` events into admin panel handlers for create and update
- [x] Refresh employee list after create/update to reflect changes
- [x] Implement UI feedback for successful add/edit (list update or status message)
- [x] Handle `form-cancel` to close/reset the form in admin panel
- [x] Manual testing of add/edit flow via admin panel UI
- [x] Run `npm run test` to ensure no regressions

### Stage 3: API Readiness (API Test)
- [ ] Confirm create/update responses return success/failure only
- [ ] Test API endpoints manually for create and update operations
- [ ] Validate server-side email identifier format and required field checks
- [ ] Run `npm run test` to ensure no regressions

### Stage 4: E2E Add Flow (Playwright Test)
- [ ] Use `/api/test/reload-database` with a seeded snapshot as the E2E test setup
- [ ] Add Playwright E2E test for adding a new employee
- [ ] Assert new employee appears in list after submission
- [ ] Run `npm run test` to ensure no regressions
- [ ] Add negative test case for invalid email identifier format

### Stage 5: E2E Edit Flow (Playwright Test)
- [ ] Extend E2E test to edit the created employee and assert updates
- [ ] Assert list and detail reflect changes after edit submission
- [ ] Run `npm run test` to ensure no regressions

### Quality Gates
- [ ] Update any relevant documentation for the admin panel flow
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Run `npm run test` to ensure no regressions

## Implementation Notes
- Keep the `employee-form` component API-agnostic: emit events; parent handles API calls.
- Use `querySingle` for DOM selection in component tests and avoid type casts.
- Prefer stable selectors in E2E tests that do not depend on layout or text changes.
- Ensure the test flow is deterministic by using `/api/test/reload-database` before the E2E run.
- Prefer create/update responses that return success/failure only; refresh the list after writes.

## Questions and Concerns
1. Resolved: employee identifier is the employee email address (unique, verifiable); update validation accordingly.
2. Resolved: E2E setup uses `/api/test/reload-database` with a seeded snapshot (see [scripts/seed.ts](../scripts/seed.ts)).
3. Resolved: create/update returns success/failure only; UI re-fetches the employee list.

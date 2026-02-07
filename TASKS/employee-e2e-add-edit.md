# Employee E2E Add/Edit Flow

## Description
Create an end-to-end Playwright test that adds a new employee and then edits that same employee through the admin panel UI. This task covers the UI integration wiring between the `employee-form` component and the admin panel, plus any API contract alignment required to make the flow stable and testable.

## Priority
🟡 Medium Priority

## Checklist
- [ ] Confirm no database schema changes are required for employee add/edit
- [ ] Verify employee create/update endpoints accept all fields used by the form
- [ ] Add server-side validation for employee identifier format (email address) and required fields
- [ ] Wire `employee-form` events into admin panel handlers for create and update
- [ ] Refresh employee list after create/update to reflect changes
- [ ] Implement UI feedback for successful add/edit (list update or status message)
- [ ] Add Playwright E2E test for adding a new employee
- [ ] Extend E2E test to edit the created employee and assert updates
- [ ] Add negative test case for invalid email identifier format
- [ ] Use `/api/test/reload-database` with a seeded snapshot as the E2E test setup
- [ ] Update any relevant documentation for the admin panel flow
- [ ] Manual testing of add/edit flow via admin panel UI
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

## Implementation Notes
- Keep the `employee-form` component API-agnostic: emit events; parent handles API calls.
- Use `querySingle` for DOM selection in component tests and avoid type casts.
- Prefer stable selectors in E2E tests that do not depend on layout or text changes.
- Ensure the test flow is deterministic by using `/api/test/reload-database` before the E2E run.
- Prefer create/update responses that return success/failure only; refresh the list after writes.

## Questions and Concerns
1. Resolved: employee identifier is the employee email address (unique, verifiable); update validation accordingly.
2. Resolved: E2E setup uses `/api/test/reload-database` with a seeded snapshot (see [scripts/seed.ts](scripts/seed.ts)).
3. Resolved: create/update returns success/failure only; UI re-fetches the employee list.

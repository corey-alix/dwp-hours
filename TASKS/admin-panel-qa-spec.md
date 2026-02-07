# Admin Panel QA and Validation

## Description
Create a focused QA specification for the Admin Panel component to verify view switching, child component wiring, event re-dispatch, and accessibility behaviors. The goal is to ensure the admin shell remains stable as other features evolve.

## Priority
🟡 Medium Priority

## Checklist
### Stage 1: View State and Layout
- [x] Verify `current-view` attribute updates the active nav state and header title
- [x] Confirm `currentView` property setter triggers render and nav state updates
- [x] Validate Settings view placeholder renders as expected

### Stage 2: Child Component Wiring
- [x] Confirm `<employee-list>` renders under Employees view
- [x] Confirm `<pto-request-queue>` renders under PTO Requests view
- [x] Confirm `<report-generator>` renders under Reports view
- [x] Verify child events are re-dispatched with unchanged payloads (`add-employee`, `employee-edit`, `employee-delete`, `employee-acknowledge`)

### Stage 3: Interaction and Accessibility
- [x] Validate sidebar links are keyboard accessible and focus-visible
- [x] Confirm click targets inside nav links use correct `data-view`
- [x] Check contrast and hover states match theme tokens

### Stage 4: Testing and Quality Gates
- [x] Run E2E test for admin panel component
- [x] Manual testing of view switching and event re-dispatch
- [x] `npm run lint` passes
- [x] `npm run build` passes

## Implementation Notes
- Keep changes isolated to the admin shell unless a child component issue is discovered.
- Use `querySingle` for DOM queries and avoid unsafe type casts.

## Questions and Concerns
1. Add an Admin view for spreadsheet import (support one or more files, similar to Corey Alix 2025.xlsx).
2. Replace the Settings placeholder with a real web component; fields can remain placeholder content.
3. ARIA-specific work is out of scope; rely on default web standards.
4. Default view should be "PTO Requests" and move it to the top of the sidebar list.
5. Review flow (out of scope for now): if validation passes, render an internal spreadsheet approximation of Corey Alix 2025.xlsx using 12 pto-calendar components plus a summarizing grid; if validation fails, show the issue (unexpected color, color count/data mismatch, weekend cell colored, out-of-range value in A1, etc.) so the admin can fix and re-submit.
6. Surface import errors on the containing form only; the server will log the error after upload processing.

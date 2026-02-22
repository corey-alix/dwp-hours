# Employee Name in PTO Employee Info Card

## Description

Display the employee name as the first row inside the `pto-employee-info-card` component's "Employee Information" card. Currently the card shows hire date, rollover date, carryover hours, PTO rate, accrued YTD, and annual allocation — but not who the employee is. The name should appear as the first data row (e.g., `renderRow("Employee", "Jane Doe")`) so the card is self-describing.

This applies to the `current-year-summary-page` where the card is rendered with loader data sourced from the PTO status API.

## Priority

🟢 Low Priority (UI polish)

## Checklist

### Stage 1 — Data Model & Component Update

- [ ] Add optional `employeeName` property to the `EmployeeInfoData` type in `client/components/pto-employee-info-card/index.ts`
- [ ] Render `employeeName` as the first `renderRow()` call inside the card body (before "Hire Date"), guarded by an `undefined` check so the card still works without it
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual test: open `client/components/pto-dashboard/test.html` — card renders without errors when `employeeName` is not provided

### Stage 2 — Wire Data on Current Year Summary Page

- [ ] Determine source of employee name (auth session, loader data, or additional API call)
- [ ] If `PTOStatusResponse` does not include the name, extend the loader or page logic to resolve it (e.g., from stored auth info or an `/api/employees/:id` call)
- [ ] Pass `employeeName` to `infoCard.info` in `CurrentYearSummaryPage.populateCards()`
- [ ] `pnpm run build` passes
- [ ] Manual test: `current-year-summary-page` shows the employee name as the first row

### Stage 3 — Testing & Cleanup

- [ ] Add/extend Vitest unit test for `pto-employee-info-card` verifying the name row renders when provided and is absent when omitted
- [ ] Verify existing E2E tests still pass (`pnpm run test:e2e`)
- [ ] `pnpm run lint` passes
- [ ] Update any related documentation or task checklists

## Implementation Notes

- The `EmployeeInfoData` type already uses optional fields (`carryoverHours?`, `ptoRatePerDay?`, etc.), so `employeeName?` follows the same pattern
- `renderRow("Employee", name)` keeps the card visually consistent with other rows
- The employee name is likely available via the auth token/session stored on the client (check `AuthValidateResponse.employee.name`) — prefer this over an extra API call
- Do **not** change the card's `<h4>` title from "Employee Information"; the name goes in the card body as a data row

## Questions and Concerns

1. ✅ Yes — give the employee name row emphasis using existing or new tokens from `tokens.css` (per CSS Theming Assistant guidance).
2. ✅ When unavailable, render `<MISSING>` in error color (`--color-error`).
3. ✅ Yes — this card should always render the employee name row, including admin views.

# Acknowledgement Warning Review

## Description

Fix two issues with the Phase 15 import acknowledgement implementation:

1. **Admin acknowledgement incorrectly created for warning months**: When an employee acknowledgement has `status="warning"`, the corresponding `admin_acknowledgement` record should NOT be inserted. The administrator must manually review and acknowledge that month. Currently, some code paths (e.g., `parseAcknowledgements` reading spreadsheet checkmarks, or merge logic in `parseEmployeeSheet`) may insert admin acknowledgements for months that have discrepancy warnings on the employee side.

2. **Admin monthly review cards missing warning indicators**: The employee cards on `/admin/monthly-review` do not display any indication that an employee acknowledgement has a `status="warning"` or an associated `note`. Admins have no visibility into which months were flagged during import and why, making manual review impossible without querying the database directly.

## Priority

🟡 Medium Priority — Affects admin workflow quality and data integrity of imported acknowledgements.

## Checklist

- [x] **Phase 1: Fix Admin Acknowledgement Insertion for Warning Months**
  - [x] **Audit `generateImportAcknowledgements()`** in [server/reportGenerators/excelImport.ts](../server/reportGenerators/excelImport.ts): Verify that when `status="warning"` is set on the employee ack, NO admin ack is pushed. (Current code appears correct — only the `else` branch with the warning omits the admin ack.)
  - [x] **Audit `parseAcknowledgements()`** in [server/reportGenerators/excelImport.ts](../server/reportGenerators/excelImport.ts): This reads spreadsheet checkmark cells (`✓`) and generates acks with no `status` field. When these are merged with import-generated acks in `parseEmployeeSheet()`, spreadsheet-based admin acks may override the intended missing admin ack for warning months.
  - [x] **Audit merge logic** in `parseEmployeeSheet()` (~line 2385): The merge uses import acks as priority and fills gaps with spreadsheet acks. A spreadsheet `✓` for the admin column on a discrepancy month would insert an admin ack that should not exist. Fix: when merging, if the import-generated acks include an employee ack with `status="warning"` for month M, suppress any spreadsheet-derived admin ack for the same month M.
  - [x] **Audit `upsertAcknowledgements()`**: Confirm that it faithfully inserts only the acks it receives — no logic inside should auto-create admin acks.
  - [x] **Add/update unit test**: Verify that when `generateImportAcknowledgements` returns a warning employee ack for a month AND `parseAcknowledgements` returns a spreadsheet admin ack for the same month, the merged result does NOT include the admin ack.
  - [ ] **Integration test**: Import a known discrepancy employee (e.g., J Schwerin December 2018) and verify the `admin_acknowledgements` table has NO record for that employee/month.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Run `pnpm run build` — must compile without errors
  - [x] Never proceed to the next phase if any tests are failing

- [x] **Phase 2: Expose Warning Status and Notes via Admin Monthly Review API**
  - [x] **Extend `AdminMonthlyReviewItem`** in [shared/api-models.d.ts](../shared/api-models.d.ts): Add two optional fields:
    - `employeeAckStatus?: string | null` — the `status` column from `acknowledgements` (e.g., `"warning"` or `null`)
    - `employeeAckNote?: string | null` — the `note` column from `acknowledgements`
  - [x] **Update the API endpoint** at `/api/admin/monthly-review/:month` in [server/server.mts](../server/server.mts) (~line 1548): The endpoint already queries `ackRepo.findOne(...)` to get `employeeAck`. Add the `status` and `note` fields to the response object:
    ```typescript
    employeeAckStatus: employeeAck?.status ?? null,
    employeeAckNote: employeeAck?.note ?? null,
    ```
  - [x] **Remove duplicate endpoint registration**: There are two identical registrations of `/api/admin/monthly-review/:month` in `server.mts` (~lines 1548 and 1665). Remove the second one — it is a leftover refactoring artifact.
  - [ ] **Add API test**: Verify the endpoint returns `employeeAckStatus` and `employeeAckNote` for an employee with a warning acknowledgement.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Run `pnpm run build` — must compile without errors

- [x] **Phase 3: Display Warning Indicator on Admin Monthly Review Cards**
  - [x] **Store the new fields** in the `admin-monthly-review` component ([client/components/admin-monthly-review/index.ts](../client/components/admin-monthly-review/index.ts)): Ensure `_employeeData` items carry `employeeAckStatus` and `employeeAckNote` from the API response.
  - [x] **Add a warning status badge** to `renderEmployeeCard()`: When `employeeAckStatus === "warning"`, render a pill badge in the card header (alongside the lock indicator) that signals a note exists. The badge itself does NOT show the note text — it only indicates "⚠ Warning" status:
    ```html
    <span
      class="lock-indicator warning"
      title="Import discrepancy — expand calendar for details"
      >⚠ Warning</span
    >
    ```
  - [x] **Display the note below the calendar**: When `employeeAckNote` is non-null AND the inline calendar is expanded ("View Calendar" clicked), render the note text below the `<pto-calendar>` element inside the employee card:
    ```html
    <div class="ack-note">${employee.employeeAckNote}</div>
    ```
    The note is only visible when the calendar is shown — it is contextual detail for the admin reviewing that month.
  - [x] **Add CSS styles** in [client/components/admin-monthly-review/css.ts](../client/components/admin-monthly-review/css.ts):
    - `.lock-indicator.warning` — amber/orange background with dark text, consistent with the existing pill badge design system
    - `.ack-note` — subtle background, smaller font, wrapping text for multi-line notes
  - [x] **Accessibility**: Ensure the warning badge has an appropriate `title` attribute and sufficient color contrast per project CSS color contrast standards
  - [ ] **Vitest unit test**: Verify that `renderEmployeeCard` includes the warning badge when the employee data has `employeeAckStatus="warning"`
  - [ ] **Vitest unit test**: Verify that clean employees (no warning) do NOT show the warning badge
  - [ ] **Vitest unit test**: Verify that the note text appears below the calendar when the calendar is expanded and `employeeAckNote` is non-null
  - [ ] **Vitest unit test**: Verify that the note is NOT rendered when the calendar is collapsed
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Run `pnpm run build` — must compile without errors
  - [x] Run `pnpm run lint` — must pass

- [ ] **Phase 4: Manual Testing and Validation**
  - [ ] Import the 2018 spreadsheet (`reports/2018.xlsx`) into a test database
  - [ ] Navigate to `/admin/monthly-review` and select months with known discrepancies (e.g., December 2018 for J Schwerin)
  - [ ] Verify the warning badge appears on the card for employees with discrepancies
  - [ ] Verify the note text appears below the calendar when expanded, describing the import discrepancy
  - [ ] Verify clean months do NOT show warnings
  - [ ] Verify that admin acknowledgement records are absent for warning months — admin must manually click "Acknowledge" to create them
  - [ ] Verify that after admin acknowledges a warning month, the status changes to "resolved" in the database
  - [ ] Verify that re-viewing a resolved month shows "✓ Resolved" badge instead of "⚠ Warning"
  - [ ] Use `scripts/review-screenshot.mjs` to capture a screenshot of the admin monthly review page for visual verification
  - [ ] Run `pnpm run build` — must compile without errors
  - [ ] Run `pnpm run lint` — must pass

## Implementation Notes

- The `generateImportAcknowledgements()` function correctly omits admin acks for warning months, but the merge with `parseAcknowledgements()` spreadsheet data may re-introduce them. The fix is in the merge logic.
- The `/api/admin/monthly-review/:month` endpoint is registered **twice** in `server.mts` (~lines 1548 and 1665). The duplicate must be removed (Phase 2).
- The `AdminMonthlyReviewItem` interface in `shared/api-models.d.ts` needs new fields. This affects both server and client code.
- Follow the existing pill badge pattern (`.lock-indicator`) for the warning indicator to maintain design consistency.
- Use CSS custom properties from `tokens.css` for warning colors (e.g., `--color-warning-dark`).
- Use modern `rgb()` notation with alpha percentages per project CSS conventions.

- [x] **Phase 5: Admin Acknowledge Resolves Warning Status**
  - [x] **Update admin acknowledgement flow**: When an admin clicks "Acknowledge Review" on a card with `employeeAckStatus === "warning"`, the server should update the employee's `acknowledgements` record to set `status = "resolved"` for that month.
  - [x] **Update the admin acknowledgement API endpoint** (`POST /api/admin/acknowledge` or equivalent): After inserting the `admin_acknowledgements` record, also update the corresponding `acknowledgements` row: `SET status = 'resolved' WHERE employee_id = ? AND month = ? AND status = 'warning'`.
  - [x] **UI feedback**: After successful acknowledgement, the card is dismissed as normal. If the admin re-views that month later, the warning badge should show "✓ Resolved" instead of "⚠ Warning".
  - [x] **Add CSS style**: `.lock-indicator.resolved` — green-tinted badge consistent with the locked state.
  - [ ] **Vitest unit test**: Verify the API updates the acknowledgement status to `"resolved"` when confirming admin acknowledgement.
  - [ ] **Vitest unit test**: Verify that `renderEmployeeCard` renders "✓ Resolved" badge when `employeeAckStatus === "resolved"`.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Run `pnpm run build` — must compile without errors
  - [x] Run `pnpm run lint` — must pass

## Questions and Concerns

1. ✅ Warning badge shown in card header as status indicator only. Note text displayed below the calendar when expanded via "View Calendar".
2. ✅ Admin "Acknowledge Review" sets the employee ack status from `"warning"` to `"resolved"`.
3. ✅ Duplicate `/api/admin/monthly-review/:month` endpoint registration will be removed.

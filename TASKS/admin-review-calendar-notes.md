# Admin Review Calendar — Employee Notes Display

## Description

The admin monthly review page's inline calendars do not display employee notes on PTO entries. The `pto-calendar` component already supports rendering a small triangle indicator in the corner of day cells when a PTO entry has a `notes` field, with a click handler that shows the note via a toast notification. However, the notes data is being stripped during the normalization/mapping steps in the data flow pipeline between the API response and the calendar component.

Like Excel, the calendar should render a small triangle in the corner of day cells that have notes. Hovering over it (desktop) should show a tooltip, and tapping it (mobile) should display the note in a dialog/toast.

## Priority

🟡 Medium Priority — UI feature enhancement for an existing admin workflow.

## Root Cause Analysis

The `notes` field exists in the database (`pto_entries.notes TEXT`), is serialized by the API (`serializePTOEntry` includes `notes`), and is consumed by the `pto-calendar` component (`PTOEntry.notes` + note indicator rendering). The data is lost at two normalization points:

1. **`client/pages/admin-monthly-review-page/index.ts`** — The `admin-monthly-review-request` handler normalizes PTO entries without including `notes` (lines ~82-88). Same issue in the `calendar-month-data-request` handler (lines ~140-147).
2. **`client/components/admin-monthly-review/index.ts`** — The `update()` method maps entries to `PTOEntry[]` for the calendar without including `notes` (lines ~363-372).

## Checklist

### Phase 1: Pass Notes Through Data Pipeline

- [x] Add `notes` to the normalized PTO entry shape in `admin-monthly-review-page/index.ts` (`admin-monthly-review-request` handler)
- [x] Add `notes` to the normalized PTO entry shape in `admin-monthly-review-page/index.ts` (`calendar-month-data-request` handler)
- [x] Add `notes` to the `_ptoEntries` type declaration in `admin-monthly-review/index.ts`
- [x] Add `notes` to the `_monthPtoCache` type declaration in `admin-monthly-review/index.ts`
- [x] Add `notes` to the entry mapping in `admin-monthly-review/index.ts` `update()` method where entries are passed to `cal.setPtoEntries()`
- [x] Verify `pto-calendar` renders the triangle indicator when notes are present

**Validation**: Build passes (`pnpm run build`). Manually verify that the admin monthly review page shows triangle indicators on calendar day cells that have PTO entries with notes.

### Phase 2: Vitest Unit Tests

- [x] Add test case in `admin-monthly-review` test suite verifying that notes are passed through to `pto-calendar` entries
- [x] Add test case in `pto-calendar` test suite verifying note indicator renders when `notes` field is present
- [x] Add test case verifying note indicator is absent when `notes` is null/empty

**Validation**: `pnpm run test` passes with new test cases.

### Phase 3: Mobile Interaction (Tap-to-Show Dialog)

- [ ] Verify current click handler in `pto-calendar` (`handleDelegatedClick` → `notifications.info()`) works on mobile touch events
- [ ] If needed, add touch event handling for the note indicator to ensure mobile compatibility
- [ ] Confirm the toast notification is readable and appropriately sized on mobile viewports

**Validation**: Manual testing on a mobile viewport (Chrome DevTools device emulation). Tapping the triangle shows the note content in a toast notification.

### Phase 4: Quality Gates

- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] `pnpm run lint:css` passes
- [ ] Manual testing of note display on admin monthly review page
- [ ] Verify notes display correctly when navigating between calendar months via swipe

### Phase 5: Decouple Per-Day Auto-Approval from Month Warning Status

The current auto-approval logic in `shouldAutoApproveImportEntry` (`shared/businessRules.ts`) rejects **every** PTO entry in a month that has a reconciliation warning (e.g., calendar/column-S hour mismatch). This blanket rejection:

- Adds unhelpful notes to every day: _"Auto-approve denied: Month 2018-02 has warning acknowledgement status"_
- Prevents approval of legitimate days that have no limit violations

**Desired behavior**: Individual PTO entries should be auto-approved based solely on their own limit checks (annual sick/bereavement/jury-duty caps, PTO balance). The **month-level acknowledgement** should still _not_ be auto-approved when there is a reconciliation discrepancy — that correctly requires manual admin review.

Example: J Carter, Feb 15 2018 — took PTO but Excel declares 10h vs 8h calendar. The day itself should auto-approve (PTO balance allows it). The month stays un-acknowledged with the existing warning note: _"Calendar shows 8h but column S declares 10h (Δ=-2h) for J Carter month 2. Requires manual review."_

**Changes required**:

- [x] Remove the "warning month" check (#1) from `shouldAutoApproveImportEntry` in `shared/businessRules.ts` — individual entries should pass/fail on their own merits (checks #2–#6)
- [x] Remove `warningMonths` from `AutoApprovePolicyContext` interface (or keep and ignore — evaluate downstream usage)
- [x] Update `shouldAutoApproveImportEntry` JSDoc to reflect the new behavior
- [x] Update existing `shouldAutoApproveImportEntry` unit tests that assert warning-month rejection
- [x] Add new test: entry in a warning month with valid limits → approved
- [x] Add new test: entry in a warning month exceeding annual limit → rejected (on its own merits, not the month warning)
- [x] Verify month-level acknowledgement still gets `status: "warning"` and the reconciliation note (no change needed — this is handled separately in the import pipeline)
- [ ] Re-import test spreadsheet and verify: individual days are approved, warning months are still un-acknowledged
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: After re-importing `reports/2018.xlsx`, J Carter's Feb 15 PTO entry should have `approved_by = 0` (sys-admin). The month 2018-02 acknowledgement should still have `status: "warning"` with the reconciliation note.

### Phase 6: Bind Card Warning/Note to Navigated Month

When the inline calendar navigates to a different month, the warning indicator and ack-note on the employee card were still showing the review month's acknowledgement data. They should reflect the acknowledgement status of the month currently displayed in the calendar.

**Root cause**: `renderEmployeeCard` used `employee.employeeAckStatus` and `employee.employeeAckNote` unconditionally — these came from the review month's `AdminMonthlyReviewItem` and never updated when the calendar navigated.

**Changes**:

- [x] Add `_monthAckCache` (Map of YYYY-MM → Map of employeeId → {status, note}) to the component for caching per-month acknowledgement data
- [x] Add `setMonthAckData(month, data)` method for the parent page to inject ack data
- [x] Update `renderEmployeeCard` to resolve ack status/note from the displayed month when a non-review month is shown
- [x] Extend `calendar-month-data-request` handler in `admin-monthly-review-page` to also fetch monthly review data and pass ack info via `setMonthAckData()`
- [x] Add test: warning indicator updates when navigating to a month with different ack status
- [x] Add test: ack-note text updates when navigating to a different month
- [x] Add test: warning/note restore when navigating back to the review month
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual testing: navigate calendar months and verify warning badge and note text update

**Validation**: Expanding an employee calendar on a warning month, then navigating to a clean month should hide the warning badge. Navigating back should restore it.

### Phase 7: Calendar Day Cell Hours Display Overhaul

The original day cell rendering used Unicode superscript digits (`⁴`, `²`) for partial-day hours and a `½` symbol vs `●` symbol to distinguish partial vs full days. This had several problems: Unicode superscript cannot represent fractional hours (e.g., 1.5), the `●`/`½` symbols don't communicate actual hours, and weekend credit entries were invisible.

**New design** — every day with PTO activity shows:

1. **Superscript on day number** (`<sup>`) with the numeric hours value (e.g., `8`, `4`, `1.5`). Fractional hours are shown to 1 decimal place (`3.33` → `3.3`), whole hours have no decimal. Weekend/off-day credit entries get a `+` prefix (e.g., `+2`).
2. **Colored type-indicator dot** (`.type-dot`) alongside the hours symbol, always rendered regardless of hours amount. The dot color matches the PTO type (PTO, Sick, Bereavement, Jury Duty) using the same palette as the legend swatches.
3. **Hours symbol** (`●`) is retained as a visual anchor in the bottom-right corner. The `½` symbol is dropped.

**Changes**:

- [x] Replace `SUPERSCRIPTS` Unicode lookup with `formatHoursSuperscript()` that returns numeric text with optional `+` prefix and 1-decimal formatting
- [x] Show superscript for **all** hours (including 8h), not just partial — every PTO day shows hours
- [x] Add `.credit` CSS class on superscript for weekend entries (green tint, bold)
- [x] Add `.type-dot` colored circle element rendered alongside the hours symbol
- [x] CSS: `.type-dot-{PTO,Sick,Bereavement,Jury-Duty}` background colors matching `PTO_TYPE_COLORS`
- [x] Drop `HOURS_PARTIAL` (`½`) usage — all PTO days use `HOURS_FULL` (`●`) as the hours symbol
- [x] Update tests: superscript content is now numeric text (`"4"`, `"8"`, `"1.5"`, `"+2"` for credits)
- [x] Add test: fractional hours truncated to 1 decimal
- [x] Add test: weekend credit shows `+` prefix and `.credit` class
- [x] Add test: type-dot renders for PTO entries
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual testing: verify day cells show numeric superscript, colored dot, and weekend `+` prefix

**Validation**: Calendar day cells show `12⁸` for 8h PTO on the 12th, `15⁴` for 4h Sick, `8⁺²` for a 2h Saturday credit. Each cell has a colored dot matching the PTO type.

## Implementation Notes

- The `pto-calendar` component already has full rendering support for notes: triangle indicator (`.note-indicator`), `title` tooltip attribute, `data-note` attribute, and a click handler dispatching `notifications.info()`. No changes needed in the calendar component itself.
- The fix is purely a data-flow issue: ensure `notes` is carried through at each normalization/mapping step.
- The `notes` field in the database is used for audit trail information (e.g., import reconciliation reasoning), so notes will primarily appear on imported PTO entries.
- The `escapeAttribute()` method in `pto-calendar` already handles HTML escaping for the note text in attributes.

## Questions and Concerns

1.
2.
3.

# Historic Import — Unapproved PTO Usability Fix

## Description

When historic PTO data is imported via the Excel import flow, the auto-approve logic correctly leaves entries that exceed annual PTO limits unapproved (e.g., borrowed PTO beyond the employee's first year of service). The corresponding month's calendar is locked because the data is historical — the event already happened and the employee's PTO balance was correctly deducted.

However, these unapproved entries currently surface on the **Admin PTO Request Queue** (`admin-pto-requests-page`) as actionable pending requests. The administrator cannot meaningfully approve or reject them: the month is locked, the time was already taken, and the balance is already reconciled. This creates noise in the queue and a confusing dead-end for administrators.

### Root Cause

The PTO Request Queue filters on `approved_by === null` to populate its card list. Historic import entries that violate policy (e.g., PTO borrowing) intentionally have `approved_by = null`, which causes them to appear as pending requests even though the calendar month is locked and no admin action is possible.

### Desired Outcome

1. **Remove powerless pending cards** — Historic imported entries in locked months should not appear as actionable requests in the PTO Request Queue.
2. **Preserve audit visibility** — Administrators still need to see that certain entries were not auto-approved due to policy violations, but this should be communicated via an indicator on the calendar or review page rather than a dead-end queue card.
3. **Distinguish "unapproved-but-reconciled" from "pending approval"** — Introduce a visual indicator so administrators can tell at a glance which PTO events were not approved due to historic policy violations versus which are genuinely awaiting action.

## Priority

🟡 Medium Priority

This is a usability improvement to the admin import workflow. It depends on the existing Excel Import Auto-Approve feature (`TASKS/excel-import-auto-approve.md`) which is already complete.

## Checklist

### Phase 1: Analysis & Design

- [x] Audit `admin-pto-requests-page/index.ts` and `pto-request-queue` to confirm how `approved_by === null` entries are filtered into the queue
- [x] Audit the calendar lock logic to determine how locked months are identified (e.g., `acknowledgements` table, month lock status)
- [x] Define the criteria for "unapproved-but-reconciled" entries (locked month + `approved_by === null` + historic import origin)
- [x] Choose a visual indicator approach — **"†" footnote badge in top-right corner** (see Visual Indicator Design section)
- [x] **Validation**: Design documented, no code changes yet

### Phase 2: Server — Filter or Annotate Historic Unapproved Entries

- [x] Cross-reference unapproved entries against locked months (where `acknowledgedByAdmin === true`) on the server or in the queue loader
- [x] Completely exclude entries in locked months from the pending queue — do not render them at all
- [x] If a month is later unlocked (un-acknowledged), its unapproved entries must re-appear in the queue as actionable items
- [x] **Validation**: `pnpm run build` passes, unapproved entries in locked months no longer appear in queue

### Phase 3: Client — Visual Indicator for Unapproved Historic PTO

- [x] Implement the chosen visual indicator on the calendar component for PTO events that are unapproved but in a locked/reconciled month
- [x] Ensure the indicator is distinct from the "pending approval" styling used for active requests
- [x] Add a tooltip or accessible label explaining the indicator meaning (e.g., "This PTO entry was not auto-approved due to a policy violation but the month has been reconciled")
- [x] Respect `prefers-reduced-motion` if the indicator involves animation
- [x] **Validation**: Manual testing — imported historic data with policy violations shows indicator on calendar, does not appear in queue

> **Finding (2026-03-01): The "†" reconciled indicator was unreachable on the admin-monthly-review page.**
> The `admin-monthly-review` page only renders employee cards for **pending** (unacknowledged) months (`!emp.acknowledgedByAdmin`). However, `reconciledDates` was only populated when `isAcknowledged()` returned `true`. These two conditions were mutually exclusive on that page.
>
> **Fix (2026-03-01): Enabled "†" indicator on admin-pto-requests-page inline calendars.**
> When an admin opens an employee's inline calendar from the PTO Request Queue and navigates to a past month, the page now fetches admin-acknowledgement status for that employee via `GET /admin-acknowledgements/:employeeId`. If the navigated month is acknowledged (locked), `pto-request-queue.setCalendarEntries()` sets `reconciledDates` and `reconciledTooltips` on the calendar, making "†" visible on unapproved entries in locked months. The note indicator (`▾`) remains the primary indicator on the admin-monthly-review page where the admin reviews unacknowledged months.

### Phase 4: Admin Monthly Review Integration

- [x] On the admin monthly review page, surface unapproved-but-reconciled entries as informational notes (not action items)
- [x] Ensure `employeeAckNote` or a similar field communicates the policy violation context
- [x] **Validation**: Monthly review page shows clear context for unapproved historic entries

### Phase 5: Testing & Quality Gates

- [x] Write Vitest unit tests for the filtering/annotation logic (entries in locked months excluded from queue)
- [x] Write Vitest unit tests for the visual indicator rendering
- [x] Update existing `admin-pto-requests-page` tests to cover the new filtering behavior
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes
- [ ] Manual testing: import historic data with PTO violations, verify queue is clean, verify "†" indicator appears on locked-month calendars in PTO Request Queue, verify note indicator (`▾`) shows on admin-monthly-review
- [ ] E2E test: import flow does not leave dead-end cards in the PTO Request Queue

## Implementation Notes

- The existing `excel-import-auto-approve` feature already records policy violations in the PTO entry `notes` field and annotates acknowledgements — leverage this metadata for the visual indicator.
- The calendar lock status is determined by the `acknowledgements` table (`acknowledgedByAdmin` flag). Entries in months where `acknowledgedByAdmin === true` should be treated as reconciled.
- The `SYS_ADMIN_EMPLOYEE_ID` (0) constant in `shared/businessRules.ts` is used for auto-approved entries. Entries with `approved_by === null` that are in a locked month were intentionally left unapproved by the import logic.
- Follow CSS Animation Policy if adding any animated indicators — use only `transform`, `opacity`, or `filter` properties, respect `prefers-reduced-motion`.
- Use design tokens from `tokens.css` for all indicator colors and spacing.

## Visual Indicator Design (Chosen: Footnote Badge)

Display a **"†" character in the top-right corner** of unapproved-but-reconciled PTO day cells on the calendar. This occupies the space where an approved entry would show a green checkmark — since the entry is unapproved, the checkmark is absent and the "†" fills the same position to signal "borrowed time, not approved." Use `var(--color-warning)` for the badge color. No opacity reduction — keep the cell at full opacity to avoid confusion with disabled states. A tooltip on hover provides the violation context from the entry's `notes` field.

## Questions and Concerns

1. ~~Should unapproved-but-reconciled entries be completely hidden from the PTO Request Queue, or should they appear in a separate "Informational" section with no approve/reject buttons?~~ **Decision: Hide them completely.** There is no reason for the admin to see these in the queue.
2. ~~If a previously locked month is later unlocked (e.g., admin un-acknowledges it), should the unapproved entries re-appear in the PTO Request Queue as actionable items?~~ **Decision: Yes.** If a month is unlocked, the entries become actionable again.
3. ~~Are there cases where an administrator would legitimately want to retroactively approve a historic policy-violating entry?~~ **Decision: No.** Once the admin locks the month, it is final — like a posted general ledger entry. There is no do-over.

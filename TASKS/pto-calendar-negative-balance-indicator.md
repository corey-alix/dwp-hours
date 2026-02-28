# PTO Calendar Negative Balance Indicator

## Description

Add a visual warning indicator to the employee PTO calendar when a scheduled (or about-to-be-scheduled) PTO entry would cause a negative balance or exceed the annual limit for its PTO type. A red "!" badge appears in the **bottom-left corner** of the affected day cell at `--font-size-xxs`, giving employees immediate feedback that a day exceeds their available time off.

### Affected PTO Types

| PTO Type    | Overuse Condition                                     |
| ----------- | ----------------------------------------------------- |
| PTO         | Cumulative PTO usage exceeds available PTO balance    |
| Sick        | Cumulative sick hours exceed 24 h annual limit        |
| Bereavement | Cumulative bereavement hours exceed 16 h annual limit |
| Jury Duty   | Cumulative jury duty hours exceed 24 h annual limit   |

### Policy Reference

From PTO-WORKFLOW.md §Carryover & Termination:

> **After first year**: PTO borrowing is not permitted. The system will flag entries that would cause a negative balance.

## Priority

🟡 Medium Priority — Enhances core scheduling UX; depends on existing PTO balance calculations and calendar rendering.

## Checklist

### Phase 1 — Shared Balance-Check Utility

- [ ] Add a pure function in `shared/businessRules.ts` (or a new `shared/balanceCheck.ts`) that, given an ordered list of PTO entries, their type, and the type's annual limit, returns the set of entry dates that cause the running total to exceed the limit
- [ ] Cover PTO (uses `availablePTO` from status), Sick (24 h), Bereavement (16 h), Jury Duty (24 h)
- [ ] Unit tests in `tests/` for each PTO type, including edge cases: exactly at limit, first entry over limit, multiple partial-day entries crossing the threshold
- [ ] `pnpm build` and `pnpm lint` pass

### Phase 2 — Calendar Component Integration

- [ ] Extend `pto-calendar` component to accept balance/limit data (e.g. a `balanceLimits` property or attributes for each type's remaining hours)
- [ ] In `renderDayCell()`, call the shared utility to determine whether the current cell's entry pushes the running total over the limit
- [ ] Render a `<span class="overuse-indicator">!</span>` inside the day cell (bottom-left, `position: absolute`) when the balance check fails
- [ ] Ensure the indicator updates reactively when:
  - The user selects/deselects cells (pending selections)
  - PTO type changes via the legend
  - PTO entries are added or removed externally
- [ ] `pnpm build` and `pnpm lint` pass

### Phase 3 — CSS Styling

- [ ] Add `.overuse-indicator` rule in `client/components/pto-calendar/css.ts`:
  - `position: absolute; bottom: 2px; left: 2px;`
  - `font-size: var(--font-size-xxs);`
  - `color: var(--color-danger)` (or `var(--color-error)` — whichever token exists)
  - `font-weight: var(--font-weight-bold);`
  - `line-height: 1;`
- [ ] Respect `@media (prefers-reduced-motion: reduce)` — no animation on the indicator
- [ ] Verify the indicator does not overlap the `.checkmark` (top-right), `.note-indicator` (top area), or `.hours` (bottom-right)
- [ ] Visual check in both light and dark themes
- [ ] `pnpm lint:css` passes (if applicable to `css.ts` template strings)

### Phase 4 — Submit-Time-Off Page Wiring

- [ ] In `client/pages/submit-time-off-page`, pass balance/status data to the `pto-calendar` component so the indicator can compute overuse
- [ ] Ensure `updateBalanceSummary()` keeps the calendar's balance data in sync after each API response
- [ ] Manual test: select a PTO type, schedule enough days to exceed the limit, confirm "!" appears on the day that crosses the threshold and all subsequent days

### Phase 5 — Unit & Integration Tests

- [ ] Vitest: `renderDayCell` produces `overuse-indicator` element when balance is negative
- [ ] Vitest: indicator absent when balance is positive
- [ ] Vitest: indicator updates after toggling a selected cell off (balance restored)
- [ ] Vitest: indicator works for each PTO type (PTO, Sick, Bereavement, Jury Duty)
- [ ] `pnpm build` and `pnpm lint` pass

### Phase 6 — E2E Tests & Documentation

- [ ] Playwright E2E: log in as employee, schedule PTO entries until balance is exceeded, assert `.overuse-indicator` is visible on the correct day cells
- [ ] Update `client/components/pto-calendar/README.md` visual-indicators table with the new "!" indicator
- [ ] Update PTO-WORKFLOW.md if any policy clarification is needed
- [ ] Manual testing of full flow
- [ ] `pnpm build` and `pnpm lint` pass

## Implementation Notes

- The existing `renderDayCell()` method already positions elements absolutely inside `.day` cells (`.checkmark` top-right, `.hours` bottom-right, `.note-indicator` top area). The overuse indicator occupies the **bottom-left** corner, which is currently unused.
- Balance data is already fetched via the PTO status API (`/api/pto/status/:employeeId`) and used by `month-summary`. The same data can be forwarded to the calendar.
- The indicator must account for **pending selections** (cells the user has selected but not yet submitted) in addition to already-persisted entries, so the running-total computation should merge both sources.
- For PTO type, the limit is dynamic (based on accrual + carryover); for Sick/Bereavement/Jury Duty the limits are static constants from `BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS`.
- The computation should walk entries in **date order** so the "!" appears on the _first_ day that crosses the threshold and all days after it, giving the employee a clear signal of where the overuse begins.
- Keep business logic in `shared/` so server-side import validation can reuse the same check in the future.

## Questions and Concerns

1.
2.
3.

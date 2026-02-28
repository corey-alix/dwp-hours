# PTO Calendar Negative Balance Indicator

## Description

Add a visual warning indicator to the employee PTO calendar when a scheduled (or about-to-be-scheduled) PTO entry would cause a negative balance or exceed the annual limit for its PTO type. A red "!" badge appears in the **bottom-left corner** of the affected day cell at `--font-size-xxs`, giving employees immediate feedback that a day exceeds their available time off.

### Affected PTO Types

| PTO Type    | Overuse Condition                                                                           |
| ----------- | ------------------------------------------------------------------------------------------- |
| PTO         | Cumulative PTO usage exceeds accrued PTO balance (carryover + accruals through entry month) |
| Sick        | Cumulative sick hours exceed 24 h annual limit                                              |
| Bereavement | Cumulative bereavement hours exceed 16 h annual limit                                       |
| Jury Duty   | Cumulative jury duty hours exceed 24 h annual limit                                         |

### Policy Reference

From PTO-WORKFLOW.md §Carryover & Termination:

> **After first year**: PTO borrowing is not permitted. The system will flag entries that would cause a negative balance.

## Priority

🟡 Medium Priority — Enhances core scheduling UX; depends on existing PTO balance calculations and calendar rendering.

## Checklist

### Phase 1 — Shared Balance-Check Utility

- [x] Add a pure function in `shared/businessRules.ts` (or a new `shared/balanceCheck.ts`) that, given an ordered list of PTO entries, their type, and the type's annual limit, returns the set of entry dates that cause the running total to exceed the limit
- [x] Cover PTO (uses `availablePTO` from status), Sick (24 h), Bereavement (16 h), Jury Duty (24 h)
- [x] Unit tests in `tests/` for each PTO type, including edge cases: exactly at limit, first entry over limit, multiple partial-day entries crossing the threshold
- [x] `pnpm build` and `pnpm lint` pass

### Phase 2 — Calendar Component Integration

- [x] Extend `pto-calendar` component to accept balance/limit data (e.g. a `balanceLimits` property or attributes for each type's remaining hours)
- [x] In `renderDayCell()`, call the shared utility to determine whether the current cell's entry pushes the running total over the limit
- [x] Render a `<span class="overuse-indicator">!</span>` inside the day cell (bottom-left, `position: absolute`) when the balance check fails
- [x] Ensure the indicator updates reactively when:
  - The user selects/deselects cells (pending selections)
  - PTO type changes via the legend
  - PTO entries are added or removed externally
- [x] `pnpm build` and `pnpm lint` pass

### Phase 3 — CSS Styling

- [x] Add `.overuse-indicator` rule in `client/components/pto-calendar/css.ts`:
  - `position: absolute; bottom: 2px; left: 2px;`
  - `font-size: var(--font-size-xxs);`
  - `color: var(--color-danger)` (or `var(--color-error)` — whichever token exists)
  - `font-weight: var(--font-weight-bold);`
  - `line-height: 1;`
- [x] Respect `@media (prefers-reduced-motion: reduce)` — no animation on the indicator
- [x] Verify the indicator does not overlap the `.checkmark` (top-right), `.note-indicator` (top area), or `.hours` (bottom-right)
- [ ] Visual check in both light and dark themes
- [x] `pnpm lint:css` passes (if applicable to `css.ts` template strings)

### Phase 4 — Submit-Time-Off Page Wiring

- [x] In `client/pages/submit-time-off-page`, pass balance/status data to the `pto-calendar` component so the indicator can compute overuse
- [x] Ensure `updateBalanceSummary()` keeps the calendar's balance data in sync after each API response
- [ ] Manual test: select a PTO type, schedule enough days to exceed the limit, confirm "!" appears on the day that crosses the threshold and all subsequent days

### Phase 5 — Unit & Integration Tests

- [x] Vitest: `renderDayCell` produces `overuse-indicator` element when balance is negative
- [x] Vitest: indicator absent when balance is positive
- [x] Vitest: indicator updates after toggling a selected cell off (balance restored)
- [x] Vitest: indicator works for each PTO type (PTO, Sick, Bereavement, Jury Duty)
- [x] `pnpm build` and `pnpm lint` pass

### Phase 6 — E2E Tests & Documentation

- [ ] Playwright E2E: log in as employee, schedule PTO entries until balance is exceeded, assert `.overuse-indicator` is visible on the correct day cells
- [ ] Update `client/components/pto-calendar/README.md` visual-indicators table with the new "!" indicator
- [ ] Update PTO-WORKFLOW.md if any policy clarification is needed
- [ ] Manual testing of full flow
- [ ] `pnpm build` and `pnpm lint` pass

### Phase 7 — Overuse Indicator Explanation (Tooltip / Hover Feedback)

- [x] In `renderDayCell()`, when the overuse indicator is rendered, set a `title` attribute on the `<span class="overuse-indicator">` with an explanatory message (e.g. "You have accrued X hours but scheduled Y through this date")
- [x] The tooltip should include the accrued hours through the entry's month and the scheduled hours through that date, so the user can see the specific mismatch
- [x] Extend `pto-calendar` to receive accrual data (or a precomputed tooltip map `Map<string, string>`) alongside `overuseDates` so it can populate per-day messages
- [x] For Sick/Bereavement/Jury Duty, the tooltip should read: "Exceeds annual X limit — Y of Z hours used" (flat cap, no accrual concept)
- [x] Unit test: verify `title` attribute is set on the overuse indicator element with the expected message
- [x] `pnpm build` and `pnpm lint` pass

## Implementation Notes

### Architecture: Observable Temporal Balance Model

The overuse indicator requires an **observable model** that computes an employee's running PTO balance on any given day of the year. The model is seeded from database/API state and mutated by user interaction. Views subscribe to it and re-render when changes affect their date range.

#### The model: `PtoBalanceModel`

A single instance lives in `pto-entry-form`. It holds:

| Field               | Source                                             | Mutated by                    |
| ------------------- | -------------------------------------------------- | ----------------------------- |
| `beginningBalance`  | `annualAllocation + carryover` from PTO status API | — (immutable for the session) |
| `monthlyAccruals`   | Array of `{ month, hours }` from PTO status API    | — (immutable)                 |
| `persistedEntries`  | Full year's PTO entries from `GET /api/pto`        | API refresh after submit      |
| `pendingSelections` | All calendars' `_selectedCells` merged             | User clicks (any calendar)    |

The model exposes a **pure computation**: for a given date, walk entries in date order:

```
balance(date) = beginningBalance
              + sum(accruals for months ≤ date.month)
              - sum(hours of persisted + pending entries with entry.date ≤ date)
```

And the key output: `getOveruseDates(): Set<string>` — the set of dates where the running balance first goes negative (and all subsequent dates of that type). This reuses the existing `getOveruseDates()` pure function from `shared/businessRules.ts`, but the limit passed in is now the **total annual budget** (beginning balance + full year accruals) and the entry list is the merged year-wide list.

> **Correction**: For Sick/Bereavement/Jury Duty the limit is a simple static cap (24h/16h/24h). The temporal accrual model only applies to the PTO type. The model handles both: PTO uses the accrual-aware computation; other types use their flat annual cap.

#### Mutation → event → view update

1. **User clicks a day cell** → `pto-calendar` updates its own `_selectedCells` and fires `selection-changed` (existing behavior, unchanged).
2. **`pto-entry-form` receives `selection-changed`** → collects all calendars' `selectedCells` + `ptoEntries` → updates the model's `pendingSelections`.
3. **Model recomputes `getOveruseDates()`** → produces a new `Set<string>`.
4. **Form distributes the set** → iterates all calendars, sets `cal.overuseDates = newSet`.
5. **Each calendar re-renders affected days** → `overuseDates` setter compares old vs new set, calls `updateDay(date)` only for dates whose membership changed (entered or left the set). No full re-render needed.

#### What stays in `pto-calendar`

- `_overuseDates: Set<string>` — dumb render input, set externally.
- `overuseDates` setter — diffs old/new, calls `updateDay()` for changed dates only.
- `renderDayCell()` — reads `this._overuseDates.has(dateStr)`, unchanged.
- **Nothing else related to overuse** — no `recomputeOveruseDates()`, no `_balanceLimits`, no `_yearPtoEntries`.

#### What moves to `pto-entry-form`

- `_balanceLimits: BalanceLimits` — owned here, set by `submit-time-off-page`.
- `_monthlyAccruals: { month, hours }[]` — from PTO status API.
- `recomputeOveruseDates()` — collects all state, calls the shared function, distributes results.

#### Seed & refresh lifecycle

- **Page load**: `submit-time-off-page` fetches PTO status → passes `annualAllocation`, `carryover`, `monthlyAccruals`, and balance limits to the form. Form fetches PTO entries → seeds the model. Initial `getOveruseDates()` runs → calendars get their initial `overuseDates`.
- **After successful submit**: entries are re-fetched, model is re-seeded, overuse is recomputed, calendars update.

### Rendering notes

- The existing `renderDayCell()` method already positions elements absolutely inside `.day` cells (`.checkmark` top-right, `.hours` bottom-right, `.note-indicator` top area). The overuse indicator occupies the **bottom-left** corner, which is currently unused.
- Keep the `getOveruseDates()` pure function in `shared/businessRules.ts` so server-side import validation can reuse the same check in the future.

## Questions and Concerns

Resolved:

1. **Per-calendar approach is fundamentally flawed** — calendars cannot see sibling pending selections. Fixed by lifting computation to the form.
2. **Computation lives in `pto-entry-form`** — single source of truth, distributes `Set<string>` to calendars.
3. **Calendar becomes a pure view** — only `_overuseDates` + `overuseDates` setter + `renderDayCell` check remain.
4. **Single-calendar mode** — form owns computation in both modes for consistency. ✓ Confirmed.
5. **Performance** — negligible cost. ✓ Confirmed.
6. **Event flow** — same `handleSelectionChanged` handler. ✓ Confirmed.

Open:

7. **Monthly accrual helper stays in `pto-entry-form`.** It's not shared with the server, so it lives inline in the form's recompute method rather than `shared/`. The form computes the effective PTO limit at each entry's date as `beginningBalance + sum(accruals[1..entryMonth])` and passes type-specific limits to `getOveruseDates()`. The pure `getOveruseDates()` function in `shared/businessRules.ts` remains unchanged — it still takes a flat `BalanceLimits` object. The accrual-aware wrapping is the form's responsibility.
8. **Standard `requestUpdate()` for re-rendering.** Per the web-components-assistant architecture, `pto-calendar` is a BaseComponent and uses `requestUpdate()` as the sole re-render trigger. No custom diff logic. The `overuseDates` setter stores the new `Set<string>` in the view-model field and calls `requestUpdate()`. The `render()` method is a pure function of the view-model. This is consistent with how all other complex-value setters on the calendar work (`ptoEntries`, `selectedCells`, etc.).

## Known Bugs

### Bug 2: Space-key cell selection causes full re-render and focus loss

**Observed**: Pressing `<Space>` on a focused calendar day cell toggles the selection correctly, but the calendar immediately re-renders the entire shadow DOM. This destroys the previously focused `<div class="day">` element, moving browser focus to `<body>`. Subsequent `<Space>` presses scroll the page instead of toggling the next cell.

**Root cause**: The event chain is:

1. `handleGridKeyDown` → `toggleDaySelection(date)` → `updateDay(date)` (targeted, preserves DOM) → `restoreFocusFromViewModel()` (restores focus) → `notifySelectionChanged()`
2. `selection-changed` bubbles to `pto-entry-form` → `updateModelPendingSelections()` → `PtoBalanceModel.setPendingSelections()` → `recompute()` → `Observable.set(newOveruseDates)` → subscriber fires
3. Subscriber: `cal.overuseDates = overuseDates` → setter calls `this.requestUpdate()` → **full shadow DOM re-render** (`shadowRoot.innerHTML = ...`)
4. The full re-render destroys the focused cell created in step 1. Focus falls to `<body>`.

The `restoreFocusFromViewModel()` call in step 1 already executed before the destructive re-render in step 3, so focus is not recovered. The `update()` override does call `restoreFocusFromViewModel()` again, but `_lastFocusArea` was already cleared to `null` in step 1, so the second call is a no-op.

**Suggested fix**: Replace `requestUpdate()` in the `overuseDates` setter with targeted `updateDay()` calls for only the dates whose overuse membership changed. This avoids a full re-render entirely:

```typescript
set overuseDates(value: Set<string>) {
  const prev = this._overuseDates;
  this._overuseDates = value;

  // Targeted updates for changed dates only — avoids full re-render
  // which would destroy focused elements and break keyboard navigation.
  for (const date of prev) {
    if (!value.has(date)) this.updateDay(date);
  }
  for (const date of value) {
    if (!prev.has(date)) this.updateDay(date);
  }
}
```

This is the approach originally described in the Implementation Notes ("overuseDates setter compares old vs new set, calls updateDay(date) only for dates whose membership changed") but was overridden by Q&A item #8's recommendation to use `requestUpdate()`. Item #8 is incorrect for this property — the calendar's `updateDay()` targeted-update mechanism exists precisely to avoid full re-renders during interactive editing.

**Status**: ✅ Fixed — `overuseDates` setter now diffs old/new sets and calls `updateDay()` for changed dates only.

### Bug 3: Persisted entries span all years — immediate false-positive "!" on first click

**Observed**: User "Corey Alix" opens `/submit-time-off` for February 2026. The balance summary shows PTO=189, Sick=24, etc. Clicking on Feb 2, 2026 immediately shows a "!" overuse indicator in the bottom-left corner — despite having 189 hours available.

**Root cause**: Two compounding data-flow issues inflate the running total past the budget:

1. **`GET /api/pto` returns entries from ALL years, not just the current year.**
   The route loader in `client/router/routes.ts` calls `api.getPTOEntries()` which hits `GET /api/pto` with no date filter (`server/server.mts` line 2171). The server query is `{ employee_id: authenticatedEmployeeId }` — no year constraint. All historic PTO entries (2018, 2019, … 2025, 2026) are returned and passed to `form.setPtoData(entries)`, which seeds the balance model via `_model.setPersistedEntries(entries)`.

2. **The balance model's `recompute()` accumulates ALL persisted entries against the current-year budget.**
   `getOveruseDates()` in `shared/businessRules.ts` groups entries by type, sorts by date, and walks them in order, accumulating a running total against the type limit. With multi-year entries, the running total for PTO quickly exceeds the current-year budget (e.g. 378.54 = `annualAllocation + carryover`) — so even the very first 2026 entry crosses the threshold and gets a "!" indicator.

3. **The PTO limit itself is inflated by double-counting.**
   `updateCalendarBalanceLimits()` in `submit-time-off-page/index.ts` passes `PTO: status.annualAllocation + status.carryoverFromPreviousYear` as the limit, and separately passes the same value as `beginningBalance` plus the `monthlyAccruals` array. `computeAccrualAwarePtoLimit()` in the balance model then adds `beginningBalance + sum(monthlyAccruals)`, producing a limit of ~378 instead of ~189. The annual allocation is being counted twice: once as the flat limit and once via monthly accruals.

**The design is over-engineered for the actual business rule.** The employee record already has `carryover_hours` which is reset at the start of each year. The correct overuse computation for PTO is:

```
overuse(date) = carryover_hours
              + sum(monthly accruals for months 1..date.month)
              - sum(PTO hours for current-year entries with entry.date ≤ date)
              < 0
```

For Sick/Bereavement/Jury Duty, it's just `sum(current-year entries of that type) > annual_cap`.

**Two fixes required:**

1. **Filter entries to current year.** Either:
   - (a) Add a year filter to `GET /api/pto` (e.g. `?startDate=2026-01-01&endDate=2026-12-31`), or
   - (b) Filter in `setPtoData()` / `setPersistedEntries()` before seeding the model.

2. **Fix the PTO limit double-counting.** The `beginningBalance` should be `carryoverFromPreviousYear` only (not `annualAllocation + carryover`), since the monthly accruals already represent the annual allocation spread across months. Alternatively, pass `annualAllocation + carryover` as a flat limit and don't add accruals on top.

**Status**: ✅ Fixed — (1) `beginningBalance` changed to `carryoverFromPreviousYear` only; (2) entries filtered to current year before seeding the balance model.

### Issue 4: Overuse indicator lacks explanation — user cannot understand why "!" appears

**Observed**: User "Corey Alix" opens `/submit-time-off` for February 2026. The balance summary shows PTO=189 (annual allocation), but accrued YTD is only ~30h (carryover=0, accrual rate 0.71 hrs/day). Clicking on Feb 2, 3, 4, 5 (4 days × 8h = 32h) correctly triggers "!" overuse indicators because 32h > ~30h accrued. However, the user sees PTO=189 and expects 189 − 32 > 0, so the indicator is confusing without context.

**The accrual-aware limit is correct behavior.** The indicator reflects that the employee has scheduled more PTO than they have accrued to date — even though 189h is allocated for the full year, only ~30h has been earned through February. This is the intended "no borrowing" policy.

**What's missing**: The "!" indicator has no tooltip, hover state, or click feedback explaining _why_ the day is flagged. The user needs a message like:

> "You have accrued 30 hours but scheduled 32 hours through this date."

or:

> "Exceeds accrued PTO — you have earned X hours through this month but scheduled Y."

**Fix**: Add a `title` attribute (tooltip) to the `.overuse-indicator` span — or a click/hover popover — that explains the accrual vs. scheduled mismatch. See Phase 7 checklist.

**Status**: ✅ Fixed — Phase 7 implemented: `title` attribute on overuse indicator shows accrued vs. scheduled for PTO and annual-cap message for other types.

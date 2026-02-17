# PTO Accrual Card Fixes

## Description

Address four issues in the `pto-accrual-card` component and its test harness related to business rule usage, calendar interactivity, keyboard navigation, and an off-by-one month rendering bug.

### Issues

1. **Test harness should use `businessRules.ts` for PTO status computation** — The test file (`client/components/pto-accrual-card/test.ts`) manually computes `ptoStatus` (annual limits, used hours, remaining balances) with inline constants. These values should be derived from `shared/businessRules.ts` (e.g., `computeEmployeeBalanceData`, `BUSINESS_RULES_CONSTANTS`) to stay consistent with server-side logic.

2. **Calendar is always readonly in test** — The test harness always sets `readonly` on the slotted `<pto-calendar>` unless `requestMode` is active. Users should be able to interact with the calendar (select cells, toggle PTO type) in the playground without requiring request mode.

3. **Arrow key navigation for accrual rows** — Currently each accrual row (month) is a tab stop, forcing the user to tab through all 12 months to reach content below. The rows should instead be navigable with arrow keys (Up/Down), with the entire list treated as a single tab stop using the roving tabindex pattern.

4. **Off-by-one month in calendar rendering** — Clicking "April" in the accrual card shows the March calendar. The `month-selected` event handler in `test.ts` sets `calendar.setAttribute("month", String(month - 1))`, converting the 1-based month to 0-based. If the calendar component already expects or internally adjusts for 1-based values, this subtraction causes the display to be one month behind.

5. **Inline calendar after accrual row** — The `<pto-calendar>` should render directly after the selected accrual row instead of after the entire card. This enables a fast keyboard workflow: arrow down through months, press Enter to expand the calendar inline, Tab into the calendar, Tab back, Enter on the next row — allowing rapid month-by-month review without scrolling away from context.

6. **Focus lost on calendar-button activation** — When pressing Enter on a `.calendar-button` (or activating an accrual row), focus is lost after re-render. Focus should be restored to the same `.calendar-button` or accrual row that was activated.

7. **Tab through calendar via calendar-button bookends** — After opening a calendar inline, the tab flow should be: calendar-button[N] (entry) → calendar dates → calendar legend → calendar-button[N+1] (exit) → out of component. All `.calendar-button` elements default to `tabindex="-1"`. When month N is selected, button[N] and button[N+1] (if it exists) are promoted to `tabindex="0"`. The accrual rows themselves remain navigable only via arrow keys (roving tabindex on `.accrual-row.data-row`). The `_focusedRowIndex` tracks the _current_ activated row (not the next).

8. **Toggle calendar visibility** — Activating a row that already has its calendar open should hide the calendar (toggle behavior). Currently once the calendar is shown it cannot be hidden.

9. **Animate calendar slot expand/collapse** — When a calendar is open for month N and the user tabs past it to month N+2 and activates that row, the old calendar collapses instantly (rows shift up) and the new calendar appears below the new row. Because the collapse and expand happen in the same render, rows above the new selection jump upward while the calendar pops in below — this is visually jarring. A slide-open animation on `.calendar-slot-row` would give the user a clear visual cue that content was inserted, keeping them oriented.

   **Suggested approach — CSS `grid-template-rows` transition**:
   - Wrap the `<slot name="calendar">` in `.calendar-slot-row` and use `display: grid; grid-template-rows: 0fr;` (collapsed) transitioning to `grid-template-rows: 1fr;` (expanded) with `transition: grid-template-rows 250ms ease-out`.
   - The inner child gets `overflow: hidden; min-height: 0;` so it collapses to zero height.
   - On render, add a `.open` class to `.calendar-slot-row` after a microtask or `requestAnimationFrame` so the transition triggers.
   - Optionally also `scrollIntoView({ behavior: "smooth", block: "nearest" })` the activated row after the calendar opens, so the row + calendar are both in view.
   - This approach is pure CSS (no JS height measurement), works with unknown calendar heights, and is `prefers-reduced-motion` friendly (`@media (prefers-reduced-motion: reduce) { .calendar-slot-row { transition: none; } }`).

## Priority

🟢 Low Priority (Frontend/UI polish)

## Checklist

### Phase 1: Use `businessRules.ts` in Test Harness

- [x] Replace inline annual limit constants in `test.ts` with values from `BUSINESS_RULES_CONSTANTS`
- [x] Use `computeEmployeeBalanceData()` to compute PTO balance/status for the test employee
- [x] Remove duplicated limit values (24 for Sick, 40 for Bereavement/Jury Duty, etc.)
- [ ] Verify the test playground renders the same data as before (manual)
- [ ] `pnpm run build` passes

### Phase 2: Allow Calendar Interaction in Test

- [x] Default the slotted `<pto-calendar>` to edit mode (non-readonly) — no toggle needed
- [x] Ensure users can interact with the calendar (cell selection, PTO type toggle) in the playground
- [ ] Verify `pto-request-submit` events still propagate correctly when in request mode
- [ ] Manual testing of calendar interactivity in playground
- [ ] `pnpm run build` passes

### Phase 3: Arrow Key Navigation for Accrual Rows

- [x] Implement roving tabindex pattern for `.accrual-row.data-row` elements
- [x] Only the focused row should have `tabindex="0"`; all others should have `tabindex="-1"`
- [x] Arrow Up/Down moves focus between months
- [x] Home/End keys jump to first/last month
- [x] Arrow keys wrap around (December ↓ → January, January ↑ → December)
- [x] Enter/Space activates the row (opens calendar for that month)
- [x] Add `role="listbox"` to the grid container and `role="option"` to each row (or equivalent ARIA)
- [x] Ensure the calendar button within each row remains separately focusable if needed
- [ ] Manual keyboard navigation testing
- [ ] `pnpm run build` and `pnpm run lint` pass

### Phase 4: Fix Off-by-One Month Bug

- [x] Investigate whether `pto-calendar` `month` attribute is 0-based or 1-based
- [x] Fix the `month-selected` event handler in `test.ts` to pass the correct month value
- [x] Fix the same off-by-one bug in production usage (e.g., `pto-request-page` or other consumers)
- [ ] Verify clicking each month label shows the correct calendar month
- [ ] Manual testing across boundary months (January, December)
- [ ] `pnpm run build` passes

### Phase 5: Inline Calendar After Accrual Row & Tab Bookend Buttons

- [x] Move the `<slot name="calendar">` to render directly after the selected accrual row (inside `.accrual-grid` via `.calendar-slot-row`)
- [x] Toggle: activating an already-selected row sets `selectedMonth = null` to hide the calendar
- [x] Focus restoration: `_pendingFocusMonth` + `update()` override restores focus after re-render
- [x] Calendar buttons: all `.calendar-button` elements render with `tabindex="-1"` by default
- [x] When `selectedMonth === N`: button[N] gets `tabindex="0"` (entry bookend), button[N+1] gets `tabindex="0"` (exit bookend, if exists)
- [x] `_focusedRowIndex` tracks the activated row (month - 1), NOT the next row
- [x] Tab flow: row (Enter opens calendar) → Tab → button[N] → Tab → calendar → Tab → button[N+1] → Tab → out
- [ ] Verify the keyboard workflow: Arrow ↓, Enter, Tab, Tab through calendar, Tab, out
- [ ] Manual testing of focus restoration
- [ ] `pnpm run build` passes

### Phase 6: Animate Calendar Expand/Collapse

- [x] Add `grid-template-rows` transition to `.calendar-slot-row` (`0fr` → `1fr`, ~250ms ease-out)
- [x] Inner child of `.calendar-slot-row` gets `overflow: hidden; min-height: 0` (via `::slotted(*)`)
- [x] After render, add `.open` class via `requestAnimationFrame` to trigger the CSS transition
- [x] Add `@media (prefers-reduced-motion: reduce)` override to disable animation
- [x] Call `scrollIntoView({ behavior: "smooth", block: "nearest" })` on the activated row after focus restore
- [ ] Manual testing: open month, tab past calendar, open a later month — verify smooth animation
- [x] `pnpm run build` passes

### Phase 7: Final Validation

- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual testing of all fixes together
- [ ] E2E tests still pass (if applicable)

## Implementation Notes

### Completed (Phases 1-4)

- **Phase 1 (Business Rules in test.ts)**: `test.ts` imports `computeEmployeeBalanceData` and `BUSINESS_RULES_CONSTANTS` from `shared/businessRules.ts`. Balance data is computed via `computeEmployeeBalanceData(1, employee.name, approvedSeedEntries)`. Limits use `BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK` (24) and `.OTHER` (40). No inline magic numbers remain.
- **Phase 2 (Calendar edit mode)**: `test.ts` sets `calendar.setAttribute("readonly", "false")` unconditionally (no toggle). The `pto-calendar` component's `isReadonly` getter returns `true` when attribute is `null` or anything other than `"false"`, so explicit `"false"` is required.
- **Phase 3 (Arrow key navigation)**: Roving tabindex on `.accrual-row.data-row` elements. Only `_focusedRowIndex` row has `tabindex="0"`, others are `-1`. ArrowUp/Down wraps. Home/End jumps. Enter/Space calls `activateRow()`. Grid has `role="listbox"`, rows have `role="option"` with `aria-selected`.
- **Phase 4 (Off-by-one fix)**: `pto-calendar` `month` attribute is **1-based** (its `renderCalendar()` uses `monthNames[this.month - 1]` and passes `this.month` to `getCalendarDates()` which expects 1-based months). Removed `month - 1` from both `test.ts` and `app.ts` `month-selected` handlers.

### Phase 5: Calendar-Button Bookend Tab Navigation (Current)

**Architecture**: The tab flow through the calendar is controlled by two "bookend" calendar buttons:

```
DOM order inside shadow root (.accrual-grid):
  row[1]  (.accrual-row, tabindex via roving — arrow keys only)
  row[2]  (.accrual-row, tabindex via roving)
  ...
  row[N]  (.accrual-row, tabindex="0" if focused)     ← user presses Enter here
    button[N] (.calendar-button, tabindex="0")         ← ENTRY bookend (Tab to reach)
  .calendar-slot-row                                   ← <slot name="calendar"> lives here
    <pto-calendar> (slotted, has its own tab stops)    ← Tab into calendar
  row[N+1] (.accrual-row, roving tabindex)
    button[N+1] (.calendar-button, tabindex="0")       ← EXIT bookend (Tab out of calendar lands here)
  row[N+2] (.accrual-row)
    button[N+2] (.calendar-button, tabindex="-1")      ← not in tab order
  ...
```

**Key implementation details in `index.ts`**:

1. **`renderMonthGrid()`**: Each `.calendar-button` gets its `tabindex` computed:
   - Default: `tabindex="-1"` (not in tab order)
   - If `this.selectedMonth === month`: `tabindex="0"` (entry bookend)
   - If `this.selectedMonth === month - 1`: `tabindex="0"` (exit bookend — button after the calendar)
   - For December (month 12) selected, there's no month 13 button, so only entry bookend exists

2. **`activateRow(row)`**: Sets `selectedMonth` (or toggles to `null`), sets `_focusedRowIndex = month - 1` (current row, not next), sets `_pendingFocusMonth = month` for focus restoration.

3. **`handleDelegatedClick()`**: Same toggle + focus logic for both `.calendar-button` clicks and `.accrual-row.data-row` clicks.

4. **`update()` override**: After `super.update()` (which re-renders), restores focus to `.accrual-row[data-month="N"]` using `_pendingFocusMonth` via `queueMicrotask`.

5. **Calendar slot placement**: In `renderMonthGrid()`, after each row, if `this.selectedMonth === month`, a `<div class="calendar-slot-row"><slot name="calendar"></slot></div>` is emitted. CSS: `.calendar-slot-row { grid-column: 1 / -1; }`.

6. **`month-selected` event dispatch**: In `render()`, if `selectedMonth` is set, filters `_ptoEntries` for that month and dispatches `month-selected` with `{ month, year, entries, requestMode }` via `queueMicrotask`. Consumers (test.ts and app.ts) create/update a `<pto-calendar>` element with `slot="calendar"` and append it to the card element in light DOM.

### Files Modified

- **`client/components/pto-accrual-card/index.ts`** — Component with roving tabindex, calendar-button bookends, toggle, focus restoration
- **`client/components/pto-accrual-card/test.ts`** — Test harness using businessRules.ts, `readonly="false"`, `month` (not `month - 1`)
- **`client/app.ts`** — Production `month-selected` handler: `month` (not `month - 1`), `readonly` set to `String(!requestMode)`

### Date Handling

- Per project rules, all date logic must go through `shared/dateUtils.ts` — do not use `new Date()` or native Date methods.

### Business Rules

- `BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK` = 24, `.OTHER` = 40
- `computeEmployeeBalanceData()` uses a hardcoded PTO limit of 80

## Questions and Concerns

1. Should the calendar default to interactive (non-readonly) mode, or should there be a toggle in the test UI?
   **Answer:** Edit mode by default, no toggle needed.
2. Does the off-by-one month bug affect the production app (e.g., `pto-request-page`) or only the test playground?
   **Answer:** Yes, it is also off by one in production.
3. Should arrow key navigation wrap around (December → January) or stop at boundaries?
   **Answer:** Yes, wrap around.

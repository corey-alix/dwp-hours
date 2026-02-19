# Live Summary Delta in PTO Scheduler

## Description

When a user is scheduling time in the `current-year-pto-scheduler` component, the month summary values (PTO, Sick, Bereavement, Jury Duty) should update live to reflect pending selections. Pending hours appear as a `+{n}` suffix next to the already-scheduled total, giving the user immediate feedback about what they're about to request.

**Example**: If 12 hours of PTO are already scheduled for July (8h on July 4th + 4h on July 3rd), and the user clicks July 3rd to change it from 4h to 8h (full day), the PTO summary displays `12+4` — 12 existing hours plus 4 additional pending hours.

## Priority

🟢 Low Priority (Frontend/UI Enhancement)

## Staged Action Plan

### Stage 1: PtoCalendar Event (Complete)

- [x] Add `notifySelectionChanged()` method to `PtoCalendar`
- [x] Dispatch `selection-changed` custom event (`bubbles: true`, `composed: true`) after every selection modification in `toggleDaySelection`
- [x] Dispatch on `clearSelection()` to reset pending state

### Stage 2: Scheduler Live Update (Complete)

- [x] Add `data-month` attribute to `.month-card` in `renderMonth`
- [x] Add `data-summary-type` attribute to `.summary-value` spans for DOM targeting
- [x] Listen for `selection-changed` events on shadowRoot in `connectedCallback`
- [x] Implement `handleSelectionChanged` to compute per-type deltas by comparing `getSelectedRequests()` against original `monthData.ptoEntries`
- [x] Update summary span innerHTML to `{existing}+{delta}` or `{existing}-{delta}` format
- [x] Apply/remove color CSS classes when pending values change the visual state

### Stage 3: Styling (Complete)

- [x] Add `.summary-pending` CSS class for `+N` portion (slightly smaller, slightly transparent)

### Stage 4: Validation

- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual testing: click days in scheduler, verify summary updates live
- [ ] Manual testing: cycle hours (8 → 4 → 0), verify delta adjusts
- [ ] Manual testing: clear selection / submit, verify delta resets
- [ ] Manual testing: select Work Day type, verify existing entries clear without delta display
- [ ] Run E2E tests for `component-pto-calendar.spec.ts`

### Stage 5: Edge Case - Unschedule Existing Entry (Complete)

- [x] Fix hour cycling for existing entries: when cycling to 0, keep `selectedCells.set(date, 0)` instead of deleting
- [x] Update `renderDayCell` to detect `isClearing` state (selected with 0h on existing entry)
- [x] Show ✕ indicator and line-through date for clearing state
- [x] Add `.clearing` and `.hours-clearing` CSS to pto-calendar
- [x] Verify `getSelectedRequests()` returns 0-hour entries for correct delta computation
- [x] Cycle now works: 8 → 4 → 0 (✕ clearing) → 8 → ...

### Stage 6: Future Enhancements

- [ ] Consider showing negative deltas when Work Day clears existing entries
- [ ] Consider animating the delta appearance/disappearance
- [ ] Consider adding a total row across all months

## Implementation Notes

- Delta is computed as `selectedHours - existingHours` for each selected cell, grouped by PTO type
- For new dates (no existing entry), delta equals the full selected hours
- For modified existing entries, delta equals the difference
- Work Day clearings currently remove from `_ptoEntries` directly and don't show as negative deltas (the selection is removed, not tracked)
- The `selection-changed` event is minimal (no payload) — the scheduler queries the calendar's `getSelectedRequests()` API on each change
- Summary DOM is updated directly (no full re-render) to preserve calendar interaction state

## Questions and Concerns

1.
2.
3.

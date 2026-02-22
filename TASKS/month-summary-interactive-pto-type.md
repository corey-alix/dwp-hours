# Interactive PTO Type Selection in Month Summary

## Description

Extend the `<month-summary>` component with an interactive mode that allows users to select the active PTO type by clicking a summary header (label). The active PTO type receives a green checkmark indicator (via `::after` pseudo-element) and slightly bolder/larger text, making it obvious which type is currently selected. This **replaces** the `<pto-calendar>` legend for PTO type selection in **both** single-calendar and multi-calendar modes.

**Current behavior:** In multi-calendar mode, `<pto-entry-form>` sets `hide-legend="true"` on each `<pto-calendar>`, so there is no UI for the user to switch the active PTO type. In single-calendar mode, the legend inside `<pto-calendar>` serves this role.

**Target behavior:** The `<month-summary>` labels (PTO, Sick, Bereavement, Jury Duty) become clickable when in interactive mode. Clicking a label sets it as the active PTO type, dispatches an event, and renders a green checkmark to the right of the label. One type is **always** active (no deselect/toggle — default is "PTO"). When the active PTO type changes, all pending scheduled dates switch to the newly selected type. The `<pto-calendar>` legend is hidden (`hide-legend="true"`) in both modes since `<month-summary>` now owns PTO type selection.

## Priority

🟢 Low Priority (Frontend/UI Enhancement)

## Checklist

### Stage 1 — Interactive mode for `<month-summary>`

Add an `interactive` attribute and `active-type` attribute to `<month-summary>`. When `interactive` is set, clicking a summary label selects that PTO type and renders a visual indicator on the active item.

- [x] Add `interactive` boolean attribute (observed) — when present, labels become clickable
- [x] Add `active-type` attribute (observed) — reflects the currently active PTO type (e.g., `"PTO"`, `"Sick"`, `"Bereavement"`, `"Jury Duty"`)
- [x] Add getter/setter pair for `interactive` and `activeType` properties
- [x] Render clickable labels with `cursor: pointer` and appropriate `role`/`aria-*` attributes when interactive
- [x] Add visual indicator for the active type: green checkmark (`✓`) via `::after` pseudo-element on `.summary-label`, plus slightly bolder/larger font on the active item
- [x] Implement `handleDelegatedClick` to detect clicks on `.summary-item` elements and update `active-type` (one type must always be active — clicking the already-active type is a no-op)
- [x] Dispatch a `pto-type-changed` custom event (bubbles, composed) with `detail: { type: string }` when the active type changes
- [x] Add `@media (prefers-reduced-motion: reduce)` consideration for any transition/animation on the indicator
- [x] Update [css.ts](../client/components/month-summary/css.ts) with styles for interactive state (`.summary-item.interactive`, `.summary-item.active`)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes
- [ ] Manual test in [test.html](../client/components/month-summary/test.html): clicking labels toggles active state and fires event

### Stage 2 — Wire `<pto-entry-form>` to use interactive `<month-summary>` in both modes

Connect the new interactive `<month-summary>` to `<pto-entry-form>` so that PTO type selection flows through the summary component in **both** single-calendar and multi-calendar modes. The `<pto-calendar>` legend is hidden in both modes.

- [x] In `rebuildCalendars()` multi-calendar branch: set `interactive` and `active-type="PTO"` on each `<month-summary>` instance
- [x] In `rebuildCalendars()` single-calendar branch: add a `<month-summary interactive active-type="PTO">` below the calendar (or reuse existing summary) and set `hide-legend="true"` on the calendar
- [x] Listen for `pto-type-changed` events on the shadow root and update `selectedPtoType` on all `<pto-calendar>` instances within the form
- [x] When `pto-type-changed` fires, update `active-type` on **all** `<month-summary>` instances to keep them in sync
- [x] When active PTO type changes, re-type all pending (uncommitted) selected cells to the new type — matching existing legend behavior
- [x] **Bug fix**: Recalculate month-summary deltas in `handlePtoTypeChanged` after re-typing — previously deltas were stale after a PTO type switch
- [x] **Bug fix**: Handle `selection-changed` events in single-calendar mode — previously only multi-calendar mode updated the month-summary deltas
- [x] **Bug fix**: Preserve pending selected cells across view-mode switches — added `selectedCells` setter on `<pto-calendar>`, `collectSelectedCells()` on `<pto-entry-form>`, and restore logic in `rebuildCalendars()`
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual test: in both single and multi-calendar modes, clicking a month-summary label changes the active PTO type

### Stage 3 — Wire `<submit-time-off-page>` balance summary

The `#form-balance-summary` `<month-summary>` on the Submit Time Off page should also be interactive to provide a consistent PTO type selection experience.

- [x] Set `interactive` and `active-type="PTO"` on `#form-balance-summary` in `<submit-time-off-page>`
- [x] Listen for `pto-type-changed` on the shadow root and propagate the selected type to the `<pto-entry-form>` (e.g., via a method or by forwarding the event)
- [x] Keep `active-type` in sync between the page-level summary and the form-level summaries
- [x] **Bug fix**: Recalculate page-level balance summary deltas on PTO type change by calling `handleSelectionChanged()` after forwarding to the form
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 3.5 — Populate month-summary with existing scheduled hours

When the employee already has committed PTO entries for a month, each per-calendar `<month-summary>` should display those hours (e.g., if 8 hours of PTO are scheduled for July 4th, the July calendar's month-summary should show `8` in the PTO row). Currently, `setPtoData()` distributes entries to calendars but does not populate the adjacent month-summary hour attributes.

- [x] In `setPtoData()`, after setting `cal.ptoEntries`, compute per-type hour totals for that month's entries and set the corresponding attributes (`pto-hours`, `sick-hours`, `bereavement-hours`, `jury-duty-hours`) on the adjacent `<month-summary>`
- [x] In `rebuildCalendars()`, when restoring existing entries to calendars, also set the month-summary hour attributes from those entries
- [x] In single-calendar mode, update the single `<month-summary>` hour attributes when entries are set or when the user navigates to a different month
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual test: existing scheduled PTO hours appear on the per-calendar month-summary in both view modes

### Stage 3.6 — Persist selected month in single-calendar mode

In single-calendar mode, submitting PTO resets the calendar to the current month. The user's selected month should be preserved across submissions and page reloads via `localStorage`.

- [x] Persist the selected month (e.g., `YYYY-MM`) to `localStorage` when the user navigates months in single-calendar mode
- [x] On initial render / after submission in single-calendar mode, restore the last-viewed month from `localStorage` instead of defaulting to the current month
- [x] Clear or update the stored month when switching employees or when context invalidates the stored value
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual test: submit PTO on a non-current month in single-calendar mode, verify the calendar stays on that month after submission

### Stage 4 — Unit tests

- [ ] Add Vitest tests for `<month-summary>` interactive behavior:
  - Clicking a label when `interactive` is set updates `active-type` attribute
  - `pto-type-changed` event fires with correct `detail.type`
  - Clicking when `interactive` is not set does NOT change active type or fire events
  - Clicking the already-active type does NOT fire the event (no-op)
  - Green checkmark `::after` is rendered on the active item
  - Changing `active-type` programmatically updates the rendered indicator
- [ ] `pnpm run test` passes

### Stage 5 — E2E tests

- [ ] Add Playwright E2E test for PTO type switching via month-summary:
  - Navigate to Submit Time Off page at ≥960px viewport (multi-calendar)
  - Click a month-summary label to change active PTO type
  - Verify the green checkmark indicator updates
  - Select a day on the calendar and verify it uses the new PTO type
  - Switch PTO type again and verify pending selections re-type
  - Navigate to Submit Time Off page at <960px viewport (single-calendar)
  - Verify month-summary is interactive and legend is hidden
  - Click a label and verify PTO type selection works
- [ ] `pnpm run test:e2e` passes

### Stage 6 — Documentation

- [x] Update [month-summary/README.md](../client/components/month-summary/README.md) with:
  - New `interactive` and `active-type` attributes documentation
  - `pto-type-changed` event documentation
  - Interactive mode usage example
- [x] Update this task file with completion status

## Implementation Notes

- The `interactive` attribute should be a simple boolean attribute (presence = true, absence = false), following HTML conventions
- The `active-type` attribute values must match the `deltaKey` values in `SUMMARY_TYPES`: `"PTO"`, `"Sick"`, `"Bereavement"`, `"Jury Duty"`
- **One type must always be active** — clicking the already-active type is a no-op (no toggle/deselect)
- The `pto-type-changed` event must bubble and be composed so it can cross shadow DOM boundaries
- **Visual indicator**: green checkmark (`✓`) rendered via `::after` pseudo-element on the `.summary-label` of the active item. The active label should also be slightly bolder and larger than inactive labels to reinforce the selection
- Use CSS custom properties from `tokens.css` for indicator styling (colors already defined: `--color-pto-vacation`, `--color-pto-sick`, etc.). The checkmark color can use a dedicated green or the existing `--color-success` token if available
- The default active type should be `"PTO"` when entering interactive mode, matching the existing `pto-calendar` default
- When switching PTO type, only pending (uncommitted, selected) cells should re-type — already-submitted entries remain unchanged
- In multi-calendar mode, all 12 `<month-summary>` instances share the same active type — clicking any one updates all of them
- The `<pto-calendar>` legend should be hidden (`hide-legend="true"`) in **both** single and multi-calendar modes — `<month-summary>` fully replaces it
- Follow the animation policy: any indicator transition should use `transform`/`opacity` only, respect `prefers-reduced-motion`, and stay under 400ms

## Questions and Concerns

1. **Resolved**: Replace the legend in **both** single-calendar and multi-calendar modes. `<month-summary>` is now the sole PTO type selector; the `<pto-calendar>` legend is hidden in all modes.
2. **Resolved**: One type must **always** be active. Clicking the already-active type is a no-op — no toggle/deselect. Default is `"PTO"`.
3. **Resolved**: Use a green checkmark (`✓`) to the right of the label via a CSS `::after` pseudo-element. The active label also gets slightly bolder/larger font to reinforce the selection.
4. **Resolved**: Month-summary deltas were not recalculated after PTO type change — fixed by recomputing deltas in `handlePtoTypeChanged` and calling `handleSelectionChanged` in `submit-time-off-page`.
5. **Resolved**: Single-calendar mode did not update month-summary on selection changes — fixed by adding `handleSingleCalendarSelectionChanged` handler.
6. **Resolved**: Pending selected cells were lost when switching between single/multi-calendar view modes — fixed by collecting and restoring `selectedCells` across `rebuildCalendars()`, with a new `selectedCells` setter on `<pto-calendar>`.
7. **Resolved**: Per-calendar `<month-summary>` now displays existing committed PTO hours for the month. Added `updateSummaryHours()` helper that computes per-type totals and sets hour attributes. Wired into `setPtoData()`, `rebuildCalendars()`, and `updateCalendarMonth()` (single-calendar navigation). See Stage 3.5.
8. **Resolved**: In single-calendar mode, submitting PTO while viewing a month other than the current month caused the calendar to reset to the current month. Fixed by persisting the selected month to `localStorage` (key: `dwp-pto-form-selected-month`) in `updateCalendarMonth()` and `navigateToMonth()`, and restoring it in `rebuildCalendars()` via `getPersistedMonth()`. A public `clearPersistedMonth()` method is available for external callers (e.g., employee switching). See Stage 3.6.
9. **Open**: The `#form-balance-summary` `<month-summary>` in `<submit-time-off-page>` was originally positioned outside the scrollable calendar area so it could stay **sticky at the top** of the page while the user scrolls through lower months in multi-calendar mode. The interactive PTO type work kept its DOM position (sibling above `<pto-entry-form>`) but no `position: sticky` styling was applied, so on tall multi-calendar layouts the summary scrolls away. Possible solutions:
   - **A) CSS `position: sticky`**: Add `position: sticky; top: 0; z-index: 10;` to `#form-balance-summary` in the `<submit-time-off-page>` css.ts. Simplest fix; works as long as no ancestor creates an overflow clipping context. May need a solid background to avoid content showing through behind it.
   - **B) Fixed header slot**: Move the balance summary into a non-scrollable header area and make only the `<pto-entry-form>` scrollable (e.g., `overflow-y: auto` with a `max-height` or `flex: 1; overflow: auto` in a flex column layout on `:host`). Guarantees the summary never scrolls, but constrains the page layout more tightly.
   - **C) Duplicate inside `<pto-entry-form>`**: Keep the page-level summary hidden / remove it and let the per-calendar `<month-summary>` instances (already present) serve double duty. The trade-off is that the overall balance view is lost — the user only sees per-month summaries, not the aggregate.

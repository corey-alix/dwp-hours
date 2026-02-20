# PTO Entry Form Multi-Calendar View

## Description

Enhance the `pto-entry-form` component to render all 12 months simultaneously when the viewport is ≥960px wide. This replaces the functionality previously provided by the deleted `current-year-pto-scheduler` component, enabling at-a-glance PTO scheduling on desktop while preserving the single-month swipeable calendar on mobile/tablet.

## Priority

🟢 Low Priority (Frontend/UI enhancement)

## Prerequisites

- `ui-page-consolidation.md` must be completed first (the `current-year-pto-scheduler` is deleted as part of that task).

## Checklist

### Stage 1: Responsive layout scaffolding

- [ ] Add a CSS media query in `pto-entry-form` for `@media (min-width: 960px)` that switches from single-calendar to a 12-month grid layout.
- [ ] Define responsive grid breakpoints:
  - 960px–1199px: 3 columns × 4 rows
  - 1200px–1599px: 4 columns × 3 rows
  - ≥1600px: 6 columns × 2 rows
- [ ] Hide the month navigation arrows (prev/next buttons) when in multi-calendar mode (all months are visible).
- [ ] Verify `pnpm run build` passes.

### Stage 2: Multi-calendar rendering

- [ ] When multi-calendar mode is active, create 12 `pto-calendar` instances (one per month) inside the calendar container.
- [ ] Each calendar should display its month with `hide-legend="true"` and `readonly="false"`.
- [ ] Reuse existing `pto-calendar` component — no changes to the calendar component itself.
- [ ] Pass PTO entries to each calendar filtered by month.
- [ ] Attach a `month-summary` component below each calendar (similar to the former `current-year-pto-scheduler` layout).
- [ ] Verify `pnpm run build` passes.

### Stage 3: Selection and submission

- [ ] PTO date selections should work across all 12 calendars.
- [ ] The submit button should collect selected requests from all calendars.
- [ ] The `selection-changed` event should aggregate selections across all calendars and update the `month-summary` deltas accordingly.
- [ ] Verify the existing single-month submit flow still works on narrow viewports.
- [ ] Verify `pnpm run build` passes.

### Stage 4: Navigate-to-month integration

- [ ] When `navigateToMonth(month, year)` is called in multi-calendar mode, scroll the target month's calendar into view instead of switching months.
- [ ] Add a brief highlight/focus animation on the target month card.
- [ ] Verify clicking dates in PTO detail cards (Current Year Summary page) scrolls to the correct month in multi-calendar mode.
- [ ] Verify `pnpm run build` passes.

### Stage 5: Viewport resize handling

- [ ] Handle dynamic viewport resizing (switching between single-calendar and multi-calendar) without losing selection state.
- [ ] Use `ResizeObserver` or `matchMedia` listener to detect mode changes.
- [ ] Verify `pnpm run build` passes.

### Stage 6: Testing and validation

- [ ] `pnpm run build` passes.
- [ ] `pnpm run lint` passes.
- [ ] Manual testing:
  - [ ] On viewports <960px, single-month calendar with swipe/arrow navigation works.
  - [ ] On viewports ≥960px, all 12 months are visible in a grid.
  - [ ] PTO scheduling works in both modes.
  - [ ] Navigate-to-month scrolls to correct month in multi-calendar mode.
  - [ ] Resizing window transitions between modes gracefully.
  - [ ] Month summaries display correct hours in multi-calendar mode.

## Implementation Notes

- Reference the deleted `current-year-pto-scheduler` component (git history) for layout patterns, particularly the `months-grid` CSS and `month-card` structure.
- The `pto-entry-form` currently uses shadow DOM — all 12 calendars should be created inside the shadow root's `#calendar-container`.
- Consider using CSS `container queries` if the layout should respond to the component's container width rather than viewport width.

## Questions and Concerns

1.
2.
3.

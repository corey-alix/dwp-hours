# Admin Review Inline Calendar

## Description

Enhance the `<admin-monthly-review>` component so that each employee review card includes a CSS-extensions toolbar containing the existing "Acknowledge Review" button and a new "View Calendar" button. Clicking the "View Calendar" button toggles an inline, readonly `<pto-calendar>` within the employee card, showing that employee's PTO entries for the month under review. The calendar remains contained within the card and does not navigate away or open a modal.

## Priority

🟡 Medium Priority

This feature enhances the admin panel's usability by giving administrators immediate visual context for the month being reviewed without leaving the review workflow.

## Checklist

### Stage 1: Toolbar Integration (Foundation)

- [x] Import `adoptToolbar` from `css-extensions` into `admin-monthly-review/index.ts`
- [x] Call `adoptToolbar(this.shadowRoot)` in the component's `connectedCallback`
- [x] Wrap the acknowledge button (and future buttons) in a `<div class="toolbar">` container
- [x] Move the "Acknowledge Review" button into the toolbar
- [x] Add a "View Calendar" toggle button to the toolbar
- [x] **Validate**: Build passes, employee cards render with toolbar layout, acknowledge button still works

### Stage 2: Inline Calendar Rendering

- [x] Import `<pto-calendar>` side-effect registration into `admin-monthly-review/index.ts`
- [x] Add a per-card expanded state (track which employee IDs have calendar open)
- [x] On "View Calendar" click, toggle a `<pto-calendar>` element inline below the toolbar
- [x] Set `readonly="true"`, `hide-legend="true"`, and correct `month`/`year` attributes from `selectedMonth`
- [x] **Validate**: Calendar appears/disappears on toggle, renders in readonly mode within the card

### Stage 3: Calendar Data Injection

- [x] Filter `_ptoEntries` for the target employee and pass them to the inline calendar via `setPtoEntries()`
- [x] Ensure the calendar displays the correct month's PTO data (color-coded day cells)
- [x] Re-inject data when the selected month changes (attribute change or month selector)
- [x] **Validate**: Calendar shows correct PTO entries for the employee/month combination

### Stage 4: CSS Styling & Polish

- [x] Add CSS for the calendar container to keep it contained within the card (e.g., `overflow: hidden`)
- [x] Style the "View Calendar" button consistently with the toolbar pattern
- [x] Ensure acknowledged cards also show the "View Calendar" button (read-only info, always available)
- [x] Update button text/icon to indicate expanded state (e.g., "Hide Calendar" when open)
- [x] Follow CSS animation policy for expand/collapse transitions (`prefers-reduced-motion` safe)
- [x] **Validate**: Visual polish, responsive layout, button state toggles correctly

### Stage 5: Testing & Documentation

- [x] Add Vitest unit tests for calendar toggle state management
- [x] Add Vitest tests verifying PTO entry filtering per-employee
- [ ] Update `admin-monthly-review/test.html` with inline calendar demo
- [x] Update `admin-monthly-review/README.md` with new toolbar and calendar feature documentation
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual testing of toggle behavior, data correctness, and readonly enforcement

## Implementation Notes

- **Toolbar pattern**: Use `adoptToolbar()` from `css-extensions/toolbar` to get the shared `.toolbar` flexbox layout, matching existing usage in `submit-time-off-page` and `admin-employees-page`.
- **Calendar attributes**: Set `month` (1-indexed), `year`, `readonly="true"`, and optionally `hide-legend="true"` / `hide-header="true"` to keep the inline display compact.
- **Data flow**: The `admin-monthly-review` component already receives `_ptoEntries` via `setPtoEntries()`. Filter these by `employee_id` and pass the relevant subset to each inline `<pto-calendar>` instance.
- **Toggle state**: Track expanded employee IDs in a `Set<number>` private field. Toggle membership on button click and call `requestUpdate()`.
- **Event delegation**: Handle the "View Calendar" button click in `handleDelegatedClick()` alongside the existing acknowledge button handler, using a distinguishing class name (e.g., `view-calendar-btn`).
- **Acknowledged cards**: The toolbar should appear for both pending and acknowledged cards. Acknowledged cards hide the acknowledge button but always show the "View Calendar" button.
- **No new API calls**: All required PTO data is already available in the component's `_ptoEntries` array.

## Known Issues

### ~~1. Checkmarks shown on all days instead of only approved days~~ ✅ RESOLVED

**Symptom**: Clicking "View Calendar" shows a "✓" on every PTO day, even unapproved ones.

**Root Cause**: In `admin-monthly-review/index.ts`, the `empEntries` mapping (used in `injectCalendarData()`) omitted the `approved_by` field. The `pto-calendar` component's `renderDayCell()` checks `e.approved_by !== null` to decide whether to render a checkmark. Since the field was `undefined` (not `null`), `undefined !== null` evaluated to `true`, causing every entry to appear approved.

**Fix applied**: Added `approved_by` to the `_ptoEntries` type definition and `setPtoEntries()` signature in `admin-monthly-review/index.ts`, propagated it through the `injectCalendarData()` mapping (using `?? null` to normalize undefined to null), and updated the normalization in `admin-monthly-review-page/index.ts` to pass `approved_by` from the API response. All tests updated accordingly.

**Files changed**:

- `client/components/admin-monthly-review/index.ts` — added `approved_by` to type, method signature, and calendar data mapping
- `client/pages/admin-monthly-review-page/index.ts` — both normalization points now include `approved_by`
- `tests/components/admin-monthly-review.test.ts` — all `setPtoEntries` calls include `approved_by`

## Questions and Concerns

1.
2.
3.

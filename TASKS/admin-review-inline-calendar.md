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

### ~~2. Add month navigation to inline calendar~~ ✅ RESOLVED

**Feature**: Allow administrators to navigate to prior and next months within the inline `<pto-calendar>`, enabling review of an employee's schedule across multiple months without closing the calendar or changing the top-level month selector.

**Current behavior**: The inline calendar is locked to the month selected in the review page's month picker. To view a different month, the admin must change the global month selector, which collapses all expanded calendars and reloads all employee data.

**Desired behavior**: Each inline calendar should include previous/next month navigation buttons, allowing per-card month browsing. The month name should appear above the calendar. The `<pto-calendar>` component already has a `hide-header` attribute — setting it to `false` (or omitting it) would restore the built-in month/year header with navigation. The inline calendar's month should be independent of the page-level `selectedMonth`.

**Data fetching**: A separate API call must be made to retrieve PTO entries when navigating to a month outside the currently loaded data. Do not rely on the existing `_ptoEntries` array for other months — fetch on demand.

**Navigation icons**: The navigation arrows (e.g., `←` / `→` as used in `pto-entry-form`) must **not** be hard-coded into the component. Define them as shared resources — either as new utilities in `client/css-extensions/` (e.g., a `navigation/` module exporting arrow symbols or CSS classes) or as constants in `client/shared/atomic-css.ts`. Components should import from the shared source for consistency.

**Considerations**:

- The calendar must always open to the month under review (the page-level `selectedMonth`). When the admin hides and re-opens the calendar, it must reset to the review month — any previously navigated month state is discarded on collapse
- Per-card calendar month state needs to be tracked (e.g., a `Map<number, string>` mapping employee ID to currently viewed month). Previously fetched data for other months may be cached, but the displayed month must always reset to the review month when the calendar is re-opened
- Re-injecting filtered PTO data must account for the per-card navigated month, not just the page-level `selectedMonth`
- The `<pto-calendar>` component's `hide-header` attribute controls header visibility — consider removing it for inline calendars to expose built-in navigation

**Fix applied**: Created shared navigation module (`css-extensions/navigation/`) with `NAV_SYMBOLS` constants and CSS classes. Added per-card month tracking via `_calendarMonths` map, event-driven data fetching via `calendar-month-data-request` event, response caching in `_monthPtoCache`, and month reset on calendar re-open. Parent page handles the event by calling `GET /api/admin/pto?startDate=...&endDate=...` and injecting results via `setMonthPtoEntries()`.

**Files created**:

- `client/css-extensions/navigation/navigation.ts` — shared `NAV_SYMBOLS` and `navigationCSS`
- `client/css-extensions/navigation/index.ts` — constructable stylesheet singleton and `adoptNavigation()` helper

**Files changed**:

- `client/css-extensions/index.ts` — added navigation exports
- `client/components/admin-monthly-review/index.ts` — month nav UI, per-card state, data fetching events, cache
- `client/pages/admin-monthly-review-page/index.ts` — `calendar-month-data-request` event handler
- `tests/components/admin-monthly-review.test.ts` — 8 new tests for month navigation (29 total)

## Questions and Concerns

1.
2.
3.

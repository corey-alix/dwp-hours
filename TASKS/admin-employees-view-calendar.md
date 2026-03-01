# Admin Employees View Calendar

## Description

Add a "View Calendar" button to each employee card on the `admin/employees` page, giving administrators the same inline calendar navigation they already have on the `admin/monthly-review` page. Clicking the button toggles a readonly `<pto-calendar>` inline within the employee card, defaulting to the current month and allowing backward/forward month navigation. This eliminates the need for admins to switch to the monthly-review page just to inspect an employee's PTO schedule.

Additionally, add a "Show Calendar" button to each employee group on the `admin/pto-requests` page, allowing administrators to view an employee's PTO calendar before approving or rejecting a request. The calendar defaults to the month of the first pending request so the admin immediately sees the relevant context.

## Priority

🟡 Medium Priority

This feature enhances the admin panel's usability by reusing the proven inline-calendar pattern from `admin-monthly-review`. It has no database or API dependencies—all required PTO data is already fetched by the employees page for balance hydration.

## Checklist

### Stage 1: State Management & Data Plumbing (Foundation)

- [x] Add a `_calendarExpandedEmployees: Set<number>` private field to `employee-list` component to track which employee cards have the calendar open
- [x] Add a `_calendarMonths: Map<number, string>` private field to track the currently displayed month per employee (YYYY-MM format)
- [x] Expose a `setPtoEntries()` method (or property) on `employee-list` so the parent page can pass PTO entries for calendar rendering
- [x] In `admin-employees-page`, pass `_ptoEntries` (already fetched for balance hydration) to the employee list
- [x] **Validate**: Build passes, no regressions on existing employee card behavior

### Stage 2: View Calendar Button & Toggle

- [x] Add a "View Calendar" button to `renderEmployeeCard()` in `employee-list/index.ts`, placed in the `.employee-actions` div alongside Edit/Delete
- [x] Handle the button click in `handleDelegatedClick()` to toggle the employee ID in `_calendarExpandedEmployees` and call `requestUpdate()`
- [x] Initialize the calendar month to the current month (using `shared/dateUtils`) when first expanded
- [x] Toggle button text between "View Calendar" and "Hide Calendar" based on expanded state
- [x] **Validate**: Button appears on every card, toggles correctly, text updates

### Stage 3: Inline Calendar Rendering

- [x] Import `<pto-calendar>` side-effect registration into `employee-list/index.ts`
- [x] When an employee's calendar is expanded, render a `<pto-calendar>` inline below the employee details with `readonly="true"`, `hide-legend="true"`, `hide-header="true"`
- [x] Add month navigation arrows (prev/next) above the calendar, matching the `admin-monthly-review` nav-header pattern (`NAV_SYMBOLS.PREV` / `NAV_SYMBOLS.NEXT`)
- [x] Display the current month label between the nav arrows
- [x] Filter `_ptoEntries` by employee ID and current calendar month, then inject via the calendar's `setPtoEntries()` method after render
- [x] **Validate**: Calendar renders inside the card, shows correct PTO entries, readonly mode enforced

### Stage 4: Month Navigation

- [x] Handle prev/next arrow clicks to update `_calendarMonths` for the target employee and re-render
- [x] Re-inject filtered PTO entries when the displayed month changes
- [x] Use `shared/dateUtils` for month arithmetic (no `new Date()` calls)
- [x] **Validate**: Navigation moves forward/backward through months, PTO data updates correctly

### Stage 5: CSS Styling & Accessibility

- [x] Add CSS for the inline calendar container (contained within card, no overflow)
- [x] Style navigation header (arrows + month label) consistently with `admin-monthly-review`
- [x] Add expand/collapse animation following CSS Animation Policy (`prefers-reduced-motion` safe, `transform`/`opacity` only)
- [x] Ensure calendar collapses when the employee enters edit mode
- [x] Ensure responsive layout — calendar fits within card on mobile viewports
- [x] **Validate**: Visual polish, animations respect reduced-motion, no layout breakage

### Stage 6: Testing & Documentation

- [x] Add Vitest unit tests for calendar toggle state management in `employee-list`
- [x] Add Vitest tests verifying PTO entry filtering per-employee per-month
- [x] Add Vitest tests for month navigation (prev/next updates displayed month)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes
- [ ] Manual testing of toggle behavior, navigation, data correctness, and readonly enforcement

### Stage 7: PTO Requests Page — State Management & Data Plumbing

- [x] Add a `_calendarExpandedEmployees: Set<number>` private field to `pto-request-queue` to track which employee groups have the calendar open
- [x] Add a `_calendarMonths: Map<number, string>` private field to track the currently displayed month per employee (YYYY-MM format)
- [x] Expose a `setPtoEntries()` method (or property) on `pto-request-queue` so the parent page can pass PTO entries for calendar rendering
- [x] In `admin-pto-requests-page`, pass `_ptoEntries` (already fetched for balance hydration) to the queue component
- [x] **Validate**: Build passes, no regressions on existing request queue behavior

### Stage 8: PTO Requests Page — Show Calendar Button & Toggle

- [x] Add a "Show Calendar" button to the `.employee-group-header` in `pto-request-queue`, next to the employee name heading
- [x] Handle the button click in `handleDelegatedClick()` to toggle the employee ID in `_calendarExpandedEmployees` and call `requestUpdate()`
- [x] Initialize the calendar month to the **request's month** (derived from the first pending request's `startDate`) when first expanded, so the admin sees the relevant month immediately
- [x] Toggle button text between "Show Calendar" and "Hide Calendar" based on expanded state
- [x] **Validate**: Button appears on every employee group, toggles correctly, text updates

### Stage 9: PTO Requests Page — Inline Calendar Rendering

- [x] Import `<pto-calendar>` side-effect registration into `pto-request-queue/index.ts`
- [x] When an employee group's calendar is expanded, render a `<pto-calendar>` inline below the employee group header (above the request cards) with `readonly="true"`, `hide-legend="true"`, `hide-header="true"`
- [x] Add month navigation arrows (prev/next) above the calendar, matching the `admin-monthly-review` nav-header pattern (`NAV_SYMBOLS.PREV` / `NAV_SYMBOLS.NEXT`)
- [x] Display the current month label between the nav arrows
- [x] Filter `_ptoEntries` by employee ID and current calendar month, then inject via the calendar's `setPtoEntries()` method after render
- [x] **Validate**: Calendar renders inside the employee group, shows correct PTO entries, readonly mode enforced

### Stage 10: PTO Requests Page — Month Navigation

- [x] Handle prev/next arrow clicks to update `_calendarMonths` for the target employee and re-render
- [x] Re-inject filtered PTO entries when the displayed month changes
- [x] Use `shared/dateUtils` for month arithmetic (no `new Date()` calls)
- [x] **Validate**: Navigation moves forward/backward through months, PTO data updates correctly

### Stage 11: PTO Requests Page — CSS & Accessibility

- [x] Add CSS for the inline calendar container within the employee group (contained, no overflow)
- [x] Style navigation header (arrows + month label) consistently with `admin-monthly-review` and `employee-list` calendar patterns
- [x] Add expand/collapse animation following CSS Animation Policy (`prefers-reduced-motion` safe, `transform`/`opacity` only)
- [x] Ensure responsive layout — calendar fits within the employee group on mobile viewports
- [x] **Validate**: Visual polish, animations respect reduced-motion, no layout breakage

### Stage 12: PTO Requests Page — Testing & Documentation

- [x] Add Vitest unit tests for calendar toggle state management in `pto-request-queue`
- [x] Add Vitest tests verifying PTO entry filtering per-employee per-month
- [x] Add Vitest tests for month navigation (prev/next updates displayed month)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes
- [ ] Manual testing of toggle behavior, navigation, data correctness, and readonly enforcement on the PTO requests page

## Implementation Notes

- **Reuse existing patterns**: The `admin-monthly-review` component already implements this exact feature (inline calendar toggle, nav arrows, PTO injection). Mirror the approach in `employee-list`:
  - `_expandedCalendars: Set<number>` for toggle state
  - `_calendarMonths: Map<number, string>` for per-employee month tracking
  - `injectCalendarData()` helper to filter and set PTO entries on the `<pto-calendar>` element
- **Calendar attributes**: Set `month` (1-indexed), `year`, `readonly="true"`, `hide-legend="true"`, `hide-header="true"` for a compact inline display.
- **Data flow**: The `admin-employees-page` already fetches all PTO entries (`this.api.getAdminPTOEntries()`) for balance hydration. Pass them through to `employee-list` — no new API calls needed.
- **Default month**: Unlike monthly-review (which defaults to last month), the employees page should default to the **current month** since there's no review-month context.
- **Date handling**: All month arithmetic must use `shared/dateUtils.ts` helpers — no `new Date()`, `Date.UTC`, or native Date methods.
- **Edit mode interaction**: When an employee enters inline edit mode, collapse any open calendar for that employee to avoid layout conflicts.
- **Nav symbols**: Import `NAV_SYMBOLS` from the shared constants used by `admin-monthly-review` (or define locally if not extracted yet).
- **No modal/navigation**: The calendar renders inline within the card, matching the monthly-review behavior. No page navigation or modal overlay.

### Calendar Rendering Requirements

The `<pto-calendar>` component renders the following visual indicators per day cell. All indicators are driven by the `PTOEntry` objects passed via `setPtoEntries()`. **The parent page must include all relevant fields** in the PTO entry data it passes:

- **Approval checkmark (✓)**: A green checkmark overlay rendered when `approved_by !== null`. The `approved_by` field **must** be mapped from the API response into the PTO entry objects. Omitting `approved_by` (or leaving it `undefined`) will suppress the checkmark — this was the root cause of missing checkmarks on the PTO requests page.
- **PTO type color**: Background color per `type` field (`PTO`, `Sick`, `Bereavement`, `Jury Duty`, `Work Day`), using `PTO_TYPE_COLORS` from `shared/businessRules.ts`. Applied via `.type-{TypeName}` CSS classes.
- **Hours indicator**: Superscript numeric hours on the day number (e.g. `4`, `1.5`, `+3.3` for credits). Full-day (≥8h) vs partial-day styling via `.hours-full` / `.hours-partial` classes.
- **Note indicator (▾)**: A small triangle rendered when `entry.notes` is non-empty, with `title` tooltip showing the note text.
- **Today highlight**: `.today` class applied to the current date's cell.
- **Readonly mode**: When `readonly="true"`, day cells are not clickable/tappable.

**Required PTO entry shape for full rendering:**

```typescript
{
  id: number;
  employeeId: number;
  date: string;        // YYYY-MM-DD
  type: PTOType;       // "PTO" | "Sick" | "Bereavement" | "Jury Duty" | "Work Day"
  hours: number;
  createdAt: string;
  approved_by: number | null;  // ← CRITICAL for checkmark rendering
  notes?: string;              // ← for note indicator
}
```

### PTO Requests Page Specifics

- **Component scope**: The calendar feature lives in `pto-request-queue` (the child component), not the `admin-pto-requests-page` (the parent page). This mirrors how `employee-list` owns the calendar on the employees page.
- **Data flow**: `admin-pto-requests-page` already fetches PTO entries (`this.api.getAdminPTOEntries()`) for balance hydration. Pass them to `pto-request-queue` via a `setPtoEntries()` method — no new API calls needed.
- **Default month**: Unlike the employees page (current month), the PTO requests calendar should default to the **request's month** — derived from the first pending request's `startDate` in each employee group. This ensures the admin sees the relevant month without needing to navigate.
- **Placement**: The calendar renders below the `.employee-group-header` and above the `.employee-group-cards`, giving the admin the calendar context before the approve/reject action buttons.
- **Button location**: The "Show Calendar" button should be placed in the `.employee-group-header` div, next to the employee name heading, consistent with the other admin pages.
- **Reuse**: The same `_calendarExpandedEmployees`, `_calendarMonths`, and `injectCalendarData()` patterns from `employee-list` should be replicated in `pto-request-queue`.

## Defect Reports

### Defect 1: Calendar does not fetch PTO data on open or navigation.

Clicking "Open Calendar" on an employee card produces no network activity — the calendar renders with not employee activity. Navigating to other months also triggers no API requests. The calendar should be requesting PTO entry data for the displayed month (either from the already-fetched `_ptoEntries` passed via `setPtoEntries()`, or via a new fetch if the data isn't already available). Root cause is likely that `injectCalendarData()` is never called after render, or `setPtoEntries()` is not being invoked on the `<pto-calendar>` element with the filtered entries for the target employee and month.

**Root cause analysis**: The `employee-list` component uses a local `injectCalendarData()` method that filters pre-fetched `_ptoEntries` (passed by the parent page). However, the parent page (`admin-employees-page`) filters PTO entries to the current year only (`.filter(p => p.date?.startsWith(this._currentYear))`), so the calendar has no data for other years and may have no data at all if the seeded database has no entries for the current year. Furthermore, unlike `pto-request-queue` (which dispatches `calendar-data-request` events for on-demand API fetching), the `employee-list` never makes API requests for calendar data—it solely relies on the pre-fetched, year-filtered set.

**Fix**: Adopt the same on-demand `calendar-data-request` event pattern that `pto-request-queue` already uses. This ensures calendar data is always fresh and available regardless of the month/year being viewed.

#### Defect 1 Resolution Checklist

- [x] **Verify existing test gap**: Confirm the existing test `"should filter PTO entries by employee and month for calendar"` only checks element attributes, not data injection
- [x] **Add failing test**: Modify `employee-list.test.ts` to assert that a `calendar-data-request` CustomEvent is dispatched when "View Calendar" is clicked (matching `pto-request-queue` behavior)
- [x] **Add failing test for navigation**: Assert that `calendar-data-request` is dispatched when calendar month navigation arrows are clicked
- [x] **Add test for `setCalendarEntries()`**: Assert that calling `setCalendarEntries(empId, month, entries)` injects PTO entries into the calendar element
- [x] **Implement `requestCalendarData()`**: Add private method to `employee-list` that dispatches `calendar-data-request` event (mirroring `pto-request-queue.requestCalendarData()`)
- [x] **Implement `setCalendarEntries()`**: Add public method to `employee-list` that receives fetched data and calls `cal.setPtoEntries()` on the matching `<pto-calendar>`
- [x] **Update `toggleCalendar()`**: Replace `this.injectCalendarData()` with `this.requestCalendarData(empId, month)` in the expand branch
- [x] **Update `navigateCalendarMonth()`**: Replace `this.injectCalendarData()` with `this.requestCalendarData(empId, newMonth)`
- [x] **Add `calendar-data-request` handler in `admin-employees-page`**: Listen for the event, fetch PTO entries via `this.api.get(\`/admin/pto?employeeId=...&startDate=...&endDate=...\`)`, normalize, and call `list.setCalendarEntries()`
- [x] **Run tests**: All new tests pass, existing tests still pass
- [x] **Build & lint**: `pnpm run build` and `pnpm run lint` pass

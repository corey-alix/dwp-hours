# UI Page Consolidation

## Description

Consolidate and simplify the dashboard page structure by removing redundant pages and re-routing navigation flows. The current dashboard has five pages with overlapping functionality; this task reduces it to three pages by removing "Schedule PTO" and "Employee Information" as standalone pages, removing redundant UI from "Submit Time Off", and re-wiring the date-click navigation from PTO detail cards to land on the "Submit Time Off" page instead of the deleted pto-accrual-card calendar.

### Summary of Changes

| Page                              | Action                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Submit Time Off**               | Remove the duplicate "Submit Time Off" `<h2>` header inside `pto-entry-form` (the page `<h1>` already shows this). Remove the redundant `<pto-summary-card>` wrapper, leaving only the `<month-summary id="form-balance-summary">` ("Remaining Balance") directly slotted. Calendar and submit/cancel buttons remain. |
| **Schedule PTO** (`default` page) | Delete entirely — its functionality is already covered by "Submit Time Off".                                                                                                                                                                                                                                          |
| **Current Year Summary**          | Remove `<pto-accrual-card>`. Add `<pto-employee-info-card>` at the top. Re-wire `navigate-to-month` events from PTO detail cards to switch to the "Submit Time Off" page and navigate the `pto-entry-form` calendar to the clicked date's month.                                                                      |
| **Employee Information**          | Delete entirely — `<pto-employee-info-card>` moves to "Current Year Summary".                                                                                                                                                                                                                                         |
| **Prior Year Summary**            | No changes.                                                                                                                                                                                                                                                                                                           |

## Priority

🟢 Low Priority (Frontend/UI cleanup)

## Checklist

### Stage 1: Remove "Schedule PTO" page (HTML + UIManager + nav menu)

This stage removes the `default` page and all code paths that reference it.

- [ ] **index.html**: Delete the `<div id="default-page">` block (contains `<current-year-pto-scheduler>`)
- [ ] **dashboard-navigation-menu/index.ts**: Remove the `{ id: "default", label: "Schedule PTO" }` entry from `menuItems` in `render()`. Remove `"default"` from the `Page` type union.
- [ ] **UIManager.ts – `PAGE_LABELS`**: Remove the `default: "Schedule PTO"` entry.
- [ ] **UIManager.ts – `handlePageChange()`**: Remove the `if (page === "default")` branch (which calls `loadPTOStatus()` and `loadCurrentYearScheduler()`).
- [ ] **UIManager.ts – `setupEventListeners()`**: Remove the `try/catch` block that queries `current-year-pto-scheduler` and adds the `pto-submit` listener.
- [ ] **UIManager.ts – `loadCurrentYearScheduler()`**: Delete the entire method (now unreachable).
- [ ] **UIManager.ts – `handlePtoRequestSubmitOld()`**: Remove the `await this.loadCurrentYearScheduler()` call inside this method.
- [ ] **UIManager.ts imports**: Remove `CurrentYearPtoScheduler` from the component import list (only if no other usage remains).
- [ ] **Delete component files**: Remove the entire `client/components/current-year-pto-scheduler/` directory (css.ts, index.ts, and any test/README files).
- [ ] **components/index.ts**: Remove the `CurrentYearPtoScheduler` export line.
- [ ] Verify `pnpm run build` passes.

### Stage 2: Remove "Employee Information" page and relocate `<pto-employee-info-card>` to "Current Year Summary"

- [ ] **index.html**: Delete `<div id="employee-info-page">` and its contents.
- [ ] **index.html**: Inside `<div id="current-year-summary-page">`, add `<pto-employee-info-card></pto-employee-info-card>` as the **first** child of `<div class="pto-summary">` (before `<pto-summary-card>`).
- [ ] **dashboard-navigation-menu/index.ts**: Remove the `{ id: "employee-info", label: "Employee Information" }` entry from `menuItems`. Remove `"employee-info"` from the `Page` type union.
- [ ] **UIManager.ts – `PAGE_LABELS`**: Remove the `"employee-info": "Employee Information"` entry.
- [ ] **UIManager.ts – `handlePageChange()`**: Remove the `else if (page === "employee-info")` branch. Add a `this.loadEmployeeInfo()` call inside the `else if (page === "current-year-summary")` branch (so employee info loads when the summary page opens).
- [ ] **UIManager.ts – `handlePageChange()` prior-year branch**: Remove the `this.loadEmployeeInfo()` call from the `prior-year-summary` branch (employee info card no longer lives on that page).
- [ ] Verify `pnpm run build` passes.

### Stage 3: Remove `<pto-accrual-card>` from "Current Year Summary"

- [ ] **index.html**: Remove the `<pto-accrual-card request-mode="true" annual-allocation="0"></pto-accrual-card>` element from `#current-year-summary-page`.
- [ ] **index.html**: Remove the `<style>` block in `<head>` that sets `pto-accrual-card { grid-column: 1 / -1; }`.
- [ ] **UIManager.ts – `loadPTOStatus()`**: Remove all lines that query/populate the `accrualCard` variable (`querySingle<PtoAccrualCard>(...)`, `.monthlyAccruals`, `.ptoEntries`, `.calendarYear`, `.monthlyUsage`, `.setAttribute("annual-allocation", ...)`).
- [ ] **UIManager.ts – `renderPTOStatus()`**: Remove all lines that populate the `accrualCard`.
- [ ] **UIManager.ts – `setupPTOCardEventListeners()`**: Remove the `accrualCard` variable declaration and all listeners on it (`pto-request-submit`, `month-selected`). Remove the `handleNavigateToMonth` handler that calls `accrualCard.navigateToMonth()` and replace it with the new behaviour (Stage 5).
- [ ] **UIManager.ts – `buildMonthlyUsage()` method**: Delete if no longer referenced anywhere.
- [ ] **UIManager.ts imports**: Remove `PtoAccrualCard` from the component import list (only if no other usage remains).
- [ ] **Delete component files**: Remove the entire `client/components/pto-accrual-card/` directory.
- [ ] **components/index.ts**: Remove the `PtoAccrualCard` export line.
- [ ] Verify `pnpm run build` passes.

### Stage 4: Extend `pto-employee-info-card` with accrual data

The deleted `pto-accrual-card` displayed monthly accrual breakdowns. The essential accrual summary data (carryover, PTO rate, accrual-to-date) should now be displayed inside `pto-employee-info-card` on the "Current Year Summary" page.

#### 4a: Add `computeAccrualToDate()` to `shared/businessRules.ts`

Add a pure function that computes PTO accrued from the start of the fiscal year to the current date based on the employee's PTO rate and the number of work days elapsed.

- [ ] **shared/businessRules.ts**: Add `computeAccrualToDate(ptoRate: number, fiscalYearStart: string, currentDate: string): number`.
  - `ptoRate` — hours accrued per work day (from `Employee.ptoRate` or `annualAllocation / totalWorkDaysInYear`).
  - `fiscalYearStart` — YYYY-MM-DD string for the beginning of the fiscal year (hire-date anniversary or Jan 1).
  - `currentDate` — YYYY-MM-DD string (today).
  - Returns total hours accrued = `ptoRate × countWorkDaysBetween(fiscalYearStart, currentDate)`. Use existing `getWorkdaysBetween()` from `shared/dateUtils.ts` (or a similar utility) to count weekdays in the range.
- [ ] **shared/businessRules.ts**: Add any needed imports from `dateUtils.ts` (e.g., `getWorkdaysBetween`).
- [ ] Write a unit test for `computeAccrualToDate` in a test file (e.g., `shared/businessRules.test.ts` or add to existing tests).
- [ ] Verify `pnpm run build` passes.

#### 4b: Extend `pto-employee-info-card` to display accrual data

The card currently shows Hire Date and Next Rollover. Add three new rows: Carryover, PTO Rate, and Accrual-to-Date.

- [ ] **pto-employee-info-card/index.ts**: Extend the `EmployeeInfoData` type to include:
  ```typescript
  type EmployeeInfoData = {
    hireDate: string;
    nextRolloverDate: string;
    carryoverHours: number; // hours carried from prior year
    ptoRatePerDay: number; // hours accrued per work day
    accrualToDate: number; // hours accrued so far this fiscal year
    annualAllocation: number; // total annual PTO allocation
  };
  ```
- [ ] **pto-employee-info-card/index.ts – `render()`**: Add `renderRow()` calls for the new fields:
  - "Carryover" — display `carryoverHours` (e.g., "16.0 hours")
  - "PTO Rate" — display `ptoRatePerDay` (e.g., "0.37 hrs/day")
  - "Accrued YTD" — display `accrualToDate` (e.g., "52.3 hours")
  - "Annual Allocation" — display `annualAllocation` (e.g., "96.0 hours")
- [ ] Verify `pnpm run build` passes.

#### 4c: Wire `UIManager.ts` to populate the new fields

- [ ] **UIManager.ts – `loadPTOStatus()`**: When populating `employeeInfoCard.info`, include the new fields:
  - `carryoverHours` from `status.carryoverFromPreviousYear`
  - `ptoRatePerDay` computed as `status.annualAllocation / getTotalWorkDaysInYear(getCurrentYear())` (or use the PTO rate from the API if available)
  - `accrualToDate` from `computeAccrualToDate(ptoRatePerDay, fiscalYearStart, today())`
  - `annualAllocation` from `status.annualAllocation`
- [ ] **UIManager.ts – `renderPTOStatus()`**: Same — populate the new fields.
- [ ] **UIManager.ts – `loadEmployeeInfo()`**: Same — populate the new fields.
- [ ] **UIManager.ts imports**: Add `computeAccrualToDate` from `shared/businessRules.ts`.
- [ ] Verify `pnpm run build` passes.

### Stage 5: Re-wire `navigate-to-month` from PTO detail cards to "Submit Time Off" page

When a user clicks a date inside `pto-pto-card`, `pto-sick-card`, `pto-bereavement-card`, or `pto-jury-duty-card`, the card dispatches a `navigate-to-month` custom event with `{ month, year }`. Previously this navigated to the `pto-accrual-card` calendar. Now it must:

1. Switch the active page to "Submit Time Off".
2. Navigate the `pto-entry-form`'s internal `pto-calendar` to the target month.

- [ ] **UIManager.ts – `setupPTOCardEventListeners()`**: Replace the `handleNavigateToMonth` handler. The new handler should:
  1. Call `this.handlePageChange("submit-time-off")` to switch pages.
  2. Query the `pto-entry-form` element.
  3. Call `ptoForm.navigateToMonth(month, year)` (to be added in the next step) or directly manipulate the internal calendar.
- [ ] **pto-entry-form/index.ts**: Add a public `navigateToMonth(month: number, year: number): void` method that:
  1. Gets the internal `pto-calendar` via `this.getCalendar()`.
  2. Sets `calendar.setAttribute("month", month.toString())`, `calendar.setAttribute("year", year.toString())`, and `calendar.setAttribute("selected-month", month.toString())`.
  3. Optionally uses the existing `navigateMonthWithAnimation` for a smooth transition (or skips animation if called programmatically).
- [ ] Verify clicking a date in any PTO detail card on the "Current Year Summary" page navigates to the "Submit Time Off" page with the correct month displayed.
- [ ] Verify `pnpm run build` passes.

### Stage 6: Simplify "Submit Time Off" page — remove duplicate header and redundant card wrapper

The `pto-entry-form` component renders its own `<h2>Submit Time Off</h2>` header internally. Since the page-level `<h1>` already displays the page title via `UIManager.handlePageChange()`, the component's internal header is redundant.

Additionally, the `<pto-summary-card>` wrapper around the `<month-summary id="form-balance-summary">` is redundant — the month-summary component can be slotted directly into the form. The calendar, nav arrows, submit/cancel buttons, and the "Remaining Balance" `<month-summary>` all remain — they are critical for PTO scheduling and for the Stage 5 navigate-to-month flow.

- [ ] **index.html**: Replace the slotted `<pto-summary-card>` with direct `<month-summary id="form-balance-summary"></month-summary>` inside `<pto-entry-form>`.
- [ ] **pto-entry-form/index.ts – `render()`**: Remove the `<h2>Submit Time Off</h2>` element from the form header. Keep the `.form-header` div if it still contains the calendar navigation toolbar, or remove it if it only contained the heading.
- [ ] Ensure the `<month-summary id="form-balance-summary">` ("Remaining Balance") remains visible and functional.
- [ ] Verify the calendar, nav arrows, and submit/cancel buttons are unchanged.
- [ ] Verify `pnpm run build` passes.

### Stage 7: Cleanup and validation

- [ ] Remove any now-unused CSS (e.g., `pto-accrual-card` grid-column override).
- [ ] Remove dead imports in UIManager.ts (e.g., `PtoAccrualCard`, `CurrentYearPtoScheduler`, `PtoCalendar` if no longer used, `CalendarEntry` type import if unused).
- [ ] Remove dead private methods in UIManager.ts (e.g., `buildMonthlyUsage`, `buildAllUsageEntries` if unused, `getWorkdaysBetween` if unused).
- [ ] Remove the `CurrentYearPtoScheduler` export from `client/components/index.ts` if not already done in Stage 1.
- [ ] `pnpm run build` passes.
- [ ] `pnpm run lint` passes.
- [ ] Manual testing:
  - [ ] Dashboard loads on "Submit Time Off" page by default.
  - [ ] Navigation menu shows only: Submit Time Off, Current Year Summary, Prior Year Summary, Logout.
  - [ ] "Current Year Summary" shows `pto-employee-info-card` at top, followed by PTO/Sick/Bereavement/Jury Duty summary cards.
  - [ ] Clicking a date in any PTO detail card navigates to "Submit Time Off" with the correct month in the calendar.
  - [ ] "Remaining Balance" (`month-summary`) is visible on the "Submit Time Off" page.
  - [ ] PTO submission still works end-to-end.
  - [ ] Logout works.
  - [ ] Prior Year Summary still works.
  - [ ] Admin panel still appears for admin users.

## Implementation Notes

### Files to modify

| File                                                   | Changes                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/index.html`                                    | Remove `#default-page`, `#employee-info-page`, `<pto-accrual-card>` from `#current-year-summary-page`, add `<pto-employee-info-card>` to `#current-year-summary-page`, remove accrual card `<style>` override, replace `<pto-summary-card>` with direct `<month-summary>` in `#pto-form` |
| `client/UIManager.ts`                                  | Remove dead page branches, dead methods, dead imports, re-wire `navigate-to-month` handler                                                                                                                                                                                               |
| `client/components/dashboard-navigation-menu/index.ts` | Remove "Schedule PTO" and "Employee Information" from menu items and `Page` type                                                                                                                                                                                                         |
| `client/components/pto-entry-form/index.ts`            | Add public `navigateToMonth(month, year)` method                                                                                                                                                                                                                                         |
| `client/components/pto-employee-info-card/index.ts`    | Extend `EmployeeInfoData` type and `render()` to display carryover, PTO rate, accrual-to-date, annual allocation                                                                                                                                                                         |
| `shared/businessRules.ts`                              | Add `computeAccrualToDate()` function                                                                                                                                                                                                                                                    |

### Files NOT to modify

- `pto-pto-card`, `pto-sick-card`, `pto-bereavement-card`, `pto-jury-duty-card` — these already dispatch `navigate-to-month` events; no changes needed.
- `prior-year-review` — no changes.
- Server/API code — no backend changes.

### Files to delete

- `client/components/current-year-pto-scheduler/` — entire directory (Stage 1)
- `client/components/pto-accrual-card/` — entire directory (Stage 3)

### Key architectural notes

- The `navigate-to-month` event is dispatched by `pto-card-base` derivatives (`pto-pto-card`, `pto-sick-card`, etc.) in their `handleDelegatedClick` when a `.usage-date` element is clicked. The event bubbles with `{ month, year }` in `detail`.
- The `pto-entry-form` component hosts a `pto-calendar` inside `#calendar-container` in its shadow DOM. The calendar's month can be changed via `setAttribute("month", ...)`.
- `handlePageChange()` in UIManager is responsible for showing/hiding `.page` divs and loading data. When changing to "submit-time-off", it already calls `loadPTOStatus()` and `handlePtoDataRequest()`.
- The `DashboardNavigationMenu` component uses a `Page` type union to define valid pages. This type must be updated when pages are removed.
- `showDashboard()` calls `handlePageChange("submit-time-off")` as the default page — this remains correct after the changes.

### Future: Multi-calendar view for large viewports

After this consolidation is complete, re-purpose `pto-entry-form` to render all 12 months simultaneously when the viewport is ≥960px wide (similar to the deleted `current-year-pto-scheduler`). This enables at-a-glance PTO scheduling on desktops while keeping the single-month swipeable calendar on mobile. Create a separate task file for this feature: `TASKS/pto-entry-form-multi-calendar.md`.

## Questions and Concerns

1. **RESOLVED** — Calendar stays on "Submit Time Off". The redundant `<h2>Submit Time Off</h2>` header inside `pto-entry-form` is removed, and the redundant `<pto-summary-card>` wrapper is removed, leaving only the `<month-summary id="form-balance-summary">` ("Remaining Balance") directly slotted. The calendar, nav arrows, submit/cancel, and "Remaining Balance" section all remain.
2. **RESOLVED** — Delete `current-year-pto-scheduler` component files entirely (Stage 1). The `pto-entry-form` will be enhanced with a multi-calendar view for large viewports in a follow-up task.
3. **RESOLVED** — Delete `pto-accrual-card` component files (Stage 3). The accrual summary data (carryover, PTO rate, accrual-to-date) is absorbed into `pto-employee-info-card` (Stage 4).
4.

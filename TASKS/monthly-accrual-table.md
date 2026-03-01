# Monthly Accrual Table

## Description

Add a "Monthly Accrual" section to the `current-year-summary-page` that displays a month-by-month breakdown of PTO accrual for the current year. The section renders as a responsive CSS-grid table inside a new `<monthly-accrual-table>` web component.

### Compact Layout (narrow containers)

| Month    | Work Days | Rate | Accrued |
| -------- | --------- | ---- | ------- |
| January  | 22        | 0.65 | 14.30   |
| February | 20        | 0.65 | 13.00   |

### Wide Layout (container query: ≥ 540px inline)

> **Example employee**: Hired **2024-06-15** (rate tier 1→2 on July 1 2026), carryover = 40.00 h.

| Month     | Work Days |     Rate |   Accrued | Prior Balance |     Used |    Balance |
| --------- | --------: | -------: | --------: | ------------: | -------: | ---------: |
| January   |        22 |     0.68 |     14.96 |         40.00 |     8.00 |      46.96 |
| February  |        20 |     0.68 |     13.60 |         46.96 |     0.00 |      60.56 |
| March     |        22 |     0.68 |     14.96 |         60.56 |    16.00 |      59.52 |
| April     |        22 |     0.68 |     14.96 |         59.52 |     0.00 |      74.48 |
| May       |        21 |     0.68 |     14.28 |         74.48 |     0.00 |      88.76 |
| June      |        22 |     0.68 |     14.96 |         88.76 |     8.00 |      95.72 |
| **July**  |    **23** | **0.71** | **16.33** |     **95.72** | **0.00** | **112.05** |
| August    |        21 |     0.71 |     14.91 |        112.05 |    16.00 |     110.96 |
| September |        22 |     0.71 |     15.62 |        110.96 |     0.00 |     126.58 |
| October   |        22 |     0.71 |     15.62 |        126.58 |     0.00 |     142.20 |
| November  |        21 |     0.71 |     14.91 |        142.20 |     8.00 |     149.11 |
| December  |        23 |     0.71 |     16.33 |        149.11 |     0.00 |     165.44 |

Note: **July** row is bolded to highlight the rate change (0.68 → 0.71) when the employee crosses the 2-year service tier on July 1.

- **Prior Balance** shows the balance carried into each month. For January this is `carryoverFromPreviousYear`; for every subsequent month it is the previous month's ending **Balance**.
- **Used** is the total PTO hours used in that month (from `entries` filtered by month).
- **Balance** is the month's ending total: `Prior Balance + Accrued − Used`.
- **Rate** is the employee's effective daily rate for that month. It may change mid-year on July 1 per the PTO earning schedule; use `getEffectivePtoRate(hireDate, lastDayOfMonth)` to compute the correct rate per month.
- **Work Days** is the count of weekdays in the month, computed via `getWorkdaysBetween(firstOfMonth, lastOfMonth)` from `shared/dateUtils.ts`.
- **Accrued** = Rate × Work Days for that month.

### Data Source

The component receives its data via a complex property setter (no attributes for objects/arrays). The parent page (`current-year-summary-page`) already has access to `PTOStatusResponse` (which includes `dailyRate`, `carryoverFromPreviousYear`, `hireDate`) and `PTOEntry[]` for the year.

### Component Contract

```typescript
interface MonthlyAccrualRow {
  month: number;        // 1–12
  label: string;        // "January", "February", etc.
  workDays: number;
  rate: number;
  accrued: number;      // rate × workDays
  priorBalance: number; // previous month's ending balance (January = carryoverFromPreviousYear)
  used: number;
  balance: number;      // running total
}

// Complex property — set via JS, not attribute
set rows(value: MonthlyAccrualRow[]) { ... }
```

## Priority

🟢 Low Priority (Frontend/UI polish)

## Checklist

### Phase 1: Create `monthly-accrual-table` Web Component

- [ ] Create `client/components/monthly-accrual-table/index.ts` extending `BaseComponent`
- [ ] Create `client/components/monthly-accrual-table/css.ts` with grid styles and container query
- [ ] Define `MonthlyAccrualRow` interface (in component or `shared/api-models.d.ts`)
- [ ] Implement `rows` complex property setter (private field + `requestUpdate()`)
- [ ] Implement `render()` returning a CSS-grid table with compact columns: Month, Work Days, Rate, Accrued
- [ ] Use `container-type: inline-size` on the host and `@container` query (≥ 540px) to show extra columns: Prior Balance, Used, Balance
- [ ] Extra columns hidden by default (`display: none`), revealed inside the container query
- [ ] Apply design tokens from `tokens.css` for colors, spacing, fonts
- [ ] Register element: `customElements.define("monthly-accrual-table", MonthlyAccrualTable)`
- [ ] `pnpm run build` passes

### Phase 2: Computation Logic (Shared)

- [ ] Add a helper function `computeMonthlyAccrualRows(year, dailyRate, carryover, hireDate, ptoEntries)` — either in the component or in `shared/businessRules.ts`
- [ ] For each month 1–12: compute work days via `getWorkdaysBetween(firstOfMonth, lastOfMonth)` from `shared/dateUtils.ts`
- [ ] Accrued = rate × workDays
- [ ] Prior Balance = `carryoverFromPreviousYear` for January; previous month's Balance for all other months
- [ ] Used = sum of `ptoEntries` hours where type is `"PTO"` and date falls in that month
- [ ] Balance = Prior Balance + Accrued − Used
- [ ] Months before hire date show zeroes or are omitted
- [ ] Future months (after `today()`) show projected values (work days for full month, used = 0)
- [ ] Unit tests for `computeMonthlyAccrualRows` covering: full year, mid-year hire, months with PTO usage
- [ ] `pnpm run build` passes

### Phase 3: Test Harness

- [ ] Create `client/components/monthly-accrual-table/test.html` following project test.html pattern
- [ ] Create `client/components/monthly-accrual-table/test.ts` using `seedData` and `businessRules` for realistic data
- [ ] Wire playground to compute rows and inject via property setter
- [ ] Verify compact and wide layouts by resizing the browser window
- [ ] `pnpm run build` passes

### Phase 4: Integrate into `current-year-summary-page`

- [ ] Import `MonthlyAccrualTable` type in `current-year-summary-page/index.ts`
- [ ] Add `<monthly-accrual-table></monthly-accrual-table>` to the page's `render()` template (after the balance table, before or after the PTO detail card)
- [ ] In `populateCards()`, compute `MonthlyAccrualRow[]` from `status` and `entries`, then set `monthlyAccrualTable.rows = rows`
- [ ] Verify the section heading ("Monthly Accrual") renders above the table
- [ ] Verify layout is consistent with existing page sections
- [ ] `pnpm run build` passes

### Phase 5: Styling & Responsiveness

- [ ] Ensure grid tracks align properly in both compact and wide modes
- [ ] Stripe alternating rows for readability
- [ ] Bold or highlight the current month row
- [ ] Right-align numeric columns
- [ ] Verify the container query breakpoint (540px) works with the page's existing layout (flex/grid parent)
- [ ] Test at mobile, tablet, and desktop widths
- [ ] `pnpm run lint:css` passes (stylelint)

### Phase 6: Final Validation

- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Vitest unit tests pass for computation logic
- [ ] Manual testing of compact layout (narrow viewport)
- [ ] Manual testing of wide layout (wide viewport)
- [ ] Manual testing with real employee data (via test harness or dev server)

## Implementation Notes

### Web Component Patterns

- Extend `BaseComponent` for automatic shadow DOM, memory-safe listeners, and `requestUpdate()` / `render()` lifecycle.
- Styles in a separate `css.ts` file exporting a `styles` template string.
- Use **named slots** if the parent needs to compose children; this component is self-contained so no slots needed.
- Use **complex property setter** (private field + `requestUpdate()`) for the `rows` array — not attributes.

### CSS Grid Layout

```css
/* Compact grid: 4 columns */
.accrual-grid {
  display: grid;
  grid-template-columns: 1fr repeat(3, auto);
  gap: 0;
}

/* Wide grid: 7 columns — revealed by container query */
@container (inline-size >= 540px) {
  .accrual-grid {
    grid-template-columns: 1fr repeat(6, auto);
  }
  .wide-only {
    display: block; /* or revert */
  }
}
```

- The host element needs `container-type: inline-size` so the `@container` query fires based on the component's own width.
- Extra columns (Prior Balance, Used, Balance) use a `.wide-only` class, hidden by default with `display: none`.

### Container Query Rationale

Container queries are preferred over media queries because the component may be placed in different layout contexts (full-width page, sidebar, modal) and should adapt to its container's width, not the viewport.

### Date & Business Rule Imports

- `getWorkdaysBetween`, `formatDate`, `getLastDayOfMonth`, `parseDate`, `today` from `shared/dateUtils.ts`
- `getEffectivePtoRate` from `shared/businessRules.ts` (if rate changes mid-year)
- `computeAccrualToDate` is not used directly — the new per-month computation replaces it for this view

### Existing Data Available in `current-year-summary-page`

From `PTOStatusResponse`:

- `dailyRate` — current PTO accrual rate per work day
- `carryoverFromPreviousYear` — hours carried from last year
- `hireDate` — YYYY-MM-DD
- `annualAllocation` — total annual PTO hours

From `PTOEntry[]`:

- Each entry has `date` (YYYY-MM-DD), `type` ("PTO", "Sick", etc.), `hours`

### Files to Create

- `client/components/monthly-accrual-table/index.ts`
- `client/components/monthly-accrual-table/css.ts`
- `client/components/monthly-accrual-table/test.html`
- `client/components/monthly-accrual-table/test.ts`

### Files to Modify

- `client/pages/current-year-summary-page/index.ts` — add the component to render + populate
- `client/pages/current-year-summary-page/css.ts` — optional layout adjustments

## Questions and Concerns

1. ~~Should **Rate** change mid-year if the employee crosses a service-year boundary on July 1? If so, each month may need its own rate via `getEffectivePtoRate(hireDate, lastDayOfMonth)`.~~ **Yes** — the wide-layout example demonstrates this (0.68 → 0.71 in July).
2. Should the **Balance** column include non-PTO types (Sick, Bereavement, Jury Duty) or only PTO?
3. Should future months beyond the current month be rendered with projected values, or should rows stop at the current month?
4. Should the component emit a `month-selected` event when a row is clicked, for future calendar integration?

---

## Optional Phase 7: Drop `pto_rate` Column from `employees` Table

### Rationale

The `pto_rate` column is **redundant**. Every calculation path already uses `getEffectivePtoRate(hireDate, asOfDate)` from `shared/businessRules.ts`, which derives the rate purely from `hire_date` and the `PTO_EARNING_SCHEDULE`. The stored value is a stale snapshot that gets overwritten on every Excel import and is never read for actual accrual math. Removing it eliminates a source of confusion and ensures there is exactly one source of truth.

> **Future override**: If individual employees ever need preferential rates, introduce an optional `effective_start_date` override column (defaults to `hire_date`) rather than re-adding a stored rate.

### Impact Analysis

The `pto_rate` / `ptoRate` field touches the following areas:

| Area                      | File(s)                                                                  | Current Usage                                                                                         | Migration                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **DB schema**             | `db/schema.sql`                                                          | `pto_rate REAL DEFAULT 0.71` column                                                                   | Drop column                                                                                                  |
| **TypeORM entity**        | `server/entities/Employee.ts`                                            | `@Column pto_rate`                                                                                    | Remove field                                                                                                 |
| **Entity serializer**     | `shared/entity-transforms.ts`                                            | `ptoRate: entity.pto_rate`                                                                            | Remove field; compute from `getEffectivePtoRate(entity.hire_date, today())` when callers need a display rate |
| **API models**            | `shared/api-models.d.ts`                                                 | `ptoRate` on `Employee`, `EmployeeCreateRequest`, `EmployeeUpdateRequest`, `BulkImportEmployee`       | Remove from response; remove from create/update requests (rate is derived)                                   |
| **PTO status**            | `server/ptoCalculations.ts`                                              | `employee.pto_rate` in input interface — **already unused** (`getEffectivePtoRate` is called instead) | Remove from input interface                                                                                  |
| **PTO DAL**               | `server/dal/PtoEntryDAL.ts`                                              | Passes `employee.pto_rate` into calculation input — **value is ignored**                              | Stop passing                                                                                                 |
| **Employee create**       | `server/server.mts` POST `/api/employees`                                | Sets `employee.pto_rate = ptoRate ?? tier0`                                                           | Remove; rate is derived from hire_date                                                                       |
| **Employee update**       | `server/server.mts` PUT `/api/employees/:id`                             | Sets `employee.pto_rate = ptoRate`                                                                    | Remove field from update                                                                                     |
| **Auto-provision**        | `server/server.mts` magic-link endpoint                                  | `pto_rate: PTO_EARNING_SCHEDULE[0].dailyRate`                                                         | Remove                                                                                                       |
| **Type guards**           | `server/server.mts` `isEmployeeCreateRequest`, `isEmployeeUpdateRequest` | Validates `ptoRate` field                                                                             | Remove validation                                                                                            |
| **Bulk migration**        | `server/bulkMigration.ts`                                                | Hard-codes `employee.pto_rate = 0.71`                                                                 | Remove                                                                                                       |
| **Excel import (server)** | `server/reportGenerators/excelImport.ts`                                 | `existing.pto_rate = rate` / `newEmp: { pto_rate: rate }`                                             | Remove — `computePtoRate()` still useful for import **warnings** but no longer writes to entity              |
| **Excel import (client)** | `client/import/excelImportClient.ts`                                     | Sends `ptoRate: rate` in import payload                                                               | Remove                                                                                                       |
| **Excel parsing**         | `shared/excel/employeeParsing.ts`                                        | `computePtoRate()` reconciles spreadsheet vs policy                                                   | Keep for import warning; stop returning `rate` for entity storage                                            |
| **Seed data**             | `shared/seedData.ts`, `scripts/seed.ts`                                  | `pto_rate: 0.71` on seed employees                                                                    | Remove field                                                                                                 |
| **Report service**        | `server/reportService.ts`                                                | `ptoRate: emp.pto_rate` in report data                                                                | Replace with `getEffectivePtoRate(emp.hire_date, reportDate).dailyRate`                                      |
| **Employee form UI**      | `client/components/employee-form/index.ts`                               | Input field + validation for `ptoRate`                                                                | Remove input; optionally show computed rate as read-only display                                             |
| **Employee list UI**      | `client/components/employee-list/index.ts`                               | Displays `employee.ptoRate hrs/day`                                                                   | Compute from `getEffectivePtoRate` in parent or display `dailyRate` from status                              |
| **Admin employees page**  | `client/pages/admin-employees-page/index.ts`                             | Maps `employee.ptoRate`                                                                               | Remove mapping                                                                                               |
| **Employee info card**    | `client/components/pto-employee-info-card/index.ts`                      | Displays `ptoRatePerDay`                                                                              | No change — already receives computed `dailyRate` from `PTOStatusResponse`                                   |
| **Test harnesses**        | Various `test.ts` files                                                  | `ptoRate: emp.pto_rate`                                                                               | Update to derive from hire date                                                                              |
| **Test data (Excel)**     | `tests/excel-import.test.ts`                                             | Asserts `ptoRate` values from import                                                                  | Update assertions                                                                                            |
| **Work days helper**      | `server/workDays.ts`                                                     | `calculateMonthlyAccrual(ptoRate, ...)`                                                               | Signature unchanged — callers pass `getEffectivePtoRate().dailyRate` instead of stored value                 |
| **Sys-admin row**         | `db/schema.sql`, `server/server.mts`                                     | `pto_rate: 0` for System user                                                                         | Remove field                                                                                                 |

### Checklist

- [ ] Remove `pto_rate` column from `db/schema.sql`
- [ ] Write a migration script to `ALTER TABLE employees DROP COLUMN pto_rate` (SQLite requires table rebuild)
- [ ] Remove `pto_rate` field from `server/entities/Employee.ts`
- [ ] Remove `ptoRate` from `serializeEmployee()` in `shared/entity-transforms.ts`
- [ ] Remove `ptoRate` from `Employee`, `EmployeeCreateRequest`, `EmployeeUpdateRequest`, `BulkImportEmployee` in `shared/api-models.d.ts`
- [ ] Remove `pto_rate` from `Employee` input interface in `server/ptoCalculations.ts`
- [ ] Remove `pto_rate` from calculation input in `server/dal/PtoEntryDAL.ts`
- [ ] Remove `ptoRate` handling from POST `/api/employees` and PUT `/api/employees/:id` in `server/server.mts`
- [ ] Remove `pto_rate` from auto-provision in magic-link handler
- [ ] Remove `ptoRate` from `isEmployeeCreateRequest` and `isEmployeeUpdateRequest` type guards
- [ ] Remove `employee.pto_rate = 0.71` from `server/bulkMigration.ts`
- [ ] Remove `pto_rate` write from `server/reportGenerators/excelImport.ts` (keep `computePtoRate()` for import warnings only)
- [ ] Remove `ptoRate` from client import payload in `client/import/excelImportClient.ts`
- [ ] Remove `pto_rate` from `SeedEmployee` type and seed data in `shared/seedData.ts`
- [ ] Remove `pto_rate` from SQL inserts in `scripts/seed.ts`
- [ ] Replace `ptoRate: emp.pto_rate` with `getEffectivePtoRate(emp.hire_date, reportDate).dailyRate` in `server/reportService.ts`
- [ ] Remove PTO Rate input field and `validatePtoRate()` from `client/components/employee-form/index.ts`
- [ ] Remove `ptoRate` display from `client/components/employee-list/index.ts` (or compute from hire date)
- [ ] Update `client/pages/admin-employees-page/index.ts` and test harness
- [ ] Update all affected test files (`tests/excel-import.test.ts`, component test.ts files)
- [ ] Update `project-types.d.md` (auto-generated; re-run `pnpm generate:types`)
- [ ] Update `client/components/employee-form/README.md`
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Existing Vitest and E2E tests pass
- [ ] Manual testing: employee creation, import, PTO status, admin employee view

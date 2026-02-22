# Admin Employees Page — Balance Summary Hydration

## Description

The `admin-employees-page` renders a `<pto-balance-summary>` component for each employee card via `employee-list`, but **never calls `setBalanceData()`** on those instances. As a result, every badge displays "No balance data" instead of the employee's actual remaining PTO, Sick, Bereavement, and Jury Duty hours.

The fix requires fetching all PTO entries (via `getAdminPTOEntries()`), computing per-employee balance data using `computeEmployeeBalanceData()` from `shared/businessRules.ts`, and imperatively calling `setBalanceData()` on each `<pto-balance-summary>` element after the list renders.

This pattern already exists in `admin-monthly-review/index.ts` and `employee-list/test.ts` and should be replicated in the page orchestrator.

## Priority

🟡 Medium Priority — UI defect in an existing admin page; no schema or API changes needed.

## Checklist

### Stage 1 — Fetch PTO entries on page load

- [x] In `AdminEmployeesPage.onRouteEnter()`, call `this.api.getAdminPTOEntries()` and store the result in a private `_ptoEntries` field
- [ ] Optionally add `_ptoEntries` to the page's `loaderData` to avoid an extra network round-trip on initial navigation
- [x] Verify: `_ptoEntries` is populated after route entry (console log or debugger)

### Stage 2 — Compute and inject balance data

- [x] Import `computeEmployeeBalanceData` from `shared/businessRules.ts`
- [x] Create a private method `hydrateBalanceSummaries()` that:
  1. Queries `this.shadowRoot.querySelectorAll("pto-balance-summary")` (these live inside `employee-list`'s shadow DOM or in light-DOM slots)
  2. For each element, reads `data-employee-id`, finds the employee name, calls `computeEmployeeBalanceData(id, name, this._ptoEntries)`, and calls `setBalanceData()` with the result
- [x] Call `hydrateBalanceSummaries()` after every `populateList()` call (inside the existing `requestAnimationFrame` callbacks)
- [ ] Verify: each employee card shows PTO category badges with correct remaining hours

### Stage 3 — Handle edge cases

- [x] Handle employees with no PTO entries (all categories should show full remaining hours)
- [x] Handle the case where `_ptoEntries` fetch fails (log error, leave badges showing "No balance data")
- [x] On `refreshEmployees()` (after add/edit/delete), re-fetch PTO entries and re-hydrate balances

### Stage 4 — Testing

- [ ] Add or update E2E test in `e2e/component-employee-list.spec.ts` to assert that balance badges are visible and show numeric values
- [x] Verify build passes: `pnpm run build`
- [x] Verify lint passes: `pnpm run lint`

## Implementation Notes

- **No new API endpoints needed** — `getAdminPTOEntries()` already exists in `APIClient.ts`
- **No new shared utilities needed** — `computeEmployeeBalanceData()` already exists in `shared/businessRules.ts`
- **Slot vs shadow DOM**: The `<pto-balance-summary>` elements are rendered as light-DOM children with `slot="balance-{id}"` inside `employee-list`. They live in `AdminEmployeesPage`'s shadow DOM, so `this.shadowRoot.querySelectorAll("pto-balance-summary")` should find them.
- **Existing pattern**: See `admin-monthly-review/index.ts` lines 182–202 for the same `computeEmployeeBalanceData` call pattern.
- **Filter to current year**: PTO entries should be filtered to the current year before computing balances, consistent with `admin-monthly-review`'s approach.

## Questions and Concerns

1.
2.
3.

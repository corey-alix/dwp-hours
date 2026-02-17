# Admin Monthly Review Per-Employee Balances

## Description

Add per-employee PTO balance summaries to the `admin-monthly-review` component. Each employee card will display a `pto-balance-summary` component showing the individual's remaining PTO balances across all categories (PTO, Sick, Bereavement, Jury Duty). This provides managers with at-a-glance visibility into each employee's PTO status during monthly reviews.

The component uses a shared `computeEmployeeBalanceData` utility function from `shared/businessRules.ts` that both `admin-monthly-review` and `employee-list` components use for consistency.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Component Template Modification

- [x] Modify `renderEmployeeCard()` in `admin-monthly-review/index.ts` to include a `<pto-balance-summary>` element at the top of each employee card
- [x] Position the balance summary at the top of each employee card, after the employee header
- [x] Ensure the component is embedded directly in the template (not via slots, following the employee-list pattern for per-item rendering)

### Phase 2: Balance Data Computation

- [x] Create a method `computeEmployeeBalanceData(employeeId: number): PtoBalanceData` that calculates remaining balances for a specific employee
- [x] Use `BUSINESS_RULES_CONSTANTS` from `shared/businessRules.ts` for annual limits
- [x] Aggregate used hours from `seedPTOEntries` (or API data in production) filtered by employee and category
- [x] Calculate remaining = annual_limit - used_hours for each category
- [x] Handle edge cases: employees with no entries (remaining = annual limit), exceeded balances (negative values)

### Phase 3: Data Injection Pattern

- [x] Override `requestUpdate()` or add a custom method to imperatively set balance data on each `<pto-balance-summary>` after render
- [x] Use `this.shadowRoot.querySelectorAll("pto-balance-summary")` to find all instances
- [x] Match each component to its employee using a data attribute (e.g., `data-employee-id`)
- [x] Call `setBalanceData()` on each with computed data for that employee
- [x] Ensure data updates when month changes (recompute balances for new month data)

### Phase 4: Testing and Validation

- [ ] Update `admin-monthly-review/test.ts` to compute and set balance data for each employee card
- [ ] Use `seedEmployees`, `seedPTOEntries`, and business rules to generate realistic balance data
- [ ] Ensure at least one employee shows negative balances for testing exceeded scenarios
- [ ] Manual testing: verify balance summaries appear in each card on `test.html`
- [ ] Run existing E2E tests to confirm no regressions

### Phase 5: Documentation and Quality Gates

- [ ] Update `admin-monthly-review/README.md` to document the per-employee balance feature
- [ ] Ensure `pnpm run build` passes
- [ ] Ensure `pnpm run lint` passes
- [ ] Manual testing across different months and employee data sets

## Implementation Notes

- **Pattern Consistency**: Follow the same approach as `employee-list` component - embed `<pto-balance-summary>` directly in the card template and set data imperatively after render
- **Data Source**: Use existing `AdminMonthlyReviewItem` data plus business rules for balance calculations (no new API calls needed)
- **Performance**: Compute balances only when data changes (month selection, acknowledgment updates)
- **TypeScript**: Use `PtoBalanceData` and `PtoBalanceSummary` types from shared models
- **Styling**: Balance summaries should fit naturally within the employee card layout
- **Accessibility**: Ensure screen readers can navigate the balance information within each card

## Questions and Concerns

1.
2.
3.

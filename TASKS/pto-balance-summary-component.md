# PTO Balance Summary Component

## Description

Implement a new web component called `pto-balance-summary` that displays the amount of available time remaining (or exceeded) in each PTO category. This component will be rendered in a summary area at the bottom of the `admin-monthly-review` component and slotted into various other components including `pto-calendar`, `employee-form`, `employee-list`, `pto-employee-info-card`, `pto-request-queue`, `pto-summary-card`, and `pto-accrual-card`.

The component will show positive values styled with the semantic `--color-success` token for remaining time and negative values styled with the semantic `--color-error` token for exceeded time, providing an at-a-glance visual indicator of PTO balances across categories. This is designed for managers to quickly spot employees who have exceeded available time, and for employees to see what remains before scheduling.

The component accepts a bespoke data model (`PtoBalanceData`) rather than reusing existing API models. Within `employee-list`, a `pto-balance-summary` instance will be rendered per-employee inside each employee card.

## Priority

🟢 Low Priority

## Checklist

### Phase 0: Prerequisite — Migrate `employee-list` to `BaseComponent`

The `employee-list` component currently extends raw `HTMLElement` with imperative rendering (`this.shadow.innerHTML = ...`) and manual event listener setup. It must be migrated to `BaseComponent` before per-employee slots can work cleanly.

- [ ] Refactor `EmployeeList` to extend `BaseComponent` instead of `HTMLElement`
- [ ] Remove manual `this.shadow = this.attachShadow(...)` (handled by `BaseComponent` constructor)
- [ ] Convert `render()` from imperative `this.shadow.innerHTML = ...` to declarative `return templateString` pattern
- [ ] Replace manual `setupEventListeners()` with `handleDelegatedClick()` and `handleDelegatedSubmit()` overrides
- [ ] Replace `this.render()` calls with `this.requestUpdate()`
- [ ] Replace `this.shadow` references with `this.shadowRoot`
- [ ] Verify existing `<slot name="top-content">` still works after migration
- [ ] Run existing E2E tests to confirm no regressions
- [ ] Update `filterEmployees()` to work with BaseComponent's render cycle

### Phase 1: Component Design and Planning

- [ ] Define bespoke `PtoBalanceData` model in `shared/api-models.ts`:
  ```typescript
  export interface PtoBalanceCategoryItem {
    category: PTOType; // "PTO" | "Sick" | "Bereavement" | "Jury Duty"
    remaining: number; // positive = available, negative = exceeded
  }
  export interface PtoBalanceData {
    employeeId: number;
    employeeName: string;
    categories: PtoBalanceCategoryItem[];
  }
  ```
- [ ] Define component API (properties: `PtoBalanceData`, events: none, slots: none)
- [ ] Design compact at-a-glance layout (horizontal category chips or inline badges)
- [ ] Plan integration points with existing components

### Phase 2: Core Component Implementation

- [ ] Create `client/components/pto-balance-summary/` folder structure
- [ ] Implement `PtoBalanceSummary` class extending `BaseComponent` (not raw `HTMLElement`)
- [ ] Add shadow DOM rendering with summary display
- [ ] Implement semantic color coding using CSS custom properties (--color-success for positive balances, --color-error for negative balances)
- [ ] Add responsive design for different container sizes

### Phase 3: Data Integration

- [ ] Connect to PTO calculation logic from `shared/businessRules.ts`
- [ ] Implement event-driven data flow: dispatch events for data requests, receive data via method injection (`setBalanceData(data: PtoBalanceData)`); no direct API calls from the component
- [ ] Handle all four PTO categories: PTO, Sick, Bereavement, Jury Duty (per `PTOType` in `shared/businessRules.ts`)
- [ ] Display only remaining/exceeded value per category (no annual limits or breakdowns — at-a-glance only)
- [ ] Add error handling for missing or invalid data

### Phase 4: Integration with Admin Monthly Review

- [ ] Add summary area slot to `admin-monthly-review` component
- [ ] Integrate `pto-balance-summary` into the bottom section
- [ ] Test rendering within admin monthly review context

### Phase 5: Integration with Other Components

- [ ] Add slots to `pto-calendar` component
- [ ] Add slots to `employee-form` component
- [ ] Render `pto-balance-summary` per-employee inside each `employee-list` card row
- [ ] Add slots to `pto-employee-info-card` component
- [ ] Add slots to `pto-request-queue` component
- [ ] Add slots to `pto-summary-card` component
- [ ] Add slots to `pto-accrual-card` component

### Phase 6: Testing and Validation

- [ ] Write unit tests for component logic
- [ ] Add E2E tests for component rendering
- [ ] Manual testing across all integrated components
- [ ] Test edge cases (zero balances, negative balances, missing data)
- [ ] Validate color coding and visual indicators

### Phase 7: Registration and Integration

- [ ] Register custom element with `customElements.define('pto-balance-summary', PtoBalanceSummary)`
- [ ] Export component from `client/components/index.ts`
- [ ] Add playground import/export to `client/components/test.ts`
- [ ] Create `test.html` and `test.ts` following project conventions

### Phase 8: Documentation and Quality Gates

- [ ] Update component README.md with usage examples
- [ ] Update API documentation for new component
- [ ] Ensure `pnpm run build` passes
- [ ] Ensure `pnpm run lint` passes
- [ ] Code review for adherence to project standards

## Implementation Notes

- Follow existing web component patterns in the project
- Use CSS custom properties for consistent theming
- Utilize atomic CSS utilities from `client/atomic.css` for consistent utility classes where applicable
- Use semantic color names (--color-success, --color-error) instead of stylistic names (green, red)
- Leverage `shared/dateUtils.ts` for any date-related calculations
- Ensure component is lightweight and performant
- Consider accessibility (ARIA labels, keyboard navigation)
- Use TypeScript strict mode and proper type definitions

## Questions and Concerns

_Resolved:_

1. ✅ `employee-list` will be migrated to `BaseComponent` as a prerequisite (Phase 0).
2. ✅ Per-employee placement — one `pto-balance-summary` per employee card row.
3. ✅ Bespoke `PtoBalanceData` model with pre-computed remaining values per category.
4. ✅ At-a-glance only — show remaining/exceeded value, no annual limits or "used / limit" breakdown.

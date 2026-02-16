# PTO Balance Summary Component

## Description

Implement a new web component called `pto-balance-summary` that displays the amount of available time remaining (or exceeded) in each PTO category. This component will be rendered in a summary area at the bottom of the `admin-monthly-review` component and slotted into various other components including `pto-calendar`, `employee-form`, `employee-list`, `pto-employee-info-card`, `pto-request-queue`, `pto-summary-card`, and `pto-accrual-card`.

The component will show positive values in green for remaining time and negative values in red for exceeded time, providing a quick visual indicator of PTO balances across categories.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Component Design and Planning

- [ ] Analyze existing PTO data structures and categories
- [ ] Define component API (properties, events, slots)
- [ ] Design component styling and layout
- [ ] Plan integration points with existing components

### Phase 2: Core Component Implementation

- [ ] Create `client/components/pto-balance-summary/` folder structure
- [ ] Implement `PtoBalanceSummary` class extending `HTMLElement`
- [ ] Add shadow DOM rendering with summary display
- [ ] Implement semantic color coding using CSS custom properties (--color-success for positive balances, --color-error for negative balances)
- [ ] Add responsive design for different container sizes

### Phase 3: Data Integration

- [ ] Connect to PTO calculation logic from `shared/businessRules.ts`
- [ ] Implement data fetching for employee PTO balances
- [ ] Handle different PTO categories (vacation, sick, personal, etc.)
- [ ] Add error handling for missing or invalid data

### Phase 4: Integration with Admin Monthly Review

- [ ] Add summary area slot to `admin-monthly-review` component
- [ ] Integrate `pto-balance-summary` into the bottom section
- [ ] Test rendering within admin monthly review context

### Phase 5: Integration with Other Components

- [ ] Add slots to `pto-calendar` component
- [ ] Add slots to `employee-form` component
- [ ] Add slots to `employee-list` component
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

### Phase 7: Documentation and Quality Gates

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

1.
2.
3.

# Admin Employee Inline Editing

## Description

Add an inline editing flow for employees in the admin panel. When an admin clicks Edit on an employee card, the card should be replaced with an `employee-form` prefilled for that employee. Saving or canceling should restore the card and keep the list stable.

## Priority

🟢 Low Priority

## Checklist

### Stage 1: Component API and layout wiring

- [x] Define or confirm events for edit intent, save, and cancel using properties down/events up
- [x] Update `employee-list` to render an inline editor slot for a single active employee
- [x] Update `admin-panel` to supply the selected employee data to the inline editor
- [x] Validate the inline editor renders in place of the employee card without layout shifts
- [x] No TypeScript compilation errors in modified components
- [x] Update admin-panel tests to reflect inline editing behavior (editing-employee-id attribute)

### Stage 2: State behavior and UX details

- [x] Ensure only one inline editor can be open at a time (implemented via single editingEmployeeId property)
- [ ] Restore the employee card on cancel, preserving list order and scroll position
- [ ] On save, update the local employee list and emit a change event for API integration
- [ ] Add focus management to move focus into the form and back to the card actions on exit

### Stage 3: Testing and quality gates

- [ ] Extend component playground tests for inline edit open/save/cancel flows
- [ ] Update admin-panel test.ts to handle in-memory employee model updates on edit save events (preserve edits using seedData)
- [x] Update E2E tests to reflect inline editing selectors (employee-form now inside employee-list, not admin-panel) - RESOLVED: Restored slot-based form for adding employees
- [ ] Add Playwright coverage for inline editing in the admin panel page
- [ ] Update component documentation with the new events and props
- [x] Verify `npm run build` and `npm run lint`
- [ ] Perform manual UI testing for keyboard navigation and regression checks

## Implementation Notes

- Keep components API-agnostic; emit events instead of calling APIs directly.
- Use strongly typed DOM helpers like `querySingle` and avoid type casts.
- Do not add business logic to client components; use shared business rules as needed.
- Prefer small, local state changes to avoid re-rendering the entire list.

### Stage 1 Implementation Details

**Event Flow Confirmed:**

- Edit intent: `employee-edit` event from `employee-list` with `{ employeeId: number }`
- Save: `employee-submit` event from `employee-form` with `{ employee: Employee, isEdit: boolean }`
- Cancel: `form-cancel` event from `employee-form`

**Component Changes:**

- Added `editing-employee-id` attribute/property to `employee-list` to control which employee is being edited inline
- Modified `employee-list.render()` to show `employee-form` instead of employee card when `editingEmployeeId` matches
- Updated `admin-panel` to set `editingEmployeeId` on `employee-list` instead of using slot-based form
- Added event forwarding in `employee-list` to bubble `employee-submit` and `form-cancel` events from inline forms
- Ensured only one inline editor can be active at a time via single `editingEmployeeId` property

**Next Steps for Stage 2:**

- Focus management: When inline editor opens, focus should move to first form field
- On cancel/save, focus should return to the Edit button of the restored employee card
- Update local employee list in `admin-panel` when save occurs to reflect changes immediately
- Ensure list scroll position is preserved during edit/cancel operations

### Current Status & Remaining Work

**✅ Stage 1 Complete**: Component API and layout wiring implemented successfully. The inline editing flow works at the component level - clicking Edit on an employee card replaces it with an employee-form, and the form events properly bubble up through the component hierarchy.

**✅ E2E Compatibility**: Restored slot-based form rendering for adding new employees while maintaining inline editing for existing employees. E2E tests now pass.

**🔄 Stage 2 Partial**: Basic state management is working (only one editor at a time), but UX polish is needed:

- Focus management between form and card actions
- Local state updates on save for immediate UI feedback
- Scroll position preservation

**❌ Stage 3 Remaining**: Need to complete testing and documentation:

- Component playground tests for inline edit flows
- Test harness updates for in-memory model updates
- Playwright E2E coverage for inline editing
- Component documentation updates
- Full quality gate verification

**How to Complete Stage 3:**

1. **Update Test Harness**: Modify `admin-panel/test.ts` to handle in-memory updates when edits are saved (listen for update-employee events and update the seed data)
2. **Add Inline Edit E2E Tests**: Create new E2E tests specifically for the inline editing flow (edit existing employee, save, cancel)
3. **Component Documentation**: Update README files with new inline editing behavior
4. **Quality Gates**: Run full test suite, lint, and build verification

**Implementation Approach:**

- The core inline editing functionality is working and E2E compatible
- Focus on test harness updates and additional E2E coverage
- UX improvements (focus management, state updates) can be implemented incrementally
- All changes maintain the API-agnostic component design

## Questions and Concerns

1.
2.
3.

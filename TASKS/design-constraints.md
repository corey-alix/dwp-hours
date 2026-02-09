# Design Constraints Compliance

## Description

Address violations of established Design Constraints in the codebase to improve type safety, error handling, and code maintainability. This involves replacing DOM query methods, removing unsafe type casting, and enforcing proper TypeScript types for web components.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Core Component Files (High Priority)

- [ ] **Replace getElementById in pto-entry-form/index.ts** (12 instances): Change `this.shadow.getElementById('id') as Type` to `querySingle<Type>('#id', this.shadow)`
- [ ] **Replace getElementById in report-generator/index.ts** (7 instances): Update all shadow root queries
- [ ] **Replace getElementById in data-table/index.ts** (1 instance): Update page size select query
- [ ] **Replace getElementById in employee-list/index.ts** (2 instances): Update search input and add button queries
- [ ] **Verify querySingle utility supports shadow root scoping**: Ensure `querySingle` works correctly with shadow DOM contexts
- [ ] **Add missing component class imports**: Import `PtoEntryForm`, `ReportGenerator`, etc. where needed
- [ ] **Run unit tests after Phase 1 changes**: Ensure no regressions in component functionality

### Phase 2: Test Files (Medium Priority)

- [ ] **Update pto-entry-form/test.ts**: Replace `as any` with `PtoEntryForm` type and update shadow root queries
- [ ] **Update report-generator/test.ts**: Replace `querySingle('report-generator') as any` with proper type
- [ ] **Update pto-employee-info-card/test.ts**: Replace `as any` with specific card type
- [ ] **Update data-table/test.ts**: Replace `as any` with specific table type
- [ ] **Update pto-sick-card/test.ts**: Replace `as any` with specific card type
- [ ] **Update pto-bereavement-card/test.ts**: Replace `as any` with specific card type
- [ ] **Update employee-list/test.ts**: Replace `as any` with specific list type
- [ ] **Update pto-summary-card/test.ts**: Replace `as any` with specific card type
- [ ] **Update pto-request-queue/test.ts**: Replace `as any` with specific queue type
- [ ] **Update admin-panel/test.ts**: Replace `as any` with specific panel type
- [ ] **Update employee-form/test.ts**: Replace `as any` with specific form type
- [ ] **Update pto-jury-duty-card/test.ts**: Replace `as any` with specific card type
- [ ] **Run unit tests after Phase 2 changes**: Ensure test files compile and execute correctly

### Phase 3: Main Application Code (Medium Priority)

- [ ] **Update app.ts web component queries** (5 instances): Replace `as any` with specific component types for admin-panel, pto-accrual-card, bereavement/jury-duty cards
- [ ] **Remove unnecessary type casting in app.ts**: Clean up any remaining `as Type` casts where generics can be used
- [ ] **Update test-utils.ts if needed**: Add any missing utility functions for shadow root queries
- [ ] **Run unit tests after Phase 3 changes**: Ensure main application code works correctly

### Phase 4: Quality Assurance and Documentation

- [ ] **Run full test suite**: Execute `npm test` to ensure all changes pass
- [ ] **Verify build passes**: Run `npm run build` successfully
- [ ] **Verify linting passes**: Run `npm run lint` with no errors
- [ ] **Manual testing**: Test affected components in browser to ensure functionality works
- [ ] **Update component READMEs**: Document any changes to component APIs or usage patterns
- [ ] **Code review**: Review changes for consistency and adherence to design constraints

## Implementation Notes

- **Design Constraints to Enforce**:
  - Use `querySingle` instead of `getElementById` for DOM element queries to ensure errors are thrown if elements are not found
  - Do not use type casting (e.g., `as any`). Web components have specific types (e.g., `PtoEntryForm` for `pto-entry-form` elements) - use them for strong typing
  - `<any>` should be a last resort; leverage TypeScript's strict mode and proper type definitions for DOM elements
- **Current Violations Found**:
  - ~20 instances of `getElementById` in component files (mostly with type casting)
  - ~20 instances of `as any` across test files and main application code
  - Web component queries using generic `any` type instead of specific classes
- **Incremental Approach**: Implement changes in phases to maintain working code and catch issues early
- **Type Safety**: Ensure all web component interactions use proper TypeScript types
- **Error Handling**: `querySingle` provides better error handling than `getElementById` which returns null
- **Shadow DOM Support**: Verify that `querySingle` correctly handles shadow root scoping

## Questions and Concerns

1. Are there any web component types that don't exist yet and need to be defined?
2. Should we create a comprehensive list of all component class types for reference?
3. Are there any edge cases with shadow DOM querying that need special handling?
4. Should we add TypeScript interfaces for component properties to improve type safety?</content>
   <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/design-constraints.md

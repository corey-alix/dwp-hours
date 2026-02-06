# Design Constraints Compliance

## Overview
This task addresses violations of the established Design Constraints in the current codebase. The goal is to improve type safety, error handling, and code maintainability by enforcing consistent patterns for DOM queries and type usage.

## Design Constraints to Enforce
- Use `querySingle` instead of `getElementById` for DOM element queries to ensure errors are thrown if elements are not found
- Do not use type casting (e.g., `as any`). Web components have specific types (e.g., `PtoEntryForm` for `pto-entry-form` elements) - use them for strong typing
- `<any>` should be a last resort; leverage TypeScript's strict mode and proper type definitions for DOM elements

## Current Violations Found
- ~20 instances of `getElementById` in component files (mostly with type casting)
- ~20 instances of `as any` across test files and main application code
- Web component queries using generic `any` type instead of specific classes

## Implementation Checklist

### Core Component Files (High Priority)
- [ ] **Replace getElementById in pto-entry-form/index.ts** (12 instances): Change `this.shadow.getElementById('id') as Type` to `querySingle<Type>('#id', this.shadow)`
- [ ] **Replace getElementById in report-generator/index.ts** (7 instances): Update all shadow root queries
- [ ] **Replace getElementById in data-table/index.ts** (1 instance): Update page size select query
- [ ] **Replace getElementById in employee-list/index.ts** (2 instances): Update search input and add button queries

### Test Files (Medium Priority)
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

### Main Application Code (Medium Priority)
- [ ] **Update app.ts web component queries** (5 instances): Replace `as any` with specific component types for admin-panel, pto-accrual-card, bereavement/jury-duty cards
- [ ] **Remove unnecessary type casting in app.ts**: Clean up any remaining `as Type` casts where generics can be used

### Supporting Changes
- [ ] **Add component class imports**: Import `PtoEntryForm`, `ReportGenerator`, etc. in files where needed
- [ ] **Verify querySingle utility**: Ensure `querySingle` supports all needed shadow root scoping patterns
- [ ] **Update test-utils.ts if needed**: Add any missing utility functions for shadow root queries

## Completion Criteria
- [ ] All `getElementById` calls replaced with `querySingle`
- [ ] All `as any` usages removed or justified as necessary
- [ ] Web components use specific class types
- [ ] TypeScript compilation passes without errors
- [ ] All existing tests pass
- [ ] No runtime errors from missing elements
- [ ] Code builds successfully (`npm run build`)
- [ ] Linting passes (`npm run lint`)

## Testing Requirements
- Run full test suite after each major change
- Manual testing of affected components
- Verify error handling when elements are missing
- Check browser console for any new errors

## Notes
- Start with core component files for highest impact
- Test files can be updated incrementally
- Some `as any` in test files may be acceptable if component types are complex, but prefer specific types
- If component classes don't exist, they may need to be defined first</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/design-constraints.md
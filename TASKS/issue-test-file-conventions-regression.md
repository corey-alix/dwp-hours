# Issue: Test File Conventions Departure from Web Components Assistant Best Practices

## Issue Summary

The test files in various PTO dashboard and other components are not adhering to the established conventions outlined in the web-components-assistant skill. This departure from best practices affects the separation of concerns between HTML structure and TypeScript logic, leading to inconsistent testing patterns and maintenance issues. Additionally, test.ts files contain internal hardcoded data structures instead of deriving all test data from shared/seedData.ts.

## Previously Working

- `test.html` contained only the basic HTML structure and a call to the test function
- `test.ts` read test data from `seedData.ts` and programmatically set component attributes
- Clear separation between markup and logic, following web component testing best practices

## Current Behavior

- `test.html` includes inline attribute settings for `pto-entries`, `accruals`, `usage`, etc. on the `<pto-accrual-card>` element
- `test.ts` defines hardcoded test data instead of importing from `seedData.ts`
- `test.ts` contains internal data structures like `ptoStatus` that should be computed from `seedData.ts`
- Violation of the convention that HTML should only define elements, while TypeScript handles data and initialization
- Violation of the convention that all test data should come from `seedData.ts` with no internal hardcoded values

## Expected Behavior

- `test.html` should only define the web components without setting attributes programmatically
- `test.ts` should import and use data from `seedData.ts` only, with no internal hardcoded data structures
- All test data (including computed values like `ptoStatus`) should be derived from `seedData.ts`
- Internal data structures like `ptoStatus` should be removed and replaced with computations from `seedData.ts`
- Maintain clean separation of concerns for better maintainability and consistency with web component testing patterns
- This applies to all test.ts files across all components

## Steps to Reproduce

1. Open `/client/components/pto-dashboard/test.html`
2. Observe that the `<pto-accrual-card>` element has inline attributes like `pto-entries='[...]'`
3. Open `/client/components/pto-dashboard/test.ts`
4. Note that test data is hardcoded in the file instead of imported from `seedData.ts`
5. Compare with the web-components-assistant skill guidelines

## Impact

- **Severity**: Medium - Affects development workflow and code maintainability
- **Affected Users**: Developers working on PTO dashboard component testing
- **Consequences**: Inconsistent testing patterns, potential for duplicated data, harder maintenance

## Potential Root Causes

- Recent refactoring of test files may have deviated from established conventions
- Lack of automated checks or linting rules for test file structure
- Insufficient documentation or enforcement of the web-components-assistant guidelines
- Changes made during jury duty approval indicators implementation may have introduced these violations

## Clarifying Questions

1. **When were these test files last modified and by whom?**  
   _This is not a regression but a departure from best practices_

2. **Are there other test files in the project that follow similar patterns?**  
   _Probably - take a look and add them as tasks to this issue file_

3. **Has the web-components-assistant skill been updated recently?**  
   _Yes, update SKILL.md as needed_

4. **Are there any specific reasons for the current inline attribute approach?**  
   _It made sense at the time, but now it is a design constraint to do this in "test.ts" and not "test.html"_

5. **Does this affect the functionality of the tests or just the code organization?**  
   _Organization only_

## Investigation Checklist

- [x] Review git history of `test.html` and `test.ts` to identify when changes were made
- [x] Check other component test files for similar patterns
- [x] Verify that the web-components-assistant skill guidelines are current and accurate
- [x] Test that refactoring doesn't break existing functionality
- [x] Ensure `seedData.ts` contains appropriate test data for PTO dashboard components

### Additional Files with Similar Issues

Based on investigation, the following test files also have inline attributes that should be moved to test.ts:

- [x] `client/components/pto-entry-form/test.html` - has `available-pto-balance="1000"`
- [x] `client/components/pto-dashboard/test.html` - has multiple inline attributes (request-mode, annual-allocation, accruals, usage, pto-entries, year)

## Investigation Findings

### Git History Analysis

Recent commits affecting the test files:

- `e186072` - prettier+husky (formatting changes)
- `58813c4` - PTO balance validation implementation
- `74af4c6` - Date utils integration
- `7e7d1cf` - PTO entry form enhancements
- `8817b07` - PTO entry form component implementation
- `df3ac5b` - Add stylesheets to test HTML files
- `bc6ac18` - PTO accrual card enhancements
- `a20f149` - Update PTO and jury duty data in tests
- `a5915cb` - PTO dashboard components refactor
- `c0889b5` - PTO entry handling refactor

The violations appear to have been introduced during recent development work, particularly during the PTO dashboard refactor and jury duty approval indicators implementation.

### Test File Pattern Analysis

Out of 19 test.html files in the components directory, only 2 have inline attributes:

- `pto-dashboard/test.html`: Multiple attributes (request-mode, annual-allocation, accruals, usage, pto-entries, year)
- `pto-entry-form/test.html`: Single attribute (available-pto-balance)

All other test files follow the proper pattern of defining components without inline attributes.

### Web Components Assistant Guidelines Status

The SKILL.md guidelines are current and accurate. The design constraint has been added: "HTML test files must NOT contain inline attributes on web components. All data and configuration must be set programmatically in the corresponding test.ts file."

### Seed Data Availability

`shared/seedData.ts` contains appropriate test data for PTO dashboard components, including:

- 2026 PTO entries for employee_id: 1 with approved_by fields
- Matching data structure for the hardcoded entries in test files
- All required types: Sick, PTO, Bereavement, Jury Duty

### Functionality Impact Assessment

Since the issue affects only code organization (as confirmed in clarifying questions), refactoring should not break existing functionality. The inline attributes are equivalent to programmatic property setting, so moving them to test.ts will maintain the same behavior while improving code structure.

## Suggested Debugging Steps

1. Examine the current `test.html` and `test.ts` files against the web-components-assistant conventions
2. Identify all hardcoded data that should be moved to `seedData.ts`
3. Plan the refactoring to separate HTML structure from data initialization
4. Implement the changes incrementally, testing after each step
5. Update any related documentation

## Status: Ready for Implementation

Investigation complete. The issue is confirmed as a departure from best practices affecting only code organization. Required data is available in seedData.ts, and refactoring will not break functionality. Proceed with Phase 2 and Phase 3 implementation.

### Phase 1: Analysis and Planning

- [x] Review the web-components-assistant skill guidelines in detail
- [x] Audit current test files for all violations
- [x] Identify required data structures in `seedData.ts`

### Phase 2: Refactor test.html Files

- [x] Remove all inline attribute settings from `<pto-accrual-card>` and other components in pto-dashboard/test.html
- [x] Remove `available-pto-balance` attribute from pto-entry-form/test.html
- [x] Ensure HTML only contains element definitions and the test function call
- [x] Preserve any necessary CSS or structural elements

### Phase 3: Update test.ts Files

- [x] Import test data from `seedData.ts` for affected components (data already available)
- [x] Remove all internal hardcoded data structures (like `ptoStatus`) from test.ts files
- [x] Compute all test data structures from `seedData.ts` only
- [x] Update the playground functions to set component properties programmatically
- [x] Ensure all component initialization happens in TypeScript using data from `seedData.ts`
- [x] For pto-dashboard/test.ts: Compute `ptoStatus` from seedPTOEntries filtered for employee_id: 1 and 2026 dates
- [x] For pto-entry-form/test.ts: Set available-pto-balance programmatically from seedData
- [x] Apply this pattern to all test.ts files across all components - no internal data allowed

### Phase 4: Testing and Validation

- [x] Run existing tests to ensure no functionality is broken
- [x] Verify that the refactored test setup works correctly
- [x] Update any documentation referencing the old structure

### Phase 5: Documentation and Quality Assurance

- [x] Update component README if needed
- [x] Ensure build and lint pass
- [x] Document the changes in commit messages

## Status: Implementation Complete ✅

All phases completed successfully. Test file conventions have been fixed to follow web-components-assistant guidelines. Inline attributes removed from HTML and moved to programmatic setting in TypeScript. Internal hardcoded data structures removed from all test.ts files - all test data now computed from seedData.ts only. Build, lint, and tests all pass.

**Note**: This requirement has been applied to all test.ts files across all components. All internal hardcoded data has been removed and replaced with computations from seedData.ts.</content>
<parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/issue-test-file-conventions-regression.md

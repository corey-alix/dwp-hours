# Admin Panel Test Data Integration

## Description

Integrate seed data from seedData.ts into the admin panel test page to provide realistic test data for development and testing purposes. The seed data should be loaded in test.ts (the test harness) and passed to the admin-panel component via attributes or method calls, following the project's event-driven architecture where web components do not fetch data directly but receive it from parent components. Support two test modes: one with no seed data loaded (empty state) and one with the full seed data loaded.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Data Import Setup

- [x] Import seedData.ts in test.ts as an ES module
- [x] Ensure TypeScript compilation includes the seed data for client-side use
- [x] Verify that seedEmployees and seedPTOEntries are accessible in the test.ts scope
- [x] Unit tests: Add tests/components/admin-panel.test.ts for seedData import validation
- [x] Build and lint pass

### Phase 2: Component Data Integration

- [x] Update test.ts to pass seed data to admin-panel component via attributes or setData() method calls
- [x] Implement logic in test.ts to format and inject employee list and PTO entries into the admin panel
- [x] Ensure admin-panel component receives data without making API calls, following event-driven patterns
- [x] Unit tests: Add setEmployees method tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

### Phase 3: Dual Test Mode Implementation

- [x] Add functionality in test.ts to toggle between no seed data (empty state) and full seed data loaded
- [x] Implement data validation in test.ts to ensure seed data matches expected schema before injection
- [x] Add visual indicators in test.html or test.ts when using seed data vs. empty state
- [x] Unit tests: Add toggle functionality tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

### Phase 4: Documentation and Final Validation

- [x] Update test.html and test.ts with comments explaining seed data integration and the two test modes
- [x] Ensure implementation follows SKILL.md guidelines: no direct data fetching in components, data passed via attributes/methods
- [x] Run E2E tests if applicable to admin panel functionality with seed data
- [x] Unit tests: Add browser compatibility tests in e2e/ directory
- [x] Code review and final quality gates (build, lint, testing)

### Phase 5: Remove API Dependencies

- [x] Remove APIClient import and usage from index.ts
- [x] Remove all API calls (loadEmployees, handleEmployeeSubmit) from the component
- [x] Ensure component only handles UI state and dispatches events for data operations
- [x] Update event handling to dispatch events for all data-related actions
- [x] Unit tests: Add event dispatching tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

### Phase 6: Implement Employee Form Inline

- [x] Unit tests: Add form-cancel event handling test in tests/components/admin-panel.test.ts
- [x] Modify Employees view to include an "Add Employee" button in the header
- [x] Implement inline component functionality for displaying employee-form, inserted before the "view-container" to render between the "Add Employee" button and the list of employees
- [x] Connect "Add Employee" button to show/hide the inline employee-form
- [x] Handle form submission and cancellation within the inline form
- [x] Style the inline form appropriately for the admin panel theme
- [x] Unit tests: Add inline form functionality tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

## Implementation Notes

- Import seedData.ts directly in test.ts for data access
- Use component methods or attributes to inject data, avoiding any API calls within the admin-panel component
- Consider creating a seeding utility function in test.ts for reusability across test scenarios
- Ensure seed data is only used in test/development environments, not production
- Follow existing patterns for data handling and component communication as outlined in SKILL.md
- May need to update TypeScript configuration for client-side module resolution if issues arise
- **Testing Best Practices**: Tests should always cast to the proper type instead of generic HTMLElement (e.g., `querySelector("employee-form") as EmployeeForm` instead of `querySelector("employee-form") as HTMLElement`)
- **Testing Best Practices**: Prefer implementing methods on the component over dispatching events from unit tests when possible, but note that in some test environments (like happy-dom), `querySelector` returns generic HTMLElements that don't have access to component methods - in such cases, direct event dispatch with proper typing is the reliable approach

## Questions and Concerns

1.
2.
3.

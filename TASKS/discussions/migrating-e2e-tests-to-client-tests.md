# Discussion: Migrating E2E Tests to Client-Side Tests with JSDOM

## Description

Explore the possibility of migrating select end-to-end (E2E) tests from Playwright to client-side unit/integration tests using JSDOM in Vitest. This would involve converting component-focused tests that currently run in a full browser environment to run in a simulated DOM environment for faster execution and easier maintenance.

## Qualifying Questions

1. Which specific E2E tests are good candidates for migration based on their scope and dependencies?
2. How will API calls and external dependencies be mocked in the JSDOM environment?
3. What is the current test execution time for E2E vs. potential Vitest performance?
4. How will component initialization and shadow DOM interactions be handled in JSDOM?
5. What browser-specific behaviors (if any) are being tested that JSDOM cannot simulate?
6. How does this migration align with existing testing infrastructure and CI/CD pipelines?
7. What level of code coverage can be maintained after migration?
8. How will test data and fixtures be shared between E2E and client tests?
9. What are the skill requirements for team members to maintain JSDOM-based tests?
10. How will this affect the overall testing strategy and test maintenance burden?

## Pros

- Significantly faster test execution (seconds vs. minutes for E2E tests)
- Lower resource requirements - no need for browser instances or headless Chrome
- Easier debugging with direct access to component internals and DOM manipulation
- Reduced flakiness from browser timing issues and network dependencies
- Better suited for testing component logic and rendering in isolation
- Improved developer experience with faster feedback loops during development
- Lower infrastructure costs for CI/CD execution

## Cons

- Less realistic testing environment may miss browser-specific bugs or integration issues
- Additional complexity in setting up JSDOM environment and mocking dependencies
- Potential loss of confidence in testing real user interactions and full page flows
- Requires separate test suites for component vs. full workflow testing
- May need to duplicate test scenarios across different test types
- Learning curve for team members unfamiliar with JSDOM testing patterns
- Potential for false positives if mocks don't accurately reflect real behavior

## Alternatives

- **Keep all tests as E2E**: Maintain current Playwright setup for all tests. Benefits: Most realistic testing environment, catches integration issues. Drawbacks: Slower execution, higher maintenance cost, more prone to flakiness.
- **Hybrid approach with selective migration**: Migrate only component rendering and basic interaction tests to JSDOM, keep complex workflows as E2E. Benefits: Balances speed and realism, maintains comprehensive coverage. Drawbacks: More complex test organization and maintenance.
- **Use a different testing framework**: Switch to tools like Testing Library with JSDOM or Cypress component testing. Benefits: Purpose-built for component testing, good community support. Drawbacks: Additional learning curve, potential framework lock-in.
- **Implement parallel test execution**: Keep E2E tests but optimize execution with parallelization and better CI resources. Benefits: No code changes needed, maintains current coverage. Drawbacks: Still slower than JSDOM tests, higher infrastructure costs.
- **Create a custom test utility**: Build a shared testing utility that can run the same test code in both E2E and JSDOM environments. Benefits: Code reuse, flexible testing approaches. Drawbacks: Complex implementation, potential maintenance overhead.

## Recommendations

Based on the analysis, recommend a hybrid approach starting with migrating component rendering and basic interaction tests to JSDOM/Vitest. This provides the biggest speed improvements while maintaining E2E tests for critical workflows and integration scenarios. Begin with a pilot migration of 2-3 component tests to validate the approach before expanding.

### Candidate Tests for Migration

The following E2E tests are strong candidates for initial migration due to their focused scope on individual component behavior:

- **[component-pto-entry-form.spec.ts](e2e/component-pto-entry-form.spec.ts)**: This test validates form rendering, input validation, and basic user interactions (filling fields, clicking submit/cancel) within a single component. It navigates to a dedicated test page but doesn't involve full application workflows, authentication, or cross-component interactions. The test can be migrated to JSDOM by programmatically creating the component, simulating user events, and asserting on DOM state changes and validation messages.

- **[component-data-table.spec.ts](e2e/component-data-table.spec.ts)**: This test checks table structure, header rendering, data row display, and basic table functionality. It focuses on component initialization and static rendering rather than dynamic data loading or user workflows. Migration would involve setting up the component with test data in JSDOM and verifying the generated table HTML structure and content.

- **[component-confirmation-dialog.spec.ts](e2e/component-confirmation-dialog.spec.ts)**: This test examines dialog display, message rendering, and button interaction handling (confirm/cancel actions). It tests component lifecycle and event handling in isolation. The JSDOM version would create the dialog component, trigger show/hide events, and verify the resulting DOM changes and callback executions.

These tests are ideal candidates because they:

- Test components in relative isolation without dependencies on full application state
- Focus on rendering and basic interactions rather than complex user journeys
- Don't require real API calls or external service integrations
- Can be easily mocked and controlled in a test environment
- Represent the "low-hanging fruit" for migration with minimal risk

## Questions and Concerns

1. How to handle shadow DOM queries and component lifecycle in JSDOM?
2. What mocking strategy for APIClient and external dependencies?
3. How to ensure test data consistency between E2E and client tests?
4. What changes needed to vitest.config.ts for JSDOM environment?
5. How to measure and validate the performance improvements?
6. What fallback plan if JSDOM tests prove insufficient for component validation?

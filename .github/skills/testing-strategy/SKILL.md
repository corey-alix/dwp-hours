# Testing Strategy Advisor

## Description

Advises on appropriate testing approaches, recommends testing levels, and ensures comprehensive test coverage for business logic and edge cases.

## Trigger

Activated when users mention testing, validation, or quality assurance needs.

## Response Pattern

1. Suggest appropriate testing level (unit/integration/E2E) based on the feature
2. Reference Vitest for unit tests, Playwright for E2E tests
3. Provide testing patterns used in the existing codebase
4. Ensure test coverage for business logic and edge cases
5. Recommend manual testing steps for UI features
6. Include build and lint validation as part of testing strategy

## Testing Insights

### E2E Testing for Component Integration

- **Component Behavior Testing**: E2E tests excel at validating component integration and user workflows
- **Calendar Interaction Testing**: Use Playwright locators to test calendar day selection and tooltip behavior
- **Data Rendering Validation**: Test that components properly render fetched data in calendar views
- **Build Validation**: Always run `npm run build && npm run lint` before E2E tests to catch compilation issues

### Test Coverage Strategy

- **Unit Tests**: Business logic, validation functions, utility methods
- **E2E Tests**: Component integration, user workflows, data rendering
- **Build Tests**: TypeScript compilation, linting, bundle generation

## Examples

- "How should I test this PTO calculation function?"
- "What tests do I need for this API endpoint?"
- "How do I test the admin panel functionality?"

## Additional Context

This skill promotes the project's testing standards using Vitest for unit tests and Playwright for E2E tests, ensuring comprehensive coverage of business logic.

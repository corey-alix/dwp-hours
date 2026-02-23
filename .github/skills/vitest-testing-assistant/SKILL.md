---
name: vitest-testing-assistant
description: Provides guidance for implementing unit and integration tests using Vitest, following best practices for test structure, mocking, and coverage.
---

# Vitest Testing Assistant

## Description

Provides guidance for implementing unit and integration tests using Vitest, following best practices for test structure, mocking, and coverage. Helps set up and maintain comprehensive test suites for the DWP Hours Tracker backend and business logic.

## Trigger

Activated when users mention unit testing, Vitest, test coverage, mocking, API testing, or ask about testing backend functions, database operations, or business logic validation.

## Test File Refactoring Validation

When modifying test setup code, use unit tests to validate changes:

1. **Import Changes**: Test that new imports (like seedData.ts) work correctly
2. **Data Transformation**: Validate that data filtering and transformation logic produces expected results
3. **Component Initialization**: Ensure programmatic property setting matches previous inline attribute behavior
4. **Type Safety**: Verify TypeScript compilation passes with refactored code

**Example**: After replacing hardcoded test data with seedData imports, run unit tests to confirm data integrity and component behavior.

## Response Pattern

1. Assess current test coverage and identify gaps in unit/integration testing
2. Recommend test structure following Vitest best practices (describe/it blocks, proper naming, test isolation)
3. Guide implementation of specific test cases with appropriate mocking and assertions
4. Suggest test organization patterns and coverage improvement strategies
5. Ensure tests align with project quality gates and TASKS/testing-suite.md requirements

## Examples

- "How do I write unit tests for the PTO calculation functions?"
- "Help me test the API endpoints with Vitest"
- "What's the best way to mock database operations in tests?"
- "How do I set up test coverage reporting?"
- "My Vitest tests are slow, how can I optimize them?"

## Additional Context

This skill integrates with the existing testing strategy defined in TASKS/testing-suite.md and follows Vitest's official best practices. Focuses on fast, reliable unit tests that complement the Playwright E2E testing setup. Prioritizes test maintainability, proper mocking strategies, and comprehensive coverage for critical business logic.

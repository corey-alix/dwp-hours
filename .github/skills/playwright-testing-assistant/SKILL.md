# Playwright Testing Assistant

## Description
Provides guidance for implementing end-to-end tests using Playwright, following best practices for test structure, reliability, and maintainability. Helps set up and maintain E2E test suites for the DWP Hours Tracker application.

## Trigger
Activated when users mention Playwright testing, E2E testing, browser automation, test setup, or ask about testing frontend functionality, user workflows, or integration testing.

## Response Pattern
1. Assess current testing setup and identify gaps in E2E coverage
2. Recommend test structure following Playwright best practices (page objects, test isolation, descriptive naming, and test.step() for logical grouping of actions)
3. Guide implementation of specific test scenarios with proper selectors and assertions
4. Suggest debugging approaches for flaky tests and CI/CD integration
5. Ensure tests align with project quality gates and TASKS/testing-suite.md requirements

## Examples
- "How do I set up Playwright tests for the login functionality?"
- "Help me write E2E tests for the PTO submission workflow"
- "My Playwright test is flaky, how can I fix it?"
- "What's the best way to organize Playwright tests in this project?"
- "How do I run Playwright tests in CI/CD?"

## Additional Context
This skill integrates with the existing testing strategy defined in TASKS/testing-suite.md and follows Playwright's official best practices. Focuses on reliable, maintainable E2E tests that complement the existing Vitest unit testing setup. Prioritizes test stability, proper isolation, and clear reporting for CI/CD pipelines.

Understands and promotes the use of `test.step()` for organizing test actions into logical, reportable steps that improve test readability and debugging. `test.step()` allows nesting of steps, returns values from the step body, and supports options like `box` to point errors to the step call site instead of internal actions, enhancing error reporting clarity.
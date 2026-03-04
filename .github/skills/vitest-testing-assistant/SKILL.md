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

## Test Execution Ordering

Vitest provides several mechanisms that control the order in which tests run. Tests **must never depend on execution order** — each test should be fully self-contained via proper `beforeEach`/`afterEach` setup and teardown.

### Default Behavior

- **Within a `describe` block**: tests run **sequentially in definition order** by default.
- **Across `describe` blocks in the same file**: blocks run sequentially in definition order by default.
- **Across files**: files may run in parallel (worker threads) unless `--no-threads` is used.

### Ordering Modifiers

| Modifier                                  | Effect                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `describe.concurrent` / `test.concurrent` | Runs inner tests or marked tests **in parallel** within the suite.                                                                                                 |
| `describe.sequential` / `test.sequential` | Forces **sequential** execution even inside a `describe.concurrent` or when `--sequence.concurrent` is active.                                                     |
| `describe.shuffle` / `--sequence.shuffle` | Randomizes test order within the suite (seed-based via `sequence.seed`). Shuffle is **inherited** by nested describes unless overridden with `{ shuffle: false }`. |
| `--sequence.concurrent` (config)          | Makes **all** tests concurrent by default (opt out with `.sequential`).                                                                                            |

### Key Isolation Pitfalls

1. **Module-level singleton state**: If a module under test has `let` variables at module scope (e.g., `lastBackupMtime`), that state persists across all tests in the file. `beforeEach` must explicitly reset or account for this state.
2. **Absolute vs. relative assertions**: Never assert absolute counts (e.g., `expect(items.length).toBe(1)`) when prior tests or `beforeEach` hooks may have created items. Instead, **capture the initial state** at the start of each test and assert relative changes:
   ```typescript
   it("should add one item", () => {
     const initialCount = getItems().length;
     addItem();
     expect(getItems().length).toBe(initialCount + 1);
   });
   ```
3. **Filesystem mtime collisions**: On filesystems with 1-second mtime resolution, two writes in the same second produce identical mtimes. Tests that rely on mtime-based change detection can intermittently fail if a previous test set the "last known mtime" to the same value.
4. **`beforeEach` should clean, not just create**: Use `beforeEach` to remove stale artifacts (files, directories) rather than only creating them if they don't exist. This prevents state leaking from a previous test's side effects.

### Best Practice Summary

- Treat every `it()` as if it could run first, last, or in isolation.
- Use `beforeEach` to establish a **known clean state** — don't rely on `afterEach` alone.
- Assert **relative changes** from a captured baseline, not absolute values.
- When testing code with module-level state that cannot be reset via public API, use `vi.resetModules()` or dynamic `import()` to get a fresh module instance.

## Additional Context

This skill integrates with the existing testing strategy defined in TASKS/testing-suite.md and follows Vitest's official best practices. Focuses on fast, reliable unit tests that complement the Playwright E2E testing setup. Prioritizes test maintainability, proper mocking strategies, and comprehensive coverage for critical business logic.

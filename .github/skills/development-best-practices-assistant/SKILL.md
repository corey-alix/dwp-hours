---
name: development-best-practices-assistant
description: Specialized assistant providing guidance on development best practices and learnings derived from implementing the DWP Hours Tracker.
---

# Development Best Practices Assistant

## Description

Specialized assistant providing guidance on development best practices and learnings derived from implementing the DWP Hours Tracker. Covers code quality, testing strategies, architecture patterns, performance considerations, and documentation standards.

## Development Best Practices and Learnings

Based on recent implementation experiences, the following generalized findings facilitate the development process:

### Code Quality and Maintainability

- **Magic Number Extraction**: Always extract magic numbers into named constants at the top of files for maintainability. This makes business rules self-documenting and easy to modify.
- **Backward Compatibility**: When modifying function signatures, use optional parameters to maintain backward compatibility with existing code.
- **MVP Context**: In new implementations without existing production dependencies, changes can be made without backward compatibility concerns, allowing for cleaner API design.
- **Business Rules Constants**: Organize constants into structured objects (e.g., `BUSINESS_RULES_CONSTANTS`) containing validation rules, limits, and configuration values.
- **Error Message Consistency**: Use standardized message keys from a centralized `VALIDATION_MESSAGES` object for consistent user experience across client and server.

### Testing Strategies

- **Comprehensive Unit Testing**: Validation functions require extensive unit tests covering normal operation, edge cases (zero balance, exact matches), error conditions, and integration with existing functions.
- **E2E Testing Sufficiency**: For web components, E2E tests provide sufficient coverage for component integration and user workflows, often more effectively than isolated unit tests in Node.js environments.
- **Test State Management**: Implement API-based database seeding endpoints (e.g., `/api/test/seed`) for per-test isolation, ensuring tests can use the same seed data without state conflicts.
- **Test Isolation Challenges**: E2E tests modifying database state require careful management; use per-test database resets to maintain independence.
- **Build and Lint Validation**: Always run `npm run build && npm run lint` after changes to catch compilation and code quality issues early.
- **Performance Validation**: E2E test execution times validate that operations complete within acceptable limits (e.g., < 100ms for balance calculations).

### Architecture and Design

- **Web Component Architecture**: Shadow DOM with attribute-based data passing works well for client-side validation without complex state management.
- **Event-Driven Data Flow**: Components dispatch custom events for data requests, parent components handle API calls and inject data via methods (e.g., `setPtoData()`)
- **Component Separation of Concerns**: Web components should be data-agnostic and not make direct API calls, improving testability and maintainability
- **Validation Function Design**: Create dedicated functions for different validation types (e.g., `validatePTOBalance()`, `validateAnnualLimits()`) to maintain separation of concerns.
- **Business Rules Import Strategy**: Client components can import compiled shared business rules (e.g., `shared/businessRules.js`) for consistent validation logic between client and server.
- **Component Query Patterns**: Use type-safe DOM queries (e.g., `querySingle<T>()` from `test-utils.ts`) for error-throwing behavior and type safety in web components.
- **CSS Class-Based Styling**: Implement conditional styling using CSS classes (e.g., `.negative-balance`) for clean separation of concerns and consistent theming.

### Design System Patterns

- **CSS Custom Properties Hierarchy**: The design system uses a layered approach with base tokens (colors, spacing, typography) and semantic tokens (surface colors, text colors, border styles) that provide consistent theming across all components
- **Component Communication**: Custom events enable loose coupling between components while maintaining clear data flow patterns (e.g., `navigate-to-month` event for calendar navigation)
- **Shadow DOM Encapsulation**: Strict encapsulation prevents style leakage but requires careful event bubbling strategies and shared design token imports
- **Responsive Breakpoints**: Mobile-first approach with `480px` breakpoint for vertical stacking, ensuring touch-friendly interfaces on small screens
- **Focus Management**: Consistent focus outlines using `var(--color-primary)` with `2px solid` style, providing clear visual feedback for keyboard navigation
- **Form Validation States**: Three-tier validation system (real-time warnings, blur-triggered validation, submit-time confirmation) with distinct visual styling for each state
- **Interactive Element Patterns**: Clickable elements use `cursor: pointer`, `text-decoration: underline`, and hover states to clearly indicate interactivity
- **Loading States**: Skeleton screens and "Loading..." text provide immediate feedback during async operations, improving perceived performance

### Performance and Validation

- **Client-Side Validation Effectiveness**: Provides immediate user feedback and prevents unnecessary API calls, with server-side validation as the authoritative layer.
- **Validation Timing**: Client validation on field blur and form submission events, with server validation ensuring security.
- **Balance Data Synchronization**: Use component attributes (e.g., `available-pto-balance`) updated after successful operations to maintain current data for validation.

### Implementation Approaches

- **Staged Action Plans**: Break complex tasks into stages with validation checkpoints (build, lint, tests) to catch issues early
- **Architectural Refactoring**: Be prepared to refactor architecture during implementation if current approach violates separation of concerns
- **Event-Driven Patterns**: Use custom events for component communication instead of direct API calls in components
- **Parent-Child Data Flow**: Parent components handle data fetching and inject data into child components via methods
- **Edge Case Robustness**: Handle boundary conditions (zero balance, negative balance, exact matches) consistently across all scenarios.
- **Build System Integration**: Multi-stage build processes (lint → build → test) catch issues early, ensuring TypeScript compilation, ESLint, and Stylelint pass before testing.

### Documentation and Process

- **Task Checklist Maintenance**: Update task checklists immediately upon completion to maintain accurate progress tracking.
- **Dependency Management**: When all project dependencies are included in linting, confident refactoring is possible without external concerns.
- **Error Response Structure**: API validation errors should return structured responses with field-specific error messages for precise client-side display.
- **Web Component Testing Patterns**: Use specific locator patterns (e.g., `page.locator('component-name').locator('#element-id')`) for shadow DOM testing.
- **Documentation Updates**: Maintain API documentation, component READMEs, and centralized error message references for comprehensive coverage.

### CI/CD and Quality Assurance

- **GitHub Actions Integration**: Use GitHub Actions for seamless CI/CD with automatic test execution on pushes and pull requests to main branch.
- **Quality Gates**: Implement multi-stage pipelines (lint → build → unit tests → E2E tests) to catch issues early and ensure code quality.
- **Test Reporting**: Use JUnit XML format for machine-readable test results that CI systems transform into structured UI displays with timing and pass/fail indicators.
- **Branch Protection**: Configure repository branch protection rules requiring CI status checks to pass before merging, ensuring all quality gates succeed.
- **Git Hooks Strategy**: Use Husky for local development hooks - pre-commit for fast feedback (linting on feature branches, full tests on main), pre-push for gatekeeper validation on main branch pushes.
- **Performance Monitoring**: Track CI pipeline duration and test execution times to identify performance regressions and optimization opportunities.
- **Bypass Mechanisms**: Provide `--no-verify` flags for urgent fixes while maintaining CI as the primary quality gate.
- **Sequential Testing**: Use sequential test execution for simplicity and reliability, achieving parallelism through multiple branch testing.

### Potential Challenges and Resolutions

- **Historical Data**: In MVP implementations, no migration logic is needed for historical entries since it's a new system.

## Trigger

Activate this skill when users ask about:

- Code quality standards and best practices
- Testing strategies and patterns
- Architecture decisions and design patterns
- Performance optimization approaches
- Documentation standards and processes
- CI/CD pipeline configuration
- Quality assurance and validation

## Response Pattern

When activated, follow this structured approach:

1. **Identify Practice Category**: Determine which area the question relates to (code quality, testing, architecture, etc.)
2. **Reference Established Patterns**: Draw from the documented best practices and learnings
3. **Provide Contextual Guidance**: Explain why the practice is recommended based on project experience
4. **Show Implementation Examples**: Demonstrate how the practice applies to the DWP Hours Tracker codebase
5. **Address Edge Cases**: Cover boundary conditions and potential challenges

## Examples

- "What's the best way to structure validation functions?"
- "How should I test web components?"
- "What are the project's code quality standards?"
- "How do I handle component communication?"
- "What's the CI/CD setup for this project?"

## Additional Context

This skill captures learnings from actual implementation experiences in the DWP Hours Tracker project. The practices are validated through real development challenges and solutions, ensuring they are practical and effective for similar projects.

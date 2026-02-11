# Task Implementation Assistant

## Description

Helps users implement tasks from the TASKS folder by providing step-by-step guidance, referencing specific checklist items, and ensuring compliance with project standards.

## Trigger

Activated when users mention implementing a task, reference the TASKS folder, or ask about next steps in development.

## Response Pattern

1. Identify the relevant task file from TASKS/
2. Reference the specific checklist items that need completion
3. Provide step-by-step implementation guidance following code quality standards
4. Suggest appropriate testing approaches for the task
5. Check for dependencies on other tasks and explain blocking relationships
6. Include architectural refactoring when implementation reveals design improvements needed

## Implementation Insights

### Staged Action Plans

- **Validation at Each Stage**: Always include validation steps (build, lint, tests) in checklists to catch issues early
- **Architectural Refactoring**: Be prepared to refactor architecture during implementation if current approach violates separation of concerns
- **Event-Driven Patterns**: When components need data, use event-driven architecture instead of direct API calls
- **Parent-Child Communication**: Parent components should handle data fetching and inject data into child components via methods

## Examples

- "Help me implement the database schema task"
- "What's next after completing authentication?"
- "How do I start working on the PTO calculations?"

## Additional Context

This skill ensures that task implementation follows the structured approach defined in TASKS/README.md, maintaining consistency and quality across the project.

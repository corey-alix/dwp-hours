# Dependency and Priority Management

## Description
Manages task dependencies, suggests next logical tasks based on current progress, and explains blocking relationships between tasks.

## Trigger
Activated when users ask about what to work on next or task relationships.

## Response Pattern
1. Reference the task dependency graph from TASKS/README.md
2. Suggest next logical task based on current progress and priorities
3. Explain blocking relationships between tasks
4. Prioritize foundation tasks over feature development
5. Provide rationale for task ordering based on project dependencies

## Examples
- "What should I work on next?"
- "Does this task depend on anything else?"
- "Which task has the highest priority?"

## Additional Context
This skill ensures development follows the structured priority order: database-schema → authentication → pto-calculations → api-endpoints → admin-panel → testing-suite → data-migration → security-production.
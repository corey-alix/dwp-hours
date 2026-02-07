---
description: Generate a new specification document for adding a feature to the DWP Hours Tracker project, following the project's task management system.
name: feature
agent: agent
tools: [read, edit, edit/createFile]
---

# Feature Task Generator

Generate a new specification document for implementing a feature in the DWP Hours Tracker project. The specification should be saved in the `TASKS/` folder and follow the project's task management guidelines.

## Instructions

1. **Feature Details**: Determine an appropriate feature name and description based on the user's request.
2. **Priority**: Determine the priority level based on the feature's alignment with the task priority order in [TASKS/README.md](../../TASKS/README.md):
   - 🔥 **High Priority** (Foundation - Complete First): database-schema, authentication, pto-calculations, api-endpoints
   - 🟡 **Medium Priority** (Core Features): admin-panel, testing-suite
   - 🟢 **Low Priority** (Polish & Production): data-migration, security-production
   Assign priority based on impact, dependencies, and similarity to existing tasks.
3. **Checklist**: Create a comprehensive checklist covering:
   - Database schema changes (if needed)
   - API endpoints (if needed)
   - Frontend implementation
   - Testing (unit, E2E)
   - Documentation updates
   - Code quality gates (build, lint, manual testing)
   Use the Staged Action Plan skill ([.github/skills/staged-action-plan/SKILL.md](../skills/staged-action-plan/SKILL.md)) to break down the checklist into testable, incremental phases.
4. **Structure**: Follow the standard task file format with sections for Description, Priority, Checklist, and Implementation Notes, as seen in existing files like [TASKS/database-schema.md](../../TASKS/database-schema.md).

## Output Format

Generate the complete Markdown content for a new specification document. Then, use #tool:edit/createFile to create the file at `TASKS/${input:featureName}.md` with the generated content. Do not ask the user for confirmation before creating the file.

## Example Generated Task File

```markdown
# User Authentication

## Description
Implement user authentication system for the DWP Hours Tracker, allowing employees to log in securely.

## Priority
🔥 High Priority

## Checklist
- [ ] Design authentication database schema
- [ ] Implement login API endpoint
- [ ] Create login frontend form
- [ ] Add session management
- [ ] Implement logout functionality
- [ ] Write unit tests for authentication logic
- [ ] Add E2E tests for login flow
- [ ] Update API documentation
- [ ] Manual testing of authentication features
- [ ] Code review and linting

## Implementation Notes
- Use secure password hashing
- Implement JWT tokens for session management
- Ensure compatibility with existing employee data
- Follow project's error handling patterns
```

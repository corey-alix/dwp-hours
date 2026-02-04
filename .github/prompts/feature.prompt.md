---
description: Generate a new task file for adding a feature to the DWP Hours Tracker project, following the project's task management system.
name: feature
agent: agent
model: Grok Code Fast 1
tools: [read, edit, edit/createFile]
---

# Feature Task Generator

Generate a new task file for implementing a feature in the DWP Hours Tracker project. The task file should be saved in the `TASKS/` folder and follow the project's task management guidelines.

## Instructions

1. **Feature Details**: Use the provided feature name and description from `${input:featureName}` and `${input:featureDescription}`.
2. **Priority**: Determine the priority level (🔥 High, 🟡 Medium, 🟢 Low) based on the feature's impact and dependencies, referencing the [TASKS/README.md](TASKS/README.md) for priority guidelines.
3. **Checklist**: Create a comprehensive checklist covering:
   - Database schema changes (if needed)
   - API endpoints (if needed)
   - Frontend implementation
   - Testing (unit, E2E)
   - Documentation updates
   - Code quality gates (build, lint, manual testing)
4. **Structure**: Follow the standard task file format with sections for Description, Priority, Checklist, and Implementation Notes, as seen in existing files like [TASKS/database-schema.md](TASKS/database-schema.md).

## Output Format

Generate the complete Markdown content for a new task file. Then, use #tool:edit/createFile to create the file at `TASKS/${input:featureName}.md` with the generated content.

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

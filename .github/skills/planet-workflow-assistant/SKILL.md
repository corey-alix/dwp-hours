# Planet Workflow Assistant

## Description

Specialized assistant for managing the planet branch workflow, providing guided feature development with planet-based staging environments. Handles feature creation, completion, planet promotion, and repository maintenance with safety checks and validation.

## Critical Requirements

**Console Feedback Required**: Do not proceed with workflow operations if console/terminal output is not visible. All script executions must provide clear feedback for debugging and error resolution. If console output cannot be observed, request it from the user before proceeding.

## Trigger

Activate when users need to:

- Start new features with planet selection
- Finish and merge feature branches
- Promote planet branches to main
- Check workflow status and available actions
- Safely clean up merged branches
- Understand their position in the planet workflow pipeline

## Response Pattern

Follow this structured approach:

1. **Context Assessment**: Determine current branch, workflow position, and available actions
2. **User Guidance**: Provide clear options and confirm intent for workflow actions
3. **Safety Validation**: Check for uncommitted changes, branch types, and blocking conditions
4. **Action Execution**: Run appropriate scripts with proper error handling
5. **Status Confirmation**: Show results and next available actions
6. **Recovery Guidance**: Provide clear steps if operations fail

## Examples

Common queries that should trigger this skill:

- "Start a new feature for user authentication"
- "Finish this feature branch"
- "Promote mars to main"
- "What's my workflow status?"
- "Clean up old branches safely"
- "How do I merge this feature?"

## Additional Context

- **Planet Characteristics**: Use Mercury (urgent), Mars (experimental), Earth (stable), Jupiter (large), Saturn (moderate) for guidance
- **Safety First**: Never delete planet branches, always confirm destructive actions
- **Integration**: Works with planet-workflow.prompt.md for comprehensive assistance
- **Scripts**: Relies on declarative npm scripts (feature:start, feature:finish, etc.)
- **Validation**: Check TASKS/planet-branch-workflow.md for current implementation status</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/.github/skills/planet-workflow-assistant/SKILL.md

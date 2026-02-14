# Planet Workflow Assistant

## Description

Specialized assistant for managing the planet branch workflow, providing guided feature development with planet-based staging environments. Handles feature creation, completion, planet promotion, and repository maintenance with safety checks and validation.

## Trigger

Activate when users need to:

- Use "/planet-workflow <task description>" to start new features automatically
- Finish and merge feature branches
- Promote planet branches to main
- Check workflow status and available actions
- Safely clean up merged branches
- Understand their position in the planet workflow pipeline

## Response Pattern

Follow this structured approach:

1. **Command Detection**: Recognize "/planet-workflow <task>" commands and parse the task description
2. **Intent Analysis**: Analyze task description to determine effort/urgency levels and map to planet
3. **Worktree Validation**: Locate correct worktree and confirm it's ready for new work
4. **Branch Creation**: Execute feature branch creation in the appropriate worktree
5. **Status Reporting**: Provide clear feedback on actions taken or reasons for inaction
6. **Recovery Guidance**: Offer clear steps if operations fail

## Examples

Common queries that should trigger this skill:

- "/planet-workflow Add user authentication feature"
- "/planet-workflow Fix critical security vulnerability"
- "/planet-workflow Implement dashboard UI redesign"
- "Finish this feature branch"
- "Promote mars to main"
- "What's my workflow status?"
- "Clean up old branches safely"

## Additional Context

- **Planet Characteristics**: Use Mercury (urgent), Mars (experimental), Earth (stable), Jupiter (large), Saturn (moderate) for guidance
- **Safety First**: Never delete planet branches, always confirm destructive actions
- **Integration**: Works with planet-workflow.prompt.md for comprehensive assistance
- **Scripts**: Relies on declarative npm scripts (feature:start, feature:finish, etc.)
- **Validation**: Check TASKS/planet-branch-workflow.md for current implementation status</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/.github/skills/planet-workflow-assistant/SKILL.md

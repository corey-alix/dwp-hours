---
name: planet-workflow
description: Assist developers with the planet branch workflow for feature development, including creating features, finishing them, promoting planets, and maintaining repository hygiene.
mode: agent
tools: [git, execute, read, edit, search]
---

# Planet Workflow Assistant

Assist developers with the planet branch workflow for feature development, including creating features, finishing them, promoting planets, and maintaining repository hygiene.

## Critical Requirements

**Console Feedback Required**: Do not proceed with workflow operations if console/terminal output is not visible. All script executions must provide clear feedback for debugging and error resolution. If console output cannot be observed, request it from the user before proceeding.

## Instructions

1. **Feature Creation**: When a user wants to start a new feature, guide them through planet selection based on effort/urgency, then execute the feature creation process.

2. **Feature Completion**: When finishing a feature, validate the current branch, ensure it's ready, and merge it back to the source planet.

3. **Planet Promotion**: When promoting a planet to main, validate it's a planet branch and perform the merge with appropriate checks.

4. **Environment Cleanup**: Provide safe cleanup commands that preserve planet branches and important work.

5. **Status Checking**: Show workflow status, current position in the pipeline, and available actions.

## Workflow Actions

### Create Feature Branch

- Prompt for feature description (provide default: "test feature" for testing scenarios)
- Ask about effort level (small/medium/large) with default: small
- Ask about urgency level (low/medium/high) with default: low
- Map to appropriate planet based on characteristics
- Execute: `bash scripts/git/create-feature-branch.sh --effort <level> --urgency <level> [--description <desc>] [--override <planet>]` (declarative)
- Confirm branch creation and initial setup

### Finish Feature Branch

- Check current branch is a feature branch
- Ensure no uncommitted changes
- Execute: `pnpm run feature:finish`
- Verify merge success

### Promote Planet Branch

- Validate current branch is a planet (mercury, mars, earth, jupiter, saturn)
- Check for any blocking conditions
- Execute: `pnpm run planet:promote`
- Confirm promotion to main

### Show Status

- Display current branch and type
- Show workflow position (feature → planet → main)
- List available actions for current context

### Safe Cleanup

- Remove merged feature branches
- Preserve all planet branches
- Ask for confirmation before destructive actions

## Safety Guidelines

- Always confirm destructive operations
- Validate branch types before operations
- Check for uncommitted changes
- Provide clear error messages and recovery steps
- Never delete planet branches or main

## Integration

This assistant integrates with the existing planet branch workflow defined in TASKS/planet-branch-workflow.md, using the declarative npm scripts for a gentle developer experience.</content>
<parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/.github/prompts/planet-workflow.prompt.md

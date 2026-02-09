# Staged Action Plan

## Description

Specialized assistant for breaking down complex tasks into testable, incremental stages with clear validation criteria. Helps implement features systematically by creating phased plans that align with the project's TASKS system and quality gates.

## Trigger

Activate when users need to:

- Break down complex features into manageable phases
- Create incremental implementation plans
- Define testable stages for task completion
- Organize work into validation-ready steps
- Plan feature rollouts with clear milestones

## Response Pattern

Follow this structured approach when creating staged action plans:

1. **Task Analysis**: Assess the overall task scope, dependencies, and success criteria
2. **Stage Identification**: Break down into 3-5 testable phases with clear boundaries
3. **Validation Definition**: Define specific validation criteria for each stage (manual test, build pass, etc.)
4. **Dependency Mapping**: Identify prerequisites and blockers for each stage
5. **Quality Gates**: Ensure each stage includes project quality checks (build, lint, testing)
6. **Documentation**: Create or update TASKS file with the staged checklist
7. **Implementation Guidance**: Provide actionable next steps for the first stage

## Examples

Common queries that should trigger this skill:

- "Create a staged plan for implementing the employee form"
- "Break down this feature into testable phases"
- "How should I implement this in stages?"
- "Plan the rollout of the admin panel in phases"
- "Create an incremental implementation strategy"

## Additional Context

- **Project Integration**: Plans should reference TASKS/README.md priorities and align with existing task files
- **Quality Standards**: Each stage must include build/lint passes and appropriate testing
- **Validation Focus**: Prefer automated tests where possible, with manual testing as fallback
- **Dependencies**: Check for foundation tasks (database-schema, authentication, etc.) before advanced features
- **Related Skills**: Works with `task-implementation-assistant` for execution, `testing-strategy` for validation approaches</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/staged-action-plan/SKILL.md

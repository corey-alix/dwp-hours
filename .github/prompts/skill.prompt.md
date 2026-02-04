# Skill Creation Guide

## Overview
This guide provides a template and best practices for creating new specialized agent skills for the DWP Hours Tracker project. Skills are focused assistants that help with specific development activities.

## Skill Template

### 1. Create Skill Directory
Create a new directory under `.github/skills/` with a descriptive name:
```
.github/skills/your-skill-name/
```

### 2. Create SKILL.md File
Each skill must have a `SKILL.md` file with the following structure:

```markdown
# Skill Name

## Description
[Brief description of what the skill does and its purpose]

## Trigger
[When this skill should be activated - specific user intents, keywords, or contexts]

## Response Pattern
[Step-by-step approach the skill should follow when activated]
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Examples
[Common user queries that should trigger this skill]
- "Example query 1"
- "Example query 2"
- "Example query 3"

## Additional Context
[Any additional information about the skill's scope, limitations, or integration with other skills]
```

## Best Practices

### Skill Design Principles
- **Single Responsibility**: Each skill should focus on one specific area of expertise
- **Clear Triggers**: Define specific conditions that activate the skill
- **Structured Responses**: Use numbered steps for consistent guidance
- **Integration**: Reference how the skill works with existing TASKS and project standards

### Naming Conventions
- Use lowercase with hyphens: `task-implementation-assistant`
- Be descriptive but concise
- Follow existing patterns in the project

### Content Guidelines
- **Description**: 1-2 sentences explaining the skill's purpose
- **Trigger**: Specific user intents, keywords, or development contexts
- **Response Pattern**: Actionable steps that guide the AI assistant
- **Examples**: Real user queries that should activate the skill
- **Additional Context**: Integration notes, dependencies, or limitations

## Existing Skills Reference

### Current Skills
- `task-implementation-assistant`: Guides TASK implementation from TASKS folder
- `code-review-qa`: Reviews code against project quality standards
- `architecture-guidance`: Provides design and architecture recommendations
- `testing-strategy`: Advises on testing approaches and coverage
- `dependency-management`: Manages task priorities and dependencies

### Skill Categories
- **Implementation**: Direct coding assistance (task-implementation-assistant)
- **Quality Assurance**: Code review and testing (code-review-qa, testing-strategy)
- **Planning**: Architecture and dependency management (architecture-guidance, dependency-management)

## Integration with Project

### TASKS Integration
New skills should reference and integrate with the TASKS system:
- Check TASKS/README.md for current task priorities
- Reference specific task files when relevant
- Ensure skills align with project quality gates

### Code Quality Standards
Skills should enforce project standards:
- TypeScript strict mode
- Proper error handling and input validation
- Security best practices
- Testing requirements

## Testing New Skills

### Validation Checklist
- [ ] SKILL.md follows the template structure
- [ ] Trigger conditions are specific and testable
- [ ] Response pattern provides clear, actionable guidance
- [ ] Examples cover common use cases
- [ ] Integration with existing skills is documented

### Manual Testing
1. Test trigger conditions with example queries
2. Verify response pattern is followed
3. Check integration with TASKS system
4. Validate against project quality standards

## Maintenance

### Updates
- Review skills periodically for relevance
- Update examples based on user feedback
- Modify triggers as user patterns evolve

### Deprecation
- Mark deprecated skills in their SKILL.md
- Provide migration guidance to replacement skills
- Remove skill directories only after full migration
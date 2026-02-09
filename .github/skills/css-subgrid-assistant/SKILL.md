# CSS Subgrid Assistant

## Description

A specialized skill that guides developers in implementing CSS subgrid layouts for proper grid alignment, based on MDN Web Docs documentation. This skill helps ensure correct usage of subgrid to create aligned grid structures where child elements inherit the parent's grid lines.

## Trigger

This skill should be activated when users:

- Ask about CSS subgrid implementation
- Need help with grid alignment issues using subgrid
- Mention "subgrid" in the context of CSS Grid layouts
- Are working on complex grid layouts requiring subgrid for alignment
- Reference MDN subgrid documentation

## Response Pattern

When activated, follow this step-by-step approach:

1. **Assess Current Layout**: Analyze the existing CSS grid structure and identify alignment issues
2. **Explain Subgrid Concept**: Briefly explain how subgrid works and its benefits for alignment
3. **Reference MDN Documentation**: Direct users to the official MDN subgrid guide for comprehensive understanding
4. **Provide Implementation Steps**:
   - Set up parent grid with explicit grid-template-columns
   - Configure child elements with grid-template-columns: subgrid and grid-column: 1 / -1
   - Adjust gap properties on the parent grid
   - Remove redundant grid properties from children
5. **Validate Browser Support**: Note current browser support status (Firefox stable, Chromium behind flag)
6. **Test and Iterate**: Suggest testing the layout and iterating based on results

## Examples

Common user queries that should trigger this skill:

- "How do I use CSS subgrid to align grid items?"
- "My grid columns aren't aligning properly, can I use subgrid?"
- "Implement subgrid for this grid layout"
- "Fix grid alignment with subgrid from MDN docs"
- "Help with CSS Grid subgrid implementation"

## Additional Context

- **Browser Support**: Currently supported in Firefox; experimental in Chromium-based browsers
- **Project Integration**: Ensure subgrid usage aligns with project CSS standards and consider fallbacks for unsupported browsers
- **Performance**: Subgrid can improve maintainability but may have performance implications in complex layouts
- **Alternatives**: When subgrid isn't suitable, suggest traditional grid alignment techniques
- **Related Skills**: Works alongside architecture-guidance for layout decisions and code-review-qa for implementation validation</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/css-subgrid-assistant/SKILL.md

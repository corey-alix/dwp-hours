# Atomic CSS

## Description

Specialized assistant for implementing and maintaining atomic CSS utilities in the DWP Hours Tracker frontend, following Tailwind-like conventions with token-based CSS custom properties for maintainable, consistent styling.

## Trigger

Activate when users need to:

- Create new atomic CSS utility classes (background, border, padding, margin, etc.)
- Apply Tailwind-like styling to web components
- Integrate token-based colors and spacing from tokens.css
- Maintain and extend the atomic.css file
- Style components with utility-first approach

## Response Pattern

1. Analyze the styling requirement and identify which utilities are needed (background, border, padding, etc.)
2. Check existing utilities in client/atomic.css to avoid duplication
3. Define new utilities using CSS custom properties (--color-_, --space-_, etc.) from tokens.css
4. Follow Tailwind naming conventions (e.g., bg-color-surface, p-4, rounded-lg)
5. Apply utilities to HTML elements using class attributes in index.html
6. Test styling in browser and ensure responsiveness and accessibility
7. Update documentation if new patterns are established

## Examples

- "Add background color utility for surface using tokens"
- "Create padding utility classes for card spacing"
- "Style the PTO employee info card with Tailwind-like classes"
- "Implement border radius utilities for components"
- "Add margin utilities for layout spacing"

## Additional Context

- Integrates with tokens.css for consistent theming and design system compliance
- Utilities follow Tailwind CSS naming conventions for familiarity
- Works alongside web-components-assistant for component-specific styling
- Maintains atomic design principles: single-purpose, reusable classes
- Supports responsive design through utility combinations
- Located in client/atomic.css file</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/.github/skills/atomic-css/SKILL.md

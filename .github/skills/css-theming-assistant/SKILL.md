# CSS Theming Assistant

## Description
A specialized skill for implementing semantic color theming systems using CSS custom properties, following best practices from CSS-Tricks' "Thinking Deeply About Theming and Color Naming". This skill helps create maintainable, scalable color systems that support light and dark themes while honoring user system preferences.

## Trigger
Activate this skill when users ask about:
- Implementing CSS themes or color schemes
- Adding new colors to the theme system
- Converting hardcoded colors to semantic theme variables
- Setting up light/dark mode theming
- Color naming conventions and organization
- CSS custom properties for theming

## Response Pattern
When activated, follow this structured approach aligned with the project's theming system:

1. **Assess Current Theme Structure**: Review existing CSS files and the project's theming system documentation to understand current color usage and theme implementation
2. **Apply Semantic Naming**: Convert color-specific names (e.g., "blue", "red") to semantic names (e.g., "primary", "error") based on purpose and usage, following the project's established naming conventions
3. **Structure CSS Custom Properties**: Organize theme variables in a hierarchical structure with base colors, semantic mappings, and theme-specific overrides, using the project's defined CSS custom properties pattern
4. **Implement Theme Switching**: Use `prefers-color-scheme` media queries for automatic light/dark theme switching, ensuring compatibility with the project's theme behavior (dark mode preference → dark theme, light mode → light theme, no preference → light theme default)
5. **Ensure Accessibility**: Validate contrast ratios and accessibility compliance across themes, maintaining WCAG standards in both light and dark modes
6. **Test Theme Consistency**: Verify all components adapt properly to theme changes, following the Component Adaptation Plan from the theming system documentation

## Examples
- "How should I name colors in my CSS theme?"
- "Add support for a new accent color in the theme"
- "Convert these hardcoded colors to theme variables"
- "Implement dark mode for this component"
- "What's the best way to structure CSS custom properties for theming?"

## Additional Context
This skill integrates with the project's vanilla CSS approach and the existing theming system documented in README.md. It enforces semantic color naming principles to create maintainable themes that automatically adapt to user preferences. Reference the project's theming system for consistency with light/dark theme implementation that honors system defaults.</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/css-theming-assistant/SKILL.md
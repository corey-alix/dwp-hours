# CSS Theming Assistant - DWP Hours Tracker Design System

## Description

A specialized skill for maintaining and extending the DWP Hours Tracker's design system, which uses CSS custom properties for centralized theming. The system provides semantic color naming, light/dark theme support, and automated enforcement through Stylelint to ensure consistency across all components.

## Design System Overview

### Token Structure

The design system is centralized in `client/tokens.css` with the following categories:

- **Color Palette**: Base grays, brand blues, semantic reds/greens/purples/oranges
- **Typography**: Font families, sizes, weights, and line heights
- **Spacing**: Consistent spacing scale (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px)
- **Borders**: Widths, radii, and styles
- **Shadows**: Small to extra-large shadow definitions
- **Semantic Mappings**: Purpose-driven color assignments (primary, error, success, etc.)

### Naming Conventions

- Colors: `--color-{semantic|palette}-{variant}` (e.g., `--color-primary`, `--color-blue-600`)
- Typography: `--font-{property}-{variant}` (e.g., `--font-size-lg`, `--font-weight-bold`)
- Spacing: `--space-{size}` (e.g., `--space-md`)
- Borders: `--border-{property}-{variant}` (e.g., `--border-radius-lg`)
- Shadows: `--shadow-{size}` (e.g., `--shadow-md`)

### Theme Support

- **Automatic**: Uses `prefers-color-scheme` media queries for system preference detection
- **Manual**: Supports `data-theme="light|dark"` attributes on root element for testing/overrides
- **Default**: Light theme when no preference detected

## Trigger

Activate this skill when users ask about:

- Adding new design tokens or modifying existing ones
- Converting hardcoded styles to use design tokens
- Implementing new components with consistent theming
- Modifying color schemes or theme behavior
- Ensuring CSS follows design system conventions
- Troubleshooting theme-related issues

## Response Pattern

When activated, follow this structured approach:

1. **Review Current Implementation**: Check `client/tokens.css` and component styles to understand current token usage
2. **Validate Token Usage**: Ensure all colors use `var()` references, no hardcoded values
3. **Apply Semantic Naming**: Use purpose-driven names (primary, error, success) over color-specific names (blue, red)
4. **Update Tokens.css**: Add new tokens to the centralized file following established patterns
5. **Update Components**: Modify component styles to reference new/updated tokens
6. **Test Theme Consistency**: Verify changes work in both light and dark themes
7. **Run Enforcement**: Execute `npm run lint` to ensure Stylelint passes (bans hardcoded colors)

## Stylelint Enforcement

The system uses Stylelint with custom rules:

- Bans hardcoded colors in `color`, `background-color`, and `border-color` properties
- Requires all color values to use `var()` references
- Ignores `client/tokens.css` (where base colors are defined)
- Extends standard Stylelint config for additional consistency

## Component Implementation

Components should:

- Use shadow DOM for style isolation
- Reference tokens via `var()` in inline styles
- Avoid hardcoded color/spacing values
- Support both light and dark themes automatically

## Examples

- "Add a new warning color variant to the theme"
- "Convert this component's hardcoded colors to use tokens"
- "How do I add spacing to a new component?"
- "Fix this component to work in dark mode"
- "What's the correct token for primary button colors?"

## Additional Context

This skill maintains the project's vanilla CSS approach with no CSS-in-JS frameworks. All theming is handled through CSS custom properties, ensuring compatibility with shadow DOM components and build optimization via esbuild. The system prioritizes accessibility with proper contrast ratios in both themes and follows WCAG guidelines.</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/css-theming-assistant/SKILL.md

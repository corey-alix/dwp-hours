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

This skill maintains the project's vanilla CSS approach with no CSS-in-JS frameworks. All theming is handled through CSS custom properties, ensuring compatibility with shadow DOM components and build optimization via esbuild. The system prioritizes accessibility with proper contrast ratios in both themes and follows WCAG guidelines.

## Comprehensive Theme Implementation

### Theme Behavior

- **System Preference Detection**: Uses CSS `prefers-color-scheme` media query to detect the user's system theme setting
- **Automatic Switching**:
  - If system is set to dark mode → Uses dark theme
  - If system is set to light mode → Uses light theme
  - If no system preference is set → Defaults to light theme
- **Real-time Updates**: Themes switch automatically when the user changes their system theme settings

### Implementation Details

- **Semantic Color Naming**: Colors are named by their semantic purpose (e.g., `--color-primary`, `--color-error`) rather than appearance (e.g., `--color-blue`, `--color-red`), following CSS-Tricks best practices for maintainable theming
- **CSS Custom Properties Structure**: Theme variables are organized hierarchically:
  - **Base Colors**: Raw color values (e.g., `--color-gray-100: #f5f5f5`)
  - **Semantic Colors**: Purpose-driven assignments (e.g., `--color-primary: var(--color-blue-600)`)
  - **Theme Overrides**: Light/dark specific adjustments using `@media (prefers-color-scheme: dark)`
- **Media Query Integration**: `@media (prefers-color-scheme: dark)` queries apply dark theme styles automatically
- **Fallback Support**: Light theme serves as the default fallback when no preference is detected
- **Accessibility**: All themes maintain proper contrast ratios and accessibility standards
- **Performance**: Zero JavaScript overhead - theming is handled entirely through CSS

**CSS Structure Example:**

```css
:root {
  /* Base color palette */
  --color-gray-100: #f5f5f5;
  --color-gray-900: #111827;
  --color-blue-600: #2563eb;
  /* ... more base colors */

  /* Semantic mappings */
  --color-primary: var(--color-blue-600);
  --color-error: #dc2626;
  --color-text: #1f2937;
}

/* Dark theme overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #3b82f6;
    --color-text: #f9fafb;
  }
}
```

### Key Features

- **Seamless Integration**: No theme toggle buttons or manual selection required
- **Consistent Experience**: All components and UI elements adapt automatically
- **Battery Friendly**: Respects system settings that may optimize for battery life in dark mode
- **Cross-Platform**: Works consistently across different operating systems and browsers
- **Maintainable**: Semantic naming and hierarchical structure make theme updates easy

### Component Adaptation Plan

Each web component must be updated to use semantic CSS custom properties instead of hardcoded colors. The following plan outlines the theming adaptation for each component:

- **admin-panel**: Update navigation background, borders, and text colors to use `--color-surface`, `--color-primary`, and `--color-text`
- **confirmation-dialog**: ✅ Adapted modal background, button colors, and text to use `--color-surface`, `--color-primary`, `--color-error`, and `--color-text`
- **data-table**: ✅ Adapted table headers, rows, borders, and hover states to use `--color-surface`, `--color-text`, and `--color-primary` variants
- **employee-form**: ✅ Adapted form inputs, labels, borders, and validation states to use `--color-surface`, `--color-text`, `--color-primary`, and `--color-error`
- **employee-list**: Update list items, action buttons, and status indicators to use `--color-surface`, `--color-text`, and `--color-primary`
- **pto-calendar**: Adapt calendar grid, day cells, and PTO type color coding to use `--color-surface`, `--color-text`, and semantic PTO colors
- **pto-request-queue**: Update request cards, status badges, and action buttons to use `--color-surface`, `--color-text`, `--color-primary`, and `--color-error`
- **report-generator**: Adapt filter controls, export buttons, and report tables to use `--color-surface`, `--color-text`, and `--color-primary`
- **pto-summary-card**: Update card background, text, and accent colors to use `--color-surface`, `--color-text`, and `--color-primary`
- **pto-accrual-card**: Adapt grid layout, calendar icons, and accrual indicators to use `--color-surface`, `--color-text`, and `--color-primary`
- **pto-sick-card**: Update card styling and date/hour list formatting to use `--color-surface`, `--color-text`, and `--color-error` for sick-specific theming
- **pto-bereavement-card**: Adapt card background and bereavement entry styling to use `--color-surface`, `--color-text`, and bereavement-specific semantic colors
- **pto-jury-duty-card**: Update card theming and jury duty entry formatting to use `--color-surface`, `--color-text`, and jury duty-specific colors
- **pto-employee-info-card**: Adapt info display and metadata styling to use `--color-surface`, `--color-text`, and `--color-primary`

### Implementation Steps

1. **Audit Current Styles**: Review each component's CSS for hardcoded colors and identify semantic replacements
2. **Define Missing Variables**: Add any component-specific semantic color variables to the theme system (e.g., `--color-pto-sick`, `--color-pto-bereavement`)
3. **Update Component Styles**: Replace hardcoded colors with CSS custom property references
4. **Test Theme Switching**: Verify all components adapt properly when system theme changes
5. **Validate Accessibility**: Ensure contrast ratios remain compliant in both light and dark themes

### Theming Tips for Consistency

- **Design Tokens**: Define reusable tokens: e.g., `--font-size-base: 1rem; --border-width: 1px; --border-radius: 4px`
- **Units and Scaling**: Prefer `rem` for fonts/sizes, `em` for borders/radii within components, avoid pixels
- **Naming and Structure**: Consistent naming with category prefixes, modular files, use Sass/Less for complex maps
- **Enforcement**: Stylelint rules to ban hardcoded values, enforce var() usage
- **Best Practices**: Inherit via `:host` in web components, test with visual regression tools</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/css-theming-assistant/SKILL.md

# Theming Tips Implementation

## Description

Implement the theming tips for consistency guidelines across the DWP Hours Tracker codebase. This involves establishing design tokens, enforcing consistent units and scaling, implementing proper naming conventions, and setting up enforcement mechanisms to ensure maintainable theming practices throughout the application.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Design Tokens Establishment

- [x] Audit existing CSS variables in styles.css for completeness
- [x] Add missing design tokens: `--font-size-base: 1rem; --border-width: 1px; --border-radius: 4px;`
- [x] Group tokens by category: fonts, borders, spacing (e.g., `--space-xs: 4px; --space-md: 16px;`)
- [x] Implement theme extensions using `light-dark()` where appropriate
- [x] Document all design tokens in a centralized location

### Phase 2: Units and Scaling Standardization

- [x] Audit all CSS for pixel usage and replace with `rem` for fonts/sizes
- [x] Convert component-specific measurements to `em` for borders/radii
- [x] Ensure responsive scaling works across different font sizes
- [x] Update component stylesheets to follow the new unit conventions
- [x] Test responsiveness across different screen sizes and zoom levels

### Phase 3: Naming and Structure Improvements

- [x] Implement consistent naming: Prefix with category (e.g., `--font-family-heading`, `--border-style-solid`)
- [x] Separate tokens.css from component styles (create dedicated tokens file)
- [x] Restructure CSS custom properties for better organization
- [x] Update all component imports to use the new token structure
- [x] Document the naming conventions in the README

### Phase 4: Enforcement Mechanisms

- [x] Configure Stylelint rules to ban hard-coded values and enforce var() usage
- [x] Set up automated audits using tools like Theo or Tokens Studio
- [x] Implement JS integration for dynamic theme swaps where needed
- [x] Add pre-commit hooks to enforce theming standards
- [x] Create validation scripts for token consistency

### Phase 5: Best Practices Implementation

- [x] Update web components to properly inherit via `:host`
- [x] Set up visual regression testing with tools like Percy
- [x] Create a comprehensive style guide documentation
- [x] Implement Storybook integration for component theming documentation
- [x] Add automated checks for theme consistency across components

### Phase 6: Testing and Validation

- [x] Write unit tests for design token validation
- [x] Add E2E tests for theme switching and consistency
- [x] Perform cross-browser testing for theming compatibility
- [x] Validate accessibility compliance with new theming approach
- [x] Manual testing of theme switching across all components

### Phase 7: Documentation and Training

- [x] Update README.md with detailed theming guidelines
- [x] Create developer onboarding documentation for theming
- [x] Add code examples and best practices to component documentation
- [x] Establish code review guidelines for theming consistency
- [x] Create migration guide for existing hardcoded styles

## Implementation Notes

- This is a comprehensive refactoring task that touches all CSS across the application
- Changes should be made incrementally to avoid breaking existing functionality
- Focus on maintainability and consistency rather than visual changes
- Ensure backward compatibility during the transition period
- Consider performance implications of additional CSS variables
- Test thoroughly across different browsers and themes
- Coordinate with component updates to ensure smooth integration

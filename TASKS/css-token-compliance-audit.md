# CSS Token Compliance Audit

## Description

Audit all css.ts files in client/components to ensure they use design tokens from tokens.css. Correct any violations by replacing hardcoded values with token references, update tokens.css with new tokens if required, and update the css-theming-assistant SKILL.md documentation as needed to accommodate components.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Audit and Inventory

- [x] List all css.ts files in client/components directory
- [x] Review each css.ts file for hardcoded color, spacing, or other design values
- [x] Document violations and identify patterns of non-compliance
- [x] Validate current Stylelint configuration catches token violations
- [x] Manual verification: Run `pnpm run lint` to confirm current state

### Phase 2: Token Assessment and Updates

- [x] Analyze identified violations to determine if new tokens are needed
- [x] Add missing design tokens to tokens.css following established naming conventions
- [x] Ensure new tokens support both light and dark themes
- [x] Update semantic color mappings if new component-specific colors required
- [x] Validate token additions: Run `pnpm run build` to ensure CSS compiles correctly

### Phase 3: Component Corrections

- [x] Update each non-compliant css.ts file to use var() references instead of hardcoded values
- [x] Replace color values with semantic tokens (e.g., --color-primary, --color-error)
- [x] Replace spacing values with --space-\* tokens
- [x] Replace border/shadow values with appropriate tokens
- [x] Ensure components work in both light and dark themes

### Phase 4: Documentation Updates

- [x] Review css-theming-assistant SKILL.md for any needed updates
- [x] Add new token documentation if tokens were added
- [x] Update usage guidelines if new patterns were established
- [x] Ensure SKILL.md reflects current token capabilities

### Phase 5: Validation and Testing

- [x] Run `pnpm run lint` to ensure no Stylelint violations remain
- [x] Run `pnpm run build` to confirm successful compilation
- [x] Manual testing: Verify affected components render correctly in both themes
- [x] Cross-browser testing: Check Chrome compatibility (primary target)
- [x] Update task checklist and mark completed items

## Implementation Notes

- Reference css-theming-assistant skill for token usage patterns
- Use semantic color names (--color-primary, --color-error) over palette names (--color-blue-600)
- Follow existing token naming conventions in tokens.css
- Ensure shadow DOM components use var() references in inline styles
- Test theme switching manually by toggling system preferences
- Use `data-theme` attributes for testing specific themes

## Questions and Concerns

1. Should we add more granular spacing tokens if components need them?
2. Are there any components that intentionally use hardcoded values for specific reasons?
3. Do we need to update the Stylelint configuration for additional token categories?
4. Should we add animation tokens if components use transitions?
5. How do we handle component-specific colors that don't fit existing semantic categories?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/TASKS/css-token-compliance-audit.md

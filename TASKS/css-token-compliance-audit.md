# CSS Token Compliance Audit

## Description

Audit all css.ts files in client/components to ensure they use design tokens from tokens.css. Correct any violations by replacing hardcoded values with token references, update tokens.css with new tokens if required, and update the css-theming-assistant SKILL.md documentation as needed to accommodate components. Additionally, migrate component animations to leverage the shared component-animation-library for consistency and maintainability.

## Priority

🟢 Low Priority

## Animation Migration to Shared Library

### Identified Animations

- **dashboard-navigation-menu**: Simple background-color transition on menu-item hover (hardcoded `0.2s ease`)
- **pto-entry-form**: Complex carousel slide animation for month navigation (hardcoded `0.2s ease-in-out` on transform and opacity, with imperative JavaScript control)

### Migration Strategy

Leverage the component-animation-library SKILL.md to create a shared animation system.

**Key decisions:**

- Non-esoteric animation tokens (durations, easings, distances) live in `tokens.css` — the animation library references them via `var()`, not its own `:root` block.
- `tokens.css` already defines `--duration-fast`, `--duration-normal`, `--duration-slow`, `--easing-standard`, `--easing-decelerate`, and `--easing-accelerate`. Add semantic distance tokens (e.g., `--slide-distance`) there as well.
- All colors remain in `tokens.css`; no color definitions in the animation library.
- Prefer modern CSS (keyframes + utility classes) over JavaScript. When JS is unavoidable (e.g., carousel phase sequencing), abstract it into a helper in the animation library rather than inlining it in the component.

**Per-component plan:**

- **dashboard-navigation-menu**: Replace hardcoded `transition: background-color 0.2s ease` with `transition: background-color var(--duration-fast) var(--easing-standard)`. Adopt the shared animation stylesheet for any keyframe-based effects.
- **pto-entry-form**: Add new keyframes (`slide-out-left`, `slide-out-right`, `slide-in-left`, `slide-in-right`) to the animation library. Extract the imperative carousel animation into an animation-library helper (e.g., `animateCarousel(container, direction)`). The component calls the helper instead of managing inline styles, `will-change`, and `transitionend` listeners directly.

This will centralize animation definitions, improve maintainability, and ensure consistent timing/easing across components.

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

### Animation Migration Checklist

#### Tokens & Foundation

- [ ] Add semantic distance tokens to `tokens.css` (e.g., `--slide-distance: 100%`)
- [ ] Verify existing animation tokens in `tokens.css` cover all needed durations/easings; add any missing ones
- [ ] Create shared animation library structure under `client/animations/` (index.ts, animations.ts, types.ts)
- [ ] Implement `animations.ts` referencing `tokens.css` vars — no `:root` redefinitions of durations/easings
- [ ] Add slide keyframes (`slide-in-left`, `slide-in-right`, `slide-out-left`, `slide-out-right`) to `animations.ts`
- [ ] Add utility classes for carousel animations (`.anim-slide-out-left`, `.anim-slide-in-right`, etc.)
- [ ] Add `prefers-reduced-motion` media query in `animations.ts` that disables/reduces all animations

#### dashboard-navigation-menu Migration

- [ ] Replace hardcoded `transition: background-color 0.2s ease` with `var(--duration-fast)` and `var(--easing-standard)`
- [ ] Adopt shared animation stylesheet in the component
- [ ] Verify menu hover transition works correctly after migration

#### pto-entry-form Migration

- [ ] Create `animateCarousel(container, direction)` helper in the animation library to abstract carousel logic
- [ ] Refactor `navigateMonthWithAnimation()` to delegate to the animation-library helper
- [ ] Remove inline `will-change`, `transition`, `transform`, `opacity` style manipulation from the component
- [ ] Adopt shared animation stylesheet in the component
- [ ] Verify carousel month navigation animates correctly in both directions

#### Validation & Documentation

- [ ] Update component-animation-library SKILL.md with new keyframes, helpers, and token references
- [ ] Update Stylelint config if needed to enforce animation token usage
- [ ] Run `pnpm run build` to ensure animation library compiles correctly
- [ ] Manual testing: Verify carousel navigation and menu hover animations work smoothly
- [ ] Confirm `prefers-reduced-motion` is respected in both components
- [ ] Update task checklist and mark animation migration items completed

## Implementation Notes

- Reference css-theming-assistant skill for token usage patterns
- Use semantic color names (--color-primary, --color-error) over palette names (--color-blue-600)
- Follow existing token naming conventions in tokens.css
- Ensure shadow DOM components use var() references in inline styles
- Test theme switching manually by toggling system preferences
- Use `data-theme` attributes for testing specific themes

## Questions and Concerns (Resolved)

1. **Should we add more granular spacing tokens if components need them?** — Yes.
2. **Are there any components that intentionally use hardcoded values for specific reasons?** — No.
3. **Do we need to update the Stylelint configuration for additional token categories?** — Yes, if needed.
4. **Should we add animation tokens if components use transitions?** — Yes; non-esoteric variables (durations, easings, distances) are defined in `tokens.css`.
5. **How do we handle component-specific colors that don't fit existing semantic categories?** — All colors must be defined in `tokens.css`. Need a concrete example before deciding on naming.
6. **Should the animation library include tokens for animation distances?** — Yes, using semantic terms (e.g., `--slide-distance`) defined in `tokens.css`.
7. **How do we handle complex imperative animations like the carousel?** — Prefer modern CSS. When JS is unavoidable, abstract it into the animation library (not inline in the component).
8. **Do we need to add animation tokens to `tokens.css` or keep them separate?** — Same as 4: `tokens.css` is the single source of truth for non-esoteric tokens.</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/TASKS/css-token-compliance-audit.md

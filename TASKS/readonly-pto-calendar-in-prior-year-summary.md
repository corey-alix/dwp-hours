# Readonly PTO Calendar in Prior Year Summary

## Description

Update the prior-year-summary-page to use scalable day font and superscript convention similar to the pto-calendar component. Replace the bespoke "month-card" with actual pto-calendar components in readonly mode. Do not render note, footnote, approved, etc. indicators, just color the day cell appropriately. This requires adding view state to control background colors for PTO types in readonly mode.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Add Readonly Mode to PTO Calendar Component

- [x] Add `readonly` boolean property to PtoCalendar component
- [x] Add background color CSS classes for PTO types (PTO, Sick, Bereavement, Jury Duty) in readonly mode using existing PTO_TYPE_COLORS
- [x] Disable all interactive features when in readonly mode (selection, long-press, note dialog, hover effects)
- [x] Hide legend and other interactive elements in readonly mode
- [x] Ensure day font scaling matches main calendar component exactly
- [x] Implement superscript convention for hours display in readonly mode
- [x] Add print CSS support for toner-saving color scheme
- [x] Manual testing: Verify readonly calendar renders correctly with background colors
- [x] Unit tests: Add tests for readonly mode rendering and styling

### Phase 2: Update Prior Year Review Component

- [x] Replace bespoke month-card implementation with pto-calendar components
- [x] Set pto-calendar to readonly mode for each month
- [x] Pass appropriate PTO entries data to each calendar instance
- [x] Remove custom calendar grid rendering logic
- [x] Update component imports and dependencies
- [x] Manual testing: Verify prior year review displays calendars correctly
- [x] E2E tests: Add tests for prior year summary calendar rendering

### Phase 2.5: Add Page-Level Legend

- [x] Verify existing page-level legend is displayed prominently at the top of the prior-year-summary-page
- [x] Ensure legend styling is consistent with main calendar legend
- [x] Confirm legend is visible on both screen and print layouts

### Phase 3: Styling and Visual Consistency

- [x] Ensure day font is scalable and matches pto-calendar conventions exactly
- [x] Apply superscript formatting to hours in readonly calendars
- [x] Verify background colors provide sufficient contrast for readability
- [x] Implement custom print CSS for toner-saving color scheme
- [x] **CRITICAL**: Ensure all 12 months fit on a single printed page regardless of paper size
- [x] Ensure print styles reach into calendar components for aesthetic printing
- [x] Optimize calendar sizing and layout for print media
- [x] Test responsive behavior and layout consistency
- [x] Manual testing: Cross-browser visual verification
- [x] Accessibility testing: Ensure color contrast meets WCAG standards

### Phase 4: Integration and Validation

- [ ] Update prior-year-summary-page to work with new calendar components
- [ ] Verify data flow from API to calendar components
- [ ] Performance testing: Ensure multiple readonly calendars render efficiently
- [ ] Build and lint validation
- [ ] Manual testing: Full workflow from page load to calendar display
- [ ] Documentation updates: Update component READMEs and inline comments

### Phase 5: Code Quality and Documentation

- [ ] Code review: Ensure TypeScript strict compliance and proper error handling
- [ ] Update project-types.d.md if new APIs are exposed
- [ ] Add JSDoc comments for new readonly mode properties
- [ ] Update TASKS/README.md to mark task as completed
- [ ] Final manual testing and validation

## Implementation Notes

- The pto-calendar component currently colors hours text but not day backgrounds; readonly mode needs to add background colors for PTO types using existing PTO_TYPE_COLORS
- Calendars must be purely static with no hover/click interactions
- Legend will be displayed at the prior-year-summary-page level, not in individual calendars (verify existing legend placement)
- Implement custom print CSS that reaches into calendar components for toner-saving colors while maintaining aesthetic appeal
- **CRITICAL PRINT REQUIREMENT**: All 12 months must fit on a single printed page regardless of paper size - this may require significant layout optimization
- Consider whether print requirements should be broken out into a separate feature task due to complexity
- Use existing PTO_TYPE_COLORS from css.ts for background colors to ensure consistency
- Ensure readonly mode completely disables interactions to prevent confusion
- Maintain existing API contracts for prior-year-review data structure
- Consider performance impact of multiple readonly calendars on the page
- Day font scaling and superscript formatting must match main calendar exactly

### Print CSS Strategy: Centralized Token Overrides in media.css

**Problem**: The current approach scatters `background: #fff !important` and `color: #000 !important` overrides across individual component `css.ts` files (prior-year-summary-page, prior-year-review, month-summary, pto-calendar, styles.css). This is fragile — every new component or dark-mode surface requires its own print fix, and `!important` rules are hard to maintain.

**Preferred approach**: Add a single `@media print` block to `client/media.css` that overrides the CSS custom properties (design tokens) defined in `tokens.css` at the `:root` / `[data-theme="dark"]` level. Because all components reference `var(--color-background)`, `var(--color-surface)`, `var(--color-text)`, etc., resetting those tokens to light-mode values in one place automatically fixes every component for print — no `!important` needed, no per-component print blocks for basic foreground/background corrections.

**Example** (in `media.css`):

```css
@media print {
  :root,
  [data-theme="dark"] {
    --color-background: #fff;
    --color-surface: #fff;
    --color-surface-hover: #f5f5f5;
    --color-text: #000;
    --color-text-secondary: #333;
    --color-text-muted: #666;
    --color-border: #999;
    --color-border-hover: #666;
    --color-shadow: transparent;
    --color-shadow-dark: transparent;
    /* Toner-saving PTO type backgrounds */
    --color-pto-vacation: #eee;
    --color-pto-sick: #ddd;
    --color-pto-bereavement: #ccc;
    --color-pto-jury-duty: #bbb;
  }
}
```

**Benefits**:

- Single source of truth for print color overrides
- Automatically covers `body`, `header`, and all shadow-DOM components that inherit tokens
- No `!important` escalation — token override has natural specificity
- New components get correct print colors for free
- Existing per-component `@media print` blocks only need layout/sizing rules (font-size, padding, grid columns, `display: none`), not color overrides

**Migration**: Remove all `background: #fff !important`, `color: #000 !important`, and similar color-only print overrides from component `css.ts` files and `styles.css`, replacing them with the centralized token override in `media.css`. Keep component-level print blocks for layout concerns (hiding nav, adjusting grid columns, shrinking fonts, etc.).

## Questions and Concerns

1. Should the pto-calendar in readonly mode display the legend? **No, the legend will render at the top of the prior-year-summary-page**
2. Should the readonly calendar allow any hover or click interactions? **No, purely static, but the page should have a custom print CSS that reaches down into the calendar to ensure a color scheme that preserves toner and still produces an aesthetically pleasing calendar of the prior years PTO activity**
3. Should the background colors for PTO types match the existing PTO_TYPE_COLORS values? **Yes, there must be consistency**
4. Should the day font scaling be identical to the main pto-calendar component? **Yes, consistency is key**
5. Should the superscript convention be applied to hours display in readonly mode? **Yes, put the hours in a superscript font as before**
6. **Should the complex print layout requirements (fitting 12 months on one page) be implemented as part of this task or broken out into a separate feature task?**
7. **Should print color overrides be centralized in `media.css` by resetting design tokens under `@media print`, rather than scattered across individual component `css.ts` files with `!important`?** **Yes — implemented. A single `@media print` block in `media.css` resets all color tokens for both `:root` and `[data-theme="dark"]`. Per-component print blocks now contain only layout rules (sizing, hiding, grid adjustments).**

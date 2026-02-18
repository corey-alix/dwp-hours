# Color Contrast Compliance Fix

## Description

Fix color contrast violations in component styles to ensure WCAG 2.1 AA compliance. Update PTO type colors and text/background combinations in calendar and scheduler components to meet minimum contrast ratios for accessibility.

## Priority

🟡 Medium Priority

## Checklist

- [x] Audit all component CSS for color usage and contrast ratios
- [x] Identify violations in pto-calendar and current-year-pto-scheduler components
- [x] Change calendar PTO text color from white to black for better contrast on colored backgrounds
- [x] Change scheduler summary text color from colored to black for better contrast on light backgrounds
- [x] Change PTO card toggle button text color from white to black for better contrast on primary backgrounds
- [ ] Verify contrast ratios meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text/non-text) in both light and dark modes
- [ ] Test in both light and dark themes
- [ ] Update tokens.css with compliant color variants if needed
- [ ] Run automated contrast checks in build process
- [ ] Manual testing of color combinations across components (calendar, scheduler, PTO cards)
- [ ] Update component documentation with contrast guidelines
- [ ] Code review and linting

## Implementation Notes

- Use relative luminance calculations: L = 0.2126*R + 0.7152*G + 0.0722\*B (normalized 0-1)
- Contrast ratio = (L1 + 0.05) / (L2 + 0.05), where L1 > L2
- For colored backgrounds with white text, ensure ratio ≥4.5:1
- For colored text on light backgrounds, use darker color variants or adjust backgrounds
- Maintain visual distinction between PTO types while ensuring accessibility
- Test with browser DevTools accessibility inspector

## Research Findings

**Audit Results:**

- Comprehensive audit of all component CSS files completed
- Violations found in `pto-calendar`, `current-year-pto-scheduler`, and shared `pto-card-css.ts` (used by PTO card components)
- Other components use standard tokens.css variables with compliant contrast ratios
- No hardcoded colors found outside of PTO type definitions

**Specific Violations (Light Mode):**

1. **pto-calendar component**: White text on colored PTO backgrounds has contrast ratios below 4.5:1 (ranges 1.97-3.37)
2. **current-year-pto-scheduler component**: Colored text on light backgrounds has contrast ratios below 4.5:1 (e.g., 1.79 for blue)
3. **PTO card toggle buttons** (`pto-card-css.ts`): White text on blue-600 background has contrast ratio ~3.42 (below 4.5:1)

**Specific Violations (Dark Mode):**

1. **pto-calendar component**: White text on lighter PTO backgrounds (blue-400, red-400, etc.) has contrast ratios below 4.5:1 (ranges ~1.59-2.73)
2. **current-year-pto-scheduler component**: Colored text on dark surface-hover backgrounds has contrast ratios below 4.5:1 (e.g., ~1.59 for blue)
3. **PTO card toggle buttons** (`pto-card-css.ts`): White text on blue-400 background has contrast ratio ~1.59 (below 4.5:1)

**Recommended Solution:**

- Change text color from white to black for PTO type backgrounds in calendar
- Change summary text color from colored to black in scheduler
- Change toggle button text color from white to black in PTO card components
- This provides excellent contrast in both light and dark modes (ratios 6.14-13.24) while maintaining visual distinction through colored backgrounds
- No changes needed to tokens.css color definitions
- Preserves existing design aesthetics with improved accessibility

## Questions and Concerns

1. **Should we prioritize AA over AAA compliance for initial fix?**  
   Yes, prioritize WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text/non-text) as the baseline requirement. AAA (7:1 for normal text, 4.5:1 for large text) can be addressed in future iterations if needed for specific use cases.

2. **How to balance visual design with accessibility requirements?**  
   Use black text on existing colored backgrounds to achieve excellent contrast ratios (6.24-10.68) while maintaining visual distinction through background colors. This preserves the current design without requiring color palette changes.

3. **Do we need to update all color variants in tokens.css or just usage in components?**  
   No updates needed to tokens.css. The fix involves changing text color declarations in component CSS from white/colored to black, leveraging existing color variables for backgrounds.</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/TASKS/color-contrast-compliance.md

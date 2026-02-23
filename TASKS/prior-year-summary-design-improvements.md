# Prior Year Summary Design Improvements

## Description

Address design and usability issues identified during a design review of the Prior Year Summary page (`/prior-year-summary`). The page displays a 12-month calendar grid for the previous year with PTO entries color-coded by type and per-month `<month-summary>` bars. Issues target missing page heading, no annual aggregate, inline styles violating project conventions, hardcoded values instead of design tokens, missing type legend, and no year navigation.

## Priority

🟢 Low Priority — Visual polish. The page functions correctly but has consistency and usability issues compared to the recently improved `/current-year-summary` page. No business logic changes required.

## Design Review Findings

Screenshot and shadow DOM captured via `pnpm screenshot /prior-year-summary john.doe@example.com`. Key observations:

1. **No page heading or year context** — The page renders directly into the `<prior-year-review>` calendar grid with no title. The user has no visible indicator that they're viewing "2025 Prior Year Summary" vs. any other year. The `/current-year-summary` page now has a centered `<h2>` heading — this page should follow suit.
2. **No annual aggregate / balance table** — Each month card has its own `<month-summary>` showing per-month PTO/Sick/Bereavement/Jury Duty hours, but there's no annual total at the top. The `/current-year-summary` page now has a `<balance-table>` showing Issued/Used/Avail — this page should show at least an annual "Used" total (prior year has no "Issued" concept since allocations are already consumed).
3. **Inline CSS in `render()` instead of `css.ts` file** — The `prior-year-review` component has ~80 lines of CSS embedded in a `<style>` tag inside the `render()` method. All other components in the project extract styles to a separate `css.ts` file (e.g., `pto-pto-card/css.ts`, `balance-table/css.ts`). This violates the project's inline-CSS convention.
4. **Hardcoded pixel values instead of design tokens** — The component uses `padding: 16px`, `gap: 16px`, `padding: 32px`, `border-radius: 8px`, `padding: 12px`, `gap: 2px`, `font-size: 10px`, `font-size: 11px`, `font-size: 8px`, `min-height: 24px`, `border-radius: 4px`, `margin-bottom: 4px` etc. These should use `var(--space-md)`, `var(--radius-md)`, `var(--font-size-xs)`, etc. from `tokens.css`.
5. **Hardcoded `color: white` on PTO day cells** — The text color override for colored day cells uses `color: white` instead of a design token. This won't adapt to theme changes and violates the CSS color conventions.
6. **No legend for calendar day colors** — PTO type colors (vacation=blue, sick=red, bereavement=gray, jury duty=orange) are applied to calendar days but there's no legend explaining what each color represents. New users must guess. The `pto-pto-card` on `/current-year-summary` now has an approval legend — this page needs a type color legend.
7. **No year navigation** — The page shows only `getCurrentYear() - 1`. There's no year selector to view PTO history for 2024, 2023, etc. The test playground (`test.ts`) has an external year selector, showing the component supports arbitrary years, but the production page doesn't expose this capability.
8. **`max-width: 1540px` not centered** — The `.months-grid` has `max-width: 1540px` but no `margin: 0 auto` to center it on ultra-wide viewports. On a 4K monitor, the grid would be left-aligned.
9. **Mobile layout drops to single column** — The `@media (max-width: 768px)` rule collapses to `grid-template-columns: 1fr`, which is good, but the mobile breakpoint uses `max-width` instead of the project's mobile-first pattern (`min-width` breakpoints). This is inconsistent with the `/current-year-summary` page CSS approach.
10. **PTO type color interpolation uses JS object instead of direct token references** — The `PTO_TYPE_COLORS` object maps type names to `var(--color-pto-*)` values, then interpolates them into the `<style>` tag via template literals. This works but is fragile — the CSS string includes JavaScript interpolation rather than direct CSS custom property references.

## Checklist

### Stage 0: Consolidate Shared Resources

The `monthNames` array is duplicated in 5 files across the codebase. CSS for PTO type day-cell coloring (`.type-PTO`, `.type-Sick`, etc. with white text) is embedded inline in `prior-year-review` and could be a shared CSS extension.

**Month names consolidation** — move canonical `MONTH_NAMES` to `shared/businessRules.ts` and update all consumers:

- [ ] Add `MONTH_NAMES` constant to `shared/businessRules.ts`
- [ ] Update `client/components/prior-year-review/index.ts` to import from `businessRules`
- [ ] Update `client/components/pto-pto-card/index.ts` to import from `businessRules`
- [ ] Update `client/components/pto-calendar/index.ts` to import from `businessRules`
- [ ] Update `client/components/utils/pto-card-helpers.ts` to import from `businessRules`
- [ ] Update `shared/testDataGenerators.ts` to import from `businessRules`
- [ ] Remove all local `monthNames` / `MONTH_NAMES` array declarations from the above files
- [ ] Verify all consumers still render month names correctly

**PTO type day-cell CSS consolidation** — extract reusable PTO day-cell color styles to `client/css-extensions/`:

- [ ] Create `client/css-extensions/pto-day-colors/` module with `.type-PTO`, `.type-Sick`, `.type-Bereavement`, `.type-Jury-Duty` background color rules and white text override
- [ ] Provide `getPtoDayColorsSheet()` and `adoptPtoDayColors()` helpers following the existing css-extensions pattern
- [ ] Export from `client/css-extensions/index.ts`
- [ ] Update `prior-year-review` to adopt the shared sheet instead of inline CSS for type colors
- [ ] Remove the `PTO_TYPE_COLORS` JS object from `prior-year-review/index.ts`
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] All existing tests pass

### Stage 1: Add Page Heading

The page should have a title consistent with the `/current-year-summary` page pattern.

- [ ] Add a `<h2>` page heading (e.g., "2025 Prior Year Summary") to the page template using the year from the loaded data
- [ ] Style the heading using the same `.page-heading` class and design tokens as `/current-year-summary`
- [ ] Move heading styles to the page's `css.ts` file
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 2: Add Annual Summary

Provide an at-a-glance annual usage total at the top of the page, similar to the `<balance-table>` on `/current-year-summary`.

- [ ] Add an annual "Used" summary section above the calendar grid showing total hours per PTO type for the entire year
- [ ] Use a `<month-summary>` instance with aggregated annual totals (sum all 12 months' summaries)
- [ ] Compute annual totals from the month summaries in the `PTOYearReviewResponse` data
- [ ] Make the annual summary sticky (consistent with `/current-year-summary` behavior)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 3: Extract CSS to `css.ts` File

All component CSS should follow the project's convention of separate `css.ts` files.

- [ ] Create `client/components/prior-year-review/css.ts` with the inline styles extracted from `render()`
- [ ] Import and use the exported `styles` constant in the `render()` method
- [ ] Remove the `PTO_TYPE_COLORS` JS object — use direct CSS custom property references in the `css.ts` file
- [ ] Verify the component renders identically after extraction
- [ ] Write or update Vitest tests to confirm rendering is unaffected
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run lint:css` passes

### Stage 4: Replace Hardcoded Values with Design Tokens

All spacing, sizing, and color values should reference `tokens.css` custom properties.

- [ ] Replace `padding: 16px` → `var(--space-md)`
- [ ] Replace `padding: 32px` → `var(--space-xl)` or appropriate token
- [ ] Replace `gap: 16px` → `var(--space-md)`
- [ ] Replace `border-radius: 8px` → `var(--radius-md)`
- [ ] Replace `border-radius: 4px` → `var(--radius-sm)`
- [ ] Replace `font-size: 10px`, `11px`, `8px` → `var(--font-size-xs)` or appropriate tokens
- [ ] Replace `min-height: 24px` → appropriate token or remove if `aspect-ratio` handles sizing
- [ ] Replace `gap: 2px` → `var(--space-xs)` or a minimal gap token
- [ ] Replace `margin-bottom: 4px` → `var(--space-xs)`
- [ ] Replace `padding: 12px` → `var(--space-sm)`
- [ ] Replace `padding: 8px` → `var(--space-sm)` or `var(--space-xs)`
- [ ] Replace `color: white` → `var(--color-text-inverse)` or appropriate token (add to `tokens.css` if missing)
- [ ] Replace `max-width: 1540px` → a design-token-based constraint or remove the cap
- [ ] Center the grid with `margin: 0 auto` on the `.months-grid`
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 5: Add Type Color Legend

Users need a visual key explaining what each calendar day color means.

- [ ] Add a legend section showing PTO type colors and labels (e.g., colored squares with "PTO", "Sick", "Bereavement", "Jury Duty")
- [ ] Position the legend above or below the calendar grid — not inside individual month cards
- [ ] Use the same `--color-pto-*` design tokens as the calendar day cells
- [ ] Ensure the legend is visible on mobile (consider horizontal scrolling or wrapping)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 6: Switch to Mobile-First CSS

The current `@media (max-width: 768px)` pattern is inconsistent with the project's mobile-first approach.

- [ ] Refactor `.months-grid` to default to `grid-template-columns: 1fr` (mobile-first)
- [ ] Add `@media (min-width: 768px)` breakpoint for multi-column grid layout
- [ ] Verify calendar card rendering at 375px viewport width
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

## Implementation Notes

- Page component: [client/pages/prior-year-summary-page/index.ts](../client/pages/prior-year-summary-page/index.ts) (48 lines — very thin wrapper)
- Page CSS: [client/pages/prior-year-summary-page/css.ts](../client/pages/prior-year-summary-page/css.ts) (6 lines — minimal)
- Calendar component: [client/components/prior-year-review/index.ts](../client/components/prior-year-review/index.ts) (258 lines — contains all CSS inline)
- Existing tests: [tests/components/prior-year-review.test.ts](../tests/components/prior-year-review.test.ts) (351 lines — comprehensive)
- API model: `PTOYearReviewResponse` in [shared/api-models.d.ts](../shared/api-models.d.ts)
- Route loader: fetches `api.getPTOYearReview(getCurrentYear() - 1)` in [client/router/routes.ts](../client/router/routes.ts)
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Use `pnpm screenshot /prior-year-summary john.doe@example.com` to capture screenshots for visual verification

## Implementation Learnings (from prior pages)

1. **Balance heading added as sibling div, not inside `<month-summary>`** — The "Available Balance" label should be added as a `<div class="balance-heading">` above `<month-summary>` in the page template, rather than modifying the `month-summary` component. This keeps `month-summary` generic and reusable.
2. **Day cell min-size change is global** — Any shared component CSS changes affect ALL consumers. Be cautious with `prior-year-review` style changes if `month-summary` is shared across pages.
3. **Generic screenshot utility** — Use `pnpm screenshot <route> [user] [component]` to capture any page. Output goes to `/tmp/<slug>.png` and `/tmp/<slug>-shadow.html`.
4. **PTO type color tokens already exist in `tokens.css`** — `--color-pto-vacation`, `--color-pto-sick`, `--color-pto-bereavement`, `--color-pto-jury-duty` are defined for both light and dark themes.
5. **Monthly grouping uses `parseDate()` for key generation** — Group entries by `${year}-${month}` key computed via `parseDate()`. Month names come from a static array, not `Date` objects (following the project's string-based date handling rule).
6. **Toggle state persistence via `localStorage`** — Reuse pattern from `pto-pto-card` if adding collapsible sections.
7. **Dead code removal was safe** — Check for unused imports/selectors before removing.
8. **Mobile-first card layout** — Use `flex-direction: column` by default, with `@media (min-width: 768px)` breakpoint for side-by-side grid. Do NOT use `max-width` media queries.

## Questions and Concerns

1. Should a year selector be added to allow viewing PTO history for years beyond just `currentYear - 1`? This would require the route loader to accept a year parameter and the page to expose navigation controls.
   PRIOR YEAR ONLY is sufficient for now. No year selector needed.
2. Should the annual summary reuse the `<balance-table>` component (in a "used-only" mode without Issued/Avail rows) or use a simpler `<month-summary>` instance with aggregated annual totals?
   USE `<month-summary>` with aggregated annual totals.
3. Should the `PTO_TYPE_COLORS` JS object be preserved for programmatic access (e.g., generating dynamic styles) or replaced entirely with direct CSS custom property references in the `css.ts` file?
   CONSOLIDATE all shared resources: CSS-related code moves into `client/css-extensions/`, shared constants like month names move into `shared/businessRules.ts`. Remove all duplicate `monthNames` arrays across components.

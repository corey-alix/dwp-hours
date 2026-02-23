# Current Year Summary Design Improvements

## Description

Address design and usability issues identified during a design review of the Current Year Summary page (`/current-year-summary`). The page displays an employee's annual PTO balances, employee information card, and a detailed table of all scheduled time off entries for the year. Issues target missing contextual headings, summary bar clarity, entry table readability, card layout density, and lack of visual differentiation between PTO types.

## Priority

🟡 Medium Priority — Core feature polish. The page functions correctly but has UX/readability issues that reduce usability for employees reviewing their annual PTO status.

## Design Review Findings

Screenshot and shadow DOM captured via `pnpm screenshot /current-year-summary john.doe@example.com`. Key observations:

1. **No page heading or context** — The page renders directly into `<month-summary>` + cards with no title. The employee lands on the page with no indication of what they're viewing (e.g., "2026 Year Summary").
2. **Month summary bar lacks context** — The sticky `<month-summary>` at the top shows `PTO: 113`, `Sick: -8`, `Bereavement: 32`, `Jury Duty: 0` with "avail" sub-labels. While the balance mode works, there's no heading like "Available Balance" (the submit-time-off page added one as a sibling div per Implementation Learning #6). Negative balances show in warning color — good.
3. **No "Used This Year" aggregate** — The summary bar shows available balances but there's no visible total of hours _used_ this year per type. (`pto-hours="112"`, `sick-hours="32"`, etc. are set but the balance mode overrides the display to show remaining.)
4. **Employee Info card has dead code path** — The `pto-summary-card` querySelector in the component code references a `<pto-summary-card>` element that is _not in the template_. The card shell renders but the querySelector silently returns null. Dead code should be cleaned up.
5. **Scheduled Time Off table lacks type color coding** — All PTO type CSS classes (`.type-pto`, `.type-sick`, `.type-bereavement`, `.type-jury-duty`) resolve to `color: var(--color-text)` — they're all the same color. The type column text has no visual differentiation, reducing scanability.
6. **No monthly subtotals or grouping** — The entry table is a flat reverse-chronological list. For an employee with many entries, there's no visual separation between months and no per-month subtotals. Scanning 15+ rows for monthly patterns is difficult.
7. **Card grid only has two cards** — The `.pto-summary` grid uses `repeat(auto-fill, minmax(18em, 1fr))`. With only two cards (Employee Info + Scheduled Time Off), the layout may not use available horizontal space efficiently on wide viewports.
8. **Toggle button starts expanded with no memory** — The `pto-pto-card` is set to `isExpanded = true` in `populateCards()`. On a page refresh, the details are always shown. There's no localStorage persistence of the toggle state.
9. **Approval indicators (✓) lack legend** — Approved entries show a green checkmark but there's no legend explaining what ✓ means. New users must guess.

## Checklist

### Stage 1: Add Page Heading and Balance Context

The page has no title and the summary bar lacks the "Available Balance" heading that was added to the submit-time-off page.

- [ ] Add a page heading (e.g., `<h2>2026 Year Summary</h2>`) using `getCurrentYear()`
- [ ] Add a `<div class="balance-heading">Available Balance</div>` above `<month-summary>` (following Implementation Learning #6 — sibling div, not inside component)
- [ ] Style the heading and balance label using existing design tokens
- [ ] Verify sticky behavior of `<month-summary>` is preserved (currently `top: 56px`)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 2: Add Used-This-Year Summary

Employees can see available balance but not how much they've used. Adding a "used" context helps employees understand their consumption.

- [ ] Add a second `<month-summary>` instance below the balance bar showing total hours _used_ per type (the data is already computed — `pto-hours`, `sick-hours`, etc. attributes)
- [ ] Add a `<div class="balance-heading">Used This Year</div>` label above the second `<month-summary>` (same sibling-div pattern as the Available Balance heading)
- [ ] The second `<month-summary>` should NOT use balance mode — show raw hours only (no `balances` property)
- [ ] Ensure the used summary does not clutter the sticky bar — place it below the sticky section as a non-sticky element
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 3: Add PTO Type Color Coding to Entry Table

All type CSS classes resolve to `color: var(--color-text)`, making every row look identical. Types should be visually differentiated.

- [ ] Update `.type-pto`, `.type-sick`, `.type-bereavement`, `.type-jury-duty` in `pto-pto-card` styles to use the matching `--color-pto-*` tokens (`--color-pto-vacation`, `--color-pto-sick`, `--color-pto-bereavement`, `--color-pto-jury-duty`)
- [ ] Apply color to the Type column text (not just the Hours column) for better scanability
- [ ] Verify contrast ratios meet WCAG AA in both light and dark themes
- [ ] Ensure the color change doesn't conflict with the `.approved::after` checkmark color
- [ ] Write or update Vitest unit tests for type color class application
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run lint:css` passes

### Stage 4: Add Monthly Grouping to Entry Table

A flat chronological list becomes hard to scan with many entries. Visual month separators or subtotals improve readability.

- [ ] Group entries by month (e.g., "February 2026", "March 2026") with static separator rows or section headings in the table
- [ ] Add per-month subtotals showing total hours for that month
- [ ] Maintain reverse-chronological order within each group
- [ ] Use alternating row background colors or visual separators between month groups — no collapsible sections
- [ ] Ensure grouping works with navigate-to-month click behavior (clicking a date navigates to /submit-time-off)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 5: Clean Up Dead Code and Improve Card Layout

The `pto-summary-card` querySelector is dead code. The two-card grid may benefit from layout refinement.

- [ ] Remove the dead `summaryCard` querySelector and related `summary` property assignment in `populateCards()`
- [ ] Remove the unused `PtoSummaryCard` type import
- [ ] Evaluate card widths on wide viewports — consider adjusting `minmax(18em, 1fr)` for better space use or switching to a stacked layout
- [ ] Consider making the Employee Info card narrower (it has fewer rows) and Scheduled Time Off card wider (the table benefits from horizontal space)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 6: Add Approval Legend and Polish

The ✓ indicator on approved entries has no explanation. Small polish items improve comprehension.

- [ ] Add a legend or tooltip explaining the ✓ approval indicator (e.g., a small note below the table header or an info icon)
- [ ] Consider persisting the toggle (expanded/collapsed) state in localStorage to remember user preference
- [ ] Ensure the "No scheduled time off" empty state renders correctly when no entries exist
- [ ] Manual testing with various data scenarios (no entries, all approved, mixed types, negative balances)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

## Implementation Notes

- Page component: [client/pages/current-year-summary-page/index.ts](../client/pages/current-year-summary-page/index.ts) (168 lines)
- Page CSS: [client/pages/current-year-summary-page/css.ts](../client/pages/current-year-summary-page/css.ts)
- Employee Info: [client/components/pto-employee-info-card/index.ts](../client/components/pto-employee-info-card/index.ts)
- Entry Table: [client/components/pto-pto-card/index.ts](../client/components/pto-pto-card/index.ts) (298 lines)
- Balance Summary: [client/components/month-summary/index.ts](../client/components/month-summary/index.ts) — reused across pages; do NOT modify component internals for page-specific changes (Learning #6)
- Month Summary CSS: [client/components/month-summary/css.ts](../client/components/month-summary/css.ts)
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Use `pnpm screenshot /current-year-summary john.doe@example.com` to capture screenshots for visual verification
- The balance heading pattern was established in the submit-time-off page — reuse the same approach (sibling `<div class="balance-heading">` above `<month-summary>`)
- Type color tokens (`--color-pto-vacation`, `--color-pto-sick`, etc.) are already defined in `tokens.css` and used by `month-summary` — reuse them in `pto-pto-card`

## Implementation Learnings (from prior pages)

1. **Balance heading added as sibling div, not inside `<month-summary>`** — The "Available Balance" label should be added as a `<div class="balance-heading">` above `<month-summary>` in the page template, rather than modifying the `month-summary` component. This keeps `month-summary` generic and reusable.
2. **Day cell min-size change is global** — Any shared component CSS changes affect ALL consumers. Be cautious with `pto-pto-card` style changes if the component is used elsewhere.
3. **Generic screenshot utility** — Use `pnpm screenshot <route> [user] [component]` to capture any page. Output goes to `/tmp/<slug>.png` and `/tmp/<slug>-shadow.html`.

## Questions and Concerns

1. Should the "Used This Year" summary be a second `<month-summary>` instance (reusing the component) or a custom section?
   USE A SECOND `<month-summary>` FOR "USED". The previous `<available>-<used>` format on a single instance was confusing.
2. Should month grouping in the entry table use collapsible sections or static separators?
   STATIC SEPARATORS or alternating row colors. Collapsing has no utility here — show it all.
3. Is the Employee Info card still valuable on this page, or should the information be merged into a header section to save vertical space?
   MOBILE IS PRIMARY TARGET — implementer decides layout approach.

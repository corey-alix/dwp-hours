# Admin PTO Requests Design Improvements

## Description

Address design and usability issues identified during a design review of the Admin PTO Requests page (`/admin/pto-requests`). The page displays a queue of pending PTO requests for admin approval, with per-employee balance summaries slotted into each request card. Issues target inconsistent heading patterns, missing balance context labels, hardcoded business values, redundant date displays, missing accessibility features, and layout inconsistencies compared to recently improved pages.

## Priority

🟢 Low Priority — Visual polish and consistency. The page functions correctly (approve/reject workflow works, balance summaries display) but has UX and code quality issues compared to the recently improved `/current-year-summary` and `/prior-year-summary` pages. No business logic changes required beyond the hardcoded PTO limit fix.

## Design Review Findings

Screenshot and shadow DOM captured via `pnpm screenshot /admin/pto-requests admin@example.com`. Key observations:

1. **Duplicate/inconsistent page headings** — The page template renders `<p class="capitalize">Review and Acknowledge Daily PTO Requests</p>` while the child `<pto-request-queue>` component has its own `<h1 class="queue-title">PTO Request Queue</h1>`. This creates two competing headings with different styles. The `/current-year-summary` and `/prior-year-summary` pages use a single `<h2 class="page-heading">` in the page template with design tokens — this page should follow the same pattern.
2. **Semantic heading hierarchy violation** — The `<pto-request-queue>` component uses `<h1>` for its title. Since the component is a child of a page, it should use `<h2>` or lower. The `<h1>` should be reserved for the top-level page heading. This also means the page's `<p>` heading is semantically incorrect — a `<p>` element shouldn't be used for section headings.
3. **Balance summaries lack context label** — The slotted `<month-summary>` elements in each request card show PTO/Sick/Bereavement/Jury Duty balance values with "avail" sub-labels, but there's no heading like "Employee Balance" or "Available Balance" to explain what the numbers represent. The current-year-summary page established a `<div class="balance-heading">` pattern (Implementation Learning #1) — this page should follow suit.
4. **Hardcoded PTO limit of 80** — In `hydrateBalanceSummaries()`, the PTO limit is hardcoded as `PTO: 80` instead of using the employee's actual PTO rate from `BUSINESS_RULES_CONSTANTS` or fetching the employee's `ptoRate`. For employees with different allocations this shows incorrect balance values.
5. **Redundant date range for single-day requests** — When `startDate === endDate`, the card displays "8/3/26 → 8/3/26" which is redundant. Single-day requests should show just "8/3/26" without the arrow.
6. **`transition: all` performance anti-pattern** — The `.action-btn` CSS uses `transition: all 0.3s ease` which animates all properties (including layout-triggering ones). Should transition only specific properties (`opacity`, `background-color`). The `.request-card:hover` also uses `box-shadow` transition via the `all` shorthand.
7. **No `prefers-reduced-motion` support** — The card hover and button transitions don't include a `@media (prefers-reduced-motion: reduce)` fallback. The project's CSS Animation Policy requires honoring reduced motion preferences.
8. **No request grouping by employee** — When an employee has multiple pending requests, they're interleaved with other employees' requests. Grouping by employee (with the balance summary shown once per employee group) would reduce visual clutter and make the balance context more meaningful.
9. **Card layout not mobile-first** — The component uses `flex-wrap: wrap` with `flex: 1 1 24em` for card layout. Other pages have been migrated to mobile-first CSS Grid with `@media (min-width: 768px)` breakpoints (Implementation Learning #8). The card layout should default to single-column on mobile and use a grid breakpoint for wider viewports.
10. **No confirmation for approve/reject actions** — Clicking Approve or Reject immediately fires the action with no confirmation dialog. Accidental clicks could approve or reject the wrong request. A brief visual confirmation (e.g., a confirm/cancel state on the button) would help prevent mistakes.

## Checklist

### Stage 1: Fix Page Heading and Semantic Hierarchy

The page has competing headings and incorrect semantics. Consolidate to the project's standard `<h2 class="page-heading">` pattern.

- [x] Replace `<p class="capitalize">Review and Acknowledge Daily PTO Requests</p>` with `<h2 class="page-heading">PTO Request Queue</h2>` in the page template
- [x] Add `.page-heading` styles to the page's `css.ts` file (matching current-year-summary pattern: centered, `var(--font-size-xl)`, `var(--font-weight-semibold)`)
- [x] Change `<h1 class="queue-title">` in `pto-request-queue` to `<h2 class="queue-title">` for proper heading hierarchy
- [x] Remove the now-redundant `.capitalize` class usage
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2: Add Balance Context Labels

The balance summaries need heading labels to explain what the numbers mean (Implementation Learning #1).

- [x] Add a `<div class="balance-heading">Available Balance</div>` label above/before each slotted `<month-summary>` element in the request card, or add a sibling label in the page template
- [x] Style the balance heading using existing design tokens (matching the pattern from submit-time-off and current-year-summary pages)
- [x] Ensure the label is visible on mobile viewports
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 3: Fix Hardcoded PTO Limit

The PTO limit should come from business rules or the employee's actual rate, not a magic number.

- [x] Replace `PTO: 80` in `hydrateBalanceSummaries()` with the employee's actual PTO allocation (from `BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.PTO` or computed from `ptoRate`)
- [x] Verify the balance values match what's shown on the `/current-year-summary` page for the same employees
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 4: Fix Redundant Date Range Display

Single-day requests should not show a date range with an arrow.

- [x] In `pto-request-queue`'s `renderRequestCard()`, conditionally render the date display: show `"8/3/26"` for single-day requests and `"8/3/26 → 8/5/26"` for multi-day ranges
- [x] Update or add Vitest tests to verify both single-day and multi-day date rendering
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 5: Fix CSS Transitions and Add Reduced Motion Support

The CSS has performance anti-patterns and missing accessibility features.

- [x] Replace `transition: all 0.3s ease` on `.action-btn` with `transition: opacity 0.3s ease, background-color 0.3s ease` (animate only properties that change)
- [x] Replace `transition: box-shadow 0.3s ease` on `.request-card` with a specific `transition` property (already specific — just verify)
- [x] Add `@media (prefers-reduced-motion: reduce)` block to disable/reduce transitions on `.action-btn`, `.request-card`, and any other animated elements
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes

### Stage 6: Switch to Mobile-First Card Layout

The card layout should follow the project's mobile-first CSS pattern (Implementation Learning #8).

- [x] Replace `.queue-content` `flex-wrap: wrap` + `flex: 1 1 24em` with CSS Grid: default `grid-template-columns: 1fr` (single column on mobile)
- [x] Add `@media (min-width: 768px)` breakpoint with multi-column grid layout (e.g., `repeat(auto-fit, minmax(24em, 1fr))`)
- [x] Verify card rendering at 375px viewport width
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 7: Group Requests by Employee

Grouping requests by employee reduces visual clutter and makes balance summaries more contextual.

- [x] Group pending requests by `employeeId` so all requests for the same employee appear together
- [x] Move the `<month-summary>` balance display from per-card to per-employee-group (show once per group, not repeated per card)
- [x] Add employee group headings (e.g., "Jane Smith — 2 pending requests")
- [x] Maintain chronological order within each employee group
- [x] Update slot strategy: use per-employee slots (`balance-{employeeId}`) instead of per-request slots (`balance-{requestId}`)
- [x] Update Vitest tests for grouped rendering
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 8: Add Confirmation for Approve/Reject Actions

Prevent accidental approvals or rejections with a brief confirmation step.

- [x] Only trigger inline confirmation when the card has an unusual condition (e.g., employee has a negative balance for the requested PTO type) — normal requests proceed immediately on first click
- [x] Implement inline two-step confirmation: first click changes the button text (e.g., "Confirm Approve?"), second click fires the action
- [x] Auto-revert to the original button state after a timeout (e.g., 3 seconds) if the user doesn't confirm
- [x] Add visual differentiation for the confirmation state (e.g., warning-colored border or background shade)
- [x] Respect `prefers-reduced-motion` for any confirmation animations
- [x] Update Vitest tests for the conditional confirmation flow (confirm on negative balance, immediate on normal)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

## Implementation Notes

- Page component: [client/pages/admin-pto-requests-page/index.ts](../client/pages/admin-pto-requests-page/index.ts) (254 lines)
- Page CSS: [client/pages/admin-pto-requests-page/css.ts](../client/pages/admin-pto-requests-page/css.ts) (18 lines — minimal)
- Queue component: [client/components/pto-request-queue/index.ts](../client/components/pto-request-queue/index.ts) (152 lines)
- Queue CSS: [client/components/pto-request-queue/css.ts](../client/components/pto-request-queue/css.ts) (222 lines — already uses design tokens)
- Existing Vitest tests: [tests/components/pto-request-queue.test.ts](../tests/components/pto-request-queue.test.ts) (237 lines), [tests/pto-request-queue-filtering.test.ts](../tests/pto-request-queue-filtering.test.ts) (291 lines)
- Balance summary task: [TASKS/pto-request-queue-balance-summary.md](./pto-request-queue-balance-summary.md) (mostly complete — E2E tests remain)
- Route loader: [client/router/routes.ts](../client/router/routes.ts) lines 63-90 — fetches employees + PTO entries, filters pending
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Use `pnpm screenshot /admin/pto-requests admin@example.com` to capture screenshots for visual verification
- The balance heading pattern was established in the submit-time-off page — reuse the same approach (sibling `<div class="balance-heading">` above `<month-summary>`)

## Implementation Learnings (from prior pages)

1. **Balance heading added as sibling div, not inside `<month-summary>`** — The "Available Balance" label should be added as a `<div class="balance-heading">` above `<month-summary>` in the page template, rather than modifying the `month-summary` component. This keeps `month-summary` generic and reusable.
2. **Day cell min-size change is global** — Any shared component CSS changes affect ALL consumers. Be cautious with `pto-request-queue` style changes if the component is used elsewhere.
3. **Generic screenshot utility** — Use `pnpm screenshot <route> [user] [component]` to capture any page. Output goes to `/tmp/<slug>.png` and `/tmp/<slug>-shadow.html`.
4. **PTO type color tokens already exist in `tokens.css`** — `--color-pto-vacation`, `--color-pto-sick`, `--color-pto-bereavement`, `--color-pto-jury-duty` are defined for both light and dark themes. The queue component already uses them for `.request-type` badges.
5. **Monthly grouping uses `parseDate()` for key generation** — Group entries by `${year}-${month}` key computed via `parseDate()`. Month names come from a static array, not `Date` objects (following the project's string-based date handling rule).
6. **Toggle state persistence via `localStorage`** — Reuse pattern from `pto-pto-card` if adding collapsible employee groups.
7. **Dead code removal was safe** — Check for unused selectors (e.g., `.employee-info` is defined in CSS but not used in the template) before removing.
8. **Mobile-first card layout** — Use `grid-template-columns: 1fr` by default, with `@media (min-width: 768px)` breakpoint for multi-column. Do NOT use `max-width` media queries.

## Questions and Concerns

1. Should employee grouping (Stage 7) move the `<month-summary>` balance from per-card to per-group, or should each card retain its own balance display?
   PER-GROUP. Show the balance summary once per employee group, not repeated on every card.
2. Should the confirmation pattern (Stage 8) use a modal dialog or an inline button-state change? Inline is less disruptive but may be less noticeable.
   INLINE, and only require confirmation when there is something unusual about the card (e.g., a negative balance value). Normal approvals proceed immediately without confirmation.
3. Should the queue show a timestamp for when each request was submitted (currently shows short date "2/23/26" — should it include time)?
   TIME IS NOT IMPORTANT. Date is a nice-to-have — keep the current short date format.

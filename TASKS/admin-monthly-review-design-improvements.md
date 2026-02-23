# Admin Monthly Review Design Improvements

## Description

Address design and usability issues identified during a design review of the Admin Monthly Review page (`/admin/monthly-review`). These improvements target balance display formatting, visual hierarchy, toolbar layout, progressive feedback, and redundant UI elements.

## Priority

🟡 Medium Priority — Core feature polish. The page functions correctly but has UX/readability issues that reduce usability for administrators.

## Checklist

### Stage 1: Fix Balance Display Format (Critical)

The `<month-summary>` balance values render as raw strings like `32-0`, `-8-24`, `-32-0` instead of human-readable numbers. This is the most impactful issue — admins cannot interpret the data.

- [x] Investigate the `<month-summary>` balance rendering logic to determine why values display as `available-scheduled` raw format
- [x] Fix the balance value formatting to show meaningful numbers (e.g., `32 hrs remaining` or separate available/scheduled display)
- [x] Add sub-labels or context to clarify what the numbers mean (e.g., "remaining", "used this month")
- [x] Verify fix renders correctly for zero-hour cases (e.g., `0-0`)
- [x] Verify fix renders correctly for negative balances (e.g., `-8-24`)
- [x] Write or update Vitest unit tests for balance display formatting
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2: Add Toolbar Layout Styles

The `.toolbar` div containing "View Calendar" and "Acknowledge Review" buttons has no CSS — buttons may stack or collide depending on card width.

- [x] Add `.toolbar` CSS to `admin-monthly-review/css.ts` with flex layout and gap
- [x] Ensure buttons wrap gracefully on narrow cards
- [x] Verify the primary action ("Acknowledge Review") is visually prominent and appears first or is styled as primary
- [x] Consider making "View Calendar" an outlined/secondary button style to differentiate from the primary action
- [x] Manual testing at various viewport widths
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes

### Stage 3: Improve Visual Hierarchy Between Cards

Cards with PTO activity look identical to cards with zero hours. Admins should be able to quickly identify which employees need attention.

- [x] Add a visual indicator (subtle accent border, badge, or icon) on cards that have non-zero PTO usage
- [x] Consider sorting cards by activity — employees with hours to review appear first (stakeholder chose to preserve original order)
- [x] Ensure zero-activity cards are still accessible but visually de-emphasized
- [x] Manual testing across employee data variations
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 4: Add Progress Feedback

Currently the page shows no progressive feedback as the admin acknowledges employees. The "All employees acknowledged" empty state only appears when every card is dismissed.

- [x] Add a progress indicator showing "X of Y reviewed" (e.g., header or subtitle text)
- [x] Update the counter as acknowledgments are submitted
- [x] Ensure the counter accounts for the filtered view (only pending cards are shown)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 5: Remove Redundant Pending Status Indicator

Since acknowledged cards are already filtered out and only pending cards are displayed, the yellow "Pending" status dot and label on every card is redundant.

- [x] Evaluate whether to remove the pending status indicator entirely or repurpose it
- [x] If removing, clean up `.status-indicator.pending` CSS and related HTML
- [x] If repurposing, consider showing a "has activity" vs "no activity" indicator instead
- [x] Update related Vitest tests
- [x] Manual verification
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 6: Consider Filtering Self-Review Card

The admin sees their own employee card in the review list. Self-acknowledgment may not be appropriate.

- [x] Discuss with stakeholders whether admin self-review should be excluded — **Decision: Keep self-review (stakeholder said NO to filtering)**
- [x] If excluding: filter out the current admin's employee ID from the rendered card list
- [x] If keeping: no code change needed, document the decision
- [ ] Update tests if behavior changes — N/A, no behavior change
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

## Implementation Notes

- Balance display fix is in `<month-summary>` component ([client/components/month-summary/index.ts](../client/components/month-summary/index.ts)) — the `balances` property injection from `admin-monthly-review` may be producing the raw `available-scheduled` string format
- Toolbar CSS should be added to [client/components/admin-monthly-review/css.ts](../client/components/admin-monthly-review/css.ts)
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Animations must respect `prefers-reduced-motion`
- Use [scripts/review-screenshot.mjs](../scripts/review-screenshot.mjs) to capture screenshots and shadow DOM HTML for visual verification (`node scripts/review-screenshot.mjs` — requires deployed server on port 3003)

## Questions and Concerns

1. Should the balance display show "available / scheduled" as two separate values, or just the net remaining balance?
   YOU DECIDE.
2. Should the admin's own card be excluded from the review list, or is self-acknowledgment a valid workflow?
   NO.
3. Is sorting by activity (non-zero hours first) preferred over alphabetical sorting?
   PRESERVE ORDER.

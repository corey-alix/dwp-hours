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

### Stage 7: Remove "Select Month" Input — Auto-select Prior Month

The `/admin/monthly-review` page currently has a `<input type="month">` selector, but the review should always target the immediately prior month (e.g., January when viewing in February). The selector adds unnecessary friction and potential for error.

- [ ] Remove the `<label>` and `<input type="month">` from the `month-selector` section in `admin-monthly-review/index.ts`
- [ ] Auto-compute `_selectedMonth` as the prior month using `getPriorMonth()` from `shared/dateUtils.ts`
- [ ] Remove or simplify the `.month-selector` CSS in `admin-monthly-review/css.ts`
- [ ] Remove the `change` event handler for the month input
- [ ] Display the auto-selected month as a read-only heading or subtitle (e.g., "Reviewing: January 2026")
- [ ] Update Vitest tests to reflect the removal of the month selector
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 8: Show Employee Calendar Lock Status on Cards

Each employee card should indicate whether the employee has already locked (acknowledged) their calendar for the review month. If not locked, an unlocked indicator should be shown. Clicking the unlocked indicator should queue an in-app notification to the employee prompting them to lock their calendar.

- [ ] Query employee acknowledgement status for the review month and pass it to each card
- [ ] Add a lock/unlock icon indicator to the card UI (e.g., 🔒 locked, 🔓 unlocked)
- [ ] Style the indicator with appropriate colors (green for locked, amber/warning for unlocked)
- [ ] On click of the unlocked indicator (single click, no confirmation dialog), call the notification API to queue a message for that employee (depends on Stage 9 / in-app notification feature)
- [ ] Show a confirmation toast using `SUCCESS_MESSAGES["notification.calendar_lock_sent"]` from `shared/businessRules.ts`
- [ ] Disable the click action if notifications are not yet implemented (graceful degradation)
- [ ] Update Vitest tests for lock status rendering
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 9: Integrate In-App Notification System

Integrate the in-app notification system (see [TASKS/in-app-notifications.md](./in-app-notifications.md)) to support the admin monthly review workflow. The unlocked-calendar indicator from Stage 8 should use this system to send notifications to employees.

- [ ] Wire the unlocked-indicator click handler to the notification API (`POST /api/notifications`)
- [ ] Use the existing 8-hour session gap detection (`activityTracker.ts` / `checkPriorMonthAcknowledgement`) as the trigger for displaying queued notifications on login
- [ ] Show unread notifications via the `TraceListener` / `PtoNotificationController` pipeline
- [ ] Mark notifications as read when the user clicks/dismisses them
- [ ] Notifications that auto-dismiss (timeout) remain unread and reappear on the next session
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

## Implementation Notes

- Balance display fix is in `<month-summary>` component ([client/components/month-summary/index.ts](../client/components/month-summary/index.ts)) — the `balances` property injection from `admin-monthly-review` may be producing the raw `available-scheduled` string format
- Toolbar CSS should be added to [client/components/admin-monthly-review/css.ts](../client/components/admin-monthly-review/css.ts)
- Follow existing design token patterns from `tokens.css` for any new color/spacing values
- All CSS changes must use `rgb()` with alpha percentages, not `rgba()`
- Animations must respect `prefers-reduced-motion`
- Use [scripts/review-screenshot.mjs](../scripts/review-screenshot.mjs) to capture screenshots and shadow DOM HTML for visual verification (`node scripts/review-screenshot.mjs` — requires deployed server on port 3003)
- The prior month auto-selection should use `getPriorMonth()` from `shared/dateUtils.ts`, consistent with `UIManager.checkPriorMonthAcknowledgement()`
- The 8-hour session gap detection in `client/shared/activityTracker.ts` (`isFirstSessionVisit()`) is the hook for displaying queued notifications — reuse this rather than creating a separate mechanism
- The in-app notification feature is tracked separately in [TASKS/in-app-notifications.md](./in-app-notifications.md) — Stage 9 depends on that feature being implemented

## Questions and Concerns

1. Should the balance display show "available / scheduled" as two separate values, or just the net remaining balance?
   YOU DECIDE.
2. Should the admin's own card be excluded from the review list, or is self-acknowledgment a valid workflow?
   NO.
3. Is sorting by activity (non-zero hours first) preferred over alphabetical sorting?
   PRESERVE ORDER.
4. Should the "Reviewing: [Month]" heading include navigation arrows to view other months, or is strictly prior-month-only the final design?
   NO — strictly prior-month-only.
5. When the admin clicks the unlocked indicator to notify an employee, should there be a confirmation dialog or is a single click sufficient?
   SINGLE CLICK — show a toast confirming the notification was created. The message text is defined in `shared/businessRules.ts` (`SUCCESS_MESSAGES["notification.calendar_lock_sent"]`).
6. Should notifications be visible across all pages (e.g., a global notification bell) or only shown on session start?
   SESSION START ONLY — display queued notifications when the user enters the app (8+ hour gap). No bell indicator. Future iteration may add mobile web app push notifications.

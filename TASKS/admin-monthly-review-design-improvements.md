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

### Stage 8b: Lock Indicator Notification-State Feedback

The lock indicator currently has only two states: `locked` (employee acknowledged) and `unlocked` (not acknowledged, clickable). After the admin clicks to send a reminder, the indicator reverts to the same `unlocked` appearance — the admin has no feedback on whether the poke was sent or whether the employee has seen it. Two additional visual states are needed:

**Four lock-indicator states:**

| State    | CSS class        | Appearance                             | Meaning                                                                                          |
| -------- | ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Locked   | `.locked`        | ✓ Locked (green pill)                  | Employee has locked their calendar — no action needed                                            |
| Unlocked | `.unlocked`      | ● Unlocked (amber pill, clickable)     | No notification sent yet — admin can click to send reminder                                      |
| Notified | `.notified`      | ⏳ Notified (blue pill, non-clickable) | Admin has sent a reminder; employee has **not** read it yet                                      |
| Seen     | `.notified-read` | 👁 Seen (grey pill, re-clickable)      | Employee dismissed the notification but still hasn't locked — admin may click again to re-notify |

#### Data requirements

The admin-monthly-review API response (`GET /api/admin/monthly-review`) must include per-employee notification status for the review month. Two new fields on the employee card data:

- `notificationSent: boolean` — true if an unread or read `calendar_lock_reminder` notification exists for this employee/month
- `notificationReadAt: string | null` — ISO timestamp if the employee has dismissed the notification, null if unread or no notification exists

These can be derived by joining the `notifications` table filtered by `type = 'calendar_lock_reminder'` and the review month.

#### Checklist

- [x] **Extend the monthly-review API** to include `notificationSent` and `notificationReadAt` fields per employee by joining `notifications` table
- [x] **Update the card data interface** (`EmployeeReviewCard` or equivalent) with the two new fields
- [x] **Update `renderEmployeeCard()`** to select lock-indicator state using four-way logic:
  1. `calendarLocked` → `.locked` (existing)
  2. `!calendarLocked && !notificationSent` → `.unlocked` (existing, clickable)
  3. `!calendarLocked && notificationSent && !notificationReadAt` → `.notified` (new, non-clickable)
  4. `!calendarLocked && notificationSent && notificationReadAt` → `.notified-read` (new, clickable to re-notify)
- [x] **Add `.notified` CSS** to `admin-monthly-review/css.ts` — blue informational pill (`rgb(59 130 246 / 12%)`, color `var(--color-info-dark, #1e40af)`), `cursor: default`, no click handler
- [x] **Add `.notified-read` CSS** to `admin-monthly-review/css.ts` — muted/grey pill (`rgb(107 114 128 / 12%)`, color `var(--color-text-secondary)`), `cursor: pointer` (admin can click to re-notify)
- [x] **Update click handler** — skip click for `.notified` state; for `.notified-read`, allow re-sending (creates a new notification, duplicate-prevention should be updated to allow re-notify after read)
- [x] **Update duplicate-prevention logic** in the notification API or client — currently prevents creating a notification if an unread one already exists; should allow creating a new notification when the previous one has been read (`read_at IS NOT NULL`)
- [x] **After successful notification send**, update the indicator in-place to `.notified` state without a full re-render (optimistic UI update)
- [x] **Add `prefers-reduced-motion`** handling for any new transitions on the indicator
- [x] **Update Vitest tests** — test all four indicator states render correctly; test click behavior for each state (locked: no-op, unlocked: sends notification, notified: no-op, notified-read: re-sends notification)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### Implementation Notes

- The `notifications` table already has `read_at` (set when the employee actively dismisses) and `created_by` (admin ID) — these are sufficient to derive all four states without schema changes.
- The duplicate-prevention check in `POST /api/notifications` (Stage 5 of `in-app-notifications.md`) currently prevents duplicates when an unread notification exists. For the `.notified-read` → re-notify flow, the check should be: "only prevent if an **unread** notification of the same type exists for the same employee/month." An already-read notification should not block a new one.
- The optimistic UI update after sending a notification should swap the element's class from `unlocked` or `notified-read` to `notified` and update the text/title attributes — avoid a full `render()` call which would disrupt other card state (e.g., inline calendars, confirming buttons).
- Title attributes should provide context: `"Reminder sent — awaiting employee response"` for `.notified`, `"Employee saw reminder but hasn't locked — click to re-send"` for `.notified-read`.

### Stage 9: Integrate In-App Notification System

Integrate the in-app notification system (see [TASKS/in-app-notifications.md](./in-app-notifications.md)) to support the admin monthly review workflow. The unlocked-calendar indicator from Stage 8 should use this system to send notifications to employees.

- [ ] Wire the unlocked-indicator click handler to the notification API (`POST /api/notifications`)
- [ ] Use the existing 8-hour session gap detection (`activityTracker.ts` / `checkPriorMonthAcknowledgement`) as the trigger for displaying queued notifications on login
- [ ] Show unread notifications via the `TraceListener` / `PtoNotificationController` pipeline
- [ ] Mark notifications as read when the user clicks/dismisses them
- [ ] Notifications that auto-dismiss (timeout) remain unread and reappear on the next session
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 10: Inline Confirmation + Optimistic Dismiss with Rollback

The current "Acknowledge Review" flow pops a `<confirmation-dialog>` modal whose message is generic and adds friction without value. Additionally, once the admin confirms, the card is dismissed via animation **before** the API call — if the service fails (e.g., the employee hasn't locked the month yet), the card disappears permanently with only a toast error, leaving no way to retry without a full page reload.

**Two changes:**

1. **Replace the modal dialog with an inline confirmation button** — follow the same pattern used in `<pto-request-queue>` (`_pendingConfirmations` map + `confirming` CSS class). On first click, the "Acknowledge Review" button text changes to "Confirm Acknowledge?" with a warning style and auto-reverts after 3 seconds. On second click, the action proceeds.

2. **Optimistic dismiss with rollback on failure** — after the second click (confirmed), immediately animate the card out (optimistic). If `submitAcknowledgment()` fails, reverse the animation (scale the card back in) and show the error toast so the admin can retry.

#### Checklist

- [x] **Move confirmation logic into `admin-monthly-review` component**: Add a `_pendingConfirmations` map (mirroring `PtoRequestQueue`) to `admin-monthly-review/index.ts`. On first click of `.acknowledge-btn`, enter confirming state (change text to "Confirm Acknowledge?", add `.confirming` class, start 3-second auto-revert timer). On second click, dispatch `admin-acknowledge` event.
- [x] **Add `.confirming` CSS** to `admin-monthly-review/css.ts` for the acknowledge button (warning background, outline) — reuse design tokens from `pto-request-queue/css.ts`.
- [x] **Remove `<confirmation-dialog>` usage** from `admin-monthly-review-page/index.ts` — the `handleAdminAcknowledgeReview` method should no longer create/append a dialog. Remove the `ConfirmationDialog` import if unused elsewhere.
- [x] **Implement optimistic dismiss with rollback**: In `admin-monthly-review-page/index.ts`, after receiving the `admin-acknowledge` event, call `dismissCard(employeeId)` to animate out, then call `submitAcknowledgment()`. If the API call fails, call a new `undismissCard(employeeId)` method to reverse the animation (scale back to full size + opacity 1) and show the error toast.
- [x] **Add `undismissCard(employeeId)` method** to `admin-monthly-review/index.ts` that finds the card element, removes dismiss styles, and animates it back to its original state using a reverse transition.
- [x] **Update Vitest tests**: Test inline confirmation flow (first click → confirming state, auto-revert after timeout, second click → event dispatched). Test that `undismissCard` restores the card element's visibility.
- [ ] **Manual testing**: Verify the confirm → dismiss → API success flow. Simulate API failure (e.g., offline or mock 500) and verify the card re-appears.
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### Implementation Notes

- The inline confirmation pattern in `PtoRequestQueue` (lines 175–200 of `pto-request-queue/index.ts`) is the reference implementation: `_pendingConfirmations` Map, `resetConfirmation()`, `clearConfirmation()`, and the `confirming` CSS class with `--color-warning` background.
- `undismissCard` should reset the `transform`, `opacity`, `height`, and `overflow` styles that `animateDismiss()` applies. A simple approach: after `dismissCard` resolves, the card still exists in the DOM (re-render hasn't happened yet); set `card.style.transform = ''`, `card.style.opacity = ''`, etc., then call `card.offsetHeight` to force reflow, then transition back.
- The `admin-monthly-review-page` currently fires dismiss **then** calls `submitAcknowledgment` fire-and-forget. The new flow should `await` the API call and branch on success/failure.
- Remove the `ConfirmationDialog` import and `createElement<ConfirmationDialog>` usage from the page component.

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
7. Should the lock indicator reflect whether the admin has already sent a notification and whether the employee has seen it?
   YES — four states: `locked`, `unlocked`, `notified` (sent but unread), `notified-read` (employee dismissed but hasn't locked). See Stage 8b.

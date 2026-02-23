# Employee Month Acknowledgement Prompt

## Description

Enhance the employee experience by prompting users to acknowledge (lock) the prior month when they visit the app after a period of inactivity. When an employee opens the app for the first time in a session (8+ hours since last activity, tracked via `localStorage`), the system checks whether the **immediately preceding month** has been acknowledged. If not, the employee is navigated to that month on the `submit-time-off-page` and presented with a "Lock" / "Unlock" toggle button.

- **Locking** inserts a row into the `acknowledgements` table via `POST /api/acknowledgements`.
- **Unlocking** removes that row via `DELETE /api/acknowledgements/:id` — but only if the admin has **not** already locked the month.

The `POST /api/admin-acknowledgements` endpoint is updated with two new guards:

1. **Employee-first rule** — the admin cannot lock a month until the employee has acknowledged it.
2. **Month-ended rule** — the admin cannot lock a month until the day after that month ends (i.e. on or after the 1st of the following month). The error response includes the earliest lockable date.

### Locking Workflow

1. **Employee lock** — The employee reviews their PTO entries and hours for a month, then clicks "Lock" to insert a row into the `acknowledgements` table. While employee-locked (but not admin-locked), the calendar is displayed read-only with dimmed cells. The employee must click "Unlock" before making changes.
2. **Admin lock** — On or after the 1st of the following month, the admin reviews the employee's month and locks it via `POST /api/admin-acknowledgements`. This only succeeds if the employee has already acknowledged the month. Once the admin locks, `rejectIfMonthLocked` prevents any further edits (including employee unlock).
3. **Employee unlock** — The employee can call `DELETE /api/acknowledgements/:id` to remove their lock, but only if no admin acknowledgement exists for that month. When unlocked, the calendar becomes interactive again.
4. **Admin unlock** — If the admin removes their acknowledgement (existing `DELETE /api/admin-acknowledgements/:id`), the month returns to employee-locked state (employee can then unlock if desired).

## Priority

🟡 Medium Priority

This is a core workflow feature that improves data integrity and user experience. It depends on the existing acknowledgement and admin-acknowledgement infrastructure (both complete).

## Checklist

### Stage 1: Business Rules & Constants

- [x] Add `SESSION_INACTIVITY_THRESHOLD_MS` constant (`8 * 60 * 60 * 1000`) to `BUSINESS_RULES_CONSTANTS` in `shared/businessRules.ts`
- [x] Add validation messages to `VALIDATION_MESSAGES`:
  - `"employee.not_acknowledged"`: `"Employee must acknowledge this month before admin can lock it"`
  - `"month.not_ended"`: `"This month has not ended yet. Admin can lock starting {earliestDate}"`
  - `"month.admin_locked_cannot_unlock"`: `"This month has been locked by the administrator and cannot be unlocked"`
- [x] Add a `validateAdminCanLockMonth(month: string, currentDate: string): ValidationError | null` function that returns an error if the month has not fully ended (current date < 1st of next month)
- [x] Add a `formatMonthNotEndedMessage(earliestDate: string): string` helper
- [x] Unit test the new business rules
- [x] **Validation**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Stage 2: Server — DELETE /api/acknowledgements/:id

- [x] Add `DELETE /api/acknowledgements/:id` endpoint:
  - Authenticate the employee
  - Find the acknowledgement by ID; verify it belongs to the authenticated employee
  - Check if an admin acknowledgement exists for the same `employee_id` + `month` — if so, return HTTP 409 with `{ error: "month.admin_locked_cannot_unlock" }`
  - Delete the acknowledgement and return `{ message: "Acknowledgement removed successfully" }`
- [ ] Add unit/integration tests:
  - Employee unlocks own acknowledgement → expect 200
  - Employee tries to unlock admin-locked month → expect 409
  - Employee tries to unlock another employee's acknowledgement → expect 403/404
- [x] **Validation**: `pnpm run build && pnpm run lint` pass; tests pass

### Stage 3: Server — Admin Lock Guards

- [x] In `POST /api/admin-acknowledgements`, add **employee-first guard**:
  - Query `acknowledgements` for matching `employee_id` and `month`
  - If none exists, return HTTP 409 with `{ error: "employee_not_acknowledged", message: "..." }`
- [x] In `POST /api/admin-acknowledgements`, add **month-ended guard**:
  - Use `validateAdminCanLockMonth(month, today())` from business rules
  - If the month has not ended, return HTTP 409 with `{ error: "month_not_ended", message: "...", earliestDate: "YYYY-MM-DD" }`
- [ ] Add unit/integration tests:
  - Admin locks current/future month → expect 409 with `earliestDate`
  - Admin locks past month without employee ack → expect 409
  - Admin locks past month with employee ack → expect 201
- [x] **Validation**: `pnpm run build && pnpm run lint` pass; tests pass

### Stage 4: Activity Tracking via localStorage

- [x] Create a utility module (e.g. `client/shared/activityTracker.ts`) that:
  - Stores `dwp-hours:lastActivityTimestamp` in `localStorage` (ISO string)
  - Exposes `isFirstSessionVisit(): boolean` — returns `true` if 8+ hours have elapsed since last stored timestamp (or no timestamp exists)
  - Exposes `updateActivityTimestamp(): void` — writes current time to `localStorage`
- [ ] Add unit tests for the activity tracker (mock `localStorage` and `Date`)
- [x] **Validation**: `pnpm run build && pnpm run lint` pass; unit tests pass

### Stage 5: Prior-Month Acknowledgement Check & Navigation

- [x] In the app entry point (e.g. `app.ts` or the router's post-auth hook), after authentication:
  - Call `isFirstSessionVisit()`
  - If true, fetch acknowledgements via `GET /api/acknowledgements`
  - Check whether the **immediately preceding month** (relative to today) has an acknowledgement
  - If not, navigate to `submit-time-off-page?month=M&year=Y` for that month
  - Call `updateActivityTimestamp()` after the check (regardless of result)
- [ ] Ensure the navigation does not interfere with magic-link token validation flow
- [x] **Validation**: manual testing — clear localStorage, open app, verify navigation to prior month; `pnpm run build && pnpm run lint` pass

### Stage 6: "Lock / Unlock Month" UI on submit-time-off-page

- [x] Add a "Lock Month" / "Unlock Month" toggle button to the `submit-time-off-page` toolbar:
  - **Always visible** on any month (not just past months) — the employee can lock during or after a month
  - Shows "Lock Month" when unlocked, "Unlock Month" when employee-locked
  - Hidden (or replaced by admin-lock banner) when admin-locked
- [x] Wire "Lock Month" to `POST /api/acknowledgements` with the displayed month
- [x] Wire "Unlock Month" to `DELETE /api/acknowledgements/:id` (fetch the acknowledgement ID first)
- [x] On lock success: show notification, transition calendar to read-only/dimmed state
- [x] On unlock success: show notification, restore calendar to interactive state
- [x] On failure (e.g. 409 admin-locked): show error via `notifications.error()`
- [x] Update `css.ts` to style the Lock/Unlock button distinctly
- [x] **Validation**: manual testing of lock/unlock cycle; `pnpm run build && pnpm run lint` pass

### Stage 7: Visual Lock State — Calendar Read-Only Mode

- [x] When viewing an employee-locked month (acknowledgement exists, no admin lock):
  - Display calendar cells dimmed/disabled (read-only)
  - Show a banner: "You have locked this month. Click Unlock to make changes."
  - Disable Submit button; keep Unlock button active
- [x] When viewing an admin-locked month:
  - Display calendar cells dimmed/disabled (read-only)
  - Show a banner: "This month was locked by [admin] on [date] and is no longer editable."
  - Hide Lock/Unlock button entirely
- [x] When viewing an unlocked month:
  - Calendar is fully interactive (current behaviour)
- [x] **Validation**: manual testing of all three states; `pnpm run build && pnpm run lint` pass

### Stage 8: E2E Tests

- [ ] Add Playwright E2E test: employee visits app after 8+ hours → navigated to prior unacknowledged month
- [ ] Add Playwright E2E test: employee locks month → calendar becomes read-only → unlock restores it
- [ ] Add Playwright E2E test: employee tries to unlock admin-locked month → error shown
- [ ] Add Playwright E2E test: admin attempts to lock current month → error with earliest lockable date
- [ ] Add Playwright E2E test: admin attempts to lock without employee ack → error shown
- [ ] Add Playwright E2E test: admin locks past month after employee ack → success
- [ ] Verify existing E2E tests still pass
- [ ] **Validation**: `pnpm test:e2e` passes

### Stage 9: Documentation & Quality Gates

- [ ] Update API documentation (README.md) to describe:
  - `DELETE /api/acknowledgements/:id` endpoint
  - Employee-ack-before-admin-lock requirement
  - Month-ended guard on admin lock
- [ ] Update the acknowledgement workflow description in README.md
- [ ] ✅ `pnpm run build` passes
- [ ] ✅ `pnpm run lint` passes
- [ ] ✅ Manual testing of full workflow complete
- [ ] ✅ Error cases handled
- [ ] ✅ Input validation implemented

## Implementation Notes

- **localStorage key**: `dwp-hours:lastActivityTimestamp`
- **8-hour threshold**: Hardcoded as `SESSION_INACTIVITY_THRESHOLD_MS` in `shared/businessRules.ts` under `BUSINESS_RULES_CONSTANTS`
- **Month scope**: Only check the **immediately preceding month** (e.g. if today is February 23, 2026, check January 2026). Do not check historical months beyond the prior month.
- **Employee lock is a toggle**: The Lock button is always available. Clicking it locks (creates acknowledgement) or unlocks (deletes acknowledgement). The calendar becomes read-only when locked. Employee must unlock before editing.
- **Employee lock does NOT prevent edits at the API level**: The server does not reject PTO/hours submissions for employee-acknowledged months — only admin-acknowledged months trigger `rejectIfMonthLocked`. The read-only state is a client-side UX concern.
- **Admin cannot lock prematurely**: The server rejects `POST /api/admin-acknowledgements` if the month has not fully ended. The error response includes `earliestDate` (1st of the following month).
- **Admin cannot lock without employee ack**: The server rejects `POST /api/admin-acknowledgements` if no employee acknowledgement exists for that month.
- **Employee cannot unlock admin-locked months**: `DELETE /api/acknowledgements/:id` checks for admin acknowledgement and returns 409 if one exists.
- **`acknowledgements` vs `admin_acknowledgements`**: Employee acknowledgement is a soft lock (UI-enforced). Admin acknowledgement is a hard lock (server-enforced via `rejectIfMonthLocked`).
- **Date handling**: Use `shared/dateUtils.ts` functions exclusively — no `new Date()` in client code
- **Business rules**: Validation logic lives in `shared/businessRules.ts`

## Questions and Concerns

1. _Just the month before the current month._ Only the immediately preceding month is checked on session start.
2. _Lock button is always enabled._ The employee can lock at any time during or after the month. They can unlock unless the admin has locked it. Admin cannot lock until the month has ended (1st of following month). Calendar becomes read-only when employee-locked; employee must unlock to edit.
3. _8-hour threshold hardcoded_ in `BUSINESS_RULES_CONSTANTS` in `shared/businessRules.ts`.
4. _No confirmation dialog._ The lock is a simple toggle — the employee can unlock if they change their mind.
5. _No separate hours confirmation._ The employee is viewing the calendar when they lock, which constitutes confirmation.
6. _DELETE endpoint for employee unlock._ A `DELETE /api/acknowledgements/:id` endpoint will be added. Unlocking is blocked if an admin lock exists (409).
7. _Calendar is read-only when employee-locked._ Cells are dimmed/disabled and Submit is disabled. Employee must click Unlock to restore interactivity.
8. _Admin error includes earliest lockable date._ E.g. "You can lock January 2026 starting 2026-02-01."

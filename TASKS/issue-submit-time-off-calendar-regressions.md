# Missing Features Report: Submit Time Off Calendar Functionality ✅ COMPLETED

**Issue Summary:**
Three missing features are identified in the "Submit Time Off" form flow when using the Calendar view. Tooltip affordance is missing, existing PTO data is not rendering, and day cells lack the expected border styling. These are missing functionality and should be covered by unit tests.

**Status:** ✅ All stages completed successfully. Build, lint, unit tests, and E2E tests all pass. Features implemented with proper architectural separation (event-driven data flow).

## Feature Requirements

**Expected Behavior:**

- Hovering the Calendar icon should display a tooltip to indicate the Calendar view.
- The Calendar view should render existing PTO data for the selected employee.
- Day cells should show a subtle border matching the PTO accrual card styling.

**Current Behavior:**

- Hovering the Calendar icon does not show a tooltip.
- The Calendar view does not render existing PTO data.
- Calendar day cells are missing the subtle border styling.

**Steps to Reproduce:**

1. Open the Submit Time Off form.
2. Click "Submit Time Off" to open the entry flow.
3. Hover over the Calendar icon.
4. Switch to the Calendar view.
5. Observe whether existing PTO data appears and whether day cells have borders.

**Impact:**
Medium. The missing tooltip reduces discoverability, and the missing PTO data and borders degrade usability and confidence in the Calendar view.

## Related Context and Recent Changes

- Recent commit history for the relevant areas shows merge-level activity without pinpointed changes.
- Components likely involved include the Calendar view and entry form web components, plus shared styling.

## Implementation Gaps

- **Tooltip missing**: Calendar toggle button in `pto-entry-form/index.ts` has `aria-label="Toggle calendar view"` but no `title` attribute for native tooltip.
- **PTO data not rendered**: Calendar component in `pto-entry-form/index.ts` has `calendar.setAttribute("pto-entries", "[]");` hardcoded to empty array instead of fetching from `/api/pto` endpoint.
- **Border styling missing**: Day cells in `pto-calendar/index.ts` have no border, while `pto-accrual-card/index.ts` uses `border: var(--border-width) var(--border-style-solid) var(--color-border);`.

## Suggested Debugging Approaches

1. Verify tooltip attributes on the Calendar icon in the Submit Time Off form and confirm hover styles are intact.
2. Trace the PTO data flow into the calendar component (fetch -> state -> render) and compare with prior behavior.
3. Inspect calendar day cell markup and confirm the class names match the PTO accrual card border styling.
4. Use the browser devtools to check for missing CSS rules or overridden styles.

## Evidence to Capture

- Screenshot or short clip showing missing tooltip and missing PTO rendering.
- Console logs or warnings captured during Calendar view switch.
- Network response payload for PTO entries (redact sensitive data).

## Clarifying Questions

1. When did this regression first appear, and after which deployment or merge?
2. Which browser(s) and OS versions are affected?
3. Are there any console warnings or errors when switching to Calendar view?
4. Does this happen for all employees or only specific test data?
5. Are PTO entries present in the backend and returned by the API during reproduction?

## Development Checklist (Staged Action Plan)

**Stage 1: Verify Current State (Validation: manual check + console check)**

- [x] Confirm the tooltip issue in the Submit Time Off flow.
- [x] Switch to Calendar view and confirm missing PTO data.
- [x] Inspect day cell styles for missing borders.
- [x] Capture any console errors or warnings.
- [x] Record browser version and environment details.

**Stage 2: Implement Data Flow (Validation: API response + UI render)**

- [x] Implement PTO data fetch from `/api/pto` endpoint.
- [x] Validate the calendar component receives the expected data format.
- [x] Verify rendering logic for existing PTO entries.
- [x] Check for empty-state fallback or filters hiding entries.

**Stage 3: Implement Styling and Accessibility (Validation: visual check + computed styles)**

- [x] Add tooltip `title` attribute to calendar toggle button.
- [x] Add border styling to day cells matching PTO accrual card.
- [x] Check for CSS overrides or missing imports.
- [x] Confirm tooltip content is accessible via `aria-label` or `title`.

**Stage 4: Testing and Validation (Validation: tests + build)**

- [x] Run targeted E2E tests for calendar and entry form behavior.
- [x] Add or update unit tests to cover tooltip presence, PTO rendering, and day cell borders.
- [x] Confirm `npm run build` and `npm run lint` pass.
- [x] Architectural refactor: Move API calls from components to parent app.ts using event-driven data flow.

## Suggested Tests to Run

- PTO calendar component E2E coverage.
- Submit Time Off flow E2E coverage.

## Environment and Data Requirements

- Environment: local dev build or deployed test environment.
- Browser: reproduce in Chrome and Firefox (note versions in findings).
- Data: at least one employee with existing PTO entries spanning multiple dates.
- Permissions: ensure the user can view and submit PTO requests.

## Success Criteria

- Tooltip appears on hover for the Calendar icon in the Submit Time Off flow.
- Calendar view renders existing PTO entries for the selected employee.
- Day cells show a subtle border consistent with PTO accrual card styling.
- Unit tests cover the tooltip, PTO rendering, and day cell border behavior.

## Implementation Notes

- **Tooltip Fix**: Add `title="Switch to Calendar View"` to the calendar toggle button in `client/components/pto-entry-form/index.ts`.
- **PTO Data Fix**: Replace hardcoded `calendar.setAttribute("pto-entries", "[]");` with API fetch from `/api/pto` in `client/components/pto-entry-form/index.ts`.
- **Border Fix**: Add `border: var(--border-width) var(--border-style-solid) var(--color-border);` to `.day` class in `client/components/pto-calendar/index.ts`.
- **Architectural Refactor**: Moved API calls from components to parent app.ts using event-driven data flow to maintain component separation of concerns. Components now dispatch 'pto-data-request' events, and the parent handles data fetching and injection via setPtoData method.

## Unit Test Guidance

- **Tooltip**: verify Calendar icon renders `title` or `aria-label` and is visible on hover.
- **PTO rendering**: render calendar with seeded PTO entries and assert entries appear in correct dates.
- **Day cell borders**: assert computed styles or class presence that matches PTO accrual card border styling.

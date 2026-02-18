# Current Year PTO Scheduler

## Description

Implement a web component that allows employees to review the entire current fiscal year (January to December) and schedule PTO across all months. The component should display twelve monthly calendars using the existing `pto-calendar` component, enable editing of PTO dates for each month, and provide a single "Submit PTO Request" button at the bottom to submit all scheduled PTO at once. Each calendar includes a balance summary slot showing monthly PTO totals by type.

## Priority

🟡 Medium Priority

## Checklist

### Stage 1: Component Setup and Structure

- [x] Create `current-year-pto-scheduler` web component class extending BaseComponent
- [x] Set up basic HTML structure with container for 12 monthly calendars
- [x] Implement responsive grid layout for displaying months (Jan-Dec)
- [x] Add component registration and basic styling
- [x] **Validation**: Component renders without errors, `pnpm run build` passes, `pnpm run lint` passes, manual visual inspection

### Stage 2: Calendar Display and Data Loading

- [x] Integrate monthly calendar components for each month of the current year
- [x] Load existing PTO data for the current year from API
- [x] Display current PTO balances and accrued hours
- [x] **Validation**: All 12 months display correctly, data loads from API, unit tests for data loading, manual testing of calendar display

### Stage 3: PTO Editing Functionality

- [x] Enable date selection and PTO scheduling for each monthly calendar
- [x] Implement validation using `shared/businessRules.ts` for PTO requests
- [x] Add visual feedback for selected PTO dates across all months
- [x] Handle date conflicts and business rule violations
- [x] Hide the PTO type legend in each calendar since only PTO can be selected
- [x] **Validation**: PTO can be scheduled and edited, validation errors display, E2E tests for editing flow, manual testing of date selection

### Stage 4: Submission Integration

- [x] Implement "Submit PTO Request" button at the bottom of the component
- [x] Create API endpoint integration for submitting all scheduled PTO
- [x] Add confirmation dialog before submission
- [x] Handle submission success/failure with appropriate user feedback
- [x] Add `<current-year-pto-scheduler>` element to `index.html`
- [x] Integrate component management in `UIManager.ts` to populate current year data for active employee
- [x] **Validation**: Submission works end-to-end, API integration tested, E2E tests for submission flow, manual testing of submit functionality

### Stage 5: Testing and Polish

- [x] Write comprehensive unit tests for component logic
- [x] Add E2E tests for full scheduling and submission workflow
- [x] Perform cross-browser testing (Chrome primary)
- [x] Update component documentation and README
- [x] **Validation**: All tests pass, `pnpm run build` and `pnpm run lint` pass, manual testing complete, code review approved

## Implementation Notes

- Follow the pattern established in `prior-year-review` component for structure and styling
- Use `shared/dateUtils.ts` for all date operations to maintain consistency
- Leverage `shared/businessRules.ts` for PTO validation logic
- Implement as a web component using Shadow DOM for encapsulation
- Ensure mobile-responsive design for the 12-month grid
- Integrate with existing API endpoints for PTO data and submission
- Use atomic CSS classes from `tokens.css` for styling
- Follow error handling patterns with try/catch and logging
- **Uses existing `pto-calendar` component** for individual month calendars
- **Only "PTO" PTO type is scheduled** - hide the PTO type legend in each calendar since only PTO can be selected
- **Balance summary positioning**: Render balance summary outside the `pto-calendar` component and dock it to the bottom of each monthly grid cell to ensure consistent alignment across all months, preventing jagged rows caused by varying calendar heights

## Layout Issue Resolution Plan

**Problem**: Rendering balance summary within `<pto-calendar>` creates jagged grid rows due to varying calendar heights (28-31 days across months).

**Solution**: Move balance summary rendering outside the `pto-calendar` component and position it at the bottom of each monthly grid cell.

**Implementation**:

1. Each monthly grid cell will have a fixed height container sized to accommodate the maximum calendar height (6 weeks/rows)
2. Within each cell: render `<pto-calendar>` component (without balance-summary slot), followed by balance summary component
3. Use CSS flexbox or positioning to dock the summary at the bottom of the cell
4. This ensures all summaries align horizontally across the grid while calendars maintain their natural heights with appropriate spacing

**Benefits**:

- No modification needed to `pto-calendar` component internals
- Maintains separation of concerns (calendar vs summary)
- Consistent visual alignment of summaries
- Avoids forced row padding within calendar components

## Questions and Concerns

1.
2.
3.
4. ✅ Error messages should be registered with `shared/businessRules.ts` to ensure consistency between server validation and client display. - Already implemented.
5. ✅ The API handlers need to be aware of the 400 error response format with `fieldErrors` array for proper error parsing and user feedback. - Client updated to parse fieldErrors from server responses.

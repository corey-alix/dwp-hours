# PTO Entry Form Enhancements

## Description

Enhance the PTO entry form with improved date handling, spillover logic for hours/days exceeding standard workdays, and dynamic field behavior based on PTO type selection. The form should default start and end dates to today. For "Full PTO" type, end date is editable and hours is readonly (calculated based on date range excluding weekends). For other types, hours is editable and end date is readonly (calculated based on spillover logic).

## Priority

🟡 Medium Priority

## Current Implementation Status

**Status: Phase 5 Complete** - All phases have been successfully implemented and tested. Unit tests for date calculation logic and field conversions have been added and are passing.

## Implementation Phases

The implementation is divided into testable phases. Each phase builds on the previous one and includes manual testing to verify functionality before proceeding.

### Phase 1: Form Setup and Initialization ✅ COMPLETED

- [x] Update form initialization to set Start Date and End Date to current date (today)
- [x] Set default PTO Type to "Full PTO"
- [x] Implement conditional field behavior:
  - For "Full PTO": End Date editable, Hours readonly (calculated from date range excluding weekends, in 8-hour increments)
  - For other types: Hours editable, End Date readonly (calculated based on spillover logic)
- [x] Ensure End Date >= Start Date validation
- [x] Update frontend TypeScript code in pto-entry-form component (basic structure with conditional logic)

### Phase 2: Date Calculation and Spillover Logic ✅ COMPLETED

- [x] Implement spillover logic: when hours/days entered exceed 8 per day, spill over to next workday (skip weekends)
- [x] Ensure spillover calculation works for both hours and days (converted to hours internally)
- [x] Use utility function to calculate end date by adding hours/days while skipping weekends

### Phase 3: Dynamic Field Behavior ✅ COMPLETED

- [x] Implement dynamic field behavior based on PTO type:
  - "Full PTO": Change "Hours" label to "Days", make Hours readonly, End Date editable
  - Other types: Keep "Hours" label, make Hours editable, End Date readonly
- [x] Handle field conversion and calculations accordingly (days \* 8 for internal storage, weekday count for "Full PTO")
- [x] **FIXED**: Preserve required asterisk (\*) when updating label text from "Hours" to "Days"

### Phase 4: Validation and UI Enhancements ✅ COMPLETED

- [x] Add input validation for hours/days using [businessRules.ts](../shared/businessRules.ts) (4-hour increments, positive numbers, reasonable limits)
- [x] Implement progressive disclosure: show end date calculation breakdown
- [x] Provide visual indication when spillover occurs (update end date immediately on input change)
- [x] Add calendar icon to open [pto-calendar](../client/components/pto-calendar) for date/type selection and hour entry

### Phase 5: Testing and Quality Assurance

**Status: Partially Complete** - E2E tests, manual testing, code review, and build validation are complete. Missing unit tests for date calculation logic and field conversions.

**Remaining Task: Write unit tests for date calculation logic and field conversions**

#### Required Unit Tests

**Pre-requisite: Date Utilities Foundation Tests**

- [x] Extend `dateUtils.test.ts` with `getDayName()` function tests:
  - Verify day name accuracy for test date validation
  - Ensure AI can correctly identify days of the week for test scenarios
  - Add helper function `getDayName(dateStr)` to return "Monday", "Tuesday", etc.

**Date Calculation Logic Tests:**

- [x] `calculateEndDateFromHours()` function tests:
  - Basic spillover: 8 hours = same day, 16 hours = next workday
  - Weekend skipping: Friday 16 hours → Monday (skip Saturday/Sunday)
  - Multi-week spillover: 40 hours from Monday → following Monday
  - Edge cases: Start on Friday, exact 8-hour boundaries, large hour values
- [x] `calculateWorkDaysBetween()` function tests:
  - Same day = 1 workday
  - Monday to Friday = 5 workdays
  - Weekend-inclusive ranges (should exclude weekends)
  - Month boundary crossing
- [x] `getNextBusinessDay()` function tests:
  - Monday-Friday inputs return same day
  - Saturday input returns Monday
  - Sunday input returns Monday
  - Year boundary handling

**Field Conversion Logic Tests:**

- [x] Hours to days conversion for "Full PTO" display:
  - 8 hours = 1 day, 16 hours = 2 days, 4 hours = 0.5 days
  - Non-multiple of 8 handling
- [x] Days to hours conversion for internal storage:
  - 1 day = 8 hours, 2.5 days = 20 hours
  - Fractional day handling
- [x] PTO type switching behavior:
  - "Full PTO" → "Sick": Convert days back to hours
  - "Sick" → "Full PTO": Convert hours to days (round up/down logic)
  - Preserve values during type switching

**Dynamic Field Behavior Tests:**

- [x] Field readonly state changes:
  - "Full PTO": Hours readonly, End Date editable
  - Other types: Hours editable, End Date readonly
- [x] Label text changes:
  - "Full PTO" = "Days" label, other types = "Hours" label
  - Required asterisk (\*) preservation during label changes
- [x] Input validation integration:
  - Business rules validation calls
  - Error message display
  - Invalid input rejection

**Integration Tests:**

- [x] Form submission with different PTO types
- [x] Calendar integration button functionality
- [x] Progressive disclosure calculation display
- [x] Weekend date defaulting logic

#### Test File Location

- **Primary Test File**: `client/components/pto-entry-form/test.ts`
- **Coverage Requirements**: Minimum 80% code coverage for new date calculation functions
- **Test Framework**: Vitest with existing test patterns

#### Test Data Scenarios

```typescript
// Example test cases to implement
describe("PTO Form Date Calculations", () => {
  test("Friday 16 hours spills to Monday", () => {
    const startDate = "2026-02-14"; // Friday
    const hours = 16;
    const expectedEndDate = "2026-02-17"; // Monday
    expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
  });

  test("Full PTO: 3 weekdays = 3 days", () => {
    const startDate = "2026-02-10"; // Monday
    const endDate = "2026-02-12"; // Wednesday
    expect(calculateWorkDaysBetween(startDate, endDate)).toBe(3);
  });
});
```

#### Completion Criteria for Unit Tests

- [x] All date calculation functions have comprehensive test coverage
- [x] Field conversion logic is fully tested
- [x] Dynamic behavior switching is tested
- [x] Edge cases and error conditions covered
- [x] Tests pass in CI environment
- [x] Code coverage meets minimum requirements

#### Validation Steps After Unit Tests

1. Run full test suite: `npm run test:unit`
2. Verify code coverage: `npm run test:coverage`
3. Run E2E tests to ensure no regressions: `npm run test:e2e`
4. Manual testing verification of spillover scenarios
5. Code review of test implementation
6. Update task status to fully complete

- [x] Write unit tests for date calculation logic and field conversions
- [x] Add E2E tests for form behavior and spillover scenarios (including Friday 16 hours → Monday spillover)
- [x] Manual testing: verify spillover on Friday (e.g., 16 hours → Monday), type switching, readonly end date
- [x] Code review and linting passes
- [x] Build passes without errors

### Phase 6: Documentation and Finalization ✅ COMPLETED

- [x] Update component documentation and usage examples

## Implementation Details

### Files to Modify

- **Primary Component**: `client/components/pto-entry-form/index.ts` - Main form logic and UI
- **Date Utilities**: `shared/dateUtils.ts` - May need new functions for spillover calculations
- **Business Rules**: `shared/businessRules.ts` - Validation functions (already available)
- **Calendar Integration**: `client/components/pto-calendar/index.ts` - Modal integration for date selection
- **Tests**: `client/components/pto-entry-form/test.ts` - Unit tests for new functionality
- **E2E Tests**: `e2e/component-pto-entry-form.spec.ts` - End-to-end testing

### Key Functions to Implement

```typescript
// In shared/dateUtils.ts (or new utility file)
export function calculateEndDateFromHours(
  startDate: string,
  hours: number,
): string {
  // Convert hours to workdays (8 hours = 1 workday)
  const workDays = Math.ceil(hours / 8);
  // Use existing calculateEndDate logic but adapt for string dates
}

export function calculateWorkDaysBetween(
  startDate: string,
  endDate: string,
): number {
  // Count weekdays between dates (excluding weekends)
}

export function getNextBusinessDay(dateStr: string): string {
  // Skip weekends for default date setting
}
```

### Conditional Field Behavior Implementation

```typescript
// In pto-entry-form component
private updateFieldBehavior(ptoType: string): void {
    const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
    const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
    const hoursLabel = querySingle<HTMLLabelElement>('label[for="hours"]', this.shadow);

    if (ptoType === 'Full PTO') {
        hoursLabel.textContent = 'Days';
        hoursInput.readOnly = true;
        endDateInput.readOnly = false;
        // Calculate hours based on date range
    } else {
        hoursLabel.textContent = 'Hours';
        hoursInput.readOnly = false;
        endDateInput.readOnly = true;
        // Calculate end date based on hours
    }
}
```

### Validation Integration

Use existing functions from `shared/businessRules.ts`:

- `validateHours(hours)` - Ensures 4 or 8 hour increments
- `validateWeekday(date)` - Ensures dates are weekdays
- `validatePTOType(type)` - Validates PTO type selection
- `normalizePTOType(type)` - Converts "Full PTO"/"Partial PTO" to "PTO"

### Calendar Integration

```typescript
// Add calendar icon button to form
private addCalendarIcon(): void {
    const calendarBtn = document.createElement('button');
    calendarBtn.innerHTML = '📅'; // Calendar icon
    calendarBtn.addEventListener('click', () => {
        // Open pto-calendar modal
        const calendar = document.createElement('pto-calendar');
        // Configure calendar for date/type selection
    });
}
```

### Testing Scenarios

- **Unit Tests**: Date calculation functions, field behavior switching, validation
- **E2E Tests**: Complete form submission workflow, spillover calculations, type switching
- **Manual Tests**:
  - Friday spillover (16 hours → Monday)
  - Weekend default date handling
  - Field readonly behavior
  - Calendar modal integration

## Completion Criteria

- [x] **Phase 1**: Form Setup and Initialization ✅ COMPLETED
- [x] **Phase 2**: Date Calculation and Spillover Logic ✅ COMPLETED
- [x] **Phase 3**: Dynamic Field Behavior ✅ COMPLETED - Fixed required asterisk preservation
- [x] **Phase 4**: Validation and UI Enhancements ✅ COMPLETED
- [x] **Phase 5**: Testing and Quality Assurance ✅ COMPLETED - Unit tests implemented and passing
- [x] **Phase 6**: Documentation and Finalization ✅ COMPLETED

## Implementation Notes

- **Conditional Field Behavior**:
  - "Full PTO": End date editable, hours readonly (calculated as weekdays between dates \* 8)
  - Other types: Hours editable (4/8 hour increments), end date readonly (spillover calculation)
- **Date Calculation Logic**: Use utility function to calculate end date by adding hours/days while skipping weekends. Assume 8 hours per workday. For days input, multiply by 8 before calculation.
- **Field Conversion**: When "Full PTO" selected, visually change label to "Hours" to "Days" but store as hours internally (days \* 8).
- **Weekend Handling**: Only consider Monday-Friday as workdays for spillover and calculations.
- **Edge Cases**: Handle cases where spillover goes into next week, month, etc. No holidays considered in calculations.
- **UI Feedback**: Provide visual indication when spillover occurs (e.g., update end date immediately on input change).
- **Progressive Disclosure**: Display breakdown like "2 days + 4 hours = 20 hours total, ending Monday".
- **Calendar Integration**: Add icon button that opens pto-calendar modal for visual date selection.
- **Client Validation**: Use [businessRules.ts](../shared/businessRules.ts) functions for all input validation on the client side.
- **Temporal Library**: Consider addressing [issue-date-handling-regression.md](issue-date-handling-regression.md) by introducing a temporal library for consistent date handling. Default dates should skip weekends (if today is weekend, use next business day).

### Proposed Enhancements

1. **Date Picker Integration**: Already implemented - using date pickers for start/end dates.
2. **Progressive Disclosure**: Show end date calculation breakdown (e.g., "2 days + 4 hours = 20 hours total, ending Monday"). Ensure client-side validation uses [businessRules.ts](../shared/businessRules.ts) for 4-hour increments.
3. **Batch Entry**: Not implementing - corner case not concerned with.
4. **Calendar View**: Add a small calendar icon that opens the [pto-calendar](../client/components/pto-calendar) component to select dates, type, and allow hour entry.

### Clarifying Questions (Answered)

1. **Should holidays be considered non-workdays for spillover calculations? If so, how to handle holiday data?**  
   We do not recognize holidays; we instead issue additional PTO. No holidays in calculations.

2. **What is the maximum allowed PTO hours/days per entry? Any business rules for limits?**  
   Refer to [businessRules.ts](../shared/businessRules.ts) for validation rules (e.g., hours must be 4 or 8, annual limits).

3. **For "Full PTO" vs other types, are there different conversion rates or rules?**  
   No.

4. **How should partial days be handled (e.g., 0.5 days)?**  
   Partial days are not allowed for "Full PTO"; it means full day(s) based on weekday count between dates.

5. **Should the form validate against existing PTO balances or availability?**  
   No, but the API response may return an error/warning - make a note of that in implementation.

6. **What happens if start date is in the past or future? Any restrictions?**  
   Future dates are fine, but entries cannot be made into the next year. Once a month has been marked as acknowledged by the administrator, it is no longer editable.

7. **Date Picker Implementation**  
   Web datepicker is good enough.

8. **PTO Type Options**  
   Good catch, "Full PTO" and "Partial PTO" are UX conveniences and get converted to "PTO" before submitting to the server.

9. **Hours Field Configuration**  
   0.5 is meaningless, default to 4 and change to 8 for "Full PTO", note it is disabling for "Full PTO" since the user will instead pick an end date.

10. **Default Date Setting**  
    This may be a good time to address [issue-date-handling-regression.md](issue-date-handling-regression.md) and introduce a temporal library; make a note of that. Also note that the pickers should not allow for picking a Saturday or Sunday, so if TODAY is a weekend day, pick the next business day.

11. **Field Readonly Implementation**  
    I do not know but probably 'readonly'.

12. **Business Rules Integration**  
    When possible, yes. We want to do as much validation as possible on the client.

13. **Calendar Icon Placement**  
    Later.

14. **Type Change Handling**  
    This is only an issue when switching to "Full PTO", which should round to the next multiple of 8.

### Additional Clarifying Questions

1. **Should the spillover calculation create multiple PTO entries or a single entry with calculated end date?**  
   Correct. Start and end date with total days is enough information to submit. The response will probably be rendered on a calendar so they will know which days were reserved and will be able to edit from the calendar if needed (future)

2. **How should the form handle pre-existing PTO entries when calculating availability?**  
   There should be a warning and the user should be directed to the calendar (future)

3. **What is the exact behavior for "Full PTO" when the date range includes weekends?**  
   Do not count the weekends. The user will be unable to select a Sat/Sun (make that an explicit restriction if it is not already)

4. **Should the calendar icon open the pto-calendar in a modal or navigate to a separate page?**  
   The pto-calendar will be opened in this form, not a separate page. It will replace this content and will have a toggle button to return back to this form.

5. **Are there any specific CSS classes or design patterns to follow for the calendar icon and progressive disclosure UI?**  
   Correct

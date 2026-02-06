# PTO Entry Form Enhancements

## Description
Enhance the PTO entry form with improved date handling, spillover logic for hours/days exceeding standard workdays, and dynamic field behavior based on PTO type selection. The form should default start and end dates to today. For "Full PTO" type, end date is editable and hours is readonly (calculated based on date range excluding weekends). For other types, hours is editable and end date is readonly (calculated based on spillover logic).

## Priority
🟡 Medium Priority

## Implementation Phases

The implementation is divided into testable phases. Each phase builds on the previous one and includes manual testing to verify functionality before proceeding.

### Phase 1: Form Setup and Initialization
- [ ] Update form initialization to set Start Date and End Date to current date (today)
- [ ] Set default PTO Type to "Full PTO"
- [ ] Implement conditional field behavior: 
  - For "Full PTO": End Date editable, Hours readonly (calculated from date range excluding weekends, in 8-hour increments)
  - For other types: Hours editable, End Date readonly (calculated based on spillover logic)
- [ ] Ensure End Date >= Start Date validation
- [ ] Update frontend TypeScript code in pto-entry-form component (basic structure with conditional logic)

### Phase 2: Date Calculation and Spillover Logic
- [ ] Implement spillover logic: when hours/days entered exceed 8 per day, spill over to next workday (skip weekends)
- [ ] Ensure spillover calculation works for both hours and days (converted to hours internally)
- [ ] Use utility function to calculate end date by adding hours/days while skipping weekends

### Phase 3: Dynamic Field Behavior
- [ ] Implement dynamic field behavior based on PTO type:
  - "Full PTO": Change "Hours" label to "Days", make Hours readonly, End Date editable
  - Other types: Keep "Hours" label, make Hours editable, End Date readonly
- [ ] Handle field conversion and calculations accordingly (days * 8 for internal storage, weekday count for "Full PTO")

### Phase 4: Validation and UI Enhancements
- [ ] Add input validation for hours/days using [businessRules.ts](shared/businessRules.ts) (4-hour increments, positive numbers, reasonable limits)
- [ ] Implement progressive disclosure: show end date calculation breakdown
- [ ] Provide visual indication when spillover occurs (update end date immediately on input change)
- [ ] Add calendar icon to open [pto-calendar](client/components/pto-calendar) for date/type selection and hour entry

### Phase 5: Testing and Quality Assurance
- [ ] Write unit tests for date calculation logic and field conversions
- [ ] Add E2E tests for form behavior and spillover scenarios
- [ ] Manual testing: verify spillover on Friday (e.g., 16 hours → Monday), type switching, readonly end date
- [ ] Code review and linting passes
- [ ] Build passes without errors

### Phase 6: Documentation and Finalization
- [ ] Update component documentation and usage examples

## Implementation Notes
- **Conditional Field Behavior**: 
  - "Full PTO": End date editable, hours readonly (calculated as weekdays between dates * 8)
  - Other types: Hours editable (4/8 hour increments), end date readonly (spillover calculation)
- **Date Calculation Logic**: Use utility function to calculate end date by adding hours/days while skipping weekends. Assume 8 hours per workday. For days input, multiply by 8 before calculation.
- **Field Conversion**: When "Full PTO" selected, visually change label to "Hours" to "Days" but store as hours internally (days * 8).
- **Weekend Handling**: Only consider Monday-Friday as workdays for spillover and calculations.
- **Edge Cases**: Handle cases where spillover goes into next week, month, etc. No holidays considered in calculations.
- **UI Feedback**: Provide visual indication when spillover occurs (e.g., update end date immediately on input change).
- **Progressive Disclosure**: Display breakdown like "2 days + 4 hours = 20 hours total, ending Monday".
- **Calendar Integration**: Add icon button that opens pto-calendar modal for visual date selection.
- **Client Validation**: Use [businessRules.ts](shared/businessRules.ts) functions for all input validation on the client side.
- **Temporal Library**: Consider addressing [issue-date-handling-regression.md](TASKS/issue-date-handling-regression.md) by introducing a temporal library for consistent date handling. Default dates should skip weekends (if today is weekend, use next business day).

### Proposed Enhancements
1. **Date Picker Integration**: Already implemented - using date pickers for start/end dates.
2. **Progressive Disclosure**: Show end date calculation breakdown (e.g., "2 days + 4 hours = 20 hours total, ending Monday"). Ensure client-side validation uses [businessRules.ts](shared/businessRules.ts) for 4-hour increments.
3. **Batch Entry**: Not implementing - corner case not concerned with.
4. **Calendar View**: Add a small calendar icon that opens the [pto-calendar](client/components/pto-calendar) component to select dates, type, and allow hour entry.

### Clarifying Questions (Answered)
1. **Should holidays be considered non-workdays for spillover calculations? If so, how to handle holiday data?**  
   We do not recognize holidays; we instead issue additional PTO. No holidays in calculations.

2. **What is the maximum allowed PTO hours/days per entry? Any business rules for limits?**  
   Refer to [businessRules.ts](shared/businessRules.ts) for validation rules (e.g., hours must be 4 or 8, annual limits).

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
    This may be a good time to address [issue-date-handling-regression.md](TASKS/issue-date-handling-regression.md) and introduce a temporal library; make a note of that. Also note that the pickers should not allow for picking a Saturday or Sunday, so if TODAY is a weekend day, pick the next business day.

11. **Field Readonly Implementation**  
    I do not know but probably 'readonly'.

12. **Business Rules Integration**  
    When possible, yes. We want to do as much validation as possible on the client.

13. **Calendar Icon Placement**  
    Later.

14. **Type Change Handling**  
    This is only an issue when switching to "Full PTO", which should round to the next multiple of 8.
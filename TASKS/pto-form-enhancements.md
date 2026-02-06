# PTO Entry Form Enhancements

## Description
Enhance the PTO entry form with improved date handling, spillover logic for hours/days exceeding standard workdays, and dynamic field behavior based on PTO type selection. The form should default start and end dates to today, with end date being readonly and automatically updated based on entered hours/days, skipping weekends.

## Priority
🟡 Medium Priority

## Checklist
- [ ] Update form initialization to set Start Date and End Date to current date (today)
- [ ] Make End Date field readonly
- [ ] Implement spillover logic: when hours/days entered exceed 8 per day, spill over to next workday (skip weekends)
- [ ] Set default PTO Type to "Full PTO"
- [ ] Implement dynamic field behavior: when "Full PTO" selected, change "Hours" label to "Days" and convert input accordingly
- [ ] Ensure spillover calculation works for both hours and days (converted to hours internally)
- [ ] Add input validation for hours/days using [businessRules.ts](shared/businessRules.ts) (4-hour increments, positive numbers, reasonable limits)
- [ ] Implement progressive disclosure: show end date calculation breakdown
- [ ] Add calendar icon to open [pto-calendar](client/components/pto-calendar) for date/type selection and hour entry
- [ ] Update frontend TypeScript code in pto-entry-form component
- [ ] Write unit tests for date calculation logic and field conversions
- [ ] Add E2E tests for form behavior and spillover scenarios
- [ ] Update component documentation and usage examples
- [ ] Manual testing: verify spillover on Friday (e.g., 16 hours → Monday), type switching, readonly end date
- [ ] Code review and linting passes
- [ ] Build passes without errors

## Implementation Notes
- **Date Calculation Logic**: Use a utility function to calculate end date by adding hours/days while skipping weekends. Assume 8 hours per workday. For days input, multiply by 8 before calculation.
- **Field Conversion**: When "Full PTO" selected, visually change label to "Hours" to "Days" but store as hours internally (days * 8).
- **Weekend Handling**: Only consider Monday-Friday as workdays for spillover.
- **Edge Cases**: Handle cases where spillover goes into next week, month, etc. No holidays considered in calculations.
- **UI Feedback**: Provide visual indication when spillover occurs (e.g., update end date immediately on input change).
- **Progressive Disclosure**: Display breakdown like "2 days + 4 hours = 20 hours total, ending Monday".
- **Calendar Integration**: Add icon button that opens pto-calendar modal for visual date selection.
- **Client Validation**: Use [businessRules.ts](shared/businessRules.ts) functions for all input validation on the client side.

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
   Partial days are not allowed for "Full PTO"; it means full day(s).

5. **Should the form validate against existing PTO balances or availability?**  
   No, but the API response may return an error/warning - make a note of that in implementation.

6. **What happens if start date is in the past or future? Any restrictions?**  
   Future dates are fine, but entries cannot be made into the next year. Once a month has been marked as acknowledged by the administrator, it is no longer editable.
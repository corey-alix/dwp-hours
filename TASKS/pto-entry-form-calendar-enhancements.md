# PTO Entry Form Calendar Enhancements

## Description

Enhance the PTO entry form calendar functionality by eliminating the date picker view, making the calendar view the default, opening to the current month, adding swipe navigation for month changes, and improving the toolbar button layout for better responsiveness.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Remove Date Picker View and Make Calendar Default

- [x] Remove the calendar toggle button from the form header
- [x] Remove the form-view div and associated form inputs (start-date, end-date, pto-type, hours)
- [x] Update render() method to only include calendar-view as the primary interface
- [x] Modify connectedCallback() to directly initialize calendar view instead of form defaults
- [x] Update setupEventListeners() to remove form-related event listeners
- [x] Ensure calendar opens to current month by default
- [x] Test that calendar renders correctly without form toggle

### Phase 2: Implement Swipe Navigation for Calendar

- [x] Add touch event listeners to the calendar container for swipe detection
- [x] Implement swipe left gesture to navigate to next month
- [x] Implement swipe right gesture to navigate to previous month
- [x] Add visual feedback during swipe gestures (optional animation)
- [x] Ensure swipe navigation works on mobile devices
- [x] Test swipe functionality across different screen sizes
- [x] Constrain swipe navigation within fiscal year (January-December) with wrap-around
- [x] For non-mobile/touch devices, add navigational arrows (← →) to allow month changes

### Phase 3: Improve Toolbar Button Layout

- [x] Modify .form-actions CSS to use flexbox with wrap for better responsiveness
- [x] Adjust responsive breakpoint from 480px to a higher value or remove stacking entirely
- [x] Ensure buttons render on the same line when form-factor allows
- [x] Test button layout on various screen sizes (mobile, tablet, desktop)
- [x] Verify button functionality remains intact

### Phase 4: Update Component Integration and Testing

- [x] Update any parent components that reference form inputs to work with calendar-only interface
- [x] Modify validation logic to work exclusively with calendar selections
- [x] Update handleUnifiedSubmit() to always use calendar submission logic
- [x] Add unit tests for swipe navigation functionality
- [x] Add E2E tests for calendar-only PTO entry flow
- [x] Manual testing of complete PTO submission workflow
- [x] Update component documentation (README.md)

### Quality Gates

- [x] `pnpm run build` passes without errors
- [x] `pnpm run lint` passes without style issues
- [ ] Manual testing confirms calendar opens to current month
- [ ] Manual testing confirms swipe navigation works
- [ ] Manual testing confirms button layout on various devices
- [ ] E2E tests pass for PTO entry workflow

## Implementation Notes

- The calendar component (pto-calendar) already supports month navigation and selection
- Touch events should be added to the calendar container element
- Swipe detection can use standard touchstart/touchend events with coordinate tracking
- Button layout changes should maintain accessibility and usability
- Ensure backward compatibility with existing PTO data handling

## Questions and Concerns

1. How should validation messages be displayed in the calendar-only interface?
2. Should we maintain any form inputs for accessibility purposes (e.g., screen readers)?
3. What minimum swipe distance should trigger month navigation?
4. How to handle calendar initialization when no current month data is available?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/TASKS/pto-entry-form-calendar-enhancements.md

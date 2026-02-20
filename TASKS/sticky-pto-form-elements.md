# Sticky PTO Form Elements

## Description

Fix usability flaw in the PTO entry form where the "Remaining Balance" section at the top and the toolbar containing "Cancel" and "Submit" buttons at the bottom scroll with the calendars. Implement sticky positioning to dock these elements to the top and bottom of the page, potentially requiring them to be rendered on the main page instead of within the PTO entry form component.

## Priority

🟢 Low Priority

## Checklist

- [ ] **Stage 1: Investigation** - Analyze current PTO entry form component structure, identify rendering locations of Remaining Balance and toolbar, and determine optimal approach (CSS sticky vs. structural changes)
  - Validation: Document component hierarchy and rendering flow; build and lint pass
- [ ] **Stage 2: Design Solution** - Design the sticky implementation, including CSS changes or component restructuring to move elements to parent page if needed
  - Validation: Create implementation plan; discuss with team if structural changes required; build and lint pass
- [ ] **Stage 3: Implement Changes** - Modify PTO entry form component and/or parent page to implement sticky positioning
  - Validation: Manual testing shows elements remain docked during scrolling; build and lint pass; no visual regressions
- [ ] **Stage 4: Testing & Validation** - Add unit tests for sticky behavior if applicable, run E2E tests, perform cross-browser testing (Chrome primary)
  - Validation: All tests pass; manual testing confirms fix across multiple calendar scenarios; no regressions in form functionality
- [ ] **Stage 5: Documentation Update** - Update PTO entry form README and any relevant documentation
  - Validation: Documentation reflects changes; build and lint pass

## Implementation Notes

- Consider using CSS `position: sticky` for minimal changes, or restructure to move elements to main page if component boundaries prevent proper sticky behavior
- Ensure changes maintain responsive design and accessibility
- Test with multiple calendars rendered to verify sticky behavior works correctly
- Follow project's CSS animation and formatting policies
- May require coordination with web-components-assistant skill for component modifications

## Questions and Concerns

1. Should elements be moved out of the PTO entry form component to the main page, or can CSS sticky achieve the desired behavior within the component?
2. How will this affect the component's encapsulation and reusability?
3. Are there any edge cases with different screen sizes or calendar counts that need special handling?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/earth/TASKS/sticky-pto-form-elements.md

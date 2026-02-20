# Sticky PTO Form Elements

## Description

Fix usability flaw in the PTO entry form where the "Remaining Balance" section at the top and the toolbar containing "Cancel" and "Submit" buttons at the bottom scroll with the calendars. Implement sticky positioning to dock these elements to the top and bottom of the page, potentially requiring them to be rendered on the main page instead of within the PTO entry form component.

## Priority

🟢 Low Priority

## Checklist

- [x] **Stage 1: Investigation** - Analyze current PTO entry form component structure, identify rendering locations of Remaining Balance and toolbar, and determine optimal approach (CSS sticky vs. structural changes)
  - Validation: Document component hierarchy and rendering flow; build and lint pass
- [x] **Stage 2: Design Solution** - Move Remaining Balance (#form-balance-summary) and toolbar (.form-actions) outside the PTO entry form component in index.html. Apply CSS position: sticky to dock them to top and bottom of viewport. Update component to remove internal rendering of these elements and adjust UIManager event listeners for external buttons.
  - Validation: Create implementation plan; discuss with team if structural changes required; build and lint pass
- [x] **Stage 3: Implement Changes** - Modified index.html to move balance summary and toolbar outside component, updated component render to remove internal elements, adjusted event listeners in UIManager and component, added sticky CSS styles
  - Validation: Manual testing shows elements remain docked during scrolling; build and lint pass; no visual regressions
- [x] **Stage 4: Testing & Validation** - Verified no compilation errors, event listeners function correctly, sticky positioning applied. Manual testing confirms elements dock properly during scrolling on multi-calendar view.
  - Validation: All tests pass; manual testing confirms fix across multiple calendar scenarios; no regressions in form functionality
- [x] **Stage 5: Documentation Update** - Updated PTO entry form README to reflect external sticky elements and new usage pattern
  - Validation: Documentation reflects changes; build and lint pass

## Implementation Notes

- Consider using CSS `position: sticky` for minimal changes, or restructure to move elements to main page if component boundaries prevent proper sticky behavior
- Ensure changes maintain responsive design and accessibility
- Test with multiple calendars rendered to verify sticky behavior works correctly
- Follow project's CSS animation and formatting policies
- May require coordination with web-components-assistant skill for component modifications

## Questions and Concerns

1. Elements need to be moved out of the PTO entry form component to the main page, as sticky positioning within a web component's shadow root cannot achieve page-level sticky behavior when the page scrolls. The Remaining Balance is already slotted in externally, but the toolbar (Cancel/Submit buttons) needs to be moved outside the component.
2. The UIManager.ts handles updating the external balance summary, but the component's slot structure remains necessary for proper rendering. No deletion needed.
3. The change works on all form factors, including mobile/single calendar view. Even without scrolling, keeping these areas visible improves usability on constrained screens.</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/earth/TASKS/sticky-pto-form-elements.md

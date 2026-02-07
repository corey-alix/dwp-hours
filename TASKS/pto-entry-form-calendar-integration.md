# PTO Entry Form Calendar Integration

## Description
Enhance the PTO entry form component by improving the integration between form view and calendar view, implementing a common toolbar for both views, ensuring consistent defaults, and adding comprehensive end-to-end testing to verify functionality and server integration.

## Priority
🟡 Medium Priority

## Checklist

### Phase 1: UI Integration and Defaults
- [x] Modify the calendar icon to toggle between form and calendar views instead of separate buttons
- [x] Implement a common toolbar for both views containing Submit and Cancel buttons
- [x] Ensure "PTO" is the default selection in calendar view (not "Full PTO") and remove "Planned PTO" from calendar legend
- [x] Update form reset and focus methods to work with the new toolbar structure
- [x] Add keyboard navigation for calendar in edit mode (tab through weekdays and legend items)
- [x] Playwright testing: Verify toggling between views preserves form state
- [x] Playwright testing: Verify "PTO" is selected by default in calendar view and "Planned PTO" is removed
- [x] `npm run test` passes

### Phase 2: Unified Submission Logic
- [x] Refactor submission to use the common Submit button for both views
- [x] Ensure form validation works consistently across both views
- [x] Update event handling to dispatch pto-submit from the common toolbar
- [x] e2e testing: Submit PTO requests from both form and calendar views
- [x] Unit tests for submission logic pass
- [x] `npm run test` passes

### Phase 3: Component E2E Testing
- [x] Update test.html E2E test to leverage test.ts playground functionality
- [x] Implement logging of PTO submissions to the screen for manual observation
- [x] Add automated checks for form toggling and submission events
- [x] Playwright tests for test.html pass
- [x] Playwright testing: Observe logged submissions during test execution
- [x] run `npm run test` until all tests pass

### Phase 4: Application E2E Testing
- [x] Implement E2E tests for index.html to verify PTO submissions are accepted by the server
- [x] Add validation that submitted values are correctly written to the database
- [x] Playwright tests for index.html PTO submission flow pass
- [x] Manual testing: Verify end-to-end PTO request submission
- [ ] Implement E2E tests for index.html to verify PTO submissions from calendar view are accepted by the server and written to the database
- [ ] Implement E2E tests for index.html to verify PTO submissions from form view are accepted by the server and written to the database
- [x] run `npm run test` until all tests pass

### Phase 5: Documentation and Review
- [x] Update component README.md with new toolbar and view integration details
- [x] Add "Questions and Concerns" section to this task file
- [x] Code review of all changes
- [x] Final manual testing of complete feature
- [x] run `npm run test` until all tests pass

## Implementation Notes
- Ensure calendar view defaults match form view defaults
- Use existing test utilities (querySingle, addEventListener) for consistency
- Follow project's error handling and validation patterns
- Consider accessibility when implementing the common toolbar

## Questions and Concerns
1. Resolved: The pto-calendar component exists and has tests ([component-pto-calendar.spec.ts](../e2e/component-pto-calendar.spec.ts)), but may require further development for full functionality.
2. Resolved: The PTO submission API exists in [server.mts](../server/server.mts) and [APIClient.ts](../client/APIClient.ts), but may require further development.
3. Resolved: Playwright is configured as shown in [playwright.config.ts](../playwright.config.ts).
4. Resolved: Default behavior will not be synchronized between form and calendar views since they are not synchronized by date.
5. Resolved: Add keyboard navigation requirements for the calendar in edit mode - users should be able to tab through weekdays and legend items to toggle PTO types.
6. Resolved: Backward compatibility concerns removed as this is an MVP.
7. Resolved: Authentication uses auth_hash cookie for server-side employee identification. Server implementation needs verification and potential updates. Current user context stored in localStorage initially. Add new phase for employee context integration.
8. Resolved: Leverage and extend [businessRules.ts](../shared/businessRules.ts) for client-side validation. Update [copilot-instructions.md](../.github/copilot-instructions.md) to require all business rules come from shared module.
9. Resolved: Default to "form" view for rapid single-day entries - no state synchronization needed between views.
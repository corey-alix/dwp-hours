# Declarative UI Elements

## Description

Refactor the UI to use declarative HTML elements in index.html instead of dynamically injecting PTO cards via JavaScript. The UIManager should check for existing elements before manipulating them, improving code maintainability and making the UI structure more explicit.

## Priority

🟢 Low Priority

## Checklist

### Stage 1: Analysis

- [x] Analyze current dynamic element creation in `loadPTOStatus()` and `renderPTOStatus()` methods in `UIManager`
- [x] Identify all dynamically created PTO card elements (pto-summary-card, pto-accrual-card, pto-sick-card, etc.)
- [x] Document the current element creation flow and data binding

### Stage 2: HTML Structure

- [x] Add declarative PTO card elements to `index.html` within the `#pto-status` div
- [x] Include all required PTO card elements: pto-summary-card, pto-accrual-card, pto-sick-card, pto-bereavement-card, pto-jury-duty-card, pto-pto-card, pto-employee-info-card
- [x] Ensure proper semantic structure with appropriate containers

### Stage 3: UIManager Refactor

- [x] Modify `UIManager` methods to use `querySingle` to check for existing elements before manipulation
- [x] Update data binding logic to work with pre-existing elements instead of creating new ones
- [x] Ensure event listeners are properly attached to declarative elements
- [x] Maintain backward compatibility for test environments where elements might not exist

### Stage 4: Testing & Validation

- [x] Test that PTO status loads correctly with declarative elements
- [x] Verify data binding works for all PTO card types
- [x] Test navigation between current year and prior year views
- [x] Manual testing of PTO request submission and data refresh

### Stage 5: Cleanup

- [x] Remove old dynamic element creation code from `loadPTOStatus()` and `renderPTOStatus()`
- [x] Clean up any unused helper methods or variables
- [x] Update comments and documentation to reflect the new declarative approach

### Quality Gates

- [x] `npm run build` passes without errors
- [x] `npm run lint` passes without warnings
- [x] Manual testing confirms all PTO functionality works correctly
- [x] Code review for maintainability and consistency

## Implementation Notes

- Use `querySingle` from `test-utils.ts` for element queries to maintain error-throwing behavior
- Wrap element existence checks in try/catch blocks for test environment compatibility
- Ensure the declarative HTML structure matches the dynamic creation order for proper styling
- Consider adding loading states or placeholders in the HTML for better UX during data fetch

### Date Navigation Bug Fix

**Bug**: The PTO card did not respond to date clicks for calendar navigation, while Sick, Bereavement, and Jury Duty cards worked correctly.

**Root Cause**: The `navigate-to-month` event listener was only attached to Sick, Bereavement, and Jury Duty cards in `app.ts`, but not to the PTO card.

**Fix**: Added the missing event listener for the PTO card to enable date clicking navigation.

### Event Listener Leak Bug Fix

**Bug**: Event listeners for PTO cards were being added multiple times every time `loadPTOStatus()` or `renderPTOStatus()` was called, causing memory leaks and potential multiple event firing.

**Root Cause**: Event listener setup code was placed inside methods that get called repeatedly (`loadPTOStatus()` is called every time the user switches to current year view, `renderPTOStatus()` is called after data refreshes).

**Fix**: Moved all PTO card event listener setup to a new `setupPTOCardEventListeners()` method that is called only once from `showDashboard()`. Removed duplicate event listener setup from `loadPTOStatus()` and `renderPTOStatus()`.

### PTO Remaining Calculation Bug Fix

**Bug**: PTO card displayed incorrect remaining hours (showing 0 instead of correct value like 96).

**Root Cause**: The PTO remaining calculation was using total lifetime PTO used instead of current year PTO used for consistency with the displayed "Used" value.

**Fix**: Changed PTO remaining calculation to use `usedPTOCurrentYear` instead of `usedPTO`, ensuring remaining = allowed - current_year_used.

## Questions and Concerns

1. How should loading states be handled with declarative elements? → index.html simply defines them with no state, the components may need to be modified to handle this configuration
2. Are there any test-specific elements that need special handling? → I do not understand the question
3. Should the HTML include default attributes or let JavaScript set them dynamically? → no, define them only in #file:app.ts as is currently happening, but declare/create them in #file:index.html
4. How to ensure proper element ordering and styling with declarative approach? → ordering is based on layout, even easier than before, styling should also be unaffected
5. PTO balance validation bug: The PTO card shows allowed 136, used 40, remaining 96, but when trying to schedule 8 hours of PTO, it fails with validation error "PTO request exceeds available PTO balance". This suggests a server-side validation issue where the balance calculation doesn't match the displayed client-side values. → **Fixed**: Changed server-side validation in `PtoEntryDAL.ts` to use `ptoStatus.ptoTime.remaining` instead of `ptoStatus.availablePTO` for PTO balance validation, ensuring consistency with client-side display that uses current year used hours.

# Regression Report: Maximum Call Stack Size Exceeded in employee-workflow.spec.ts

## Issue Summary

The `employee-workflow.spec.ts` E2E test is logging "Maximum call stack size exceeded" errors in the browser console, indicating an infinite recursion bug in the frontend code. While the test technically passes (receives expected API response), the underlying JavaScript error suggests a critical flaw in the PTO request submission event handling.

## Previously Working

- The test executed without JavaScript errors in the browser console
- PTO request submission events were handled cleanly without recursion
- No stack overflow errors during calendar-based PTO submissions

## Current Behavior

- Test passes functionally (API call succeeds, response validated)
- Browser console shows repeated "Maximum call stack size exceeded" errors
- Infinite recursion occurs during PTO request event dispatching

## Expected Behavior

- Test executes without any JavaScript errors
- PTO request events are processed efficiently without recursion
- Clean browser console output during test execution

## Steps to Reproduce

1. Run `npx playwright test e2e/employee-workflow.spec.ts`
2. Observe browser console for "Maximum call stack size exceeded" errors
3. Note that the test still passes despite the errors

## Impact

**Severity: High**

- Indicates critical bug in production frontend code that could cause browser crashes
- Affects test reliability and debugging capabilities
- Potential performance issues in PTO request workflows
- May prevent proper error handling in edge cases

## Potential Root Causes

1. **Infinite Recursion in Event Handling**: The `pto-accrual-card` component listens for `pto-request-submit` events and dispatches the same event type, creating a loop
2. **Event Bubbling Issues**: Improper event propagation through shadow DOM boundaries
3. **Recent Component Refactoring**: Changes in commit `1d2c291` ("feat: enhance calendar animation and improve focus styles in PTO components") may have introduced the recursive dispatch
4. **Web Component Lifecycle**: Event listeners added during component initialization causing self-triggering events

## Code Analysis

**Root Cause Identified**: In `client/components/pto-accrual-card/index.ts`:

- Component adds event listener for `pto-request-submit` (line 423)
- Handler calls `handlePtoRequestSubmit()` which dispatches another `pto-request-submit` event (line 555)
- Since listener is on `this`, dispatching triggers the same listener again → infinite recursion

**Fix Applied**: Removed the redundant event listener and dispatch logic. The event now bubbles directly from the slotted `pto-calendar` to the `UIManager` without intermediate re-dispatching.

## Clarifying Questions

1. When did this regression first appear? Was it present before the recent PTO component refactoring commits?
2. Does this affect only this specific test or all PTO submission workflows?
3. Are there any related stack overflow issues in other components or tests?
4. Has the event handling architecture changed recently in the web components?

## Investigation Checklist

- [x] Identified root cause in `pto-accrual-card` event handling
- [x] Applied fix by removing recursive event dispatch
- [x] Verified test passes without errors
- [ ] Run full E2E test suite to ensure no regressions
- [ ] Test PTO submission in manual browser testing
- [ ] Review other components for similar event handling patterns
- [ ] Check if UIManager properly receives bubbled events

## Suggested Debugging Steps

1. Add console logging to event listeners to trace dispatch chains
2. Use browser dev tools to inspect event propagation
3. Temporarily disable event listeners to isolate the recursion source
4. Review web component event bubbling documentation for shadow DOM

## Resolution

**Fixed**: Removed the self-triggering event listener in `pto-accrual-card` component. The event now properly bubbles from the calendar to the UIManager without recursion.

**Files Modified**:

- `client/components/pto-accrual-card/index.ts`: Removed `setupEventDelegation` override and `handlePtoRequestSubmit` method

**Testing**: Test now passes cleanly without console errors.

## Questions and Concerns

1. Is there any processing that was intended in the accrual card for PTO requests that we may have lost?
2. Should we add validation or logging at the UIManager level for PTO submissions?
3. Are there other components with similar event forwarding patterns that need review?

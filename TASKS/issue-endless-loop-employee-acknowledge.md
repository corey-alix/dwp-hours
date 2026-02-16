# Regression Issue: Endless Loop in AdminPanel Event Handling

## Issue Summary

The `AdminPanel` component in `client/components/admin-panel/index.ts` is creating an endless loop when the "employee-acknowledge" event fires. The same issue likely affects "admin-acknowledge" events. This occurs because the event handler dispatches a new event of the same type with `bubbles: true`, causing the event to re-trigger the same handler.

## Previously Working

- Event handlers for "employee-acknowledge" and "admin-acknowledge" were processing events without causing infinite loops
- Events were properly dispatched to parent components for further handling

## Current Behavior

- When "employee-acknowledge" event is fired, the handler dispatches a new "employee-acknowledge" event with `bubbles: true`
- This causes the event to bubble up and re-trigger the same handler on the same element
- Results in an endless loop, potentially crashing the application

## Expected Behavior

- Event handlers should process the event and dispatch it to parent components without causing loops
- Events should bubble appropriately without re-triggering the same handler

## Steps to Reproduce

1. Navigate to the Admin Panel
2. Trigger an action that fires the "employee-acknowledge" event (e.g., acknowledging an employee review)
3. Observe the endless loop in console logs or application freezing

## Impact

- **Severity**: High - Causes application instability and potential crashes
- **Affected Users**: Administrators using the admin panel
- **Scope**: Frontend component event handling

## Potential Root Causes

- **Event Bubbling Loop**: The `handleCustomEvent` method dispatches a new event of the same type with `bubbles: true`, causing re-triggering
- **Event Listener Setup**: The component listens for events on itself, and the dispatched event bubbles back
- **Recent Changes**: Possible recent modifications to event handling logic in the AdminPanel component

## Clarifying Questions

1. When did this regression first appear? After which commit or deployment?
2. Does this affect both "employee-acknowledge" and "admin-acknowledge" events?
3. Are there any console errors or logs when the loop occurs?
4. Has the event handling logic been recently modified?
5. Does this occur in all browsers or specific ones?

## Resolution Summary

**Root Cause Identified**: The `setupEventDelegation` method added event listeners on `this` (the host element) for events like `"employee-acknowledge"`. When `handleCustomEvent` re-dispatched a new event of the same type on `this` with `bubbles: true`, the same listener caught the new event, creating an infinite loop. The same pattern affected `"employee-delete"` and `"admin-acknowledge"`.

**Why `stopPropagation()` alone was insufficient**: `e.stopPropagation()` only prevents the _original_ event from propagating further. The _newly dispatched_ event on `this` is a separate event that still triggers the `addEventListener` on the same element.

**Fix Applied (two-layer defense)**:

1. **Moved listeners from `this` to `this.shadowRoot`**: Child component events bubble through the shadow DOM and reach `shadowRoot`. Listening there means the re-dispatched event (on `this`, the host) does not re-enter the shadow tree in spec-compliant browsers.
2. **Added re-entrancy guard (`_handlingEvent` flag)**: Some test environments (e.g., happy-dom) propagate host-dispatched events back into the shadow tree. A boolean flag in `handleCustomEvent` short-circuits re-entrant calls, providing defense-in-depth.

**Proxy/facade pattern preserved**: AdminPanel still intercepts all child component events, stops their propagation, and re-dispatches them on the host element. Parent components (app.ts, test.ts) continue to listen on the AdminPanel element and receive clean, proxied events.

**Affected events**: `"employee-acknowledge"`, `"employee-delete"`, `"admin-acknowledge"` (all pass-through proxy events that dispatch the same event type).

**Validation**:

- 22 unit tests pass (3 new cycle-detection tests added)
- Build and lint pass
- Proxy pattern verified: events dispatched from shadowRoot are re-emitted on host
- No infinite loops detected under either real shadow DOM or happy-dom semantics

## Investigation Checklist

### Phase 1: Reproduce and Isolate

- [x] Set up a test environment to trigger the "employee-acknowledge" event
- [x] Confirm the endless loop occurs and log the event firing pattern
- [x] Test "admin-acknowledge" event for the same issue
- [x] Run `npm run build` and `npm run lint` to ensure no build issues

### Phase 2: Root Cause Analysis

- [x] Review the `handleCustomEvent` method in AdminPanel component
- [x] Analyze event dispatching logic for "employee-acknowledge" and "admin-acknowledge"
- [x] Check event listener setup in `setupEventDelegation`
- [x] Identify why the dispatched event re-triggers the handler

### Phase 3: Implement Fix

- [x] Modify event dispatching to prevent loops (e.g., change event type or prevent bubbling)
- [x] Ensure parent components still receive the events appropriately
- [x] Update any related event handling logic

### Phase 4: Testing and Validation

- [x] Test the fix manually by triggering the events
- [x] Run existing E2E tests to ensure no regressions
- [x] Verify event bubbling to parent components works correctly
- [x] Run `npm run test` for unit tests

### Phase 5: Documentation and Cleanup

- [x] Update component documentation if needed
- [x] Ensure code quality standards are met
- [x] Mark task as complete in TASKS/README.md

## Suggested Debugging Steps

1. Add console logging to track event firing: `console.log('Event fired:', event.type, event.detail);`
2. Temporarily disable event dispatching to confirm it stops the loop
3. Use browser dev tools to inspect event propagation
4. Check if `stopPropagation()` or `stopImmediatePropagation()` resolves the issue

## Dependencies

- Requires access to AdminPanel component code
- May need to coordinate with parent component event handling

## Related Files

- `client/components/admin-panel/index.ts` - Main component file (fix applied here)
- `client/components/employee-list/index.ts` - Dispatches `employee-acknowledge` and `employee-delete` via `data-action` buttons
- `client/components/admin-monthly-review/index.ts` - Dispatches `admin-acknowledge`
- `client/app.ts` - Parent that listens for proxied events on admin-panel
- `client/components/admin-panel/test.ts` - Playground test harness
- `tests/components/admin-panel.test.ts` - Unit tests (3 new cycle-detection tests added)</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/TASKS/issue-endless-loop-employee-acknowledge.md

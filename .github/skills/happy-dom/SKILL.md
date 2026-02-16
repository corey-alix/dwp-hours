# Happy DOM Event Handling

## Description

Documents verified Happy DOM shadow DOM event behavior and guides agents away from unnecessary re-entrancy guards. Happy DOM correctly enforces shadow DOM event boundaries — events dispatched on a host element do **not** re-enter its shadow tree. When duplicate handler calls occur in tests, the cause is application-level bugs (typically listener accumulation), not Happy DOM defects.

## Trigger

- Adding or reviewing re-entrancy guards in web component event handlers
- Debugging duplicate event handling in Happy DOM unit tests
- Investigating whether Happy DOM leaks events across shadow boundaries
- Proxy/facade pattern: re-dispatching an event from shadowRoot listener onto the host

## Response Pattern

1. **Assume Happy DOM is correct** — Happy DOM (v20.6.1+) correctly enforces shadow DOM event boundaries. Events dispatched on the host element (`this`) do not propagate back into `this.shadowRoot` listeners. This was verified in the AdminPanel investigation (see [issue-endless-loop-employee-acknowledge.md](../../../TASKS/issue-endless-loop-employee-acknowledge.md)).
2. **Look for listener accumulation** — The most common cause of duplicate handler calls is listeners being registered multiple times. Check whether `setupEventDelegation()` overrides guard against re-registration across re-renders.
3. **Check for feedback loops** — If the handler dispatches an event of the same type, verify the listener target (`this` vs `this.shadowRoot`) prevents self-triggering.
4. **Never add a re-entrancy guard to paper over duplicates** — A `_handlingEvent` flag silently drops duplicate calls, masking the real bug (e.g., N listeners where only 1 should exist). Fix the root cause instead.

## Examples

- "My handler is called twice — is Happy DOM broken?" → No. Check for duplicate listener registration.
- "Should I add a `_handlingEvent` guard?" → No. Find and fix the source of re-entrancy.
- "Does `composed: true` cause events to loop back into the shadow tree?" → No. Happy DOM correctly scopes dispatch.
- "setupEventDelegation is called on every render — is that safe?" → Only if custom listeners are guarded against re-registration.

## Additional Context

### Verified Happy DOM Behavior (v20.6.1)

These behaviors were **verified by test** in this project, not assumed from documentation:

- `shadowRoot.addEventListener("x", handler)` — handler fires when event dispatched inside the shadow tree
- `this.dispatchEvent(new CustomEvent("x", { bubbles: true }))` on the host — does **NOT** trigger `shadowRoot` listeners for "x"
- `composed: true` allows events to cross shadow boundaries **outward** (child → host → parent), not **inward** (host → its own shadow tree)
- `stopPropagation()` on the original event plus re-dispatch on host is a safe proxy pattern — no cycle occurs

### The Listener Accumulation Pattern (Confirmed Root Cause)

The AdminPanel "infinite loop" was caused by **listener accumulation**, not Happy DOM:

1. `BaseComponent.connectedCallback()` calls `setupEventDelegation()` → adds custom listeners on `shadowRoot`
2. Then calls `update()` → `renderTemplate()` → `setupEventDelegation()` again → adds **duplicate** listeners
3. Each `requestUpdate()` → `renderTemplate()` → another `setupEventDelegation()` → more duplicates
4. `shadowRoot` listeners survive `innerHTML` replacement (they're on the root, not on child elements)
5. Result: N listeners fire for 1 event → handler called N times → looks like re-entrancy

**Fix**: Add a `_customEventsSetup` boolean guard in `setupEventDelegation()` overrides, same pattern `BaseComponent` uses with `isEventDelegationSetup`.

```ts
protected setupEventDelegation() {
  super.setupEventDelegation();
  if (this._customEventsSetup) return;  // Prevent duplicate listeners
  this._customEventsSetup = true;

  this.shadowRoot.addEventListener("my-event", (e) => {
    e.stopPropagation();
    this.handleCustomEvent(e as CustomEvent);
  });
}
```

### Why Re-entrancy Guards Are Wrong Here

```ts
// BAD: Masks the real bug (duplicate listeners)
private _handlingEvent = false;
handleCustomEvent(e: Event): void {
  if (this._handlingEvent) return;  // Silently drops calls 2..N
  this._handlingEvent = true;
  try { /* … */ } finally { this._handlingEvent = false; }
}
```

This "works" but:

- Silently drops legitimate duplicate calls that indicate a bug
- Tests can only assert `callCount ≤ 2` instead of `callCount === 1`
- The guard remains forever, obscuring whether the underlying bug is fixed

### Rules for Agents

- **Happy DOM shadow DOM event boundaries are correct** — do not claim otherwise without a minimal repro
- **Never add `_handlingEvent` guards** — find and fix the source of duplicate calls
- **Check `setupEventDelegation` overrides** for missing re-registration guards whenever duplicate handler calls are observed
- **Assert exact call counts in tests** (`toBe(1)`, not `toBeLessThanOrEqual(2)`) to catch listener accumulation regressions

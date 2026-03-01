# Event Delegation Refactor

## Description

Refactor BaseComponent's centralized event delegation that handles all clicks/submits/keydowns, which creates "event soup" in large components. Replace with targeted listeners and custom events for better modularity and maintainability.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Design

- [x] Analyze current BaseComponent event delegation patterns
- [x] Identify components suffering from "event soup"
- [x] Document event handling responsibilities and complexity
- [ ] Design targeted listener patterns for specific components
- [ ] Create custom event system for component communication
- [ ] Update architecture-guidance skill with event patterns
- [ ] Manual review of refactoring strategy

**Discovery Findings:**

- **BaseComponent event delegation pattern:**
  - Centralized delegation in `setupEventDelegation()` method (lines 35-47)
  - Delegates `click`, `submit`, and `keydown` events on shadowRoot
  - Subclasses override `handleDelegatedClick()`, `handleDelegatedSubmit()`, `handleDelegatedKeydown()`
  - Uses single delegation point for all events, creating "event soup" in large components

- **Components using delegation extensively:**
  - All components extending BaseComponent (20+ components)
  - Complex components like `AdminMonthlyReview`, `PtoEntryForm`, `EmployeeList` have extensive delegated handlers
  - Event logic mixed with business logic in handler methods

- **Current benefits:**
  - Automatic cleanup via `cleanupEventListeners()`
  - Dynamic content support (events work on newly added elements)
  - Consistent pattern across all components

- **Issues identified:**
  - Large components have 50+ lines of event handling logic
  - Event routing logic becomes complex with multiple conditional branches
  - Harder to reason about event flow and debug issues
  - Over-delegation for simple static components

- **Impact:** Centralized pattern used by all components, but creates maintenance burden in complex ones

**Event Soup Audit — Component Complexity Matrix:**

| Component               | Click (lines/branches) | Submit (lines/branches) | Keydown (lines/branches) | Setup Override | Extra Listeners |  Complexity  |
| ----------------------- | :--------------------: | :---------------------: | :----------------------: | :------------: | :-------------: | :----------: |
| DebugConsole            |         7 / 1          |            —            |            —             |       no       |        0        |     LOW      |
| DashboardNavigationMenu |         17 / 5         |            —            |          17 / 6          |       no       |  2 (document)   |    MEDIUM    |
| MonthSummary            |         14 / 3         |            —            |            —             |       no       |        0        |     LOW      |
| PtoNotification         |         11 / 2         |            —            |            —             |       no       |        0        |     LOW      |
| PtoPtoCard              |         17 / 3         |            —            |          12 / 2          |       no       |        0        |     LOW      |
| EmployeeForm            |         37 / 4         |            —            |          14 / 3          |       no       |        0        |    MEDIUM    |
| EmployeeList            |         33 / 6         |            —            |            —             |    **yes**     |        7        |     HIGH     |
| PtoCalendar             |         55 / 7         |            —            |          10 / 4          |       no       |        0        |     HIGH     |
| PtoRequestQueue         |         55 / 8         |            —            |            —             |       no       |        0        |     HIGH     |
| PtoEntryForm            |         12 / 3         |            —            |            —             |    **yes**     |        4        |    MEDIUM    |
| AdminMonthlyReview      |         70 / 7         |            —            |            —             |       no       |        1        | **CRITICAL** |
| TimesheetUploadForm     |           —            |          5 / 1          |            —             |    **yes**     |        1        |     LOW      |
| LoginPage               |           —            |          5 / 1          |            —             |       no       |        0        |     LOW      |
| AdminSettingsPage       |           —            |          9 / 2          |            —             |    **yes**     |        1        |     LOW      |
| AdminEmployeesPage      |         16 / 1         |            —            |            —             |    **yes**     |        5        |    MEDIUM    |
| AdminPtoRequestsPage    |           —            |            —            |            —             |    **yes**     |        3        |    MEDIUM    |
| AdminMonthlyReviewPage  |           —            |            —            |            —             |    **yes**     |        4        |    MEDIUM    |
| SubmitTimeOffPage       |         5 / 3          |            —            |            —             |    **yes**     |        6        |    MEDIUM    |

**Totals:** 18 components, 12 override `handleDelegatedClick`, 3 override `handleDelegatedSubmit`, 4 override `handleDelegatedKeydown`, 8 override `setupEventDelegation`. 34 additional listeners beyond the 3 base delegated ones.

**🔴 CRITICAL — Top Refactoring Candidates:**

1. **AdminMonthlyReview** (`client/components/admin-monthly-review/index.ts`)
   - 70-line click handler, 7 conditional branches
   - Two-click confirmation pattern, 4 distinct action zones (acknowledge, notify, view-calendar, calendar-nav)
   - Multiple `classList.contains()`, `hasAttribute()`, `getAttribute()` calls
   - Animation coordination with `navigateMonthWithAnimation`
   - Inline `transitionend` listener for animation cleanup

2. **PtoCalendar** (`client/components/pto-calendar/index.ts`)
   - 55-line click handler, 7 branches + sub-handlers
   - 4 `closest()` calls handling note indicators, day cell selection, legend type toggling, submit slot
   - Keydown delegates to `handleLegendKeyDown` / `handleGridKeyDown` (hidden complexity)
   - Complex selection state management

3. **PtoRequestQueue** (`client/components/pto-request-queue/index.ts`)
   - 55-line click handler, 8 conditional branches (most of any component)
   - Two-click confirmation pattern with timer-based auto-revert
   - `_pendingConfirmations` Map and `_negativeBalanceEmployeeIds` Set state management

**🟡 MEDIUM — Secondary Candidates:**

4. **EmployeeList** (`client/components/employee-list/index.ts`)
   - 33-line click handler, 6 branches + 7 extra listeners in `setupEventDelegation`
   - Long-press delete pattern (pointerdown/up/cancel/leave)
   - Event forwarding, search input handling, calendar navigation

5. **EmployeeForm** (`client/components/employee-form/index.ts`)
   - 37-line click handler with inline form submission logic (validate, collect, dispatch, clear state)
   - Business coordination embedded in click handler

6. **DashboardNavigationMenu** (`client/components/dashboard-navigation-menu/index.ts`)
   - Duplicated action-dispatch logic between click and keydown handlers (DRY violation)
   - 2 document-level listeners managed manually for auto-close

**Cross-Cutting Issues Identified:**

1. **DRY violations:** DashboardNavigationMenu duplicates action routing between click/keydown. AdminMonthlyReview and PtoRequestQueue independently implement the same two-click confirmation pattern.
2. **Target identification inconsistency:** Mix of `classList.contains()`, `id` matching, `closest()`, `matches()`, `hasAttribute()`, and `dataset.action` — no single standard across components.
3. **Page orchestrator pattern:** Pages (AdminEmployeesPage, AdminPtoRequestsPage, AdminMonthlyReviewPage, SubmitTimeOffPage) primarily use `setupEventDelegation` to add `CustomEvent` listeners coordinating child components — not direct user interaction handlers.
4. **Guard flag pattern:** `_customEventsSetup` / `_inputListenerSetup` booleans used across 6 components to prevent duplicate listener registration — indicating the base pattern doesn't natively handle this.
5. **Business logic in handlers:** EmployeeForm and AdminMonthlyReview embed validation, API calls, and state management directly in event handlers instead of delegating to separate methods.

### Phase 2: Custom Event System

- [ ] Implement custom event classes for component interactions
- [ ] Create event bus/registry for decoupled communication
- [ ] Add event naming conventions and type safety
- [ ] Implement event listener cleanup patterns
- [ ] Test custom event dispatching and handling
- [ ] Build passes, lint passes

### Phase 3: Targeted Listener Implementation

- [ ] Replace centralized delegation with targeted listeners in BaseComponent
- [ ] Implement component-specific event handlers
- [ ] Add event delegation only where beneficial (e.g., dynamic content)
- [ ] Update component lifecycle for proper listener management
- [ ] Test event handling accuracy and performance
- [ ] Manual testing of component interactions

### Phase 4: Component-Specific Refactoring

- [ ] Refactor large components to use targeted event handling
- [ ] Implement custom events for cross-component communication
- [ ] Remove unnecessary event bubbling and delegation
- [ ] Add proper event listener cleanup in disconnectedCallback
- [ ] Update component documentation with event contracts
- [ ] Build passes, lint passes

### Phase 5: Testing and Validation

- [ ] Update unit tests to verify targeted event handling
- [ ] Add E2E tests for component interaction flows
- [ ] Performance testing for event handling efficiency
- [ ] Memory leak testing for proper listener cleanup
- [ ] Code review and maintainability audit
- [ ] Documentation updates
- [ ] Build passes, lint passes, all tests pass

## Implementation Notes

- **Targeted Listeners**: Use specific selectors for event delegation where needed
- **Custom Events**: Implement typed custom events for component communication
- **Cleanup**: Ensure all listeners are removed in disconnectedCallback
- **Performance**: Minimize event bubbling and delegation overhead
- **Type Safety**: Full TypeScript coverage for event types and handlers
- **Modularity**: Clear separation of event responsibilities per component

## Questions and Concerns

### 1. How to balance targeted listeners vs beneficial delegation for dynamic content?

**Answer:** Use **hybrid model** per component:

- Static / predictable structure → direct `.addEventListener` on concrete elements
- Dynamic lists / repeating templates / inserted rows → one delegated listener on nearest stable container + `event.target.closest(selector)`

**Justification:**

- Direct listeners = fastest dispatch path, clearest stack traces, easiest to reason about
- Delegation only where it actually eliminates repetitive `add/remove` work (typically 5–20+ elements recreated frequently)
- Most "dynamic" UI in practice has one or few stable delegation roots per component → rarely need shadowRoot-level catch-all

### 2. Should we implement a custom event bus or stick to DOM events?

**Answer:** **Prefer typed CustomEvent + dispatchEvent** on component elements first. Introduce lightweight event bus **only** when communication crosses component tree boundaries without reasonable ancestor (rare in well-structured shadow DOM apps).

**Justification:**

- `CustomEvent` + `bubbles: true, composed: true` already gives excellent decoupling + native devtools support
- Global/custom bus adds indirection, harder tracing, lifecycle management burden, test mocking pain
- Most page-orchestrator → child communication can be solved with events on the page element itself

### 3. How to handle event cleanup in complex component hierarchies?

**Answer:** Single source of truth — every `addEventListener` is wrapped with `addCleanup(() => removeEventListener(…))`:

```ts
class BaseComponent extends HTMLElement {
  protected readonly listeners: Array<() => void> = [];

  protected addCleanup(fn: () => void) {
    this.listeners.push(fn);
  }

  disconnectedCallback() {
    this.listeners.forEach((fn) => fn());
    this.listeners.length = 0;
    super.disconnectedCallback?.();
  }
}
```

**Justification:**

- Avoids missing cleanup when refactoring
- Works equally well for delegated & direct listeners
- Zero magic compared to WeakMap / symbol tricks
- Easy to audit & extend (e.g. signal-based cleanup later)

### 4. What patterns for cross-component communication without tight coupling?

**Answer** (priority order):

1. **Upward**: `element.dispatchEvent(new CustomEvent("my-action", { bubbles: true, composed: true, detail }))`
2. **Downward**: `@property` / `attributeChangedCallback` + method call OR custom event on child
3. **Sibling / cousin** via nearest shared ancestor that listens & re-dispatches
4. **Global rare case** → context object injected via constructor / property + event

**Justification:** Follows web component philosophy: the element tree _is_ the composition root. Most "global" needs disappear once you stop reaching across unrelated sub-trees.

### 5. How to test event-driven interactions reliably?

**Answer:** Recommended stack:

```ts
// unit — assert outgoing events (contract)
it("dispatches cancel-request when cancel button clicked", async () => {
  const el = new MyComponent();
  const spy = vi.spyOn(el, "dispatchEvent");
  el.render();

  el.shadowRoot!.querySelector(".btn-cancel")!.click();

  expect(spy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "cancel-request",
      bubbles: true,
      composed: true,
    }),
  );
});

// integration — assert reaction to incoming events
it("updates UI after accept-action event", async () => {
  const page = new AdminMonthlyReview();
  page.connectedCallback();

  page.dispatchEvent(
    new CustomEvent("accept-action", { detail: { id: "123" } }),
  );

  await nextFrame();
  expect(page.shadowRoot!.querySelector(".status-123")!.textContent).toContain(
    "Accepted",
  );
});
```

**Justification:**

- Unit = assert outgoing events (contract)
- Integration = assert reaction to incoming events
- Avoid over-mocking DOM events → test real `dispatchEvent` path
- Use `flushPromises` / `nextFrame` / `waitUntil` helpers for async updates
- E2E only for critical happy paths (Playwright)</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/event-delegation-refactor.md

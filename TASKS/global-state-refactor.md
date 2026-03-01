# Global State Refactor

## Description

Refactor global singletons and side effects (TraceListener for notifications, activityTracker with localStorage, DebugConsoleController intercepting console globally). Scope state to components using context providers or component-level state management. Eliminate side-effectful constructors and implicit state sharing.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Inventory

- [x] Identify all global singletons and side effects in the codebase
- [ ] Document TraceListener, activityTracker, and DebugConsoleController usage
- [ ] Analyze localStorage dependencies and data flow
- [ ] Design component-scoped alternatives for each global
- [ ] Create context provider patterns for shared state
- [ ] Update architecture-guidance skill with state management patterns
- [ ] Manual review of refactoring approach

**Discovery Findings:**

- **Global singletons identified:**
  - `notifications` (TraceListener instance) exported from `client/app.ts` (line 54)
  - `activityTracker` functions in `client/shared/activityTracker.ts` using localStorage
  - `DebugConsoleController` instantiated in `client/app.ts` (line 64) and added to notifications

- **localStorage usage patterns:**
  - `activityTracker.ts`: Stores last activity timestamp (`dwp-hours:lastActivityTimestamp`)
  - `auth-service.ts`: Stores current user session (`currentUser`)
  - `pto-pto-card/index.ts`: Stores selected month (`PtoPtoCard.STORAGE_KEY`)
  - `pto-entry-form/index.ts`: Stores selected month (`SELECTED_MONTH_STORAGE_KEY`)
  - Multiple components access localStorage directly without abstraction

- **Side effects in constructors:**
  - `TraceListener` instantiated globally in app.ts
  - `DebugConsoleController` instantiated and registered globally
  - No explicit side effects found in component constructors, but global registration happens in App.run()

- **Impact:** 3 major global systems with localStorage dependencies, used across 10+ files

### Phase 2: Context Provider Infrastructure

- [ ] Implement context providers for notifications, activity tracking, and debug state
- [ ] Create React-like context API for vanilla web components
- [ ] Add context consumer patterns for component integration
- [ ] Implement scoped storage abstractions
- [ ] Test context provider lifecycle management
- [ ] Build passes, lint passes

### Phase 3: Notification System Refactor

- [ ] Replace TraceListener global with context-based notification system
- [ ] Update notification components to use injected context
- [ ] Implement prefers-reduced-motion handling at component level
- [ ] Remove global notification side effects
- [ ] Test notification delivery and display
- [ ] Manual testing of notification features

### Phase 4: Activity Tracking Refactor

- [ ] Replace activityTracker global with component-scoped tracking
- [ ] Implement localStorage abstraction with context providers
- [ ] Update components using activity tracking
- [ ] Remove implicit state sharing through globals
- [ ] Test activity persistence and retrieval
- [ ] Build passes, lint passes

### Phase 5: Debug System Refactor

- [ ] Replace DebugConsoleController global interception with scoped debugging
- [ ] Implement debug context provider for ?debug=1 functionality
- [ ] Update debug-enabled components to use context
- [ ] Remove global console interception
- [ ] Test debug features in development mode
- [ ] Code review and security audit
- [ ] Documentation updates
- [ ] Build passes, lint passes, all tests pass

## Implementation Notes

- **Context Providers**: Implement lightweight context system for web components
- **Scoped State**: Keep state within component trees, not global scope
- **Storage Abstraction**: Create interfaces for localStorage with testability
- **Side Effect Elimination**: Move initialization logic out of constructors
- **Backwards Compatibility**: Maintain existing functionality during transition
- **Performance**: Ensure context providers don't cause unnecessary re-renders

## Questions and Concerns

1. How to implement context providers in vanilla web components without frameworks?
2. Should we create a custom context API or use a lightweight library?
3. How to handle cross-component communication without globals?
4. What migration strategy for existing global-dependent code?
5. How to test context-based state management reliably?

## Design Decisions

Decisions recorded from review of community-standard Context Protocol patterns:

### Q1 — Context providers in vanilla web components

**Decision: Custom Context Protocol implementation (~50 LOC), provider as HTMLElement.**

Use the Context Protocol pattern (community standard adopted by Lit, wc-context, etc.) with one critical correction: the provider must extend `HTMLElement` (not bare `EventTarget`) so that `bubbles: true, composed: true` events dispatched by consumers actually reach the provider through DOM propagation.

Implementation sketch (will live in `client/shared/context.ts`):

```ts
const CONTEXT_REQUEST = "context-request";

type ContextCallback<T> = (value: T | undefined, dispose?: () => void) => void;

// Provider — must be an HTMLElement in the DOM tree for event bubbling
export class ContextProvider<T> extends HTMLElement {
  #value: T | undefined;
  #consumers = new Set<ContextCallback<T>>();

  constructor(initial?: T) {
    super();
    this.#value = initial;
    this.addEventListener(CONTEXT_REQUEST, ((e: Event) => {
      const ev = e as CustomEvent<{ callback: ContextCallback<T> }>;
      if (ev.detail?.callback) {
        const cb = ev.detail.callback;
        this.#consumers.add(cb);
        cb(this.#value);
        ev.stopPropagation();
      }
    }) as EventListener);
  }

  set value(v: T | undefined) {
    this.#value = v;
    this.#consumers.forEach((cb) => cb(v));
  }

  get value() {
    return this.#value;
  }
}

// Consumer — call from connectedCallback
export function consumeContext<T>(
  element: Element,
  callback: ContextCallback<T>,
) {
  element.dispatchEvent(
    new CustomEvent(CONTEXT_REQUEST, {
      bubbles: true,
      composed: true,
      detail: { callback },
    }),
  );
}
```

**⚠ Additional concern (6):** `consumeContext` in `connectedCallback` has ordering risks — if the provider element hasn't connected to the DOM yet when the consumer fires, the event will miss it. Mitigation: use a microtask delay (`queueMicrotask`) or ensure providers are registered before child components via synchronous DOM insertion order.

### Q2 — Custom API vs library

**Decision: Custom minimal implementation. 0 dependencies, < 1 KB minified, full lifecycle control.**

No need for `@lit/context` or similar — this project is vanilla TS with no framework dependencies.

### Q3 — Cross-component communication without globals

**Decision: Layered approach, ranked by preference:**

1. **Context protocol** — for tree-scoped shared services (notifications, debug flag)
2. **Custom events** — for fire-and-forget signals (user activity ping, nav events) — already used for `auth-state-changed`, `page-change`
3. **Storage abstraction** — for persistence concerns (activity timestamp, selected month)
4. **Constructor injection** — for services with behavior (APIClient already follows this in UIManager)

**Note:** `activityTracker` is just two pure functions + localStorage — context protocol is overkill for it. A `StorageService` interface injected into the functions (or into UIManager) is sufficient.

### Q4 — Migration strategy

**Decision: Incremental, one system at a time. No kill-switch or dual-support shim.**

Order:

1. **Storage abstraction first** (Phase 2) — `StorageService` interface + `LocalStorageAdapter`. Refactor all direct `localStorage.getItem/setItem` calls (10 call sites across 5 files). Unlocks test fakes immediately.
2. **Context providers at root** (Phase 2) — register in `App.run()` wrapping `<notification-context>` and `<debug-context>` around the app shell.
3. **Notifications** (Phase 3) — highest visibility, 7 consumer files importing `notifications` from `app.ts`.
4. **Activity tracking** (Phase 4) — touches localStorage, uses new StorageService.
5. **Debug system** (Phase 5) — lowest user impact.

Kill-switch and dual-support period are skipped — this is a small internal app where a clean cutover with good test coverage is simpler than maintaining backward compatibility shims.

### Q5 — Testing context-based state

**Decision: Fake providers + storage interface mocks.**

- **Unit tests:** Mount component with a fake `ContextProvider` wrapping it, assert behavior against injected fakes.
- **Storage tests:** `StorageService` interface allows in-memory fake — no localStorage dependency in tests.
- **Integration:** Render full subtree with real providers, simulate events, assert DOM output.
- **Existing tests:** `tests/activityTracker.test.ts` already exists — will be updated to use StorageService fake instead of mocking localStorage directly.

### Additional Concerns

6. Provider-consumer connection ordering: `consumeContext` dispatched before provider is in the DOM will silently fail. Must ensure DOM insertion order or use microtask retry.
7. `notifications` is a service (event fan-out), not reactive state — context provides the service object, not a value. This works but is a conceptual mismatch worth documenting for future maintainers.
8. Architecture doc update: Add a "State Management" section to ARCHITECTURE.md: "context > events > props > never globals".</content>

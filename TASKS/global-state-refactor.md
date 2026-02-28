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
5. How to test context-based state management reliably?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/global-state-refactor.md

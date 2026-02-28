# Event Delegation Refactor

## Description

Refactor BaseComponent's centralized event delegation that handles all clicks/submits/keydowns, which creates "event soup" in large components. Replace with targeted listeners and custom events for better modularity and maintainability.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Design

- [x] Analyze current BaseComponent event delegation patterns
- [ ] Identify components suffering from "event soup"
- [ ] Document event handling responsibilities and complexity
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

1. How to balance targeted listeners vs beneficial delegation for dynamic content?
2. Should we implement a custom event bus or stick to DOM events?
3. How to handle event cleanup in complex component hierarchies?
4. What patterns for cross-component communication without tight coupling?
5. How to test event-driven interactions reliably?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/event-delegation-refactor.md

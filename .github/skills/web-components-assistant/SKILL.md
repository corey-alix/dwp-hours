---
name: web-components-assistant
description: Specialized assistant for implementing and maintaining web components in the DWP Hours Tracker frontend
category: implementation
version: 1.0
---

# Web Components Assistant

## Description

Specialized assistant for implementing and maintaining web components in the DWP Hours Tracker frontend. Provides guidance on creating reusable, encapsulated UI components using modern web standards, following MDN Web Components best practices.

## Trigger

Activate when users need to:

- Create new custom elements or web components
- Implement Shadow DOM encapsulation
- Handle component lifecycle methods
- Manage component styling and theming
- Work with custom element APIs
- Convert existing UI elements to web components
- Implement component communication patterns
- **Prevent memory leaks from event listeners**
- **Create base component classes for consistency**
- **Migrate components to use BaseComponent**

## Response Pattern

Follow this structured approach when implementing web components:

1. **Component Analysis**: Assess the component's purpose, props, state, and integration needs
2. **CRITICAL: Static Imports Only** - Never use `await import()` or dynamic imports. All imports must be static at the top level. The build system uses esbuild to create a single `app.js` bundle loaded by test.html pages.
3. **CRITICAL: Declarative Markup Priority** - Always prefer declarative template strings returned from `render()` over imperative DOM construction (manual `innerHTML` assignment, `createElement`, `appendChild`, IIFEs inside template literals). The `render()` method should read like a description of what the component displays. Extract complex conditional sections into small helper methods that return partial template strings, keeping `render()` itself a clear, top-level declaration of the component's structure.
4. **CRITICAL: Named Slots Over Component Embedding** - Never create child web components inside a parent's shadow DOM template string. Instead, use `<slot name="...">` in the parent's template and let the consumer compose children in light DOM. This keeps components loosely coupled, independently testable, and composable. The parent declares _where_ children go; the consumer decides _which_ children to provide.
5. **Base Class Selection**: Extend BaseComponent for memory-safe, consistent components
6. **Custom Element Definition**: Create class extending BaseComponent with proper naming conventions
7. **Shadow DOM Setup**: Automatic shadow root creation via BaseComponent
8. **Lifecycle Methods**: Override connectedCallback, disconnectedCallback as needed (BaseComponent handles cleanup)
9. **Template & Styling**: Define component template and styles following MDN best practices
10. **Property & Attribute Handling**: Set up observedAttributes and property getters/setters
11. **Event Handling**: Use event delegation via handleDelegatedClick/handleDelegatedSubmit methods
12. **Data Flow Architecture**: Use event-driven data flow - components dispatch events for data requests, parent handles API calls and data injection via methods like setPtoData()
13. **Memory Management**: BaseComponent automatically handles event listener cleanup
14. **Unit Testing**: Create Vitest tests with happy-dom using seedData for mocking
15. **Integration Testing**: Test component in the DWP Hours Tracker context with Playwright E2E tests
16. **Documentation**: Update component usage documentation

## Component Testing Pattern

When creating web components, follow this testing structure:

### Test Files Structure

```
client/components/[component-name]/
├── index.ts          # Component implementation
├── test.html         # Manual testing page
├── test.ts           # Automated test playground
└── [component-name].test.ts  # Vitest unit tests (in tests/components/)

tests/components/
└── [component-name].test.ts  # Vitest unit tests with happy-dom
```

### Vitest Unit Tests

Create comprehensive unit tests using Vitest with happy-dom environment:

- **Mock API Responses**: Use `shared/seedData.ts` to provide realistic test data without network calls
- **Component Isolation**: Test component logic, rendering, and event handling in isolation
- **Data Injection Pattern**: Use component methods (like `setPtoData()`) to inject mock data
- **DOM Testing**: Verify rendered output, CSS classes, and element interactions
- **Event Testing**: Assert that components dispatch correct custom events with proper detail objects
- **Never call `render()` directly**: `render()` is a pure template method that returns a string — calling it directly is a no-op for BaseComponent subclasses. Use `requestUpdate()` to trigger re-renders, or use data injection methods (like `setData()`) which call `requestUpdate()` internally

Example Vitest test structure:

```typescript
// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import { ComponentName } from "../../client/components/[component-name]/index.js";
import { seedDataType } from "../../shared/seedData.js";

describe("ComponentName Component", () => {
  it("should render correctly with mock data", () => {
    const component = new ComponentName();
    component.setData(mockDataFromSeed);
    // Assert DOM structure and content
  });
});
```

**Mocking with Seed Data**: Always use `shared/seedData.ts` for realistic test data. Transform seed data into component-specific formats using data injection methods rather than simulating API calls.

### Playwright E2E Tests

Create end-to-end tests using Playwright for integration testing:

- **Real API Usage**: Tests run against the actual application with real API calls (data provided by parent components)
- **Screenshot Testing**: Capture component states in various UI configurations
- **Full Integration**: Test components within the complete application context
- **User Interactions**: Verify click handlers, form submissions, and navigation
- **Visual Regression**: Ensure UI consistency across browser updates

Since components use event-driven architecture and don't make direct API calls, Playwright tests focus on:

- Component rendering in different parent contexts (like admin-panel test page)
- Event emission and handling by parent components
- Visual appearance and responsive behavior
- Integration with other UI elements

Example Playwright test:

```typescript
test("component displays correctly in admin panel", async ({ page }) => {
  // Navigate to test page with real data
  await page.goto("/components/admin-panel/test.html");
  // Take screenshots of different states
  await expect(page.locator("component-name")).toHaveScreenshot();
});
```

### test.html Pattern

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Component Name Test</title>
    <link rel="stylesheet" href="../../styles.css" />
  </head>
  <body>
    <h1>Component Name Test</h1>
    <div
      id="test-output"
      style="display: block; padding: 10px; border: 1px solid var(--color-border); margin: 10px 0; background: var(--color-surface); color: var(--color-text);"
    ></div>

    <component-name id="component-id"></component-name>
    <debug-console></debug-console>

    <script type="module">
      import { componentPlayground } from "/app.js";
      componentPlayground();
    </script>
  </body>
</html>
```

**Design Constraints**:

- **CRITICAL: Static Imports Only** - `await import()` is strictly forbidden. All imports must be static at the top level of files. The project uses esbuild to create a single `app.js` artifact loaded by `test.html` pages. Dynamic imports break the build system and will cause runtime errors.
- HTML test files must import `/app.js` to ensure all components are loaded and registered
- HTML test files should import and call the `playground` function from the corresponding `test.ts` file when complex test scenarios are needed
- For simple component display testing, HTML test files may directly import and instantiate components in the script tag
- HTML test files must NOT contain inline attributes on web components (use script for configuration)
- HTML test files must NOT contain test logic or code beyond minimal imports and component instantiation
- All complex data configuration, test scenarios, and component manipulation should be in the corresponding test.ts file
- This ensures clean separation of concerns while allowing flexibility for simple component testing
- **No extra logic goes into test.html pages** - keep them simple with just component tags and minimal script for playground functions
- **Debug console can be included directly in markup** - add `<debug-console></debug-console>` to the HTML for debugging output during manual testing

**Note on Playground Functions**: The `componentPlayground` function imported from `/app.js` is an alias defined in `client/components/test.ts`. Each component's `test.ts` file exports a `playground` function that is imported and re-exported with a component-specific name (e.g., `ptoCalendar`, `employeeList`) in the main test.ts file. This allows the test.html to call the appropriate playground function for interactive testing.

### test.ts Pattern

```typescript
import { querySingle } from "../test-utils.js";

export function playground() {
  console.log("Starting component playground test...");

  const component = querySingle<ComponentType>("component-name");

  // Test component functionality
  component.addEventListener("custom-event", (e: CustomEvent) => {
    console.log("Event received:", e.detail);
    querySingle("#test-output").textContent =
      `Event: ${JSON.stringify(e.detail)}`;
  });

  // Additional test scenarios...
  console.log("Component playground test initialized");
}
```

### Integration Steps

1. Add component export to `client/components/index.ts`
2. Add playground import/export to `client/components/test.ts`
3. Create test.html following the pattern above
4. Create test.ts with component-specific test logic
5. Create Vitest unit tests in `tests/components/[component-name].test.ts`
6. Add E2E test in `e2e/component-[name].spec.ts`
7. Update component exports in main test.ts file

## Data Flow Patterns

### Event-Driven Data Flow

Components should not make direct API calls. Instead, use event-driven architecture:

```typescript
// In component: dispatch event for data request
this.dispatchEvent(
  new CustomEvent("pto-data-request", {
    bubbles: true,
    detail: { employeeId: this.employeeId },
  }),
);

// In parent app: listen for event and handle data fetching
addEventListener("pto-data-request", (e: CustomEvent) => {
  this.handlePtoDataRequest(e.detail);
});

// Parent injects data via component method
component.setPtoData(fetchedData);
```

This pattern maintains separation of concerns and makes components more testable.

### Component Communication Patterns

- **Parent-to-Child**: Use attributes and properties for configuration, method calls for data injection
- **Child-to-Parent**: Use custom events with detail objects for data requests and state changes
- **Sibling Communication**: Route through parent component using event bubbling

### Composition via Named Slots (Preferred)

Components must **never embed other web components by tag name inside their shadow DOM template**. Instead, declare named `<slot>` elements and let consumers compose children in light DOM:

```typescript
// CORRECT: Parent declares a slot
protected render(): string {
  return `
    <style>/* ... */</style>
    <div class="card">
      <h4>Monthly Accrual</h4>
      <div class="grid"><!-- grid rows --></div>
      <slot name="calendar"></slot>  <!-- ✅ Consumer provides the calendar -->
    </div>
  `;
}

// Consumer composes in light DOM:
// <pto-accrual-card>
//   <pto-calendar slot="calendar" month="3" year="2026"></pto-calendar>
// </pto-accrual-card>

// WRONG: Embedding child component in shadow DOM template
protected render(): string {
  return `
    <div class="card">
      <pto-calendar month="3" year="2026"></pto-calendar>  <!-- ❌ Tight coupling -->
    </div>
  `;
}
```

This pattern keeps components independently testable and avoids tight coupling between parent and child shadow DOMs.

## Reactive Update Cycle (Lit-Aligned)

BaseComponent follows the [Lit reactive update cycle](https://lit.dev/docs/components/lifecycle/#reactive-update-cycle). Understanding this lifecycle is **mandatory** — violating it causes subtle bugs (silent no-ops, duplicate listeners, stale DOM).

### The Update Cycle

```
Property change or requestUpdate()
        │
        ▼
    update()          ← Called by the framework. Do NOT call directly.
        │
        ├─ render()   ← Pure template function. Returns a string. No side effects.
        │
        ▼
  renderTemplate()    ← Applies the string to shadowRoot.innerHTML.
        │
        ├─ cleanupEventListeners()
        ├─ shadowRoot.innerHTML = template
        └─ setupEventDelegation()
```

### `render()` Contract

**`render()` is a pure template method.** It conforms to the Lit specification:

| Rule                       | Detail                                                                      |
| -------------------------- | --------------------------------------------------------------------------- |
| **Returns**                | An HTML template string                                                     |
| **Side effects**           | None. Must not modify DOM, dispatch events, or call external APIs           |
| **Called by**              | `update()` only — never by application code, test code, or other components |
| **Calling it directly**    | Returns the string but does NOT apply it to the DOM — a silent no-op        |
| **To trigger a re-render** | Call `requestUpdate()` — this is the ONLY correct way                       |

```typescript
// CORRECT: render() returns a template string, requestUpdate() triggers the cycle
protected render(): string {
  return `<div>${this._data}</div>`;
}

setData(data: string) {
  this._data = data;
  this.requestUpdate();  // ✅ Triggers: update() → render() → renderTemplate()
}

// WRONG: Calling render() directly — return value is discarded, DOM unchanged
component.render();           // ❌ No-op
el.render();                  // ❌ No-op in evaluate() blocks
form.render();                // ❌ No-op
this.render();                // ❌ No-op (inside component methods — use requestUpdate())
```

### Lifecycle Methods

Following Lit conventions:

| Method                    | Purpose                                  | Call super?                       | Override?                          |
| ------------------------- | ---------------------------------------- | --------------------------------- | ---------------------------------- |
| `constructor()`           | Initialize state, attach shadow root     | Yes (automatic via BaseComponent) | Rarely                             |
| `connectedCallback()`     | Start tasks, set up external listeners   | Yes                               | When needed                        |
| `disconnectedCallback()`  | Clean up external listeners              | Yes                               | When needed                        |
| `render()`                | Return template string                   | No                                | **Always** (abstract)              |
| `requestUpdate()`         | Schedule a re-render                     | No (just call it)                 | Never                              |
| `update()`                | Orchestrate render cycle                 | —                                 | Never                              |
| `setupEventDelegation()`  | Register event listeners on shadowRoot   | Yes                               | When adding custom event listeners |
| `handleDelegatedClick()`  | Handle click events via delegation       | —                                 | When needed                        |
| `handleDelegatedSubmit()` | Handle form submit events via delegation | —                                 | When needed                        |

### `setupEventDelegation()` Contract

Listeners on `shadowRoot` survive `innerHTML` replacement (they're on the root node, not child elements). Therefore:

- `BaseComponent` guards with `isEventDelegationSetup` to prevent duplicates from its own listeners
- **Subclass overrides MUST add their own guard** (e.g., `_customEventsSetup`) to prevent listener accumulation across re-renders
- Without this guard, every `requestUpdate()` adds duplicate listeners → handler called N times per event

```typescript
private _customEventsSetup = false;

protected setupEventDelegation() {
  super.setupEventDelegation();
  if (this._customEventsSetup) return;  // ← REQUIRED guard
  this._customEventsSetup = true;

  this.shadowRoot.addEventListener("my-event", (e) => {
    e.stopPropagation();
    this.handleCustomEvent(e as CustomEvent);
  });
}
```

See the [Happy DOM skill](../happy-dom/SKILL.md) for the confirmed listener accumulation bug this pattern prevents.

## Base Component Architecture

For consistency and memory leak prevention, all web components should extend the `BaseComponent` class located in `client/components/base-component.ts`.

### BaseComponent Features

- **Automatic Shadow DOM**: Creates shadow root in constructor
- **Event Delegation**: Centralized event handling to prevent memory leaks
- **Reactive Updates**: `requestUpdate()` method for triggering re-renders (the only correct way to update the DOM)
- **Memory Management**: Automatic cleanup of event listeners in `disconnectedCallback`
- **Lifecycle Safety**: Proper connection state tracking

### Component Implementation Pattern

```typescript
import { BaseComponent } from "../base-component.js";

export class MyComponent extends BaseComponent {
  private _data: MyData[] = [];

  // render() is a PURE TEMPLATE METHOD — returns string, no side effects.
  // Prefer flat, declarative markup. Extract conditionals into helper methods
  // that return partial template strings rather than embedding IIFEs or deep
  // ternary chains.
  protected render(): string {
    return `
      <style>
        /* Component styles */
      </style>
      <div class="my-component">
        ${this.renderItems()}
      </div>
    `;
  }

  // Helper: returns a declarative template fragment
  private renderItems(): string {
    if (!this._data.length) return `<div class="empty">No items</div>`;
    return this._data.map((item) => `<div>${item.name}</div>`).join("");
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.matches(".action-btn")) {
      this.handleAction();
    }
  }

  // Public data injection method — calls requestUpdate(), never render()
  setData(data: MyData[]) {
    this._data = data;
    this.requestUpdate(); // ✅ Triggers the full update cycle
  }
}
```

### Memory Leak Prevention

**Problem**: Components that replace `innerHTML` without cleaning up event listeners cause memory leaks.

**Solution**: BaseComponent uses event delegation and automatic cleanup:

- Event listeners attached to shadow root (persistent)
- `cleanupEventListeners()` called before re-renders
- `disconnectedCallback()` ensures cleanup on removal
- No orphaned listeners from dynamic DOM replacement

### Migration from HTMLElement

Many existing components extend `HTMLElement` directly and define `render()` as a method that sets `innerHTML`. When migrating:

1. Change `extends HTMLElement` to `extends BaseComponent`
2. Remove manual `attachShadow()` calls
3. **Change `render()` to return a string** instead of setting `this.shadowRoot.innerHTML` directly
4. **Replace all `this.render()` calls with `this.requestUpdate()`** — this is the most critical step
5. Implement `handleDelegatedClick()` and `handleDelegatedSubmit()` for events
6. Remove manual event listener setup/cleanup code
7. Add `_customEventsSetup` guard if overriding `setupEventDelegation()`

**Unmigrated components** (extending `HTMLElement` with imperative `render()`): `employee-list`, `pto-calendar`, `pto-request-queue`, `data-table`, `confirmation-dialog`, `prior-year-review`, `pto-entry-form`, `report-generator`, `pto-card-base` and all card subclasses. These call `this.render()` directly, which works because their `render()` imperatively sets `innerHTML`. **They will break if migrated to BaseComponent without replacing `this.render()` → `this.requestUpdate()`.**

## Examples

Common queries that should trigger this skill:

- "Create a web component for the PTO calendar"
- "How do I implement Shadow DOM for the employee list?"
- "Convert this HTML template to a web component"
- "Add custom events to the admin panel component"
- "Implement lifecycle methods for the hours tracker widget"
- "Style encapsulation for the PTO status component"
- "**Prevent memory leaks in web components**"
- "**Migrate component to BaseComponent**"
- "**Fix event listener memory leaks**"

## Additional Context

- **Project Integration**: Components should integrate with the existing TypeScript build system and follow project naming conventions
- **Browser Support**: Ensure compatibility with the project's target browsers
- **Performance**: Follow MDN performance guidelines for web components
- **Memory Management**: All components must extend BaseComponent to prevent memory leaks from event listeners
- **Consistency**: Use BaseComponent's event delegation and reactive update patterns for all components. Follow the [Lit reactive update cycle](https://lit.dev/docs/components/lifecycle/) — `render()` is a pure template method; `requestUpdate()` is the only way to trigger DOM updates
- **Declarative First**: Always prefer declarative template strings over imperative DOM construction. `render()` should read as a flat, top-level description of what the component displays. Complex sections should be extracted into helper methods returning template fragments — never use IIFEs, deeply nested ternaries, or manual `innerHTML` assignment in component logic.
- **Composition Over Embedding**: Never embed child web components by tag name inside a parent's shadow DOM template string. Use named `<slot>` elements so consumers compose children in light DOM. This ensures loose coupling and independent testability.
- **Flat Inheritance**: Prefer extending `BaseComponent` directly over deep inheritance chains. Share behavior via exported utility functions and CSS constants in TypeScript files rather than intermediate base classes.
- **Accessibility**: Implement ARIA attributes and keyboard navigation as per MDN accessibility guidelines
- **Testing**: Components should have both Vitest unit tests (with seedData mocking) and Playwright E2E tests (with screenshot testing)
- **Dependencies**: Avoid external component libraries; use native web components with BaseComponent for better performance and smaller bundle size
- **Related Skills**: Works with `task-implementation-assistant` for admin panel tasks, `code-review-qa` for component quality checks</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/web-components-assistant/SKILL.md

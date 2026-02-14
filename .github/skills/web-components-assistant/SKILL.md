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
2. **Base Class Selection**: Extend BaseComponent for memory-safe, consistent components
3. **Custom Element Definition**: Create class extending BaseComponent with proper naming conventions
4. **Shadow DOM Setup**: Automatic shadow root creation via BaseComponent
5. **Lifecycle Methods**: Override connectedCallback, disconnectedCallback as needed (BaseComponent handles cleanup)
6. **Template & Styling**: Define component template and styles following MDN best practices
7. **Property & Attribute Handling**: Set up observedAttributes and property getters/setters
8. **Event Handling**: Use event delegation via handleDelegatedClick/handleDelegatedSubmit methods
9. **Data Flow Architecture**: Use event-driven data flow - components dispatch events for data requests, parent handles API calls and data injection via methods like setPtoData()
10. **Memory Management**: BaseComponent automatically handles event listener cleanup
11. **Unit Testing**: Create Vitest tests with happy-dom using seedData for mocking
12. **Integration Testing**: Test component in the DWP Hours Tracker context with Playwright E2E tests
13. **Documentation**: Update component usage documentation

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

    <script type="module">
      import { employeeList } from "/app.js";
      employeeList();
    </script>
  </body>
</html>
```

**Design Constraints**:

- HTML test files must import `/app.js` to ensure all components are loaded and registered
- HTML test files must import and call the `playground` function from the corresponding `test.ts` file
- HTML test files must NOT contain inline attributes on web components
- HTML test files must NOT contain test logic or code beyond the minimal imports and function call
- All data configuration, test scenarios, and component manipulation must be in the corresponding test.ts file
- This ensures clean separation of concerns and consistent testing patterns

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

## Base Component Architecture

For consistency and memory leak prevention, all web components should extend the `BaseComponent` class located in `client/components/base-component.ts`. This LitElement-inspired base class provides:

### BaseComponent Features

- **Automatic Shadow DOM**: Creates shadow root in constructor
- **Event Delegation**: Centralized event handling to prevent memory leaks
- **Reactive Updates**: `requestUpdate()` method for triggering re-renders
- **Memory Management**: Automatic cleanup of event listeners in `disconnectedCallback`
- **Lifecycle Safety**: Proper connection state tracking

### Component Implementation Pattern

```typescript
import { BaseComponent } from "../base-component.js";

export class MyComponent extends BaseComponent {
  private _data: MyData[] = [];

  protected render(): string {
    return `
      <style>
        /* Component styles */
      </style>
      <div class="my-component">
        ${this._data.map((item) => `<div>${item.name}</div>`).join("")}
      </div>
    `;
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.matches(".action-btn")) {
      this.handleAction();
    }
  }

  setData(data: MyData[]) {
    this._data = data;
    this.requestUpdate();
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

When updating existing components:

1. Change `extends HTMLElement` to `extends BaseComponent`
2. Remove manual `attachShadow()` calls
3. Replace `render()` method to return string instead of setting `innerHTML`
4. Implement `handleDelegatedClick()` and `handleDelegatedSubmit()` for events
5. Use `requestUpdate()` instead of manual render calls
6. Remove manual event listener setup/cleanup code

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
- **Consistency**: Use BaseComponent's event delegation and reactive update patterns for all components
- **Accessibility**: Implement ARIA attributes and keyboard navigation as per MDN accessibility guidelines
- **Testing**: Components should have both Vitest unit tests (with seedData mocking) and Playwright E2E tests (with screenshot testing)
- **Dependencies**: Avoid external component libraries; use native web components with BaseComponent for better performance and smaller bundle size
- **Related Skills**: Works with `task-implementation-assistant` for admin panel tasks, `code-review-qa` for component quality checks</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/web-components-assistant/SKILL.md

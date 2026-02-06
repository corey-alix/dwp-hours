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

## Response Pattern
Follow this structured approach when implementing web components:

1. **Component Analysis**: Assess the component's purpose, props, state, and integration needs
2. **Custom Element Definition**: Create class extending HTMLElement with proper naming conventions
3. **Shadow DOM Setup**: Implement Shadow DOM for style encapsulation when appropriate
4. **Lifecycle Methods**: Implement connectedCallback, disconnectedCallback, and attributeChangedCallback as needed
5. **Template & Styling**: Define component template and styles following MDN best practices
6. **Property & Attribute Handling**: Set up observedAttributes and property getters/setters
7. **Event Handling**: Implement custom events for component communication
8. **Integration Testing**: Test component in the DWP Hours Tracker context
9. **Documentation**: Update component usage documentation

## Component Testing Pattern

When creating web components, follow this testing structure:

### Test Files Structure
```
client/components/[component-name]/
├── index.ts          # Component implementation
├── test.html         # Manual testing page
└── test.ts           # Automated test playground
```

### test.html Pattern
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Name Test</title>
    <link rel="stylesheet" href="../../styles.css" />
</head>
<body>
    <h1>Component Name Test</h1>
    <div id="test-output" style="display: block; padding: 10px; border: 1px solid var(--color-border); margin: 10px 0; background: var(--color-surface); color: var(--color-text);"></div>

    <component-name id="component-id"></component-name>

    <script type="module">
        import {componentName} from "/app.js";
        componentName();
    </script>
</body>
</html>
```

### test.ts Pattern
```typescript
import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting component playground test...');
    
    const component = querySingle('component-name') as any;
    
    // Test component functionality
    component.addEventListener('custom-event', (e: CustomEvent) => {
        console.log('Event received:', e.detail);
        querySingle('#test-output').textContent = `Event: ${JSON.stringify(e.detail)}`;
    });
    
    // Additional test scenarios...
    console.log('Component playground test initialized');
}
```

### Integration Steps
1. Add component export to `client/components/index.ts`
2. Add playground import/export to `client/components/test.ts`
3. Create test.html following the pattern above
4. Create test.ts with component-specific test logic
5. Add E2E test in `e2e/component-[name].spec.ts`
6. Update component exports in main test.ts file

## Examples
Common queries that should trigger this skill:
- "Create a web component for the PTO calendar"
- "How do I implement Shadow DOM for the employee list?"
- "Convert this HTML template to a web component"
- "Add custom events to the admin panel component"
- "Implement lifecycle methods for the hours tracker widget"
- "Style encapsulation for the PTO status component"

## Additional Context
- **Project Integration**: Components should integrate with the existing TypeScript build system and follow project naming conventions
- **Browser Support**: Ensure compatibility with the project's target browsers
- **Performance**: Follow MDN performance guidelines for web components
- **Accessibility**: Implement ARIA attributes and keyboard navigation as per MDN accessibility guidelines
- **Testing**: Components should be testable with the existing Playwright E2E setup
- **Dependencies**: Avoid external component libraries; use native web components for better performance and smaller bundle size
- **Related Skills**: Works with `task-implementation-assistant` for admin panel tasks, `code-review-qa` for component quality checks</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/web-components-assistant/SKILL.md
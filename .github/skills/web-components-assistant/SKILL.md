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
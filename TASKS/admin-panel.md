# Admin Panel Implementation

## Overview
Implement the admin panel functionality using web components architecture following MDN best practices. Create reusable, encapsulated UI components that are API-agnostic for easy testing with Playwright.

## Architecture Approach
- **Web Components**: Use native web components with Shadow DOM for encapsulation
- **API Agnostic**: Components should accept data via properties/events, not direct API calls
- **Testing**: Playwright-based component tests (Vitest doesn't run in browser)
- **Composition**: Build complex UIs by composing smaller web components

## Checklist

### Core Web Components
- [ ] Create base `admin-panel` component with navigation and layout
- [ ] Implement `employee-list` web component with search/filter
- [ ] Create `employee-form` component for add/edit operations
- [ ] Build `pto-request-queue` component for admin review
- [ ] Implement `data-table` component with sorting/pagination
- [ ] Create `confirmation-dialog` component for destructive actions

### Employee Management Components
- [ ] `employee-list` - Display employees with search/filter capabilities
- [ ] `employee-card` - Individual employee display component
- [ ] `employee-form` - Reusable form for create/edit operations
- [ ] `bulk-actions` - Multi-select operations for employee management
- [ ] `role-selector` - Dropdown for role assignment (Employee/Admin)

### PTO Review Components
- [ ] `pto-request-item` - Individual PTO request display
- [ ] `pto-request-queue` - List of pending requests with approve/reject
- [ ] `pto-history` - Request history and status tracking
- [ ] `notification-banner` - Status messages for admin actions

### Reporting Components
- [ ] `report-generator` - Monthly/yearly PTO usage reports
- [ ] `data-exporter` - CSV/PDF export functionality
- [ ] `chart-visualization` - PTO balance summaries with charts
- [ ] `report-filters` - Date range and employee filters

### Component Communication
- [ ] Implement custom events for component communication
- [ ] Create data flow patterns (properties down, events up)
- [ ] Add component state management
- [ ] Implement event bubbling for complex interactions

### Playwright Component Testing
- [ ] Set up Playwright component testing configuration
- [ ] Create test harness for isolated component testing
- [ ] Write tests for `employee-list` component interactions
- [ ] Test `employee-form` validation and submission
- [ ] Verify `pto-request-queue` approve/reject functionality
- [ ] Test `data-table` sorting and pagination
- [ ] Validate component accessibility (ARIA, keyboard navigation)
- [ ] Test component composition and event handling

### Admin Security Components
- [ ] `role-guard` - Component wrapper for role-based access
- [ ] `audit-log` - Display admin action history
- [ ] `permission-manager` - Role and permission assignment
- [ ] `admin-auth` - Admin-specific authentication flow

### UI/UX Enhancements
- [ ] Implement responsive design patterns
- [ ] Add loading states and error handling components
- [ ] Create consistent theming system
- [ ] Implement keyboard navigation and focus management
- [ ] Add ARIA labels and screen reader support

### Integration & Testing
- [ ] Connect components to API layer via event handlers
- [ ] Implement error boundaries and fallback UI
- [ ] Add component performance monitoring
- [ ] Create component documentation and usage examples
- [ ] Validate component compatibility across browsers

## Implementation Guidelines

### Component File Structure
- Components go under `./client/components`
- There is a folder for each component
- In the component folder:
  - The component itself is `index.ts`
  - A `test.html` page loads the component in a simple page that loads `app.js`
  - A `test.ts` page export a `playground()` method that renders the component and does some basic testing and logging
  - All `test.ts` share some utilities, such as the methods, one of them is listed below (`querySingle`)

```typescript
export function querySingle<T extends HTMLElement>(selector: string) {
    const item = document.querySelector<T>(selector);
    if (item) {
        console.log(`Found ${selector} element:`, item);
    } else {
        console.error(`${selector} element not found`);
        throw new Error(`${selector} element not found`);
    }
    return item;
}
```

- A master `index.ts` under `./client/components` re-exports all components, so `app.ts` only needs to import `./client/components/index.js`
- A separate `test.ts` under `./client/components` exports the `playground()` functions for each component and is also imported by `app.ts` so the playground methods are in the build artifact, accessible to the various `test.html` pages.

### Web Component Best Practices
Follow the web-components-assistant skill pattern:
1. **Component Analysis**: Define props, events, and data flow for each component
2. **Custom Element Definition**: Use kebab-case naming (e.g., `employee-list`)
3. **Shadow DOM Setup**: Implement encapsulation for styling isolation
4. **Lifecycle Methods**: Use connectedCallback for initialization, attributeChangedCallback for reactive updates
5. **Template & Styling**: Define templates and styles following MDN guidelines
6. **Property Handling**: Use getters/setters for reactive properties
7. **Event Handling**: Dispatch custom events for parent communication
8. **Testing**: Isolate components for Playwright testing
9. **Documentation**: Document component APIs and usage

### Playwright Component Testing Setup
Following playwright-testing-assistant guidelines:
- Create component test harness for isolated testing
- Use descriptive test names and proper assertions
- Test component interactions, events, and state changes
- Validate accessibility and keyboard navigation
- Ensure tests are reliable and not flaky
- Integrate with CI/CD pipeline for automated testing

### Component Architecture Patterns
- **Data Flow**: Properties down (parent to child), events up (child to parent)
- **State Management**: Local component state with reactive updates
- **Composition**: Build complex UIs from smaller, focused components
- **API Integration**: Components emit events, parent handles API calls
- **Error Handling**: Graceful degradation with error boundaries</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/admin-panel.md
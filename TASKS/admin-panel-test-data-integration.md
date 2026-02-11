# Admin Panel Test Data Integration

## Description

Integrate seed data from seedData.ts into the admin panel test page to provide realistic test data for development and testing purposes. The seed data should be loaded in test.ts (the test harness) and passed to the admin-panel component via attributes or method calls, following the project's event-driven architecture where web components do not fetch data directly but receive it from parent components. Support two test modes: one with no seed data loaded (empty state) and one with the full seed data loaded.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Data Import Setup

- [x] Import seedData.ts in test.ts as an ES module
- [x] Ensure TypeScript compilation includes the seed data for client-side use
- [x] Verify that seedEmployees and seedPTOEntries are accessible in the test.ts scope
- [x] Unit tests: Add tests/components/admin-panel.test.ts for seedData import validation
- [x] Build and lint pass

### Phase 2: Component Data Integration

- [x] Update test.ts to pass seed data to admin-panel component via attributes or setData() method calls
- [x] Implement logic in test.ts to format and inject employee list and PTO entries into the admin panel
- [x] Ensure admin-panel component receives data without making API calls, following event-driven patterns
- [x] Unit tests: Add setEmployees method tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

### Phase 3: Dual Test Mode Implementation

- [x] Add functionality in test.ts to toggle between no seed data (empty state) and full seed data loaded
- [x] Implement data validation in test.ts to ensure seed data matches expected schema before injection
- [x] Add visual indicators in test.html or test.ts when using seed data vs. empty state
- [x] Unit tests: Add toggle functionality tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

### Phase 4: Documentation and Final Validation

- [x] Update test.html and test.ts with comments explaining seed data integration and the two test modes
- [x] Ensure implementation follows SKILL.md guidelines: no direct data fetching in components, data passed via attributes/methods
- [x] Run E2E tests if applicable to admin panel functionality with seed data
- [x] Unit tests: Add browser compatibility tests in e2e/ directory
- [x] Code review and final quality gates (build, lint, testing)

### Phase 5: Remove API Dependencies

- [x] Remove APIClient import and usage from index.ts
- [x] Remove all API calls (loadEmployees, handleEmployeeSubmit) from the component
- [x] Ensure component only handles UI state and dispatches events for data operations
- [x] Update event handling to dispatch events for all data-related actions
- [x] Unit tests: Add event dispatching tests in tests/components/admin-panel.test.ts
- [x] Build and lint pass

### Phase 7: Component Memory Leak Prevention

- [x] **admin-panel**: Implement event delegation pattern to prevent memory leaks from dynamic event listeners
- [ ] **confirmation-dialog**: Audit and implement proper event listener cleanup in render cycles
- [ ] **data-table**: Implement event delegation for dynamic table content and sorting interactions
- [ ] **employee-form**: Add listener cleanup in disconnectedCallback and consider event delegation for form elements
- [ ] **employee-list**: Implement event delegation for dynamic employee list items and action buttons
- [ ] **prior-year-review**: Audit render cycles and implement listener cleanup for review interactions
- [ ] **pto-accrual-card**: Implement event delegation pattern for accrual display updates
- [ ] **pto-bereavement-card**: Add proper listener cleanup for bereavement tracking interactions
- [ ] **pto-calendar**: Implement event delegation for calendar date selections and navigation
- [ ] **pto-dashboard**: Audit dashboard widget interactions and implement listener cleanup
- [ ] **pto-employee-info-card**: Implement event delegation for employee info display updates
- [ ] **pto-entry-form**: Add listener cleanup in disconnectedCallback for form validation and submission
- [ ] **pto-jury-duty-card**: Implement proper cleanup for jury duty tracking interactions
- [ ] **pto-request-queue**: Implement event delegation for dynamic request queue items
- [ ] **pto-sick-card**: Add listener cleanup for sick time tracking interactions
- [ ] **pto-summary-card**: Implement event delegation for summary data updates
- [ ] **report-generator**: Audit report generation interactions and implement listener cleanup

## Implementation Notes

- **BaseComponent Created**: A LitElement-inspired base class has been implemented in `client/components/base-component.ts` with proper event delegation, cleanup, and reactive update patterns
- **AdminPanel Migration**: The admin-panel component now extends BaseComponent, eliminating memory leaks from improper event listener management
- **Event Delegation**: All user interactions (navigation, buttons, forms) are now handled through event delegation on the shadow root
- **Automatic Cleanup**: Event listeners are properly cleaned up before re-renders and when components are disconnected
- **Reactive Updates**: Components use `requestUpdate()` for state changes instead of manual render calls
- Import seedData.ts directly in test.ts for data access
- Use component methods or attributes to inject data, avoiding any API calls within the admin-panel component
- Consider creating a seeding utility function in test.ts for reusability across test scenarios
- Ensure seed data is only used in test/development environments, not production
- Follow existing patterns for data handling and component communication as outlined in SKILL.md
- May need to update TypeScript configuration for client-side module resolution if issues arise
- **Testing Best Practices**: Tests should always cast to the proper type instead of generic HTMLElement (e.g., `querySelector("employee-form") as EmployeeForm` instead of `querySelector("employee-form") as HTMLElement`)
- **Testing Best Practices**: Prefer implementing methods on the component over dispatching events from unit tests when possible, but note that in some test environments (like happy-dom), `querySelector` returns generic HTMLElements that don't have access to component methods - in such cases, direct event dispatch with proper typing is the reliable approach

- Import seedData.ts directly in test.ts for data access
- Use component methods or attributes to inject data, avoiding any API calls within the admin-panel component
- Consider creating a seeding utility function in test.ts for reusability across test scenarios
- Ensure seed data is only used in test/development environments, not production
- Follow existing patterns for data handling and component communication as outlined in SKILL.md
- May need to update TypeScript configuration for client-side module resolution if issues arise
- **Testing Best Practices**: Tests should always cast to the proper type instead of generic HTMLElement (e.g., `querySelector("employee-form") as EmployeeForm` instead of `querySelector("employee-form") as HTMLElement`)
- **Testing Best Practices**: Prefer implementing methods on the component over dispatching events from unit tests when possible, but note that in some test environments (like happy-dom), `querySelector` returns generic HTMLElements that don't have access to component methods - in such cases, direct event dispatch with proper typing is the reliable approach

## Questions and Concerns

1. **Issue**: Clicking "Add Employee" works the first time, but after clicking "Cancel" and then "Add Employee" again, the form doesn't appear. **Fixed**: The issue was that `showEmployeeForm()` and `hideEmployeeForm()` were calling `render()` but not re-attaching event listeners with `setupEventListeners()`. The "Add Employee" button lost its click handler after the first form show/hide cycle.
2. **Memory Leak Concern**: Multiple event listeners are being registered without cleanup. When `render()` replaces `innerHTML`, old DOM elements are destroyed but their event listeners remain in memory. **Plan to Fix**:
   - **Recommended**: Implement a base component class inspired by LitElement's architecture for consistent lifecycle management
   - Create `BaseComponent` class with proper event delegation, cleanup, and render cycle management
   - Implement event delegation on persistent containers instead of attaching/removing listeners on dynamic elements
   - Add `cleanupEventListeners()` and `cleanupChildEventListeners()` methods to remove existing listeners
   - Call cleanup methods before each `render()` call
   - Store listener references to enable proper removal
   - Implement cleanup in `disconnectedCallback()` for proper component lifecycle management
   - Avoid multiple `setupEventListeners()` calls by using flags or delegation patterns

   **LitElement-Inspired Base Component Pattern** (Recommended):

   ```typescript
   export abstract class BaseComponent extends HTMLElement {
     protected shadowRoot!: ShadowRoot;
     private eventListeners: {
       element: EventTarget;
       event: string;
       handler: EventListener;
     }[] = [];
     private isEventDelegationSetup = false;
     private _isConnected = false;

     constructor() {
       super();
       this.attachShadow({ mode: "open" });
     }

     connectedCallback() {
       this._isConnected = true;
       this.setupEventDelegation();
       this.update();
     }

     disconnectedCallback() {
       this._isConnected = false;
       this.cleanupEventListeners();
     }

     // LitElement-inspired update cycle
     protected update() {
       if (!this._isConnected) return;

       const templateResult = this.render();
       if (templateResult !== undefined) {
         this.renderTemplate(templateResult);
       }
     }

     // Event delegation pattern for dynamic content
     protected setupEventDelegation() {
       if (this.isEventDelegationSetup) return;

       this.shadowRoot.addEventListener("click", (e) => {
         this.handleDelegatedClick(e);
       });

       this.shadowRoot.addEventListener("submit", (e) => {
         this.handleDelegatedSubmit(e);
       });

       this.isEventDelegationSetup = true;
     }

     // Override in subclasses for specific click handling
     protected handleDelegatedClick(e: Event): void {
       // Subclasses implement specific logic
     }

     // Override in subclasses for form submissions
     protected handleDelegatedSubmit(e: Event): void {
       // Subclasses implement specific logic
     }

     // Safe event listener management
     protected addListener(
       element: EventTarget,
       event: string,
       handler: EventListener,
     ) {
       element.addEventListener(event, handler);
       this.eventListeners.push({ element, event, handler });
     }

     protected removeAllListeners() {
       this.eventListeners.forEach(({ element, event, handler }) => {
         element.removeEventListener(event, handler);
       });
       this.eventListeners = [];
     }

     // Cleanup method for subclasses
     protected cleanupEventListeners() {
       this.removeAllListeners();
     }

     // LitElement-inspired render method (abstract)
     protected abstract render(): string | undefined;

     // Template rendering with automatic cleanup
     protected renderTemplate(template: string): void {
       // Clean up listeners before re-rendering
       this.cleanupEventListeners();
       this.shadowRoot.innerHTML = template;
       // Re-setup delegation after render
       this.setupEventDelegation();
     }

     // Force re-render (LitElement-inspired)
     protected requestUpdate() {
       if (this._isConnected) {
         this.update();
       }
     }
   }
   ```

   **Migration Example**:

   ```typescript
   export class AdminPanel extends BaseComponent {
     private employees: Employee[] = [];

     protected render(): string {
       return `
         <div class="admin-panel">
           <button class="add-employee-btn">Add Employee</button>
           ${this.employees.map((emp) => `<div class="employee">${emp.name}</div>`).join("")}
         </div>
       `;
     }

     protected handleDelegatedClick(e: Event): void {
       const target = e.target as HTMLElement;
       if (target.matches(".add-employee-btn")) {
         this.showEmployeeForm();
       }
     }

     setEmployees(employees: Employee[]) {
       this.employees = employees;
       this.requestUpdate();
     }
   }
   ```

3.

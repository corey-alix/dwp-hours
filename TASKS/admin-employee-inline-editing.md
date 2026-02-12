# Admin Employee Inline Editing

## Description

Add an inline editing flow for employees in the admin panel. When an admin clicks Edit on an employee card, the card should be replaced with an `employee-form` prefilled for that employee. Saving or canceling should restore the card and keep the list stable.

## Priority

🟢 Low Priority

## Checklist

### Stage 1: Employee Form Component Refactoring

**Test Strategy Update: Prefer Unit Tests Over E2E Tests**

**Rationale**: While E2E tests are valuable for API integration testing, component-level functionality with mock data is better tested through unit tests. Unit tests provide:

- Faster execution (no browser startup overhead)
- Better isolation and control over test scenarios
- Easier debugging with direct access to component internals
- More granular testing of validation, state management, and event handling

**Current Test Coverage:**

- **E2E Test**: `e2e/component-employee-form.spec.ts` - Tests form submission, validation, and cancel functionality in browser environment
- **No unit tests exist** - EmployeeForm component lacks dedicated unit tests

**Migration Plan: From Playwright E2E to Happy DOM + Vitest Unit Tests**

**Stage 1A: BaseComponent Migration (Critical - Memory Safety)**

- [x] Change `extends HTMLElement` to `extends BaseComponent` in employee-form/index.ts
- [x] Remove manual `this.shadow = this.attachShadow({ mode: "open" })` call
- [x] Replace `render()` method to return string instead of setting `this.shadow.innerHTML`
- [x] Implement `handleDelegatedClick()` and `handleDelegatedSubmit()` methods for event handling
- [x] Replace manual `render()` calls with `this.requestUpdate()`
- [x] Remove manual event listener setup/cleanup code from `setupEventListeners()`
- [x] **Create initial unit test** in `tests/components/employee-form.test.ts` to verify basic component instantiation
- [x] **Migrate E2E test scenarios** to unit tests: form submission, validation, cancel functionality
- [x] Run `npm run test:unit` to verify unit tests pass after migration
- [x] Run `npm run build` and `npm run lint` to ensure no compilation errors

**Stage 1B: Code Structure Improvements (High Priority)**

- [x] Extract inline CSS to separate `employee-form/styles.css` file and import it
  - **Finding: esbuild does not automatically embed imported CSS into web components for shadow DOM injection.** When CSS is imported in JavaScript, esbuild outputs it to a separate CSS file rather than embedding it in the component's template string. For shadow DOM components, CSS must be included in the template or injected programmatically. Without additional plugins or build configuration, CSS extraction is not feasible and would result in separate CSS files that don't integrate with the component's encapsulation.
  - **Resolution: Keep CSS inline in the template string for shadow DOM compatibility. CSS extraction cancelled.**
- [x] Create template functions to break down the large `render()` method into smaller, composable parts
- [x] Extract form data collection logic into dedicated `collectFormData()` method
- [x] Extract validation logic into dedicated `validateAndCollectData()` method
- [x] Simplify submit button event handler by delegating to extracted methods
- [x] **Add unit tests** for template functions, data collection, and validation methods
- [x] **Update existing unit tests** to reflect structural changes

**Stage 1C: Type Safety and Validation Improvements (Medium Priority)**

- [x] Replace `as string` and `as HTMLInputElement` type assertions with proper type guards
- [x] Integrate shared business rules from `shared/businessRules.ts` for PTO rate validation
- [x] Improve email validation regex to handle more edge cases
- [x] Add proper error handling for form data parsing
- [x] **Add unit tests** for validation edge cases and business rule integration
- [x] **Test type safety improvements** with unit tests

**Stage 1D: Accessibility and UX Enhancements (Low Priority)**

- [x] Add ARIA attributes for form fields and error states
- [x] Implement focus management for form navigation
- [x] Add loading states beyond button text changes (e.g., disabled state)
- [x] Add keyboard navigation support
- [x] **Add unit tests** for accessibility features and keyboard navigation

**Stage 1E: Testing and Documentation**

- [ ] **Complete unit test suite** for EmployeeForm component in `tests/components/employee-form.test.ts`
- [ ] **Migrate remaining E2E scenarios** to unit tests where appropriate (keep E2E for true integration scenarios)
- [ ] Add unit tests for form validation, data collection, state management, and event dispatching
- [ ] Add unit tests for BaseComponent integration (event delegation, lifecycle methods)
- [ ] **Deprecate E2E test** `component-employee-form.spec.ts` in favor of comprehensive unit tests
- [ ] Update component README.md with new BaseComponent usage and API
- [ ] Run full test suite (`npm run test`) to ensure no regressions
- [ ] Update inline editing task documentation to reflect refactored component

**Unit Test Setup with Happy DOM + Vitest:**

```typescript
// tests/components/employee-form.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { EmployeeForm } from "../../client/components/employee-form/index.js";

describe("EmployeeForm Component", () => {
  let element: EmployeeForm;

  beforeEach(() => {
    // Happy DOM provides global document, window, etc.
    element = new EmployeeForm();
    document.body.appendChild(element);
  });

  it("should render form in add mode", () => {
    expect(element.shadowRoot?.querySelector("form")).toBeTruthy();
    expect(element.shadowRoot?.querySelector("h2")?.textContent).toBe(
      "Add New Employee",
    );
  });

  it("should validate required fields", () => {
    const form = element.shadowRoot?.querySelector("form") as HTMLFormElement;
    // Test validation logic directly
  });

  // Additional tests for events, validation, state management
});
```

**Migration Benefits:**

- **Faster feedback**: Unit tests run in ~100ms vs E2E tests in ~5-10 seconds
- **Better debugging**: Direct access to component methods and shadow DOM
- **Comprehensive coverage**: Test individual methods, validation logic, and edge cases
- **CI efficiency**: Unit tests can run on every file change without browser overhead

**Files to Create/Modify During Refactoring:**

**New Files:**

- `client/components/employee-form/styles.css` - Extracted CSS styles
- `tests/components/employee-form.test.ts` - Comprehensive unit test suite

**Modified Files:**

- `client/components/employee-form/index.ts` - BaseComponent migration and code improvements
- `client/components/employee-form/README.md` - Updated documentation
- `e2e/component-employee-form.spec.ts` - Deprecate in favor of unit tests (or keep for integration validation)

**Import Updates Required:**

- Update `client/components/index.ts` to export the refactored EmployeeForm
- Update any component playground files that import the old EmployeeForm

### Stage 2: Component API and layout wiring

- [x] Define or confirm events for edit intent, save, and cancel using properties down/events up
- [x] Update `employee-list` to render an inline editor slot for a single active employee
- [x] Update `admin-panel` to supply the selected employee data to the inline editor
- [x] Validate the inline editor renders in place of the employee card without layout shifts
- [x] No TypeScript compilation errors in modified components
- [x] Update admin-panel tests to reflect inline editing behavior (editing-employee-id attribute)

### Stage 3: State behavior and UX details

- [x] Ensure only one inline editor can be open at a time (implemented via single editingEmployeeId property)
- [x] Restore the employee card on cancel, preserving list order and scroll position
- [x] On save, update the local employee list and emit a change event for API integration
- [x] Add focus management to move focus into the form and back to the card actions on exit

### Stage 4: Testing and quality gates

- [ ] Extend component playground tests for inline edit open/save/cancel flows
- [ ] Update admin-panel test.ts to handle in-memory employee model updates on edit save events (preserve edits using seedData)
- [ ] **Add unit test coverage** for inline editing state management and event handling
- [ ] **Migrate E2E test scenarios** to unit tests where appropriate (keep E2E for true integration scenarios)
- [ ] Update component documentation with the new events and props
- [ ] Verify `npm run build` and `npm run lint`
- [ ] Perform manual UI testing for keyboard navigation and regression checks

## Final Summary: Employee Form Refactoring Roadmap

**🎯 Mission**: Transform the employee-form component from a legacy HTMLElement implementation to a modern, testable, and maintainable BaseComponent while improving code quality and test coverage.

**📋 Implementation Order:**

1. **Start with BaseComponent Migration (Stage 1A)** - Critical for memory safety
2. **Create Unit Test Foundation** - Establish test coverage before major changes
3. **Iterative Improvements (Stages 1B-1D)** - Code structure, validation, accessibility
4. **Final Testing & Documentation (Stage 1E)** - Complete coverage and docs
5. **Build Inline Editing Features (Stages 2-3)** - Implement the inline editing functionality on the refactored foundation
6. **Quality Gates (Stage 4)** - Comprehensive testing with unit test preference

**✅ Success Criteria:**

- All unit tests pass (`npm run test:unit`)
- No memory leaks (BaseComponent handles cleanup)
- Improved maintainability (smaller methods, better separation of concerns)
- Comprehensive test coverage for component logic
- E2E tests still pass for integration scenarios
- Inline editing functionality works correctly

**🔄 Rollback Plan:**

- If BaseComponent migration fails, can revert to HTMLElement with improved event handling
- Unit tests provide safety net for refactoring changes
- Each stage can be implemented incrementally with test validation

**📚 Resources:**

- BaseComponent: `client/components/base-component.ts`
- Web Components Guidelines: `.github/skills/web-components-assistant/SKILL.md`
- Happy DOM + Vitest: Project's unit testing setup

## Implementation Notes

- Keep components API-agnostic; emit events instead of calling APIs directly.
- Use strongly typed DOM helpers like `querySingle` and avoid type casts.
- Do not add business logic to client components; use shared business rules as needed.
- Prefer small, local state changes to avoid re-rendering the entire list.

### Stage 1 Implementation Details

**Event Flow Confirmed:**

- Edit intent: `employee-edit` event from `employee-list` with `{ employeeId: number }`
- Save: `employee-submit` event from `employee-form` with `{ employee: Employee, isEdit: boolean }`
- Cancel: `form-cancel` event from `employee-form`

**Component Changes:**

- Added `editing-employee-id` attribute/property to `employee-list` to control which employee is being edited inline
- Modified `employee-list.render()` to show `employee-form` instead of employee card when `editingEmployeeId` matches
- Updated `admin-panel` to set `editingEmployeeId` on `employee-list` instead of using slot-based form
- Added event forwarding in `employee-list` to bubble `employee-submit` and `form-cancel` events from inline forms
- Ensured only one inline editor can be active at a time via single `editingEmployeeId` property

**Next Steps for Stage 2:**

- Focus management: When inline editor opens, focus should move to first form field
- On cancel/save, focus should return to the Edit button of the restored employee card
- Update local employee list in `admin-panel` when save occurs to reflect changes immediately
- Ensure list scroll position is preserved during edit/cancel operations

### Current Status & Remaining Work

**✅ Stage 1A-1D Complete**: Employee Form Component Refactoring foundation is complete. Component now extends BaseComponent, has improved code structure, type safety, and full accessibility enhancements with comprehensive unit tests (25 tests total, including 8 new accessibility tests). The employee-form/index.ts has been updated with ARIA attributes, focus management, keyboard navigation, loading states, and enhanced validation. Unit tests in employee-form.test.ts cover all accessibility features and keyboard navigation.

**❌ Stage 1E Remaining**: Testing and Documentation - Complete unit test suite, migrate E2E scenarios, update documentation.

**✅ Stage 2 Complete**: Component API and layout wiring implemented successfully. The inline editing flow works at the component level - clicking Edit on an employee card replaces it with an employee-form, and the form events properly bubble up through the component hierarchy.

**✅ E2E Compatibility**: Restored slot-based form rendering for adding new employees while maintaining inline editing for existing employees. E2E tests now pass.

**🔄 Stage 3 Partial**: Basic state management is working (only one editor at a time), but UX polish is needed:

- Focus management between form and card actions
- Local state updates on save for immediate UI feedback
- Scroll position preservation

**❌ Stage 4 Remaining**: Need to complete testing and documentation with unit test preference:

- Component playground tests for inline edit flows
- Test harness updates for in-memory model updates
- Unit test coverage for inline editing state management
- Component documentation updates
- Full quality gate verification

**Implementation Approach:**

- **Start with Stage 1**: Refactor the employee-form component to BaseComponent compliance and establish unit test foundation
- **Then implement Stages 2-3**: Build the inline editing functionality on the solid foundation
- **Finish with Stage 4**: Comprehensive testing with unit test preference over E2E
- All changes maintain the API-agnostic component design

## Recent Issues and Fixes

### Problem: Employee Form Submit Button Becomes Unresponsive After First Submission

**Understanding of the Problem:**
The E2E test `component-employee-form.spec.ts` was failing because after the first successful form submission, subsequent submit button clicks were being ignored. The test sequence was:

1. Fill form with "Test Employee" → submit → expect "Form submitted: Add - Test Employee" ✅
2. Click cancel → expect "Form cancelled" ✅
3. Fill form with "Another Employee" → submit → expect "Form submitted: Add - Another Employee" ❌ (got "Form cancelled")

Root cause: In the `EmployeeForm` component's submit handler, the `_isSubmitting` flag was set to `true` when validation passed and the "employee-submit" event was dispatched, but it was never reset to `false` afterwards. This caused the guard clause `if (this._isSubmitting) return;` to prevent all subsequent submit clicks, making the form appear "stuck" after the first submission.

**Solution Implemented:**
Added `this._isSubmitting = false; submitBtn.textContent = originalText;` after dispatching the "employee-submit" event in the submit button click handler. This ensures the form properly resets its submitting state after a successful submission, allowing subsequent form submissions to work correctly.

### Problem: Unit Test Failure in Admin Panel Component

**Understanding of the Problem:**
The unit test "should clear editing-employee-id when hideEmployeeForm is called" in `tests/components/admin-panel.test.ts` was failing. The test expected that after calling `hideEmployeeForm()`, the `editing-employee-id` attribute on the `employee-list` element would be cleared (set to an empty string). However, the attribute remained set to "1", indicating that the component was not re-rendering after the state change.

Root cause: The `hideEmployeeForm()` method was updating the internal state (`_editingEmployeeId = null`, `_showEmployeeForm = false`, `_editingEmployee = null`) but was not calling `this.requestUpdate()` to trigger a re-render. This meant the template, which sets `editing-employee-id='${this._editingEmployeeId || ""}'`, was not updated, leaving the old value in the DOM.

Additionally, there were missing pieces in the event handling:

- The `handleEmployeeCreate()` and `handleEmployeeUpdate()` methods were not calling `hideEmployeeForm()` after processing the events, so the form remained visible after successful save operations.
- The admin-panel was not listening for "create-employee" events to update local state, only "update-employee".

**Solution Implemented:**

1. Added `this.requestUpdate()` to the `hideEmployeeForm()` method to ensure the component re-renders after hiding the form.
2. Added calls to `this.hideEmployeeForm()` in `handleEmployeeCreate()` and `handleEmployeeUpdate()` to hide the form after successful operations.
3. Added an event handler case for "create-employee" in the `handleCustomEvent` method to update local state when new employees are created.

These changes ensure that the form is properly hidden and the UI state is consistent after all form operations (add, edit, cancel).

### E2E Test Compatibility

The E2E test `e2e/employee-admin-add.spec.ts` was failing due to shadow DOM access issues. Playwright locators cannot pierce shadow DOM by default, so selectors for elements inside shadow roots (like form inputs and buttons) were not working. Updated the test to use `page.evaluate()` to interact with shadow DOM elements directly, ensuring compatibility with the component architecture.

## Questions and Concerns

1. **Resolved: Test Strategy Contradictions**

   **Previous Issue**: Stage 3 mentioned adding Playwright E2E coverage, while Stage 4 advocated deprecating E2E tests in favor of unit tests.

   **Resolution**: Updated Stage 4 (now Stage 1) to be the foundation, with explicit preference for unit tests over E2E tests throughout. Stage 4 (testing) now focuses on unit test coverage for inline editing functionality, with E2E tests kept only for true integration scenarios.

2. **Resolved: Stage Ordering Contradictions**

   **Previous Issue**: Stages were numbered 1-4 with inline editing features first, but implementation guidance suggested starting with component refactoring (Stage 4).

   **Resolution**: Reordered stages in bottoms-up fashion: Start with foundation (component refactoring), then build features, then comprehensive testing. This ensures stable foundation before building dependent features.

3. **Employee Form Component Code Quality Assessment**

   **Web Components Guidelines Compliance: ❌ NOT COMPLIANT**

   The employee-form component violates several critical web-components-assistant guidelines:
   - **❌ BaseComponent Extension**: Extends `HTMLElement` directly instead of `BaseComponent`, missing automatic memory leak prevention and event delegation
   - **❌ Manual Shadow DOM**: Manually calls `attachShadow()` instead of using BaseComponent's automatic shadow root creation
   - **❌ Event Handling**: Uses manual event listener attachment instead of BaseComponent's `handleDelegatedClick`/`handleDelegatedSubmit` methods
   - **❌ Memory Management**: No automatic event listener cleanup, risking memory leaks from dynamic DOM updates
   - **❌ Reactive Updates**: Manually calls `render()` instead of using BaseComponent's `requestUpdate()` pattern
   - **❌ Lifecycle Safety**: Missing proper cleanup in `disconnectedCallback`

   **Current Issues:**
   - **Large monolithic file (412 lines)**: The component handles rendering, validation, event handling, and state management all in one file, making it hard to maintain and test.
   - **Inline HTML template**: The entire form template is embedded as a string in the `render()` method, making it difficult to read, maintain, and modify. Template literals with embedded logic create a maintenance burden.
   - **Complex submit handler**: The submit button event handler (25+ lines) contains multiple responsibilities - preventing double-submission, updating UI state, validation, data extraction, and event dispatching.
   - **Unsafe type assertions**: Uses `as string` and `as HTMLInputElement` type assertions that could fail at runtime.
   - **Basic validation**: Email validation regex is simple and doesn't cover all edge cases. No validation for PTO rate ranges or other business rules.
   - **Inline CSS**: All styles are embedded in the template string, mixing concerns and making them hard to override or theme.
   - **State synchronization issues**: The `attributeChangedCallback` manually sets `_isEdit` based on employee ID presence, which could lead to inconsistent state.

   **Improvement Recommendations (Priority Order):**
   - **🔴 CRITICAL: Migrate to BaseComponent**: Change `extends HTMLElement` to `extends BaseComponent` to fix memory leaks and follow project standards
   - **🔴 CRITICAL: Implement Event Delegation**: Replace manual event listeners with `handleDelegatedClick`/`handleDelegatedSubmit` methods
   - **🟡 HIGH: Template extraction not viable**: esbuild does not automatically embed HTML files without additional configuration. The current approach of embedding HTML as template literals is appropriate for this build setup.
   - **🟡 HIGH: Consider template functions**: Create template functions that return HTML strings to improve readability and maintainability.
   - **🟡 HIGH: Split CSS to separate file**: Extract inline styles to a separate CSS file that can be imported and injected, as this is more feasible with esbuild.
   - **🟠 MEDIUM: Simplify submit handler**: Extract form data collection and validation into separate methods to reduce complexity in event handlers.
   - **🟠 MEDIUM: Improve validation**: Add more robust validation using shared business rules from `shared/businessRules.ts`, including PTO rate validation and better email validation.
   - **🟠 MEDIUM: Add proper TypeScript types**: Replace type assertions with proper type guards and validation.
   - **🟢 LOW: Consider form libraries**: For complex forms, consider using a lightweight form library or creating a reusable form abstraction.
   - **🟢 LOW: Add loading states**: Better handling of async operations and loading states beyond just button text changes.
   - **🟢 LOW: Improve accessibility**: Add ARIA attributes, better focus management, and keyboard navigation support.

   **Migration Path:**
   1. Change `extends HTMLElement` to `extends BaseComponent`
   2. Remove manual `attachShadow()` call
   3. Replace `render()` method to return string instead of setting `innerHTML`
   4. Implement `handleDelegatedClick()` and `handleDelegatedSubmit()` for events
   5. Use `requestUpdate()` instead of manual render calls
   6. Remove manual event listener setup/cleanup code

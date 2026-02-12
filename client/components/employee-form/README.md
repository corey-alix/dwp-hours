# Employee Form Component

## Overview

The Employee Form component provides a comprehensive form for creating and editing employee records with validation, role selection, and theme integration. It extends the BaseComponent for proper web component lifecycle management and event delegation. It supports both add and edit modes with proper form handling, accessibility features, and user feedback.

## Features

- **Dual Mode**: Create new employees or edit existing ones
- **Form Validation**: Client-side validation with error messages and ARIA attributes
- **Role Selection**: Dropdown for employee roles
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: ARIA attributes, focus management, keyboard navigation, screen reader support
- **Event Handling**: Dispatches success/cancel events using BaseComponent event delegation
- **Loading States**: Visual feedback during form submission

## Usage

```html
<!-- Add new employee -->
<employee-form></employee-form>

<!-- Edit existing employee -->
<employee-form
  employee='{"id": 1, "name": "John Doe", "identifier": "john.doe@company.com", "ptoRate": 0.71, "carryoverHours": 0, "role": "Employee"}'
  is-edit="true"
>
</employee-form>
```

```javascript
const form = document.querySelector("employee-form");

// Listen for form submission
form.addEventListener("employee-submit", (event) => {
  console.log("Employee submitted:", event.detail);
  // event.detail = { employee: Employee, isEdit: boolean }
});

// Listen for form cancellation
form.addEventListener("form-cancel", () => {
  console.log("Form cancelled");
});
```

## Attributes

- `employee`: JSON string of employee object for edit mode
- `is-edit`: Boolean string to enable edit mode

## Properties

- `employee`: Employee object for editing
- `isEdit`: Boolean to toggle between add/edit modes

## Employee Data Structure

```typescript
interface Employee {
  id?: number; // Present in edit mode
  name: string; // Employee full name
  identifier: string; // Employee email address
  ptoRate: number; // PTO accrual rate (0-2 hours/day)
  carryoverHours: number; // Carried over PTO hours (0-1000)
  role: string; // Employee role ("Employee" or "Admin")
  hash?: string; // Password hash (edit mode only)
}
```

## Events

- `employee-submit`: Fired when form is successfully validated and submitted
  - `event.detail`: `{ employee: Employee, isEdit: boolean }`
- `form-cancel`: Fired when the cancel button is clicked

## Form Fields

- **Name**: Text input for employee full name (required)
- **Employee Email**: Email input for unique employee identifier (required, must be valid email)
- **PTO Rate**: Number input for PTO accrual rate (optional, default: 0.71, range: 0-2)
- **Carryover Hours**: Number input for carried over PTO hours (optional, default: 0, min: 0, max: 1000)
- **Role**: Select dropdown with role options ("Employee" or "Admin")

## Validation

- Required field validation for name and employee email
- Email format validation with comprehensive regex
- Numeric validation for PTO rate (0-2 range) and carryover hours (0-1000 range)
- Real-time validation with visual error indicators
- ARIA attributes for screen reader error announcements

## Theming Implementation

### CSS Custom Properties Used

- `--color-surface`: Form background
- `--color-text`: Label and input text color
- `--color-border`: Input borders
- `--color-primary`: Focus states
- `--color-primary-light`: Focus ring color
- `--color-error`: Error states
- `--color-shadow`: Form shadow
- `--color-secondary`: Secondary button colors
- `--color-secondary-hover`: Secondary button hover

### Theme Integration

- Automatic adaptation to light/dark themes
- Consistent form styling with other components
- Proper contrast ratios for accessibility

## Accessibility

- **ARIA Attributes**: `role="form"`, `aria-labelledby`, `aria-required`, `aria-describedby`, `aria-invalid`, `aria-live`
- **Form Labels**: Proper label association with inputs using `for` and `id`
- **Keyboard Navigation**: Tab navigation, Enter to submit, Escape to cancel
- **Focus Management**: Auto-focus on first field, focus on first error field
- **Screen Reader Support**: Error messages with `role="alert"` and `aria-live="polite"`, screen reader only hints
- **Loading States**: `aria-disabled` and screen reader announcements during submission
- **Semantic HTML**: Proper form structure with fieldsets and legends

## Implementation Details

- **BaseComponent Extension**: Inherits from BaseComponent for automatic shadow DOM management, event delegation, and lifecycle safety
- **Shadow DOM**: Encapsulated styling and markup
- **Reactive Rendering**: Updates when attributes change via `requestUpdate()`
- **Form State Management**: Tracks validation, submission states, and loading indicators
- **Event-Driven**: Uses custom events for parent communication
- **Type Safety**: Full TypeScript support with proper type guards and validation
- **Memory Safety**: Automatic event listener cleanup and proper disconnectedCallback handling</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/employee-form/README.md

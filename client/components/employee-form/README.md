# Employee Form Component

## Overview

The Employee Form component provides a comprehensive form for creating and editing employee records with validation, role selection, and theme integration. It supports both add and edit modes with proper form handling and user feedback.

## Features

- **Dual Mode**: Create new employees or edit existing ones
- **Form Validation**: Client-side validation with error messages
- **Role Selection**: Dropdown for employee roles
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Proper form labels and keyboard navigation
- **Event Handling**: Dispatches success/error events

## Usage

```html
<!-- Add new employee -->
<employee-form></employee-form>

<!-- Edit existing employee -->
<employee-form
  employee='{"id": 1, "name": "John Doe", "identifier": "jdoe", "ptoRate": 0.71, "carryoverHours": 0, "role": "Employee"}'
  is-edit="true">
</employee-form>
```

```javascript
const form = document.querySelector('employee-form');

// Listen for form submission
form.addEventListener('employee-saved', (event) => {
  console.log('Employee saved:', event.detail);
});

// Listen for errors
form.addEventListener('employee-error', (event) => {
  console.log('Error:', event.detail);
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
  id?: number;           // Present in edit mode
  name: string;          // Employee full name
  identifier: string;    // Unique employee identifier
  ptoRate: number;       // PTO accrual rate
  carryoverHours: number; // Carried over PTO hours
  role: string;          // Employee role
  hash?: string;         // Password hash (edit mode only)
}
```

## Events

- `employee-saved`: Fired when form is successfully submitted with employee data
- `employee-error`: Fired when validation fails or submission errors occur

## Form Fields

- **Name**: Text input for employee full name
- **Identifier**: Text input for unique employee identifier
- **PTO Rate**: Number input for PTO accrual rate (default: 0.71)
- **Carryover Hours**: Number input for carried over PTO hours
- **Role**: Select dropdown with role options
- **Password**: Password input (add mode) or change password (edit mode)

## Validation

- Required field validation for name and identifier
- Unique identifier validation
- Numeric validation for PTO rate and carryover hours
- Password requirements in add mode

## Theming Implementation

### CSS Custom Properties Used

- `--color-surface`: Form background
- `--color-text`: Label and input text color
- `--color-border`: Input borders
- `--color-primary`: Focus states
- `--color-primary-light`: Focus ring color
- `--color-error`: Error states
- `--color-shadow`: Form shadow
- `--color-success`: Success states (if implemented)

### Theme Integration

- Automatic adaptation to light/dark themes
- Consistent form styling with other components
- Proper contrast ratios for accessibility

## Accessibility

- **Form Labels**: Proper label association with inputs
- **Keyboard Navigation**: Tab navigation through form fields
- **Focus Management**: Visible focus indicators
- **Error Announcements**: Screen reader accessible error messages
- **Semantic HTML**: Proper form structure

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup
- **Reactive Rendering**: Updates when attributes change
- **Form State Management**: Tracks validation and submission states
- **Event-Driven**: Uses custom events for parent communication</content>
<parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/employee-form/README.md
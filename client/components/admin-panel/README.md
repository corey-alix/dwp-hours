# Admin Panel Component

## Overview

The Admin Panel component provides a comprehensive administrative interface for managing employees, PTO requests, reports, and system settings. It features a sidebar navigation with multiple views and supports full light/dark theme integration.

## Features

- **Multi-view Navigation**: Switch between Employees, PTO Requests, Reports, and Settings
- **Responsive Design**: Adapts to different screen sizes
- **Theme Integration**: Fully supports light and dark themes with automatic switching
- **Child Component Integration**: Seamlessly integrates with other admin components

## Theming Implementation

### CSS Custom Properties Used

The component uses the following semantic color variables for consistent theming:

#### Layout Colors

- `--color-background`: Main background color
- `--color-surface`: Sidebar and content area backgrounds
- `--color-surface-hover`: Hover states for navigation items
- `--color-border`: Border colors for separation

#### Text Colors

- `--color-text`: Primary text color
- `--color-text-secondary`: Secondary text (navigation links)

#### Interactive Colors

- `--color-primary`: Active navigation link background
- `--color-primary-hover`: Active navigation link accent border

#### Shadow Effects

- `--color-shadow`: Subtle shadows for depth
- `--color-shadow-dark`: Enhanced shadows for floating elements

### Theme Behavior

- **Light Theme**: Clean, high-contrast design with light backgrounds
- **Dark Theme**: Automatically switches to dark surfaces and light text
- **System Integration**: Respects user's system color scheme preference
- **Smooth Transitions**: All color changes are animated for better UX

### Accessibility

- **WCAG Compliance**: All color combinations meet WCAG AA contrast requirements
- **Focus Indicators**: Clear visual feedback for keyboard navigation
- **Semantic HTML**: Proper heading hierarchy and ARIA labels

## Usage

### Basic Implementation

```html
<admin-panel current-view="employees"></admin-panel>
```

### Programmatic Control

```javascript
const adminPanel = document.querySelector("admin-panel");
adminPanel.currentView = "pto-requests";
```

### Event Handling

```javascript
adminPanel.addEventListener("view-change", (e) => {
  console.log("View changed to:", e.detail.view);
});

// Employee management events
adminPanel.addEventListener("create-employee", (e) => {
  console.log("Create employee:", e.detail.employee);
});

adminPanel.addEventListener("update-employee", (e) => {
  console.log("Update employee:", e.detail.employee);
});

adminPanel.addEventListener("employee-delete", (e) => {
  console.log("Delete employee:", e.detail.employeeId);
});

adminPanel.addEventListener("employee-acknowledge", (e) => {
  console.log("Acknowledge employee:", e.detail.employeeId, e.detail.month);
});
```

## Component Structure

### Sidebar Navigation

- **Header**: Admin Panel title
- **Navigation Menu**: Four main sections
  - 👥 Employees: Employee management
  - 📋 PTO Requests: Request queue management
  - 📊 Reports: Analytics and reporting
  - ⚙️ Settings: System configuration

### Main Content Area

- **Header**: Current view title
- **Content**: Dynamic view container
- **Child Components**: Renders appropriate child component based on current view

## Testing

Run the component unit test suite:

```bash
npm run test:unit -- tests/components/admin-panel.test.ts
```

Or visit the test page directly:

```
/components/admin-panel/test.html
```

## Dependencies

- Child components: `employee-list`, `pto-request-queue`, `report-generator`
- Theme system: CSS custom properties defined in global styles
- Test utilities: Component testing framework</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/client/components/admin-panel/README.md

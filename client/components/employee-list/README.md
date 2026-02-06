# Employee List Component

## Overview
The Employee List component provides a comprehensive interface for managing and displaying employee information. It features search functionality, employee cards with detailed information, and action buttons for employee management operations. The component supports full light/dark theme integration.

## Features
- **Employee Search**: Real-time filtering by name, identifier, or role
- **Employee Cards**: Detailed display of employee information with role badges
- **Action Buttons**: Edit, acknowledge, and delete operations per employee
- **Empty State**: User-friendly message when no employees are found
- **Theme Integration**: Fully supports light and dark themes with automatic switching
- **Responsive Design**: Adapts to different screen sizes

## Theming Implementation

### CSS Custom Properties Used
The component uses the following semantic color variables for consistent theming:

#### Layout Colors
- `--color-surface`: Card and toolbar backgrounds
- `--color-background`: Input field backgrounds
- `--color-border`: Borders and separators
- `--color-border-hover`: Hover state borders

#### Text Colors
- `--color-text`: Primary text (names, values)
- `--color-text-secondary`: Secondary text (identifiers, labels, employee count)

#### Interactive Colors
- `--color-primary`: Primary buttons and role badges
- `--color-primary-hover`: Button hover states
- `--color-primary-light`: Focus ring for inputs
- `--color-success`: Acknowledge button borders and hover
- `--color-error`: Delete button borders and hover
- `--color-surface-hover`: Button hover backgrounds

#### Shadow Effects
- `--color-shadow`: Card shadows
- `--color-shadow-dark`: Enhanced card hover shadows

### Theme Behavior
- **Light Theme**: Clean, high-contrast design with light surfaces and dark text
- **Dark Theme**: Automatically switches to dark surfaces and light text
- **System Integration**: Respects user's system color scheme preference
- **Smooth Transitions**: All color changes are animated for better UX

### Accessibility
- **WCAG Compliance**: All color combinations meet WCAG AA contrast requirements
- **Focus Indicators**: Clear visual feedback with primary color focus rings
- **Semantic HTML**: Proper heading hierarchy and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements

## Usage

### Basic Implementation
```html
<employee-list></employee-list>
```

### Programmatic Control
```javascript
const employeeList = document.querySelector('employee-list');
// Component handles its own data loading and events
```

### Event Handling
```javascript
employeeList.addEventListener('add-employee', () => {
    // Handle add employee action
});

employeeList.addEventListener('employee-edit', (e) => {
    const employee = e.detail;
    // Handle employee edit
});

employeeList.addEventListener('employee-delete', (e) => {
    const employee = e.detail;
    // Handle employee deletion
});
```

## Component Structure

### Toolbar
- **Search Input**: Real-time employee filtering
- **Employee Count**: Shows filtered/total employee count with 📊 icon
- **Add Button**: Primary action button for adding new employees

### Employee Grid
- **Employee Cards**: Individual cards for each employee
  - **Header**: Name, identifier, and role badge
  - **Details Grid**: Key information in organized layout
  - **Action Buttons**: Edit, acknowledge, and delete actions

### Empty State
- **No Results Message**: Displayed when search yields no results
- **Helpful Text**: Guidance for users

## Testing
Run the component test suite:
```bash
npm run test:e2e component-employee-list
```

Or visit the test page directly:
```
/components/employee-list/test.html
```

## Dependencies
- **API Integration**: Fetches employee data from backend
- **Theme System**: CSS custom properties defined in global styles
- **Test Utilities**: Component testing framework
- **Icons**: Uses emoji icons for visual elements

## Data Structure
The component expects employee objects with the following properties:
- `id`: Unique identifier
- `name`: Full employee name
- `identifier`: Employee ID/code
- `role`: Job role/title
- `hire_date`: Employment start date
- `email`: Contact email (optional)
- Additional metadata as needed</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/client/components/employee-list/README.md
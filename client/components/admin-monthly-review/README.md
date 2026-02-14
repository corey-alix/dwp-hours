# Admin Monthly Review Component

## Overview

The Admin Monthly Review component provides an interface for administrators to review employee monthly hours and PTO usage data. It displays employee information in card format with detailed hours breakdowns and allows admins to acknowledge their review of the data.

## Features

- **Month Selection**: Choose which month's data to review
- **Employee Cards**: Visual cards displaying each employee's monthly data
- **Hours Breakdown**: Detailed view of total hours, PTO, sick, bereavement, and jury duty hours
- **Acknowledgment Status**: Visual indicators showing acknowledgment status
- **Acknowledgment Actions**: Buttons to acknowledge reviews for individual employees
- **Responsive Design**: Adapts to different screen sizes

## Data Structure

The component expects employee data in the following format:

```typescript
interface MonthlyEmployeeData {
  employeeId: number;
  employeeName: string;
  month: string;
  totalHours: number;
  ptoHours: number;
  sickHours: number;
  bereavementHours: number;
  juryDutyHours: number;
  acknowledgedByAdmin: boolean;
  adminAcknowledgedAt?: string;
  adminAcknowledgedBy?: string;
}
```

## Usage

### Basic Usage

```html
<admin-monthly-review></admin-monthly-review>
```

### With Attributes

```html
<admin-monthly-review
  selected-month="2026-02"
  employee-data='[{"employeeId": 1, "employeeName": "John Doe", ...}]'
>
</admin-monthly-review>
```

## Attributes

- `selected-month`: The month to display data for (format: YYYY-MM)
- `employee-data`: JSON string of employee monthly data array

## Events

### admin-acknowledge

Dispatched when an admin clicks the "Acknowledge Review" button.

```javascript
monthlyReview.addEventListener("admin-acknowledge", (e) => {
  const { employeeId, month } = e.detail;
  // Handle acknowledgment logic
});
```

**Event Detail:**

- `employeeId`: Number - The ID of the employee being acknowledged
- `month`: String - The month being acknowledged (YYYY-MM format)

## Styling

The component uses CSS custom properties for theming:

### Layout Colors

- `--color-background`: Main background
- `--color-surface`: Card backgrounds
- `--color-border`: Borders and dividers

### Text Colors

- `--color-text`: Primary text
- `--color-text-secondary`: Secondary text

### Interactive Colors

- `--color-primary`: Button backgrounds
- `--color-primary-hover`: Button hover states
- `--color-success`: Acknowledged status indicator
- `--color-warning`: Pending status indicator

## Testing

Use the test harness to verify component functionality:

```bash
# Open test page
open client/components/admin-monthly-review/test.html

# Run test suite
npm test
```

The test harness includes:

- Mock employee data
- Event logging
- Interactive testing controls

## Integration

This component is designed to be used within the admin panel. It dispatches events that should be handled by the parent admin-panel component, which then coordinates with the main application for API calls and state management.

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management

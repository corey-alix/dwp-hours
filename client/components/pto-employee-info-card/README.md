# PTO Employee Info Card Component

## Overview

The PTO Employee Info Card component displays key employee information related to PTO management, including hire date and rollover dates. It provides a clean, consistent display of employee-specific PTO data.

## Features

- **Employee Data Display**: Shows hire date and rollover information
- **Consistent Styling**: Matches other PTO card components
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes
- **Loading State**: Handles missing data gracefully

## Usage

```html
<pto-employee-info-card
  data='{"hireDate": "2020-01-15", "nextRolloverDate": "2025-01-01"}'
>
</pto-employee-info-card>
```

```javascript
const card = document.querySelector("pto-employee-info-card");
card.info = {
  hireDate: "2020-01-15",
  nextRolloverDate: "2025-01-01",
};
```

## Attributes

- `data`: JSON object with employee information

## Properties

- `info`: EmployeeInfoData object for setting information

## Data Structure

```typescript
type EmployeeInfoData = {
  hireDate: string; // Employee hire date (YYYY-MM-DD)
  nextRolloverDate: string; // Next PTO rollover date (YYYY-MM-DD)
};
```

## Features

- **Date Formatting**: Displays dates in user-friendly format
- **Rollover Tracking**: Shows when PTO resets occur
- **Hire Date Reference**: Important for PTO accrual calculations
- **Consistent Layout**: Follows PTO card design patterns

## Theming Implementation

### CSS Custom Properties Used

Inherits from base PTO card component:

- `--color-background`: Card background
- `--color-text`: Primary text color
- `--color-text-secondary`: Secondary text color
- `--color-border`: Card borders
- `--shadow-md`: Card shadow
- `--border-radius-lg`: Card border radius

### Theme Integration

- Automatic light/dark theme adaptation
- Consistent with PTO dashboard styling
- Semantic color usage

## Implementation Details

- **Base Class**: Extends `PtoSectionCard` for consistent card styling
- **Reactive Updates**: Updates when data attributes change
- **Type Safety**: Full TypeScript interfaces for employee data
- **Loading States**: Graceful handling of missing data</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-employee-info-card/README.md

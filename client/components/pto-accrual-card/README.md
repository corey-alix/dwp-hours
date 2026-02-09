# PTO Accrual Card Component

## Overview

The PTO Accrual Card component displays employee PTO accrual information, including monthly accruals, usage tracking, and balance calculations. It extends the base PTO card component and provides detailed accrual analytics with calendar integration.

## Features

- **Accrual Tracking**: Monthly PTO accrual amounts and cumulative totals
- **Usage Monitoring**: PTO usage by month with balance calculations
- **Calendar Integration**: Visual calendar showing PTO entries and accruals
- **Balance Display**: Current PTO balance with negative balance highlighting
- **Request Mode**: Toggle between view and request modes
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes

## Usage

```html
<pto-accrual-card
  accruals='[{"month": 0, "hours": 8}, {"month": 1, "hours": 8}]'
  usage='[{"month": 0, "hours": 4}, {"month": 1, "hours": 6}]'
  pto-entries='[{"id": 1, "employeeId": 1, "date": "2024-01-15", "type": "PTO", "hours": 8}]'
  year="2024"
  request-mode="false"
  annual-allocation="96">
</pto-accrual-card>
```

## Attributes

- `accruals`: JSON array of monthly accrual data
- `usage`: JSON array of monthly usage data
- `pto-entries`: JSON array of PTO entry records
- `year`: Year for accrual calculations (default: current year)
- `request-mode`: Boolean to enable request mode
- `annual-allocation`: Total annual PTO hours (default: 96)

## Data Structures

```typescript
type AccrualData = {
  month: number;  // 0-11 for Jan-Dec
  hours: number;  // Hours accrued that month
};

type UsageData = {
  month: number;  // 0-11 for Jan-Dec
  hours: number;  // Hours used that month
};

type PTOEntry = {
  id: number;
  employeeId: number;
  date: string;  // YYYY-MM-DD format
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string;
};
```

## Features

- **Monthly Breakdown**: Shows accrual and usage for each month
- **Balance Calculation**: Running balance with negative highlighting
- **Calendar View**: Integrated PTO calendar for visual reference
- **Work Day Calculations**: Based on business work days and allocation rates
- **Toggle Interface**: Switch between different view modes

## Theming Implementation

### CSS Custom Properties Used

The component inherits theming from the base PTO card component:

- `--color-background`: Card background
- `--color-text`: Primary text color
- `--color-text-secondary`: Secondary text color
- `--color-border`: Card borders
- `--color-error`: Negative balance highlighting
- `--shadow-md`: Card shadow
- `--border-radius-lg`: Card border radius

### Theme Integration

- Consistent with other PTO card components
- Automatic light/dark theme adaptation
- Semantic color usage for balance states

## Implementation Details

- **Base Class**: Extends `PtoSectionCard` for consistent styling
- **Calendar Integration**: Uses `PtoCalendar` component for visualization
- **Work Day Logic**: Integrates with server work day calculations
- **Reactive Updates**: Updates when attributes change
- **Type Safety**: Full TypeScript interfaces for data structures</content>
<parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-accrual-card/README.md
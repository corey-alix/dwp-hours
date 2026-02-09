# PTO Summary Card Component

## Overview

The PTO Summary Card component displays a comprehensive overview of an employee's PTO balance, including carryover, annual allocation, used hours, and available balance. It provides a clear summary of PTO status with negative balance highlighting.

## Features

- **Balance Overview**: Complete PTO balance breakdown
- **Negative Balance Highlighting**: Visual indicators for negative balances
- **Carryover Tracking**: Shows previous year carryover amounts
- **Annual Allocation**: Displays total allocated PTO hours
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes

## Usage

```html
<pto-summary-card
  data='{"annualAllocation": 96, "availablePTO": 56, "usedPTO": 40, "carryoverFromPreviousYear": 0}'>
</pto-summary-card>
```

```javascript
const card = document.querySelector('pto-summary-card');
card.summary = {
  annualAllocation: 96,
  availablePTO: 56,
  usedPTO: 40,
  carryoverFromPreviousYear: 0
};
```

## Attributes

- `data`: JSON object with PTO summary data

## Properties

- `summary`: SummaryData object for setting PTO information

## Data Structure

```typescript
type SummaryData = {
  annualAllocation: number;        // Total PTO hours allocated annually
  availablePTO: number;            // Currently available PTO hours
  usedPTO: number;                 // PTO hours already used
  carryoverFromPreviousYear: number; // Carried over hours from previous year
};
```

## Features

- **Balance Calculation**: Shows remaining PTO after usage
- **Visual Indicators**: Negative values highlighted in error color
- **Formatted Display**: Hours displayed with proper decimal formatting
- **Section Divider**: Visual separation between components and total

## Theming Implementation

### CSS Custom Properties Used

Inherits from base PTO card component:

- `--color-background`: Card background
- `--color-text`: Primary text color
- `--color-text-secondary`: Secondary text color
- `--color-border`: Card borders
- `--color-error`: Negative balance highlighting
- `--shadow-md`: Card shadow
- `--border-radius-lg`: Card border radius

### Theme Integration

- Automatic light/dark theme adaptation
- Consistent with PTO dashboard styling
- Semantic color usage for balance states

## Implementation Details

- **Base Class**: Extends `PtoSectionCard` for consistent card styling
- **Reactive Updates**: Updates when data attributes change
- **Negative Balance Handling**: Special formatting and coloring for deficits
- **Type Safety**: Full TypeScript interfaces for summary data</content>
<parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-summary-card/README.md
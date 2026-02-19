# PTO Summary Card Component

## Overview

The PTO Summary Card component displays a comprehensive overview of an employee's PTO balance, including carryover, annual allocation, used hours, and available balance. It provides a clear summary of PTO status with negative balance highlighting.

## Features

- **Balance Overview**: Complete PTO balance breakdown
- **Approval Indicators**: Green checkbox beside "Used" when all PTO entries are approved
- **Negative Balance Highlighting**: Visual indicators for negative balances
- **Carryover Tracking**: Shows previous year carryover amounts
- **Annual Allocation**: Displays total allocated PTO hours
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes
- **Balance Summary Slot**: Named slot (`balance-summary`) for injecting a remaining-balance display (e.g., `<month-summary>`) at the bottom of the card

## Usage

```html
<pto-summary-card
  data='{"annualAllocation": 96, "availablePTO": 56, "usedPTO": 40, "carryoverFromPreviousYear": 0}'
  full-entries='[{"id": 1, "employeeId": 1, "date": "2026-01-15", "type": "PTO", "hours": 8, "createdAt": "2026-01-01T00:00:00Z", "approved_by": 3}]'
>
</pto-summary-card>
```

```javascript
const card = document.querySelector("pto-summary-card");
card.summary = {
  annualAllocation: 96,
  availablePTO: 56,
  usedPTO: 40,
  carryoverFromPreviousYear: 0,
};
card.fullPtoEntries = [
  {
    id: 1,
    employeeId: 1,
    date: "2026-01-15",
    type: "PTO",
    hours: 8,
    createdAt: "2026-01-01T00:00:00Z",
    approved_by: 3,
  },
];
```

carryoverFromPreviousYear: 0,
};

````

## Attributes

- `data`: JSON object with PTO summary data
- `full-entries`: JSON array of full PTOEntry objects with approval status

## Slots

- `balance-summary`: Named slot rendered at the bottom of the card, inside the `.card` container. Used to inject a `<month-summary>` element displaying remaining available hours per PTO type. The slot receives `::slotted` styling for spacing and a top border separator.

### Slot Usage Example

```html
<pto-summary-card>
  <div slot="balance-summary">
    <h5>Remaining Balance</h5>
    <month-summary
      pto-hours="56"
      sick-hours="16"
      bereavement-hours="40"
      jury-duty-hours="40"
    ></month-summary>
  </div>
</pto-summary-card>
```

## Properties

- `summary`: SummaryData object for setting PTO information
- `fullPtoEntries`: Array of PTOEntry objects for approval status checking

## Data Structure

```typescript
type SummaryData = {
  annualAllocation: number; // Total PTO hours allocated annually
  availablePTO: number; // Currently available PTO hours
  usedPTO: number; // PTO hours already used
  carryoverFromPreviousYear: number; // Carried over hours from previous year
};

type PTOEntry = {
  id: number;
  employeeId: number;
  date: string;
  type: "PTO";
  hours: number;
  createdAt: string;
  approved_by?: number | null;
};
````

## Features

- **Balance Calculation**: Shows remaining PTO after usage
- **Approval Status**: Green checkmark (✓) appears after the word "Used" (displayed as "Used ✓") when all PTO entries are approved. The checkmark is rendered via CSS using the `approved` class.
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

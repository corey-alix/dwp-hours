# PTO Sick Card Component

## Overview

The PTO Sick Card component displays sick leave information in a simple bucket format. It shows available hours, used hours, and provides expandable details for sick time tracking.

## Features

- **Bucket Display**: Shows available vs used sick hours
- **Approval Indicators**: Green checkbox beside "Used" when all sick time is approved
- **Expandable Details**: Toggle to show/hide detailed entry information
- **Theme Integration**: Consistent with other PTO card components
- **Responsive Design**: Adapts to different screen sizes
- **Simple Interface**: Clean, focused display for sick leave

## Usage

```html
<pto-sick-card
  data='{"available": 48, "used": 16, "remaining": 32}'
  entries='[{"date": "2024-01-10", "hours": 8}, {"date": "2024-02-15", "hours": 8}]'
  full-entries='[{"id": 1, "employeeId": 1, "date": "2024-01-10", "type": "Sick", "hours": 8, "createdAt": "2024-01-01T00:00:00Z", "approved_by": 3}, {"id": 2, "employeeId": 1, "date": "2024-02-15", "type": "Sick", "hours": 8, "createdAt": "2024-01-01T00:00:00Z", "approved_by": 3}]'
  expanded="false"
>
</pto-sick-card>
```

## Attributes

- `data`: JSON object with sick time bucket data
- `entries`: JSON array of sick time usage entries (simplified format)
- `full-entries`: JSON array of full PTOEntry objects with approval status
- `expanded`: Boolean to control expanded state

## Data Structures

```typescript
type SickTimeData = {
  available: number; // Total available sick hours
  used: number; // Hours already used
  remaining: number; // Hours remaining
};

type SickTimeEntry = {
  date: string; // YYYY-MM-DD format
  hours: number; // Hours used
};

type PTOEntry = {
  id: number;
  employeeId: number;
  date: string;
  type: "Sick";
  hours: number;
  createdAt: string;
  approved_by?: number | null;
};
```

## Features

- **Balance Display**: Shows available, used, and remaining hours
- **Approval Status**: Green checkmark (✓) appears after the word "Used" (displayed as "Used ✓") when all sick time entries are approved. The checkmark is rendered via CSS using the `approved` class.
- **Entry Details**: Lists individual sick time entries when expanded
- **Toggle Interface**: Expand/collapse for detailed view
- **Consistent Styling**: Matches other PTO bucket cards

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

- **Base Class**: Extends `SimplePtoBucketCard` for standardized bucket display
- **Reactive Updates**: Updates when data attributes change
- **Expandable Interface**: Toggle between summary and detailed views
- **Type Safety**: Full TypeScript interfaces for sick time data</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-sick-card/README.md

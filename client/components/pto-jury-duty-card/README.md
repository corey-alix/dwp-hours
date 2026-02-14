# PTO Jury Duty Card Component

## Overview

The PTO Jury Duty Card component displays jury duty leave information in a simple bucket format. It shows available hours, used hours, remaining hours, and provides expandable details for jury duty leave tracking. It includes approval status indicators and handles overage scenarios.

## Features

- **Bucket Display**: Shows available vs used jury duty hours
- **Approval Indicators**: Green checkbox beside "Used" when all jury duty time is approved
- **Overage Handling**: Red styling for negative remaining time
- **Expandable Details**: Toggle to show/hide detailed entry information
- **Theme Integration**: Consistent with other PTO card components
- **Responsive Design**: Adapts to different screen sizes
- **Simple Interface**: Clean, focused display for jury duty leave

## Usage

```html
<pto-jury-duty-card
  data='{"allowed": 40, "used": 32, "remaining": 8}'
  entries='[{"date": "2026-06-15", "hours": 8}]'
  full-entries='[{"id": 1, "employeeId": 1, "date": "2026-06-15", "type": "Jury Duty", "hours": 8, "createdAt": "2026-01-01T00:00:00Z", "approved_by": 3}]'
  expanded="false"
>
</pto-jury-duty-card>
```

## Attributes

- `data`: JSON object with jury duty bucket data
- `entries`: JSON array of jury duty usage entries (simplified format)
- `full-entries`: JSON array of full PTOEntry objects with approval status
- `expanded`: Boolean to control expanded state

## Data Structures

```typescript
type JuryDutyData = {
  allowed: number; // Total allowed jury duty hours
  used: number; // Hours already used (approved entries only)
  remaining: number; // Hours remaining (can be negative)
};

type JuryDutyEntry = {
  date: string; // YYYY-MM-DD format
  hours: number; // Hours used
};

type PTOEntry = {
  id: number;
  employeeId: number;
  date: string;
  type: "Jury Duty";
  hours: number;
  createdAt: string;
  approved_by?: number | null;
};
```

## Features

- **Balance Display**: Shows allowed, used, and remaining hours
- **Approval Status**: Green checkmark (✓) appears after the word "Used" (displayed as "Used ✓") when all jury duty entries are approved. The checkmark is rendered via CSS using the `approved` class.
- **Overage Styling**: Remaining time displays in red when negative (e.g., "-2.50 hours")
- **Entry Details**: Lists individual jury duty entries when expanded
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
- **Type Safety**: Full TypeScript interfaces for jury duty data</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-jury-duty-card/README.md

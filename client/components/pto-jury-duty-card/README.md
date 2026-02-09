# PTO Jury Duty Card Component

## Overview

The PTO Jury Duty Card component displays jury duty leave information in a simple bucket format. It shows available hours, used hours, and provides expandable details for jury duty leave tracking.

## Features

- **Bucket Display**: Shows available vs used jury duty hours
- **Expandable Details**: Toggle to show/hide detailed entry information
- **Theme Integration**: Consistent with other PTO card components
- **Responsive Design**: Adapts to different screen sizes
- **Simple Interface**: Clean, focused display for jury duty leave

## Usage

```html
<pto-jury-duty-card
  data='{"available": 16, "used": 8, "remaining": 8}'
  entries='[{"date": "2024-02-15", "hours": 8, "description": "Jury duty service"}]'
  expanded="false">
</pto-jury-duty-card>
```

## Attributes

- `data`: JSON object with jury duty bucket data
- `entries`: JSON array of jury duty usage entries
- `expanded`: Boolean to control expanded state

## Data Structures

```typescript
type JuryDutyData = {
  available: number;  // Total available jury duty hours
  used: number;       // Hours already used
  remaining: number;  // Hours remaining
};

type JuryDutyEntry = {
  date: string;       // YYYY-MM-DD format
  hours: number;      // Hours used
  description?: string; // Optional description
};
```

## Features

- **Balance Display**: Shows available, used, and remaining hours
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
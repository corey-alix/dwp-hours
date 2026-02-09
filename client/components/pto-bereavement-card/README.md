# PTO Bereavement Card Component

## Overview

The PTO Bereavement Card component displays bereavement leave information in a simple bucket format. It shows available hours, used hours, and provides expandable details for bereavement leave tracking.

## Features

- **Bucket Display**: Shows available vs used bereavement hours
- **Expandable Details**: Toggle to show/hide detailed entry information
- **Theme Integration**: Consistent with other PTO card components
- **Responsive Design**: Adapts to different screen sizes
- **Simple Interface**: Clean, focused display for bereavement leave

## Usage

```html
<pto-bereavement-card
  data='{"available": 24, "used": 8, "remaining": 16}'
  entries='[{"date": "2024-01-15", "hours": 8, "description": "Family bereavement"}]'
  expanded="false">
</pto-bereavement-card>
```

## Attributes

- `data`: JSON object with bereavement bucket data
- `entries`: JSON array of bereavement usage entries
- `expanded`: Boolean to control expanded state

## Data Structures

```typescript
type BereavementData = {
  available: number;  // Total available bereavement hours
  used: number;       // Hours already used
  remaining: number;  // Hours remaining
};

type BereavementEntry = {
  date: string;       // YYYY-MM-DD format
  hours: number;      // Hours used
  description?: string; // Optional description
};
```

## Features

- **Balance Display**: Shows available, used, and remaining hours
- **Entry Details**: Lists individual bereavement entries when expanded
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
- **Type Safety**: Full TypeScript interfaces for bereavement data</content>
<parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-bereavement-card/README.md
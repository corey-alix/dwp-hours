# PTO Calendar Component

## Overview

The PTO Calendar component provides a monthly calendar view for displaying and selecting PTO entries. It supports read-only display mode and interactive selection mode with different PTO types and visual indicators.

## Features

- **Monthly View**: Displays a full month calendar grid
- **PTO Visualization**: Color-coded PTO entries by type
- **Approval Indicators**: Green checkmark (✓) in top-right corner for approved PTO entries
- **Interactive Selection**: Click to select/deselect dates for PTO requests
- **Read-only Mode**: Display-only mode for viewing existing entries
- **PTO Type Selection**: Choose between PTO, Sick, Bereavement, and Jury Duty
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes

## Usage

```html
<!-- Read-only calendar -->
<pto-calendar
  month="0"
  year="2024"
  pto-entries='[{"id": 1, "date": "2024-01-15", "type": "PTO", "hours": 8}]'
  readonly="true"
>
</pto-calendar>

<!-- Interactive calendar for requests -->
<pto-calendar
  month="0"
  year="2024"
  pto-entries="[]"
  readonly="false"
  selected-month="0"
>
</pto-calendar>
```

## Attributes

- `month`: Month number (0-11) to display
- `year`: Year to display
- `pto-entries`: JSON array of PTO entries
- `selected-month`: Month for selection mode
- `readonly`: Boolean to disable selection

## Data Structures

```typescript
type PTOEntry = {
  id: number;
  employeeId: number;
  date: string; // YYYY-MM-DD format
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string;
  approved_by?: number | null; // Admin ID who approved, null = pending
};

type CalendarEntry = {
  date: string;
  hours: number;
  type: string;
};
```

## PTO Types and Colors

- **PTO**: Vacation time (`--color-pto-vacation`)
- **Sick**: Sick leave (`--color-pto-sick`)
- **Bereavement**: Bereavement leave (`--color-pto-bereavement`)
- **Jury Duty**: Jury duty (`--color-pto-jury-duty`)

## Approval Indicators

Approved PTO entries are visually indicated with a green checkmark (✓) positioned in the top-right corner of the day cell. The checkmark uses the `--color-success` design token for consistent theming.

- **Appearance**: Small green checkmark (✓) in top-right corner
- **Condition**: Appears when at least one PTO entry for the day has `approved_by` set
- **Styling**: Uses semantic success color from design tokens
- **Accessibility**: Visual indicator only (no screen reader text added)

## Features

- **Date Selection**: Click dates to add/remove PTO entries
- **Type Switching**: Change PTO type for selections
- **Visual Feedback**: Hover states and selection indicators
- **Weekend Handling**: Proper weekend date calculations
- **Business Logic**: Integrates with PTO validation rules

## Theming Implementation

### CSS Custom Properties Used

- `--color-pto-vacation`: PTO entry background
- `--color-pto-sick`: Sick leave background
- `--color-pto-bereavement`: Bereavement background
- `--color-pto-jury-duty`: Jury duty background
- `--color-surface`: Calendar background
- `--color-text`: Date text color
- `--color-border`: Calendar borders
- `--color-primary`: Selection indicators
- `--color-secondary`: Header backgrounds

### Theme Integration

- Automatic adaptation to light/dark themes
- Consistent PTO type color coding
- Proper contrast for date visibility

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup
- **Calendar Logic**: Custom date calculations and grid rendering
- **Selection State**: Tracks selected dates and PTO types
- **Event Handling**: Click events for date selection
- **Business Rules**: Integrates with shared PTO validation logic</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-calendar/README.md

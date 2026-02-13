# PTO Card Component

A web component for displaying PTO (Paid Time Off) information with approval indicators.

## Features

- Displays PTO allowance, used hours, and remaining balance
- Green checkbox beside "Used" when all PTO time is approved
- Expandable details showing individual PTO entries by date
- Clickable dates for calendar navigation
- Responsive design for mobile devices

## Usage

```html
<pto-pto-card
  data='{"allowed": 80, "used": 24, "remaining": 56}'
  entries='[{"date": "2026-01-15", "hours": 8}, {"date": "2026-01-16", "hours": 8}]'
  full-entries='[{"id": 1, "employeeId": 1, "date": "2026-01-15", "type": "PTO", "hours": 8, "createdAt": "2026-01-01T00:00:00Z", "approved_by": 3}]'
></pto-pto-card>
```

## Attributes

- `data`: JSON string containing PTO bucket data
  - `allowed`: Total PTO hours allowed (number)
  - `used`: PTO hours already used (number)
  - `remaining`: PTO hours remaining (number)
- `entries`: JSON array of usage entries for display
  - `date`: Date string in YYYY-MM-DD format
  - `hours`: Hours used on that date (number)
- `full-entries`: JSON array of full PTOEntry objects with approval status
- `expanded`: Boolean attribute to control initial expansion state

## Data Structures

### PTOEntry

```typescript
interface PTOEntry {
  id: number;
  employeeId: number;
  date: string; // YYYY-MM-DD format
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string; // ISO date string
  approved_by?: number | null; // Admin ID who approved, null = pending
}
```

## Events

- `navigate-to-month`: Fired when a date is clicked
  - `detail.month`: Month number (0-11)
  - `detail.year`: Year number

## Styling

The component uses shared PTO card CSS with the following approval indicator:

```css
.card .label.approved::after {
  content: " ✓";
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}
```

## Approval Indicators

Green checkmark (✓) appears after the word 'Used' (displayed as 'Used ✓') when all PTO entries are approved. The checkmark is rendered via CSS using the `approved` class.

## Dependencies

- `SimplePtoBucketCard` base class
- `PTO_CARD_CSS` shared styles
- Date utility functions from `shared/dateUtils.js`
- PTOEntry type from `shared/api-models.js`

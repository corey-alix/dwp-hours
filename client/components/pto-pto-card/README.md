# Scheduled Time Off Card Component

A unified web component that displays all scheduled time off entries (PTO, Sick, Bereavement, Jury Duty) in a single reverse-chronological table with color-coded hours and approval indicators.

## Features

- Displays all PTO types in a single expandable table
- Color-coded hours by PTO type (vacation, sick, bereavement, jury duty)
- Green checkmark (✓) for approved entries
- Expandable details with "Show Details" toggle
- Clickable dates for calendar navigation
- Responsive design for mobile devices

## Usage

```html
<pto-pto-card></pto-pto-card>
```

```typescript
const card = document.querySelector<PtoPtoCard>("pto-pto-card");
card.fullPtoEntries = [
  {
    id: 1,
    employeeId: 1,
    date: "2026-02-20",
    type: "PTO",
    hours: 8,
    createdAt: "2026-01-01T00:00:00Z",
    approved_by: 3,
  },
  {
    id: 2,
    employeeId: 1,
    date: "2026-02-13",
    type: "Sick",
    hours: 8,
    createdAt: "2026-01-01T00:00:00Z",
    approved_by: 3,
  },
  {
    id: 3,
    employeeId: 1,
    date: "2026-06-12",
    type: "Bereavement",
    hours: 8,
    createdAt: "2026-01-01T00:00:00Z",
    approved_by: null,
  },
];
```

## Properties (Complex)

| Property         | Type         | Default | Description                                       |
| ---------------- | ------------ | ------- | ------------------------------------------------- |
| `fullPtoEntries` | `PTOEntry[]` | `[]`    | All PTO entries to display (all types, all dates) |

## Attributes (Primitives)

| Attribute  | Type    | Default   | Description                              |
| ---------- | ------- | --------- | ---------------------------------------- |
| `expanded` | boolean | `"false"` | Controls the expand/collapse detail view |

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

## Table Columns

| Column | Description                                           |
| ------ | ----------------------------------------------------- |
| Date   | Clickable date link (navigates to calendar month)     |
| Type   | PTO type label                                        |
| Hours  | Hours value, color-coded by type with approval marker |

## Events

- `navigate-to-month`: Fired when a date is clicked
  - `detail.month`: Month number (0-11)
  - `detail.year`: Year number

## Color Coding

Hours are color-coded by PTO type using design tokens:

- PTO: `--color-pto-vacation`
- Sick: `--color-pto-sick`
- Bereavement: `--color-pto-bereavement`
- Jury Duty: `--color-pto-jury-duty`

## Consumers

- `<current-year-summary-page>` — unified detail card showing all scheduled time off for the year

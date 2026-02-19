# PTO Calendar Component

## Overview

The `<pto-calendar>` component provides a monthly calendar view for displaying and selecting PTO entries. It extends `BaseComponent` (Shadow DOM with delegated event handling) and supports read-only display mode and interactive selection mode with hour cycling, clearing, and PTO type selection.

## Features

- **Monthly View**: Displays a full month calendar grid with Sun–Sat columns
- **PTO Visualization**: Color-coded day cells by PTO type
- **Hour Cycling**: Click a day to cycle hours: 8 → 4 → 0 (clear) → 8
- **Visual Hour Indicators**: ● full day (8h), ○ partial day (<8h), ✕ clearing an existing entry
- **Approval Indicators**: Green checkmark (✓) in top-right corner for approved entries
- **Clearing State**: Setting an existing entry to 0h shows ✕ with line-through styling
- **Keyboard Navigation**: Arrow keys to move focus, Enter/Space to toggle selection
- **Read-only Mode**: Display-only mode when `readonly` is not `"false"`
- **Legend with PTO Type Selection**: Clickable/keyboard-navigable legend for choosing PTO type
- **Slot Support**: Named slots for `balance-summary` and `submit` content

## Usage

```html
<!-- Read-only calendar -->
<pto-calendar month="1" year="2024" readonly="true"></pto-calendar>

<!-- Interactive calendar -->
<pto-calendar month="7" year="2024" readonly="false">
  <div slot="balance-summary"><!-- balance content --></div>
  <button slot="submit">Submit PTO Request</button>
</pto-calendar>
```

PTO entries and other complex values are set via JavaScript properties, not attributes:

```typescript
const calendar = document.querySelector("pto-calendar") as PtoCalendar;
calendar.ptoEntries = [
  {
    id: 1,
    employeeId: 10,
    date: "2024-07-15",
    type: "PTO",
    hours: 8,
    createdAt: "...",
  },
];
calendar.setReadonly(false); // Also sets default PTO type to "PTO"
```

## Observed Attributes

| Attribute        | Type   | Default   | Description                                      |
| ---------------- | ------ | --------- | ------------------------------------------------ |
| `month`          | number | `1`       | Month to display (1-indexed: 1 = January)        |
| `year`           | number | `2024`    | Year to display                                  |
| `selected-month` | number | `null`    | Currently selected month (or `"null"`)           |
| `readonly`       | string | `"true"`  | Set to `"false"` to enable interactive selection |
| `hide-legend`    | string | `"false"` | Set to `"true"` to hide the PTO type legend      |

Changing `month` or `year` resets the focused date. Setting `readonly` to `"false"` auto-selects "PTO" as the default type if none is set.

## Data Structures

```typescript
interface PTOEntry {
  id: number;
  employeeId: number;
  date: string; // YYYY-MM-DD format
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string;
  approved_by?: number | null; // Admin ID who approved, null = pending
}

interface CalendarEntry {
  date: string;
  hours: number;
  type: string;
  id?: number; // Present when modifying an existing entry
}
```

## Public API

### Properties

| Property          | Type                  | Description                                     |
| ----------------- | --------------------- | ----------------------------------------------- |
| `ptoEntries`      | `PTOEntry[]`          | Get/set PTO entries; setting triggers re-render |
| `selectedCells`   | `Map<string, number>` | Read-only map of selected dates → hours         |
| `selectedPtoType` | `string \| null`      | Get/set the currently active PTO type           |

### Methods

| Method                    | Returns           | Description                                                    |
| ------------------------- | ----------------- | -------------------------------------------------------------- |
| `getSelectedRequests()`   | `CalendarEntry[]` | Returns pending selections with date, hours, type, and id      |
| `clearSelection()`        | `void`            | Clears all selections and resets PTO type to null              |
| `submitRequest()`         | `void`            | Validates and dispatches `pto-request-submit` event            |
| `setReadonly(value)`      | `void`            | Sets readonly; auto-selects "PTO" type when entering edit mode |
| `setPtoEntries(entries)`  | `void`            | Sets PTO entries and triggers re-render                        |
| `setMonth(month)`         | `void`            | Sets display month (1-indexed)                                 |
| `setYear(year)`           | `void`            | Sets display year                                              |
| `setSelectedMonth(month)` | `void`            | Sets selected month                                            |

## Events

| Event                  | Detail                          | Description                                       |
| ---------------------- | ------------------------------- | ------------------------------------------------- |
| `selection-changed`    | _(none)_                        | Fired after every selection modification or clear |
| `pto-request-submit`   | `{ requests: CalendarEntry[] }` | Fired on valid submit                             |
| `pto-validation-error` | `{ errors: string[] }`          | Fired when validation fails on submit             |

All events use `bubbles: true` and `composed: true` to cross Shadow DOM boundaries.

## Day Selection Behavior

### With a PTO type selected (PTO, Sick, Bereavement, Jury Duty)

1. **First click**: Selects the date with 8 hours
2. **Second click**: Cycles to 4 hours (partial day)
3. **Third click**: Cycles to 0 hours — if the date has an existing entry, it enters **clearing state** (✕); otherwise the selection is removed
4. **Fourth click**: Cycles back to 8 hours

### With no PTO type selected

Clicking a date with an existing entry selects it for editing, inheriting the entry's type and hours, then cycling on subsequent clicks.

## Visual Indicators

| Symbol | Meaning                                        |
| ------ | ---------------------------------------------- |
| ●      | Full day (8+ hours)                            |
| ○      | Partial day (<8 hours)                         |
| ✕      | Clearing an existing entry (selected with 0h)  |
| ✓      | Approved entry (checkmark in top-right corner) |

When a cell is selected, the indicator reflects the **pending selection hours**, not the original entry hours. This gives immediate visual feedback during hour cycling.

## Keyboard Navigation

### Legend (PTO type list)

- **Arrow Right/Down**: Move to next type
- **Arrow Left/Up**: Move to previous type
- **Enter/Space**: Toggle type selection
- Uses `role="listbox"` with `role="option"` items and `aria-selected`

### Calendar Grid

- **Arrow keys**: Move focus between weekday cells (skips weekends and out-of-month dates)
- **Enter/Space**: Toggle day selection (same as click)
- Uses roving tabindex pattern (`tabindex="0"` on focused cell, `"-1"` on others)

## Approval Indicators

- **Appearance**: Green checkmark (✓) in top-right corner of the day cell
- **Condition**: Appears when at least one PTO entry for the day has `approved_by` set to a non-null value
- **Styling**: Uses `--color-success` design token

## PTO Types and Colors

Colors are defined in `css.ts` via `PTO_TYPE_COLORS` and mapped to CSS custom properties:

- **PTO**: Vacation time (`--color-pto-vacation`)
- **Sick**: Sick leave (`--color-pto-sick`)
- **Bereavement**: Bereavement leave (`--color-pto-bereavement`)
- **Jury Duty**: Jury duty (`--color-pto-jury-duty`)

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup via `BaseComponent`
- **Delegated Events**: Click and keydown events handled via `handleDelegatedClick` / `handleDelegatedKeydown`
- **Targeted Day Update**: `updateDay()` patches a single day cell in-place (avoids full re-render) with a pulse animation on change
- **Business Rule Validation**: Uses `validateHours`, `validateWeekday`, and `validatePTOType` from `shared/businessRules.ts` on submit
- **Date Utilities**: Uses `getCalendarDates`, `isInMonth`, `parseDate`, `isWeekend` from `shared/dateUtils.ts`</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-calendar/README.md

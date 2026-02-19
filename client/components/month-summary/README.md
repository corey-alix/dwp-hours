# Month Summary Component

A reusable web component that displays PTO hour totals grouped by type (PTO, Sick, Bereavement, Jury Duty) with optional pending-delta indicators.

## Tag

```html
<month-summary></month-summary>
```

## Attributes (Primitives)

| Attribute           | Type   | Default | Description             |
| ------------------- | ------ | ------- | ----------------------- |
| `pto-hours`         | number | `0`     | Total PTO hours         |
| `sick-hours`        | number | `0`     | Total Sick hours        |
| `bereavement-hours` | number | `0`     | Total Bereavement hours |
| `jury-duty-hours`   | number | `0`     | Total Jury Duty hours   |

## Properties (Complex)

| Property | Type                     | Default | Description                                                                                                                                                                 |
| -------- | ------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deltas` | `Record<string, number>` | `{}`    | Pending hour deltas keyed by PTO type name (e.g. `"PTO"`, `"Sick"`, `"Bereavement"`, `"Jury Duty"`). Non-zero values render a `+N` / `-N` indicator next to the base hours. |

## Usage

### Basic (attribute-driven)

```html
<month-summary
  pto-hours="16"
  sick-hours="8"
  bereavement-hours="0"
  jury-duty-hours="0"
></month-summary>
```

### With pending deltas (property-driven)

```typescript
const summary = document.querySelector("month-summary");
summary.deltas = { PTO: 8, Sick: -4 };
```

### Inside a parent component template

```typescript
private renderMonth(monthData): string {
  return `
    <div class="month-card">
      <!-- calendar content -->
      <month-summary
        pto-hours="${monthData.summary.ptoHours}"
        sick-hours="${monthData.summary.sickHours}"
        bereavement-hours="${monthData.summary.bereavementHours}"
        jury-duty-hours="${monthData.summary.juryDutyHours}"
      ></month-summary>
    </div>
  `;
}
```

## Styling

The component uses Shadow DOM encapsulation. Host element renders as a flex row. It inherits the following CSS custom properties from `tokens.css`:

- `--color-surface-hover` — background
- `--color-border` — top border
- `--color-text-secondary` — default text color
- `--color-pto-vacation` — PTO value color
- `--color-pto-sick` — Sick value color
- `--color-pto-bereavement` — Bereavement value color
- `--color-pto-jury-duty` — Jury Duty value color

## Consumers

- `<current-year-pto-scheduler>` — uses attributes + `deltas` property for live editing feedback
- `<prior-year-review>` — uses attributes only (read-only view)
- `<pto-summary-card>` — slotted via `balance-summary` slot to display remaining available hours per PTO type on the Submit Time Off page

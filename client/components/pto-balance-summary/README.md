# PTO Balance Summary Component

A compact, at-a-glance web component that displays remaining (or exceeded) hours for each PTO category.

## Usage

### Standalone (leaf component)

```html
<pto-balance-summary id="balance"></pto-balance-summary>

<script type="module">
  const el = document.querySelector("#balance");
  el.setBalanceData({
    employeeId: 1,
    employeeName: "John Doe",
    categories: [
      { category: "PTO", remaining: 32 },
      { category: "Sick", remaining: 8 },
      { category: "Bereavement", remaining: 40 },
      { category: "Jury Duty", remaining: -4 },
    ],
  });
</script>
```

### Slot-based integration (in parent components)

Parent component declares the slot:

```typescript
protected render(): string {
  return `
    <div class="card">
      <!-- card content -->
      <slot name="balance-summary"></slot>
    </div>
  `;
}
```

Consumer composes in light DOM:

```html
<pto-accrual-card>
  <pto-balance-summary slot="balance-summary"></pto-balance-summary>
</pto-accrual-card>
```

### Per-employee embedding (in employee-list)

Inside `employee-list`, a `<pto-balance-summary>` is rendered per card. The parent calls `setBalanceData()` on each instance after render:

```typescript
const summaries = this.shadowRoot.querySelectorAll("pto-balance-summary");
summaries.forEach((el) => {
  const empId = el.getAttribute("data-employee-id");
  el.setBalanceData(balanceDataForEmployee(empId));
});
```

## API

| Method                                 | Description                              |
| -------------------------------------- | ---------------------------------------- |
| `setBalanceData(data: PtoBalanceData)` | Sets balance data and triggers re-render |

## Data Model

```typescript
interface PtoBalanceCategoryItem {
  category: PTOType; // "PTO" | "Sick" | "Bereavement" | "Jury Duty"
  remaining: number; // positive = available, negative = exceeded
}

interface PtoBalanceData {
  employeeId: number;
  employeeName: string;
  categories: PtoBalanceCategoryItem[];
}
```

## Visual Behavior

- Positive remaining values: badge value shown in `--color-success`
- Negative remaining values: badge value shown in `--color-error`
- Zero remaining: treated as available (`--color-success`)
- Null data: shows "No balance data" placeholder
- Empty categories: shows "No categories" placeholder

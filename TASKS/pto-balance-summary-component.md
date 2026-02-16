# PTO Balance Summary Component

## Description

Implement a new web component called `pto-balance-summary` that displays the amount of available time remaining (or exceeded) in each PTO category. This component will be rendered in a summary area at the bottom of the `admin-monthly-review` component and slotted into various other components including `pto-calendar`, `employee-form`, `employee-list`, `pto-employee-info-card`, `pto-request-queue`, `pto-summary-card`, and `pto-accrual-card`.

The component will show positive values styled with the semantic `--color-success` token for remaining time and negative values styled with the semantic `--color-error` token for exceeded time, providing an at-a-glance visual indicator of PTO balances across categories. This is designed for managers to quickly spot employees who have exceeded available time, and for employees to see what remains before scheduling.

The component accepts a bespoke data model (`PtoBalanceData`) rather than reusing existing API models. Within `employee-list`, a `pto-balance-summary` instance will be rendered per-employee inside each employee card.

## Priority

🟢 Low Priority

## Relevant Skills

Before implementing, read these skill files for binding project conventions:

- `.github/skills/web-components-assistant/SKILL.md` — BaseComponent patterns, render() contract, named slots, event delegation, testing patterns
- `.github/skills/css-theming-assistant/SKILL.md` — semantic token naming, `var()` usage, light/dark theme support
- `.github/skills/atomic-css/SKILL.md` — utility class conventions (note: atomic classes do NOT penetrate shadow DOM)
- `.github/skills/staged-action-plan/SKILL.md` — validation criteria per phase
- `.github/skills/vitest-testing-assistant/SKILL.md` — unit test conventions, seedData usage
- `.github/skills/playwright-testing-assistant/SKILL.md` — E2E test structure, `test.step()` usage

## Checklist

### Phase 0: Prerequisite — Migrate `employee-list` to `BaseComponent`

The `employee-list` component currently extends raw `HTMLElement` with imperative rendering (`this.shadow.innerHTML = ...`) and manual event listener setup. It must be migrated to `BaseComponent` before per-employee rendering can work cleanly.

- [ ] Refactor `EmployeeList` to extend `BaseComponent` instead of `HTMLElement`
- [ ] Remove manual `this.shadow = this.attachShadow(...)` (handled by `BaseComponent` constructor)
- [ ] Convert `render()` from imperative `this.shadow.innerHTML = ...` to declarative `return templateString` pattern
- [ ] Replace manual `setupEventListeners()` with `handleDelegatedClick()` override for action button clicks
- [ ] Override `setupEventDelegation()` with a `_customEventsSetup` guard to add the `input` event listener for search filtering (click and submit are handled by BaseComponent, but `input` is not):
  ```typescript
  private _customEventsSetup = false;
  protected setupEventDelegation() {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;
    this.shadowRoot.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      if (target.id === "search-input") {
        this._searchTerm = (target as HTMLInputElement).value;
        this.requestUpdate(); // reactive, not imperative
      }
    });
  }
  ```
- [ ] Convert `filterEmployees()` from imperative DOM-query toggling (`.classList.add("hidden")`) to a reactive pattern: filter `_employees` by `_searchTerm` in `render()` and let the template reflect the filtered list. Remove all `querySelectorAll(".employee-card")` usage.
- [ ] Replace all `this.render()` calls with `this.requestUpdate()`
- [ ] Replace all `this.shadow` references with `this.shadowRoot`
- [ ] Verify existing `<slot name="top-content">` still works after migration
- [ ] Run existing E2E tests to confirm no regressions: `pnpm run test:e2e`
- [ ] Run build and lint: `pnpm run build && pnpm run lint`

**Validation**: `pnpm run build` passes, `pnpm run lint` passes, all existing E2E tests pass, employee list renders and search works in browser.

### Phase 1: Component Design and Planning

- [ ] Define bespoke `PtoBalanceData` model in `shared/api-models.ts`:

  ```typescript
  import type { PTOType } from "./businessRules.js";

  export interface PtoBalanceCategoryItem {
    category: PTOType; // "PTO" | "Sick" | "Bereavement" | "Jury Duty"
    remaining: number; // positive = available, negative = exceeded
  }
  export interface PtoBalanceData {
    employeeId: number;
    employeeName: string;
    categories: PtoBalanceCategoryItem[];
  }
  ```

- [ ] Define component API:
  - **Properties**: `PtoBalanceData` (set via `setBalanceData()` method)
  - **Events**: none (display-only component)
  - **Slots**: none (leaf component — no children)
- [ ] Design compact at-a-glance layout: horizontal row of category badges, each showing category name and remaining hours value

**Validation**: Interfaces compile without errors (`pnpm run build`).

### Phase 2: Core Component Implementation

Create the following files:

```
client/components/pto-balance-summary/
├── index.ts      # Component class + customElements.define()
├── test.html     # Manual test page
├── test.ts       # Playground function
└── README.md     # Usage documentation
```

- [ ] Create `client/components/pto-balance-summary/index.ts` with this skeleton:

  ```typescript
  import { BaseComponent } from "../base-component.js";
  import type { PtoBalanceData } from "../../../shared/api-models.js";

  export class PtoBalanceSummary extends BaseComponent {
    private _data: PtoBalanceData | null = null;

    setBalanceData(data: PtoBalanceData): void {
      this._data = data;
      this.requestUpdate();
    }

    protected render(): string {
      if (!this._data) {
        return `<style>${STYLES}</style><div class="empty">No balance data</div>`;
      }
      return `
        <style>${STYLES}</style>
        <div class="balance-row">
          ${this._data.categories.map((cat) => this.renderCategory(cat)).join("")}
        </div>
      `;
    }

    private renderCategory(cat: PtoBalanceCategoryItem): string {
      const statusClass =
        cat.remaining >= 0 ? "balance-available" : "balance-exceeded";
      return `
        <span class="balance-badge ${statusClass}">
          <span class="badge-label">${cat.category}</span>
          <span class="badge-value">${cat.remaining}h</span>
        </span>
      `;
    }
  }

  customElements.define("pto-balance-summary", PtoBalanceSummary);
  ```

- [ ] Define `STYLES` constant with CSS using only `var()` token references — no hardcoded colors:
  - `.balance-available` → `color: var(--color-success)`
  - `.balance-exceeded` → `color: var(--color-error)`
  - `.balance-badge` → `padding: var(--space-xs) var(--space-sm)`, `border-radius: var(--border-radius)`, `font-size: var(--font-size-xs)`
  - `.balance-row` → `display: flex; gap: var(--space-sm); flex-wrap: wrap`
- [ ] Add ARIA attributes for accessibility: `role="status"` on container, `aria-label` on each badge
- [ ] Create `test.html` following project pattern:
  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PTO Balance Summary Test</title>
      <link rel="stylesheet" href="../../styles.css" />
    </head>
    <body>
      <h1>PTO Balance Summary Component Test</h1>
      <div id="test-output"></div>
      <pto-balance-summary id="pto-balance-summary"></pto-balance-summary>
      <debug-console></debug-console>
      <script type="module">
        import { ptoBalanceSummary } from "/app.js";
        ptoBalanceSummary();
      </script>
    </body>
  </html>
  ```
- [ ] Create `test.ts` playground using `seedData.ts` to compute mock `PtoBalanceData`:

  ```typescript
  import { querySingle } from "../test-utils.js";
  import type { PtoBalanceSummary } from "./index.js";
  import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";
  import type { PtoBalanceData } from "../../../shared/api-models.js";

  export function playground() {
    console.log("Starting PTO Balance Summary playground...");
    const component = querySingle<PtoBalanceSummary>("pto-balance-summary");

    // Build mock PtoBalanceData from seedData
    const mockData: PtoBalanceData = {
      employeeId: 1,
      employeeName: seedEmployees[0].name,
      categories: [
        { category: "PTO", remaining: 32 },
        { category: "Sick", remaining: 8 },
        { category: "Bereavement", remaining: 40 },
        { category: "Jury Duty", remaining: -4 }, // exceeded example
      ],
    };
    component.setBalanceData(mockData);
    console.log("PTO Balance Summary playground initialized");
  }
  ```

**Validation**: Component renders in `test.html` with all four category badges. Positive values show in success color, negative in error color. `pnpm run build` passes.

### Phase 3: Data Integration

The component does NOT compute balances — it receives pre-computed `PtoBalanceData` via `setBalanceData()`. The parent/orchestrator is responsible for computing remaining values using business rules and API data.

- [ ] Ensure `setBalanceData()` calls `this.requestUpdate()` (already in skeleton)
- [ ] Handle all four PTO categories: PTO, Sick, Bereavement, Jury Duty
- [ ] Display only remaining/exceeded value per category (no annual limits or breakdowns — at-a-glance only)
- [ ] Handle edge cases in `render()`: null data (loading state), empty categories array, zero remaining

**Validation**: Component gracefully handles null data, empty arrays, zero values, and negative values.

### Phase 4: Integration with Admin Monthly Review

- [ ] Add `<slot name="balance-summary">` to the `admin-monthly-review` component's `render()` method, positioned after the `.employee-grid` section
- [ ] In the parent that composes `admin-monthly-review`, provide `<pto-balance-summary slot="balance-summary">` in light DOM and inject data via `setBalanceData()`
- [ ] Test rendering within admin monthly review context on its `test.html`

**Validation**: Balance summary renders at the bottom of admin monthly review. Data updates when month selector changes.

### Phase 5: Integration with Other Components

**Slot-based integration** (parent declares slot, consumer composes in light DOM):

- [ ] `pto-calendar`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [ ] `employee-form`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [ ] `pto-employee-info-card`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [ ] `pto-request-queue`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [ ] `pto-summary-card`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [ ] `pto-accrual-card`: Add `<slot name="balance-summary"></slot>` to its `render()` template

**Per-employee embedding in `employee-list`** (exception to "Named Slots Over Component Embedding" rule):

- [ ] Render `<pto-balance-summary>` inside each `renderEmployeeCard()` template in `employee-list`. This is an intentional exception: slots cannot repeat per-item inside a rendered list. The parent component must imperatively call `setBalanceData()` on each instance after render via `shadowRoot.querySelectorAll("pto-balance-summary")`.
  ```typescript
  // Inside renderEmployeeCard():
  private renderEmployeeCard(employee: Employee): string {
    return `
      <div class="employee-card" data-employee-id="${employee.id}">
        <!-- existing card content -->
        <pto-balance-summary data-employee-id="${employee.id}"></pto-balance-summary>
      </div>
    `;
  }
  ```

> **Design note**: For list components that render N repeated items, there is no clean slot-based way to inject per-item child components. Embedding `<pto-balance-summary>` in the card template is the pragmatic approach. The component remains independently testable via its `setBalanceData()` API.

**Validation**: Each target component renders the balance summary in the expected position. Per-employee cards in `employee-list` each show their own balance data.

### Phase 6: Testing and Validation

**Unit tests** — create `tests/components/pto-balance-summary.test.ts`:

- [ ] Use `// @vitest-environment happy-dom` directive
- [ ] Import component and `seedData.ts` for mock data
- [ ] Test: renders empty state when no data is set
- [ ] Test: renders all four category badges when `setBalanceData()` is called
- [ ] Test: applies `balance-available` class when `remaining >= 0`
- [ ] Test: applies `balance-exceeded` class when `remaining < 0`
- [ ] Test: displays correct hours value in badge text
- [ ] Test: handles zero remaining gracefully (should show `balance-available`)
- [ ] **Never call `render()` directly** — always use `setBalanceData()` which calls `requestUpdate()`

**E2E tests** — create `e2e/component-pto-balance-summary.spec.ts`:

- [ ] Test: component renders on its own `test.html` page
- [ ] Test: visual appearance with mixed positive/negative values (screenshot test)
- [ ] Use `test.step()` for logical grouping of actions

**Validation**: `pnpm run test:unit` passes, `pnpm run test:e2e` passes.

### Phase 7: Registration and Integration

- [ ] `customElements.define('pto-balance-summary', PtoBalanceSummary)` — place at the bottom of `index.ts` (already in skeleton)
- [ ] Add to `client/components/index.ts`:
  ```typescript
  export { PtoBalanceSummary } from "./pto-balance-summary/index.js";
  ```
- [ ] Add to `client/components/test.ts`:
  ```typescript
  // At top with other imports:
  import { playground as ptoBalanceSummary } from "./pto-balance-summary/test.js";
  // In the export block:
  export { /* ...existing exports... */ ptoBalanceSummary };
  ```

**Validation**: `pnpm run build` passes. Component is importable from `app.js`. `test.html` loads and renders the component.

### Phase 8: Documentation and Quality Gates

- [ ] Create `client/components/pto-balance-summary/README.md` with usage examples showing both slot-based and embedded usage patterns
- [ ] Ensure `pnpm run build` passes
- [ ] Ensure `pnpm run lint` passes
- [ ] Manual testing across all integrated components in their `test.html` pages
- [ ] Code review for adherence to project standards

**Validation**: All quality gates pass. README documents the component API, data model, and integration pattern.

## Implementation Notes

- **BaseComponent required**: Extend `BaseComponent`, not `HTMLElement`. Use `render()` as a pure template method returning a string. Trigger re-renders via `requestUpdate()`, never by calling `render()` directly.
- **Declarative render()**: The `render()` method must be a pure template function with no side effects. Extract complex sections into helper methods that return partial template strings.
- **CSS custom properties only**: Use `var()` references to tokens from `client/tokens.css`. No hardcoded colors, spacing, or font sizes. Atomic CSS utility classes from `client/atomic.css` do NOT penetrate shadow DOM — they are only usable in light DOM. Inside shadow DOM, reference the underlying CSS custom properties directly.
- **Semantic over stylistic**: Use `--color-success` / `--color-error`, never "green" / "red".
- **Static imports only**: Never use `await import()`. All imports must be static at the top of the file.
- **No direct API calls**: The component receives pre-computed data via `setBalanceData()`. Parent components are responsible for computing `PtoBalanceData` from API responses and business rules.
- **Date handling**: If any date operations are needed, use `shared/dateUtils.ts` exclusively — never `new Date()`.
- **Accessibility**: Add `role="status"` on the container, `aria-label` on badges describing the value and category.
- **Test data**: Use `shared/seedData.ts` for all test mocking — never hardcode test data.
- **TypeScript strict mode**: No `as any` casts. Use the `PtoBalanceSummary` type for DOM queries via `querySingle<PtoBalanceSummary>()`.

## Questions and Concerns

_Resolved:_

1. ✅ `employee-list` will be migrated to `BaseComponent` as a prerequisite (Phase 0).
2. ✅ Per-employee placement — one `pto-balance-summary` per employee card row.
3. ✅ Bespoke `PtoBalanceData` model with pre-computed remaining values per category.
4. ✅ At-a-glance only — show remaining/exceeded value, no annual limits or "used / limit" breakdown.
5. ✅ `employee-list` per-item embedding is an intentional exception to the "Named Slots Over Component Embedding" rule — slots cannot repeat per-item in dynamic lists.

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

- [x] Refactor `EmployeeList` to extend `BaseComponent` instead of `HTMLElement`
- [x] Remove manual `this.shadow = this.attachShadow(...)` (handled by `BaseComponent` constructor)
- [x] Convert `render()` from imperative `this.shadow.innerHTML = ...` to declarative `return templateString` pattern
- [x] Replace manual `setupEventListeners()` with `handleDelegatedClick()` override for action button clicks
- [x] Override `setupEventDelegation()` with a `_customEventsSetup` guard to add the `input` event listener for search filtering (click and submit are handled by BaseComponent, but `input` is not):
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
- [x] Convert `filterEmployees()` from imperative DOM-query toggling (`.classList.add("hidden")`) to a reactive pattern: filter `_employees` by `_searchTerm` in `render()` and let the template reflect the filtered list. Remove all `querySelectorAll(".employee-card")` usage.
- [x] Replace all `this.render()` calls with `this.requestUpdate()`
- [x] Replace all `this.shadow` references with `this.shadowRoot`
- [x] Verify existing `<slot name="top-content">` still works after migration
- [x] Run existing E2E tests to confirm no regressions: `pnpm run test:e2e`
- [x] Run build and lint: `pnpm run build && pnpm run lint`

**Validation**: `pnpm run build` passes, `pnpm run lint` passes, all existing E2E tests pass, employee list renders and search works in browser.

### Phase 1: Component Design and Planning

- [x] Define bespoke `PtoBalanceData` model in `shared/api-models.ts`:

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

- [x] Define component API:
  - **Properties**: `PtoBalanceData` (set via `setBalanceData()` method)
  - **Events**: none (display-only component)
  - **Slots**: none (leaf component — no children)
- [x] Design compact at-a-glance layout: horizontal row of category badges, each showing category name and remaining hours value

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

- [x] Create `client/components/pto-balance-summary/index.ts` with this skeleton:

  ```typescript
  import { BaseComponent } from "../base-component.js";
  import type {
    PtoBalanceData,
    PtoBalanceCategoryItem,
  } from "../../../shared/api-models.js";

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

- [x] Define `STYLES` constant with CSS using only `var()` token references — no hardcoded colors:
  - `.balance-available` → `color: var(--color-success)`
  - `.balance-exceeded` → `color: var(--color-error)`
  - `.balance-badge` → `padding: var(--space-xs) var(--space-sm)`, `border-radius: var(--border-radius)`, `font-size: var(--font-size-xs)`
  - `.balance-row` → `display: flex; gap: var(--space-sm); flex-wrap: wrap`
- [x] Add ARIA attributes for accessibility: `role="status"` on container, `aria-label` on each badge
- [x] Create `test.html` following project pattern:
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
- [x] Create `test.ts` playground using `seedData.ts` to compute mock `PtoBalanceData`:

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

- [x] Ensure `setBalanceData()` calls `this.requestUpdate()` (already in skeleton)
- [x] Handle all four PTO categories: PTO, Sick, Bereavement, Jury Duty
- [x] Display only remaining/exceeded value per category (no annual limits or breakdowns — at-a-glance only)
- [x] Handle edge cases in `render()`: null data (loading state), empty categories array, zero remaining

**Validation**: Component gracefully handles null data, empty arrays, zero values, and negative values.

### Phase 4: Integration with Admin Monthly Review

- [x] Add `<slot name="balance-summary">` to the `admin-monthly-review` component's `render()` method, positioned after the `.employee-grid` section
- [x] In the parent that composes `admin-monthly-review`, provide `<pto-balance-summary slot="balance-summary">` in light DOM and inject data via `setBalanceData()`
- [x] Test rendering within admin monthly review context on its `test.html`

**Validation**: Balance summary renders at the bottom of admin monthly review. Data updates when month selector changes.

### Phase 5: Integration with Other Components

**Slot-based integration** (parent declares slot, consumer composes in light DOM):

- [x] `pto-calendar`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [x] `employee-form`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [x] `pto-employee-info-card`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [x] `pto-request-queue`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [x] `pto-summary-card`: Add `<slot name="balance-summary"></slot>` to its `render()` template
- [x] `pto-accrual-card`: Add `<slot name="balance-summary"></slot>` to its `render()` template

**Per-employee embedding in `employee-list`** (exception to "Named Slots Over Component Embedding" rule):

- [x] Render `<pto-balance-summary>` inside each `renderEmployeeCard()` template in `employee-list`. This is an intentional exception: slots cannot repeat per-item inside a rendered list. The parent component must imperatively call `setBalanceData()` on each instance after render via `shadowRoot.querySelectorAll("pto-balance-summary")`.
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
- [x] Modify `client/components/employee-list/test.ts` to compute and set `PtoBalanceData` for each employee's `<pto-balance-summary>` instance on the `test.html` page. Use `seedPTOEntries`, `seedEmployees`, and `BUSINESS_RULES_CONSTANTS` to calculate remaining hours per category (annual limit minus used hours from seed entries). After setting `employeeList.employees`, query `shadowRoot.querySelectorAll("pto-balance-summary")` and call `setBalanceData()` on each with computed data for that employee. Ensure at least one employee shows negative (exceeded) values by augmenting computed results if needed.

> **Design note**: For list components that render N repeated items, there is no clean slot-based way to inject per-item child components. Embedding `<pto-balance-summary>` in the card template is the pragmatic approach. The component remains independently testable via its `setBalanceData()` API.

**Validation**: Each target component renders the balance summary in the expected position. Per-employee cards in `employee-list` each show their own balance data. Verify on `client/components/employee-list/test.html` that each employee card displays a `<pto-balance-summary>` with computed balance data (including at least one with negative values).

### Phase 6: Testing and Validation

**Unit tests** — create `tests/components/pto-balance-summary.test.ts`:

- [x] Use `// @vitest-environment happy-dom` directive
- [x] Import component and `seedData.ts` for mock data
- [x] Test: renders empty state when no data is set
- [x] Test: renders all four category badges when `setBalanceData()` is called
- [x] Test: applies `balance-available` class when `remaining >= 0`
- [x] Test: applies `balance-exceeded` class when `remaining < 0`
- [x] Test: displays correct hours value in badge text
- [x] Test: handles zero remaining gracefully (should show `balance-available`)
- [x] **Never call `render()` directly** — always use `setBalanceData()` which calls `requestUpdate()`

**E2E tests** — create `e2e/component-pto-balance-summary.spec.ts`:

- [x] Test: component renders on its own `test.html` page
- [x] Test: visual appearance with mixed positive/negative values (screenshot test)
- [x] Use `test.step()` for logical grouping of actions

**Validation**: `pnpm run test:unit` passes, `pnpm run test:e2e` passes.

### Phase 7: Registration and Integration

- [x] `customElements.define('pto-balance-summary', PtoBalanceSummary)` — place at the bottom of `index.ts` (already in skeleton)
- [x] Add to `client/components/index.ts`:
  ```typescript
  export { PtoBalanceSummary } from "./pto-balance-summary/index.js";
  ```
- [x] Add to `client/components/test.ts`:
  ```typescript
  // At top with other imports:
  import { playground as ptoBalanceSummary } from "./pto-balance-summary/test.js";
  // In the export block:
  export { /* ...existing exports... */ ptoBalanceSummary };
  ```

**Validation**: `pnpm run build` passes. Component is importable from `app.js`. `test.html` loads and renders the component.

### Phase 8: Documentation and Quality Gates

- [x] Create `client/components/pto-balance-summary/README.md` with usage examples showing both slot-based and embedded usage patterns
- [x] Ensure `pnpm run build` passes
- [x] Ensure `pnpm run lint` passes
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
- **Date formatting in tests**: Tests should use `shared/dateUtils.ts` functions for date formatting instead of hard-coded date strings to ensure consistency with application formatting.

## Questions and Concerns

_Resolved:_

1. ✅ `employee-list` will be migrated to `BaseComponent` as a prerequisite (Phase 0).
2. ✅ Per-employee placement — one `pto-balance-summary` per employee card row.
3. ✅ Bespoke `PtoBalanceData` model with pre-computed remaining values per category.
4. ✅ At-a-glance only — show remaining/exceeded value, no annual limits or "used / limit" breakdown.
5. ✅ `employee-list` per-item embedding is an intentional exception to the "Named Slots Over Component Embedding" rule — slots cannot repeat per-item in dynamic lists.

_Discovered during implementation:_

6. ✅ **`api-models` is a `.d.ts` file, not `.ts`** — The shared model file is `shared/api-models.d.ts` (declaration file), not `shared/api-models.ts`. The `PtoBalanceData` interfaces will be added there. Import paths in component code use `../../../shared/api-models.js` which resolves correctly for both `.ts` and `.d.ts`.
7. ✅ **Phase 0 unit tests must be updated** — The existing `tests/components/employee-list.test.ts` tests the imperative `.hidden` class toggling pattern. After reactive migration (filtering in `render()`), filtered-out cards won't exist in DOM at all, so tests asserting `employeeCards?.length === 3` and `.classList.contains("hidden")` will break. Unit tests will be rewritten to match the reactive pattern (card count = filtered count, no `.hidden` class usage).
8. ✅ **Phase 0 must preserve `employee-submit` and `form-cancel` event forwarding** — The current `setupEventListeners()` forwards these custom events from the inline `<employee-form>` editor. These must be preserved in `setupEventDelegation()` with the `_customEventsSetup` guard pattern since they are custom events, not click/submit.
9. ✅ **`test.ts` playground imports `seedPTOEntries` but doesn't use it** — The skeleton in Phase 2 imports `seedPTOEntries` from seedData but only uses hardcoded mock values. Will remove the unused import and keep seedEmployees for `employeeName`.
10. ✅ **`test.ts` must compute `PtoBalanceData` from seed data, not inline mocks** — All playground `test.ts` files must derive their data from `seedData.ts` rather than hardcoding values. The `test.ts` should import `seedPTOEntries`, `seedEmployees`, and `BUSINESS_RULES_CONSTANTS`, then compute remaining hours per category per employee (annual limit minus used hours from seed entries). If the seed data does not naturally produce negative (exceeded) values, augment the computed result after retrieval rather than modifying `seedData.ts` (to avoid breaking other tests).
11. ✅ **`test.html` should declare multiple `<pto-balance-summary>` instances** — To visually verify various states (all positive, mixed, all exceeded, empty), `test.html` should include one element per seed employee plus an empty-state element. The `test.ts` playground populates each instance from computed seed data, ensuring at least one shows negative values.
12. ✅ **BUSINESS_RULES_CONSTANTS does not define PTO_ANNUAL_HOURS** — The constants only define ANNUAL_LIMITS.SICK (24) and ANNUAL_LIMITS.OTHER (40 for Bereavement/Jury Duty). For PTO balance calculation, assumed 80 hours annually (common standard). Used PTO: 80, Sick: 24, Bereavement: 40, Jury Duty: 40.

# Issue: Migrate PTO Card Components to BaseComponent with Declarative Rendering

## Issue Summary

The PTO card component hierarchy (`PtoSectionCard` → `SimplePtoBucketCard` → individual cards) extends `HTMLElement` directly and uses imperative DOM construction via `innerHTML` string concatenation in `render()` methods. This pattern is difficult to reason about, leaks event listeners on every re-render, and violates the project's `BaseComponent` architecture and the web-components-assistant specification.

## Design Decisions

These decisions were confirmed by the project owner and drive the migration plan:

1. **Flatten the hierarchy** — Eliminate `PtoSectionCard` and `SimplePtoBucketCard` base classes. Every card extends `BaseComponent` directly. Shared behavior is provided via exported utility functions and CSS constants, not inheritance.
2. **Shared CSS as TypeScript constants** — Keep card CSS as exported `string` constants in TypeScript files (e.g., `client/components/utils/pto-card-css.ts`). Do not use `.css` file imports or `adoptedStyleSheets`. esbuild bundles the TS constants into `app.js`.
3. **Named slots over component embedding** — `PtoAccrualCard` must not embed `<pto-calendar>` in its shadow DOM. Use `<slot name="calendar">` and let the consumer compose the calendar in light DOM.
4. **Approval checkmark unchanged** — The `✓` indicator pattern is fine as-is; no planned changes to account for.

## Previously Working

Components render correctly, but with these structural deficits:

- Event listeners are re-attached on every `render()` call without cleanup
- `render()` imperatively sets `innerHTML` rather than returning a declarative template string
- CSS is duplicated across `PTO_CARD_CSS` constant and `renderCard()` inline styles
- No event delegation — listeners are manually bound to queried DOM nodes after each render
- Deep nesting of imperative logic (`.map().join("")`, ternary chains, IIFEs inside template strings)
- Unnecessary two-level inheritance chain (`PtoSectionCard` → `SimplePtoBucketCard`) with shared state that could be flat

## Current Behavior

- `pto-bereavement-card/index.ts` is 150+ lines of interleaved HTML string construction, conditional logic, and manual event binding — hard to intuit at a glance
- Every `render()` call replaces `innerHTML` without cleaning up prior listeners → memory leaks
- No use of `requestUpdate()`, event delegation, or the reactive update cycle
- `this.render()` called directly from setters and `attributeChangedCallback`
- `PtoAccrualCard` creates `<pto-calendar>` inside its shadow DOM, tightly coupling the two components

## Expected Behavior

All PTO card components should:

1. Extend `BaseComponent` directly (not `PtoSectionCard` or `SimplePtoBucketCard`)
2. Implement `render()` as a **pure template method** returning a string — no side effects
3. Use `requestUpdate()` to trigger re-renders — never call `render()` directly
4. Use `handleDelegatedClick()` / `handleDelegatedKeydown()` for event handling
5. Prefer **declarative markup** over imperative DOM construction logic
6. Import shared card CSS from a TypeScript constant module
7. Use `<slot name="...">` for child component composition (e.g., calendar)

## Affected Components

| Component             | File                                                | Currently Extends     | Migration Target                           |
| --------------------- | --------------------------------------------------- | --------------------- | ------------------------------------------ |
| `PtoSectionCard`      | `client/components/utils/pto-card-base.ts`          | `HTMLElement`         | **Delete** — replace with shared utilities |
| `SimplePtoBucketCard` | `client/components/utils/pto-card-base.ts`          | `PtoSectionCard`      | **Delete** — replace with shared utilities |
| `PtoEmployeeInfoCard` | `client/components/pto-employee-info-card/index.ts` | `PtoSectionCard`      | `BaseComponent`                            |
| `PtoSummaryCard`      | `client/components/pto-summary-card/index.ts`       | `PtoSectionCard`      | `BaseComponent`                            |
| `PtoAccrualCard`      | `client/components/pto-accrual-card/index.ts`       | `PtoSectionCard`      | `BaseComponent` + named slots              |
| `PtoBereavementCard`  | `client/components/pto-bereavement-card/index.ts`   | `SimplePtoBucketCard` | `BaseComponent`                            |
| `PtoSickCard`         | `client/components/pto-sick-card/index.ts`          | `SimplePtoBucketCard` | `BaseComponent`                            |
| `PtoJuryDutyCard`     | `client/components/pto-jury-duty-card/index.ts`     | `SimplePtoBucketCard` | `BaseComponent`                            |
| `PtoPtoCard`          | `client/components/pto-pto-card/index.ts`           | `SimplePtoBucketCard` | `BaseComponent`                            |

## Root Cause Analysis

These components predate `BaseComponent` and were written before the project adopted the Lit-aligned reactive update cycle. The imperative `render()` pattern worked initially but:

- Scales poorly as components gain features (approval indicators, click-to-navigate, expand/collapse)
- Creates implicit coupling between template generation and event binding
- Makes the "what does this component display?" question harder to answer than it should be

## Staged Migration Plan

### Stage 1: Extract Shared Utilities (Foundation)

**Goal**: Create the shared utility module that replaces the base class hierarchy.

- [ ] Create `client/components/utils/pto-card-css.ts` exporting `CARD_CSS` constant (consolidated from `PTO_CARD_CSS` + `renderCard()` inline styles — single source of truth)
- [ ] Create `client/components/utils/pto-card-helpers.ts` exporting shared template helper functions:
  - `renderCardShell(title: string, body: string): string` — wraps body in card markup with CSS
  - `renderRow(label: string, value: string, cssClass?: string): string` — single data row
  - `renderToggleButton(expanded: boolean, hasEntries: boolean): string` — expand/collapse UI
  - `renderUsageList(entries: UsageEntry[], fullEntries?: PTOEntry[]): string` — date usage section
- [ ] Validate: `pnpm run build` passes (no consumers yet — just the utility module)

### Stage 2: Migrate Simple Cards (Low Risk, Proof-of-Concept)

**Goal**: Migrate `PtoEmployeeInfoCard` and `PtoSummaryCard` — flat components that only display data rows.

- [ ] `PtoEmployeeInfoCard`: change `extends PtoSectionCard` → `extends BaseComponent`
- [ ] Import `CARD_CSS` and `renderRow` from shared utilities
- [ ] Convert `render()` to return a template string using `CARD_CSS` and helpers
- [ ] Replace `this.render()` in setters/`attributeChangedCallback` with `this.requestUpdate()`
- [ ] Remove `this.renderCard()` calls
- [ ] Validate: unit tests pass, E2E screenshot tests match
- [ ] `PtoSummaryCard`: same migration pattern
- [ ] Validate: unit tests pass, E2E screenshot tests match

### Stage 3: Migrate Bucket Cards (Medium Risk)

**Goal**: Migrate the four `SimplePtoBucketCard` subclasses that share toggle/usage-list behavior.

- [ ] `PtoPtoCard`: change `extends SimplePtoBucketCard` → `extends BaseComponent`
  - Import shared CSS + helpers (`renderToggleButton`, `renderUsageList`, `renderRow`)
  - Move own state (data, entries, expanded, fullEntries) into the component
  - Convert `render()` to return declarative string using helpers
  - Move toggle/date-click handlers to `handleDelegatedClick()` / `handleDelegatedKeydown()`
  - Replace `this.render()` with `this.requestUpdate()`
- [ ] Validate: PTO card E2E tests pass
- [ ] `PtoBereavementCard`: same pattern (already has per-entry approval indicators — preserve ✓ logic)
- [ ] `PtoSickCard`: same pattern
- [ ] `PtoJuryDutyCard`: same pattern
- [ ] Validate: all bucket card E2E tests pass, screenshot baselines match

### Stage 4: Migrate Accrual Card + Slot Refactor (High Risk)

**Goal**: Migrate `PtoAccrualCard` and replace embedded `<pto-calendar>` with a named slot.

- [ ] Change `extends PtoSectionCard` → `extends BaseComponent`
- [ ] Convert the 12-month grid rendering to declarative template with helpers
- [ ] Replace embedded `<pto-calendar>` with `<slot name="calendar"></slot>`
- [ ] Move calendar button and row click handlers to `handleDelegatedClick()`
- [ ] Dispatch a new event (e.g., `month-selected`) when a month is clicked; let the parent/consumer respond by placing or updating a `<pto-calendar slot="calendar">` in light DOM
- [ ] Replace `this.render()` with `this.requestUpdate()`
- [ ] Update all consumers of `<pto-accrual-card>` to compose `<pto-calendar>` as slotted child
- [ ] Validate: accrual card E2E tests pass, calendar integration works

### Stage 5: Delete Old Base Classes & Cleanup

- [ ] Remove `PtoSectionCard` and `SimplePtoBucketCard` classes from `pto-card-base.ts`
- [ ] Remove unused `PTO_CARD_CSS` export and `renderCard()` method
- [ ] Remove or redirect any remaining imports of `pto-card-base.ts`
- [ ] Update component README files with new architecture notes
- [ ] Update web-components-assistant SKILL.md to remove these components from "unmigrated" list
- [ ] Run full E2E suite: `npx playwright test`
- [ ] Run full unit test suite: `npx vitest run`

## Anti-Patterns to Eliminate

| Anti-Pattern                         | Current Usage                                                   | Replacement                                                            |
| ------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `this.shadow.innerHTML = ...`        | All card `render()` methods                                     | `render()` returns string; `BaseComponent.renderTemplate()` applies it |
| `this.render()` direct calls         | Setters, `attributeChangedCallback`                             | `this.requestUpdate()`                                                 |
| `el.addEventListener()` after render | Toggle buttons, date clicks, row clicks                         | `handleDelegatedClick()` with `target.matches()`                       |
| Duplicated CSS constants             | `PTO_CARD_CSS` + `renderCard()` inline CSS                      | Single `CARD_CSS` constant in `pto-card-css.ts`                        |
| IIFEs in template strings            | `(() => { ... })()` in usage section                            | Extract to helper functions in `pto-card-helpers.ts`                   |
| Deep inheritance                     | `HTMLElement` → `PtoSectionCard` → `SimplePtoBucketCard` → leaf | `BaseComponent` → leaf (flat)                                          |
| Embedded child components            | `<pto-calendar>` in `PtoAccrualCard` shadow DOM                 | `<slot name="calendar">` with light DOM composition                    |

## Declarative Rendering Examples

### Before (Imperative — current `PtoEmployeeInfoCard`)

```typescript
private render() {
  if (!this.data) {
    this.renderCard("Employee Information", "<div>Loading...</div>");
    return;
  }
  const body = `
    <div class="row"><span class="label">Hire Date</span><span>${this.data.hireDate}</span></div>
  `;
  this.renderCard("Employee Information", body);
}
```

### After (Declarative — BaseComponent + shared helpers)

```typescript
import { BaseComponent } from "../base-component.js";
import { CARD_CSS } from "../utils/pto-card-css.js";
import { renderRow } from "../utils/pto-card-helpers.js";

export class PtoEmployeeInfoCard extends BaseComponent {
  private data: EmployeeInfoData | null = null;

  protected render(): string {
    if (!this.data) {
      return `<style>${CARD_CSS}</style><div class="card"><h4>Employee Information</h4><div>Loading...</div></div>`;
    }
    return `
      <style>${CARD_CSS}</style>
      <div class="card">
        <h4>Employee Information</h4>
        ${renderRow("Hire Date", this.data.hireDate)}
        ${renderRow("Next Rollover", this.data.nextRolloverDate)}
      </div>
    `;
  }

  set info(value: EmployeeInfoData) {
    this.data = value;
    this.requestUpdate();
  }
}
```

### Slot Composition Example (Accrual Card)

```typescript
// PtoAccrualCard render() — declares a slot, does NOT embed <pto-calendar>
protected render(): string {
  return `
    <style>${CARD_CSS}${ACCRUAL_CSS}</style>
    <div class="card">
      <h4>${this._requestMode ? "PTO Request - Select Month" : "Monthly Accrual Breakdown"}</h4>
      ${this.renderMonthGrid()}
      <slot name="calendar"></slot>
    </div>
  `;
}

// Consumer composes in light DOM:
// <pto-accrual-card>
//   <pto-calendar slot="calendar" month="2" year="2026"></pto-calendar>
// </pto-accrual-card>
```

## Impact

- **Severity**: Medium — functional behavior is correct, but maintainability and memory safety are degraded
- **Affected Users**: Developers maintaining PTO dashboard components
- **Risk if Unaddressed**: Event listener leaks accumulate during user sessions; adding new features to card components becomes increasingly error-prone

## Oversights, Difficulties, and Agent Guidance

### 1. `this.shadow` → `this.shadowRoot` Rename (All Components)

All existing cards store the shadow root in a property called `this.shadow` (declared by `PtoSectionCard`). `BaseComponent` exposes it as `this.shadowRoot`. When migrating, **every** reference to `this.shadow` in a card component must become `this.shadowRoot`. However, since migrated components use a pure `render()` that returns a string (never touches the DOM directly), most `this.shadow.innerHTML` and `this.shadow.querySelector` calls will simply disappear. The only place `this.shadowRoot` might still be needed is inside `handleDelegatedClick()` if you need to query an element, but prefer `(e.target as HTMLElement)` via delegation instead.

### 2. The Four Bucket Cards Are Nearly Identical — Extract, Don't Copy-Paste

`PtoPtoCard`, `PtoBereavementCard`, `PtoSickCard`, and `PtoJuryDutyCard` have almost identical `render()` bodies (~150 lines each). The only differences are:

- The card title string (`"PTO"`, `"Sick Time"`, `"Bereavement"`, `"Jury Duty"`)
- The `e.type` filter string used for approval checking (`"PTO"`, `"Sick"`, `"Bereavement"`, `"Jury Duty"`)
- `PtoJuryDutyCard` does NOT render negative-balance formatting on the remaining row (the others do)

When creating `renderUsageList()` and `renderToggleButton()` in `pto-card-helpers.ts`, parameterize by `entryType: string` so each card's `render()` becomes a short, readable composition of helpers. Do not copy 150 lines into each component.

### 3. `monthNames` Export Must Move Too

`PtoAccrualCard` imports `monthNames` from `pto-card-base.ts`. When the base classes are deleted in Stage 5, this import will break. Move `monthNames` to a shared location (e.g., `pto-card-helpers.ts` or `shared/dateUtils.ts`) **in Stage 1**, not Stage 5. Note that `pto-calendar` and `prior-year-review` each have their own local `monthNames` constant — consider deduplicating all three into a single export.

### 4. `bucket` / `usageEntries` / `isExpanded` Setters Are Part of the Public API

`app.ts` (the main application controller) calls these property setters directly:

```typescript
sickCard.bucket = status.sickTime;
sickCard.usageEntries = this.buildUsageEntries(...);
sickCard.fullPtoEntries = entries.filter(...);
```

The migrated components **must preserve these exact setter names** and their calling conventions. The agent must not rename these to `setData()` or use `setAttribute()` — the callers expect property setters.

Similarly, `PtoAccrualCard` exposes:

- `monthlyAccruals`, `monthlyUsage`, `ptoEntries`, `calendarYear`, `requestMode`, `annualAllocation`, `navigateToMonth(month, year)`

All of these are called from `app.ts` and must remain unchanged.

### 5. `navigate-to-month` Event Contract Must Be Preserved

All four bucket cards dispatch `navigate-to-month` with `{ month, year }` detail. `app.ts` listens for this and calls `accrualCard.navigateToMonth(month, year)`. This event contract must be preserved exactly. The event handler in `handleDelegatedClick()` must check for `.usage-date` clicks, read `data-date`, parse it, and dispatch the same event.

### 6. Accrual Card Slot Refactor Is the Hardest Part — E2E Tests Will Break

The E2E test (`component-pto-accrual-card.spec.ts`) clicks a calendar button and then expects `page.locator("pto-calendar")` to be visible. Currently the calendar lives inside the accrual card's shadow DOM. After the slot refactor:

- The `<pto-calendar>` will be in light DOM as a slotted child
- The E2E locator `page.locator("pto-calendar")` will likely still work (Playwright pierces shadow DOM by default for locators, and light DOM elements are always visible)
- However, the **test page (`pto-accrual-card/test.html` and `test.ts`)** must be updated to compose the calendar as a slotted child, and the `test.ts` playground must listen for `month-selected` and create/update the slotted calendar element dynamically
- The `pto-dashboard/test.html` and `pto-dashboard/test.ts` must also be updated

### 7. `PtoAccrualCard` Currently Filters PTO Entries Per-Month Internally

When a month is clicked, `PtoAccrualCard.render()` filters `this._ptoEntries` for the selected month and passes the filtered list to the embedded `<pto-calendar>` as a `pto-entries` attribute. After the slot refactor, this filtering logic must move to the consumer (the entity that creates the slotted `<pto-calendar>`), or the accrual card must include the filtered entries in the `month-selected` event detail so the consumer can configure the calendar.

Recommended: dispatch `month-selected` with `{ month, year, entries: filteredEntries }` detail.

### 8. No Unit Tests Exist for Any Card Component

There are no Vitest unit tests in `tests/components/` for any PTO card — only E2E Playwright tests exist. The migration plan's "Validate: unit tests pass" steps are aspirational. The agent should:

- Not create new unit tests during migration (keep scope focused)
- Rely on E2E tests and `pnpm run build` for validation
- Note in each stage's completion that unit tests are still TODO

### 9. `connectedCallback` Behavior Change

`PtoSectionCard` and `SimplePtoBucketCard` override `connectedCallback` to call `this.render()`. `BaseComponent.connectedCallback()` automatically calls `this.update()` → `this.render()` → `this.renderTemplate()`. The migrated cards **must not** override `connectedCallback` to call `render()` or `requestUpdate()` — just calling `super.connectedCallback()` (or omitting the override entirely) is sufficient. Calling `requestUpdate()` in `connectedCallback` would cause a double render.

### 10. `attributeChangedCallback` and `observedAttributes`

The existing cards use `attributeChangedCallback` to parse JSON from attributes and call `this.render()`. After migration:

- Keep `observedAttributes` and `attributeChangedCallback` but call `this.requestUpdate()` instead of `this.render()`
- Consider whether attribute-based data injection is even needed — `app.ts` exclusively uses property setters, never `setAttribute` for data. The only attributes set in HTML are `request-mode` and `annual-allocation` on the accrual card (see `client/index.html`). The agent may simplify by removing attribute handling for complex data (JSON) and keeping it only for simple string/boolean config.

### 11. Build and Validate After Each Stage — Not Just at the End

Run `pnpm run build` after each stage before proceeding. The TypeScript compiler will catch import errors from deleted base classes early. Do not defer all validation to Stage 5.

### 12. `pto-dashboard/index.ts` Re-exports Must Be Preserved

`client/components/pto-dashboard/index.ts` re-exports all card classes. After migration, these imports/exports must be updated if import paths change, but the public exports must remain the same for backward compatibility.

## Investigation Checklist

- [x] Identify all components in the PtoSectionCard hierarchy
- [x] Review BaseComponent contract and migration steps in SKILL.md
- [x] Confirm design decisions (flatten hierarchy, TS CSS constants, named slots, checkmark unchanged)
- [x] Check existing E2E test coverage for each card component (all 7 cards have E2E specs)
- [x] Verify screenshot baselines exist for visual regression testing (no screenshot baselines — tests use functional assertions only)
- [x] Confirm no other components import `PTO_CARD_CSS` or `renderCard()` directly (only the card components themselves do)
- [x] Audit `app.ts` for property setter / event contracts that must be preserved
- [x] Identify `monthNames` export dependency from `pto-card-base.ts`
- [x] Confirm no unit tests exist (only E2E)

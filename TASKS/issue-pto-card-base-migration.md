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
- [ ] Validate: `npm run build` passes (no consumers yet — just the utility module)

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

## Investigation Checklist

- [x] Identify all components in the PtoSectionCard hierarchy
- [x] Review BaseComponent contract and migration steps in SKILL.md
- [x] Confirm design decisions (flatten hierarchy, TS CSS constants, named slots, checkmark unchanged)
- [ ] Check existing E2E test coverage for each card component
- [ ] Verify screenshot baselines exist for visual regression testing
- [ ] Confirm no other components import `PTO_CARD_CSS` or `renderCard()` directly

# Issue: Migrate PTO Card Components to BaseComponent with Declarative Rendering

## Issue Summary

The PTO card component hierarchy (`PtoSectionCard` → `SimplePtoBucketCard` → individual cards) extends `HTMLElement` directly and uses imperative DOM construction via `innerHTML` string concatenation in `render()` methods. This pattern is difficult to reason about, leaks event listeners on every re-render, and violates the project's `BaseComponent` architecture and the web-components-assistant specification.

## Previously Working

Components render correctly, but with these structural deficits:

- Event listeners are re-attached on every `render()` call without cleanup
- `render()` imperatively sets `innerHTML` rather than returning a declarative template string
- CSS is duplicated across `PTO_CARD_CSS` constant and `renderCard()` inline styles
- No event delegation — listeners are manually bound to queried DOM nodes after each render
- Deep nesting of imperative logic (`.map().join("")`, ternary chains, IIFEs inside template strings)

## Current Behavior

- `pto-bereavement-card/index.ts` is 150+ lines of interleaved HTML string construction, conditional logic, and manual event binding — hard to intuit at a glance
- Every `render()` call replaces `innerHTML` without cleaning up prior listeners → memory leaks
- No use of `requestUpdate()`, event delegation, or the reactive update cycle
- `this.render()` called directly from setters and `attributeChangedCallback`

## Expected Behavior

All PTO card components should:

1. Extend `BaseComponent` (not `HTMLElement`)
2. Implement `render()` as a **pure template method** returning a string — no side effects
3. Use `requestUpdate()` to trigger re-renders — never call `render()` directly
4. Use `handleDelegatedClick()` / `handleDelegatedKeydown()` for event handling
5. Prefer **declarative markup** over imperative DOM construction logic
6. Consolidate shared CSS into a single source (the base class template)

## Affected Components

| Component             | File                                                | Extends               | Complexity                                               |
| --------------------- | --------------------------------------------------- | --------------------- | -------------------------------------------------------- |
| `PtoSectionCard`      | `client/components/utils/pto-card-base.ts`          | `HTMLElement`         | Base class — migrate first                               |
| `SimplePtoBucketCard` | `client/components/utils/pto-card-base.ts`          | `PtoSectionCard`      | Intermediate base — has toggle/usage section logic       |
| `PtoEmployeeInfoCard` | `client/components/pto-employee-info-card/index.ts` | `PtoSectionCard`      | Simple — 2 data rows                                     |
| `PtoSummaryCard`      | `client/components/pto-summary-card/index.ts`       | `PtoSectionCard`      | Moderate — approved status logic                         |
| `PtoAccrualCard`      | `client/components/pto-accrual-card/index.ts`       | `PtoSectionCard`      | Complex — 12-month grid, embedded calendar, request mode |
| `PtoBereavementCard`  | `client/components/pto-bereavement-card/index.ts`   | `SimplePtoBucketCard` | Moderate — approval indicators per-entry                 |
| `PtoSickCard`         | `client/components/pto-sick-card/index.ts`          | `SimplePtoBucketCard` | Moderate — similar to bereavement                        |
| `PtoJuryDutyCard`     | `client/components/pto-jury-duty-card/index.ts`     | `SimplePtoBucketCard` | Moderate — similar to bereavement                        |
| `PtoPtoCard`          | `client/components/pto-pto-card/index.ts`           | `SimplePtoBucketCard` | Moderate — similar to bereavement                        |

## Root Cause Analysis

These components predate `BaseComponent` and were written before the project adopted the Lit-aligned reactive update cycle. The imperative `render()` pattern worked initially but:

- Scales poorly as components gain features (approval indicators, click-to-navigate, expand/collapse)
- Creates implicit coupling between template generation and event binding
- Makes the "what does this component display?" question harder to answer than it should be

## Staged Migration Plan

### Stage 1: Refactor Base Classes (Foundation)

**Goal**: Migrate `PtoSectionCard` and `SimplePtoBucketCard` to extend `BaseComponent`.

- [ ] Create `PtoSectionCard` extending `BaseComponent` instead of `HTMLElement`
- [ ] Remove manual `attachShadow()` (BaseComponent handles this)
- [ ] Move shared card CSS into a static constant or method accessible to subclasses
- [ ] Change `render()` to return a template string (pure, no side effects)
- [ ] Replace all `this.render()` calls with `this.requestUpdate()`
- [ ] Migrate `SimplePtoBucketCard.render()` to return a string with declarative toggle/usage markup
- [ ] Move toggle button and date click handlers to `handleDelegatedClick()` / `handleDelegatedKeydown()`
- [ ] Add `_customEventsSetup` guard if overriding `setupEventDelegation()`
- [ ] Validate: `npm run build` passes, existing E2E tests pass

### Stage 2: Migrate Simple Cards (Low Risk)

**Goal**: Migrate `PtoEmployeeInfoCard` — the simplest subclass — as a proof-of-concept.

- [ ] Change `extends PtoSectionCard` to use the migrated base
- [ ] Convert `render()` to return a template string
- [ ] Replace `this.render()` in setters with `this.requestUpdate()`
- [ ] Remove `this.renderCard()` calls (no longer needed — base class handles card wrapper)
- [ ] Validate: unit tests pass, E2E screenshot tests match
- [ ] Migrate `PtoSummaryCard` following the same pattern
- [ ] Validate: unit tests pass, E2E screenshot tests match

### Stage 3: Migrate Bucket Cards (Medium Risk)

**Goal**: Migrate the four `SimplePtoBucketCard` subclasses.

- [ ] Migrate `PtoPtoCard` — closest to the base class behavior
- [ ] Migrate `PtoBereavementCard` — has per-entry approval indicators
- [ ] Migrate `PtoSickCard`
- [ ] Migrate `PtoJuryDutyCard`
- [ ] For each: convert `render()` to declarative string, move event handlers to delegation
- [ ] Validate: all bucket card E2E tests pass, screenshot baselines match

### Stage 4: Migrate Accrual Card (High Risk)

**Goal**: Migrate `PtoAccrualCard` — the most complex component with embedded `pto-calendar`.

- [ ] Convert the 12-month grid rendering to declarative template
- [ ] Move calendar button and row click handlers to `handleDelegatedClick()`
- [ ] Handle embedded `pto-calendar` event forwarding via delegation
- [ ] Convert `handlePtoRequestSubmit` flow to use delegated events
- [ ] Validate: accrual card E2E tests pass, calendar integration works

### Stage 5: Cleanup and Documentation

- [ ] Remove unused `PTO_CARD_CSS` export if fully replaced by base class styles
- [ ] Remove `renderCard()` helper if no longer used
- [ ] Update component README files with new architecture notes
- [ ] Update web-components-assistant SKILL.md to remove these components from "unmigrated" list
- [ ] Run full E2E suite: `npx playwright test`
- [ ] Run full unit test suite: `npx vitest run`

## Anti-Patterns to Eliminate

| Anti-Pattern                         | Current Usage                              | Replacement                                                            |
| ------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------- |
| `this.shadow.innerHTML = ...`        | All card `render()` methods                | `render()` returns string; `BaseComponent.renderTemplate()` applies it |
| `this.render()` direct calls         | Setters, `attributeChangedCallback`        | `this.requestUpdate()`                                                 |
| `el.addEventListener()` after render | Toggle buttons, date clicks, row clicks    | `handleDelegatedClick()` with `target.matches()`                       |
| Duplicated CSS constants             | `PTO_CARD_CSS` + `renderCard()` inline CSS | Single CSS source in base class `render()` return                      |
| IIFEs in template strings            | `(() => { ... })()` in usage section       | Extract to helper methods called from `render()`                       |

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

### After (Declarative — BaseComponent)

```typescript
protected render(): string {
  if (!this.data) {
    return `<style>${CARD_CSS}</style><div class="card"><h4>Employee Information</h4><div>Loading...</div></div>`;
  }
  return `
    <style>${CARD_CSS}</style>
    <div class="card">
      <h4>Employee Information</h4>
      <div class="row"><span class="label">Hire Date</span><span>${this.data.hireDate}</span></div>
      <div class="row"><span class="label">Next Rollover</span><span>${this.data.nextRolloverDate}</span></div>
    </div>
  `;
}
```

## Clarifying Questions

1. Should `PtoSectionCard` remain a concrete class in the hierarchy, or should its behavior be folded directly into `SimplePtoBucketCard` / absorbed by each leaf component?
2. Should the shared card CSS be kept as an exported constant or moved to an `adoptedStyleSheets` pattern?
3. The `PtoAccrualCard` embeds `<pto-calendar>` inside its shadow DOM. Should this remain as composed shadow DOM, or should the calendar be slotted or coordinated at a higher parent level?
4. Are there planned changes to the approval indicator pattern that should be accounted for during migration?

## Impact

- **Severity**: Medium — functional behavior is correct, but maintainability and memory safety are degraded
- **Affected Users**: Developers maintaining PTO dashboard components
- **Risk if Unaddressed**: Event listener leaks accumulate during user sessions; adding new features to card components becomes increasingly error-prone

## Investigation Checklist

- [x] Identify all components in the PtoSectionCard hierarchy
- [x] Review BaseComponent contract and migration steps in SKILL.md
- [ ] Check existing E2E test coverage for each card component
- [ ] Verify screenshot baselines exist for visual regression testing
- [ ] Confirm no other components import `PTO_CARD_CSS` or `renderCard()` directly

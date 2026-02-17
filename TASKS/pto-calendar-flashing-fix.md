# PTO Calendar Flashing Fix

## Description

Fix the flashing issue in the pto-calendar component where the entire calendar flashes when clicking a day due to reactive rendering. Optimize the rendering to only update the modified day, implement a minor animation on the changing day for visual feedback, and enhance styling for partial days (less than 8 hours) with muted appearance and ○/● symbols instead of numeric values.

## Priority

🟢 Low Priority

## Checklist

- [x] **Stage 1: Investigate Current Implementation**
  - **Current Architecture**: Component extends `HTMLElement` directly (not `BaseComponent`), using imperative rendering with `this.shadow.innerHTML = ...` in the `render()` method (line 357). Uses a private `shadow` field rather than the inherited `shadowRoot`.
  - **Rendering Trigger**: Every state change calls `this.render()` directly — from `attributeChangedCallback()` (line 127), `clearSelection()` (line 185), `toggleDaySelection()` (lines 707, 724, 747), and legend click handlers (line 581). Each call replaces entire shadow DOM content.
  - **Flashing Cause**: `this.shadow.innerHTML = ...` recreates all DOM elements. The CSS rule `.day.clickable { transition: all 0.2s ease; }` causes all clickable day cells to visually animate (scale, color, border) on creation, producing a flash across the entire calendar.
  - **Day Click Flow**: `attachEventListeners()` adds per-element click listeners on every `.day.clickable` cell → `toggleDaySelection(date)` → updates `selectedCells` Map → calls `this.render()` → full DOM replacement + re-attaches all listeners → all days flash.
  - **Event Listener Leak**: `attachEventListeners()` adds new anonymous listeners to every clickable cell and legend item on every `render()` call, without removing previous listeners. This is a memory leak pattern. Additionally, `connectedCallback()` adds a `keydown` listener on `this.shadow` without cleanup.
  - **Focus Management**: Manual focus save/restore in `render()` via `lastFocusArea` and `restoreFocus()`. This duplicates what `BaseComponent.renderTemplate()` already handles for focused elements with IDs.
  - **Current Hours Display**: Numeric values (e.g., `4`, `8`) shown in `.hours` div, no distinction between partial/full days in styling.
  - Validation: Code inspection confirms full re-render + listener leak on every interaction.

### Stage 2: Migrate `pto-calendar` to `BaseComponent`

The migration must happen before addressing flashing/animation/styling issues, because `BaseComponent` provides the reactive update cycle (`requestUpdate()` → `update()` → `render()` → `renderTemplate()`) and event delegation that eliminates the root causes.

- [ ] **2a. Change class declaration and constructor**
  - Change `extends HTMLElement` → `extends BaseComponent`
  - Add `import { BaseComponent } from "../base-component.js";`
  - Remove `private shadow: ShadowRoot;` field
  - Remove `this.shadow = this.attachShadow({ mode: "open" });` from constructor (BaseComponent does this)
  - Refactor to attribute-backed getter/setter pattern for primitives (`month`, `year`, `readonly`, `selected-month`):
    - Use ES `get`/`set` accessors backed by `getAttribute()`/`setAttribute()`
    - `attributeChangedCallback` is the single `requestUpdate()` trigger, guarded by `oldValue === newValue`
    - Remove the old `setMonth()`, `setYear()`, etc. methods — callers use `calendar.month = 3` instead
  - For complex properties (`ptoEntries`, `selectedCells`), use private fields with `get`/`set` accessors that call `requestUpdate()` directly
  - Remove dead code: `.type-Planned-PTO` CSS rule
  - Keep all other state field initializations in constructor

- [ ] **2b. Convert `render()` from imperative to declarative**
  - Change `private render()` → `protected render(): string`
  - Move the focus-saving logic out of `render()` (it's a side effect; handle in an `update()` override or `handleDelegatedClick()`)
  - Extract the `<style>` block and `renderCalendar()` call into the return value
  - Remove `this.shadow.innerHTML = ...` — just `return` the template string
  - Remove `this.attachEventListeners()` call from `render()` (delegation replaces it)
  - Remove `this.restoreFocus()` call from `render()` (BaseComponent handles basic focus restore; custom focus restore can go in an `update()` override after `super.update()`)

- [ ] **2c. Replace all `this.render()` calls with `this.requestUpdate()`**
  - `attributeChangedCallback()`: simplify to just guard + `this.requestUpdate()` (single render trigger for all attribute changes)
  - `clearSelection()`: replace `this.render()` → `this.requestUpdate()`
  - `toggleDaySelection()`: replace all `this.render()` → `this.requestUpdate()`
  - Legend click handler / keyboard handler: replace `this.render()` → `this.requestUpdate()`

- [ ] **2d. Replace all `this.shadow` references with `this.shadowRoot`**
  - `render()`, `attachEventListeners()`, `restoreFocus()`, `focusDate()`, `focusLegendItem()`, `handleKeyDown()`, `handleLegendKeyDown()`, `handleGridKeyDown()` — all use `this.shadow`

- [ ] **2e. Migrate event handling to delegation**
  - Delete `attachEventListeners()` entirely
  - Override `handleDelegatedClick(e: Event)` to handle:
    - Day cell clicks: detect `target.closest('.day.clickable')`, extract `data-date`, call `toggleDaySelection(date)`
    - Legend item clicks: detect `target.closest('.legend-item.clickable')`, extract `data-type`, toggle selection
    - Submit button clicks: detect `target.closest('button')` in `.submit-slot`
  - Override `handleDelegatedKeydown(e: KeyboardEvent)` to replace the `connectedCallback` keydown listener — move `handleKeyDown()` logic into it
  - Remove the `this.shadow.addEventListener("keydown", ...)` from `connectedCallback()`

- [ ] **2f. Migrate focus management**
  - Remove focus-saving from `render()` (it was a side effect)
  - Simplify focus tracking: the component view-model already tracks `focusedDate` and `focusedLegendIndex` — use these as the source of truth
  - Override `update()` to restore focus after `super.update()` based on view-model state:
    ```typescript
    protected update() {
      super.update();
      this.restoreFocusFromViewModel();
    }
    ```
  - `restoreFocusFromViewModel()` reads `this.focusedDate` / `this.focusedLegendIndex` and focuses the corresponding element — no need to save/detect focus before render since the view-model already knows
  - Remove `lastFocusArea` field — derive focus target from which setter/handler last ran (e.g., `toggleDaySelection` sets `focusedDate`, legend click sets `focusedLegendIndex`)

- [ ] **2g. Remove `connectedCallback()` override or call `super.connectedCallback()`**
  - Current `connectedCallback()` calls `this.render()` and adds a keydown listener
  - After migration: call `super.connectedCallback()` (which calls `setupEventDelegation()` and `update()`)
  - Remove the manual `this.render()` and keydown listener setup

- [ ] **2h. Validate migration**
  - `pnpm run build` passes
  - `pnpm run lint` passes
  - Manual testing on `client/components/pto-calendar/test.html`:
    - Calendar renders correctly in view and edit modes
    - Day clicks toggle selection without full calendar flash
    - Legend clicks change PTO type
    - Keyboard navigation (arrow keys, Enter/Space) works
    - Submit button dispatches `pto-request-submit` event
    - Month navigation works
    - Existing `<slot name="balance-summary">` still renders
  - Run E2E tests: `pnpm run test:e2e`

**Validation**: Component behaves identically to pre-migration. No event listener leaks. `this.render()` is never called directly.

### Stage 3: Implement Targeted Day Updates

After BaseComponent migration, rendering still replaces the full shadow DOM on every `requestUpdate()`. This stage adds a targeted update path for day-click interactions to avoid full re-renders.

- [ ] Add a `updateDay(date: string)` method that finds the existing `.day[data-date="..."]` element and updates only its classes, hours text, and checkmark — without replacing `innerHTML`
- [ ] In `toggleDaySelection()`, call `updateDay(date)` instead of `requestUpdate()` when only a single day's state changed
- [ ] Keep `requestUpdate()` for full state changes (month/year/entries/readonly changes)
- [ ] Validation: Manual testing shows only the clicked day visually updates; other days remain stable

### Stage 4: Implement Visual Feedback Animation

- [ ] Add a CSS `@keyframes day-pulse` animation (brief background highlight, ~200ms)
- [ ] Add a `.day-changed` class that applies the animation
- [ ] In `updateDay()`, add `.day-changed` class to the modified day element, then remove it after animation completes (via `animationend` event)
- [ ] Ensure only the modified day animates; no other cells are affected
- [ ] Validation: Clicking a day shows a brief, subtle pulse; no full calendar flash

### Stage 5: Implement Partial Day Styling

- [ ] Replace numeric hours display with symbols: `●` for full day (8 hours), `○` for partial day (<8 hours)
- [ ] Add CSS classes `.hours-full` and `.hours-partial` with differentiated styling:
  - `.hours-full`: normal opacity, uses `●`
  - `.hours-partial`: muted opacity (~60%), uses `○`
- [ ] Apply muted background opacity on the day cell itself for partial days (e.g., reduce PTO type background color intensity)
- [ ] Update both `renderCalendar()` and `updateDay()` to use the new symbol/class logic
- [ ] Validation: Visual inspection shows clear differentiation between full and partial days

### Stage 6: Testing and Validation

- [ ] Run unit tests for pto-calendar component
- [ ] Perform manual testing of all calendar interactions (click, keyboard, month nav, submit)
- [ ] Verify no event listener leaks (check with browser DevTools)
- [ ] Ensure build passes and linting succeeds
- [ ] Validation: `pnpm run build` and `pnpm run lint` pass, `pnpm run test:e2e` passes, manual tests confirm fix

### Stage 7: Documentation Update

- [ ] Update `client/components/pto-calendar/README.md` with:
  - BaseComponent migration notes
  - New visual feedback behavior
  - Partial day styling (○/● symbols)
- [ ] Validation: Documentation reflects current implementation

## Implementation Notes

- **Migrate to BaseComponent first** — this eliminates the event listener leak and provides the reactive update cycle. All subsequent fixes build on this foundation.
- **View-model pattern**: Component state is stored in two ways: primitive values (`month`, `year`, `readonly`) use attributes as the backing store via ES `get`/`set` accessors. Complex values (`ptoEntries`, `selectedCells`) use private fields with typed `get`/`set` accessors. `render()` is a pure function of this state. Focus is restored from the view-model after each render.
- **Attribute-backed getters/setters**: For primitive properties, `set month(v)` calls `setAttribute()`, which triggers `attributeChangedCallback()` as the single `requestUpdate()` call point. Guard with `oldValue === newValue` to prevent cycles. For complex properties, `set ptoEntries(v)` updates the private field and calls `requestUpdate()` directly.
- **Remove dead code**: Delete `.type-Planned-PTO` CSS rule and any `Planned PTO` references — it represents unrealized PTO and is not tracked.
- **Targeted updates (`updateDay()`)** are an optimization layer on top of BaseComponent's `requestUpdate()`. They avoid full `innerHTML` replacement for the common case (clicking a day), while `requestUpdate()` remains the fallback for structural changes (month/year/entries).
- For visual feedback: Use CSS `@keyframes` animation triggered by a transient class, not CSS `transition` (which fires on element creation and causes the flash).
- For partial day styling: Use CSS opacity or color variations for muted appearance; replace hour numbers with ○ (partial) and ● (full) symbols.
- Ensure CSS follows project conventions: modern `rgb()` with alpha percentages, `var()` references to `tokens.css` custom properties, empty lines before rules.

## Questions and Concerns

1. ~~Should `observedAttributes` and `attributeChangedCallback` be preserved as-is, or should attribute-based configuration be replaced with setter methods only?~~ **Answer**: Use both. Primitives (`month`, `year`, `readonly`, `selected-month`) use attribute-backed ES `get`/`set` accessors — the setter calls `setAttribute()`, and `attributeChangedCallback` (guarded by `oldValue === newValue`) is the single `requestUpdate()` trigger. Complex values (`ptoEntries`, `selectedCells`) use private fields with typed `get`/`set` accessors that call `requestUpdate()` directly. Remove the old `setMonth()` / `setPtoEntries()` imperative methods.
2. ~~The `focusedDate` / `focusedLegendIndex` focus tracking is complex. Should it be simplified?~~ **Answer**: Backward compatibility is not a concern. Simplify freely. The component should maintain a view-model (private state fields) and re-render from it. Focus and input element state must be preserved across re-renders — this is the critical UX requirement, not behavioral parity with the old code.
3. ~~The `Planned PTO` type color is referenced in CSS but not in the `PTO_TYPE_COLORS` map keys — is this dead code?~~ **Answer**: Yes, dead code. "Planned PTO" is simply unrealized PTO and not useful to track. Remove `.type-Planned-PTO` CSS rule and any references.

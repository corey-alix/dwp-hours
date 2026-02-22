# Calendar Header Navigation

## Description

Relocate the month navigation controls (previous/next buttons) from their current position in `pto-entry-form`'s toolbar into a custom header rendered directly above the `pto-calendar`, flanking the month name. The previous-month button is docked to the far left, the next-month button to the far right, and the month name is centered between them. To support this, `pto-calendar` gains a `hide-header` attribute so its built-in calendar-header (month name row) can be suppressed when an external header provides that information.

## Priority

🟢 Low Priority (Frontend/UI Enhancement)

## Checklist

### Stage 0a — Prerequisite: Migrate `pto-entry-form` to `BaseComponent`

`pto-entry-form` currently extends `HTMLElement` directly and uses imperative rendering, manual shadow DOM setup, and manual event listeners — all violations of the [web-components-assistant](../.github/skills/web-components-assistant/SKILL.md) policies. It is listed as an unmigrated component in that skill doc. Migrating it first ensures the calendar-header-navigation work builds on a compliant foundation.

**Violations addressed:**

| #   | Violation                                                   | Resolution                                                             |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Extends `HTMLElement` instead of `BaseComponent`            | Change to `extends BaseComponent`                                      |
| 2   | Imperative `render()` sets `this.shadow.innerHTML` directly | Return a template string; let `renderTemplate()` apply it              |
| 3   | Manual `attachShadow()` in constructor                      | Remove — BaseComponent handles it                                      |
| 4   | Manual event listeners in `setupEventListeners()`           | Convert to `handleDelegatedClick()` / `setupEventDelegation()` pattern |
| 5   | No memory-safe listener management                          | Use `addListener()` for non-delegated listeners (swipe, matchMedia)    |
| 6   | `PtoRequest` interface defined before imports               | Move after imports                                                     |
| 7   | No getter/setter for `available-pto-balance`                | Add attribute-backed `get`/`set` pair                                  |

**Checklist:**

- [x] Move `PtoRequest` interface below import statements
- [x] Change `extends HTMLElement` → `extends BaseComponent`; add BaseComponent import
- [x] Remove manual `this.shadow = this.attachShadow(...)` from constructor
- [x] Replace `this.shadow` references with `this.shadowRoot` (inherited from BaseComponent)
- [x] Make `render()` return a template string instead of setting `innerHTML` directly
  - Mark as `protected render(): string` to match BaseComponent's abstract signature
- [x] Remove the `connectedCallback()` call to `this.render()` — BaseComponent's `connectedCallback()` calls `update()` → `render()` → `renderTemplate()` automatically
- [x] Call `super.connectedCallback()` / `super.disconnectedCallback()` in lifecycle overrides
- [x] Add attribute-backed getter/setter for `availablePtoBalance`:
  ```
  get availablePtoBalance(): number { return parseFloat(this.getAttribute("available-pto-balance") || "0"); }
  set availablePtoBalance(v: number) { this.setAttribute("available-pto-balance", v.toString()); }
  ```
  and update `attributeChangedCallback` to just call `requestUpdate()` (no private field)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Manual test: component renders and behaves identically to before

### Stage 0b — Prerequisite: Convert event handling to BaseComponent patterns

- [x] Move nav-button click handling into `handleDelegatedClick()` using `data-action` attributes on the `← →` buttons (e.g., `data-action="prev-month"` / `data-action="next-month"`)
- [x] Move the submit listener (`this.addEventListener("submit", ...)`) into `setupEventDelegation()` with a `_customEventsSetup` guard
- [x] Move the `selection-changed` listener on `#calendar-container` into `setupEventDelegation()` (same guard)
- [x] Convert swipe touch listeners to use `addListener()` for memory-safe cleanup, registered in `connectedCallback()` or `setupEventDelegation()`
- [x] Convert the `matchMedia` listener to use `addListener()` so it is tracked for cleanup in `disconnectedCallback()`
- [x] Remove the now-empty `setupEventListeners()` and `setupSwipeNavigation()` private methods (logic folded into delegation/lifecycle)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Manual test: prev/next navigation, swipe, submit, and multi-calendar toggle all work as before

### Stage 0c — Prerequisite: Validate imperative DOM construction

`rebuildCalendars()` uses `createElement` / `appendChild` to build calendar instances dynamically. This is an exception to the "declarative template" rule because the number and configuration of child components varies by mode. Document the justification and ensure it is compatible with BaseComponent's update cycle.

- [x] Add a code comment in `rebuildCalendars()` explaining why imperative construction is retained (dynamic child count based on responsive mode)
- [x] Ensure `rebuildCalendars()` is only called from lifecycle methods and `setMultiCalendarMode()` — never from `render()`
- [x] Verify that `requestUpdate()` does not destroy imperatively-built calendars (i.e., `render()` returns the static shell only; `rebuildCalendars()` populates `#calendar-container` separately)
- [x] Manual test: switching between single-calendar and multi-calendar mode preserves PTO data

### Stage 1 — `pto-calendar`: add `hide-header` attribute

- [x] Add `"hide-header"` to `observedAttributes` in `PtoCalendar`
- [x] Add `hideHeader` boolean getter/setter (mirrors the `hide-header` attribute, same pattern as `hideLegend`)
- [x] In `renderCalendar()`, conditionally omit the `.calendar-header` div when `hideHeader` is `true`
- [x] Verify existing tests still pass (`pnpm run build && pnpm run lint`)
- [x] Manual test: `<pto-calendar hide-header="true">` renders without the month name header

### Stage 2 — `pto-entry-form`: custom navigation header

- [x] Remove the standalone `prev-month-btn` / `next-month-btn` from the `.form-header` toolbar
- [x] Create a new `.calendar-header-nav` element rendered **above** the `#calendar-container` (inside `.calendar-view` or directly before it)
- [x] The `.calendar-header-nav` layout: flexbox row with `justify-content: space-between; align-items: center`
  - Left: previous-month button (← arrow, `id="prev-month-btn"`)
  - Center: `<span class="calendar-month-label">` showing current month name + year
  - Right: next-month button (→ arrow, `id="next-month-btn"`)
- [x] Set `hide-header="true"` on the `<pto-calendar>` created in single-calendar mode so it no longer renders its own header
- [x] Keep `hide-header` unset (default) in multi-calendar mode where each card shows its own month name
- [x] Update the month label text whenever the calendar navigates (inside `updateCalendarMonth` and initial render)
- [x] Wire existing click/swipe event listeners to the relocated buttons (IDs remain the same, so `setupEventListeners` should work with minimal change)
- [x] Verify existing tests still pass (`pnpm run build && pnpm run lint`)

### Stage 2b — `submit-time-off-page`: responsibility transfer

Currently `submit-time-off-page` is the page that provides month-navigation capability to the user. After this change, the navigation UI (← Month Year →) moves entirely into `pto-entry-form`, making `pto-entry-form` self-contained for month navigation. `submit-time-off-page` should no longer need to own or orchestrate any navigation UI — it only passes an initial month/year via `form.navigateToMonth()` from query params.

- [x] Verify `submit-time-off-page` does not render its own navigation buttons or header (it currently delegates to `pto-entry-form`)
- [x] Confirm `submit-time-off-page.onRouteEnter()` still works: its `form.navigateToMonth(month, year)` call should update both the calendar and the new month label in `pto-entry-form`
- [x] If `submit-time-off-page` has any CSS or markup related to calendar navigation, remove it (currently it does not, but verify after changes)
- [x] Ensure the `pto-entry-form` public API (`navigateToMonth`, `reset`, etc.) still covers all page-level needs without the page needing to reach into the calendar directly

### Stage 3 — CSS styling

- [x] Add `.calendar-header-nav` styles to `pto-entry-form/css.ts`:
  - `display: flex; justify-content: space-between; align-items: center;`
  - Month label: `font-weight: var(--font-weight-semibold); text-transform: uppercase;`
  - Reuse existing `.nav-arrow` styles for the buttons
- [x] Hide `.calendar-header-nav` in multi-calendar mode (`:host(.multi-calendar) .calendar-header-nav { display: none; }`)
- [x] Hide `.calendar-header-nav` on touch devices (existing media query `@media (hover: none) and (pointer: coarse)`)
- [x] Run `pnpm lint:css` and fix any violations
- [x] Verify the layout matches the design: ← centered month name →

### Stage 4 — Testing & validation

- [x] Manual test: single-calendar mode shows `← February 2026 →` above the calendar grid
- [x] Manual test: clicking ← / → navigates months, label updates
- [x] Manual test: swipe navigation still works and label updates
- [x] Manual test: multi-calendar mode does not show the custom header (each card keeps its own)
- [x] Manual test: touch devices hide the custom header (same as before)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Existing E2E tests pass

## Implementation Notes

- **Prerequisite migration**: Stages 0a–0c migrate `pto-entry-form` from raw `HTMLElement` to `BaseComponent` per the [web-components-assistant](../.github/skills/web-components-assistant/SKILL.md) policies. This is a behavior-preserving refactor — no new features are added. The migration must be completed and verified before Stage 1 begins, because Stages 2–3 depend on declarative `render()`, `handleDelegatedClick()`, and `setupEventDelegation()` patterns that only exist on BaseComponent subclasses.
- The `hide-header` attribute follows the same boolean-attribute pattern as `hide-legend` already on `PtoCalendar`.
- The month label in `pto-entry-form` must stay in sync with the calendar's `month`/`year` attributes. The simplest approach is to update it inside `updateCalendarMonth()` and during `rebuildCalendars()`.
- The `monthNames` array is already exported-ready in `pto-calendar/index.ts`; consider exporting it or duplicating the short list in `pto-entry-form`.
- No new custom events or API changes are needed — this is purely a rendering/layout change.
- Follow CSS animation policy: only animate `transform`/`opacity`, respect `prefers-reduced-motion`.
- **Responsibility transfer**: `submit-time-off-page` currently orchestrates the overall PTO submission flow and delegates navigation to `pto-entry-form`. After this change, `pto-entry-form` becomes fully self-contained for month navigation (buttons + month label). `submit-time-off-page`'s only navigation responsibility remains the query-param-based `form.navigateToMonth()` call in `onRouteEnter()`, which must continue to update both the calendar state and the new month label. No navigation markup or CSS should exist in `submit-time-off-page`.

## Questions and Concerns

1.
2.
3.

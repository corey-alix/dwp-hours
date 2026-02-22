# Calendar Header Navigation

## Description

Relocate the month navigation controls (previous/next buttons) from their current position in `pto-entry-form`'s toolbar into a custom header rendered directly above the `pto-calendar`, flanking the month name. The previous-month button is docked to the far left, the next-month button to the far right, and the month name is centered between them. To support this, `pto-calendar` gains a `hide-header` attribute so its built-in calendar-header (month name row) can be suppressed when an external header provides that information.

## Priority

🟢 Low Priority (Frontend/UI Enhancement)

## Checklist

### Stage 1 — `pto-calendar`: add `hide-header` attribute

- [ ] Add `"hide-header"` to `observedAttributes` in `PtoCalendar`
- [ ] Add `hideHeader` boolean getter/setter (mirrors the `hide-header` attribute, same pattern as `hideLegend`)
- [ ] In `renderCalendar()`, conditionally omit the `.calendar-header` div when `hideHeader` is `true`
- [ ] Verify existing tests still pass (`pnpm run build && pnpm run lint`)
- [ ] Manual test: `<pto-calendar hide-header="true">` renders without the month name header

### Stage 2 — `pto-entry-form`: custom navigation header

- [ ] Remove the standalone `prev-month-btn` / `next-month-btn` from the `.form-header` toolbar
- [ ] Create a new `.calendar-header-nav` element rendered **above** the `#calendar-container` (inside `.calendar-view` or directly before it)
- [ ] The `.calendar-header-nav` layout: flexbox row with `justify-content: space-between; align-items: center`
  - Left: previous-month button (← arrow, `id="prev-month-btn"`)
  - Center: `<span class="calendar-month-label">` showing current month name + year
  - Right: next-month button (→ arrow, `id="next-month-btn"`)
- [ ] Set `hide-header="true"` on the `<pto-calendar>` created in single-calendar mode so it no longer renders its own header
- [ ] Keep `hide-header` unset (default) in multi-calendar mode where each card shows its own month name
- [ ] Update the month label text whenever the calendar navigates (inside `updateCalendarMonth` and initial render)
- [ ] Wire existing click/swipe event listeners to the relocated buttons (IDs remain the same, so `setupEventListeners` should work with minimal change)
- [ ] Verify existing tests still pass (`pnpm run build && pnpm run lint`)

### Stage 2b — `submit-time-off-page`: responsibility transfer

Currently `submit-time-off-page` is the page that provides month-navigation capability to the user. After this change, the navigation UI (← Month Year →) moves entirely into `pto-entry-form`, making `pto-entry-form` self-contained for month navigation. `submit-time-off-page` should no longer need to own or orchestrate any navigation UI — it only passes an initial month/year via `form.navigateToMonth()` from query params.

- [ ] Verify `submit-time-off-page` does not render its own navigation buttons or header (it currently delegates to `pto-entry-form`)
- [ ] Confirm `submit-time-off-page.onRouteEnter()` still works: its `form.navigateToMonth(month, year)` call should update both the calendar and the new month label in `pto-entry-form`
- [ ] If `submit-time-off-page` has any CSS or markup related to calendar navigation, remove it (currently it does not, but verify after changes)
- [ ] Ensure the `pto-entry-form` public API (`navigateToMonth`, `reset`, etc.) still covers all page-level needs without the page needing to reach into the calendar directly

### Stage 3 — CSS styling

- [ ] Add `.calendar-header-nav` styles to `pto-entry-form/css.ts`:
  - `display: flex; justify-content: space-between; align-items: center;`
  - Month label: `font-weight: var(--font-weight-semibold); text-transform: uppercase;`
  - Reuse existing `.nav-arrow` styles for the buttons
- [ ] Hide `.calendar-header-nav` in multi-calendar mode (`:host(.multi-calendar) .calendar-header-nav { display: none; }`)
- [ ] Hide `.calendar-header-nav` on touch devices (existing media query `@media (hover: none) and (pointer: coarse)`)
- [ ] Run `pnpm lint:css` and fix any violations
- [ ] Verify the layout matches the design: ← centered month name →

### Stage 4 — Testing & validation

- [ ] Manual test: single-calendar mode shows `← February 2026 →` above the calendar grid
- [ ] Manual test: clicking ← / → navigates months, label updates
- [ ] Manual test: swipe navigation still works and label updates
- [ ] Manual test: multi-calendar mode does not show the custom header (each card keeps its own)
- [ ] Manual test: touch devices hide the custom header (same as before)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Existing E2E tests pass

## Implementation Notes

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

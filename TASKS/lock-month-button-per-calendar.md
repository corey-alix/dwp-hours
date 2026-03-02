# Lock Month Button — Per-Calendar Placement

## Description

In desktop (multi-calendar) mode, the "Lock Month" button in `submit-time-off-page` sits in the **page-level toolbar** at the bottom of the form. Because all 12 months are visible simultaneously, it is unclear which month the button operates on. The current implementation derives the target month from `getDisplayedMonth()`, which reads from a single `pto-calendar` element — a heuristic that breaks down when multiple calendars are rendered.

**Goal:** Move the Lock/Unlock button out of the global toolbar and embed one **per month-card** so that each calendar has its own clearly-scoped lock control.

## Priority

🟡 Medium Priority (UX clarity / multi-calendar usability)

## Checklist

### Stage 1: Per-month lock button in `pto-entry-form` render

- [x] Add a `<button class="btn-month-lock" data-action="toggle-month-lock" data-month="${month}">` inside each `.month-card` in `pto-entry-form`'s `render()` method (after the `<month-summary>` element).
- [x] Style `.btn-month-lock` to render inline within the month-card footer — compact, unobtrusive (muted icon + text, e.g., "🔓 Lock" / "🔒 Unlock").
- [x] Ensure the button is **hidden** in single-calendar mode (CSS `[data-mode="single"] .btn-month-lock { display: none; }`).
- [ ] **Validate:** Desktop view shows a lock button under each month card; mobile view does not.

### Stage 2: Event plumbing from `pto-entry-form` → `submit-time-off-page`

- [x] In `pto-entry-form`, listen for clicks on `[data-action="toggle-month-lock"]` and dispatch a `CustomEvent("toggle-month-lock", { detail: { month: "YYYY-MM" } })` that bubbles out of the shadow DOM (composed).
- [x] In `submit-time-off-page`, listen for the `toggle-month-lock` event in `setupEventDelegation()`.
- [x] Wire the handler to the existing `handleToggleLock()` logic, but parameterised by the month from `event.detail.month` instead of `getDisplayedMonth()`.
- [ ] **Validate:** Clicking a per-month lock button triggers the correct lock/unlock API call for that specific month.

### Stage 3: Hide global lock button in multi-calendar mode

- [x] When `pto-entry-form` enters multi-calendar mode, hide the global `[data-action="toggle-lock"]` button in the page toolbar (add a `hidden` class or CSS rule keyed on `data-mode`).
- [x] When reverting to single-calendar mode, restore the global toolbar lock button.
- [ ] **Validate:** Resizing the viewport across the breakpoint toggles between per-month lock buttons and the global toolbar lock button.

### Stage 4: Per-month lock state rendering

- [x] In `applyLockStateUI()`, when in multi-calendar mode, iterate over all `.month-card` elements and update each card's `.btn-month-lock` text/class (`🔒 Unlock` / `🔓 Lock`) based on whether that month exists in `_acknowledgements`.
- [ ] For admin-locked months, hide the per-month lock button and optionally add a visual badge (e.g., a red lock icon) to the month-card header.
- [ ] Show per-month lock banners within the card (not the global banner) when a month is employee-locked or admin-locked.
- [ ] **Validate:** Locking month 3 shows "🔒 Unlock" only on March; other months remain "🔓 Lock". Admin-locked months show the admin badge.

### Stage 5: Unit tests

- [x] Add Vitest tests for `pto-entry-form` verifying that each `.month-card` contains a `.btn-month-lock` button with the correct `data-month` attribute.
- [x] Add Vitest tests for `submit-time-off-page` verifying the `toggle-month-lock` event handler calls `services.acknowledgements.submit()` / `remove()` with the correct month.
- [x] Test that the global toolbar lock button visibility toggles with `data-mode`.
- [x] **Validate:** `pnpm test` passes.

### Stage 6: Quality gates

- [x] `pnpm run build` passes.
- [x] `pnpm run lint` passes.
- [ ] Manual testing: lock/unlock individual months in desktop view, verify correct API calls.
- [ ] Manual testing: resize to mobile, verify single-calendar lock button still works.
- [ ] Manual testing: verify admin-locked month is non-interactive per-card.

## Implementation Notes

- The `.month-card` structure is rendered in `pto-entry-form/index.ts` (`render()` method, lines ~370–390). Each card wraps a `<pto-calendar>` and `<month-summary>`. The lock button should be appended after `<month-summary>`.
- The existing lock/unlock logic in `submit-time-off-page` (`handleToggleLock`, `refreshLockState`, `applyLockStateUI`) can be parameterised — the key change is accepting a `month: string` argument instead of always calling `getDisplayedMonth()`.
- In single-calendar mode, the global toolbar lock button should continue to work as-is (no regression).
- CSS for `.btn-month-lock` should use existing design tokens (`--color-surface-hover`, `--color-warning`, `--color-border`) for consistency.
- The `toggle-month-lock` custom event must be `composed: true` to cross shadow DOM boundaries.
- Consider adding `aria-label="Lock January"` (dynamic month name) for accessibility.

## Questions and Concerns

1.
2.
3.

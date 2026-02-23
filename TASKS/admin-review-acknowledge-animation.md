# Admin Review Acknowledge Animation & Pending Filter

## Description

Enhance the admin monthly review page so that when an administrator acknowledges an employee's review, the card animates (scales down to 25%) before being removed from the view. Additionally, the employee grid should only render cards with a "Pending" status, filtering out already-acknowledged cards entirely.

Currently, after clicking "Acknowledge Review" and confirming, the card immediately transitions to an "Acknowledged" visual state but remains visible. This feature adds a polished exit animation and limits the grid to actionable (pending) cards only.

## Priority

🟢 Low Priority (Polish & Production)

## Checklist

### Phase 1: Filter Employee Grid to Pending Only

- [x] Update `render()` or `renderEmployeeCard()` in `admin-monthly-review/index.ts` to skip employees where `acknowledgedByAdmin` is `true`
- [x] Ensure newly acknowledged cards are excluded after data refresh
- [x] Verify the empty-state behavior when all employees are acknowledged
- [ ] Manual testing: confirm only pending cards appear on load

### Phase 2: Scale-Down Exit Animation on Acknowledge

- [x] Add a `scale-down` keyframe to `client/css-extensions/animations/animations.ts` (animate `transform: scale(1)` → `transform: scale(0.25)` with `opacity: 1` → `opacity: 0`) and a corresponding `.anim-scale-down` utility class, following the existing pattern for `fade-out`, `slide-out-left`, etc.
- [x] Include `.anim-scale-down` in the existing `@media (prefers-reduced-motion: reduce)` block inside `animations.ts`
- [x] Create a new `animateDismiss()` JS helper in `client/css-extensions/animations/index.ts` following the inline-style + `transitionend` pattern used by `animateSlide()` — must include `prefersReducedMotion()` fast-path, `will-change` setup, `transitionend` listener filtered by `propertyName`, `setTimeout` fallback, and `cleanupStyles()` on completion. Return an `AnimationHandle`.
- [x] Export `animateDismiss` from `client/css-extensions/index.ts` facade
- [x] In `admin-monthly-review/index.ts`, after the `admin-acknowledge` event is dispatched, locate the `.employee-card[data-employee-id="..."]` element in the shadow DOM and call `animateDismiss(card)`. On `handle.promise` resolution, trigger data refresh / re-render to remove the card.
- [x] Accessibility: `prefersReducedMotion()` is queried at animation invocation time (not at component init) per css-animation-assistant guidance

### Phase 3: Testing and Validation

- [x] Add Vitest unit test: after acknowledge, only pending cards are rendered
- [x] Add Vitest unit test: animation handle resolves and card is removed
- [ ] Manual testing: verify animation plays smoothly in Chrome
- [ ] Manual testing: verify card is removed after animation completes
- [ ] Manual testing: verify reduced-motion preference skips animation
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes (including `pnpm lint:css` for stylelint)

## Implementation Notes

- **Animation library**: Use the shared `client/css-extensions/animations/` library rather than component-local CSS. Add a new `@keyframes scale-down` to `animations.ts` and a new `animateDismiss()` JS helper to `index.ts`, following the established patterns (`animateSlide`, `animateCarousel`).
- **css-animation-assistant skill**: Follow the lessons in `.github/skills/css-animation-assistant/SKILL.md`:
  - Use **inline styles, not CSS classes** for the transition (avoids specificity conflicts).
  - Force synchronous reflow with `void element.offsetHeight` before enabling the transition.
  - Filter `transitionend` by `e.propertyName === "transform"` to prevent double-firing.
  - Add a `setTimeout` fallback after `durationMs + 50` that runs the same completion logic as `transitionend`.
  - Deduplicate completion logic into a single `onComplete` closure shared by the listener and the timeout.
  - Clean up inline styles (`will-change`, `transition`, `transform`, `opacity`) after completion via `cleanupStyles()`.
  - Query `prefersReducedMotion()` at animation invocation time, not at init.
- **AnimationHandle**: Return an `AnimationHandle` (with `promise` and `cancel`) for the caller to await completion before re-rendering.
- **Animation properties**: Only animate `transform` and `opacity` for GPU-composited, 60 FPS performance (per CSS Animation Policy).
- **Duration**: Use `--duration-normal` token (~250ms) with `--easing-accelerate` for exit feel, consistent with `animateSlide(show=false)`.
- **Reduced motion**: Under `prefers-reduced-motion: reduce`, `prefersReducedMotion()` returns true and the helper resolves immediately — no visual transition.
- **Event flow**: The component dispatches `admin-acknowledge` to the parent, which calls the API and then calls `setEmployeeData()` / `setAcknowledgmentData()`. The animation should happen between the event dispatch and the data refresh arriving.
- **Rendering filter**: In `render()`, filter `this._employeeData` with `.filter(emp => !emp.acknowledgedByAdmin)` before mapping to cards.
- **Exports**: Export `animateDismiss` through the `client/css-extensions/index.ts` facade so the admin-monthly-review component imports it alongside `animateSlide` and `animateCarousel`.

## Questions and Concerns

1. **Bug: Card briefly appears full-size after scale-down animation** — The `animateDismiss()` helper in `client/css-extensions/animations/index.ts` uses a two-phase animation. Phase 1 correctly scales the card to `scale(0.25)` with `opacity: 0`. However, Phase 2 then transitions the card _back_ to `scale(1)` and `opacity: 1` (lines 351-352) before resolving the promise, causing the card to "flash" at full size for ~150ms (the `--duration-fast` token). Only after Phase 2 completes does `cleanupStyles()` run and the promise resolve, triggering the re-render that removes the card from the DOM. **Fix**: Remove Phase 2 entirely — `onComplete()` should fire directly after Phase 1 ends, so the card is removed while still scaled down and invisible.
2.
3.

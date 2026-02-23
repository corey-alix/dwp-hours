# Swipe & Carousel Navigation De-duplication

## Description

The swipe gesture detection and `navigateMonthWithAnimation` carousel logic are duplicated across two components:

| Concern                | `pto-entry-form`                            | `admin-monthly-review`                   |
| ---------------------- | ------------------------------------------- | ---------------------------------------- |
| Swipe state fields     | `_swipeStartX`, `_swipeStartY`              | `_swipeStartX`, `_swipeStartY`           |
| Animation guard fields | `isAnimating`, `currentAnimation`           | `_isAnimating`, `_currentAnimation`      |
| Swipe listener setup   | `setupSwipeListeners()`                     | `setupSwipeForCard(employeeId)`          |
| Animated navigation    | `navigateMonthWithAnimation(calendar, dir)` | `navigateMonthWithAnimation(empId, dir)` |

The bodies of the swipe handlers are nearly identical (50 px threshold, horizontal-dominant check, `animateCarousel` delegation). The only differences are:

1. **Container resolution** — `pto-entry-form` always targets `#calendar-container`; `admin-monthly-review` targets `.inline-calendar-container` inside a per-employee card.
2. **Content-swap callback** — `pto-entry-form` calls `this.updateCalendarMonth(calendar, direction)`; `admin-monthly-review` calls `this.navigateCalendarMonth(employeeId, direction)`.
3. **Listener lifecycle** — `admin-monthly-review` tracks listeners per card in a `Set<number>` because cards are dynamically expanded/collapsed.

This task extracts the shared logic into a reusable helper so future consumers (e.g. `pto-calendar` itself) get swipe + carousel for free and the two existing components shrink.

## Priority

🟢 Low Priority — Code quality / DRY refactor with no user-facing behaviour change.

## Options Analysis

Three viable approaches were identified:

### Option A — Animation-library helper function (recommended)

Add a `setupSwipeNavigation(component, container, onNavigate)` helper to `client/css-extensions/animations/index.ts` that:

- Registers `touchstart` / `touchend` on the given container via the component's `addListener()`.
- Detects horizontal-dominant swipes exceeding a 50 px threshold.
- Calls `animateCarousel(container, direction, () => onNavigate(direction))`.
- Manages `isAnimating` / `currentAnimation` guard internally and exposes a `cancel()` + `destroy()` API.

**Pros**: Keeps animation concerns co-located; no changes to `pto-calendar`'s public API; minimal blast radius.
**Cons**: Callers still import a function and wire it up manually.

### Option B — Mixin / trait on `BaseComponent`

Add a `SwipeNavigationMixin` that injects the swipe fields and methods into any `BaseComponent` subclass. Components opt in by calling `this.enableSwipeNavigation(container, onNavigate)`.

**Pros**: Very clean call site; leverages `addListener()` automatically.
**Cons**: Mixin patterns in vanilla TS can be awkward; adds conceptual weight to `BaseComponent`.

### Option C — Built into `pto-calendar`

Give `pto-calendar` its own swipe detection and emit a `navigate-month` event. Parent components listen for the event and handle month state.

**Pros**: Consumers get swipe for free by embedding `<pto-calendar>`.
**Cons**: `pto-calendar` is currently a pure display/selection component; it has no knowledge of month navigation. Adding navigation concerns (animation, month arithmetic) breaks SRP. `admin-monthly-review` animates the _container_ around the calendar, not the calendar itself.

### Recommendation

**Option A** is the best fit. It keeps the animation library as the single source of animation + gesture logic, imposes no API changes on `pto-calendar`, and is straightforward to test.

## Checklist

### Stage 1 — Extract shared helper into animation library

- [x] Define `SwipeNavigationHandle` type in `css-extensions/animations/types.ts`:
  ```ts
  export interface SwipeNavigationHandle {
    /** Cancel any in-flight carousel animation. */
    cancel(): void;
    /** Remove touch listeners and release resources. */
    destroy(): void;
  }
  ```
- [x] Implement `setupSwipeNavigation()` in `css-extensions/animations/index.ts`:
  - Accept `component: BaseComponent` (for `addListener`), `container: HTMLElement`, `onNavigate: (direction: -1 | 1) => void`.
  - Encapsulate `_swipeStartX`, `_swipeStartY`, `isAnimating`, `currentAnimation` as closure-local state.
  - Use the existing `animateCarousel()` internally.
  - Return a `SwipeNavigationHandle`.
- [x] Re-export from `css-extensions/index.ts`.
- [x] **Validate**: `pnpm run build` passes, existing tests pass.

### Stage 2 — Migrate `pto-entry-form`

- [x] Remove `_swipeStartX`, `_swipeStartY`, `isAnimating`, `currentAnimation` fields.
- [x] Replace `setupSwipeListeners()` body with a single `setupSwipeNavigation()` call.
- [x] Remove `navigateMonthWithAnimation()` private method; inline the `onNavigate` callback.
- [x] Store the returned `SwipeNavigationHandle` for potential cleanup.
- [x] **Validate**: `pnpm run build` passes, `pnpm test` passes, manual swipe test on calendar page.

### Stage 3 — Migrate `admin-monthly-review`

- [x] Remove `_swipeStartX`, `_swipeStartY`, `_isAnimating`, `_currentAnimation` fields.
- [x] Refactor `setupSwipeForCard()` to call `setupSwipeNavigation()` per card, storing handles per employee ID.
- [x] Remove `navigateMonthWithAnimation()` private method; supply `navigateCalendarMonth` as the callback.
- [x] On card collapse, call `handle.destroy()` to detach listeners.
- [x] **Validate**: `pnpm run build` passes, `pnpm test` passes, manual swipe + arrow navigation test.

### Stage 4 — Testing & documentation

- [x] Add Vitest unit tests for `setupSwipeNavigation()` in `tests/animations.test.ts`:
  - Swipe below threshold does not trigger navigation.
  - Vertical-dominant swipe does not trigger navigation.
  - Horizontal swipe triggers `onNavigate(-1 | 1)`.
  - Guard prevents overlapping animations.
  - `destroy()` removes listeners.
- [x] Verify `pnpm run lint` passes.
- [x] Update `css-extensions/` JSDoc / README if present.
- [ ] Manual testing: swipe + arrow navigation in both Submit Time Off and Admin Monthly Review pages.

### Quality gates

- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm test` passes (Vitest)
- [ ] Manual swipe test on mobile viewport
- [ ] No regressions in E2E tests

## Implementation Notes

- The helper should accept `BaseComponent` (or just `{ addListener: ... }`) so it can use the memory-safe listener tracking already in place. Alternatively, accept raw `addEventListener` and let the component call `destroy()` in `disconnectedCallback`.
- `admin-monthly-review` re-attaches swipe listeners after each re-render because `update()` replaces DOM. The helper's `destroy()` + re-create pattern must be lightweight enough for this.
- The `animateCarousel()` function already handles `prefers-reduced-motion` — the swipe helper should not duplicate that check.
- Keep the 50 px minimum distance and horizontal-dominant check as the default, but consider making them configurable via an options object for future flexibility.

## Questions and Concerns

1. ~~Should the helper accept a generic `EventTarget` (for `addListener`) or a concrete `BaseComponent` reference?~~ **Resolved**: Uses a narrow `ListenerHost` interface (`{ addListener(...): void }`). Callers cast `this as unknown as ListenerHost` since `BaseComponent.addListener` is `protected`.
2. Should the swipe threshold (50 px) be a CSS token or remain a hardcoded constant? It's a gesture heuristic, not a visual property, so a constant seems appropriate.
3. Should `pto-calendar` gain an optional `swipeable` attribute in a future task so it can self-manage navigation events?

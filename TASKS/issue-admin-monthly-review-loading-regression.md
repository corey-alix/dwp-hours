# Admin Monthly Review Loading Regression

## Description

The `/admin/monthly-review` page is stuck showing "Loading employee data..." and never loads any data. The `<admin-monthly-review>` component dispatches its `admin-monthly-review-request` event during the parent's `renderTemplate()` innerHTML assignment, but the parent's event listener has already been cleaned up at that point and is not yet re-added.

### Root Cause Analysis

The `BaseComponent.renderTemplate()` lifecycle creates a timing window where child component events are lost:

1. `AdminMonthlyReviewPage.connectedCallback()` → `setupEventDelegation()` adds custom listeners → `update()` → `renderTemplate()`
2. `renderTemplate()` calls `cleanupEventListeners()` — removes ALL `addListener()`-registered listeners (including the `admin-monthly-review-request` handler)
3. `this.shadowRoot.innerHTML = template` — browser synchronously creates `<admin-monthly-review>` and fires its `connectedCallback()`
4. `<admin-monthly-review>.connectedCallback()` calls `requestEmployeeData()` → dispatches `admin-monthly-review-request` event with `bubbles: true, composed: true`
5. **Event is lost** — the parent's listener was removed in step 2 and hasn't been re-added yet
6. `renderTemplate()` then calls `setupEventDelegation()` which re-adds the custom listeners — but the event already fired and was missed

The same issue occurs on subsequent renders triggered by `onRouteEnter()` → `requestUpdate()`.

### Key Files

- `client/pages/admin-monthly-review-page/index.ts` — parent page that listens for `admin-monthly-review-request`
- `client/components/admin-monthly-review/index.ts` — child component that dispatches the event in `connectedCallback()` → `requestEmployeeData()`
- `client/components/base-component.ts` — the `renderTemplate()` lifecycle that creates the timing window

## Priority

🔥 High Priority — The admin monthly review page is completely non-functional. Admins cannot review or acknowledge employee hours.

## Checklist

### Stage 1: Fix the Event Timing Issue

The child component's `requestEmployeeData()` fires synchronously during innerHTML assignment, before the parent re-adds its listeners. The fix must ensure the parent receives the event.

**Recommended approach**: Defer the `requestEmployeeData()` call in `AdminMonthlyReview.connectedCallback()` using `queueMicrotask()` so it fires after the parent's `renderTemplate()` completes and re-adds listeners.

**Alternative approaches** (evaluate if primary doesn't fit):

- Move data fetching initiation from the child's `connectedCallback()` to the parent's `renderTemplate()` completion (after `setupEventDelegation()`)
- Have the parent explicitly trigger data loading after render (e.g., query the child and call a method)

- [x] Defer `requestEmployeeData()` in `AdminMonthlyReview.connectedCallback()` using `queueMicrotask()` or equivalent
- [x] Verify the event is received by the parent and data loads correctly
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2: Add Regression Test

- [x] Add a Vitest unit test that verifies the `admin-monthly-review-request` event is dispatched and receivable by a parent listener after the component is inserted into a shadow DOM via innerHTML
- [ ] Test the full page lifecycle: `AdminMonthlyReviewPage` renders, child dispatches event, listener receives it
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 3: Verify E2E and Manual Testing

- [ ] Run existing Playwright E2E tests to check for regressions
- [ ] Manual testing: navigate to `/admin/monthly-review`, verify employee cards load
- [ ] Manual testing: verify calendar navigation and month switching still work
- [ ] Manual testing: verify acknowledge flow still works end-to-end

## Implementation Notes

- The `BaseComponent.renderTemplate()` pattern of cleanup → innerHTML → re-setup is used throughout the app. Any fix should be scoped to this specific component to avoid widespread changes. If a broader fix to `BaseComponent` is considered, it should be tested against all components.
- `queueMicrotask()` executes after the current synchronous block completes but before any macrotasks (setTimeout/requestAnimationFrame), making it the tightest possible deferral.
- The `composed: true` flag on the event is correct — the event crosses shadow DOM boundaries. The issue is purely listener timing, not event propagation.
- The `isEventDelegationSetup` guard in `BaseComponent.setupEventDelegation()` only protects the base class's generic listeners (click/submit/keydown). The child class's `addListener()` calls after `super.setupEventDelegation()` execute regardless of the guard — which is why listeners ARE re-added after render. The problem is they're added too late.

## Questions and Concerns

1. Should this fix also audit other components that dispatch events in `connectedCallback()` for the same timing issue? No, just fix this one issue.
2. Would a broader `BaseComponent` fix (e.g., deferring innerHTML child instantiation or re-adding listeners before innerHTML) be safer long-term? No, just fix this one issue.
3.

# PTO Balance Model

## Description

Extract and implement an **observable temporal balance model** (`PtoBalanceModel`) that computes an employee's running PTO balance on any given day of the year, accounting for beginning balance, monthly accruals, persisted entries, and pending (uncommitted) calendar selections. The model lives in `pto-entry-form` and serves as the single source of truth for overuse detection across all calendar instances.

This is a prerequisite for completing [pto-calendar-negative-balance-indicator.md](./pto-calendar-negative-balance-indicator.md), which depends on a centralized overuse computation to correctly flag days across sibling calendars in multi-calendar mode.

### Problem Statement

The current overuse indicator implementation has each `pto-calendar` instance computing overuse independently. In multi-calendar mode (12 months visible), clicking Jan 31 does not propagate to February's calendar — sibling calendars are blind to each other's pending selections. A centralized model solves this by merging all state in one place and distributing results to all calendars.

### Model Fields

| Field               | Source                                              | Mutated by                 |
| ------------------- | --------------------------------------------------- | -------------------------- |
| `beginningBalance`  | `annualAllocation + carryover` from PTO status API  | — (immutable for session)  |
| `monthlyAccruals`   | `{ month, hours }[]` from PTO status API            | — (immutable)              |
| `persistedEntries`  | Full year's PTO entries from `GET /api/pto`         | API refresh after submit   |
| `pendingSelections` | All calendars' `_selectedCells` merged              | User clicks (any calendar) |
| `balanceLimits`     | Sick (24h), Bereavement (16h), Jury Duty (24h) caps | — (immutable)              |

### Core Computation

```text
balance(date) = beginningBalance
              + sum(accruals for months <= date.month)
              - sum(hours of persisted + pending entries with entry.date <= date)
```

For PTO type, the limit is accrual-aware (varies by month). For Sick/Bereavement/Jury Duty the limit is a flat annual cap.

### Key Output

`getOveruseDates(): Set<string>` — dates where the running balance goes negative (first overuse day and all subsequent days of that type). Reuses the existing `getOveruseDates()` pure function from `shared/businessRules.ts`.

## Priority

🟡 Medium Priority — Prerequisite for the negative balance indicator feature; improves architecture by centralizing balance state.

## Checklist

### Phase 0 — Generic Observable&lt;T&gt; Base Class

- [x] Create `Observable<T>` abstract class in `client/shared/observable.ts`
- [x] Domain-agnostic — no PTO concepts, no business logic; reusable for any observable value
- [x] Core API: `get(): T`, `set(newValue: T): void`, `subscribe(observer): Unsubscribe`
- [x] `set()` uses equality check; skips notify when value is unchanged
- [x] Optional `equals?: (a: T, b: T) => boolean` constructor param (default `Object.is`) — enables callers to supply structural equality (e.g. for `Set<string>`, `Map`, arrays) without subclass overrides
- [x] `subscribe()` fires the observer immediately with the current value (eager push)
- [x] `protected notify()` snapshots subscriber set before iteration (safe mid-iteration unsubscribe)
- [x] `subscribeOnce(observer)` — auto-unsubscribes after first delivery
- [x] `batch(fn: () => void)` — suppress notifications during `fn`, then notify once at end if value changed. Enables atomic multi-field updates (e.g. `rebuildCalendars()` setting balance limits + entries + selections without N recomputes)
- [x] `dispose()` — clears all subscribers and marks the observable as disposed; subsequent `subscribe()` calls throw. Prevents memory leaks in long-lived SPA sessions
- [x] Exports `Subscriber<T>`, `Unsubscribe`, `ObservableLike<T>` types
- [x] Unit tests in `tests/observable.test.ts`:
  - `get()` returns initial value
  - `set()` + `get()` round-trips
  - `set()` with identical value does not notify (default `Object.is`)
  - Custom `equals` function used when provided
  - `subscribe()` fires immediately
  - `subscribe()` fires on subsequent `set()`
  - Unsubscribe stops notifications
  - `subscribeOnce()` fires once then auto-unsubscribes
  - Multiple subscribers all notified
  - Subscriber that unsubscribes during notification does not break iteration
  - `batch()` → single notification even with multiple `set()` calls
  - `batch()` → no notification if value unchanged after batch
  - `dispose()` clears subscribers
  - `subscribe()` after `dispose()` throws
- [x] `pnpm build` and `pnpm lint` pass

### Phase 1 — PtoBalanceModel extends Observable&lt;Set&lt;string&gt;&gt;

- [x] Create `PtoBalanceModel` class in `client/components/pto-entry-form/balance-model.ts`
- [x] `PtoBalanceModel extends Observable<Set<string>>` — the observable value **is** the overuse-dates set
- [x] Constructor accepts `beginningBalance`, `monthlyAccruals`, `balanceLimits` (Sick/Bereavement/Jury Duty caps); calls `super(new Set())`
- [x] `setPersistedEntries(entries)` — stores the full year's PTO entries, then calls `recompute()`
- [x] `setPendingSelections(selections)` — stores merged `Map<string, { hours, type }>`, then calls `recompute()`
- [x] `private recompute()` — merges persisted + pending, computes accrual-aware PTO limit, delegates to `getOveruseDates()`, then calls `this.set(result)` which notifies all subscribers
- [x] Accrual-aware PTO limit: `beginningBalance + sum(accruals[1..entryMonth])` — computed inline in the model, not in `shared/`
- [x] For Sick/Bereavement/Jury Duty: passes flat `allowed` cap to `getOveruseDates()`
- [x] Pass custom `equals` to `super()` — content-compare `Set<string>` (same size + every member present) to avoid unnecessary subscriber churn when recompute produces an identical set
- [x] Unit tests in `tests/pto-balance-model.test.ts`:
  - Empty model `get()` returns empty set
  - PTO entries within budget → no overuse
  - PTO entries exceeding budget → correct overuse dates
  - PTO entries spanning multiple months with accruals → overuse only after accrual-adjusted limit is crossed
  - Pending selections merged with persisted entries
  - Pending selection in January affects overuse detection in February
  - Sick/Bereavement/Jury Duty use flat caps correctly
  - Mixed PTO types computed independently
  - Subscriber is notified when `setPersistedEntries()` changes overuse result
  - Subscriber is notified when `setPendingSelections()` changes overuse result
  - Subscriber is NOT notified when mutation produces identical overuse set
- [x] `pnpm build` and `pnpm lint` pass

### Phase 2 — Integration into `pto-entry-form`

- [x] Instantiate `PtoBalanceModel` in `pto-entry-form` as a private field
- [x] Seed the model when `setBalanceLimits()` is called (receives `beginningBalance`, `monthlyAccruals`, type caps from `submit-time-off-page`)
- [x] Seed persisted entries when `setPtoData()` is called
- [x] Subscribe to the model once (`model.subscribe(overuseDates => …)`) — distribute `Set<string>` to all calendars via `cal.overuseDates = overuseDates`
- [x] On `selection-changed` event: collect all calendars' `selectedCells`, update model's `pendingSelections` — recompute + notify happens automatically
- [ ] In `rebuildCalendars()`: wrap calendar seeding in `model.batch(() => { … })` so balance limits, entries, and selections are applied atomically with a single recompute at the end
- [ ] Re-seed model after successful PTO submit (entries re-fetched)
- [x] Call `model.dispose()` in `disconnectedCallback()` and nullify the reference
- [x] Works in both single-calendar and multi-calendar modes (uniform code path)
- [x] `pnpm build` and `pnpm lint` pass

### Phase 3 — Simplify `pto-calendar`

- [x] Remove `_yearPtoEntries` field and `yearPtoEntries` getter/setter
- [x] Remove `_balanceLimits` field and `balanceLimits` getter/setter
- [x] Remove `recomputeOveruseDates()` method
- [x] Remove all `recomputeOveruseDates()` calls from property setters (`ptoEntries`, `selectedCells`, `selectedPtoType`, etc.)
- [x] Keep `_overuseDates: Set<string>` as a view-model field with a public setter that calls `requestUpdate()`
- [x] `renderDayCell()` continues to read `this._overuseDates.has(dateStr)` — rendering logic unchanged
- [x] No imports of `getOveruseDates` or `BalanceLimits` remain in `pto-calendar`
- [x] `pnpm build` and `pnpm lint` pass

### Phase 4 — Update `submit-time-off-page` Wiring

- [x] Pass `annualAllocation`, `carryoverFromPreviousYear`, and `monthlyAccruals` from PTO status API to `pto-entry-form` (new method or extend existing `setBalanceLimits`)
- [x] Remove direct `availablePTO + usedPTO` computation — the model owns it
- [x] Verify `updateCalendarBalanceLimits()` seeds the model correctly
- [x] `pnpm build` and `pnpm lint` pass

### Phase 5 — Integration Tests

- [x] Vitest component test: multi-calendar mode, click Jan 31 then Feb 1, verify "!" appears on Feb 1 when total exceeds budget
- [x] Vitest component test: single-calendar mode, click enough days to exceed budget, verify "!" appears on correct day
- [x] Vitest component test: unclick an overuse day, verify "!" disappears from subsequent days that are now within budget
- [x] Vitest component test: change PTO type via legend, verify overuse recomputes for new type
- [x] `pnpm build` and `pnpm lint` pass

### Phase 6 — Disposal & Leak Prevention

- [x] Verify `pto-entry-form.disconnectedCallback()` calls `model.dispose()` and nullifies the reference
- [x] Add leak-detection test: mount `pto-entry-form`, subscribe, disconnect, verify no subscribers remain on the disposed model
- [x] Add test: `subscribe()` on a disposed observable throws `Error`
- [x] Document in JSDoc on `PtoBalanceModel` that any component holding a model instance must call `dispose()` on teardown
- [x] `pnpm build` and `pnpm lint` pass

## Implementation Notes

- **`Observable<T>`** lives in `client/shared/observable.ts`. It is a domain-agnostic abstract class — no PTO types, no business rules. It can be reused for any reactive value in the app.
- **`PtoBalanceModel extends Observable<Set<string>>`**. The observable value is the overuse-dates set. Mutators (`setPersistedEntries`, `setPendingSelections`) trigger an internal `recompute()` → `this.set(newSet)` → subscribers auto-notified. Consumers never call a compute method explicitly.
- `Set<string>` equality: `Observable<T>` accepts an optional `equals` function in the constructor. `PtoBalanceModel` passes a set-content comparator (same size + every member) to `super()`. This avoids unnecessary subscriber churn when `recompute()` produces an identical set without requiring a subclass override of `set()`.
- **`batch(fn)`** suppresses notifications during `fn`, then fires a single notify at the end if the value changed. Used in `pto-entry-form.rebuildCalendars()` where balance limits, entries, and selections are set atomically on the model. Without batching, each setter would trigger a separate `recompute()` → `notify()` cycle.
- **`dispose()`** clears all subscribers and marks the observable as disposed. Called in `pto-entry-form.disconnectedCallback()`. Prevents memory leaks when `pto-entry-form` is destroyed and recreated across SPA navigations.
- The `getOveruseDates()` pure function in `shared/businessRules.ts` remains unchanged. It takes a flat `BalanceLimits` object and an entry array. The accrual-aware wrapping is the model's responsibility.
- The model is **not** a web component — it is a plain TypeScript class. No Shadow DOM, no `BaseComponent`. It is instantiated and owned by `pto-entry-form`.
- The `pto-calendar` component follows the web-components-assistant architecture: `overuseDates` is a complex-value setter that stores the `Set<string>` and calls `requestUpdate()`. The `render()` method is a pure function of the view-model. No custom diff or `updateDay()` logic for overuse — standard `requestUpdate()` only.
- The existing `pto-calendar.updateDay()` method for targeted single-day re-rendering is used by `toggleDaySelection()` for click feedback. The overuse setter uses `requestUpdate()` for consistency with the BaseComponent pattern.
- `collectSelectedCells()` and `collectPtoEntries()` already exist on `pto-entry-form` and can be reused to gather state for the model.
- `pto-entry-form` subscribes to the model in `connectedCallback()` and stores the unsubscribe handle for cleanup in `disconnectedCallback()`.

### Rejected Feedback (with rationale)

- **`ObservableArray<T>`** — Rejected. The codebase replaces arrays wholesale (`cal.ptoEntries = monthEntries`, `form.setPtoData(entries)`). No code path mutates entries in place. A simple `set()` with a new array matches the existing imperative data-down pattern used by all pages.
- **`map<U>(project)` derived observables** — Rejected. Building toward mini-RxJS with exactly one consumer (`pto-entry-form`). Pages use imperative setter calls after loader data arrives; no composition chain exists or is needed.
- **`Observable.from()` factory** — Rejected. No consumer needs a factory. Pages use direct instantiation.
- **`Map<PtoType, Set<string>>` instead of `Set<string>`** — Rejected. `getOveruseDates()` already groups by type internally. The calendar renders a uniform "!" indicator per date (`this._overuseDates.has(dateStr)`) regardless of which type triggered overuse. Changing to `Map<PtoType, Set<string>>` adds complexity at every read site for zero visual benefit — `selectedPtoType` context is already available on the calendar.

## Questions and Concerns

1.
2.
3.

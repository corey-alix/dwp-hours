# Orchestration: Global State + Event Delegation Refactors

## Purpose

Temporary orchestrator tracking unified progress across `global-state-refactor.md` and `event-delegation-refactor.md`. Global state goes first (establishes context protocol infrastructure), then event delegation (consumes it).

## Stage 0: Shared Foundation

- [x] Add `addCleanup(fn)` method to BaseComponent
- [x] Migrate internal `eventListeners[]` array to use `addCleanup()` under the hood
- [x] Create `StorageService` interface + `LocalStorageAdapter` in `client/shared/storage.ts`
- [x] Unit tests for `addCleanup()` lifecycle
- [x] Unit tests for `StorageService` / `LocalStorageAdapter`
- [x] Build passes, lint passes, existing tests pass

## Stage 1: Context Protocol (Global State Phase 2)

- [x] Implement `ContextProvider<T>` + `consumeContext<T>()` in `client/shared/context.ts`
- [x] Register `<notification-provider>` wrapping app root in `App.run()`
- [x] Unit tests for context protocol lifecycle
- [x] Build passes, lint passes

## Stage 2: Notification System (Global State Phase 3)

- [x] Replace `import { notifications }` in 7 consumer files with `consumeContext<TraceListener>`
  - **Done (7/7):** submit-time-off-page, admin-employees-page, admin-monthly-review-page, admin-pto-requests-page, prior-year-summary-page, upload-timesheet-page, pto-calendar
  - `UIManager.ts` migrated via constructor injection (receives `TraceListener` from `App.run()`)
- [x] Remove `export const notifications` singleton from `app.ts` (now module-scoped `const`)
- [x] Update notification tests to use fake providers
  - No test changes needed: page tests don't mock `notifications` from `app.ts`; TraceListener/DebugConsole tests are independent of context protocol
- [ ] Manual testing of toast notifications

## Stage 3: Activity & Debug (Global State Phases 4–5)

- [x] Refactor `activityTracker.ts` — add optional `StorageService` parameter
- [x] Fix `current-year-summary-page` — read user from `AuthService.getUser()` not raw localStorage
- [x] Refactor `pto-entry-form` + `pto-pto-card` localStorage to StorageService
- [x] Refactor `DebugConsoleController` — extract `activate()`/`deactivate()` lifecycle
- [x] Register `<debug-provider>` in `App.run()`
- [x] Update tests to use in-memory storage fakes
- [x] Build passes, lint passes, all tests pass

## Stage 4: Event System Design (Event Delegation Phases 1–2)

- [ ] Standardize target identification convention: `closest("[data-action]")` as primary pattern
- [ ] Extract shared two-click confirmation mixin (AdminMonthlyReview + PtoRequestQueue)
- [ ] Define typed custom event catalog with naming conventions
- [ ] Update architecture-guidance skill with event + context patterns
- [ ] Build passes, lint passes

## Stage 5: Critical Component Refactoring (Event Delegation Phases 3–4)

- [ ] **AdminMonthlyReview** — split 70-line click handler into action-zone methods, use confirmation mixin
- [ ] **PtoCalendar** — split 55-line click handler into note/day/legend/submit handlers
- [ ] **PtoRequestQueue** — split 55-line click handler, use confirmation mixin
- [ ] **EmployeeList** — consolidate 7 extra listeners, extract long-press behavior
- [ ] **EmployeeForm** — extract form submission logic from click handler
- [ ] **DashboardNavigationMenu** — unify duplicated click/keydown action routing
- [ ] Hybrid delegation: direct listeners for static elements, delegation only on dynamic containers
- [ ] Remove `_customEventsSetup` / `_inputListenerSetup` guard flags (use `addCleanup()`)
- [ ] Build passes, lint passes

## Stage 6: Validation (both tasks)

- [ ] Unit tests for all refactored event handlers (outgoing event contracts)
- [ ] Integration tests for incoming event reactions
- [ ] E2E smoke tests for critical user flows
- [ ] Memory leak audit — verify listener cleanup in disconnectedCallback
- [ ] Documentation updates
- [ ] Build passes, lint passes, all tests pass

## Status

**Current Stage:** 3 — Activity & Debug (complete)
**Started:** 2026-03-01

---

## Implementation Context (for resuming)

### Files Created / Modified So Far

**Stage 0 deliverables:**

- `client/components/base-component.ts` — replaced `eventListeners[]` record array with `_cleanups: Array<() => void>`. Added `addCleanup(fn)` method. `addListener()` now delegates to `addCleanup()` internally. `removeAllListeners()` drains `_cleanups`.
- `client/shared/storage.ts` — `StorageService` interface, `LocalStorageAdapter` (try/catch wrapped), `InMemoryStorage` (for tests).
- `tests/components/base-component.test.ts` — 5 tests (happy-dom): cleanup on disconnect, multiple cleanups in order, no double-run, addListener cleanup, cleanupEventListeners via requestUpdate.
- `tests/shared/storage.test.ts` — 6 tests (node): get/set/remove/overwrite/no-op/isolation.

**Stage 1 deliverables:**

- `client/shared/context.ts` — `ContextProvider<T>` (extends HTMLElement, registered as `context-provider`), `consumeContext<T>(element, key, callback)`, `createContextProvider<T>(key, value)`, `CONTEXT_KEYS` (`NOTIFICATIONS`, `DEBUG`). Provider intercepts `context-request` CustomEvents via bubbling. Consumers dispatch in `connectedCallback`.
- `client/app.ts` — `App.run()` mounts a `<context-provider>` with `style="display:contents"` wrapping `#app-wrapper`, providing the `notifications` TraceListener instance under `CONTEXT_KEYS.NOTIFICATIONS`.
- `tests/shared/context.test.ts` — 172-line test file covering context protocol lifecycle.

**Stage 2 in-progress (notification consumer migration):**

Migrated consumers (6 files) — all follow identical pattern:

```ts
// Import
import { consumeContext, CONTEXT_KEYS } from "../../shared/context.js";
import type { TraceListener } from "../../controller/TraceListener.js";

// Private field
private _notifications: TraceListener | null = null;

// In connectedCallback (after super.connectedCallback())
consumeContext<TraceListener>(this, CONTEXT_KEYS.NOTIFICATIONS, (svc) => {
  this._notifications = svc;
});

// Usage (nullable call)
this._notifications?.error("message");
```

Migrated files:

1. `client/pages/submit-time-off-page/index.ts`
2. `client/pages/admin-employees-page/index.ts`
3. `client/pages/admin-monthly-review-page/index.ts`
4. `client/pages/admin-pto-requests-page/index.ts`
5. `client/pages/prior-year-summary-page/index.ts`
6. `client/pages/upload-timesheet-page/index.ts`
7. `client/components/pto-calendar/index.ts`
8. `client/UIManager.ts` — constructor injection (`App.run()` passes `notifications` instance)

**Stage 2 code complete:**

- `export const notifications` removed from `client/app.ts` — now module-scoped `const`
- `client/UIManager.ts` constructor accepts `TraceListener` parameter; `App.run()` passes the instance
- No test changes required: existing tests don't import `notifications` from `app.ts`

**Stage 3 deliverables:**

- `client/shared/activityTracker.ts` — both functions now accept optional `StorageService` parameter (defaults to `LocalStorageAdapter`). Removed raw `localStorage` calls and inner try/catch (adapter handles errors).
- `client/pages/current-year-summary-page/index.ts` — added `authService` setter (auto-injected by router). Replaced `localStorage.getItem("currentUser")` with `this._authService?.getUser()?.name`.
- `client/components/pto-entry-form/index.ts` — added `_storage: StorageService` field (defaults to `LocalStorageAdapter`), exposed via `storage` setter. `persistSelectedMonth()`, `getPersistedMonth()`, `clearPersistedMonth()` now use `this._storage` instead of raw `localStorage`.
- `client/components/pto-pto-card/index.ts` — added `_storage: StorageService` field + setter. `isExpanded` setter and `restoreExpandedState()` now use `this._storage`.
- `client/controller/DebugConsoleController.ts` — extracted `activate()` / `deactivate()` lifecycle methods. `activate()` is idempotent (guarded by `_active` flag). `deactivate()` restores `console.*`, removes `window` error/rejection listeners, detaches the `<debug-console>` element. `destroy()` kept as deprecated alias.
- `client/app.ts` — `App.run()` now nests a `<debug-provider>` (keyed `CONTEXT_KEYS.DEBUG`, value: `DebugConsoleController`) inside the existing notifications provider.
- `tests/activityTracker.test.ts` — replaced `vi.stubGlobal("localStorage", ...)` with `InMemoryStorage`. Functions called with explicit `storage` parameter.
- `tests/components/pto-pto-card.test.ts` — replaced `vi.stubGlobal("localStorage")` with `InMemoryStorage` via `component.storage = storage`.

### Key Architecture Decisions

1. **Context keys are strings** (not Symbols) — stored in `CONTEXT_KEYS` const object.
2. **Provider is a single `<context-provider>` custom element** (not per-key element names) — key matching happens via event detail.
3. **`display: contents`** on the provider element so it doesn't affect layout.
4. **Consumers use nullable access** (`this._notifications?.error(...)`) since context may not be available in unit tests without a provider.
5. **UIManager uses constructor injection** (not context protocol) since it's a plain class, not a DOM element.

### Test Suite Status

All 1204 tests passing (1 skipped: server test). Key test files:

- `tests/shared/context.test.ts` — context protocol lifecycle (happy-dom)
- `tests/shared/storage.test.ts` — InMemoryStorage (node)
- `tests/components/base-component.test.ts` — addCleanup lifecycle (happy-dom)
- `tests/trace-listener.test.ts` — TraceListener unit tests (independent of context)
- `tests/components/debug-console.test.ts` — DebugConsoleController tests

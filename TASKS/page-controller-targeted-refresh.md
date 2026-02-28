# Page-as-Controller Targeted Refresh

## Description

Refactor `AdminPtoRequestsPage` to act as a **data controller** that pushes fresh data into child components via property setters — without re-rendering its own shadow DOM. Currently, the page calls `this.requestUpdate()` after data mutations (approve/reject), which replaces the entire shadow DOM tree, destroying transient child component state (expanded calendars, navigated months, scroll position, animations in flight). The fix is to decouple "data changed" from "page DOM changed" so child components retain their UI state across data refreshes.

Additionally, calendar PTO data should be fetched **on demand** — only when the user opens a calendar or navigates to a different month — rather than eagerly loading all PTO entries for all years upfront. This follows the single-purpose API principle: the existing `getAdminPTOEntries()` (current-year, for balance calculations) stays unchanged, and calendar data is fetched via a separate scoped request.

### Affected Pages

- **`admin-pto-requests-page`** — primary and sole target for this task

### Reference Pattern

`AdminMonthlyReviewPage` already follows the targeted-injection pattern: it listens for `admin-monthly-review-request` and `calendar-month-data-request` events, fetches data, and injects it via `setEmployeeData()` / `setPtoEntries()` / `setMonthPtoEntries()` without calling `this.requestUpdate()`. This task applies the same discipline to `admin-pto-requests-page`.

## Priority

🟡 Medium Priority

This is a core UX polish issue that affects admin approval workflows. It depends on no foundation tasks and unblocks smoother review/approval flows.

## Checklist

### Phase 1: On-demand calendar data via event-driven fetch

The queue currently receives all PTO entries eagerly via `queue.ptoEntries`. Instead, calendar data should be fetched on demand when the user opens or navigates a calendar.

- [ ] In `pto-request-queue/index.ts`, dispatch a `calendar-data-request` event (bubbles, composed) from `toggleCalendar()` (on expand) and `navigateCalendarMonth()`, with `detail: { employeeId, month }` — instead of reading from the local `_ptoEntries` array
- [ ] Remove the `_ptoEntries` field from `PtoRequestQueue` (and its setter/getter) — calendar data is no longer stored on the queue
- [ ] Remove `injectCalendarData()` private method — replaced by the event-driven flow
- [ ] Add a public `setCalendarEntries(employeeId: number, month: string, entries: CalendarEntry[])` method that finds the matching `<pto-calendar>` element and calls `cal.setPtoEntries(entries)` on it
- [ ] **Validate**: `pnpm run build` passes; clicking "Show Calendar" dispatches the event (visible in DevTools)

### Phase 2: Page handles calendar data requests

- [ ] In `admin-pto-requests-page/index.ts` → `setupEventDelegation()`, add a listener for `calendar-data-request` events
- [ ] The listener fetches PTO entries scoped to the requested employee + month via a targeted API call (e.g., `GET /admin/pto?employeeId={id}&startDate={YYYY-MM-01}&endDate={YYYY-MM-DD}`)
- [ ] On response, call `queue.setCalendarEntries(employeeId, month, normalized)` to inject data into the specific calendar
- [ ] **Validate**: Open a calendar → network request fires → calendar renders PTO data; navigate month → new request → new data rendered

### Phase 3: Targeted refresh after approve/reject (core change)

- [ ] In `refreshQueue()`, remove `this.requestUpdate()` and the `await new Promise(r => setTimeout(r, 0))` delay
- [ ] Instead, directly set properties on the existing `<pto-request-queue>` element:
  - `queue.requests = this._requests` (queue's own setter triggers its internal re-render)
- [ ] Remove `_allPtoEntries` field from the page — no longer needed since calendar data is fetched on demand
- [ ] In `populateQueue()`, stop setting `queue.ptoEntries` (field no longer exists)
- [ ] After the queue re-renders (its `requests` setter triggers `requestUpdate()`), re-fetch calendar data for any expanded calendars by dispatching a synthetic `calendar-data-request` for each expanded employee — or let the queue's re-render re-dispatch those events automatically
- [ ] Call `this.hydrateBalanceSummaries()` for balance badge updates (balance summaries live in light DOM slots — they survive because the page DOM is not re-rendered)
- [ ] Also update `_ptoEntries` in `refreshQueue()` so balance hydration uses fresh data
- [ ] **Validate**: Approve a request while a calendar is expanded → calendar stays open, approved dates show green check marks, balance summaries update, dismissed card animates out

### Phase 4: Unit tests

- [ ] Add a Vitest test for `PtoRequestQueue` verifying that:
  - `toggleCalendar()` dispatches a `calendar-data-request` event with correct `{ employeeId, month }`
  - `navigateCalendarMonth()` dispatches a `calendar-data-request` event with the new month
  - `setCalendarEntries()` injects data into the correct `<pto-calendar>` element
  - Setting `requests` while `_calendarExpandedEmployees` is non-empty preserves the expanded state after re-render
- [ ] Add a Vitest test for `AdminPtoRequestsPage` verifying that after `refreshQueue()`:
  - The queue's `requests` property is updated
  - The page's own `render()` was **not** called (no `requestUpdate` on the page)
  - `hydrateBalanceSummaries()` was called
- [ ] **Validate**: `npx vitest run` passes for new and existing tests

### Phase 5: Documentation and skill update

- [ ] Update `web-components-assistant/SKILL.md` to add a **"Page-as-Controller Data Flow"** section documenting:
  - Pages that act as data controllers should push data to children via property setters rather than re-rendering their own shadow DOM
  - `requestUpdate()` on a page should only be called when the page's own template structure changes (e.g., adding/removing child elements)
  - Child components that need data should dispatch events; pages handle fetching and inject results via methods
- [ ] Update `pto-request-queue/README.md` to document the `calendar-data-request` event and `setCalendarEntries()` method
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual testing: approve/reject with calendar open, navigate calendar months, verify green checks appear

## Implementation Notes

### Root causes

1. **Calendar closes**: `refreshQueue()` calls `this.requestUpdate()` on the page, which re-renders `<pto-request-queue>` from scratch. The queue's `_calendarExpandedEmployees` state survives on the JS object, but `populateQueue()` sets `queue.requests = ...` which triggers another `requestUpdate()` inside the queue. The `injectCalendarData()` that hydrates calendar cells only runs inside `toggleCalendar` and `navigateCalendarMonth` — not after `populateQueue`.

2. **Approved entries don't show green checks**: Calendar data was eagerly loaded at page entry and year-filtered, so the queue's calendar never sees updated `approved_by` values after approve/reject.

### Key design principles

1. **Page-as-controller**: The page's `render()` method defines the **structural template** (which child elements exist). Data flow into those children happens via **property setters and method calls**, not via re-rendering the parent. This keeps the parent DOM stable so child component state (expanded sections, scroll position, animations, focus) is preserved.

2. **On-demand data fetching**: Calendar data is fetched only when the user opens a calendar or navigates to another month. This follows single-purpose API design — one API for balance calculations (current-year PTO entries), a separate scoped request for calendar rendering. No API is asked to serve two purposes.

3. **Event-driven data flow**: Child components dispatch events requesting data; parent pages listen, fetch, and inject results. This is the established pattern in `admin-monthly-review-page` (see `calendar-month-data-request` event) and should be followed here.

### What NOT to change

- Do not remove `this.requestUpdate()` from `onRouteEnter()` — that's the initial render, where the page's structural template must be created
- Do not change how `pto-request-queue` internally re-renders when its `requests` setter is called — that's correct behavior for the child component
- The queue's `_calendarExpandedEmployees` and `_calendarMonths` state already survives across the queue's own re-renders; the problem is entirely in the page triggering an unnecessary parent re-render
- Do not modify `getAdminPTOEntries()` — it serves balance calculations for the current year; calendar data uses a separate scoped fetch

## Questions and Concerns

1. Calendar data should only be fetched when opening the calendar or navigating to another month — not eagerly at page load. **Resolution**: Phase 1 switches to event-driven on-demand fetching, removing the `_ptoEntries` / `_allPtoEntries` fields from the queue.
2. Each API should have a specific purpose — do not complicate an API by adding extra data when a second API can solve that specific problem. **Resolution**: `getAdminPTOEntries()` stays current-year-only for balances; calendar data uses a separate `GET /admin/pto?employeeId=...&startDate=...&endDate=...` scoped request.
3. All pages that render data and allow edits could benefit from this pattern. **Resolution**: For now, focus exclusively on `admin-pto-requests-page`. The pattern will be documented in the web-components-assistant skill for future application to other pages.

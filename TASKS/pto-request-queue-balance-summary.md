# PTO Request Queue — Employee Balance Summary

## Description

The `admin-pto-requests-page` renders a `<pto-request-queue>` component that displays pending PTO requests for admin review. Currently, when reviewing a request the admin has no visibility into the employee's remaining PTO balances. Adding a `<month-summary>` component at the top of each request card would let the administrator see at a glance how much PTO, Sick, Bereavement, and Jury Duty time the employee has remaining before approving or rejecting the request.

This follows the same pattern established in the `admin-employees-page` → `employee-list` integration (see `admin-employees-balance-hydration.md`), where:

1. The parent page fetches PTO entries via `getAdminPTOEntries()`
2. The child component (`pto-request-queue`) exposes named slots for each employee card
3. The parent provides `<month-summary>` elements as slotted content and hydrates them with balance data

## Priority

🟡 Medium Priority — UX enhancement on an existing admin page; no schema or API changes needed.

## Checklist

### Stage 1 — Add balance slot to pto-request-queue request cards

- [x] In `PtoRequestQueue.renderRequestCard()`, add a named slot `<slot name="balance-{requestId}"></slot>` inside each request card (above the employee name header)
- [x] Remove unused `<slot name="balance-summary">` from the queue container
- [x] Verify build passes: `pnpm run build`

### Stage 2 — Provide slotted month-summary from admin-pto-requests-page

- [x] In `AdminPtoRequestsPage.render()`, render `<month-summary slot="balance-{requestId}" data-employee-id="{employeeId}"></month-summary>` as light-DOM children inside the `<pto-request-queue>` element for each pending request
- [x] Use per-request slots (not per-employee) to ensure every request card shows the balance even when an employee has multiple pending requests
- [x] Verify build passes: `pnpm run build`

### Stage 3 — Fetch PTO entries and hydrate balances

- [x] In `AdminPtoRequestsPage.onRouteEnter()`, fetch PTO entries via `this.api.getAdminPTOEntries()` and store in a `_ptoEntries` field (filtered to current year)
- [x] Create a `hydrateBalanceSummaries()` method that:
  1. Queries `this.shadowRoot.querySelectorAll("month-summary")`
  2. For each element, reads `data-employee-id`, computes used hours per PTO category from `_ptoEntries`, and sets `ptoHours`, `sickHours`, `bereavementHours`, `juryDutyHours`, and `balances` properties
- [x] Call `hydrateBalanceSummaries()` after `populateQueue()` in `onRouteEnter()` and `refreshQueue()`
- [x] Handle edge cases: employees with no PTO entries (show full remaining), fetch failure (log error, leave summaries empty)
- [x] Verify build passes: `pnpm run build`

### Stage 4 — Testing & quality gates

- [ ] Add or update E2E test in `e2e/component-pto-request-queue.spec.ts` to assert that `<month-summary>` elements are visible inside request cards and display numeric values
- [x] Verify build passes: `pnpm run build`
- [x] Verify lint passes: `pnpm run lint`
- [ ] Manual testing of the admin PTO requests page with pending requests

## Implementation Notes

- **No new API endpoints needed** — `getAdminPTOEntries()` already exists in `APIClient.ts` and is already called in `refreshQueue()`.
- **No new shared utilities needed** — the balance computation pattern (filter entries by employee + category, sum hours) is already used in `admin-employees-page`.
- **Slot pattern**: Matches the `employee-list` slot approach where the parent page owns the `<month-summary>` elements in its shadow DOM and the child component provides named slots. This allows the parent to query and hydrate the elements directly.
- **Existing data**: `refreshQueue()` already fetches both employees and PTO entries. The `_ptoEntries` data can be extracted from this existing fetch rather than adding a new one.
- **Multiple requests per employee**: A single employee may have multiple pending requests. The slot name `balance-{employeeId}` means one `<month-summary>` per employee, but each request card for that employee should show the slot. Consider whether each card needs its own slot (e.g., `balance-{requestId}`) or if a single per-employee summary suffices. Per-employee is recommended since balances don't vary per request.
- **Balance limits**: Use `BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS` for Sick, Bereavement, and Jury Duty. PTO limit is 80 hours (or derived from employee `ptoRate` × days if available).

## Questions and Concerns

1.
2.
3.

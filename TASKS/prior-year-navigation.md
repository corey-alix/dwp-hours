# Prior Year Navigation

## Description

Extend the Prior Year Summary page (`/prior-year-summary`) with year navigation controls so employees can browse PTO history for **any** prior year that contains data — not just the single most-recent year. The `<prior-year-review>` component already renders an arbitrary year when fed the correct `PTOYearReviewResponse`; this task adds the discovery, routing, and UI layers that let the user switch between years.

Key deliverables:

1. A new API endpoint that returns the set of years for which the authenticated employee has PTO data.
2. A year-navigation bar (prev / next buttons or year selector) rendered inside the page component.
3. Route and loader changes so the page can load any requested year.
4. Updated tests (unit, integration, E2E) covering multi-year navigation.

## Priority

🟡 Medium Priority — Builds on the completed `prior-year-review` feature and the design-improvement finding #7 ("No year navigation"). No database schema changes; extends existing API and UI.

## Checklist

### Phase 1: API — Discover Available Years

Add an endpoint that returns the distinct years for which the employee has at least one PTO entry, so the client knows which years to offer.

- [x] Add `GET /api/pto/available-years` endpoint in `server/server.mts`
  - Returns `{ years: number[] }` sorted descending (most recent first)
  - Scoped to the authenticated employee (`req.employee!.id`)
  - Excludes the current year (prior years only)
- [x] Add response type `PTOAvailableYearsResponse` to `shared/api-models.d.ts`
- [x] Add typed wrapper `getAvailableYears()` to `client/APIClient.ts`
- [x] Expose via `PTOService` interface and `service-container.ts`
- [x] Add constant `PRIOR_YEAR_NAV_MIN_YEARS = 1` to `shared/businessRules.ts` (minimum entries to show navigation; default 1)
- [x] Write Vitest integration test in `tests/api-integration.test.ts`
  - Seed employee with PTO in 2023, 2024, 2025 → expect `[2025, 2024, 2023]`
  - Employee with no prior-year data → expect `[]`
  - Unauthenticated → 401
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 2: Route & Loader — Parameterised Year

Update the router so `/prior-year-summary` accepts an optional `?year=YYYY` query parameter.

- [x] Update the route loader in `client/router/routes.ts` to read `search.get("year")`
  - If present and valid, load that year via `svc.pto.getYearReview(year)`
  - If absent, default to `getCurrentYear() - 1` (current behaviour)
- [x] Update loader signature to accept `_params, search` (matches `current-year-summary` pattern)
- [x] Pre-fetch available years in the same loader (`svc.pto.getAvailableYears()`) and pass both to the page
- [x] Define a combined loader-data type (e.g., `PriorYearSummaryLoaderData`) in the page file or `shared/api-models.d.ts`
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Phase 3: Page UI — Year Navigation Bar

Add prev/next year buttons (and optionally a year dropdown) to `PriorYearSummaryPage`.

- [x] Add `availableYears: number[]` to page state, populated from loader data
- [x] Render a navigation bar between the page heading and the sticky summary:
  - **« Prev Year** button (disabled when already at the oldest available year)
  - **Current year label** (e.g., "2024")
  - **Next Year »** button (disabled when already at the newest available year)
- [x] On button click, navigate to `/prior-year-summary?year=YYYY` using the router (no full page reload)
- [x] Highlight / update heading and summary when year changes
- [x] Hide the navigation bar entirely when `availableYears.length <= 1` (only one prior year exists)
- [x] Style navigation bar using design tokens from `tokens.css`; add styles to `client/pages/prior-year-summary-page/css.ts`
- [x] Ensure keyboard accessibility (focus management, arrow-key support if using button group)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run lint:css` passes

### Phase 4: Testing & Validation

- [x] Write Vitest unit tests for the page component's year-switching logic
  - Navigation bar renders correct buttons for `[2025, 2024, 2023]`
  - Prev/Next disabled states at boundaries
  - Navigation bar hidden when only 1 year available
- [x] Write Vitest unit test for the new `getAvailableYears` API wrapper
- [ ] Add E2E test in `e2e/` (follow existing `prior-year-summary` test pattern)
  - Navigate to `/prior-year-summary`
  - Click **« Prev Year** and verify the heading updates
  - Click **Next Year »** and verify return to original year
  - Verify disabled state at boundaries
- [ ] Manual testing: seed database with multi-year data, confirm navigation works
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] All existing tests pass (no regressions)

### Phase 5: Documentation & Polish

- [x] Update `client/components/prior-year-review/README.md` to describe year navigation
- [x] Update `TASKS/prior-year-review.md` Q3/Q10 decision from "1 year" to "all available prior years"
- [x] Update `README.md` API endpoint table with `GET /api/pto/available-years`
- [x] Update `TASKS/prior-year-summary-design-improvements.md` Finding #7 to mark as addressed
- [x] Code review and final linting
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

## Implementation Notes

- **No database changes required** — the query is a simple `SELECT DISTINCT strftime('%Y', date) FROM pto_entries WHERE employee_id = ?`.
- The `<prior-year-review>` component is already year-agnostic; only the page wrapper and route loader need changes.
- The existing `/api/pto/year/:year` endpoint already validates `currentYear - 10` to `currentYear`, so up to 10 years of history are supported server-side.
- Follow the `current-year-summary` loader pattern which already reads `search.get("employeeId")`.
- Use `router.navigate()` for client-side navigation to avoid full page reloads.
- The navigation bar should respect `prefers-reduced-motion` for any transition animations.
- The available-years endpoint should be lightweight; it's a single `DISTINCT` query, no need for caching.

## Questions and Concerns

1.
2.
3.

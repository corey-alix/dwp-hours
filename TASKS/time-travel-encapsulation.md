# Time-Travel Encapsulation

## Description

The time-travel feature (`?current_day=YYYY-MM-DD`) was designed so that `today()` is the **sole public interface** for obtaining the current date. However, internal time-travel state has leaked into multiple modules via direct imports of `getTimeTravelDay()`, `getTimeTravelYear()`, `setTimeTravelYear()`, and the raw `current_year` / `current_date` query-string parameters. This creates tight coupling, dual-source bugs, and makes the system harder to reason about.

**Goal**: Seal the time-travel implementation so that:

1. Only `client/app.ts` reads the `?current_day` query parameter and calls `setTimeTravelDay()` at bootstrap — this is the **only entry point**.
2. `today()` (and its derivatives `getCurrentYear()`, `getCurrentMonth()`) are the **only public outputs** — no module outside `dateUtils.ts` should ever call `getTimeTravelDay()`, `getTimeTravelYear()`, or read `current_year` / `current_day` from the URL.
3. The server receives **no** time-travel query parameters. All server endpoints that currently accept `?current_date` or `?current_year` must instead derive the relevant date from `today()` on the server, or accept a semantic parameter (e.g., `:year` path param) that the client computes from `today()` / `getCurrentYear()`.
4. Drop support for `?current_year` entirely — `?current_day` is strictly more flexible.
5. Remove `setTimeTravelYear()`, `getTimeTravelYear()`, `getTimeTravelDay()`, and `setTimeTravelDay()` from exports (or delete the year-only functions). Keep `setTimeTravelDay()` as the sole internal setter, callable only from `app.ts` bootstrap.

### Leak Inventory

| #   | File                                         | Leak                                                                                                                                                                    | Severity   |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `client/APIClient.ts`                        | Imports `getTimeTravelDay` + `getTimeTravelYear`; builds `?current_date` / `?current_year` query strings for 4 server endpoints                                         | **High**   |
| 2   | `client/router/router.ts`                    | Imports `getTimeTravelDay` + `getTimeTravelYear`; injects `?current_day` / `?current_year` into SPA navigation URLs                                                     | **Medium** |
| 3   | `client/pages/admin-employees-page/index.ts` | Reads `current_year` directly from URL search params (bypasses `getCurrentYear()`)                                                                                      | **Low**    |
| 4   | `server/server.mts` (4 endpoints)            | Accepts `?current_date` / `?current_year` query params: `/api/pto/status`, `/api/admin-acknowledgements`, `/api/admin/employees/:id/pto-summary`, `/api/pto/year/:year` | **High**   |

### Server Endpoints Requiring Refactor

| Endpoint                                   | Current Param              | Refactor Approach                                                                                                                             |
| ------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/pto/status`                      | `?current_date=YYYY-MM-DD` | Use server-side `today()` exclusively; client stops sending param                                                                             |
| `POST /api/admin-acknowledgements`         | `?current_date=YYYY-MM-DD` | Use server-side `today()` exclusively; client stops sending param                                                                             |
| `GET /api/admin/employees/:id/pto-summary` | `?current_date=YYYY-MM-DD` | Use server-side `today()` exclusively; client stops sending param                                                                             |
| `GET /api/pto/year/:year`                  | `?current_year=YYYY`       | Client already passes `:year` in the path — remove `?current_year` validation-window hack; validate against a fixed range or server `today()` |

## Priority

🟡 Medium Priority

This is an architectural hygiene issue. The leaks create coupling that makes the time-travel feature fragile and the server implicitly dependent on client-side state forwarding. Fixing it reduces complexity and enables future server-side time-travel support if needed.

## Checklist

### Phase 1: Drop `current_year` Support & Remove Year-Only Functions

- [x] In `shared/dateUtils.ts`, remove `setTimeTravelYear()` export (keep as internal private if needed, or delete entirely)
- [x] In `shared/dateUtils.ts`, remove `getTimeTravelYear()` export
- [x] Remove `_timeTravelYear` module-level variable and all year-only override logic
- [x] Update `today()`, `getCurrentYear()`, `getCurrentMonth()` to only check `_timeTravelDate` (no year-only path)
- [x] In `client/app.ts`, remove the `?current_year` bootstrap block; only `?current_day` is supported
- [x] Update all Vitest tests in `tests/time-travel.test.ts` — remove year-only test cases, add tests confirming year-only functions are gone
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 2: Encapsulate Time-Travel Getters

- [x] In `shared/dateUtils.ts`, stop exporting `getTimeTravelDay()` (make it module-private or remove)
- [x] If router needs to preserve query params, add a single encapsulated helper to `dateUtils.ts`: `getTimeTravelQueryParams(): Record<string, string>` — returns `{ current_day: "YYYY-MM-DD" }` when active, or `{}` when inactive
- [x] Update `client/router/router.ts` to use the new helper instead of importing raw getters
- [x] Remove `getTimeTravelDay` and `getTimeTravelYear` imports from `client/router/router.ts`
- [x] Remove `getTimeTravelDay` and `getTimeTravelYear` imports from `client/APIClient.ts`
- [x] Update `tests/api-client.test.ts` to remove `setTimeTravelDay` / `setTimeTravelYear` usage; test with `today()` directly
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 3: Remove Server-Side Time-Travel Params

- [x] `GET /api/pto/status` — remove `?current_date` query param handling; use server-side `today()` from `shared/dateUtils.ts`
- [x] `POST /api/admin-acknowledgements` — remove `?current_date` query param handling; use server-side `today()`
- [x] `GET /api/admin/employees/:id/pto-summary` — remove `?current_date` query param handling; use server-side `today()`
- [x] `GET /api/pto/year/:year` — remove `?current_year` query param; validate `:year` path param against server-side `getCurrentYear()` range
- [x] In `client/APIClient.ts`, remove the `timeTravelQuery()` private method entirely
- [x] Remove all `timeTravelQuery()` call sites: `getPTOStatus()`, `getPTOYearReview()`, `submitAdminAcknowledgement()`
- [x] Verify API calls work correctly without time-travel query params
- [x] Add/update Vitest tests for the affected server endpoints to confirm they no longer accept `?current_date` / `?current_year`
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 4: Fix Remaining Client Leaks

- [x] In `client/pages/admin-employees-page/index.ts`, remove `_search.get("current_year")` fallback; rely solely on `getCurrentYear()` from `dateUtils`
- [x] Audit all remaining imports of time-travel functions — only `setTimeTravelDay` should remain, imported only by `client/app.ts`
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 5: Server-Side Time-Travel Bootstrap (Enable E2E Testing)

Since the server can no longer receive time-travel params from the client, add server-side time-travel support for E2E and manual testing:

- [x] Import `setTimeTravelDay` in the server bootstrap (e.g., `server/server.mts` or a startup hook)
- [x] Read `?current_day` from an environment variable (e.g., `TIME_TRAVEL_DAY`) or a startup config — **not** from per-request query params
- [x] When set, both client and server share the same `today()` override
- [ ] Add documentation for E2E testing: start server with `TIME_TRAVEL_DAY=2018-03-15 pnpm start`
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 6: Validation & Documentation

- [ ] Manual testing: navigate to `/?current_day=2018-03-15`, verify all pages render with 2018 context
- [ ] Manual testing: confirm `?current_year` no longer has any effect
- [ ] Manual testing: verify API responses use correct dates without explicit params
- [ ] Update `TASKS/time-travel-testing.md` to reflect the new architecture (mark superseded sections)
- [ ] Update README.md "Development Best Practices" with revised time-travel instructions
- [ ] Run full E2E test suite
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

## Implementation Notes

### Architecture After Refactor

```
URL (?current_day=2018-03-15)
  │
  ▼
app.ts bootstrap ──► setTimeTravelDay("2018-03-15")
                         │
                         ▼
                   dateUtils._timeTravelDate = "2018-03-15"
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       today()    getCurrentYear()  getCurrentMonth()
       "2018-03-15"    2018          "2018-03"
          │              │              │
          ▼              ▼              ▼
    [All client code + server code use these]
```

- **No getter exports**: `getTimeTravelDay()` and `getTimeTravelYear()` are removed from the public API. The only way to observe time-travel effects is through `today()`, `getCurrentYear()`, and `getCurrentMonth()`.
- **Router preservation**: The router uses a new opaque helper (`getTimeTravelQueryParams()`) to preserve the query string across SPA navigations, without knowing the internal state shape.
- **Server independence**: The server imports `today()` from `shared/dateUtils.ts` (already shared code). For E2E testing, set `TIME_TRAVEL_DAY` env var at server startup — no per-request params needed.
- **Single query param**: Only `?current_day=YYYY-MM-DD` is supported. `?current_year` is dropped.

### Key Constraints

- `setTimeTravelDay()` must remain exported for `app.ts` bootstrap and test setup
- `getTimeTravelQueryParams()` is the only accessor that reveals time-travel state, and only returns URL-safe key-value pairs — not internal state
- All date-sensitive calculations must go through `today()` / `getCurrentYear()` / `getCurrentMonth()` — this is already the project convention

### Migration Path for Tests

- Unit tests that called `setTimeTravelYear()` should switch to `setTimeTravelDay("YYYY-01-01")` for equivalent behavior
- Tests that imported `getTimeTravelDay` / `getTimeTravelYear` to assert state should instead assert on `today()` output
- `tests/time-travel.test.ts` remains the canonical test file for time-travel behavior

## Questions and Concerns

1.
2.
3.

# Time Travel Testing Mode

## Description

The client is designed to operate within the current calendar year. While a "Prior Year Summary" view exists, there is no way to fully interact with data from arbitrary past years (e.g., 2018 imported data). This feature adds a "time travel" mechanism that lets the browser operate with a configurable reference date, shifting all date-related functions (`today()`, `getCurrentYear()`, `getCurrentMonth()`) to behave as if the current date falls within the chosen year or on a specific day. This is primarily for **manual testing and data review** of imported historical data.

Two query string modes are supported:

- **Year-only**: `?current_year=2018` — shifts the year while keeping real month/day from the clock
- **Full day**: `?current_day=2018-03-15` — freezes `today()` to the exact date; year and month are derived from it

`current_day` takes precedence over `current_year` if both are present. The client reads the query string parameter, sets the override in `dateUtils.ts`, and passes the overridden date/year to API endpoints explicitly. The server remains date-agnostic — it never reads these query params itself.

## Priority

🟢 Low Priority (Polish & Testing Tooling)

This is a developer/QA convenience feature. It has no user-facing production impact and no database or API changes.

## Checklist

### Phase 1: Core Date Override Infrastructure (Client)

- [x] Add `setTimeTravelYear(year: number | null): void` function to `shared/dateUtils.ts` (sets module-level override)
- [x] Add `getTimeTravelYear(): number | null` function to `shared/dateUtils.ts`
- [x] Modify `today()` to apply year offset when time-travel is active (shift year, keep month/day)
- [x] Modify `getCurrentYear()` to return overridden year when active
- [x] Modify `getCurrentMonth()` to return overridden year-month when active
- [x] In `client/app.ts` (or router init), read `?current_year=XXXX` from `window.location.search` and call `setTimeTravelYear()` on app startup
- [x] Ensure the query string parameter is preserved across client-side navigation
- [x] Write Vitest unit tests for all overridden behaviors
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 1b: Full Day Override (`?current_day=YYYY-MM-DD`)

- [x] Add `setTimeTravelDay(dateStr: string | null): void` function to `shared/dateUtils.ts`
- [x] Add `getTimeTravelDay(): string | null` function to `shared/dateUtils.ts`
- [x] Modify `today()` to return the exact day override when active (takes precedence over year-only)
- [x] Modify `getCurrentYear()` to derive year from day override when active
- [x] Modify `getCurrentMonth()` to derive year-month from day override when active
- [x] In `client/app.ts`, read `?current_day=YYYY-MM-DD` from `window.location.search` (precedence over `?current_year`)
- [x] Ensure `?current_day` is preserved across client-side navigation in `router.ts`
- [x] `APIClient.ts` requires no changes — `getTimeTravelYear()` and `today()` automatically reflect the day override
- [x] Write Vitest unit tests for `setTimeTravelDay` / `getTimeTravelDay` and all derived behaviors
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 2: API Endpoint Hardening

Make date-sensitive endpoints accept an explicit date/year parameter instead of deriving it internally:

- [x] `GET /api/pto/status` — accept optional `?current_date=YYYY-MM-DD` query param, pass to `calculatePTOStatus()`
- [x] `GET /api/pto/year/:year` — accept optional `?current_year=YYYY` to shift valid-year validation window
- [x] `GET /api/employees/:id/termination-payout` — accept optional `?current_date=YYYY-MM-DD`
- [x] `POST /api/admin/lock-month` — accept optional `?current_date=YYYY-MM-DD` for the month-ended guard
- [x] Update client API calls to pass the overridden date/year when time-travel is active
- [x] Write Vitest unit tests for each modified endpoint (with and without explicit date)
- [x] Verify `pnpm run build` passes
- [x] Verify `pnpm run lint` passes

### Phase 3: Integration Testing & Documentation

- [ ] Manual testing: navigate to `/?current_year=2018`, verify Current Year Summary shows 2018 data
- [ ] Manual testing: navigate to `/?current_day=2018-03-15`, verify Current Year Summary shows 2018 data and month context is March
- [ ] Manual testing: verify Prior Year Summary shows 2017 data when `?current_year=2018`
- [ ] Manual testing: verify Submit Time Off page shows 2018 calendar
- [ ] Manual testing: verify removing the query param returns to real current year
- [ ] Add E2E test (Playwright) that navigates with `?current_year=2018` and verifies year display
- [ ] Add E2E test (Playwright) that navigates with `?current_day=2018-03-15` and verifies date display
- [ ] Update README.md "Development Best Practices" with time-travel usage instructions
- [ ] Verify `pnpm run build` passes
- [ ] Verify `pnpm run lint` passes

## Implementation Notes

### Architecture

- **Query string driven**: The developer appends `?current_year=2018` or `?current_day=2018-03-15` to the URL. No UI controls, no persistent storage. Removing the param restores real-time behavior.
- **Two override modes**: Year-only (`?current_year`) shifts the year while keeping real month/day. Full day (`?current_day`) freezes `today()` to an exact date. `current_day` takes precedence.
- **Client + explicit API params**: The client shifts its date functions and passes the overridden year/date to API endpoints explicitly. The server never reads `?current_year` or `?current_day` itself—it receives an explicit `current_date` or `current_year` parameter on each affected endpoint.
- **Server is date-agnostic**: The server does not import or use time-travel functions. All date-sensitive server endpoints accept explicit date parameters from the client. Any server code that uses `today()` does so only for real wall-clock timestamps (e.g., `submitted_at`, `hire_date` defaults).
- **Centralized in `dateUtils.ts`**: Since all date operations already go through this module (per project convention), the override automatically propagates everywhere. Code that bypasses `dateUtils.ts` for date operations violates the date management skill and would not be affected by time-travel.
- **No banner/indicator**: This is a developer-only tool. The query string in the URL bar is sufficient indication.

### Key Functions

| Function            | No Override               | `?current_year=2018`            | `?current_day=2018-03-15`    |
| ------------------- | ------------------------- | ------------------------------- | ---------------------------- |
| `today()`           | Returns real `YYYY-MM-DD` | Returns `2018-MM-DD` (real M/D) | Returns `2018-03-15` exactly |
| `getCurrentYear()`  | Returns real year         | Returns `2018`                  | Returns `2018`               |
| `getCurrentMonth()` | Returns real `YYYY-MM`    | Returns `2018-MM` (real month)  | Returns `2018-03`            |

### API Parameter Convention

Client API calls pass the override through explicit query parameters:

| Client dateUtils            | Sent to API as             |
| --------------------------- | -------------------------- |
| `today()` → `2018-02-25`    | `?current_date=2018-02-25` |
| `getCurrentYear()` → `2018` | `?current_year=2018`       |

### Query String Usage

```text
http://localhost:3000/?current_year=2018
http://localhost:3000/?current_day=2018-03-15
http://localhost:3000/admin/monthly-review?current_year=2018
http://localhost:3000/admin/monthly-review?current_day=2018-03-15
```

The client reads `current_day` first (full date override), and falls back to `current_year` (year-only override). If both are present, `current_day` wins.

### Boundary Conditions

- If the override year's month/day combination is invalid (e.g., Feb 29 in a non-leap year), `today()` should clamp to the last valid day of the month (year-only mode). In full-day mode the date is validated upfront.
- The year value should be validated as a reasonable 4-digit year (e.g., 2000–2099).
- `setTimeTravelDay()` validates the full date string format and year range.
- Setting a day clears any active year-only override, and vice versa.

## Questions and Concerns

1. **ANSWERED**: The API should require an explicit date/year parameter on all date-sensitive endpoints. The client sends the overridden year; the server never guesses. See "Endpoints Requiring Explicit Date Parameters" below.
2. **ANSWERED**: No year input UI control. Instead, append `?current_year=2018` to the URL. The client reads `current_year` from the query string.
3. **ANSWERED**: No banner needed. This is a developer-only tool—query string presence is sufficient indication.

## Endpoints Requiring Explicit Date Parameters

The following endpoints currently derive `today()` or `getCurrentYear()` internally and must be changed to accept an explicit date/year parameter from the client:

| #   | Endpoint                                | Verb | Current Implicit Date Usage                                                      | Required Change                                                               |
| --- | --------------------------------------- | ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `/api/pto/status`                       | GET  | `calculatePTOStatus()` defaults `currentDate` to `today()`                       | Accept `?current_date=YYYY-MM-DD` query param, pass to `calculatePTOStatus()` |
| 2   | `/api/pto/year/:year`                   | GET  | Uses `today()` to bound valid year range (`currentYear - 10` to `currentYear`)   | Accept `?current_year` query param to shift the validation window             |
| 3   | `/api/employees/:id/termination-payout` | GET  | Uses `today()` to compute `currentDate`, `currentYear`, accrual, and date ranges | Accept `?current_date=YYYY-MM-DD` query param                                 |
| 4   | `/api/admin/report`                     | GET  | Falls back to `new Date().getFullYear()` when `year` query param is missing      | Already accepts `?year`—no change needed (client must always send it)         |
| 5   | `/api/admin/lock-month`                 | POST | Uses `today()` in `validateAdminCanLockMonth()` guard                            | Accept `?current_date=YYYY-MM-DD` to override the "month ended" check         |

### Endpoints That Do NOT Need Changes

These use `today()` only for **write-side timestamps** (e.g., `submitted_at`, `hire_date` defaults, token expiry) which should always reflect real wall-clock time:

- `POST /api/auth/magic-link` — auto-provision `hire_date` default
- `POST /api/hours` — `submitted_at` timestamp
- `POST /api/employees` — `hire_date` default fallback
- `POST /api/auth/magic-link` — token `expiresAt`
- `GET /api/notifications` — read-status timestamps

### Endpoints Already Date-Explicit (No Changes Needed)

- `GET /api/hours?year=YYYY` — already accepts year
- `GET /api/admin/monthly-review/:month` — month is a path param
- `POST /api/acknowledgements` — month is in request body
- `POST /api/admin/lock-month` — month is in request body
- `GET /api/admin-acknowledgements/:employeeId` — returns all, no date filter

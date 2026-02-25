# Time Travel Testing Mode

## Description

The client is designed to operate within the current calendar year. While a "Prior Year Summary" view exists, there is no way to fully interact with data from arbitrary past years (e.g., 2018 imported data). This feature adds a "time travel" mechanism that lets the browser operate with a configurable reference year, shifting all date-related functions (`today()`, `getCurrentYear()`, `getCurrentMonth()`) to behave as if the current date falls within the chosen year. This is primarily for **manual testing and data review** of imported historical data.

The approach: the developer appends `?current_year=2018` to the URL. The client reads this query string parameter and shifts all date-related functions (`today()`, `getCurrentYear()`, `getCurrentMonth()`) to behave as if the current year is the specified value. Additionally, the API endpoints that currently derive the current date internally must be changed to accept an explicit date/year parameter so the client can pass the overridden year through to the server.

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
- [ ] Manual testing: verify Prior Year Summary shows 2017 data when `?current_year=2018`
- [ ] Manual testing: verify Submit Time Off page shows 2018 calendar
- [ ] Manual testing: verify removing the query param returns to real current year
- [ ] Add E2E test (Playwright) that navigates with `?current_year=2018` and verifies year display
- [ ] Update README.md "Development Best Practices" with time-travel usage instructions
- [ ] Verify `pnpm run build` passes
- [ ] Verify `pnpm run lint` passes

## Implementation Notes

### Architecture

- **Query string driven**: The developer appends `?current_year=2018` to the URL. No UI controls, no persistent storage. Removing the param restores real-time behavior.
- **Client + explicit API params**: The client shifts its date functions and passes the overridden year/date to API endpoints explicitly. The server never reads `?current_year` itself—it receives an explicit `current_date` or `current_year` parameter on each affected endpoint.
- **Year offset, not absolute date**: `today()` returns the current month and day but with the overridden year. This keeps month-relative logic (e.g., "current month") working naturally.
- **Centralized in `dateUtils.ts`**: Since all date operations already go through this module (per project convention), the override automatically propagates everywhere.
- **No banner/indicator**: This is a developer-only tool. The query string in the URL bar is sufficient indication.

### Key Functions to Modify

| Function            | Current Behavior          | Time-Travel Behavior            |
| ------------------- | ------------------------- | ------------------------------- |
| `today()`           | Returns real `YYYY-MM-DD` | Returns `<override-year>-MM-DD` |
| `getCurrentYear()`  | Returns real year         | Returns override year           |
| `getCurrentMonth()` | Returns real `YYYY-MM`    | Returns `<override-year>-MM`    |

### API Parameter Convention

Client API calls pass the override through explicit query parameters:

| Client dateUtils            | Sent to API as             |
| --------------------------- | -------------------------- |
| `today()` → `2018-02-25`    | `?current_date=2018-02-25` |
| `getCurrentYear()` → `2018` | `?current_year=2018`       |

### Query String Usage

```
http://localhost:3000/?current_year=2018
http://localhost:3000/admin/monthly-review?current_year=2018
```

The client reads `new URLSearchParams(window.location.search).get("current_year")` at startup and calls `setTimeTravelYear()`.

### Boundary Conditions

- If the override year's month/day combination is invalid (e.g., Feb 29 in a non-leap year), `today()` should clamp to the last valid day of the month.
- The year value should be validated as a reasonable 4-digit year (e.g., 2000–2099).

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

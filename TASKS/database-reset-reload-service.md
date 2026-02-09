# Database Reload Service (Deterministic E2E)

## Description

E2E tests intermittently fail because the server can keep an in-memory SQL.js database loaded while test code (or scripts) reset/re-seed the SQLite file on disk. The current `/api/test/reset-database` endpoint also embeds seed data directly in the server.

Implement a deterministic **database reload** capability that:

- Forces the running server to _reload_ the database (TypeORM + SQL.js) from the on-disk DB file.
- Does **not** perform seeding itself; it only reloads whatever is on disk.
- Removes embedded seed arrays from the server so seed contents remain owned by the seeding script(s).

Goal: make Playwright E2E tests pass consistently by eliminating stale in-memory DB state.

## Priority

🟡 Medium Priority (Testing Reliability / Infrastructure)

## Checklist

### Seed Script Refactor

- [x] Separate seed data from logic (e.g., `scripts/seedData.ts` exports arrays; `scripts/seed.ts` performs DB operations)
- [ ] Ensure `npm run seed` remains the single source of truth for seed contents (server should not duplicate)
- [ ] Validate seed script can run repeatedly without errors (idempotent reset behavior)

### Server-Side Database Service

- [ ] Introduce a `DatabaseService` (or similar) responsible for:
  - [ ] Creating/initializing the SQL.js instance and TypeORM `DataSource`
  - [ ] Explicitly persisting any schema/db changes to disk (when applicable)
  - [ ] Cleanly destroying/disposing the existing `DataSource` when resetting
  - [ ] Re-initializing a new `DataSource` after reseed
- [x] Ensure DAL objects (e.g., `PtoEntryDAL`) are recreated/rebound after reload

### Reset Endpoint (Test-Only)

- [x] Update `/api/test/reload-database` so it reloads (no reseed):
  - [x] Verifies it is running in test mode (existing `NODE_ENV === 'test'` or header gate)
  - [x] Tears down the current DB connection(s) (TypeORM + SQL.js state)
  - [x] Reloads the database into a fresh `DataSource` from the on-disk DB file
  - [x] Returns a clear JSON result (success/failure + any relevant diagnostics)
- [x] Remove embedded seed arrays from `server/server.mts`

### E2E Contract + Consistency

- [ ] Decide single “reset strategy” for E2E (avoid double-resets):
  - [ ] Option A: Keep Playwright global setup `execSync('npm run seed')` and add calls to `/api/test/reload-database` only when needed to force the server to re-read disk
  - [ ] Option B: Before each test, run `npm run seed` and then call `/api/test/reload-database` to force reload
- [ ] Ensure the chosen strategy cannot race with an already-running server instance (esp. `reuseExistingServer: true`)

### Quality Gates

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run test:unit`
- [x] `npm run test:e2e` (Playwright) passes consistently across multiple runs

## Implementation Notes

- SQL.js + TypeORM (`sqljs` driver) can keep DB state in memory; writing to the DB file from a separate process won’t automatically affect the in-memory `DataSource`.
- The reset endpoint should prefer “destroy + re-init” (reload from disk) over “truncate + insert” to avoid stale in-memory state.
- Keep reset functionality gated to tests (env/header) to avoid production abuse.

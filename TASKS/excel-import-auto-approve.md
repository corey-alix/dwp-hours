# Excel Import Auto-Approve

## Description

When PTO data is imported via the Excel import flow (`POST /api/admin/import-bulk`), entries that pass all validation checks and fall within annual PTO limits should be automatically approved (i.e., `approved_by` set to the importing admin's ID). Entries that have warnings — such as exceeding annual sick/bereavement/jury-duty limits, or belonging to a month with a `"warning"` acknowledgement status — should remain unapproved and appear in the admin PTO Request Queue for manual review.

This is **distinct** from the employee-initiated PTO request flow (via the app/API), which always requires explicit admin approval. The auto-approve logic applies **only** to the Excel import path.

The feature is gated behind a new feature flag `ENABLE_IMPORT_AUTO_APPROVE` in `shared/businessRules.ts`.

## Priority

🟡 Medium Priority

This enhances the admin import workflow and reduces manual approval burden for clean imports. It depends on the existing bulk import infrastructure (`browser-side-excel-import`) which is already complete.

## Checklist

### Phase 0: Reserve Sys-Admin Account (`employee_id=0`)

- [x] Reserve `employee_id=0` for the internal sys-admin account in the database seed/schema
- [x] Ensure `employee_id=0` is excluded from employee listings, PTO dashboards, and admin employee management
- [x] Add a constant `SYS_ADMIN_EMPLOYEE_ID = 0` to `shared/businessRules.ts`
- [x] Use `SYS_ADMIN_EMPLOYEE_ID` as the `approved_by` value for auto-approved import entries (distinct from human admin approvals)
- [x] **Validation**: `pnpm run build` passes, verify sys-admin account does not appear in employee UIs

### Phase 1: Feature Flag & Business Rules

- [x] Add `ENABLE_IMPORT_AUTO_APPROVE` feature flag to `shared/businessRules.ts` (default: `true`)
- [x] Add JSDoc explaining the flag's purpose and scope (Excel import only, not app-submitted PTO)
- [x] Add a pure function `shouldAutoApproveImportEntry(entry, employeeLimits, policyContext)` to `shared/businessRules.ts` that returns `{ approved: boolean; violations: string[] }` — checks all annual limits **and** POLICY.md rules (e.g., no PTO borrowing after first year of service)
- [x] **Validation**: `pnpm run build` passes, unit tests for `shouldAutoApproveImportEntry`

### Phase 2: Server — Enhance `upsertPtoEntries` to Support Auto-Approve

- [x] Modify `upsertPtoEntries` in `server/reportGenerators/excelImport.ts` to accept an optional `autoApproveCtx` parameter
- [x] When `ENABLE_IMPORT_AUTO_APPROVE` is `true`:
  - Compute per-employee annual usage totals (PTO, Sick, Bereavement, Jury Duty) from existing + newly inserted entries
  - Compute policy context (hire date, years of service, available PTO balance including carryover from L42)
  - For each new entry, call `shouldAutoApproveImportEntry` with the running totals and policy context
  - If the entry passes, set `approved_by = SYS_ADMIN_EMPLOYEE_ID` (0) on insert
  - If the entry fails, leave `approved_by = null`, add a warning, and **record policy violations as notes** on the PTO entry (`notes` field)
- [x] When `ENABLE_IMPORT_AUTO_APPROVE` is `false`, preserve current behaviour (`approved_by = null`)
- [x] For entries that fail auto-approve, also annotate the corresponding month's acknowledgement with policy violation details
- [x] **Validation**: `pnpm run build` passes, unit tests for the enhanced upsert logic

### Phase 3: Server — Pass `adminId` Through the Import Endpoint

- [x] In the `POST /api/admin/import-bulk` handler (`server/server.mts`), pass auto-approve context to `upsertPtoEntries` (uses `SYS_ADMIN_EMPLOYEE_ID`, not the human admin's ID)
- [x] Include auto-approve counts in the response (e.g., `ptoEntriesAutoApproved` alongside `ptoEntriesUpserted`)
- [x] **Validation**: `pnpm run build` passes, manual test with import showing auto-approved vs. pending entries

### Phase 4: Consider Acknowledgement Warning Status

- [x] During import, check each employee's `acknowledgements` array for months with `status: "warning"`
- [x] Entries falling in a "warning" month should **not** be auto-approved regardless of limit checks
- [x] Add this condition to `shouldAutoApproveImportEntry` or as a separate month-level check in the upsert loop
- [x] **Validation**: Unit test confirming warning-month entries remain unapproved

### Phase 5: Client — Display Auto-Approve Results

- [x] Update the import result rendering in `admin-settings-page/index.ts` to show auto-approved count
- [x] Per-employee detail should indicate how many entries were auto-approved vs. pending review
- [x] **Validation**: Manual testing of import result display

### Phase 6: Testing & Quality Gates

- [x] Write Vitest unit tests for `shouldAutoApproveImportEntry` covering:
  - Entry within all limits → auto-approved (approved_by = 0)
  - Sick hours exceeding 24-hour annual limit → not auto-approved, violation note recorded
  - Bereavement exceeding 16-hour limit → not auto-approved, violation note recorded
  - Jury Duty exceeding 24-hour limit → not auto-approved, violation note recorded
  - PTO exceeding available balance → not auto-approved, violation note recorded
  - PTO borrowing after first year of service → not auto-approved, violation note recorded
  - Entry in a "warning" acknowledgement month → not auto-approved
  - Feature flag disabled → nothing auto-approved (all approved_by = null)
- [x] Write Vitest unit tests for modified `upsertPtoEntries` with mock DataSource
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Manual testing: import a clean spreadsheet, verify entries appear approved in monthly review calendar (checkmarks)
- [x] Manual testing: import a spreadsheet with limit-exceeding entries, verify those appear in PTO Request Queue
- [x] Documentation updated (README import section)

### Phase 7: Import Result Severity Tiers (Errors / Warnings / Resolved)

- [ ] Add `errors: string[]` and `resolved: string[]` to `ImportResult` in `shared/excelParsing.ts`
- [ ] Add `errors: string[]` and `resolved: string[]` to `BulkImportResponse` in `shared/api-models.d.ts`
- [ ] Classify existing warnings: move auto-corrected items to `resolved`, move fatal aborts to `errors`
- [ ] Update `importExcelWorkbook` catch block to push to `errors` instead of `warnings` when a sheet fails fatally
- [ ] Update import result rendering in `client/pages/admin-settings-page/index.ts`:
  - Show `"N errors"` in red if errors > 0
  - Show `"N warnings"` in orange (existing)
  - Show `"N resolved"` in green if resolved > 0
- [ ] Update the `POST /api/admin/import-excel` and `POST /api/admin/import-bulk` response handlers to pass through all three arrays
- [ ] **Validation**: `pnpm run build` passes, `pnpm run lint` passes
- [ ] **Validation**: Manual test — import spreadsheet, verify red/orange/green severity display

### Phase 8: Fix Hire Date Parsing — Strip Parenthetical Suffixes

- [ ] In `parseEmployeeInfo` (`shared/excelParsing.ts`), after extracting `datePart` from the regex, strip trailing parenthetical content: `datePart.replace(/\s*\(.*\)\s*$/, '').trim()`
- [ ] If stripping was needed and `smartParseDate` succeeds, emit a `resolved` message (requires `parseEmployeeInfo` or `parseEmployeeSheet` to return resolved messages — extend `SheetImportResult` accordingly)
- [ ] If `smartParseDate` still fails after stripping, emit an `error` message instead of a warning
- [ ] Add unit tests for hire date parsing with `(FT)`, `(PT)`, and other suffixes
- [ ] **Validation**: `pnpm run build` passes, existing tests pass, N Rosenberger imports fully with hire date `2006-03-15`

## Implementation Notes

### Current Behaviour

- `upsertPtoEntries` (`server/reportGenerators/excelImport.ts`) always sets `approved_by: null` on newly created PTO entries (line ~232)
- The admin PTO Request Queue page (`admin-pto-requests-page`) loads all entries where `approved_by === null` as "pending" requests
- The monthly review calendar shows a checkmark overlay on entries where `approved_by !== null`

### Key Files

| File                                            | Role                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `shared/businessRules.ts`                       | Feature flag, `SYS_ADMIN_EMPLOYEE_ID` constant, pure `shouldAutoApproveImportEntry` function |
| `server/reportGenerators/excelImport.ts`        | `upsertPtoEntries` — where `approved_by` is set                                              |
| `server/server.mts` (line ~2899)                | `POST /api/admin/import-bulk` handler — passes auto-approve context                          |
| `shared/api-models.d.ts`                        | `BulkImportResponse` — add `ptoEntriesAutoApproved` field                                    |
| `client/pages/admin-settings-page/index.ts`     | Import result rendering                                                                      |
| `client/pages/admin-pto-requests-page/index.ts` | PTO Request Queue (no changes needed — filters on `approved_by === null`)                    |

### Annual Limit Constants (from `businessRules.ts`)

| Category    | Annual Limit                                          |
| ----------- | ----------------------------------------------------- |
| Sick        | 24 hours                                              |
| Bereavement | 16 hours                                              |
| Jury Duty   | 24 hours                                              |
| PTO         | Computed per employee (annual allocation + carryover) |

### Design Decisions

- A reserved **sys-admin account** (`employee_id=0`, constant `SYS_ADMIN_EMPLOYEE_ID`) is used for auto-approvals, keeping them distinct from manual admin approvals
- The pure function `shouldAutoApproveImportEntry` lives in shared `businessRules.ts` so it can be unit-tested without database dependencies
- The function returns `{ approved: boolean; violations: string[] }` — violations are recorded as notes on the PTO entry and acknowledgement for admin visibility
- Auto-approve is evaluated per-entry in insertion order, with a running tally of annual usage so that the first N entries within limits are approved and any that push over the threshold are left pending
- **Policy enforcement**: Per POLICY.md, PTO borrowing (negative balance) is not permitted after the first year of service. The auto-approve check computes available balance (carryover from L42 + accrued-to-date − used-to-date) and rejects entries that would go negative
- Existing entries already in the database count toward the running tally (query once per employee before the upsert loop)
- The existing `upsertPtoEntries` update path (entry already exists for that date) does **not** change `approved_by` — only new inserts are candidates for auto-approve
- Carryover hours are always available from the spreadsheet (cell L42 of the PTO Calculation section), so the "unknown carryover" scenario does not apply

### Implementation Status

All core implementation and automated testing is complete. Phases 0–6 are code-complete — `pnpm run build`, `pnpm run lint`, and all 1127 tests pass. The feature is ready for manual testing and documentation updates.

**Files changed:**

| File                                        | Change                                                                                                                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/businessRules.ts`                   | Added `SYS_ADMIN_EMPLOYEE_ID`, `ENABLE_IMPORT_AUTO_APPROVE`, interfaces (`ImportEntryForAutoApprove`, `AutoApproveEmployeeLimits`, `AutoApprovePolicyContext`, `AutoApproveResult`), and `shouldAutoApproveImportEntry()` pure function                       |
| `shared/api-models.d.ts`                    | Added `ptoEntriesAutoApproved` to `BulkImportResponse` and per-employee detail                                                                                                                                                                                |
| `db/schema.sql`                             | Added `INSERT OR IGNORE` for sys-admin account (id=0, name='System', role='System')                                                                                                                                                                           |
| `scripts/seed.ts`                           | Added explicit sys-admin insert for seed path                                                                                                                                                                                                                 |
| `server/server.mts`                         | Ensured sys-admin exists on startup; excluded id=0 from `/api/employees` and `/api/admin/monthly-review`; wired auto-approve context into `POST /api/admin/import-bulk`; added auto-approve counts to response                                                |
| `server/reportService.ts`                   | Excluded id=0 from report employee listings                                                                                                                                                                                                                   |
| `server/reportGenerators/excelImport.ts`    | Added `AutoApproveImportContext` interface; enhanced `upsertPtoEntries` to accept optional auto-approve context, query existing annual usage, maintain running totals, call `shouldAutoApproveImportEntry`, set `approved_by`, and record violations in notes |
| `client/pages/admin-settings-page/index.ts` | Updated import result rendering to show auto-approved counts per-employee and in summary                                                                                                                                                                      |
| `tests/auto-approve-import.test.ts`         | New: 17 unit tests covering all `shouldAutoApproveImportEntry` scenarios + 4 integration tests for `upsertPtoEntries`                                                                                                                                         |
| `tests/database.test.ts`                    | Fixed employee count assertion to exclude sys-admin row                                                                                                                                                                                                       |

### Manual Testing Results (2026-02-27)

Imported `reports/2018.xlsx` against a freshly seeded database on port 3003:

| Metric                                      | Value |
| ------------------------------------------- | ----- |
| Employees processed                         | 66    |
| PTO entries upserted                        | 2377  |
| PTO entries auto-approved (`approved_by=0`) | 2201  |
| PTO entries pending (`approved_by=null`)    | 181   |
| Acknowledgements synced                     | 1517  |
| Warnings                                    | 309   |

**Verified:**

- Clean months show `acknowledgedByAdmin=true` in monthly review (67/69 employees for 2018-03)
- Warning months show `acknowledgedByAdmin=false` with explanatory notes
- 181 pending entries across 21 employees appear in the PTO Request Queue
- Violation reasons include: warning month status, PTO borrowing after first year, limit exceedances
- README updated with auto-approve documentation under "Browser-Side Excel Import" section

## Questions and Concerns

1. **Resolved**: Auto-approved import entries use a reserved **sys-admin account (`employee_id=0`)** as the `approved_by` value, which is distinct from human admin IDs. The existing checkmark indicator is sufficient visually — the distinction is in the data (`approved_by=0` vs. a human admin ID).
2. **Resolved**: Auto-approve must respect **all** POLICY.md rules, not just annual limits. In particular, "PTO should not be borrowed typically after the first year of service" — any entry that would cause negative balance (borrowing) after the employee's first year must **not** be auto-approved. Policy violations must be recorded as notes on the imported `pto_entries` and `acknowledgements`.
3. **Resolved**: Not a valid scenario. The prior-year carryover is always available from the spreadsheet at cell **L42** (January row of the PTO Calculation section). The `parseCarryoverHours()` function in `shared/excelParsing.ts` already reads this value. Hire date is also extracted from cell R2. Both fields are populated before PTO entries are processed.
4. **Bug: N Rosenberger (employee_id=54) — Missing Acknowledgements / Shows "Unlocked" (2026-02-27)**: N Rosenberger's Monthly Employee Review card shows "Unlocked" (no acknowledgement) even though the employee was imported from the spreadsheet successfully (employee record exists, PTO limits display correctly). 65 of 69 employees have acknowledgements for 2018-02; employee 54 is the only imported employee that does not. **Root Cause**: The import of the "N Rosenberger" sheet **crashes** partway through processing due to a missing hire date. The error chain is: 1. `parseEmployeeInfo(ws)` returns `hireDate: undefined` because the hire date cell (R2) is blank/unparseable on that sheet. 2. The employee record **is** upserted successfully (with a fallback hire date of `new Date()`), incrementing `employeesProcessed`. 3. The auto-approve context is built with `hireDate: sheetResult.employee.hireDate!` — which is `undefined` cast to `string` via the non-null assertion. 4. `upsertPtoEntries` calls `computeAnnualAllocation(undefined, year)` → `parseDate(undefined)` → throws `Error: Invalid date string:`. 5. The outer `catch (sheetError)` block in `importExcelWorkbook` catches the error, emits a warning `"Failed to process sheet 'N Rosenberger': Error: Invalid date string:"`, and **skips the rest of the processing** for that sheet — including `upsertAcknowledgements`. 6. Result: the employee exists in the DB, but has **zero acknowledgements** and **zero PTO entries** (the entries parsed before the crash were never persisted). The monthly review query finds the employee but no `AdminAcknowledgement` row → `acknowledgedByAdmin: false`, no `Acknowledgement` row → `calendarLocked: false`. **Two distinct bugs**: 1. **Crash on missing hire date**: The auto-approve context passes `undefined` as `hireDate` without guarding for the case where `parseEmployeeInfo` couldn't extract a hire date. This causes a downstream `parseDate` failure that aborts the entire sheet. **Fix**: Guard `autoApproveCtx.hireDate` — if hire date is missing/unparseable, either skip auto-approve for that employee (set `autoApproveCtx = undefined`) or use a sensible fallback. The employee record already uses `new Date()` as a fallback in `upsertEmployee`, so the auto-approve context should too, or simply disable auto-approve when hire date is unknown. 2. **No acknowledgements for zero-activity employees when import crashes**: Even though the employee was created, the crash prevents acknowledgement creation. Employees with no PTO activity should still get acknowledgements synced (all 12 months with status=null indicating clean months). **Fix**: Move the acknowledgement upsert before the PTO upsert, or restructure the try/catch so that `upsertAcknowledgements` runs even if PTO upsert fails, or handle the hire date issue upstream so the crash doesn't happen. **Affected code locations**: | File | Line | Issue | | --- | --- | --- | | `server/reportGenerators/excelImport.ts` | ~587 | `hireDate: sheetResult.employee.hireDate!` — non-null assertion on potentially undefined value | | `server/reportGenerators/excelImport.ts` | ~300 | `computeAnnualAllocation(autoApproveCtx.hireDate, year)` — crashes when hireDate is undefined | | `server/reportGenerators/excelImport.ts` | ~657-660 | `catch (sheetError)` — skips acknowledgement upsert entirely | **Recommended fix approach**: Guard the `autoApproveCtx` construction: if `hireDate` is falsy, set `autoApproveCtx` to `undefined` (disabling auto-approve for that employee but allowing the rest of the import — PTO upserts and acknowledgement syncing — to proceed normally).

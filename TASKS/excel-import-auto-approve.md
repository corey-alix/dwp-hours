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

- [ ] Reserve `employee_id=0` for the internal sys-admin account in the database seed/schema
- [ ] Ensure `employee_id=0` is excluded from employee listings, PTO dashboards, and admin employee management
- [ ] Add a constant `SYS_ADMIN_EMPLOYEE_ID = 0` to `shared/businessRules.ts`
- [ ] Use `SYS_ADMIN_EMPLOYEE_ID` as the `approved_by` value for auto-approved import entries (distinct from human admin approvals)
- [ ] **Validation**: `pnpm run build` passes, verify sys-admin account does not appear in employee UIs

### Phase 1: Feature Flag & Business Rules

- [ ] Add `ENABLE_IMPORT_AUTO_APPROVE` feature flag to `shared/businessRules.ts` (default: `true`)
- [ ] Add JSDoc explaining the flag's purpose and scope (Excel import only, not app-submitted PTO)
- [ ] Add a pure function `shouldAutoApproveImportEntry(entry, employeeLimits, policyContext)` to `shared/businessRules.ts` that returns `{ approved: boolean; violations: string[] }` — checks all annual limits **and** POLICY.md rules (e.g., no PTO borrowing after first year of service)
- [ ] **Validation**: `pnpm run build` passes, unit tests for `shouldAutoApproveImportEntry`

### Phase 2: Server — Enhance `upsertPtoEntries` to Support Auto-Approve

- [ ] Modify `upsertPtoEntries` in `server/reportGenerators/excelImport.ts` to accept an optional `adminId` parameter
- [ ] When `ENABLE_IMPORT_AUTO_APPROVE` is `true`:
  - Compute per-employee annual usage totals (PTO, Sick, Bereavement, Jury Duty) from existing + newly inserted entries
  - Compute policy context (hire date, years of service, available PTO balance including carryover from L42)
  - For each new entry, call `shouldAutoApproveImportEntry` with the running totals and policy context
  - If the entry passes, set `approved_by = SYS_ADMIN_EMPLOYEE_ID` (0) on insert
  - If the entry fails, leave `approved_by = null`, add a warning, and **record policy violations as notes** on the PTO entry (`notes` field)
- [ ] When `ENABLE_IMPORT_AUTO_APPROVE` is `false`, preserve current behaviour (`approved_by = null`)
- [ ] For entries that fail auto-approve, also annotate the corresponding month's acknowledgement with policy violation details
- [ ] **Validation**: `pnpm run build` passes, unit tests for the enhanced upsert logic

### Phase 3: Server — Pass `adminId` Through the Import Endpoint

- [ ] In the `POST /api/admin/import-bulk` handler (`server/server.mts`), pass auto-approve context to `upsertPtoEntries` (uses `SYS_ADMIN_EMPLOYEE_ID`, not the human admin's ID)
- [ ] Include auto-approve counts in the response (e.g., `ptoEntriesAutoApproved` alongside `ptoEntriesUpserted`)
- [ ] **Validation**: `pnpm run build` passes, manual test with import showing auto-approved vs. pending entries

### Phase 4: Consider Acknowledgement Warning Status

- [ ] During import, check each employee's `acknowledgements` array for months with `status: "warning"`
- [ ] Entries falling in a "warning" month should **not** be auto-approved regardless of limit checks
- [ ] Add this condition to `shouldAutoApproveImportEntry` or as a separate month-level check in the upsert loop
- [ ] **Validation**: Unit test confirming warning-month entries remain unapproved

### Phase 5: Client — Display Auto-Approve Results

- [ ] Update the import result rendering in `admin-settings-page/index.ts` to show auto-approved count
- [ ] Per-employee detail should indicate how many entries were auto-approved vs. pending review
- [ ] **Validation**: Manual testing of import result display

### Phase 6: Testing & Quality Gates

- [ ] Write Vitest unit tests for `shouldAutoApproveImportEntry` covering:
  - Entry within all limits → auto-approved (approved_by = 0)
  - Sick hours exceeding 24-hour annual limit → not auto-approved, violation note recorded
  - Bereavement exceeding 16-hour limit → not auto-approved, violation note recorded
  - Jury Duty exceeding 24-hour limit → not auto-approved, violation note recorded
  - PTO exceeding available balance → not auto-approved, violation note recorded
  - PTO borrowing after first year of service → not auto-approved, violation note recorded
  - Entry in a "warning" acknowledgement month → not auto-approved
  - Feature flag disabled → nothing auto-approved (all approved_by = null)
- [ ] Write Vitest unit tests for modified `upsertPtoEntries` with mock DataSource
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual testing: import a clean spreadsheet, verify entries appear approved in monthly review calendar (checkmarks)
- [ ] Manual testing: import a spreadsheet with limit-exceeding entries, verify those appear in PTO Request Queue
- [ ] Documentation updated (README import section)

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

## Questions and Concerns (Resolved)

1. **Resolved**: Auto-approved import entries use a reserved **sys-admin account (`employee_id=0`)** as the `approved_by` value, which is distinct from human admin IDs. The existing checkmark indicator is sufficient visually — the distinction is in the data (`approved_by=0` vs. a human admin ID).
2. **Resolved**: Auto-approve must respect **all** POLICY.md rules, not just annual limits. In particular, "PTO should not be borrowed typically after the first year of service" — any entry that would cause negative balance (borrowing) after the employee's first year must **not** be auto-approved. Policy violations must be recorded as notes on the imported `pto_entries` and `acknowledgements`.
3. **Resolved**: Not a valid scenario. The prior-year carryover is always available from the spreadsheet at cell **L42** (January row of the PTO Calculation section). The `parseCarryoverHours()` function in `shared/excelParsing.ts` already reads this value. Hire date is also extracted from cell R2. Both fields are populated before PTO entries are processed.

# Excel PTO Spreadsheet Import

## Description

Implement the reverse of the existing Excel export (`server/reportGenerators/excelReport.ts`) — read an exported PTO workbook and upsert all employee data into the database. The importer must:

1. **Detect employee tabs** — skip the "Cover Sheet" and "No Data" sentinel sheets; treat every other worksheet as an employee tab.
2. **Upsert the employee** — match by exact name (sheet tab name vs `employees.name`); create the employee if no match exists, using the hire date parsed from cell R2 and a generated identifier.
3. **Parse the calendar grid** — read cell fill colors, compare against the per-sheet legend (rows 9–14, columns Z–AA) to determine PTO type. A colored day = a PTO entry.
4. **Handle partial days** — the PTO Calculation section declares total "PTO hours per Month" (columns S–T, rows 43–54). When the sum of full-day (8 h) entries for a given PTO type in that month exceeds the declared total, the difference is assigned as a partial day on the **last** colored day in that group. The partial-day cell is decorated with a superscript hours suffix (e.g. `15³` for day 15, 3 hours) instead of `½`.
5. **Import acknowledgements** — read the ✓ marks in columns X (employee) and Y (admin) aligned with PTO calculation rows 43–54 and upsert into `acknowledgements` / `admin_acknowledgements`.
6. **Per-date upsert** — if a PTO entry already exists for (employee, date), update it; otherwise insert. Existing entries for dates **not** present in the import are left untouched.

### Superscript Hour Decoration (Export Enhancement)

When the export generates partial-day entries, decorate the day cell with a superscript hour indicator:

| Hours | Cell display               | Example (day 15)    |
| ----- | -------------------------- | ------------------- |
| 8     | plain day number           | `15`                |
| 4     | `½` (legacy)               | `15½`               |
| other | superscript digit of hours | `15³`, `15⁶`, `15²` |

The cell note (`PTO: Xh`) remains for all entries regardless of hours.

## Priority

🟡 Medium Priority

This is a core data-management feature that complements the existing export functionality. It depends on the stable schema and export format already in place.

## Checklist

### Phase 1: Legend & Color Parser (no DB interaction)

- [x] Create `server/reportGenerators/excelImport.ts` with a `parseLegend(ws)` function that reads rows 9–14, columns Z–AA and returns a `Map<string, PTOType>` keyed by ARGB fill color
- [x] Create a `parseCalendarGrid(ws, year, legend)` function that walks the 12 month-blocks, reads cell fills, maps colors to PTO types via the legend map, and returns `Array<{ date: string; type: PTOType; hours: number }>`
- [x] All hours default to 8 at this stage (partial-day adjustment comes in Phase 2)
- [x] Unit tests: supply a programmatically-built ExcelJS workbook with known colors and assert correct parsing
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 2: Partial-Day Detection

- [x] Implement `adjustPartialDays(entries, ptoCalcRows)` — reads the "PTO hours per Month" column from the PTO Calculation section (rows 43–54, columns S–T) and adjusts the last entry of each PTO-type group within a month to account for partial hours
- [x] Handle non-standard partials (not a multiple of 4): any fractional remainder → applied to the last colored day
- [x] Unit tests: verify 8 h full-day entries are reduced to partial hours when monthly totals don't match sum of full days
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 3: Employee Upsert & Metadata Parsing

- [x] Implement `parseEmployeeInfo(ws)` — extract employee name from tab name, hire date from R2, year from B2
- [x] Implement `upsertEmployee(dataSource, name, hireDate)` — find by name; if not found, create new employee with generated identifier (`<first-initial><last-name>@example.com`, e.g. "Alice Smith" → `asmith@example.com`)
- [x] Unit tests with mocked DataSource
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 4: PTO Entry Upsert

- [x] Implement `upsertPtoEntries(dataSource, employeeId, entries)` — per-date upsert: update type + hours for existing entries, insert new entries; leave dates not in the import untouched
- [x] Validate each entry against `businessRules.ts` validators (`validateDateString`, `validatePTOType`, `validateHours`) and collect warnings
- [x] Unit tests with mocked DataSource
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 5: Acknowledgement Import

- [x] Implement `parseAcknowledgements(ws, year)` — read ✓ marks from columns X (employee) and Y (admin) in rows 43–54
- [x] Implement `upsertAcknowledgements(dataSource, employeeId, ackData)` — upsert into `acknowledgements` and `admin_acknowledgements` tables
- [x] Unit tests
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 6: Orchestrator & CLI Script

- [x] Implement `importExcelWorkbook(dataSource, buffer): Promise<ImportResult>` — orchestrates Phases 1–5 for every employee tab in the workbook
- [ ] Create `scripts/import-excel.mts` CLI script that reads a file path argument, calls the orchestrator, prints a summary of upserted employees, entries, and warnings _(deferred — API-only trigger selected)_
- [x] Integration test: export → import → re-export round-trip and compare key data points
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 7: Admin API Endpoint

- [x] Add `POST /api/admin/import-excel` endpoint accepting `multipart/form-data` file upload
- [x] Validate file type (`.xlsx`), size limit, admin authentication
- [x] Return JSON summary of upserted employees, PTO entries, and warnings
- [ ] E2E test for the upload endpoint (Playwright or API test)
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 8: Export Enhancement — Superscript Partial Days

- [x] Update `excelReport.ts` to decorate partial-day cells with superscript hour character (e.g. `15³` for 3 h, `15⁶` for 6 h) instead of plain day number
- [x] Keep `½` for 4-hour days for backward compatibility
- [x] Ensure cell note (`PTO: Xh`) still written for all entries
- [x] Unit test: generate workbook and verify cell values contain expected superscript characters
- [x] `pnpm run build` and `pnpm run lint` pass
- [x] Run `pnpm test` — no regressions

### Phase 9: Documentation & Manual Testing

- [ ] Update README.md with import usage instructions (API)
- [ ] Manual end-to-end test: export from running app → modify in Excel → import → verify in UI
- [ ] Verify round-trip fidelity: export → import → export produces equivalent workbook
- [ ] Document known limitations (e.g. name-only matching, partial-day rounding)

## Implementation Notes

- **File location**: `server/reportGenerators/excelImport.ts` — mirrors the existing `excelReport.ts`
- **Reuse shared exports**: leverage constants from `excelReport.ts` (`PTO_TYPE_FILLS`, `LEGEND_ENTRIES`, `DAY_NAMES`, layout coordinates) by extracting them to a shared module if needed
- **Legend-based color matching**: do NOT hardcode ARGB values for import; always read the legend section from each sheet (allows future legend changes without code changes)
- **Superscript Unicode map**: `const SUPERSCRIPTS: Record<number, string> = { 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹' };`
- **Employee matching**: case-insensitive name comparison, trimmed whitespace
- **Generated identifier**: when creating a new employee, derive the email as `<first-initial><last-name>@example.com` (e.g. "Alice Smith" → `asmith@example.com`), lowercased
- **Date handling**: all date operations through `shared/dateUtils.ts` per project conventions
- **Error handling**: collect warnings (invalid colors, missing data) and continue; only fatal errors (corrupted file, no sheets) should abort
- **Existing `bulkMigration.ts`**: the existing bulk migration has similar but divergent logic (hardcoded colors, different grid coordinates, email-from-filename). This new importer supersedes it for the exported format; consider deprecating bulkMigration after validation

## Questions and Concerns

1. If two employees share the same name, the name-only matching strategy will collide. Should we add a fallback (e.g. prompt the user to disambiguate, or match by hire date as tiebreaker)?
2. Should the importer support importing workbooks exported by other systems (not just our excelReport.ts), or is strict format compliance acceptable?
3. Should we add a dry-run mode that parses and reports what would be imported without writing to the DB?
4. How should we handle PTO entries in the import that fail business-rule validation (e.g. hours > 8, invalid PTO type)? Currently planned: skip with warning.
5. Should the admin API endpoint require a confirmation step (preview → confirm) or import immediately on upload?

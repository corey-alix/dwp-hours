# Legacy Data Import

## Description

Implement utility methods and scripts for converting between Excel, JSON, and database formats to facilitate importing legacy employee data from Excel spreadsheets into the DWP Hours Tracker application. This includes round-trip validation to ensure data integrity during conversion processes.

## Priority

🟢 Low Priority

## Checklist

- [x] **Phase 1: JSON to Excel Conversion**
  - [x] Implement `convert-json-to-excel.mts` script using ExcelJS library
  - [x] Support cell values, formulas, colors, and merged ranges
  - [x] Create utility method in `shared/conversionUtils.ts`
  - [x] Add input validation for JSON structure
  - [x] Implement unit tests for conversion utility functions
  - [x] Manual testing of script execution
  - [x] `npm run build` and `npm run lint` pass
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [x] **Phase 2: Excel to JSON Conversion**
  - [x] Implement `convert-excel-to-json.mts` script using ExcelJS library
  - [x] Extract cell values, formulas, colors, and merged ranges
  - [x] Create utility method in `shared/conversionUtils.ts`
  - [x] Add input validation for Excel file format
  - [x] Implement unit tests for conversion utility functions
  - [x] Manual testing of script execution
  - [x] `npm run build` and `npm run lint` pass
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [x] **Phase 3: Round-Trip Validation Tests**
  - [x] Implement `tests/round-trip.test.ts` for JSON→Excel→JSON test (JSON-to-JSON comparison)
  - [x] Implement Excel→JSON→Excel→JSON round-trip test (JSON-to-JSON comparison) using reference file
  - [x] Ensure tests validate values, formulas, colors, and merged ranges
  - [x] Implement unit tests for round-trip conversion validation
  - [x] All round-trip tests pass
  - [x] `npm run test` passes
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [x] **Phase 4: JSON Generation Function**
  - [x] Create a function in `shared/testDataGenerators.ts` that generates the JSON document identical to `tests/data/import-tests.json`
  - [x] Implement unit tests to verify the generated JSON matches the expected structure
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
- [x] **Phase 5: Partial PTO Import Fix**
  - [x] Add `notes TEXT` column to `pto_entries` table in `db/schema.sql` and TypeORM entity (`server/entities/PtoEntry.ts`) to store import reconciliation reasoning and cell notes for manual audit.
  - [x] Diagnose why "Partial PTO" legend-colored cells are not detected during calendar grid parsing (e.g., "A Bylenga" sheet, Jan 17 in `reports/2018.xlsx` has Partial PTO color but is not imported). Likely cause: cell fill uses `bgColor` instead of `fgColor`, or theme-indexed colors that don't resolve to a matching ARGB value.
  - [x] Fix color matching in `parseCalendarGrid()` (`server/reportGenerators/excelImport.ts`) to reliably detect Partial PTO cells — check `bgColor`, theme colors, and `tint` in addition to `fgColor.argb`.
  - [x] Capture cell notes (e.g., "0.5 hrs") from calendar cells during parsing and attach them to the corresponding `ImportedPtoEntry`. Employees often annotate partial PTO cells with the hours taken.
  - [x] Add note-aware reconciliation logic: when the PTO Calc section (column S) declares more hours than the sum of calendar-detected entries for a month, scan unmatched calendar cells that have notes (e.g., "0.5 hrs") and treat them as Partial PTO. Assign the remaining hours (declared total minus detected total) to the noted cell. For example, Jan has 3 Full PTO days (24h) but S42=24.5, and Jan 17 has a note "0.5 hrs" — create a 0.5h PTO entry for Jan 17.
  - [x] Populate the `notes` field on reconciled PTO entries with an explanation (e.g., "Inferred partial PTO from cell note '0.5 hrs'; calendar color not matched as Partial PTO. Reconciled against PTO Calc S42=24.5.") to support manual review.
  - [x] Emit a warning when a month cannot be fully reconciled (i.e., the PTO Calc declared total still differs from the sum of detected + inferred entries after note-aware reconciliation). The warning should include the employee name, month, declared hours, detected hours, and the unresolved difference so the administrator knows to review it manually.
  - [x] Add a unit test using the "A Bylenga" sheet from `reports/2018.xlsx` that verifies Jan 17 is imported as a 0.5h PTO entry with an explanatory note (derived from S42=24.5 minus 3×8h Full PTO).
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [x] **Phase 6: Fix Employee Identifier Collisions**
  - [x] Change `generateIdentifier()` in `server/reportGenerators/excelImport.ts` from `<first-initial><lastName>@example.com` to `<firstName>-<lastName>@example.com` (e.g., "Dan Allen" → `dan-allen@example.com`, "Deanna Allen" → `deanna-allen@example.com`). This prevents collisions where "Dan Allen" and "Deanna Allen" both resolve to `dallen@example.com`, causing the second import to overwrite the first.
  - [x] Handle edge cases in `generateIdentifier()`: single-name employees should produce `<name>@example.com`, empty names stay `unknown@example.com`, and multiple middle names should use only first and last (e.g., "Mary Jane Watson" → `mary-watson@example.com`).
  - [x] Update existing tests in `tests/excel-import.test.ts` (`describe("generateIdentifier")`) to expect the new `<firstName>-<lastName>@example.com` format.
  - [x] Add a test case specifically verifying that "Dan Allen" and "Deanna Allen" produce distinct identifiers.
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [x] **Phase 7: Calendar Cell Notes & Partial-Day Indicators in UI**
  - [x] Add a visual note indicator (small triangle or icon) on calendar day cells in `client/components/pto-calendar/index.ts` (`renderDayCell()`) when a PTO entry has a non-empty `notes` field. The indicator should be styled via `client/components/pto-calendar/css.ts`.
  - [x] On desktop, the note indicator should show the note text as a tooltip on hover (`title` attribute on the cell or indicator element).
  - [x] On click/tap of the note indicator, display the note text as a notification/toast using the project's existing notification system.
  - [x] Add the `notes` field to the `PTOEntry` interface in `client/components/pto-calendar/index.ts` and ensure the API client passes it through from the server response.
  - [x] Display a superscript on the day number in `renderDayCell()` when a PTO entry has fewer than 8 hours, showing the actual hours (e.g., day 11 with 4 hours renders as `11<sup>4</sup>`). This mirrors the Excel export's `decorateDay()` behavior.
  - [x] Update `client/components/pto-calendar/css.ts` with styles for the note indicator and superscript elements (following CSS animation policy and token system).
  - [x] Add unit tests for the new rendering behavior: note indicator appears when `notes` is non-empty, superscript appears for partial-day hours, tooltip contains note text.
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- Use ExcelJS library for Excel file manipulation (add to package.json if not present)
- Store utility methods in `shared/conversionUtils.ts` for reusability
- Scripts should be executable TypeScript files (.mts extension) using ESM modules
- Follow project's error handling patterns with try/catch and logging
- Ensure all date operations use `shared/dateUtils.ts` for consistency
- Validate data against business rules in `shared/businessRules.ts`
- Use prepared statements for database operations
- Implement dry-run options for import scripts to preview changes
- Handle large Excel files efficiently to avoid memory issues

- [x] **Phase 8: Partial PTO Cell Notes — Hours Extraction & Storage**
  - [x] In `parseCalendarGrid()` (`server/reportGenerators/excelImport.ts`), when a calendar cell matches a legend color, also read `cell.note` (if present). Extract the full note display text by concatenating `cell.note.texts[].text`.
  - [x] Parse hours from the note text by extracting the first number (integer or decimal) using regex `/(\d+(?:\.\d+)?)/`. The first numeric value found is assumed to be the hours — no unit suffix matching required (handles "2 HRS PTO", "5 hours", "1.5h", "3", etc.). If a match is found, use the extracted value as the PTO entry's hours instead of the default 8h.
  - [x] Store the full note display text (e.g., `"Mandi Davenport:\n5 HRS PTO"`) in the `notes` field of the resulting `ImportedPtoEntry`, so it is persisted to `pto_entries.notes` upon upsert.
  - [x] Add a unit test using the "A Bylenga" sheet from `reports/2018.xlsx` that verifies July 25 is imported as 2h PTO (not 8h), July 26 as 5h, and July 27 as 5h, with note text populated on each entry.
  - [x] Verify that the total PTO for A Bylenga July 2018 is 12h (2+5+5) after import, matching the spreadsheet's declared PTO Calc value.
  - [x] Ensure cells without notes still default to 8h (full-day PTO) — no regression for non-annotated cells.
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

## Known Issues

- **OOM on 512MB server**: The original implementation used `multer.memoryStorage()` and loaded all 68 worksheets into memory simultaneously via `ExcelJS.Workbook.xlsx.load(buffer)`. This caused SIGKILL (OOM) on the 512MB DigitalOcean droplet. Fixed by switching to `multer.diskStorage()`, reading the workbook from disk via `workbook.xlsx.readFile()`, and releasing each worksheet with `workbook.removeWorksheet()` after processing.
- **Rich text cells cause hire date to default to today**: `isEmployeeSheet()` and `parseEmployeeInfo()` in `excelImport.ts` used `cell.value.toString()` to read the hire date cell (R2). Legacy 2018 spreadsheets store this cell as ExcelJS rich text (`{richText: [{text: "HIRE DATE: "}, {text: "8/19/14"}]}`), and `.toString()` on that object yields `[object Object]`. The hire date regex never matches, `hireDate` stays empty, and the fallback `new Date()` sets the hire date to today. **Fix**: use `cell.text` instead of `cell.value.toString()` — ExcelJS's `.text` property always returns the display string regardless of the underlying value type (plain string, rich text, formula).
- **Admin Monthly Review shows wrong PTO balance (-109 instead of 48)**: `computeEmployeeBalanceData()` in `shared/businessRules.ts` used a hardcoded PTO limit of 80 (the carryover cap) for all employees. For an employee with 189 hours of PTO used, this produced `80 - 189 = -109`. The correct allowance is `annualAllocation + carryover` (e.g., ~237 hours for A Bylenga in 2018), giving a remaining balance of ~48. The employee's own view showed the correct value because `calculatePTOStatus()` on the server computes the real allowance. **Fix**: added an optional `ptoAllowance` parameter to `computeEmployeeBalanceData()`. The admin monthly review component now fetches employee details (hire date, carryover) via `getEmployees()`, computes `computeAnnualAllocation(hireDate, year) + carryoverHours` per employee, and passes the result as the PTO limit.
- **Identifier collision between employees with same last name**: `generateIdentifier()` uses `<first-initial><lastName>@example.com` which causes collisions — e.g., "Dan Allen" and "Deanna Allen" both produce `dallen@example.com`. The second import overwrites the first employee's data. **Fix**: change to `<firstName>-<lastName>@example.com` (e.g., `dan-allen@example.com`, `deanna-allen@example.com`) to guarantee unique identifiers across all employees.
- **Cell notes not visible in UI**: Calendar cells may have notes (e.g., "red rocks" on July 25 for Deanna Allen) that provide important context. Currently there is no indicator in the UI that a cell has a note. **Fix**: add a visual note indicator (e.g., a small triangle or icon) on calendar cells that have notes; clicking the indicator shows the note as a notification/toast, and on desktop hover it should appear as a tooltip (`title` attribute).
- **Partial-day hours not shown on calendar cells**: When a day has fewer than 8 hours of PTO, the calendar cell shows only the day number with no indication of the actual hours. **Fix**: display a superscript on the day number to indicate the actual hours reserved (e.g., July 11 with 4 hours would render as "11⁴"). This is already done during Excel export via `decorateDay()` but should also be reflected in the admin UI calendar view.
- **Calendar grid row offset anomaly in legacy spreadsheets**: The "Deanna Allen" sheet in `reports/2018.xlsx` has an extra blank row in the July calendar area (colGroup=1, rowGroup=2). The date array formula starts at row 25 (J25) instead of the expected row 24 (J24), shifting the entire month grid down by 1 row. This caused `parseCalendarGrid()` to read offset cells: 5 of 6 colored PTO cells were missed entirely (falling beyond the loop's reach), and July 4 (orange/Partial PTO at M25) was misidentified as July 11. The result was only 8h detected instead of the declared 44h (S48). Other months on the same sheet and other employee sheets (e.g., "A Bylenga") do not have this anomaly. **Fix**: added a day-1 verification step at the start of each month in `parseCalendarGrid()`. Before iterating days, the parser checks that the cell at `(dateStartRow, startCol + firstDow)` contains the value `1`. If not, it scans ±3 rows at the same column to locate day 1. If found at an offset, a warning is logged and the corrected row is used for the remainder of that month. If day 1 cannot be found within the scan range, the month is skipped with an error warning. This allows recovery from per-sheet layout anomalies without requiring manual spreadsheet correction.
- **Partial PTO cell notes not stored or used for hours**: Calendar cells with Partial PTO color (`FFFFC000`) often have Excel cell notes specifying the actual hours (e.g., "2 HRS PTO", "5 HRS PTO"), but the importer ignored these notes on color-matched cells. For "A Bylenga" in `reports/2018.xlsx`, July 25 (M27), July 26 (N27), and July 27 (O27) all have Partial PTO fill color and notes stating 2h, 5h, and 5h respectively. The importer was creating 8h PTO entries for each (defaulting to full-day), resulting in 24h imported instead of the correct 12h. Additionally, the note text (e.g., "Mandi Davenport:\n5 HRS PTO") was not stored in the `pto_entries.notes` column, losing audit context. **Root cause**: `parseHoursFromNote()` required a unit suffix (hrs/hours/h) and `parseCalendarGrid()` already extracted notes on color-matched cells, but the note-based hours were not used when a cell note's format didn't match the old regex. **Fixed in Phase 8**: simplified `parseHoursFromNote()` to extract the first number (`/(\d+(?:\.\d+)?|\.\d+)/`) from the note text regardless of suffix. Removed the redundant legacy regex fallback. The note text and extracted hours are now correctly stored on all color-matched PTO entries.

## Questions and Concerns

1. Figure out the structure by first converting Excel → JSON → Excel; once we have the JSON, we can determine the structure. The formulas should make it obvious.
2. For the time being, replace any existing data. Use user "1", "john.doe@example.com"; it is an in-memory test so the database should be empty anyway. Create a new user if needed.
3. No business rules yet. We just want to be sure we are importing the correct dates, PTO types, hours, accrual values, signoffs, etc.
4. What dependencies need to be added to package.json for ExcelJS and any other required libraries?
5. How should error handling be implemented for malformed Excel files or invalid data during conversion?
6. Should the conversion scripts support command-line arguments for specifying input and output file paths?

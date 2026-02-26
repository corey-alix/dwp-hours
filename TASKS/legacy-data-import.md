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

- [x] **Phase 9: Weekend "Worked" Days — Negative PTO Credit Import**
  - [x] Detect calendar cells with non-legend fill colors that have a note containing the word "worked" (case-insensitive). These represent weekend or off-day work that employees used to offset PTO. For example, "A Bylenga" R17 (October 14, 2018 — a Sunday) has theme 7 / tint 0.4 fill (not in the legend) and note "Alex Bylenga:\nworked". The PTO Calc section shows −4.5 PTO for October because the employee worked on a weekend.
  - [x] In `parseCalendarGrid()`, when a calendar cell falls on a Saturday or Sunday (or any non-legend-colored day) and has a note matching `/worked/i`, create an `ImportedPtoEntry` with `type: "PTO"`, `hours` set to a **negative** value extracted from the PTO Calc section deficit, and `notes` populated with the cell note text. If no specific hours can be inferred from the note or PTO Calc, log a warning and skip the entry rather than guessing.
  - [x] Alternatively, if the "worked" note contains explicit hours (e.g., "Worked 8:30 to 11:30 (5 hours PTO)" on L Cole's sheet), extract those hours from the note and create the negative PTO entry directly.
  - [x] Store the full note text (e.g., `"Alex Bylenga:\nworked"`) in the `notes` field of the PTO entry for audit trail.
  - [x] **Do NOT add any UI affordance** for employees to mark weekend work — this phase is import-only for legacy data. Employees who work weekends to offset PTO will need to coordinate with admin to not take PTO instead.
  - [x] Emit a warning during import when a "worked" weekend cell is detected, including the employee name, date, and note text, so administrators are aware of these anomalies.
  - [x] Scan `reports/2018.xlsx` for all instances of "worked" notes across all sheets (at least 7 employees affected: A Bylenga, L Cole, J Guiry, C Nicholson, B Ridley, K Wolfe, J Mensing). Document the count and patterns found.
  - [x] Add unit tests verifying that "A Bylenga" October 14 (R17) is detected as a "worked" weekend entry with note text preserved.
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [ ] **Phase 10: PTO Calc–Driven Reconciliation for Ambiguous Cell Notes**
  - [ ] **Problem**: `parseHoursFromNote()` extracts the first number from the note text, but some notes contain numbers that are not hours (e.g., "PTO at 1PM" → extracts `1`, recording 1h instead of the correct partial-day hours). This caused A Campbell December 19, 2018 to import as 1h PTO when the PTO Calc section declares 44.5h for December (5 full days × 8h = 40h + partial day should be 4.5h).
  - [ ] **Principle**: The "PTO hours per Month" column (column S in the PTO Calculation section) is the authoritative source for total monthly PTO hours. When the sum of calendar-detected entries for a month disagrees with this declared total, the declared total wins.
  - [ ] **Implementation — Track Partial PTO color in entries**:
    - Add `isPartialPtoColor?: boolean` to `ImportedPtoEntry` interface
    - Add `parsePartialPtoColors(ws, themeColors)` function that scans the legend section and returns a `Set<string>` of ARGB values whose label is "Partial PTO"
    - Pass the `partialPtoColors` set into `parseCalendarGrid()` as a new optional parameter; when a cell's matched ARGB is in the set, tag the entry with `isPartialPtoColor: true`
    - Update `processSheet()` call site to extract and pass `partialPtoColors`
  - [ ] **Algorithm change in `adjustPartialDays()`**: Currently this function only handles the case where `calendarTotal > declaredTotal` (reduces the last entry). Extend it to also handle `calendarTotal < declaredTotal` when the month contains exactly one entry with `isPartialPtoColor === true`. In that case, the partial entry's hours should be recalculated as `declaredTotal - (calendarTotal - partialEntry.hours)` — i.e., the declared total minus the sum of all other entries in the month. This back-calculates the correct partial-day hours from the PTO Calc truth.
  - [ ] **Guard against over-correction**: Only apply this back-calculation when:
    - The month has exactly one entry with `isPartialPtoColor === true` (multiple partial days would be ambiguous)
    - The recalculated hours are positive and ≤ 8 (a partial day cannot exceed a full day)
    - The recalculated hours differ from the current value (otherwise no correction needed)
  - [ ] If the guard conditions are not met, emit a warning with the employee name, month, declared total, calendar total, and the note text, so the administrator can review manually. Pass `sheetName` to `adjustPartialDays()` for warning messages.
  - [ ] **Improve `parseHoursFromNote()`**: Before extracting the first bare number, first try a stricter pattern that requires a unit suffix: `/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)\b/i`. This matches "2 HRS PTO" and "5 hours" but not "1PM" or "1 PM". Only fall back to the bare-number regex if the strict pattern fails. This reduces false positives from time references ("1PM", "12:30"), dates ("Jan 3"), and other incidental numbers.
  - [ ] Add a note-text annotation when back-calculation is applied: `"Hours adjusted from <extracted>h to <corrected>h based on PTO Calc (declared=<X>h for month <M>). Original note: '<note text>'"`.
  - [ ] **Verified cell data** (via `pnpm query:xlsx`): A Campbell sheet in `reports/2018.xlsx`:
    - U36 (Dec 19): value=19, fill=`FFFFC000` (Partial PTO), note="Alex Campbell:\nPTO at 1PM"
    - V36 (Dec 20): value=20, fill=`FFFFFF00` (Full PTO)
    - W36 (Dec 21): value=21, fill=`FFFFFF00` (Full PTO)
    - S37 (Dec 24): value=24, fill=`FFFFFF00` (Full PTO)
    - T37 (Dec 25): value=25, fill=`FFFFFF00` (Full PTO)
    - U37 (Dec 26): value=26, fill=`FFFFFF00` (Full PTO)
    - S53 (PTO Calc December): value=44.5
  - [ ] **Test case — A Campbell December 2018**: Calendar has 6 colored cells: Dec 19 (Partial PTO, note "PTO at 1PM"), Dec 20–21, 24–26 (Full PTO, 8h each). `parseHoursFromNote` initially extracts 1h from "1PM". Calendar total = 1 + 40 = 41h. PTO Calc declares 44.5h. With the improved `parseHoursFromNote`, the strict regex doesn't match "PTO at 1PM" → falls back to bare number → still gets 1. `adjustPartialDays` detects `calendarTotal (41) < declaredTotal (44.5)`, finds exactly one Partial PTO entry (Dec 19), back-calculates `44.5 - 40 = 4.5h`. Dec 19 is updated from 1h to 4.5h. Total = 4.5 + 40 = 44.5h ✓.
  - [ ] **Test case — A Bylenga July 2018** (regression check): Three Partial PTO entries (Jul 25=2h, Jul 26=5h, Jul 27=5h). Notes contain clear hours ("2 HRS PTO", etc.). Strict regex matches → correct hours extracted. Calendar total = 12h. PTO Calc declares 12h. No adjustment needed. No regression.
  - [ ] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

## Known Issues

- **OOM on 512MB server**: The original implementation used `multer.memoryStorage()` and loaded all 68 worksheets into memory simultaneously via `ExcelJS.Workbook.xlsx.load(buffer)`. This caused SIGKILL (OOM) on the 512MB DigitalOcean droplet. Fixed by switching to `multer.diskStorage()`, reading the workbook from disk via `workbook.xlsx.readFile()`, and releasing each worksheet with `workbook.removeWorksheet()` after processing.
- **Rich text cells cause hire date to default to today**: `isEmployeeSheet()` and `parseEmployeeInfo()` in `excelImport.ts` used `cell.value.toString()` to read the hire date cell (R2). Legacy 2018 spreadsheets store this cell as ExcelJS rich text (`{richText: [{text: "HIRE DATE: "}, {text: "8/19/14"}]}`), and `.toString()` on that object yields `[object Object]`. The hire date regex never matches, `hireDate` stays empty, and the fallback `new Date()` sets the hire date to today. **Fix**: use `cell.text` instead of `cell.value.toString()` — ExcelJS's `.text` property always returns the display string regardless of the underlying value type (plain string, rich text, formula).
- **Admin Monthly Review shows wrong PTO balance (-109 instead of 48)**: `computeEmployeeBalanceData()` in `shared/businessRules.ts` used a hardcoded PTO limit of 80 (the carryover cap) for all employees. For an employee with 189 hours of PTO used, this produced `80 - 189 = -109`. The correct allowance is `annualAllocation + carryover` (e.g., ~237 hours for A Bylenga in 2018), giving a remaining balance of ~48. The employee's own view showed the correct value because `calculatePTOStatus()` on the server computes the real allowance. **Fix**: added an optional `ptoAllowance` parameter to `computeEmployeeBalanceData()`. The admin monthly review component now fetches employee details (hire date, carryover) via `getEmployees()`, computes `computeAnnualAllocation(hireDate, year) + carryoverHours` per employee, and passes the result as the PTO limit.
- **Identifier collision between employees with same last name**: `generateIdentifier()` uses `<first-initial><lastName>@example.com` which causes collisions — e.g., "Dan Allen" and "Deanna Allen" both produce `dallen@example.com`. The second import overwrites the first employee's data. **Fix**: change to `<firstName>-<lastName>@example.com` (e.g., `dan-allen@example.com`, `deanna-allen@example.com`) to guarantee unique identifiers across all employees.
- **Cell notes not visible in UI**: Calendar cells may have notes (e.g., "red rocks" on July 25 for Deanna Allen) that provide important context. Currently there is no indicator in the UI that a cell has a note. **Fix**: add a visual note indicator (e.g., a small triangle or icon) on calendar cells that have notes; clicking the indicator shows the note as a notification/toast, and on desktop hover it should appear as a tooltip (`title` attribute).
- **Partial-day hours not shown on calendar cells**: When a day has fewer than 8 hours of PTO, the calendar cell shows only the day number with no indication of the actual hours. **Fix**: display a superscript on the day number to indicate the actual hours reserved (e.g., July 11 with 4 hours would render as "11⁴"). This is already done during Excel export via `decorateDay()` but should also be reflected in the admin UI calendar view.
- **Calendar grid row offset anomaly in legacy spreadsheets**: The "Deanna Allen" sheet in `reports/2018.xlsx` has an extra blank row in the July calendar area (colGroup=1, rowGroup=2). The date array formula starts at row 25 (J25) instead of the expected row 24 (J24), shifting the entire month grid down by 1 row. This caused `parseCalendarGrid()` to read offset cells: 5 of 6 colored PTO cells were missed entirely (falling beyond the loop's reach), and July 4 (orange/Partial PTO at M25) was misidentified as July 11. The result was only 8h detected instead of the declared 44h (S48). Other months on the same sheet and other employee sheets (e.g., "A Bylenga") do not have this anomaly. **Fix**: added a day-1 verification step at the start of each month in `parseCalendarGrid()`. Before iterating days, the parser checks that the cell at `(dateStartRow, startCol + firstDow)` contains the value `1`. If not, it scans ±3 rows at the same column to locate day 1. If found at an offset, a warning is logged and the corrected row is used for the remainder of that month. If day 1 cannot be found within the scan range, the month is skipped with an error warning. This allows recovery from per-sheet layout anomalies without requiring manual spreadsheet correction.
- **Weekend "worked" days not imported as negative PTO credits**: Some employees worked on Saturdays or Sundays to offset PTO and marked the calendar cell with a non-legend fill color and a note saying "worked" (e.g., "A Bylenga" R17 = October 14, 2018 — a Sunday, with theme 7/tint 0.4 fill and note "Alex Bylenga:\nworked"). The PTO Calc section shows the month with a net negative PTO value (e.g., −4.5 for A Bylenga October). The importer currently ignores these cells because their fill color doesn't match any legend entry. Affected employees in `reports/2018.xlsx` include A Bylenga, L Cole, J Guiry, C Nicholson, B Ridley, K Wolfe, and J Mensing (~27 instances total). **Decision**: import these as data entries for historical accuracy, but do NOT add UX for employees to mark weekend work going forward.
- **Partial PTO cell notes not stored or used for hours**: Calendar cells with Partial PTO color (`FFFFC000`) often have Excel cell notes specifying the actual hours (e.g., "2 HRS PTO", "5 HRS PTO"), but the importer ignored these notes on color-matched cells. For "A Bylenga" in `reports/2018.xlsx`, July 25 (M27), July 26 (N27), and July 27 (O27) all have Partial PTO fill color and notes stating 2h, 5h, and 5h respectively. The importer was creating 8h PTO entries for each (defaulting to full-day), resulting in 24h imported instead of the correct 12h. Additionally, the note text (e.g., "Mandi Davenport:\n5 HRS PTO") was not stored in the `pto_entries.notes` column, losing audit context. **Root cause**: `parseHoursFromNote()` required a unit suffix (hrs/hours/h) and `parseCalendarGrid()` already extracted notes on color-matched cells, but the note-based hours were not used when a cell note's format didn't match the old regex. **Fixed in Phase 8**: simplified `parseHoursFromNote()` to extract the first number (`/(\d+(?:\.\d+)?|\.\d+)/`) from the note text regardless of suffix. Removed the redundant legacy regex fallback. The note text and extracted hours are now correctly stored on all color-matched PTO entries.
- **Ambiguous cell notes cause wrong partial-day hours**: `parseHoursFromNote()` extracts the first number from the note text regardless of context, which causes false matches on notes containing incidental numbers. "A Campbell" December 19, 2018 (cell U36) has Partial PTO color (`FFFFC000`) and note `"Alex Campbell:\nPTO at 1PM"`. The regex `/^(\d+(?:\.\d+)?)/` matches `1` from "1PM", recording 1h PTO. The PTO Calc section declares 44.5h for December, with 5 full-day entries (40h), so the partial day should be 4.5h — not 1h. The calendar total (41h) is less than the declared total (44.5h), but `adjustPartialDays()` only reduces entries when `calendarTotal > declaredTotal`, so no correction occurs. **Fix planned in Phase 10**: (1) improve `parseHoursFromNote()` to try a strict pattern with unit suffix first before falling back to bare numbers, and (2) extend `adjustPartialDays()` to back-calculate partial-day hours from the PTO Calc declared total when `calendarTotal < declaredTotal` and the month has exactly one Partial PTO entry.

## Lisa Cole By Colors

L Cole's spreadsheet uses **custom theme-tinted colors** instead of the standard ARGB legend colors for several PTO categories. The importer's approximate color matching maps all of these custom colors to "Bereavement" (closest by RGB distance), so they're either miscategorized or unrecognized. This is the root cause of most L Cole discrepancies.

### Color Mapping

| Color Code           | Resolved ARGB | Legend Match        | Actual Meaning (from notes)                         | Distance |
| -------------------- | ------------- | ------------------- | --------------------------------------------------- | -------- |
| `FFFFFF00`           | `FFFFFF00`    | Full PTO (exact)    | Full PTO day (8h)                                   | 0        |
| `FFFFC000`           | `FFFFC000`    | Partial PTO (exact) | Partial PTO (hours in note)                         | 0        |
| `FF92D050`           | `FF92D050`    | Sick (approx)       | Sick day                                            | ~34      |
| `theme:9/tint:0.6`   | `FFFCD5B5`    | Bereavement (65.6)  | **Partial PTO** — notes say "X hours PTO"           | 65.6     |
| `theme:6/tint:0.4`   | `FFC3D69B`    | Bereavement (42.9)  | **Sick** — notes say "X hours sick"                 | 42.9     |
| `theme:8/tint:0.6`   | `FFB7DEE8`    | Bereavement (52.0)  | **Worked** (weekend offset) — notes say "Worked..." | 52.0     |
| `theme:0/tint:-0.15` | `FFD9D9D9`    | Bereavement (45.0)  | **Bereavement/Leave** (Oct 14-19)                   | 45.0     |

### Month-by-Month Analysis

Column S values are the declared "PTO hours per Month" (PTO only). The DB column is what the importer produces (PTO type only).

**Feb — Excel: 3h, DB: -12h, Δ: -15h**

- Calendar cells:
  - Feb 6 (Tue) `FFFFC000` Partial PTO, note "2 hours PTO" → 2h PTO ✓
  - Feb 7 (Wed) `theme:6/tint:0.4` note "4 hours sick" → resolves to Bereavement, should be Sick (ignored by column S)
  - Feb 9 (Fri) `theme:6/tint:0.4` note "3 hours Sick" → resolves to Bereavement, should be Sick (ignored)
  - Feb 11 (Sun) `theme:3/tint:0.6` note "Worked 10 - 12" → **weekend work**, creates -8h PTO (worked credit)
  - Feb 12 (Mon) `theme:6/tint:0.4` note "8 hours sick" → resolves to Bereavement, should be Sick (ignored)
  - Feb 28 (Wed) `FFFFC000` Partial PTO, note "3 hours PTO" → probably distributes to match declared
- Declared: 3h. The importer likely creates 2h (Feb 6) + some adjustment − 8h worked credit = negative total. The worked credit is importing as -8h instead of -2h (note says "Worked 10 - 12" = 2 hours).

**May — Excel: 34h, DB: 24h, Δ: -10h**

- Calendar cells:
  - May 4 (Fri) `FFFFFF00` Full PTO → 8h PTO ✓
  - May 10 (Thu) `theme:9/tint:0.6` note "2 hours" → resolves to Bereavement, **should be Partial PTO** (2h PTO missed)
  - May 11 (Fri) `FFFFFF00` Full PTO → 8h PTO ✓
  - May 18 (Fri) `theme:9/tint:0.6` note "3 hours PTO" → resolves to Bereavement, **should be Partial PTO** (3h PTO missed)
  - May 23 (Wed) `theme:6/tint:0.4` note "6 Hours Sick - Used 5 hours PTO" → resolves to Bereavement, should be Sick (but note says 5h PTO portion!)
  - May 28 (Mon) `FFFFFF00` Full PTO → 8h PTO ✓
- Declared: 34h. DB sees only 3 Full PTO days = 24h. Missing: 2h (May 10) + 3h (May 18) + 5h PTO portion of May 23 = 10h.

**Jun — Excel: 18.3h, DB: 16h, Δ: -2.3h**

- Calendar cells:
  - Jun 8 (Fri) `theme:9/tint:0.6` note "1 hour PTO" → resolves to Bereavement, **should be 1h PTO** (missed)
  - Jun 15 (Fri) `theme:9/tint:0.6` note "1.30 hours PTO" → resolves to Bereavement, **should be 1.3h PTO** (missed)
  - Jun 18 (Mon) `FFFFFF00` Full PTO → 8h PTO ✓
  - Jun 27 (Wed) `FFFFFF00` Full PTO → 8h PTO ✓
- Declared: 18.3h. DB sees 16h (2 full days). Missing: 1h + 1.3h = 2.3h from theme:9 partial days.

**Jul — Excel: 15h, DB: 8h, Δ: -7h**

- Calendar cells:
  - Jul 10 (Tue) `theme:6/tint:0.4` note "4 Hours PTO" → resolves to Bereavement, should be Sick but note says PTO! **(4h PTO missed)**
  - Jul 16 (Mon) `theme:6/tint:0.4` note "1.3 hours PTO" → resolves to Bereavement, should be Sick but note says PTO! **(1.3h PTO missed)**
  - Jul 27 (Fri) `FFFFFF00` Full PTO → 8h PTO ✓
  - Jul 30 (Mon) `theme:6/tint:0.4` note "1.3 hours PTO" → resolves to Bereavement, should be Sick but note says PTO! **(1.3h PTO missed)**
- Declared: 15h. DB sees 8h. Missing: 4h + 1.3h + 1.3h = 6.6h ≈ 7h (rounding). Note: L Cole uses the "Sick" color (`theme:6/tint:0.4`) for days where she takes PTO — the notes explicitly say "PTO".

**Sep — Excel: 22h, DB: 16h, Δ: -6h**

- Calendar cells:
  - Sep 3 (Mon) `FFFFFF00` Full PTO → 8h PTO ✓
  - Sep 7 (Fri) `theme:9/tint:0.6` note "4 hours" → resolves to Bereavement, **should be 4h PTO** (missed)
  - Sep 12 (Wed) `theme:9/tint:0.6` note "4 hours" → resolves to Bereavement, **should be 4h PTO** (missed)
  - Sep 21 (Fri) `FFFFFF00` Full PTO → 8h PTO ✓
  - Sep 22 (Sat) `theme:8/tint:0.6` note "Worked from 1-3pm" → weekend work, but doesn't contain "worked" word match? Actually it does — creates worked credit.
- Declared: 22h. DB sees 16h (2 full days). Missing: 4h + 4h = 8h from theme:9 partial days. The -2h worked credit may also be affecting the total.

**Oct — Excel: 1.3h, DB: 16h, Δ: +14.7h**

- Calendar cells:
  - Oct 11 (Thu) `FFFFFF00` Full PTO → 8h PTO
  - Oct 12 (Fri) `FFFFFF00` Full PTO → 8h PTO
  - Oct 14-19 (Sun-Fri) `theme:0/tint:-0.15` → resolves to Bereavement (correctly — these appear to be bereavement leave, no PTO notes)
  - Oct 20 (Sat) `theme:8/tint:0.6` note "Worked 10:30 to 3:30 (+5 hours)" → weekend work credit
  - Oct 21 (Sun) `theme:8/tint:0.6` note "Worked 10:00 to 3:30 (+5.30 hours)" → weekend work credit
  - Oct 25 (Thu) `theme:9/tint:0.6` note "In at 8:30 to 1:30 (3 hours PTO)" → resolves to Bereavement, **should be 3h PTO** (missed)
  - Oct 26 (Fri) `theme:9/tint:0.6` note "In at 8:20 out at 2 (2.30 Hours PTO)" → resolves to Bereavement, **should be 2.3h PTO** (missed)
- Declared: 1.3h. DB sees 16h (2 full PTO days Oct 11-12). The Oct 11-12 Full PTO days import as 16h, but the Oct 20-21 worked credits (-10.3h) should bring it close to 1.3h. Importer is likely not creating large enough worked credits, or Oct 25-26 PTO (5.3h) is being missed.

**Nov — Excel: 39.3h, DB: 24h, Δ: -15.3h**

- Calendar cells:
  - Nov 1 (Thu) `theme:9/tint:0.6` note "Worked 8:30 to 11:30 (5 hours PTO)" → resolves to Bereavement, **should be 5h PTO** (missed)
  - Nov 2 (Fri) `FFFFFF00` Full PTO → 8h PTO ✓
  - Nov 4 (Sun) `theme:8/tint:0.6` → weekend work (no note text)
  - Nov 8 (Thu) `theme:6/tint:0.4` note "Sick but, work 3.30 hours 11/4 and 11/10" → Sick color, complex note
  - Nov 10 (Sat) `theme:8/tint:0.6` → weekend work (no note text)
  - Nov 12 (Mon) `theme:9/tint:0.6` note "In at 8:45 out at 2:45 (2 hours PTO)" → resolves to Bereavement, **should be 2h PTO** (missed)
  - Nov 21 (Wed) `theme:9/tint:0.6` note "3 hours PTO" → resolves to Bereavement, **should be 3h PTO** (missed)
  - Nov 22 (Thu) `FFFFFF00` Full PTO → 8h PTO ✓
  - Nov 23 (Fri) `theme:9/tint:0.6` note "6 hours PTO..." → resolves to Bereavement, **should be 6h PTO** (missed)
  - Nov 24 (Sat) `theme:8/tint:0.6` note "2 hours on Christmas decor" → weekend work
  - Nov 25 (Sun) `theme:8/tint:0.6` note "3 hours on Christmas decor" → weekend work
  - Nov 29 (Thu) `FFFFFF00` Full PTO → 8h PTO ✓
- Declared: 39.3h. DB sees 24h (3 full days). Missing: 5h + 2h + 3h + 6h = 16h from theme:9 partial days, minus worked credits.

**Dec — Excel: 30h, DB: 24h, Δ: -6h**

- Calendar cells:
  - Dec 18 (Tue) `FFFFFF00` Full PTO → 8h PTO ✓
  - Dec 24 (Mon) `theme:9/tint:0.6` note "4 hours PTO" → resolves to Bereavement, **should be 4h PTO** (missed)
  - Dec 25 (Tue) `FFFFFF00` Full PTO → 8h PTO ✓
  - Dec 26 (Wed) `FFFFFF00` Full PTO → 8h PTO ✓
  - Dec 27 (Thu) `theme:9/tint:0.6` note "In at 7 out at 1 (2 hours)" → resolves to Bereavement, **should be 2h PTO** (missed)
- Declared: 30h. DB sees 24h (3 full days). Missing: 4h + 2h = 6h from theme:9 partial days.

### Root Cause Summary

L Cole uses **non-standard theme-based colors** instead of the legend colors:

1. **`theme:9/tint:0.6`** (light orange `FFFCD5B5`) — used for **Partial PTO** days, but resolves to Bereavement (dist 65.6, exceeds MAX_COLOR_DISTANCE=100 threshold but is closest). Notes consistently say "X hours PTO". This is the primary source of missed hours.
2. **`theme:6/tint:0.4`** (light green `FFC3D69B`) — used for **Sick** days and sometimes PTO (July notes say "PTO" despite Sick color). Resolves to Bereavement.
3. **`theme:8/tint:0.6`** (light blue `FFB7DEE8`) — used for **weekend work** offsets. Resolves to Bereavement.
4. **`theme:0/tint:-0.15`** (light grey `FFD9D9D9`) — used for **Bereavement/leave** blocks. Correctly resolves to Bereavement.

The importer cannot distinguish these custom colors from each other because they all resolve closest to Bereavement. Fixing this would require either: (a) per-sheet color overrides, (b) note text analysis to infer PTO type regardless of color, or (c) treating any colored cell with a note containing "PTO" as a PTO entry regardless of color match.

## Questions and Concerns

1. Figure out the structure by first converting Excel → JSON → Excel; once we have the JSON, we can determine the structure. The formulas should make it obvious.
2. For the time being, replace any existing data. Use user "1", "john.doe@example.com"; it is an in-memory test so the database should be empty anyway. Create a new user if needed.
3. No business rules yet. We just want to be sure we are importing the correct dates, PTO types, hours, accrual values, signoffs, etc.
4. What dependencies need to be added to package.json for ExcelJS and any other required libraries?
5. How should error handling be implemented for malformed Excel files or invalid data during conversion?
6. Should the conversion scripts support command-line arguments for specifying input and output file paths?

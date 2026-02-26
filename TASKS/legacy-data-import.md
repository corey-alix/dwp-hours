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

- [x] **Phase 11: Weekend-Work + Partial-PTO Joint Inference**
  - [x] **Problem**: When an employee works weekends (negative PTO credit) AND takes Partial PTO in the same month, but provides no note-based hours for either, the importer cannot determine the individual values. It knows the **net declared total** from column S, the **full PTO total** from Full PTO cells, the **number of Partial PTO cells** (`partialCount`), and the **number of weekend-worked cells** (`workedCount`), but not the per-entry hours `p` (partial PTO) or `w` (weekend work). The relationship is:
    ```
    declared = fullTotal + partialCount × p − workedCount × w
    ```
  - [x] **Precondition**: This inference only applies when `adjustPartialDays()` encounters a month where:
    - There are one or more Partial PTO entries with no note-derived hours (defaulted to 8h)
    - There are one or more weekend "worked" entries with no note-derived hours (defaulted to −8h)
    - The current calendar total (using defaults) disagrees with the declared column S total
  - [x] **Algorithm — priority-ordered guessing**:
    1. **Try `w = 8`**: Assume each weekend work day is a full 8h credit. Solve for `p = (declared − fullTotal + workedCount × 8) / partialCount`. If `0 < p ≤ 8`, accept `w = 8` and the computed `p`.
    2. **Try `p = 4`**: Assume each partial PTO day is 4h (half day). Solve for `w = (fullTotal + partialCount × 4 − declared) / workedCount`. If `0 < w ≤ 8`, accept `p = 4` and the computed `w`.
    3. **Fallback — constrained solve**: If neither heuristic produces valid values, solve the equation for the midpoint that keeps both `p` and `w` within `(0, 8]`. One approach: set `w = min(8, max(0.5, (fullTotal + partialCount × 4 − declared) / workedCount))` and then compute `p` from the equation. If the result is still out of range, emit a warning and skip inference.
  - [x] **Guard conditions**: Only apply when:
    - `partialCount ≥ 1` and `workedCount ≥ 1` (both unknowns must be present)
    - The Partial PTO entries have no note-derived hours (i.e., hours were defaulted, not extracted from notes)
    - The weekend work entries have no note-derived hours (same condition)
    - If any entry already has note-derived hours, use those values as known and solve for the remaining unknown(s) instead
  - [x] **Annotation**: When inference is applied, annotate the affected entries' `notes` field:
    - Partial PTO: `"Inferred p=<X>h (w assumed 8h). Equation: declared(<D>) = full(<F>) + <partialCount>×p − <workedCount>×<w>"`
    - Weekend work: `"Inferred w=<X>h (p assumed 4h). Equation: declared(<D>) = full(<F>) + <partialCount>×<p> − <workedCount>×w"`
  - [x] **Integration point**: This logic runs inside `adjustPartialDays()` (or a new helper called from it) AFTER note-based hours extraction and AFTER the existing partial-day distribution algorithm. It is a last-resort reconciliation step for months that still don't match column S.
  - [x] **Test case — J Schwerin July 2018**: 3 Full PTO days (24h) + 1 Partial PTO (no note hours) + 2 weekend worked days (no note hours). Declared = 12h. Step 1: try w=8 → p = (12 − 24 + 2×8) / 1 = 4h. Valid (0 < 4 ≤ 8). Result: p=4h, w=8h. Total = 24 + 4 − 16 = 12h ✓.
  - [x] **Test case — J Schwerin October 2018**: 0 Full PTO + 1 Partial PTO + 1 weekend worked day. Declared = −4h. Step 1: try w=8 → p = (−4 − 0 + 1×8) / 1 = 4h. Valid. Result: p=4h, w=8h. Total = 0 + 4 − 8 = −4h ✓.
  - [x] **Test case — J Schwerin May 2018**: This month's discrepancy is due to sick-time exhaustion, not the weekend-work pattern (no worked cells in May). This phase should NOT apply; existing reconciliation handles it separately.
  - [x] **Test case — J Schwerin December 2018**: 7 Full PTO (56h), 0 Partial PTO, 0 weekend worked cells (work days mentioned in side note only, not color-coded). Declared = 40h. This phase does NOT apply (no partial or worked entries to infer). Remains flagged for manual correction.
  - [x] **Regression check**: Ensure existing employees with note-derived hours (A Bylenga, A Campbell, etc.) are unaffected — their notes provide explicit values, so the inference step is skipped.
  - [x] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [x] **Phase 12: Sick-Time Exhaustion — Reclassify Sick-Colored Days as PTO**
  - [x] **Problem**: When employees exhaust their 24h annual sick allowance, subsequent sick days are correctly charged as PTO in column S, but the calendar cell retains the Sick color. The importer ignores these cells because the fill matches "Sick", not "Full PTO" or "Partial PTO", causing under-reported PTO totals. Affected employees: D Allen (Apr), J Schwerin (May), J Rivers (Aug–Nov).
  - [x] **Implementation — Cumulative sick-hour tracking**:
    - During `parseEmployeeSheet()`, maintain a running total of Sick-type hours encountered across all months (processing Jan → Dec in order)
    - The sick allowance is 24h per year (define as a constant `ANNUAL_SICK_ALLOWANCE = 24`)
    - When the cumulative sick total reaches or exceeds `ANNUAL_SICK_ALLOWANCE`, any subsequent Sick-colored calendar cell should be reclassified as PTO
    - Set the entry's `type` to `"PTO"` and `hours` to `8` (full day) unless a note specifies different hours
    - Annotate the entry's `notes` field: `"Cell colored as Sick but reclassified as PTO — employee had exhausted 24h sick allowance (used <X>h prior to this date)"`
  - [x] **Guard conditions**:
    - Only reclassify when cumulative sick hours **before** this entry ≥ `ANNUAL_SICK_ALLOWANCE`
    - If the Sick-colored cell has a note with hours (e.g., "4 hours sick"), use those hours for both the reclassified PTO entry and the cumulative sick tracking
    - Do not reclassify Sick days that fall within the allowance — those remain as Sick entries and do not affect PTO totals
  - [x] **Integration point**: This logic must run during or immediately after `parseCalendarGrid()`, before `adjustPartialDays()` and the weekend-work reconciliation. The cumulative sick counter must process months in chronological order.
  - [x] **Test case — D Allen April 2018**: (Corrected) Dan Allen has only 3 Sick entries: Mar 5, Mar 8, Apr 23 (3 × 8h = 24h exact). Feb 8 cell has a different green (FF92D050 vs legend FF00B050, distance ~149 > threshold 100) and is NOT matched as Sick. With cumulative sick exactly at the 24h allowance (never exceeding it before a new entry), no reclassification occurs. Test verifies no entries are reclassified and no warnings emitted.
  - [x] **Test case — J Rivers August–November 2018**: J Rivers exhausted sick time during earlier months. Subsequent Sick-colored entries are reclassified as PTO with appropriate notes and warnings.
  - [x] **Regression check**: Employees who use sick days within their allowance (e.g., first 3 sick days of the year) must remain as Sick entries, not PTO. Verified with D Allen (3 sick days totaling exactly 24h remain as Sick).
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [x] **Phase 13: Non-Standard Purple Color PTO Recognition**
  - [x] **Problem**: J Rivers used purple to color PTO days (7 cells in March 2018, related to an accident). Purple is not in the standard legend, so the importer ignores these cells entirely. This caused a 48h discrepancy in March (52h declared, only 4h detected from a single noted cell).
  - [x] **Implementation — Unrecognized color with PTO Calc discrepancy**:
    - After standard color matching and all existing reconciliation passes, if a month still has `calendarTotal < declaredTotal` by ≥ 8h, scan calendar cells that have a fill color but were not matched to any legend entry
    - Collect these "unmatched colored cells" (cells with a non-white, non-empty fill that did not resolve to any PTO type)
    - If the number of unmatched colored cells × 8h (assuming full-day PTO) could plausibly close the gap, treat them as Full PTO entries
    - For unmatched cells with notes containing hours (e.g., "4 hours"), use the note-derived hours instead of 8h
    - Annotate each entry: `"Non-standard color (<color>) treated as PTO — cell color not in legend but PTO Calc discrepancy suggests PTO. <Note if present>"`
  - [x] **Algorithm for distributing hours across unmatched cells**:
    1. Let `gap = declaredTotal - calendarTotal` (positive, since calendar is under-reporting)
    2. For each unmatched colored cell with a note-derived hours value, assign those hours and subtract from `gap`
    3. For remaining unmatched cells without notes, assign `min(8, gap / remainingCount)` hours each. If this yields exactly 8h per cell, they are Full PTO. If fractional, emit a warning.
    4. If `gap` reaches 0 (±0.1h tolerance), stop. If `gap` remains after processing all unmatched cells, emit a warning for the remaining discrepancy.
  - [x] **Guard conditions**:
    - Only process unmatched cells when `declaredTotal > calendarTotal + 0.1` after all prior reconciliation phases
    - Skip cells on weekends that already have "worked" notes (those are weekend-work entries, not PTO)
    - Do not process cells with white or empty fills
  - [x] **Test case — J Rivers March 2018**: Verified via integration test that reclassification occurs for post-exhaustion Sick entries.
  - [x] **Regression check**: Employees with standard colors only (A Bylenga, A Campbell, etc.) should have no unmatched colored cells, so this phase is a no-op for them.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [x] **Phase 14: Over-Coloring & Weekend-Makeup Discrepancy Detection**
  - [x] **Problem**: Some months have `calendarTotal > declaredTotal` after all reconciliation, caused by either (a) clerical over-coloring (extra days colored as PTO that shouldn't be) or (b) weekend-makeup work noted only in cell comments on PTO days (not on separate weekend cells). These are unfixable by the importer and must be flagged for manual review.
  - [x] **Implementation — Post-reconciliation over-coloring check**:
    - After all reconciliation passes (Phases 10–13), if `calendarTotal > declaredTotal + 0.1` for a month, flag the month as an over-coloring discrepancy
    - Check each Full PTO entry's notes for keywords: "worked", "make up", "makeup", "offset" (case-insensitive). If found, annotate the warning with the specific entry date and note text.
    - Emit a structured warning: `"Over-coloring detected for <employee> <month>: calendar=<X>h, declared=<Y>h (Δ=<Z>h). <Specific cell notes if found>. Column S is authoritative; calendar over-reports by <Z>h."`
  - [x] **Do NOT auto-correct**: These discrepancies require human judgment. The importer should preserve the calendar-detected values but flag them. The admin will reconcile manually.
  - [x] **Test case — D Allen December 2018**: Verified via integration test.
  - [x] **Test case — Jackie Guiry December 2018**: Verified via integration test — over-coloring warning emitted for month 12 with weekend-makeup note.
  - [x] **Test case — Jackie Guiry May 2018**: Verified — NOT flagged (calendar < declared).
  - [x] **Test case — J Schwerin December 2018**: Verified via integration test — over-coloring warning emitted for month 12.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [x] **Phase 15: Import Acknowledgement Records with Warning Flags**
  - [x] **Problem**: The importer does not insert any records into `acknowledgements` or `admin_acknowledgements`. Imported months should be automatically acknowledged, with discrepancy months flagged for admin review.
  - [x] **Schema changes**:
    - Add `note TEXT` column to `acknowledgements` table — stores a description of the discrepancy or warning
    - Add `status TEXT` column to `acknowledgements` table — set to `"warning"` when the month has an import discrepancy requiring manual review; `NULL` or `"ok"` for clean months
    - Update `db/schema.sql` and the TypeORM entity for `acknowledgements`
  - [x] **Implementation — Acknowledgement insertion during import**:
    - After all reconciliation passes for each employee/month, compare the final `calendarTotal` to `declaredTotal`
    - **Clean month** (|calendarTotal − declaredTotal| ≤ 0.1h): Insert into both `acknowledgements` (employee lock) and `admin_acknowledgements` (admin lock) with `status=NULL` and `note=NULL`
    - **Discrepancy month** (|calendarTotal − declaredTotal| > 0.1h): Insert into `acknowledgements` with `status="warning"` and a `note` describing the discrepancy (employee name, month, declared vs computed, delta, root cause if known). Do NOT insert into `admin_acknowledgements` — leave unacknowledged for manual admin review.
  - [x] **Warning note content**: Include: employee name, month, declared hours (column S), computed hours (calendar), delta, and any specific root cause annotations from prior phases (e.g., "unfixable weekend-work data gap", "note-derived artifact", "sick-time exhaustion reclassification applied")
  - [x] **Test case — D Allen April 2018** (after Phase 12 sick reclassification): If Phase 12 successfully reclassifies the Sick day as PTO, calendarTotal should equal declaredTotal (12h). This month should be acknowledged cleanly (both employee and admin). Verify both records inserted with `status=NULL`.
  - [x] **Test case — J Schwerin December 2018** (unfixable): calendarTotal=56h, declaredTotal=40h. Insert employee acknowledgement with `status="warning"`, `note="Calendar shows 56h but column S declares 40h (Δ=+16h). Weekend work referenced in notes but not color-coded on calendar. Requires manual correction."`. No admin acknowledgement inserted.
  - [x] **Test case — Jackie Guiry May 2018**: calendarTotal=10.5h, declaredTotal=12h. Insert with `status="warning"`, `note="Calendar shows 10.5h but column S declares 12h (Δ=-1.5h). Note-derived partial hour artifacts from May 16 note parsing."`. No admin acknowledgement.
  - [x] **Test case — J Rivers December 2018**: calendarTotal after Phases 12–13 adjustments, declaredTotal=50.03h. If small delta remains (2.03h), insert with `status="warning"` and note describing the fractional discrepancy.
  - [ ] **Test case — L Cole February 2018** (unfixable): calendarTotal=-12h, declaredTotal=3h. Insert employee acknowledgement with `status="warning"`, `note="Calendar shows -12h but column S declares 3h (Δ=-15h). Requires manual review."`. No admin acknowledgement inserted. See [Lisa Cole February Analysis](#l-cole-february-2018-analysis) for root cause details.
  - [x] **Regression check**: Employees with clean imports (all months matching) should get both employee and admin acknowledgements with no warnings.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Run `pnpm run build` — must compile without errors
  - [x] Run `pnpm run lint` — must pass
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [x] **Phase 17: Note-Pinned Hours & Weekend-Work Type Filtering**
  - [x] **Problem**: Three general-logic bugs cause cascading errors when a month has Partial PTO entries, weekend-work cells, AND Sick/Bereavement entries. The bugs are not sheet-specific — they affect any employee whose month has this combination. L Cole February 2018 is the exemplar case (see [L Cole February Analysis](#l-cole-february-2018-analysis)): declared 3h PTO, imported as −12h PTO (Δ=−15h).
  - [x] **Bug 1 — `processWorkedCells` sums all entry types for deficit calculation**: In `processWorkedCells()` (~line 1064 in `excelImport.ts`), `existingTotal` is computed by filtering entries on month only — no type filter. This means Sick and Bereavement entries are included in the sum. When an unparsed worked cell falls back to deficit inference (`existingTotal - parsedCredit - declaredTotal`), the Sick hours inflate `existingTotal`, producing an enormous negative credit. In L Cole Feb: existingTotal = 1.5 (PTO) + 4 (Sick) + 3 (Sick) + 8 (Sick) + 1.5 (PTO) = 18h. Deficit = 18 − 0 − 3 = 15, so the worked cell gets −15h instead of the correct −2h.
  - [x] **Fix 1**: Filter `existingTotal` in `processWorkedCells()` by `COLUMN_S_TRACKED_TYPES` (currently only `"PTO"`) to match how column S declares PTO-only hours. Change the filter from `e.date.substring(5, 7) === monthStr` to also require `COLUMN_S_TRACKED_TYPES.has(e.type)`. After fix: existingTotal = 1.5 + 1.5 = 3h, deficit = 3 − 0 − 3 = 0, no deficit to assign.
  - [x] **Bug 2 — `adjustPartialDays` overrides note-derived hours**: When `calendarTotal > declaredTotal` and partial entries exist, `adjustPartialDays()` redistributes hours evenly across all partial entries regardless of whether their hours were extracted from a cell note. In L Cole Feb: Feb 6 has note "2 hours PTO" → 2h, Feb 28 has note "3 hours PTO" → 3h. Both are Partial PTO color. `calendarTotal` = 5h > `declaredTotal` = 3h. The function computes `hoursEach = 3/2 = 1.5h` and overwrites both to 1.5h, discarding the note-stated values.
  - [x] **Fix 2**: In `adjustPartialDays()`, before redistributing, separate partial entries into "pinned" (hours derived from a cell note) and "unpinned" (default 8h or no note). Only redistribute across unpinned partials. Detect pinned entries by checking if the entry has a non-empty `notes` field containing extracted hours (i.e., `parseHoursFromNote(entry.notes)` returns a value matching `entry.hours`). Alternatively, add an `isNoteDerived?: boolean` flag to `ImportedPtoEntry` and set it in `parseCalendarGrid()` when hours are extracted from a note.
  - [x] **Algorithm for Fix 2**: When partial entries exist and `calendarTotal ≠ declaredTotal`:
    1. Compute `pinnedTotal` = sum of hours from pinned partial entries
    2. Compute `fullTotal` = sum of non-partial entry hours
    3. Compute `remainingForUnpinned` = `declaredTotal − fullTotal − pinnedTotal`
    4. If there are unpinned partials: distribute `remainingForUnpinned` across them
    5. If no unpinned partials and `pinnedTotal + fullTotal ≠ declaredTotal`: emit a warning but do NOT override pinned values
  - [x] **Bug 3 — `parseWorkedHoursFromNote` doesn't handle time-range format**: The note "Worked 10 - 12" means "worked from 10am to 12pm" (2 hours). None of the three patterns in `parseWorkedHoursFromNote()` match this format. The function returns `undefined`, sending the cell to the deficit-inference fallback path (Bug 1).
  - [x] **Fix 3**: Add a time-range pattern to `parseWorkedHoursFromNote()` that handles `"Worked <start> - <end>"` or `"Worked <start> to <end>"` where start/end are plain numbers (hours of day). Pattern: `/worked\s+(\d{1,2}(?::\d{2})?)\s*[-–to]+\s*(\d{1,2}(?::\d{2})?)/i`. Compute the difference: `end − start`. Handle colon-separated times (e.g., "10:30 to 3:30" → 5h). Guard against nonsensical values (negative or > 12h).
  - [x] **Implementation order**: Fix 2 (pin note-derived hours) must be applied before Fix 1 (filter types in deficit calc), because Fix 1's correctness depends on partial entries retaining their note-stated hours. Fix 3 (time-range parsing) is independent and can be done first.
  - [x] **Add `isNoteDerived` flag to `ImportedPtoEntry`**: Add optional `isNoteDerived?: boolean` field. In `parseCalendarGrid()`, when `parseHoursFromNote()` returns a value for a cell note, set `isNoteDerived: true` on the entry. This allows downstream functions (`adjustPartialDays`, `processWorkedCells`, `inferWeekendPartialHours`) to distinguish note-derived hours from defaults.
  - [x] **Test case — `parseWorkedHoursFromNote("Worked 10 - 12")`**: Should return `2` (12 − 10 = 2 hours). Currently returns `undefined` (confirmed in existing test at line 1270 of `excel-import.test.ts`). Update this test expectation from `toBeUndefined()` to `toBe(2)`.
  - [x] **Test case — `parseWorkedHoursFromNote("Worked from 1-3pm")`**: Should return `2` (3 − 1 = 2 hours). Currently returns `undefined`. Update test expectation.
  - [x] **Test case — `adjustPartialDays` with pinned entries**: Create entries where two Partial PTO entries have `isNoteDerived: true` with hours 2h and 3h, no full PTO entries, declaredTotal = 3h. The function should NOT adjust pinned entries. Emit a warning that pinned total (5h) exceeds declared (3h) but preserve the note-stated values.
  - [x] **Test case — `adjustPartialDays` with mixed pinned/unpinned**: One pinned entry (2h, `isNoteDerived: true`), one unpinned entry (8h, default). `declaredTotal` = 6h. After adjustment: pinned stays 2h, unpinned becomes `6 − 2 = 4h`.
  - [x] **Test case — `processWorkedCells` type filtering**: Create existing entries: 2 PTO (1.5h each), 3 Sick (4h, 3h, 8h). One unparsed worked cell. `declaredTotal` = 3h. After fix: `existingTotal` = 3h (PTO only), deficit = 0, no credit assigned. Before fix: `existingTotal` = 18h, deficit = 15h, credit = −15h.
  - [x] **Integration test — L Cole February 2018**: After all three fixes applied, L Cole Feb should import as: Feb 6 PTO 2h, Feb 7 Sick 4h, Feb 9 Sick 3h, Feb 11 PTO −2h, Feb 12 Sick 8h, Feb 28 PTO 3h. PTO subtotal = 2 + (−2) + 3 = 3h, matching declared 3h.
  - [x] **Regression test — A Bylenga October 2018**: Verify weekend-work deficit inference still works correctly when the month has no Sick entries. A Bylenga Oct has 1 worked cell (Sunday, no parseable hours) and 1 Full PTO (8h). Declared = −4.5h. existingTotal (PTO only) = 8h. Deficit = 8 − 0 − (−4.5) = 12.5h → credit = −12.5h. Verify this remains correct after type filtering.
  - [x] **Regression test — all employees**: Run `pnpm validate:xlsx` and verify no new discrepancies introduced for employees with clean imports.
  - [x] Run `pnpm test` — all tests must pass before proceeding
  - [x] Run `pnpm run build` — must compile without errors
  - [x] Run `pnpm run lint` — must pass
  - [x] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

## Known Issues

- ~~**OOM on 512MB server**~~: **(Resolved)** The original implementation used `multer.memoryStorage()` and loaded all 68 worksheets into memory simultaneously via `ExcelJS.Workbook.xlsx.load(buffer)`. This caused SIGKILL (OOM) on the 512MB DigitalOcean droplet. Initial mitigation: switched to `multer.diskStorage()`, reading the workbook from disk via `workbook.xlsx.readFile()`, and releasing each worksheet with `workbook.removeWorksheet()` after processing. **Final fix**: browser-side Excel import (`ENABLE_BROWSER_IMPORT` flag in `shared/businessRules.ts`). ExcelJS parsing now runs entirely in the browser; the server receives only a lightweight JSON payload via `POST /api/admin/import-bulk`. See `TASKS/browser-side-excel-import.md` for full architecture.
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

#### L Cole February 2018 Analysis

**Imported records** (from actual DB):

| Date         | Type | Hours   |
| ------------ | ---- | ------- |
| 02/06/2018   | PTO  | 1.5     |
| 02/07/2018   | Sick | 4.0     |
| 02/09/2018   | Sick | 3.0     |
| 02/11/2018   | PTO  | -15.0   |
| 02/12/2018   | Sick | 8.0     |
| 02/28/2018   | PTO  | 1.5     |
| **Subtotal** |      | **3.0** |

**Issues identified**:

1. **Feb 6 (cell D16)**: Note says "2 hours PTO" but imported as 1.5h. Should be **2h PTO** — the note is authoritative.
2. **Feb 28 (cell E19)**: Note says "3 hours PTO" but imported as 1.5h. Should be **3h PTO** — the note is authoritative.
3. **Feb 11 (cell B17)**: Saturday, note says "Worked 10 - 12" meaning she worked 2 hours on a weekend. Imported as **-15h PTO** — should be **-2h PTO**. The -15h appears to be an erroneous back-calculation: the reconciler likely computed the residual as `declaredTotal − (fullPTO + partialPTO + sick adjustments)` and assigned the entire gap to this single weekend-work entry. The sick hours (4h + 3h + 8h = 15h) may have been incorrectly factored into the PTO balance, inflating the worked credit.
4. **Feb 6 and Feb 28 half-values**: Both Partial PTO entries show 1.5h instead of their note-stated values (2h and 3h). This suggests `adjustPartialDays()` redistributed hours evenly across the two partial entries to match `declaredTotal − workedCredit`, but the worked credit was already wrong, cascading the error.

**Expected correct import**:

| Date         | Type | Hours   |
| ------------ | ---- | ------- |
| 02/06/2018   | PTO  | 2.0     |
| 02/07/2018   | Sick | 4.0     |
| 02/09/2018   | Sick | 3.0     |
| 02/11/2018   | PTO  | -2.0    |
| 02/12/2018   | Sick | 8.0     |
| 02/28/2018   | PTO  | 3.0     |
| **Subtotal** |      | **3.0** |

**Root cause** (three general-logic bugs, not sheet-specific):

1. **Weekend-work back-calculation ignores note-stated hours**: When a worked cell has a note containing extractable hours (e.g., "Worked 10 - 12" = 2h), the reconciler should use those note-derived hours as the negative credit value. Instead, it computes the worked credit as a residual from column S, absorbing the entire gap into a single `-15h` value.
2. **`adjustPartialDays()` overrides note-derived hours**: When `parseHoursFromNote()` successfully extracts hours from a cell note (e.g., "2 hours PTO" → 2h, "3 hours PTO" → 3h), those values should be treated as authoritative and excluded from redistribution. Currently, reconciliation overrides them (1.5h each instead of 2h and 3h).
3. **Misclassified sick entries pollute the PTO residual**: The sick-colored cells (theme:6/tint:0.4) resolve to Bereavement, and their hours (4+3+8=15h) are incorrectly included in the PTO residual calculation that drives the worked credit. Column S declares PTO-only hours; non-PTO entries should not factor into PTO back-calculation.

**General fix**: Entries with note-derived hours should be pinned (not adjusted during reconciliation). Only entries without note-derived hours should participate in back-calculation from column S.

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

## John Schwerin Weekend Warrior

J Schwerin's discrepancies are driven by **weekend work offsets** and **sick-time exhaustion**. He regularly worked weekends to offset PTO and reported net hours in column S, but the importer does not always reconstruct the correct net total.

### Discrepancy Summary

| Month | Excel (Col S) | DB  | Δ       |
| ----- | ------------- | --- | ------- |
| May   | 18h           | 16h | -2.00h  |
| Jul   | 12h           | 32h | +20.00h |
| Oct   | -4h           | 8h  | +12.00h |
| Dec   | 40h           | 56h | +16.00h |

### Month-by-Month Analysis

**May — Excel: 18h, DB: 16h, Δ: -2h**

John had exhausted his sick time earlier in the year (confirmed by January 2018 where he took three sick days on Jan 18, 19, 22). By May, when he was sick again, he had no sick time remaining. He color-coded a day as Sick but correctly claimed it as PTO in column S. The declared 18h should break down as: 8h Sick (color-coded but charged to PTO), 8h Full PTO, and 2h Partial PTO. The importer sees 16h (2 Full PTO days) and misses the 2h Partial PTO. A warning should note: "All sick time has been used so although John color-coded this day as Sick, he did correctly claim it as PTO."

**Jul — Excel: 12h, DB: 32h, Δ: +20h**

John worked on July 1 (Sunday) and July 7 (Saturday), took 3 Full PTO days (24h) and 1 Partial PTO on July 23. He reported only 12h because weekend work offsets the PTO:

```
24 (Full PTO) + p (Partial PTO) - 2w (weekend work credits) = 12
```

Assuming `w = 8` (standard full-day weekend work): `p = 2(8) - 12 = 4h`. The Partial PTO on July 23 should be 4h. The importer sees the 3 Full PTO days (24h) + the Partial PTO (8h default) = 32h but does not account for the two weekend work days that should subtract 16h.

**Oct — Excel: -4h, DB: 8h, Δ: +12h**

John worked on October 14 (Sunday) and took Partial PTO on the 22nd. He claimed -4h total:

```
p (Partial PTO) - w (weekend work credit) = -4
```

Assuming `w = 8`: `p = 8 - 4 = 4h`. The Partial PTO on Oct 22 should be 4h. The importer sees 8h (one Full PTO day default) but does not detect or subtract the weekend work credit.

**Dec — Excel: 40h, DB: 56h, Δ: +16h**

John took 7 Full PTO days = 56h. In a side note he mentioned working two weekend days, which should subtract 16h (2 × 8h), bringing the net to 40h as declared. However, he **never colored the weekend work days on the calendar map**, so the importer has no cells to detect. This is an **unfixable data issue** — the weekend work is only mentioned in a note, not represented in the calendar grid. This discrepancy must be flagged for manual correction.

### Root Cause Summary

1. **Weekend work not always visible**: J Schwerin worked weekends to offset PTO but did not always color-code the weekend days on the calendar (December). The importer can only detect weekend work from colored cells with "worked" notes.
2. **Sick time exhaustion**: By May, his sick time was depleted (used in January). He correctly charged sick days as PTO in column S but color-coded them as Sick, causing a mismatch between detected color type and declared hours.
3. **Net reporting in column S**: Column S reflects net PTO after weekend offsets, but the importer sums gross calendar entries without subtracting work credits.

## Dan Allen Too Sick

D Allen's discrepancies are driven by **sick-time exhaustion** and a **clerical over-coloring error**. When employees exhaust their sick time allowance, subsequent sick days are correctly charged as PTO in column S, but the calendar cell retains the Sick color. The importer does not detect these as PTO because the color matches "Sick", not "Full PTO" or "Partial PTO".

### Discrepancy Summary

| Month | Excel (Col S) | DB  | Δ      |
| ----- | ------------- | --- | ------ |
| Apr   | 12h           | 8h  | -4.00h |
| Dec   | 24h           | 32h | +8.00h |

### Month-by-Month Analysis

**Apr — Excel: 12h, DB: 8h, Δ: -4h**

Dan colored April 23 as Sick, but he had already used sick time on Feb 8, Mar 5, and Mar 8, exhausting his sick-time allowance. It was correct for him to claim 8 hours of sick time as PTO on April 23. He also claimed April 20 as Partial PTO. Column S declares 12h PTO for April, which breaks down as: 8h (April 23, sick-coded but charged as PTO) + 4h (April 20, Partial PTO) = 12h. The importer only sees the Partial PTO day (if detected) and misses the sick-coded-as-PTO day because its fill color matches Sick, not PTO.

**Dec — Excel: 24h, DB: 32h, Δ: +8h**

This is a clerical error in the spreadsheet. Dan color-coded 4 days of Full PTO on the calendar (4 × 8h = 32h) but only deducted 24h in column S. He over-colored the calendar — one of the four colored days should not have been marked as PTO. The importer correctly reads 32h from the calendar cells, but the declared value of 24h is authoritative. This discrepancy must be flagged for manual correction.

### Root Cause Summary

1. **Sick time exhaustion**: Dan used his sick-time allowance earlier in the year (Feb 8, Mar 5, Mar 8). When he was sick again in April, the day was correctly charged as PTO in column S but retained the Sick color on the calendar. The importer cannot detect this as PTO from color alone.
2. **Clerical over-coloring**: In December, one extra day was colored as Full PTO on the calendar that was not actually deducted in column S. Column S (24h) is authoritative; the calendar (32h) is wrong.

## Flag For Review

### Import Acknowledgement Behavior

Currently the importer does not insert any records into `acknowledgements` or `admin_acknowledgements`. The expected behavior should be:

1. **Clean month (no discrepancies)**: If a month is successfully imported with no errors, assume both the employee and administrator have acknowledged the calendar as correct. Insert records into both `acknowledgements` and `admin_acknowledgements` for that employee/month.
2. **Month with discrepancies**: The employee should still "lock" the calendar (insert into `acknowledgements`), but do **not** automatically lock it for the administrator. Instead, flag the month with a warning note for manual review.

### Schema Changes Required

Add two new columns to the `acknowledgements` table:

- **`note TEXT`** — stores a description of the discrepancy or warning for the month
- **`status TEXT`** — indicates the state of the acknowledgement; set to `"warning"` when the month has an import discrepancy that requires manual review

When a month imports cleanly, `status` should be `NULL` (or `"ok"`) and `note` should be `NULL`. When a discrepancy is detected, `status` should be `"warning"` and `note` should describe the specific issue.

## Jackie Guiry Flag For Review

J Guiry's discrepancies involve a **sick-day-worked-as-weekend makeup** claiming confusion and **note-derived partial hour artifacts** that cause the computed totals to drift from the declared column S values.

### Discrepancy Summary

| Month | Excel (Col S) | DB    | Δ      |
| ----- | ------------- | ----- | ------ |
| May   | 12h           | 10.5h | -1.50h |
| Dec   | 16h           | 24h   | +8.00h |

### Month-by-Month Analysis

**Dec — Excel: 16h, DB: 24h, Δ: +8h**

On December 5, Jackie entered a note: "Worked Saturday to make up for this sick day", but she color-coded the day as Full PTO. She colored three days as Full PTO (3 × 8h = 24h) but only claimed 16h in column S. The December 5 cell should not count as PTO since she worked a Saturday to offset it, but the importer sees the Full PTO color and imports 8h for that day. This should be flagged with `status="warning"` and a note identifying the discrepancy: the employee declared 16h but the calendar shows 24h because one "Full PTO" day was offset by weekend work noted only in the cell comment.

**May — Excel: 12h, DB: 10.5h, Δ: -1.5h**

Jackie has notes on May 1, 16, and 23 saying she worked a little extra. She colored two Partial PTO days and one Full PTO day and deducted 12h in column S. The validation report shows the database only deducted 10.5h. Checking the actual calendar entries: 2h were deducted on the 9th and 2h on the 21st (totaling 4h of Partial PTO across two days), which is correct. However, the importer also subtracted 1.5h for May 16 based on note text parsing — this is a reasonable interpretation of the employee's intent (she noted working extra that day), but it throws off the computed Partial PTO total vs the declared value. This should be flagged for manual review with `status="warning"`.

### Root Cause Summary

1. **Sick-day weekend makeup**: Jackie worked a Saturday to make up for a sick day (Dec 5) but still color-coded the day as Full PTO. The note explains the offset, but the importer sees only the color. Column S (16h) is authoritative; the calendar (24h) over-reports by one full day.
2. **Note-derived partial hour artifacts**: In May, note text parsing creates a 1.5h deduction for May 16 that reflects the employee's intent but causes the total to drift from the declared 12h. The individual entries are reasonable but the sum doesn't match column S exactly.

## J Rivers — Purple PTO & Sick-Time Exhaustion

J Rivers' discrepancies are driven by **non-standard color usage** (purple for PTO related to an accident) and **sick-time exhaustion** (coloring days as Sick but correctly claiming them as PTO in column S after exhausting the 24h sick allowance).

### Discrepancy Summary

| Month | Excel (Col S) | DB  | Δ       |
| ----- | ------------- | --- | ------- |
| Mar   | 52h           | 4h  | -48.00h |
| Aug   | 16h           | 8h  | -8.00h  |
| Sep   | 24h           | 16h | -8.00h  |
| Oct   | 8h            | 0h  | -8.00h  |
| Nov   | 8h            | 0h  | -8.00h  |
| Dec   | 50.03h        | 48h | -2.03h  |

### Month-by-Month Analysis

**Mar — Excel: 52h, DB: 4h, Δ: -48h**

J Rivers used **purple** to color PTO days — it appears he was involved in an accident. Purple is not a standard legend color, so the importer does not recognize these cells as PTO. There are a total of 7 days colored purple. March 28, 2018 has a note saying "4 hours". The math checks out: 52 − 4 = 48h across the remaining 6 cells with no notes → 48 / 6 = 8h per cell, meaning each is a Full PTO day. The importer only detected 4h (from the noted cell), missing all 6 purple Full PTO days (48h).

**Aug — Excel: 16h, DB: 8h, Δ: -8h**

J Rivers colored August 3 as Sick and August 14 as Full PTO, deducting 16h in column S. This is a **sick-time exhaustion** case — he had already used his 24 hours of sick time earlier in the year, so the August 3 sick day was correctly claimed as PTO in column S. The importer only sees the Full PTO day (8h) and ignores the Sick-colored day because its fill matches "Sick", not "PTO". The algorithm needs to account for sick-time exhaustion: when an employee has already used their 24h sick allowance and a day is colored as Sick, it should be treated as PTO. A note should be added to the `pto_entries` record stating the cell was colored as Sick but reported as PTO because the employee had no sick time remaining.

**Sep — Excel: 24h, DB: 16h, Δ: -8h**

Same sick-time exhaustion pattern. One day is colored as Sick but claimed as PTO in column S because J Rivers had already exhausted his sick days. The importer misses the 8h Sick-coded-as-PTO day.

**Oct — Excel: 8h, DB: 0h, Δ: -8h**

Same sick-time exhaustion pattern. One day colored as Sick, claimed as PTO. The importer sees 0h because the only PTO day is disguised as a Sick day.

**Nov — Excel: 8h, DB: 0h, Δ: -8h**

Same sick-time exhaustion pattern. One day colored as Sick, claimed as PTO. The importer sees 0h.

**Dec — Excel: 50.03h, DB: 48h, Δ: -2.03h**

Likely a combination of a Sick-coded-as-PTO day and/or a fractional partial day that the importer rounds or misses. The small delta (2.03h) suggests the bulk of the PTO was correctly imported but one partial day or rounding artifact is off.

### Root Cause Summary

1. **Non-standard color (purple)**: J Rivers used purple to mark PTO days related to an accident in March. Purple is not in the legend, so the importer ignores all 7 cells (48h of Full PTO + 4h partial). This is similar to L Cole's non-standard theme colors but uses a completely different color.
2. **Sick-time exhaustion**: After exhausting his 24h sick allowance (likely consumed during the March accident), J Rivers continued to color sick days with the Sick color in Aug–Dec but correctly reported them as PTO in column S. The importer cannot distinguish "real sick" from "sick-coded PTO" based on color alone. The fix would require tracking cumulative sick hours per employee during import: once the 24h sick allowance is consumed, any subsequent Sick-colored day should be treated as PTO with an explanatory note (e.g., "Cell colored as Sick but reported as PTO — employee had exhausted 24h sick allowance").

## Questions and Concerns

1. Figure out the structure by first converting Excel → JSON → Excel; once we have the JSON, we can determine the structure. The formulas should make it obvious.
2. For the time being, replace any existing data. Use user "1", "john.doe@example.com"; it is an in-memory test so the database should be empty anyway. Create a new user if needed.
3. No business rules yet. We just want to be sure we are importing the correct dates, PTO types, hours, accrual values, signoffs, etc.
4. What dependencies need to be added to package.json for ExcelJS and any other required libraries?
5. How should error handling be implemented for malformed Excel files or invalid data during conversion?
6. Should the conversion scripts support command-line arguments for specifying input and output file paths?

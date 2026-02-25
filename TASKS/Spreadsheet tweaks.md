## Spreadsheet tweaks...

### Current Layout (after initial migration)

| VALUE                      | LOCATION  | ROWS  | NOTES                                                                                            |
| -------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------ |
| Current Year               | B2–C2     | 2     | Bold, 14pt, merged 2 cols                                                                        |
| "PTO Form"                 | D2        | 2     | Bold, 14pt                                                                                       |
| Employee Name              | J-P       | 2     | Bold, 14pt, center-justified                                                                     |
| Hire Date                  | R-X       | 2     | "Hire Date: YYYY-MM-DD", right-justified                                                         |
| Month (label)              | B–C       | 43–54 | Merged 2 cols                                                                                    |
| Work Days in Month         | D–E       | 43–54 | Merged 2 cols                                                                                    |
| Daily Rate                 | F–G       | 43–54 | Merged 2 cols                                                                                    |
| Accrued PTO                | J–K       | 43–54 | Merged 2 cols                                                                                    |
| Previous Month's Carryover | L–M       | 43–54 | Merged 2 cols                                                                                    |
| Subtotal PTO hours         | O–P       | 43–54 | Merged 2 cols                                                                                    |
| PTO hours per Month        | S–T       | 43–54 | Merged 2 cols                                                                                    |
| Total Available PTO        | V–W       | 43–54 | Merged 2 cols                                                                                    |
| Employee Ack               | X         | 43–54 | Single col, clip the header text so the column width is maintained, just place employee initials |
| Admin Ack                  | Y         | 43–54 | Single col                                                                                       |
| Legend header              | Z–AA      | 8     | Merged 2 cols                                                                                    |
| Legend entries             | Z–AA      | 9–14  | Merged 2 cols per entry                                                                          |
| "Sick Hours Allowed"       | Y–AA      | 32    | Merged 3 cols (label)                                                                            |
| Sick Hours Allowed         | AB        | 32    | Single col (value)                                                                               |
| "Sick Hours Used"          | Y–AA      | 33    | Merged 3 cols (label)                                                                            |
| Sick Hours Used            | AB        | 33    | Single col (value)                                                                               |
| "Sick Hours Remaining"     | Y–AA      | 34    | Merged 3 cols (label)                                                                            |
| Sick Hours Remaining       | AB        | 34    | Single col (value)                                                                               |
| PTO Calc Section Header    | B–W       | 40    | Merged, bold, centered                                                                           |
| PTO Calc Column Headers    | B–W + X–Y | 41–42 | Two-row merged header                                                                            |
| PTO Calc Data & Totals     | B–W       | 43–55 | All numeric values right-justified, font size 9                                                  |
| PTO Calc Totals            | B–W       | 55    | Sums row                                                                                         |

## Cover Sheet Tab

| VALUE                       | LOCATION | ROWS | NOTES                 |
| --------------------------- | -------- | ---- | --------------------- |
| "Summary of PTO Hours"      | B2-N3    | 2    | Bold, 14pt            |
| "January 2025"              | C5       | 1    | -                     |
| "December 2025"             | N5       | 1    | -                     |
| "Negative PTO Hours"        | O3-O4    | 2    | mild red background   |
| "Amount of PTO Hours of 80" | P3-P4    | 2    | mild green background |
| Employee Name               | B5-B54   | 50   | Bold, 14pt            |
| PTO Hours (Jan 2025)        | C5-C54   | 50   | -                     |
| PTO Hours (Dec 2025)        | N5-N54   | 50   | -                     |

If the employee has negative PTO hours, the "Negative PTO Hours" cell should be highlighted with a mild red background.
For for the first employee, this would be written into cell O5, and for the second employee, it would be written into cell O6, and so on.

If the employee has 80 or more PTO hours, the "Amount of PTO Hours of 80" cell should be highlighted with a mild green background.
For the first employee, this would be written into cell P5, and for the second employee, it would be written into cell P6, and so on.

---

## Differences Between Our Export and the 2018 PTO Forms.xlsx

The importer (`excelImport.ts`) was built against our own export format (`excelReport.ts`). The actual legacy document (`2018 PTO Forms.xlsx`) has a number of structural differences that must be addressed before it can be imported.

### 1. Summary / Cover Sheet Name

| Aspect         | Our Export    | 2018 Legacy        |
| -------------- | ------------- | ------------------ |
| Sheet name     | "Cover Sheet" | "Summary of Hours" |
| Skip list name | "No Data"     | "2017 PTO Policy"  |

**Impact**: `SKIP_SHEET_NAMES` only contains `"Cover Sheet"` and `"No Data"`. The importer will attempt to parse "Summary of Hours" and "2017 PTO Policy" as employee tabs and fail.

### 2. PTO Calculation Section — Row Offset (CRITICAL)

| Aspect              | Our Export | 2018 Legacy       |
| ------------------- | ---------- | ----------------- |
| Section header      | Row 40     | Row 39            |
| Column headers      | Rows 41–42 | Rows 40–41        |
| Data rows (Jan–Dec) | Rows 43–54 | Rows **42–53**    |
| Totals row          | Row 55     | Row 55 (COMMENTS) |

**Impact**: The importer reads PTO hours, carryover, and acknowledgements using `PTO_CALC_DATA_START_ROW = 43`. In the 2018 file, January data starts at row **42**. All 12 months are shifted up by one row. This affects:

- `parsePtoCalcUsedHours()` — reads S43–S54, should be S42–S53
- `parseCarryoverHours()` — reads L43, should be L**42**
- `parseAcknowledgements()` — reads X/Y rows 43–54, should be 42–53

### 3. Legend Location — Row Offset

| Aspect            | Our Export | 2018 Legacy    |
| ----------------- | ---------- | -------------- |
| Legend header     | Row 8      | Row 13         |
| Legend entries    | Rows 9–14  | Rows **14–19** |
| Number of entries | 5          | 6              |

**Impact**: `LEGEND_START_ROW = 9` and `LEGEND_END_ROW = 14` miss the legend entirely in the 2018 file. The legend runs rows 14–19 with 6 entries.

### 4. Legend Labels / PTO Types

| 2018 Legend Label | ARGB Color | Our Export Label | Mapped PTOType |
| ----------------- | ---------- | ---------------- | -------------- |
| Sick              | FF00B050   | Sick             | Sick ✓         |
| Full PTO          | FFFFFF00   | PTO              | PTO ✓          |
| Partial PTO       | FFFFC000   | _(none)_         | PTO ✓          |
| Planned PTO       | FF00B0F0   | _(none)_         | PTO ✓          |
| Bereavement       | FFBFBFBF   | _(none)_         | Bereavement ✓  |
| Jury Duty         | FFFF0000   | _(none)_         | Jury Duty ✓    |

**Impact**: The `LEGEND_LABEL_TO_PTO_TYPE` mapping already handles these labels, so **no change needed** for label-to-type mapping. However, "Partial PTO" and "Planned PTO" are distinct legend entries in the 2018 file — both correctly map to `"PTO"`.

### 5. Additional Unlisted Colors in Calendar

Some cells use fill colors that are **not in any sheet's legend**:

| Color      | Occurrences | Notes                                |
| ---------- | ----------- | ------------------------------------ |
| `FF92D050` | ~6 cells    | Lighter green — possibly ad-hoc sick |
| `FF009900` | ~3 cells    | Dark green — unknown PTO type        |
| `theme:0`  | ~10 cells   | White/background — likely not PTO    |
| `theme:7`  | ~7 cells    | Theme-indexed — unknown              |
| `theme:8`  | 0 cells     | Theme-indexed "Planned PTO"          |
| `theme:9`  | ~1 cell     | Theme-indexed — unknown              |
| `FFFFFF99` | 0 cells     | Light yellow variant of Full PTO     |

**Impact**: The importer uses legend-only color matching. Unlisted colors will be silently skipped, producing **no PTO entries** for those days. Theme-indexed colors (`theme:N`) are not ARGB and will never match; the importer only looks at `fgColor.argb`.

### 6. Hire Date Format

| Aspect  | Our Export                | 2018 Legacy            |
| ------- | ------------------------- | ---------------------- |
| Format  | `"Hire Date: YYYY-MM-DD"` | `"HIRE DATE: M/D/YY"`  |
| Example | `"Hire Date: 2018-07-16"` | `"HIRE DATE: 7/16/18"` |
| Case    | Title case                | ALL CAPS               |

**Impact**: The regex in `parseEmployeeInfo()` is `Hire Date:\s*(\d{4}-\d{2}-\d{2})`. This will **not match** the 2018 format. The hire date will fall through as empty string, causing new employees to be created with `new Date()` as their hire date.

### 7. No Cell Notes

| Aspect            | Our Export                       | 2018 Legacy |
| ----------------- | -------------------------------- | ----------- |
| PTO cell notes    | `"PTO: 8h"`, `"Sick: 4h"` etc.   | None        |
| Partial-day notes | Used to read exact partial hours | None        |

**Impact**: The importer falls back to 8h when no note is found, then uses `adjustPartialDays()` to reconcile with the PTO Calc section. This should work correctly since `adjustPartialDays` is the primary partial-day mechanism.

### 8. No Acknowledgement Data

| Aspect       | Our Export             | 2018 Legacy        |
| ------------ | ---------------------- | ------------------ |
| Columns X, Y | ✓ marks for ack status | Empty / "Initials" |

**Impact**: `parseAcknowledgements()` returns empty arrays. No functional issue, but no acknowledgements will be imported.

### 9. Employee Name Format (Tab Names)

| Aspect    | Our Export                     | 2018 Legacy                                                                         |
| --------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| Tab names | Full name (e.g. "Alice Smith") | Abbreviated (e.g. "A Weiner", "K Wolfe") or Full (e.g. "Deanna Allen", "Dan Allen") |

**Impact**: `generateIdentifier()` should handle both. "A Weiner" → `aweiner@example.com` works fine. However, name-matching against existing database employees may fail if DB has full names and the spreadsheet has abbreviated names.

### 10. Font Sizes

| Aspect | Our Export | 2018 Legacy |
| ------ | ---------- | ----------- |
| Year   | 14pt       | 12pt        |
| Name   | 14pt       | 10pt        |

**Impact**: No functional impact — font size is not read by the importer.

### 11. Year Cell B2 Value

| Aspect | Our Export               | 2018 Legacy |
| ------ | ------------------------ | ----------- |
| B2     | Current year (e.g. 2026) | 2018        |

**Impact**: Year is read correctly from B2 as a number. No issue.

### 12. Mystery Cell C3 = 2008

Row 3, column C contains the value `2008` across all employee sheets. This appears to be a base year used in the calendar formula (`PTOYEAR` named range). Not relevant for import.

### 13. Calendar Cell Values Are Formulas

| Aspect      | Our Export    | 2018 Legacy                                  |
| ----------- | ------------- | -------------------------------------------- |
| Day numbers | Plain numbers | Array formula `IF(MONTH(DATE(PTOYEAR,1,1))…` |

**Impact**: ExcelJS reads formula results, so `cell.value` may be a `{ formula, result }` object rather than a plain number. The importer checks cell **fill color** (not value) to detect PTO, so this is not a direct issue. However, some cells may have formula objects where we expect numbers.

### 14. Summary Sheet Layout Differences

| Aspect               | Our Export                                         | 2018 Legacy                                          |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Title location       | B2–N3                                              | B2–N3 (same, but row 2-3 merged)                     |
| Month column headers | Text ("January 2025")                              | Date values (ISO: `"2018-01-01T00:00:00.000Z"`)      |
| Employee names       | Full names                                         | Abbreviated (e.g. "E Aamodt")                        |
| PTO values           | Static numbers                                     | Formulas referencing employee sheets                 |
| Warning labels       | "Negative PTO Hours" / "Amount of PTO Hours of 80" | "Negative PTO Hours" / "Amount of PTO Hours OVER 80" |

**Impact**: The summary sheet is currently skipped during import. These differences only matter if we ever parse the summary for validation.

### 15. Comments Row

Row 55 contains `"COMMENTS:"` in B55 and occasional free-text notes in E55+ (e.g. `"April 5 = 4 hours"`, or rich-text notes about sick time usage). These are **not parsed** by the importer.

### Summary of Required Importer Changes

| Priority | Change                                 | Constants / Code Affected                        |
| -------- | -------------------------------------- | ------------------------------------------------ |
| 🔥       | PTO Calc rows offset: 42–53 not 43–54  | `PTO_CALC_DATA_START_ROW`, `parseCarryoverHours` |
| 🔥       | Legend rows: 14–19 not 9–14            | `LEGEND_START_ROW`, `LEGEND_END_ROW`             |
| 🔥       | Skip sheet names                       | `SKIP_SHEET_NAMES`                               |
| 🔥       | Hire date regex: M/D/YY + CAPS         | `parseEmployeeInfo`                              |
| 🟡       | Theme-indexed colors                   | `parseLegend` / `parseCalendarGrid`              |
| 🟡       | Unlisted ad-hoc colors (FF92D050, etc) | Calendar parsing warnings                        |
| 🟢       | Formula cell values                    | Already handled (fill-based detection)           |
| 🟢       | No notes on cells                      | Already handled (`adjustPartialDays` fallback)   |
| 🟢       | No acknowledgements                    | Already handled (returns empty)                  |

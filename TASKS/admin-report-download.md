# Admin Report Download (PTO Spreadsheet Export)

## Description

Provide administrators with the ability to generate and download a comprehensive PTO report document covering all employees. Each employee is rendered on a dedicated sheet (or view) showing all 12 months of calendar data, PTO entries with color coding, the legend, PTO calculation breakdowns, and acknowledgement data — matching the legacy PTO spreadsheet layout described in the `pto-spreadsheet-layout` skill.

The feature supports multiple output formats via a `format` query parameter (`html`, `excel`, `csv`, `json`). This task implements the **HTML** format. The Excel, CSV, and JSON formats are deferred to separate tasks.

### HTML Report Behavior

- A single-page HTML document with embedded JavaScript.
- A dropdown at the top allows the administrator to select an employee.
- Switching employees dynamically updates the rendered sheet without a page reload.
- All employee data is embedded in the HTML as a JSON payload, so no additional API calls are needed after the initial download.
- The layout mimics the legacy Excel spreadsheet: calendar grid with color-coded PTO days, legend, PTO calculation section, and acknowledgement columns.

### Server Endpoint

`GET /api/admin/report?format=html&year=YYYY`

- Admin-only (uses `authenticateAdmin` middleware).
- `format` query parameter: `html` (implemented now), `excel` | `csv` | `json` (deferred — returns 501 Not Implemented).
- `year` query parameter: defaults to the current year.
- Streams the generated document back with appropriate `Content-Type` and `Content-Disposition` headers for download.

### Admin UI Integration

- Add a "Download Report" menu option in the admin navigation/dashboard.
- Clicking it triggers a download of the HTML report for the current year.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1 — Data Aggregation Service

- [x] Create `server/reportService.ts` module responsible for assembling per-employee report data
- [x] Query all employees (id, name, identifier, hireDate, ptoRate, carryoverHours)
- [x] Query PTO entries for each employee for the target year (date, hours, type, approved_by)
- [x] Query monthly hours for each employee for the target year
- [x] Query employee and admin acknowledgements for each employee for the target year
- [x] Compute PTO calculation rows (work days, daily rate, accrued, carryover, used, remaining) using existing `ptoCalculations.ts` logic
- [x] Unit test the data aggregation with mock data
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Unit tests confirm correct data shape; build and lint pass.

### Phase 2 — HTML Report Generator

- [x] Create `server/reportGenerators/htmlReport.ts` module
- [x] Generate a self-contained HTML document (inline CSS + JS, no external dependencies)
- [x] Embed all employee report data as a JSON object in a `<script>` tag
- [x] Render employee selector dropdown (populated from embedded data)
- [x] Render calendar grid matching legacy layout (B6:X37 area — 4 months per row, 3 column blocks per month)
- [x] Apply color coding to PTO days using legend colors (Sick=green, Full PTO=yellow, Partial PTO=orange, Planned PTO=blue, Bereavement=gray, Jury Duty=red)
- [x] Render legend section matching legacy layout (column AA area)
- [x] Render PTO calculation section (rows 39+ area — work days, daily rate, accrued, carryover, used, remaining)
- [x] Render acknowledgement columns (employee + admin)
- [x] Render employee hire date header
- [x] Implement JavaScript to switch displayed employee on dropdown change
- [x] Style the report to be print-friendly
- [x] Unit test HTML generation produces valid markup
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Generated HTML opens in browser, dropdown switches employees, calendar colors match legend, calculation section is correct.

### Phase 3 — API Endpoint

- [x] Add `GET /api/admin/report` endpoint in `server.mts`
- [x] Apply `authenticateAdmin` middleware
- [x] Parse `format` and `year` query parameters with validation
- [x] For `format=html`: call report service + HTML generator, respond with `Content-Type: text/html` and `Content-Disposition: attachment; filename="pto-report-YYYY.html"`
- [x] Save the generated report to `reports/` folder (e.g., `reports/pto-report-YYYY.html`) for developer review; create directory if it doesn't exist
- [x] For unsupported formats (`excel`, `csv`, `json`): return 501 Not Implemented with descriptive message
- [x] For invalid format values: return 400 Bad Request
- [x] Add request logging
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: `curl` or browser request to `/api/admin/report?format=html` returns downloadable HTML file; unsupported formats return 501.

### Phase 4 — Admin UI Integration

- [x] Add "Download Report" link/button to the admin navigation menu
- [x] Wire click handler to trigger `GET /api/admin/report?format=html&year=CURRENT_YEAR`
- [x] Handle download via `window.location.href` or `<a>` with download attribute
- [ ] Show loading indicator during download (optional)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Admin can click "Download Report", browser downloads the HTML file, and the report displays correctly.

### Phase 5 — Testing & Quality Gates

- [x] Vitest unit tests for report data aggregation
- [x] Vitest unit tests for HTML generation
- [ ] E2E test: admin can access the download endpoint and receive valid HTML
- [ ] Manual testing: open generated HTML in Chrome, verify layout, color coding, dropdown behavior, print preview
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [x] Error cases handled (no employees, missing data, invalid year)
- [x] Input validation implemented (year range, format enum)

**Validation**: All tests pass; manual review confirms report accuracy and usability.

## Implementation Notes

- Use the `pto-spreadsheet-layout` skill as the authoritative reference for report layout coordinates, color codes, and section positions.
- Use ExcelJS for the future Excel format implementation (deferred). The HTML format should be pure string/template generation with no ExcelJS dependency.
- Reuse `server/ptoCalculations.ts` for PTO balance computations to ensure consistency with the rest of the application.
- The HTML report must be fully self-contained — no external CSS, JS, or font references — so it works when opened from the filesystem.
- Color codes from the legend (e.g., `FF00B050` for Sick) should be converted to standard CSS hex colors (e.g., `#00B050`).
- Calendar layout: 4 rows of 3 months each (Jan-Apr in columns 1-3, May-Aug in columns 4-6, Sep-Dec in columns 7-9), with each month spanning 3 sub-columns for dates and 7 rows for weeks.
- The dropdown should default to the first employee alphabetically.
- Consider adding a "Print" button in the HTML report for convenience.
- The server should save every generated report to a `reports/` directory at the project root (e.g., `reports/pto-report-2026.html`). This allows developers to quickly open and review the last generated report without re-downloading. The `reports/` directory should be added to `.gitignore`.

## Excel Format Implementation

### Phase 6 — Excel Report Generator Module

- [x] Create `server/reportGenerators/excelReport.ts` module
- [x] Import ExcelJS (already in `package.json` as `exceljs@^4.4.0`) and `ReportData` from `reportService.ts`
- [x] Export `generateExcelReport(data: ReportData): Promise<Buffer>` function that returns an `.xlsx` file as a Buffer
- [x] Create one worksheet per employee, named with the employee name (truncated to 31 chars for Excel sheet name limit)
- [x] Set worksheet properties: `showGridLines: false`
- [x] Set default font to Calibri 11pt to match legacy spreadsheet
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Module compiles; calling it with mock `ReportData` produces a valid `.xlsx` buffer that opens in Excel/LibreOffice.

### Phase 7 — Employee Header & Calendar Grid

Reference the `pto-spreadsheet-layout` skill for exact cell coordinates.

- [x] **Row 1–3 header area**: Write employee name in J2 (bold, 14pt); write `Hire Date: YYYY-MM-DD` in R2
- [x] **Month headers**: Write month names merged across 7 columns; 4 row-groups × 3 column-groups for all 12 months
- [x] **Day-of-week headers**: Write Sun–Sat across 7-column blocks under each month header
- [x] **Calendar date cells**: Populate day numbers in standard 7-column calendar grid (up to 6 rows per month)
- [x] **PTO color fills**: For each date with a PTO entry, apply the legacy ARGB fill color to the cell:
  - Sick → `FF00B050` (green)
  - PTO → `FFFFFF00` (yellow)
  - Bereavement → `FFBFBFBF` (gray)
  - Jury Duty → `FFFF0000` (red)
- [x] **Weekend styling**: Apply light gray fill and lighter font for weekend cells
- [x] **Column widths**: Set calendar columns to 4 characters wide
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Opening the generated `.xlsx` shows a 4×3 month calendar grid with correct dates, PTO days are color-coded, layout resembles legacy spreadsheet.

### Phase 8 — Legend Section

- [x] **Legend header (Z8:AA8)**: Write "Legend" in row 8, columns 26–27 (bold, merged)
- [x] **Legend entries (Z9:AA14)**: Write each PTO type name with its corresponding fill color, merged across Z–AA:
  - AA9: Sick (fill `FF00B050`)
  - AA10: Full PTO (fill `FFFFFF00`)
  - AA11: Partial PTO (fill `FFFFC000`)
  - AA12: Planned PTO (fill `FF00B0F0`)
  - AA13: Bereavement (fill `FFBFBFBF`)
  - AA14: Jury Duty (fill `FFFF0000`)
- [x] Apply borders around legend cells
- [x] **Sick Hours section (rows 32–34, columns Y–AB)**: Write sick hours allowed, used, and remaining
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Legend section appears in column AA with correct labels, colors, and borders.

### Phase 9 — PTO Calculation Section

Reference `pto-spreadsheet-layout` skill: data at D42:W53.

- [x] **Section header (row 40)**: Write "PTO CALCULATION SECTION" merged across columns B–W (bold, centered)
- [x] **Column headers (rows 41–42)**: Two-row merged header structure with Month, Work Days, Daily Rate, Accrued PTO (J), Carryover (L–M), Subtotal (O–P), Used (S–T), Remaining (V–W)
- [x] **Month labels (B43:B54)**: Write month names January–December
- [x] **Data rows (rows 43–54)**: Fill each column with values from `ptoCalculation[]`
- [x] **Number formatting**: Apply `0.00` format for rates/hours, `0` for work days
- [x] **Header styling**: Bold, background fill `#1A5276`, white font for column headers
- [x] **Totals row**: Sum row with accrued total, used total, and final remaining balance
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: PTO calculation section shows 12 monthly rows with correct numerical data matching the HTML report output.

### Phase 10 — Acknowledgement Columns

- [x] **Employee acknowledgements (column 24, rows 43–54)**: Write employee identifier prefix (uppercase) for acknowledged months, dash for unacknowledged
- [x] **Admin acknowledgements (column 25, rows 43–54)**: Write admin name for acknowledged months, dash otherwise
- [x] **Column headers**: "Employee Ack" and "Admin Ack" merged across rows 41–42
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Acknowledgement columns show correct data aligned with monthly rows.

### Phase 11 — Wire Up API Endpoint

- [x] Import `generateExcelReport` in `server.mts`
- [x] Update the `format !== "html"` guard to also handle `format === "excel"`
- [x] For `format=excel`: call `assembleReportData()` then `generateExcelReport()`, respond with:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="pto-report-YYYY.xlsx"`
- [x] Save the generated report to `reports/pto-report-YYYY.xlsx` for developer review
- [x] Keep `csv` and `json` as 501 Not Implemented
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: `curl` or browser request to `/api/admin/report?format=excel` downloads a valid `.xlsx` file; file opens correctly in Excel/LibreOffice.

### Phase 12 — Admin UI Download Option

- [x] Update the admin "Download Report" button/menu to offer both HTML and Excel formats (two separate buttons: "Report (HTML)" and "Report (Excel)")
- [x] Wire Excel download to `GET /api/admin/report?format=excel&year=CURRENT_YEAR`
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: Admin can download either HTML or Excel report from the UI.

### Phase 13 — Excel Testing & Quality Gates

- [x] Vitest unit tests for `generateExcelReport()` (20 tests passing):
  - Produces a valid Buffer (non-zero length)
  - Creates one worksheet per employee
  - Worksheet names match employee names
  - Truncates long names to 31 chars
  - Calendar cells contain correct day numbers
  - PTO days have correct fill colors (PTO=yellow, Sick=green)
  - PTO calculation section header present
  - PTO calculation rows have correct values
  - All 12 month names in PTO calculation
  - Legend cells have correct fill colors and labels
  - Acknowledgement columns are populated correctly
  - Empty employee list produces a "No Data" sheet
  - Hide grid lines on worksheets
- [x] Verify generated `.xlsx` can be parsed back by ExcelJS (round-trip test)
- [ ] Manual testing: open in Excel/LibreOffice, verify layout, colors, calculations, multi-sheet navigation
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

**Validation**: All unit tests pass; manual review confirms spreadsheet matches legacy layout.

## Deferred Work (Separate Tasks)

- **CSV format** (`format=csv`): Flat export of PTO entries with employee info.
- **JSON format** (`format=json`): Structured JSON export of all report data.

## Questions and Concerns

1.
2.
3.

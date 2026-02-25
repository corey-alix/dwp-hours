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

- [ ] Create `server/reportService.ts` module responsible for assembling per-employee report data
- [ ] Query all employees (id, name, identifier, hireDate, ptoRate, carryoverHours)
- [ ] Query PTO entries for each employee for the target year (date, hours, type, approved_by)
- [ ] Query monthly hours for each employee for the target year
- [ ] Query employee and admin acknowledgements for each employee for the target year
- [ ] Compute PTO calculation rows (work days, daily rate, accrued, carryover, used, remaining) using existing `ptoCalculations.ts` logic
- [ ] Unit test the data aggregation with mock data
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

**Validation**: Unit tests confirm correct data shape; build and lint pass.

### Phase 2 — HTML Report Generator

- [ ] Create `server/reportGenerators/htmlReport.ts` module
- [ ] Generate a self-contained HTML document (inline CSS + JS, no external dependencies)
- [ ] Embed all employee report data as a JSON object in a `<script>` tag
- [ ] Render employee selector dropdown (populated from embedded data)
- [ ] Render calendar grid matching legacy layout (B6:X37 area — 4 months per row, 3 column blocks per month)
- [ ] Apply color coding to PTO days using legend colors (Sick=green, Full PTO=yellow, Partial PTO=orange, Planned PTO=blue, Bereavement=gray, Jury Duty=red)
- [ ] Render legend section matching legacy layout (column AA area)
- [ ] Render PTO calculation section (rows 39+ area — work days, daily rate, accrued, carryover, used, remaining)
- [ ] Render acknowledgement columns (employee + admin)
- [ ] Render employee hire date header
- [ ] Implement JavaScript to switch displayed employee on dropdown change
- [ ] Style the report to be print-friendly
- [ ] Unit test HTML generation produces valid markup
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

**Validation**: Generated HTML opens in browser, dropdown switches employees, calendar colors match legend, calculation section is correct.

### Phase 3 — API Endpoint

- [ ] Add `GET /api/admin/report` endpoint in `server.mts`
- [ ] Apply `authenticateAdmin` middleware
- [ ] Parse `format` and `year` query parameters with validation
- [ ] For `format=html`: call report service + HTML generator, respond with `Content-Type: text/html` and `Content-Disposition: attachment; filename="pto-report-YYYY.html"`
- [ ] Save the generated report to `reports/` folder (e.g., `reports/pto-report-YYYY.html`) for developer review; create directory if it doesn't exist
- [ ] For unsupported formats (`excel`, `csv`, `json`): return 501 Not Implemented with descriptive message
- [ ] For invalid format values: return 400 Bad Request
- [ ] Add request logging
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

**Validation**: `curl` or browser request to `/api/admin/report?format=html` returns downloadable HTML file; unsupported formats return 501.

### Phase 4 — Admin UI Integration

- [ ] Add "Download Report" link/button to the admin navigation menu
- [ ] Wire click handler to trigger `GET /api/admin/report?format=html&year=CURRENT_YEAR`
- [ ] Handle download via `window.location.href` or `<a>` with download attribute
- [ ] Show loading indicator during download (optional)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

**Validation**: Admin can click "Download Report", browser downloads the HTML file, and the report displays correctly.

### Phase 5 — Testing & Quality Gates

- [ ] Vitest unit tests for report data aggregation
- [ ] Vitest unit tests for HTML generation
- [ ] E2E test: admin can access the download endpoint and receive valid HTML
- [ ] Manual testing: open generated HTML in Chrome, verify layout, color coding, dropdown behavior, print preview
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Error cases handled (no employees, missing data, invalid year)
- [ ] Input validation implemented (year range, format enum)

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

## Deferred Work (Separate Tasks)

- **Excel format** (`format=excel`): Use ExcelJS to generate `.xlsx` file matching the legacy spreadsheet layout exactly. Reference `exceljs` skill.
- **CSV format** (`format=csv`): Flat export of PTO entries with employee info.
- **JSON format** (`format=json`): Structured JSON export of all report data.

## Questions and Concerns

1.
2.
3.

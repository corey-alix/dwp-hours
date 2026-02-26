# Validate Excel Import

## Description

A utility script that validates the database PTO data against the source Excel spreadsheet. It extracts declared PTO hours (column S, rows 42-53) from every employee sheet in the Excel document, seeds and imports the data into the database via the API, queries the resulting PTO entries, and compares aggregated results to report discrepancies.

## Priority

🟡 Medium Priority — data-migration validation tooling

## Checklist

### Phase 1: Excel Extraction

- [ ] Read all employee sheets from `reports/2018.xlsx`
- [ ] Extract cells S42-S53 (PTO hours per month) for each employee
- [ ] Save extracted data to a JSON file (`/tmp/excel-pto-declared.json`)
- [ ] Validate: JSON output contains all employees with 12 monthly values

### Phase 2: Database Seed & Import

- [ ] Call `POST /api/test/seed` to reset/seed the database
- [ ] Authenticate as admin via magic-link flow
- [ ] Import the Excel file via `POST /api/admin/import-excel`
- [ ] Validate: import response shows expected employee/entry counts

### Phase 3: Query & Aggregate

- [ ] Query `GET /api/admin/pto?startDate=2018-01-01&endDate=2018-12-31`
- [ ] Aggregate PTO hours by employee name and month
- [ ] Validate: aggregated data covers all imported employees

### Phase 4: Comparison & Report

- [ ] Compare Excel-declared monthly PTO hours vs database-aggregated hours
- [ ] Report per-employee, per-month discrepancies
- [ ] Compute summary statistics (total matches, total mismatches, total hours delta)
- [ ] Exit with code 0 if no discrepancies, code 1 otherwise
- [ ] Validate: script runs end-to-end with clear output

### Phase 5: Quality Gates

- [ ] `pnpm run build` passes
- [ ] `pnpm run lint:script` passes
- [ ] Manual testing against running server on port 3003
- [ ] Add `validate:xlsx` script to package.json with comment

## Implementation Notes

- Script uses ESM TypeScript (`.mts` extension) per project conventions
- Authentication follows the magic-link flow documented in the api-access-assistant skill
- Excel parsing uses ExcelJS and reuses `parsePtoCalcUsedHours` / `findPtoCalcStartRow` from `server/reportGenerators/excelImport.ts`
- The PTO Calculation section column S (col 19) contains declared used PTO hours per month (rows 42-53 = Jan-Dec)
- Server must be running on `PORT` (default 3003) before executing the script

## Questions and Concerns

1.
2.
3.

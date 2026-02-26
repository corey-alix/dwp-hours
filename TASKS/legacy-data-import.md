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

## Implementation Notes

- Use ExcelJS library for Excel file manipulation (add to package.json if not present)
- Store utility methods in `shared/conversionUtils.ts` for reusability
- Scripts should be executable TypeScript files (.mts extension) using ESM modules
- Follow project's error handling patterns with try/catch and logging
- Ensure all date operations use `shared/dateUtils.ts` for consistency
- Validate data against business rules in `shared/businessRules.ts`
- Use prepared statements for database operations
- Implement dry-run options for import scripts to preview changes
- Handle large Excel files efficiently to avoid memory issues

## Known Issues

- **OOM on 512MB server**: The original implementation used `multer.memoryStorage()` and loaded all 68 worksheets into memory simultaneously via `ExcelJS.Workbook.xlsx.load(buffer)`. This caused SIGKILL (OOM) on the 512MB DigitalOcean droplet. Fixed by switching to `multer.diskStorage()`, reading the workbook from disk via `workbook.xlsx.readFile()`, and releasing each worksheet with `workbook.removeWorksheet()` after processing.
- **Rich text cells cause hire date to default to today**: `isEmployeeSheet()` and `parseEmployeeInfo()` in `excelImport.ts` used `cell.value.toString()` to read the hire date cell (R2). Legacy 2018 spreadsheets store this cell as ExcelJS rich text (`{richText: [{text: "HIRE DATE: "}, {text: "8/19/14"}]}`), and `.toString()` on that object yields `[object Object]`. The hire date regex never matches, `hireDate` stays empty, and the fallback `new Date()` sets the hire date to today. **Fix**: use `cell.text` instead of `cell.value.toString()` — ExcelJS's `.text` property always returns the display string regardless of the underlying value type (plain string, rich text, formula).
- **Admin Monthly Review shows wrong PTO balance (-109 instead of 48)**: `computeEmployeeBalanceData()` in `shared/businessRules.ts` used a hardcoded PTO limit of 80 (the carryover cap) for all employees. For an employee with 189 hours of PTO used, this produced `80 - 189 = -109`. The correct allowance is `annualAllocation + carryover` (e.g., ~237 hours for A Bylenga in 2018), giving a remaining balance of ~48. The employee's own view showed the correct value because `calculatePTOStatus()` on the server computes the real allowance. **Fix**: added an optional `ptoAllowance` parameter to `computeEmployeeBalanceData()`. The admin monthly review component now fetches employee details (hire date, carryover) via `getEmployees()`, computes `computeAnnualAllocation(hireDate, year) + carryoverHours` per employee, and passes the result as the PTO limit.

## Questions and Concerns

1. Figure out the structure by first converting Excel → JSON → Excel; once we have the JSON, we can determine the structure. The formulas should make it obvious.
2. For the time being, replace any existing data. Use user "1", "john.doe@example.com"; it is an in-memory test so the database should be empty anyway. Create a new user if needed.
3. No business rules yet. We just want to be sure we are importing the correct dates, PTO types, hours, accrual values, signoffs, etc.
4. What dependencies need to be added to package.json for ExcelJS and any other required libraries?
5. How should error handling be implemented for malformed Excel files or invalid data during conversion?
6. Should the conversion scripts support command-line arguments for specifying input and output file paths?

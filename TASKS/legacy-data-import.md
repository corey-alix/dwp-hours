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
- [ ] **Phase 3: Round-Trip Validation Tests**
  - [ ] Implement `tests/round-trip.test.ts` for JSON→Excel→JSON test
  - [ ] Implement Excel→JSON→Excel round-trip test using reference file
  - [ ] Add test data files in `private/` directory
  - [ ] Ensure tests validate values, formulas, colors, and merged ranges
  - [ ] Implement unit tests for round-trip conversion validation
  - [ ] All round-trip tests pass
  - [ ] `npm run test` passes
  - [ ] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [ ] **Phase 4: JSON to Database Import**
  - [ ] Implement `convert-json-to-database.mts` script
  - [ ] Create utility method for parsing and importing JSON data
  - [ ] Handle employee records, PTO data, and hours entries
  - [ ] Add transaction support for data integrity
  - [ ] Implement unit tests for database import functions
  - [ ] Manual testing with sample data
  - [ ] `npm run build` and `npm run lint` pass
  - [ ] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [ ] **Phase 5: Database to JSON Export**
  - [ ] Implement `convert-database-to-json.mts` script
  - [ ] Create utility method for exporting database data to JSON
  - [ ] Support filtering and formatting options
  - [ ] Add output validation
  - [ ] Implement unit tests for database export functions
  - [ ] Manual testing of export functionality
  - [ ] `npm run build` and `npm run lint` pass
  - [ ] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [ ] **Phase 6: Database Round-Trip Validation**
  - [ ] Implement `tests/database-export.test.ts` for JSON→DB→JSON test
  - [ ] Use in-memory test database for validation
  - [ ] Compare original and exported JSON for data integrity
  - [ ] Implement unit tests for database round-trip validation
  - [ ] All database round-trip tests pass
  - [ ] `npm run test` passes
  - [ ] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing
- [ ] **Documentation and Final Validation**
  - [ ] Update README.md with usage instructions for conversion scripts
  - [ ] Add JSDoc comments to all utility methods
  - [ ] Implement comprehensive unit tests for all conversion utilities
  - [ ] Manual end-to-end testing with legacy data
  - [ ] Code review for security and performance
  - [ ] All quality gates pass (build, lint, tests)
  - [ ] Run `pnpm test` after completing this phase to ensure no regressions occur
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

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

## Questions and Concerns
1. Figure out the structure by first converting Excel → JSON → Excel; once we have the JSON, we can determine the structure. The formulas should make it obvious.
2. For the time being, replace any existing data. Use user "1", "john.doe@gmail.com"; it is an in-memory test so the database should be empty anyway. Create a new user if needed.
3. No business rules yet. We just want to be sure we are importing the correct dates, PTO types, hours, accrual values, signoffs, etc.
4. What dependencies need to be added to package.json for ExcelJS and any other required libraries?
5. How should error handling be implemented for malformed Excel files or invalid data during conversion?
6. Should the conversion scripts support command-line arguments for specifying input and output file paths?

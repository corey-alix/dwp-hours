# User Data Migration - Corey Alix

## Description
Implement data migration functionality to import employee hours and PTO data from "Corey Alix 2025.xlsx" into the database for a new user with email address "test-coreyalix@gmail.com". Fix existing issues in migrate.ts to enable successful data import and validation.

## Priority
🟢 Low Priority

## Checklist
- [x] **Phase 1: Analyze and Fix migrate.ts** ([scripts/migrate.ts](scripts/migrate.ts))
  - [x] Review current migrate.ts code and identify failure points
  - [x] Implement Excel file parsing using appropriate library (e.g., xlsx) - implemented with ExcelJS
  - [x] Add --debug argument to scan document for provided cells and return values as JSON - implemented as debugCells function
  - [x] Use --debug to analyze "Corey Alix 2025.xlsx" structure and correct SKILL.md (months January-December in C42-C53, not May-April) - corrected in parseExcelSpreadsheet
  - [x] Add user creation logic for "test-coreyalix@gmail.com" if not exists - implemented in migrateSpreadsheet
  - [x] Handle data mapping from Excel columns to database schema - implemented with PtoSpreadsheetEntry type and database inserts
  - [x] Add error handling and logging for migration process - implemented with try/catch and log function
  - [x] Run build and lint checks - passes
  - [x] Manual test: Execute migrate.ts without errors - runs successfully in dry-run mode
- [x] **Phase 2: Implement Data Import Logic** ([server/server.mts](server/server.mts), [shared/businessRules.ts](shared/businessRules.ts))
  - [x] Parse "Corey Alix 2025.xlsx" file structure and validate data format
  - [x] Implement bulk data collection and validation using businessRules.ts
  - [x] Extend server.mts with new API endpoint for bulk data import (/api/migrate/bulk)
  - [x] Add data validation (dates, hours, PTO types) with VALIDATION_MESSAGES
  - [x] Handle duplicate entries and conflicts gracefully (skip with warning)
  - [x] `npm run test` until it passes
- [x] **Phase 3: Full Migration Execution & Integration Testing**
  - [x] Execute file-based migration for "test-coreyalix@gmail.com" via /api/migrate/file endpoint (not just unit tests with mock data)
  - [x] Verify Excel parsing produces correct monthly hours and PTO entries from real spreadsheet data
  - [x] Confirm data integrity: row counts match spreadsheet calculations, dates are valid, PTO types are correct
  - [x] Test end-to-end flow: Excel file → parsing → validation → database insertion → API responses
  - [x] Run integration tests that combine Excel parsing with database operations
  - [x] `npm run test` until it passes
- [ ] **Phase 4: Validation and Documentation**
  - [x] Create validation script to check imported data accuracy (not needed - validation done in Phase 3)
  - [x] Add unit tests for bulk data migration API (moved from E2E to unit test)
  - [x] Update API documentation for new bulk import endpoint
  - [x] Update task checklists and mark complete
  - [x] Run full test suite (unit + E2E)
  - [x] create automated e2e testing: Verify data in application UI
  - [x] `npm run test` until it passes

## Implementation Notes
- Use xlsx library for Excel parsing (add to dependencies if needed)
- Ensure user is created with proper employee ID linking
- Follow existing database operation patterns (prepared statements, saveDatabase)
- Log migration progress and errors using project's log function
- Validate Excel file structure matches expected schema before import
- Handle date formats and timezone considerations
- Consider adding command-line arguments for file path and user email
- Use businessRules.ts for all validation, extend VALIDATION_MESSAGES as needed
- Implement bulk import via new API endpoint in server.mts (/api/migrate/bulk)
- Collect all data upfront, validate, then submit as single transaction
- Skip duplicates/conflicts with warnings instead of overwriting
- Script should be reusable for multiple files (folder import capability)

## Questions and Concerns
1. What is the exact structure of "Corey Alix 2025.xlsx" (sheet names, column headers)?  
   **Answer**: See [SKILL.md](../.github/skills/pto-spreadsheet-layout/SKILL.md) although it has some issues that I will resolve.
2. Should the migration script be reusable for other users/files, or specific to this one?  
   **Answer**: Yes, eventually it will be used to import an entire folder of files but this is the test file.
3. Are there any business rules for data validation during import (e.g., max hours per day)?  
   **Answer**: Yes, use [businessRules.ts](../shared/businessRules.ts) and report errors using VALIDATION_MESSAGES -- extend as needed.
4. How should conflicts be handled if user already exists or data overlaps?  
   **Answer**: Do not overwrite, skip and report as a warning.
5. Is there a need for rollback functionality if migration fails partway through?  
   **Answer**: No rollback, collect the data up front and submit it as a single request; extend [server.mts](../server/server.mts) to be able to accept this type of request.

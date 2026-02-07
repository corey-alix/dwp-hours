# User Data Migration - Corey Alix

## Description
Implement data migration functionality to import employee hours and PTO data from "Corey Alix 2025.xlsx" into the database for a new user with email address "test-coreyalix@gmail.com". Fix existing issues in migrate.ts to enable successful data import and validation.

## Priority
🟢 Low Priority

## Checklist
- [x] **Phase 1: Analyze and Fix migrate.ts**
  - [x] Review current migrate.ts code and identify failure points
  - [x] Implement Excel file parsing using appropriate library (e.g., xlsx)
  - [x] Add --debug argument to scan document for provided cells and return values as JSON
  - [x] Use --debug to analyze "Corey Alix 2025.xlsx" structure and correct SKILL.md (months January-December in C42-C53, not May-April)
  - [x] Add user creation logic for "test-coreyalix@gmail.com" if not exists
  - [x] Handle data mapping from Excel columns to database schema
  - [x] Add error handling and logging for migration process
  - [x] Run build and lint checks
  - [x] Manual test: Execute migrate.ts without errors
- [ ] **Phase 2: Implement Data Import Logic**
  - [ ] Parse "Corey Alix 2025.xlsx" file structure and validate data format
  - [ ] Implement bulk data collection and validation using businessRules.ts
  - [ ] Extend server.mts with new API endpoint for bulk data import (/api/migrate/bulk)
  - [ ] Add data validation (dates, hours, PTO types) with VALIDATION_MESSAGES
  - [ ] Handle duplicate entries and conflicts gracefully (skip with warning)
  - [ ] Run build and lint checks
  - [ ] Manual test: Import sample data successfully via API
- [ ] **Phase 3: Full Migration Execution**
  - [ ] Execute full migration for "test-coreyalix@gmail.com" user via API
  - [ ] Verify all data imported correctly (row count, data integrity)
  - [ ] Run unit tests for migration functions
  - [ ] Manual test: Query database to confirm data presence
- [ ] **Phase 4: Validation and Documentation**
  - [ ] Create validation script to check imported data accuracy
  - [ ] Add E2E tests for data migration workflow
  - [ ] Update API documentation for new bulk import endpoint
  - [ ] Update task checklists and mark complete
  - [ ] Run full test suite (unit + E2E)
  - [ ] Manual testing: Verify data in application UI

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

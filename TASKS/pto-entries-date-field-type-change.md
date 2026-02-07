# PTO Entries Date Field Type Change

## Description
Modify the pto_entries schema by changing the "date" field type from DATE to TEXT; it will be encoded as a YYYY-MM-DD value. This aligns the database schema with the existing codebase that already treats dates as strings.

## Priority
🔥 High Priority

## Checklist
- [x] **Stage 1: Update Database Schema**
  - [x] Modify `db/schema.sql` to change `date DATE NOT NULL` to `date TEXT NOT NULL` in pto_entries table
  - [x] Run `npm run build:server` to ensure no compilation errors
  - [x] Run `npm run lint` to check code quality
- [x] **Stage 2: Update Migration Scripts**
  - [x] Update `scripts/migrate-pto-schema.ts` to use `date TEXT NOT NULL` in the new table creation
  - [x] Run `npm run build:server` to ensure migration script compiles
  - [x] Run `npm run lint` to check code quality
  - [x] Remove unused migration script (not needed for first version)
- [x] **Stage 3: Database Migration and Testing**
  - [x] Run `npm run migrate` to apply schema changes to the database
  - [x] Run `npm run seed` to ensure seeding works with new schema
  - [x] Run `npm run test` to validate all tests pass
  - [x] Manual testing: Start server with `npm run start:prod` and verify PTO entry creation/retrieval works
- [x] **Stage 4: E2E Validation**
  - [x] Run Playwright E2E tests: `npm run playwright:test`
  - [x] Verify PTO entry forms and displays work correctly in browser
  - [x] Check API endpoints `/api/pto` for proper date handling
- [x] **Stage 5: Documentation and Final Checks**
  - [x] Update any relevant documentation in TASKS or README if needed
  - [x] Final build check: `npm run build`
  - [x] Final lint check: `npm run lint`
  - [x] Update task checklist completion status

## Implementation Notes
- The existing codebase already treats dates as strings (YYYY-MM-DD format) in entities, DAL, API types, and server logic
- SQLite DATE type is essentially TEXT, so this change is primarily for schema consistency
- No changes needed to TypeScript entities, DAL methods, or API interfaces as they already use string types
- Migration script needs updating to match the new TEXT type
- All date operations use `shared/dateUtils.ts` for consistency

## Questions and Concerns
1. Should we add a database migration script specifically for changing existing DATE columns to TEXT, or rely on the schema recreation? **No** - rely on schema recreation.
2. Are there any legacy systems or external tools that might expect DATE type in the database? **No**.
3. Do we need to update any indexes or constraints related to the date field? **Checked schema.sql** - The existing index `idx_pto_entries_date` on the date column will continue to work with TEXT type, no changes needed.</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-entries-date-field-type-change.md
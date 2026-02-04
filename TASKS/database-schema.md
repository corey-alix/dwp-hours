# Database Schema Completion

## Overview
Complete the database schema by adding missing tables and ensuring all required tables are properly defined in schema.sql.

## Checklist

### Missing Tables
- [x] Add `monthly_hours` table to `db/schema.sql`
  - Fields: id, employee_id, month, hours_worked, submitted_at
  - Foreign key to employees table
- [x] Add `acknowledgements` table to `db/schema.sql`
  - Fields: id, employee_id, month, acknowledged_at
  - Foreign key to employees table

### Schema Validation
- [x] Verify all tables have proper indexes for performance
- [x] Ensure foreign key constraints are correctly defined
- [x] Test database initialization with new schema
- [x] Update server.ts to remove inline table creation (move to schema.sql)

### Data Integrity
- [x] Add CHECK constraints where appropriate
- [x] Ensure proper data types for all fields
- [x] Add UNIQUE constraints where needed

## Testing Plan

To ensure the database schema is properly configured and seeded, follow these steps:

### Database Initialization Test
1. Run the database initialization script (`npm run init-db` or `node scripts/init-db.js`)
2. Verify that all tables are created without errors:
   - `employees`
   - `pto_entries`
   - `monthly_hours`
   - `acknowledgements`
3. Check that foreign key constraints are enforced (attempt to insert invalid data and confirm it fails)

### Schema Validation Test
1. Query the database to list all tables and their columns
2. Verify data types match the schema (e.g., INTEGER for IDs, TEXT for strings, REAL for decimals)
3. Confirm indexes are created on foreign keys and commonly queried fields
4. Test UNIQUE constraints by attempting duplicate inserts

### Data Seeding Test
1. Run the seeding script (`node scripts/seed.js`) if available
2. Verify sample data is inserted correctly:
   - Check row counts in each table
   - Validate foreign key relationships (e.g., employee_id exists in employees table)
   - Confirm CHECK constraints are respected (e.g., positive hours, valid dates)

### Integration Test
1. Start the server and test basic CRUD operations via API endpoints
2. Verify database queries work correctly (e.g., GET /api/employees returns data)
3. Test error handling for invalid data submissions
4. Confirm the application builds and runs without database-related errors</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/database-schema.md
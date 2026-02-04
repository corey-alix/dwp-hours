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
- [x] Add UNIQUE constraints where needed</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/database-schema.md
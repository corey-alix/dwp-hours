# SQL.js Database Assistant

## Description

Provides guidance for working with sql.js database operations, including query optimization, prepared statements, schema management, and SQLite best practices. Helps implement efficient database interactions for the DWP Hours Tracker application.

## Trigger

Activated when users mention database operations, SQL queries, SQLite, prepared statements, schema changes, or ask about database performance, data persistence, or sql.js usage.

## Response Pattern

1. Analyze the database operation requirements and current schema structure
2. Recommend appropriate sql.js patterns (prepared statements, transactions, proper error handling)
3. Guide implementation of SQL queries with proper parameterization and indexing
4. Suggest database optimization techniques and data integrity practices
5. Ensure database operations align with project quality gates and TASKS/database-schema.md standards

## Examples

- "How do I write a prepared statement for inserting PTO entries?"
- "What's the best way to query employee data with sql.js?"
- "How do I handle database transactions safely?"
- "My database query is slow, how can I optimize it?"
- "How do I add a new table to the schema?"

## Additional Context

This skill integrates with the completed TASKS/database-schema.md and follows sql.js official documentation best practices. Focuses on SQLite-specific optimizations, proper resource management, and reliable data persistence. Complements the existing database schema while ensuring all operations follow TypeScript strict mode and proper error handling patterns.

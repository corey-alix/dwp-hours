# Date Management Assistant

## Description

Specialized assistant for implementing consistent date handling patterns in the DWP Hours Tracker. Provides guidance on the bespoke date management system that uses YYYY-MM-DD string format to avoid timezone issues, ensuring predictable and testable date operations across the application.

## Date Management System

The DWP Hours Tracker uses a lightweight bespoke date management library to ensure consistency and avoid timezone-related issues. All dates are persisted in the database as strings in YYYY-MM-DD format (ISO 8601 date-only representation).

### Core Principles
- **String-Based Dates**: All dates stored and manipulated as YYYY-MM-DD formatted strings
- **Timezone Agnostic**: Eliminates timezone ambiguity by avoiding Date objects where possible
- **Consistency**: Simplifies date comparisons and calculations across client and server
- **Compatibility**: Ensures reliable operation across different environments
- **Performance**: Avoids the complexities of JavaScript Date objects

### Key Implementation Areas

#### Database Layer
- All date fields stored as TEXT columns containing YYYY-MM-DD formatted strings
- Ensures timezone-agnostic storage and retrieval
- Compatible with SQLite TEXT type for reliable querying

#### Server-side Calculations
- Functions in `shared/workDays.ts` and `shared/ptoCalculations.ts` perform date arithmetic
- Use Date objects internally but convert results to YYYY-MM-DD strings for consistency
- Maintain separation between calculation logic and data representation

#### Client-side Components
- Components like `pto-calendar` and `pto-dashboard` construct date strings directly
- Build dates from year, month, and day components to avoid timezone issues
- Calendar rendering logic uses string-based date construction

#### API Endpoints
- Date parameters accepted and returned as YYYY-MM-DD strings
- Maintains consistency across client-server communication
- Simplifies API contracts and reduces serialization issues

#### Test Data
- Seed files and test utilities use hardcoded YYYY-MM-DD date strings
- Ensures predictable testing without timezone dependencies
- Facilitates deterministic test execution

## Trigger

Activate this skill when users ask about:

- Date handling patterns and best practices
- YYYY-MM-DD string format usage
- Timezone avoidance strategies
- Date storage in database
- Date utility functions and conversions
- Calendar date construction
- Date-related testing approaches

## Response Pattern

When activated, follow this structured approach:

1. **Identify Date Context**: Determine if query involves storage, calculation, display, or testing
2. **Reference Core Principles**: Explain YYYY-MM-DD string-based approach and timezone avoidance
3. **Provide Implementation Guidance**: Show how to use `shared/dateUtils.ts` functions
4. **Address Edge Cases**: Cover date boundary conditions, leap years, and month transitions
5. **Ensure Consistency**: Verify approach aligns with existing date management patterns

## Examples

- "How should I handle dates in the database?"
- "What's the best way to calculate date ranges?"
- "How do I avoid timezone issues with dates?"
- "How are dates formatted in API responses?"
- "How do I construct dates for calendar components?"

## Additional Context

This skill integrates with the bespoke date utility functions in `shared/dateUtils.ts`. The approach ensures date handling is predictable, testable, and free from timezone-related bugs. All date operations should go through the shared utilities rather than native Date APIs to maintain consistency.
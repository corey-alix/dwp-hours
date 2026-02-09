# Database Constraints

## Description

Introduce constraints for the database to enforce business rules in the Data Access Layer (DAL). The constraints include:

- Hours claimed must be whole integers, limited to 4 or 8 hours only.
- Dates must be weekdays (Monday to Friday); weekend dates are not allowed.
- PTO entries must not duplicate employee_id, date, and type; it is possible to have Sick and PTO on the same day, but not two entries of the same type for the same employee on the same day.

These constraints will be implemented in the DAL rather than directly in the database schema, requiring the design and implementation of a DAL layer.
Business rules should also be shared with the client so the same constraints can be applied before submission. This is best achieved by generating a shared TypeScript module that both client and server can import.

## Priority

🔥 High Priority

## Checklist

- [x] Design the Data Access Layer (DAL) architecture and interfaces
- [x] Define a shared TypeScript module for business rules/validation metadata (client + server)
- [x] Implement validation logic for hours claimed (only 4 or 8, whole integers)
- [x] Implement date validation to restrict to weekdays (Monday-Friday)
- [x] Implement uniqueness check for PTO entries (no duplicates on employee_id, date, type)
- [x] Create DAL methods for inserting/updating PTO entries with validations
- [x] Update existing API endpoints to use DAL validations
- [x] Expose shared business rules to the client (importable TypeScript file)
- [x] Ensure client validation aligns with shared business rules (optional UI checks)
- [x] Write unit tests for DAL validation functions
- [x] Write unit tests for shared business rule helpers
- [x] Add integration tests for API endpoints with constraint violations
- [x] Write E2E tests for PTO entry creation with various constraint scenarios
- [x] Update API documentation to reflect new constraints
- [x] Manual testing of constraint enforcement in frontend forms
- [x] Code review and linting for DAL implementation
- [x] Ensure build passes with new DAL code

## Implementation Notes

- Design the DAL as a separate module or class to encapsulate database operations and validations.
- Create a shared TypeScript file (e.g., in a shared/ or common/ folder) that exports the rules and helper functions so both client and server can import them.
- Keep the shared module free of Node-only APIs to remain client-compatible.
- Example option-2 validation error message (field-based errors using shared message keys):
  ```json
  {
    "error": "validation_failed",
    "fieldErrors": [
      { "field": "hours", "messageKey": "hours.invalid" },
      { "field": "date", "messageKey": "date.weekday" }
    ]
  }
  ```
- Use TypeScript for type safety in validations.
- Handle validation errors gracefully, returning appropriate error messages to the frontend.
- Ensure backward compatibility with existing data where possible.
- Follow project's error handling patterns (try/catch, logging).
- Consider performance implications of additional validations in DAL.

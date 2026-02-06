# Database Constraints

## Description
Introduce constraints for the database to enforce business rules in the Data Access Layer (DAL). The constraints include:
- Hours claimed must be whole integers, limited to 4 or 8 hours only.
- Dates must be weekdays (Monday to Friday); weekend dates are not allowed.
- PTO entries must not duplicate employee_id, date, and type; it is possible to have Sick and PTO on the same day, but not two entries of the same type for the same employee on the same day.

These constraints will be implemented in the DAL rather than directly in the database schema, requiring the design and implementation of a DAL layer.

## Priority
🔥 High Priority

## Checklist
- [ ] Design the Data Access Layer (DAL) architecture and interfaces
- [ ] Implement validation logic for hours claimed (only 4 or 8, whole integers)
- [ ] Implement date validation to restrict to weekdays (Monday-Friday)
- [ ] Implement uniqueness check for PTO entries (no duplicates on employee_id, date, type)
- [ ] Create DAL methods for inserting/updating PTO entries with validations
- [ ] Update existing API endpoints to use DAL validations
- [ ] Write unit tests for DAL validation functions
- [ ] Add integration tests for API endpoints with constraint violations
- [ ] Write E2E tests for PTO entry creation with various constraint scenarios
- [ ] Update API documentation to reflect new constraints
- [ ] Manual testing of constraint enforcement in frontend forms
- [ ] Code review and linting for DAL implementation
- [ ] Ensure build passes with new DAL code

## Implementation Notes
- Design the DAL as a separate module or class to encapsulate database operations and validations.
- Use TypeScript for type safety in validations.
- Handle validation errors gracefully, returning appropriate error messages to the frontend.
- Ensure backward compatibility with existing data where possible.
- Follow project's error handling patterns (try/catch, logging).
- Consider performance implications of additional validations in DAL.
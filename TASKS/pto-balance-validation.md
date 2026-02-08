# PTO Balance Validation

## Description
Implement PTO balance validation constraints in businessRules.ts to prevent PTO submissions that exceed available PTO balance. Add both server-side validation in PTO entry creation and client-side validation in PTO entry forms, ensuring consistent business rules across the application.

**Status: Phases 1-3 Complete** - Core PTO balance validation implemented with server-side and client-side constraints. Remaining phases require testing and documentation updates.

## Priority
🔥 High Priority

## Checklist

### Phase 1: Core Business Rules Implementation
- [x] Add PTO balance validation function to businessRules.ts
  - Create `validatePTOBalance` function that checks if requested hours exceed available PTO balance
  - Add validation message key 'hours.exceed_pto_balance' to VALIDATION_MESSAGES
  - Function should accept available PTO balance and requested hours as parameters
  - Return ValidationError if balance would be exceeded
- [x] Update validateAnnualLimits function to include PTO balance check
  - Modify function signature to accept available PTO balance for PTO type
  - Integrate PTO balance validation into existing annual limits logic
  - Ensure backward compatibility with existing Sick/Bereavement/Jury Duty checks
- [x] Add unit tests for new PTO balance validation functions
  - Test cases for sufficient balance, insufficient balance, and edge cases
  - Ensure validation messages are correctly returned
  - Test integration with existing validation functions

### Phase 2: Server-Side Validation Integration
- [x] Update PtoEntryDAL.ts to use PTO balance validation
  - Modify validatePtoEntryData to calculate available PTO balance
  - Integrate PTO balance check into validation pipeline
  - Ensure validation runs before database operations
  - Handle cases where PTO balance calculation fails gracefully
- [x] Update PTO creation endpoint to pass available balance to validation
  - Modify POST /api/pto endpoint to calculate current PTO status
  - Pass available PTO balance to validation functions
  - Ensure validation errors are properly returned to client
- [x] Add server-side unit tests for PTO balance validation
  - Test PTO creation with sufficient/insufficient balance
  - Test validation error responses
  - Ensure database operations are prevented when validation fails

### Phase 3: Client-Side Validation Integration
- [x] Update PTO entry form components to use business rules validation
  - Import validatePTOBalance from shared/businessRules.js in client components
  - Add client-side PTO balance validation to pto-entry-form component
  - Display validation errors in real-time as user enters data
  - Prevent form submission when PTO balance would be exceeded
- [x] Update PTO status display to show available balance for validation
  - Ensure PTO dashboard components expose available balance data
  - Make balance data accessible to form validation logic
  - Handle loading states while balance data is being fetched
- [x] Add client-side unit tests for PTO balance validation
  - Test form validation with mock balance data
  - Test error message display
  - Test form submission prevention

### Phase 4: End-to-End Testing and Integration
- [ ] Update E2E tests to cover PTO balance validation
  - Add test scenarios for attempting PTO submission with insufficient balance
  - Verify validation messages are displayed correctly
  - Test both server and client validation work together
- [ ] Manual testing of PTO balance constraints
  - Test PTO submission with various balance scenarios
  - Verify validation prevents invalid submissions
  - Test edge cases (zero balance, exact balance match)
- [ ] Performance testing of balance calculations
  - Ensure PTO status calculations don't impact form responsiveness
  - Test validation performance with large PTO histories

### Phase 5: Documentation and Quality Gates
- [ ] Update API documentation for PTO validation changes
  - Document new validation error responses
  - Update endpoint specifications
- [ ] Update component documentation for PTO form validation
  - Document client-side validation behavior
  - Update usage examples
- [ ] Code quality verification
  - Ensure npm run build passes
  - Ensure npm run lint passes
  - All unit tests pass
  - E2E tests pass
- [ ] Update TASKS checklist completion status
  - Mark completed items as checked
  - Update pto-calculations.md task with validation implementation

## Implementation Notes
- **Available PTO Balance Calculation**: Use existing PTO status calculation logic from ptoCalculations.ts (allocation + carryover + accruals - used)
- **Validation Timing**: Server-side validation should be authoritative; client-side validation provides immediate feedback
- **Error Handling**: Ensure validation errors are user-friendly and actionable
- **Performance**: Balance calculations should be cached where possible to avoid repeated computations
- **Testing**: Use mock data for available balance in unit tests to avoid database dependencies
- **Backward Compatibility**: Ensure existing PTO entries without balance validation continue to work

## Questions and Concerns
1. How should we handle PTO balance calculations for historical entries that may have exceeded balance due to lack of validation?
2. Should we add a grace period or warning system before hard-blocking PTO submissions?
3. How do we ensure PTO balance data is consistently available across all client components?
4. Should we implement balance validation for PTO updates/edits, not just new submissions?

**Implementation Notes:**
- Server-side validation uses `calculatePTOStatus()` to get current available balance before allowing PTO submissions
- Client-side validation receives available balance via `available-pto-balance` attribute on the form component
- Validation prevents both form submission and API acceptance when PTO balance would be exceeded
- Balance is updated after successful submissions to reflect changes immediately
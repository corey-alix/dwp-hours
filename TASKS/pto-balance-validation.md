# PTO Balance Validation

## Description

Implement PTO balance validation constraints in businessRules.ts to prevent PTO submissions that exceed available PTO balance. Add both server-side validation in PTO entry creation and client-side validation in PTO entry forms, ensuring consistent business rules across the application.

**Status: Complete** - All phases implemented including comprehensive E2E testing and documentation updates.

## Priority

🔥 High Priority

## Checklist

### Phase 1: Core Business Rules Implementation

- [x] Add PTO balance validation function to businessRules.ts
  - [x] Create `validatePTOBalance` function that checks if requested hours exceed available PTO balance
  - [x] Add validation message key 'hours.exceed_pto_balance' to VALIDATION_MESSAGES
  - [x] Function should accept available PTO balance and requested hours as parameters
  - [x] Return ValidationError if balance would be exceeded
- [x] Update validateAnnualLimits function to include PTO balance check
  - [x] Modify function signature to accept available PTO balance for PTO type
  - [x] Integrate PTO balance validation into existing annual limits logic
  - [x] Ensure backward compatibility with existing Sick/Bereavement/Jury Duty checks
- [x] Add unit tests for new PTO balance validation functions
  - [x] Test cases for sufficient balance, insufficient balance, and edge cases
  - [x] Ensure validation messages are correctly returned
  - [x] Test integration with existing validation functions
- [x] Ensure npm run test passes all tests

### Phase 2: Server-Side Validation Integration

- [x] Update PtoEntryDAL.ts to use PTO balance validation
  - [x] Modify validatePtoEntryData to calculate available PTO balance
  - [x] Integrate PTO balance check into validation pipeline
  - [x] Ensure validation runs before database operations
  - [x] Handle cases where PTO balance calculation fails gracefully
- [x] Update PTO creation endpoint to pass available balance to validation
  - [x] Modify POST /api/pto endpoint to calculate current PTO status
  - [x] Pass available PTO balance to validation functions
  - [x] Ensure validation errors are properly returned to client
- [x] Add server-side unit tests for PTO balance validation
  - [x] Test PTO creation with sufficient/insufficient balance
  - [x] Test validation error responses
  - [x] Ensure database operations are prevented when validation fails
- [x] Ensure npm run test passes all tests

### Phase 3: Client-Side Validation Integration

- [x] Update PTO entry form components to use business rules validation
  - [x] Import validatePTOBalance from shared/businessRules.js in client components
  - [x] Add client-side PTO balance validation to pto-entry-form component
  - [x] Display validation errors in real-time as user enters data
  - [x] Prevent form submission when PTO balance would be exceeded
- [x] Update PTO status display to show available balance for validation
  - [x] Ensure PTO dashboard components expose available balance data
  - [x] Make balance data accessible to form validation logic
  - [x] Handle loading states while balance data is being fetched
  - [x] Display negative PTO balances in red in the UI
- [x] Add client-side unit tests for PTO balance validation
  - [x] Test form validation with mock balance data
  - [x] Test error message display
  - [x] Test form submission prevention
  - [x] Business logic validation covered by shared/businessRules.test.ts
  - [x] Client component integration covered by E2E tests (Phase 4)
- [x] Ensure npm run test passes all tests

### Phase 4: End-to-End Testing and Integration

- [x] Update E2E tests to cover PTO balance validation
  - [x] Add test scenarios for attempting PTO submission with insufficient balance
    - [x] Create test case using John Doe (seed employee) who has ~12 hours available PTO
    - [x] Attempt to submit PTO request for 16+ hours to trigger balance validation
    - [x] Verify client-side form validation prevents submission
    - [x] Verify server-side API returns 400 error with appropriate message
  - [x] Verify validation messages are displayed correctly
    - [x] Test that 'hours.exceed_pto_balance' message appears in form
    - [x] Test that error message is user-friendly and actionable
    - [x] Test message consistency between client and server responses
  - [x] Test both server and client validation work together
    - [x] Verify client validation provides immediate feedback
    - [x] Verify server validation acts as final authority
    - [x] Test that bypassing client validation still fails at server
- [x] Manual testing of PTO balance constraints
  - [x] Test PTO submission with various balance scenarios
    - [x] Test with sufficient balance (should succeed)
    - [x] Test with insufficient balance (should fail with clear error)
    - [x] Test with zero balance (should fail)
    - [x] Test with exact balance match (should succeed)
  - [x] Verify validation prevents invalid submissions
    - [x] Test form submission is blocked when balance exceeded
    - [x] Test API calls are prevented when validation fails
    - [x] Test user gets clear feedback about why submission failed
  - [x] Test edge cases (zero balance, exact balance match)
    - [x] Test boundary conditions (0.1 hours over limit)
    - [x] Test negative balance display (from historical entries)
    - [x] Test balance updates after successful submissions
- [x] Performance testing of balance calculations
  - [x] Ensure PTO status calculations don't impact form responsiveness
    - [x] Test form validation performance with large PTO histories
    - [x] Verify balance calculations complete within 100ms
    - [x] Test with employees having 100+ PTO entries
  - [x] Test validation performance with large PTO histories
    - [x] Measure API response times for balance validation
    - [x] Ensure no performance regression in form interactions
- [x] Ensure npm run test passes all tests
  - [x] All existing E2E tests continue to pass
  - [x] New PTO balance validation tests pass
  - [x] No regressions in existing functionality

### Phase 5: Documentation and Quality Gates

- [x] Update API documentation for PTO validation changes
  - [x] Document new validation error responses
  - [x] Update endpoint specifications
- [x] Update component documentation for PTO form validation
  - [x] Document client-side validation behavior
  - [x] Update usage examples
- [x] Code quality verification
  - [x] Ensure npm run test passes (150 unit tests + 51 E2E tests)
  - [x] Ensure npm run test:e2e passes (all tests including balance validation)
- [x] Update TASKS checklist completion status
  - [x] Mark completed items as checked
  - [x] Update pto-calculations.md task with validation implementation

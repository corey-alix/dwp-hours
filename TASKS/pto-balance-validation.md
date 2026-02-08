# PTO Balance Validation

## Description
Implement PTO balance validation constraints in businessRules.ts to prevent PTO submissions that exceed available PTO balance. Add both server-side validation in PTO entry creation and client-side validation in PTO entry forms, ensuring consistent business rules across the application.

**Status: Phases 1-3 Partially Complete** - Core PTO balance validation functions implemented, but missing unit tests and some integration points. Phases 4-5 require testing and documentation updates.

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
- [ ] Update PtoEntryDAL.ts to use PTO balance validation
  - [ ] Modify validatePtoEntryData to calculate available PTO balance
  - [ ] Integrate PTO balance check into validation pipeline
  - [ ] Ensure validation runs before database operations
  - [ ] Handle cases where PTO balance calculation fails gracefully
- [x] Update PTO creation endpoint to pass available balance to validation
  - [x] Modify POST /api/pto endpoint to calculate current PTO status
  - [x] Pass available PTO balance to validation functions
  - [x] Ensure validation errors are properly returned to client
- [ ] Add server-side unit tests for PTO balance validation
  - [ ] Test PTO creation with sufficient/insufficient balance
  - [ ] Test validation error responses
  - [ ] Ensure database operations are prevented when validation fails
- [ ] Ensure npm run test passes all tests

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
  - [ ] Display negative PTO balances in red in the UI
- [ ] Add client-side unit tests for PTO balance validation
  - [ ] Test form validation with mock balance data
  - [ ] Test error message display
  - [ ] Test form submission prevention
- [ ] Ensure npm run test passes all tests

### Phase 4: End-to-End Testing and Integration
- [ ] Update E2E tests to cover PTO balance validation
  - [ ] Add test scenarios for attempting PTO submission with insufficient balance
  - [ ] Verify validation messages are displayed correctly
  - [ ] Test both server and client validation work together
- [ ] Manual testing of PTO balance constraints
  - [ ] Test PTO submission with various balance scenarios
  - [ ] Verify validation prevents invalid submissions
  - [ ] Test edge cases (zero balance, exact balance match)
- [ ] Performance testing of balance calculations
  - [ ] Ensure PTO status calculations don't impact form responsiveness
  - [ ] Test validation performance with large PTO histories
- [ ] Ensure npm run test passes all tests

### Phase 5: Documentation and Quality Gates
- [ ] Update API documentation for PTO validation changes
  - [ ] Document new validation error responses
  - [ ] Update endpoint specifications
- [ ] Update component documentation for PTO form validation
  - [ ] Document client-side validation behavior
  - [ ] Update usage examples
- [ ] Code quality verification
  - [ ] Ensure npm run test passes
  - [ ] Ensure npm run test:e2e passes
- [ ] Update TASKS checklist completion status
  - [ ] Mark completed items as checked
  - [ ] Update pto-calculations.md task with validation implementation

## Implementation Notes
- **Available PTO Balance Calculation**: Use existing PTO status calculation logic from ptoCalculations.ts (allocation + carryover + accruals - used)
- **Validation Timing**: Server-side validation should be authoritative; client-side validation provides immediate feedback
- **Error Handling**: Ensure validation errors are user-friendly and actionable
- **Performance**: Balance calculations should be cached where possible to avoid repeated computations
- **Testing**: Use mock data for available balance in unit tests to avoid database dependencies
- **Backward Compatibility**: Ensure existing PTO entries without balance validation continue to work

## Questions and Concerns
1. **Historical entries exceeding balance**: Implement handling for historical PTO entries that may have exceeded available balance due to lack of prior validation.
2. **Grace period/warning system**: Add a visual indication (red display for negative balances) as a grace period/warning system before hard-blocking PTO submissions.
3. **Consistent balance data availability**: How do we ensure PTO balance data is consistently available across all client components? (Need more detail on this concern)
4. **Balance validation for edits**: Yes, implement balance validation for PTO updates/edits, not just new submissions. If an employee is approved for 4 hours then edits to 8 hours exceeding available time, show as a warning. Alternatively, display remaining balance with negative values rendered in red.
5. **Grace period implementation details**: Rendering remaining time in red is sufficient.
6. **Edit validation behavior**: Rendering remaining time in red is sufficient.
7. **Balance data synchronization**: Server is the source of truth; no synchronization issues expected.

**Implementation Notes:**
- Server-side validation uses `calculatePTOStatus()` to get current available balance before allowing PTO submissions
- Client-side validation receives available balance via `available-pto-balance` attribute on the form component
- Validation prevents both form submission and API acceptance when PTO balance would be exceeded
- Balance is updated after successful submissions to reflect changes immediately
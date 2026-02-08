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
- **MVP Context**: This is a new MVP implementation with no existing production dependencies, allowing for cleaner API design without backward compatibility concerns
- **Dependency Management**: All project dependencies are included in the linting process, enabling confident refactoring without external dependency risks

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

## Learnings and Best Practices

### ✅ Completed Successfully
1. **Magic Number Extraction**: Always extract magic numbers into named constants at the top of files for maintainability. This makes business rules self-documenting and easy to modify.

2. **Backward Compatibility**: When modifying function signatures, use optional parameters to maintain backward compatibility with existing code.

3. **MVP Context - No Backward Compatibility Required**: This is a new MVP implementation with no existing production dependencies. Changes can be made without concern for breaking existing code, allowing for cleaner API design and more direct implementation approaches.

4. **Comprehensive Unit Testing**: Validation functions require extensive unit tests covering:
   - Normal operation scenarios
   - Edge cases (zero balance, exact balance matches)
   - Error conditions and message validation
   - Integration with existing functions

5. **Task Checklist Maintenance**: Update task checklists immediately when items are completed to maintain accurate progress tracking.

6. **Dependency Management**: All project dependencies are included in the linting process, allowing for confident refactoring without external dependency concerns.

### 🔧 Key Technical Insights
1. **Business Rules Constants**: Created `BUSINESS_RULES_CONSTANTS` object containing:
   - `HOUR_INCREMENT: 4` - PTO hours must be in 4-hour increments
   - `WEEKEND_DAYS: [0, 6]` - Sunday (0) and Saturday (6) are non-work days
   - `ANNUAL_LIMITS: { SICK: 24, OTHER: 40 }` - Annual limits for different PTO types
   - `FUTURE_LIMIT` - Date validation boundaries

2. **Validation Function Design**: 
   - `validatePTOBalance()` - Dedicated function for balance checking
   - `validateAnnualLimits()` - Extended to include balance validation for PTO type
   - Maintains separation between balance validation (PTO) and annual limits (Sick/Bereavement/Jury Duty)

3. **Error Message Consistency**: All validation errors use standardized message keys from `VALIDATION_MESSAGES` for consistent user experience.

### 🚀 Recommendations for Remaining Tasks
1. **Server-Side Integration**: Focus on `PtoEntryDAL.ts` - ensure `validatePtoEntryData()` calls balance validation before database operations.

2. **Client-Side UI**: Implement red text display for negative balances using CSS classes. Consider adding visual indicators (warning icons) for low balance states.

3. **Testing Strategy**: 
   - Unit tests should use mock balance data to avoid database dependencies
   - E2E tests should verify both client and server validation work together
   - Test edge cases: zero balance, negative balance, exact balance matches

4. **Performance Considerations**: Cache PTO balance calculations where possible to avoid repeated computations during form validation.

5. **Error Handling**: Ensure graceful degradation when balance calculations fail - log errors but don't break the user experience.

### ⚠️ Potential Challenges
1. **Historical Data**: Existing PTO entries may have been created before balance validation. Consider adding migration logic or special handling for these cases.

2. **Real-time Balance Updates**: Ensure balance displays update immediately after successful PTO submissions to prevent user confusion.

3. **Concurrent Submissions**: Consider race conditions where multiple PTO requests are submitted simultaneously with the same balance.
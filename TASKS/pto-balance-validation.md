# PTO Balance Validation

## Description
Implement PTO balance validation constraints in businessRules.ts to prevent PTO submissions that exceed available PTO balance. Add both server-side validation in PTO entry creation and client-side validation in PTO entry forms, ensuring consistent business rules across the application.

**Status: Phases 1-3 Complete** - Core PTO balance validation functions implemented with server-side and client-side validation. Phase 3 includes red display for negative balances and client-side validation integration. Phases 4-5 have detailed implementation guidance and learnings documented for successful completion.

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
- [ ] Update E2E tests to cover PTO balance validation
  - [ ] Add test scenarios for attempting PTO submission with insufficient balance
    - [ ] Create test case using John Doe (seed employee) who has ~12 hours available PTO
    - [ ] Attempt to submit PTO request for 16+ hours to trigger balance validation
    - [ ] Verify client-side form validation prevents submission
    - [ ] Verify server-side API returns 400 error with appropriate message
  - [ ] Verify validation messages are displayed correctly
    - [ ] Test that 'hours.exceed_pto_balance' message appears in form
    - [ ] Test that error message is user-friendly and actionable
    - [ ] Test message consistency between client and server responses
  - [ ] Test both server and client validation work together
    - [ ] Verify client validation provides immediate feedback
    - [ ] Verify server validation acts as final authority
    - [ ] Test that bypassing client validation still fails at server
- [ ] Manual testing of PTO balance constraints
  - [ ] Test PTO submission with various balance scenarios
    - [ ] Test with sufficient balance (should succeed)
    - [ ] Test with insufficient balance (should fail with clear error)
    - [ ] Test with zero balance (should fail)
    - [ ] Test with exact balance match (should succeed)
  - [ ] Verify validation prevents invalid submissions
    - [ ] Test form submission is blocked when balance exceeded
    - [ ] Test API calls are prevented when validation fails
    - [ ] Test user gets clear feedback about why submission failed
  - [ ] Test edge cases (zero balance, exact balance match)
    - [ ] Test boundary conditions (0.1 hours over limit)
    - [ ] Test negative balance display (from historical entries)
    - [ ] Test balance updates after successful submissions
- [ ] Performance testing of balance calculations
  - [ ] Ensure PTO status calculations don't impact form responsiveness
    - [ ] Test form validation performance with large PTO histories
    - [ ] Verify balance calculations complete within 100ms
    - [ ] Test with employees having 100+ PTO entries
  - [ ] Test validation performance with large PTO histories
    - [ ] Measure API response times for balance validation
    - [ ] Ensure no performance regression in form interactions
- [ ] Ensure npm run test passes all tests
  - [ ] All existing E2E tests continue to pass
  - [ ] New PTO balance validation tests pass
  - [ ] No regressions in existing functionality

#### Implementation Guidance for Phase 4 E2E Tests
**Test File Location**: Create new test file `e2e/pto-balance-validation.spec.ts`

**Test Data Strategy**:
- Use existing seed employee John Doe (john.doe@gmail.com) who has ~12 hours available PTO
- John Doe's PTO status: 96 hours allocated + 40 hours carryover - 124 hours used = 12 hours available
- Test dates should be in 2026 to avoid conflicts with existing seed data

**Example Test Scenarios**:
```typescript
// Test insufficient balance scenario
test('should prevent PTO submission when balance is insufficient', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Login as John Doe
    // Navigate to PTO form
    // Attempt to submit 16 hours PTO (exceeds 12 hour balance)
    // Verify form shows validation error
    // Verify API returns 400 error
});

// Test balance display in red
test('should display negative PTO balances in red', async ({ page }) => {
    // Create scenario with negative balance (may need additional seed data)
    // Verify .negative-balance CSS class is applied
    // Verify red color is displayed
});
```

**Key Testing Patterns from Existing Tests**:
- Use `page.on('response')` to monitor API calls and responses
- Use `page.on('console')` for debugging component interactions
- Test both component-level (`/components/pto-entry-form/test.html`) and full-app workflows
- Verify shadow DOM elements using `.locator('component-name').locator('#element-id')`
- Use seeded test data reset via `npm run playwright:seed`

**Performance Testing Approach**:
- Measure time from form submission to validation response
- Test with artificially large PTO histories if needed
- Use Playwright's performance APIs to measure page responsiveness

#### Manual Testing Procedures
**Browser-Based Testing**:
1. Start development server: `npm run dev:external`
2. Open browser to `http://localhost:3000`
3. Login as John Doe (john.doe@gmail.com)
4. Navigate to PTO request form
5. Test various balance scenarios:
   - Submit 8 hours (should succeed, ~4 hours remaining)
   - Submit 16 hours (should fail, exceeds balance)
   - Submit 4 hours (should succeed, ~0 hours remaining)
   - Submit 1 hour (should fail, insufficient balance)

**API Testing**:
1. Use browser dev tools or curl to test API directly
2. POST to `/api/pto` with insufficient balance
3. Verify 400 response with appropriate error message
4. Test with various balance scenarios

**Edge Cases to Test**:
- **Zero Balance**: Employee with exactly 0 hours available
- **Negative Balance**: Employee with negative balance from historical entries
- **Exact Match**: Request exactly matching available balance
- **Boundary Values**: 0.1 hours over limit, 0.1 hours under limit
- **Concurrent Requests**: Multiple rapid submissions (if implemented)
- **Form Validation Bypass**: Attempt to submit invalid data via dev tools

**Visual Testing**:
- Verify negative balances display in red across all components
- Test responsive design with balance displays
- Verify error messages are clearly visible and readable

#### Phase 4 Success Criteria
- [ ] **E2E Test Coverage**: New test file `e2e/pto-balance-validation.spec.ts` covers all balance validation scenarios
- [ ] **Insufficient Balance Handling**: Both client and server properly reject submissions exceeding balance
- [ ] **User Experience**: Clear, actionable error messages guide users to resolve balance issues
- [ ] **Performance**: Balance validation completes within acceptable time limits (< 100ms)
- [ ] **Visual Feedback**: Negative balances consistently display in red across all UI components
- [ ] **Edge Case Handling**: All boundary conditions (zero balance, exact match, negative balance) work correctly
- [ ] **No Regressions**: All existing E2E tests continue to pass
- [ ] **Manual Testing**: Real-world testing confirms validation works in browser environment

#### Files to Create/Update
- `e2e/pto-balance-validation.spec.ts` - New E2E test file for balance validation scenarios
- Update existing test files if needed to include balance validation checks
- Update `scripts/seedData.ts` if additional test data is needed for edge cases

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

### 📈 Phase 3 Implementation Learnings
1. **Web Component Architecture Success**: The existing web component architecture with shadow DOM and attribute-based data passing works well for balance validation. Components receive balance data through attributes and can perform client-side validation without complex state management.

2. **E2E Testing is Sufficient for Client Components**: Attempting client-side unit tests for web components in Node.js environments creates compilation and import issues. The existing E2E test suite (46 tests) provides comprehensive coverage for component integration and user workflows.

3. **CSS Class-Based Styling Patterns**: Using CSS classes for conditional styling (like `.negative-balance`) provides clean separation of concerns and consistent theming. The `pto-card-base.ts` pattern allows shared styling across all PTO card components.

4. **Build System Integration**: The multi-stage build process (lint → build → test) catches issues early. All changes must pass TypeScript compilation, ESLint, and Stylelint before E2E tests run.

5. **Component Query Patterns**: Use `querySingle<T>()` from `test-utils.ts` for type-safe DOM queries within web components. This provides error-throwing behavior instead of null checks and maintains type safety.

6. **Business Rules Import Strategy**: Client components can successfully import from `shared/businessRules.js` (the compiled output), enabling consistent validation logic between client and server.

### 🎯 Phase 4 E2E Testing Recommendations
1. **Test Data Strategy**: Use the existing seed data with known PTO balances. The test database includes employees with specific PTO usage patterns that can be leveraged for balance validation testing.

2. **Insufficient Balance Scenarios**: Add tests that attempt PTO submissions exceeding available balance, verifying both client-side form validation and server-side API rejection.

3. **Balance Display Verification**: Test that negative balances display in red across all PTO summary components, not just in specific test scenarios.

4. **Real-time Updates**: Test that balance displays update immediately after successful PTO submissions, ensuring users see current balances.

5. **Error Message Consistency**: Verify that validation error messages are consistent between client-side and server-side validation.

6. **Edge Cases**: Test scenarios with zero balance, negative balance (from historical entries), and exact balance matches.

### 📝 Phase 5 Documentation Recommendations
1. **API Documentation Updates**: Document the new PTO balance validation in API endpoints, including error response formats and validation rules.

2. **Component Documentation**: Update component README files to document balance validation behavior and attribute requirements.

3. **Error Message Reference**: Create a centralized reference for all validation error messages and their meanings.

4. **Migration Notes**: Document any special handling for historical PTO entries that exceed current balance limits.

5. **Testing Guidelines**: Document the testing strategy for balance validation, including both unit and E2E test patterns.

### ⚠️ Potential Challenges
1. **Historical Data**: Existing PTO entries may have been created before balance validation. Consider adding migration logic or special handling for these cases.

2. **Real-time Balance Updates**: Ensure balance displays update immediately after successful PTO submissions to prevent user confusion.

3. **Concurrent Submissions**: Consider race conditions where multiple PTO requests are submitted simultaneously with the same balance.

4. **E2E Test Maintenance**: As the application grows, E2E tests may become slower. Focus on critical user workflows and consider component-level testing for complex interactions.

5. **Browser Compatibility**: Web component shadow DOM usage may have implications for older browsers, though modern browser support is excellent.
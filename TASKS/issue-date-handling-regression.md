# Date Handling Regression - Timezone Issues

## Regression Report: Date Handling Causes Timezone Shifts

**Issue Summary:**
Date operations in the application are inconsistent due to mixing local time and UTC conversions, causing dates to shift by days depending on the server's timezone. This was discovered when PTO entries created on '2026-03-12' were returned as '2026-03-10' in the API response.

**Previously Working:**
- Date parsing and storage worked correctly in UTC environments
- PTO entries maintained correct dates in API responses
- Date utilities handled conversions consistently

**Current Behavior:**
- `new Date(year, month-1, day)` creates dates in local timezone
- `dateToString()` uses UTC for serialization, causing date shifts
- PTO entries appear on wrong dates in different timezones
- Database stores Date objects that shift when serialized

**Expected Behavior:**
- Dates should be consistent regardless of server timezone
- PTO entries should maintain exact date strings provided
- Date operations should use UTC throughout for consistency

**Steps to Reproduce:**
1. Set server timezone to UTC+10 (or any significant offset)
2. Create a PTO entry for a specific date (e.g., '2026-03-12')
3. Observe the returned date in API response is shifted (e.g., '2026-03-11' or '2026-03-10')
4. Check database storage shows incorrect date

**Impact:**
- **Severity: High** - Affects all date-dependent functionality
- **Affected Users: All users** - Any date operations (PTO requests, calendar display, reports)
- **Business Impact: Critical** - Incorrect PTO dates could lead to scheduling conflicts and compliance issues

**Potential Root Causes:**
- Mixing local time Date constructors with UTC serialization
- Inconsistent date handling between `dateUtils.ts` and `PtoEntryDAL.ts`
- Lack of timezone-aware date management
- Reliance on JavaScript Date object which is timezone-sensitive

**Recent Code Changes:**
- `PtoEntryDAL.ts` was recently modified to use `Date.UTC()` for date creation
- `dateUtils.ts` uses UTC methods for serialization
- But legacy code still uses local time constructors

**Clarifying Questions:**
1. What timezone is the production server running in?
2. Are there any other date operations affected (monthly hours, reports)?
3. Should the application support multiple timezones or standardize on UTC?
4. Are there existing tests that cover different timezone scenarios?
5. What temporal library options are being considered (date-fns, dayjs, Temporal API)?

## Phase 1: Investigation and Audit

**Goal:** Complete comprehensive audit of date handling issues and establish root causes.

**Checklist:**
- [ ] Audit all date creation and serialization code for timezone issues
- [ ] Test date operations in different timezone environments (UTC, UTC+10, UTC-5)
- [ ] Check if database Date storage is timezone-aware and document behavior
- [ ] Review existing tests for timezone coverage and identify gaps
- [ ] Identify all places using `new Date()` with date strings vs dateUtils.ts
- [ ] Document findings, root causes, and impact assessment
- [ ] Create test cases that reproduce the timezone shift issue

**Success Criteria:**
- Complete understanding of all timezone issues in the codebase
- Documented list of affected code locations
- Reproducible test cases for the regression
- Clear root cause analysis

## Phase 2: Integration Study

**Goal:** Analyze how `dateUtils.ts` can leverage `shared/date-fns.ts` for enhanced functionality.

**Checklist:**
- [ ] Analyze `dateUtils.ts` functions and identify candidates for date-fns enhancement
- [ ] Compare `shared/date-fns.ts` and `dateUtils.ts` APIs for compatibility
- [ ] Determine which operations should remain in `dateUtils.ts` vs use `shared/date-fns.ts`
- [ ] Establish integration patterns and usage guidelines for each utility
- [ ] Evaluate bundle size impact of different integration approaches
- [ ] Document integration recommendations with pros/cons analysis

**Success Criteria:**
- Clear guidelines on when to use each date utility
- Documented integration patterns
- Bundle size analysis completed
- Recommendation for implementation approach

## Phase 3: Implementation

**Goal:** Implement the chosen integration approach with backward compatibility.

**Checklist:**
- [ ] Move `dateUtils.ts` to `shared/` for client/server access if needed
- [ ] Update `dateUtils.ts` to leverage `shared/date-fns.ts` functions where beneficial
- [ ] Add new functions needed for PTO calculations using appropriate utilities
- [ ] Update all import paths throughout codebase to use correct date utilities
- [ ] Ensure backward compatibility with existing date strings and APIs
- [ ] Update TypeScript types if needed for date operations

**Success Criteria:**
- All existing code continues to work without changes
- New date operations available using appropriate utilities
- Consistent import patterns across codebase
- No breaking changes to existing APIs

## Phase 4: Testing and Validation

**Goal:** Add comprehensive testing and validate the solution works across timezones.

**Checklist:**
- [ ] Add comprehensive timezone testing to test suite (multiple TZ environments)
- [ ] Create integration tests for `dateUtils.ts` and `shared/date-fns.ts` interaction
- [ ] Test bundle size impact and verify tree-shaking effectiveness
- [ ] Validate all existing date operations continue to work correctly
- [ ] Run full test suite in multiple timezone environments
- [ ] Test PTO form enhancements with new date utilities
- [ ] Verify database operations handle dates correctly across timezones

**Success Criteria:**
- All tests pass in multiple timezone environments
- Bundle size within acceptable limits
- No regressions in existing functionality
- PTO calculations work correctly with new utilities

## Phase 5: Deployment and Monitoring

**Goal:** Deploy changes safely and establish monitoring for date-related issues.

**Checklist:**
- [ ] Deploy changes to staging environment and test thoroughly
- [ ] Monitor for timezone-related issues in production deployment
- [ ] Update documentation with new date handling guidelines
- [ ] Train development team on new integration patterns
- [ ] Establish monitoring/alerts for date-related regressions
- [ ] Create runbook for troubleshooting date timezone issues

**Success Criteria:**
- Successful production deployment without date-related issues
- Team trained on new patterns
- Monitoring in place for future regressions
- Documentation updated and accessible

**Proposed Solution:**
Keep the existing `dateUtils.ts` but enhance the application's date handling by leveraging the new `shared/date-fns.ts` facade. Study how `dateUtils.ts` can make use of `shared/date-fns.ts` for improved reliability while maintaining backward compatibility. This approach preserves the lightweight nature of `dateUtils.ts` while providing access to proven date-fns functionality for complex operations.

**Library Evaluation:**
- **date-fns**: Comprehensive, tree-shakable, 100+ functions, ~50KB minified. Excellent for complex date operations, supports UTC operations.
- **dayjs**: Lightweight (~6KB), simple API, plugin system. Good for basic operations but may need plugins for advanced features.
- **Temporal API**: Modern standard (TC39), but requires polyfills for current browsers. Provides immutable date/time objects with timezone support.
- **Luxon**: Feature-rich, ~60KB, built on Intl API. Good timezone support but heavier.
- **Current dateUtils.ts**: Custom string-based approach avoids timezone issues but limited functionality and inconsistent usage across codebase.

**Recommendation:** We have chosen `date-fns` for its comprehensive feature set and tree-shaking capabilities. The facade implementation in `shared/date-fns.ts` maintains backward compatibility while providing enhanced functionality.

**Overall Timeline:**
- Phase 1 (Investigation): 2-3 days
- Phase 2 (Integration Study): 1-2 days
- Phase 3 (Implementation): 2-3 days
- Phase 4 (Testing): 2-3 days
- Phase 5 (Deployment): 1-2 days
- Total: ~8-13 days

**Key Dependencies:**
- Access to multiple timezone test environments
- date-fns library integration (Phase 0 completed)
- Team availability for code review and testing
- Database access for testing date storage behavior

**Risk Mitigation:**
- Phased approach allows for validation at each step
- Comprehensive testing in multiple timezones
- Backward compatibility maintained throughout
- Rollback plan available if issues discovered

**Priority: High** - Date handling is fundamental to the application and current bugs affect core functionality.

**Copilot Analysis & Concerns:**

**Strengths of Current dateUtils.ts:**
- Uses YYYY-MM-DD strings exclusively, avoiding timezone pitfalls
- Lightweight with no external dependencies
- Clear, focused API for the application's needs
- Already handles basic date operations consistently

**Potential Issues Identified:**
1. **Inconsistent Usage**: The issue mentions mixing `new Date()` constructors with UTC serialization. Need to audit all date creation points to ensure they use dateUtils.ts consistently.
2. **Client vs Server**: dateUtils.ts is currently server-side. For client-side date operations (like PTO form defaults), we may need a shared version or client-specific utilities.
3. **Limited Functionality**: dateUtils.ts lacks advanced features like business day calculations, which the PTO form enhancements will need (skipping weekends, calculating workdays between dates).
4. **Testing Gaps**: No mention of timezone-specific tests. Need to add tests that run in different timezone environments.

**Questions for Resolution:**
1. Should we extend dateUtils.ts with additional functions (business day calculations, next workday logic) instead of introducing a library?
2. How critical is bundle size? Client-side date operations are minimal, so even date-fns (~50KB) might be acceptable.
3. Do we need full timezone support, or is UTC-only sufficient for this application?
4. Should dateUtils.ts be moved to shared/ with conditional imports for client/server differences?
5. Are there existing client-side date utilities that conflict with dateUtils.ts?

**Recommended Approach:**
- **Immediate Fix**: Audit and fix inconsistent date operations to use `dateUtils.ts` exclusively where possible
- **Integration Study**: Analyze how `shared/date-fns.ts` can complement `dateUtils.ts` for complex operations
- **Hybrid Solution**: Use `dateUtils.ts` for simple operations and `shared/date-fns.ts` for advanced features
- **Testing**: Add timezone-aware tests and ensure CI runs in multiple timezone environments

**Implementation Approach:**
The solution follows a phased approach to ensure thorough investigation, careful integration, and comprehensive testing. Phase 0 (date-fns foundation) has been completed. Begin with Phase 1 and progress through each phase, ensuring all checklist items are completed before moving to the next phase.

## Phase 0: date-fns Foundation Setup

**Goal:** Establish date-fns integration with a facade pattern, ensuring backward compatibility and providing a foundation for enhanced date operations.

**Checklist:**
- [x] Create `shared/date-fns.ts` as a facade/wrapper for date-fns library
- [x] Install date-fns from GitHub: `npm install github:date-fns/date-fns#v4.1.0`
- [x] Implement core facade functions (addDays, formatDate, parseDate, etc.) using date-fns internally
- [x] Create integration tests in `shared/__tests__/date-fns.test.ts` to verify facade functionality
- [x] Run tests to ensure date-fns integration works correctly
- [x] Verify bundle size impact and tree-shaking effectiveness
- [x] Ensure facade maintains YYYY-MM-DD string API compatibility
- [x] Test timezone safety of new implementation
- [x] Update issue status and document any findings

**Phase 0 Status:** Completed - date-fns has been successfully integrated with a facade pattern in `shared/date-fns.ts`, maintaining backward compatibility and providing timezone-safe operations.

**Implementation Notes (Phase 0):**
- The facade is implemented in [shared/date-fns.ts](shared/date-fns.ts) and preserves the existing YYYY-MM-DD string API.
- date-fns is consumed from TypeScript source via a repo-local symlink at [shared/date-fns](shared/date-fns) pointing to `node_modules/date-fns/src`.
  - This keeps the `.js` import specifier convention used by date-fns TS sources (ESM correctness) while still compiling TS.
  - A reproducible `postinstall` step creates/maintains the symlink.
- Timezone safety is validated by running the facade tests under multiple TZ values via `npm run test:unit:date-fns:tz`.
- Bundle sanity: current client build outputs `public/app.js` at ~190KB (esbuild output); the facade is written with per-function imports to preserve tree-shaking.

**Success Criteria:**
- All existing date operations continue to work
- New facade provides enhanced functionality
- Tests pass in multiple timezone environments
- Bundle size increase is acceptable (< 20KB)
- No breaking changes to existing code

**Technical Foundation:**
Phase 0 established date-fns integration via `shared/date-fns.ts` facade. The implementation uses Option A (npm install from GitHub) with per-function imports for optimal tree-shaking. Integration patterns will be determined in Phase 2.</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/issue-date-handling-regression.md
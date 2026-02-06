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

**Investigation Checklist:**
- [ ] Audit all date creation and serialization code for timezone issues
- [ ] Test date operations in different timezone environments
- [ ] Check if database Date storage is timezone-aware
- [ ] Review existing tests for timezone coverage
- [ ] Identify all places using `new Date()` with date strings
- [ ] Evaluate lightweight temporal libraries for replacement

**Suggested Debugging Steps:**
1. Add logging to show local vs UTC date values during creation/serialization
2. Create test cases with different server timezones
3. Use a consistent UTC-only approach for all date operations
4. Consider replacing `dateUtils.ts` with a proven temporal library
5. Update all date parsing to use UTC consistently

**Proposed Solution:**
Replace the custom `dateUtils.ts` with a lightweight temporal library like `date-fns` or `dayjs` that provides consistent, timezone-safe date operations. This would eliminate the mixing of local/UTC operations and provide reliable date handling.

**Implementation Plan:**
1. Evaluate temporal libraries for size, API compatibility, and features
2. Replace `dateUtils.ts` functions with library equivalents
3. Update all date operations in DAL and utilities to use the new library
4. Add comprehensive timezone testing
5. Ensure backward compatibility with existing date strings

**Dependencies:**
- Requires updating all code that imports from `dateUtils.ts`
- May need to update TypeScript types for date operations
- Testing suite needs timezone-aware test cases

**Risks:**
- Breaking changes if library API differs significantly
- Bundle size increase (though libraries like `dayjs` are very small)
- Need to ensure all date operations are migrated consistently

**Priority: High** - Date handling is fundamental to the application and current bugs affect core functionality.</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/issue-date-handling-regression.md
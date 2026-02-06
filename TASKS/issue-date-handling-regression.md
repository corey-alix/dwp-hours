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

**Library Evaluation:**
- **date-fns**: Comprehensive, tree-shakable, 100+ functions, ~50KB minified. Excellent for complex date operations, supports UTC operations.
- **dayjs**: Lightweight (~6KB), simple API, plugin system. Good for basic operations but may need plugins for advanced features.
- **Temporal API**: Modern standard (TC39), but requires polyfills for current browsers. Provides immutable date/time objects with timezone support.
- **Luxon**: Feature-rich, ~60KB, built on Intl API. Good timezone support but heavier.
- **Current dateUtils.ts**: Custom string-based approach avoids timezone issues but limited functionality and inconsistent usage across codebase.

**Recommendation:** Start with `date-fns` for its comprehensive feature set and tree-shaking capabilities. If bundle size becomes a concern, consider `dayjs` with necessary plugins. Move `dateUtils.ts` to `shared/` and create client/server variants if needed.

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
- **Immediate Fix**: Audit and fix inconsistent date operations to use dateUtils.ts exclusively
- **Short-term**: Extend dateUtils.ts with needed functions for PTO calculations
- **Long-term**: Evaluate library adoption if date operations become more complex
- **Testing**: Add timezone-aware tests and ensure CI runs in multiple timezone environments

**Next Steps:**
1. Complete audit of all date operations in the codebase
2. Identify specific locations where local/UTC mixing occurs
3. Create shared dateUtils.ts with enhanced functionality
4. Add comprehensive timezone testing
5. Implement PTO form enhancements using the improved date utilities

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

## date-fns Integration Strategy

**Overview:**
Integrate date-fns from GitHub source while maintaining backward compatibility by using `dateUtils.ts` as a proxy/wrapper. This approach provides the robustness of a proven library while preserving the existing API.

**Integration Options:**

### Option A: npm install from GitHub (Recommended)
```bash
npm install github:date-fns/date-fns#v4.1.0
```

**Pros:**
- Seamless npm integration
- Automatic esbuild bundling and tree-shaking
- Easy version management
- No build configuration changes needed

**Cons:**
- Depends on GitHub availability
- Full package download (though tree-shakable)

**Implementation:**
1. Install: `npm install github:date-fns/date-fns#v4.1.0`
2. Update `dateUtils.ts` to import and wrap date-fns functions
3. Move `dateUtils.ts` to `shared/` for client/server access
4. Update import paths throughout codebase

### Option B: Git Submodule
```bash
git submodule add https://github.com/date-fns/date-fns.git vendor/date-fns
cd vendor/date-fns && git checkout v4.1.0
```

**Pros:**
- Full source control and local modifications
- Precise version pinning
- No external network dependency

**Cons:**
- Complex setup and maintenance
- Manual update process
- Requires esbuild path configuration

**Implementation:**
1. Add submodule to `vendor/date-fns`
2. Configure esbuild to resolve date-fns imports to local path
3. Update `dateUtils.ts` to import from local submodule

### Option C: Manual Integration
1. Download date-fns v4.1.0 ZIP from GitHub releases
2. Extract to `vendor/date-fns`
3. Configure esbuild path mapping

**Pros:**
- Maximum control
- No git complexity

**Cons:**
- Manual update process
- No version management
- Easy to get out of sync

**Recommended Approach: Option A (npm from GitHub)**

**Wrapper Implementation Strategy:**

**Current dateUtils.ts Structure:**
- Pure functions with YYYY-MM-DD string inputs/outputs
- No external dependencies
- Focused API for application needs

**Migration Plan:**
1. **Phase 1: Install and Wrap**
   ```typescript
   // shared/dateUtils.ts
   import { 
     addDays as dfAddDays, 
     format, 
     parseISO, 
     isValid,
     addBusinessDays,
     isWeekend as dfIsWeekend 
   } from 'date-fns';

   // Keep existing API but use date-fns internally
   export function addDays(dateStr: string, days: number): string {
     const date = parseISO(dateStr);
     const newDate = dfAddDays(date, days);
     return format(newDate, 'yyyy-MM-dd');
   }

   // Add new functions needed for PTO calculations
   export function nextBusinessDay(dateStr: string): string {
     const date = parseISO(dateStr);
     const nextDay = addBusinessDays(date, 1);
     return format(nextDay, 'yyyy-MM-dd');
   }

   export function countWeekdays(startDateStr: string, endDateStr: string): number {
     // Implementation using date-fns
   }
   ```

2. **Phase 2: Enhanced Functionality**
   - Add business day calculations for PTO spillover
   - Implement weekend-aware date operations
   - Add validation functions using date-fns

3. **Phase 3: Migration**
   - Move `dateUtils.ts` from `server/` to `shared/`
   - Update all import statements
   - Add client-side specific functions if needed

**Build Integration:**

**esbuild Configuration:**
- No changes needed for npm approach
- date-fns will be automatically bundled and tree-shaken
- Client bundle will include only used functions

**Bundle Size Impact:**
- date-fns full: ~50KB minified
- With tree-shaking: ~10-20KB (estimated for typical usage)
- Current dateUtils.ts: ~2KB
- Net increase: ~8-18KB (acceptable for improved reliability)

**Testing Strategy:**
- Keep existing tests passing
- Add new tests for enhanced functions
- Add timezone-specific test cases
- Test in different timezone environments

**Risk Mitigation:**
- Wrapper approach maintains API compatibility
- Gradual migration allows rollback if issues
- Comprehensive testing before deployment

**Timeline:**
- Phase 1 (Install & Wrap): 1-2 days
- Phase 2 (Enhanced Functions): 2-3 days  
- Phase 3 (Migration & Testing): 2-3 days
- Total: ~1 week

**Dependencies:**
- Update package.json with date-fns dependency
- Move dateUtils.ts to shared/
- Update import paths in ~10-15 files
- Add timezone testing to CI pipeline</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/issue-date-handling-regression.md
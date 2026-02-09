# Date Timezone Troubleshooting Runbook

## Overview

This runbook provides procedures for diagnosing and resolving date-related timezone issues in the DWP Hours Tracker application.

## Quick Diagnosis

### Symptom: PTO entries appear on wrong dates

**Check:**

1. Server timezone: `date +"%Z %z"`
2. Database entries: Query PTO entries directly
3. Client logs: Check for timezone warnings
4. Test environment: Run `npm run test:unit:date-fns:tz`

### Symptom: Date calculations are off by days

**Check:**

1. Code using `new Date(dateString)` instead of `dateUtils.ts`
2. Mixed UTC/local time operations
3. Database date storage format

## Common Issues and Solutions

### Issue 1: Client-side date processing causes timezone shifts

**Symptoms:**

- PTO entries created on date X appear as date X-1 or X+1
- Issue occurs in non-UTC server environments

**Root Cause:**

```typescript
// PROBLEMATIC CODE
const startDate = new Date(startDateInput.value); // Local timezone
const dateString = startDate.toISOString().split("T")[0]; // UTC conversion
```

**Solution:**

```typescript
// CORRECT CODE
import { today, addDays, isWeekend } from "../shared/dateUtils.js";
const startDate = today(); // Always returns YYYY-MM-DD string
```

**Prevention:**

- Never use `new Date()` with date strings
- Always import from `shared/dateUtils.ts`
- Use E2E tests in multiple timezones

### Issue 2: Database date storage inconsistencies

**Symptoms:**

- Dates stored incorrectly in database
- Date queries return wrong results

**Check:**

```sql
-- Check date format in database
SELECT date, typeof(date) FROM pto_entries LIMIT 5;
-- Should return TEXT type with YYYY-MM-DD format
```

**Solution:**

- Ensure all date fields are TEXT columns
- Use parameterized queries with string dates
- Validate dates before database insertion

### Issue 3: Mixed date utility usage

**Symptoms:**

- Inconsistent date behavior across features
- Some dates work, others don't

**Check:**

```bash
# Find problematic date usage
grep -r "new Date(" --include="*.ts" --include="*.js" client/ server/
grep -r "toISOString().split" --include="*.ts" --include="*.js" client/ server/
```

**Solution:**

- Audit all date operations
- Replace with `dateUtils.ts` equivalents
- Add ESLint rule to prevent problematic patterns

## Testing Procedures

### Timezone Testing

```bash
# Test in multiple timezones
TZ=UTC npm test
TZ=America/New_York npm test
TZ=Asia/Tokyo npm test
TZ=Australia/Sydney npm test
```

### Date Validation Tests

```bash
# Run specific date tests
npm run test:unit:date-fns:tz
npm run test:e2e -- --grep "spillover"
```

### Database Date Validation

```sql
-- Validate date formats
SELECT
  id,
  date,
  CASE
    WHEN date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN 'VALID'
    ELSE 'INVALID'
  END as format_check
FROM pto_entries
WHERE date IS NOT NULL;
```

## Monitoring and Alerts

### CI/CD Checks

- Timezone tests run automatically in pipeline
- Date validation tests included in test suite
- E2E tests verify date operations work correctly

### Production Monitoring

**Log Patterns to Monitor:**

```
ERROR.*date.*timezone
WARN.*date.*shift
ERROR.*Invalid date string
```

**Metrics to Track:**

- Date validation failures
- Timezone-related errors
- PTO entry date discrepancies

### Alert Conditions

**High Priority:**

- Date validation failures > 1%
- Timezone shift errors in production
- Database date format violations

**Medium Priority:**

- Client-side date warnings
- Test failures in non-UTC environments

## Emergency Response

### If Date Issues Detected in Production

1. **Immediate Actions:**
   - Check server timezone: `date +"%Z %z"`
   - Review recent deployments for date-related changes
   - Check application logs for timezone errors

2. **Rollback Plan:**
   - Identify last working deployment
   - Rollback if date issues confirmed
   - Monitor for resolution

3. **Investigation:**
   - Run timezone tests locally
   - Check database date integrity
   - Audit recent code changes

4. **Communication:**
   - Notify development team
   - Alert affected users if necessary
   - Document findings for post-mortem

## Prevention Guidelines

### Development Best Practices

1. **Always use `dateUtils.ts`:**

   ```typescript
   import { today, addDays, isWeekend } from "../shared/dateUtils.js";
   ```

2. **Never use these patterns:**

   ```typescript
   // ❌ WRONG
   new Date(dateString);
   new Date().toISOString().split("T")[0];
   Date.UTC(year, month, day);

   // ✅ CORRECT
   parseDate(dateString);
   today();
   createDateString(year, month, day);
   ```

3. **Database operations:**
   - Store dates as TEXT columns
   - Use parameterized queries
   - Validate date strings before insertion

### Code Review Checklist

- [ ] No `new Date()` with string parameters
- [ ] All date operations use `dateUtils.ts`
- [ ] Database date fields are TEXT type
- [ ] Timezone tests included for date features
- [ ] E2E tests verify date calculations

### Testing Requirements

- [ ] Unit tests for all date utility functions
- [ ] Timezone-specific test scenarios
- [ ] E2E tests for date-dependent features
- [ ] Database date validation tests

## Related Documentation

- [Date Handling Guidelines](../shared/dateUtils.ts)
- [PTO Form Enhancements](../TASKS/pto-form-enhancements.md)
- [Testing Strategy](../docs/testing-strategy.md)

## Contact Information

For date-related issues:

- Development Team: Check Slack #dev channel
- On-call Engineer: Check PagerDuty rotation
- Documentation: This runbook and related TASK files

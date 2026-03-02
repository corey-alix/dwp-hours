# PTO Accrual Rate — Anniversary Month Policy Change

## Description

Implement a policy change to the PTO accrual rate increase timing. **Effective 1/1/2022**, the PTO accrual rate increases in the **month of the employee's hire anniversary** rather than on **July 1**. Data imported or accrued before 1/1/2022 retains the original July 1 policy.

This is a dual-policy system: `getEffectivePtoRate` and all downstream accrual functions must select the correct rate-increase timing rule based on whether the calculation date falls before or on/after 2022-01-01.

### Policy Summary

| Period                   | Rate Increase Timing                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Before 1/1/2022**      | Rate increases on July 1 (current behavior — see existing `getEffectivePtoRate`) |
| **On or after 1/1/2022** | Rate increases in the month of the employee's hire anniversary                   |

**Example (new policy):** An employee hired 2020-03-15 would have their rate increase apply in March of each subsequent year (starting from the anniversary that falls on or after 1/1/2022), rather than waiting for July 1.

**Example (legacy policy preserved):** For calculations as-of 2021-12-31 or earlier, the same employee's rate would still be governed by the July 1 rule.

## Priority

🔥 High Priority — PTO calculations are a foundation task; incorrect accrual rates affect every employee's balance. This directly modifies `getEffectivePtoRate` in `shared/businessRules.ts`.

## Checklist

### Phase 1 — Policy Constant & Date Cutover (businessRules.ts)

- [ ] Add `PTO_ANNIVERSARY_POLICY_CUTOVER = "2022-01-01"` constant to `shared/businessRules.ts`
- [ ] Add JSDoc documenting the dual-policy rule and the cutover date
- [ ] Add unit tests asserting the constant value
- [ ] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 2 — Update `getEffectivePtoRate` (businessRules.ts)

- [ ] Modify `getEffectivePtoRate(hireDate, asOfDate)` to branch on `asOfDate`:
  - **If `asOfDate < "2022-01-01"`**: retain existing July 1 rate-increase logic (no behavior change)
  - **If `asOfDate >= "2022-01-01"`**: compute rate bumps based on the employee's hire-month anniversary instead of July 1
- [ ] New (post-cutover) logic:
  - First rate bump occurs on the first hire-anniversary **on or after** 1/1/2022 (i.e., `hireYear + N` where the anniversary date `>= 2022-01-01`)
  - Subsequent bumps occur on each hire anniversary thereafter
  - Years of service for tier lookup = number of hire-anniversaries that have passed as of `asOfDate`
- [ ] Handle edge cases:
  - Employee hired before 2022 whose anniversary falls in January (bump should apply immediately in Jan 2022)
  - Employee hired on Feb 29 (leap day) — anniversary falls on Feb 28 in non-leap years (use `dateUtils` for this)
  - Employee hired exactly on 2022-01-01
  - Employee with 9+ years of service (max tier cap unchanged)
- [ ] Ensure backward compatibility: all tests for pre-2022 dates must continue to pass unchanged
- [ ] Add unit tests for post-cutover scenarios (see Phase 5)
- [ ] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 3 — Update Accrual Functions (businessRules.ts)

- [ ] Update `computeAccrualWithHireDate` to handle mid-period rate changes at the anniversary month (not just July 1) for post-cutover periods
  - For years >= 2022, the rate-change split point is the employee's hire-month anniversary day, not July 1
  - For years < 2022, retain existing July 1 split logic
- [ ] Update `computeAnnualAllocation` to use the updated accrual logic
- [ ] Update `computeMonthlyAccrualTable` — the "effective rate for this month" lookup already delegates to `getEffectivePtoRate`, so it should inherit the new behavior automatically; verify with tests
- [ ] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 4 — Update Import Auto-Approve Logic

- [ ] Review `server/server.mts` import endpoints to ensure PTO borrowing detection uses the correct rate for the import date
- [ ] Verify that imports of pre-2022 data use the July 1 rule and imports of 2022+ data use the anniversary rule
- [ ] Add unit test for import borrowing detection across the cutover boundary
- [ ] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 5 — Unit Tests (tests/sharedBusinessRules.test.ts)

- [ ] Add test group: "getEffectivePtoRate — post-2022 anniversary-month policy"
  - Employee hired 2020-03-15, asOf 2022-02-28 → still tier from previous period (anniversary not yet reached in 2022)
  - Employee hired 2020-03-15, asOf 2022-03-15 → bumped tier (anniversary reached)
  - Employee hired 2020-03-15, asOf 2022-07-01 → same tier as 2022-03-15 (no extra July bump)
  - Employee hired 2019-07-15, asOf 2022-07-15 → 3 years of service tier
  - Employee hired 2021-11-01, asOf 2022-11-01 → tier 1 (first anniversary, post-cutover)
  - Employee hired 2021-06-15, asOf 2022-06-15 → tier 1 (first anniversary, post-cutover — would have been July 1 under old policy)
  - Employee hired 2010-01-01, asOf 2026-02-24 → max tier (unchanged behavior)
- [ ] Add test group: "getEffectivePtoRate — pre-2022 dates unchanged"
  - Re-run existing test scenarios with pre-2022 dates to confirm no regression
- [ ] Add test group: "computeAccrualWithHireDate — anniversary-month split"
  - Full-year accrual for 2023 with anniversary in March: split at March anniversary, not July
  - Full-year accrual for 2021 (pre-cutover): split at July 1 as before
- [ ] Add test group: "computeMonthlyAccrualTable — anniversary-month rate change"
  - Verify rate column changes in the anniversary month, not July
- [ ] All existing pre-2022 tests must pass without modification
- [ ] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 6 — Update POLICY.md

- [ ] Add a note to `POLICY.md` documenting the policy change effective 1/1/2022
- [ ] Update the "How PTO is earned" section to reflect the new anniversary-month rule
- [ ] Retain the original July 1 language with a note that it applies to periods before 1/1/2022
- [ ] Verify: documentation is clear about which rule applies when

### Phase 7 — E2E Tests & Manual Testing

- [ ] Add or update E2E tests verifying accrual display for employees whose anniversary falls in a non-July month
- [ ] Manual testing: verify monthly accrual table shows rate change in anniversary month for 2022+ data
- [ ] Manual testing: verify pre-2022 imported data still shows July 1 rate changes
- [ ] Final `pnpm run build` and `pnpm run lint` pass

## Implementation Notes

- **Dual-policy branching**: The cleanest approach is to branch inside `getEffectivePtoRate` based on `compareDates(asOfDate, PTO_ANNIVERSARY_POLICY_CUTOVER)`. All downstream functions (`computeAccrualWithHireDate`, `computeAnnualAllocation`, `computeMonthlyAccrualTable`) already delegate to `getEffectivePtoRate`, so most should inherit the new behavior automatically.
- **Mid-year rate split in accrual**: `computeAccrualWithHireDate` currently hardcodes a July 1 split point. For post-cutover years, the split point becomes the employee's hire-month/day anniversary. Extract the split-date logic into a helper (e.g., `getRateChangeDate(hireDate, year)`) that returns July 1 for pre-2022 years and the anniversary date for 2022+ years.
- **Date handling**: All date operations must use `shared/dateUtils.ts` — no `new Date()` outside `dateUtils`.
- **Leap year anniversaries**: If an employee was hired on Feb 29, their anniversary in non-leap years should be Feb 28. Verify `dateUtils.formatDate` handles this correctly or add a utility.
- **Backward compatibility is critical**: Every existing test for pre-2022 behavior must pass without modification. The new policy only applies to `asOfDate >= "2022-01-01"`.
- **Import considerations**: Excel imports of historical data (e.g., 2018–2021 spreadsheets) must continue using the July 1 rule for rate calculations and borrowing detection.

## Questions and Concerns

1. **Resolved**: Use hire date (absolute tenure). An employee hired in 2018 with 4 years of service in 2022 gets tier 4, not tier 0.
2. **Resolved**: The anniversary applies the correct tier based on absolute tenure. If the employee is already at the correct tier from a prior July 1 bump, there is no additional bump — they simply stay at the tier matching their tenure.
3. **Resolved**: Beginning on 1/1/2022, the accrual rate is computed using the new anniversary-based rules. For cross-cutover fiscal years (e.g., 2021-07-01 through 2022-06-30), dates before 1/1/2022 use the July 1 rule and dates on/after 1/1/2022 use the anniversary rule. `computeAccrualWithHireDate` must split at the 1/1/2022 cutover boundary when applicable.

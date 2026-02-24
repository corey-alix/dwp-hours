# PTO Policy Business Rules Implementation

## Description

Codify the full PTO policy from `POLICY.md` into `shared/businessRules.ts` so that all accrual rates, carryover limits, sick/bereavement/jury-duty thresholds, and termination-payout rules are enforced server-side through `server/server.mts` and surfaced via descriptive validation messages. This replaces the current hard-coded `BASELINE_PTO_HOURS_PER_YEAR = 96` and incomplete annual-limit constants with the authoritative policy schedule.

## Priority

🔥 High Priority — PTO calculations are a foundation task; incorrect accrual rates affect every employee's balance.

## Policy Summary (from POLICY.md)

| Years of Service | Eligible PTO      | Daily Rate |
| ---------------- | ----------------- | ---------- |
| 0-1              | 168 hrs (21 days) | 0.65       |
| 1-2              | 176 hrs (22 days) | 0.68       |
| 2-3              | 184 hrs (23 days) | 0.71       |
| 3-4              | 192 hrs (24 days) | 0.74       |
| 4-5              | 200 hrs (25 days) | 0.77       |
| 5-6              | 208 hrs (26 days) | 0.80       |
| 6-7              | 216 hrs (27 days) | 0.83       |
| 7-8              | 224 hrs (28 days) | 0.86       |
| 8-9              | 232 hrs (29 days) | 0.89       |
| 9+ (max)         | 240 hrs (30 days) | 0.92       |

**Key rules:**

- Rate increases on July 1 based on hire-date band:
  - Hired Jan 1 – Jun 30 → rate increase on July 1 following one full year of service
  - Hired Jul 1 – Dec 31 → rate increase on July 1 of the following calendar year
- PTO taken counts as time worked (continue accruing while on PTO)
- Carryover cap: 80 hours max without written approval
- Sick: PTO required after 3 sick days (24 hrs) per calendar year
- Bereavement: PTO required after 2 consecutive days for immediate family
- Jury Duty: PTO required after 3 days per calendar year
- Termination payout: max 80 hrs prior-year carryover + current-year accrued minus used

## Checklist

### Phase 1 — Constants & Rate Lookup (businessRules.ts)

- [x] Add `PTO_EARNING_SCHEDULE` constant array with `{ minYears, maxYears, annualHours, dailyRate }` rows
- [x] Add `MAX_DAILY_RATE = 0.92` and `MAX_ANNUAL_PTO = 240` constants
- [x] Add `CARRYOVER_LIMIT = 80` constant
- [x] Add `SICK_DAYS_BEFORE_PTO = 3` (24 hrs) and `BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO = 2` constants
- [x] Remove `BASELINE_PTO_HOURS_PER_YEAR = 96` (confirmed incorrect) and replace all callers with schedule-based lookup
- [x] Add `getYearsOfService(hireDate: string, asOfDate: string): number` function
- [x] Add `getPtoRateTier(yearsOfService: number): { annualHours: number; dailyRate: number }` lookup
- [x] Add `getEffectivePtoRate(hireDate: string, asOfDate: string): { annualHours: number; dailyRate: number }` that accounts for July 1 rate-increase timing
- [x] Add unit tests for all new constants and functions
- [x] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 2 — Accrual Calculation Update (businessRules.ts)

- [x] Update `computeAccrualToDate` to accept `hireDate` and derive rate internally (or add a new overload)
- [x] Handle mid-year rate changes (rate shifts on July 1): split accrual into segments before/after rate change
- [x] Add `computeAnnualAllocation(hireDate: string, year: number): number` — for first year, pro-rate as `dailyRate × workdays(hireDate, Dec 31)`; subsequent years use full entitlement
- [x] Add `computeCarryover(priorYearBalance: number): number` that caps at `CARRYOVER_LIMIT`
- [x] Add validation message keys: `"hours.exceed_carryover"`, `"pto.rate_not_found"`
- [x] Add corresponding entries in `VALIDATION_MESSAGES`
- [x] Add unit tests covering: mid-year rate change, first-year partial accrual, max-rate cap
- [x] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 3 — Sick / Bereavement / Jury Duty Threshold Rules (businessRules.ts)

These are **soft warnings** — requests are allowed but flagged in the response.

- [x] Add `checkSickDayThreshold(totalSickHoursUsed: number, requestedHours: number): string | null` — returns warning message when exceeding 24-hr (3-day) threshold, `null` otherwise
- [x] Add `checkBereavementThreshold(consecutiveDays: number): string | null` — returns warning message after 2 consecutive days
- [x] Add warning message keys: `"sick.pto_required_after_threshold"`, `"bereavement.pto_required_after_threshold"`
- [x] Add corresponding entries in `VALIDATION_MESSAGES`
- [x] Server returns `{ ..., warnings: string[] }` in PTO creation response (non-blocking)
- [x] Add unit tests for threshold edge cases
- [x] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 4 — Termination Payout Calculation (businessRules.ts + server.mts)

- [x] Add `computeTerminationPayout(carryoverHours: number, currentYearAccrued: number, currentYearUsed: number): number`
- [x] Cap prior-year portion at 80 hours
- [x] Add `GET /api/employees/:id/termination-payout` admin endpoint returning payout breakdown
- [x] Add unit tests for termination scenarios
- [x] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 5 — Server-Side Enforcement (server.mts)

- [x] Update `POST /api/pto` to use `getEffectivePtoRate` with employee hire date for balance validation
- [x] Update `GET /api/pto/status` to return accrual based on policy rates instead of hard-coded baseline
- [x] Update `GET /api/pto/year/:year` to use `computeAnnualAllocation` for the year's entitlement
- [x] Integrate `validateSickDayThreshold` into PTO creation endpoint
- [x] Add carryover validation when creating entries that would push balance negative
- [x] Ensure new validation messages are returned in RFC 9457-style error responses
- [x] Add integration-level tests (Vitest) for new server validation paths
- [x] Verify: `pnpm run build` passes; `pnpm run lint` passes

### Phase 6 — Client Error Message Display

- [x] Ensure client-side `VALIDATION_MESSAGES` map includes the new message keys
- [x] Display descriptive errors when server returns new validation codes
- [ ] Manual testing: trigger each new validation rule in the UI and confirm message appears

### Phase 7 — Testing & Documentation

- [ ] Add/update E2E tests exercising accrual display with seeded employees at different tenure levels
- [ ] Add E2E test for sick-day threshold warning
- [ ] Update `POLICY.md` cross-references if any interpretation footnotes are needed
- [ ] Update README "Development Best Practices" with accrual calculation patterns
- [ ] Final manual testing of all PTO flows
- [ ] Code review and linting pass

## Implementation Notes

- **Date handling**: All date logic must use `shared/dateUtils.ts` string-based `YYYY-MM-DD` format — no `new Date()` outside `dateUtils`.
- **July 1 rule complexity**: The rate-increase timing depends on which half of the year an employee was hired. The `getEffectivePtoRate` function must determine whether the employee's rate has already stepped up for the current period or still uses the prior tier.
- **Mid-year rate change accrual**: When an employee's rate changes on July 1, `computeAccrualToDate` must split the fiscal year into two segments (Jan 1–Jun 30 at old rate, Jul 1–current at new rate) and sum the accruals.
- **Backward compatibility**: Existing `computeAccrualToDate(ptoRate, fiscalYearStart, currentDate)` signature should remain usable; add a new overload or companion function rather than breaking callers.
- **Carryover vs. annual limit**: `ANNUAL_LIMITS.PTO = 80` currently serves double-duty as both an annual cap and implied carryover limit. Separate these into distinct constants (`CARRYOVER_LIMIT` for prior-year rollover, remove or repurpose `ANNUAL_LIMITS.PTO`).
- **`BASELINE_PTO_HOURS_PER_YEAR`**: Currently `96` — confirmed incorrect (unreleased). Remove entirely and audit all callers to use schedule-based lookup via `getEffectivePtoRate`.
- **Bereavement "consecutive days"**: Soft warning only — the system tracks individual PTO entries, not consecutive-day spans.
- **First-year pro-rating**: `dailyRate × getWorkdaysBetween(hireDate, yearEnd)`. PTO taken during this period still counts as workdays for accrual purposes (no adjustment to `getWorkdaysBetween`).
- **Carryover approval**: Handled through existing admin acknowledge/reject flow — no separate "written approval" mechanism needed.
- **Termination payout API**: Exposed as `GET /api/employees/:id/termination-payout` (admin-only). Frontend deferred.

## Questions and Concerns

1. Should the sick-day and bereavement thresholds be hard validation errors (block the request) or soft warnings (allow but flag)?
   > **Answer**: Soft warnings — allow the request but flag it.
2. Is `BASELINE_PTO_HOURS_PER_YEAR = 96` intentionally different from the policy's 168-hour tier-0, or is it a legacy bug?
   > **Answer**: Bad assumption in the code (unreleased). Replace with policy schedule.
3. How should mid-year hires' first partial year be handled — pro-rate from hire date to Dec 31, or grant full annual allocation?
   > **Answer**: Pro-rate using `ptoRate × workdays remaining in the year from hire date`.
4. Does the "PTO taken counts as time worked" rule change any existing workday-counting logic in `dateUtils.getWorkdaysBetween`?
   > **Answer**: No — workdays are workdays even if PTO is taken. No change to `getWorkdaysBetween`.
5. Is there a need to track "written approval" for carryover > 80 hours, or just enforce the 80-hour cap?
   > **Answer**: Admin will acknowledge or reject via existing admin-acknowledgement flow. "Written approval" is legacy — no special tracking needed.
6. Should the termination payout calculation be exposed as an API endpoint or remain a back-office utility?
   > **Answer**: API endpoint. Frontend implementation deferred to a later task.

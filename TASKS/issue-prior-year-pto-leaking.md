# Prior Year PTO Data Leaking into Current Year Summary

## Description

Prior-year PTO entries leak into current-year displays in **two** places:

### Defect A — Current Year Summary page (backend)

The `calculatePTOStatus` function in `server/ptoCalculations.ts` computes the top-level `usedPTO` field across **all years** instead of filtering to the current year. This causes prior-year PTO entries to inflate the "Used" total and deflate "Available" to zero.

**Example**: After seeding, John Doe shows:

- **Used**: 212.00 hours (incorrect — includes 100h from 2025)
- **Available**: 0.00 hours (incorrect)
- **Expected Used**: 112.00 hours (only 2026 PTO entries)
- **Expected Available**: 24.00 hours (96 + 40 carryover − 112 used)

### Defect B — Submit Time Off month-summary (frontend)

The `<pto-entry-form>` component filters PTO entries by **month number only** when populating `<month-summary>` hour totals, without checking the year. When viewing July 2026, the 8-hour PTO entry from July 2025 is included, showing PTO=88 instead of the correct PTO=80.

**Example**: John Doe, July 2026 month-summary:

- **Displayed PTO**: 88 hours (incorrect — includes 8h from 2025-07-04)
- **Expected PTO**: 80 hours (only the 2026-07-01 entry)

## Priority

🔥 High Priority — Incorrect PTO balance display is a data-integrity regression affecting every employee with prior-year entries.

## Root Cause

### Defect A

In `server/ptoCalculations.ts`, `calculatePTOStatus()`:

```typescript
// Line ~100 — BUG: no year filter
const usedPTO = calculateUsedPTO(ptoEntries, "PTO");

// Line ~101 — correct: filtered to current year
const usedPTOCurrentYear = calculateUsedPTO(ptoEntries, "PTO", currentYear);
```

`usedPTO` (unfiltered) feeds into:

1. The response's `usedPTO` field (displayed by `pto-summary-card`)
2. `availablePTO = startingPTOBalance - usedPTO` (also displayed by `pto-summary-card`)

Meanwhile `usedPTOCurrentYear` is only used for `ptoTime.used` (displayed by `pto-pto-card`), which is correct.

### Defect B

In `client/components/pto-entry-form/index.ts`, entries are filtered by month number without year in 4 places:

```typescript
// rebuildCalendars — multi-calendar mode (~line 170)
const monthEntries = existingEntries.filter(
  (e) => parseDate(e.date).month === m,
);

// rebuildCalendars — single-calendar mode (~line 220)
const monthEntries = existingEntries.filter(
  (e) => parseDate(e.date).month === month,
);

// setPtoData — multi-calendar mode (~line 783)
const monthEntries = ptoEntries.filter(
  (e) => parseDate(e.date).month === month,
);

// updateSingleCalendarSummaryHours (~line 262)
const monthEntries = calendar.ptoEntries.filter(
  (e) => parseDate(e.date).month === month,
);
```

All four filter by `month` but not `year`, so entries from 2025-07 appear in the 2026-07 summary.

## Checklist

### Stage 1A — Fix the calculation (backend — Defect A)

- [x] In `server/ptoCalculations.ts`, change `calculateUsedPTO(ptoEntries, "PTO")` to `calculateUsedPTO(ptoEntries, "PTO", currentYear)` so the top-level `usedPTO` is scoped to the current year
- [x] Remove the now-redundant `usedPTOCurrentYear` variable (or unify with `usedPTO`)
- [x] Verify `availablePTO = startingPTOBalance - usedPTO` now uses the year-filtered value
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 1B — Fix month-summary filtering (frontend — Defect B)

- [x] In `client/components/pto-entry-form/index.ts`, update the 4 month-entry filter expressions to also match the year (e.g. `parseDate(e.date).month === m && parseDate(e.date).year === year`)
- [ ] Verify July 2026 month-summary shows PTO=80 (not 88) after seeding
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2 — Unit tests

- [x] Add or update unit tests in `tests/ptoCalculations.test.ts` that pass PTO entries spanning multiple years and assert `usedPTO` only reflects the current year
- [x] Add a test case verifying `availablePTO` is correct when prior-year entries exist
- [ ] All unit tests pass (`pnpm test`)

### Stage 3 — E2E / integration validation

- [ ] Seed the database and verify the Current Year Summary page shows the correct "Used" and "Available" values for John Doe (Used = 112h, Available = 24h)
- [ ] Verify the PTO card's "Used" value matches the summary card's "Used" value
- [ ] Verify prior-year entries do not appear in the "Dates Used" list (already correct)
- [ ] Manual testing of at least one other employee

### Stage 4 — Documentation & cleanup

- [ ] Update this task file with completion status
- [ ] Update TASKS/README.md to mark this task as done

## Implementation Notes

### Defect A (backend — completed)

- The fix is a **one-line change** in `server/ptoCalculations.ts` (line ~100): add `currentYear` as the last argument to `calculateUsedPTO`.
- The `calculateUsedPTO` helper already supports an optional trailing `year` parameter — it's just not being passed for the top-level `usedPTO`.
- The `ptoTime.used` bucket already uses the correct year-filtered value, so the PTO details card is unaffected.
- No database schema or API contract changes are required — only the computed values change.

### Defect B (frontend)

- In `client/components/pto-entry-form/index.ts`, all 4 places that filter entries for a month-summary must add a year check: `parseDate(e.date).year === year`.
- The `year` value is already available via `getCurrentYear()` (imported) in `rebuildCalendars`, and via `calendar.year` in `updateSingleCalendarSummaryHours`.
- In `setPtoData` multi-calendar mode, `cal.year` is available on each calendar instance.
- No API or data model changes required — only the client-side filter expressions change.

## Questions and Concerns

1.
2.
3.

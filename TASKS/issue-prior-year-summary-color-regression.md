# Regression Report: Summary Values Color Inconsistency Between Scheduler and Prior Year Review

## Issue Summary

The `current-year-pto-scheduler` component uses plain black text for summary values (PTO, Sick, Bereavement, Jury Duty hours) in the month footer, while the `prior-year-review` component color-codes them using PTO type colors. Both components should use the same color-coded approach for visual consistency.

## Previously Working

- The `prior-year-review` component correctly color-codes summary values using PTO type CSS variables
- The `current-year-pto-scheduler` should match this behavior but uses `color: black` instead

## Current Behavior

- `current-year-pto-scheduler` uses `color: black` for all non-zero summary values
- `prior-year-review` uses PTO type colors (e.g., `var(--color-pto-sick)` for sick hours)

## Expected Behavior

Both components should use PTO-type-specific colors for non-zero summary values:

- PTO: `var(--color-pto-vacation)`
- Sick: `var(--color-pto-sick)`
- Bereavement: `var(--color-pto-bereavement)`
- Jury Duty: `var(--color-pto-jury-duty)`

## Root Cause

The `current-year-pto-scheduler`'s `css.ts` file had `color: black` for summary value classes instead of using the `PTO_TYPE_COLORS` map that was already defined in the same file.

## Fix Applied

Updated `client/components/current-year-pto-scheduler/css.ts` to use `PTO_TYPE_COLORS` values for `.summary-pto`, `.summary-sick`, `.summary-bereavement`, and `.summary-jury-duty` classes, matching the `prior-year-review` component's behavior.

## Staged Action Plan

### Stage 1: Fix (Complete)

- [x] Update `current-year-pto-scheduler/css.ts` summary colors to use `PTO_TYPE_COLORS`
- [x] Confirm `prior-year-review/index.ts` uses matching PTO type color variables

### Stage 2: Validation

- [ ] Run `pnpm run build` to verify no build errors
- [ ] Run `pnpm run lint` to verify lint passes
- [ ] Visual inspection of both components' summary values
- [ ] Run E2E tests for both components

## Investigation Checklist

- [x] Identify the color difference between the two components
- [x] Confirm `prior-year-review` uses PTO type colors
- [x] Update `current-year-pto-scheduler` to match
- [ ] Run `pnpm run build` to verify no build errors
- [ ] Run `pnpm run lint` to verify lint passes
- [ ] Manual visual testing of both views

import { describe, it, expect } from 'vitest';

import {
    isValidDateString,
    parseDate,
    formatDate,
    addDays,
    addMonths,
    compareDates,
    getDateComponents,
    isBefore,
    isAfter,
    getDaysBetween,
    today,
    getDayOfWeek,
    isWeekend,
    startOfMonth,
    endOfMonth,
    getDaysInMonth,
    dateToString,
    addBusinessDays,
    nextBusinessDay,
    countWeekdays,
    isBusinessDay
} from '../date-fns.js';

describe('shared/date-fns facade', () => {
    describe('isValidDateString', () => {
        it('accepts strict YYYY-MM-DD only', () => {
            expect(isValidDateString('2026-02-05')).toBe(true);
            expect(isValidDateString('2026-2-5')).toBe(false);
            expect(isValidDateString('2026/02/05')).toBe(false);
            expect(isValidDateString('2026-02')).toBe(false);
            expect(isValidDateString('not-a-date')).toBe(false);
        });

        it('rejects out-of-range or impossible dates', () => {
            expect(isValidDateString('1899-12-31')).toBe(false);
            expect(isValidDateString('2101-01-01')).toBe(false);
            expect(isValidDateString('2026-13-01')).toBe(false);
            expect(isValidDateString('2026-02-30')).toBe(false);
        });
    });

    describe('parseDate / formatDate roundtrip', () => {
        it('parses and formats consistently', () => {
            const parts = parseDate('2026-02-05');
            expect(parts).toEqual({ year: 2026, month: 2, day: 5 });
            expect(formatDate(parts.year, parts.month, parts.day)).toBe('2026-02-05');
        });

        it('getDateComponents is an alias', () => {
            expect(getDateComponents('2026-02-05')).toEqual({ year: 2026, month: 2, day: 5 });
        });
    });

    describe('addDays', () => {
        it('adds across month/year boundaries and leap years', () => {
            expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
            expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
            expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
            expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
        });
    });

    describe('addMonths', () => {
        it('handles month-end adjustments', () => {
            expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
            expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
        });
    });

    describe('comparisons and diffs', () => {
        it('compareDates / isBefore / isAfter', () => {
            expect(compareDates('2026-02-05', '2026-02-05')).toBe(0);
            expect(compareDates('2026-02-04', '2026-02-05')).toBe(-1);
            expect(compareDates('2026-02-06', '2026-02-05')).toBe(1);

            expect(isBefore('2026-02-04', '2026-02-05')).toBe(true);
            expect(isAfter('2026-02-06', '2026-02-05')).toBe(true);
        });

        it('getDaysBetween counts calendar days (DST-safe)', () => {
            expect(getDaysBetween('2026-02-05', '2026-02-05')).toBe(0);
            expect(getDaysBetween('2026-02-06', '2026-02-05')).toBe(1);
            expect(getDaysBetween('2026-02-04', '2026-02-05')).toBe(-1);
        });
    });

    describe('weekday helpers', () => {
        it('getDayOfWeek and isWeekend', () => {
            // Feb 5, 2026 is Thursday
            expect(getDayOfWeek('2026-02-05')).toBe(4);
            expect(isWeekend('2026-02-07')).toBe(true); // Saturday
            expect(isWeekend('2026-02-08')).toBe(true); // Sunday
            expect(isWeekend('2026-02-10')).toBe(false); // Tuesday
        });

        it('business day helpers', () => {
            expect(isBusinessDay('2026-02-07')).toBe(false);
            expect(isBusinessDay('2026-02-09')).toBe(true);

            expect(addBusinessDays('2026-02-06', 1)).toBe('2026-02-09'); // Fri +1 business day => Mon
            expect(nextBusinessDay('2026-02-06')).toBe('2026-02-09');

            // Inclusive weekdays between Mon..Fri
            expect(countWeekdays('2026-02-09', '2026-02-13')).toBe(5);
        });
    });

    describe('month boundaries', () => {
        it('startOfMonth and endOfMonth', () => {
            expect(startOfMonth('2026-02-15')).toBe('2026-02-01');
            expect(endOfMonth('2026-02-15')).toBe('2026-02-28');
            expect(endOfMonth('2024-02-15')).toBe('2024-02-29');
        });

        it('getDaysInMonth', () => {
            expect(getDaysInMonth(2026, 1)).toBe(31);
            expect(getDaysInMonth(2026, 2)).toBe(28);
            expect(getDaysInMonth(2024, 2)).toBe(29);
        });
    });

    describe('today', () => {
        it('returns a valid YYYY-MM-DD string', () => {
            const t = today();
            expect(isValidDateString(t)).toBe(true);
        });
    });

    describe('dateToString', () => {
        it('serializes Date using local calendar components (stable for local-midnight dates)', () => {
            expect(dateToString(new Date(2026, 1, 5))).toBe('2026-02-05');
            expect(dateToString(new Date(2024, 0, 1))).toBe('2024-01-01');
        });
    });
});

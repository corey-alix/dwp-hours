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
    getWeekdaysBetween
} from '../shared/dateUtils.js';

describe('Date Utils', () => {
    describe('isValidDateString', () => {
        it('should validate correct YYYY-MM-DD format', () => {
            expect(isValidDateString('2026-02-05')).toBe(true);
            expect(isValidDateString('2024-12-31')).toBe(true);
            expect(isValidDateString('1900-01-01')).toBe(true);
            expect(isValidDateString('2100-12-31')).toBe(true);
        });

        it('should reject invalid formats', () => {
            expect(isValidDateString('')).toBe(false);
            expect(isValidDateString('2026-02')).toBe(false);
            expect(isValidDateString('2026-02-05-extra')).toBe(false);
            expect(isValidDateString('26-02-05')).toBe(false);
            expect(isValidDateString('2026/02/05')).toBe(false);
            expect(isValidDateString('2026-2-5')).toBe(false);
        });

        it('should reject invalid date values', () => {
            expect(isValidDateString('2026-13-01')).toBe(false); // Invalid month
            expect(isValidDateString('2026-02-30')).toBe(false); // Invalid day for February
            expect(isValidDateString('2026-04-31')).toBe(false); // Invalid day for April
            expect(isValidDateString('1899-01-01')).toBe(false); // Year too low
            expect(isValidDateString('2101-01-01')).toBe(false); // Year too high
        });

        it('should handle leap years correctly', () => {
            expect(isValidDateString('2024-02-29')).toBe(true); // 2024 is leap year
            expect(isValidDateString('2023-02-29')).toBe(false); // 2023 is not leap year
            expect(isValidDateString('2028-02-29')).toBe(true); // 2028 is leap year
        });
    });

    describe('parseDate', () => {
        it('should parse valid date strings', () => {
            expect(parseDate('2026-02-05')).toEqual({ year: 2026, month: 2, day: 5 });
            expect(parseDate('2024-12-31')).toEqual({ year: 2024, month: 12, day: 31 });
            expect(parseDate('1900-01-01')).toEqual({ year: 1900, month: 1, day: 1 });
        });

        it('should throw on invalid date strings', () => {
            expect(() => parseDate('invalid')).toThrow();
            expect(() => parseDate('2026-13-01')).toThrow();
            expect(() => parseDate('2026-02-30')).toThrow();
        });
    });

    describe('formatDate', () => {
        it('should format date components correctly', () => {
            expect(formatDate(2026, 2, 5)).toBe('2026-02-05');
            expect(formatDate(2024, 12, 31)).toBe('2024-12-31');
            expect(formatDate(1900, 1, 1)).toBe('1900-01-01');
        });

        it('should pad components correctly', () => {
            expect(formatDate(2026, 2, 5)).toBe('2026-02-05'); // Already correct
        });

        it('should throw on invalid components', () => {
            expect(() => formatDate(2026, 13, 1)).toThrow();
            expect(() => formatDate(2026, 2, 30)).toThrow();
        });
    });

    describe('addDays', () => {
        it('should add positive days', () => {
            expect(addDays('2026-02-05', 1)).toBe('2026-02-06');
            expect(addDays('2026-02-05', 7)).toBe('2026-02-12');
            expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
        });

        it('should add negative days', () => {
            expect(addDays('2026-02-05', -1)).toBe('2026-02-04');
            expect(addDays('2026-02-01', -1)).toBe('2026-01-31');
        });

        it('should handle month boundaries', () => {
            expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
            expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
        });

        it('should handle leap years', () => {
            expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // Leap year
            expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
            expect(addDays('2023-02-28', 1)).toBe('2023-03-01'); // Non-leap year
        });
    });

    describe('addMonths', () => {
        it('should add positive months', () => {
            expect(addMonths('2026-02-05', 1)).toBe('2026-03-05');
            expect(addMonths('2026-02-05', 12)).toBe('2027-02-05');
        });

        it('should add negative months', () => {
            expect(addMonths('2026-02-05', -1)).toBe('2026-01-05');
            expect(addMonths('2026-02-05', -12)).toBe('2025-02-05');
        });

        it('should handle month end adjustments', () => {
            expect(addMonths('2026-01-31', 1)).toBe('2026-02-28'); // Feb has 28 days
            expect(addMonths('2024-01-31', 1)).toBe('2024-02-29'); // Feb has 29 in leap year
        });
    });

    describe('compareDates', () => {
        it('should compare dates correctly', () => {
            expect(compareDates('2026-02-05', '2026-02-05')).toBe(0);
            expect(compareDates('2026-02-04', '2026-02-05')).toBe(-1);
            expect(compareDates('2026-02-06', '2026-02-05')).toBe(1);
            expect(compareDates('2026-01-31', '2026-02-01')).toBe(-1);
            expect(compareDates('2027-01-01', '2026-12-31')).toBe(1);
        });
    });

    describe('isBefore and isAfter', () => {
        it('should check date ordering', () => {
            expect(isBefore('2026-02-04', '2026-02-05')).toBe(true);
            expect(isBefore('2026-02-05', '2026-02-05')).toBe(false);
            expect(isBefore('2026-02-06', '2026-02-05')).toBe(false);

            expect(isAfter('2026-02-06', '2026-02-05')).toBe(true);
            expect(isAfter('2026-02-05', '2026-02-05')).toBe(false);
            expect(isAfter('2026-02-04', '2026-02-05')).toBe(false);
        });
    });

    describe('getDaysBetween', () => {
        it('should calculate days between dates', () => {
            expect(getDaysBetween('2026-02-05', '2026-02-05')).toBe(0);
            expect(getDaysBetween('2026-02-06', '2026-02-05')).toBe(1);
            expect(getDaysBetween('2026-02-04', '2026-02-05')).toBe(-1);
            expect(getDaysBetween('2026-02-05', '2026-01-05')).toBe(31);
        });
    });

    describe('getDayOfWeek', () => {
        it('should return correct day of week', () => {
            // February 5, 2026 is a Thursday (4)
            expect(getDayOfWeek('2026-02-05')).toBe(4);
            // January 1, 2026 is a Thursday (4)
            expect(getDayOfWeek('2026-01-01')).toBe(4);
        });
    });

    describe('isWeekend', () => {
        it('should identify weekends', () => {
            // Feb 5, 2026 is Thursday
            expect(isWeekend('2026-02-05')).toBe(false);
            expect(isWeekend('2026-02-07')).toBe(true); // Saturday
            expect(isWeekend('2026-02-08')).toBe(true); // Sunday
            expect(isWeekend('2026-02-10')).toBe(false); // Tuesday
        });
    });

    describe('startOfMonth and endOfMonth', () => {
        it('should get month boundaries', () => {
            expect(startOfMonth('2026-02-15')).toBe('2026-02-01');
            expect(endOfMonth('2026-02-15')).toBe('2026-02-28'); // 2026 Feb has 28 days
            expect(endOfMonth('2024-02-15')).toBe('2024-02-29'); // Leap year
            expect(endOfMonth('2026-01-15')).toBe('2026-01-31');
        });
    });

    describe('getDaysInMonth', () => {
        it('should return correct days in month', () => {
            expect(getDaysInMonth(2026, 1)).toBe(31); // January
            expect(getDaysInMonth(2026, 2)).toBe(28); // February non-leap
            expect(getDaysInMonth(2024, 2)).toBe(29); // February leap
            expect(getDaysInMonth(2026, 4)).toBe(30); // April
            expect(getDaysInMonth(2026, 12)).toBe(31); // December
        });
    });

    describe('getDateComponents', () => {
        it('should return date components', () => {
            expect(getDateComponents('2026-02-05')).toEqual({ year: 2026, month: 2, day: 5 });
        });
    });

    describe('today', () => {
        it('should return current date in YYYY-MM-DD format', () => {
            const todayStr = today();
            expect(isValidDateString(todayStr)).toBe(true);
            // Should be today's date
            const now = new Date();
            const expected = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
            expect(todayStr).toBe(expected);
        });
    });

    describe('integration tests', () => {
        it('should handle complex date operations', () => {
            // Start with a date, add days and months, check ordering
            const start = '2026-01-15';
            const addedDays = addDays(start, 10);
            expect(addedDays).toBe('2026-01-25');

            const addedMonths = addMonths(addedDays, 1);
            expect(addedMonths).toBe('2026-02-25');

            expect(isAfter(addedMonths, start)).toBe(true);
            expect(getDaysBetween(addedMonths, start)).toBe(41); // 10 days + 31 days in Jan
        });

        it('should handle edge cases', () => {
            // Year boundary
            expect(addDays('2025-12-31', 1)).toBe('2026-01-01');

            // Leap year boundary
            expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
            expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
        });
    });

    describe('dateToString', () => {
        it('should convert Date to YYYY-MM-DD string', () => {
            expect(dateToString(new Date(2026, 1, 5))).toBe('2026-02-05'); // Month is 0-indexed
            expect(dateToString(new Date(2024, 0, 1))).toBe('2024-01-01'); // January 1st
            expect(dateToString(new Date(2026, 11, 31))).toBe('2026-12-31'); // December 31st
        });

        it('should reproduce timezone shift issue', () => {
            // Simulate creating a date in local timezone vs UTC interpretation
            // This reproduces the issue where '2026-03-12' becomes '2026-03-10' in UTC+10 timezone

            // Create date using local time constructor (what happens in some code)
            const localDate = new Date(2026, 2, 12); // March 12, 2026 (month is 0-indexed)

            // Serialize using UTC getters (what dateToString does)
            const serialized = dateToString(localDate);

            // In UTC+10 timezone, this would shift the date
            // The test documents the issue - in different timezones this could fail
            console.log(`Local date created: ${localDate.toISOString()}`);
            console.log(`Serialized result: ${serialized}`);

            // This test will help identify the timezone shift issue
            // In UTC timezone: should be '2026-03-12'
            // In UTC+10 timezone: would be '2026-03-11' or '2026-03-10' depending on exact offset
        });

        it('should reproduce client-side PTO form date processing issue', () => {
            // Simulate the client-side date processing in PTO form
            // This reproduces how dates get processed when submitting PTO requests

            const inputDateString = '2026-03-12';
            const parsedDate = new Date(inputDateString);
            const processedDateString = parsedDate.toISOString().split('T')[0];

            console.log(`Input date string: ${inputDateString}`);
            console.log(`Parsed date ISO: ${parsedDate.toISOString()}`);
            console.log(`Processed date string: ${processedDateString}`);

            // In UTC+10 timezone, '2026-03-12' becomes '2026-03-11'
            // This is the source of the timezone shift in PTO entries
        });
    });

    describe('getWeekdaysBetween', () => {
        it('should count weekdays between two dates inclusive', () => {
            // Monday to Friday (5 weekdays)
            expect(getWeekdaysBetween('2026-02-09', '2026-02-13')).toBe(5);

            // Single weekday
            expect(getWeekdaysBetween('2026-02-10', '2026-02-10')).toBe(1);

            // Including weekend (Friday to Sunday = only Friday is weekday)
            expect(getWeekdaysBetween('2026-02-06', '2026-02-08')).toBe(1); // Fri only (Sat-Sun skipped)

            // Week with weekend in middle
            expect(getWeekdaysBetween('2026-02-09', '2026-02-15')).toBe(5); // Mon-Fri (skip Sat-Sun)
        });

        it('should return 0 when start date is after end date', () => {
            expect(getWeekdaysBetween('2026-02-14', '2026-02-10')).toBe(0);
        });

        it('should handle invalid date strings', () => {
            expect(() => getWeekdaysBetween('invalid', '2026-02-10')).toThrow();
            expect(() => getWeekdaysBetween('2026-02-10', 'invalid')).toThrow();
        });
    });
});
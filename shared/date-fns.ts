/**
 * Date-fns Facade - Shared Date Utilities
 *
 * Purpose:
 * - Provide a stable YYYY-MM-DD string API (backward compatible with server/dateUtils.ts)
 * - Use date-fns internally for well-tested date arithmetic
 *
 * Timezone model:
 * - Date-only strings are treated as civil/local calendar dates.
 * - We intentionally avoid mixing local Date construction with UTC serialization.
 * - All date-only operations parse/format in local time so results are stable across
 *   process timezones.
 *
 * Note on ".js" import specifiers:
 * - date-fns uses .js specifiers inside TypeScript sources so emitted ESM is valid.
 * - In this repo we consume date-fns TypeScript sources via a symlink at shared/date-fns
 *   (pointing at node_modules/date-fns/src), allowing TS/Vite/esbuild to compile the TS.
 */

import { addDays as dfAddDays } from './date-fns/addDays/index.js';
import { addMonths as dfAddMonths } from './date-fns/addMonths/index.js';
import { format } from './date-fns/format/index.js';
import { parse } from './date-fns/parse/index.js';
import { isValid } from './date-fns/isValid/index.js';
import { differenceInCalendarDays } from './date-fns/differenceInCalendarDays/index.js';
import { startOfMonth as dfStartOfMonth } from './date-fns/startOfMonth/index.js';
import { endOfMonth as dfEndOfMonth } from './date-fns/endOfMonth/index.js';
import { isWeekend as dfIsWeekend } from './date-fns/isWeekend/index.js';
import { getDay } from './date-fns/getDay/index.js';
import { addBusinessDays as dfAddBusinessDays } from './date-fns/addBusinessDays/index.js';
import { differenceInBusinessDays as dfDifferenceInBusinessDays } from './date-fns/differenceInBusinessDays/index.js';
import { getDaysInMonth as dfGetDaysInMonth } from './date-fns/getDaysInMonth/index.js';

const DATE_STRING_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function strictParseDateString(dateStr: string): Date {
    if (typeof dateStr !== 'string') {
        throw new Error(`Invalid date string: ${String(dateStr)}`);
    }

    const match = DATE_STRING_RE.exec(dateStr);
    if (!match) {
        throw new Error(`Invalid date string: ${dateStr}`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year < MIN_YEAR || year > MAX_YEAR) {
        throw new Error(`Invalid date string: ${dateStr}`);
    }

    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (!isValid(parsed) || format(parsed, 'yyyy-MM-dd') !== dateStr) {
        throw new Error(`Invalid date string: ${dateStr}`);
    }

    if (parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) {
        throw new Error(`Invalid date string: ${dateStr}`);
    }

    return parsed;
}

/**
 * Validates if a string is a valid YYYY-MM-DD date format
 */
export function isValidDateString(dateStr: string): boolean {
    try {
        strictParseDateString(dateStr);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parses a YYYY-MM-DD string into components
 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } {
    const date = strictParseDateString(dateStr);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
}

/**
 * Backward-compatible alias with server/dateUtils.ts
 */
export function getDateComponents(dateStr: string): { year: number; month: number; day: number } {
    return parseDate(dateStr);
}

/**
 * Formats year, month, day into YYYY-MM-DD string
 */
export function formatDate(year: number, month: number, day: number): string {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        throw new Error(`Invalid date components: ${year}-${month}-${day}`);
    }
    if (year < MIN_YEAR || year > MAX_YEAR) {
        throw new Error(`Invalid date components: ${year}-${month}-${day}`);
    }

    const date = new Date(year, month - 1, day);

    // Prevent JS Date from normalizing invalid dates (Feb 30 -> Mar 2, etc.)
    if (
        !isValid(date) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        throw new Error(`Invalid date components: ${year}-${month}-${day}`);
    }

    return format(date, 'yyyy-MM-dd');
}

/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
        throw new Error(`Invalid date components: ${year}-${month}`);
    }
    if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12) {
        throw new Error(`Invalid date components: ${year}-${month}`);
    }
    return dfGetDaysInMonth(new Date(year, month - 1, 1));
}

/**
 * Adds days to a date string
 */
export function addDays(dateStr: string, days: number): string {
    const date = strictParseDateString(dateStr);
    const newDate = dfAddDays(date, days);
    return format(newDate, 'yyyy-MM-dd');
}

/**
 * Adds months to a date string
 */
export function addMonths(dateStr: string, months: number): string {
    const date = strictParseDateString(dateStr);
    const newDate = dfAddMonths(date, months);
    return format(newDate, 'yyyy-MM-dd');
}

/**
 * Compares two date strings
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(dateStr1: string, dateStr2: string): number {
    const date1 = strictParseDateString(dateStr1);
    const date2 = strictParseDateString(dateStr2);

    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
}

/**
 * Checks if date1 is before date2
 */
export function isBefore(dateStr1: string, dateStr2: string): boolean {
    return compareDates(dateStr1, dateStr2) < 0;
}

/**
 * Checks if date1 is after date2
 */
export function isAfter(dateStr1: string, dateStr2: string): boolean {
    return compareDates(dateStr1, dateStr2) > 0;
}

/**
 * Gets the number of days between two dates (date1 - date2)
 */
export function getDaysBetween(dateStr1: string, dateStr2: string): number {
    const date1 = strictParseDateString(dateStr1);
    const date2 = strictParseDateString(dateStr2);
    return differenceInCalendarDays(date1, date2);
}

/**
 * Gets the current date as YYYY-MM-DD string
 */
export function today(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Gets the day of the week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
    const date = strictParseDateString(dateStr);
    return getDay(date);
}

/**
 * Checks if a date is a weekend
 */
export function isWeekend(dateStr: string): boolean {
    const date = strictParseDateString(dateStr);
    return dfIsWeekend(date);
}

/**
 * Gets the start of month for a given date
 */
export function startOfMonth(dateStr: string): string {
    const date = strictParseDateString(dateStr);
    const start = dfStartOfMonth(date);
    return format(start, 'yyyy-MM-dd');
}

/**
 * Gets the end of month for a given date
 */
export function endOfMonth(dateStr: string): string {
    const date = strictParseDateString(dateStr);
    const end = dfEndOfMonth(date);
    return format(end, 'yyyy-MM-dd');
}

/**
 * Converts a Date object to YYYY-MM-DD string format
 */
export function dateToString(date: Date): string {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error('Invalid Date');
    }

    // Use local getters so local-midnight dates don't shift when serialized.
    return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Adds business days to a date (skips weekends)
 */
export function addBusinessDays(dateStr: string, days: number): string {
    const date = strictParseDateString(dateStr);
    const newDate = dfAddBusinessDays(date, days);
    return format(newDate, 'yyyy-MM-dd');
}

/**
 * Gets the next business day (skips weekends)
 */
export function nextBusinessDay(dateStr: string): string {
    return addBusinessDays(dateStr, 1);
}

/**
 * Counts weekdays between two dates (inclusive)
 */
export function countWeekdays(startDateStr: string, endDateStr: string): number {
    const start = strictParseDateString(startDateStr);
    const end = strictParseDateString(endDateStr);
    return dfDifferenceInBusinessDays(end, start) + 1;
}

/**
 * Checks if a date is a business day (not weekend)
 */
export function isBusinessDay(dateStr: string): boolean {
    return !isWeekend(dateStr);
}

/**
 * Date Management Utilities
 * Lightweight bespoke date management using YYYY-MM-DD strings exclusively
 * Avoids timezone issues and provides consistent date handling
 */

/**
 * Validates if a string is a valid YYYY-MM-DD date format
 */
export function isValidDateString(dateStr: string): boolean {
    if (typeof dateStr !== 'string') return false;

    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;

    const [, yearStr, monthStr, dayStr] = match;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Basic range checks
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Check days in month
    const daysInMonth = getDaysInMonth(year, month);
    return day <= daysInMonth;
}

/**
 * Parses a YYYY-MM-DD string into components
 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } {
    if (!isValidDateString(dateStr)) {
        throw new Error(`Invalid date string: ${dateStr}`);
    }

    const [, yearStr, monthStr, dayStr] = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
    return {
        year: parseInt(yearStr, 10),
        month: parseInt(monthStr, 10),
        day: parseInt(dayStr, 10)
    };
}

/**
 * Formats year, month, day into YYYY-MM-DD string
 */
export function formatDate(year: number, month: number, day: number): string {
    if (!isValidDateComponents(year, month, day)) {
        throw new Error(`Invalid date components: ${year}-${month}-${day}`);
    }

    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
    // Create date for the last day of the month
    const date = new Date(year, month, 0);
    return date.getDate();
}

/**
 * Validates date components
 */
function isValidDateComponents(year: number, month: number, day: number): boolean {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const daysInMonth = getDaysInMonth(year, month);
    return day <= daysInMonth;
}

/**
 * Adds days to a date string
 */
export function addDays(dateStr: string, days: number): string {
    const { year, month, day } = parseDate(dateStr);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);

    return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Adds months to a date string
 */
export function addMonths(dateStr: string, months: number): string {
    const { year, month, day } = parseDate(dateStr);
    let newYear = year;
    let newMonth = month + months;

    // Adjust year and month
    while (newMonth > 12) {
        newYear++;
        newMonth -= 12;
    }
    while (newMonth <= 0) {
        newYear--;
        newMonth += 12;
    }

    // Get the last day of the target month
    const daysInTargetMonth = getDaysInMonth(newYear, newMonth);
    const targetDay = Math.min(day, daysInTargetMonth);

    return formatDate(newYear, newMonth, targetDay);
}

/**
 * Compares two date strings
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(dateStr1: string, dateStr2: string): number {
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);

    if (d1.year !== d2.year) return d1.year < d2.year ? -1 : 1;
    if (d1.month !== d2.month) return d1.month < d2.month ? -1 : 1;
    if (d1.day !== d2.day) return d1.day < d2.day ? -1 : 1;
    return 0;
}

/**
 * Gets date components from a date string
 */
export function getDateComponents(dateStr: string): { year: number; month: number; day: number } {
    return parseDate(dateStr);
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
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);

    const date1 = new Date(d1.year, d1.month - 1, d1.day);
    const date2 = new Date(d2.year, d2.month - 1, d2.day);

    const diffTime = date1.getTime() - date2.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets the current date as YYYY-MM-DD string
 */
export function today(): string {
    const now = new Date();
    return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Gets the day of the week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string) {
    const { year, month, day } = parseDate(dateStr);
    const date = new Date(year, month - 1, day);
    return date.getDay();
}

/**
 * Checks if a date is a weekend
 */
export function isWeekend(dateStr: string): boolean {
    const dayOfWeek = getDayOfWeek(dateStr);
    return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Gets the start of month for a given date
 */
export function startOfMonth(dateStr: string): string {
    const { year, month } = parseDate(dateStr);
    return formatDate(year, month, 1);
}

/**
 * Gets the end of month for a given date
 */
export function endOfMonth(dateStr: string): string {
    const { year, month } = parseDate(dateStr);
    const daysInMonth = getDaysInMonth(year, month);
    return formatDate(year, month, daysInMonth);
}

/**
 * Converts a Date object to YYYY-MM-DD string format
 */
export function dateToString(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    return formatDate(year, month, day);
}

/**
 * Calculate the number of weekdays (Monday-Friday) between two dates, inclusive
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param endDateStr - End date in YYYY-MM-DD format
 * @returns Number of weekdays between the dates
 */
export function getWeekdaysBetween(startDateStr: string, endDateStr: string): number {
    if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
        throw new Error('Invalid date string format');
    }

    if (compareDates(startDateStr, endDateStr) > 0) {
        return 0; // Return 0 if start date is after end date
    }

    let weekdays = 0;
    let currentDateStr = startDateStr;

    while (compareDates(currentDateStr, endDateStr) <= 0) {
        if (!isWeekend(currentDateStr)) {
            weekdays++;
        }
        currentDateStr = addDays(currentDateStr, 1);
    }

    return weekdays;
}

/**
 * Gets the current year
 */
export function getCurrentYear(): number {
    const now = new Date();
    return now.getFullYear();
}

/**
 * Gets the current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
}

/**
 * Formats a date string for display using locale formatting
 */
export function formatDateForDisplay(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
    const { year, month, day } = parseDate(dateStr);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', options);
}

/**
 * Gets all workdays (weekdays) between two dates as an array of date strings
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param endDateStr - End date in YYYY-MM-DD format
 * @returns Array of YYYY-MM-DD strings representing workdays
 */
export function getWorkdaysBetween(startDateStr: string, endDateStr: string): string[] {
    if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
        throw new Error('Invalid date string format');
    }

    const workdays: string[] = [];
    let currentDateStr = startDateStr;

    while (compareDates(currentDateStr, endDateStr) <= 0) {
        if (!isWeekend(currentDateStr)) {
            workdays.push(currentDateStr);
        }
        currentDateStr = addDays(currentDateStr, 1);
    }

    return workdays;
}

/**
 * Gets the first day of the month for a given year and month
 */
export function getFirstDayOfMonth(year: number, month: number): string {
    return formatDate(year, month, 1);
}

/**
 * Gets the last day of the month for a given year and month
 */
export function getLastDayOfMonth(year: number, month: number): string {
    const daysInMonth = getDaysInMonth(year, month);
    return formatDate(year, month, daysInMonth);
}

/**
 * Gets the calendar start date (first day of the week containing the first day of the month)
 */
export function getCalendarStartDate(year: number, month: number): string {
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const dayOfWeek = getDayOfWeek(firstDayOfMonth);
    return addDays(firstDayOfMonth, -dayOfWeek);
}

/**
 * Gets the calendar end date (last day of the week containing the last day of the month)
 */
export function getCalendarEndDate(year: number, month: number): string {
    const lastDayOfMonth = getLastDayOfMonth(year, month);
    const dayOfWeek = getDayOfWeek(lastDayOfMonth);
    const daysToAdd = 6 - dayOfWeek;
    return addDays(lastDayOfMonth, daysToAdd);
}

/**
 * Gets all dates in a calendar month (including days from previous/next months to fill the grid)
 */
export function getCalendarDates(year: number, month: number): string[] {
    const startDate = getCalendarStartDate(year, month);
    const endDate = getCalendarEndDate(year, month);

    const dates: string[] = [];
    let currentDate = startDate;

    while (compareDates(currentDate, endDate) <= 0) {
        dates.push(currentDate);
        currentDate = addDays(currentDate, 1);
    }

    return dates;
}

/**
 * Checks if a date is in the current month
 */
export function isInMonth(dateStr: string, year: number, month: number): boolean {
    const { year: dateYear, month: dateMonth } = parseDate(dateStr);
    return dateYear === year && dateMonth === month;
}

/**
 * Calculate end date by adding hours with spillover logic (skip weekends)
 * Assumes 8 hours per workday, spills over to next business day when exceeding 8 hours
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param hours - Total hours to add
 * @returns End date in YYYY-MM-DD format
 */
export function calculateEndDateFromHours(startDateStr: string, hours: number): string {
    if (!isValidDateString(startDateStr)) {
        throw new Error('Invalid start date string format');
    }

    if (hours <= 0) {
        return startDateStr;
    }

    let currentDateStr = startDateStr;
    let remainingHours = hours;

    while (remainingHours > 0) {
        if (isWeekend(currentDateStr)) {
            currentDateStr = addDays(currentDateStr, 1);
            continue;
        }

        const hoursForDay = Math.min(remainingHours, 8);
        remainingHours -= hoursForDay;

        if (remainingHours > 0) {
            currentDateStr = addDays(currentDateStr, 1);
        }
    }

    return currentDateStr;
}

/**
 * Gets the start of the current year (January 1st)
 */
export function startOfYear(): string {
    const { year } = parseDate(today());
    return formatDate(year, 1, 1);
}

/**
 * Gets the end of the current year (December 31st)
 */
export function endOfYear(): string {
    const { year } = parseDate(today());
    return formatDate(year, 12, 31);
}
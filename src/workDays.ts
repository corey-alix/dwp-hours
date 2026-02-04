/**
 * Work Days Calculation Utility
 * Calculates the number of working days in a month, excluding weekends and holidays
 */

export interface WorkDaysResult {
    workDays: number;
    totalDays: number;
    weekends: number;
    holidays: string[];
}

/**
 * Calculate work days for a given month and year
 * @param year - The year (e.g., 2024)
 * @param month - The month (1-12)
 * @param holidays - Array of holiday dates in YYYY-MM-DD format
 * @returns WorkDaysResult with work days calculation
 */
export function calculateWorkDays(year: number, month: number, holidays: string[] = []): WorkDaysResult {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const totalDays = lastDay.getDate();

    let workDays = 0;
    let weekends = 0;
    const holidayDates: string[] = [];

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const dateString = date.toISOString().split('T')[0];

        // Check if it's a weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends++;
            continue;
        }

        // Check if it's a holiday
        if (holidays.includes(dateString)) {
            holidayDates.push(dateString);
            continue;
        }

        workDays++;
    }

    return {
        workDays,
        totalDays,
        weekends,
        holidays: holidayDates
    };
}

/**
 * Get default US federal holidays for a given year
 * @param year - The year to get holidays for
 * @returns Array of holiday dates in YYYY-MM-DD format
 */
export function getUSHolidays(year: number): string[] {
    const holidays: string[] = [];

    // New Year's Day
    holidays.push(`${year}-01-01`);

    // Martin Luther King Jr. Day (3rd Monday in January)
    const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3); // 3rd Monday in January
    holidays.push(mlkDay);

    // Presidents Day (3rd Monday in February)
    const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3); // 3rd Monday in February
    holidays.push(presidentsDay);

    // Memorial Day (Last Monday in May)
    const memorialDay = getLastWeekdayOfMonth(year, 4, 1); // Last Monday in May
    holidays.push(memorialDay);

    // Independence Day
    holidays.push(`${year}-07-04`);

    // Labor Day (1st Monday in September)
    const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1); // 1st Monday in September
    holidays.push(laborDay);

    // Columbus Day (2nd Monday in October)
    const columbusDay = getNthWeekdayOfMonth(year, 9, 1, 2); // 2nd Monday in October
    holidays.push(columbusDay);

    // Veterans Day
    holidays.push(`${year}-11-11`);

    // Thanksgiving (4th Thursday in November)
    const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4); // 4th Thursday in November
    holidays.push(thanksgiving);

    // Christmas Day
    holidays.push(`${year}-12-25`);

    return holidays;
}

/**
 * Get the nth weekday of a month
 * @param year - Year
 * @param month - Month (0-11)
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param n - Which occurrence (1st, 2nd, 3rd, etc.)
 * @returns Date string in YYYY-MM-DD format
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): string {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysToAdd = (weekday - firstWeekday + 7) % 7 + (n - 1) * 7;
    const targetDate = new Date(year, month, 1 + daysToAdd);
    return targetDate.toISOString().split('T')[0];
}

/**
 * Get the last weekday of a month
 * @param year - Year
 * @param month - Month (0-11)
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Date string in YYYY-MM-DD format
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): string {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const daysToSubtract = (lastWeekday - weekday + 7) % 7;
    const targetDate = new Date(year, month + 1, 0 - daysToSubtract);
    return targetDate.toISOString().split('T')[0];
}
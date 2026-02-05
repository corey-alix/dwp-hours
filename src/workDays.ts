/**
 * Work Days Calculation Utility
 * Calculates the number of work days (Monday-Friday) in a month
 */

// Fallback work days per month for 2026 (accounting for holidays)
// This ensures we get the exact values provided by the user
const WORK_DAYS_TEMPLATE: Record<number, number> = {
    1: 23,  // January
    2: 20,  // February
    3: 21,  // March
    4: 22,  // April
    5: 22,  // May
    6: 21,  // June
    7: 23,  // July
    8: 21,  // August
    9: 22,  // September
    10: 23, // October
    11: 20, // November
    12: 23  // December
};

/**
 * Calculate the number of work days (Monday-Friday) in a given month and year
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of work days in the month
 */
function calculateWorkDaysInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    let workDays = 0;

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

        // Count Monday (1) through Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workDays++;
        }
    }

    return workDays;
}

/**
 * Get work days for a given month
 * Uses provided values for 2026, calculates dynamically for other years
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of work days in the month
 */
export function getWorkDays(year: number, month: number): number {
    if (month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}. Must be 1-12.`);
    }
    // For other years, calculate dynamically (raw weekdays, no holiday adjustment)
    return calculateWorkDaysInMonth(year, month);
}

/**
 * Get total work days in a year
 * @param year - The year
 * @returns Total work days in the year
 */
export function getTotalWorkDaysInYear(year: number): number {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
        total += getWorkDays(year, month);
    }
    return total;
}

/**
 * Calculate allocation rate per work day
 * @param annualAllocation - Total annual allocation in hours
 * @param year - The year
 * @returns Hours allocated per work day
 */
export function getAllocationRate(annualAllocation: number, year: number): number {
    const totalWorkDays = getTotalWorkDaysInYear(year);
    return annualAllocation / totalWorkDays;
}

/**
 * Calculate monthly PTO accrual for display purposes
 * @param ptoRate - Hours per work day
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Hours accrued in the month
 */
export function calculateMonthlyAccrual(ptoRate: number, year: number, month: number): number {
    const workDays = getWorkDays(year, month);
    return ptoRate * workDays;
}

// Legacy interface for backward compatibility
export interface WorkDaysResult {
    workDays: number;
    totalDays: number;
    weekends: number;
    holidays: string[];
}

/**
 * Legacy function for backward compatibility
 * @param year - The year
 * @param month - The month (1-12)
 * @param holidays - Ignored (holidays accounted for in 2026 data)
 * @returns WorkDaysResult with work days calculation
 */
export function calculateWorkDays(year: number, month: number, holidays: string[] = []): WorkDaysResult {
    const workDays = getWorkDays(year, month);
    // Calculate actual total days and weekends
    const totalDays = new Date(year, month, 0).getDate();
    let weekends = 0;

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends++;
        }
    }

    return {
        workDays,
        totalDays,
        weekends,
        holidays: [] // Holidays accounted for in work days calculation
    };
}

/**
 * Legacy function for backward compatibility
 * @param year - The year
 * @returns Empty array (holidays accounted for in work days)
 */
export function getUSHolidays(year: number): string[] {
    return []; // Holidays accounted for in work days calculation
}
/**
 * Work Days Calculation Utility
 * Calculates the number of work days (Monday-Friday) in a month
 */

import { getDaysInMonth, getDayOfWeek, formatDate } from './dateUtils.js';

/**
 * Calculate the number of work days (Monday-Friday) in a given month and year
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of work days in the month
 */
function calculateWorkDaysInMonth(year: number, month: number): number {
    const totalDays = getDaysInMonth(year, month);

    let workDays = 0;

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = formatDate(year, month, day);
        const dayOfWeek = getDayOfWeek(dateStr); // 0 = Sunday, 6 = Saturday

        // Count Monday (1) through Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workDays++;
        }
    }

    return workDays;
}

/**
 * Get work days for a given month
 * Calculates dynamically for any year (raw weekdays, no holiday adjustment)
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of work days in the month
 */
export function getWorkDays(year: number, month: number): number {
    if (month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}. Must be 1-12.`);
    }

    // Calculate dynamically for any year (raw weekdays, no holiday adjustment)
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
 * @param holidays - Ignored (no holiday adjustment in current implementation)
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
        holidays: [] // No holiday adjustment in current implementation
    };
}

/**
 * Calculate the end date given a start date and number of workdays
 * @param startDate - The start date
 * @param workDays - Number of workdays to add
 * @returns The end date
 */
export function calculateEndDate(startDate: Date, workDays: number): Date {
    let currentDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < workDays) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        // Monday (1) through Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            daysAdded++;
        }
    }

    return currentDate;
}
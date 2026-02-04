/**
 * PTO Calculations Utility
 * Handles all PTO balance calculations, accruals, and projections
 */

import { calculateWorkDays, getUSHolidays } from './workDays.js';

export interface PTOStatus {
    employeeId: number;
    hireDate: Date;
    currentDailyRate: number;
    availablePTO: number;
    usedPTO: number;
    accruedThisYear: number;
    carryoverFromPreviousYear: number;
    nextAccrualDate: Date;
    nextAccrualAmount: number;
    sickTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    bereavementJuryDuty: {
        allowed: number;
        used: number;
        remaining: number;
    };
}

export interface PTOEntry {
    id: number;
    employee_id: number;
    start_date: Date;
    end_date: Date;
    type: 'Sick' | 'Full PTO' | 'Partial PTO' | 'Bereavement' | 'Jury Duty';
    hours: number;
    created_at: Date;
}

export interface Employee {
    id: number;
    name: string;
    identifier: string;
    pto_rate: number;
    carryover_hours: number;
    hire_date: Date;
    role: string;
}

/**
 * Calculate PTO status for an employee
 * @param employee - Employee data
 * @param ptoEntries - All PTO entries for the employee
 * @param currentDate - Current date (defaults to today)
 * @returns PTOStatus object
 */
export function calculatePTOStatus(
    employee: Employee,
    ptoEntries: PTOEntry[],
    currentDate: Date = new Date()
): PTOStatus {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    // Calculate total accrued PTO from hire date to current month
    const totalAccrued = calculateTotalAccruedPTO(employee, currentDate);

    // Calculate used PTO hours
    const usedPTO = calculateUsedPTO(ptoEntries, 'Full PTO', 'Partial PTO');
    const usedSick = calculateUsedPTO(ptoEntries, 'Sick', currentYear);
    const usedBereavementJuryDuty = calculateUsedPTO(ptoEntries, 'Bereavement', 'Jury Duty', currentYear);

    // Calculate available PTO
    const availablePTO = totalAccrued + employee.carryover_hours - usedPTO;

    // Calculate accrued this year (from Jan 1 to current month)
    const yearStart = new Date(currentYear, 0, 1);
    const accruedThisYear = calculateTotalAccruedPTO(employee, currentDate, yearStart);

    // Calculate next accrual
    const nextAccrual = calculateNextAccrual(employee, currentDate);

    return {
        employeeId: employee.id,
        hireDate: employee.hire_date,
        currentDailyRate: employee.pto_rate,
        availablePTO: Math.max(0, availablePTO), // Don't allow negative PTO
        usedPTO,
        accruedThisYear,
        carryoverFromPreviousYear: employee.carryover_hours,
        nextAccrualDate: nextAccrual.date,
        nextAccrualAmount: nextAccrual.amount,
        sickTime: {
            allowed: 24,
            used: usedSick,
            remaining: Math.max(0, 24 - usedSick)
        },
        bereavementJuryDuty: {
            allowed: 40,
            used: usedBereavementJuryDuty,
            remaining: Math.max(0, 40 - usedBereavementJuryDuty)
        }
    };
}

/**
 * Calculate total accrued PTO from hire date to specified date
 * @param employee - Employee data
 * @param toDate - End date for calculation
 * @param fromDate - Start date for calculation (defaults to hire date)
 * @returns Total accrued PTO hours
 */
export function calculateTotalAccruedPTO(
    employee: Employee,
    toDate: Date,
    fromDate?: Date
): number {
    const startDate = fromDate || employee.hire_date;
    let totalAccrued = 0;

    // Calculate monthly accruals
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = toDate.getFullYear();
    const endMonth = toDate.getMonth() + 1;

    for (let year = startYear; year <= endYear; year++) {
        const monthStart = (year === startYear) ? startMonth : 1;
        const monthEnd = (year === endYear) ? endMonth : 12;

        for (let month = monthStart; month <= monthEnd; month++) {
            // Skip future months
            if (year === endYear && month > endMonth) continue;

            // For partial months, prorate the accrual
            let workDays: number;
            if (year === startYear && month === startMonth && startDate.getDate() > 1) {
                // Partial first month
                const daysInMonth = new Date(year, month, 0).getDate();
                const workedDays = daysInMonth - startDate.getDate() + 1;
                const holidays = getUSHolidays(year);
                const monthWorkDays = calculateWorkDays(year, month, holidays).workDays;
                workDays = (workedDays / daysInMonth) * monthWorkDays;
            } else if (year === endYear && month === endMonth && toDate.getDate() < new Date(year, month, 0).getDate()) {
                // Partial current month
                const daysInMonth = new Date(year, month, 0).getDate();
                const workedDays = toDate.getDate();
                const holidays = getUSHolidays(year);
                const monthWorkDays = calculateWorkDays(year, month, holidays).workDays;
                workDays = (workedDays / daysInMonth) * monthWorkDays;
            } else {
                // Full month
                const holidays = getUSHolidays(year);
                workDays = calculateWorkDays(year, month, holidays).workDays;
            }

            totalAccrued += workDays * employee.pto_rate;
        }
    }

    return totalAccrued;
}

/**
 * Calculate used PTO hours for specific types
 * @param ptoEntries - PTO entries
 * @param types - PTO types to include
 * @param year - Optional year filter (for annual resets)
 * @returns Total used hours
 */
export function calculateUsedPTO(ptoEntries: PTOEntry[], ...types: (string | number)[]): number {
    const year = typeof types[types.length - 1] === 'number' ? types.pop() as number : undefined;
    const filteredTypes = types as string[];

    let filteredEntries = ptoEntries.filter(entry => filteredTypes.includes(entry.type));
    if (year !== undefined) {
        filteredEntries = filteredEntries.filter(entry => entry.start_date.getFullYear() === year);
    }

    return filteredEntries.reduce((total, entry) => total + entry.hours, 0);
}

/**
 * Calculate next PTO accrual
 * @param employee - Employee data
 * @param currentDate - Current date
 * @returns Next accrual date and amount
 */
export function calculateNextAccrual(employee: Employee, currentDate: Date): { date: Date; amount: number } {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const holidays = getUSHolidays(nextMonth.getFullYear());
    const workDays = calculateWorkDays(nextMonth.getFullYear(), nextMonth.getMonth() + 1, holidays).workDays;
    const amount = workDays * employee.pto_rate;

    return {
        date: nextMonth,
        amount
    };
}

/**
 * Calculate daily PTO rate based on hire date and tenure
 * This is a simplified implementation - in reality, rates might change based on company policy
 * @param hireDate - Employee hire date
 * @returns Daily PTO rate
 */
export function calculateDailyRate(hireDate: Date): number {
    const now = new Date();
    const yearsOfService = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    // Simplified rate calculation - adjust based on company policy
    if (yearsOfService < 1) return 0.68;
    if (yearsOfService < 5) return 0.69;
    if (yearsOfService < 10) return 0.70;
    return 0.71;
}

/**
 * Calculate year-end carryover for an employee
 * @param employee - Employee data
 * @param ptoEntries - All PTO entries for the employee
 * @param year - The year to calculate carryover for
 * @param carryoverLimit - Maximum carryover allowed (optional)
 * @returns Carryover amount for the next year
 */
export function calculateYearEndCarryover(
    employee: Employee,
    ptoEntries: PTOEntry[],
    year: number,
    carryoverLimit?: number
): number {
    // Calculate total accrued up to year end
    const yearEnd = new Date(year, 11, 31);
    const totalAccrued = calculateTotalAccruedPTO(employee, yearEnd);

    // Calculate used PTO (all time, not just this year)
    const usedPTO = calculateUsedPTO(ptoEntries, 'Full PTO', 'Partial PTO');

    // Available PTO at year end
    const availableAtYearEnd = totalAccrued + employee.carryover_hours - usedPTO;

    // Carryover is the available amount, capped at limit if specified
    const carryover = Math.max(0, availableAtYearEnd);
    return carryoverLimit !== undefined ? Math.min(carryover, carryoverLimit) : carryover;
}

/**
 * Process year-end for an employee (reset annual allocations)
 * This would typically be called at the start of a new year
 * @param employee - Employee data
 * @param newYear - The new year
 * @param carryoverLimit - Maximum carryover allowed
 * @returns Updated employee data with new carryover
 */
export function processYearEnd(
    employee: Employee,
    ptoEntries: PTOEntry[],
    newYear: number,
    carryoverLimit?: number
): { carryover: number; updatedEmployee: Employee } {
    const previousYear = newYear - 1;
    const carryover = calculateYearEndCarryover(employee, ptoEntries, previousYear, carryoverLimit);

    // Update employee with new carryover (previous carryover becomes the new one)
    const updatedEmployee: Employee = {
        ...employee,
        carryover_hours: carryover
    };

    return { carryover, updatedEmployee };
}
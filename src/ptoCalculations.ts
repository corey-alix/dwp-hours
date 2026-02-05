/**
 * PTO Calculations Utility
 * Handles annual PTO allocation with monthly accrual display
 */

import { getWorkDays, getTotalWorkDaysInYear, calculateMonthlyAccrual } from './workDays.js';

export interface PTOStatus {
    employeeId: number;
    hireDate: Date;
    annualAllocation: number; // 96 hours PTO
    availablePTO: number;
    usedPTO: number;
    carryoverFromPreviousYear: number;
    monthlyAccruals: { month: number; hours: number }[]; // For display
    nextRolloverDate: Date;
    sickTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    ptoTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    bereavementTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    juryDutyTime: {
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
    pto_rate: number; // Hours per work day for accrual calculations
    annual_allocation: number; // 96 hours per year
    carryover_hours: number;
    hire_date: Date;
    role: string;
}

/**
 * Calculate prorated annual allocation for new hires
 * @param employee - Employee data
 * @param year - The year to calculate for
 * @returns Prorated allocation amount
 */
function calculateProratedAllocation(employee: Employee, year: number): number {
    if (employee.hire_date.getFullYear() < year) {
        return employee.annual_allocation;
    } else if (employee.hire_date.getFullYear() === year) {
        const hireMonth = employee.hire_date.getMonth(); // 0-11
        if (hireMonth <= 1) {
            return employee.annual_allocation; // Hired in Jan or Feb, full allocation
        }
        const monthsRemaining = 12 - hireMonth + 1;
        return employee.annual_allocation * (monthsRemaining / 12);
    } else {
        return 0; // Hired after the year
    }
}

/**
 * Calculate PTO status for an employee using annual allocation system
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

    // Calculate used hours by type
    const usedPTO = calculateUsedPTO(ptoEntries, 'Full PTO', 'Partial PTO');
    const usedSick = calculateUsedPTO(ptoEntries, 'Sick');
    const usedBereavement = calculateUsedPTO(ptoEntries, 'Bereavement');
    const usedJuryDuty = calculateUsedPTO(ptoEntries, 'Jury Duty');

    const effectiveAnnualAllocation = calculateProratedAllocation(employee, currentYear);

    // Starting PTO balance: prorated allocation + carryover
    const startingPTOBalance = effectiveAnnualAllocation + employee.carryover_hours;

    // Calculate accrued PTO so far this year (from hire date or Jan)
    let accrued = 0;
    const startMonth = Math.max(1, employee.hire_date.getMonth());
    const currentMonth = currentDate.getMonth() + 1;
    for (let month = startMonth; month <= currentMonth; month++) {
        accrued += employee.pto_rate * getWorkDays(currentYear, month);
    }

    // Calculate available PTO
    const availablePTO = startingPTOBalance + accrued - usedPTO;

    // Calculate monthly accruals for display (current year)
    const monthlyAccruals = [];
    for (let month = 1; month <= 12; month++) {
        const hours = employee.pto_rate * getWorkDays(currentYear, month);
        monthlyAccruals.push({ month, hours });
    }

    // For new hires in current year, only accrue from hire month onwards
    let filteredMonthlyAccruals = monthlyAccruals;
    if (employee.hire_date.getFullYear() === currentYear) {
        const hireMonth = Math.max(1, employee.hire_date.getMonth());
        filteredMonthlyAccruals = monthlyAccruals.filter(accrual => accrual.month >= hireMonth);
    }

    // Next rollover is January 1st of next year
    const nextRolloverDate = new Date(currentYear + 1, 0, 1);

    return {
        employeeId: employee.id,
        hireDate: employee.hire_date,
        annualAllocation: effectiveAnnualAllocation,
        availablePTO: Math.max(0, availablePTO), // Don't allow negative PTO
        usedPTO,
        carryoverFromPreviousYear: employee.carryover_hours,
        monthlyAccruals: filteredMonthlyAccruals,
        nextRolloverDate,
        sickTime: {
            allowed: 24,
            used: usedSick,
            remaining: Math.max(0, 24 - usedSick)
        },
        ptoTime: {
            allowed: startingPTOBalance + accrued,
            used: usedPTO,
            remaining: Math.max(0, startingPTOBalance + accrued - usedPTO)
        },
        bereavementTime: {
            allowed: 40,
            used: usedBereavement,
            remaining: Math.max(0, 40 - usedBereavement)
        },
        juryDutyTime: {
            allowed: 40,
            used: usedJuryDuty,
            remaining: Math.max(0, 40 - usedJuryDuty)
        }
    };
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
    // Calculate available PTO at year end
    const usedPTO = calculateUsedPTO(ptoEntries, 'Full PTO', 'Partial PTO');
    const startingPTOBalance = employee.annual_allocation + employee.carryover_hours;
    let accrued = 0;
    for (let month = 1; month <= 12; month++) {
        accrued += employee.pto_rate * getWorkDays(year, month);
    }
    const availableAtYearEnd = startingPTOBalance + accrued - usedPTO;

    // Carryover is the available amount, capped at limit if specified
    const carryover = Math.max(0, availableAtYearEnd);
    return carryoverLimit !== undefined ? Math.min(carryover, carryoverLimit) : carryover;
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
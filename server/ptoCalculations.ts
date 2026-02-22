/**
 * PTO Calculations Utility
 * Handles annual PTO allocation with monthly accrual display
 */

import { getWorkDays, getTotalWorkDaysInYear } from "./workDays.js";
import { parseDate, formatDate, today } from "../shared/dateUtils.js";

export interface PTOStatus {
  employeeId: number;
  hireDate: string;
  annualAllocation: number; // 96 hours PTO
  availablePTO: number;
  usedPTO: number;
  carryoverFromPreviousYear: number;
  monthlyAccruals: { month: number; hours: number }[]; // For display
  nextRolloverDate: string;
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
  date: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  created_at: string;
}

export interface Employee {
  id: number;
  name: string;
  identifier: string;
  pto_rate: number; // Hours per work day for accrual calculations
  carryover_hours: number;
  hire_date: string;
  role: string;
}

/**
 * Calculate prorated annual allocation for new hires
 * @param employee - Employee data
 * @param year - The year to calculate for
 * @returns Prorated allocation amount
 */
function calculateProratedAllocation(employee: Employee, year: number): number {
  const hireDate = parseDate(employee.hire_date);
  if (hireDate.year < year) {
    return 96;
  } else if (hireDate.year === year) {
    if (hireDate.month <= 2) {
      // Jan or Feb (1-based months)
      return 96; // Hired in Jan or Feb, full allocation
    }
    const monthsRemaining = 12 - hireDate.month + 1; // Months from hire month to Dec
    return 96 * (monthsRemaining / 12);
  } else {
    return 0; // Hired after the year
  }
}

/**
 * Calculate PTO status for an employee using annual allocation system
 * @param employee - Employee data
 * @param ptoEntries - All PTO entries for the employee
 * @param currentDate - Current date as YYYY-MM-DD string (defaults to today)
 * @returns PTOStatus object
 */
export function calculatePTOStatus(
  employee: Employee,
  ptoEntries: PTOEntry[],
  currentDate: string = today(),
): PTOStatus {
  const currentDateComponents = parseDate(currentDate);
  const currentYear = currentDateComponents.year;

  // Calculate used hours by type (all filtered to current year)
  const usedPTO = calculateUsedPTO(ptoEntries, "PTO", currentYear);
  const usedSick = calculateUsedPTO(ptoEntries, "Sick", currentYear);
  const usedBereavement = calculateUsedPTO(
    ptoEntries,
    "Bereavement",
    currentYear,
  );
  const usedJuryDuty = calculateUsedPTO(ptoEntries, "Jury Duty", currentYear);

  const effectiveAnnualAllocation = calculateProratedAllocation(
    employee,
    currentYear,
  );

  // Starting PTO balance: prorated allocation + carryover
  const startingPTOBalance =
    effectiveAnnualAllocation + employee.carryover_hours;

  // Available PTO = starting balance - used PTO
  const availablePTO = startingPTOBalance - usedPTO;

  // Calculate monthly accruals for display (current year) - informational only
  // Use fixed allocation rate: 96 hours / total work days in year
  const totalWorkDays = getTotalWorkDaysInYear(currentYear);
  const allocationRate = 96 / totalWorkDays;

  const monthlyAccruals = [];
  for (let month = 1; month <= 12; month++) {
    const hours = allocationRate * getWorkDays(currentYear, month);
    monthlyAccruals.push({ month, hours });
  }

  // For new hires in current year, only show accruals from hire month onwards
  let filteredMonthlyAccruals = monthlyAccruals;
  const hireDate = parseDate(employee.hire_date);
  if (hireDate.year === currentYear) {
    const hireMonth = hireDate.month; // Already 1-based
    filteredMonthlyAccruals = monthlyAccruals.filter(
      (accrual) => accrual.month >= hireMonth,
    );
  }

  // Next rollover is January 1st of next year
  const nextRolloverDate = formatDate(currentYear + 1, 1, 1);

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
      remaining: Math.max(0, 24 - usedSick),
    },
    ptoTime: {
      allowed: startingPTOBalance,
      used: usedPTO,
      remaining: Math.max(0, startingPTOBalance - usedPTO),
    },
    bereavementTime: {
      allowed: 40,
      used: usedBereavement,
      remaining: Math.max(0, 40 - usedBereavement),
    },
    juryDutyTime: {
      allowed: 40,
      used: usedJuryDuty,
      remaining: Math.max(0, 40 - usedJuryDuty),
    },
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
  carryoverLimit?: number,
): number {
  // Calculate used PTO for the year
  const usedPTO = calculateUsedPTO(ptoEntries, "PTO", year);

  // Starting balance: annual allocation + carryover from previous year
  const hireDate = parseDate(employee.hire_date);
  const annualAllocation = hireDate.year <= year ? 96 : 0;
  const startingBalance = annualAllocation + employee.carryover_hours;

  // Available at year end = starting balance - used PTO
  const availableAtYearEnd = Math.max(0, startingBalance - usedPTO);

  // Carryover is the available amount, capped at limit if specified
  const carryover = availableAtYearEnd;
  return carryoverLimit !== undefined
    ? Math.min(carryover, carryoverLimit)
    : carryover;
}

/**
 * Calculate used PTO hours for specific types
 * @param ptoEntries - PTO entries
 * @param types - PTO types to include
 * @param year - Optional year filter (for annual resets)
 * @returns Total used hours
 */
export function calculateUsedPTO(
  ptoEntries: PTOEntry[],
  ...types: (string | number)[]
): number {
  const year =
    typeof types[types.length - 1] === "number"
      ? (types.pop() as number)
      : undefined;
  const filteredTypes = types as string[];

  let filteredEntries = ptoEntries.filter((entry) =>
    filteredTypes.includes(entry.type),
  );
  if (year !== undefined) {
    filteredEntries = filteredEntries.filter((entry) => {
      const entryDate = parseDate(entry.date);
      return entryDate.year === year;
    });
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
  carryoverLimit?: number,
): { carryover: number; updatedEmployee: Employee } {
  const previousYear = newYear - 1;
  const carryover = calculateYearEndCarryover(
    employee,
    ptoEntries,
    previousYear,
    carryoverLimit,
  );

  // Update employee with new carryover (previous carryover becomes the new one)
  const updatedEmployee: Employee = {
    ...employee,
    carryover_hours: carryover,
  };

  return { carryover, updatedEmployee };
}

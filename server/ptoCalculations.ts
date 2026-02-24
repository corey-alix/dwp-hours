/**
 * PTO Calculations Utility
 * Handles annual PTO allocation with monthly accrual display
 */

import { getWorkDays } from "./workDays.js";
import { parseDate, formatDate, today } from "../shared/dateUtils.js";
import {
  getEffectivePtoRate,
  computeAnnualAllocation,
  CARRYOVER_LIMIT,
  BUSINESS_RULES_CONSTANTS,
} from "../shared/businessRules.js";

export interface PTOStatus {
  employeeId: number;
  hireDate: string;
  annualAllocation: number; // derived from employee.pto_rate * work days (default: tier-0 daily rate from PTO_EARNING_SCHEDULE)
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
 * Calculate prorated annual allocation for new hires.
 * Uses policy-based rates from PTO_EARNING_SCHEDULE via computeAnnualAllocation.
 * @param employee - Employee data
 * @param year - The year to calculate for
 * @returns Prorated allocation amount
 */
function calculateProratedAllocation(employee: Employee, year: number): number {
  return computeAnnualAllocation(employee.hire_date, year);
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
  // Use policy-based rate that accounts for mid-year July 1 rate changes
  const monthlyAccruals = [];
  for (let month = 1; month <= 12; month++) {
    // Use rate effective at the end of each month for that month's accrual
    const monthEnd = formatDate(
      currentYear,
      month,
      month === 2 ? 28 : [4, 6, 9, 11].includes(month) ? 30 : 31,
    );
    const rate = getEffectivePtoRate(employee.hire_date, monthEnd);
    const hours = rate.dailyRate * getWorkDays(currentYear, month);
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
      allowed: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT,
      used: usedBereavement,
      remaining: Math.max(
        0,
        BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT - usedBereavement,
      ),
    },
    juryDutyTime: {
      allowed: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY,
      used: usedJuryDuty,
      remaining: Math.max(
        0,
        BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY - usedJuryDuty,
      ),
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

  // Starting balance: policy-based annual allocation + carryover from previous year
  const annualAllocation = computeAnnualAllocation(employee.hire_date, year);
  const startingBalance = annualAllocation + employee.carryover_hours;

  // Available at year end = starting balance - used PTO
  const availableAtYearEnd = Math.max(0, startingBalance - usedPTO);

  // Apply carryover cap (default to policy limit)
  const limit = carryoverLimit ?? CARRYOVER_LIMIT;
  return Math.min(availableAtYearEnd, limit);
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

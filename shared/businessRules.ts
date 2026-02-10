import { getDayOfWeek } from "./dateUtils.js";
import { parseDate, formatDate } from "./dateUtils.js";

export type PTOType = "Sick" | "PTO" | "Bereavement" | "Jury Duty";

export interface ValidationError {
  field: string;
  messageKey: string;
}

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
  type: PTOType;
  hours: number;
  created_at: string;
}

export interface Employee {
  id: number;
  name: string;
  identifier: string;
  pto_rate: number;
  carryover_hours: number;
  hire_date: string;
  role: string;
}

// Business rules constants
export const BUSINESS_RULES_CONSTANTS = {
  HOUR_INCREMENT: 4,
  WEEKEND_DAYS: [0, 6] as number[], // Sunday = 0, Saturday = 6
  ANNUAL_LIMITS: {
    SICK: 24,
    OTHER: 40, // Bereavement and Jury Duty
  },
  FUTURE_LIMIT: {
    YEARS_AHEAD: 1,
    END_OF_YEAR_MONTH: 11, // December (0-based)
    END_OF_YEAR_DAY: 31,
  },
} as const;

export const VALIDATION_MESSAGES = {
  "hours.invalid": "Hours must be in 4-hour increments",
  "hours.not_integer": "Hours must be a whole number",
  "date.weekday": "Date must be a weekday (Monday to Friday)",
  "pto.duplicate":
    "A PTO entry of this type already exists for this employee on this date",
  "type.invalid": "Invalid PTO type",
  "date.invalid": "Invalid date format",
  "employee.not_found": "Employee not found",
  "entry.not_found": "PTO entry not found",
  "hours.exceed_annual_sick": "Sick time cannot exceed 24 hours annually",
  "hours.exceed_annual_other":
    "Bereavement/Jury Duty cannot exceed 40 hours annually",
  "hours.exceed_pto_balance": "PTO request exceeds available PTO balance",
  "date.future_limit": "Entries cannot be made into the next year",
  "month.acknowledged":
    "This month has been acknowledged by the administrator and is no longer editable",
} as const;

export type MessageKey = keyof typeof VALIDATION_MESSAGES;

/**
 * Validates that hours are positive and in 4-hour increments
 */
export function validateHours(hours: number): ValidationError | null {
  if (!Number.isInteger(hours)) {
    return { field: "hours", messageKey: "hours.not_integer" };
  }
  if (hours <= 0 || hours % BUSINESS_RULES_CONSTANTS.HOUR_INCREMENT !== 0) {
    return { field: "hours", messageKey: "hours.invalid" };
  }
  return null;
}

/**
 * Validates that date is a weekday (Monday to Friday)
 */
export function validateWeekday(dateStr: string): ValidationError | null {
  const day = getDayOfWeek(dateStr); // 0 = Sunday, 6 = Saturday
  if (BUSINESS_RULES_CONSTANTS.WEEKEND_DAYS.includes(day)) {
    return { field: "date", messageKey: "date.weekday" };
  }
  return null;
}

/**
 * Validates PTO type
 */
export function validatePTOType(type: string): ValidationError | null {
  const validTypes: PTOType[] = ["Sick", "PTO", "Bereavement", "Jury Duty"];
  if (!validTypes.includes(type as PTOType)) {
    return { field: "type", messageKey: "type.invalid" };
  }
  return null;
}

/**
 * Normalizes PTO type (handles legacy 'Full PTO', 'Partial PTO')
 */
export function normalizePTOType(type: string): PTOType {
  if (type === "Full PTO" || type === "Partial PTO") {
    return "PTO";
  }
  return type as PTOType;
}

/**
 * Checks if date string is valid
 */
export function validateDateString(dateStr: string): ValidationError | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { field: "date", messageKey: "date.invalid" };
  }
  return null;
}

/**
 * Validates annual hour limits (requires total hours for the year)
 * For PTO type, validates against available balance if provided
 */
export function validateAnnualLimits(
  type: PTOType,
  hours: number,
  totalAnnualHours: number,
  availableBalance?: number,
): ValidationError | null {
  if (type === "PTO" && availableBalance !== undefined) {
    if (hours > availableBalance) {
      return { field: "hours", messageKey: "hours.exceed_pto_balance" };
    }
  } else {
    if (
      type === "Sick" &&
      totalAnnualHours + hours > BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK
    ) {
      return { field: "hours", messageKey: "hours.exceed_annual_sick" };
    }
    if (
      (type === "Bereavement" || type === "Jury Duty") &&
      totalAnnualHours + hours > BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.OTHER
    ) {
      return { field: "hours", messageKey: "hours.exceed_annual_other" };
    }
  }
  return null;
}

/**
 * Validates that PTO request does not exceed available PTO balance
 */
export function validatePTOBalance(
  requestedHours: number,
  availableBalance: number,
): ValidationError | null {
  if (requestedHours > availableBalance) {
    return { field: "hours", messageKey: "hours.exceed_pto_balance" };
  }
  return null;
}

/**
 * Validates that the date is not into the next year
 */
export function validateDateFutureLimit(date: Date): ValidationError | null {
  const now = new Date();
  const nextYear = new Date(
    now.getFullYear() + BUSINESS_RULES_CONSTANTS.FUTURE_LIMIT.YEARS_AHEAD,
    BUSINESS_RULES_CONSTANTS.FUTURE_LIMIT.END_OF_YEAR_MONTH,
    BUSINESS_RULES_CONSTANTS.FUTURE_LIMIT.END_OF_YEAR_DAY,
  ); // End of next year
  if (date > nextYear) {
    return { field: "date", messageKey: "date.future_limit" };
  }
  return null;
}

/**
 * Validates that the month is not acknowledged (editable)
 */
export function validateMonthEditable(
  isAcknowledged: boolean,
): ValidationError | null {
  if (isAcknowledged) {
    return { field: "month", messageKey: "month.acknowledged" };
  }
  return null;
}

// Helper functions for PTO calculations

function calculateUsedPTO(ptoEntries: PTOEntry[], type: PTOType): number {
  return ptoEntries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + entry.hours, 0);
}

function calculateProratedAllocation(employee: Employee, year: number): number {
  const hireDate = parseDate(employee.hire_date);
  const hireYear = hireDate.year;

  if (hireYear < year) {
    // Hired before this year - full allocation
    return 96;
  } else if (hireYear === year) {
    // Hired this year - prorated allocation
    const totalWorkDays = getTotalWorkDaysInYear(year);
    const workDaysFromHire = getWorkDaysFromDate(hireDate, year);
    return (workDaysFromHire / totalWorkDays) * 96;
  } else {
    // Hired after this year - no allocation yet
    return 0;
  }
}

function getWorkDaysFromDate(
  date: { year: number; month: number; day: number },
  year: number,
): number {
  let totalWorkDays = 0;
  for (let month = date.month; month <= 12; month++) {
    totalWorkDays += getWorkDays(year, month);
  }
  // Subtract days before hire date in hire month
  const daysInMonth = new Date(year, date.month, 0).getDate();
  const workDaysBeforeHire = getWorkDaysInMonthRange(
    year,
    date.month,
    1,
    date.day - 1,
  );
  totalWorkDays -= workDaysBeforeHire;
  return totalWorkDays;
}

function getWorkDays(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday or Saturday
      workDays++;
    }
  }
  return workDays;
}

function getTotalWorkDaysInYear(year: number): number {
  let total = 0;
  for (let month = 1; month <= 12; month++) {
    total += getWorkDays(year, month);
  }
  return total;
}

function getWorkDaysInMonthRange(
  year: number,
  month: number,
  startDay: number,
  endDay: number,
): number {
  let workDays = 0;
  for (let day = startDay; day <= endDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
  }
  return workDays;
}

/**
 * Calculate PTO status for an employee
 */
export function calculatePTOStatus(
  employee: Employee,
  ptoEntries: PTOEntry[],
  currentDate: string = new Date().toISOString().split("T")[0],
): PTOStatus {
  const currentDateComponents = parseDate(currentDate);
  const currentYear = currentDateComponents.year;

  // Calculate used hours by type
  const usedPTO = calculateUsedPTO(ptoEntries, "PTO");
  const usedSick = calculateUsedPTO(ptoEntries, "Sick");
  const usedBereavement = calculateUsedPTO(ptoEntries, "Bereavement");
  const usedJuryDuty = calculateUsedPTO(ptoEntries, "Jury Duty");

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

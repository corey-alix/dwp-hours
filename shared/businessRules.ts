import { getDayOfWeek, getWorkdaysBetween } from "./dateUtils.js";
import type { PtoBalanceData } from "./api-models.d.ts";

export type PTOType = "Sick" | "PTO" | "Bereavement" | "Jury Duty";

export interface ValidationError {
  field: string;
  messageKey: string;
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

export const SUCCESS_MESSAGES = {
  "pto.created": "PTO request processed successfully",
  "auth.link_sent": "If the email exists, a magic link has been sent.",
} as const;

export const UI_ERROR_MESSAGES = {
  failed_to_refresh_pto_data: "Failed to refresh PTO data",
  failed_to_load_pto_status: "Failed to load PTO status",
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

/**
 * Computes PTO accrued from the start of the fiscal year to the current date.
 * @param ptoRate - hours accrued per work day
 * @param fiscalYearStart - YYYY-MM-DD string for the beginning of the fiscal year
 * @param currentDate - YYYY-MM-DD string (today)
 * @returns total hours accrued = ptoRate × number of workdays between fiscalYearStart and currentDate
 */
export function computeAccrualToDate(
  ptoRate: number,
  fiscalYearStart: string,
  currentDate: string,
): number {
  const workdays = getWorkdaysBetween(fiscalYearStart, currentDate);
  return ptoRate * workdays.length;
}

/**
 * Computes PTO balance data for an employee based on used hours from PTO entries
 */
export function computeEmployeeBalanceData(
  employeeId: number,
  employeeName: string,
  ptoEntries: Array<{ employee_id: number; type: PTOType; hours: number }>,
): PtoBalanceData {
  const categories: PTOType[] = ["PTO", "Sick", "Bereavement", "Jury Duty"];
  const limits: Record<PTOType, number> = {
    PTO: 80, // Standard PTO annual limit
    Sick: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK,
    Bereavement: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.OTHER,
    "Jury Duty": BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.OTHER,
  };

  const used = categories.reduce(
    (acc, cat) => {
      acc[cat] = ptoEntries
        .filter(
          (entry) => entry.employee_id === employeeId && entry.type === cat,
        )
        .reduce((sum, entry) => sum + entry.hours, 0);
      return acc;
    },
    {} as Record<PTOType, number>,
  );

  const categoryItems = categories.map((cat) => ({
    category: cat,
    remaining: limits[cat] - used[cat],
  }));

  return {
    employeeId,
    employeeName,
    categories: categoryItems,
  };
}

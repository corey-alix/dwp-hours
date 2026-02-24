import {
  getDayOfWeek,
  getWorkdaysBetween,
  parseDate,
  formatDate,
} from "./dateUtils.js";
import type { PtoBalanceData } from "./api-models.d.ts";

export type PTOType = "Sick" | "PTO" | "Bereavement" | "Jury Duty";

/** Canonical month name list (1-indexed via `MONTH_NAMES[monthNumber - 1]`). */
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface ValidationError {
  field: string;
  messageKey: string;
}

/**
 * Extended validation error that includes month-lock metadata.
 * Returned by `validateMonthEditable` when a month is locked.
 */
export interface MonthLockValidationError extends ValidationError {
  lockedBy: string;
  lockedAt: string;
}

/** Information about an admin month lock. */
export interface MonthLockInfo {
  adminName: string;
  acknowledgedAt: string;
}

// Business rules constants
export const BUSINESS_RULES_CONSTANTS = {
  HOUR_INCREMENT: 4,
  WEEKEND_DAYS: [0, 6] as number[], // Sunday = 0, Saturday = 6
  /** Default annual PTO allocation for new hires (hours). */
  BASELINE_PTO_HOURS_PER_YEAR: 96,
  ANNUAL_LIMITS: {
    PTO: 80,
    SICK: 24,
    OTHER: 40, // Bereavement and Jury Duty
  },
  FUTURE_LIMIT: {
    YEARS_AHEAD: 1,
    END_OF_YEAR_MONTH: 11, // December (0-based)
    END_OF_YEAR_DAY: 31,
  },
  /** Inactivity threshold (ms) before the app treats a visit as a new session. */
  SESSION_INACTIVITY_THRESHOLD_MS: 8 * 60 * 60 * 1000, // 8 hours
  /** Auto-dismiss timeout (ms) for toast notifications before they are considered "not seen". */
  NOTIFICATION_AUTO_DISMISS_MS: 5 * 1000, // 5 seconds
  /** Number of days after which unread notifications expire and are no longer shown. */
  NOTIFICATION_EXPIRY_DAYS: 30,
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
  "month.locked":
    "This month was locked by {lockedBy} on {lockedAt} and is no longer editable",
  "employee.not_acknowledged":
    "Employee must acknowledge this month before admin can lock it",
  "month.not_ended":
    "This month has not ended yet. Admin can lock starting {earliestDate}",
  "month.admin_locked_cannot_unlock":
    "This month has been locked by the administrator and cannot be unlocked",
} as const;

export const SUCCESS_MESSAGES = {
  "pto.created": "PTO request processed successfully",
  "auth.link_sent": "If the email exists, a magic link has been sent.",
  "notification.calendar_lock_sent":
    "Notification sent — employee will be reminded to lock their calendar.",
} as const;

export const NOTIFICATION_MESSAGES = {
  calendar_lock_reminder: "Please review and lock your calendar for {month}.",
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
 * Validates that the month is not acknowledged (editable).
 * When `lockInfo` is provided the returned error carries the admin name
 * and timestamp so the caller can surface a descriptive message.
 */
export function validateMonthEditable(
  isAcknowledged: boolean,
  lockInfo?: MonthLockInfo,
): MonthLockValidationError | null {
  if (isAcknowledged) {
    if (lockInfo) {
      return {
        field: "month",
        messageKey: "month.locked",
        lockedBy: lockInfo.adminName,
        lockedAt: lockInfo.acknowledgedAt,
      };
    }
    return {
      field: "month",
      messageKey: "month.acknowledged",
      lockedBy: "unknown",
      lockedAt: "unknown",
    };
  }
  return null;
}

/**
 * Formats the `month.locked` message by substituting placeholders.
 */
export function formatLockedMessage(
  lockedBy: string,
  lockedAt: string,
): string {
  return VALIDATION_MESSAGES["month.locked"]
    .replace("{lockedBy}", lockedBy)
    .replace("{lockedAt}", lockedAt);
}

/**
 * Validates that an admin can lock a month.
 * The month must have fully ended (current date >= 1st of the following month).
 * @param month - YYYY-MM string
 * @param currentDate - YYYY-MM-DD string (today)
 * @returns ValidationError if the month has not ended, null otherwise
 */
export function validateAdminCanLockMonth(
  month: string,
  currentDate: string,
): ValidationError | null {
  // Parse month string "YYYY-MM" to get the first day of the next month
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return { field: "month", messageKey: "date.invalid" };
  }
  const year = parseInt(match[1], 10);
  const mo = parseInt(match[2], 10);

  // First day of the month AFTER the target month
  let nextYear = year;
  let nextMonth = mo + 1;
  if (nextMonth > 12) {
    nextYear++;
    nextMonth = 1;
  }
  const earliestDate = formatDate(nextYear, nextMonth, 1);

  // Current date must be >= earliestDate
  if (currentDate < earliestDate) {
    return { field: "month", messageKey: "month.not_ended" };
  }
  return null;
}

/**
 * Formats the `month.not_ended` message by substituting the {earliestDate} placeholder.
 */
export function formatMonthNotEndedMessage(earliestDate: string): string {
  return VALIDATION_MESSAGES["month.not_ended"].replace(
    "{earliestDate}",
    earliestDate,
  );
}

/**
 * Computes the earliest date an admin can lock a given month.
 * @param month - YYYY-MM string
 * @returns YYYY-MM-DD string for the 1st of the following month
 */
export function getEarliestAdminLockDate(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return "";
  const year = parseInt(match[1], 10);
  const mo = parseInt(match[2], 10);
  let nextYear = year;
  let nextMonth = mo + 1;
  if (nextMonth > 12) {
    nextYear++;
    nextMonth = 1;
  }
  return formatDate(nextYear, nextMonth, 1);
}

/**
 * Returns the YYYY-MM string for the month immediately before the given date.
 * @param currentDate - YYYY-MM-DD string
 * @returns YYYY-MM string for the prior month
 */
export function getPriorMonth(currentDate: string): string {
  const { year, month } = parseDate(currentDate);
  let priorMonth = month - 1;
  let priorYear = year;
  if (priorMonth < 1) {
    priorMonth = 12;
    priorYear--;
  }
  return `${priorYear.toString().padStart(4, "0")}-${priorMonth.toString().padStart(2, "0")}`;
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
    PTO: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.PTO,
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

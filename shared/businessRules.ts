import {
  getDayOfWeek,
  getWorkdaysBetween,
  parseDate,
  formatDate,
  compareDates,
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

// ── Auto-Provision Allow-List ──

/** Email domains allowed for automatic user provisioning on first login. */
export const ALLOWED_EMAIL_DOMAINS: readonly string[] = ["example.com"];

/**
 * Checks whether an email address belongs to an allowed domain.
 * Comparison is case-insensitive.
 *
 * @param email - The full email address to check
 * @returns `true` if the domain is in `ALLOWED_EMAIL_DOMAINS`
 */
export function isAllowedEmailDomain(email: string): boolean {
  if (typeof email !== "string" || !email.includes("@")) return false;
  const domain = email.split("@").pop()!.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => d.toLowerCase() === domain);
}

// ── PTO Earning Schedule (from POLICY.md) ──

export interface PtoRateTier {
  /** Minimum completed years of service (inclusive). */
  minYears: number;
  /** Maximum completed years of service (exclusive). Use Infinity for the final tier. */
  maxYears: number;
  /** Total eligible PTO hours per service year. */
  annualHours: number;
  /** Hours accrued per work day. */
  dailyRate: number;
}

/**
 * Official PTO earning schedule.
 * Rate increases on July 1 — see `getEffectivePtoRate` for timing rules.
 */
export const PTO_EARNING_SCHEDULE: readonly PtoRateTier[] = [
  { minYears: 0, maxYears: 1, annualHours: 168, dailyRate: 0.65 },
  { minYears: 1, maxYears: 2, annualHours: 176, dailyRate: 0.68 },
  { minYears: 2, maxYears: 3, annualHours: 184, dailyRate: 0.71 },
  { minYears: 3, maxYears: 4, annualHours: 192, dailyRate: 0.74 },
  { minYears: 4, maxYears: 5, annualHours: 200, dailyRate: 0.77 },
  { minYears: 5, maxYears: 6, annualHours: 208, dailyRate: 0.8 },
  { minYears: 6, maxYears: 7, annualHours: 216, dailyRate: 0.83 },
  { minYears: 7, maxYears: 8, annualHours: 224, dailyRate: 0.86 },
  { minYears: 8, maxYears: 9, annualHours: 232, dailyRate: 0.89 },
  { minYears: 9, maxYears: Infinity, annualHours: 240, dailyRate: 0.92 },
] as const;

/** Maximum daily accrual rate (9+ years of service). */
export const MAX_DAILY_RATE = 0.92;

/** Maximum annual PTO entitlement in hours. */
export const MAX_ANNUAL_PTO = 240;

/** Maximum hours that may carry over from the prior year without admin approval. */
export const CARRYOVER_LIMIT = 80;

/** Number of sick days (at 8 hrs/day = 24 hrs) before PTO must be used. */
export const SICK_HOURS_BEFORE_PTO = 24;

/** Number of consecutive bereavement days before PTO must be used. */
export const BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO = 2;

// Business rules constants
export const BUSINESS_RULES_CONSTANTS = {
  HOUR_INCREMENT: 4,
  WEEKEND_DAYS: [0, 6] as number[], // Sunday = 0, Saturday = 6
  ANNUAL_LIMITS: {
    PTO: CARRYOVER_LIMIT,
    SICK: SICK_HOURS_BEFORE_PTO,
    /** @deprecated Use BEREAVEMENT or JURY_DUTY instead */
    OTHER: 16,
    /** 2 consecutive days × 8 hrs per policy bereavement rule */
    BEREAVEMENT: 16,
    /** 3 days × 8 hrs per policy jury-duty rule (same as sick) */
    JURY_DUTY: 24,
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
  "hours.exceed_annual_bereavement":
    "Bereavement cannot exceed 16 hours (2 days) annually",
  "hours.exceed_annual_jury_duty":
    "Jury Duty cannot exceed 24 hours (3 days) annually",
  /** @deprecated Use hours.exceed_annual_bereavement or hours.exceed_annual_jury_duty */
  "hours.exceed_annual_other":
    "Bereavement/Jury Duty cannot exceed allowed hours annually",
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
  "hours.exceed_carryover":
    "Carryover cannot exceed 80 hours from the prior year",
  "pto.rate_not_found":
    "Unable to determine PTO rate for the given hire date and date",
  "sick.pto_required_after_threshold":
    "Sick time has exceeded 24 hours (3 days) this year — PTO must be used for additional absences",
  "bereavement.pto_required_after_threshold":
    "Bereavement has exceeded 2 consecutive days — PTO must be used for additional absences",
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
      type === "Bereavement" &&
      totalAnnualHours + hours >
        BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT
    ) {
      return { field: "hours", messageKey: "hours.exceed_annual_bereavement" };
    }
    if (
      type === "Jury Duty" &&
      totalAnnualHours + hours >
        BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY
    ) {
      return { field: "hours", messageKey: "hours.exceed_annual_jury_duty" };
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
 * Computes PTO balance data for an employee based on used hours from PTO entries.
 *
 * @param ptoAllowance - When provided, overrides the default PTO annual limit
 *   (CARRYOVER_LIMIT = 80) with the employee's actual allowance
 *   (annualAllocation + carryover). This gives accurate remaining-balance
 *   values instead of the generic cap.
 */
export function computeEmployeeBalanceData(
  employeeId: number,
  employeeName: string,
  ptoEntries: Array<{ employee_id: number; type: PTOType; hours: number }>,
  ptoAllowance?: number,
): PtoBalanceData {
  const categories: PTOType[] = ["PTO", "Sick", "Bereavement", "Jury Duty"];
  const limits: Record<PTOType, number> = {
    PTO: ptoAllowance ?? BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.PTO,
    Sick: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK,
    Bereavement: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT,
    "Jury Duty": BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY,
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

// ── PTO Rate Lookup Functions ──────────────────────────────────────────

/**
 * Computes completed years of service between a hire date and a reference date.
 * Uses string-based date comparison (YYYY-MM-DD) — no Date objects.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param asOfDate - YYYY-MM-DD reference date (typically today)
 * @returns Whole number of completed years (floored)
 */
export function getYearsOfService(hireDate: string, asOfDate: string): number {
  const hire = parseDate(hireDate);
  const asOf = parseDate(asOfDate);

  let years = asOf.year - hire.year;

  // If the anniversary hasn't occurred yet this year, subtract one
  if (
    asOf.month < hire.month ||
    (asOf.month === hire.month && asOf.day < hire.day)
  ) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * Looks up the PTO rate tier for a given number of completed years of service.
 *
 * @param yearsOfService - Completed whole years of service
 * @returns The matching tier's annual hours and daily rate
 */
export function getPtoRateTier(yearsOfService: number): PtoRateTier {
  const tier = PTO_EARNING_SCHEDULE.find(
    (t) => yearsOfService >= t.minYears && yearsOfService < t.maxYears,
  );
  if (!tier) {
    // Fallback to the max tier (should never happen due to Infinity)
    return PTO_EARNING_SCHEDULE[PTO_EARNING_SCHEDULE.length - 1];
  }
  return tier;
}

/**
 * Returns the effective PTO rate for an employee on a given date,
 * accounting for the July 1 rate-increase timing rule from POLICY.md.
 *
 * **July 1 Rule**:
 * - Hired Jan 1 – Jun 30: rate increases on July 1 following one full year of service.
 * - Hired Jul 1 – Dec 31: rate increases on July 1 of the following calendar year.
 *
 * In both cases the rate increase coincides with the first July 1 on or after
 * the employee's first anniversary, then every subsequent July 1.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param asOfDate - YYYY-MM-DD reference date (typically today)
 * @returns The effective tier (annualHours + dailyRate)
 */
export function getEffectivePtoRate(
  hireDate: string,
  asOfDate: string,
): PtoRateTier {
  const hire = parseDate(hireDate);
  const asOf = parseDate(asOfDate);

  // Determine number of July-1 rate bumps that have occurred.
  // First bump happens on the first July 1 on-or-after the first anniversary.
  const firstAnniversary = formatDate(hire.year + 1, hire.month, hire.day);

  // The first July 1 that is >= the first anniversary
  let firstBumpYear: number;
  if (hire.month <= 6) {
    // Hired Jan–Jun: first anniversary is in the same month next year.
    // First July 1 on-or-after anniversary is July 1 of anniversary year.
    firstBumpYear = hire.year + 1;
  } else {
    // Hired Jul–Dec: first anniversary is in month >= 7 next year.
    // First July 1 on-or-after that anniversary is July 1 of year+2.
    firstBumpYear = hire.year + 2;
  }

  const firstBumpDate = formatDate(firstBumpYear, 7, 1);

  // If asOfDate is before the first bump, employee is in tier 0
  if (compareDates(asOfDate, firstBumpDate) < 0) {
    return getPtoRateTier(0);
  }

  // Count how many July 1 bumps have occurred (including the first one)
  const bumpCount = asOf.year - firstBumpYear + (asOf.month >= 7 ? 1 : 0);
  // bumpCount === effective years-of-service for tier lookup (minimum 1)
  const effectiveYears = Math.max(1, bumpCount);

  return getPtoRateTier(effectiveYears);
}

// ── Phase 2: Accrual Calculation Functions ─────────────────────────────

/**
 * Computes PTO accrued from a fiscal-year start to a reference date,
 * automatically deriving the daily rate from the employee's hire date
 * and handling the mid-year rate change on July 1.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param fiscalYearStart - YYYY-MM-DD start of the accrual period
 * @param currentDate - YYYY-MM-DD reference date (typically today)
 * @returns total hours accrued, accounting for rate changes on July 1
 */
export function computeAccrualWithHireDate(
  hireDate: string,
  fiscalYearStart: string,
  currentDate: string,
): number {
  const start = parseDate(fiscalYearStart);
  const end = parseDate(currentDate);

  // Determine if a July 1 rate change falls within the period
  const july1 = formatDate(start.year, 7, 1);
  const rateBeforeJuly1 = getEffectivePtoRate(
    hireDate,
    formatDate(start.year, 6, 30),
  );
  const rateAfterJuly1 = getEffectivePtoRate(hireDate, july1);

  const rateChanged = rateBeforeJuly1.dailyRate !== rateAfterJuly1.dailyRate;
  const july1InRange =
    compareDates(july1, fiscalYearStart) > 0 &&
    compareDates(july1, currentDate) <= 0;

  if (rateChanged && july1InRange) {
    // Split into two segments: start→Jun30 and Jul1→currentDate
    const june30 = formatDate(start.year, 6, 30);
    const segment1Days = getWorkdaysBetween(fiscalYearStart, june30);
    const segment2Days = getWorkdaysBetween(july1, currentDate);
    return (
      rateBeforeJuly1.dailyRate * segment1Days.length +
      rateAfterJuly1.dailyRate * segment2Days.length
    );
  }

  // No mid-period rate change — use the rate effective at currentDate
  const rate = getEffectivePtoRate(hireDate, currentDate);
  const workdays = getWorkdaysBetween(fiscalYearStart, currentDate);
  return rate.dailyRate * workdays.length;
}

/**
 * Computes the annual PTO allocation for an employee in a given year.
 * - First year (hire year): pro-rated as dailyRate × workdays(hireDate, Dec 31).
 * - Subsequent years: full annual entitlement from the earning schedule.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param year - Calendar year to compute for
 * @returns Total PTO hours allocated for the year
 */
export function computeAnnualAllocation(
  hireDate: string,
  year: number,
): number {
  const hire = parseDate(hireDate);

  if (hire.year > year) {
    return 0; // Not yet hired
  }

  const yearEnd = formatDate(year, 12, 31);

  if (hire.year === year) {
    // First year: pro-rate from hire date to Dec 31
    const rate = getEffectivePtoRate(hireDate, yearEnd);
    const workdays = getWorkdaysBetween(hireDate, yearEnd);
    return rate.dailyRate * workdays.length;
  }

  // Subsequent years: use rate effective at end of year for annual hours.
  // Account for mid-year rate change by splitting at July 1.
  const jan1 = formatDate(year, 1, 1);
  return computeAccrualWithHireDate(hireDate, jan1, yearEnd);
}

/**
 * Caps prior-year balance at the carryover limit.
 *
 * @param priorYearBalance - Remaining PTO hours from the prior year
 * @returns Capped carryover amount (max CARRYOVER_LIMIT)
 */
export function computeCarryover(priorYearBalance: number): number {
  return Math.min(Math.max(0, priorYearBalance), CARRYOVER_LIMIT);
}

// ── Phase 3: Soft Warning Threshold Checks ─────────────────────────────

/**
 * Checks whether a sick-time request would push total sick hours past
 * the 24-hour (3-day) threshold. Returns a warning message string
 * if so, or null if within threshold.
 *
 * @param totalSickHoursUsed - Sick hours already used this year
 * @param requestedHours - Hours being requested
 * @returns Warning message string, or null
 */
export function checkSickDayThreshold(
  totalSickHoursUsed: number,
  requestedHours: number,
): string | null {
  if (totalSickHoursUsed + requestedHours > SICK_HOURS_BEFORE_PTO) {
    return VALIDATION_MESSAGES["sick.pto_required_after_threshold"];
  }
  return null;
}

/**
 * Checks whether bereavement days have exceeded the 2-consecutive-day
 * threshold. Returns a warning message string if so, or null.
 *
 * @param consecutiveDays - Number of consecutive bereavement days
 * @returns Warning message string, or null
 */
export function checkBereavementThreshold(
  consecutiveDays: number,
): string | null {
  if (consecutiveDays > BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO) {
    return VALIDATION_MESSAGES["bereavement.pto_required_after_threshold"];
  }
  return null;
}

// ── Phase 4: Termination Payout Calculation ────────────────────────────

/**
 * Computes the PTO payout for a terminated employee.
 * Prior-year carryover is capped at 80 hours per policy.
 *
 * @param carryoverHours - Remaining hours carried over from the prior year
 * @param currentYearAccrued - Hours accrued so far in the current year
 * @param currentYearUsed - Hours used so far in the current year
 * @returns Payout amount in hours (minimum 0)
 */
export function computeTerminationPayout(
  carryoverHours: number,
  currentYearAccrued: number,
  currentYearUsed: number,
): number {
  const cappedCarryover = Math.min(
    Math.max(0, carryoverHours),
    CARRYOVER_LIMIT,
  );
  const payout = cappedCarryover + currentYearAccrued - currentYearUsed;
  return Math.max(0, payout);
}

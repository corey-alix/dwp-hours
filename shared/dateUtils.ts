/**
 * Date Management Utilities
 * Lightweight bespoke date management using YYYY-MM-DD strings exclusively
 * Avoids timezone issues and provides consistent date handling
 *
 * ## Date Handling Guidelines
 *
 * ### Core Principles
 * - Use YYYY-MM-DD strings exclusively for all date operations
 * - Never use `new Date()` with date strings in client code
 * - Always use `dateUtils.ts` functions for date manipulation
 * - Store dates as TEXT columns in SQLite (YYYY-MM-DD format)
 *
 * ### Common Pitfalls to Avoid
 * ❌ `new Date(dateString)` - Creates timezone-dependent Date objects
 * ❌ `new Date().toISOString().split('T')[0]` - Causes timezone shifts
 * ❌ `Date.UTC()` mixed with local time operations
 * ❌ Storing Date objects in database (use strings)
 *
 * ### Correct Usage Patterns
 * ✅ `today()` - Get current date as YYYY-MM-DD string
 * ✅ `addDays(dateStr, days)` - Add/subtract days safely
 * ✅ `isWeekend(dateStr)` - Check if date is weekend
 * ✅ `calculateEndDateFromHours(startDate, hours)` - Business day calculations
 *
 * ### Timezone Safety
 * - All functions work consistently regardless of server timezone
 * - Client and server use identical date logic
 * - No timezone conversions or assumptions
 * - Dates represent calendar dates, not moments in time
 */

const SUNDAY = 0;
const MONDAY = 1;
const TUESDAY = 2;
const WEDNESDAY = 3;
const THURSDAY = 4;
const FRIDAY = 5;
const SATURDAY = 6;

export { SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY };

/**
 * Validates if a string is a valid YYYY-MM-DD date format
 */
export function isValidDateString(dateStr: string): boolean {
  if (typeof dateStr !== "string") return false;

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Basic range checks
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Check days in month
  const daysInMonth = getDaysInMonth(year, month);
  return day <= daysInMonth;
}

/**
 * Parses a YYYY-MM-DD string into components
 */
export function parseDate(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  const [, yearStr, monthStr, dayStr] = dateStr.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  )!;
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
    day: parseInt(dayStr, 10),
  };
}

/**
 * Formats year, month, day into YYYY-MM-DD string
 */
export function formatDate(year: number, month: number, day: number): string {
  if (!isValidDateComponents(year, month, day)) {
    throw new Error(`Invalid date components: ${year}-${month}-${day}`);
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/**
 * Parses MM/DD/YY string into YYYY-MM-DD format
 */
export function parseMMDDYY(dateStr: string): string {
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid MM/DD/YY format: ${dateStr}`);
  }

  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10) + 2000;

  return formatDate(year, month, day);
}

/**
 * Smart date parser that accepts multiple common formats and returns YYYY-MM-DD.
 * Supported formats:
 * - YYYY-MM-DD (ISO)
 * - M/D/YY or MM/DD/YY (US short year)
 * - M/D/YYYY or MM/DD/YYYY (US full year)
 * Returns null if no format matches.
 */
export function smartParseDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidDateString(trimmed) ? trimmed : null;
  }

  // M/D/YY
  const shortMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortMatch) {
    const month = parseInt(shortMatch[1], 10);
    const day = parseInt(shortMatch[2], 10);
    let year = parseInt(shortMatch[3], 10);
    // 2-digit year: 00-49 → 2000-2049, 50-99 → 1950-1999
    year = year < 50 ? 2000 + year : 1900 + year;
    try {
      return formatDate(year, month, day);
    } catch {
      return null;
    }
  }

  // M/D/YYYY
  const longMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (longMatch) {
    const month = parseInt(longMatch[1], 10);
    const day = parseInt(longMatch[2], 10);
    const year = parseInt(longMatch[3], 10);
    try {
      return formatDate(year, month, day);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  // Create date for the last day of the month
  const date = new Date(year, month, 0);
  return date.getDate();
}

/**
 * Validates date components
 */
function isValidDateComponents(
  year: number,
  month: number,
  day: number,
): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonth = getDaysInMonth(year, month);
  return day <= daysInMonth;
}

/**
 * Adds days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseDate(dateStr);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Adds months to a date string
 */
export function addMonths(dateStr: string, months: number): string {
  const { year, month, day } = parseDate(dateStr);
  let newYear = year;
  let newMonth = month + months;

  // Adjust year and month
  while (newMonth > 12) {
    newYear++;
    newMonth -= 12;
  }
  while (newMonth <= 0) {
    newYear--;
    newMonth += 12;
  }

  // Get the last day of the target month
  const daysInTargetMonth = getDaysInMonth(newYear, newMonth);
  const targetDay = Math.min(day, daysInTargetMonth);

  return formatDate(newYear, newMonth, targetDay);
}

/**
 * Compares two date strings
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(dateStr1: string, dateStr2: string): number {
  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);

  if (d1.year !== d2.year) return d1.year < d2.year ? -1 : 1;
  if (d1.month !== d2.month) return d1.month < d2.month ? -1 : 1;
  if (d1.day !== d2.day) return d1.day < d2.day ? -1 : 1;
  return 0;
}

/**
 * Gets date components from a date string
 */
export function getDateComponents(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  return parseDate(dateStr);
}

/**
 * Checks if date1 is before date2
 */
export function isBefore(dateStr1: string, dateStr2: string): boolean {
  return compareDates(dateStr1, dateStr2) < 0;
}

/**
 * Checks if date1 is after date2
 */
export function isAfter(dateStr1: string, dateStr2: string): boolean {
  return compareDates(dateStr1, dateStr2) > 0;
}

/**
 * Gets the number of days between two dates (date1 - date2)
 */
export function getDaysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);

  const date1 = new Date(d1.year, d1.month - 1, d1.day);
  const date2 = new Date(d2.year, d2.month - 1, d2.day);

  const diffTime = date1.getTime() - date2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// ── Time-travel override (developer testing only) ────────────────────

let _timeTravelYear: number | null = null;
let _timeTravelDate: string | null = null;

/**
 * Set a time-travel year override.
 * When set, `today()`, `getCurrentYear()`, and `getCurrentMonth()` will
 * return values as if the current year were the override year (month and day
 * are kept from the real clock).
 *
 * Pass `null` to disable.
 *
 * Note: `setTimeTravelDay()` takes precedence. Setting a year clears any
 * active day override.
 */
export function setTimeTravelYear(year: number | null): void {
  if (year !== null && (year < 2000 || year > 2099)) {
    throw new Error(
      `Invalid time-travel year: ${year}. Must be between 2000 and 2099.`,
    );
  }
  _timeTravelYear = year;
  _timeTravelDate = null;
}

/**
 * Returns the active time-travel year, or `null` if time-travel is inactive.
 * When a full day override is active, returns its year component.
 */
export function getTimeTravelYear(): number | null {
  if (_timeTravelDate) return parseDate(_timeTravelDate).year;
  return _timeTravelYear;
}

/**
 * Set a time-travel day override (YYYY-MM-DD).
 * When set, `today()` returns this exact date, and `getCurrentYear()` /
 * `getCurrentMonth()` derive their values from it.
 *
 * Takes precedence over `setTimeTravelYear()`. Setting a day clears any
 * active year-only override.
 *
 * Pass `null` to disable.
 */
export function setTimeTravelDay(dateStr: string | null): void {
  if (dateStr !== null) {
    if (!isValidDateString(dateStr)) {
      throw new Error(
        `Invalid time-travel date: ${dateStr}. Must be a valid YYYY-MM-DD string.`,
      );
    }
    const { year } = parseDate(dateStr);
    if (year < 2000 || year > 2099) {
      throw new Error(
        `Invalid time-travel date year: ${year}. Must be between 2000 and 2099.`,
      );
    }
  }
  _timeTravelDate = dateStr;
  _timeTravelYear = null;
}

/**
 * Returns the active time-travel day, or `null` if no day override is active.
 */
export function getTimeTravelDay(): string | null {
  return _timeTravelDate;
}

/**
 * Gets the current date as YYYY-MM-DD string.
 * - When a day override is active (`setTimeTravelDay`), returns that exact date.
 * - When a year override is active (`setTimeTravelYear`), the year is replaced;
 *   month/day come from the real clock (day clamped if invalid).
 * - Otherwise returns the real current date.
 */
export function today(): string {
  if (_timeTravelDate) return _timeTravelDate;
  const now = new Date();
  const year = _timeTravelYear ?? now.getFullYear();
  const month = now.getMonth() + 1;
  const day = Math.min(now.getDate(), getDaysInMonth(year, month));
  return formatDate(year, month, day);
}

/**
 * Gets the day of the week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string) {
  const { year, month, day } = parseDate(dateStr);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Checks if a date is a weekend
 */
export function isWeekend(dateStr: string): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Gets the start of month for a given date
 */
export function startOfMonth(dateStr: string): string {
  const { year, month } = parseDate(dateStr);
  return formatDate(year, month, 1);
}

/**
 * Gets the end of month for a given date
 */
export function endOfMonth(dateStr: string): string {
  const { year, month } = parseDate(dateStr);
  const daysInMonth = getDaysInMonth(year, month);
  return formatDate(year, month, daysInMonth);
}

/**
 * Converts a Date object to YYYY-MM-DD string format
 */
export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  return formatDate(year, month, day);
}

/**
 * Converts a Date object to ISO timestamp string format
 */
export function dateTimeToISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Calculate the number of weekdays (Monday-Friday) between two dates, inclusive
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param endDateStr - End date in YYYY-MM-DD format
 * @returns Number of weekdays between the dates
 */
export function getWeekdaysBetween(
  startDateStr: string,
  endDateStr: string,
): number {
  if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
    throw new Error("Invalid date string format");
  }

  if (compareDates(startDateStr, endDateStr) > 0) {
    return 0; // Return 0 if start date is after end date
  }

  let weekdays = 0;
  let currentDateStr = startDateStr;

  while (compareDates(currentDateStr, endDateStr) <= 0) {
    if (!isWeekend(currentDateStr)) {
      weekdays++;
    }
    currentDateStr = addDays(currentDateStr, 1);
  }

  return weekdays;
}

/**
 * Gets the current year.
 * Returns the time-travel year (from day or year override) when active.
 */
export function getCurrentYear(): number {
  if (_timeTravelDate) return parseDate(_timeTravelDate).year;
  return _timeTravelYear ?? new Date().getFullYear();
}

/**
 * Gets the current month in YYYY-MM format.
 * - When a day override is active, derives year and month from that date.
 * - When a year override is active, uses overridden year with real month.
 * - Otherwise returns the real current year-month.
 */
export function getCurrentMonth(): string {
  if (_timeTravelDate) {
    const { year, month } = parseDate(_timeTravelDate);
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
  }
  const now = new Date();
  const year = _timeTravelYear ?? now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}

/**
 * Formats a date string for display using locale formatting
 */
export function formatDateForDisplay(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const { year, month, day } = parseDate(dateStr);
  const date = new Date(year, month - 1, day);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options || defaultOptions);
}

/**
 * Gets all workdays (weekdays) between two dates as an array of date strings
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param endDateStr - End date in YYYY-MM-DD format
 * @returns Array of YYYY-MM-DD strings representing workdays
 */
export function getWorkdaysBetween(
  startDateStr: string,
  endDateStr: string,
): string[] {
  if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
    throw new Error("Invalid date string format");
  }

  const workdays: string[] = [];
  let currentDateStr = startDateStr;

  while (compareDates(currentDateStr, endDateStr) <= 0) {
    if (!isWeekend(currentDateStr)) {
      workdays.push(currentDateStr);
    }
    currentDateStr = addDays(currentDateStr, 1);
  }

  return workdays;
}

/**
 * Gets the first day of the month for a given year and month
 */
export function getFirstDayOfMonth(year: number, month: number): string {
  return formatDate(year, month, 1);
}

/**
 * Gets the last day of the month for a given year and month
 */
export function getLastDayOfMonth(year: number, month: number): string {
  const daysInMonth = getDaysInMonth(year, month);
  return formatDate(year, month, daysInMonth);
}

/**
 * Gets the calendar start date (first day of the week containing the first day of the month)
 */
export function getCalendarStartDate(year: number, month: number): string {
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const dayOfWeek = getDayOfWeek(firstDayOfMonth);
  return addDays(firstDayOfMonth, -dayOfWeek);
}

/**
 * Gets the calendar end date (last day of the week containing the last day of the month)
 */
export function getCalendarEndDate(year: number, month: number): string {
  const lastDayOfMonth = getLastDayOfMonth(year, month);
  const dayOfWeek = getDayOfWeek(lastDayOfMonth);
  const daysToAdd = 6 - dayOfWeek;
  return addDays(lastDayOfMonth, daysToAdd);
}

/**
 * Gets all dates in a calendar month (including days from previous/next months to fill the grid)
 */
export function getCalendarDates(year: number, month: number): string[] {
  const startDate = getCalendarStartDate(year, month);
  const endDate = getCalendarEndDate(year, month);

  const dates: string[] = [];
  let currentDate = startDate;

  while (compareDates(currentDate, endDate) <= 0) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Gets the number of weeks in a month (including partial weeks)
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of weeks needed to display the month in a calendar
 */
export function getWeeksInMonth(year: number, month: number): number {
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const startWeekDay = getDayOfWeek(firstDayOfMonth);
  // Calculate number of weeks: ceil((daysInMonth + startWeekDay) / 7)
  return Math.ceil((daysInMonth + startWeekDay) / 7);
}

/**
 * Checks if a date is in the current month
 */
export function isInMonth(
  dateStr: string,
  year: number,
  month: number,
): boolean {
  const { year: dateYear, month: dateMonth } = parseDate(dateStr);
  return dateYear === year && dateMonth === month;
}

/**
 * Calculate end date by adding hours with spillover logic (skip weekends)
 * Assumes 8 hours per workday, spills over to next business day when exceeding 8 hours
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param hours - Total hours to add
 * @returns End date in YYYY-MM-DD format
 */
export function calculateEndDateFromHours(
  startDateStr: string,
  hours: number,
): string {
  if (!isValidDateString(startDateStr)) {
    throw new Error("Invalid start date string format");
  }

  if (hours <= 0) {
    return startDateStr;
  }

  let currentDateStr = startDateStr;
  let remainingHours = hours;

  while (remainingHours > 0) {
    if (isWeekend(currentDateStr)) {
      currentDateStr = addDays(currentDateStr, 1);
      continue;
    }

    const hoursForDay = Math.min(remainingHours, 8);
    remainingHours -= hoursForDay;

    if (remainingHours > 0) {
      currentDateStr = addDays(currentDateStr, 1);
    }
  }

  return currentDateStr;
}

/**
 * Gets the start of the current year (January 1st)
 */
export function startOfYear(): string {
  const { year } = parseDate(today());
  return formatDate(year, 1, 1);
}

/**
 * Gets the end of the current year (December 31st)
 */
export function endOfYear(): string {
  const { year } = parseDate(today());
  return formatDate(year, 12, 31);
}

/**
 * Gets the name of the day of the week for a given date
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Name of the day (e.g., "Monday", "Tuesday", etc.)
 */
export function getDayName(dateStr: string): string {
  const dayOfWeek = getDayOfWeek(dateStr);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return dayNames[dayOfWeek];
}

/**
 * Gets the next business day (skips weekends)
 * If the input date is a weekday (Mon-Fri), returns the same date
 * If the input date is Saturday or Sunday, returns the following Monday
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Next business day in YYYY-MM-DD format
 */
export function getNextBusinessDay(dateStr: string): string {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  let currentDate = dateStr;
  while (isWeekend(currentDate)) {
    currentDate = addDays(currentDate, 1);
  }
  return currentDate;
}

/**
 * Formats an ISO timestamp string for display
 * @param isoTimestamp - ISO timestamp string (e.g., "2026-02-11T14:16:34.352Z")
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string for display
 */
export function formatTimestampForDisplay(
  isoTimestamp: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO timestamp: ${isoTimestamp}`);
  }
  return date.toLocaleDateString("en-US", options);
}

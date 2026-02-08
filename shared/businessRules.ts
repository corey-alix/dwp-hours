import { getDayOfWeek } from './dateUtils.js';

export type PTOType = 'Sick' | 'PTO' | 'Bereavement' | 'Jury Duty';

export interface ValidationError {
    field: string;
    messageKey: string;
}

export const VALIDATION_MESSAGES = {
    'hours.invalid': 'Hours must be in 4-hour increments',
    'hours.not_integer': 'Hours must be a whole number',
    'date.weekday': 'Date must be a weekday (Monday to Friday)',
    'pto.duplicate': 'A PTO entry of this type already exists for this employee on this date',
    'type.invalid': 'Invalid PTO type',
    'date.invalid': 'Invalid date format',
    'employee.not_found': 'Employee not found',
    'entry.not_found': 'PTO entry not found',
    'hours.exceed_annual_sick': 'Sick time cannot exceed 24 hours annually',
    'hours.exceed_annual_other': 'Bereavement/Jury Duty cannot exceed 40 hours annually',
    'hours.exceed_pto_balance': 'PTO request exceeds available PTO balance',
    'date.future_limit': 'Entries cannot be made into the next year',
    'month.acknowledged': 'This month has been acknowledged by the administrator and is no longer editable'
} as const;

export type MessageKey = keyof typeof VALIDATION_MESSAGES;

/**
 * Validates that hours are positive and in 4-hour increments
 */
export function validateHours(hours: number): ValidationError | null {
    if (!Number.isInteger(hours)) {
        return { field: 'hours', messageKey: 'hours.not_integer' };
    }
    if (hours <= 0 || hours % 4 !== 0) {
        return { field: 'hours', messageKey: 'hours.invalid' };
    }
    return null;
}

/**
 * Validates that date is a weekday (Monday to Friday)
 */
export function validateWeekday(dateStr: string): ValidationError | null {
    const day = getDayOfWeek(dateStr); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
        return { field: 'date', messageKey: 'date.weekday' };
    }
    return null;
}

/**
 * Validates PTO type
 */
export function validatePTOType(type: string): ValidationError | null {
    const validTypes: PTOType[] = ['Sick', 'PTO', 'Bereavement', 'Jury Duty'];
    if (!validTypes.includes(type as PTOType)) {
        return { field: 'type', messageKey: 'type.invalid' };
    }
    return null;
}

/**
 * Normalizes PTO type (handles legacy 'Full PTO', 'Partial PTO')
 */
export function normalizePTOType(type: string): PTOType {
    if (type === 'Full PTO' || type === 'Partial PTO') {
        return 'PTO';
    }
    return type as PTOType;
}

/**
 * Checks if date string is valid
 */
export function validateDateString(dateStr: string): ValidationError | null {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return { field: 'date', messageKey: 'date.invalid' };
    }
    return null;
}

/**
 * Validates annual hour limits (requires total hours for the year)
 * This is a basic check; full annual calculation would need more context
 */
export function validateAnnualLimits(type: PTOType, hours: number, totalAnnualHours: number): ValidationError | null {
    if (type === 'Sick' && totalAnnualHours + hours > 24) {
        return { field: 'hours', messageKey: 'hours.exceed_annual_sick' };
    }
    if ((type === 'Bereavement' || type === 'Jury Duty') && totalAnnualHours + hours > 40) {
        return { field: 'hours', messageKey: 'hours.exceed_annual_other' };
    }
    return null;
}

/**
 * Validates that PTO request does not exceed available PTO balance
 */
export function validatePTOBalance(requestedHours: number, availableBalance: number): ValidationError | null {
    if (requestedHours > availableBalance) {
        return { field: 'hours', messageKey: 'hours.exceed_pto_balance' };
    }
    return null;
}

/**
 * Validates that the date is not into the next year
 */
export function validateDateFutureLimit(date: Date): ValidationError | null {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 11, 31); // End of next year
    if (date > nextYear) {
        return { field: 'date', messageKey: 'date.future_limit' };
    }
    return null;
}

/**
 * Validates that the month is not acknowledged (editable)
 */
export function validateMonthEditable(isAcknowledged: boolean): ValidationError | null {
    if (isAcknowledged) {
        return { field: 'month', messageKey: 'month.acknowledged' };
    }
    return null;
}
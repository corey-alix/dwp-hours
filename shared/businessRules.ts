// Shared business rules for DWP Hours Tracker
// This module is used by both client and server for validation

export type PTOType = 'Sick' | 'PTO' | 'Bereavement' | 'Jury Duty';

export interface ValidationError {
    field: string;
    messageKey: string;
}

export const VALIDATION_MESSAGES = {
    'hours.invalid': 'Hours must be 4 or 8',
    'hours.not_integer': 'Hours must be a whole number',
    'date.weekday': 'Date must be a weekday (Monday to Friday)',
    'pto.duplicate': 'A PTO entry of this type already exists for this employee on this date',
    'type.invalid': 'Invalid PTO type',
    'date.invalid': 'Invalid date format',
    'employee.not_found': 'Employee not found',
    'entry.not_found': 'PTO entry not found',
    'hours.exceed_annual_sick': 'Sick time cannot exceed 24 hours annually',
    'hours.exceed_annual_other': 'Bereavement/Jury Duty cannot exceed 40 hours annually'
} as const;

export type MessageKey = keyof typeof VALIDATION_MESSAGES;

/**
 * Validates that hours are 4 or 8 and whole integers
 */
export function validateHours(hours: number): ValidationError | null {
    if (!Number.isInteger(hours)) {
        return { field: 'hours', messageKey: 'hours.not_integer' };
    }
    if (hours !== 4 && hours !== 8) {
        return { field: 'hours', messageKey: 'hours.invalid' };
    }
    return null;
}

/**
 * Validates that date is a weekday (Monday to Friday)
 */
export function validateWeekday(date: Date): ValidationError | null {
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
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
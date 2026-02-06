import { describe, it, expect } from 'vitest';
import {
    validateHours,
    validateWeekday,
    validatePTOType,
    normalizePTOType,
    validateDateString,
    VALIDATION_MESSAGES,
    type PTOType
} from '../shared/businessRules.js';

describe('Business Rules Validation', () => {
    describe('validateHours', () => {
        it('should accept 4 hours', () => {
            expect(validateHours(4)).toBeNull();
        });

        it('should accept 8 hours', () => {
            expect(validateHours(8)).toBeNull();
        });

        it('should reject non-integer hours', () => {
            const result = validateHours(4.5);
            expect(result).not.toBeNull();
            expect(result?.messageKey).toBe('hours.not_integer');
        });

        it('should reject hours other than 4 or 8', () => {
            const result = validateHours(6);
            expect(result).not.toBeNull();
            expect(result?.messageKey).toBe('hours.invalid');
        });
    });

    describe('validateWeekday', () => {
        it('should accept Monday', () => {
            const monday = new Date(2024, 0, 1); // January 1, 2024 was Monday
            expect(validateWeekday(monday)).toBeNull();
        });

        it('should accept Friday', () => {
            const friday = new Date(2024, 0, 5); // January 5, 2024 was Friday
            expect(validateWeekday(friday)).toBeNull();
        });

        it('should reject Saturday', () => {
            const saturday = new Date(2024, 0, 6); // January 6, 2024 was Saturday
            const result = validateWeekday(saturday);
            expect(result).not.toBeNull();
            expect(result?.messageKey).toBe('date.weekday');
        });

        it('should reject Sunday', () => {
            const sunday = new Date(2024, 0, 7); // January 7, 2024 was Sunday
            const result = validateWeekday(sunday);
            expect(result).not.toBeNull();
            expect(result?.messageKey).toBe('date.weekday');
        });
    });

    describe('validatePTOType', () => {
        it('should accept valid PTO types', () => {
            const validTypes: PTOType[] = ['Sick', 'PTO', 'Bereavement', 'Jury Duty'];
            validTypes.forEach(type => {
                expect(validatePTOType(type)).toBeNull();
            });
        });

        it('should reject invalid PTO type', () => {
            const result = validatePTOType('Invalid');
            expect(result).not.toBeNull();
            expect(result?.messageKey).toBe('type.invalid');
        });
    });

    describe('normalizePTOType', () => {
        it('should normalize Full PTO to PTO', () => {
            expect(normalizePTOType('Full PTO')).toBe('PTO');
        });

        it('should normalize Partial PTO to PTO', () => {
            expect(normalizePTOType('Partial PTO')).toBe('PTO');
        });

        it('should leave other types unchanged', () => {
            expect(normalizePTOType('Sick')).toBe('Sick');
            expect(normalizePTOType('Bereavement')).toBe('Bereavement');
        });
    });

    describe('validateDateString', () => {
        it('should accept valid date string', () => {
            expect(validateDateString('2024-01-01')).toBeNull();
        });

        it('should reject invalid date string', () => {
            const result = validateDateString('invalid-date');
            expect(result).not.toBeNull();
            expect(result?.messageKey).toBe('date.invalid');
        });
    });

    describe('VALIDATION_MESSAGES', () => {
        it('should contain all expected message keys', () => {
            const expectedKeys = [
                'hours.invalid',
                'hours.not_integer',
                'date.weekday',
                'pto.duplicate',
                'type.invalid',
                'date.invalid',
                'employee.not_found',
                'entry.not_found',
                'hours.exceed_annual_sick',
                'hours.exceed_annual_other'
            ];

            expectedKeys.forEach(key => {
                expect(VALIDATION_MESSAGES).toHaveProperty(key);
            });
        });
    });
});
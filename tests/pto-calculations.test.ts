import { describe, it, expect } from 'vitest';
import {
    calculateWorkDays,
    getUSHolidays,
    WorkDaysResult
} from '../src/workDays.js';
import {
    calculatePTOStatus,
    calculateTotalAccruedPTO,
    calculateUsedPTO,
    calculateNextAccrual,
    calculateDailyRate,
    calculateYearEndCarryover,
    processYearEnd,
    PTOStatus,
    PTOEntry,
    Employee
} from '../src/ptoCalculations.js';

describe('Work Days Calculation', () => {
    it('should calculate work days for a regular month', () => {
        const result: WorkDaysResult = calculateWorkDays(2024, 1); // January 2024
        expect(result.workDays).toBeGreaterThan(20);
        expect(result.workDays).toBeLessThan(24);
        expect(result.totalDays).toBe(31);
        expect(result.weekends).toBe(8); // 4 Saturdays + 4 Sundays = 8
    });

    it('should exclude weekends', () => {
        const result = calculateWorkDays(2024, 1);
        expect(result.weekends).toBe(8); // 4 Saturdays + 4 Sundays = 8
    });

    it('should exclude holidays', () => {
        const result = calculateWorkDays(2024, 1, ['2024-01-01']); // New Year's Day
        expect(result.holidays).toContain('2024-01-01');
        expect(result.workDays).toBeLessThan(calculateWorkDays(2024, 1).workDays);
    });

    it('should get US federal holidays for a year', () => {
        const holidays = getUSHolidays(2024);
        expect(holidays).toContain('2024-01-01'); // New Year's Day
        expect(holidays).toContain('2024-07-04'); // Independence Day
        expect(holidays).toContain('2024-12-25'); // Christmas
        expect(holidays.length).toBeGreaterThan(5);
    });
});

describe('PTO Calculations', () => {
    const mockEmployee: Employee = {
        id: 1,
        name: 'Test Employee',
        identifier: 'test@example.com',
        pto_rate: 0.71,
        carryover_hours: 10,
        hire_date: new Date('2024-01-01'), // Changed to 2024 to test 1 year accrual
        role: 'Employee'
    };

    const mockPTOEntries: PTOEntry[] = [
        {
            id: 1,
            employee_id: 1,
            start_date: new Date('2024-06-01'),
            end_date: new Date('2024-06-05'),
            type: 'Full PTO',
            hours: 32,
            created_at: new Date('2024-05-01')
        },
        {
            id: 2,
            employee_id: 1,
            start_date: new Date('2024-08-01'),
            end_date: new Date('2024-08-01'),
            type: 'Sick',
            hours: 8,
            created_at: new Date('2024-07-01')
        },
        {
            id: 3,
            employee_id: 1,
            start_date: new Date('2024-09-01'),
            end_date: new Date('2024-09-01'),
            type: 'Bereavement',
            hours: 8,
            created_at: new Date('2024-08-01')
        }
    ];

    it('should calculate PTO status correctly', () => {
        const currentDate = new Date('2024-12-01');
        const status: PTOStatus = calculatePTOStatus(mockEmployee, mockPTOEntries, currentDate);

        expect(status.employeeId).toBe(1);
        expect(status.availablePTO).toBeGreaterThan(0);
        expect(status.usedPTO).toBe(32); // Only Full PTO
        expect(status.sickTime.used).toBe(8);
        expect(status.bereavementJuryDuty.used).toBe(8);
        expect(status.sickTime.remaining).toBe(16); // 24 - 8
        expect(status.bereavementJuryDuty.remaining).toBe(32); // 40 - 8
    });

    it('should calculate total accrued PTO', () => {
        const toDate = new Date('2024-12-01');
        const accrued = calculateTotalAccruedPTO(mockEmployee, toDate);

        expect(accrued).toBeGreaterThan(0);
        // Approximately 20-22 work days per month × 0.71 × 11 months
        expect(accrued).toBeGreaterThan(150);
        expect(accrued).toBeLessThan(180);
    });

    it('should calculate used PTO by type', () => {
        const fullPTOUsed = calculateUsedPTO(mockPTOEntries, 'Full PTO');
        const sickUsed = calculateUsedPTO(mockPTOEntries, 'Sick');
        const bereavementUsed = calculateUsedPTO(mockPTOEntries, 'Bereavement');

        expect(fullPTOUsed).toBe(32);
        expect(sickUsed).toBe(8);
        expect(bereavementUsed).toBe(8);
    });

    it('should calculate next accrual', () => {
        const currentDate = new Date('2024-12-01');
        const nextAccrual = calculateNextAccrual(mockEmployee, currentDate);

        expect(nextAccrual.date.getMonth()).toBe(11); // December (0-based)
        expect(nextAccrual.date.getFullYear()).toBe(2024);
        expect(nextAccrual.amount).toBeGreaterThan(0);
        expect(nextAccrual.amount).toBeLessThan(20);
    });

    it('should calculate daily rate based on hire date', () => {
        const newHire = new Date('2025-06-01'); // Very recent hire
        const oneYear = new Date('2024-06-01'); // ~1.5 years ago
        const fiveYears = new Date('2020-06-01'); // ~5.5 years ago
        const tenYears = new Date('2015-06-01'); // ~10.5 years ago

        expect(calculateDailyRate(newHire)).toBe(0.68);
        expect(calculateDailyRate(oneYear)).toBe(0.69);
        expect(calculateDailyRate(fiveYears)).toBe(0.70);
        expect(calculateDailyRate(tenYears)).toBe(0.71);
    });

    it('should handle partial month accrual for new hires', () => {
        const midMonthHire: Employee = {
            ...mockEmployee,
            hire_date: new Date('2024-06-15') // Hired mid-month
        };

        const toDate = new Date('2024-07-01');
        const accrued = calculateTotalAccruedPTO(midMonthHire, toDate);

        // Should be less than full month accrual
        const fullMonthEmployee: Employee = {
            ...mockEmployee,
            hire_date: new Date('2024-06-01')
        };
        const fullAccrued = calculateTotalAccruedPTO(fullMonthEmployee, toDate);

        expect(accrued).toBeLessThan(fullAccrued);
    });

    it('should handle year-end calculations', () => {
        const yearEndDate = new Date('2024-12-31');
        const status = calculatePTOStatus(mockEmployee, mockPTOEntries, yearEndDate);

        expect(status.accruedThisYear).toBeGreaterThan(150);
        expect(Math.abs(status.availablePTO - (status.accruedThisYear + mockEmployee.carryover_hours - status.usedPTO))).toBeLessThan(1.0); // Allow for floating point differences
    });

    it('should not allow negative PTO balances', () => {
        const overUsedEmployee: Employee = {
            ...mockEmployee,
            carryover_hours: 0
        };

        const excessivePTO: PTOEntry[] = [{
            id: 1,
            employee_id: 1,
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            type: 'Full PTO',
            hours: 1000, // Excessive PTO usage
            created_at: new Date('2024-01-01')
        }];

        const status = calculatePTOStatus(overUsedEmployee, excessivePTO);
        expect(status.availablePTO).toBe(0); // Should not be negative
    });

    it('should calculate year-end carryover', () => {
        const carryover = calculateYearEndCarryover(mockEmployee, mockPTOEntries, 2024);
        expect(carryover).toBeGreaterThan(150); // Should be substantial positive amount
        expect(carryover).toBeLessThan(200);
    });

    it('should apply carryover limit', () => {
        const highCarryoverEmployee: Employee = {
            ...mockEmployee,
            carryover_hours: 100
        };
        const carryover = calculateYearEndCarryover(highCarryoverEmployee, [], 2024, 50);
        expect(carryover).toBeLessThanOrEqual(50);
    });

    it('should process year-end correctly', () => {
        const result = processYearEnd(mockEmployee, mockPTOEntries, 2025);
        expect(result.carryover).toBeGreaterThan(0);
        expect(result.updatedEmployee.carryover_hours).toBe(result.carryover);
    });
});
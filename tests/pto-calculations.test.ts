import { describe, it, expect } from 'vitest';
import {
    getWorkDays,
    getTotalWorkDaysInYear,
    calculateMonthlyAccrual
} from '../src/workDays.js';
import {
    calculatePTOStatus,
    calculateUsedPTO,
    calculateYearEndCarryover,
    processYearEnd,
    PTOStatus,
    PTOEntry,
    Employee
} from '../src/ptoCalculations.js';

describe('Work Days Lookup', () => {
    it('should get work days for January', () => {
        const workDays = getWorkDays(2024, 1);
        expect(workDays).toBe(21);
    });

    it('should get work days for February', () => {
        const workDays = getWorkDays(2024, 2);
        expect(workDays).toBe(22); // February 2024 has 22 weekdays
    });

    it('should get total work days in year', () => {
        const total = getTotalWorkDaysInYear(2024);
        expect(total).toBe(262); // Dynamic calculation for 2024
    });

    it('should calculate monthly accrual', () => {
        const accrual = calculateMonthlyAccrual(0.71, 2024, 1); // 0.71 hours per work day, January
        expect(accrual).toBeCloseTo(14.91, 2); // 0.71 * 21 ≈ 14.91
    });
});

describe('PTO Calculations', () => {
    const mockEmployee: Employee = {
        id: 1,
        name: 'Test Employee',
        identifier: 'test@example.com',
        pto_rate: 0.71,
        carryover_hours: 10,
        hire_date: new Date('2024-01-01'),
        role: 'Employee'
    };

    const mockPTOEntries: PTOEntry[] = [
        {
            id: 1,
            employee_id: 1,
            start_date: new Date('2024-06-01'),
            end_date: new Date('2024-06-05'),
            type: 'PTO',
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
        expect(status.annualAllocation).toBe(96);
        expect(status.availablePTO).toBeCloseTo(74, 0); // 96 + 10 - 32
        expect(status.usedPTO).toBe(32); // Only PTO
        expect(status.carryoverFromPreviousYear).toBe(10);
        expect(status.monthlyAccruals).toHaveLength(12);
        expect(status.monthlyAccruals[0].month).toBe(1); // January
        expect(status.monthlyAccruals[0].hours).toBeCloseTo(7.69, 2); // 96/262 * 21 ≈ 7.69
        expect(status.sickTime.used).toBe(8);
        expect(status.sickTime.remaining).toBe(16); // 24 - 8
        expect(status.ptoTime.allowed).toBe(106); // 96 + 10
        expect(status.ptoTime.used).toBe(32);
        expect(status.ptoTime.remaining).toBeCloseTo(74, 0);
        expect(status.bereavementTime.used).toBe(8);
        expect(status.bereavementTime.remaining).toBe(32); // 40 - 8
        expect(status.juryDutyTime.used).toBe(0);
        expect(status.juryDutyTime.remaining).toBe(40);
        expect(status.nextRolloverDate.getFullYear()).toBe(2025);
        expect(status.nextRolloverDate.getMonth()).toBe(0); // January
        expect(status.nextRolloverDate.getDate()).toBe(1);
    });

    it('should calculate used PTO by type', () => {
        const ptoUsed = calculateUsedPTO(mockPTOEntries, 'PTO');
        const sickUsed = calculateUsedPTO(mockPTOEntries, 'Sick');
        const bereavementUsed = calculateUsedPTO(mockPTOEntries, 'Bereavement');

        expect(ptoUsed).toBe(32);
        expect(sickUsed).toBe(8);
        expect(bereavementUsed).toBe(8);
    });

    it('should handle year-end calculations', () => {
        const yearEndDate = new Date('2024-12-31');
        const status = calculatePTOStatus(mockEmployee, mockPTOEntries, yearEndDate);

        expect(status.annualAllocation).toBe(96);
        expect(status.availablePTO).toBeCloseTo(74, 0); // 96 + 10 - 32
        expect(status.monthlyAccruals).toHaveLength(12);
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
            type: 'PTO',
            hours: 1000, // Excessive PTO usage
            created_at: new Date('2024-01-01')
        }];

        const status = calculatePTOStatus(overUsedEmployee, excessivePTO);
        expect(status.availablePTO).toBe(0); // Should not be negative
    });

    it('should calculate year-end carryover', () => {
        const carryover = calculateYearEndCarryover(mockEmployee, mockPTOEntries, 2024);
        expect(carryover).toBeCloseTo(74, 0); // 96 + 10 - 32
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

    it('should calculate prorated allocation for new hires', () => {
        const newHireEmployee: Employee = {
            ...mockEmployee,
            hire_date: new Date(2024, 5, 1), // Hired in June (month 5 is June)
            carryover_hours: 0 // No carryover for new hire
        };

        const currentDate = new Date('2024-12-01');
        const status: PTOStatus = calculatePTOStatus(newHireEmployee, [], currentDate);

        // Prorated allocation: 96 * (7/12) = 56 hours (hired in June, months remaining)
        expect(status.annualAllocation).toBeCloseTo(56, 1);
        expect(status.availablePTO).toBeCloseTo(56, 1); // No usage
        // Monthly accruals should start from June
        expect(status.monthlyAccruals[0].month).toBe(6); // June
        expect(status.monthlyAccruals).toHaveLength(7); // June to Dec
    });
});
import { describe, it, expect } from "vitest";
import {
  getWorkDays,
  getTotalWorkDaysInYear,
  calculateMonthlyAccrual,
} from "../server/workDays.js";
import {
  calculatePTOStatus,
  calculateUsedPTO,
  calculateYearEndCarryover,
  processYearEnd,
  PTOStatus,
  PTOEntry,
  Employee,
} from "../server/ptoCalculations.js";

describe("Work Days Lookup", () => {
  it("should get work days for January", () => {
    const workDays = getWorkDays(2024, 1);
    expect(workDays).toBe(23); // January 2024 has 23 weekdays
  });

  it("should get work days for February", () => {
    const workDays = getWorkDays(2024, 2);
    expect(workDays).toBe(21); // February 2024 has 21 weekdays
  });

  it("should get total work days in year", () => {
    const total = getTotalWorkDaysInYear(2024);
    expect(total).toBe(262); // Dynamic calculation for 2024
  });

  it("should calculate monthly accrual", () => {
    const accrual = calculateMonthlyAccrual(0.71, 2024, 1); // 0.71 hours per work day, January
    expect(accrual).toBeCloseTo(16.33, 2); // 0.71 * 23 ≈ 16.33
  });
});

describe("PTO Calculations", () => {
  const mockEmployee: Employee = {
    id: 1,
    name: "Test Employee",
    identifier: "test@example.com",
    pto_rate: 0.71,
    carryover_hours: 10,
    hire_date: "2024-01-01",
    role: "Employee",
  };

  const mockPTOEntries: PTOEntry[] = [
    {
      id: 1,
      employee_id: 1,
      date: "2024-06-01",
      type: "PTO",
      hours: 8,
      created_at: "2024-05-01",
    },
    {
      id: 2,
      employee_id: 1,
      date: "2024-06-02",
      type: "PTO",
      hours: 8,
      created_at: "2024-05-01",
    },
    {
      id: 3,
      employee_id: 1,
      date: "2024-06-03",
      type: "PTO",
      hours: 8,
      created_at: "2024-05-01",
    },
    {
      id: 4,
      employee_id: 1,
      date: "2024-06-04",
      type: "PTO",
      hours: 8,
      created_at: "2024-05-01",
    },
    {
      id: 5,
      employee_id: 1,
      date: "2024-06-05",
      type: "PTO",
      hours: 8,
      created_at: "2024-05-01",
    },
    {
      id: 6,
      employee_id: 1,
      date: "2024-08-01",
      type: "Sick",
      hours: 8,
      created_at: "2024-07-01",
    },
    {
      id: 7,
      employee_id: 1,
      date: "2024-09-01",
      type: "Bereavement",
      hours: 8,
      created_at: "2024-08-01",
    },
  ];

  it("should calculate PTO status correctly", () => {
    const currentDate = "2024-12-01";
    const status: PTOStatus = calculatePTOStatus(
      mockEmployee,
      mockPTOEntries,
      currentDate,
    );

    // annualAllocation = pto_rate * totalWorkDays = 0.71 * 262 = 186.02
    expect(status.employeeId).toBe(1);
    expect(status.annualAllocation).toBeCloseTo(186.02, 1);
    expect(status.availablePTO).toBeCloseTo(156.02, 0); // 186.02 + 10 - 40
    expect(status.usedPTO).toBe(40); // Only PTO
    expect(status.carryoverFromPreviousYear).toBe(10);
    expect(status.monthlyAccruals).toHaveLength(12);
    expect(status.monthlyAccruals[0].month).toBe(1); // January
    expect(status.monthlyAccruals[0].hours).toBeCloseTo(16.33, 2); // 0.71 * 23 = 16.33
    expect(status.sickTime.used).toBe(8);
    expect(status.sickTime.remaining).toBe(16); // 24 - 8
    expect(status.ptoTime.allowed).toBeCloseTo(196.02, 0); // 186.02 + 10
    expect(status.ptoTime.used).toBe(40);
    expect(status.ptoTime.remaining).toBeCloseTo(156.02, 0);
    expect(status.bereavementTime.used).toBe(8);
    expect(status.bereavementTime.remaining).toBe(32); // 40 - 8
    expect(status.juryDutyTime.used).toBe(0);
    expect(status.juryDutyTime.remaining).toBe(40);
    expect(status.nextRolloverDate).toBe("2025-01-01");
  });

  it("should calculate used PTO by type", () => {
    const ptoUsed = calculateUsedPTO(mockPTOEntries, "PTO");
    const sickUsed = calculateUsedPTO(mockPTOEntries, "Sick");
    const bereavementUsed = calculateUsedPTO(mockPTOEntries, "Bereavement");

    expect(ptoUsed).toBe(40);
    expect(sickUsed).toBe(8);
    expect(bereavementUsed).toBe(8);
  });

  it("should handle year-end calculations", () => {
    const yearEndDate = "2024-12-31";
    const status = calculatePTOStatus(
      mockEmployee,
      mockPTOEntries,
      yearEndDate,
    );

    expect(status.annualAllocation).toBeCloseTo(186.02, 1);
    expect(status.availablePTO).toBeCloseTo(156.02, 0); // 186.02 + 10 - 40
    expect(status.monthlyAccruals).toHaveLength(12);
  });

  it("should not allow negative PTO balances", () => {
    const overUsedEmployee: Employee = {
      ...mockEmployee,
      carryover_hours: 0,
    };

    const excessivePTO: PTOEntry[] = [
      {
        id: 1,
        employee_id: 1,
        date: "2026-01-01", // Use current year for the test
        type: "PTO",
        hours: 1000, // Excessive PTO usage
        created_at: "2026-01-01",
      },
    ];

    const status = calculatePTOStatus(overUsedEmployee, excessivePTO);
    expect(status.availablePTO).toBe(0); // Should not be negative
  });

  it("should calculate year-end carryover", () => {
    const carryover = calculateYearEndCarryover(
      mockEmployee,
      mockPTOEntries,
      2024,
    );
    expect(carryover).toBeCloseTo(156.02, 0); // 186.02 + 10 - 40
  });

  it("should apply carryover limit", () => {
    const highCarryoverEmployee: Employee = {
      ...mockEmployee,
      carryover_hours: 100,
    };
    const carryover = calculateYearEndCarryover(
      highCarryoverEmployee,
      [],
      2024,
      50,
    );
    expect(carryover).toBeLessThanOrEqual(50);
  });

  it("should process year-end correctly", () => {
    const result = processYearEnd(mockEmployee, mockPTOEntries, 2025);
    expect(result.carryover).toBeGreaterThan(0);
    expect(result.updatedEmployee.carryover_hours).toBe(result.carryover);
  });

  it("should calculate prorated allocation for new hires", () => {
    const newHireEmployee: Employee = {
      ...mockEmployee,
      hire_date: "2024-06-01", // Hired in June
      carryover_hours: 0, // No carryover for new hire
    };

    const currentDate = "2024-12-01";
    const status: PTOStatus = calculatePTOStatus(
      newHireEmployee,
      [],
      currentDate,
    );

    // Prorated allocation: 186.02 * (7/12) ≈ 108.51 hours (hired in June, months remaining)
    expect(status.annualAllocation).toBeCloseTo(108.51, 0);
    expect(status.availablePTO).toBeCloseTo(108.51, 0); // No usage
    // Monthly accruals should start from June
    expect(status.monthlyAccruals[0].month).toBe(6); // June
    expect(status.monthlyAccruals).toHaveLength(7); // June to Dec
  });
});

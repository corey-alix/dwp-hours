// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import { computeMonthlyAccrualRows } from "../shared/businessRules.js";

describe("computeMonthlyAccrualRows", () => {
  it("should return 12 rows for a full year", () => {
    const rows = computeMonthlyAccrualRows(2026, 40, "2020-01-15", []);
    expect(rows).toHaveLength(12);
    expect(rows[0].month).toBe(1);
    expect(rows[0].label).toBe("January");
    expect(rows[11].month).toBe(12);
    expect(rows[11].label).toBe("December");
  });

  it("should set January prior balance to carryover", () => {
    const rows = computeMonthlyAccrualRows(2026, 42.5, "2020-01-15", []);
    expect(rows[0].priorBalance).toBe(42.5);
  });

  it("should chain prior balance from previous month's balance", () => {
    const rows = computeMonthlyAccrualRows(2026, 10, "2020-01-15", []);
    // February's priorBalance should equal January's balance
    expect(rows[1].priorBalance).toBe(rows[0].balance);
    // March's priorBalance should equal February's balance
    expect(rows[2].priorBalance).toBe(rows[1].balance);
  });

  it("should compute balance = priorBalance + accrued - used", () => {
    const entries = [
      { date: "2026-01-15", type: "PTO", hours: 8 },
      { date: "2026-01-20", type: "PTO", hours: 4 },
    ];
    const rows = computeMonthlyAccrualRows(2026, 50, "2020-01-15", entries);
    const jan = rows[0];
    expect(jan.used).toBe(12);
    expect(jan.balance).toBe(
      Math.round((jan.priorBalance + jan.accrued - jan.used) * 100) / 100,
    );
  });

  it("should only count PTO type for used hours", () => {
    const entries = [
      { date: "2026-03-10", type: "PTO", hours: 8 },
      { date: "2026-03-11", type: "Sick", hours: 8 },
      { date: "2026-03-12", type: "Bereavement", hours: 8 },
    ];
    const rows = computeMonthlyAccrualRows(2026, 0, "2020-01-15", entries);
    expect(rows[2].used).toBe(8); // Only PTO
  });

  it("should show zeroes for months before hire date (mid-year hire)", () => {
    // Hired in June 2026
    const rows = computeMonthlyAccrualRows(2026, 0, "2026-06-15", []);
    // Jan–May should have zero work days, rate, accrued
    for (let i = 0; i < 5; i++) {
      expect(rows[i].workDays).toBe(0);
      expect(rows[i].rate).toBe(0);
      expect(rows[i].accrued).toBe(0);
    }
    // June should have non-zero values
    expect(rows[5].workDays).toBeGreaterThan(0);
    expect(rows[5].rate).toBeGreaterThan(0);
    expect(rows[5].accrued).toBeGreaterThan(0);
  });

  it("should have positive work days for each active month", () => {
    const rows = computeMonthlyAccrualRows(2026, 0, "2020-01-15", []);
    for (const row of rows) {
      expect(row.workDays).toBeGreaterThan(0);
      expect(row.workDays).toBeLessThanOrEqual(23);
    }
  });

  it("should compute accrued as rate * workDays", () => {
    const rows = computeMonthlyAccrualRows(2026, 0, "2020-01-15", []);
    for (const row of rows) {
      const expected = Math.round(row.rate * row.workDays * 100) / 100;
      expect(row.accrued).toBe(expected);
    }
  });

  it("should handle zero carryover correctly", () => {
    const rows = computeMonthlyAccrualRows(2026, 0, "2020-01-15", []);
    expect(rows[0].priorBalance).toBe(0);
    expect(rows[0].balance).toBe(rows[0].accrued);
  });

  it("should reflect rate change for employee crossing tier on July 1", () => {
    // Hired 2024-06-15 → crosses 2-year tier on July 1 2026
    const rows = computeMonthlyAccrualRows(2026, 0, "2024-06-15", []);
    const juneRate = rows[5].rate;
    const julyRate = rows[6].rate;
    // Rate should increase from tier 1 (0.68) to tier 2 (0.71) on July 1
    expect(juneRate).toBe(0.68);
    expect(julyRate).toBe(0.71);
  });

  it("should handle entries from other years gracefully (ignored)", () => {
    const entries = [
      { date: "2025-02-10", type: "PTO", hours: 8 }, // wrong year
      { date: "2026-02-10", type: "PTO", hours: 8 }, // correct year
    ];
    const rows = computeMonthlyAccrualRows(2026, 0, "2020-01-15", entries);
    expect(rows[1].used).toBe(8); // Only 2026 entry
  });

  it("should produce running balance across all months with usage", () => {
    const entries = [
      { date: "2026-01-15", type: "PTO", hours: 8 },
      { date: "2026-06-10", type: "PTO", hours: 16 },
    ];
    const rows = computeMonthlyAccrualRows(2026, 20, "2020-01-15", entries);

    // Check that balance chains correctly through all months
    let expectedBalance = 20; // carryover
    for (const row of rows) {
      expect(row.priorBalance).toBe(Math.round(expectedBalance * 100) / 100);
      expectedBalance = row.balance;
    }
  });
});

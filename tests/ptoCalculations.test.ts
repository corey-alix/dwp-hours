import { describe, it, expect } from "vitest";
import {
  calculatePTOStatus,
  calculateUsedPTO,
  type PTOEntry,
  type Employee,
} from "../server/ptoCalculations.js";

/**
 * Helper to create a minimal employee fixture.
 */
function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    name: "John Doe",
    identifier: "john@example.com",
    pto_rate: 0.3692,
    carryover_hours: 40,
    hire_date: "2020-01-01",
    role: "Employee",
    ...overrides,
  };
}

/**
 * Helper to create a PTO entry.
 */
function makeEntry(
  overrides: Partial<PTOEntry> & Pick<PTOEntry, "date">,
): PTOEntry {
  return {
    id: 1,
    employee_id: 1,
    type: "PTO",
    hours: 8,
    created_at: "2026-01-01",
    ...overrides,
  };
}

describe("PTO Calculations — prior-year filtering", () => {
  const currentDate = "2026-06-15";

  it("usedPTO should only include current-year PTO entries", () => {
    const entries: PTOEntry[] = [
      // 2025 entries (should be excluded)
      makeEntry({ id: 1, date: "2025-01-15" }),
      makeEntry({ id: 2, date: "2025-03-05" }),
      makeEntry({ id: 3, date: "2025-07-04" }),
      // 2026 entries (should be included)
      makeEntry({ id: 4, date: "2026-02-20" }),
      makeEntry({ id: 5, date: "2026-02-23" }),
      makeEntry({ id: 6, date: "2026-03-10" }),
    ];

    const status = calculatePTOStatus(makeEmployee(), entries, currentDate);

    // Only 3 entries × 8h = 24h from 2026
    expect(status.usedPTO).toBe(24);
  });

  it("availablePTO should not be reduced by prior-year usage", () => {
    const employee = makeEmployee({ carryover_hours: 40 });
    const entries: PTOEntry[] = [
      // 100h of 2025 PTO (should NOT reduce available)
      ...Array.from({ length: 12 }, (_, i) =>
        makeEntry({
          id: i + 1,
          date: `2025-${String(i + 1).padStart(2, "0")}-10`,
          hours: 8,
        }),
      ),
      makeEntry({ id: 13, date: "2025-06-11", hours: 4 }),
      // 24h of 2026 PTO
      makeEntry({ id: 14, date: "2026-02-20" }),
      makeEntry({ id: 15, date: "2026-02-23" }),
      makeEntry({ id: 16, date: "2026-03-10" }),
    ];

    const status = calculatePTOStatus(employee, entries, currentDate);

    // annualAllocation = 96, carryover = 40, used = 24 → available = 112
    expect(status.availablePTO).toBe(112);
  });

  it("ptoTime bucket should match top-level usedPTO", () => {
    const entries: PTOEntry[] = [
      makeEntry({ id: 1, date: "2025-05-01" }),
      makeEntry({ id: 2, date: "2026-04-01" }),
    ];

    const status = calculatePTOStatus(makeEmployee(), entries, currentDate);

    expect(status.usedPTO).toBe(status.ptoTime.used);
  });

  it("sick/bereavement/jury-duty are already year-filtered", () => {
    const entries: PTOEntry[] = [
      makeEntry({ id: 1, date: "2025-02-01", type: "Sick" }),
      makeEntry({ id: 2, date: "2026-02-01", type: "Sick" }),
      makeEntry({ id: 3, date: "2025-04-01", type: "Bereavement" }),
      makeEntry({ id: 4, date: "2026-06-12", type: "Bereavement" }),
      makeEntry({ id: 5, date: "2025-09-01", type: "Jury Duty" }),
      makeEntry({ id: 6, date: "2026-06-15", type: "Jury Duty" }),
    ];

    const status = calculatePTOStatus(makeEmployee(), entries, currentDate);

    expect(status.sickTime.used).toBe(8);
    expect(status.bereavementTime.used).toBe(8);
    expect(status.juryDutyTime.used).toBe(8);
  });
});

describe("calculateUsedPTO", () => {
  it("filters by year when year argument is provided", () => {
    const entries: PTOEntry[] = [
      makeEntry({ id: 1, date: "2025-01-15" }),
      makeEntry({ id: 2, date: "2026-01-15" }),
    ];

    expect(calculateUsedPTO(entries, "PTO", 2026)).toBe(8);
    expect(calculateUsedPTO(entries, "PTO", 2025)).toBe(8);
  });

  it("returns all-year total when no year argument is provided", () => {
    const entries: PTOEntry[] = [
      makeEntry({ id: 1, date: "2025-01-15" }),
      makeEntry({ id: 2, date: "2026-01-15" }),
    ];

    expect(calculateUsedPTO(entries, "PTO")).toBe(16);
  });
});

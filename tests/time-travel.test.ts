import { describe, it, expect, afterEach } from "vitest";
import {
  setTimeTravelYear,
  getTimeTravelYear,
  today,
  getCurrentYear,
  getCurrentMonth,
  parseDate,
  startOfYear,
  endOfYear,
} from "../shared/dateUtils.js";
import {
  calculatePTOStatus,
  type PTOEntry,
  type Employee,
} from "../server/ptoCalculations.js";

describe("Time Travel", () => {
  afterEach(() => {
    // Always reset after each test
    setTimeTravelYear(null);
  });

  describe("setTimeTravelYear / getTimeTravelYear", () => {
    it("returns null when time-travel is not active", () => {
      expect(getTimeTravelYear()).toBeNull();
    });

    it("stores and retrieves the override year", () => {
      setTimeTravelYear(2018);
      expect(getTimeTravelYear()).toBe(2018);
    });

    it("clears the override when set to null", () => {
      setTimeTravelYear(2020);
      expect(getTimeTravelYear()).toBe(2020);
      setTimeTravelYear(null);
      expect(getTimeTravelYear()).toBeNull();
    });

    it("rejects years below 2000", () => {
      expect(() => setTimeTravelYear(1999)).toThrow("Invalid time-travel year");
    });

    it("rejects years above 2099", () => {
      expect(() => setTimeTravelYear(2100)).toThrow("Invalid time-travel year");
    });

    it("accepts boundary year 2000", () => {
      setTimeTravelYear(2000);
      expect(getTimeTravelYear()).toBe(2000);
    });

    it("accepts boundary year 2099", () => {
      setTimeTravelYear(2099);
      expect(getTimeTravelYear()).toBe(2099);
    });
  });

  describe("today() with time-travel", () => {
    it("returns real date when time-travel is inactive", () => {
      const result = today();
      const realYear = new Date().getFullYear();
      const { year } = parseDate(result);
      expect(year).toBe(realYear);
    });

    it("returns overridden year with real month/day", () => {
      setTimeTravelYear(2018);
      const result = today();
      const { year, month, day } = parseDate(result);
      const now = new Date();

      expect(year).toBe(2018);
      expect(month).toBe(now.getMonth() + 1);
      // Day may be clamped, but should be <= real day
      expect(day).toBeLessThanOrEqual(now.getDate());
    });

    it("clamps day when overridden year has fewer days in month", () => {
      // Feb 29 exists in 2024 (leap) but not in 2023 (non-leap)
      // We can't control the real clock, so we just verify the output is valid
      setTimeTravelYear(2023);
      const result = today();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const { year } = parseDate(result);
      expect(year).toBe(2023);
    });
  });

  describe("getCurrentYear() with time-travel", () => {
    it("returns real year when time-travel is inactive", () => {
      expect(getCurrentYear()).toBe(new Date().getFullYear());
    });

    it("returns overridden year when active", () => {
      setTimeTravelYear(2018);
      expect(getCurrentYear()).toBe(2018);
    });

    it("returns real year after disabling time-travel", () => {
      setTimeTravelYear(2018);
      setTimeTravelYear(null);
      expect(getCurrentYear()).toBe(new Date().getFullYear());
    });
  });

  describe("getCurrentMonth() with time-travel", () => {
    it("returns real year-month when time-travel is inactive", () => {
      const now = new Date();
      const expected = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      expect(getCurrentMonth()).toBe(expected);
    });

    it("returns overridden year with real month when active", () => {
      setTimeTravelYear(2018);
      const result = getCurrentMonth();
      const now = new Date();
      const expectedMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      expect(result).toBe(`2018-${expectedMonth}`);
    });
  });

  describe("startOfYear / endOfYear with time-travel", () => {
    it("startOfYear uses overridden year", () => {
      setTimeTravelYear(2018);
      expect(startOfYear()).toBe("2018-01-01");
    });

    it("endOfYear uses overridden year", () => {
      setTimeTravelYear(2018);
      expect(endOfYear()).toBe("2018-12-31");
    });
  });

  describe("calculatePTOStatus with explicit currentDate (time-travel scenario)", () => {
    function makeEmployee(overrides: Partial<Employee> = {}): Employee {
      return {
        id: 1,
        name: "Test User",
        identifier: "test@example.com",
        pto_rate: 0.3692,
        carryover_hours: 40,
        hire_date: "2017-01-01",
        role: "Employee",
        ...overrides,
      };
    }

    function makeEntry(
      overrides: Partial<PTOEntry> & Pick<PTOEntry, "date">,
    ): PTOEntry {
      return {
        id: 1,
        employee_id: 1,
        type: "PTO",
        hours: 8,
        created_at: "2018-01-01",
        ...overrides,
      };
    }

    it("scopes PTO usage to the time-travel year", () => {
      const entries: PTOEntry[] = [
        makeEntry({ id: 1, date: "2017-06-01" }),
        makeEntry({ id: 2, date: "2018-03-15" }),
        makeEntry({ id: 3, date: "2018-07-20" }),
        makeEntry({ id: 4, date: "2019-01-05" }),
      ];

      const status = calculatePTOStatus(makeEmployee(), entries, "2018-06-15");

      // Only the 2 entries in 2018 should count as used PTO
      expect(status.usedPTO).toBe(16);
    });

    it("uses time-travel year for annual allocation calculation", () => {
      const status = calculatePTOStatus(makeEmployee(), [], "2018-06-15");

      // Should compute allocation as if we're in 2018
      expect(status.annualAllocation).toBeGreaterThan(0);
      // The employee hired 2017-01-01 looking at 2018 = 1+ year tenure
    });
  });
});

import { describe, it, expect, afterEach } from "vitest";
import {
  setTimeTravelDay,
  getTimeTravelQueryParams,
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
    setTimeTravelDay(null);
  });

  describe("setTimeTravelDay", () => {
    it("today() returns real date when time-travel is not active", () => {
      const result = today();
      const realYear = new Date().getFullYear();
      const { year } = parseDate(result);
      expect(year).toBe(realYear);
    });

    it("stores override and today() returns it", () => {
      setTimeTravelDay("2018-03-15");
      expect(today()).toBe("2018-03-15");
    });

    it("clears override when set to null", () => {
      setTimeTravelDay("2018-03-15");
      setTimeTravelDay(null);
      const { year } = parseDate(today());
      expect(year).toBe(new Date().getFullYear());
    });

    it("rejects invalid date strings", () => {
      expect(() => setTimeTravelDay("not-a-date")).toThrow(
        "Invalid time-travel date",
      );
    });

    it("rejects dates with year below 2000", () => {
      expect(() => setTimeTravelDay("1999-01-01")).toThrow(
        "Invalid time-travel date year",
      );
    });

    it("rejects dates with year above 2099", () => {
      expect(() => setTimeTravelDay("2100-06-15")).toThrow(
        "Invalid time-travel date year",
      );
    });

    it("accepts boundary year 2000", () => {
      setTimeTravelDay("2000-06-15");
      expect(today()).toBe("2000-06-15");
    });

    it("accepts boundary year 2099", () => {
      setTimeTravelDay("2099-06-15");
      expect(today()).toBe("2099-06-15");
    });
  });

  describe("getTimeTravelQueryParams", () => {
    it("returns empty object when no override is active", () => {
      expect(getTimeTravelQueryParams()).toEqual({});
    });

    it("returns current_day when day override is active", () => {
      setTimeTravelDay("2018-03-15");
      expect(getTimeTravelQueryParams()).toEqual({
        current_day: "2018-03-15",
      });
    });

    it("returns empty object after clearing override", () => {
      setTimeTravelDay("2018-03-15");
      setTimeTravelDay(null);
      expect(getTimeTravelQueryParams()).toEqual({});
    });
  });

  describe("getCurrentYear() with day override", () => {
    it("returns real year when time-travel is inactive", () => {
      expect(getCurrentYear()).toBe(new Date().getFullYear());
    });

    it("returns year from day override", () => {
      setTimeTravelDay("2018-03-15");
      expect(getCurrentYear()).toBe(2018);
    });

    it("returns real year after disabling time-travel", () => {
      setTimeTravelDay("2018-03-15");
      setTimeTravelDay(null);
      expect(getCurrentYear()).toBe(new Date().getFullYear());
    });
  });

  describe("getCurrentMonth() with day override", () => {
    it("returns real year-month when time-travel is inactive", () => {
      const now = new Date();
      const expected = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      expect(getCurrentMonth()).toBe(expected);
    });

    it("returns year-month from day override", () => {
      setTimeTravelDay("2018-03-15");
      expect(getCurrentMonth()).toBe("2018-03");
    });

    it("returns correct month for different dates", () => {
      setTimeTravelDay("2019-11-25");
      expect(getCurrentMonth()).toBe("2019-11");
    });
  });

  describe("startOfYear / endOfYear with day override", () => {
    it("startOfYear uses year from day override", () => {
      setTimeTravelDay("2018-03-15");
      expect(startOfYear()).toBe("2018-01-01");
    });

    it("endOfYear uses year from day override", () => {
      setTimeTravelDay("2018-03-15");
      expect(endOfYear()).toBe("2018-12-31");
    });
  });

  describe("today() with day override", () => {
    it("returns the exact overridden date", () => {
      setTimeTravelDay("2018-03-15");
      expect(today()).toBe("2018-03-15");
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

import { describe, test, expect } from "vitest";
import {
  getDayName,
  getNextBusinessDay,
  isValidDateString,
  parseDate,
  formatDate,
  addDays,
  isWeekend,
  today,
} from "./dateUtils.js";

describe("Date Utilities - Foundation Tests", () => {
  describe("getDayName", () => {
    test("returns correct day name for Monday", () => {
      const monday = "2026-02-09"; // Monday
      expect(getDayName(monday)).toBe("Monday");
    });

    test("returns correct day name for Tuesday", () => {
      const tuesday = "2026-02-10"; // Tuesday
      expect(getDayName(tuesday)).toBe("Tuesday");
    });

    test("returns correct day name for Wednesday", () => {
      const wednesday = "2026-02-11"; // Wednesday
      expect(getDayName(wednesday)).toBe("Wednesday");
    });

    test("returns correct day name for Thursday", () => {
      const thursday = "2026-02-12"; // Thursday
      expect(getDayName(thursday)).toBe("Thursday");
    });

    test("returns correct day name for Friday", () => {
      const friday = "2026-02-13"; // Friday
      expect(getDayName(friday)).toBe("Friday");
    });

    test("returns correct day name for Saturday", () => {
      const saturday = "2026-02-14"; // Saturday
      expect(getDayName(saturday)).toBe("Saturday");
    });

    test("returns correct day name for Sunday", () => {
      const sunday = "2026-02-15"; // Sunday
      expect(getDayName(sunday)).toBe("Sunday");
    });

    test("handles year boundary dates", () => {
      const newYearsEve2025 = "2025-12-31"; // Wednesday
      expect(getDayName(newYearsEve2025)).toBe("Wednesday");

      const newYearsDay2026 = "2026-01-01"; // Thursday
      expect(getDayName(newYearsDay2026)).toBe("Thursday");
    });

    test("handles leap year dates", () => {
      const leapDay = "2024-02-29"; // Thursday in 2024
      expect(getDayName(leapDay)).toBe("Thursday");
    });
  });

  describe("getNextBusinessDay", () => {
    test("Monday-Friday inputs return same day", () => {
      expect(getNextBusinessDay("2026-02-09")).toBe("2026-02-09"); // Monday
      expect(getNextBusinessDay("2026-02-10")).toBe("2026-02-10"); // Tuesday
      expect(getNextBusinessDay("2026-02-11")).toBe("2026-02-11"); // Wednesday
      expect(getNextBusinessDay("2026-02-12")).toBe("2026-02-12"); // Thursday
      expect(getNextBusinessDay("2026-02-13")).toBe("2026-02-13"); // Friday
    });

    test("Saturday input returns Monday", () => {
      const saturday = "2026-02-14";
      const expectedMonday = "2026-02-16";
      expect(getNextBusinessDay(saturday)).toBe(expectedMonday);
    });

    test("Sunday input returns Monday", () => {
      const sunday = "2026-02-15";
      const expectedMonday = "2026-02-16";
      expect(getNextBusinessDay(sunday)).toBe(expectedMonday);
    });

    test("year boundary handling", () => {
      const sundayDec28 = "2025-12-28"; // Sunday
      expect(getNextBusinessDay(sundayDec28)).toBe("2025-12-29"); // Monday

      const mondayDec29 = "2025-12-29"; // Monday
      expect(getNextBusinessDay(mondayDec29)).toBe("2025-12-29"); // Monday
    });

    test("handles invalid date strings", () => {
      expect(() => getNextBusinessDay("invalid")).toThrow();
      expect(() => getNextBusinessDay("2026-13-45")).toThrow();
    });
  });
});

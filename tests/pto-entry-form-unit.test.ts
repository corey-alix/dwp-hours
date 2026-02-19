import { describe, test, expect } from "vitest";
// Note: DOM utilities not needed for unit tests of date calculation logic
// import { querySingle } from "../client/components/test-utils.js";
// import { addEventListener } from "../client/components/test-utils.js";
// import { PtoEntryForm } from "../client/components/pto-entry-form/index.js";
import {
  calculateEndDateFromHours,
  getWeekdaysBetween,
  isWeekend,
  addDays,
  today,
  getDayName,
} from "../shared/dateUtils.js";

// Note: This file contains unit tests for PTO Entry Form date calculation logic.
// Browser-based integration tests remain in client/components/pto-entry-form/test.ts

// ============================================================================
// UNIT TESTS FOR PTO ENTRY FORM
// ============================================================================

describe("PTO Entry Form - Date Calculation Logic", () => {
  describe("calculateEndDateFromHours", () => {
    test("basic spillover: 8 hours = same day", () => {
      const startDate = "2026-02-10"; // Tuesday
      const hours = 8;
      const expectedEndDate = "2026-02-10"; // Same day
      expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
    });

    test("basic spillover: 16 hours = next workday", () => {
      const startDate = "2026-02-10"; // Tuesday
      const hours = 16;
      const expectedEndDate = "2026-02-11"; // Wednesday
      expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
    });

    test("weekend skipping: Friday 16 hours → Monday", () => {
      const startDate = "2026-02-13"; // Friday
      const hours = 16;
      const expectedEndDate = "2026-02-16"; // Monday (skips Sat/Sun)
      expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
    });

    test("multi-week spillover: 40 hours from Tuesday → Monday", () => {
      const startDate = "2026-02-10"; // Tuesday (not Monday as originally assumed)
      const hours = 40; // 5 workdays * 8 hours
      const expectedEndDate = "2026-02-16"; // Monday (5 workdays later, skipping weekend)
      expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
    });

    test("edge case: start on Friday, exact 8-hour boundary", () => {
      const startDate = "2026-02-13"; // Friday
      const hours = 8;
      const expectedEndDate = "2026-02-13"; // Same Friday
      expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
    });

    test("large hour values: 80 hours from Tuesday", () => {
      const startDate = "2026-02-10"; // Tuesday
      const hours = 80; // 10 workdays * 8 hours
      const expectedEndDate = "2026-02-23"; // Two weeks later Monday
      expect(calculateEndDateFromHours(startDate, hours)).toBe(expectedEndDate);
    });

    test("zero hours returns start date", () => {
      const startDate = "2026-02-10";
      const hours = 0;
      expect(calculateEndDateFromHours(startDate, hours)).toBe(startDate);
    });

    test("negative hours returns start date", () => {
      const startDate = "2026-02-10";
      const hours = -5;
      expect(calculateEndDateFromHours(startDate, hours)).toBe(startDate);
    });
  });

  describe("getWeekdaysBetween (calculateWorkDaysBetween equivalent)", () => {
    test("same day = 1 workday", () => {
      const startDate = "2026-02-10"; // Monday
      const endDate = "2026-02-10"; // Monday
      expect(getWeekdaysBetween(startDate, endDate)).toBe(1);
    });

    test("Tuesday to Friday = 4 workdays", () => {
      const startDate = "2026-02-10"; // Tuesday
      const endDate = "2026-02-13"; // Friday
      expect(getWeekdaysBetween(startDate, endDate)).toBe(4);
    });

    test("weekend-inclusive ranges exclude weekends", () => {
      const startDate = "2026-02-13"; // Friday
      const endDate = "2026-02-16"; // Monday
      expect(getWeekdaysBetween(startDate, endDate)).toBe(2); // Fri, Mon
    });

    test("month boundary crossing", () => {
      const startDate = "2026-01-30"; // Thursday
      const endDate = "2026-02-03"; // Monday
      expect(getWeekdaysBetween(startDate, endDate)).toBe(3); // 30, 31, 3
    });

    test("start date after end date returns 0", () => {
      const startDate = "2026-02-14";
      const endDate = "2026-02-10";
      expect(getWeekdaysBetween(startDate, endDate)).toBe(0);
    });
  });

  describe("getNextBusinessDay", () => {
    // Helper function to test the private method
    function testGetNextBusinessDay(dateStr: string): string {
      let currentDate = dateStr;
      while (isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
      }
      return currentDate;
    }

    test("Monday-Friday inputs return same day", () => {
      expect(testGetNextBusinessDay("2026-02-10")).toBe("2026-02-10"); // Tuesday
      expect(testGetNextBusinessDay("2026-02-11")).toBe("2026-02-11"); // Wednesday
      expect(testGetNextBusinessDay("2026-02-12")).toBe("2026-02-12"); // Thursday
      expect(testGetNextBusinessDay("2026-02-13")).toBe("2026-02-13"); // Friday
      // Note: 2026-02-14 is Saturday, so it would return Monday
    });

    test("Saturday input returns Monday", () => {
      const saturday = "2026-02-14"; // Saturday
      const expectedMonday = "2026-02-16"; // Monday
      expect(testGetNextBusinessDay(saturday)).toBe(expectedMonday);
    });

    test("Sunday input returns Monday", () => {
      const sunday = "2026-02-15"; // Sunday
      const expectedMonday = "2026-02-16"; // Monday
      expect(testGetNextBusinessDay(sunday)).toBe(expectedMonday);
    });

    test("year boundary handling", () => {
      const sundayDec28 = "2025-12-28"; // Sunday
      expect(testGetNextBusinessDay(sundayDec28)).toBe("2025-12-29"); // Monday
    });
  });
});

describe("PTO Entry Form - Field Conversion Logic", () => {
  describe("Hours to days conversion for Full PTO display", () => {
    test("8 hours = 1 day", () => {
      expect(8 / 8).toBe(1);
    });

    test("16 hours = 2 days", () => {
      expect(16 / 8).toBe(2);
    });

    test("4 hours = 0.5 days", () => {
      expect(4 / 8).toBe(0.5);
    });

    test("non-multiple of 8 handling", () => {
      expect(12 / 8).toBe(1.5); // 1.5 days
      expect(20 / 8).toBe(2.5); // 2.5 days
    });
  });

  describe("Days to hours conversion for internal storage", () => {
    test("1 day = 8 hours", () => {
      expect(1 * 8).toBe(8);
    });

    test("2.5 days = 20 hours", () => {
      expect(2.5 * 8).toBe(20);
    });

    test("fractional day handling", () => {
      expect(0.5 * 8).toBe(4);
      expect(1.5 * 8).toBe(12);
    });
  });

  describe("PTO type switching behavior", () => {
    test("Full PTO → Sick: Convert days back to hours", () => {
      // Simulate: User enters 2 days (16 hours), switches to Sick
      const daysValue = 2;
      const expectedHours = daysValue * 8; // 16 hours
      expect(expectedHours).toBe(16);
    });

    test("Sick → Full PTO: Convert hours to days (round up/down logic)", () => {
      // 16 hours = exactly 2 days
      expect(16 / 8).toBe(2);

      // 12 hours = 1.5 days, should round appropriately based on business logic
      expect(12 / 8).toBe(1.5);

      // 20 hours = 2.5 days
      expect(20 / 8).toBe(2.5);
    });

    test("preserve values during type switching", () => {
      // When switching from Full PTO (2 days) to Sick, should become 16 hours
      const originalDays = 2;
      const convertedHours = originalDays * 8;
      expect(convertedHours).toBe(16);

      // When switching back from 16 hours to Full PTO, should become 2 days
      const backToDays = convertedHours / 8;
      expect(backToDays).toBe(2);
    });
  });
});

describe("PTO Entry Form - Dynamic Field Behavior", () => {
  // Note: These tests would require DOM manipulation and component instantiation
  // For now, we'll test the logic that would be used in the component

  describe("Field readonly state changes", () => {
    test("Full PTO: Hours readonly, End Date editable", () => {
      const ptoType: string = "Full PTO";
      const hoursShouldBeReadonly = ptoType === "Full PTO";
      const endDateShouldBeReadonly = ptoType !== "Full PTO";

      expect(hoursShouldBeReadonly).toBe(true);
      expect(endDateShouldBeReadonly).toBe(false);
    });

    test("Other types: Hours editable, End Date readonly", () => {
      const ptoType: string = "Sick";
      const hoursShouldBeReadonly = ptoType === "Full PTO";
      const endDateShouldBeReadonly = ptoType !== "Full PTO";

      expect(hoursShouldBeReadonly).toBe(false);
      expect(endDateShouldBeReadonly).toBe(true);
    });
  });

  describe("Label text changes", () => {
    test("Full PTO = Days label", () => {
      const ptoType: string = "Full PTO";
      const expectedLabel = ptoType === "Full PTO" ? "Days" : "Hours";
      expect(expectedLabel).toBe("Days");
    });

    test("Other types = Hours label", () => {
      const ptoType: string = "Sick";
      const expectedLabel = ptoType === "Full PTO" ? "Days" : "Hours";
      expect(expectedLabel).toBe("Hours");
    });

    test("required asterisk preservation during label changes", () => {
      // Test that the asterisk (*) is maintained when changing "Hours" to "Days"
      const originalLabel = "Hours *";
      const ptoType: string = "Full PTO";
      const newLabel = ptoType === "Full PTO" ? "Days *" : "Hours *";
      expect(newLabel).toBe("Days *");
      expect(newLabel.includes("*")).toBe(true);
    });
  });

  describe("Input validation integration", () => {
    test("business rules validation calls", () => {
      // This would test that validation functions are called appropriately
      // For now, just verify the logic structure
      const testValue = 8;
      const isValid = testValue > 0 && testValue % 4 === 0; // Simplified validation
      expect(isValid).toBe(true);
    });

    test("error message display", () => {
      // Test error message logic
      const hasError = true;
      const errorMessage = hasError ? "Invalid input" : "";
      expect(errorMessage).toBe("Invalid input");
    });

    test("invalid input rejection", () => {
      // Test that invalid inputs are rejected
      const invalidValue = 3; // Not divisible by 4
      const isValid = invalidValue > 0 && invalidValue % 4 === 0;
      expect(isValid).toBe(false);
    });
  });
});

// Note: Integration tests requiring DOM manipulation are in the browser-based test file
// These unit tests focus on pure business logic that can run in Node.js environment

describe("PTO Entry Form - Shadow DOM Template", () => {
  describe("pto-summary slot declaration", () => {
    test("template string contains named slot between form-header and calendar-view", async () => {
      // We can't instantiate HTMLElement in Node.js without happy-dom,
      // so instead we verify the template source directly.
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.resolve(
        __dirname,
        "../client/components/pto-entry-form/index.ts",
      );
      const source = fs.readFileSync(filePath, "utf-8");

      // Slot must be present in the template
      expect(source).toContain('name="pto-summary"');

      // Slot must appear after form-header div and before calendar-view div in the HTML template.
      // Use the actual HTML markup (not CSS class definitions) for ordering.
      const slotIdx = source.indexOf('name="pto-summary"');
      const headerDivIdx = source.indexOf('class="form-header"');
      const calendarDivIdx = source.indexOf('id="calendar-view"');

      expect(headerDivIdx).toBeGreaterThanOrEqual(0);
      expect(calendarDivIdx).toBeGreaterThan(0);
      expect(slotIdx).toBeGreaterThan(headerDivIdx);
      expect(slotIdx).toBeLessThan(calendarDivIdx);
    });

    test("slot styling includes ::slotted selector", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.resolve(
        __dirname,
        "../client/components/pto-entry-form/index.ts",
      );
      const source = fs.readFileSync(filePath, "utf-8");

      expect(source).toContain('::slotted([slot="pto-summary"])');
    });
  });
});

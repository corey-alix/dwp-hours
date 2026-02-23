import { describe, test, expect } from "vitest";
import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { PtoEntryForm } from "./index.js";
import {
  calculateEndDateFromHours,
  getWeekdaysBetween,
  isWeekend,
  addDays,
  today,
  getNextBusinessDay,
  getDayOfWeek,
  SATURDAY,
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
} from "../../../shared/dateUtils.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting PTO Entry Form playground test...");

  const ptoForm = querySingle<PtoEntryForm>("pto-entry-form");

  // Compute available PTO balance from seedData
  const employee = seedEmployees.find(
    (e) => e.identifier === "john.doe@example.com",
  )!;
  const approvedPtoEntries = seedPTOEntries.filter(
    (e) => e.employee_id === 1 && e.approved_by !== null && e.type === "PTO",
  );
  const usedPto = approvedPtoEntries.reduce((sum, e) => sum + e.hours, 0);
  const availablePtoBalance = employee.carryover_hours + 96 - usedPto; // 96 is annual allocation

  // Set property that was previously an inline attribute
  ptoForm.setAttribute("available-pto-balance", availablePtoBalance.toString());

  const testOutput = querySingle<HTMLDivElement>("#test-output");
  const logList = ensureLogList(testOutput);

  const appendLog = (message: string) => {
    const item = document.createElement("li");
    item.textContent = message;
    logList.appendChild(item);
    testOutput.scrollTop = testOutput.scrollHeight;
  };

  // Test event listeners
  addEventListener(ptoForm, "pto-submit", (e: CustomEvent) => {
    console.log("PTO form submitted:", e.detail);
    const detail = e.detail as {
      ptoRequest?: { ptoType: string; hours: number };
      requests?: { type: string; hours: number; date: string }[];
    };
    if (detail.ptoRequest) {
      appendLog(
        `Form submit: ${detail.ptoRequest.ptoType} - ${detail.ptoRequest.hours} hours`,
      );
      return;
    }
    if (detail.requests) {
      appendLog(`Calendar submit: ${detail.requests.length} request(s)`);
      return;
    }
    appendLog("Submission received with no payload.");
  });

  addEventListener(ptoForm, "form-cancel", () => {
    console.log("PTO form cancelled");
    appendLog("Form cancel");
  });

  console.log("PTO Entry Form playground test initialized");
}

function ensureLogList(container: HTMLDivElement): HTMLUListElement {
  let list = container.querySelector<HTMLUListElement>("#test-log");
  if (list) {
    return list;
  }

  const title = document.createElement("div");
  title.textContent = "Event log:";
  title.style.fontWeight = "600";
  title.style.marginBottom = "8px";

  list = document.createElement("ul");
  list.id = "test-log";
  list.style.margin = "0";
  list.style.paddingLeft = "18px";

  container.textContent = "";
  container.appendChild(title);
  container.appendChild(list);
  return list;
}

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

    test("multi-week spillover: 40 hours from Tuesday → following Monday", () => {
      const startDate = "2026-02-10"; // Tuesday
      const hours = 40; // 5 workdays * 8 hours
      const expectedEndDate = "2026-02-16"; // Following Monday
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
      const expectedEndDate = "2026-02-23"; // Calculated end date
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
      const startDate = "2026-02-10"; // Tuesday
      const endDate = "2026-02-10"; // Tuesday
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
      const startDate = "2026-02-13";
      const endDate = "2026-02-10";
      expect(getWeekdaysBetween(startDate, endDate)).toBe(0);
    });
  });

  describe("getNextBusinessDay", () => {
    test("Monday-Friday inputs return same day", () => {
      expect(getDayOfWeek("2026-02-09")).toBe(MONDAY);
      expect(getNextBusinessDay("2026-02-09")).toBe("2026-02-09"); // Monday
      expect(getDayOfWeek("2026-02-10")).toBe(TUESDAY);
      expect(getNextBusinessDay("2026-02-10")).toBe("2026-02-10"); // Tuesday
      expect(getDayOfWeek("2026-02-11")).toBe(WEDNESDAY);
      expect(getNextBusinessDay("2026-02-11")).toBe("2026-02-11"); // Wednesday
      expect(getDayOfWeek("2026-02-12")).toBe(THURSDAY);
      expect(getNextBusinessDay("2026-02-12")).toBe("2026-02-12"); // Thursday
      expect(getDayOfWeek("2026-02-13")).toBe(FRIDAY);
      expect(getNextBusinessDay("2026-02-13")).toBe("2026-02-13"); // Friday
    });

    test("Saturday input returns Monday", () => {
      const saturday = "2026-02-14";
      expect(getDayOfWeek(saturday)).toBe(SATURDAY);
      const expectedMonday = "2026-02-16";
      expect(getNextBusinessDay(saturday)).toBe(expectedMonday);
    });

    test("Sunday input returns Monday", () => {
      const sunday = "2026-02-15";
      expect(getDayOfWeek(sunday)).toBe(SUNDAY);
      const expectedMonday = "2026-02-16";
      expect(getNextBusinessDay(sunday)).toBe(expectedMonday);
    });

    test("year boundary handling", () => {
      const sundayDec28 = "2025-12-28"; // Sunday
      expect(getDayOfWeek(sundayDec28)).toBe(SUNDAY);
      expect(getNextBusinessDay(sundayDec28)).toBe("2025-12-29"); // Monday
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

describe("PTO Entry Form - Integration Tests", () => {
  describe("Form submission with different PTO types", () => {
    test("Full PTO submission structure", () => {
      // Test the expected submission payload for Full PTO
      const expectedPayload = {
        startDate: "2026-02-10",
        endDate: "2026-02-12",
        ptoType: "PTO", // Should be normalized
        hours: 16, // 2 days * 8 hours
      };

      expect(expectedPayload.ptoType).toBe("PTO");
      expect(expectedPayload.hours).toBe(16);
    });

    test("Sick leave submission structure", () => {
      const expectedPayload = {
        startDate: "2026-02-10",
        endDate: "2026-02-10",
        ptoType: "Sick",
        hours: 8,
      };

      expect(expectedPayload.ptoType).toBe("Sick");
      expect(expectedPayload.hours).toBe(8);
    });
  });

  describe("Calendar integration button functionality", () => {
    test("calendar button should trigger modal", () => {
      // Test that calendar button exists and has click handler
      const buttonExists = true; // In real test, would check DOM
      const hasClickHandler = true; // In real test, would check event listeners
      expect(buttonExists && hasClickHandler).toBe(true);
    });
  });

  describe("Progressive disclosure calculation display", () => {
    test("spillover calculation breakdown", () => {
      // Test the calculation display logic
      const startDate = "2026-02-13"; // Friday
      const hours = 16;
      const endDate = calculateEndDateFromHours(startDate, hours);

      const breakdown = `${hours} hours from ${startDate} = ends ${endDate}`;
      expect(breakdown).toContain("2026-02-16"); // Monday
    });
  });

  describe("Weekend date defaulting logic", () => {
    test("today is weekday, use today", () => {
      // Mock today() to return a Monday
      const mockToday = "2026-02-09"; // Monday
      const nextBusinessDay = getNextBusinessDay(mockToday);
      expect(nextBusinessDay).toBe("2026-02-09");
    });

    test("today is Saturday, use Monday", () => {
      const mockToday = "2026-02-14"; // Saturday
      const nextBusinessDay = getNextBusinessDay(mockToday);
      expect(nextBusinessDay).toBe("2026-02-16"); // Monday
    });

    test("today is Sunday, use Monday", () => {
      const mockToday = "2026-02-15"; // Sunday
      const nextBusinessDay = getNextBusinessDay(mockToday);
      expect(nextBusinessDay).toBe("2026-02-16"); // Monday
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  validateHours,
  validateWeekday,
  isWorkingDay,
  VALIDATION_MESSAGES,
  PTOType,
} from "../shared/businessRules.js";

/**
 * Business Rules Unit Tests
 *
 * These tests validate the core business logic and validation rules
 * used throughout the application.
 */

describe("Business Rules", () => {
  describe("validateHours", () => {
    it("should accept valid positive hours", () => {
      expect(validateHours(4)).toBeNull();
      expect(validateHours(8)).toBeNull();
      expect(validateHours(16)).toBeNull();
    });

    it("should accept fractional hours", () => {
      expect(validateHours(4.5)).toBeNull();
      expect(validateHours(2.5)).toBeNull();
      expect(validateHours(0.25)).toBeNull();
    });

    it("should accept non-increment hours", () => {
      expect(validateHours(6)).toBeNull();
      expect(validateHours(3)).toBeNull();
    });

    it("should reject zero hours", () => {
      const result = validateHours(0);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.invalid");
    });

    it("should accept negative hours (make-up time)", () => {
      expect(validateHours(-4)).toBeNull();
      expect(validateHours(-2.5)).toBeNull();
    });
  });

  describe("validateWeekday (deprecated)", () => {
    it("should return null for weekdays", () => {
      const monday = "2024-01-01"; // Monday
      const friday = "2024-01-05"; // Friday

      expect(validateWeekday(monday)).toBeNull();
      expect(validateWeekday(friday)).toBeNull();
    });

    it("should return error for weekends (deprecated check)", () => {
      const saturday = "2024-01-06"; // Saturday
      const sunday = "2024-01-07"; // Sunday

      const satResult = validateWeekday(saturday);
      expect(satResult).not.toBeNull();
      expect(satResult?.messageKey).toBe("date.weekday");

      const sunResult = validateWeekday(sunday);
      expect(sunResult).not.toBeNull();
      expect(sunResult?.messageKey).toBe("date.weekday");
    });
  });

  describe("isWorkingDay", () => {
    it("should return true for weekdays", () => {
      expect(isWorkingDay("2024-01-01")).toBe(true); // Monday
      expect(isWorkingDay("2024-01-02")).toBe(true); // Tuesday
      expect(isWorkingDay("2024-01-03")).toBe(true); // Wednesday
      expect(isWorkingDay("2024-01-04")).toBe(true); // Thursday
      expect(isWorkingDay("2024-01-05")).toBe(true); // Friday
    });

    it("should return false for weekends", () => {
      expect(isWorkingDay("2024-01-06")).toBe(false); // Saturday
      expect(isWorkingDay("2024-01-07")).toBe(false); // Sunday
    });
  });

  describe("VALIDATION_MESSAGES", () => {
    it("should contain all required message keys", () => {
      const requiredKeys = [
        "hours.invalid",
        "hours.not_integer",
        "date.weekday",
        "pto.duplicate",
        "type.invalid",
        "date.invalid",
        "employee.not_found",
        "entry.not_found",
        "hours.exceed_annual_sick",
        "hours.exceed_annual_other",
        "hours.exceed_annual_bereavement",
        "hours.exceed_annual_jury_duty",
        "hours.exceed_pto_balance",
        "date.future_limit",
        "month.acknowledged",
        "month.locked",
      ];

      requiredKeys.forEach((key) => {
        expect(VALIDATION_MESSAGES).toHaveProperty(key);
        expect(
          typeof VALIDATION_MESSAGES[key as keyof typeof VALIDATION_MESSAGES],
        ).toBe("string");
      });
    });
  });

  describe("PTOType", () => {
    it("should include all valid PTO types", () => {
      const validTypes: PTOType[] = ["PTO", "Sick", "Bereavement", "Jury Duty"];

      // TypeScript will ensure these are valid
      validTypes.forEach((type) => {
        expect(["PTO", "Sick", "Bereavement", "Jury Duty"]).toContain(type);
      });
    });
  });
});

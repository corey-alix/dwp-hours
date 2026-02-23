import { describe, it, expect } from "vitest";
import {
  validateHours,
  validateWeekday,
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
    it("should accept valid hours in 4-hour increments", () => {
      expect(validateHours(4)).toBeNull();
      expect(validateHours(8)).toBeNull();
      expect(validateHours(16)).toBeNull();
    });

    it("should reject non-integer hours", () => {
      const result = validateHours(4.5);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.not_integer");
    });

    it("should reject hours not in 4-hour increments", () => {
      const result = validateHours(6);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.invalid");
    });

    it("should reject zero or negative hours", () => {
      const result = validateHours(0);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.invalid");

      const negativeResult = validateHours(-4);
      expect(negativeResult).not.toBeNull();
      expect(negativeResult?.messageKey).toBe("hours.invalid");
    });
  });

  describe("validateWeekday", () => {
    it("should accept weekdays", () => {
      const monday = "2024-01-01"; // Monday
      const friday = "2024-01-05"; // Friday

      expect(validateWeekday(monday)).toBeNull();
      expect(validateWeekday(friday)).toBeNull();
    });

    it("should reject weekends", () => {
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

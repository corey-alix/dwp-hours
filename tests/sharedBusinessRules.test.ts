import { describe, it, expect } from "vitest";
import {
  validateHours,
  validateWeekday,
  validatePTOType,
  normalizePTOType,
  validateDateString,
  validateAnnualLimits,
  validatePTOBalance,
  VALIDATION_MESSAGES,
  type PTOType,
} from "../shared/businessRules.js";

describe("Business Rules Validation", () => {
  describe("validateHours", () => {
    it("should accept 4 hours", () => {
      expect(validateHours(4)).toBeNull();
    });

    it("should accept 8 hours", () => {
      expect(validateHours(8)).toBeNull();
    });

    it("should accept hours in 4-hour increments", () => {
      expect(validateHours(12)).toBeNull();
      expect(validateHours(16)).toBeNull();
    });

    it("should reject non-integer hours", () => {
      const result = validateHours(4.5);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.not_integer");
    });

    it("should reject hours that are not in 4-hour increments", () => {
      const result = validateHours(6);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.invalid");
    });

    it("should reject non-positive hours", () => {
      const result = validateHours(0);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.invalid");
    });
  });

  describe("validateWeekday", () => {
    it("should accept Monday", () => {
      const monday = "2024-01-01"; // January 1, 2024 was Monday
      expect(validateWeekday(monday)).toBeNull();
    });

    it("should accept Friday", () => {
      const friday = "2024-01-05"; // January 5, 2024 was Friday
      expect(validateWeekday(friday)).toBeNull();
    });

    it("should reject Saturday", () => {
      const saturday = "2024-01-06"; // January 6, 2024 was Saturday
      const result = validateWeekday(saturday);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("date.weekday");
    });

    it("should reject Sunday", () => {
      const sunday = "2024-01-07"; // January 7, 2024 was Sunday
      const result = validateWeekday(sunday);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("date.weekday");
    });
  });

  describe("validatePTOType", () => {
    it("should accept valid PTO types", () => {
      const validTypes: PTOType[] = ["Sick", "PTO", "Bereavement", "Jury Duty"];
      validTypes.forEach((type) => {
        expect(validatePTOType(type)).toBeNull();
      });
    });

    it("should reject invalid PTO type", () => {
      const result = validatePTOType("Invalid");
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("type.invalid");
    });
  });

  describe("normalizePTOType", () => {
    it("should normalize Full PTO to PTO", () => {
      expect(normalizePTOType("Full PTO")).toBe("PTO");
    });

    it("should normalize Partial PTO to PTO", () => {
      expect(normalizePTOType("Partial PTO")).toBe("PTO");
    });

    it("should leave other types unchanged", () => {
      expect(normalizePTOType("Sick")).toBe("Sick");
      expect(normalizePTOType("Bereavement")).toBe("Bereavement");
    });
  });

  describe("validateDateString", () => {
    it("should accept valid date string", () => {
      expect(validateDateString("2024-01-01")).toBeNull();
    });

    it("should reject invalid date string", () => {
      const result = validateDateString("invalid-date");
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("date.invalid");
    });
  });

  describe("validatePTOBalance", () => {
    it("should accept request within balance", () => {
      expect(validatePTOBalance(4, 8)).toBeNull();
      expect(validatePTOBalance(8, 8)).toBeNull();
    });

    it("should reject request exceeding balance", () => {
      const result = validatePTOBalance(12, 8);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_pto_balance");
    });

    it("should reject request when balance is zero", () => {
      const result = validatePTOBalance(4, 0);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_pto_balance");
    });
  });

  describe("validateAnnualLimits", () => {
    it("should accept Sick time within annual limit", () => {
      expect(validateAnnualLimits("Sick", 4, 20)).toBeNull();
    });

    it("should reject Sick time exceeding annual limit", () => {
      const result = validateAnnualLimits("Sick", 8, 20);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_annual_sick");
    });

    it("should accept Bereavement within annual limit", () => {
      expect(validateAnnualLimits("Bereavement", 4, 36)).toBeNull();
    });

    it("should reject Bereavement exceeding annual limit", () => {
      const result = validateAnnualLimits("Bereavement", 8, 36);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_annual_other");
    });

    it("should accept Jury Duty within annual limit", () => {
      expect(validateAnnualLimits("Jury Duty", 4, 36)).toBeNull();
    });

    it("should reject Jury Duty exceeding annual limit", () => {
      const result = validateAnnualLimits("Jury Duty", 8, 36);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_annual_other");
    });

    it("should accept PTO when balance is sufficient", () => {
      expect(validateAnnualLimits("PTO", 4, 0, 8)).toBeNull();
    });

    it("should reject PTO when balance is insufficient", () => {
      const result = validateAnnualLimits("PTO", 12, 0, 8);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_pto_balance");
    });

    it("should skip PTO balance check when balance not provided", () => {
      expect(validateAnnualLimits("PTO", 100, 0)).toBeNull();
    });

    it("should handle edge case of exact balance match for PTO", () => {
      expect(validateAnnualLimits("PTO", 8, 0, 8)).toBeNull();
    });
  });

  describe("VALIDATION_MESSAGES", () => {
    it("should contain all expected message keys", () => {
      const expectedKeys = [
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
      ];

      expectedKeys.forEach((key) => {
        expect(VALIDATION_MESSAGES).toHaveProperty(key);
      });
    });
  });
});

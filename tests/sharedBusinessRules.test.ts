import { describe, it, expect } from "vitest";
import {
  validateHours,
  validateWeekday,
  validatePTOType,
  normalizePTOType,
  validateDateString,
  validateAnnualLimits,
  validatePTOBalance,
  validateMonthEditable,
  formatLockedMessage,
  validateAdminCanLockMonth,
  formatMonthNotEndedMessage,
  getEarliestAdminLockDate,
  getPriorMonth,
  VALIDATION_MESSAGES,
  BUSINESS_RULES_CONSTANTS,
  type PTOType,
  type MonthLockValidationError,
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
        "month.locked",
        "employee.not_acknowledged",
        "month.not_ended",
        "month.admin_locked_cannot_unlock",
      ];

      expectedKeys.forEach((key) => {
        expect(VALIDATION_MESSAGES).toHaveProperty(key);
      });
    });
  });

  describe("validateMonthEditable", () => {
    it("should return null when month is not acknowledged", () => {
      expect(validateMonthEditable(false)).toBeNull();
    });

    it("should return error when month is acknowledged without lock info", () => {
      const result = validateMonthEditable(true);
      expect(result).not.toBeNull();
      expect(result!.messageKey).toBe("month.acknowledged");
    });

    it("should return MonthLockValidationError with lock metadata when lock info provided", () => {
      const result = validateMonthEditable(true, {
        adminName: "Jane Admin",
        acknowledgedAt: "2026-02-15T10:00:00.000Z",
      }) as MonthLockValidationError;
      expect(result).not.toBeNull();
      expect(result.messageKey).toBe("month.locked");
      expect(result.lockedBy).toBe("Jane Admin");
      expect(result.lockedAt).toBe("2026-02-15T10:00:00.000Z");
    });
  });

  describe("formatLockedMessage", () => {
    it("should substitute placeholders in the locked message", () => {
      const msg = formatLockedMessage("Jane Admin", "2026-02-15T10:00:00.000Z");
      expect(msg).toContain("Jane Admin");
      expect(msg).toContain("2026-02-15T10:00:00.000Z");
      expect(msg).not.toContain("{lockedBy}");
      expect(msg).not.toContain("{lockedAt}");
    });
  });

  describe("BUSINESS_RULES_CONSTANTS.SESSION_INACTIVITY_THRESHOLD_MS", () => {
    it("should be 8 hours in milliseconds", () => {
      expect(BUSINESS_RULES_CONSTANTS.SESSION_INACTIVITY_THRESHOLD_MS).toBe(
        8 * 60 * 60 * 1000,
      );
    });
  });

  describe("validateAdminCanLockMonth", () => {
    it("should return null when month has fully ended", () => {
      // February 2026 ends on 2026-02-28; checking on 2026-03-01 should pass
      expect(validateAdminCanLockMonth("2026-02", "2026-03-01")).toBeNull();
    });

    it("should return null when well past the month end", () => {
      expect(validateAdminCanLockMonth("2026-01", "2026-03-15")).toBeNull();
    });

    it("should return error when current date is within the month", () => {
      const result = validateAdminCanLockMonth("2026-02", "2026-02-15");
      expect(result).not.toBeNull();
      expect(result!.messageKey).toBe("month.not_ended");
    });

    it("should return error when current date is last day of the month", () => {
      const result = validateAdminCanLockMonth("2026-02", "2026-02-28");
      expect(result).not.toBeNull();
      expect(result!.messageKey).toBe("month.not_ended");
    });

    it("should handle December → January year rollover", () => {
      expect(validateAdminCanLockMonth("2025-12", "2026-01-01")).toBeNull();
      const result = validateAdminCanLockMonth("2025-12", "2025-12-31");
      expect(result).not.toBeNull();
    });

    it("should return error for invalid month format", () => {
      const result = validateAdminCanLockMonth("invalid", "2026-03-01");
      expect(result).not.toBeNull();
      expect(result!.messageKey).toBe("date.invalid");
    });
  });

  describe("formatMonthNotEndedMessage", () => {
    it("should substitute the earliestDate placeholder", () => {
      const msg = formatMonthNotEndedMessage("2026-03-01");
      expect(msg).toContain("2026-03-01");
      expect(msg).not.toContain("{earliestDate}");
    });
  });

  describe("getEarliestAdminLockDate", () => {
    it("should return 1st of next month", () => {
      expect(getEarliestAdminLockDate("2026-02")).toBe("2026-03-01");
    });

    it("should handle December → January", () => {
      expect(getEarliestAdminLockDate("2025-12")).toBe("2026-01-01");
    });

    it("should return empty string for invalid input", () => {
      expect(getEarliestAdminLockDate("bad")).toBe("");
    });
  });

  describe("getPriorMonth", () => {
    it("should return the month before", () => {
      expect(getPriorMonth("2026-02-23")).toBe("2026-01");
    });

    it("should handle January → December year rollback", () => {
      expect(getPriorMonth("2026-01-15")).toBe("2025-12");
    });

    it("should handle March → February", () => {
      expect(getPriorMonth("2026-03-01")).toBe("2026-02");
    });
  });
});

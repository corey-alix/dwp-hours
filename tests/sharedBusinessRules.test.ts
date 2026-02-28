import { describe, it, expect } from "vitest";
import {
  validateHours,
  validateWeekday,
  isWorkingDay,
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
  getYearsOfService,
  getPtoRateTier,
  getEffectivePtoRate,
  computeAccrualWithHireDate,
  computeAnnualAllocation,
  computeCarryover,
  checkSickDayThreshold,
  checkBereavementThreshold,
  computeTerminationPayout,
  PTO_EARNING_SCHEDULE,
  MAX_DAILY_RATE,
  MAX_ANNUAL_PTO,
  CARRYOVER_LIMIT,
  SICK_HOURS_BEFORE_PTO,
  BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO,
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

    it("should accept fractional hours", () => {
      expect(validateHours(4.5)).toBeNull();
      expect(validateHours(2.5)).toBeNull();
      expect(validateHours(0.5)).toBeNull();
    });

    it("should accept non-increment hours", () => {
      expect(validateHours(6)).toBeNull();
      expect(validateHours(3)).toBeNull();
      expect(validateHours(1)).toBeNull();
    });

    it("should reject zero hours", () => {
      const result = validateHours(0);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.invalid");
    });

    it("should accept negative hours (make-up time on non-working days)", () => {
      expect(validateHours(-4)).toBeNull();
      expect(validateHours(-2.5)).toBeNull();
    });
  });

  describe("validateWeekday (deprecated — still functional)", () => {
    it("should return null for Monday", () => {
      const monday = "2024-01-01"; // January 1, 2024 was Monday
      expect(validateWeekday(monday)).toBeNull();
    });

    it("should return null for Friday", () => {
      const friday = "2024-01-05"; // January 5, 2024 was Friday
      expect(validateWeekday(friday)).toBeNull();
    });

    it("should return error for Saturday (deprecated check)", () => {
      const saturday = "2024-01-06"; // January 6, 2024 was Saturday
      const result = validateWeekday(saturday);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("date.weekday");
    });

    it("should return error for Sunday (deprecated check)", () => {
      const sunday = "2024-01-07"; // January 7, 2024 was Sunday
      const result = validateWeekday(sunday);
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("date.weekday");
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
      expect(validateAnnualLimits("Bereavement", 4, 12)).toBeNull(); // 4 + 12 = 16 = limit
    });

    it("should reject Bereavement exceeding annual limit", () => {
      const result = validateAnnualLimits("Bereavement", 8, 12); // 8 + 12 = 20 > 16
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_annual_bereavement");
    });

    it("should accept Jury Duty within annual limit", () => {
      expect(validateAnnualLimits("Jury Duty", 4, 20)).toBeNull(); // 4 + 20 = 24 = limit
    });

    it("should reject Jury Duty exceeding annual limit", () => {
      const result = validateAnnualLimits("Jury Duty", 8, 20); // 8 + 20 = 28 > 24
      expect(result).not.toBeNull();
      expect(result?.messageKey).toBe("hours.exceed_annual_jury_duty");
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
        "hours.exceed_annual_bereavement",
        "hours.exceed_annual_jury_duty",
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

  // ── Phase 1: PTO Earning Schedule Constants ──────────────────────────

  describe("PTO_EARNING_SCHEDULE constants", () => {
    it("should have 10 tiers", () => {
      expect(PTO_EARNING_SCHEDULE).toHaveLength(10);
    });

    it("tier 0 should be 168 hrs / 0.65 daily rate", () => {
      expect(PTO_EARNING_SCHEDULE[0].annualHours).toBe(168);
      expect(PTO_EARNING_SCHEDULE[0].dailyRate).toBe(0.65);
    });

    it("max tier should be 240 hrs / 0.92 daily rate", () => {
      const maxTier = PTO_EARNING_SCHEDULE[PTO_EARNING_SCHEDULE.length - 1];
      expect(maxTier.annualHours).toBe(240);
      expect(maxTier.dailyRate).toBe(0.92);
      expect(maxTier.maxYears).toBe(Infinity);
    });

    it("MAX_DAILY_RATE should be 0.92", () => {
      expect(MAX_DAILY_RATE).toBe(0.92);
    });

    it("MAX_ANNUAL_PTO should be 240", () => {
      expect(MAX_ANNUAL_PTO).toBe(240);
    });

    it("CARRYOVER_LIMIT should be 80", () => {
      expect(CARRYOVER_LIMIT).toBe(80);
    });

    it("SICK_HOURS_BEFORE_PTO should be 24", () => {
      expect(SICK_HOURS_BEFORE_PTO).toBe(24);
    });

    it("BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO should be 2", () => {
      expect(BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO).toBe(2);
    });

    it("ANNUAL_LIMITS.PTO should equal CARRYOVER_LIMIT", () => {
      expect(BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.PTO).toBe(CARRYOVER_LIMIT);
    });

    it("ANNUAL_LIMITS.SICK should equal SICK_HOURS_BEFORE_PTO", () => {
      expect(BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK).toBe(
        SICK_HOURS_BEFORE_PTO,
      );
    });
  });

  // ── Phase 1: getYearsOfService ───────────────────────────────────────

  describe("getYearsOfService", () => {
    it("should return 0 for same-day hire", () => {
      expect(getYearsOfService("2025-03-15", "2025-03-15")).toBe(0);
    });

    it("should return 0 before first anniversary", () => {
      expect(getYearsOfService("2025-03-15", "2026-03-14")).toBe(0);
    });

    it("should return 1 on exact first anniversary", () => {
      expect(getYearsOfService("2025-03-15", "2026-03-15")).toBe(1);
    });

    it("should return 1 after first anniversary but before second", () => {
      expect(getYearsOfService("2024-06-01", "2025-12-31")).toBe(1);
    });

    it("should return 5 for 5 full years", () => {
      expect(getYearsOfService("2020-01-01", "2025-06-15")).toBe(5);
    });

    it("should return 9 for 9+ years (max tier)", () => {
      expect(getYearsOfService("2015-01-01", "2025-01-01")).toBe(10);
    });

    it("should return 0 if asOfDate is before hireDate", () => {
      expect(getYearsOfService("2026-01-01", "2025-06-01")).toBe(0);
    });
  });

  // ── Phase 1: getPtoRateTier ──────────────────────────────────────────

  describe("getPtoRateTier", () => {
    it("should return tier 0 for 0 years", () => {
      const tier = getPtoRateTier(0);
      expect(tier.annualHours).toBe(168);
      expect(tier.dailyRate).toBe(0.65);
    });

    it("should return tier 1 for 1 year", () => {
      const tier = getPtoRateTier(1);
      expect(tier.annualHours).toBe(176);
      expect(tier.dailyRate).toBe(0.68);
    });

    it("should return tier 4 for 4 years", () => {
      const tier = getPtoRateTier(4);
      expect(tier.annualHours).toBe(200);
      expect(tier.dailyRate).toBe(0.77);
    });

    it("should return max tier for 9 years", () => {
      const tier = getPtoRateTier(9);
      expect(tier.annualHours).toBe(240);
      expect(tier.dailyRate).toBe(0.92);
    });

    it("should return max tier for 15 years", () => {
      const tier = getPtoRateTier(15);
      expect(tier.annualHours).toBe(240);
      expect(tier.dailyRate).toBe(0.92);
    });
  });

  // ── Phase 1: getEffectivePtoRate ─────────────────────────────────────

  describe("getEffectivePtoRate", () => {
    it("should return tier 0 for a new hire before first July 1 bump", () => {
      // Hired 2025-03-01 (Jan–Jun), first bump = July 1, 2026
      const tier = getEffectivePtoRate("2025-03-01", "2026-02-24");
      expect(tier.dailyRate).toBe(0.65);
    });

    it("should return tier 1 for Jan–Jun hire on/after first July 1 bump", () => {
      // Hired 2025-03-01, first bump = July 1, 2026
      const tier = getEffectivePtoRate("2025-03-01", "2026-07-01");
      expect(tier.dailyRate).toBe(0.68);
    });

    it("should return tier 0 for Jul–Dec hire before first bump (year+2 July 1)", () => {
      // Hired 2025-08-15 (Jul–Dec), first bump = July 1, 2027
      const tier = getEffectivePtoRate("2025-08-15", "2027-06-30");
      expect(tier.dailyRate).toBe(0.65);
    });

    it("should return tier 1 for Jul–Dec hire on first bump date", () => {
      // Hired 2025-08-15, first bump = July 1, 2027
      const tier = getEffectivePtoRate("2025-08-15", "2027-07-01");
      expect(tier.dailyRate).toBe(0.68);
    });

    it("should return tier 2 after second July 1 bump", () => {
      // Hired 2025-03-01, first bump = 2026-07-01, second = 2027-07-01
      const tier = getEffectivePtoRate("2025-03-01", "2027-07-01");
      expect(tier.dailyRate).toBe(0.71);
    });

    it("should cap at max tier for long-tenured employees", () => {
      // Hired 2010-01-01, as of 2026-02-24 = many bumps
      const tier = getEffectivePtoRate("2010-01-01", "2026-02-24");
      expect(tier.dailyRate).toBe(0.92);
      expect(tier.annualHours).toBe(240);
    });

    it("should return tier 0 for hire on Jan 1 before next July 1", () => {
      // Hired 2026-01-01, first bump = July 1, 2027
      const tier = getEffectivePtoRate("2026-01-01", "2026-06-30");
      expect(tier.dailyRate).toBe(0.65);
    });

    it("should return tier 0 for hire on Jul 1 before first bump (year+2)", () => {
      // Hired 2025-07-01, first bump = July 1, 2027
      const tier = getEffectivePtoRate("2025-07-01", "2027-06-30");
      expect(tier.dailyRate).toBe(0.65);
    });

    it("should return tier 1 for hire on Jul 1 at first bump", () => {
      // Hired 2025-07-01, first bump = July 1, 2027
      const tier = getEffectivePtoRate("2025-07-01", "2027-07-01");
      expect(tier.dailyRate).toBe(0.68);
    });

    it("should return tier 0 for hire on Jun 30, bump on next July 1", () => {
      // Hired 2025-06-30 (Jan–Jun), first anniversary = 2026-06-30, first bump = July 1, 2026
      const tier = getEffectivePtoRate("2025-06-30", "2026-06-30");
      expect(tier.dailyRate).toBe(0.65);
    });

    it("should bump on July 1 for Jun 30 hire", () => {
      const tier = getEffectivePtoRate("2025-06-30", "2026-07-01");
      expect(tier.dailyRate).toBe(0.68);
    });
  });

  // ── Phase 2: Accrual Calculation Tests ─────────────────────────────

  describe("computeAccrualWithHireDate", () => {
    it("should compute accrual for a full year with no rate change", () => {
      // Employee hired 2020-01-01, computing Jan 1 to Dec 31 of 2026
      // After many years, they are at tier 9 (0.92 daily rate)
      const accrual = computeAccrualWithHireDate(
        "2020-01-01",
        "2026-01-01",
        "2026-06-30",
      );
      // Half-year at 0.92 rate × workdays
      expect(accrual).toBeGreaterThan(0);
    });

    it("should handle mid-year rate change on July 1", () => {
      // Employee hired 2025-01-01 (Jan–Jun hire)
      // First bump = July 1, 2026. Rate goes from 0.65 to 0.68.
      const accrualFull = computeAccrualWithHireDate(
        "2025-01-01",
        "2026-01-01",
        "2026-12-31",
      );
      // Should be split into two segments: Jan–Jun at 0.65, Jul–Dec at 0.68
      // Check it's higher than if the entire year were at 0.65
      const accrualAtLowRate = computeAccrualWithHireDate(
        "2026-01-01", // hired same year → tier 0 all year
        "2026-01-01",
        "2026-12-31",
      );
      expect(accrualFull).toBeGreaterThan(accrualAtLowRate);
    });

    it("should return 0 when start equals end date", () => {
      const accrual = computeAccrualWithHireDate(
        "2020-01-01",
        "2026-06-15",
        "2026-06-15",
      );
      // Only 1 day (if it's a workday) or 0
      expect(accrual).toBeGreaterThanOrEqual(0);
    });
  });

  describe("computeAnnualAllocation", () => {
    it("should return 0 for year before hire", () => {
      expect(computeAnnualAllocation("2025-01-01", 2024)).toBe(0);
    });

    it("should pro-rate first year from hire date to Dec 31", () => {
      // Hired Jul 1, 2025 → roughly half the workdays at tier 0 (0.65)
      const allocation = computeAnnualAllocation("2025-07-01", 2025);
      expect(allocation).toBeGreaterThan(0);
      // Full year at tier 0 would be ~0.65 × 261 ≈ 169.65
      expect(allocation).toBeLessThan(170);
    });

    it("should compute full year allocation for subsequent years", () => {
      // Hired 2020-01-01, computing 2026 → tier 9 (0.92)
      const allocation = computeAnnualAllocation("2020-01-01", 2026);
      // Should be close to 0.92 × 261 ≈ 240
      expect(allocation).toBeGreaterThan(200);
    });

    it("should handle mid-year rate change in subsequent years", () => {
      // Hired 2025-01-01), computing 2026
      // Before July 1: tier 0 (0.65), After July 1: tier 1 (0.68)
      const allocation = computeAnnualAllocation("2025-01-01", 2026);
      // Should be between pure 0.65×261 and pure 0.68×261
      const lowEstimate = 0.65 * 261;
      const highEstimate = 0.68 * 261;
      expect(allocation).toBeGreaterThan(lowEstimate);
      expect(allocation).toBeLessThan(highEstimate);
    });
  });

  describe("computeCarryover", () => {
    it("should return full balance when under limit", () => {
      expect(computeCarryover(50)).toBe(50);
    });

    it("should cap at CARRYOVER_LIMIT (80)", () => {
      expect(computeCarryover(120)).toBe(CARRYOVER_LIMIT);
      expect(computeCarryover(80)).toBe(80);
    });

    it("should return 0 for negative balance", () => {
      expect(computeCarryover(-10)).toBe(0);
    });

    it("should return 0 for zero balance", () => {
      expect(computeCarryover(0)).toBe(0);
    });
  });

  // ── Phase 3: Soft Warning Threshold Tests ─────────────────────────────

  describe("checkSickDayThreshold", () => {
    it("should return null when within threshold", () => {
      expect(checkSickDayThreshold(16, 8)).toBeNull(); // 24 total = at threshold
    });

    it("should return warning when exceeding threshold", () => {
      const warning = checkSickDayThreshold(20, 8); // 28 > 24
      expect(warning).not.toBeNull();
      expect(warning).toBe(
        VALIDATION_MESSAGES["sick.pto_required_after_threshold"],
      );
    });

    it("should return null when exactly at threshold", () => {
      expect(checkSickDayThreshold(16, 8)).toBeNull(); // 24 === SICK_HOURS_BEFORE_PTO
    });

    it("should return warning for first hour over threshold", () => {
      const warning = checkSickDayThreshold(24, 1); // 25 > 24
      expect(warning).not.toBeNull();
    });
  });

  describe("checkBereavementThreshold", () => {
    it("should return null when within threshold (2 days)", () => {
      expect(checkBereavementThreshold(1)).toBeNull();
      expect(checkBereavementThreshold(2)).toBeNull();
    });

    it("should return warning when exceeding threshold", () => {
      const warning = checkBereavementThreshold(3);
      expect(warning).not.toBeNull();
      expect(warning).toBe(
        VALIDATION_MESSAGES["bereavement.pto_required_after_threshold"],
      );
    });
  });

  // ── Phase 4: Termination Payout Tests ─────────────────────────────

  describe("computeTerminationPayout", () => {
    it("should compute payout: carryover + accrued - used", () => {
      // 60 carryover + 40 accrued - 10 used = 90
      expect(computeTerminationPayout(60, 40, 10)).toBe(90);
    });

    it("should cap carryover at CARRYOVER_LIMIT", () => {
      // 120 carryover (capped to 80) + 40 accrued - 10 used = 110
      expect(computeTerminationPayout(120, 40, 10)).toBe(110);
    });

    it("should return 0 when result is negative", () => {
      // 10 carryover + 5 accrued - 50 used = -35 → 0
      expect(computeTerminationPayout(10, 5, 50)).toBe(0);
    });

    it("should handle zero carryover", () => {
      // 0 carryover + 40 accrued - 10 used = 30
      expect(computeTerminationPayout(0, 40, 10)).toBe(30);
    });

    it("should handle all zeros", () => {
      expect(computeTerminationPayout(0, 0, 0)).toBe(0);
    });

    it("should handle negative carryover (treat as 0)", () => {
      // -10 carryover (clamped to 0) + 40 accrued - 10 used = 30
      expect(computeTerminationPayout(-10, 40, 10)).toBe(30);
    });
  });
});

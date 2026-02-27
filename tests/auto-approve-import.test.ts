import { describe, it, expect } from "vitest";
import {
  shouldAutoApproveImportEntry,
  ENABLE_IMPORT_AUTO_APPROVE,
  SYS_ADMIN_EMPLOYEE_ID,
  BUSINESS_RULES_CONSTANTS,
  type ImportEntryForAutoApprove,
  type AutoApproveEmployeeLimits,
  type AutoApprovePolicyContext,
  type AutoApproveResult,
  type PTOType,
} from "../shared/businessRules.js";

// ── Helpers ──

function makeEntry(
  overrides: Partial<ImportEntryForAutoApprove> = {},
): ImportEntryForAutoApprove {
  return {
    date: "2025-06-15",
    type: "PTO",
    hours: 8,
    ...overrides,
  };
}

function makeLimits(
  overrides: Partial<AutoApproveEmployeeLimits> = {},
): AutoApproveEmployeeLimits {
  return {
    annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 0 },
    availablePtoBalance: 160,
    ...overrides,
  };
}

function makePolicy(
  overrides: Partial<AutoApprovePolicyContext> = {},
): AutoApprovePolicyContext {
  return {
    yearsOfService: 3,
    warningMonths: new Set(),
    ...overrides,
  };
}

// ── Tests ──

describe("Import Auto-Approve", () => {
  describe("Constants", () => {
    it("SYS_ADMIN_EMPLOYEE_ID is 0", () => {
      expect(SYS_ADMIN_EMPLOYEE_ID).toBe(0);
    });

    it("ENABLE_IMPORT_AUTO_APPROVE is true by default", () => {
      expect(ENABLE_IMPORT_AUTO_APPROVE).toBe(true);
    });
  });

  describe("shouldAutoApproveImportEntry", () => {
    it("approves entry within all limits", () => {
      const entry = makeEntry({ type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 160 });
      const policy = makePolicy({ yearsOfService: 2 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("approves Sick entry within annual limit", () => {
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 16, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("rejects Sick entry exceeding 24-hour annual limit", () => {
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 20, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Sick");
      expect(result.violations[0]).toContain("28h");
      expect(result.violations[0]).toContain(
        `${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK}h`,
      );
    });

    it("rejects Bereavement entry exceeding 16-hour annual limit", () => {
      const entry = makeEntry({ type: "Bereavement", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 12, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Bereavement");
      expect(result.violations[0]).toContain("20h");
      expect(result.violations[0]).toContain(
        `${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT}h`,
      );
    });

    it("rejects Jury Duty entry exceeding 24-hour annual limit", () => {
      const entry = makeEntry({ type: "Jury Duty", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 20 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Jury Duty");
      expect(result.violations[0]).toContain("28h");
      expect(result.violations[0]).toContain(
        `${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY}h`,
      );
    });

    it("rejects PTO entry exceeding available balance", () => {
      const entry = makeEntry({ type: "PTO", hours: 16 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 0 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("exceeds available balance");
    });

    it("rejects PTO borrowing after first year of service", () => {
      const entry = makeEntry({ type: "PTO", hours: 16 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 1 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("borrowing not permitted");
      expect(result.violations[0]).toContain("first year of service");
    });

    it("rejects entry in a warning acknowledgement month", () => {
      const entry = makeEntry({ date: "2025-03-15", type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 160 });
      const policy = makePolicy({
        yearsOfService: 3,
        warningMonths: new Set(["2025-03"]),
      });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("2025-03");
      expect(result.violations[0]).toContain("warning");
    });

    it("accumulates multiple violations", () => {
      // Entry is in a warning month AND exceeds PTO balance
      const entry = makeEntry({ date: "2025-03-15", type: "PTO", hours: 200 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({
        yearsOfService: 5,
        warningMonths: new Set(["2025-03"]),
      });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });

    it("approves entry at exact limit boundary", () => {
      // Sick: exactly at 24h after adding 8h (16 + 8 = 24)
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 16, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("rejects entry one hour over limit boundary", () => {
      // Sick: 20 + 8 = 28 > 24
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 20, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
    });

    it("approves PTO at exact balance boundary", () => {
      const entry = makeEntry({ type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 5 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("does not check PTO balance for non-PTO types", () => {
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 0 },
        availablePtoBalance: 0, // No PTO balance, but this is a Sick entry
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("approves entries not in warning months", () => {
      const entry = makeEntry({ date: "2025-04-15", type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 160 });
      const policy = makePolicy({
        warningMonths: new Set(["2025-03"]), // Warning is March, entry is April
      });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("first-year employee: PTO borrowing message differs from post-first-year", () => {
      const entry = makeEntry({ type: "PTO", hours: 16 });
      const limits = makeLimits({ availablePtoBalance: 8 });

      const firstYear = shouldAutoApproveImportEntry(
        entry,
        limits,
        makePolicy({ yearsOfService: 0 }),
      );
      const secondYear = shouldAutoApproveImportEntry(
        entry,
        limits,
        makePolicy({ yearsOfService: 1 }),
      );

      // Both are rejected
      expect(firstYear.approved).toBe(false);
      expect(secondYear.approved).toBe(false);

      // Different violation messages
      expect(firstYear.violations[0]).toContain("exceeds available balance");
      expect(secondYear.violations[0]).toContain("borrowing not permitted");
    });
  });
});

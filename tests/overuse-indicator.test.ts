import { describe, it, expect } from "vitest";
import {
  getOveruseDates,
  getOveruseTooltips,
  type BalanceLimits,
  type OveruseEntry,
} from "../shared/businessRules.js";

/**
 * Unit tests for the getOveruseDates() function that powers the
 * PTO calendar overuse "!" indicator.
 */
describe("getOveruseDates", () => {
  const defaultLimits: BalanceLimits = {
    PTO: 80,
    Sick: 24,
    Bereavement: 16,
    "Jury Duty": 24,
  };

  // ── PTO type ────────────────────────────────────────────

  describe("PTO type", () => {
    it("returns empty set when usage is within balance", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 8, type: "PTO" },
        { date: "2026-03-03", hours: 8, type: "PTO" },
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      expect(result.size).toBe(0);
    });

    it("returns empty set when usage exactly equals balance", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 8, type: "PTO" },
        { date: "2026-03-03", hours: 8, type: "PTO" },
      ];
      // Limit is exactly 16, usage is exactly 16 — no overuse
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      expect(result.size).toBe(0);
    });

    it("flags the first day that exceeds the balance and all subsequent", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 8, type: "PTO" },
        { date: "2026-03-03", hours: 8, type: "PTO" },
        { date: "2026-03-04", hours: 8, type: "PTO" }, // crosses 16h limit
        { date: "2026-03-05", hours: 8, type: "PTO" },
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      expect(result.has("2026-03-02")).toBe(false);
      expect(result.has("2026-03-03")).toBe(false);
      expect(result.has("2026-03-04")).toBe(true); // 24 > 16
      expect(result.has("2026-03-05")).toBe(true); // 32 > 16
    });

    it("flags from first entry when balance is 0", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 8, type: "PTO" },
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 0 });
      expect(result.has("2026-03-02")).toBe(true);
    });
  });

  // ── Sick type ───────────────────────────────────────────

  describe("Sick type", () => {
    it("returns empty when within 24h annual limit", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-01-05", hours: 8, type: "Sick" },
        { date: "2026-01-06", hours: 8, type: "Sick" },
        { date: "2026-01-07", hours: 8, type: "Sick" },
      ];
      const result = getOveruseDates(entries, defaultLimits);
      expect(result.size).toBe(0);
    });

    it("flags days exceeding 24h", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-01-05", hours: 8, type: "Sick" },
        { date: "2026-01-06", hours: 8, type: "Sick" },
        { date: "2026-01-07", hours: 8, type: "Sick" },
        { date: "2026-01-08", hours: 8, type: "Sick" }, // 32 > 24
      ];
      const result = getOveruseDates(entries, defaultLimits);
      expect(result.has("2026-01-05")).toBe(false);
      expect(result.has("2026-01-06")).toBe(false);
      expect(result.has("2026-01-07")).toBe(false);
      expect(result.has("2026-01-08")).toBe(true);
    });
  });

  // ── Bereavement type ────────────────────────────────────

  describe("Bereavement type", () => {
    it("returns empty when within 16h limit", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-02-02", hours: 8, type: "Bereavement" },
        { date: "2026-02-03", hours: 8, type: "Bereavement" },
      ];
      const result = getOveruseDates(entries, defaultLimits);
      expect(result.size).toBe(0);
    });

    it("flags days exceeding 16h", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-02-02", hours: 8, type: "Bereavement" },
        { date: "2026-02-03", hours: 8, type: "Bereavement" },
        { date: "2026-02-04", hours: 8, type: "Bereavement" }, // 24 > 16
      ];
      const result = getOveruseDates(entries, defaultLimits);
      expect(result.has("2026-02-02")).toBe(false);
      expect(result.has("2026-02-03")).toBe(false);
      expect(result.has("2026-02-04")).toBe(true);
    });
  });

  // ── Jury Duty type ──────────────────────────────────────

  describe("Jury Duty type", () => {
    it("returns empty when within 24h limit", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-04-06", hours: 8, type: "Jury Duty" },
        { date: "2026-04-07", hours: 8, type: "Jury Duty" },
        { date: "2026-04-08", hours: 8, type: "Jury Duty" },
      ];
      const result = getOveruseDates(entries, defaultLimits);
      expect(result.size).toBe(0);
    });

    it("flags days exceeding 24h", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-04-06", hours: 8, type: "Jury Duty" },
        { date: "2026-04-07", hours: 8, type: "Jury Duty" },
        { date: "2026-04-08", hours: 8, type: "Jury Duty" },
        { date: "2026-04-09", hours: 4, type: "Jury Duty" }, // 28 > 24
      ];
      const result = getOveruseDates(entries, defaultLimits);
      expect(result.has("2026-04-09")).toBe(true);
    });
  });

  // ── Edge cases ──────────────────────────────────────────

  describe("edge cases", () => {
    it("handles multiple partial-day entries crossing the threshold", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 4, type: "PTO" },
        { date: "2026-03-03", hours: 4, type: "PTO" },
        { date: "2026-03-04", hours: 4, type: "PTO" },
        { date: "2026-03-05", hours: 4, type: "PTO" },
        { date: "2026-03-06", hours: 4, type: "PTO" }, // 20 > 16
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      expect(result.has("2026-03-04")).toBe(false); // running = 12
      expect(result.has("2026-03-05")).toBe(false); // running = 16 (exactly at limit)
      expect(result.has("2026-03-06")).toBe(true); // running = 20 > 16
    });

    it("skips entries with zero or negative hours", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 8, type: "PTO" },
        { date: "2026-03-03", hours: 0, type: "PTO" },
        { date: "2026-03-04", hours: -4, type: "PTO" },
        { date: "2026-03-05", hours: 8, type: "PTO" },
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      // Only positive hours counted: 8 + 8 = 16 (exactly at limit, not over)
      expect(result.size).toBe(0);
    });

    it("sorts entries by date regardless of input order", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-05", hours: 8, type: "PTO" }, // last chronologically
        { date: "2026-03-02", hours: 8, type: "PTO" }, // first
        { date: "2026-03-03", hours: 8, type: "PTO" }, // second
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      // After sort: 03-02=8, 03-03=16, 03-05=24
      // First overuse is 03-05 (24 > 16)
      expect(result.has("2026-03-02")).toBe(false);
      expect(result.has("2026-03-03")).toBe(false);
      expect(result.has("2026-03-05")).toBe(true);
    });

    it("handles mixed types independently", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-03-02", hours: 8, type: "PTO" },
        { date: "2026-03-02", hours: 8, type: "Sick" },
        { date: "2026-03-03", hours: 8, type: "PTO" },
        { date: "2026-03-03", hours: 8, type: "Sick" },
        { date: "2026-03-04", hours: 8, type: "PTO" }, // PTO total 24 > 16
        { date: "2026-03-04", hours: 8, type: "Sick" }, // Sick total 24 = 24, not exceeded
      ];
      const result = getOveruseDates(entries, { ...defaultLimits, PTO: 16 });
      // PTO: 8,16,24 -> 03-04 over (>16)
      // Sick: 8,16,24 -> exactly at limit (=24), no overuse
      expect(result.has("2026-03-04")).toBe(true); // from PTO overuse
      expect(result.has("2026-03-02")).toBe(false);
      expect(result.has("2026-03-03")).toBe(false);
    });

    it("returns empty for empty entries", () => {
      const result = getOveruseDates([], defaultLimits);
      expect(result.size).toBe(0);
    });

    it("first entry alone exceeds the limit", () => {
      const entries: OveruseEntry[] = [
        { date: "2026-06-01", hours: 8, type: "Bereavement" },
      ];
      const result = getOveruseDates(entries, {
        ...defaultLimits,
        Bereavement: 4,
      });
      expect(result.has("2026-06-01")).toBe(true);
    });
  });
});

// ── getOveruseTooltips ────────────────────────────────────

describe("getOveruseTooltips", () => {
  const defaultLimits: BalanceLimits = {
    PTO: 80,
    Sick: 24,
    Bereavement: 16,
    "Jury Duty": 24,
  };

  it("returns empty map when no entries exceed limits", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-03-02", hours: 8, type: "PTO" },
    ];
    const result = getOveruseTooltips(entries, defaultLimits);
    expect(result.size).toBe(0);
  });

  it("returns PTO tooltip with accrued vs scheduled wording", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-01-05", hours: 8, type: "PTO" },
      { date: "2026-01-06", hours: 8, type: "PTO" },
      { date: "2026-01-07", hours: 8, type: "PTO" }, // 24 > 16
    ];
    const result = getOveruseTooltips(entries, { ...defaultLimits, PTO: 16 });
    expect(result.has("2026-01-07")).toBe(true);
    expect(result.get("2026-01-07")).toContain("accrued PTO");
    expect(result.get("2026-01-07")).toContain("16");
    expect(result.get("2026-01-07")).toContain("24");
  });

  it("returns Sick tooltip with annual limit wording", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-01-05", hours: 8, type: "Sick" },
      { date: "2026-01-06", hours: 8, type: "Sick" },
      { date: "2026-01-07", hours: 8, type: "Sick" },
      { date: "2026-01-08", hours: 8, type: "Sick" }, // 32 > 24
    ];
    const result = getOveruseTooltips(entries, defaultLimits);
    expect(result.has("2026-01-08")).toBe(true);
    const tip = result.get("2026-01-08")!;
    expect(tip).toContain("annual Sick limit");
    expect(tip).toContain("32");
    expect(tip).toContain("24");
  });

  it("returns Bereavement tooltip with annual limit wording", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-03-02", hours: 8, type: "Bereavement" },
      { date: "2026-03-03", hours: 8, type: "Bereavement" },
      { date: "2026-03-04", hours: 8, type: "Bereavement" }, // 24 > 16
    ];
    const result = getOveruseTooltips(entries, defaultLimits);
    expect(result.has("2026-03-04")).toBe(true);
    const tip = result.get("2026-03-04")!;
    expect(tip).toContain("annual Bereavement limit");
  });

  it("returns Jury Duty tooltip with annual limit wording", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-04-01", hours: 8, type: "Jury Duty" },
      { date: "2026-04-02", hours: 8, type: "Jury Duty" },
      { date: "2026-04-03", hours: 8, type: "Jury Duty" },
      { date: "2026-04-06", hours: 8, type: "Jury Duty" }, // 32 > 24
    ];
    const result = getOveruseTooltips(entries, defaultLimits);
    expect(result.has("2026-04-06")).toBe(true);
    const tip = result.get("2026-04-06")!;
    expect(tip).toContain("annual Jury Duty limit");
  });

  it("includes all subsequent overuse dates in tooltip map", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-01-05", hours: 8, type: "PTO" },
      { date: "2026-01-06", hours: 8, type: "PTO" },
      { date: "2026-01-07", hours: 8, type: "PTO" }, // 24 > 16
      { date: "2026-01-08", hours: 8, type: "PTO" }, // 32 > 16
    ];
    const result = getOveruseTooltips(entries, { ...defaultLimits, PTO: 16 });
    expect(result.has("2026-01-07")).toBe(true);
    expect(result.has("2026-01-08")).toBe(true);
    // Scheduled amounts differ per date
    expect(result.get("2026-01-07")).toContain("24");
    expect(result.get("2026-01-08")).toContain("32");
  });

  it("returns empty map for empty entries", () => {
    const result = getOveruseTooltips([], defaultLimits);
    expect(result.size).toBe(0);
  });

  it("tooltip map keys match getOveruseDates exactly", () => {
    const entries: OveruseEntry[] = [
      { date: "2026-01-05", hours: 8, type: "PTO" },
      { date: "2026-01-06", hours: 8, type: "PTO" },
      { date: "2026-01-07", hours: 8, type: "PTO" },
    ];
    const limits = { ...defaultLimits, PTO: 16 };
    const dates = getOveruseDates(entries, limits);
    const tips = getOveruseTooltips(entries, limits);
    expect(new Set(tips.keys())).toEqual(dates);
  });
});

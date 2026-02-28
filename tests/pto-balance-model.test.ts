import { describe, it, expect, vi } from "vitest";
import {
  PtoBalanceModel,
  AbstractBalanceModel,
  type BalanceEntry,
  type MonthlyAccrual,
} from "../client/components/pto-entry-form/balance-model.js";
import type { BalanceLimits, PTOType } from "../shared/businessRules.js";

// ── Helpers ──

/** Convenience factory with sensible defaults. */
function createModel(overrides?: {
  beginningBalance?: number;
  monthlyAccruals?: MonthlyAccrual[];
  balanceLimits?: Partial<BalanceLimits>;
}): PtoBalanceModel {
  const defaults: BalanceLimits = {
    PTO: overrides?.beginningBalance ?? 80,
    Sick: 24,
    Bereavement: 16,
    "Jury Duty": 24,
  };
  return new PtoBalanceModel(
    overrides?.beginningBalance ?? 80,
    overrides?.monthlyAccruals ?? [],
    { ...defaults, ...overrides?.balanceLimits },
  );
}

/** Build a simple BalanceEntry. */
function entry(
  date: string,
  hours: number,
  type: PTOType = "PTO",
): BalanceEntry {
  return { date, hours, type };
}

// ── Tests ──

describe("PtoBalanceModel", () => {
  // ── Inheritance ──

  it("extends AbstractBalanceModel", () => {
    const model = createModel();
    expect(model).toBeInstanceOf(AbstractBalanceModel);
  });

  // ── Empty model ──

  it("returns empty set when there are no entries or selections", () => {
    const model = createModel();
    expect(model.computeOveruseDates()).toEqual(new Set());
  });

  // ── PTO within budget ──

  it("returns empty set when PTO entries are within budget", () => {
    const model = createModel({ beginningBalance: 80 });
    model.setPersistedEntries([entry("2026-01-05", 8), entry("2026-01-06", 8)]);
    expect(model.computeOveruseDates()).toEqual(new Set());
  });

  // ── PTO exceeding budget ──

  it("returns overuse dates when PTO entries exceed budget", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-01-07", 8), // exceeds 16
    ]);
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-01-07")).toBe(true);
    expect(overuse.has("2026-01-05")).toBe(false);
    expect(overuse.has("2026-01-06")).toBe(false);
  });

  // ── Accrual-aware PTO limit ──

  it("uses accrual-aware limit — overuse only after accrual-adjusted limit is crossed", () => {
    // Beginning balance = 8, accrual of 8 in month 1 and 8 in month 2
    // Total budget through Feb = 8 + 8 + 8 = 24
    const model = createModel({
      beginningBalance: 8,
      monthlyAccruals: [
        { month: 1, hours: 8 },
        { month: 2, hours: 8 },
      ],
      balanceLimits: { PTO: 999 }, // overridden by accrual-aware computation
    });
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-02-02", 8), // total = 24 → exactly at limit
    ]);
    expect(model.computeOveruseDates().size).toBe(0);

    // Add one more → exceeds 24
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-02-02", 8),
      entry("2026-02-03", 8), // total = 32 → exceeds 24
    ]);
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-02-03")).toBe(true);
  });

  // ── Pending selections merged with persisted entries ──

  it("merges pending selections with persisted entries", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([entry("2026-01-05", 8)]);
    model.setPendingSelections(
      new Map([
        ["2026-01-06", { hours: 8, type: "PTO" as PTOType }],
        ["2026-01-07", { hours: 8, type: "PTO" as PTOType }], // total = 24 → exceeds 16
      ]),
    );
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-01-07")).toBe(true);
    expect(overuse.has("2026-01-05")).toBe(false);
    expect(overuse.has("2026-01-06")).toBe(false);
  });

  // ── Pending selection in Jan affects Feb overuse detection ──

  it("pending selection in January affects overuse detection in February", () => {
    // Budget = 16
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([entry("2026-02-02", 8)]);
    model.setPendingSelections(
      new Map([
        ["2026-01-05", { hours: 8, type: "PTO" as PTOType }],
        ["2026-01-06", { hours: 8, type: "PTO" as PTOType }],
      ]),
    );
    // Total PTO = 8 (persisted Feb) + 8 + 8 (pending Jan) = 24 → exceeds 16
    const overuse = model.computeOveruseDates();
    // getOveruseDates sorts by date, so the 3rd entry (Feb 2) is the one that crosses
    expect(overuse.has("2026-02-02")).toBe(true);
  });

  // ── Pending selection overrides persisted entry on same date ──

  it("pending selection overrides persisted entry on the same date", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-01-07", 8), // would exceed if kept
    ]);
    // Override Jan 7 to 0 hours (deletion)
    model.setPendingSelections(
      new Map([["2026-01-07", { hours: 0, type: "PTO" as PTOType }]]),
    );
    // Now total = 8 + 8 = 16, exactly at limit
    expect(model.computeOveruseDates().size).toBe(0);
  });

  // ── Sick type uses flat cap ──

  it("Sick type uses flat annual cap correctly", () => {
    const model = createModel({
      beginningBalance: 80,
      balanceLimits: { Sick: 24 },
    });
    model.setPersistedEntries([
      entry("2026-01-05", 8, "Sick"),
      entry("2026-01-06", 8, "Sick"),
      entry("2026-01-07", 8, "Sick"), // total = 24 → at limit
    ]);
    expect(model.computeOveruseDates().size).toBe(0);

    model.setPersistedEntries([
      entry("2026-01-05", 8, "Sick"),
      entry("2026-01-06", 8, "Sick"),
      entry("2026-01-07", 8, "Sick"),
      entry("2026-01-08", 8, "Sick"), // total = 32 → exceeds 24
    ]);
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-01-08")).toBe(true);
  });

  // ── Bereavement type uses flat cap ──

  it("Bereavement type uses flat annual cap correctly", () => {
    const model = createModel({
      beginningBalance: 80,
      balanceLimits: { Bereavement: 16 },
    });
    model.setPersistedEntries([
      entry("2026-03-02", 8, "Bereavement"),
      entry("2026-03-03", 8, "Bereavement"), // total = 16 → at limit
    ]);
    expect(model.computeOveruseDates().size).toBe(0);

    model.setPersistedEntries([
      entry("2026-03-02", 8, "Bereavement"),
      entry("2026-03-03", 8, "Bereavement"),
      entry("2026-03-04", 8, "Bereavement"), // total = 24 → exceeds 16
    ]);
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-03-04")).toBe(true);
  });

  // ── Jury Duty type uses flat cap ──

  it("Jury Duty type uses flat annual cap correctly", () => {
    const model = createModel({
      beginningBalance: 80,
      balanceLimits: { "Jury Duty": 24 },
    });
    model.setPersistedEntries([
      entry("2026-04-01", 8, "Jury Duty"),
      entry("2026-04-02", 8, "Jury Duty"),
      entry("2026-04-03", 8, "Jury Duty"), // total = 24 → at limit
    ]);
    expect(model.computeOveruseDates().size).toBe(0);

    model.setPersistedEntries([
      entry("2026-04-01", 8, "Jury Duty"),
      entry("2026-04-02", 8, "Jury Duty"),
      entry("2026-04-03", 8, "Jury Duty"),
      entry("2026-04-06", 8, "Jury Duty"), // total = 32 → exceeds 24
    ]);
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-04-06")).toBe(true);
  });

  // ── Mixed PTO types computed independently ──

  it("computes overuse for mixed PTO types independently", () => {
    const model = createModel({
      beginningBalance: 80,
      balanceLimits: { PTO: 80, Sick: 16 },
    });
    model.setPersistedEntries([
      entry("2026-01-05", 8, "PTO"),
      entry("2026-01-06", 8, "PTO"),
      entry("2026-01-07", 8, "Sick"),
      entry("2026-01-08", 8, "Sick"),
      entry("2026-01-09", 8, "Sick"), // Sick total = 24 → exceeds 16
    ]);
    const overuse = model.computeOveruseDates();
    // PTO is fine (16 of 80)
    expect(overuse.has("2026-01-05")).toBe(false);
    expect(overuse.has("2026-01-06")).toBe(false);
    // Sick exceeds at entry 3
    expect(overuse.has("2026-01-09")).toBe(true);
  });

  // ── PTO entries spanning multiple months with accruals ──

  it("handles entries spanning multiple months with accruals correctly", () => {
    // Budget: 8 beginning + 8/month accrual
    // Jan limit = 8 + 8 = 16
    // Feb limit = 8 + 8 + 8 = 24
    // Mar limit = 8 + 8 + 8 + 8 = 32
    const model = createModel({
      beginningBalance: 8,
      monthlyAccruals: [
        { month: 1, hours: 8 },
        { month: 2, hours: 8 },
        { month: 3, hours: 8 },
      ],
    });
    // Use 8 in Jan, 8 in Feb, 16 in March = 40, limit through Mar = 32
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-02-02", 8),
      entry("2026-03-02", 8),
      entry("2026-03-03", 8),
      entry("2026-03-04", 8), // total = 40, exceeds 32
    ]);
    const overuse = model.computeOveruseDates();
    expect(overuse.has("2026-03-04")).toBe(true);
    expect(overuse.has("2026-01-05")).toBe(false);
    expect(overuse.has("2026-02-02")).toBe(false);
    expect(overuse.has("2026-03-02")).toBe(false);
  });

  // ── Entries with zero or negative hours are excluded ──

  it("excludes entries with zero or negative hours", () => {
    const model = createModel({ beginningBalance: 8 });
    model.setPersistedEntries([
      entry("2026-01-05", 0),
      entry("2026-01-06", -4),
      entry("2026-01-07", 8), // total = 8 → at limit
    ]);
    expect(model.computeOveruseDates().size).toBe(0);
  });

  // ── setPendingSelections creates a defensive copy ──

  it("creates a defensive copy of selections map", () => {
    const model = createModel({ beginningBalance: 8 });
    const selections = new Map<string, { hours: number; type: PTOType }>([
      ["2026-01-05", { hours: 8, type: "PTO" }],
    ]);
    model.setPendingSelections(selections);

    // Mutate original map — should not affect model
    selections.set("2026-01-06", { hours: 8, type: "PTO" });

    const overuse = model.computeOveruseDates();
    // Only 8 hours, at limit → no overuse
    expect(overuse.size).toBe(0);
  });

  // ── Subscriber notification: setPersistedEntries ──

  it("notifies subscriber when setPersistedEntries() changes overuse result", () => {
    const model = createModel({ beginningBalance: 16 });
    const spy = vi.fn();
    model.subscribe(spy);
    spy.mockClear();

    // Push entries that exceed budget → overuse changes
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-01-07", 8), // exceeds 16
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
    const received = spy.mock.calls[0][0] as Set<string>;
    expect(received.has("2026-01-07")).toBe(true);
  });

  // ── Subscriber notification: setPendingSelections ──

  it("notifies subscriber when setPendingSelections() changes overuse result", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([entry("2026-01-05", 8)]);

    const spy = vi.fn();
    model.subscribe(spy);
    spy.mockClear();

    model.setPendingSelections(
      new Map([
        ["2026-01-06", { hours: 8, type: "PTO" as PTOType }],
        ["2026-01-07", { hours: 8, type: "PTO" as PTOType }], // total = 24 → exceeds 16
      ]),
    );
    expect(spy).toHaveBeenCalledTimes(1);
    const received = spy.mock.calls[0][0] as Set<string>;
    expect(received.has("2026-01-07")).toBe(true);
  });

  // ── Subscriber NOT notified when overuse set is identical ──

  it("does NOT notify subscriber when mutation produces identical overuse set", () => {
    const model = createModel({ beginningBalance: 80 });
    model.setPersistedEntries([entry("2026-01-05", 8)]);

    const spy = vi.fn();
    model.subscribe(spy);
    spy.mockClear();

    // Set same entries again → same result (empty overuse)
    model.setPersistedEntries([entry("2026-01-05", 8)]);
    expect(spy).not.toHaveBeenCalled();
  });

  // ── Tooltip map ──

  it("produces PTO tooltip with accrued vs scheduled wording", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-01-07", 8), // 24 > 16
    ]);
    const tips = model.overuseTooltips;
    expect(tips.has("2026-01-07")).toBe(true);
    expect(tips.get("2026-01-07")).toContain("accrued PTO");
    expect(tips.get("2026-01-07")).toContain("16");
    expect(tips.get("2026-01-07")).toContain("24");
  });

  it("produces Sick tooltip with annual limit wording", () => {
    const model = createModel({
      beginningBalance: 80,
      balanceLimits: { Sick: 24 },
    });
    model.setPersistedEntries([
      entry("2026-01-05", 8, "Sick"),
      entry("2026-01-06", 8, "Sick"),
      entry("2026-01-07", 8, "Sick"),
      entry("2026-01-08", 8, "Sick"), // 32 > 24
    ]);
    const tips = model.overuseTooltips;
    expect(tips.has("2026-01-08")).toBe(true);
    expect(tips.get("2026-01-08")).toContain("annual Sick limit");
  });

  it("updates overuseTooltips when pending selections change", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([entry("2026-01-05", 8)]);
    expect(model.overuseTooltips.size).toBe(0);

    model.setPendingSelections(
      new Map([
        ["2026-01-06", { hours: 8, type: "PTO" as PTOType }],
        ["2026-01-07", { hours: 8, type: "PTO" as PTOType }],
      ]),
    );
    expect(model.overuseTooltips.has("2026-01-07")).toBe(true);
  });

  it("tooltip map keys match overuse dates exactly", () => {
    const model = createModel({ beginningBalance: 16 });
    model.setPersistedEntries([
      entry("2026-01-05", 8),
      entry("2026-01-06", 8),
      entry("2026-01-07", 8),
    ]);
    const dates = model.computeOveruseDates();
    const tips = model.overuseTooltips;
    expect(new Set(tips.keys())).toEqual(dates);
  });
});

// ── Phase 6: Disposal & Leak Prevention ──

describe("PtoBalanceModel — disposal & leak prevention", () => {
  it("dispose() clears all subscribers and marks as disposed", () => {
    const model = createModel();
    model.subscribe(() => {});
    model.subscribe(() => {});
    expect(model.subscriberCount).toBe(2);

    model.dispose();

    expect(model.subscriberCount).toBe(0);
    expect(model.isDisposed).toBe(true);
  });

  it("subscribe() on a disposed model throws Error", () => {
    const model = createModel();
    model.dispose();

    expect(() => model.subscribe(() => {})).toThrowError(
      "Cannot subscribe to a disposed Observable",
    );
  });

  it("unsubscribe + dispose leaves zero subscribers", () => {
    const model = createModel();
    const unsub1 = model.subscribe(() => {});
    const unsub2 = model.subscribe(() => {});
    expect(model.subscriberCount).toBe(2);

    unsub1();
    unsub2();
    expect(model.subscriberCount).toBe(0);

    model.dispose();
    expect(model.subscriberCount).toBe(0);
    expect(model.isDisposed).toBe(true);
  });

  it("set() after dispose() is silently ignored", () => {
    const model = createModel();
    const spy = vi.fn();
    model.subscribe(spy);
    spy.mockClear();

    model.dispose();

    // This should not throw or notify
    model.setPersistedEntries([entry("2026-03-02", 8)]);
    expect(spy).not.toHaveBeenCalled();
  });
});

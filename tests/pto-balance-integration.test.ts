// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtoCalendar } from "../client/components/pto-calendar/index.js";
import {
  PtoBalanceModel,
  type PendingSelection,
} from "../client/components/pto-entry-form/balance-model.js";
import type { PTOType } from "../shared/businessRules.js";

/**
 * Integration tests: PtoBalanceModel ↔ PtoCalendar subscription wiring.
 *
 * These verify that model recomputation pushes overuse dates to calendars
 * and that the calendar renders the "!" indicator accordingly.
 */
describe("PtoBalanceModel ↔ PtoCalendar integration", () => {
  let container: HTMLElement;

  // Helper: create a calendar for a given month/year and append to container
  function createCalendar(year: number, month: number): PtoCalendar {
    const cal = new PtoCalendar();
    cal.setYear(year);
    cal.setMonth(month);
    container.appendChild(cal);
    return cal;
  }

  // Helper: check if a day cell has the overuse "!" indicator
  function hasOveruseIndicator(cal: PtoCalendar, dateStr: string): boolean {
    const cell = cal.shadowRoot?.querySelector(`[data-date="${dateStr}"]`);
    return cell?.querySelector(".overuse-indicator") !== null;
  }

  // Helper: get the title attribute of the overuse indicator for a day cell
  function getOveruseTooltip(cal: PtoCalendar, dateStr: string): string | null {
    const cell = cal.shadowRoot?.querySelector(`[data-date="${dateStr}"]`);
    const indicator = cell?.querySelector(".overuse-indicator");
    return indicator?.getAttribute("title") ?? null;
  }

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("cross-month overuse: Jan 31 + Feb 1 exceeds PTO budget → '!' on Feb 1", () => {
    // PTO limit of 8 hours (no accruals → flat limit)
    const model = new PtoBalanceModel(8, [], {
      PTO: 8,
      Sick: 40,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const janCal = createCalendar(2026, 1);
    const febCal = createCalendar(2026, 2);

    // Subscribe to distribute overuse dates and tooltips
    const unsub = model.subscribe((overuseDates) => {
      const tooltips = model.overuseTooltips;
      janCal.overuseTooltips = tooltips;
      janCal.overuseDates = overuseDates;
      febCal.overuseTooltips = tooltips;
      febCal.overuseDates = overuseDates;
    });

    // Seed persisted entries: 8h on Jan 30 (within budget)
    model.setPersistedEntries([
      { date: "2026-01-30", hours: 8, type: "PTO" as PTOType },
    ]);

    // After 8h, running total = 8 = limit → no overuse yet
    expect(hasOveruseIndicator(janCal, "2026-01-30")).toBe(false);

    // Now add a pending selection for Feb 2 (Mon) → total 16 > 8
    const pending = new Map<string, PendingSelection>();
    pending.set("2026-02-02", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(pending);

    // Feb 2 should now have the overuse indicator
    expect(hasOveruseIndicator(febCal, "2026-02-02")).toBe(true);
    // Jan 30 still within budget
    expect(hasOveruseIndicator(janCal, "2026-01-30")).toBe(false);

    unsub();
    model.dispose();
  });

  it("single-month overuse: clicking enough days exceeds PTO budget", () => {
    const model = new PtoBalanceModel(16, [], {
      PTO: 16,
      Sick: 40,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const cal = createCalendar(2026, 3); // March

    const unsub = model.subscribe((overuseDates) => {
      const tooltips = model.overuseTooltips;
      cal.overuseTooltips = tooltips;
      cal.overuseDates = overuseDates;
    });

    // Add pending selections: 8h on Mar 2, 8h on Mar 3, 8h on Mar 4
    const pending = new Map<string, PendingSelection>();
    pending.set("2026-03-02", { hours: 8, type: "PTO" as PTOType });
    pending.set("2026-03-03", { hours: 8, type: "PTO" as PTOType });
    pending.set("2026-03-04", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(pending);

    // 8+8 = 16 (at limit), 3rd day → 24 > 16 → overuse
    expect(hasOveruseIndicator(cal, "2026-03-02")).toBe(false);
    expect(hasOveruseIndicator(cal, "2026-03-03")).toBe(false);
    expect(hasOveruseIndicator(cal, "2026-03-04")).toBe(true);

    unsub();
    model.dispose();
  });

  it("unclicking an overuse day removes '!' from subsequent days", () => {
    const model = new PtoBalanceModel(16, [], {
      PTO: 16,
      Sick: 40,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const cal = createCalendar(2026, 3);

    const unsub = model.subscribe((overuseDates) => {
      const tooltips = model.overuseTooltips;
      cal.overuseTooltips = tooltips;
      cal.overuseDates = overuseDates;
    });

    // Start with 3 days selected → 3rd exceeds budget
    const pending = new Map<string, PendingSelection>();
    pending.set("2026-03-02", { hours: 8, type: "PTO" as PTOType });
    pending.set("2026-03-03", { hours: 8, type: "PTO" as PTOType });
    pending.set("2026-03-04", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(pending);

    expect(hasOveruseIndicator(cal, "2026-03-04")).toBe(true);

    // Remove the first day → now only 16h total → no overuse
    const reduced = new Map<string, PendingSelection>();
    reduced.set("2026-03-03", { hours: 8, type: "PTO" as PTOType });
    reduced.set("2026-03-04", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(reduced);

    expect(hasOveruseIndicator(cal, "2026-03-03")).toBe(false);
    expect(hasOveruseIndicator(cal, "2026-03-04")).toBe(false);

    unsub();
    model.dispose();
  });

  it("changing PTO type recomputes overuse for the new type budget", () => {
    // PTO limit 16h, Sick limit 8h
    const model = new PtoBalanceModel(16, [], {
      PTO: 16,
      Sick: 8,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const cal = createCalendar(2026, 4); // April

    const unsub = model.subscribe((overuseDates) => {
      const tooltips = model.overuseTooltips;
      cal.overuseTooltips = tooltips;
      cal.overuseDates = overuseDates;
    });

    // 2 days as PTO → 16h = at PTO limit → no overuse
    const ptoPending = new Map<string, PendingSelection>();
    ptoPending.set("2026-04-01", { hours: 8, type: "PTO" as PTOType });
    ptoPending.set("2026-04-02", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(ptoPending);

    expect(hasOveruseIndicator(cal, "2026-04-01")).toBe(false);
    expect(hasOveruseIndicator(cal, "2026-04-02")).toBe(false);

    // Now change both to Sick → 16h > Sick limit 8h → Apr 2 overuse
    const sickPending = new Map<string, PendingSelection>();
    sickPending.set("2026-04-01", { hours: 8, type: "Sick" as PTOType });
    sickPending.set("2026-04-02", { hours: 8, type: "Sick" as PTOType });
    model.setPendingSelections(sickPending);

    expect(hasOveruseIndicator(cal, "2026-04-01")).toBe(false);
    expect(hasOveruseIndicator(cal, "2026-04-02")).toBe(true);

    unsub();
    model.dispose();
  });

  // ── Tooltip rendering ──

  it("overuse indicator has title attribute with PTO tooltip", () => {
    const model = new PtoBalanceModel(16, [], {
      PTO: 16,
      Sick: 40,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const cal = createCalendar(2026, 3);
    const unsub = model.subscribe((overuseDates) => {
      cal.overuseTooltips = model.overuseTooltips;
      cal.overuseDates = overuseDates;
    });

    const pending = new Map<string, PendingSelection>();
    pending.set("2026-03-02", { hours: 8, type: "PTO" as PTOType });
    pending.set("2026-03-03", { hours: 8, type: "PTO" as PTOType });
    pending.set("2026-03-04", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(pending);

    const tooltip = getOveruseTooltip(cal, "2026-03-04");
    expect(tooltip).not.toBeNull();
    expect(tooltip).toContain("accrued PTO");
    expect(tooltip).toContain("16");
    expect(tooltip).toContain("24");

    unsub();
    model.dispose();
  });

  it("overuse indicator has title attribute with Sick tooltip", () => {
    const model = new PtoBalanceModel(80, [], {
      PTO: 80,
      Sick: 8,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const cal = createCalendar(2026, 4);
    const unsub = model.subscribe((overuseDates) => {
      cal.overuseTooltips = model.overuseTooltips;
      cal.overuseDates = overuseDates;
    });

    const pending = new Map<string, PendingSelection>();
    pending.set("2026-04-01", { hours: 8, type: "Sick" as PTOType });
    pending.set("2026-04-02", { hours: 8, type: "Sick" as PTOType });
    model.setPendingSelections(pending);

    const tooltip = getOveruseTooltip(cal, "2026-04-02");
    expect(tooltip).not.toBeNull();
    expect(tooltip).toContain("annual Sick limit");

    unsub();
    model.dispose();
  });

  it("no title attribute when overuse indicator is absent", () => {
    const model = new PtoBalanceModel(80, [], {
      PTO: 80,
      Sick: 40,
      Bereavement: 24,
      "Jury Duty": 40,
    });

    const cal = createCalendar(2026, 3);
    const unsub = model.subscribe((overuseDates) => {
      cal.overuseTooltips = model.overuseTooltips;
      cal.overuseDates = overuseDates;
    });

    const pending = new Map<string, PendingSelection>();
    pending.set("2026-03-02", { hours: 8, type: "PTO" as PTOType });
    model.setPendingSelections(pending);

    // No overuse → no indicator → no tooltip
    const tooltip = getOveruseTooltip(cal, "2026-03-02");
    expect(tooltip).toBeNull();

    unsub();
    model.dispose();
  });
});

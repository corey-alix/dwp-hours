/**
 * PtoBalanceModel — centralised overuse computation for all pto-calendar
 * instances. Extends `Observable<Set<string>>` so subscribers are auto-
 * notified whenever the overuse date set changes.
 *
 * **Any component holding a PtoBalanceModel instance must call `dispose()`
 * on teardown to prevent memory leaks.**
 */

import { Observable } from "../../shared/observable.js";
import {
  getOveruseDates,
  getOveruseTooltips,
  type BalanceLimits,
  type PTOType,
  type OveruseEntry,
} from "../../../shared/businessRules.js";
import { parseDate } from "../../../shared/dateUtils.js";

// ── Public types ──

/** Minimal entry shape for the balance model. */
export interface BalanceEntry {
  date: string;
  hours: number;
  type: PTOType;
}

/** Monthly accrual record. */
export interface MonthlyAccrual {
  month: number;
  hours: number;
}

/** Pending calendar selection with hours and PTO type. */
export interface PendingSelection {
  hours: number;
  type: PTOType;
}

// ── Set<string> equality ──

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}

// ── Abstract base (re-exported for tests) ──

/**
 * Alias for `Observable<Set<string>>` — the abstract base class
 * that `PtoBalanceModel` extends. Exported so consumers can reference
 * the generic type without coupling to the concrete model.
 */
export const AbstractBalanceModel = Observable<Set<string>>;
export type AbstractBalanceModel = Observable<Set<string>>;

// ── Concrete model ──

/**
 * Centralised balance-model that computes PTO overuse dates across all
 * calendar months. The observable value is a `Set<string>` of YYYY-MM-DD
 * date strings that exceed the budget.
 *
 * **Lifecycle**: Any component holding a `PtoBalanceModel` instance
 * **must** call `dispose()` on teardown (e.g. `disconnectedCallback()`)
 * to clear all subscribers and prevent memory leaks.
 */
export class PtoBalanceModel extends Observable<Set<string>> {
  private readonly _beginningBalance: number;
  private readonly _monthlyAccruals: readonly MonthlyAccrual[];
  private readonly _balanceLimits: BalanceLimits;

  private _persistedEntries: BalanceEntry[] = [];
  private _pendingSelections: Map<string, PendingSelection> = new Map();
  private _overuseTooltips: Map<string, string> = new Map();

  constructor(
    beginningBalance: number,
    monthlyAccruals: readonly MonthlyAccrual[],
    balanceLimits: BalanceLimits,
  ) {
    super(new Set<string>(), setsEqual);
    this._beginningBalance = beginningBalance;
    this._monthlyAccruals = monthlyAccruals;
    this._balanceLimits = balanceLimits;
  }

  /**
   * Replace the full year's persisted PTO entries, then recompute.
   */
  setPersistedEntries(entries: BalanceEntry[]): void {
    this._persistedEntries = [...entries]; // defensive copy
    this.recompute();
  }

  /**
   * Replace the pending (uncommitted) calendar selections, then recompute.
   */
  setPendingSelections(selections: Map<string, PendingSelection>): void {
    this._pendingSelections = new Map(selections); // defensive copy
    this.recompute();
  }

  /**
   * Synchronous convenience accessor — equivalent to `this.get()`.
   * Returns the current set of overuse date strings.
   */
  computeOveruseDates(): Set<string> {
    return this.get();
  }

  /**
   * Returns the current per-date tooltip messages for overuse dates.
   * Updated on every `recompute()` alongside the overuse date set.
   */
  get overuseTooltips(): Map<string, string> {
    return this._overuseTooltips;
  }

  // ── Internal ──

  /**
   * Merge persisted entries + pending selections, compute the accrual-
   * aware PTO limit, and delegate to `getOveruseDates()` for each type.
   * Calls `this.set(result)` which triggers subscriber notification
   * only if the result set actually changed.
   */
  private recompute(): void {
    const merged: OveruseEntry[] = [];

    // Index persisted entries by date for override lookup
    const persistedByDate = new Map<string, BalanceEntry>();
    for (const e of this._persistedEntries) {
      persistedByDate.set(e.date, e);
    }

    // Add persisted entries, allowing pending selections to override
    for (const e of this._persistedEntries) {
      const pending = this._pendingSelections.get(e.date);
      if (pending !== undefined) {
        // Pending overrides persisted
        if (pending.hours > 0) {
          merged.push({
            date: e.date,
            hours: pending.hours,
            type: pending.type,
          });
        }
        // hours === 0 → deletion / unschedule — skip
      } else {
        merged.push({
          date: e.date,
          hours: e.hours,
          type: e.type,
        });
      }
    }

    // Add pending selections that don't overlap persisted entries
    for (const [date, sel] of this._pendingSelections) {
      if (sel.hours <= 0) continue;
      if (!persistedByDate.has(date)) {
        merged.push({
          date,
          hours: sel.hours,
          type: sel.type,
        });
      }
    }

    // Build accrual-aware PTO limit.
    // For PTO: the limit at any point in the year is
    //   beginningBalance + sum(accruals for months 1..maxEntryMonth)
    // We compute the max month that has a PTO entry and accumulate.
    const ptoLimit = this.computeAccrualAwarePtoLimit(merged);

    const limits: BalanceLimits = {
      PTO: ptoLimit,
      Sick: this._balanceLimits.Sick,
      Bereavement: this._balanceLimits.Bereavement,
      "Jury Duty": this._balanceLimits["Jury Duty"],
    };

    const result = getOveruseDates(merged, limits);
    this._overuseTooltips = getOveruseTooltips(merged, limits);
    this.set(result);
  }

  /**
   * Compute the accrual-aware PTO budget through the latest PTO entry
   * month. This is: beginningBalance + sum(accruals for months 1 .. lastMonth).
   *
   * If there are no PTO entries, returns beginningBalance (or the static
   * PTO limit from balanceLimits, whichever is set).
   */
  private computeAccrualAwarePtoLimit(
    merged: ReadonlyArray<OveruseEntry>,
  ): number {
    if (this._monthlyAccruals.length === 0) {
      // No accruals — use the flat PTO limit
      return this._balanceLimits.PTO;
    }

    // Find the latest month among PTO entries
    let maxMonth = 0;
    for (const e of merged) {
      if (e.type !== "PTO" || e.hours <= 0) continue;
      const { month } = parseDate(e.date);
      if (month > maxMonth) maxMonth = month;
    }

    if (maxMonth === 0) {
      // No PTO entries at all — budget is just beginningBalance
      return this._beginningBalance;
    }

    // Sum accruals for months 1..maxMonth
    let accrualSum = 0;
    for (const a of this._monthlyAccruals) {
      if (a.month <= maxMonth) {
        accrualSum += a.hours;
      }
    }

    return this._beginningBalance + accrualSum;
  }
}

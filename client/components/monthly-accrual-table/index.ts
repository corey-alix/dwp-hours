import { BaseComponent } from "../base-component.js";
import type { MonthlyAccrualRow } from "../../../shared/businessRules.js";
import { getCurrentMonth } from "../../../shared/dateUtils.js";
import { styles } from "./css.js";

/**
 * <monthly-accrual-table> — Responsive grid showing month-by-month PTO accrual.
 *
 * Compact layout (narrow): Month | Work Days | Rate | Accrued
 * Wide layout (≥ 540px):   Month | Work Days | Rate | Accrued | Prior Balance | Used | Balance
 *
 * Properties (complex):
 *   rows — MonthlyAccrualRow[] (set via JS, not attribute)
 */
export class MonthlyAccrualTable extends BaseComponent {
  private _rows: MonthlyAccrualRow[] = [];

  get rows(): MonthlyAccrualRow[] {
    return this._rows;
  }

  set rows(value: MonthlyAccrualRow[]) {
    this._rows = value;
    this.requestUpdate();
  }

  private formatNumber(value: number, decimals = 2): string {
    return value.toFixed(decimals);
  }

  private renderHeaderRow(): string {
    return `<div class="header-row">
      <div class="cell header">Month</div>
      <div class="cell header wide-only">Work Days</div>
      <div class="cell header compact-only">Rate</div>
      <div class="cell header compact-only">Accrued</div>
      <div class="cell header wide-only">Prior Bal</div>
      <div class="cell header wide-only">Used</div>
      <div class="cell header">Balance</div>
    </div>`;
  }

  private renderDataRow(row: MonthlyAccrualRow, isCurrent: boolean): string {
    const cls = isCurrent ? "row current-month" : "row";
    const negativeClass = row.balance < 0 ? " negative" : "";
    return `<div class="${cls}">
      <div class="cell month-label">${row.label}</div>
      <div class="cell numeric wide-only">${row.workDays}</div>
      <div class="cell numeric compact-only">${this.formatNumber(row.rate)}</div>
      <div class="cell numeric compact-only">${this.formatNumber(row.accrued)}</div>
      <div class="cell numeric wide-only">${this.formatNumber(row.priorBalance)}</div>
      <div class="cell numeric wide-only">${this.formatNumber(row.used)}</div>
      <div class="cell numeric ${negativeClass}">${this.formatNumber(row.balance)}</div>
    </div>`;
  }

  private renderTotalsRow(): string {
    const totalWorkDays = this._rows.reduce((sum, r) => sum + r.workDays, 0);
    const totalAccrued = this._rows.reduce((sum, r) => sum + r.accrued, 0);
    const totalUsed = this._rows.reduce((sum, r) => sum + r.used, 0);
    const priorBalance = this._rows[0].priorBalance;
    const endingBalance = priorBalance + totalAccrued - totalUsed;
    const fmt = (v: number) => this.formatNumber(v, 1);
    return `<div class="row totals-row">
      <div class="cell month-label">Total</div>
      <div class="cell numeric compact-only">${totalWorkDays}</div>
      <div class="cell numeric compact-only"></div>
      <div class="cell numeric">${fmt(totalAccrued)}</div>
      <div class="cell numeric wide-only">${fmt(priorBalance)}</div>
      <div class="cell numeric wide-only">${fmt(totalUsed)}</div>
      <div class="cell numeric wide-only">${fmt(endingBalance)}</div>
    </div>`;
  }

  protected render(): string {
    if (this._rows.length === 0) {
      return `<style>${styles}</style>`;
    }

    // Determine current month number (1-based) from YYYY-MM string
    const currentMonthStr = getCurrentMonth(); // "YYYY-MM"
    const currentMonthNum = parseInt(currentMonthStr.split("-")[1], 10);

    const dataRows = this._rows
      .map((row) => this.renderDataRow(row, row.month === currentMonthNum))
      .join("");

    return `<style>${styles}</style>
      <div class="card">
      <h4 class="accrual-heading">Monthly Accrual</h4>
      <div class="accrual-grid">
        ${this.renderHeaderRow()}
        ${dataRows}
        ${this.renderTotalsRow()}
      </div>
      </div>`;
  }
}

customElements.define("monthly-accrual-table", MonthlyAccrualTable);

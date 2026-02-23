import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";

/**
 * Data for a single PTO type column in the balance table.
 */
export interface BalanceColumn {
  issued: number;
  used: number;
}

/**
 * Input data for the balance table: issued and used hours per PTO type.
 * Bereavement and Jury Duty are consolidated into "Other".
 */
export interface BalanceTableData {
  pto: BalanceColumn;
  sick: BalanceColumn;
  bereavement: BalanceColumn;
  juryDuty: BalanceColumn;
}

/**
 * <balance-table> — Compact grid showing Issued / Used / Available per PTO type.
 *
 * Consolidates Bereavement + Jury Duty into "Other" for mobile-friendly layout.
 *
 * Layout:
 *   |        | PTO | Sick | Other |
 *   | Issued | x   | x    | x     |
 *   | Used   | y   | y    | y     |
 *   | Avail  | z   | z    | z     |
 *
 * Properties (complex):
 *   data — BalanceTableData
 */
export class BalanceTable extends BaseComponent {
  private _data: BalanceTableData | null = null;

  set data(value: BalanceTableData) {
    this._data = value;
    this.requestUpdate();
  }

  get data(): BalanceTableData | null {
    return this._data;
  }

  private renderCell(value: number, classes: string, isAvail = false): string {
    const negative = isAvail && value < 0 ? " negative" : "";
    const availClass = isAvail ? " row-avail" : "";
    return `<div class="cell${availClass}${negative} ${classes}">${value}</div>`;
  }

  protected render(): string {
    if (!this._data) {
      return `<style>${styles}</style><div class="balance-grid"></div>`;
    }

    const { pto, sick, bereavement, juryDuty } = this._data;

    // Consolidate Bereavement + Jury Duty into "Other"
    const other: BalanceColumn = {
      issued: bereavement.issued + juryDuty.issued,
      used: bereavement.used + juryDuty.used,
    };

    const ptoAvail = pto.issued - pto.used;
    const sickAvail = sick.issued - sick.used;
    const otherAvail = other.issued - other.used;

    return `<style>${styles}</style>
      <div class="balance-grid">
        <div class="cell header"></div>
        <div class="cell header col-pto">PTO</div>
        <div class="cell header col-sick">Sick</div>
        <div class="cell header col-other">Other</div>

        <div class="cell row-label">Issued</div>
        ${this.renderCell(pto.issued, "col-pto")}
        ${this.renderCell(sick.issued, "col-sick")}
        ${this.renderCell(other.issued, "col-other")}

        <div class="cell row-label">Used</div>
        ${this.renderCell(pto.used, "col-pto")}
        ${this.renderCell(sick.used, "col-sick")}
        ${this.renderCell(other.used, "col-other")}

        <div class="cell row-label">Avail</div>
        ${this.renderCell(ptoAvail, "col-pto", true)}
        ${this.renderCell(sickAvail, "col-sick", true)}
        ${this.renderCell(otherAvail, "col-other", true)}
      </div>`;
  }
}

customElements.define("balance-table", BalanceTable);

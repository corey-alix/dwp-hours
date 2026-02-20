import { BaseComponent } from "../base-component.js";
import { CARD_CSS } from "../utils/pto-card-css.js";
import { renderCardShell, renderRow } from "../utils/pto-card-helpers.js";

type EmployeeInfoData = {
  hireDate: string;
  nextRolloverDate: string;
  carryoverHours?: number;
  ptoRatePerDay?: number;
  accrualToDate?: number;
  annualAllocation?: number;
};

export class PtoEmployeeInfoCard extends BaseComponent {
  private data: EmployeeInfoData | null = null;

  static get observedAttributes() {
    return ["data"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data") {
      this.data = JSON.parse(newValue) as EmployeeInfoData;
      this.requestUpdate();
    }
  }

  set info(value: EmployeeInfoData) {
    this.data = value;
    this.requestUpdate();
  }

  protected render(): string {
    if (!this.data) {
      return `<style>${CARD_CSS}</style>${renderCardShell("Employee Information", "<div>Loading...</div>")}`;
    }
    return `
      <style>${CARD_CSS}</style>
      ${renderCardShell(
        "Employee Information",
        `
        ${renderRow("Hire Date", this.data.hireDate)}
        ${renderRow("Next Rollover", this.data.nextRolloverDate)}
        ${this.data.carryoverHours !== undefined ? renderRow("Carryover", `${this.data.carryoverHours.toFixed(1)} hours`) : ""}
        ${this.data.ptoRatePerDay !== undefined ? renderRow("PTO Rate", `${this.data.ptoRatePerDay.toFixed(2)} hrs/day`) : ""}
        ${this.data.accrualToDate !== undefined ? renderRow("Accrued YTD", `${this.data.accrualToDate.toFixed(1)} hours`) : ""}
        ${this.data.annualAllocation !== undefined ? renderRow("Annual Allocation", `${this.data.annualAllocation.toFixed(1)} hours`) : ""}
      `,
      )}
      <slot name="balance-summary"></slot>
    `;
  }
}

customElements.define("pto-employee-info-card", PtoEmployeeInfoCard);

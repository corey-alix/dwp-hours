import { BaseComponent } from "../base-component.js";
import { CARD_CSS } from "../utils/pto-card-css.js";
import { renderCardShell } from "../utils/pto-card-helpers.js";
import type { PTOEntry } from "../../../shared/api-models.js";

type SummaryData = {
  annualAllocation: number;
  availablePTO: number;
  usedPTO: number;
  carryoverFromPreviousYear: number;
};

export class PtoSummaryCard extends BaseComponent {
  private data: SummaryData | null = null;
  private fullEntries: PTOEntry[] = [];

  static get observedAttributes() {
    return ["data", "full-entries"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data") {
      this.data = JSON.parse(newValue) as SummaryData;
      this.requestUpdate();
    }
    if (name === "full-entries") {
      this.fullEntries = JSON.parse(newValue);
      this.requestUpdate();
    }
  }

  set summary(value: SummaryData | null) {
    this.data = value;
    this.requestUpdate();
  }

  set fullPtoEntries(value: PTOEntry[]) {
    this.fullEntries = value;
    this.requestUpdate();
  }

  protected render(): string {
    if (!this.data) {
      return `<style>${CARD_CSS}</style>${renderCardShell("Regular PTO", "<div>Loading...</div>")}`;
    }

    // Check if all PTO entries are approved
    const ptoEntries = this.fullEntries.filter((e) => e.type === "PTO");
    const allApproved =
      ptoEntries.length > 0 && ptoEntries.every((e) => e.approved_by !== null);
    const approvedClass = allApproved ? " approved" : "";

    const formatValue = (val: number) =>
      val < 0 ? `(${val.toFixed(2)})` : val.toFixed(2);
    const getValueClass = (val: number) => (val < 0 ? "negative-balance" : "");

    const body = `
      <div class="row"><span class="label">Carryover</span><span class="${getValueClass(this.data.carryoverFromPreviousYear)}">${formatValue(this.data.carryoverFromPreviousYear)} hours</span></div>
      <div class="row"><span class="label">Annual Allocated</span><span class="${getValueClass(this.data.annualAllocation)}">${formatValue(this.data.annualAllocation)} hours</span></div>
      <div class="row"><span class="label${approvedClass}">Used</span><span class="${getValueClass(this.data.usedPTO)}">${formatValue(this.data.usedPTO)} hours</span></div>
      <hr>
      <div class="row"><span class="label">Available</span><span class="${getValueClass(this.data.availablePTO)}">${formatValue(this.data.availablePTO)} hours</span></div>
      <slot name="balance-summary"></slot>
    `;

    return `<style>${CARD_CSS}
      ::slotted([slot="balance-summary"]) {
        display: block;
        margin-top: var(--space-md);
        padding-top: var(--space-md);
        border-top: 1px solid var(--color-border);
      }

      ::slotted([slot="balance-summary"]) h5 {
        margin: 0 0 var(--space-sm) 0;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
      }
    </style>${renderCardShell("Regular PTO", body)}`;
  }
}

customElements.define("pto-summary-card", PtoSummaryCard);

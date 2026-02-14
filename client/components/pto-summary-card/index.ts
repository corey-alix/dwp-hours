import { PtoSectionCard } from "../utils/pto-card-base.js";
import type { PTOEntry } from "../../../shared/api-models.js";

type SummaryData = {
  annualAllocation: number;
  availablePTO: number;
  usedPTO: number;
  carryoverFromPreviousYear: number;
};

export class PtoSummaryCard extends PtoSectionCard {
  private data: SummaryData | null = null;
  private fullEntries: PTOEntry[] = [];

  static get observedAttributes() {
    return ["data", "full-entries"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data") {
      this.data = JSON.parse(newValue) as SummaryData;
      this.render();
    }
    if (name === "full-entries") {
      this.fullEntries = JSON.parse(newValue);
      this.render();
    }
  }

  set summary(value: SummaryData | null) {
    this.data = value;
    this.render();
  }

  set fullPtoEntries(value: PTOEntry[]) {
    this.fullEntries = value;
    this.render();
  }

  private render() {
    if (!this.data) {
      this.renderCard("Regular PTO", "<div>Loading...</div>");
      return;
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
        `;

    this.renderCard("Regular PTO", body);
  }
}

customElements.define("pto-summary-card", PtoSummaryCard);

import { PtoSectionCard } from "../utils/pto-card-base.js";

type SummaryData = {
    annualAllocation: number;
    availablePTO: number;
    usedPTO: number;
    carryoverFromPreviousYear: number;
};

export class PtoSummaryCard extends PtoSectionCard {
    private data: SummaryData | null = null;

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === "data") {
            this.data = JSON.parse(newValue) as SummaryData;
            this.render();
        }
    }

    set summary(value: SummaryData | null) {
        this.data = value;
        this.render();
    }

    private render() {
        if (!this.data) {
            this.renderCard("Regular PTO", "<div>Loading...</div>");
            return;
        }

        const formatValue = (val: number) => val < 0 ? `(${val.toFixed(2)})` : val.toFixed(2);
        const getValueClass = (val: number) => val < 0 ? 'negative-balance' : '';

        const body = `
            <div class="row"><span class="label">Carryover</span><span class="${getValueClass(this.data.carryoverFromPreviousYear)}">${formatValue(this.data.carryoverFromPreviousYear)} hours</span></div>
            <div class="row"><span class="label">Annual Allocated</span><span class="${getValueClass(this.data.annualAllocation)}">${formatValue(this.data.annualAllocation)} hours</span></div>
            <div class="row"><span class="label">Used</span><span class="${getValueClass(this.data.usedPTO)}">${formatValue(this.data.usedPTO)} hours</span></div>
            <hr>
            <div class="row"><span class="label">Available</span><span class="${getValueClass(this.data.availablePTO)}">${formatValue(this.data.availablePTO)} hours</span></div>
        `;

        this.renderCard("Regular PTO", body);
    }
}

customElements.define("pto-summary-card", PtoSummaryCard);
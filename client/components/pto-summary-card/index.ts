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

    set summary(value: SummaryData) {
        this.data = value;
        this.render();
    }

    private render() {
        if (!this.data) {
            this.renderCard("Regular PTO", "<div>Loading...</div>");
            return;
        }

        const body = `
            <div class="row"><span class="label">Annual Allocation</span><span>${this.data.annualAllocation} hours</span></div>
            <div class="row"><span class="label">Available</span><span>${this.data.availablePTO.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Used</span><span>${this.data.usedPTO.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Carryover</span><span>${this.data.carryoverFromPreviousYear.toFixed(2)} hours</span></div>
        `;

        this.renderCard("Regular PTO", body);
    }
}

customElements.define("pto-summary-card", PtoSummaryCard);
import { SimplePtoBucketCard } from "../utils/pto-card-base.js";

export class PtoJuryDutyCard extends SimplePtoBucketCard {
    constructor() {
        super("Jury Duty");
    }

    static get observedAttributes() {
        return ["data", "entries"];
    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        super.attributeChangedCallback(name, oldValue, newValue);
    }
}

customElements.define("pto-jury-duty-card", PtoJuryDutyCard);
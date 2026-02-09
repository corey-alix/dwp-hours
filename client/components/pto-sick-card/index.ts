import { SimplePtoBucketCard } from "../utils/pto-card-base.js";

type TimeBucketData = {
  allowed: number;
  used: number;
  remaining: number;
};

type UsageEntry = {
  date: string;
  hours: number;
};

export class PtoSickCard extends SimplePtoBucketCard {
  constructor() {
    super("Sick Time");
  }

  static get observedAttributes() {
    return ["data", "entries", "expanded"];
  }

  connectedCallback() {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);
  }
}

customElements.define("pto-sick-card", PtoSickCard);

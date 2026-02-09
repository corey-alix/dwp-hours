import { SimplePtoBucketCard } from "../utils/pto-card-base.js";

export class PtoBereavementCard extends SimplePtoBucketCard {
  constructor() {
    super("Bereavement");
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

customElements.define("pto-bereavement-card", PtoBereavementCard);

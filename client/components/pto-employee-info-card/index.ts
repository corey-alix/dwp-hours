import { PtoSectionCard } from "../utils/pto-card-base.js";

type EmployeeInfoData = {
  hireDate: string;
  nextRolloverDate: string;
};

export class PtoEmployeeInfoCard extends PtoSectionCard {
  private data: EmployeeInfoData | null = null;

  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data") {
      this.data = JSON.parse(newValue) as EmployeeInfoData;
      this.render();
    }
  }

  set info(value: EmployeeInfoData) {
    this.data = value;
    this.render();
  }

  private render() {
    if (!this.data) {
      this.renderCard("Employee Information", "<div>Loading...</div>");
      return;
    }

    const body = `
            <div class="row"><span class="label">Hire Date</span><span>${this.data.hireDate}</span></div>
            <div class="row"><span class="label">Next Rollover</span><span>${this.data.nextRolloverDate}</span></div>
        `;

    this.renderCard("Employee Information", body);
  }
}

customElements.define("pto-employee-info-card", PtoEmployeeInfoCard);

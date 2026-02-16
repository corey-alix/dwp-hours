import { BaseComponent } from "../base-component.js";
import { CARD_CSS } from "../utils/pto-card-css.js";
import { renderCardShell, renderRow } from "../utils/pto-card-helpers.js";

type EmployeeInfoData = {
  hireDate: string;
  nextRolloverDate: string;
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
      `,
      )}
    `;
  }
}

customElements.define("pto-employee-info-card", PtoEmployeeInfoCard);

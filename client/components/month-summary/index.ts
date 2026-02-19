import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";

/**
 * Summary type configuration mapping PTO types to CSS classes and attribute names.
 */
const SUMMARY_TYPES = [
  {
    label: "PTO:",
    attr: "pto-hours",
    cssClass: "summary-pto",
    deltaKey: "PTO",
  },
  {
    label: "Sick:",
    attr: "sick-hours",
    cssClass: "summary-sick",
    deltaKey: "Sick",
  },
  {
    label: "Bereavement:",
    attr: "bereavement-hours",
    cssClass: "summary-bereavement",
    deltaKey: "Bereavement",
  },
  {
    label: "Jury Duty:",
    attr: "jury-duty-hours",
    cssClass: "summary-jury-duty",
    deltaKey: "Jury Duty",
  },
] as const;

/**
 * <month-summary> — displays PTO hour totals grouped by type (PTO, Sick,
 * Bereavement, Jury Duty) with optional pending-delta indicators.
 *
 * Attributes (primitives):
 *   pto-hours, sick-hours, bereavement-hours, jury-duty-hours
 *
 * Properties (complex):
 *   deltas — Record<string, number> keyed by PTO type name
 */
export class MonthSummary extends BaseComponent {
  static get observedAttributes() {
    return ["pto-hours", "sick-hours", "bereavement-hours", "jury-duty-hours"];
  }

  // ── Attribute-backed primitive properties ──

  get ptoHours(): number {
    return parseFloat(this.getAttribute("pto-hours") || "0");
  }

  set ptoHours(value: number) {
    this.setAttribute("pto-hours", value.toString());
  }

  get sickHours(): number {
    return parseFloat(this.getAttribute("sick-hours") || "0");
  }

  set sickHours(value: number) {
    this.setAttribute("sick-hours", value.toString());
  }

  get bereavementHours(): number {
    return parseFloat(this.getAttribute("bereavement-hours") || "0");
  }

  set bereavementHours(value: number) {
    this.setAttribute("bereavement-hours", value.toString());
  }

  get juryDutyHours(): number {
    return parseFloat(this.getAttribute("jury-duty-hours") || "0");
  }

  set juryDutyHours(value: number) {
    this.setAttribute("jury-duty-hours", value.toString());
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;
    this.requestUpdate();
  }

  // ── Complex property: deltas ──

  private _deltas: Record<string, number> = {};

  get deltas(): Record<string, number> {
    return this._deltas;
  }

  set deltas(value: Record<string, number>) {
    this._deltas = value;
    this.requestUpdate();
  }

  // ── Rendering ──

  private getHoursForAttr(attr: string): number {
    return parseFloat(this.getAttribute(attr) || "0");
  }

  private renderItem(config: (typeof SUMMARY_TYPES)[number]): string {
    const hours = this.getHoursForAttr(config.attr);
    const delta = this._deltas[config.deltaKey] || 0;
    const hasValue = hours > 0 || delta !== 0;
    const valueClass = hasValue ? config.cssClass : "";

    const deltaHtml =
      delta !== 0
        ? `<span class="summary-pending">${delta > 0 ? "+" : ""}${delta}</span>`
        : "";

    return `
      <div class="summary-item">
        <span class="summary-label">${config.label}</span>
        <span class="summary-value ${valueClass}" data-summary-type="${config.attr.replace("-hours", "")}">${hours}${deltaHtml}</span>
      </div>
    `;
  }

  protected render(): string {
    return `
      <style>${styles}</style>
      ${SUMMARY_TYPES.map((t) => this.renderItem(t)).join("")}
    `;
  }
}

customElements.define("month-summary", MonthSummary);

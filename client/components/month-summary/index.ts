import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";
import { PTO_TYPES } from "../../shared/pto-types.js";

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
    return [
      "pto-hours",
      "sick-hours",
      "bereavement-hours",
      "jury-duty-hours",
      "interactive",
      "active-type",
    ];
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

  // ── Interactive mode properties ──

  get interactive(): boolean {
    return this.hasAttribute("interactive");
  }

  set interactive(value: boolean) {
    if (value) {
      this.setAttribute("interactive", "");
    } else {
      this.removeAttribute("interactive");
    }
  }

  get activeType(): string | null {
    return this.getAttribute("active-type");
  }

  set activeType(value: string | null) {
    if (value !== null) {
      this.setAttribute("active-type", value);
    } else {
      this.removeAttribute("active-type");
    }
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

  // ── Complex property: balances (available hours per PTO type) ──

  private _balances: Record<string, number> = {};

  get balances(): Record<string, number> {
    return this._balances;
  }

  set balances(value: Record<string, number>) {
    this._balances = value;
    this.requestUpdate();
  }

  // ── Click handling ──

  protected handleDelegatedClick(e: Event): void {
    if (!this.interactive) return;

    const target = e.target as HTMLElement;
    const summaryItem = target.closest(".summary-item") as HTMLElement;
    if (!summaryItem) return;

    const type = summaryItem.dataset.type;
    if (!type || type === this.activeType) return;

    this.activeType = type;
    this.dispatchEvent(
      new CustomEvent("pto-type-changed", {
        detail: { type },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Rendering ──

  private getHoursForAttr(attr: string): number {
    return parseFloat(this.getAttribute(attr) || "0");
  }

  private renderItem(config: (typeof PTO_TYPES)[number]): string {
    const hours = this.getHoursForAttr(config.attr);
    const delta = this._deltas[config.deltaKey] || 0;
    const balance = this._balances[config.deltaKey];
    const hasBalance = balance !== undefined;
    const hasValue = hours > 0 || delta !== 0 || hasBalance;
    const valueClass = hasValue ? config.cssClass : "";

    // Balance mode: override type color with remaining-status color
    let balanceClass = "";
    if (hasBalance) {
      const remaining = balance - hours;
      balanceClass = remaining >= 0 ? "balance-positive" : "balance-negative";
    }

    const isInteractive = this.interactive;
    const isActive = this.activeType === config.deltaKey;
    const itemClasses = [
      "summary-item",
      isInteractive ? "interactive" : "",
      isActive ? "active" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const ariaAttrs = isInteractive
      ? ` role="option" aria-selected="${isActive}" tabindex="0"`
      : "";

    const deltaHtml =
      delta !== 0
        ? `<span class="summary-pending">${delta > 0 ? "+" : ""}${delta}</span>`
        : "";

    // Display: "available-scheduled" when balances set, otherwise just scheduled hours
    const displayValue = hasBalance ? `${balance}-${hours}` : `${hours}`;

    return `
      <div class="${itemClasses}" data-type="${config.deltaKey}"${ariaAttrs}>
        <span class="summary-label">${config.label}</span>
        <span class="summary-value ${valueClass} ${balanceClass}" data-summary-type="${config.attr.replace("-hours", "")}">${displayValue}${deltaHtml}</span>
      </div>
    `;
  }

  protected render(): string {
    // Set interactive ARIA attributes on the host element
    if (this.interactive) {
      this.setAttribute("role", "listbox");
      this.setAttribute("aria-label", "PTO type selection");
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
    }

    return `
      <style>${styles}</style>
      ${PTO_TYPES.map((t) => this.renderItem(t)).join("")}
    `;
  }
}

customElements.define("month-summary", MonthSummary);

import { BaseComponent } from "../base-component.js";
import {
  parseDate,
  isValidDateString,
  formatDateForDisplay,
} from "../../../shared/dateUtils.js";
import type { PTOEntry } from "../../../shared/api-models.js";

/** Map PTO type to its CSS color class for color-coded hours. */
const TYPE_CSS_CLASS: Record<string, string> = {
  PTO: "type-pto",
  Sick: "type-sick",
  Bereavement: "type-bereavement",
  "Jury Duty": "type-jury-duty",
};

const CARD_STYLES = `
  :host { display: block; }

  .card {
    background: var(--color-background);
    border: var(--border-width) var(--border-style-solid) var(--color-border);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
  }

  @media all {
    .card { padding: var(--space-lg); }
  }

  @media (min-width: 360px) {
    .card { padding: var(--space-sm); }
  }

  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .card h4 {
    text-align: center;
    background: var(--color-surface);
    padding: var(--space-sm);
    margin: 0 0 var(--space-md) 0;
    font-size: var(--font-size-xl);
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }

  .toggle-button {
    background: var(--color-secondary);
    color: black;
    border: none;
    border-radius: var(--border-radius-md);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    transition: background-color var(--transition-fast);
    margin: var(--space-md) 0;
    width: 100%;
    justify-content: center;
  }

  .toggle-button:hover { background: var(--color-secondary-hover); }

  .toggle-button:focus {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .chevron { transition: transform var(--transition-fast); }

  .chevron.expanded { transform: rotate(180deg); }

  .entry-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: var(--space-md);
  }

  .entry-table th {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-xs) var(--space-sm);
    text-transform: uppercase;
  }

  .entry-table td {
    font-size: var(--font-size-sm);
    padding: var(--space-xs) var(--space-sm);
    border-bottom: 1px solid var(--color-border-light);
  }

  .entry-table tr:last-child td { border-bottom: none; }

  .usage-date {
    cursor: pointer;
    text-decoration: underline;
    color: var(--color-primary);
    padding: var(--space-xs);
    border-radius: var(--border-radius-sm);
    margin: calc(var(--space-xs) * -1);
  }

  .usage-date:hover { background: var(--color-surface-hover); }

  .usage-date:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .approved::after {
    content: " ✓";
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
  }

  /* PTO type color coding */

  .type-pto { color: var(--color-text); }

  .type-sick { color: var(--color-text); }

  .type-bereavement { color: var(--color-text); }

  .type-jury-duty { color: var(--color-text); }

  .empty {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-style: italic;
    text-align: center;
    padding: var(--space-md);
  }

  @media (prefers-reduced-motion: reduce) {

    .chevron { transition: none; }
  }
`;

/**
 * <pto-pto-card> — Unified Scheduled Time Off detail card.
 *
 * Shows a reverse-chronological table of all PTO entries (PTO, Sick,
 * Bereavement, Jury Duty) with color-coded hours and approval indicators.
 *
 * Properties (complex):
 *   fullPtoEntries — PTOEntry[] for all types
 *
 * Attributes (primitive):
 *   expanded — "true" | "false"
 */
export class PtoPtoCard extends BaseComponent {
  private fullEntries: PTOEntry[] = [];
  private expanded: boolean = false;

  static get observedAttributes() {
    return ["expanded"];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;
    if (name === "expanded") {
      this.expanded = newValue === "true";
    }
    this.requestUpdate();
  }

  set isExpanded(value: boolean) {
    this.expanded = value;
    this.setAttribute("expanded", value.toString());
  }

  set fullPtoEntries(value: PTOEntry[]) {
    this.fullEntries = value;
    this.requestUpdate();
  }

  get fullPtoEntries(): PTOEntry[] {
    return this.fullEntries;
  }

  private renderToggle(): string {
    if (this.fullEntries.length === 0) return "";
    return `
      <button class="toggle-button" aria-expanded="${this.expanded}" aria-label="${this.expanded ? "Hide" : "Show"} scheduled time off details">
        ${this.expanded ? "Hide Details" : "Show Details"}
        <span class="chevron ${this.expanded ? "expanded" : ""}">▼</span>
      </button>
    `;
  }

  private renderTable(): string {
    if (!this.expanded || this.fullEntries.length === 0) return "";

    // Reverse chronological order
    const sorted = [...this.fullEntries].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    const rows = sorted
      .map((entry) => {
        const dateLabel = isValidDateString(entry.date)
          ? formatDateForDisplay(entry.date)
          : entry.date;
        const dateAttr = isValidDateString(entry.date)
          ? `data-date="${entry.date}"`
          : "";
        const clickableClass = isValidDateString(entry.date)
          ? "usage-date"
          : "";
        const tabIndex = isValidDateString(entry.date) ? 'tabindex="0"' : "";
        const ariaLabel = isValidDateString(entry.date)
          ? `aria-label="Navigate to ${dateLabel} in calendar"`
          : "";
        const isApproved =
          entry.approved_by !== null && entry.approved_by !== undefined;
        const approvedClass = isApproved ? " approved" : "";
        const typeClass = TYPE_CSS_CLASS[entry.type] || "";

        return `<tr>
        <td class="text-left"><span class="${clickableClass}${approvedClass}" ${dateAttr} ${tabIndex} ${ariaLabel}>${dateLabel}</span></td>
        <td class="text-left">${entry.type}</td>
        <td class="text-right ${typeClass}">${entry.hours.toFixed(1)}</td>
      </tr>`;
      })
      .join("");

    return `
      <table class="entry-table">
        <thead><tr><th class="text-left">Date</th><th class="text-left">Type</th><th class="text-right">Hours</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  protected render(): string {
    const body =
      this.fullEntries.length === 0
        ? `<div class="empty">No scheduled time off.</div>`
        : `${this.renderToggle()}${this.renderTable()}`;

    return `<style>${CARD_STYLES}</style>
      <div class="card">
        <h4>Scheduled Time Off</h4>
        ${body}
      </div>`;
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.matches(".toggle-button") || target.closest(".toggle-button")) {
      this.expanded = !this.expanded;
      this.requestUpdate();
      return;
    }
    if (target.matches(".usage-date")) {
      const dateStr = target.dataset.date;
      if (dateStr && isValidDateString(dateStr)) {
        const { year, month } = parseDate(dateStr);
        this.dispatchEvent(
          new CustomEvent("navigate-to-month", {
            detail: { month, year },
            bubbles: true,
          }),
        );
      }
    }
  }

  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.matches(".usage-date") && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      const dateStr = target.dataset.date;
      if (dateStr && isValidDateString(dateStr)) {
        const { year, month } = parseDate(dateStr);
        this.dispatchEvent(
          new CustomEvent("navigate-to-month", {
            detail: { month, year },
            bubbles: true,
          }),
        );
      }
    }
  }
}

customElements.define("pto-pto-card", PtoPtoCard);

import { SimplePtoBucketCard, PTO_CARD_CSS } from "../utils/pto-card-base.js";
import {
  parseDate,
  isValidDateString,
  formatDateForDisplay,
} from "../../../shared/dateUtils.js";
import type { PTOEntry } from "../../../shared/api-models.js";

export class PtoJuryDutyCard extends SimplePtoBucketCard {
  private fullEntries: PTOEntry[] = [];

  constructor() {
    super("Jury Duty");
  }

  static get observedAttributes() {
    return ["data", "entries", "expanded", "full-entries"];
  }

  connectedCallback() {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "full-entries") {
      this.fullEntries = JSON.parse(newValue);
      this.render();
    } else {
      super.attributeChangedCallback(name, oldValue, newValue);
    }
  }

  set fullPtoEntries(value: PTOEntry[]) {
    this.fullEntries = value;
    this.render();
  }

  get fullPtoEntries(): PTOEntry[] {
    return this.fullEntries;
  }

  protected render() {
    if (!this.data) {
      this.renderCard(this.cardTitle, "<div>Loading...</div>");
      return;
    }

    const hasEntries = this.entries && this.entries.length > 0;
    const toggleButtonHtml = hasEntries
      ? `
            <button class="toggle-button" aria-expanded="${this.expanded}" aria-label="${this.expanded ? "Hide" : "Show"} detailed usage">
                ${this.expanded ? "Hide Details" : "Show Details"}
                <span class="chevron ${this.expanded ? "expanded" : ""}">▼</span>
            </button>
        `
      : "";

    const usageSection =
      this.expanded && hasEntries
        ? (() => {
            const rows = this.entries
              .map((entry: any, index: number) => {
                const label = isValidDateString(entry.date)
                  ? formatDateForDisplay(entry.date)
                  : entry.date;
                const dateAttr = isValidDateString(entry.date)
                  ? `data-date="${entry.date}"`
                  : "";
                const clickableClass = isValidDateString(entry.date)
                  ? "usage-date"
                  : "";
                const tabIndex = isValidDateString(entry.date)
                  ? 'tabindex="0"'
                  : "";
                const ariaLabel = isValidDateString(entry.date)
                  ? `aria-label="Navigate to ${label} in calendar"`
                  : "";
                // Check if this specific entry is approved
                const correspondingFullEntry = this.fullEntries.find(
                  (e) => e.date === entry.date && e.type === "Jury Duty",
                );
                const isApproved =
                  correspondingFullEntry &&
                  correspondingFullEntry.approved_by !== null;
                const approvedClass = isApproved ? " approved" : "";
                return `<li><span class="${clickableClass}${approvedClass}" ${dateAttr} ${tabIndex} ${ariaLabel}>${label}</span> <span>${entry.hours.toFixed(1)} hours</span></li>`;
              })
              .join("");

            const list = rows
              ? `<ul class="usage-list">${rows}</ul>`
              : `<div class="empty">No entries recorded.</div>`;

            return `
                <div class="usage-section">
                    <div class="usage-title">Dates Used <span class="usage-help">(click dates to view in calendar)</span></div>
                    ${list}
                </div>
            `;
          })()
        : "";

    // Check if all jury duty entries are approved
    const juryDutyEntries = this.fullEntries.filter(
      (e) => e.type === "Jury Duty",
    );
    const allApproved =
      juryDutyEntries.length > 0 &&
      juryDutyEntries.every((e) => e.approved_by !== null);
    const approvedClass = allApproved ? " approved" : "";

    const body = `
            <div class="row"><span class="label">Allowed</span><span>${this.data.allowed} hours</span></div>
            <div class="row"><span class="label${approvedClass}">Used</span><span>${this.data.used.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Remaining</span><span>${this.data.remaining.toFixed(2)} hours</span></div>
            ${toggleButtonHtml}
            ${usageSection}
        `;

    this.shadow.innerHTML =
      PTO_CARD_CSS +
      '<div class="card"><h4>' +
      this.cardTitle +
      "</h4>" +
      body +
      "</div>";

    // Add event listener for toggle button
    const toggleButton = this.shadow.querySelector(
      ".toggle-button",
    ) as HTMLButtonElement;
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        this.expanded = !this.expanded;
        this.render();
      });
    }

    // Add event listeners for clickable dates
    this.shadow
      .querySelectorAll<HTMLSpanElement>(".usage-date")
      .forEach((dateElement) => {
        const handleClick = () => {
          const dateStr = dateElement.dataset.date;
          if (dateStr && isValidDateString(dateStr)) {
            const { year, month } = parseDate(dateStr);
            // Dispatch custom event to navigate to the month containing this date
            this.dispatchEvent(
              new CustomEvent("navigate-to-month", {
                detail: { month, year },
                bubbles: true,
              }),
            );
          }
        };

        dateElement.addEventListener("click", handleClick);
        dateElement.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        });
      });
  }
}

customElements.define("pto-jury-duty-card", PtoJuryDutyCard);

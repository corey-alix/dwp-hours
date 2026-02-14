import {
  isValidDateString,
  formatDateForDisplay,
  parseDate,
} from "../../../shared/dateUtils.js";

export const PTO_CARD_CSS = `
    <style>
        :host {
            display: block;
        }

        .card {
            background: var(--color-background);
            border: var(--border-width) var(--border-style-solid) var(--color-border);
            border-radius: var(--border-radius-lg);
            padding: var(--space-lg);
            box-shadow: var(--shadow-md);
        }

        .card h4 {
            margin: 0 0 var(--space-md) 0;
            font-size: var(--font-size-lg);
            color: var(--color-text);
            font-weight: var(--font-weight-semibold);
        }

        .card .row {
            display: flex;
            justify-content: space-between;
            gap: var(--space-lg);
            margin: var(--space-xs) 0;
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }

        .card .row:last-child {
            margin-bottom: var(--space-md);
        }

        .card .label {
            font-weight: var(--font-weight-medium);
        }

        .card .label.approved::after {
            content: " ✓";
            color: var(--color-success);
            font-weight: var(--font-weight-semibold);
        }

        .card .usage-date.approved::after {
            content: " ✓";
            color: var(--color-success);
            font-weight: var(--font-weight-semibold);
        }

        .card .negative-balance {
            color: var(--color-error);
            font-weight: var(--font-weight-semibold);
        }

        .toggle-button {
            background: var(--color-primary);
            color: var(--color-primary-contrast);
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

        .toggle-button:hover {
            background: var(--color-primary-hover);
        }

        .toggle-button:focus {
            outline: 2px solid var(--color-focus);
            outline-offset: 2px;
        }

        .chevron {
            transition: transform var(--transition-fast);
        }

        .chevron.expanded {
            transform: rotate(180deg);
        }

        .usage-section {
            margin-top: var(--space-md);
            padding-top: var(--space-md);
            border-top: 1px solid var(--color-border);
        }

        .usage-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--color-text-secondary);
            margin-bottom: var(--space-sm);
        }

        .usage-help {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-normal);
            color: var(--color-text-muted);
            font-style: italic;
        }

        .usage-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .usage-list li {
            display: flex;
            justify-content: space-between;
            padding: var(--space-xs) 0;
            font-size: var(--font-size-sm);
            border-bottom: 1px solid var(--color-border-light);
        }

        .usage-list li:last-child {
            border-bottom: none;
        }

        .usage-date {
            cursor: pointer;
            text-decoration: underline;
            color: var(--color-primary);
            transition: background-color var(--transition-fast);
            padding: var(--space-xs);
            border-radius: var(--border-radius-sm);
            margin: calc(var(--space-xs) * -1);
        }

        .usage-date:hover {
            background: var(--color-surface-hover);
        }

        .usage-date:focus {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
        }

        .empty {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            font-style: italic;
        }

        @media (max-width: 480px) {
            .usage-list li {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-xs);
            }

            .usage-list li span:first-child {
                font-weight: var(--font-weight-medium);
            }
        }
    </style>
`;

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export class PtoSectionCard extends HTMLElement {
  protected shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  protected renderCard(title: string, body: string): void {
    this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .card {
                    background: var(--color-background);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-lg);
                    padding: var(--space-lg);
                    box-shadow: var(--shadow-md);
                }

                .card h4 {
                    margin: 0 0 var(--space-md) 0;
                    font-size: var(--font-size-lg);
                    color: var(--color-text);
                    font-weight: var(--font-weight-semibold);
                }

                .card .row {
                    display: flex;
                    justify-content: space-between;
                    gap: var(--space-lg);
                    margin: var(--space-xs) 0;
                    font-size: var(--font-size-sm);
                    color: var(--color-text-secondary);
                }

                .card .label {
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .card .negative-balance {
                    color: var(--color-error);
                    font-weight: var(--font-weight-semibold);
                }
            </style>
            <div class="card">
                <h4>${title}</h4>
                ${body}
            </div>
        `;
  }
}

export class SimplePtoBucketCard extends PtoSectionCard {
  protected cardTitle: string;
  protected data: any = null;
  protected entries: any[] = [];
  protected expanded: boolean = false;

  constructor(title: string) {
    super();
    this.cardTitle = title;
  }

  static get observedAttributes() {
    return ["data", "entries", "expanded"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "data") {
      this.data = JSON.parse(newValue);
      this.render();
    }
    if (name === "entries") {
      this.entries = JSON.parse(newValue);
      this.render();
    }
    if (name === "expanded") {
      this.expanded = newValue === "true";
      this.render();
    }
  }

  set bucket(value: any) {
    this.data = value;
    this.render();
  }

  set usageEntries(value: any[]) {
    this.entries = value;
    this.render();
  }

  get usageEntries(): any[] {
    return this.entries;
  }

  set isExpanded(value: boolean) {
    this.expanded = value;
    this.setAttribute("expanded", value.toString());
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
                return `<li><span class="${clickableClass}" ${dateAttr} ${tabIndex} ${ariaLabel}>${label}</span> <span>${entry.hours.toFixed(1)} hours</span></li>`;
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

    const remainingValue = this.data.remaining.toFixed(2);
    const remainingClass = this.data.remaining < 0 ? "negative-balance" : "";
    const remainingDisplay =
      this.data.remaining < 0
        ? `-${Math.abs(this.data.remaining).toFixed(2)}`
        : remainingValue;

    const body = `
            <div class="row"><span class="label">Allowed</span><span>${this.data.allowed} hours</span></div>
            <div class="row"><span class="label">Used</span><span>${this.data.used.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Remaining</span><span class="${remainingClass}">${remainingDisplay} hours</span></div>
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

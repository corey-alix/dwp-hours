import { PtoSectionCard, monthNames } from "../utils/pto-card-base.js";
import { PtoCalendar, CalendarEntry } from "../pto-calendar/index.js";
import { querySingle } from "../test-utils.js";
import {
  getWorkDays,
  getTotalWorkDaysInYear,
  getAllocationRate,
} from "../../../server/workDays.js";
import { getCurrentYear, today, parseDate } from "../../../shared/dateUtils.js";

type CalendarData = Record<
  number,
  Record<number, { type: string; hours: number }>
>;

type AccrualData = {
  month: number;
  hours: number;
};

type UsageData = {
  month: number;
  hours: number;
};

type PTOEntry = {
  id: number;
  employeeId: number;
  date: string;
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string;
  approved_by?: number | null;
};

export class PtoAccrualCard extends PtoSectionCard {
  private accruals: AccrualData[] = [];
  private usage: UsageData[] = [];
  private _ptoEntries: PTOEntry[] = [];
  protected selectedMonth: number | null = null;
  private year: number = getCurrentYear();
  private _requestMode: boolean = false;
  private _annualAllocation: number = 96; // Default 96 hours annual PTO

  static get observedAttributes() {
    return [
      "accruals",
      "usage",
      "pto-entries",
      "year",
      "request-mode",
      "annual-allocation",
    ];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "accruals") {
      this.accruals = JSON.parse(newValue) as AccrualData[];
    }
    if (name === "usage") {
      this.usage = JSON.parse(newValue) as UsageData[];
    }
    if (name === "pto-entries") {
      this._ptoEntries = JSON.parse(newValue) as PTOEntry[];
    }
    if (name === "year") {
      this.year = parseInt(newValue, 10) || this.year;
    }
    if (name === "request-mode") {
      this._requestMode = newValue === "true";
    }
    if (name === "annual-allocation") {
      this._annualAllocation = parseFloat(newValue) || 96;
    }
    this.render();
  }

  set monthlyAccruals(value: AccrualData[]) {
    this.accruals = value;
    this.render();
  }

  set monthlyUsage(value: UsageData[]) {
    this.usage = value;
    this.render();
  }

  set ptoEntries(value: PTOEntry[]) {
    this._ptoEntries = value;
    console.log("PtoAccrualCard: set ptoEntries:", value);
    this.render();
  }

  set calendarYear(value: number) {
    this.year = value;
    this.render();
  }

  set requestMode(value: boolean) {
    this._requestMode = value;
    this.setAttribute("request-mode", value.toString());
  }

  set annualAllocation(value: number) {
    this._annualAllocation = value;
    this.setAttribute("annual-allocation", value.toString());
  }

  /**
   * Navigate to a specific month in the calendar view
   * @param month - The month to navigate to (1-12)
   * @param year - Optional year to navigate to, defaults to current year
   */
  navigateToMonth(month: number, year?: number) {
    this.selectedMonth = month;
    if (year !== undefined) {
      this.year = year;
    }
    this.render();
  }

  private render() {
    // Check if component is wide enough for alternating row colors
    const isWide = this.offsetWidth > 600;

    // Create maps for quick lookup
    const accrualByMonth = new Map(
      this.accruals.map((entry) => [entry.month, entry.hours]),
    );
    const usageByMonth = new Map(
      this.usage.map((entry) => [entry.month, entry.hours]),
    );

    // Generate rows for all 12 months
    const { month: currentMonth, year: currentYear } = parseDate(today());

    // Calculate PTO rate for projected accruals
    const totalWorkDaysInYear = getTotalWorkDaysInYear(this.year);
    const ptoRate = this._annualAllocation / totalWorkDaysInYear;

    const rows = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1; // 1-based month
      const monthName = monthNames[month - 1];
      const accruedHours = accrualByMonth.get(month);
      const usedHours = usageByMonth.get(month);

      // Determine if this is a future month for projected data
      const isFutureMonth =
        this.year > currentYear ||
        (this.year === currentYear && month > currentMonth);
      const isCurrentMonth =
        this.year === currentYear && month === currentMonth;

      // Calculate projected accrual for future months
      let displayAccrued: string;
      if (accruedHours !== undefined) {
        displayAccrued = accruedHours.toFixed(1);
      } else if (isFutureMonth) {
        const workDaysInMonth = getWorkDays(this.year, month);
        const projectedAccrual = ptoRate * workDaysInMonth;
        displayAccrued = `${projectedAccrual.toFixed(1)}`; // css renders the ~ for future dates
      } else {
        displayAccrued = "0.0";
      }

      return `
                <div class="accrual-row data-row ${i % 2 === 0 ? "alt" : ""} ${isFutureMonth ? "projected" : ""} ${isCurrentMonth ? "current" : ""}">
                    <span class="month">${monthName}</span>
                    <span class="hours">${displayAccrued}</span>
                    <span class="used">${usedHours !== undefined ? usedHours.toFixed(1) : "—"}</span>
                    <button class="calendar-button ${this._requestMode ? "request-mode" : ""}" data-month="${month}" aria-label="${this._requestMode ? "Request PTO for" : "Show"} ${monthName} calendar">${this._requestMode ? "✏️" : "📅"}</button>
                </div>
            `;
    }).join("");

    // Filter PTO entries for the selected month
    const monthPtoEntries: PTOEntry[] = [];
    if (this.selectedMonth) {
      monthPtoEntries.push(
        ...this._ptoEntries.filter((entry) => {
          const [entryYear, entryMonthStr] = entry.date.split("-");
          const entryMonth = parseInt(entryMonthStr, 10);
          const entryYearNum = parseInt(entryYear, 10);
          const matches =
            entryMonth === this.selectedMonth && entryYearNum === this.year;
          if (this.selectedMonth === 3 && entry.date.startsWith("2026-03")) {
            console.log(
              "PtoAccrualCard: Filtering entry for March:",
              entry,
              "entryMonth:",
              entryMonth,
              "entryYearNum:",
              entryYearNum,
              "matches:",
              matches,
            );
          }
          return matches;
        }),
      );
      console.log(
        "PtoAccrualCard: monthPtoEntries for month",
        this.selectedMonth,
        ":",
        monthPtoEntries,
      );
    }

    const body = `
            <div class="accrual-grid${isWide ? " wide" : ""}">
                <div class="accrual-row header">
                    <span></span>
                    <span class="label">Accrued</span>
                    <span class="label">Used</span>
                    <span></span>
                </div>
                ${rows}
            </div>
            ${
              this.selectedMonth
                ? `<pto-calendar month="${this.selectedMonth - 1}" year="${this.year}" pto-entries='${JSON.stringify(monthPtoEntries)}' selected-month="${this.selectedMonth}" readonly="${!this._requestMode}">
                ${this._requestMode ? '<button slot="submit" class="submit-button">Submit PTO Request</button>' : ""}
            </pto-calendar>`
                : ""
            }
        `;

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

                h4 {
                    margin: 0 0 var(--space-md) 0;
                    font-size: var(--font-size-lg);
                    color: var(--color-text);
                    font-weight: var(--font-weight-semibold);
                }

                .accrual-grid {
                    display: grid;
                    grid-template-columns: 1fr auto auto auto;
                    gap: var(--space-sm) var(--space-md);
                }

                .accrual-row {
                    display: grid;
                    grid-template-columns: subgrid;
                    grid-column: 1 / -1;
                    align-items: center;
                    font-size: var(--font-size-sm);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                }

                .accrual-row.header {
                    font-size: var(--font-size-xs);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--color-text-muted);
                }

                .accrual-row.header .label {
                    text-align: right;
                }

                .accrual-row .month {
                    font-weight: var(--font-weight-semibold);
                }

                .accrual-row.projected {
                    opacity: 0.7;
                }

                .accrual-row.projected .hours::before {
                    content: "~";
                    opacity: 0.6;
                }

                .accrual-grid.wide .data-row.alt {
                    background-color: var(--color-surface);
                }

                .accrual-row.current {
                    background: var(--color-primary-light);
                    border-radius: var(--border-radius);
                    padding: var(--space-xs) var(--space-sm);
                    margin: 0 calc(-1 * var(--space-sm));
                }

                .accrual-row:hover {
                    background-color: var(--color-surface-hover) !important;
                }

                .accrual-row .hours,
                .accrual-row .used {
                    text-align: right;
                }

                .calendar-button {
                    border: none;
                    background: var(--color-surface);
                    border-radius: var(--border-radius);
                    padding: var(--space-xs) var(--space-sm);
                    cursor: pointer;
                    color: var(--color-text);
                }

                .calendar-button.request-mode {
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                }

                .calendar-button.request-mode:hover {
                    background: var(--color-primary-hover);
                }

                .empty {
                    color: var(--color-text-muted);
                    font-size: var(--font-size-xs);
                }

                .submit-button {
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                    border: none;
                    padding: var(--space-sm) var(--space-lg);
                    border-radius: var(--border-radius);
                    font-size: var(--font-size-sm);
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .submit-button:hover {
                    background: var(--color-primary-hover);
                }

                .submit-button:disabled {
                    background: var(--color-text-muted);
                    cursor: not-allowed;
                }
            </style>
            <div class="card">
                <h4>${this._requestMode ? "PTO Request - Select Month" : "Monthly Accrual Breakdown"}</h4>
                ${body}
            </div>
        `;

    // Scroll calendar into view if it's newly displayed
    if (this.selectedMonth) {
      const calendar = this.shadow.querySelector("pto-calendar") as HTMLElement;
      if (calendar) {
        calendar.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    this.shadow
      .querySelectorAll<HTMLButtonElement>(".calendar-button")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const month = parseInt(button.dataset.month || "", 10);
          console.log("PtoAccrualCard: calendar button clicked, month:", month);
          this.selectedMonth = Number.isFinite(month) ? month : null;
          console.log(
            "PtoAccrualCard: set selectedMonth to:",
            this.selectedMonth,
          );
          this.render();
        });
      });

    // Add row click handlers
    this.shadow
      .querySelectorAll<HTMLDivElement>(".accrual-row.data-row")
      .forEach((row, index) => {
        row.addEventListener("click", () => {
          const month = index + 1;
          console.log("PtoAccrualCard: row clicked, month:", month);
          this.selectedMonth = month;
          this.render();
        });
      });

    // Handle PTO request submission
    const calendar = this.shadow.querySelector<PtoCalendar>("pto-calendar");
    if (calendar) {
      calendar.addEventListener("pto-request-submit", (e: any) => {
        console.log(
          "PtoAccrualCard received pto-request-submit event from calendar:",
          e.detail,
        );
        e.stopPropagation();
        this.handlePtoRequestSubmit(e.detail.requests);
      });
    }
  }

  private async handlePtoRequestSubmit(requests: CalendarEntry[]) {
    console.log(
      "PtoAccrualCard.handlePtoRequestSubmit called with requests:",
      requests,
    );
    try {
      // Dispatch event to parent component for API submission
      const event = new CustomEvent("pto-request-submit", {
        detail: { requests },
        bubbles: true,
        composed: true,
      });
      console.log(
        "PtoAccrualCard dispatching pto-request-submit event:",
        event,
      );
      this.dispatchEvent(event);
    } catch (error) {
      console.error("Error submitting PTO request:", error);
      // Could add error display here
    }
  }
}

customElements.define("pto-accrual-card", PtoAccrualCard);

import { BaseComponent } from "../base-component.js";
import { monthNames } from "../utils/pto-card-helpers.js";
import { CalendarEntry } from "../pto-calendar/index.js";
import {
  getWorkDays,
  getTotalWorkDaysInYear,
} from "../../../server/workDays.js";
import { getCurrentYear, today, parseDate } from "../../../shared/dateUtils.js";

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

const ACCRUAL_CSS = `
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
`;

export class PtoAccrualCard extends BaseComponent {
  private accruals: AccrualData[] = [];
  private usage: UsageData[] = [];
  private _ptoEntries: PTOEntry[] = [];
  protected selectedMonth: number | null = null;
  private year: number = getCurrentYear();
  private _requestMode: boolean = false;
  private _annualAllocation: number = 96;
  private _ptoRequestEventsSetup = false;

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

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "accruals") {
      this.accruals = JSON.parse(newValue) as AccrualData[];
    } else if (name === "usage") {
      this.usage = JSON.parse(newValue) as UsageData[];
    } else if (name === "pto-entries") {
      this._ptoEntries = JSON.parse(newValue) as PTOEntry[];
    } else if (name === "year") {
      this.year = parseInt(newValue, 10) || this.year;
    } else if (name === "request-mode") {
      this._requestMode = newValue === "true";
    } else if (name === "annual-allocation") {
      this._annualAllocation = parseFloat(newValue) || 96;
    }
    this.requestUpdate();
  }

  set monthlyAccruals(value: AccrualData[]) {
    this.accruals = value;
    this.requestUpdate();
  }

  set monthlyUsage(value: UsageData[]) {
    this.usage = value;
    this.requestUpdate();
  }

  set ptoEntries(value: PTOEntry[]) {
    this._ptoEntries = value;
    console.log("PtoAccrualCard: set ptoEntries:", value);
    this.requestUpdate();
  }

  set calendarYear(value: number) {
    this.year = value;
    this.requestUpdate();
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
    this.requestUpdate();
  }

  private renderMonthGrid(): string {
    const isWide = this.offsetWidth > 600;

    const accrualByMonth = new Map(
      this.accruals.map((entry) => [entry.month, entry.hours]),
    );
    const usageByMonth = new Map(
      this.usage.map((entry) => [entry.month, entry.hours]),
    );

    const { month: currentMonth, year: currentYear } = parseDate(today());
    const totalWorkDaysInYear = getTotalWorkDaysInYear(this.year);
    const ptoRate = this._annualAllocation / totalWorkDaysInYear;

    const rows = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthName = monthNames[month - 1];
      const accruedHours = accrualByMonth.get(month);
      const usedHours = usageByMonth.get(month);

      const isFutureMonth =
        this.year > currentYear ||
        (this.year === currentYear && month > currentMonth);
      const isCurrentMonth =
        this.year === currentYear && month === currentMonth;

      let displayAccrued: string;
      if (accruedHours !== undefined) {
        displayAccrued = accruedHours.toFixed(1);
      } else if (isFutureMonth) {
        const workDaysInMonth = getWorkDays(this.year, month);
        const projectedAccrual = ptoRate * workDaysInMonth;
        displayAccrued = `${projectedAccrual.toFixed(1)}`;
      } else {
        displayAccrued = "0.0";
      }

      return `
        <div class="accrual-row data-row ${i % 2 === 0 ? "alt" : ""} ${isFutureMonth ? "projected" : ""} ${isCurrentMonth ? "current" : ""}" data-month="${month}">
          <span class="month">${monthName}</span>
          <span class="hours">${displayAccrued}</span>
          <span class="used">${usedHours !== undefined ? usedHours.toFixed(1) : "—"}</span>
          <button class="calendar-button ${this._requestMode ? "request-mode" : ""}" data-month="${month}" aria-label="${this._requestMode ? "Request PTO for" : "Show"} ${monthName} calendar">${this._requestMode ? "✏️" : "📅"}</button>
        </div>
      `;
    }).join("");

    return `
      <div class="accrual-grid${isWide ? " wide" : ""}">
        <div class="accrual-row header">
          <span></span>
          <span class="label">Accrued</span>
          <span class="label">Used</span>
          <span></span>
        </div>
        ${rows}
      </div>
    `;
  }

  protected render(): string {
    // Filter PTO entries for the selected month and dispatch event
    if (this.selectedMonth) {
      const monthPtoEntries = this._ptoEntries.filter((entry) => {
        const [entryYear, entryMonthStr] = entry.date.split("-");
        const entryMonth = parseInt(entryMonthStr, 10);
        const entryYearNum = parseInt(entryYear, 10);
        return entryMonth === this.selectedMonth && entryYearNum === this.year;
      });

      // Dispatch month-selected so the consumer can create/update a slotted calendar
      // Use queueMicrotask to avoid dispatching during render (side-effect-free render)
      queueMicrotask(() => {
        this.dispatchEvent(
          new CustomEvent("month-selected", {
            detail: {
              month: this.selectedMonth,
              year: this.year,
              entries: monthPtoEntries,
              requestMode: this._requestMode,
            },
            bubbles: true,
          }),
        );
      });
    }

    return `
      <style>${ACCRUAL_CSS}</style>
      <div class="card">
        <h4>${this._requestMode ? "PTO Request - Select Month" : "Monthly Accrual Breakdown"}</h4>
        ${this.renderMonthGrid()}
        <slot name="calendar"></slot>
        <slot name="balance-summary"></slot>
      </div>
    `;
  }

  protected setupEventDelegation() {
    super.setupEventDelegation();
    if (this._ptoRequestEventsSetup) return;
    this._ptoRequestEventsSetup = true;

    // Listen for pto-request-submit from slotted calendar
    this.addEventListener("pto-request-submit", (e: Event) => {
      const ce = e as CustomEvent;
      console.log(
        "PtoAccrualCard received pto-request-submit event from calendar:",
        ce.detail,
      );
      e.stopPropagation();
      this.handlePtoRequestSubmit(ce.detail.requests);
    });
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    // Calendar button click
    if (target.matches(".calendar-button")) {
      e.stopPropagation();
      const month = parseInt(target.dataset.month || "", 10);
      console.log("PtoAccrualCard: calendar button clicked, month:", month);
      this.selectedMonth = Number.isFinite(month) ? month : null;
      console.log("PtoAccrualCard: set selectedMonth to:", this.selectedMonth);
      this.requestUpdate();
      return;
    }

    // Row click
    const row = target.closest(".accrual-row.data-row") as HTMLElement;
    if (row) {
      const month = parseInt(row.dataset.month || "", 10);
      if (Number.isFinite(month)) {
        console.log("PtoAccrualCard: row clicked, month:", month);
        this.selectedMonth = month;
        this.requestUpdate();
      }
    }
  }

  private async handlePtoRequestSubmit(requests: CalendarEntry[]) {
    console.log(
      "PtoAccrualCard.handlePtoRequestSubmit called with requests:",
      requests,
    );
    try {
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
    }
  }
}

customElements.define("pto-accrual-card", PtoAccrualCard);

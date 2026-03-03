import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { MONTH_NAMES } from "../../../shared/businessRules.js";
import { BaseComponent } from "../base-component.js";
import {
  parseDate,
  addDays,
  getCalendarStartDate,
  isInMonth,
  compareDates,
} from "../../../shared/dateUtils.js";
import { adoptPtoDayColors } from "../../css-extensions/index.js";
import { styles } from "./css.js";
import type { PtoCalendar } from "../pto-calendar/index.js";

export class PriorYearReview extends BaseComponent {
  private _data: PTOYearReviewResponse | null = null;

  get data(): PTOYearReviewResponse | null {
    return this._data;
  }

  set data(value: PTOYearReviewResponse | null) {
    this._data = value;
    this.requestUpdate();
    // Set data on calendars after render
    requestAnimationFrame(() => this.updateCalendars());
  }

  connectedCallback() {
    super.connectedCallback();
    adoptPtoDayColors(this.shadowRoot);
  }

  private renderMonth(monthData: PTOYearReviewResponse["months"][0]): string {
    const monthName = MONTH_NAMES[monthData.month - 1];
    const year = this.data!.year;

    return `
      <div class="month-card">
        <pto-calendar
          year="${year}"
          month="${monthData.month}"
          readonly="true"
          hide-legend="true"
          hide-header="false">
        </pto-calendar>
        <month-summary
          pto-hours="${monthData.summary.ptoHours}"
          sick-hours="${monthData.summary.sickHours}"
          bereavement-hours="${monthData.summary.bereavementHours}"
          jury-duty-hours="${monthData.summary.juryDutyHours}"
        ></month-summary>
      </div>
    `;
  }

  private updateCalendars(): void {
    if (!this._data) return;

    const calendars =
      this.shadowRoot.querySelectorAll<PtoCalendar>("pto-calendar");
    calendars.forEach((calendar, index) => {
      const monthData = this._data!.months[index];
      if (monthData) {
        // Convert simplified PTO entries to full PTOEntry format expected by PtoCalendar
        const ptoEntries = monthData.ptoEntries.map((entry, entryIndex) => ({
          id: entryIndex + 1, // Placeholder ID
          employeeId: 0, // Not available in this context
          date: entry.date,
          type: entry.type,
          hours: entry.hours,
          createdAt: entry.date, // Use date as placeholder
          approved_by: entry.approved_by,
          notes: null, // Not available in simplified format
        }));
        calendar.ptoEntries = ptoEntries;
      }
    });
  }

  protected render(): string {
    return `
      ${styles}
      <div class="container">
        ${
          this.data
            ? this.data.months.some((m) => m.ptoEntries.length > 0)
              ? `
                <div class="months-grid">
                  ${this.data.months.map((month) => this.renderMonth(month)).join("")}
                </div>
              `
              : `<div class="no-data">No data available</div>`
            : `<div class="no-data">No data available</div>`
        }
      </div>
    `;
  }
}

customElements.define("prior-year-review", PriorYearReview);

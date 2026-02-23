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

export class PriorYearReview extends BaseComponent {
  private _data: PTOYearReviewResponse | null = null;

  get data(): PTOYearReviewResponse | null {
    return this._data;
  }

  set data(value: PTOYearReviewResponse | null) {
    this._data = value;
    this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();
    adoptPtoDayColors(this.shadowRoot);
  }

  private renderMonth(monthData: PTOYearReviewResponse["months"][0]): string {
    const monthName = MONTH_NAMES[monthData.month - 1];
    const year = this.data!.year;

    // Create a calendar grid that always shows 6 weeks (42 days) for consistent height
    const startDateStr = getCalendarStartDate(year, monthData.month);
    const endDateStr = addDays(startDateStr, 41);

    const calendarDays: {
      dateStr: string;
      isCurrentMonth: boolean;
      entry?: { type: string; hours: number };
    }[] = [];

    let currentDateStr = startDateStr;
    while (compareDates(currentDateStr, endDateStr) <= 0) {
      const entriesForDate = monthData.ptoEntries.filter(
        (e) => e.date === currentDateStr,
      );
      const isCurrentMonth = isInMonth(currentDateStr, year, monthData.month);

      let entry: { type: string; hours: number } | undefined;
      if (entriesForDate.length > 0) {
        const totalHours = entriesForDate.reduce((sum, e) => sum + e.hours, 0);
        entry = { type: entriesForDate[0].type, hours: totalHours };
      }

      calendarDays.push({
        dateStr: currentDateStr,
        isCurrentMonth,
        entry,
      });
      currentDateStr = addDays(currentDateStr, 1);
    }

    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

    return `
      <div class="month-card">
        <div class="month-header">${monthName} ${year}</div>
        <div class="month-calendar">
          <div class="calendar-header">
            ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
          </div>
          <div class="calendar-grid">
            ${calendarDays
              .map(({ dateStr, isCurrentMonth, entry }) => {
                const dayClass = entry
                  ? `day type-${entry.type.replace(/\s+/g, "-")}`
                  : "day";
                const emptyClass = isCurrentMonth ? "" : "empty";
                const hoursDisplay = entry ? entry.hours.toFixed(0) : "";
                const dayNumber = parseDate(dateStr).day;
                return `
                  <div class="${dayClass} ${emptyClass}">
                    <div class="date">${dayNumber}</div>
                    ${hoursDisplay ? `<div class="hours">${hoursDisplay}</div>` : ""}
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
        <month-summary
          pto-hours="${monthData.summary.ptoHours}"
          sick-hours="${monthData.summary.sickHours}"
          bereavement-hours="${monthData.summary.bereavementHours}"
          jury-duty-hours="${monthData.summary.juryDutyHours}"
        ></month-summary>
      </div>
    `;
  }

  private renderLegend(): string {
    return `
      <div class="legend">
        <div class="legend-item"><span class="legend-swatch type-PTO"></span> PTO</div>
        <div class="legend-item"><span class="legend-swatch type-Sick"></span> Sick</div>
        <div class="legend-item"><span class="legend-swatch type-Bereavement"></span> Bereavement</div>
        <div class="legend-item"><span class="legend-swatch type-Jury-Duty"></span> Jury Duty</div>
      </div>
    `;
  }

  protected render(): string {
    return `
      ${styles}
      <div class="container">
        ${
          this.data
            ? this.data.months.some((m) => m.ptoEntries.length > 0)
              ? `
                ${this.renderLegend()}
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

import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { BaseComponent } from "../base-component.js";
import {
  parseDate,
  addDays,
  getCalendarStartDate,
  isInMonth,
  compareDates,
  getCurrentYear,
} from "../../../shared/dateUtils.js";
import { validateWeekday } from "../../../shared/businessRules.js";
import { ConfirmationDialog } from "../confirmation-dialog/index.js";

const monthNames = [
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

const PTO_TYPE_COLORS: Record<string, string> = {
  PTO: "var(--color-pto-vacation)",
  Sick: "var(--color-pto-sick)",
  Bereavement: "var(--color-pto-bereavement)",
  "Jury Duty": "var(--color-pto-jury-duty)",
  "Work Day": "var(--color-surface)",
};

export class CurrentYearPtoScheduler extends BaseComponent {
  private _data: PTOYearReviewResponse | null = null;
  private selectedDates: Set<string> = new Set(); // For new PTO selections

  get data(): PTOYearReviewResponse | null {
    return this._data;
  }

  set data(value: PTOYearReviewResponse | null) {
    this._data = value;
    this.requestUpdate();
  }

  private renderMonth(monthData: PTOYearReviewResponse["months"][0]): string {
    const monthName = monthNames[monthData.month - 1];
    const year = this.data!.year;

    // Create a calendar grid that always shows 6 weeks (42 days) for consistent height
    const startDateStr = getCalendarStartDate(year, monthData.month);
    const endDateStr = addDays(startDateStr, 41); // 6 weeks * 7 days - 1 = 41 days to add for 42 total days

    const calendarDays: {
      dateStr: string;
      isCurrentMonth: boolean;
      entry?: { type: string; hours: number };
      isSelected: boolean;
    }[] = [];

    let currentDateStr = startDateStr;
    while (compareDates(currentDateStr, endDateStr) <= 0) {
      const entriesForDate = monthData.ptoEntries.filter(
        (e) => e.date === currentDateStr,
      );
      const isCurrentMonth = isInMonth(currentDateStr, year, monthData.month);
      const isSelected = this.selectedDates.has(currentDateStr);

      let entry: { type: string; hours: number } | undefined;
      if (entriesForDate.length > 0) {
        // For simplicity, show the first entry or combine if multiple
        const totalHours = entriesForDate.reduce((sum, e) => sum + e.hours, 0);
        entry = { type: entriesForDate[0].type, hours: totalHours };
      }

      calendarDays.push({
        dateStr: currentDateStr,
        isCurrentMonth,
        entry,
        isSelected,
      });
      currentDateStr = addDays(currentDateStr, 1);
    }

    const weekdays = ["S", "M", "T", "W", "T", "F", "S"]; // Short weekday names

    return `
            <div class="month-card">
                <div class="month-header">${monthName} ${year}</div>
                <div class="month-calendar">
                    <div class="calendar-header">
                        ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
                    </div>
                    <div class="calendar-grid">
                        ${calendarDays
                          .map(
                            ({
                              dateStr,
                              isCurrentMonth,
                              entry,
                              isSelected,
                            }) => {
                              const dayClass = entry
                                ? `day type-${entry.type.replace(/\s+/g, "-")} ${isSelected ? "selected" : ""}`
                                : `day ${isSelected ? "selected" : ""}`;
                              const emptyClass = isCurrentMonth ? "" : "empty";
                              const hoursDisplay = entry
                                ? entry.hours.toFixed(0)
                                : "";
                              const dataDate = isCurrentMonth
                                ? `data-date="${dateStr}"`
                                : "";
                              return `
                                <div class="${dayClass} ${emptyClass}" ${dataDate}>
                                    <div class="date">${parseDate(dateStr).day}</div>
                                    ${hoursDisplay ? `<div class="hours">${hoursDisplay}</div>` : ""}
                                </div>
                            `;
                            },
                          )
                          .join("")}
                    </div>
                </div>
                <div class="month-summary">
                    <div class="summary-item">
                        <span class="summary-label">PTO:</span>
                        <span class="summary-value ${monthData.summary.ptoHours > 0 ? "summary-pto" : ""}">${monthData.summary.ptoHours}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Sick:</span>
                        <span class="summary-value ${monthData.summary.sickHours > 0 ? "summary-sick" : ""}">${monthData.summary.sickHours}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Bereavement:</span>
                        <span class="summary-value ${monthData.summary.bereavementHours > 0 ? "summary-bereavement" : ""}">${monthData.summary.bereavementHours}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Jury Duty:</span>
                        <span class="summary-value ${monthData.summary.juryDutyHours > 0 ? "summary-jury-duty" : ""}">${monthData.summary.juryDutyHours}</span>
                    </div>
                </div>
            </div>
        `;
  }

  protected render(): string {
    return `
      <style>
        .container {
          padding: 16px;
        }

        .months-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          max-width: 1540px;
        }

        .month-card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-surface);
          overflow: hidden;
        }

        .month-header {
          font-weight: 600;
          padding: 12px;
          background: var(--color-surface-hover);
          border-bottom: 1px solid var(--color-border);
          text-align: center;
        }

        .month-calendar {
          padding: 8px;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 4px;
        }

        .weekday {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .day {
          position: relative;
          aspect-ratio: 1;
          border-radius: 4px;
          background: var(--color-surface);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          min-height: 24px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .day:hover {
          background: var(--color-surface-hover);
        }

        .day.empty {
          opacity: 0;
          border: none;
          cursor: default;
        }

        .day .date {
          font-weight: 600;
          color: var(--color-text);
        }

        .day .hours {
          position: absolute;
          bottom: 1px;
          right: 2px;
          font-size: 8px;
          color: var(--color-text-secondary);
          font-weight: 600;
        }

        .type-PTO { background: ${PTO_TYPE_COLORS.PTO}; }
        .type-Sick { background: ${PTO_TYPE_COLORS.Sick}; }
        .type-Bereavement { background: ${PTO_TYPE_COLORS.Bereavement}; }
        .type-Jury-Duty { background: ${PTO_TYPE_COLORS["Jury Duty"]}; }

        /* Make text white on colored backgrounds for better contrast */
        .type-PTO .date,
        .type-PTO .hours,
        .type-Sick .date,
        .type-Sick .hours,
        .type-Bereavement .date,
        .type-Bereavement .hours,
        .type-Jury-Duty .date,
        .type-Jury-Duty .hours {
          color: white;
        }

        .day.selected {
          background: var(--color-primary) !important;
          color: white;
        }

        .day.selected .date,
        .day.selected .hours {
          color: white;
        }

        .month-summary {
          display: flex;
          justify-content: space-around;
          padding: 8px;
          background: var(--color-surface-hover);
          border-top: 1px solid var(--color-border);
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .summary-item {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .summary-label {
          font-size: 10px;
          margin-bottom: 2px;
        }

        .summary-value {
          font-size: 12px;
          font-weight: 400;
        }

        /* Color consistency: summary values match calendar day colors */
        .summary-pto { color: ${PTO_TYPE_COLORS.PTO}; }
        .summary-sick { color: ${PTO_TYPE_COLORS.Sick}; }
        .summary-bereavement { color: ${PTO_TYPE_COLORS.Bereavement}; }
        .summary-jury-duty { color: ${PTO_TYPE_COLORS["Jury Duty"]}; }

        /* Visual hierarchy: larger font for non-zero values */
        .summary-pto,
        .summary-sick,
        .summary-bereavement,
        .summary-jury-duty {
          font-size: 14px;
          font-weight: 600;
        }

        .submit-section {
          text-align: center;
          padding: 16px;
          border-top: 1px solid var(--color-border);
          margin-top: 16px;
        }

        .submit-button {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        .submit-button:hover {
          background: var(--color-primary-hover);
        }

        .no-data {
          text-align: center;
          padding: 32px;
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .months-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="container">
        ${
          this.data
            ? this.data.months.some((m) => m.ptoEntries.length > 0)
              ? `
                <div class="months-grid">
                    ${this.data.months.map((month) => this.renderMonth(month)).join("")}
                </div>
            `
              : `
                <div class="no-data">No data available</div>
            `
            : `
        <div class="no-data">No data available</div>
    `
        }
        <div class="submit-section">
          <button class="submit-button">Submit PTO Request</button>
        </div>
      </div>
    `;
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const dayElement = target.closest(".day[data-date]") as HTMLElement;
    if (dayElement && dayElement.dataset.date) {
      const dateStr = dayElement.dataset.date;
      // Validate weekday
      const weekdayError = validateWeekday(dateStr);
      if (weekdayError) {
        // TODO: Show error message
        console.error("Invalid date:", weekdayError.messageKey);
        return;
      }
      if (this.selectedDates.has(dateStr)) {
        this.selectedDates.delete(dateStr);
      } else {
        this.selectedDates.add(dateStr);
      }
      this.requestUpdate();
    }

    // Handle submit button
    if (target.matches(".submit-button")) {
      this.handleSubmit();
    }
  }

  private handleSubmit(): void {
    if (this.selectedDates.size === 0) {
      // TODO: Show error
      console.error("No dates selected");
      return;
    }

    // Create confirmation dialog
    const dialog = new ConfirmationDialog();
    dialog.message = `Submit PTO request for ${this.selectedDates.size} date(s)?`;
    dialog.confirmText = "Submit";
    dialog.cancelText = "Cancel";

    // Add to body temporarily
    document.body.appendChild(dialog);

    // Listen for confirmation
    dialog.addEventListener("confirm", () => {
      this.submitPTORequests();
      document.body.removeChild(dialog);
    });

    dialog.addEventListener("cancel", () => {
      document.body.removeChild(dialog);
    });
  }

  private submitPTORequests(): void {
    // Create PTO requests for each selected date
    const requests = Array.from(this.selectedDates).map((dateStr) => ({
      date: dateStr,
      type: "PTO" as const,
      hours: 8, // Assume 8 hours per day
    }));

    // Dispatch event for parent to handle API
    this.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests },
      }),
    );

    // Clear selections after submit
    this.selectedDates.clear();
    this.requestUpdate();
  }
}

customElements.define("current-year-pto-scheduler", CurrentYearPtoScheduler);

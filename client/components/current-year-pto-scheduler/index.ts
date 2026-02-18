import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { BaseComponent } from "../base-component.js";
import { ConfirmationDialog } from "../confirmation-dialog/index.js";
import { styles } from "./css.js";

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

export class CurrentYearPtoScheduler extends BaseComponent {
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
    this.updateCalendars();
  }

  protected update() {
    super.update();
    this.updateCalendars();
  }

  private updateCalendars() {
    if (!this._data) return;

    const calendars = this.shadowRoot.querySelectorAll("pto-calendar");
    calendars.forEach((calendar, index) => {
      const monthData = this._data!.months[index];
      if (monthData) {
        const ptoCalendar = calendar as any; // Type assertion for PtoCalendar
        ptoCalendar.month = monthData.month;
        ptoCalendar.year = this._data!.year;
        ptoCalendar.readonly = false;
        ptoCalendar.ptoEntries = monthData.ptoEntries.map((entry) => ({
          id: 0,
          employeeId: 0,
          date: entry.date,
          type: entry.type,
          hours: entry.hours,
          createdAt: "",
          approved_by: null,
        }));
      }
    });
  }

  private renderMonth(monthData: PTOYearReviewResponse["months"][0]): string {
    const monthName = monthNames[monthData.month - 1];
    const year = this.data!.year;

    // Convert PTO entries to the format expected by pto-calendar
    const ptoEntries = monthData.ptoEntries.map((entry) => ({
      id: 0, // Placeholder, not used for display
      employeeId: 0, // Placeholder
      date: entry.date,
      type: entry.type,
      hours: entry.hours,
      createdAt: "", // Placeholder
      approved_by: null,
    }));

    return `
      <div class="month-card">
        <pto-calendar
          month="${monthData.month}"
          year="${year}"
          readonly="false"
        ></pto-calendar>
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
        ${styles}
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

    // Handle submit button
    if (target.matches(".submit-button")) {
      this.handleSubmit();
    }
  }

  private handleSubmit(): void {
    // Collect selected requests from all pto-calendar children
    const calendars = this.shadowRoot.querySelectorAll("pto-calendar");
    const allRequests: any[] = [];

    calendars.forEach((calendar) => {
      const ptoCalendar = calendar as any;
      const requests = ptoCalendar.getSelectedRequests
        ? ptoCalendar.getSelectedRequests()
        : [];
      allRequests.push(...requests);
    });

    if (allRequests.length === 0) {
      // TODO: Show error
      console.error("No dates selected");
      return;
    }

    // Create confirmation dialog
    const dialog = new ConfirmationDialog();
    dialog.message = `Submit PTO request for ${allRequests.length} date(s)?`;
    dialog.confirmText = "Submit";
    dialog.cancelText = "Cancel";

    // Add to body temporarily
    document.body.appendChild(dialog);

    // Listen for confirmation
    dialog.addEventListener("confirm", () => {
      this.submitPTORequests(allRequests);
      document.body.removeChild(dialog);
    });

    dialog.addEventListener("cancel", () => {
      document.body.removeChild(dialog);
    });
  }

  private submitPTORequests(requests: any[]): void {
    // Dispatch event for parent to handle API
    this.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests },
      }),
    );

    // Clear selections in all calendars
    const calendars = this.shadowRoot.querySelectorAll("pto-calendar");
    calendars.forEach((calendar) => {
      const ptoCalendar = calendar as any;
      if (ptoCalendar.clearSelection) {
        ptoCalendar.clearSelection();
      }
    });
  }
}

customElements.define("current-year-pto-scheduler", CurrentYearPtoScheduler);

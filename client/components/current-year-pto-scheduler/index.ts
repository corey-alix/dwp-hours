import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { BaseComponent } from "../base-component.js";
import { ConfirmationDialog } from "../confirmation-dialog/index.js";
import type { MonthSummary } from "../month-summary/index.js";
import { computeSelectionDeltas } from "../utils/compute-selection-deltas.js";
import { styles } from "./css.js";

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
    this.shadowRoot.addEventListener(
      "selection-changed",
      this.handleSelectionChanged.bind(this),
    );
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
          approved_by: entry.approved_by ?? null,
        }));
      }
    });
  }

  private renderMonth(monthData: PTOYearReviewResponse["months"][0]): string {
    const year = this.data!.year;

    return `
      <div class="month-card" data-month="${monthData.month}">
        <pto-calendar
          month="${monthData.month}"
          year="${year}"
          readonly="false"
          hide-legend="true"
        ></pto-calendar>
        <month-summary
          pto-hours="${monthData.summary.ptoHours}"
          sick-hours="${monthData.summary.sickHours}"
          bereavement-hours="${monthData.summary.bereavementHours}"
          jury-duty-hours="${monthData.summary.juryDutyHours}"
        ></month-summary>
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
          this.data && this.data.months
            ? `
                <div class="months-grid">
                    ${this.data.months.map((month) => this.renderMonth(month)).join("")}
                </div>
            `
            : `
        <div class="no-data">Loading...</div>
    `
        }
        <div class="submit-section">
          <button class="submit-button">Submit PTO Request</button>
        </div>
      </div>
    `;
  }

  private handleSelectionChanged(e: Event): void {
    const calendar = e.target as any;
    if (!calendar || !this._data) return;

    const month = calendar.month;
    const monthCard = this.shadowRoot.querySelector(
      `.month-card[data-month="${month}"]`,
    );
    if (!monthCard) return;

    const monthData = this._data.months.find(
      (m: PTOYearReviewResponse["months"][0]) => m.month === month,
    );
    if (!monthData) return;

    const selectedRequests = calendar.getSelectedRequests
      ? calendar.getSelectedRequests()
      : [];

    const deltas = computeSelectionDeltas(
      selectedRequests,
      monthData.ptoEntries,
    );

    // Update the month-summary component's deltas property
    const summaryEl = monthCard.querySelector(
      "month-summary",
    ) as MonthSummary | null;
    if (summaryEl) {
      summaryEl.deltas = deltas;
    }
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

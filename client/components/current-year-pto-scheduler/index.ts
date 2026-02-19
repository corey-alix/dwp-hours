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
      approved_by: entry.approved_by ?? null,
    }));

    return `
      <div class="month-card" data-month="${monthData.month}">
        <pto-calendar
          month="${monthData.month}"
          year="${year}"
          readonly="false"
          hide-legend="true"
        ></pto-calendar>
        <div class="month-summary">
          <div class="summary-item">
            <span class="summary-label">PTO:</span>
            <span class="summary-value ${monthData.summary.ptoHours > 0 ? "summary-pto" : ""}" data-summary-type="pto">${monthData.summary.ptoHours}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Sick:</span>
            <span class="summary-value ${monthData.summary.sickHours > 0 ? "summary-sick" : ""}" data-summary-type="sick">${monthData.summary.sickHours}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Bereavement:</span>
            <span class="summary-value ${monthData.summary.bereavementHours > 0 ? "summary-bereavement" : ""}" data-summary-type="bereavement">${monthData.summary.bereavementHours}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Jury Duty:</span>
            <span class="summary-value ${monthData.summary.juryDutyHours > 0 ? "summary-jury-duty" : ""}" data-summary-type="jury-duty">${monthData.summary.juryDutyHours}</span>
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
          this.data && this.data.months
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

    // Compute pending delta per type
    const deltas: Record<string, number> = {};
    for (const request of selectedRequests) {
      const existingEntry = monthData.ptoEntries.find(
        (entry: PTOYearReviewResponse["months"][0]["ptoEntries"][0]) =>
          entry.date === request.date,
      );
      const existingHours = existingEntry ? existingEntry.hours : 0;
      const delta = request.hours - existingHours;
      if (delta !== 0) {
        deltas[request.type] = (deltas[request.type] || 0) + delta;
      }
    }

    // Map CSS type names to data model keys and PTO type names
    const typeConfig: {
      cssType: string;
      cssClass: string;
      existingHours: number;
      typeName: string;
    }[] = [
      {
        cssType: "pto",
        cssClass: "summary-pto",
        existingHours: monthData.summary.ptoHours,
        typeName: "PTO",
      },
      {
        cssType: "sick",
        cssClass: "summary-sick",
        existingHours: monthData.summary.sickHours,
        typeName: "Sick",
      },
      {
        cssType: "bereavement",
        cssClass: "summary-bereavement",
        existingHours: monthData.summary.bereavementHours,
        typeName: "Bereavement",
      },
      {
        cssType: "jury-duty",
        cssClass: "summary-jury-duty",
        existingHours: monthData.summary.juryDutyHours,
        typeName: "Jury Duty",
      },
    ];

    for (const { cssType, cssClass, existingHours, typeName } of typeConfig) {
      const span = monthCard.querySelector(
        `[data-summary-type="${cssType}"]`,
      ) as HTMLElement;
      if (!span) continue;

      const delta = deltas[typeName] || 0;

      if (delta !== 0) {
        const sign = delta > 0 ? "+" : "";
        span.innerHTML = `${existingHours}<span class="summary-pending">${sign}${delta}</span>`;
        span.classList.add(cssClass);
      } else {
        span.textContent = `${existingHours}`;
        if (existingHours <= 0) {
          span.classList.remove(cssClass);
        }
      }
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

import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PtoEntryForm } from "../../components/pto-entry-form/index.js";
import type { MonthSummary } from "../../components/month-summary/index.js";
import type * as ApiTypes from "../../../shared/api-models.js";
import { computeSelectionDeltas } from "../../components/utils/compute-selection-deltas.js";
import { isWeekend, addDays } from "../../../shared/dateUtils.js";
import type { CalendarEntry } from "../../components/pto-calendar/index.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { adoptToolbar } from "../../css-extensions/index.js";
import { styles } from "./css.js";

interface LoaderData {
  status: ApiTypes.PTOStatusResponse;
  entries: ApiTypes.PTOEntry[];
}

/**
 * Submit Time Off page.
 * Wraps `<pto-entry-form>` and `<month-summary>` with submit/cancel actions.
 * Receives PTO status + entries from the route loader.
 */
export class SubmitTimeOffPage extends BaseComponent implements PageComponent {
  private api = new APIClient();
  private _loaderData: LoaderData | null = null;

  connectedCallback() {
    super.connectedCallback();
    adoptToolbar(this.shadowRoot);
  }

  async onRouteEnter(
    _params: Record<string, string>,
    search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._loaderData = (loaderData as LoaderData) ?? null;
    this.requestUpdate();

    // Wait a tick for the DOM to initialise
    await new Promise((r) => setTimeout(r, 0));

    const form = this.getPtoForm();
    if (!form) return;

    // Inject PTO data into the calendar
    if (this._loaderData) {
      form.setPtoData(this._loaderData.entries);
      form.setAttribute(
        "available-pto-balance",
        this._loaderData.status.availablePTO.toString(),
      );
      this.updateBalanceSummary(this._loaderData.status);
    }

    // Handle query-param navigation: ?month=3&year=2026
    const month = search.get("month");
    const year = search.get("year");
    if (month && year) {
      form.navigateToMonth(parseInt(month, 10), parseInt(year, 10));
    }
  }

  onRouteLeave(): boolean {
    return true;
  }

  protected render(): string {
    return `
      ${styles}
      <month-summary id="form-balance-summary" interactive active-type="PTO"></month-summary>
      <pto-entry-form id="pto-entry-form"></pto-entry-form>
      <div class="toolbar">
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button type="button" class="btn btn-primary" data-action="submit">Submit</button>
      </div>
    `;
  }

  private _customEventsSetup = false;

  protected setupEventDelegation(): void {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;

    this.shadowRoot.addEventListener("pto-submit", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handlePtoRequestSubmit(e);
    }) as EventListener);

    this.shadowRoot.addEventListener("pto-data-request", ((e: Event) => {
      e.stopPropagation();
      this.handlePtoDataRequest();
    }) as EventListener);

    this.shadowRoot.addEventListener("pto-validation-error", ((
      e: CustomEvent,
    ) => {
      e.stopPropagation();
      const errors: string[] = e.detail?.errors ?? [];
      notifications.error(errors.join("\n"));
    }) as EventListener);

    this.shadowRoot.addEventListener("selection-changed", ((e: Event) => {
      e.stopPropagation();
      this.handleSelectionChanged();
    }) as EventListener);

    this.shadowRoot.addEventListener("pto-type-changed", ((e: CustomEvent) => {
      e.stopPropagation();
      const type = e.detail?.type;
      if (!type) return;

      // Sync balance summary
      const summary = this.getBalanceSummary();
      if (summary) summary.activeType = type;

      // Forward to pto-entry-form
      const form = this.getPtoForm();
      if (form) form.setActivePtoType(type);

      // Recalculate balance summary deltas after re-typing
      this.handleSelectionChanged();
    }) as EventListener);
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === "cancel") this.handleCancel();
    else if (action === "submit") this.handleSubmit();
  }

  // ── Helpers ──────────────────────────────────────────────────

  private getPtoForm(): PtoEntryForm | null {
    return this.shadowRoot.querySelector<PtoEntryForm>("#pto-entry-form");
  }

  private getBalanceSummary(): MonthSummary | null {
    return this.shadowRoot.querySelector<MonthSummary>("#form-balance-summary");
  }

  private updateBalanceSummary(status: ApiTypes.PTOStatusResponse): void {
    const summary = this.getBalanceSummary();
    if (!summary) return;
    summary.ptoHours = status.availablePTO;
    summary.sickHours = status.sickTime.remaining;
    summary.bereavementHours = status.bereavementTime.remaining;
    summary.juryDutyHours = status.juryDutyTime.remaining;
  }

  private handleCancel(): void {
    const form = this.getPtoForm();
    if (form) {
      form.reset();
      this.clearDeltas();
    }
  }

  private handleSubmit(): void {
    const form = this.getPtoForm();
    if (form) form.dispatchEvent(new Event("submit"));
  }

  private clearDeltas(): void {
    const summary = this.getBalanceSummary();
    if (summary) summary.deltas = {};
  }

  private handleSelectionChanged(): void {
    const form = this.getPtoForm();
    const summary = this.getBalanceSummary();
    if (!form || !summary) return;

    const selectedRequests = form.getSelectedRequests();
    const existingEntries = form.getPtoEntries();
    const deltas = computeSelectionDeltas(selectedRequests, existingEntries);

    const invertedDeltas: Record<string, number> = {};
    for (const [type, value] of Object.entries(deltas)) {
      invertedDeltas[type] = -value;
    }
    summary.deltas = invertedDeltas;
  }

  private async handlePtoDataRequest(): Promise<void> {
    const form = this.getPtoForm();
    if (!form) return;
    try {
      const entries = await this.api.getPTOEntries();
      form.setPtoData(entries);
    } catch (error) {
      console.error("Failed to fetch PTO entries for calendar:", error);
      form.setPtoData([]);
    }
  }

  private async handlePtoRequestSubmit(e: CustomEvent): Promise<void> {
    let requests: CalendarEntry[] = [];

    if (e.detail.requests) {
      requests = e.detail.requests;
    } else if (e.detail.ptoRequest) {
      const req = e.detail.ptoRequest;
      let currentDateStr = req.startDate;
      while (currentDateStr <= req.endDate) {
        if (!isWeekend(currentDateStr)) {
          requests.push({
            date: currentDateStr,
            type: req.ptoType === "Full PTO" ? "PTO" : req.ptoType,
            hours: req.hours,
          });
        }
        currentDateStr = addDays(currentDateStr, 1);
      }
      if (requests.length === 0) {
        notifications.error("No valid dates selected (must be weekdays).");
        return;
      }
    }

    try {
      await this.api.createPTOEntry({ requests });
      notifications.success("PTO request submitted successfully!");

      // Reload
      const form = this.getPtoForm();
      if (form) {
        form.reset();
        this.clearDeltas();
      }
      await this.handlePtoDataRequest();

      // Refresh balance
      const status = await this.api.getPTOStatus();
      this.updateBalanceSummary(status);
    } catch (error: any) {
      console.error("Error submitting PTO request:", error);
      if (error.responseData?.fieldErrors) {
        const messages = error.responseData.fieldErrors.map(
          (err: any) => `${err.field}: ${err.message}`,
        );
        notifications.error(`PTO request failed: ${messages.join("; ")}`);
      } else {
        notifications.error("Failed to submit PTO request. Please try again.");
      }
    }
  }
}

customElements.define("submit-time-off-page", SubmitTimeOffPage);

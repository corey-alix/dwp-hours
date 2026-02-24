import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PtoEntryForm } from "../../components/pto-entry-form/index.js";
import type { MonthSummary } from "../../components/month-summary/index.js";
import type * as ApiTypes from "../../../shared/api-models.js";
import { computeSelectionDeltas } from "../../components/utils/compute-selection-deltas.js";
import {
  isWeekend,
  addDays,
  getCurrentYear,
} from "../../../shared/dateUtils.js";
import type { CalendarEntry } from "../../components/pto-calendar/index.js";
import type { PtoCalendar } from "../../components/pto-calendar/index.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { adoptToolbar } from "../../css-extensions/index.js";
import { styles } from "./css.js";

/** Lock state for the currently displayed month */
type MonthLockState = "unlocked" | "employee-locked" | "admin-locked";

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
  private _lockState: MonthLockState = "unlocked";
  private _currentAckId: number | null = null;
  private _adminLockInfo: { lockedBy: string; lockedAt: string } | null = null;
  private _acknowledgements: ApiTypes.Acknowledgement[] = [];

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

    // Fetch acknowledgement state for the displayed month
    await this.refreshLockState();
  }

  onRouteLeave(): boolean {
    return true;
  }

  protected render(): string {
    return `
      ${styles}
      <div id="lock-banner" class="lock-banner hidden"></div>
      <div class="balance-heading">Available Balance</div>
      <month-summary id="form-balance-summary" interactive active-type="PTO"></month-summary>
      <pto-entry-form id="pto-entry-form"></pto-entry-form>
      <div class="toolbar">
        <button type="button" class="btn btn-lock" data-action="toggle-lock">🔓 Lock Month</button>
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

    this.shadowRoot.addEventListener("month-changed", (() => {
      this.refreshLockState();
    }) as EventListener);
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === "cancel") this.handleCancel();
    else if (action === "submit") this.handleSubmit();
    else if (action === "toggle-lock") this.handleToggleLock();
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
      if (error.responseData?.error === "month_locked") {
        notifications.error(error.responseData.message);
      } else if (error.responseData?.fieldErrors) {
        const messages = error.responseData.fieldErrors.map(
          (err: any) => `${err.field}: ${err.message}`,
        );
        notifications.error(`PTO request failed: ${messages.join("; ")}`);
      } else {
        notifications.error("Failed to submit PTO request. Please try again.");
      }
    }
  }

  // ── Lock / Unlock ────────────────────────────────────────────

  /**
   * Returns the YYYY-MM string for the month the calendar is currently showing.
   */
  private getDisplayedMonth(): string | null {
    const form = this.getPtoForm();
    if (!form) return null;
    const cal = form.shadowRoot?.querySelector("pto-calendar");
    if (!cal) return null;
    const m = cal.getAttribute("month");
    const y = cal.getAttribute("year");
    if (!m || !y) return null;
    return `${y}-${m.padStart(2, "0")}`;
  }

  /**
   * Fetch acknowledgements + admin lock state for the displayed month
   * and apply the corresponding UI state.
   */
  private async refreshLockState(): Promise<void> {
    const month = this.getDisplayedMonth();
    if (!month) return;

    try {
      const { acknowledgements } = await this.api.getAcknowledgements();
      this._acknowledgements = acknowledgements;

      const employeeAck = acknowledgements.find(
        (a: ApiTypes.Acknowledgement) => a.month === month,
      );

      if (employeeAck) {
        this._currentAckId = employeeAck.id;
        // Check admin lock
        const lockInfo = await this.checkAdminLock(month);
        if (lockInfo) {
          this._lockState = "admin-locked";
          this._adminLockInfo = lockInfo;
        } else {
          this._lockState = "employee-locked";
          this._adminLockInfo = null;
        }
      } else {
        this._lockState = "unlocked";
        this._currentAckId = null;
        this._adminLockInfo = null;
      }
    } catch {
      this._lockState = "unlocked";
      this._currentAckId = null;
      this._adminLockInfo = null;
    }

    this.applyLockStateUI();
  }

  /**
   * Try to determine if the admin has locked this month.
   * We attempt a lightweight check: if PTO submission would return
   * month_locked, we know the admin has locked it. We leverage
   * the monthly-summary endpoint which is available to employees.
   * For now, we try to detect via the existing acknowledgements data flow.
   */
  private async checkAdminLock(
    _month: string,
  ): Promise<{ lockedBy: string; lockedAt: string } | null> {
    // If the month was previously admin-locked and nothing changed, keep it.
    // The server enforces admin locks; we probe by checking if the month
    // is editable. A dedicated endpoint could be added later.
    // For now, return null — admin lock state is detected reactively
    // when the employee attempts to unlock or submit.
    return null;
  }

  /**
   * Apply visual state based on current _lockState.
   * In multi-calendar mode, applies per-card locking based on acknowledgements
   * so only months the employee actually locked are dimmed/disabled.
   */
  private applyLockStateUI(): void {
    const lockBtn = this.shadowRoot.querySelector<HTMLButtonElement>(
      "[data-action='toggle-lock']",
    );
    const submitBtn = this.shadowRoot.querySelector<HTMLButtonElement>(
      "[data-action='submit']",
    );
    const cancelBtn = this.shadowRoot.querySelector<HTMLButtonElement>(
      "[data-action='cancel']",
    );
    const banner = this.shadowRoot.querySelector<HTMLElement>("#lock-banner");
    const form = this.getPtoForm();

    // ── Multi-calendar mode: per-card locking ──
    if (form?.isMultiCalendar) {
      // Build a set of locked month keys ("YYYY-MM") from acknowledgements
      const lockedMonths = new Set(this._acknowledgements.map((a) => a.month));

      const year = getCurrentYear();
      const monthCards = Array.from(
        form.shadowRoot?.querySelectorAll(".month-card") ?? [],
      ) as HTMLElement[];

      for (const card of monthCards) {
        const m = card.dataset.month;
        if (!m) continue;
        const monthKey = `${year}-${m.padStart(2, "0")}`;
        const isLocked = lockedMonths.has(monthKey);

        card.classList.toggle("locked", isLocked);
        const cal = card.querySelector("pto-calendar") as PtoCalendar | null;
        if (cal) cal.setAttribute("readonly", isLocked ? "true" : "false");
      }

      // Don't apply global form-level lock in multi-calendar mode
      form.classList.remove("locked");

      // Toolbar reflects the current/displayed month state
      // Use the current _lockState which is based on getDisplayedMonth()
      this.applyToolbarState(lockBtn, submitBtn, cancelBtn, banner);
      return;
    }

    // ── Single-calendar mode: global lock ──
    const cal = form?.shadowRoot?.querySelector<PtoCalendar>("pto-calendar");
    this.applyToolbarState(lockBtn, submitBtn, cancelBtn, banner);

    switch (this._lockState) {
      case "unlocked":
        if (form) form.classList.remove("locked");
        if (cal) cal.setAttribute("readonly", "false");
        break;

      case "employee-locked":
        if (form) form.classList.add("locked");
        if (cal) cal.setAttribute("readonly", "true");
        break;

      case "admin-locked":
        if (form) form.classList.add("locked");
        if (cal) cal.setAttribute("readonly", "true");
        break;
    }
  }

  /**
   * Apply toolbar button and banner state based on current _lockState.
   */
  private applyToolbarState(
    lockBtn: HTMLButtonElement | null,
    submitBtn: HTMLButtonElement | null,
    cancelBtn: HTMLButtonElement | null,
    banner: HTMLElement | null,
  ): void {
    switch (this._lockState) {
      case "unlocked":
        if (lockBtn) {
          lockBtn.textContent = "🔓 Lock Month";
          lockBtn.classList.remove("btn-unlock", "hidden");
          lockBtn.classList.add("btn-lock");
        }
        if (submitBtn) submitBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
        if (banner) {
          banner.textContent = "";
          banner.classList.add("hidden");
        }
        break;

      case "employee-locked":
        if (lockBtn) {
          lockBtn.textContent = "🔒 Unlock Month";
          lockBtn.classList.remove("btn-lock", "hidden");
          lockBtn.classList.add("btn-unlock");
        }
        if (submitBtn) submitBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
        if (banner) {
          banner.textContent =
            "You have locked this month. Click Unlock to make changes.";
          banner.classList.remove("hidden");
          banner.classList.add("banner-employee");
          banner.classList.remove("banner-admin");
        }
        break;

      case "admin-locked": {
        if (lockBtn) lockBtn.classList.add("hidden");
        if (submitBtn) submitBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
        const info = this._adminLockInfo;
        if (banner) {
          banner.textContent = info
            ? `This month was locked by ${info.lockedBy} on ${info.lockedAt} and is no longer editable.`
            : "This month has been locked by the administrator and is no longer editable.";
          banner.classList.remove("hidden");
          banner.classList.add("banner-admin");
          banner.classList.remove("banner-employee");
        }
        break;
      }
    }
  }

  /**
   * Toggle lock/unlock for the displayed month.
   */
  private async handleToggleLock(): Promise<void> {
    const month = this.getDisplayedMonth();
    if (!month) return;

    if (this._lockState === "unlocked") {
      // Lock the month
      try {
        await this.api.submitAcknowledgement(month);
        notifications.success("Month locked successfully.");
        await this.refreshLockState();
      } catch (error: any) {
        if (error.responseData?.error === "month_locked") {
          // Admin already locked — refresh state
          notifications.error(error.responseData.message);
          await this.refreshLockState();
        } else {
          notifications.error(
            error.responseData?.error ??
              "Failed to lock month. Please try again.",
          );
        }
      }
    } else if (this._lockState === "employee-locked" && this._currentAckId) {
      // Unlock the month
      try {
        await this.api.deleteAcknowledgement(this._currentAckId);
        notifications.success("Month unlocked successfully.");
        await this.refreshLockState();
      } catch (error: any) {
        if (error.responseData?.error === "month.admin_locked_cannot_unlock") {
          this._lockState = "admin-locked";
          this.applyLockStateUI();
          notifications.error(error.responseData.message);
        } else {
          notifications.error(
            error.responseData?.error ??
              "Failed to unlock month. Please try again.",
          );
        }
      }
    }
  }
}

customElements.define("submit-time-off-page", SubmitTimeOffPage);

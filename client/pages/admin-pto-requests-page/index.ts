import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { today, getLastDayOfMonth } from "../../../shared/dateUtils.js";
import {
  BUSINESS_RULES_CONSTANTS,
  type PTOType,
} from "../../../shared/businessRules.js";
import type { MonthSummary } from "../../components/month-summary/index.js";
import type { PtoRequestQueue } from "../../components/pto-request-queue/index.js";
import { styles } from "./css.js";

interface PTORequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

/**
 * Admin PTO Requests page.
 * Wraps `<pto-request-queue>`.
 * Handles approve/reject events from the queue component.
 */
export class AdminPtoRequestsPage
  extends BaseComponent
  implements PageComponent
{
  private api = new APIClient();
  private _requests: PTORequest[] = [];
  private _ptoEntries: Array<{
    employee_id: number;
    type: PTOType;
    hours: number;
    date: string;
    approved_by?: number | null;
  }> = [];
  private _authService: AuthService | null = null;

  set authService(svc: AuthService) {
    this._authService = svc;
  }

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._requests = (loaderData as { requests: PTORequest[] })?.requests ?? [];

    // Fetch PTO entries for balance calculations
    try {
      const ptoEntries = await this.api.getAdminPTOEntries();
      const currentYear = today().slice(0, 4);
      this._ptoEntries = (ptoEntries || [])
        .filter((p: any) => p.date?.startsWith(currentYear))
        .map((p: any) => ({
          employee_id: p.employeeId,
          type: p.type,
          hours: p.hours,
          date: p.date,
          approved_by: p.approved_by ?? null,
        }));
    } catch (error) {
      console.error(
        "Failed to fetch PTO entries for balance summaries:",
        error,
      );
      this._ptoEntries = [];
    }

    this.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));
    this.populateQueue();
    this.hydrateBalanceSummaries();
  }

  protected render(): string {
    const pendingRequests = this._requests.filter(
      (r) => r.status === "pending",
    );
    // Deduplicate by employeeId for per-employee-group balance slots
    const uniqueEmployees = new Map<number, PTORequest>();
    for (const req of pendingRequests) {
      if (!uniqueEmployees.has(req.employeeId)) {
        uniqueEmployees.set(req.employeeId, req);
      }
    }

    return `
      ${styles}
      <h2 class="page-heading">PTO Request Queue</h2>
      <pto-request-queue>
        ${Array.from(uniqueEmployees.values())
          .map(
            (req) =>
              `<div slot="balance-${req.employeeId}" class="balance-slot"><div class="balance-heading">Available Balance</div><month-summary data-employee-id="${req.employeeId}"></month-summary></div>`,
          )
          .join("")}
      </pto-request-queue>
    `;
  }

  private populateQueue(): void {
    const queue = this.shadowRoot.querySelector(
      "pto-request-queue",
    ) as PtoRequestQueue | null;
    if (queue) {
      queue.requests = this._requests;
    }
  }

  /**
   * Set balance data on each <month-summary> element rendered in light DOM.
   * Computes used hours per PTO category from fetched PTO entries, then sets
   * hours attributes (used) and `balances` property (annual limits) so
   * month-summary displays "available−used".
   * Also computes which employees have negative balances and notifies the queue.
   */
  private hydrateBalanceSummaries(): void {
    if (this._ptoEntries.length === 0 && this._requests.length === 0) return;

    const summaries = this.shadowRoot.querySelectorAll(
      "month-summary",
    ) as NodeListOf<MonthSummary>;

    const limits: Record<string, number> = {
      PTO: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.PTO,
      Sick: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK,
      Bereavement: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT,
      "Jury Duty": BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY,
    };

    const negativeBalanceIds = new Set<number>();

    summaries.forEach((el) => {
      const empIdAttr = el.getAttribute("data-employee-id");
      if (!empIdAttr) return;
      const empId = parseInt(empIdAttr, 10);

      const ptoUsed = this.getUsedHours(empId, "PTO");
      const sickUsed = this.getUsedHours(empId, "Sick");
      const bereavUsed = this.getUsedHours(empId, "Bereavement");
      const juryUsed = this.getUsedHours(empId, "Jury Duty");

      el.ptoHours = ptoUsed;
      el.sickHours = sickUsed;
      el.bereavementHours = bereavUsed;
      el.juryDutyHours = juryUsed;
      el.balances = limits;

      // Check for any negative remaining balance
      if (
        limits["PTO"] - ptoUsed < 0 ||
        limits["Sick"] - sickUsed < 0 ||
        limits["Bereavement"] - bereavUsed < 0 ||
        limits["Jury Duty"] - juryUsed < 0
      ) {
        negativeBalanceIds.add(empId);
      }
    });

    // Notify queue about employees with negative balances
    const queue = this.shadowRoot.querySelector("pto-request-queue") as any;
    if (queue) {
      queue.negativeBalanceEmployees = negativeBalanceIds;
    }
  }

  /** Get used hours for an employee in a specific PTO category. */
  private getUsedHours(employeeId: number, category: string): number {
    return this._ptoEntries
      .filter((e) => e.employee_id === employeeId && e.type === category)
      .reduce((sum, e) => sum + e.hours, 0);
  }

  private _customEventsSetup = false;

  protected setupEventDelegation(): void {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;

    this.shadowRoot.addEventListener("request-approve", ((e: CustomEvent) => {
      e.stopPropagation();
      const ids: number[] = e.detail.requestIds ?? [e.detail.requestId];
      this.handleApproveAll(ids);
    }) as EventListener);

    this.shadowRoot.addEventListener("request-reject", ((e: CustomEvent) => {
      e.stopPropagation();
      const ids: number[] = e.detail.requestIds ?? [e.detail.requestId];
      this.handleRejectAll(ids);
    }) as EventListener);

    // Handle on-demand calendar data requests from the queue component
    this.shadowRoot.addEventListener("calendar-data-request", (evt: Event) => {
      const e = evt as CustomEvent;
      e.stopPropagation();
      (async () => {
        const { employeeId, month } = e.detail as {
          employeeId: number;
          month: string;
        };
        if (!employeeId || !month) return;
        try {
          const startDate = `${month}-01`;
          const [y, m] = month.split("-").map(Number);
          const endDate = getLastDayOfMonth(y, m);

          const ptoEntries = await this.api.get(
            `/admin/pto?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
          );

          const queue = this.shadowRoot?.querySelector(
            "pto-request-queue",
          ) as PtoRequestQueue | null;
          if (!queue) return;

          const normalized = (ptoEntries || []).map((p: any, idx: number) => ({
            id: p.id ?? idx + 1,
            employeeId: p.employeeId,
            date: p.date,
            type: p.type,
            hours: p.hours,
            createdAt: p.createdAt ?? "",
            approved_by: p.approved_by ?? null,
          }));
          queue.setCalendarEntries(employeeId, month, normalized);
        } catch (error: any) {
          console.error(
            `Failed to load calendar data for employee ${employeeId}, month ${month}:`,
            error,
          );
        }
      })().catch((err) => console.error(err));
    });
  }

  private async dismissQueueCard(requestId: number): Promise<void> {
    const queue = this.shadowRoot?.querySelector("pto-request-queue") as any;
    if (queue?.dismissCard) {
      await queue.dismissCard(requestId);
    }
  }

  /**
   * Approve all request IDs in an aggregated card.
   * Dismisses the card (keyed by the first ID), then sends approve
   * calls for every underlying request.
   */
  private async handleApproveAll(requestIds: number[]): Promise<void> {
    try {
      const adminUser = this._authService?.getUser();
      if (!adminUser) {
        notifications.error("Unable to approve: admin user not found.");
        return;
      }
      // Dismiss the card using the primary (first) request ID
      await this.dismissQueueCard(requestIds[0]);
      // Approve all underlying requests
      await Promise.all(
        requestIds.map((id) => this.api.approvePTOEntry(id, adminUser.id)),
      );
      const label =
        requestIds.length === 1
          ? "PTO request approved."
          : `${requestIds.length} PTO requests approved.`;
      notifications.success(label);
      await this.refreshQueue();
    } catch (error) {
      notifications.error(
        `Failed to approve request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Reject all request IDs in an aggregated card.
   */
  private async handleRejectAll(requestIds: number[]): Promise<void> {
    try {
      await this.dismissQueueCard(requestIds[0]);
      await Promise.all(requestIds.map((id) => this.api.rejectPTOEntry(id)));
      const label =
        requestIds.length === 1
          ? "PTO request rejected."
          : `${requestIds.length} PTO requests rejected.`;
      notifications.success(label);
      await this.refreshQueue();
    } catch (error) {
      notifications.error(
        `Failed to reject request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async refreshQueue(): Promise<void> {
    try {
      const [employees, entries] = await Promise.all([
        this.api.getEmployees(),
        this.api.getAdminPTOEntries(),
      ]);
      const employeeMap = new Map(
        (employees as { id: number; name: string }[]).map((e) => [
          e.id,
          e.name,
        ]),
      );
      this._requests = entries
        .filter((e) => e.approved_by === null || e.approved_by === undefined)
        .map((e) => ({
          id: e.id,
          employeeId: e.employeeId,
          employeeName: employeeMap.get(e.employeeId) ?? "Unknown",
          startDate: e.date,
          endDate: e.date,
          type: e.type,
          hours: e.hours,
          status: "pending" as const,
          createdAt: e.createdAt,
        }));

      // Update PTO entries for balance hydration
      const currentYear = today().slice(0, 4);
      this._ptoEntries = (entries || [])
        .filter((p: any) => p.date?.startsWith(currentYear))
        .map((p: any) => ({
          employee_id: p.employeeId,
          type: p.type,
          hours: p.hours,
          date: p.date,
          approved_by: p.approved_by ?? null,
        }));

      // Targeted refresh: push data to existing child components
      // without re-rendering the page's own shadow DOM.
      const queue = this.shadowRoot?.querySelector(
        "pto-request-queue",
      ) as PtoRequestQueue | null;
      if (queue) {
        // The queue's `requests` setter triggers its own requestUpdate()
        queue.requests = this._requests;

        // Re-fetch calendar data for any expanded calendars so approved
        // entries show updated status (e.g., green check marks)
        for (const [empId, month] of queue.expandedCalendars) {
          queue.dispatchEvent(
            new CustomEvent("calendar-data-request", {
              bubbles: true,
              composed: true,
              detail: { employeeId: empId, month },
            }),
          );
        }
      }

      this.hydrateBalanceSummaries();
    } catch (error) {
      notifications.error(
        `Failed to refresh queue: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

customElements.define("admin-pto-requests-page", AdminPtoRequestsPage);

import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { today } from "../../../shared/dateUtils.js";
import {
  BUSINESS_RULES_CONSTANTS,
  type PTOType,
} from "../../../shared/businessRules.js";
import type { MonthSummary } from "../../components/month-summary/index.js";
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
    return `
      ${styles}
      <p class="capitalize">Review and Acknowledge Daily PTO Requests</p>
      <pto-request-queue>
        ${pendingRequests
          .map(
            (req) =>
              `<month-summary slot="balance-${req.id}" data-employee-id="${req.employeeId}"></month-summary>`,
          )
          .join("")}
      </pto-request-queue>
    `;
  }

  private populateQueue(): void {
    const queue = this.shadowRoot.querySelector("pto-request-queue") as any;
    if (queue) {
      queue.requests = this._requests;
    }
  }

  /**
   * Set balance data on each <month-summary> element rendered in light DOM.
   * Computes used hours per PTO category from fetched PTO entries, then sets
   * hours attributes (used) and `balances` property (annual limits) so
   * month-summary displays "available−used".
   */
  private hydrateBalanceSummaries(): void {
    if (this._ptoEntries.length === 0 && this._requests.length === 0) return;

    const summaries = this.shadowRoot.querySelectorAll(
      "month-summary",
    ) as NodeListOf<MonthSummary>;

    const limits: Record<string, number> = {
      PTO: 80,
      Sick: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK,
      Bereavement: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.OTHER,
      "Jury Duty": BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.OTHER,
    };

    summaries.forEach((el) => {
      const empIdAttr = el.getAttribute("data-employee-id");
      if (!empIdAttr) return;
      const empId = parseInt(empIdAttr, 10);

      el.ptoHours = this.getUsedHours(empId, "PTO");
      el.sickHours = this.getUsedHours(empId, "Sick");
      el.bereavementHours = this.getUsedHours(empId, "Bereavement");
      el.juryDutyHours = this.getUsedHours(empId, "Jury Duty");
      el.balances = limits;
    });
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
      this.handleApprove(e.detail.requestId);
    }) as EventListener);

    this.shadowRoot.addEventListener("request-reject", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handleReject(e.detail.requestId);
    }) as EventListener);
  }

  private async dismissQueueCard(requestId: number): Promise<void> {
    const queue = this.shadowRoot?.querySelector("pto-request-queue") as any;
    if (queue?.dismissCard) {
      await queue.dismissCard(requestId);
    }
  }

  private async handleApprove(requestId: number): Promise<void> {
    try {
      const adminUser = this._authService?.getUser();
      if (!adminUser) {
        notifications.error("Unable to approve: admin user not found.");
        return;
      }
      await this.dismissQueueCard(requestId);
      await this.api.approvePTOEntry(requestId, adminUser.id);
      notifications.success("PTO request approved.");
      await this.refreshQueue();
    } catch (error) {
      notifications.error(
        `Failed to approve request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleReject(requestId: number): Promise<void> {
    try {
      await this.dismissQueueCard(requestId);
      await this.api.rejectPTOEntry(requestId);
      notifications.success("PTO request rejected.");
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
        }));

      this.requestUpdate();
      await new Promise((r) => setTimeout(r, 0));
      this.populateQueue();
      this.hydrateBalanceSummaries();
    } catch (error) {
      notifications.error(
        `Failed to refresh queue: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

customElements.define("admin-pto-requests-page", AdminPtoRequestsPage);

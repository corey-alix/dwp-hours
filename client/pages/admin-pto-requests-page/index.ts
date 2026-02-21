import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
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
    this.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));
    this.populateQueue();
  }

  protected render(): string {
    return `
      ${styles}
      <p class="capitalize">Review and Acknowledge Daily PTO Requests</p>
      <pto-request-queue></pto-request-queue>
    `;
  }

  private populateQueue(): void {
    const queue = this.shadowRoot.querySelector("pto-request-queue") as any;
    if (queue) {
      queue.requests = this._requests;
    }
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

  private async handleApprove(requestId: number): Promise<void> {
    try {
      const adminUser = this._authService?.getUser();
      if (!adminUser) {
        notifications.error("Unable to approve: admin user not found.");
        return;
      }
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
      this.requestUpdate();
      await new Promise((r) => setTimeout(r, 0));
      this.populateQueue();
    } catch (error) {
      notifications.error(
        `Failed to refresh queue: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

customElements.define("admin-pto-requests-page", AdminPtoRequestsPage);

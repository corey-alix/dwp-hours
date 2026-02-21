import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
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
 */
export class AdminPtoRequestsPage
  extends BaseComponent
  implements PageComponent
{
  private _requests: PTORequest[] = [];

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
      <h2>PTO Request Queue</h2>
      <pto-request-queue></pto-request-queue>
    `;
  }

  private populateQueue(): void {
    const queue = this.shadowRoot.querySelector("pto-request-queue") as any;
    if (queue) {
      queue.requests = this._requests;
    }
  }
}

customElements.define("admin-pto-requests-page", AdminPtoRequestsPage);

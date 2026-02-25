import {
  formatDateForDisplay,
  formatTimestampForDisplay,
} from "../../../shared/dateUtils.js";
import { BaseComponent } from "../base-component.js";
import { animateDismiss } from "../../css-extensions/index.js";
import {
  aggregatePTORequests,
  type AggregatedPTORequest,
  type PTORequest,
} from "../../shared/aggregate-pto-requests.js";
import { styles } from "./css.js";

export type { PTORequest };
export { type AggregatedPTORequest };

export class PtoRequestQueue extends BaseComponent {
  private _requests: PTORequest[] = [];
  /** Employee IDs that have at least one negative balance category. */
  private _negativeBalanceEmployeeIds = new Set<number>();
  /** Track buttons awaiting confirmation. Maps button element to reset timer. */
  private _pendingConfirmations = new Map<HTMLButtonElement, number>();

  get requests(): PTORequest[] {
    return this._requests;
  }

  set requests(value: PTORequest[]) {
    this._requests = value;
    this.requestUpdate();
  }

  /** Set the IDs of employees with negative balance (triggers confirm flow). */
  set negativeBalanceEmployees(ids: Set<number>) {
    this._negativeBalanceEmployeeIds = ids;
  }

  protected render(): string {
    const pendingRequests = this._requests.filter(
      (r) => r.status === "pending",
    );

    // Aggregate consecutive work-day requests per employee + type
    const aggregated = aggregatePTORequests(pendingRequests);

    // Group aggregated entries by employee
    const employeeGroups = new Map<
      number,
      { name: string; requests: AggregatedPTORequest[] }
    >();
    for (const req of aggregated) {
      let group = employeeGroups.get(req.employeeId);
      if (!group) {
        group = { name: req.employeeName, requests: [] };
        employeeGroups.set(req.employeeId, group);
      }
      group.requests.push(req);
    }

    // Count original pending requests for the stats display
    const totalPending = pendingRequests.length;

    return `
      ${styles}
      <div class="queue-container">
        <div class="queue-header">
          <h2 class="queue-title">PTO Request Queue</h2>
          <div class="queue-stats">
            <div class="stat-item">
              <span class="stat-value">${totalPending}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
        </div>

        <div class="queue-content">
          ${
            totalPending === 0
              ? '<div class="empty-state"><h3>No pending requests</h3><p>All PTO requests have been reviewed.</p></div>'
              : Array.from(employeeGroups.entries())
                  .map(
                    ([empId, group]) => `
                    <div class="employee-group" data-employee-id="${empId}">
                      <div class="employee-group-header">
                        <h3 class="employee-group-name">${group.name} — ${group.requests.reduce((sum, r) => sum + r.requestIds.length, 0)} pending request${group.requests.reduce((sum, r) => sum + r.requestIds.length, 0) !== 1 ? "s" : ""}</h3>
                        <slot name="balance-${empId}"></slot>
                      </div>
                      <div class="employee-group-cards">
                        ${group.requests.map((req) => this.renderRequestCard(req)).join("")}
                      </div>
                    </div>`,
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  }

  private renderRequestCard(request: AggregatedPTORequest): string {
    const startDate = formatDateForDisplay(request.startDate, {
      dateStyle: "short",
    });
    const endDate = formatDateForDisplay(request.endDate, {
      dateStyle: "short",
    });
    const dateDisplay =
      request.startDate === request.endDate
        ? startDate
        : `${startDate} → ${endDate}`;
    const createdDate = formatTimestampForDisplay(request.createdAt, {
      dateStyle: "short",
    });

    // Primary ID for card identification; all IDs stored in data attribute
    const primaryId = request.requestIds[0];
    const allIds = request.requestIds.join(",");

    return `
      <div class="request-card" data-request-id="${primaryId}" data-request-ids="${allIds}">
        <div class="request-header">
          <span class="request-type ${request.type.replace(" ", "-")}">${request.type}</span>
          <span class="status-badge pending">Pending</span>
        </div>

        <div class="request-details">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value employee-name">${request.employeeName}</span>
          </div>
  
          <div class="detail-item">
            <span class="detail-label">Date Range</span>
            <div class="request-dates">
              <span class="date-range">${dateDisplay}</span>
            </div>
          </div>
          <div class="detail-item">
            <span class="detail-label">Hours Requested</span>
            <span class="detail-value">${request.hours} hrs</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Submitted</span>
            <span class="detail-value">${createdDate}</span>
          </div>
        </div>

        <div class="request-actions">
          <button class="action-btn reject" data-action="reject" data-request-id="${primaryId}" data-request-ids="${allIds}">
            Reject
          </button>
          <button class="action-btn approve" data-action="approve" data-request-id="${primaryId}" data-request-ids="${allIds}">
            Approve
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Animate a card scaling down and fading out (dismiss effect).
   * Called by the parent page after approve/reject. Returns a promise
   * that resolves when the animation completes (or immediately under
   * reduced-motion).
   */
  async dismissCard(requestId: number): Promise<void> {
    const card = this.shadowRoot.querySelector(
      `.request-card[data-request-id="${requestId}"]`,
    ) as HTMLElement | null;

    if (card) {
      const handle = animateDismiss(card);
      await handle.promise;
    }
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("action-btn")) return;

    const btn = target as HTMLButtonElement;
    const action = btn.dataset.action;
    const requestIdsAttr = btn.dataset.requestIds;
    if (!action || !requestIdsAttr) return;

    const requestIds = requestIdsAttr.split(",").map((id) => parseInt(id, 10));
    const card = btn.closest(".request-card") as HTMLElement | null;
    const group = card?.closest(".employee-group") as HTMLElement | null;
    const empId = group ? parseInt(group.dataset.employeeId ?? "0", 10) : 0;

    // Check if this employee has a negative balance (unusual condition)
    const needsConfirm = this._negativeBalanceEmployeeIds.has(empId);

    if (needsConfirm && !btn.classList.contains("confirming")) {
      // First click: enter confirmation state
      const originalText = btn.textContent?.trim() ?? "";
      btn.classList.add("confirming");
      btn.textContent = `Confirm ${originalText}?`;

      // Auto-revert after 3 seconds
      const timer = window.setTimeout(() => {
        this.resetConfirmation(btn, originalText);
      }, 3000);
      this._pendingConfirmations.set(btn, timer);
      return;
    }

    // Either no confirm needed, or this is the second click (confirmed)
    this.clearConfirmation(btn);

    this.dispatchEvent(
      new CustomEvent(`request-${action}`, {
        detail: { requestId: requestIds[0], requestIds },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private resetConfirmation(
    btn: HTMLButtonElement,
    originalText: string,
  ): void {
    btn.classList.remove("confirming");
    btn.textContent = originalText;
    this._pendingConfirmations.delete(btn);
  }

  private clearConfirmation(btn: HTMLButtonElement): void {
    const timer = this._pendingConfirmations.get(btn);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._pendingConfirmations.delete(btn);
    }
    btn.classList.remove("confirming");
  }
}

customElements.define("pto-request-queue", PtoRequestQueue);

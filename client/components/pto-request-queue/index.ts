import {
  formatDateForDisplay,
  formatTimestampForDisplay,
} from "../../../shared/dateUtils.js";
import { BaseComponent } from "../base-component.js";
import { animateDismiss } from "../../css-extensions/index.js";
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

export class PtoRequestQueue extends BaseComponent {
  private _requests: PTORequest[] = [];

  get requests(): PTORequest[] {
    return this._requests;
  }

  set requests(value: PTORequest[]) {
    this._requests = value;
    this.requestUpdate();
  }

  protected render(): string {
    const pendingRequests = this._requests.filter(
      (r) => r.status === "pending",
    );

    return `
      ${styles}
      <div class="queue-container">
        <div class="queue-header">
          <h1 class="queue-title">PTO Request Queue</h1>
          <div class="queue-stats">
            <div class="stat-item">
              <span class="stat-value">${pendingRequests.length}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
        </div>

        <div class="queue-content">
          ${
            pendingRequests.length === 0
              ? '<div class="empty-state"><h3>No pending requests</h3><p>All PTO requests have been reviewed.</p></div>'
              : pendingRequests
                  .map((request) => this.renderRequestCard(request))
                  .join("")
          }
        </div>
      </div>
    `;
  }

  private renderRequestCard(request: PTORequest): string {
    const startDate = formatDateForDisplay(request.startDate, {
      dateStyle: "short",
    });
    const endDate = formatDateForDisplay(request.endDate, {
      dateStyle: "short",
    });
    const createdDate = formatTimestampForDisplay(request.createdAt, {
      dateStyle: "short",
    });

    return `
      <div class="request-card" data-request-id="${request.id}">
        <slot name="balance-${request.id}"></slot>

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
              <span class="date-range">${startDate} → ${endDate}</span>
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
          <button class="action-btn reject" data-action="reject" data-request-id="${request.id}">
            Reject
          </button>
          <button class="action-btn approve" data-action="approve" data-request-id="${request.id}">
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
    if (target.classList.contains("action-btn")) {
      const action = target.dataset.action;
      const requestId = target.dataset.requestId;

      if (action && requestId) {
        this.dispatchEvent(
          new CustomEvent(`request-${action}`, {
            detail: { requestId: parseInt(requestId) },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }
  }
}

customElements.define("pto-request-queue", PtoRequestQueue);

import { formatDateForDisplay } from "../../../shared/dateUtils.js";

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

export class PtoRequestQueue extends HTMLElement {
  private shadow: ShadowRoot;
  private _requests: PTORequest[] = [];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["requests"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && name === "requests") {
      try {
        this._requests = JSON.parse(newValue);
        this.render();
      } catch (e) {
        console.error("Invalid requests JSON:", e);
      }
    }
  }

  set requests(value: PTORequest[]) {
    this.setAttribute("requests", JSON.stringify(value));
  }

  get requests(): PTORequest[] {
    return this._requests;
  }

  private render() {
    const pendingRequests = this._requests.filter(
      (r) => r.status === "pending",
    );

    this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                }

                .queue-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .queue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-surface);
                }

                .queue-title {
                    font-size: var(--font-size-xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-text);
                    margin: 0;
                }

                .queue-stats {
                    display: flex;
                    gap: var(--space-lg);
                    align-items: center;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .stat-value {
                    font-size: var(--font-size-2xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-primary);
                }

                .stat-label {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .queue-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .request-card {
                    background: var(--color-surface);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 16px;
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--color-border);
                    transition: box-shadow 0.3s ease;
                }

                .request-card:hover {
                    box-shadow: var(--shadow-lg);
                }

                .request-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .employee-info {
                    display: flex;
                    flex-direction: column;
                }

                .employee-name {
                    font-size: var(--font-size-lg);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-text);
                    margin: 0;
                }

                .request-type {
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius-xl);
                    font-size: var(--font-size-xs);
                    font-weight: var(--font-weight-medium);
                    margin-top: var(--space-xs);
                    display: inline-block;
                }

                .request-type.Sick { background: var(--color-pto-sick); }
                .request-type.PTO { background: var(--color-pto-vacation); }
                .request-type.Bereavement { background: var(--color-pto-bereavement); }
                .request-type.Jury-Duty { background: var(--color-pto-jury-duty); }

                .request-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                }

                .detail-label {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: var(--space-xs);
                }

                .detail-value {
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-text);
                }

                .request-dates {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                }

                .date-range {
                    background: var(--color-surface);
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius);
                    font-size: var(--font-size-xs);
                    color: var(--color-text-secondary);
                }

                .request-actions {
                    display: flex;
                    gap: var(--space-md);
                    justify-content: flex-end;
                }

                .action-btn {
                    padding: var(--space-sm) var(--space-lg);
                    border: none;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    transition: all 0.3s ease;
                }

                .action-btn.approve {
                    background: var(--color-success);
                    color: var(--color-on-success);
                }

                .action-btn.approve:hover {
                    background: var(--color-success);
                    opacity: 0.8;
                }

                .action-btn.reject {
                    background: var(--color-error);
                    color: var(--color-on-error);
                }

                .action-btn.reject:hover {
                    background: var(--color-error);
                    opacity: 0.8;
                }

                .empty-state {
                    text-align: center;
                    padding: var(--space-2xl) * 1.5 var(--space-xl);
                    color: var(--color-text-muted);
                }

                .empty-state h3 {
                    margin: 0 0 var(--space-sm);
                    font-size: var(--font-size-xl);
                    color: var(--color-text);
                }

                .empty-state p {
                    margin: 0;
                    font-size: var(--font-size-base);
                }

                .status-badge {
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius-xl);
                    font-size: 11px;
                    font-weight: var(--font-weight-bold);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge.pending {
                    background: var(--color-warning-light);
                    color: var(--color-warning);
                }
            </style>

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
    const startDate = formatDateForDisplay(request.startDate);
    const endDate = formatDateForDisplay(request.endDate);
    const createdDate = formatDateForDisplay(request.createdAt);

    return `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="employee-info">
                        <h3 class="employee-name">${request.employeeName}</h3>
                        <span class="request-type ${request.type.replace(" ", "-")}">${request.type}</span>
                    </div>
                    <span class="status-badge pending">Pending</span>
                </div>

                <div class="request-details">
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

  private setupEventListeners() {
    // Event delegation for action buttons
    this.shadow.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("action-btn")) {
        const action = target.getAttribute("data-action");
        const requestId = target.getAttribute("data-request-id");

        if (action && requestId) {
          this.dispatchEvent(
            new CustomEvent(`request-${action}`, {
              detail: { requestId: parseInt(requestId) },
            }),
          );
        }
      }
    });
  }
}

customElements.define("pto-request-queue", PtoRequestQueue);

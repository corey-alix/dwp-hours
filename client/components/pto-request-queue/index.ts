interface PTORequest {
    id: number;
    employeeId: number;
    employeeName: string;
    startDate: string;
    endDate: string;
    type: 'Sick' | 'PTO' | 'Bereavement' | 'Jury Duty';
    hours: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export class PtoRequestQueue extends HTMLElement {
    private shadow: ShadowRoot;
    private _requests: PTORequest[] = [];

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['requests'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue && name === 'requests') {
            try {
                this._requests = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error('Invalid requests JSON:', e);
            }
        }
    }

    set requests(value: PTORequest[]) {
        this.setAttribute('requests', JSON.stringify(value));
    }

    get requests(): PTORequest[] {
        return this._requests;
    }

    private render() {
        const pendingRequests = this._requests.filter(r => r.status === 'pending');

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
                    border-bottom: 1px solid #e9ecef;
                    background: white;
                }

                .queue-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 0;
                }

                .queue-stats {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #3498db;
                }

                .stat-label {
                    font-size: 12px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .queue-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .request-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border: 1px solid #e9ecef;
                    transition: box-shadow 0.3s ease;
                }

                .request-card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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
                    font-size: 18px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 0;
                }

                .request-type {
                    background: #3498db;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    margin-top: 4px;
                    display: inline-block;
                }

                .request-type.Sick { background: #e74c3c; }
                .request-type.PTO { background: #27ae60; }
                .request-type.Bereavement { background: #9b59b6; }
                .request-type.Jury-Duty { background: #f39c12; }

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
                    font-size: 12px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .detail-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: #2c3e50;
                }

                .request-dates {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .date-range {
                    background: #f8f9fa;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 13px;
                    color: #495057;
                }

                .request-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .action-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .action-btn.approve {
                    background: #27ae60;
                    color: white;
                }

                .action-btn.approve:hover {
                    background: #229954;
                }

                .action-btn.reject {
                    background: #e74c3c;
                    color: white;
                }

                .action-btn.reject:hover {
                    background: #c0392b;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #7f8c8d;
                }

                .empty-state h3 {
                    margin: 0 0 10px;
                    font-size: 20px;
                    color: #2c3e50;
                }

                .empty-state p {
                    margin: 0;
                    font-size: 16px;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge.pending {
                    background: #fff3cd;
                    color: #856404;
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
                    ${pendingRequests.length === 0 ?
                '<div class="empty-state"><h3>No pending requests</h3><p>All PTO requests have been reviewed.</p></div>' :
                pendingRequests.map(request => this.renderRequestCard(request)).join('')
            }
                </div>
            </div>
        `;
    }

    private renderRequestCard(request: PTORequest): string {
        const startDate = new Date(request.startDate).toLocaleDateString();
        const endDate = new Date(request.endDate).toLocaleDateString();
        const createdDate = new Date(request.createdAt).toLocaleDateString();

        return `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="employee-info">
                        <h3 class="employee-name">${request.employeeName}</h3>
                        <span class="request-type ${request.type.replace(' ', '-')}">${request.type}</span>
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
        this.shadow.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('action-btn')) {
                const action = target.getAttribute('data-action');
                const requestId = target.getAttribute('data-request-id');

                if (action && requestId) {
                    this.dispatchEvent(new CustomEvent(`request-${action}`, {
                        detail: { requestId: parseInt(requestId) }
                    }));
                }
            }
        });
    }
}

customElements.define('pto-request-queue', PtoRequestQueue);
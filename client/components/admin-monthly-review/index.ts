interface MonthlyEmployeeData {
  employeeId: number;
  employeeName: string;
  month: string;
  totalHours: number;
  ptoHours: number;
  sickHours: number;
  bereavementHours: number;
  juryDutyHours: number;
  acknowledgedByAdmin: boolean;
  adminAcknowledgedAt?: string;
  adminAcknowledgedBy?: string;
}

import { querySingle } from "../test-utils.js";

export class AdminMonthlyReview extends HTMLElement {
  private _employeeData: MonthlyEmployeeData[] = [];
  private _selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM format
  private _isLoading = false;
  private _acknowledgmentData: any[] = [];

  static get observedAttributes() {
    return ["employee-data", "selected-month", "acknowledgment-data"];
  }

  connectedCallback() {
    this.loadEmployeeData();
    this.addEventListener("click", this.handleClick.bind(this));
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      switch (name) {
        case "employee-data":
          try {
            this._employeeData = JSON.parse(newValue);
          } catch (e) {
            console.error("Invalid employee data JSON:", e);
            this._employeeData = [];
          }
          break;
        case "selected-month":
          this._selectedMonth = newValue;
          this.loadEmployeeData();
          break;
        case "acknowledgment-data":
          try {
            this._acknowledgmentData = JSON.parse(newValue);
            // Reload employee data when acknowledgment data changes
            this.loadEmployeeData();
          } catch (e) {
            console.error("Invalid acknowledgment data JSON:", e);
            this._acknowledgmentData = [];
          }
          break;
      }
      this.update();
    }
  }

  private async loadEmployeeData(): Promise<void> {
    this._isLoading = true;
    this.update();

    try {
      // TODO: Implement API call to fetch employee monthly data
      // For now, use mock data
      this._employeeData = await this.fetchEmployeeMonthlyData(
        this._selectedMonth,
      );
    } catch (error) {
      console.error("Failed to load employee data:", error);
      this._employeeData = [];
    } finally {
      this._isLoading = false;
      this.update();
    }
  }

  private async fetchEmployeeMonthlyData(
    month: string,
  ): Promise<MonthlyEmployeeData[]> {
    try {
      // Try to fetch from API first
      const response = await (window as any).api.getAdminMonthlyReview(month);
      return response.data.map((item: any) => ({
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        month: item.month,
        totalHours: item.totalHours,
        ptoHours: item.ptoHours,
        sickHours: item.sickHours,
        bereavementHours: item.bereavementHours,
        juryDutyHours: item.juryDutyHours,
        acknowledgedByAdmin: item.acknowledgedByAdmin,
        adminAcknowledgedAt: item.adminAcknowledgedAt,
        adminAcknowledgedBy: item.adminAcknowledgedBy,
      }));
    } catch (error) {
      console.warn("API call failed, falling back to mock data:", error);
      // Fallback to mock data for development
      return [
        {
          employeeId: 1,
          employeeName: "John Doe",
          month: month,
          totalHours: 160,
          ptoHours: 16,
          sickHours: 8,
          bereavementHours: 0,
          juryDutyHours: 0,
          acknowledgedByAdmin: this.isAcknowledged(1, month),
          adminAcknowledgedAt: this.getAcknowledgmentDate(1, month),
          adminAcknowledgedBy: this.getAcknowledgmentAdmin(1, month),
        },
        {
          employeeId: 2,
          employeeName: "Jane Smith",
          month: month,
          totalHours: 160,
          ptoHours: 8,
          sickHours: 0,
          bereavementHours: 0,
          juryDutyHours: 0,
          acknowledgedByAdmin: this.isAcknowledged(2, month),
          adminAcknowledgedAt: this.getAcknowledgmentDate(2, month),
          adminAcknowledgedBy: this.getAcknowledgmentAdmin(2, month),
        },
      ];
    }
  }

  private isAcknowledged(employeeId: number, month: string): boolean {
    // First check if the employee data already has acknowledgment info
    const employee = this._employeeData.find(
      (emp) => emp.employeeId === employeeId && emp.month === month,
    );
    if (employee) {
      return employee.acknowledgedByAdmin;
    }
    // Fallback to separate acknowledgment data
    return this._acknowledgmentData.some(
      (ack) => ack.employeeId === employeeId && ack.month === month,
    );
  }

  private getAcknowledgmentDate(
    employeeId: number,
    month: string,
  ): string | undefined {
    // First check if the employee data already has acknowledgment info
    const employee = this._employeeData.find(
      (emp) => emp.employeeId === employeeId && emp.month === month,
    );
    if (employee && employee.adminAcknowledgedAt) {
      return employee.adminAcknowledgedAt;
    }
    // Fallback to separate acknowledgment data
    const ack = this._acknowledgmentData.find(
      (ack) => ack.employeeId === employeeId && ack.month === month,
    );
    return ack?.acknowledgedAt;
  }

  private getAcknowledgmentAdmin(
    employeeId: number,
    month: string,
  ): string | undefined {
    // First check if the employee data already has acknowledgment info
    const employee = this._employeeData.find(
      (emp) => emp.employeeId === employeeId && emp.month === month,
    );
    if (employee && employee.adminAcknowledgedBy) {
      return employee.adminAcknowledgedBy;
    }
    // Fallback to separate acknowledgment data
    const ack = this._acknowledgmentData.find(
      (ack) => ack.employeeId === employeeId && ack.month === month,
    );
    return ack?.adminName;
  }

  setAcknowledgmentData(data: any[]): void {
    this._acknowledgmentData = data;
    this.setAttribute("acknowledgment-data", JSON.stringify(data));
  }

  private async handleAcknowledgeEmployee(employeeId: number): Promise<void> {
    // Find employee data to get name for confirmation
    const employee = this._employeeData.find(
      (emp) => emp.employeeId === employeeId,
    );
    if (!employee) {
      console.error("Employee not found for acknowledgment:", employeeId);
      return;
    }

    try {
      // Dispatch event to parent component (admin-panel) to handle acknowledgment
      this.dispatchEvent(
        new CustomEvent("admin-acknowledge", {
          detail: {
            employeeId,
            employeeName: employee.employeeName,
            month: this._selectedMonth,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      console.error("Failed to acknowledge employee:", error);
    }
  }

  private update(): void {
    this.innerHTML = this.render();
  }

  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;

    // Handle month selector
    const monthInput = target.closest(
      'input[type="month"]',
    ) as HTMLInputElement;
    if (monthInput) {
      this._selectedMonth = monthInput.value;
      this.loadEmployeeData();
      return;
    }

    // Handle acknowledge buttons
    if (target.classList.contains("acknowledge-btn")) {
      const employeeId = parseInt(
        target.getAttribute("data-employee-id") || "0",
      );
      if (employeeId) {
        this.handleAcknowledgeEmployee(employeeId);
      }
      return;
    }
  }

  protected render(): string {
    return `
      <style>
        :host {
          display: block;
          padding: 20px;
        }

        .header {
          margin-bottom: 20px;
        }

        .month-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .month-selector label {
          font-weight: 500;
          color: var(--color-text);
        }

        .month-selector input[type="month"] {
          padding: 8px 12px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-background);
          color: var(--color-text);
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--color-text-secondary);
        }

        .employee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .employee-card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 20px;
          background: var(--color-surface);
          box-shadow: 0 2px 4px var(--color-shadow);
        }

        .employee-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .employee-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }

        .acknowledgment-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-indicator.acknowledged {
          background: var(--color-success, #10b981);
        }

        .status-indicator.pending {
          background: var(--color-warning, #f59e0b);
        }

        .hours-breakdown {
          margin-bottom: 16px;
        }

        .hours-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-border-light, #e5e7eb);
        }

        .hours-row:last-child {
          border-bottom: none;
        }

        .hours-label {
          color: var(--color-text-secondary);
        }

        .hours-value {
          font-weight: 500;
          color: var(--color-text);
        }

        .acknowledge-btn {
          width: 100%;
          padding: 10px 16px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .acknowledge-btn:hover {
          background: var(--color-primary-hover);
        }

        .acknowledge-btn:disabled {
          background: var(--color-disabled, #9ca3af);
          cursor: not-allowed;
        }

        .acknowledged-info {
          background: var(--color-success-light, #d1fae5);
          border: 1px solid var(--color-success, #10b981);
          border-radius: 6px;
          padding: 12px;
          margin-top: 12px;
        }

        .acknowledged-info p {
          margin: 0;
          font-size: 14px;
          color: var(--color-success-dark, #065f46);
        }
      </style>

      <div class="header">
        <h2>Monthly Employee Review</h2>
        <p>Review and acknowledge employee hours and PTO usage for the selected month.</p>
      </div>

      <div class="month-selector">
        <label for="month-select">Select Month:</label>
        <input type="month" id="month-select" value="${this._selectedMonth}" />
      </div>

      ${
        this._isLoading
          ? `
        <div class="loading">
          <p>Loading employee data...</p>
        </div>
      `
          : `
        <div class="employee-grid">
          ${this._employeeData.map((employee) => this.renderEmployeeCard(employee)).join("")}
        </div>
      `
      }
    `;
  }

  private renderEmployeeCard(employee: MonthlyEmployeeData): string {
    const isAcknowledged = employee.acknowledgedByAdmin;

    return `
      <div class="employee-card">
        <div class="employee-header">
          <h3 class="employee-name">${employee.employeeName}</h3>
          <div class="acknowledgment-status">
            <div class="status-indicator ${isAcknowledged ? "acknowledged" : "pending"}"></div>
            <span>${isAcknowledged ? "Acknowledged" : "Pending"}</span>
          </div>
        </div>

        <div class="hours-breakdown">
          <div class="hours-row">
            <span class="hours-label">Total Hours</span>
            <span class="hours-value">${employee.totalHours}</span>
          </div>
          <div class="hours-row">
            <span class="hours-label">PTO Hours</span>
            <span class="hours-value">${employee.ptoHours}</span>
          </div>
          <div class="hours-row">
            <span class="hours-label">Sick Hours</span>
            <span class="hours-value">${employee.sickHours}</span>
          </div>
          <div class="hours-row">
            <span class="hours-label">Bereavement Hours</span>
            <span class="hours-value">${employee.bereavementHours}</span>
          </div>
          <div class="hours-row">
            <span class="hours-label">Jury Duty Hours</span>
            <span class="hours-value">${employee.juryDutyHours}</span>
          </div>
        </div>

        ${
          isAcknowledged
            ? `
          <div class="acknowledged-info">
            <p><strong>Acknowledged by:</strong> ${employee.adminAcknowledgedBy}</p>
            <p><strong>Date:</strong> ${new Date(employee.adminAcknowledgedAt || "").toLocaleDateString()}</p>
          </div>
        `
            : `
          <button class="acknowledge-btn" data-employee-id="${employee.employeeId}">
            Acknowledge Review
          </button>
        `
        }
      </div>
    `;
  }
}

// Register the component
customElements.define("admin-monthly-review", AdminMonthlyReview);

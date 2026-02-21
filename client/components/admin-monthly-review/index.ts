import { querySingle } from "../test-utils.js";
import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";
import type {
  AdminMonthlyReviewItem,
  PtoBalanceData,
} from "../../../shared/api-models.js";
import type { PtoBalanceSummary } from "../pto-balance-summary/index.js";
import {
  computeEmployeeBalanceData,
  type PTOType,
} from "../../../shared/businessRules.js";
import {
  getCurrentMonth,
  formatDateForDisplay,
} from "../../../shared/dateUtils.js";

// Admin Monthly Review Component Architecture:
// This component implements the event-driven data flow pattern:
// 1. Dispatches events for data requests (admin-monthly-review-request)
// 2. Receives data via method injection (setEmployeeData)
// 3. Never makes direct API calls - parent components handle data fetching
// 4. Uses shared AdminMonthlyReviewItem types for type safety
// 5. Follows BaseComponent patterns for memory-safe event handling

export class AdminMonthlyReview extends BaseComponent {
  private _employeeData: AdminMonthlyReviewItem[] = [];
  private _selectedMonth: string = getCurrentMonth();
  private _isLoading = false;
  private _acknowledgmentData: any[] = [];
  private _ptoEntries: Array<{
    employee_id: number;
    type: PTOType;
    hours: number;
  }> = [];

  static get observedAttributes() {
    return ["selected-month"];
  }

  connectedCallback() {
    super.connectedCallback();
    this.requestEmployeeData();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;
    if (name === "selected-month" && newValue) {
      this._selectedMonth = newValue;
      this.requestEmployeeData();
      this.requestUpdate();
    }
  }

  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set employeeData(value: AdminMonthlyReviewItem[]) {
    this._employeeData = value;
    this._isLoading = false;
    this.requestUpdate();
  }

  get employeeData(): AdminMonthlyReviewItem[] {
    return this._employeeData;
  }

  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set acknowledgmentData(value: any[]) {
    this._acknowledgmentData = value;
    this.requestEmployeeData();
    this.requestUpdate();
  }

  get acknowledgmentData(): any[] {
    return this._acknowledgmentData;
  }

  set selectedMonth(value: string) {
    this.setAttribute("selected-month", value);
  }

  get selectedMonth(): string {
    return this._selectedMonth;
  }

  private requestEmployeeData(): void {
    this._isLoading = true;
    this.requestUpdate();

    // Event-driven data flow: dispatch event for parent to handle data fetching
    // Parent component listens for this event and calls setEmployeeData() with results
    this.dispatchEvent(
      new CustomEvent("admin-monthly-review-request", {
        bubbles: true,
        composed: true,
        detail: { month: this._selectedMonth },
      }),
    );
  }

  // Method for parent to inject employee data
  // This implements the "data injection" pattern - parent handles API, component handles UI
  setEmployeeData(data: AdminMonthlyReviewItem[]): void {
    this._employeeData = data;
    this._isLoading = false;
    this.requestUpdate();
  }

  // Method for parent to inject PTO entries data
  // Used for balance calculations in test scenarios
  setPtoEntries(
    data: Array<{ employee_id: number; type: PTOType; hours: number }>,
  ): void {
    this._ptoEntries = data;
    this.requestUpdate();
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
    this.acknowledgmentData = data;
  }

  private computeEmployeeBalanceData(employeeId: number): PtoBalanceData {
    // Find employee data to get name
    const employee = this._employeeData.find(
      (emp) => emp.employeeId === employeeId,
    );
    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    // Use injected PTO entries for balance calculations
    return computeEmployeeBalanceData(
      employeeId,
      employee.employeeName,
      this._ptoEntries,
    );
  }

  // NOTE: balance summary wiring is now declarative. Parent pages that
  // project `pto-balance-summary` elements into the named slots should
  // call `getBalanceDataForEmployee(employeeId)` and assign the returned
  // `PtoBalanceData` to the slotted component via its `setBalanceData()`
  // method. This removes imperative DOM mutation from the component and
  // enables parent pages to control data injection for slotted children.

  /** Public accessor for parent components to retrieve computed balance data. */
  getBalanceDataForEmployee(employeeId: number): PtoBalanceData {
    return this.computeEmployeeBalanceData(employeeId);
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
      // Event-driven architecture: dispatch acknowledgment event to parent
      // Parent component handles API call to /api/admin-acknowledgements
      // This maintains separation between UI actions and business logic
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

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    // Handle month selector
    const monthInput = target.closest(
      'input[type="month"]',
    ) as HTMLInputElement;
    if (monthInput) {
      this._selectedMonth = monthInput.value;
      this.requestEmployeeData();
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
      ${styles}

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
      <slot name="balance-summary"></slot>
    `;
  }

  private renderEmployeeCard(employee: AdminMonthlyReviewItem): string {
    const isAcknowledged = employee.acknowledgedByAdmin;

    return `
      <div class="employee-card" data-employee-id="${employee.employeeId}">
        <div class="employee-header">
          <h3 class="employee-name">${employee.employeeName}</h3>
          <div class="acknowledgment-status">
            <div class="status-indicator ${isAcknowledged ? "acknowledged" : "pending"}"></div>
            <span>${isAcknowledged ? "Acknowledged" : "Pending"}</span>
          </div>
        </div>

        <slot name="balance-${employee.employeeId}">
          <pto-balance-summary data-employee-id="${employee.employeeId}"></pto-balance-summary>
        </slot>

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
            <p><strong>Date:</strong> ${employee.adminAcknowledgedAt ? formatDateForDisplay(employee.adminAcknowledgedAt.slice(0, 10)) : ""}</p>
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

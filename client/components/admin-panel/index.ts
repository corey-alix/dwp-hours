import { BaseComponent } from "../base-component.js";

interface Employee {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string;
  role: string;
  hash?: string;
}

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

export class AdminPanel extends BaseComponent {
  private _currentView = "pto-requests";
  private _employees: Employee[] = [];
  private _ptoRequests: PTORequest[] = [];
  private _showEmployeeForm = false;
  private _editingEmployee: Employee | null = null;
  private _editingEmployeeId: number | null = null;

  static get observedAttributes() {
    return ["current-view"];
  }

  connectedCallback() {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && name === "current-view") {
      this._currentView = newValue;
      this.requestUpdate();
    }
  }

  set currentView(value: string) {
    this.setAttribute("current-view", value);
  }

  get currentView(): string {
    return this.getAttribute("current-view") || "pto-requests";
  }

  // Method to set seed data for testing
  setEmployees(employees: Employee[]) {
    this._employees = employees;
    this.requestUpdate();
  }

  // Method to set PTO requests for testing
  setPTORequests(requests: PTORequest[]) {
    this._ptoRequests = requests;
    this.requestUpdate();
  }

  protected render(): string {
    return `
            <style>
                :host {
                    display: block;
                    height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .admin-panel {
                    display: flex;
                    height: 100%;
                }

                .sidebar {
                    width: 250px;
                    background: var(--color-surface);
                    color: var(--color-text);
                    padding: 20px 0;
                    box-shadow: 2px 0 5px var(--color-shadow);
                    border-right: 1px solid var(--color-border);
                }

                .sidebar-header {
                    padding: 0 20px 20px;
                    border-bottom: 1px solid var(--color-border);
                    margin-bottom: 20px;
                }

                .sidebar-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--color-text);
                }

                .nav-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .nav-item {
                    margin-bottom: 5px;
                }

                .nav-link {
                    display: block;
                    padding: 12px 20px;
                    color: var(--color-text-secondary);
                    text-decoration: none;
                    transition: all 0.3s ease;
                    border-left: 3px solid transparent;
                }

                .nav-link:hover {
                    background: var(--color-surface-hover);
                    color: var(--color-text);
                    border-left-color: var(--color-primary);
                }

                .nav-link:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                    border-left-color: var(--color-primary);
                    color: var(--color-text);
                }

                .nav-link.active {
                    background: var(--color-primary);
                    color: white;
                    border-left-color: var(--color-primary-hover);
                }

                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--color-background);
                }

                .header {
                    background: var(--color-surface);
                    padding: 20px;
                    border-bottom: 1px solid var(--color-border);
                    box-shadow: 0 2px 4px var(--color-shadow);
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--color-text);
                }

                .add-employee-btn {
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }

                .add-employee-btn:hover {
                    background: var(--color-primary-hover);
                }

                .add-employee-btn:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                }

                .content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                }

                .view-container {
                    background: var(--color-surface);
                    border-radius: 8px;
                    box-shadow: 0 2px 4px var(--color-shadow);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--color-border);
                }
            </style>

            <div class="admin-panel">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <h2>Admin Panel</h2>
                    </div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === "pto-requests" ? "active" : ""}" data-view="pto-requests">
                                    📋 PTO Requests
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === "employees" ? "active" : ""}" data-view="employees">
                                    👥 Employees
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === "reports" ? "active" : ""}" data-view="reports">
                                    📊 Reports
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === "settings" ? "active" : ""}" data-view="settings">
                                    ⚙️ Settings
                                </a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <main class="main-content">
                    <header class="header">
                        <div class="header-content">
                            <h1>${this.getViewTitle(this._currentView)}</h1>
                            ${this.renderHeaderActions(this._currentView)}
                        </div>
                    </header>
                    <div class="content">
                        <div class="view-container">
                            ${this.renderCurrentView()}
                        </div>
                    </div>
                </main>
            </div>
        `;
  }

  private getViewTitle(view: string): string {
    const titles: Record<string, string> = {
      employees: "Employee Management",
      "pto-requests": "PTO Request Queue",
      reports: "Reports & Analytics",
      settings: "System Settings",
    };
    return titles[view] || "Admin Panel";
  }

  private renderHeaderActions(view: string): string {
    if (view === "employees") {
      return `<button class="add-employee-btn" type="button">➕ Add Employee</button>`;
    }
    return "";
  }

  private renderCurrentView(): string {
    switch (this._currentView) {
      case "employees":
        return `
          <employee-list employees='${JSON.stringify(this._employees)}' editing-employee-id='${this._editingEmployeeId || ""}'>
            ${this._showEmployeeForm ? `<employee-form slot="top-content" employee='${JSON.stringify(this._editingEmployee)}' is-edit='${!!this._editingEmployee}'></employee-form>` : ""}
          </employee-list>
        `;
      case "pto-requests":
        return `<pto-request-queue requests='${JSON.stringify(this._ptoRequests)}'></pto-request-queue>`;
      case "reports":
        return "<report-generator></report-generator>";
      case "settings":
        return `
                    <div style="padding: 20px;">
                        <h3 style="margin: 0 0 12px;">Settings</h3>
                        <ul style="margin: 0; padding-left: 18px;">
                            <li>Total holidays for the year (placeholder)</li>
                            <li>Total sick day limits (placeholder)</li>
                            <li>Accrual rate rules (placeholder)</li>
                        </ul>
                    </div>
                `;
      default:
        return '<div style="padding: 20px;">Select a view from the sidebar</div>';
    }
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    // Handle navigation links
    const navLink = target.closest(".nav-link") as HTMLElement;
    if (navLink) {
      e.preventDefault();
      const view = navLink.getAttribute("data-view");
      if (view) {
        this.currentView = view;
        this.dispatchEvent(
          new CustomEvent("view-change", {
            detail: { view },
          }),
        );
      }
      return;
    }

    // Handle add employee button
    if (target.matches(".add-employee-btn")) {
      this.showEmployeeForm();
      return;
    }

    // Handle child component events that bubble up
    if (target.closest("[data-employee-id]")) {
      const employeeElement = target.closest(
        "[data-employee-id]",
      ) as HTMLElement;
      const employeeId = parseInt(
        employeeElement.getAttribute("data-employee-id") || "0",
      );
      if (employeeId) {
        this.showEmployeeForm(employeeId);
      }
    }
  }

  // Override to handle custom events from child components
  protected handleCustomEvent(event: CustomEvent): void {
    switch (event.type) {
      case "employee-submit":
        const { employee, isEdit } = event.detail;
        this.handleEmployeeSubmit(employee, isEdit);
        break;
      case "form-cancel":
        this.hideEmployeeForm();
        break;
      case "employee-delete":
        this.dispatchEvent(
          new CustomEvent("employee-delete", {
            detail: event.detail,
            bubbles: true,
            composed: true,
          }),
        );
        break;
      case "employee-acknowledge":
        this.dispatchEvent(
          new CustomEvent("employee-acknowledge", {
            detail: event.detail,
            bubbles: true,
            composed: true,
          }),
        );
        break;
      case "employee-edit":
        const employeeId = event.detail.employeeId;
        this.showEmployeeForm(employeeId);
        break;
    }
  }

  // Override the base setupEventDelegation to also handle custom events
  protected setupEventDelegation() {
    super.setupEventDelegation();

    // Listen for custom events from child components
    this.addEventListener("employee-submit", (e) => {
      this.handleCustomEvent(e as CustomEvent);
    });
    this.addEventListener("form-cancel", (e) => {
      this.handleCustomEvent(e as CustomEvent);
    });
    this.addEventListener("employee-delete", (e) => {
      this.handleCustomEvent(e as CustomEvent);
    });
    this.addEventListener("employee-acknowledge", (e) => {
      this.handleCustomEvent(e as CustomEvent);
    });
    this.addEventListener("employee-edit", (e) => {
      this.handleCustomEvent(e as CustomEvent);
    });
  }

  private showEmployeeForm(employeeId?: number) {
    if (employeeId) {
      // Inline editing of existing employee
      this._editingEmployeeId = employeeId;
      this._showEmployeeForm = false; // Don't show slot-based form
      this._editingEmployee = null;
    } else {
      // Adding new employee - show form in slot
      this._editingEmployeeId = null; // Clear any inline editing
      this._showEmployeeForm = true;
      this._editingEmployee = null;
    }
    this.requestUpdate();
  }

  private hideEmployeeForm() {
    this._showEmployeeForm = false;
    this._editingEmployee = null;
    this._editingEmployeeId = null;
    this.requestUpdate();
  }

  private async handleEmployeeSubmit(employee: Employee, isEdit: boolean) {
    // Dispatch event for parent component to handle data persistence
    const eventType = isEdit ? "update-employee" : "create-employee";
    this.dispatchEvent(
      new CustomEvent(eventType, {
        detail: { employee, isEdit },
        bubbles: true,
        composed: true,
      }),
    );
    this.hideEmployeeForm();
  }
}

customElements.define("admin-panel", AdminPanel);

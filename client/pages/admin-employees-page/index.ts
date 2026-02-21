import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { today } from "../../../shared/dateUtils.js";
import { styles } from "./css.js";

/**
 * Admin Employees page.
 * Contains `<employee-list>` and `<employee-form>` for managing employees.
 */
export class AdminEmployeesPage extends BaseComponent implements PageComponent {
  private api = new APIClient();
  private _employees: any[] = [];
  private _showForm = false;

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._employees = (loaderData as any)?.employees ?? [];
    this._showForm = false;
    this.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));
    this.populateList();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>Employee Management</h2>
      <div class="actions">
        <button class="add-btn" data-action="add-employee">${this._showForm ? "Cancel" : "Add Employee"}</button>
      </div>
      ${this._showForm ? "<employee-form></employee-form>" : ""}
      <employee-list></employee-list>
    `;
  }

  private populateList(): void {
    const list = this.shadowRoot.querySelector("employee-list") as any;
    if (list && this._employees.length) {
      list.employees = this._employees;
    }
  }

  private _customEventsSetup = false;

  protected setupEventDelegation(): void {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;

    this.shadowRoot.addEventListener("employee-edit", ((e: CustomEvent) => {
      e.stopPropagation();
      notifications.info(
        `Edit employee ${e.detail.employeeId} feature coming soon!`,
      );
    }) as EventListener);

    this.shadowRoot.addEventListener("employee-delete", ((e: CustomEvent) => {
      e.stopPropagation();
      notifications.info(
        `Delete employee ${e.detail.employeeId} feature coming soon!`,
      );
    }) as EventListener);

    this.shadowRoot.addEventListener("employee-submit", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handleEmployeeSubmit(e.detail);
    }) as EventListener);
  }

  private async handleEmployeeSubmit(detail: {
    employee: {
      name: string;
      identifier: string;
      ptoRate: number;
      carryoverHours: number;
      role: string;
    };
    isEdit: boolean;
  }): Promise<void> {
    try {
      const { employee } = detail;
      // Server expects snake_case field names
      await this.api.createEmployee({
        name: employee.name,
        identifier: employee.identifier,
        ptoRate: employee.ptoRate,
        carryoverHours: employee.carryoverHours,
        hireDate: today(),
        role: employee.role as "Employee" | "Admin",
      });
      notifications.success(`Employee "${employee.name}" added successfully!`);
      this._showForm = false;

      // Refresh employee list
      const employees = await this.api.getEmployees();
      this._employees = employees;
      this.requestUpdate();
      await new Promise((r) => setTimeout(r, 0));
      this.populateList();
    } catch (error) {
      notifications.error(
        `Failed to add employee: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.dataset.action === "add-employee") {
      this._showForm = !this._showForm;
      this.requestUpdate();
      // Re-populate list after re-render
      requestAnimationFrame(() => this.populateList());
    }
  }
}

customElements.define("admin-employees-page", AdminEmployeesPage);

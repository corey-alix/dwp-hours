import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { today } from "../../../shared/dateUtils.js";
import { styles } from "./css.js";

/**
 * Admin Employees page.
 * Contains `<employee-list>` and `<employee-form>` for managing employees.
 * Handles add, edit, and delete employee operations.
 */
export class AdminEmployeesPage extends BaseComponent implements PageComponent {
  private api = new APIClient();
  private _employees: any[] = [];
  private _showForm = false;
  private _editEmployee: any = null;

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._employees = (loaderData as any)?.employees ?? [];
    this._showForm = false;
    this._editEmployee = null;
    this.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));
    this.populateList();
  }

  protected render(): string {
    const buttonLabel = this._showForm ? "Cancel" : "Add Employee";
    return `
      ${styles}
      <h2>Employee Management</h2>
      <div class="actions">
        <button class="add-btn" data-action="add-employee">${buttonLabel}</button>
      </div>
      ${this._showForm ? "<employee-form></employee-form>" : ""}
      <employee-list>
        ${this._employees
          .map(
            (emp) =>
              `
            <pto-balance-summary slot="balance-${emp.id}" data-employee-id="${emp.id}"></pto-balance-summary>
            ${
              this._editEmployee && this._editEmployee.id === emp.id
                ? `<employee-form slot="editor-${emp.id}" is-edit="true"></employee-form>`
                : ""
            }
          `,
          )
          .join("")}
      </employee-list>
    `;
  }

  private populateList(): void {
    const list = this.shadowRoot.querySelector("employee-list") as any;
    if (list && this._employees.length) {
      list.employees = this._employees;
      // If an inline editor is active, tell the list which employee is being edited
      list.editingEmployeeId = this._editEmployee
        ? this._editEmployee.id
        : null;
    }
  }

  private _customEventsSetup = false;

  protected setupEventDelegation(): void {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;

    this.shadowRoot.addEventListener("employee-edit", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handleEditEmployee(e.detail.employeeId);
    }) as EventListener);

    this.shadowRoot.addEventListener("employee-delete", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handleDeleteEmployee(e.detail.employeeId);
    }) as EventListener);

    this.shadowRoot.addEventListener("employee-submit", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handleEmployeeSubmit(e.detail);
    }) as EventListener);

    this.shadowRoot.addEventListener("form-cancel", (() => {
      this._showForm = false;
      this._editEmployee = null;
      this.requestUpdate();
      requestAnimationFrame(() => this.populateList());
    }) as EventListener);
  }

  private handleEditEmployee(employeeId: number): void {
    const employee = this._employees.find((e: any) => e.id === employeeId);
    if (!employee) {
      notifications.error(`Employee ${employeeId} not found.`);
      return;
    }
    // Use inline editor inside employee-list rather than top-level form
    this._editEmployee = employee;
    this._showForm = false;
    this.requestUpdate();

    // After render, populate the inline editor's property so it receives the object (not via attribute)
    requestAnimationFrame(() => {
      const inlineForm = this.shadowRoot.querySelector(
        `employee-form[slot="editor-${employee.id}"]`,
      ) as any;
      if (inlineForm) {
        inlineForm.employee = employee;
      }
      this.populateList();
    });
  }

  private handleDeleteEmployee(employeeId: number): void {
    const employee = this._employees.find((e: any) => e.id === employeeId);
    const name = employee?.name ?? `#${employeeId}`;

    const dialog = document.createElement("confirmation-dialog") as any;
    dialog.message = `Are you sure you want to delete employee "${name}"? This action cannot be undone.`;
    dialog.confirmText = "Delete";
    dialog.cancelText = "Cancel";

    dialog.addEventListener("confirm", async () => {
      dialog.remove();
      try {
        await this.api.deleteEmployee(employeeId);
        notifications.success(`Employee "${name}" deleted successfully.`);
        await this.refreshEmployees();
      } catch (error) {
        notifications.error(
          `Failed to delete employee: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });

    dialog.addEventListener("cancel", () => {
      dialog.remove();
    });

    document.body.appendChild(dialog);
  }

  private async handleEmployeeSubmit(detail: {
    employee: {
      id?: number;
      name: string;
      identifier: string;
      ptoRate: number;
      carryoverHours: number;
      role: string;
    };
    isEdit: boolean;
  }): Promise<void> {
    try {
      const { employee, isEdit } = detail;

      if (isEdit && employee.id) {
        await this.api.updateEmployee(employee.id, {
          name: employee.name,
          identifier: employee.identifier,
          ptoRate: employee.ptoRate,
          carryoverHours: employee.carryoverHours,
          role: employee.role as "Employee" | "Admin",
        });
        notifications.success(
          `Employee "${employee.name}" updated successfully!`,
        );
      } else {
        await this.api.createEmployee({
          name: employee.name,
          identifier: employee.identifier,
          ptoRate: employee.ptoRate,
          carryoverHours: employee.carryoverHours,
          hireDate: today(),
          role: employee.role as "Employee" | "Admin",
        });
        notifications.success(
          `Employee "${employee.name}" added successfully!`,
        );
      }

      this._showForm = false;
      this._editEmployee = null;
      await this.refreshEmployees();
    } catch (error) {
      notifications.error(
        `Failed to ${detail.isEdit ? "update" : "add"} employee: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async refreshEmployees(): Promise<void> {
    const employees = await this.api.getEmployees();
    this._employees = employees;
    this.requestUpdate();
    await new Promise((r) => setTimeout(r, 0));
    this.populateList();
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.dataset.action === "add-employee") {
      this._showForm = !this._showForm;
      this._editEmployee = null;
      this.requestUpdate();
      requestAnimationFrame(() => this.populateList());
    }
  }
}

customElements.define("admin-employees-page", AdminEmployeesPage);

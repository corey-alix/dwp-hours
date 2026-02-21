import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { styles } from "./css.js";

/**
 * Admin Employees page.
 * Contains `<employee-list>` and `<employee-form>` for managing employees.
 */
export class AdminEmployeesPage extends BaseComponent implements PageComponent {
  private api = new APIClient();
  private _employees: any[] = [];

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._employees = (loaderData as any)?.employees ?? [];
    this.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));
    this.populateList();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>Employee Management</h2>
      <div class="actions">
        <button class="add-btn" data-action="add-employee">Add Employee</button>
      </div>
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
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.dataset.action === "add-employee") {
      notifications.info("Add employee feature coming soon!");
    }
  }
}

customElements.define("admin-employees-page", AdminEmployeesPage);

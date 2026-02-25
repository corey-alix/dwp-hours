import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { getCurrentYear, today } from "../../../shared/dateUtils.js";
import {
  BUSINESS_RULES_CONSTANTS,
  computeAnnualAllocation,
  type PTOType,
} from "../../../shared/businessRules.js";
import type { MonthSummary } from "../../components/month-summary/index.js";
import { adoptAnimations, adoptToolbar } from "../../css-extensions/index.js";
import { styles } from "./css.js";

/**
 * Admin Employees page.
 * Contains `<employee-list>` and `<employee-form>` for managing employees.
 * Handles add, edit, and delete employee operations.
 */
export class AdminEmployeesPage extends BaseComponent implements PageComponent {
  private api = new APIClient();
  private _employees: any[] = [];
  private _ptoEntries: Array<{
    employee_id: number;
    type: PTOType;
    hours: number;
    date: string;
  }> = [];
  private _currentYear = String(getCurrentYear());
  private _showForm = false;
  private _editEmployee: any = null;

  connectedCallback() {
    super.connectedCallback();
    adoptToolbar(this.shadowRoot);
    adoptAnimations(this.shadowRoot);
  }

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._employees = (loaderData as any)?.employees ?? [];
    this._showForm = false;
    this._editEmployee = null;
    this._currentYear = _search.get("current_year") || String(getCurrentYear());

    // Fetch PTO entries for balance calculations
    try {
      const ptoEntries = await this.api.getAdminPTOEntries();
      this._ptoEntries = (ptoEntries || [])
        .filter((p: any) => p.date?.startsWith(this._currentYear))
        .map((p: any) => ({
          employee_id: p.employeeId,
          type: p.type,
          hours: p.hours,
          date: p.date,
        }));
    } catch (error) {
      console.error(
        "Failed to fetch PTO entries for balance summaries:",
        error,
      );
      this._ptoEntries = [];
    }

    this.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));
    this.populateList();
    this.hydrateBalanceSummaries();
  }

  protected render(): string {
    const buttonLabel = this._showForm ? "Cancel" : "Add Employee";
    return `
      ${styles}
      <h2 class="page-heading">Employee Management</h2>
      <employee-list>
        ${this._employees
          .map(
            (emp) =>
              `
            <div class="balance-heading" slot="balance-${emp.id}">Available Balance</div>
            <month-summary slot="balance-${emp.id}" data-employee-id="${emp.id}"></month-summary>
            ${
              this._editEmployee && this._editEmployee.id === emp.id
                ? `<employee-form slot="editor-${emp.id}" is-edit="true"></employee-form>`
                : ""
            }
          `,
          )
          .join("")}
      </employee-list>
      ${this._showForm ? '<employee-form class="anim-slide-down-in"></employee-form>' : ""}
      <div class="toolbar">
        <button class="add-btn" data-action="add-employee">${buttonLabel}</button>
      </div>
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

  /**
   * Set balance data on each <month-summary> element rendered in light DOM.
   * Computes used hours per PTO category from fetched PTO entries, then sets
   * hours attributes (used) and `balances` property (annual limits) so
   * month-summary displays "available−used".
   */
  private hydrateBalanceSummaries(): void {
    if (this._ptoEntries.length === 0 && this._employees.length === 0) return;

    const summaries = this.shadowRoot.querySelectorAll(
      "month-summary",
    ) as NodeListOf<MonthSummary>;

    const year = parseInt(this._currentYear, 10);

    summaries.forEach((el) => {
      const empIdAttr = el.getAttribute("data-employee-id");
      if (!empIdAttr) return;
      const empId = parseInt(empIdAttr, 10);

      // Compute per-employee PTO allowance (annualAllocation + carryover)
      // instead of using the hardcoded carryover cap
      const emp = this._employees.find((e: any) => e.id === empId);
      let ptoLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.PTO;
      if (emp?.hireDate) {
        const annualAllocation = computeAnnualAllocation(emp.hireDate, year);
        ptoLimit = annualAllocation + (emp.carryoverHours ?? 0);
      }

      const limits: Record<string, number> = {
        PTO: ptoLimit,
        Sick: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK,
        Bereavement: BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT,
        "Jury Duty": BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY,
      };

      el.ptoHours = this.getUsedHours(empId, "PTO");
      el.sickHours = this.getUsedHours(empId, "Sick");
      el.bereavementHours = this.getUsedHours(empId, "Bereavement");
      el.juryDutyHours = this.getUsedHours(empId, "Jury Duty");
      el.balances = limits;
    });
  }

  /** Get used hours for an employee in a specific PTO category. */
  private getUsedHours(employeeId: number, category: string): number {
    return this._ptoEntries
      .filter((e) => e.employee_id === employeeId && e.type === category)
      .reduce((sum, e) => sum + e.hours, 0);
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
      const wasInlineEdit = !!this._editEmployee && !this._showForm;
      this._showForm = false;
      this._editEmployee = null;

      if (wasInlineEdit) {
        // Clear editing state on existing employee-list — no admin re-render.
        // Same reasoning as handleEditEmployee: full re-render destroys the
        // employee-list and resets mobile scroll position.
        const list = this.shadowRoot.querySelector("employee-list") as any;
        if (list) {
          list.editingEmployeeId = null;
        }
      } else {
        this.requestUpdate();
        requestAnimationFrame(() => {
          this.populateList();
          this.hydrateBalanceSummaries();
        });
      }
    }) as EventListener);
  }

  private handleEditEmployee(employeeId: number): void {
    const employee = this._employees.find((e: any) => e.id === employeeId);
    if (!employee) {
      notifications.error(`Employee ${employeeId} not found.`);
      return;
    }
    // Track edit state for cancel/submit handlers
    this._editEmployee = employee;
    this._showForm = false;

    // Set editing mode directly on the existing employee-list — no admin page
    // re-render. A full requestUpdate() would destroy and recreate the
    // employee-list via innerHTML, which on mobile (single-column) causes the
    // browser to clamp scroll to 0 while the new list is still empty.
    const list = this.shadowRoot.querySelector("employee-list") as any;
    if (list) {
      list.editingEmployeeId = employeeId;
    }
  }

  private async handleDeleteEmployee(employeeId: number): Promise<void> {
    const employee = this._employees.find((e: any) => e.id === employeeId);
    const name = employee?.name ?? `#${employeeId}`;

    try {
      await this.api.deleteEmployee(employeeId);
      notifications.success(`Employee "${name}" deleted successfully.`);
      await this.refreshEmployees();
    } catch (error) {
      notifications.error(
        `Failed to delete employee: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleEmployeeSubmit(detail: {
    employee: {
      id?: number;
      name: string;
      identifier: string;
      ptoRate: number;
      carryoverHours: number;
      hireDate: string;
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
          hireDate: employee.hireDate,
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
          hireDate: employee.hireDate || today(),
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
    const [employees, ptoEntries] = await Promise.all([
      this.api.getEmployees(),
      this.api.getAdminPTOEntries().catch((err) => {
        console.error("Failed to refresh PTO entries:", err);
        return [] as any[];
      }),
    ]);
    this._employees = employees;
    this._ptoEntries = (ptoEntries || [])
      .filter((p: any) => p.date?.startsWith(this._currentYear))
      .map((p: any) => ({
        employee_id: p.employeeId,
        type: p.type,
        hours: p.hours,
        date: p.date,
      }));
    this.requestUpdate();
    await new Promise((r) => setTimeout(r, 0));
    this.populateList();
    this.hydrateBalanceSummaries();
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.dataset.action === "add-employee") {
      this._showForm = !this._showForm;
      this._editEmployee = null;
      this.requestUpdate();
      requestAnimationFrame(() => {
        this.populateList();
        this.hydrateBalanceSummaries();
        if (this._showForm) {
          const form = this.shadowRoot.querySelector("employee-form");
          if (form) {
            const prefersReducedMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            form.scrollIntoView({
              behavior: prefersReducedMotion ? "auto" : "smooth",
              block: "nearest",
            });
          }
        }
      });
    }
  }
}

customElements.define("admin-employees-page", AdminEmployeesPage);

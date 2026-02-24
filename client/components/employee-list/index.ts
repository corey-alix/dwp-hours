export interface Employee {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  role: "Employee" | "Admin";
  hash: string;
}

import { BaseComponent } from "../base-component.js";
import { adoptAnimations } from "../../css-extensions/animations/index.js";
import { styles } from "./css.js";

export class EmployeeList extends BaseComponent {
  private _employees: Employee[] = [];
  private _searchTerm = "";
  private _editingEmployeeId: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    adoptAnimations(this.shadowRoot);
  }

  static get observedAttributes() {
    return ["editing-employee-id"];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;
    if (name === "editing-employee-id") {
      this._editingEmployeeId = newValue ? parseInt(newValue) : null;
      this.requestUpdate();
    }
  }

  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set employees(value: Employee[]) {
    this._employees = value;
    this._searchTerm = ""; // Reset search when employees change
    this.requestUpdate();
  }

  get employees(): Employee[] {
    return this._employees;
  }

  set editingEmployeeId(value: number | null) {
    this.setAttribute("editing-employee-id", value ? value.toString() : "");
  }

  get editingEmployeeId(): number | null {
    return this._editingEmployeeId;
  }

  private getFilteredEmployees(): Employee[] {
    if (!this._searchTerm) return this._employees;
    const term = this._searchTerm.toLowerCase();
    return this._employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.identifier.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term),
    );
  }

  protected render(): string {
    const filtered = this.getFilteredEmployees();
    return `
            ${styles}

            <div class="employee-list">
                <slot name="top-content"></slot>
                <div class="toolbar">
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Search employees..." id="search-input" value="${this._searchTerm}">
                        <span>📊 ${filtered.length} employees</span>
                    </div>
                </div>

                <div class="employee-grid">
                    ${
                      filtered.length === 0
                        ? '<div class="empty-state"><h3>No employees found</h3><p>Try adjusting your search or add a new employee.</p></div>'
                        : filtered
                            .map((emp) =>
                              this._editingEmployeeId === emp.id
                                ? this.renderInlineEditor(emp)
                                : this.renderEmployeeCard(emp),
                            )
                            .join("")
                    }
                </div>
            </div>
        `;
  }

  private renderEmployeeCard(employee: Employee): string {
    return `
            <div class="employee-card" data-employee-id="${employee.id}">
                <slot name="balance-${employee.id}"></slot>
                <div class="card-header">
                    <span class="employee-role ${employee.role === "Admin" ? "role-admin" : "role-employee"}">${employee.role}</span>
                </div>
                <div class="employee-details">                
                    <div class="detail-item">
                        <span class="detail-label">Name</span>
                        <p class="detail-value employee-identifier">${employee.name}</p>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email</span>
                        <p class="detail-value employee-identifier">${employee.identifier}</p>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">PTO Rate</span>
                        <span class="detail-value">${employee.ptoRate} hrs/day</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Carryover</span>
                        <span class="detail-value">${employee.carryoverHours} hrs</span>
                    </div>
                </div>

                <div class="employee-actions">
                    <button class="action-btn edit" data-action="edit" data-employee-id="${employee.id}">Edit</button>
                    <button class="action-btn delete" data-action="delete" data-employee-id="${employee.id}" title="Hold to delete">Delete</button>
                </div>

            </div>
        `;
  }

  private renderInlineEditor(employee: Employee): string {
    return `
            <div class="inline-editor anim-slide-down-in" data-employee-id="${employee.id}">
                <slot name="editor-${employee.id}">
                  <employee-form employee='${JSON.stringify(employee)}' is-edit="true"></employee-form>
                </slot>
            </div>
        `;
  }

  private _inputListenerSetup = false;
  private _deleteTimer: ReturnType<typeof setTimeout> | null = null;
  private _deleteTarget: HTMLElement | null = null;
  private static readonly DELETE_HOLD_MS = 1500;

  protected setupEventDelegation() {
    super.setupEventDelegation();
    if (this._inputListenerSetup) return;
    this._inputListenerSetup = true;

    // Input event for search filtering
    this.shadowRoot.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      if (target.id === "search-input") {
        this._searchTerm = (target as HTMLInputElement).value;
        this.requestUpdate();
      }
    });

    // Forward employee-submit from inline editor
    this.shadowRoot.addEventListener("employee-submit", (e) => {
      this.dispatchEvent(
        new CustomEvent("employee-submit", {
          detail: (e as CustomEvent).detail,
          bubbles: true,
          composed: true,
        }),
      );
    });

    // Forward form-cancel from inline editor
    this.shadowRoot.addEventListener("form-cancel", (e) => {
      this.dispatchEvent(
        new CustomEvent("form-cancel", {
          detail: (e as CustomEvent).detail,
          bubbles: true,
          composed: true,
        }),
      );
    });

    // Long-press detection for delete buttons
    this.shadowRoot.addEventListener("pointerdown", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.classList.contains("action-btn") &&
        target.classList.contains("delete")
      ) {
        e.preventDefault();
        this.startDeletePress(target, e as PointerEvent);
      }
    });

    this.shadowRoot.addEventListener("pointerup", () => {
      this.cancelDeletePress();
    });

    this.shadowRoot.addEventListener("pointerleave", (e) => {
      const target = e.target as HTMLElement;
      if (target === this._deleteTarget) {
        this.cancelDeletePress();
      }
    });

    // Also cancel on pointer cancel (e.g., system gesture interruption)
    this.shadowRoot.addEventListener("pointercancel", () => {
      this.cancelDeletePress();
    });
  }

  private startDeletePress(target: HTMLElement, e: PointerEvent): void {
    this.cancelDeletePress();
    this._deleteTarget = target;
    target.classList.add("pressing");
    target.setPointerCapture(e.pointerId);

    const employeeId = target.getAttribute("data-employee-id");
    if (!employeeId) return;

    this._deleteTimer = setTimeout(() => {
      target.classList.remove("pressing");
      this._deleteTarget = null;
      this._deleteTimer = null;

      this.dispatchEvent(
        new CustomEvent("employee-delete", {
          detail: { employeeId: parseInt(employeeId) },
          bubbles: true,
          composed: true,
        }),
      );
    }, EmployeeList.DELETE_HOLD_MS);
  }

  private cancelDeletePress(): void {
    if (this._deleteTimer) {
      clearTimeout(this._deleteTimer);
      this._deleteTimer = null;
    }
    if (this._deleteTarget) {
      this._deleteTarget.classList.remove("pressing");
      this._deleteTarget = null;
    }
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains("action-btn")) {
      const action = target.getAttribute("data-action");
      const employeeId = target.getAttribute("data-employee-id");

      // Delete is handled by long-press, not single click
      if (action === "delete") return;

      if (action && employeeId) {
        this.dispatchEvent(
          new CustomEvent(`employee-${action}`, {
            detail: { employeeId: parseInt(employeeId) },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }
  }
}

customElements.define("employee-list", EmployeeList);

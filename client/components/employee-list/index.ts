export interface Employee {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string;
  role: "Employee" | "Admin";
  hash: string;
}

import { BaseComponent } from "../base-component.js";
import { adoptAnimations } from "../../css-extensions/animations/index.js";
import {
  adoptNavigation,
  NAV_SYMBOLS,
  animateSlide,
} from "../../css-extensions/index.js";
import { styles } from "./css.js";
import { addMonths, getCurrentMonth } from "../../../shared/dateUtils.js";
import { MONTH_NAMES, type PTOType } from "../../../shared/businessRules.js";
// Side-effect import: ensure <pto-calendar> custom element is registered
import "../pto-calendar/index.js";
import type { PtoCalendar } from "../pto-calendar/index.js";

export interface EmployeePtoEntry {
  employee_id: number;
  type: PTOType;
  hours: number;
  date: string;
  approved_by?: number | null;
}

export class EmployeeList extends BaseComponent {
  private _employees: Employee[] = [];
  private _searchTerm = "";
  private _editingEmployeeId: number | null = null;
  private _ptoEntries: EmployeePtoEntry[] = [];
  /** Track which employee IDs have their inline calendar expanded */
  private _expandedCalendars: Set<number> = new Set();
  /** Per-card navigated month (employee ID → YYYY-MM). Reset on collapse. */
  private _calendarMonths: Map<number, string> = new Map();

  connectedCallback() {
    super.connectedCallback();
    adoptAnimations(this.shadowRoot);
    adoptNavigation(this.shadowRoot);
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
      const prevId = this._editingEmployeeId;
      this._editingEmployeeId = newValue ? parseInt(newValue) : null;

      // Collapse any open calendar when entering edit mode
      if (this._editingEmployeeId !== null) {
        this._expandedCalendars.delete(this._editingEmployeeId);
        this._calendarMonths.delete(this._editingEmployeeId);
      }

      // Animate card → editor transition when entering edit mode
      if (this._editingEmployeeId !== null && prevId === null) {
        this.transitionCardToEditor(this._editingEmployeeId);
      } else if (this._editingEmployeeId !== null && prevId !== null) {
        // Switching from one employee to another — need renderEditorInPlace
        // so the form's employee JS property is set (employee-form does NOT
        // observe the employee HTML attribute).
        this.renderEditorInPlace(null);
      } else {
        this.requestUpdate();
      }
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

  /** Set PTO entries for inline calendar rendering. */
  set ptoEntries(value: EmployeePtoEntry[]) {
    this._ptoEntries = value;
  }

  get ptoEntries(): EmployeePtoEntry[] {
    return this._ptoEntries;
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
                    <div class="detail-item">
                        <span class="detail-label">Hire Date</span>
                        <span class="detail-value">${employee.hireDate || "—"}</span>
                    </div>
                </div>

                <div class="employee-actions">
                    <button class="action-btn view-calendar-btn" data-action="view-calendar" data-employee-id="${employee.id}">${this._expandedCalendars.has(employee.id) ? "Hide Calendar" : "View Calendar"}</button>
                    <button class="action-btn edit" data-action="edit" data-employee-id="${employee.id}">Edit</button>
                    <button class="action-btn delete" data-action="delete" data-employee-id="${employee.id}" title="Hold to delete">Delete</button>
                </div>

                ${this.renderInlineCalendar(employee)}

            </div>
        `;
  }

  /** Render the inline calendar section for an employee card (if expanded). */
  private renderInlineCalendar(employee: Employee): string {
    if (!this._expandedCalendars.has(employee.id)) return "";

    const calMonthStr =
      this._calendarMonths.get(employee.id) || getCurrentMonth();
    const [yearStr, monthStr] = calMonthStr.split("-");
    const calYear = parseInt(yearStr, 10);
    const calMonth = parseInt(monthStr, 10);
    const monthLabel = `${MONTH_NAMES[calMonth - 1]} ${calYear}`;

    return `
      <div class="inline-calendar-container" data-employee-id="${employee.id}">
        <div class="nav-header">
          <button class="nav-arrow cal-nav-prev" data-employee-id="${employee.id}" aria-label="Previous month">${NAV_SYMBOLS.PREV}</button>
          <span class="nav-label">${monthLabel}</span>
          <button class="nav-arrow cal-nav-next" data-employee-id="${employee.id}" aria-label="Next month">${NAV_SYMBOLS.NEXT}</button>
        </div>
        <pto-calendar
          month="${calMonth}"
          year="${calYear}"
          readonly="true"
          hide-legend="true"
          hide-header="true"
          data-employee-id="${employee.id}">
        </pto-calendar>
      </div>
    `;
  }

  /** Inject PTO entry data into all expanded inline calendars after render. */
  private injectCalendarData(): void {
    this.shadowRoot
      .querySelectorAll<PtoCalendar>("pto-calendar")
      .forEach((cal) => {
        const empId = parseInt(cal.dataset.employeeId || "0");
        if (!empId) return;
        const calMonthStr =
          this._calendarMonths.get(empId) || getCurrentMonth();
        const empEntries = this._ptoEntries
          .filter(
            (e) => e.employee_id === empId && e.date.startsWith(calMonthStr),
          )
          .map((e, idx) => ({
            id: idx + 1,
            employeeId: empId,
            date: e.date,
            type: e.type,
            hours: e.hours,
            createdAt: "",
            approved_by: e.approved_by ?? null,
          }));
        cal.setPtoEntries(empEntries);
      });
  }

  private renderInlineEditor(employee: Employee): string {
    return `
            <div class="inline-editor anim-fade-in" data-employee-id="${employee.id}">
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
  /** Duration for card fade-out before editor appears (matches --duration-normal). */
  private static readonly TRANSITION_MS = 250;

  /**
   * Animate the card fading out, then re-render with the editor fading in.
   * Preserves `.employee-grid` scroll position across the innerHTML rebuild.
   * Follows CSS Animation Assistant rules: inline styles for sequenced phases,
   * transitionend filtered by propertyName, setTimeout fallback, reduced-motion
   * check, and deduped completion logic.
   */
  private transitionCardToEditor(employeeId: number): void {
    const card = this.shadowRoot.querySelector(
      `.employee-card[data-employee-id="${employeeId}"]`,
    ) as HTMLElement | null;

    // No card found (e.g. filtered out) — skip animation
    if (!card) {
      this.renderEditorInPlace(null);
      return;
    }

    // Capture the card's screen position (works with any scroll container).
    const cardScreenTop = card.getBoundingClientRect().top;

    // Respect reduced-motion preference — instant swap, preserve position
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      this.renderEditorInPlace(cardScreenTop);
      return;
    }

    // Phase 1: fade out the card
    let completed = false;
    const onComplete = () => {
      if (completed) return;
      completed = true;
      clearTimeout(fallbackTimer);
      card.removeEventListener("transitionend", onTransitionEnd);

      // Phase 2: re-render with editor (which has anim-fade-in)
      this.renderEditorInPlace(cardScreenTop);
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === "opacity") onComplete();
    };

    card.addEventListener("transitionend", onTransitionEnd);
    const fallbackTimer = setTimeout(
      onComplete,
      EmployeeList.TRANSITION_MS + 50,
    );

    // Trigger the fade-out via inline styles
    card.style.transition = `opacity ${EmployeeList.TRANSITION_MS}ms cubic-bezier(0.4, 0, 1, 1)`;
    card.style.opacity = "0";
  }

  /**
   * Re-render and adjust window scroll so the new `.inline-editor` appears
   * at the same screen position the card occupied.
   *
   * The `.employee-grid` is NOT a scroll container (it grows freely with
   * content — scrollHeight === clientHeight). The actual scroll container
   * is the document/window. We use `window.scrollBy()` with the difference
   * between the editor's screen position and the card's original screen
   * position to eliminate any visible jump.
   *
   * @param cardScreenTop - card's `getBoundingClientRect().top` before
   *   re-render, or null to skip scroll adjustment.
   */
  private renderEditorInPlace(cardScreenTop: number | null): void {
    // requestUpdate → renderTemplate is synchronous (innerHTML replacement).
    this.requestUpdate();

    // The fallback <employee-form> inside the <slot> is created via innerHTML.
    // employee-form only observes the `is-edit` attribute; the `employee`
    // attribute is NOT observed, so we must set the JS property after render.
    // This is synchronous (before the browser paints).
    if (this._editingEmployeeId !== null) {
      const form = this.shadowRoot.querySelector(
        ".inline-editor employee-form",
      ) as any;
      const employee = this._employees.find(
        (e) => e.id === this._editingEmployeeId,
      );
      if (form && employee) {
        form.employee = employee;
      }
    }

    if (cardScreenTop === null) return;

    const editor = this.shadowRoot.querySelector(
      ".inline-editor",
    ) as HTMLElement | null;

    if (editor) {
      // getBoundingClientRect() forces layout; we're still before the paint.
      const editorScreenTop = editor.getBoundingClientRect().top;
      const drift = editorScreenTop - cardScreenTop;
      if (Math.abs(drift) > 1) {
        window.scrollBy(0, drift);
      }
    }
  }

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

    // Handle calendar month navigation arrows
    if (
      target.classList.contains("cal-nav-prev") ||
      target.classList.contains("cal-nav-next")
    ) {
      const employeeId = parseInt(
        target.getAttribute("data-employee-id") || "0",
      );
      if (employeeId) {
        const direction: -1 | 1 = target.classList.contains("cal-nav-prev")
          ? -1
          : 1;
        this.navigateCalendarMonth(employeeId, direction);
      }
      return;
    }

    if (target.classList.contains("action-btn")) {
      const action = target.getAttribute("data-action");
      const employeeId = target.getAttribute("data-employee-id");

      // Delete is handled by long-press, not single click
      if (action === "delete") return;

      // Handle view-calendar toggle internally
      if (action === "view-calendar" && employeeId) {
        this.toggleCalendar(parseInt(employeeId));
        return;
      }

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

  /** Toggle the inline calendar for a given employee card. */
  private toggleCalendar(employeeId: number): void {
    const expanding = !this._expandedCalendars.has(employeeId);

    if (expanding) {
      // Initialize displayed month to current month on every open
      this._calendarMonths.set(employeeId, getCurrentMonth());
      this._expandedCalendars.add(employeeId);

      this.requestUpdate();
      this.injectCalendarData();

      // Animate the calendar sliding into view
      requestAnimationFrame(() => {
        const card = this.shadowRoot.querySelector(
          `.employee-card[data-employee-id="${employeeId}"]`,
        );
        const container = card?.querySelector(
          ".inline-calendar-container",
        ) as HTMLElement | null;
        if (container) {
          animateSlide(container, true);
          container.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    } else {
      // Animate collapse before removing from DOM
      const card = this.shadowRoot.querySelector(
        `.employee-card[data-employee-id="${employeeId}"]`,
      );
      const container = card?.querySelector(
        ".inline-calendar-container",
      ) as HTMLElement | null;

      const finishCollapse = () => {
        this._expandedCalendars.delete(employeeId);
        this._calendarMonths.delete(employeeId);
        this.requestUpdate();
      };

      if (container) {
        const anim = animateSlide(container, false);
        anim.promise.then(finishCollapse);
      } else {
        finishCollapse();
      }
    }
  }

  /** Navigate the inline calendar for an employee to a different month. */
  private navigateCalendarMonth(employeeId: number, direction: -1 | 1): void {
    const currentMonth =
      this._calendarMonths.get(employeeId) || getCurrentMonth();
    // addMonths expects a full date string; use first day of month
    const newMonthDate = addMonths(`${currentMonth}-01`, direction);
    const newMonth = newMonthDate.slice(0, 7); // YYYY-MM
    this._calendarMonths.set(employeeId, newMonth);
    this.requestUpdate();
    this.injectCalendarData();
  }
}

customElements.define("employee-list", EmployeeList);

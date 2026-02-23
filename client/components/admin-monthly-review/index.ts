import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";
import type {
  AdminMonthlyReviewItem,
  PtoBalanceData,
} from "../../../shared/api-models.js";
import {
  computeEmployeeBalanceData,
  type PTOType,
} from "../../../shared/businessRules.js";
import {
  getCurrentMonth,
  formatDateForDisplay,
  addMonths,
} from "../../../shared/dateUtils.js";
// Side-effect import: ensure <month-summary> custom element is registered
import "../month-summary/index.js";
import type { MonthSummary } from "../month-summary/index.js";
// Side-effect import: ensure <pto-calendar> custom element is registered
import "../pto-calendar/index.js";
import { monthNames, type PtoCalendar } from "../pto-calendar/index.js";
import {
  adoptToolbar,
  adoptNavigation,
  NAV_SYMBOLS,
  adoptAnimations,
  animateCarousel,
  animateDismiss,
  animateSlide,
  setupSwipeNavigation,
} from "../../css-extensions/index.js";
import type {
  SwipeNavigationHandle,
  ListenerHost,
} from "../../css-extensions/index.js";

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
    date: string;
    approved_by?: number | null;
  }> = [];
  /** Track which employee IDs have their inline calendar expanded */
  private _expandedCalendars: Set<number> = new Set();
  /** Per-card navigated month (employee ID → YYYY-MM). Reset on collapse. */
  private _calendarMonths: Map<number, string> = new Map();
  /** Per-card swipe navigation handles for memory-safe cleanup */
  private _swipeHandles: Map<number, SwipeNavigationHandle> = new Map();
  /** Track which calendar containers already have swipe listeners attached */
  private _swipeListenerCards: Set<number> = new Set();

  /** Cache of PTO entries fetched for non-review months, keyed by YYYY-MM */
  private _monthPtoCache: Map<
    string,
    Array<{
      employee_id: number;
      type: PTOType;
      hours: number;
      date: string;
      approved_by?: number | null;
    }>
  > = new Map();

  static get observedAttributes() {
    return ["selected-month"];
  }

  connectedCallback() {
    super.connectedCallback();
    adoptToolbar(this.shadowRoot);
    adoptNavigation(this.shadowRoot);
    adoptAnimations(this.shadowRoot);
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
      // Collapse all calendars and clear navigated months when month changes
      this._expandedCalendars.clear();
      this._calendarMonths.clear();
      this._swipeListenerCards.clear();
      this.requestEmployeeData();
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
    data: Array<{
      employee_id: number;
      type: PTOType;
      hours: number;
      date: string;
      approved_by?: number | null;
    }>,
  ): void {
    this._ptoEntries = data;
    this.requestUpdate();
  }

  /** Inject PTO entries for a specific month (used for non-review month fetches). */
  setMonthPtoEntries(
    month: string,
    data: Array<{
      employee_id: number;
      type: PTOType;
      hours: number;
      date: string;
      approved_by?: number | null;
    }>,
  ): void {
    this._monthPtoCache.set(month, data);
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

    // Filter PTO entries to the selected month's year to avoid
    // prior-year data leaking into balance calculations
    const selectedYear = this._selectedMonth.slice(0, 4);
    const yearEntries = this._ptoEntries.filter((e) =>
      e.date.startsWith(selectedYear),
    );

    return computeEmployeeBalanceData(
      employeeId,
      employee.employeeName,
      yearEntries,
    );
  }

  /** Map PTO category name to the scheduled hours from AdminMonthlyReviewItem. */
  private getScheduledHours(
    employee: AdminMonthlyReviewItem,
    category: string,
  ): number {
    switch (category) {
      case "PTO":
        return employee.ptoHours;
      case "Sick":
        return employee.sickHours;
      case "Bereavement":
        return employee.bereavementHours;
      case "Jury Duty":
        return employee.juryDutyHours;
      default:
        return 0;
    }
  }

  /** After render, set complex `balances` property on each <month-summary>
   *  and inject PTO entries into expanded inline calendars. */
  protected override update(): void {
    // super.update() → renderTemplate() → cleanupEventListeners() removes ALL
    // DOM listeners. Clear the tracking set so setupSwipeForCard() re-attaches.
    this._swipeListenerCards.clear();
    super.update();

    // Balance badge injection
    if (this._ptoEntries.length > 0) {
      this.shadowRoot
        .querySelectorAll<MonthSummary>("month-summary")
        .forEach((ms) => {
          const empId = parseInt(ms.dataset.employeeId || "0");
          if (!empId) return;
          try {
            const balanceData = this.computeEmployeeBalanceData(empId);
            const employee = this._employeeData.find(
              (e) => e.employeeId === empId,
            );
            if (!employee || balanceData.categories.length === 0) return;
            const balances: Record<string, number> = {};
            for (const cat of balanceData.categories) {
              // available = remaining + scheduled_this_month
              balances[cat.category] =
                cat.remaining + this.getScheduledHours(employee, cat.category);
            }
            ms.balances = balances;
          } catch {
            /* no balance data available */
          }
        });
    }

    // Inject PTO entries into expanded inline calendars
    this.shadowRoot
      .querySelectorAll<PtoCalendar>("pto-calendar")
      .forEach((cal) => {
        const empId = parseInt(cal.dataset.employeeId || "0");
        if (!empId) return;
        // Determine which month this calendar is showing
        const calMonth = this._calendarMonths.get(empId) || this._selectedMonth;
        // Get entries for the displayed month — use cache for non-review months
        const sourceEntries =
          calMonth === this._selectedMonth
            ? this._ptoEntries
            : this._monthPtoCache.get(calMonth) || [];
        const empEntries = sourceEntries
          .filter((e) => e.employee_id === empId)
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

    // Attach swipe listeners to newly rendered inline calendar containers
    for (const empId of this._expandedCalendars) {
      this.setupSwipeForCard(empId);
    }
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
      // Parent component handles confirmation dialog and API call
      // Animation is triggered by the parent after the user confirms
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

  /**
   * Animate a card scaling down and fading out (dismiss effect).
   * Called by the parent page after the administrator confirms the
   * acknowledgment dialog. Returns a promise that resolves when the
   * animation completes (or immediately under reduced-motion).
   */
  async dismissCard(employeeId: number): Promise<void> {
    const card = this.shadowRoot.querySelector(
      `.employee-card[data-employee-id="${employeeId}"]`,
    ) as HTMLElement | null;

    if (card) {
      const handle = animateDismiss(card);
      await handle.promise;
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
      // Collapse all calendars and clear navigated months when month changes
      this._expandedCalendars.clear();
      this._calendarMonths.clear();
      this._swipeListenerCards.clear();
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

    // Handle view-calendar toggle buttons
    if (target.classList.contains("view-calendar-btn")) {
      const employeeId = parseInt(
        target.getAttribute("data-employee-id") || "0",
      );
      if (employeeId) {
        this.toggleCalendar(employeeId);
      }
      return;
    }

    // Handle calendar month navigation arrows (with carousel animation)
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
        this.navigateMonthWithAnimation(employeeId, direction);
      }
      return;
    }
  }

  /** Toggle the inline calendar for a given employee card.
   *  Always resets to the review month when re-opening. */
  private toggleCalendar(employeeId: number): void {
    const expanding = !this._expandedCalendars.has(employeeId);

    if (expanding) {
      // Reset displayed month to the review month on every open
      this._calendarMonths.set(employeeId, this._selectedMonth);
      this._expandedCalendars.add(employeeId);

      this.requestUpdate();

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
        this._swipeListenerCards.delete(employeeId);
        const handle = this._swipeHandles.get(employeeId);
        if (handle) {
          handle.destroy();
          this._swipeHandles.delete(employeeId);
        }
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

  // ── Swipe navigation ──

  /**
   * Register swipe gesture detection on an `.inline-calendar-container`.
   * Delegates to the shared setupSwipeNavigation() helper which handles
   * touch detection, animation guards, and animateCarousel.
   */
  private setupSwipeForCard(employeeId: number): void {
    if (this._swipeListenerCards.has(employeeId)) return;
    const card = this.shadowRoot.querySelector(
      `.employee-card[data-employee-id="${employeeId}"]`,
    );
    const container = card?.querySelector(
      ".inline-calendar-container",
    ) as HTMLElement | null;
    if (!container) return;

    this._swipeListenerCards.add(employeeId);

    const handle = setupSwipeNavigation(
      this as unknown as ListenerHost,
      container,
      (direction) => {
        this.navigateCalendarMonth(employeeId, direction);
      },
    );
    this._swipeHandles.set(employeeId, handle);
  }

  /**
   * Carousel-style month navigation for arrow button clicks.
   * Delegates to animateCarousel directly (swipe uses setupSwipeNavigation).
   */
  private navigateMonthWithAnimation(
    employeeId: number,
    direction: -1 | 1,
  ): void {
    const card = this.shadowRoot.querySelector(
      `.employee-card[data-employee-id="${employeeId}"]`,
    );
    const container = card?.querySelector(
      ".inline-calendar-container",
    ) as HTMLElement | null;
    if (!container) {
      // Fallback: navigate without animation
      this.navigateCalendarMonth(employeeId, direction);
      return;
    }

    animateCarousel(container, direction, () => {
      this.navigateCalendarMonth(employeeId, direction);
    });
  }

  /** Navigate the inline calendar for an employee to a different month.
   *  Dispatches an event so the parent can fetch data if needed. */
  private navigateCalendarMonth(employeeId: number, direction: -1 | 1): void {
    const currentMonth =
      this._calendarMonths.get(employeeId) || this._selectedMonth;
    // addMonths expects a full date string; use first day of month
    const newMonthDate = addMonths(`${currentMonth}-01`, direction);
    const newMonth = newMonthDate.slice(0, 7); // YYYY-MM
    this._calendarMonths.set(employeeId, newMonth);

    // If we don't have cached data for this month, request it
    if (
      newMonth !== this._selectedMonth &&
      !this._monthPtoCache.has(newMonth)
    ) {
      this.dispatchEvent(
        new CustomEvent("calendar-month-data-request", {
          bubbles: true,
          composed: true,
          detail: { month: newMonth, employeeId },
        }),
      );
    }

    // Mark swipe listeners stale — re-render destroys the container element,
    // so listeners must be re-attached to the new DOM in update().
    this._swipeListenerCards.delete(employeeId);

    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}

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
          ${this._employeeData
            .filter((emp) => !emp.acknowledgedByAdmin)
            .map((employee) => this.renderEmployeeCard(employee))
            .join("")}
        </div>
        ${this._employeeData.every((emp) => emp.acknowledgedByAdmin) ? `<div class="empty-state"><p>All employees have been acknowledged for this month.</p></div>` : ""}
      `
      }
    `;
  }

  private renderEmployeeCard(employee: AdminMonthlyReviewItem): string {
    const isAcknowledged = employee.acknowledgedByAdmin;
    const isCalendarExpanded = this._expandedCalendars.has(employee.employeeId);
    // Use per-card navigated month if set, otherwise fall back to review month
    const displayMonth =
      this._calendarMonths.get(employee.employeeId) || this._selectedMonth;
    const [yearStr, monthStr] = displayMonth.split("-");
    const calMonth = parseInt(monthStr, 10);
    const calYear = parseInt(yearStr, 10);
    const monthLabel = `${monthNames[calMonth - 1]} ${calYear}`;

    return `
      <div class="employee-card" data-employee-id="${employee.employeeId}">
        <div class="employee-header">
          <h3 class="employee-name">${employee.employeeName}</h3>
          <div class="acknowledgment-status">
            <div class="status-indicator ${isAcknowledged ? "acknowledged" : "pending"}"></div>
            <span>${isAcknowledged ? "Acknowledged" : "Pending"}</span>
          </div>
        </div>

        <month-summary
          pto-hours="${employee.ptoHours}"
          sick-hours="${employee.sickHours}"
          bereavement-hours="${employee.bereavementHours}"
          jury-duty-hours="${employee.juryDutyHours}"
          data-employee-id="${employee.employeeId}"
        ></month-summary>

        ${
          isAcknowledged
            ? `
          <div class="acknowledged-info">
            <p><strong>Acknowledged by:</strong> ${employee.adminAcknowledgedBy}</p>
            <p><strong>Date:</strong> ${employee.adminAcknowledgedAt ? formatDateForDisplay(employee.adminAcknowledgedAt.slice(0, 10)) : ""}</p>
          </div>
        `
            : ""
        }

        <div class="toolbar">
          <button class="view-calendar-btn" data-employee-id="${employee.employeeId}">
            ${isCalendarExpanded ? "Hide Calendar" : "View Calendar"}
          </button>
          ${
            !isAcknowledged
              ? `<button class="acknowledge-btn" data-employee-id="${employee.employeeId}">
              Acknowledge Review
            </button>`
              : ""
          }
        </div>

        ${
          isCalendarExpanded
            ? `<div class="inline-calendar-container">
              <div class="nav-header">
                <button class="nav-arrow cal-nav-prev" data-employee-id="${employee.employeeId}" aria-label="Previous month">${NAV_SYMBOLS.PREV}</button>
                <span class="nav-label">${monthLabel}</span>
                <button class="nav-arrow cal-nav-next" data-employee-id="${employee.employeeId}" aria-label="Next month">${NAV_SYMBOLS.NEXT}</button>
              </div>
              <pto-calendar
                month="${calMonth}"
                year="${calYear}"
                readonly="true"
                hide-legend="true"
                hide-header="true"
                data-employee-id="${employee.employeeId}"
              ></pto-calendar>
            </div>`
            : ""
        }
      </div>
    `;
  }
}

// Register the component
customElements.define("admin-monthly-review", AdminMonthlyReview);

import {
  formatDateForDisplay,
  formatTimestampForDisplay,
  addMonths,
  getCurrentMonth,
} from "../../../shared/dateUtils.js";
import { MONTH_NAMES } from "../../../shared/businessRules.js";
import { BaseComponent } from "../base-component.js";
import {
  adoptAnimations,
  adoptNavigation,
  NAV_SYMBOLS,
  animateDismiss,
  animateSlide,
} from "../../css-extensions/index.js";
import {
  aggregatePTORequests,
  type AggregatedPTORequest,
  type PTORequest,
} from "../../shared/aggregate-pto-requests.js";
import { styles } from "./css.js";
// Side-effect import: ensure <pto-calendar> custom element is registered
import "../pto-calendar/index.js";
import type { PtoCalendar, PTOEntry } from "../pto-calendar/index.js";

export type { PTORequest };
export { type AggregatedPTORequest };

export class PtoRequestQueue extends BaseComponent {
  private _requests: PTORequest[] = [];
  /** Employee IDs that have at least one negative balance category. */
  private _negativeBalanceEmployeeIds = new Set<number>();
  /** Track buttons awaiting confirmation. Maps button element to reset timer. */
  private _pendingConfirmations = new Map<HTMLButtonElement, number>();
  /** Track which employee groups have their inline calendar expanded. */
  private _calendarExpandedEmployees: Set<number> = new Set();
  /** Per-employee navigated month (employee ID → YYYY-MM). */
  private _calendarMonths: Map<number, string> = new Map();

  /** Get the set of employee IDs with expanded calendars and their current months. */
  get expandedCalendars(): Map<number, string> {
    const result = new Map<number, string>();
    for (const empId of this._calendarExpandedEmployees) {
      result.set(empId, this._calendarMonths.get(empId) || getCurrentMonth());
    }
    return result;
  }

  connectedCallback() {
    super.connectedCallback();
    adoptAnimations(this.shadowRoot);
    adoptNavigation(this.shadowRoot);
  }

  get requests(): PTORequest[] {
    return this._requests;
  }

  set requests(value: PTORequest[]) {
    this._requests = value;
    this.requestUpdate();
  }

  /** Set the IDs of employees with negative balance (triggers confirm flow). */
  set negativeBalanceEmployees(ids: Set<number>) {
    this._negativeBalanceEmployeeIds = ids;
  }

  /**
   * Inject PTO entries into a specific expanded calendar.
   * Called by the parent page after fetching calendar data in response
   * to a `calendar-data-request` event.
   */
  setCalendarEntries(
    employeeId: number,
    _month: string,
    entries: PTOEntry[],
  ): void {
    const cal = this.shadowRoot.querySelector(
      `pto-calendar[data-employee-id="${employeeId}"]`,
    ) as PtoCalendar | null;
    if (cal) {
      cal.setPtoEntries(entries);
    }
  }

  protected render(): string {
    const pendingRequests = this._requests.filter(
      (r) => r.status === "pending",
    );

    // Aggregate consecutive work-day requests per employee + type
    const aggregated = aggregatePTORequests(pendingRequests);

    // Group aggregated entries by employee
    const employeeGroups = new Map<
      number,
      { name: string; requests: AggregatedPTORequest[] }
    >();
    for (const req of aggregated) {
      let group = employeeGroups.get(req.employeeId);
      if (!group) {
        group = { name: req.employeeName, requests: [] };
        employeeGroups.set(req.employeeId, group);
      }
      group.requests.push(req);
    }

    // Count original pending requests for the stats display
    const totalPending = pendingRequests.length;

    return `
      ${styles}
      <div class="queue-container">
        <div class="queue-header">
          <h2 class="queue-title">PTO Request Queue</h2>
          <div class="queue-stats">
            <div class="stat-item">
              <span class="stat-value">${totalPending}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
        </div>

        <div class="queue-content">
          ${
            totalPending === 0
              ? '<div class="empty-state"><h3>No pending requests</h3><p>All PTO requests have been reviewed.</p></div>'
              : Array.from(employeeGroups.entries())
                  .map(
                    ([empId, group]) => `
                    <div class="employee-group" data-employee-id="${empId}">
                      <div class="employee-group-header">
                        <h3 class="employee-group-name">${group.name} — ${group.requests.reduce((sum, r) => sum + r.requestIds.length, 0)} pending request${group.requests.reduce((sum, r) => sum + r.requestIds.length, 0) !== 1 ? "s" : ""}</h3>
                        <button class="action-btn show-calendar-btn" data-action="show-calendar" data-employee-id="${empId}">${this._calendarExpandedEmployees.has(empId) ? "Hide Calendar" : "Show Calendar"}</button>
                        <slot name="balance-${empId}"></slot>
                      </div>
                      ${this.renderInlineCalendar(empId, group.requests)}
                      <div class="employee-group-cards">
                        ${group.requests.map((req) => this.renderRequestCard(req)).join("")}
                      </div>
                    </div>`,
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  }

  private renderRequestCard(request: AggregatedPTORequest): string {
    const startDate = formatDateForDisplay(request.startDate, {
      dateStyle: "short",
    });
    const endDate = formatDateForDisplay(request.endDate, {
      dateStyle: "short",
    });
    const dateDisplay =
      request.startDate === request.endDate
        ? startDate
        : `${startDate} → ${endDate}`;
    const createdDate = formatTimestampForDisplay(request.createdAt, {
      dateStyle: "short",
    });

    // Primary ID for card identification; all IDs stored in data attribute
    const primaryId = request.requestIds[0];
    const allIds = request.requestIds.join(",");

    return `
      <div class="request-card" data-request-id="${primaryId}" data-request-ids="${allIds}">
        <div class="request-header">
          <span class="request-type ${request.type.replace(" ", "-")}">${request.type}</span>
          <span class="status-badge pending">Pending</span>
        </div>

        <div class="request-details">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value employee-name">${request.employeeName}</span>
          </div>
  
          <div class="detail-item">
            <span class="detail-label">Date Range</span>
            <div class="request-dates">
              <span class="date-range">${dateDisplay}</span>
            </div>
          </div>
          <div class="detail-item">
            <span class="detail-label">Hours Requested</span>
            <span class="detail-value">${request.hours} hrs</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Submitted</span>
            <span class="detail-value">${createdDate}</span>
          </div>
        </div>

        <div class="request-actions">
          <button class="action-btn reject" data-action="reject" data-request-id="${primaryId}" data-request-ids="${allIds}">
            Reject
          </button>
          <button class="action-btn approve" data-action="approve" data-request-id="${primaryId}" data-request-ids="${allIds}">
            Approve
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Animate a card scaling down and fading out (dismiss effect).
   * Called by the parent page after approve/reject. Returns a promise
   * that resolves when the animation completes (or immediately under
   * reduced-motion).
   */
  async dismissCard(requestId: number): Promise<void> {
    const card = this.shadowRoot.querySelector(
      `.request-card[data-request-id="${requestId}"]`,
    ) as HTMLElement | null;

    if (card) {
      const handle = animateDismiss(card);
      await handle.promise;
    }
  }

  /** Render the inline calendar section for an employee group (if expanded). */
  private renderInlineCalendar(
    empId: number,
    requests: AggregatedPTORequest[],
  ): string {
    if (!this._calendarExpandedEmployees.has(empId)) return "";

    // Default month is the first pending request's month
    if (!this._calendarMonths.has(empId) && requests.length > 0) {
      this._calendarMonths.set(empId, requests[0].startDate.slice(0, 7));
    }
    const calMonthStr = this._calendarMonths.get(empId) || getCurrentMonth();
    const [yearStr, monthStr] = calMonthStr.split("-");
    const calYear = parseInt(yearStr, 10);
    const calMonth = parseInt(monthStr, 10);
    const monthLabel = `${MONTH_NAMES[calMonth - 1]} ${calYear}`;

    return `
      <div class="inline-calendar-container" data-employee-id="${empId}">
        <div class="nav-header">
          <button class="nav-arrow cal-nav-prev" data-employee-id="${empId}" aria-label="Previous month">${NAV_SYMBOLS.PREV}</button>
          <span class="nav-label">${monthLabel}</span>
          <button class="nav-arrow cal-nav-next" data-employee-id="${empId}" aria-label="Next month">${NAV_SYMBOLS.NEXT}</button>
        </div>
        <pto-calendar
          month="${calMonth}"
          year="${calYear}"
          readonly="true"
          hide-legend="true"
          hide-header="true"
          data-employee-id="${empId}">
        </pto-calendar>
      </div>
    `;
  }

  /**
   * Dispatch a `calendar-data-request` event so the parent page fetches
   * PTO entries for the given employee + month and injects them back
   * via `setCalendarEntries()`.
   */
  private requestCalendarData(empId: number, month: string): void {
    this.dispatchEvent(
      new CustomEvent("calendar-data-request", {
        bubbles: true,
        composed: true,
        detail: { employeeId: empId, month },
      }),
    );
  }

  /** Toggle the inline calendar for an employee group. */
  private toggleCalendar(
    empId: number,
    requests: AggregatedPTORequest[],
  ): void {
    const expanding = !this._calendarExpandedEmployees.has(empId);

    if (expanding) {
      // Initialize displayed month to the request's month on every open
      if (requests.length > 0) {
        this._calendarMonths.set(empId, requests[0].startDate.slice(0, 7));
      } else {
        this._calendarMonths.set(empId, getCurrentMonth());
      }
      this._calendarExpandedEmployees.add(empId);

      this.requestUpdate();

      // Request calendar data from the parent page (on-demand fetch)
      const month = this._calendarMonths.get(empId) || getCurrentMonth();
      this.requestCalendarData(empId, month);

      // Animate the calendar sliding into view
      requestAnimationFrame(() => {
        const group = this.shadowRoot.querySelector(
          `.employee-group[data-employee-id="${empId}"]`,
        );
        const container = group?.querySelector(
          ".inline-calendar-container",
        ) as HTMLElement | null;
        if (container) {
          animateSlide(container, true);
          container.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    } else {
      // Animate collapse before removing from DOM
      const group = this.shadowRoot.querySelector(
        `.employee-group[data-employee-id="${empId}"]`,
      );
      const container = group?.querySelector(
        ".inline-calendar-container",
      ) as HTMLElement | null;

      const finishCollapse = () => {
        this._calendarExpandedEmployees.delete(empId);
        this._calendarMonths.delete(empId);
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
  private navigateCalendarMonth(empId: number, direction: -1 | 1): void {
    const currentMonth = this._calendarMonths.get(empId) || getCurrentMonth();
    const newMonthDate = addMonths(`${currentMonth}-01`, direction);
    const newMonth = newMonthDate.slice(0, 7);
    this._calendarMonths.set(empId, newMonth);
    this.requestUpdate();

    // Request calendar data for the new month from the parent page
    this.requestCalendarData(empId, newMonth);
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    // Handle calendar month navigation arrows
    if (
      target.classList.contains("cal-nav-prev") ||
      target.classList.contains("cal-nav-next")
    ) {
      const empId = parseInt(target.getAttribute("data-employee-id") || "0");
      if (empId) {
        const direction: -1 | 1 = target.classList.contains("cal-nav-prev")
          ? -1
          : 1;
        this.navigateCalendarMonth(empId, direction);
      }
      return;
    }

    if (!target.classList.contains("action-btn")) return;

    // Handle show-calendar toggle
    if (target.dataset.action === "show-calendar") {
      const empId = parseInt(target.dataset.employeeId || "0");
      if (empId) {
        // Find the requests for this employee to determine default month
        const pendingRequests = this._requests.filter(
          (r) => r.status === "pending",
        );
        const aggregated = aggregatePTORequests(pendingRequests);
        const empRequests = aggregated.filter((r) => r.employeeId === empId);
        this.toggleCalendar(empId, empRequests);
      }
      return;
    }

    const btn = target as HTMLButtonElement;
    const action = btn.dataset.action;
    const requestIdsAttr = btn.dataset.requestIds;
    if (!action || !requestIdsAttr) return;

    const requestIds = requestIdsAttr.split(",").map((id) => parseInt(id, 10));
    const card = btn.closest(".request-card") as HTMLElement | null;
    const group = card?.closest(".employee-group") as HTMLElement | null;
    const empId = group ? parseInt(group.dataset.employeeId ?? "0", 10) : 0;

    // Check if this employee has a negative balance (unusual condition)
    const needsConfirm = this._negativeBalanceEmployeeIds.has(empId);

    if (needsConfirm && !btn.classList.contains("confirming")) {
      // First click: enter confirmation state
      const originalText = btn.textContent?.trim() ?? "";
      btn.classList.add("confirming");
      btn.textContent = `Confirm ${originalText}?`;

      // Auto-revert after 3 seconds
      const timer = window.setTimeout(() => {
        this.resetConfirmation(btn, originalText);
      }, 3000);
      this._pendingConfirmations.set(btn, timer);
      return;
    }

    // Either no confirm needed, or this is the second click (confirmed)
    this.clearConfirmation(btn);

    this.dispatchEvent(
      new CustomEvent(`request-${action}`, {
        detail: { requestId: requestIds[0], requestIds },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private resetConfirmation(
    btn: HTMLButtonElement,
    originalText: string,
  ): void {
    btn.classList.remove("confirming");
    btn.textContent = originalText;
    this._pendingConfirmations.delete(btn);
  }

  private clearConfirmation(btn: HTMLButtonElement): void {
    const timer = this._pendingConfirmations.get(btn);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._pendingConfirmations.delete(btn);
    }
    btn.classList.remove("confirming");
  }
}

customElements.define("pto-request-queue", PtoRequestQueue);

import { querySingle } from "../test-utils";
import { today, parseDate, getCurrentYear } from "../../../shared/dateUtils.js";
import {
  validateHours,
  validatePTOType,
  validateWeekday,
  validatePTOBalance,
  VALIDATION_MESSAGES,
} from "../../../shared/businessRules.js";
import type { MessageKey } from "../../../shared/businessRules.js";
import {
  PtoCalendar,
  monthNames,
  type CalendarEntry,
} from "../pto-calendar/index.js";
import type { MonthSummary } from "../month-summary/index.js";
import { computeSelectionDeltas } from "../utils/compute-selection-deltas.js";
import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";

interface PtoRequest {
  startDate: string;
  endDate: string;
  ptoType: string;
  hours: number;
}

/** Breakpoint at which all 12 months are shown in a grid */
const MULTI_CALENDAR_BREAKPOINT = 960;

export class PtoEntryForm extends BaseComponent {
  /** MediaQueryList used to detect multi-calendar mode */
  private multiCalendarMql: MediaQueryList | null = null;
  /** Bound handler for matchMedia changes */
  private handleMqlChange = (e: MediaQueryListEvent | MediaQueryList) => {
    this.setMultiCalendarMode(e.matches);
  };

  static get observedAttributes() {
    return ["available-pto-balance"];
  }

  get availablePtoBalance(): number {
    return parseFloat(this.getAttribute("available-pto-balance") || "0");
  }

  set availablePtoBalance(v: number) {
    this.setAttribute("available-pto-balance", v.toString());
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;
    // Note: requestUpdate() is intentionally NOT called here.
    // The template is static (no attribute-dependent rendering), and
    // re-rendering would destroy imperatively-built calendars in
    // #calendar-container. The attribute-backed getter (availablePtoBalance)
    // reads directly from getAttribute(), so validation always uses the
    // current value.
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupSwipeListeners();
    this.setupMultiCalendarDetection();
    // After detection, calendars are built. Request PTO data from parent.
    this.dispatchEvent(new CustomEvent("pto-data-request", { bubbles: true }));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  /** Start listening for viewport changes to toggle multi-calendar mode. */
  private setupMultiCalendarDetection(): void {
    this.multiCalendarMql = window.matchMedia(
      `(min-width: ${MULTI_CALENDAR_BREAKPOINT}px)`,
    );
    // Apply initial state — force-build even when the mode matches the default
    this.classList.toggle("multi-calendar", this.multiCalendarMql.matches);
    this.rebuildCalendars();
    // Memory-safe listener tracked for automatic cleanup in disconnectedCallback
    this.addListener(
      this.multiCalendarMql,
      "change",
      this.handleMqlChange as EventListener,
    );
  }

  /** Whether the component is currently in multi-calendar (12-month grid) mode */
  get isMultiCalendar(): boolean {
    return this.classList.contains("multi-calendar");
  }

  /**
   * Toggle between single-calendar and multi-calendar modes.
   * In multi-calendar mode all 12 months are shown in a CSS grid.
   * In single-calendar mode the existing carousel navigation is used.
   */
  private setMultiCalendarMode(enabled: boolean): void {
    if (enabled === this.isMultiCalendar) return;
    this.classList.toggle("multi-calendar", enabled);
    this.rebuildCalendars();
  }

  /**
   * Rebuild the calendar container contents for the current mode.
   * - Single-calendar: one `<pto-calendar>` set to the current month.
   * - Multi-calendar: twelve `<pto-calendar>` instances inside `.month-card` wrappers.
   *
   * IMPERATIVE CONSTRUCTION JUSTIFICATION:
   * The number of child pto-calendar instances varies by responsive mode
   * (1 in single-calendar, 12 in multi-calendar). This dynamic child count
   * cannot be expressed in a static render() template, so imperative
   * createElement/appendChild is used here. This method is only called from
   * lifecycle-adjacent code (setupMultiCalendarDetection, setMultiCalendarMode)
   * and the public reset() method — never from render().
   *
   * render() returns the static shell only (#calendar-container is empty).
   * requestUpdate() does NOT destroy imperative content because the
   * attributeChangedCallback intentionally skips requestUpdate() — the template
   * has no attribute-dependent rendering.
   */
  private rebuildCalendars(): void {
    const container = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadowRoot,
    );

    // Preserve existing PTO entries from the current calendar(s) so
    // they can be pushed into the new calendar instances.
    const existingEntries = this.collectPtoEntries();

    container.innerHTML = "";

    const year = getCurrentYear();

    if (this.isMultiCalendar) {
      for (let m = 1; m <= 12; m++) {
        const card = document.createElement("div");
        card.className = "month-card";
        card.dataset.month = m.toString();

        const cal = document.createElement("pto-calendar") as PtoCalendar;
        cal.setAttribute("month", m.toString());
        cal.setAttribute("year", year.toString());
        cal.setAttribute("selected-month", m.toString());
        cal.setAttribute("readonly", "false");
        cal.setAttribute("hide-legend", "true");

        const summary = document.createElement("month-summary") as MonthSummary;

        // Filter existing entries for this month
        const monthEntries = existingEntries.filter(
          (e) => parseDate(e.date).month === m,
        );
        cal.ptoEntries = monthEntries;

        card.appendChild(cal);
        card.appendChild(summary);
        container.appendChild(card);
      }

      // Wire up selection-changed across all calendars (handled by persistent listener)
    } else {
      // Single-calendar mode
      const cal = document.createElement("pto-calendar") as PtoCalendar;
      cal.setAttribute("readonly", "false");
      cal.setAttribute("hide-header", "true");

      const currentDate = today();
      const { month } = parseDate(currentDate);
      cal.setAttribute("month", month.toString());
      cal.setAttribute("year", year.toString());
      cal.setAttribute("selected-month", month.toString());

      cal.ptoEntries = existingEntries;

      container.appendChild(cal);

      // Update the external month label
      this.updateMonthLabel(month, year);
    }
  }

  /**
   * Collect PTO entries from all currently rendered calendars.
   * Used to preserve data when switching between single/multi-calendar modes.
   */
  private collectPtoEntries(): any[] {
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return [];

    const calendars = container.querySelectorAll("pto-calendar");
    const entries: any[] = [];
    calendars.forEach((cal) => {
      entries.push(...(cal as PtoCalendar).ptoEntries);
    });
    return entries;
  }

  /**
   * Handle selection-changed events from any calendar in multi-calendar mode.
   * Updates the corresponding month-summary deltas.
   */
  private handleMultiCalendarSelectionChanged(e: Event): void {
    const calendar = e.target as PtoCalendar;
    if (!calendar) return;

    const month = calendar.month;
    const card = this.shadowRoot.querySelector(
      `.month-card[data-month="${month}"]`,
    );
    if (!card) return;

    const summary = card.querySelector("month-summary") as MonthSummary | null;
    if (!summary) return;

    const selectedRequests = calendar.getSelectedRequests();
    const existingEntries = calendar.ptoEntries;
    const deltas = computeSelectionDeltas(selectedRequests, existingEntries);
    summary.deltas = deltas;
  }

  protected render(): string {
    return `
            <style>${styles}</style>

            <div class="form-container">
                <slot name="pto-summary"></slot>

                <div class="calendar-header-nav">
                    <button type="button" class="nav-arrow" id="prev-month-btn" data-action="prev-month" aria-label="Previous month">←</button>
                    <span class="calendar-month-label" id="calendar-month-label"></span>
                    <button type="button" class="nav-arrow" id="next-month-btn" data-action="next-month" aria-label="Next month">→</button>
                </div>

                <div class="calendar-view" id="calendar-view">
                    <div id="calendar-container" class="calendar-container"></div>
                </div>
            </div>
        `;
  }

  // ── Event delegation ──

  private _customEventsSetup = false;

  protected setupEventDelegation(): void {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;

    // Submit event from parent (e.g. submit-time-off-page)
    this.addEventListener("submit", () => this.handleUnifiedSubmit());

    // Selection-changed events bubble from pto-calendar instances
    this.shadowRoot.addEventListener("selection-changed", (e: Event) => {
      if (this.isMultiCalendar) {
        this.handleMultiCalendarSelectionChanged(e);
      }
    });
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const actionEl = target.closest<HTMLElement>("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === "prev-month") {
      const calendar = this.getCalendar();
      if (calendar) this.navigateMonthWithAnimation(calendar, -1);
    } else if (action === "next-month") {
      const calendar = this.getCalendar();
      if (calendar) this.navigateMonthWithAnimation(calendar, 1);
    }
  }

  // ── Swipe navigation ──

  private _swipeStartX: number | null = null;
  private _swipeStartY: number | null = null;

  /**
   * Register touch listeners on #calendar-container for swipe month navigation.
   * Uses addListener() for memory-safe automatic cleanup in disconnectedCallback.
   */
  private setupSwipeListeners(): void {
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return;

    // Touch event listeners for swipe gesture detection
    // Purpose: Enable intuitive month navigation on touch devices
    // Performance: Minimal event listeners, hardware-accelerated animations
    // Accessibility: Works with screen readers, respects reduced motion preferences
    this.addListener(container, "touchstart", ((e: TouchEvent) => {
      this._swipeStartX = e.touches[0].clientX;
      this._swipeStartY = e.touches[0].clientY;
    }) as EventListener);

    this.addListener(container, "touchend", ((e: TouchEvent) => {
      if (this._swipeStartX === null || this._swipeStartY === null) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - this._swipeStartX;
      const deltaY = endY - this._swipeStartY;

      // Minimum swipe distance threshold (50px) to prevent accidental navigation
      const minSwipeDistance = 50;

      // Ensure horizontal swipe is dominant over vertical scrolling
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > minSwipeDistance
      ) {
        const calendar = this.getCalendar();
        if (!calendar) return;

        // Trigger smooth month navigation with visual feedback
        // Direction: positive = next month, negative = previous month
        this.navigateMonthWithAnimation(calendar, deltaX > 0 ? -1 : 1);
      }

      // Reset touch coordinates
      this._swipeStartX = null;
      this._swipeStartY = null;
    }) as EventListener);
  }

  private isAnimating = false;

  /** Check if user prefers reduced motion */
  private prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Carousel-style month navigation animation.
   * Phase 1: Old month slides out in the swipe direction.
   * Phase 2: Container instantly jumps to the opposite side (off-screen).
   * Phase 3: New month slides in from the opposite side to center.
   *
   * Uses inline styles + forced reflow for reliable phase sequencing.
   * Filters transitionend by propertyName to avoid double-firing.
   */
  private navigateMonthWithAnimation(calendar: PtoCalendar, direction: number) {
    // Prevent overlapping animations
    if (this.isAnimating) return;
    this.isAnimating = true;

    const container = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadowRoot,
    );

    // direction > 0 = next month: old exits left (-100%), new enters from right (+100%)
    // direction < 0 = prev month: old exits right (+100%), new enters from left (-100%)
    const exitX = direction > 0 ? "-100%" : "100%";
    const enterX = direction > 0 ? "100%" : "-100%";

    const transitionValue =
      "transform 0.2s ease-in-out, opacity 0.2s ease-in-out";

    // Accessibility: skip animation for reduced-motion preference
    if (this.prefersReducedMotion()) {
      this.updateCalendarMonth(calendar, direction);
      this.isAnimating = false;
      return;
    }

    // GPU hint for the animation duration
    container.style.willChange = "transform, opacity";
    container.style.transition = transitionValue;

    // Phase 1: Slide old month out
    container.style.transform = `translateX(${exitX})`;
    container.style.opacity = "0";

    const onSlideOutDone = (e: TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      container.removeEventListener("transitionend", onSlideOutDone);

      // Update month data while container is off-screen
      this.updateCalendarMonth(calendar, direction);

      // Phase 2: Instantly jump to opposite side (no transition)
      container.style.transition = "none";
      container.style.transform = `translateX(${enterX})`;

      // Force synchronous style recalculation so the browser commits the position
      void container.offsetHeight;

      // Phase 3: Slide new month in from opposite side to center
      container.style.transition = transitionValue;
      container.style.transform = "translateX(0)";
      container.style.opacity = "1";

      const onSlideInDone = (e: TransitionEvent) => {
        if (e.propertyName !== "transform") return;
        container.removeEventListener("transitionend", onSlideInDone);
        // Clean up all inline animation styles
        container.style.willChange = "";
        container.style.transition = "";
        container.style.transform = "";
        container.style.opacity = "";
        this.isAnimating = false;
      };
      container.addEventListener("transitionend", onSlideInDone);
    };
    container.addEventListener("transitionend", onSlideOutDone);
  }

  /** Update the calendar to the next/previous month with fiscal-year wrap-around */
  private updateCalendarMonth(calendar: PtoCalendar, direction: number): void {
    let newMonth = calendar.month + direction;
    const newYear = calendar.year;

    if (newMonth < 1) {
      newMonth = 12;
    } else if (newMonth > 12) {
      newMonth = 1;
    }

    calendar.setAttribute("month", newMonth.toString());
    calendar.setAttribute("year", newYear.toString());
    calendar.setAttribute("selected-month", newMonth.toString());
    this.updateMonthLabel(newMonth, newYear);
  }

  /** Update the month label text displayed in the custom navigation header. */
  private updateMonthLabel(month: number, year: number): void {
    const label = this.shadowRoot.querySelector("#calendar-month-label");
    if (label) {
      label.textContent = `${monthNames[month - 1]} ${year}`;
    }
  }

  private handleCalendarSubmit(): void {
    const requests = this.getSelectedRequests();
    if (requests.length === 0) {
      this.emitValidationErrors([
        "Select at least one weekday in the calendar.",
      ]);
      return;
    }

    const validationErrors = this.validateCalendarRequests(requests);
    if (validationErrors.length > 0) {
      this.emitValidationErrors(validationErrors);
      return;
    }

    this.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests },
        bubbles: true,
      }),
    );
  }

  private handleUnifiedSubmit(): void {
    this.handleCalendarSubmit();
  }

  private validateCalendarRequests(requests: CalendarEntry[]): string[] {
    const errors: string[] = [];

    for (const request of requests) {
      // Zero hours = unschedule/delete an existing entry; skip validation
      if (request.hours === 0) {
        continue;
      }

      const hoursError = validateHours(request.hours);
      if (hoursError) {
        errors.push(
          `${request.date}: ${VALIDATION_MESSAGES[hoursError.messageKey as MessageKey]}`,
        );
      }

      // Check PTO balance if type is PTO (skip for editing existing entries)
      if (request.type === "PTO" && !request.id) {
        const balanceError = validatePTOBalance(
          request.hours,
          this.availablePtoBalance,
        );
        if (balanceError) {
          errors.push(
            `${request.date}: ${VALIDATION_MESSAGES[balanceError.messageKey as MessageKey]}`,
          );
        }
      }

      try {
        const weekdayError = validateWeekday(request.date);
        if (weekdayError) {
          errors.push(
            `${request.date}: ${VALIDATION_MESSAGES[weekdayError.messageKey as MessageKey]}`,
          );
        }
      } catch (error) {
        errors.push(`${request.date}: ${VALIDATION_MESSAGES["date.invalid"]}`);
      }

      const typeError = validatePTOType(request.type);
      if (typeError) {
        errors.push(
          `${request.date}: ${VALIDATION_MESSAGES[typeError.messageKey as MessageKey]}`,
        );
      }
    }

    return errors;
  }

  /** Return all pto-calendar instances currently in the container. */
  private getAllCalendars(): PtoCalendar[] {
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return [];
    return Array.from(
      container.querySelectorAll("pto-calendar"),
    ) as PtoCalendar[];
  }

  /** Return the single-mode calendar (first pto-calendar in the container). */
  private getCalendar(): PtoCalendar | null {
    const calendarContainer = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadowRoot,
    );
    return calendarContainer.querySelector(
      "pto-calendar",
    ) as PtoCalendar | null;
  }

  private emitValidationErrors(messages: string[]): void {
    this.dispatchEvent(
      new CustomEvent("pto-validation-error", {
        detail: { errors: messages },
        bubbles: true,
      }),
    );
  }

  // Public methods for external control
  reset() {
    // Clear all calendar selections
    for (const cal of this.getAllCalendars()) {
      cal.clearSelection();
    }

    // Rebuild calendars to their default state
    this.rebuildCalendars();
    this.dispatchEvent(new CustomEvent("pto-data-request", { bubbles: true }));
  }

  focus() {
    // Calendar handles its own focus automatically
  }

  /** Return the selected requests from all pto-calendar instance(s). */
  getSelectedRequests(): CalendarEntry[] {
    const all: CalendarEntry[] = [];
    for (const cal of this.getAllCalendars()) {
      all.push(...cal.getSelectedRequests());
    }
    return all;
  }

  /** Return the existing PTO entries loaded into all pto-calendar instance(s). */
  getPtoEntries(): ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
  }> {
    return this.collectPtoEntries();
  }

  setPtoData(ptoEntries: any[]) {
    if (this.isMultiCalendar) {
      // Distribute entries to their respective month calendars
      for (const cal of this.getAllCalendars()) {
        const month = cal.month;
        cal.ptoEntries = ptoEntries.filter(
          (e) => parseDate(e.date).month === month,
        );
      }
    } else {
      const calendar = this.getCalendar();
      if (calendar) {
        calendar.ptoEntries = ptoEntries;
      }
    }
  }

  setPtoStatus(status: any) {
    this.availablePtoBalance = status.availablePTO || 0;
  }

  /**
   * Navigate the internal calendar to the specified month and year.
   * Called when the user clicks a date in a PTO detail card on the summary page.
   */
  navigateToMonth(month: number, year: number): void {
    if (this.isMultiCalendar) {
      // In multi-calendar mode, scroll the target month card into view
      const card = this.shadowRoot.querySelector(
        `.month-card[data-month="${month}"]`,
      );
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });

        // Brief highlight animation — accessibility: skip for reduced-motion
        if (!this.prefersReducedMotion()) {
          card.classList.add("highlight");
          setTimeout(() => card.classList.remove("highlight"), 1200);
        }
      }
    } else {
      const calendar = this.getCalendar();
      if (calendar) {
        calendar.setAttribute("month", month.toString());
        calendar.setAttribute("year", year.toString());
        calendar.setAttribute("selected-month", month.toString());
        this.updateMonthLabel(month, year);
      }
    }
  }
}

customElements.define("pto-entry-form", PtoEntryForm);

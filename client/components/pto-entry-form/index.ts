interface PtoRequest {
  startDate: string;
  endDate: string;
  ptoType: string;
  hours: number;
}

import { querySingle } from "../test-utils";
import { today, parseDate } from "../../../shared/dateUtils.js";
import {
  validateHours,
  validatePTOType,
  validateWeekday,
  validatePTOBalance,
  VALIDATION_MESSAGES,
} from "../../../shared/businessRules.js";
import type { MessageKey } from "../../../shared/businessRules.js";
import { PtoCalendar, type CalendarEntry } from "../pto-calendar/index.js";

export class PtoEntryForm extends HTMLElement {
  private shadow: ShadowRoot;
  private availablePtoBalance: number = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["available-pto-balance"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "available-pto-balance") {
      this.availablePtoBalance = parseFloat(newValue) || 0;
    }
  }

  connectedCallback() {
    this.render();
    this.initializeCalendarDefaults();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    // Clean up event listeners if needed
  }

  private initializeCalendarDefaults(): void {
    // Ensure calendar is ready and set to current month
    this.ensureCalendarReady();
  }

  private ensureCalendarReady(): void {
    const calendarContainer = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadow,
    );
    let calendar = calendarContainer.querySelector<PtoCalendar>("pto-calendar");

    if (!calendar) {
      calendar = document.createElement("pto-calendar") as PtoCalendar;
      calendar.setAttribute("readonly", "false");

      calendarContainer.appendChild(calendar);
    }

    // Set calendar to current month
    const currentDate = today();
    const { year, month } = parseDate(currentDate);
    calendar.setAttribute("month", month.toString());
    calendar.setAttribute("year", year.toString());
    calendar.setAttribute("selected-month", month.toString());

    // Request PTO data from parent
    this.dispatchEvent(new CustomEvent("pto-data-request"));
  }

  private render() {
    this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: var(--color-surface);
                    border-radius: var(--border-radius-lg);
                    box-shadow: var(--shadow-md);
                    max-width: clamp(480px, 100cqw, 60vh);
                    margin: 0 auto;
                }

                .form-container {
                    padding: var(--space-sm);
                }

                .form-header {
                    margin-bottom: var(--space-lg);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .form-header h2 {
                    margin: 0;
                    font-size: var(--font-size-xl);
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .btn {
                    padding: var(--space-sm) var(--space-lg);
                    border: none;
                    border-radius: var(--border-radius-md);
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    transition: all 0.3s ease;
                    min-width: 80px;
                }

                .btn-primary {
                    background: var(--color-primary);
                    color: white;
                }

                .btn-primary:hover {
                    background: var(--color-primary-hover, var(--color-primary));
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    background: var(--color-secondary, var(--color-surface));
                    color: var(--color-text);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                }

                .btn-secondary:hover {
                    background: var(--color-surface-hover, var(--color-surface));
                }

                .hidden {
                    display: none;
                }

                ::slotted([slot="pto-summary"]) {
                    display: block;
                    margin-bottom: var(--space-md);
                }

                .calendar-view {
                    margin-top: var(--space-md);
                    position: relative;
                    overflow: hidden;
                }

                .calendar-container {
                    /* Animation is driven by inline styles in navigateMonthWithAnimation() */
                }

                .calendar-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: var(--space-md);
                }

                .calendar-title {
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .calendar-navigation {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                }

                .nav-arrow {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: var(--font-size-xl);
                    color: var(--color-text);
                    padding: var(--space-xs);
                    border-radius: var(--border-radius-sm);
                    transition: background-color 0.2s ease;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .nav-arrow:hover {
                    background: var(--color-surface-hover);
                }

                .nav-arrow:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Hide navigation arrows on touch devices */
                @media (hover: none) and (pointer: coarse) {
                    .nav-arrow {
                        display: none;
                    }
                }

                .required {
                    color: var(--color-error);
                }

                /* Responsive design */
                @media screen {
                  .form-actions {
                    display: flex;
                  }
                }

                @media (max-width: 768px) {
                    .form-actions {
                        flex-wrap: wrap;
                        gap: var(--space-sm);
                    }

                    .btn {
                        flex: 1;
                        min-width: 120px;
                    }
                }
            </style>

            <div class="form-container">
                <div class="form-header">
                    <h2>Submit Time Off</h2>
                    <div class="calendar-toolbar">
                        <div class="calendar-navigation">
                            <button type="button" class="nav-arrow" id="prev-month-btn" aria-label="Previous month">←</button>
                            <button type="button" class="nav-arrow" id="next-month-btn" aria-label="Next month">→</button>
                        </div>
                    </div>
                </div>

                <slot name="pto-summary"></slot>

                <div class="calendar-view" id="calendar-view">
                    <div id="calendar-container" class="calendar-container"></div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" id="submit-btn">
                        Submit
                    </button>
                </div>
            </div>
        `;
  }

  private setupEventListeners() {
    const cancelBtn = querySingle<HTMLButtonElement>(
      "#cancel-btn",
      this.shadow,
    );
    const submitBtn = querySingle<HTMLButtonElement>(
      "#submit-btn",
      this.shadow,
    );
    const prevMonthBtn = querySingle<HTMLButtonElement>(
      "#prev-month-btn",
      this.shadow,
    );
    const nextMonthBtn = querySingle<HTMLButtonElement>(
      "#next-month-btn",
      this.shadow,
    );
    cancelBtn?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("form-cancel"));
    });

    submitBtn?.addEventListener("click", () => {
      this.handleUnifiedSubmit();
    });

    prevMonthBtn?.addEventListener("click", () => {
      const calendar = this.getCalendar();
      if (calendar) {
        this.navigateMonthWithAnimation(calendar, -1); // Previous month
      }
    });

    nextMonthBtn?.addEventListener("click", () => {
      const calendar = this.getCalendar();
      if (calendar) {
        this.navigateMonthWithAnimation(calendar, 1); // Next month
      }
    });

    // Add swipe navigation to calendar
    this.setupSwipeNavigation();
  }

  private setupSwipeNavigation() {
    const calendarContainer = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadow,
    );

    let startX: number | null = null;
    let startY: number | null = null;

    // Touch event listeners for swipe gesture detection
    // Purpose: Enable intuitive month navigation on touch devices
    // Performance: Minimal event listeners, hardware-accelerated animations
    // Accessibility: Works with screen readers, respects reduced motion preferences
    calendarContainer?.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    calendarContainer?.addEventListener("touchend", (e) => {
      if (startX === null || startY === null) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

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
      startX = null;
      startY = null;
    });
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
      this.shadow,
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
  }

  private handleCalendarSubmit(): void {
    const calendar = this.getCalendar();
    if (!calendar) {
      this.emitValidationErrors(["Calendar is not ready. Please try again."]);
      return;
    }

    const requests = calendar.getSelectedRequests();
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

  private getCalendar(): PtoCalendar | null {
    const calendarContainer = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadow,
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
    // Clear calendar selections
    const calendar = this.getCalendar();
    if (calendar) {
      calendar.clearSelection();
    }

    // Reinitialize calendar defaults
    this.initializeCalendarDefaults();
  }

  focus() {
    // Calendar handles its own focus automatically
  }

  setPtoData(ptoEntries: any[]) {
    const calendar = this.getCalendar();
    if (calendar) {
      calendar.ptoEntries = ptoEntries;
    }
  }

  setPtoStatus(status: any) {
    this.availablePtoBalance = status.availablePTO || 0;
  }
}

customElements.define("pto-entry-form", PtoEntryForm);

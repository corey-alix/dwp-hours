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
                    max-width: 500px;
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

                .submit-errors {
                    margin-top: var(--space-md);
                    padding: var(--space-sm) var(--space-md);
                    border-radius: var(--border-radius-md);
                    border: var(--border-width) var(--border-style-solid) var(--color-error);
                    background: var(--color-error-light, rgba(220, 53, 69, 0.08));
                    color: var(--color-error);
                    font-size: var(--font-size-sm);
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }

                .submit-errors:hover {
                    opacity: 0.8;
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

                .calendar-view {
                    margin-top: var(--space-md);
                    position: relative;
                    overflow: hidden;
                }

                .calendar-container {
                    /* Performance: Use will-change for GPU acceleration during swipe animations */
                    will-change: transform, opacity;
                    /* Smooth transitions for month navigation with hardware acceleration */
                    transition: transform var(--animation-duration-fast, 0.3s) var(--animation-easing, ease-in-out),
                                opacity var(--animation-duration-fast, 0.3s) var(--animation-easing, ease-in-out);
                }

                /* Swipe animation states - slide out directions */
                .calendar-container.slide-left {
                    transform: translateX(-100%);
                    opacity: 0;
                }

                .calendar-container.slide-right {
                    transform: translateX(100%);
                    opacity: 0;
                }

                /* Swipe animation state - slide in */
                .calendar-container.slide-in {
                    transform: translateX(0);
                    opacity: 1;
                }

                /* Accessibility: Respect reduced motion preferences */
                @media (prefers-reduced-motion: reduce) {
                    .calendar-container {
                        /* Disable animations for users who prefer reduced motion */
                        transition: none;
                        will-change: auto;
                    }

                    .calendar-container.slide-left,
                    .calendar-container.slide-right,
                    .calendar-container.slide-in {
                        /* Static positioning for reduced motion */
                        transform: none;
                        opacity: 1;
                    }
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

                <div class="calendar-view" id="calendar-view">
                    <div id="calendar-container" class="calendar-container"></div>
                </div>

                <div class="submit-errors hidden" id="submit-errors" role="alert" aria-live="polite"></div>

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
    const submitErrors = querySingle<HTMLDivElement>(
      "#submit-errors",
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

    submitErrors?.addEventListener("click", () => {
      this.clearSubmitErrors();
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

  private navigateMonthWithAnimation(calendar: PtoCalendar, direction: number) {
    const calendarContainer = querySingle<HTMLDivElement>(
      "#calendar-container",
      this.shadow,
    );

    // Performance optimization: Force GPU compositing during animation
    calendarContainer.style.willChange = "transform, opacity";

    // Apply slide-out animation class
    const slideClass = direction > 0 ? "slide-left" : "slide-right";
    calendarContainer.classList.add(slideClass);

    // Use requestAnimationFrame for better timing control
    requestAnimationFrame(() => {
      // Change month after animation starts (half the transition duration)
      setTimeout(() => {
        let newMonth = calendar.month + direction;
        let newYear = calendar.year;

        // Constrain to fiscal year (January-December) with wrap-around
        if (newMonth < 1) {
          newMonth = 12; // Wrap to December of the same year
          // newYear stays the same for fiscal year constraint
        } else if (newMonth > 12) {
          newMonth = 1; // Wrap to January of the same year
          // newYear stays the same for fiscal year constraint
        }

        // Update calendar attributes
        calendar.setAttribute("month", newMonth.toString());
        calendar.setAttribute("year", newYear.toString());
        calendar.setAttribute("selected-month", newMonth.toString());

        // Apply slide-in animation
        calendarContainer.classList.remove(slideClass);
        calendarContainer.classList.add("slide-in");

        // Clean up animation classes and performance hints after transition completes
        setTimeout(() => {
          calendarContainer.classList.remove("slide-in");
          // Remove will-change to free up GPU resources
          calendarContainer.style.willChange = "auto";
        }, 300); // Match CSS transition duration
      }, 150); // Half the transition duration for smooth overlap
    });
  }

  private handleCalendarSubmit(): void {
    const calendar = this.getCalendar();
    if (!calendar) {
      this.showSubmitErrors(["Calendar is not ready. Please try again."]);
      return;
    }

    const requests = calendar.getSelectedRequests();
    if (requests.length === 0) {
      this.showSubmitErrors(["Select at least one weekday in the calendar."]);
      return;
    }

    const validationErrors = this.validateCalendarRequests(requests);
    if (validationErrors.length > 0) {
      this.showSubmitErrors(validationErrors);
      return;
    }

    this.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests },
      }),
    );
  }

  private handleUnifiedSubmit(): void {
    this.clearSubmitErrors();
    this.handleCalendarSubmit();
  }

  private validateCalendarRequests(requests: CalendarEntry[]): string[] {
    const errors: string[] = [];

    for (const request of requests) {
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

  private showSubmitErrors(messages: string[]): void {
    const submitErrors = querySingle<HTMLDivElement>(
      "#submit-errors",
      this.shadow,
    );
    if (messages.length === 1) {
      submitErrors.textContent = messages[0];
    } else {
      submitErrors.innerHTML = `<ul>${messages.map((message) => `<li>${message}</li>`).join("")}</ul>`;
    }
    submitErrors.classList.remove("hidden");
  }

  private clearSubmitErrors(): void {
    const submitErrors = querySingle<HTMLDivElement>(
      "#submit-errors",
      this.shadow,
    );
    submitErrors.textContent = "";
    submitErrors.classList.add("hidden");
  }

  // Public methods for external control
  reset() {
    // Clear calendar selections
    const calendar = this.getCalendar();
    if (calendar) {
      calendar.clearSelection();
    }

    // Clear submit errors
    this.clearSubmitErrors();

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

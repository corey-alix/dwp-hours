import {
  validateHours,
  validateWeekday,
  validatePTOType,
  VALIDATION_MESSAGES,
  MessageKey,
} from "../../../shared/businessRules.js";
import {
  getCalendarDates,
  isInMonth,
  getDayOfWeek,
  parseDate,
  isWeekend,
} from "../../../shared/dateUtils.js";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PTO_TYPE_COLORS: Record<string, string> = {
  PTO: "var(--color-pto-vacation)",
  Sick: "var(--color-pto-sick)",
  Bereavement: "var(--color-pto-bereavement)",
  "Jury Duty": "var(--color-pto-jury-duty)",
  "Work Day": "var(--color-surface)",
};

export interface CalendarEntry {
  date: string;
  hours: number;
  type: string;
  id?: number; // For existing entries being updated
}

export interface PTOEntry {
  id: number;
  employeeId: number;
  date: string;
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string;
  approved_by?: number | null;
}

export class PtoCalendar extends HTMLElement {
  private shadow: ShadowRoot;
  private month: number;
  private year: number;
  private ptoEntries: PTOEntry[];
  private selectedMonth: number | null;
  private readonly: boolean;
  private selectedPtoType: string | null;
  private selectedCells: Map<string, number>;
  private focusedDate: string | null = null;
  private focusedLegendIndex: number = 0;
  private lastFocusArea: "legend" | "grid" | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.month = 1;
    this.year = 2024;
    this.ptoEntries = [];
    this.selectedMonth = null;
    this.readonly = true;
    this.selectedPtoType = null;
    this.selectedCells = new Map();
  }

  static get observedAttributes() {
    return ["month", "year", "pto-entries", "selected-month", "readonly"];
  }

  connectedCallback() {
    this.render();
    this.shadow.addEventListener("keydown", (e) =>
      this.handleKeyDown(e as KeyboardEvent),
    );
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case "month":
        this.month = parseInt(newValue, 10);
        this.focusedDate = null;
        break;
      case "year":
        this.year = parseInt(newValue, 10);
        this.focusedDate = null;
        break;
      case "pto-entries":
        try {
          this.ptoEntries = JSON.parse(newValue);
          console.log("PtoCalendar: Setting ptoEntries:", this.ptoEntries);
        } catch (e) {
          this.ptoEntries = [];
          console.log("PtoCalendar: Failed to parse pto-entries:", newValue);
        }
        break;
      case "selected-month":
        this.selectedMonth =
          newValue === "null" ? null : parseInt(newValue, 10);
        break;
      case "readonly":
        this.readonly = newValue === "true";
        // Set default PTO type to "PTO" when entering editable mode
        if (!this.readonly && this.selectedPtoType === null) {
          this.selectedPtoType = "PTO";
        }
        break;
    }
    this.render();
  }

  setMonth(month: number) {
    this.month = month;
    this.setAttribute("month", month.toString());
  }

  setYear(year: number) {
    this.year = year;
    this.setAttribute("year", year.toString());
  }

  setPtoEntries(ptoEntries: PTOEntry[]) {
    this.ptoEntries = ptoEntries;
    this.setAttribute("pto-entries", JSON.stringify(ptoEntries));
  }

  setSelectedMonth(selectedMonth: number | null) {
    this.selectedMonth = selectedMonth;
    this.setAttribute(
      "selected-month",
      selectedMonth === null ? "null" : selectedMonth.toString(),
    );
  }

  setReadonly(readonly: boolean) {
    this.readonly = readonly;
    // Set default PTO type to "PTO" when entering editable mode
    if (!readonly && this.selectedPtoType === null) {
      this.selectedPtoType = "PTO";
    }
    this.setAttribute("readonly", readonly.toString());
  }

  getSelectedRequests(): CalendarEntry[] {
    return Array.from(this.selectedCells.entries()).map(([date, hours]) => {
      const existingEntry = this.ptoEntries.find(
        (entry) => entry.date === date,
      );
      return {
        date,
        hours,
        type: existingEntry?.type || this.selectedPtoType || "PTO",
        id: existingEntry?.id,
      };
    });
  }

  clearSelection() {
    this.selectedPtoType = null;
    this.selectedCells.clear();
    this.render();
  }

  submitRequest() {
    const requests = this.getSelectedRequests();
    console.log("PtoCalendar.submitRequest called, requests:", requests);
    if (requests.length === 0) {
      console.log("No requests to submit");
      return;
    }

    // Client-side validation
    const validationErrors: string[] = [];
    for (const request of requests) {
      const hoursError = validateHours(request.hours);
      if (hoursError) {
        validationErrors.push(
          `${request.date}: ${VALIDATION_MESSAGES[hoursError.messageKey as MessageKey]}`,
        );
      }
      const weekdayError = validateWeekday(request.date);
      if (weekdayError) {
        validationErrors.push(
          `${request.date}: ${VALIDATION_MESSAGES[weekdayError.messageKey as MessageKey]}`,
        );
      }
      const typeError = validatePTOType(request.type);
      if (typeError) {
        validationErrors.push(
          `${request.date}: ${VALIDATION_MESSAGES[typeError.messageKey as MessageKey]}`,
        );
      }
    }

    if (validationErrors.length > 0) {
      // Dispatch validation error event
      const errorEvent = new CustomEvent("pto-validation-error", {
        detail: { errors: validationErrors },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(errorEvent);
      return;
    }

    const event = new CustomEvent("pto-request-submit", {
      detail: { requests },
      bubbles: true,
      composed: true,
    });
    console.log(
      "Dispatching pto-request-submit event from pto-calendar:",
      event,
    );
    this.dispatchEvent(event);
  }

  private renderCalendar(): string {
    console.log(
      "PtoCalendar.renderCalendar called for month:",
      this.month,
      "year:",
      this.year,
      "ptoEntries:",
      this.ptoEntries,
    );

    const calendarDates = getCalendarDates(this.year, this.month);
    const calendarDays: {
      dateStr: string;
      isCurrentMonth: boolean;
      entry?: PTOEntry;
      totalHours: number;
      hasApprovedEntry: boolean;
    }[] = [];

    for (const dateStr of calendarDates) {
      const entriesForDate = this.ptoEntries.filter((e) => e.date === dateStr);
      const totalHours = entriesForDate.reduce((sum, e) => sum + e.hours, 0);
      const entry = entriesForDate.length > 0 ? entriesForDate[0] : null;
      const hasApprovedEntry = entriesForDate.some(
        (e) => e.approved_by !== null,
      );
      if (dateStr === "2026-03-01") {
        console.log(
          "PtoCalendar: March 1 dateStr:",
          dateStr,
          "entriesForDate:",
          entriesForDate,
          "totalHours:",
          totalHours,
          "entry:",
          entry,
          "hasApprovedEntry:",
          hasApprovedEntry,
        );
      }
      calendarDays.push({
        dateStr,
        isCurrentMonth: isInMonth(dateStr, this.year, this.month),
        entry: entry ?? undefined,
        totalHours,
        hasApprovedEntry,
      });
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return `
            <div class="calendar">
                <div class="calendar-header">
                    ${monthNames[this.month - 1]} ${this.year}
                </div>
                <div class="calendar-grid">
                    ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
                    ${calendarDays
                      .map(
                        ({
                          dateStr,
                          isCurrentMonth,
                          entry,
                          totalHours,
                          hasApprovedEntry,
                        }) => {
                          const isSelected = this.selectedCells.has(dateStr);
                          const selectedHours =
                            this.selectedCells.get(dateStr) || 8;
                          const isWeekendDate = isWeekend(dateStr);
                          const isNav = isCurrentMonth && !isWeekendDate;
                          const dayClass = entry
                            ? `day has-pto type-${entry.type.replace(/\s+/g, "-")}`
                            : isSelected && this.selectedPtoType
                              ? `day type-${this.selectedPtoType.replace(/\s+/g, "-")}`
                              : "day";
                          const emptyClass = isCurrentMonth ? "" : "empty";
                          const selectedClass = isSelected ? "selected" : "";
                          const clickableClass =
                            !this.readonly && isNav ? "clickable" : "";
                          const tabindexAttr = clickableClass
                            ? `tabindex="${dateStr === this.focusedDate ? "0" : "-1"}"`
                            : "";
                          const hoursDisplay =
                            totalHours > 0
                              ? totalHours.toFixed(0)
                              : isSelected
                                ? selectedHours.toFixed(0)
                                : "";
                          const checkmarkElement = hasApprovedEntry
                            ? '<div class="checkmark">✓</div>'
                            : "";
                          const { day } = parseDate(dateStr);
                          return `
                            <div class="${dayClass} ${emptyClass} ${selectedClass} ${clickableClass}" data-date="${dateStr}" ${tabindexAttr} role="gridcell">
                                ${checkmarkElement}
                                <div class="date">${day}</div>
                                <div class="hours">${hoursDisplay}</div>
                            </div>
                        `;
                        },
                      )
                      .join("")}
                </div>
                <div class="legend" role="listbox" aria-label="PTO type selection">
                    ${Object.entries(PTO_TYPE_COLORS)
                      .map(
                        ([type, color], index) => `
                        <div class="legend-item ${this.selectedPtoType === type ? "selected" : ""} ${this.readonly ? "" : "clickable"}" data-type="${type}" ${!this.readonly ? `tabindex="${index === this.focusedLegendIndex ? "0" : "-1"}" role="option" aria-selected="${this.selectedPtoType === type}"` : ""}>
                            <div class="legend-swatch" style="background: ${color}"></div>
                            <span>${type}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <slot name="balance-summary"></slot>
                ${this.readonly ? "" : '<div class="submit-slot"><slot name="submit"></slot></div>'}
            </div>
        `;
  }

  private render() {
    // Save focus area if not already set by caller
    const activeEl = this.shadow.activeElement as HTMLElement;
    if (activeEl && !this.lastFocusArea) {
      if (activeEl.closest(".legend")) {
        this.lastFocusArea = "legend";
      } else if (
        activeEl.classList.contains("day") &&
        activeEl.classList.contains("clickable")
      ) {
        this.lastFocusArea = "grid";
        this.focusedDate = activeEl.dataset.date || this.focusedDate;
      }
    }

    // Initialize focusedDate for first navigable day
    if (
      !this.readonly &&
      (!this.focusedDate || !this.isNavigable(this.focusedDate))
    ) {
      this.focusedDate = this.getFirstNavigableDate();
    }

    this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .calendar {
                    margin-top: 16px;
                }

                .calendar-header {
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                }

                .weekday {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                    text-align: center;
                }

                .day {
                    position: relative;
                    min-height: 50px;
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: 6px;
                    background: var(--color-surface);
                    padding: 4px;
                    font-size: 12px;
                }

                .day.empty {
                    background: transparent;
                    border: none;
                }

                .day.clickable {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .day.clickable:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .day.clickable:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: -2px;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
                    z-index: 1;
                }

                .day.selected {
                    border: 2px solid var(--color-primary);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
                }

                .day .date {
                    font-weight: 600;
                    color: var(--color-text);
                }

                .day .checkmark {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    color: var(--color-success);
                    font-size: 10px;
                    font-weight: bold;
                    z-index: 1;
                }

                .day .hours {
                    position: absolute;
                    bottom: 4px;
                    right: 6px;
                    font-size: 10px;
                    color: var(--color-text-secondary);
                }

                .type-PTO { background: ${PTO_TYPE_COLORS.PTO}; }
                .type-Sick { background: ${PTO_TYPE_COLORS.Sick}; }
                .type-Bereavement { background: ${PTO_TYPE_COLORS.Bereavement}; }
                .type-Jury-Duty { background: ${PTO_TYPE_COLORS["Jury Duty"]}; }
                .type-Planned-PTO { background: ${PTO_TYPE_COLORS["Planned PTO"]}; }
                .type-Work-Day { background: ${PTO_TYPE_COLORS["Work Day"]}; border: 1px solid var(--color-border); }

                /* Make text white on colored backgrounds for better contrast */
                .type-PTO .date,
                .type-PTO .hours,
                .type-Sick .date,
                .type-Sick .hours,
                .type-Bereavement .date,
                .type-Bereavement .hours,
                .type-Jury-Duty .date,
                .type-Jury-Duty .hours,
                .type-Planned-PTO .date,
                .type-Planned-PTO .hours {
                    color: white;
                }

                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px 12px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: var(--color-text-secondary);
                }

                .legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .legend-item.clickable {
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .legend-item.clickable:hover {
                    background: var(--color-surface-hover);
                    transform: scale(1.05);
                }

                .legend-item.clickable:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                }

                .legend-item.selected {
                    background: var(--color-primary-light);
                    border: 1px solid var(--color-primary);
                    font-weight: 600;
                }

                .legend-swatch {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    border: 1px solid var(--color-border);
                }

                .submit-slot {
                    margin-top: 16px;
                    text-align: center;
                }
            </style>
            ${this.renderCalendar()}
        `;
    this.attachEventListeners();
    this.restoreFocus();
  }

  private attachEventListeners() {
    if (this.readonly) return;

    // Submit button clicks (handle slotted submit button)
    const submitSlot = this.shadow.querySelector(".submit-slot");
    if (submitSlot) {
      submitSlot.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "BUTTON" &&
          target.textContent === "Submit PTO Request"
        ) {
          e.preventDefault();
          this.submitRequest();
        }
      });
    }

    // Legend item clicks
    const legendItems = this.shadow.querySelectorAll(".legend-item.clickable");
    legendItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const type = (e.currentTarget as HTMLElement).dataset.type;
        if (type) {
          const items = Array.from(legendItems);
          this.focusedLegendIndex = items.indexOf(e.currentTarget as Element);
          this.selectedPtoType = this.selectedPtoType === type ? null : type;
          this.lastFocusArea = "legend";
          this.render();
        }
      });
    });

    // Calendar cell clicks
    const calendarCells = this.shadow.querySelectorAll(".day.clickable");
    calendarCells.forEach((cell) => {
      cell.addEventListener("click", (e) => {
        e.preventDefault();
        const date = (e.currentTarget as HTMLElement).dataset.date;
        if (date) {
          this.focusedDate = date;
          this.toggleDaySelection(date);
        }
      });
    });
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.readonly) return;

    const target = event.target as HTMLElement;
    const isLegendItem = target.classList.contains("legend-item");
    const isDayCell =
      target.classList.contains("day") &&
      target.classList.contains("clickable");

    if (isLegendItem) {
      this.handleLegendKeyDown(event, target);
    } else if (isDayCell) {
      this.handleGridKeyDown(event, target);
    }
  }

  private handleLegendKeyDown(event: KeyboardEvent, target: HTMLElement) {
    const legendItems = Array.from(
      this.shadow.querySelectorAll(".legend-item.clickable"),
    ) as HTMLElement[];
    const currentIndex = legendItems.indexOf(target);
    if (currentIndex === -1) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % legendItems.length;
        this.focusLegendItem(legendItems, nextIndex);
        break;
      }
      case "ArrowLeft":
      case "ArrowUp": {
        event.preventDefault();
        const prevIndex =
          (currentIndex - 1 + legendItems.length) % legendItems.length;
        this.focusLegendItem(legendItems, prevIndex);
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const type = target.dataset.type;
        if (type) {
          this.focusedLegendIndex = currentIndex;
          this.selectedPtoType = this.selectedPtoType === type ? null : type;
          this.lastFocusArea = "legend";
          this.render();
        }
        break;
      }
    }
  }

  private handleGridKeyDown(event: KeyboardEvent, target: HTMLElement) {
    const date = target.dataset.date;
    if (!date) return;

    const calendarDates = getCalendarDates(this.year, this.month);
    const currentIndex = calendarDates.indexOf(date);
    if (currentIndex === -1) return;

    let nextDate: string | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextDate = this.findNextNavigableDate(calendarDates, currentIndex, 1);
        break;
      case "ArrowLeft":
        nextDate = this.findNextNavigableDate(calendarDates, currentIndex, -1);
        break;
      case "ArrowDown":
        nextDate = this.findNavigableDateAt(calendarDates, currentIndex + 7);
        break;
      case "ArrowUp":
        nextDate = this.findNavigableDateAt(calendarDates, currentIndex - 7);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        this.focusedDate = date;
        this.toggleDaySelection(date);
        return;
      default:
        return;
    }

    if (nextDate) {
      event.preventDefault();
      this.focusedDate = nextDate;
      this.focusDate(nextDate);
    }
  }

  private cycleHours(current: number): number {
    // 8 -> 4 -> 0 -> 8
    if (current === 8) return 4;
    if (current === 4) return 0;
    return 8;
  }

  private toggleDaySelection(date: string) {
    if (this.selectedPtoType) {
      if (this.selectedPtoType === "Work Day") {
        // Clear operation - remove any existing entry for this date
        const existingEntryIndex = this.ptoEntries.findIndex(
          (entry) => entry.date === date,
        );
        if (existingEntryIndex >= 0) {
          this.ptoEntries.splice(existingEntryIndex, 1);
          this.setAttribute("pto-entries", JSON.stringify(this.ptoEntries));
        }
        this.selectedCells.delete(date);
        this.lastFocusArea = "grid";
        this.render();
      } else {
        // Cycle hours: first click sets 8, then 4, then 0 (removes)
        const currentHours = this.selectedCells.get(date);
        if (currentHours !== undefined) {
          const nextHours = this.cycleHours(currentHours);
          if (nextHours === 0) {
            this.selectedCells.delete(date);
          } else {
            this.selectedCells.set(date, nextHours);
          }
        } else {
          // First click - select with 8 hours
          this.selectedCells.set(date, 8);
        }
        this.lastFocusArea = "grid";
        this.render();
      }
    } else {
      // No PTO type selected - can edit existing entries
      const existingEntry = this.ptoEntries.find(
        (entry) => entry.date === date,
      );
      if (existingEntry) {
        const currentHours = this.selectedCells.get(date);
        if (currentHours !== undefined) {
          const nextHours = this.cycleHours(currentHours);
          if (nextHours === 0) {
            this.selectedCells.delete(date);
          } else {
            this.selectedCells.set(date, nextHours);
            this.selectedPtoType = existingEntry.type;
          }
        } else {
          this.selectedCells.set(date, existingEntry.hours);
          this.selectedPtoType = existingEntry.type;
        }
        this.lastFocusArea = "grid";
        this.render();
      }
    }
  }

  private isNavigable(dateStr: string): boolean {
    return isInMonth(dateStr, this.year, this.month) && !isWeekend(dateStr);
  }

  private getFirstNavigableDate(): string | null {
    const calendarDates = getCalendarDates(this.year, this.month);
    return calendarDates.find((d) => this.isNavigable(d)) || null;
  }

  private findNextNavigableDate(
    dates: string[],
    fromIndex: number,
    direction: number,
  ): string | null {
    let i = fromIndex + direction;
    while (i >= 0 && i < dates.length) {
      if (this.isNavigable(dates[i])) return dates[i];
      i += direction;
    }
    return null;
  }

  private findNavigableDateAt(dates: string[], index: number): string | null {
    if (index < 0 || index >= dates.length) return null;
    return this.isNavigable(dates[index]) ? dates[index] : null;
  }

  private focusDate(date: string) {
    const cell = this.shadow.querySelector(
      `.day[data-date="${date}"]`,
    ) as HTMLElement;
    if (cell) {
      this.shadow
        .querySelectorAll('.day[tabindex="0"]')
        .forEach((el) => el.setAttribute("tabindex", "-1"));
      cell.setAttribute("tabindex", "0");
      cell.focus();
    }
  }

  private focusLegendItem(items: HTMLElement[], index: number) {
    items.forEach((el) => el.setAttribute("tabindex", "-1"));
    items[index].setAttribute("tabindex", "0");
    items[index].focus();
    this.focusedLegendIndex = index;
  }

  private restoreFocus() {
    if (!this.lastFocusArea) return;

    if (this.lastFocusArea === "legend") {
      const legendItems = Array.from(
        this.shadow.querySelectorAll(".legend-item.clickable"),
      ) as HTMLElement[];
      if (legendItems.length > 0) {
        const index = Math.min(this.focusedLegendIndex, legendItems.length - 1);
        legendItems[index].focus();
      }
    } else if (this.lastFocusArea === "grid" && this.focusedDate) {
      const cell = this.shadow.querySelector(
        `.day[data-date="${this.focusedDate}"]`,
      ) as HTMLElement;
      if (cell) cell.focus();
    }
    this.lastFocusArea = null;
  }
}

customElements.define("pto-calendar", PtoCalendar);

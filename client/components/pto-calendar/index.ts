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
  parseDate,
  isWeekend,
} from "../../../shared/dateUtils.js";
import { BaseComponent } from "../base-component.js";

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

export class PtoCalendar extends BaseComponent {
  // ── Complex values: private fields with get/set ──
  private _ptoEntries: PTOEntry[] = [];
  private _selectedCells: Map<string, number> = new Map();
  private _selectedPtoType: string | null = null;

  // ── View-model focus state ──
  private _focusedDate: string | null = null;
  private _focusedLegendIndex: number = 0;
  private _lastFocusArea: "legend" | "grid" | null = null;

  // ── Primitives: attribute-backed get/set ──
  static get observedAttributes() {
    return ["month", "year", "selected-month", "readonly"];
  }

  get month(): number {
    return parseInt(this.getAttribute("month") || "1", 10);
  }

  set month(value: number) {
    this.setAttribute("month", value.toString());
  }

  get year(): number {
    return parseInt(this.getAttribute("year") || "2024", 10);
  }

  set year(value: number) {
    this.setAttribute("year", value.toString());
  }

  get selectedMonth(): number | null {
    const val = this.getAttribute("selected-month");
    return val === null || val === "null" ? null : parseInt(val, 10);
  }

  set selectedMonth(value: number | null) {
    this.setAttribute(
      "selected-month",
      value === null ? "null" : value.toString(),
    );
  }

  get isReadonly(): boolean {
    return this.getAttribute("readonly") !== "false";
  }

  set isReadonly(value: boolean) {
    this.setAttribute("readonly", value.toString());
  }

  // ── Complex value accessors ──
  get ptoEntries(): PTOEntry[] {
    return this._ptoEntries;
  }

  set ptoEntries(value: PTOEntry[]) {
    this._ptoEntries = value;
    this.requestUpdate();
  }

  get selectedCells(): Map<string, number> {
    return this._selectedCells;
  }

  get selectedPtoType(): string | null {
    return this._selectedPtoType;
  }

  set selectedPtoType(value: string | null) {
    this._selectedPtoType = value;
  }

  // ── Backward-compatible setter methods ──
  setMonth(month: number) {
    this.month = month;
  }

  setYear(year: number) {
    this.year = year;
  }

  setPtoEntries(ptoEntries: PTOEntry[]) {
    this._ptoEntries = ptoEntries;
    this.requestUpdate();
  }

  setSelectedMonth(selectedMonth: number | null) {
    this.selectedMonth = selectedMonth;
  }

  setReadonly(readonly: boolean) {
    // Set default PTO type to "PTO" when entering editable mode
    if (!readonly && this._selectedPtoType === null) {
      this._selectedPtoType = "PTO";
    }
    this.isReadonly = readonly;
  }

  // ── Lifecycle ──
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    if (name === "month" || name === "year") {
      this._focusedDate = null;
    }

    if (name === "readonly" && newValue === "false") {
      // Set default PTO type when entering editable mode
      if (this._selectedPtoType === null) {
        this._selectedPtoType = "PTO";
      }
    }

    this.requestUpdate();
  }

  // ── Public API ──
  getSelectedRequests(): CalendarEntry[] {
    return Array.from(this._selectedCells.entries()).map(([date, hours]) => {
      const existingEntry = this._ptoEntries.find(
        (entry) => entry.date === date,
      );
      return {
        date,
        hours,
        type: existingEntry?.type || this._selectedPtoType || "PTO",
        id: existingEntry?.id,
      };
    });
  }

  clearSelection() {
    this._selectedPtoType = null;
    this._selectedCells.clear();
    this.requestUpdate();
  }

  submitRequest() {
    const requests = this.getSelectedRequests();
    if (requests.length === 0) return;

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
      this.dispatchEvent(
        new CustomEvent("pto-validation-error", {
          detail: { errors: validationErrors },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent("pto-request-submit", {
        detail: { requests },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Rendering ──
  protected update() {
    // Initialize focusedDate for first navigable day
    if (
      !this.isReadonly &&
      (!this._focusedDate || !this.isNavigable(this._focusedDate))
    ) {
      this._focusedDate = this.getFirstNavigableDate();
    }

    super.update();
    this.restoreFocusFromViewModel();
  }

  protected render(): string {
    return `
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
                }

                .day.clickable:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
                }

                .day.clickable:focus-visible,
                .day.clickable:focus {
                    box-shadow: 0 0 0 1px var(--color-focus);
                }

                .day.selected {
                    border: 2px solid var(--color-primary);
                    box-shadow: 0 0 0 2px rgb(59 130 246 / 25%);
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

                .type-Work-Day { background: ${PTO_TYPE_COLORS["Work Day"]}; border: 1px solid var(--color-border); }

                /* Make text white on colored backgrounds for better contrast */
                .type-PTO .date,
                .type-PTO .hours,
                .type-Sick .date,
                .type-Sick .hours,
                .type-Bereavement .date,
                .type-Bereavement .hours,
                .type-Jury-Duty .date,
                .type-Jury-Duty .hours {
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

                @keyframes day-pulse {
                    0% { box-shadow: 0 0 0 0 rgb(59 130 246 / 40%); }
                    50% { box-shadow: 0 0 0 4px rgb(59 130 246 / 20%); }
                    100% { box-shadow: 0 0 0 0 rgb(59 130 246 / 0%); }
                }

                .day-changed {
                    animation: day-pulse 200ms ease-out;
                }

                .hours-full {
                    opacity: 1;
                }

                .hours-partial {
                    opacity: 0.6;
                }

                .day.partial-day {
                    opacity: 0.75;
                }
            </style>
            ${this.renderCalendar()}
        `;
  }

  // ── Event delegation ──
  protected handleDelegatedClick(e: Event): void {
    if (this.isReadonly) return;

    const target = e.target as HTMLElement;

    // Day cell clicks
    const dayCell = target.closest(".day.clickable") as HTMLElement;
    if (dayCell) {
      e.preventDefault();
      const date = dayCell.dataset.date;
      if (date) {
        this._focusedDate = date;
        this._lastFocusArea = "grid";
        this.toggleDaySelection(date);
      }
      return;
    }

    // Legend item clicks
    const legendItem = target.closest(".legend-item.clickable") as HTMLElement;
    if (legendItem) {
      e.preventDefault();
      const type = legendItem.dataset.type;
      if (type) {
        const legendItems = Array.from(
          this.shadowRoot.querySelectorAll(".legend-item.clickable"),
        );
        this._focusedLegendIndex = legendItems.indexOf(legendItem);
        this._selectedPtoType = this._selectedPtoType === type ? null : type;
        this._lastFocusArea = "legend";
        this.requestUpdate();
      }
      return;
    }

    // Submit button clicks (slotted)
    const submitSlot = target.closest(".submit-slot");
    if (submitSlot) {
      const button = target.closest("button");
      if (button && button.textContent === "Submit PTO Request") {
        e.preventDefault();
        this.submitRequest();
      }
    }
  }

  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    if (this.isReadonly) return;

    const target = e.target as HTMLElement;
    const isLegendItem = target.classList.contains("legend-item");
    const isDayCell =
      target.classList.contains("day") &&
      target.classList.contains("clickable");

    if (isLegendItem) {
      this.handleLegendKeyDown(e, target);
    } else if (isDayCell) {
      this.handleGridKeyDown(e, target);
    }
  }

  // ── Calendar rendering helper ──
  private renderCalendar(): string {
    const calendarDates = getCalendarDates(this.year, this.month);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return `
            <div class="calendar">
                <div class="calendar-header">
                    ${monthNames[this.month - 1]} ${this.year}
                </div>
                <div class="calendar-grid">
                    ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
                    ${calendarDates.map((dateStr) => this.renderDayCell(dateStr)).join("")}
                </div>
                <div class="legend" role="listbox" aria-label="PTO type selection">
                    ${Object.entries(PTO_TYPE_COLORS)
                      .map(
                        ([type, color], index) => `
                        <div class="legend-item ${this._selectedPtoType === type ? "selected" : ""} ${this.isReadonly ? "" : "clickable"}" data-type="${type}" ${!this.isReadonly ? `tabindex="${index === this._focusedLegendIndex ? "0" : "-1"}" role="option" aria-selected="${this._selectedPtoType === type}"` : ""}>
                            <div class="legend-swatch" style="background: ${color}"></div>
                            <span>${type}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <slot name="balance-summary"></slot>
                ${this.isReadonly ? "" : '<div class="submit-slot"><slot name="submit"></slot></div>'}
            </div>
        `;
  }

  private renderDayCell(dateStr: string): string {
    const isCurrentMonth = isInMonth(dateStr, this.year, this.month);
    const entriesForDate = this._ptoEntries.filter((e) => e.date === dateStr);
    const totalHours = entriesForDate.reduce((sum, e) => sum + e.hours, 0);
    const entry = entriesForDate.length > 0 ? entriesForDate[0] : null;
    const hasApprovedEntry = entriesForDate.some((e) => e.approved_by !== null);

    const isSelected = this._selectedCells.has(dateStr);
    const selectedHours = this._selectedCells.get(dateStr) || 8;
    const isWeekendDate = isWeekend(dateStr);
    const isNav = isCurrentMonth && !isWeekendDate;

    const dayClass = entry
      ? `day has-pto type-${entry.type.replace(/\s+/g, "-")}`
      : isSelected && this._selectedPtoType
        ? `day type-${this._selectedPtoType.replace(/\s+/g, "-")}`
        : "day";
    const emptyClass = isCurrentMonth ? "" : "empty";
    const selectedClass = isSelected ? "selected" : "";
    const clickableClass = !this.isReadonly && isNav ? "clickable" : "";
    const tabindexAttr = clickableClass
      ? `tabindex="${dateStr === this._focusedDate ? "0" : "-1"}"`
      : "";

    // Hours display: ● for full day (8h), ○ for partial (<8h)
    const displayHours =
      totalHours > 0 ? totalHours : isSelected ? selectedHours : 0;
    let hoursDisplay = "";
    let hoursClass = "hours";
    let partialDayClass = "";
    if (displayHours > 0) {
      if (displayHours >= 8) {
        hoursDisplay = "●";
        hoursClass = "hours hours-full";
      } else {
        hoursDisplay = "○";
        hoursClass = "hours hours-partial";
        partialDayClass = " partial-day";
      }
    }

    const checkmarkElement = hasApprovedEntry
      ? '<div class="checkmark">✓</div>'
      : "";
    const { day } = parseDate(dateStr);

    return `
      <div class="${dayClass} ${emptyClass} ${selectedClass} ${clickableClass}${partialDayClass}" data-date="${dateStr}" ${tabindexAttr} role="gridcell">
          ${checkmarkElement}
          <div class="date">${day}</div>
          <div class="${hoursClass}">${hoursDisplay}</div>
      </div>
    `;
  }

  // ── Targeted day update (avoids full re-render for single day changes) ──
  private updateDay(date: string): void {
    const existingCell = this.shadowRoot.querySelector(
      `.day[data-date="${date}"]`,
    ) as HTMLElement;
    if (!existingCell) return;

    // Create a temporary container to parse the new cell HTML
    const temp = document.createElement("div");
    temp.innerHTML = this.renderDayCell(date);
    const newCell = temp.firstElementChild as HTMLElement;
    if (!newCell) return;

    // Update classes
    existingCell.className = newCell.className;

    // Update inner content
    existingCell.innerHTML = newCell.innerHTML;

    // Update tabindex
    const newTabindex = newCell.getAttribute("tabindex");
    if (newTabindex !== null) {
      existingCell.setAttribute("tabindex", newTabindex);
    } else {
      existingCell.removeAttribute("tabindex");
    }

    // Add pulse animation
    existingCell.classList.add("day-changed");
    existingCell.addEventListener(
      "animationend",
      () => existingCell.classList.remove("day-changed"),
      { once: true },
    );
  }

  // ── Keyboard handling ──
  private handleLegendKeyDown(event: KeyboardEvent, target: HTMLElement) {
    const legendItems = Array.from(
      this.shadowRoot.querySelectorAll(".legend-item.clickable"),
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
          this._focusedLegendIndex = currentIndex;
          this._selectedPtoType = this._selectedPtoType === type ? null : type;
          this._lastFocusArea = "legend";
          this.requestUpdate();
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
        this._focusedDate = date;
        this._lastFocusArea = "grid";
        this.toggleDaySelection(date);
        return;
      default:
        return;
    }

    if (nextDate) {
      event.preventDefault();
      this._focusedDate = nextDate;
      this.focusDate(nextDate);
    }
  }

  // ── Day selection logic ──
  private cycleHours(current: number): number {
    // 8 -> 4 -> 0 -> 8
    if (current === 8) return 4;
    if (current === 4) return 0;
    return 8;
  }

  private toggleDaySelection(date: string) {
    if (this._selectedPtoType) {
      if (this._selectedPtoType === "Work Day") {
        // Clear operation - remove any existing entry for this date
        const existingEntryIndex = this._ptoEntries.findIndex(
          (entry) => entry.date === date,
        );
        if (existingEntryIndex >= 0) {
          this._ptoEntries.splice(existingEntryIndex, 1);
        }
        this._selectedCells.delete(date);
        this.updateDay(date);
        this.restoreFocusFromViewModel();
      } else {
        // Cycle hours: first click sets 8, then 4, then 0 (removes)
        const currentHours = this._selectedCells.get(date);
        if (currentHours !== undefined) {
          const nextHours = this.cycleHours(currentHours);
          if (nextHours === 0) {
            this._selectedCells.delete(date);
          } else {
            this._selectedCells.set(date, nextHours);
          }
        } else {
          // First click - select with 8 hours
          this._selectedCells.set(date, 8);
        }
        this.updateDay(date);
        this.restoreFocusFromViewModel();
      }
    } else {
      // No PTO type selected - can edit existing entries
      const existingEntry = this._ptoEntries.find(
        (entry) => entry.date === date,
      );
      if (existingEntry) {
        const currentHours = this._selectedCells.get(date);
        if (currentHours !== undefined) {
          const nextHours = this.cycleHours(currentHours);
          if (nextHours === 0) {
            this._selectedCells.delete(date);
          } else {
            this._selectedCells.set(date, nextHours);
            this._selectedPtoType = existingEntry.type;
          }
        } else {
          this._selectedCells.set(date, existingEntry.hours);
          this._selectedPtoType = existingEntry.type;
        }
        this.updateDay(date);
        this.restoreFocusFromViewModel();
      }
    }
  }

  // ── Navigation helpers ──
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

  // ── Focus management ──
  private focusDate(date: string) {
    const cell = this.shadowRoot.querySelector(
      `.day[data-date="${date}"]`,
    ) as HTMLElement;
    if (cell) {
      this.shadowRoot
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
    this._focusedLegendIndex = index;
  }

  private restoreFocusFromViewModel() {
    if (!this._lastFocusArea) return;

    if (this._lastFocusArea === "legend") {
      const legendItems = Array.from(
        this.shadowRoot.querySelectorAll(".legend-item.clickable"),
      ) as HTMLElement[];
      if (legendItems.length > 0) {
        const index = Math.min(
          this._focusedLegendIndex,
          legendItems.length - 1,
        );
        legendItems[index].focus();
      }
    } else if (this._lastFocusArea === "grid" && this._focusedDate) {
      const cell = this.shadowRoot.querySelector(
        `.day[data-date="${this._focusedDate}"]`,
      ) as HTMLElement;
      if (cell) {
        cell.setAttribute("tabindex", "0");
        cell.focus();
      }
    }
    this._lastFocusArea = null;
  }
}

customElements.define("pto-calendar", PtoCalendar);

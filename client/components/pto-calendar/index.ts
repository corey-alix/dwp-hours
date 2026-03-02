import {
  validateHours,
  validatePTOType,
  VALIDATION_MESSAGES,
  MessageKey,
  type PTOType,
  normalizePTOType,
  isWorkingDay,
} from "../../../shared/businessRules.js";
import {
  getCalendarDates,
  isInMonth,
  parseDate,
  isWeekend,
  today,
} from "../../../shared/dateUtils.js";
import { CALENDAR_SYMBOLS } from "../../../shared/calendar-symbols.js";
import { BaseComponent } from "../base-component.js";
import { styles, PTO_TYPE_COLORS } from "./css.js";
import { MONTH_NAMES } from "../../../shared/businessRules.js";
import { consumeContext, CONTEXT_KEYS } from "../../shared/context.js";
import type { TraceListener } from "../../controller/TraceListener.js";
import {
  LONG_PRESS_MS,
  LONG_PRESS_MOVE_THRESHOLD,
} from "../../css-extensions/interactions/index.js";
import type { DayNoteDialog } from "../day-note-dialog/index.js";

/** @deprecated Use `MONTH_NAMES` from `shared/businessRules.js` instead. */
export const monthNames = MONTH_NAMES;

/**
 * Format hours for superscript display: integer if whole, 1 decimal if fractional.
 * Weekend/off-day credits are prefixed with "+".
 */
function formatHoursSuperscript(hours: number, isCredit: boolean): string {
  const prefix = isCredit ? "+" : "";
  const formatted = hours % 1 === 0 ? `${hours}` : hours.toFixed(1);
  return `${prefix}${formatted}`;
}

export interface CalendarEntry {
  date: string;
  hours: number;
  type: PTOType;
  id?: number; // For existing entries being updated
  notes?: string;
}

export interface PTOEntry {
  id: number;
  employeeId: number;
  date: string;
  type: PTOType;
  hours: number;
  createdAt: string;
  approved_by?: number | null;
  notes?: string | null;
}

export class PtoCalendar extends BaseComponent {
  // ── Complex values: private fields with get/set ──
  private _notifications: TraceListener | null = null;
  private _ptoEntries: PTOEntry[] = [];
  private _selectedCells: Map<string, number> = new Map();
  private _selectedPtoType: PTOType | null = null;
  private _overuseDates: Set<string> = new Set();
  private _overuseTooltips: Map<string, string> = new Map();
  /** Notes entered via the day-note dialog for pending selections. */
  private _selectedNotes: Map<string, string> = new Map();
  /** Long-press state tracking */
  private _longPressTimer: ReturnType<typeof setTimeout> | null = null;

  disconnectedCallback() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    super.disconnectedCallback();
  }
  private _longPressStartX = 0;
  private _longPressStartY = 0;
  private _longPressDate: string | null = null;
  /** The dialog instance currently attached to the shadow DOM (if any). */
  private _noteDialog: DayNoteDialog | null = null;
  /**
   * Set of date strings for entries that are unapproved but in a
   * locked/reconciled month (e.g., historic import policy violations).
   * These dates show a "†" indicator instead of the green checkmark.
   */
  private _reconciledDates: Set<string> = new Set();
  /** Per-date tooltip for reconciled indicators, sourced from PTO entry notes. */
  private _reconciledTooltips: Map<string, string> = new Map();

  connectedCallback() {
    super.connectedCallback();
    consumeContext<TraceListener>(this, CONTEXT_KEYS.NOTIFICATIONS, (svc) => {
      this._notifications = svc;
    });
  }

  // ── View-model focus state ──
  private _focusedDate: string | null = null;
  private _focusedLegendIndex: number = 0;
  private _lastFocusArea: "legend" | "grid" | null = null;

  // ── Primitives: attribute-backed get/set ──
  static get observedAttributes() {
    return [
      "month",
      "year",
      "selected-month",
      "readonly",
      "hide-legend",
      "hide-header",
    ];
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

  get hideLegend(): boolean {
    return this.getAttribute("hide-legend") === "true";
  }

  set hideLegend(value: boolean) {
    this.setAttribute("hide-legend", value.toString());
  }

  get hideHeader(): boolean {
    return this.getAttribute("hide-header") === "true";
  }

  set hideHeader(value: boolean) {
    this.setAttribute("hide-header", value.toString());
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

  set selectedCells(value: Map<string, number>) {
    this._selectedCells = new Map(value);
    this.requestUpdate();
  }

  get selectedPtoType(): PTOType | null {
    return this._selectedPtoType;
  }

  set selectedPtoType(value: string | null) {
    if (this._selectedPtoType === value) return;
    this._selectedPtoType = value ? normalizePTOType(value) : null;
    this.requestUpdate();
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

  /**
   * Set of date strings where the running balance exceeds the PTO type
   * limit. Driven externally by `PtoBalanceModel` via `pto-entry-form`.
   */
  get overuseDates(): Set<string> {
    return this._overuseDates;
  }

  set overuseDates(value: Set<string>) {
    const prev = this._overuseDates;
    this._overuseDates = value;

    // Targeted updates for changed dates only — avoids full re-render
    // which would destroy focused elements and break keyboard navigation.
    for (const date of prev) {
      if (!value.has(date)) this.updateDay(date);
    }
    for (const date of value) {
      if (!prev.has(date)) this.updateDay(date);
    }
  }

  /**
   * Per-date tooltip messages for overuse indicators.
   * Driven externally by `PtoBalanceModel` via `pto-entry-form`.
   */
  get overuseTooltips(): Map<string, string> {
    return this._overuseTooltips;
  }

  set overuseTooltips(value: Map<string, string>) {
    this._overuseTooltips = value;
    // No re-render needed — tooltips are read during renderDayCell which
    // is already triggered by the overuseDates setter update cycle.
  }

  /**
   * Set of date strings for unapproved entries in locked/reconciled months.
   * When set, a "†" footnote badge appears in the top-right corner of
   * affected day cells to indicate borrowed time that was not approved.
   */
  get reconciledDates(): Set<string> {
    return this._reconciledDates;
  }

  set reconciledDates(value: Set<string>) {
    const prev = this._reconciledDates;
    this._reconciledDates = value;

    // Targeted updates for changed dates only
    for (const date of prev) {
      if (!value.has(date)) this.updateDay(date);
    }
    for (const date of value) {
      if (!prev.has(date)) this.updateDay(date);
    }
  }

  /** Per-date tooltip text for reconciled indicators. */
  get reconciledTooltips(): Map<string, string> {
    return this._reconciledTooltips;
  }

  set reconciledTooltips(value: Map<string, string>) {
    this._reconciledTooltips = value;
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
      const note = this._selectedNotes.get(date);
      const entry: CalendarEntry = {
        date,
        hours,
        type: existingEntry?.type || this._selectedPtoType || "PTO",
        id: existingEntry?.id,
      };
      if (note !== undefined) {
        entry.notes = note;
      }
      return entry;
    });
  }

  clearSelection() {
    this._selectedPtoType = null;
    this._selectedCells.clear();
    this._selectedNotes.clear();
    this.requestUpdate();
    this.notifySelectionChanged();
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
                ${styles}
            </style>
            ${this.renderCalendar()}
        `;
  }

  // ── Event delegation ──
  protected setupEventDelegation() {
    super.setupEventDelegation();

    // Long-press detection via pointer events — use addListener for
    // automatic cleanup between renders (prevents listener accumulation).
    this.addListener(this.shadowRoot, "pointerdown", (e) => {
      this.handlePointerDown(e as PointerEvent);
    });
    this.addListener(this.shadowRoot, "pointermove", (e) => {
      this.handlePointerMove(e as PointerEvent);
    });
    this.addListener(this.shadowRoot, "pointerup", () => {
      this.cancelLongPress();
    });
    this.addListener(this.shadowRoot, "pointercancel", () => {
      this.cancelLongPress();
    });
    // Suppress context menu on long-press
    this.addListener(this.shadowRoot, "contextmenu", (e) => {
      if (this._longPressDate) {
        e.preventDefault();
      }
    });
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    if (this.handleNoteIndicatorClick(target, e)) return;
    if (this.handleEditNoteClick(target, e)) return;
    if (this.isReadonly) return;
    if (this.handleDayCellClick(target, e)) return;
    if (this.handleLegendItemClick(target, e)) return;
    this.handleSubmitSlotClick(target, e);
  }

  /** Note indicator click — open dialog (edit) or show toast (readonly). */
  private handleNoteIndicatorClick(target: HTMLElement, e: Event): boolean {
    const noteIndicator = target.closest(".note-indicator") as HTMLElement;
    if (!noteIndicator) return false;
    e.preventDefault();
    e.stopPropagation();
    const date = noteIndicator.closest(".day")?.getAttribute("data-date");
    if (!this.isReadonly && date) {
      this.openNoteDialog(date);
    } else {
      const noteText = noteIndicator.getAttribute("data-note");
      if (noteText) {
        this._notifications?.info(noteText, "Note");
      }
    }
    return true;
  }

  /** Edit-note placeholder click — open note dialog in edit mode. */
  private handleEditNoteClick(target: HTMLElement, e: Event): boolean {
    const editNote = target.closest(".edit-note-icon") as HTMLElement;
    if (!editNote || this.isReadonly) return false;
    e.preventDefault();
    e.stopPropagation();
    const date = editNote.closest(".day")?.getAttribute("data-date");
    if (date) {
      this.openNoteDialog(date);
    }
    return true;
  }

  /** Day cell click — toggle date selection. */
  private handleDayCellClick(target: HTMLElement, e: Event): boolean {
    const dayCell = target.closest(".day.clickable") as HTMLElement;
    if (!dayCell) return false;
    e.preventDefault();
    const date = dayCell.dataset.date;
    if (date) {
      this._focusedDate = date;
      this._lastFocusArea = "grid";
      this.toggleDaySelection(date);
    }
    return true;
  }

  /** Legend item click — toggle PTO type filter. */
  private handleLegendItemClick(target: HTMLElement, e: Event): boolean {
    const legendItem = target.closest(".legend-item.clickable") as HTMLElement;
    if (!legendItem) return false;
    e.preventDefault();
    const type = legendItem.dataset.type;
    if (type) {
      const legendItems = Array.from(
        this.shadowRoot.querySelectorAll(".legend-item.clickable"),
      );
      this._focusedLegendIndex = legendItems.indexOf(legendItem);
      this._selectedPtoType =
        this._selectedPtoType === type ? null : normalizePTOType(type);
      this._lastFocusArea = "legend";
      this.requestUpdate();
    }
    return true;
  }

  /** Submit button click (slotted). */
  private handleSubmitSlotClick(target: HTMLElement, e: Event): void {
    const submitSlot = target.closest(".submit-slot");
    if (!submitSlot) return;
    const button = target.closest("button");
    if (button && button.textContent === "Submit PTO Request") {
      e.preventDefault();
      this.submitRequest();
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

  // ── Long-press gesture handling ──

  private handlePointerDown(e: PointerEvent): void {
    if (this.isReadonly) return;

    const target = e.target as HTMLElement;
    const dayCell = target.closest(".day:not(.empty)") as HTMLElement;
    if (!dayCell) return;

    const date = dayCell.dataset.date;
    if (!date) return;

    // Only allow long-press on current-month cells
    if (!isInMonth(date, this.year, this.month)) return;

    this._longPressStartX = e.clientX;
    this._longPressStartY = e.clientY;
    this._longPressDate = date;

    this._longPressTimer = setTimeout(() => {
      if (this._longPressDate) {
        this.openNoteDialog(this._longPressDate);
        this._longPressDate = null;
      }
    }, LONG_PRESS_MS);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this._longPressTimer) return;

    const dx = e.clientX - this._longPressStartX;
    const dy = e.clientY - this._longPressStartY;
    if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_THRESHOLD) {
      this.cancelLongPress();
    }
  }

  private cancelLongPress(): void {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    this._longPressDate = null;
  }

  // ── Note dialog management ──

  /**
   * Open the day-note dialog for a given date. Dynamically imports the
   * dialog component on first use to avoid loading it eagerly.
   */
  private async openNoteDialog(date: string): Promise<void> {
    // Close any existing dialog
    this.closeNoteDialog();

    // Lazy-import the dialog component
    const { DayNoteDialog } = await import("../day-note-dialog/index.js");

    const dialog = new DayNoteDialog();
    dialog.date = date;

    // Populate from existing entry or pending selection
    const existingEntry = this._ptoEntries.find((e) => e.date === date);
    dialog.currentNote =
      this._selectedNotes.get(date) ?? existingEntry?.notes ?? "";
    dialog.currentHours =
      this._selectedCells.get(date) ?? existingEntry?.hours ?? 0;

    // Listen for save/cancel
    dialog.addEventListener("day-note-save", ((e: CustomEvent) => {
      const { note, hours } = e.detail as {
        date: string;
        note: string;
        hours: number;
      };

      // Update selected cells with custom hours
      this._selectedCells.set(date, hours);

      // Store or clear note
      if (note) {
        this._selectedNotes.set(date, note);
      } else {
        this._selectedNotes.delete(date);
      }

      // Ensure a PTO type is set for the selection
      if (!this._selectedPtoType && existingEntry) {
        this._selectedPtoType = existingEntry.type;
      } else if (!this._selectedPtoType) {
        this._selectedPtoType = "PTO";
      }

      this.closeNoteDialog();
      this.updateDay(date);
      this.notifySelectionChanged();
    }) as EventListener);

    dialog.addEventListener("day-note-cancel", () => {
      this.closeNoteDialog();
    });

    this._noteDialog = dialog;
    this.shadowRoot.appendChild(dialog);
  }

  private closeNoteDialog(): void {
    if (this._noteDialog) {
      this._noteDialog.remove();
      this._noteDialog = null;
    }
  }

  // ── Calendar rendering helper ──
  private renderCalendar(): string {
    const calendarDates = getCalendarDates(this.year, this.month);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return `
            <div class="calendar">
                ${
                  this.hideHeader
                    ? ""
                    : `<div class="calendar-header">
                    ${monthNames[this.month - 1]} ${this.year}
                </div>`
                }
                <div class="calendar-grid">
                    ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
                    ${calendarDates.map((dateStr) => this.renderDayCell(dateStr)).join("")}
                </div>
                ${
                  this.hideLegend
                    ? ""
                    : `<div class="legend" role="listbox" aria-label="PTO type selection">
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
                </div>`
                }
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
    const selectedHours = this._selectedCells.get(dateStr) ?? 8;
    const isWeekendDate = isWeekend(dateStr);
    const isNav = isCurrentMonth && !isWeekendDate;

    // When selected with 0 hours on an existing entry, show as cleared
    const isClearing = isSelected && selectedHours === 0 && entry !== null;

    const dayClass = isClearing
      ? "day has-pto clearing"
      : entry
        ? `day has-pto type-${entry.type.replace(/\s+/g, "-")}`
        : isSelected && this._selectedPtoType
          ? `day type-${this._selectedPtoType.replace(/\s+/g, "-")}`
          : "day";
    const emptyClass = isCurrentMonth ? "" : "empty";
    const selectedClass = isSelected ? "selected" : "";
    const todayClass = dateStr === today() ? "today" : "";
    const clickableClass = !this.isReadonly && isNav ? "clickable" : "";
    const tabindexAttr = clickableClass
      ? `tabindex="${dateStr === this._focusedDate ? "0" : "-1"}"`
      : "";

    // Hours display: colored type-dot + numeric hours in superscript
    // Negative hours represent worked-day credits (e.g. weekend work = -3.3h).
    const displayHours = isClearing
      ? 0
      : isSelected
        ? Math.abs(selectedHours)
        : totalHours !== 0
          ? Math.abs(totalHours)
          : 0;
    const isCredit = isSelected ? selectedHours < 0 : totalHours < 0;
    let hoursDisplay = "";
    let hoursClass = "hours";
    if (isClearing) {
      hoursDisplay = CALENDAR_SYMBOLS.HOURS_CLEARING;
      hoursClass = "hours hours-clearing";
    } else if (displayHours > 0) {
      hoursClass =
        displayHours >= 8 ? "hours hours-full" : "hours hours-partial";
    }

    const checkmarkElement = hasApprovedEntry
      ? `<div class="checkmark">${CALENDAR_SYMBOLS.CHECKMARK}</div>`
      : "";

    // Reconciled indicator: "†" in top-right for unapproved entries in locked months
    const reconciledTooltip = this._reconciledTooltips.get(dateStr) ?? "";
    const reconciledTitle = reconciledTooltip
      ? ` title="${this.escapeAttribute(reconciledTooltip)}"`
      : ' title="Unapproved borrowed time (month reconciled)"';
    const reconciledIndicator =
      !hasApprovedEntry && this._reconciledDates.has(dateStr)
        ? `<div class="reconciled-indicator"${reconciledTitle}>${CALENDAR_SYMBOLS.RECONCILED}</div>`
        : "";
    const { day } = parseDate(dateStr);

    // Note indicator: show filled triangle when PTO entry has notes,
    // or when a pending note exists in _selectedNotes.
    const entryNotes = entry?.notes || "";
    const pendingNote = this._selectedNotes.get(dateStr) ?? "";
    const effectiveNote = pendingNote || entryNotes;
    const noteIndicator = effectiveNote
      ? `<div class="note-indicator" data-note="${this.escapeAttribute(effectiveNote)}" title="${this.escapeAttribute(effectiveNote)}">${CALENDAR_SYMBOLS.NOTE}</div>`
      : "";

    // Edit-note ghost icon: shown in TL corner on editable, current-month
    // cells that don't already have a filled note indicator.
    const editNoteIcon =
      !this.isReadonly && isCurrentMonth && !effectiveNote
        ? `<div class="edit-note-icon" title="Add note">${CALENDAR_SYMBOLS.NOTE}</div>`
        : "";

    // Superscript hours on day number: numeric text (e.g. 4, 1.5, +3.3)
    // Credit entries (negative hours / weekend work) shown with "+" prefix.
    const partialClass = isCredit ? "partial-hours credit" : "partial-hours";
    const dayDisplay =
      displayHours > 0
        ? `${day}<sup class="${partialClass}">${formatHoursSuperscript(displayHours, isCredit)}</sup>`
        : `${day}`;

    // Colored type-indicator dot (always shown when PTO type is active)
    const ptoType = isClearing
      ? null
      : entry
        ? entry.type
        : isSelected && this._selectedPtoType
          ? this._selectedPtoType
          : null;
    if (ptoType) {
      hoursClass += ` type-dot type-dot-${ptoType.replace(/\s+/g, "-")}`;
      hoursDisplay = hoursDisplay || CALENDAR_SYMBOLS.TYPE_DOT;
    }

    // Overuse indicator: "!" in bottom-left when this date exceeds balance
    const overuseTooltip = this._overuseTooltips.get(dateStr) ?? "";
    const overuseTitle = overuseTooltip
      ? ` title="${overuseTooltip.replace(/"/g, "&quot;")}"`
      : "";
    const overuseIndicator = this._overuseDates.has(dateStr)
      ? `<span class="overuse-indicator"${overuseTitle}>${CALENDAR_SYMBOLS.OVERUSE}</span>`
      : "";

    return `
      <div class="${dayClass} ${emptyClass} ${selectedClass} ${clickableClass} ${todayClass}" data-date="${dateStr}" ${tabindexAttr} role="gridcell">
          ${checkmarkElement}
          ${reconciledIndicator}
          ${noteIndicator}
          ${editNoteIcon}
          ${overuseIndicator}
          <div class="date">${dayDisplay}</div>
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
          this._selectedPtoType =
            this._selectedPtoType === type ? null : normalizePTOType(type);
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
      // Cycle hours: first click sets 8, then 4, then 0 (removes)
      const currentHours = this._selectedCells.get(date);
      const existingEntry = this._ptoEntries.find(
        (entry) => entry.date === date,
      );
      if (currentHours !== undefined) {
        const nextHours = this.cycleHours(currentHours);
        if (nextHours === 0) {
          if (existingEntry) {
            // Keep 0 in selectedCells to indicate "unschedule this day"
            this._selectedCells.set(date, 0);
          } else {
            this._selectedCells.delete(date);
          }
        } else {
          this._selectedCells.set(date, nextHours);
        }
      } else {
        // First click - select with 8 hours
        this._selectedCells.set(date, 8);
      }
      this.updateDay(date);
      this.restoreFocusFromViewModel();
      this.notifySelectionChanged();
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
            // Keep 0 in selectedCells to indicate "unschedule this day"
            this._selectedCells.set(date, 0);
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
        this.notifySelectionChanged();
      }
    }
  }

  // ── Selection change notification ──
  private notifySelectionChanged(): void {
    this.dispatchEvent(
      new CustomEvent("selection-changed", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Navigation helpers ──
  private isNavigable(dateStr: string): boolean {
    return isInMonth(dateStr, this.year, this.month) && !isWeekend(dateStr);
  }

  /** Escape text for use in HTML attributes (title, data-*) */
  private escapeAttribute(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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

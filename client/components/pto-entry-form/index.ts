import { today, parseDate, getCurrentYear } from "../../../shared/dateUtils.js";
import {
  validateHours,
  validatePTOType,
  validatePTOBalance,
  VALIDATION_MESSAGES,
} from "../../../shared/businessRules.js";
import type {
  MessageKey,
  PTOType,
  BalanceLimits,
} from "../../../shared/businessRules.js";
import {
  PtoCalendar,
  monthNames,
  type CalendarEntry,
  type PTOEntry,
} from "../pto-calendar/index.js";
import type { MonthSummary } from "../month-summary/index.js";
import { computeSelectionDeltas } from "../utils/compute-selection-deltas.js";
import { BaseComponent } from "../base-component.js";
import { styles } from "./css.js";
import type { StorageService } from "../../shared/storage.js";
import { LocalStorageAdapter } from "../../shared/storage.js";
import {
  adoptAnimations,
  animateCarousel,
  setupSwipeNavigation,
  type SwipeNavigationHandle,
  type ListenerHost,
} from "../../css-extensions/index.js";
import {
  PtoBalanceModel,
  type MonthlyAccrual,
  type PendingSelection,
} from "./balance-model.js";

/** Breakpoint at which all 12 months are shown in a grid */
const MULTI_CALENDAR_BREAKPOINT = 1024;

/** localStorage key for persisting the selected month in single-calendar mode */
const SELECTED_MONTH_STORAGE_KEY = "dwp-pto-form-selected-month";

/** Configuration for seeding the PtoBalanceModel. */
export interface BalanceModelConfig {
  limits: BalanceLimits;
  beginningBalance: number;
  monthlyAccruals: ReadonlyArray<MonthlyAccrual>;
}

export class PtoEntryForm extends BaseComponent {
  /** Storage adapter for persisting the selected month. */
  private _storage: StorageService = new LocalStorageAdapter();

  /** MediaQueryList used to detect multi-calendar mode */
  private multiCalendarMql: MediaQueryList | null = null;
  /** Bound handler for matchMedia changes */
  private handleMqlChange = (e: MediaQueryListEvent | MediaQueryList) => {
    this.applyMode(e.matches);
  };

  /** Currently active PTO type, persisted across mode switches */
  private _activePtoType: string = "PTO";

  /** Centralised balance model — single source of truth for overuse dates */
  private _model: PtoBalanceModel | null = null;
  /** Unsubscribe handle for the model subscription */
  private _unsubscribeModel: (() => void) | null = null;

  /** Swipe navigation handle for the calendar container */
  private _swipeHandle: SwipeNavigationHandle | null = null;

  /**
   * Inject a custom StorageService (e.g. InMemoryStorage for tests).
   * Must be set before connectedCallback for effect on initial month.
   */
  set storage(svc: StorageService) {
    this._storage = svc;
  }

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
    // Calendar elements are rendered once in render() and their state
    // (ptoEntries, selectedCells) is maintained via property setters.
    // Re-rendering would reset child component state. The attribute-backed
    // getter (availablePtoBalance) reads directly from getAttribute(),
    // so validation always uses the current value.
  }

  connectedCallback() {
    super.connectedCallback();
    adoptAnimations(this.shadowRoot);

    // Set initial selectedPtoType on all declaratively-rendered calendars
    for (const cal of this.getAllCalendars()) {
      cal.selectedPtoType = this._activePtoType;
    }

    this.setupSwipeListeners();
    this.setupMultiCalendarDetection();
    // After detection, request PTO data from parent.
    this.dispatchEvent(new CustomEvent("pto-data-request", { bubbles: true }));
  }

  disconnectedCallback() {
    // Dispose the balance model to prevent memory leaks
    if (this._unsubscribeModel) {
      this._unsubscribeModel();
      this._unsubscribeModel = null;
    }
    if (this._model) {
      this._model.dispose();
      this._model = null;
    }
    super.disconnectedCallback();
  }

  /** Start listening for viewport changes to toggle multi-calendar mode. */
  private setupMultiCalendarDetection(): void {
    this.multiCalendarMql = window.matchMedia(
      `(min-width: ${MULTI_CALENDAR_BREAKPOINT}px)`,
    );
    // Apply initial mode — CSS handles show/hide via data-mode attribute
    this.applyMode(this.multiCalendarMql.matches);
    // Memory-safe listener tracked for automatic cleanup in disconnectedCallback
    this.addListener(
      this.multiCalendarMql,
      "change",
      this.handleMqlChange as EventListener,
    );
  }

  /** Whether the component is currently in multi-calendar (12-month grid) mode */
  get isMultiCalendar(): boolean {
    return this.getAttribute("data-mode") === "multi";
  }

  /**
   * Apply the responsive mode (single or multi-calendar).
   * All 12 calendars are always present in the DOM — CSS handles visibility
   * via the `data-mode` attribute on the host. This method toggles the
   * attribute and adjusts calendar header visibility for each mode.
   */
  private applyMode(isMulti: boolean): void {
    const newMode = isMulti ? "multi" : "single";
    if (this.getAttribute("data-mode") === newMode) return;

    this.setAttribute("data-mode", newMode);

    // Toggle calendar headers: show in multi, hide in single
    for (const cal of this.getAllCalendars()) {
      if (isMulti) {
        cal.removeAttribute("hide-header");
      } else {
        cal.setAttribute("hide-header", "true");
      }
    }

    if (!isMulti) {
      // Ensure an active month card is visible in single-calendar mode
      const month = this.getPersistedMonth();
      this.setActiveMonth(month);
    }
  }

  /**
   * Set the active month in single-calendar mode by moving the `.active`
   * class to the target month card and updating the navigation label.
   */
  private setActiveMonth(month: number): void {
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return;

    // Remove active from all cards
    container
      .querySelectorAll(".month-card.active")
      .forEach((card) => card.classList.remove("active"));

    // Add active to the target card
    const targetCard = container.querySelector(
      `.month-card[data-month="${month}"]`,
    );
    if (targetCard) {
      targetCard.classList.add("active");
    }

    // Update the nav label
    const year = getCurrentYear();
    this.updateMonthLabel(month, year);
  }

  /**
   * Navigate to an adjacent month in single-calendar mode.
   * Moves the `.active` class, persists the selected month,
   * and dispatches a month-changed event.
   */
  private switchToAdjacentMonth(direction: number): void {
    const activeCard = this.shadowRoot.querySelector(".month-card.active");
    const currentMonth = activeCard
      ? parseInt(activeCard.getAttribute("data-month") || "1", 10)
      : this.getPersistedMonth();

    let newMonth = currentMonth + direction;
    if (newMonth < 1) newMonth = 12;
    else if (newMonth > 12) newMonth = 1;

    this.setActiveMonth(newMonth);
    this.persistSelectedMonth(newMonth);

    const year = getCurrentYear();
    this.dispatchEvent(
      new CustomEvent("month-changed", {
        detail: { month: newMonth, year },
        bubbles: true,
      }),
    );
  }

  /**
   * Compute per-PTO-type hour totals from a list of entries and apply them
   * to a month-summary element via its hour attributes.
   */
  private updateSummaryHours(
    summary: MonthSummary,
    entries: ReadonlyArray<{ type: string; hours: number }>,
  ): void {
    const totals: Record<string, number> = {};
    for (const entry of entries) {
      totals[entry.type] = (totals[entry.type] || 0) + entry.hours;
    }
    summary.ptoHours = totals["PTO"] || 0;
    summary.sickHours = totals["Sick"] || 0;
    summary.bereavementHours = totals["Bereavement"] || 0;
    summary.juryDutyHours = totals["Jury Duty"] || 0;
  }

  /**
   * Collect PTO entries from all currently rendered calendars.
   */
  private collectPtoEntries(): PTOEntry[] {
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return [];

    const calendars = container.querySelectorAll("pto-calendar");
    const entries: PTOEntry[] = [];
    calendars.forEach((cal) => {
      entries.push(...(cal as PtoCalendar).ptoEntries);
    });
    return entries;
  }

  /**
   * Collect pending (uncommitted) selected cells from all currently rendered
   * calendars. Used to preserve selections when switching view modes.
   */
  private collectSelectedCells(): Map<string, number> {
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return new Map();

    const merged = new Map<string, number>();
    const calendars = container.querySelectorAll("pto-calendar");
    calendars.forEach((cal) => {
      for (const [date, hours] of (cal as PtoCalendar).selectedCells) {
        merged.set(date, hours);
      }
    });
    return merged;
  }

  /**
   * Push current pending selections (all calendars' selectedCells + active
   * PTO type) into the balance model so it can recompute overuse dates.
   */
  private updateModelPendingSelections(): void {
    if (!this._model) return;
    const merged = this.collectSelectedCells();
    const selections = new Map<string, PendingSelection>();
    for (const [date, hours] of merged) {
      selections.set(date, { hours, type: this._activePtoType as PTOType });
    }
    this._model.setPendingSelections(selections);
  }

  /**
   * Handle selection-changed events from any calendar.
   * Finds the parent month-card and updates the corresponding month-summary deltas.
   */
  private handleSelectionChanged(e: Event): void {
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

  /**
   * Handle PTO type change from an interactive month-summary.
   * Updates all calendars' selectedPtoType and syncs all month-summaries,
   * then recalculates deltas so the summary values reflect the new type.
   */
  private handlePtoTypeChanged(type: string): void {
    this._activePtoType = type;
    const calendars = this.getAllCalendars();
    for (const cal of calendars) {
      cal.selectedPtoType = type;
    }
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (!container) return;
    const summaries = container.querySelectorAll("month-summary");
    summaries.forEach((s) => {
      (s as MonthSummary).activeType = type;
    });

    // Recalculate deltas for each calendar's month-summary after re-typing
    for (const cal of calendars) {
      const card = cal.closest(".month-card");
      const summary = card?.querySelector(
        "month-summary",
      ) as MonthSummary | null;
      if (summary) {
        const selectedRequests = cal.getSelectedRequests();
        const existingEntries = cal.ptoEntries;
        summary.deltas = computeSelectionDeltas(
          selectedRequests,
          existingEntries,
        );
      }
    }

    // The PTO type changed — re-push pending selections so the model
    // recomputes overuse with the new type classification.
    this.updateModelPendingSelections();
  }

  /**
   * Public API: set the active PTO type from external callers
   * (e.g. submit-time-off-page balance summary).
   */
  setActivePtoType(type: string): void {
    this.handlePtoTypeChanged(type);
  }

  protected render(): string {
    const year = getCurrentYear();
    const calendarCards = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthName = monthNames[i];
      return `
                        <div class="month-card" data-month="${month}">
                            <pto-calendar
                                month="${month}"
                                year="${year}"
                                selected-month="${month}"
                                readonly="false"
                                hide-legend="true">
                            </pto-calendar>
                            <month-summary
                                interactive
                                active-type="${this._activePtoType}">
                            </month-summary>
                            <button type="button" class="btn-month-lock" data-action="toggle-month-lock" data-month="${month}" aria-label="Lock ${monthName}">🔓 Lock</button>
                        </div>
      `;
    }).join("");

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
                    <div id="calendar-container" class="calendar-container">
                        ${calendarCards}
                    </div>
                </div>
            </div>
        `;
  }

  // ── Event delegation ──

  protected setupEventDelegation(): void {
    super.setupEventDelegation();

    // Submit event from parent (e.g. submit-time-off-page)
    this.addListener(this, "submit", () => this.handleUnifiedSubmit());

    // Selection-changed events bubble from pto-calendar instances
    this.addListener(this.shadowRoot, "selection-changed", (e: Event) => {
      this.handleSelectionChanged(e);
      // Update the balance model with merged pending selections
      this.updateModelPendingSelections();
    });

    // PTO type changes from interactive month-summary components
    this.addListener(this.shadowRoot, "pto-type-changed", ((e: CustomEvent) => {
      const type = e.detail?.type;
      if (type) this.handlePtoTypeChanged(type);
    }) as EventListener);
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const actionEl = target.closest<HTMLElement>("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === "prev-month") {
      this.navigateMonth(-1);
    } else if (action === "next-month") {
      this.navigateMonth(1);
    } else if (action === "toggle-month-lock") {
      const monthNum = actionEl.dataset.month;
      if (!monthNum) return;
      const year = getCurrentYear();
      const monthKey = `${year}-${monthNum.padStart(2, "0")}`;
      this.dispatchEvent(
        new CustomEvent("toggle-month-lock", {
          detail: { month: monthKey },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ── Swipe navigation ──

  /**
   * Register swipe gesture detection on #calendar-container.
   * Delegates to the shared setupSwipeNavigation() helper which
   * handles touch detection, animation guards, and animateCarousel.
   */
  private setupSwipeListeners(): void {
    const container = this.shadowRoot.querySelector(
      "#calendar-container",
    ) as HTMLElement | null;
    if (!container) return;

    this._swipeHandle = setupSwipeNavigation(
      this as unknown as ListenerHost,
      container,
      (direction) => {
        if (!this.isMultiCalendar) {
          this.switchToAdjacentMonth(direction);
        }
      },
    );
  }

  /**
   * Navigate to the next/previous month in single-calendar mode
   * with carousel animation. Arrow button clicks use this method.
   * Swipe gestures bypass animation (handled by setupSwipeNavigation).
   */
  private navigateMonth(direction: number): void {
    // In multi-calendar mode, arrow navigation is hidden via CSS
    if (this.isMultiCalendar) return;

    const container = this.shadowRoot.querySelector(
      "#calendar-container",
    ) as HTMLElement | null;
    if (!container) {
      // Fallback: navigate without animation
      this.switchToAdjacentMonth(direction);
      return;
    }

    // Delegate to animateCarousel directly for arrow-button navigation
    animateCarousel(container, direction, () => {
      this.switchToAdjacentMonth(direction);
    });
  }

  /** Check if user prefers reduced motion */
  private prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  /** Return the calendar in the active month card, or the first calendar as fallback. */
  private getCalendar(): PtoCalendar | null {
    const activeCard = this.shadowRoot.querySelector(".month-card.active");
    if (activeCard) {
      return activeCard.querySelector("pto-calendar") as PtoCalendar | null;
    }
    // Fallback: first calendar
    return this.shadowRoot.querySelector("pto-calendar") as PtoCalendar | null;
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

    // Clear all summaries' deltas
    const container = this.shadowRoot.querySelector("#calendar-container");
    if (container) {
      container.querySelectorAll("month-summary").forEach((s) => {
        (s as MonthSummary).deltas = {};
      });
    }

    // Re-request PTO data to refresh
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

  setPtoData(ptoEntries: PTOEntry[]) {
    // Distribute entries to their respective month calendars (all modes)
    for (const cal of this.getAllCalendars()) {
      const month = cal.month;
      const calYear = cal.year;
      const monthEntries = ptoEntries.filter(
        (e) =>
          parseDate(e.date).month === month &&
          parseDate(e.date).year === calYear,
      );
      cal.ptoEntries = monthEntries;

      // Update the adjacent month-summary with committed hours
      const card = cal.closest(".month-card");
      const summary = card?.querySelector(
        "month-summary",
      ) as MonthSummary | null;
      if (summary) this.updateSummaryHours(summary, monthEntries);
    }

    // Seed persisted entries into the balance model (current year only —
    // the API returns all years but the model's budget is per-year).
    if (this._model) {
      const year = getCurrentYear();
      this._model.setPersistedEntries(
        ptoEntries
          .filter((e) => parseDate(e.date).year === year)
          .map((e) => ({
            date: e.date,
            hours: e.hours,
            type: e.type,
          })),
      );
    }
  }

  setPtoStatus(status: { availablePTO?: number }) {
    this.availablePtoBalance = status.availablePTO || 0;
  }

  /**
   * Create or replace the PtoBalanceModel with the given configuration.
   * Subscribes once to distribute overuse dates to all calendars.
   * Called by submit-time-off-page after receiving PTO status from the API.
   */
  setBalanceLimits(config: BalanceModelConfig): void {
    // Dispose previous model if any
    if (this._unsubscribeModel) {
      this._unsubscribeModel();
      this._unsubscribeModel = null;
    }
    if (this._model) {
      this._model.dispose();
    }

    // Create the new model
    this._model = new PtoBalanceModel(
      config.beginningBalance,
      config.monthlyAccruals,
      config.limits,
    );

    // Subscribe to distribute overuse dates and tooltips to all calendars
    this._unsubscribeModel = this._model.subscribe((overuseDates) => {
      const tooltips = this._model!.overuseTooltips;
      for (const cal of this.getAllCalendars()) {
        cal.overuseTooltips = tooltips;
        cal.overuseDates = overuseDates;
      }
    });

    // Seed persisted entries from current calendars into the model
    // (current year only — the API returns all years but the model's
    // budget is per-year).
    const entries = this.collectPtoEntries();
    if (entries.length > 0) {
      const year = getCurrentYear();
      this._model.setPersistedEntries(
        entries
          .filter((e) => parseDate(e.date).year === year)
          .map((e) => ({
            date: e.date,
            hours: e.hours,
            type: e.type,
          })),
      );
    }
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
      this.setActiveMonth(month);
      this.persistSelectedMonth(month);
      this.dispatchEvent(
        new CustomEvent("month-changed", {
          detail: { month, year },
          bubbles: true,
        }),
      );
    }
  }

  // ── Month persistence ──

  /**
   * Persist the selected month to localStorage so it survives
   * submissions and page reloads in single-calendar mode.
   */
  private persistSelectedMonth(month: number): void {
    this._storage.setItem(SELECTED_MONTH_STORAGE_KEY, month.toString());
  }

  /**
   * Retrieve the persisted month from localStorage, falling back
   * to the current month if nothing is stored or storage is unavailable.
   */
  private getPersistedMonth(): number {
    const stored = this._storage.getItem(SELECTED_MONTH_STORAGE_KEY);
    if (stored) {
      const month = parseInt(stored, 10);
      if (month >= 1 && month <= 12) return month;
    }
    const currentDate = today();
    return parseDate(currentDate).month;
  }

  /**
   * Clear the persisted month. Call when switching employees or
   * when the stored value is no longer valid.
   */
  clearPersistedMonth(): void {
    this._storage.removeItem(SELECTED_MONTH_STORAGE_KEY);
  }
}

customElements.define("pto-entry-form", PtoEntryForm);

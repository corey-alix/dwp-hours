import { isWorkingDay } from "../../../shared/businessRules.js";
import { CALENDAR_SYMBOLS } from "../../../shared/calendar-symbols.js";
import { BaseComponent } from "../base-component.js";
import { dayNoteDialogStyles } from "./css.js";

/**
 * `<day-note-dialog>` — modal dialog for adding/editing a note and custom
 * hours on a calendar day cell.
 *
 * ## Properties (set via JS, not attributes)
 * - `date`         — YYYY-MM-DD string for the target day
 * - `currentNote`  — pre-existing note text (empty string for new)
 * - `currentHours` — pre-existing hours value
 *
 * ## Events
 * - `day-note-save`   — `{ date, note, hours }` on save
 * - `day-note-cancel` — on cancel / overlay click / Escape
 */
export class DayNoteDialog extends BaseComponent {
  private _date = "";
  private _currentNote = "";
  private _currentHours = 0;
  private _validationError = "";
  private _overuseMessage = "";

  // ── Properties ──

  get date(): string {
    return this._date;
  }

  set date(v: string) {
    this._date = v;
    this.requestUpdate();
  }

  get currentNote(): string {
    return this._currentNote;
  }

  set currentNote(v: string) {
    this._currentNote = v;
    this.requestUpdate();
  }

  get currentHours(): number {
    return this._currentHours;
  }

  set currentHours(v: number) {
    this._currentHours = v;
    this.requestUpdate();
  }

  /** Overuse tooltip message to display when the day exceeds a balance limit. */
  get overuseMessage(): string {
    return this._overuseMessage;
  }

  set overuseMessage(v: string) {
    this._overuseMessage = v;
    this.requestUpdate();
  }

  // ── Lifecycle ──

  connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => {
      this.centerInViewport();
      const textarea = this.shadowRoot.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement | null;
      textarea?.focus({ preventScroll: true });
      // Fallback: ensure the dialog is scrolled into view
      const dialogEl = this.shadowRoot.querySelector(
        ".dialog",
      ) as HTMLElement | null;
      dialogEl?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }

  /**
   * Position the dialog at the vertical center of the visible viewport.
   *
   * `position: fixed` inside this component is relative to `#app-wrapper`
   * (which has `transform: scale(...)`) rather than the true viewport.
   * We compensate by calculating the viewport center in document
   * coordinates and applying it as `margin-top` on the `.dialog`.
   */
  private centerInViewport(): void {
    const dialogEl = this.shadowRoot.querySelector(
      ".dialog",
    ) as HTMLElement | null;
    if (!dialogEl) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const dialogHeight = dialogEl.offsetHeight;
    const topPos = Math.max(0, scrollTop + (viewportHeight - dialogHeight) / 2);
    dialogEl.style.marginTop = `${topPos}px`;
  }

  // ── Rendering ──

  protected render(): string {
    return `
      <style>${dayNoteDialogStyles}</style>
      <div class="overlay" data-action="overlay">
        <div class="dialog" role="dialog" aria-modal="true" aria-label="Day note for ${this.escapeAttr(this._date)}">
          <div class="dialog-header">Note — ${this.escapeAttr(this._date)}</div>
          ${this._overuseMessage ? `<div class="overuse-banner" role="alert"><span class="overuse-icon">${CALENDAR_SYMBOLS.OVERUSE}</span> ${this.escapeHtml(this._overuseMessage)}</div>` : ""}
          <div class="field">
            <label for="note-text">Note</label>
            <textarea id="note-text" cols="60" rows="5">${this.escapeHtml(this._currentNote)}</textarea>
          </div>
          <div class="field">
            <label for="note-hours">Hours</label>
            <input id="note-hours" type="number" step="0.5" value="${this._currentHours}" />
            <div class="validation-error" id="validation-msg">${this.escapeHtml(this._validationError)}</div>
          </div>
          <div class="actions">
            <button class="btn-cancel" data-action="cancel" type="button">Cancel</button>
            <button class="btn-save" data-action="save" type="button">Save</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Event delegation ──

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const action =
      target.dataset.action ??
      target.closest<HTMLElement>("[data-action]")?.dataset.action;

    if (action === "overlay") {
      // Only close if click was directly on overlay, not the dialog inside
      if (target.classList.contains("overlay")) {
        this.cancel();
      }
    } else if (action === "cancel") {
      this.cancel();
    } else if (action === "save") {
      this.save();
    }
  }

  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this.cancel();
    }
  }

  // ── Actions ──

  private save(): void {
    const textarea = this.shadowRoot.querySelector(
      "#note-text",
    ) as HTMLTextAreaElement | null;
    const hoursInput = this.shadowRoot.querySelector(
      "#note-hours",
    ) as HTMLInputElement | null;

    const note = textarea?.value.trim() ?? "";
    const hours = parseFloat(hoursInput?.value ?? "0");

    if (isNaN(hours)) {
      this._validationError = "Hours must be a number.";
      this.updateValidationDisplay();
      return;
    }

    // Negative hours only allowed on non-working days
    if (hours < 0 && isWorkingDay(this._date)) {
      this._validationError =
        "Negative hours only allowed on non-working days.";
      this.updateValidationDisplay();
      return;
    }

    this._validationError = "";

    this.dispatchEvent(
      new CustomEvent("day-note-save", {
        detail: { date: this._date, note, hours },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private cancel(): void {
    this.dispatchEvent(
      new CustomEvent("day-note-cancel", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Update only the validation message without full re-render (preserves textarea content). */
  private updateValidationDisplay(): void {
    const msgEl = this.shadowRoot.querySelector(
      "#validation-msg",
    ) as HTMLElement | null;
    if (msgEl) {
      msgEl.textContent = this._validationError;
    }
  }

  // ── Helpers ──

  private escapeAttr(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

customElements.define("day-note-dialog", DayNoteDialog);

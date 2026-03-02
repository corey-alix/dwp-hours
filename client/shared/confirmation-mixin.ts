/**
 * Two-click confirmation mixin for web components.
 *
 * Provides shared confirmation logic: first click enters "confirming" state
 * (CSS class + label change, 3 s auto-revert); second click executes.
 *
 * Usage — mixin approach (composition over inheritance):
 *
 * ```ts
 * import { ConfirmationController } from "../../shared/confirmation-mixin.js";
 *
 * class MyComponent extends BaseComponent {
 *   private _confirm = new ConfirmationController();
 *
 *   disconnectedCallback() {
 *     this._confirm.clearAll();
 *     super.disconnectedCallback();
 *   }
 *
 *   protected handleDelegatedClick(e: Event): void {
 *     const btn = (e.target as HTMLElement).closest("button") as HTMLButtonElement | null;
 *     if (!btn) return;
 *     this._confirm.handleClick(btn, () => {
 *       // execute confirmed action
 *     });
 *   }
 * }
 * ```
 *
 * The mixin manages a Map of pending confirmations with auto-revert timers.
 * Never override `resetConfirmation` / `clearConfirmation` in subclasses —
 * the controller owns the full lifecycle.
 */

/** Default auto-revert timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 3_000;

/**
 * Standalone confirmation controller — no inheritance required.
 * Attach an instance to any component that needs two-click confirmation.
 */
export class ConfirmationController {
  private _pending = new Map<HTMLButtonElement, number>();
  private _timeoutMs: number;

  constructor(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this._timeoutMs = timeoutMs;
  }

  /**
   * Process a button click. If the button is not yet confirming,
   * enters confirmation state and returns `false`. If it is already
   * confirming (second click), clears the confirmation and returns `true`.
   *
   * @param btn        The button element being clicked.
   * @param onConfirm  Callback invoked on the second (confirmed) click.
   * @param options    Optional overrides.
   * @param options.confirmLabel  Custom label for the confirming state.
   *                              Defaults to `"Confirm ${originalText}?"`.
   */
  handleClick(
    btn: HTMLButtonElement,
    onConfirm: () => void,
    options?: { confirmLabel?: string },
  ): void {
    if (btn.classList.contains("confirming")) {
      // Second click — confirmed
      this.clear(btn);
      onConfirm();
      return;
    }

    // First click — enter confirmation state
    const originalText = btn.textContent?.trim() ?? "";
    btn.classList.add("confirming");
    btn.textContent = options?.confirmLabel ?? `Confirm ${originalText}?`;

    const timer = window.setTimeout(() => {
      this.reset(btn, originalText);
    }, this._timeoutMs);
    this._pending.set(btn, timer);
  }

  /**
   * Returns `true` when the button is in the confirming state.
   * Useful for conditional confirmation (skip confirmation for
   * some actions, require it for others).
   */
  isConfirming(btn: HTMLButtonElement): boolean {
    return btn.classList.contains("confirming");
  }

  /**
   * Require confirmation only when `condition` is true.
   * When the condition is false the `onConfirm` callback fires immediately.
   *
   * @param btn        The button element being clicked.
   * @param condition  Whether to gate execution behind two-click confirmation.
   * @param onConfirm  Callback invoked when the action is confirmed (or condition is false).
   * @param options    Optional overrides.
   */
  handleConditionalClick(
    btn: HTMLButtonElement,
    condition: boolean,
    onConfirm: () => void,
    options?: { confirmLabel?: string },
  ): void {
    if (!condition) {
      // No confirmation needed — execute immediately
      this.clear(btn);
      onConfirm();
      return;
    }
    this.handleClick(btn, onConfirm, options);
  }

  /** Reset a single button to its original state (auto-revert). */
  private reset(btn: HTMLButtonElement, originalText: string): void {
    btn.classList.remove("confirming");
    btn.textContent = originalText;
    this._pending.delete(btn);
  }

  /** Clear a single button's pending timer and remove confirming class. */
  clear(btn: HTMLButtonElement): void {
    const timer = this._pending.get(btn);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._pending.delete(btn);
    }
    btn.classList.remove("confirming");
  }

  /** Clear all pending confirmations (call in disconnectedCallback). */
  clearAll(): void {
    for (const [btn, timer] of this._pending) {
      clearTimeout(timer);
      btn.classList.remove("confirming");
    }
    this._pending.clear();
  }

  /** Number of buttons currently in confirming state. */
  get pendingCount(): number {
    return this._pending.size;
  }
}

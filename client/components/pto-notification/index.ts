import { BaseComponent } from "../base-component.js";

export type NotificationLevel = "success" | "error" | "info" | "warning";

interface ToastEntry {
  id: number;
  level: NotificationLevel;
  message: string;
  title?: string;
  visible: boolean;
  fadingOut: boolean;
}

/**
 * `<pto-notification>` — toast notification component.
 *
 * Pure shadow DOM display component extending BaseComponent.
 * The PtoNotificationController feeds messages via the `show()` method.
 */
export class PtoNotification extends BaseComponent {
  private _toasts: ToastEntry[] = [];
  private _nextId = 0;

  /**
   * Show a toast notification.
   * Mirrors the old NotificationManager.show() signature.
   */
  show(
    message: string,
    level: NotificationLevel = "info",
    title?: string,
    duration = 5000,
  ): void {
    const id = this._nextId++;
    const entry: ToastEntry = {
      id,
      level,
      message,
      title,
      visible: false,
      fadingOut: false,
    };
    this._toasts.push(entry);
    this.requestUpdate();

    // Slide-in on next frame
    requestAnimationFrame(() => {
      entry.visible = true;
      this.requestUpdate();
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  /** Dismiss a toast by id (with fade-out animation). */
  dismiss(id: number): void {
    const entry = this._toasts.find((t) => t.id === id);
    if (!entry) return;
    entry.fadingOut = true;
    this.requestUpdate();
    setTimeout(() => {
      this._toasts = this._toasts.filter((t) => t.id !== id);
      this.requestUpdate();
    }, 300);
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    const closeBtn = target.closest("[data-dismiss]") as HTMLElement | null;
    if (closeBtn) {
      e.preventDefault();
      const id = Number(closeBtn.getAttribute("data-dismiss"));
      this.dismiss(id);
    }
  }

  protected render(): string {
    const toastsHtml = this._toasts
      .map((t) => {
        const classes = [
          "toast",
          t.level,
          t.visible ? "show" : "",
          t.fadingOut ? "fade-out" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const titleHtml = t.title
          ? `<div class="toast-title">${this.escapeHtml(t.title)}</div>`
          : "";

        return `
        <div class="${classes}">
          <div class="toast-content">
            ${titleHtml}
            <div class="toast-message">${this.escapeHtml(t.message)}</div>
          </div>
          <button class="toast-close" data-dismiss="${t.id}">&times;</button>
        </div>`;
      })
      .join("");

    return `
      <style>
        :host {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          max-width: 400px;
          display: block;
          pointer-events: none;
        }

        .toast {
          pointer-events: auto;
          background: var(--color-surface, #fff);
          border-radius: var(--border-radius, 6px);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -4px rgb(0 0 0 / 10%);
          margin-bottom: 8px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          border-left: 4px solid;
          border: 1px solid var(--color-border, #e5e7eb);
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.3s ease;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(0);
        }

        .toast.fade-out {
          opacity: 0;
          transform: translateX(100%);
        }

        .toast.success { border-left-color: var(--color-success, #22c55e); }

        .toast.error { border-left-color: var(--color-error, #ef4444); }

        .toast.info { border-left-color: var(--color-info, #3b82f6); }

        .toast.warning { border-left-color: var(--color-warning, #f59e0b); }

        .toast-content {
          flex: 1;
          margin-right: 12px;
        }

        .toast-title {
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 14px;
          color: var(--color-text, #111827);
        }

        .toast-message {
          font-size: 14px;
          line-height: 1.4;
          color: var(--color-text-secondary, #4b5563);
        }

        .toast-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: var(--color-text-muted, #9ca3af);
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .toast-close:hover {
          background-color: var(--color-surface-hover, #f3f4f6);
          color: var(--color-text, #111827);
        }
      </style>
      ${toastsHtml}
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Register the component
if (!customElements.get("pto-notification")) {
  customElements.define("pto-notification", PtoNotification);
}

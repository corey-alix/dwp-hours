import { BaseComponent } from "../base-component.js";

export type LogLevel =
  | "log"
  | "info"
  | "warn"
  | "error"
  | "success"
  | "warning";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

/**
 * Pure display component for debug logging.
 * No side effects — does not intercept console.* or install global handlers.
 * The controller (DebugConsoleController) feeds messages via the `log()` method.
 */
export class DebugConsole extends BaseComponent {
  private _entries: LogEntry[] = [];
  private maxMessages = 100;

  /** Append a log entry and re-render. */
  log(level: LogLevel, message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this._entries.unshift({ timestamp, level, message });

    if (this._entries.length > this.maxMessages) {
      this._entries = this._entries.slice(0, this.maxMessages);
    }

    this.requestUpdate();
  }

  /** Clear all log entries. */
  clear(): void {
    this._entries = [];
    this.requestUpdate();
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.closest("[data-action='clear']")) {
      e.preventDefault();
      this.clear();
    }
  }

  protected render(): string {
    const entriesHtml = this._entries
      .map((entry) => {
        const colorVar = this.levelColor(entry.level);
        const escaped = this.escapeHtml(
          `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
        );
        return `<div class="log-entry" style="color: ${colorVar};">${escaped}</div>`;
      })
      .join("");

    return `
      <style>
        :host {
          display: block;
        }

        details {
          position: fixed;
          bottom: 10px;
          right: 10px;
          width: 400px;
          max-height: 300px;
          background: var(--color-background, #fff);
          border: 1px solid var(--color-surface, #e5e7eb);
          border-radius: 4px;
          z-index: 9999;
          font-family: monospace;
          font-size: 12px;
          overflow: hidden;
        }

        summary {
          padding: 8px;
          background: var(--color-surface, #f5f5f5);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clear-btn {
          background: var(--color-error, #ef4444);
          color: white;
          border: none;
          padding: 2px 6px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
        }

        .log-container {
          max-height: 250px;
          overflow-y: auto;
          padding: 8px;
          background: var(--color-background, #fff);
        }

        .log-entry {
          margin-bottom: 4px;
        }
      </style>
      <details>
        <summary>
          Debug Console
          <button class="clear-btn" data-action="clear">Clear</button>
        </summary>
        <div class="log-container">${entriesHtml}</div>
      </details>
    `;
  }

  private levelColor(level: LogLevel): string {
    switch (level) {
      case "error":
        return "var(--color-error, #ef4444)";
      case "warn":
      case "warning":
        return "var(--color-warning, orange)";
      case "success":
        return "var(--color-success, #22c55e)";
      default:
        return "var(--color-text, inherit)";
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Register the component
if (!customElements.get("debug-console")) {
  customElements.define("debug-console", DebugConsole);
}

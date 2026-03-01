import type { TraceListenerHandler, TraceMessage } from "./TraceListener.js";
import type {
  DebugConsole,
  LogLevel,
} from "../components/debug-console/index.js";

/**
 * Bridges TraceListener messages to `<debug-console>`.
 *
 * All debug-mode hooks are gated on `?debug=1` query string:
 * - Console interception (console.log / warn / error)
 * - Global error and unhandled-rejection handlers
 * - Auto-injection of `<debug-console>` if absent from the DOM
 *
 * If `debug != 1`, this controller still forwards TraceListener
 * messages to `<debug-console>` if the element happens to be present
 * (e.g., test pages that include it declaratively), but no console
 * interception or error hooking occurs.
 *
 * Lifecycle:
 *   `activate()` — set up console interception & error handlers (idempotent)
 *   `deactivate()` — restore originals and remove the element (idempotent)
 */
export class DebugConsoleController implements TraceListenerHandler {
  private element: DebugConsole | null = null;
  private originalConsoleLog: typeof console.log | null = null;
  private originalConsoleWarn: typeof console.warn | null = null;
  private originalConsoleError: typeof console.error | null = null;
  private _errorHandler: ((event: ErrorEvent) => void) | null = null;
  private _rejectionHandler: ((event: PromiseRejectionEvent) => void) | null =
    null;
  private _active = false;

  constructor() {
    const isDebug =
      new URLSearchParams(window.location.search).get("debug") === "1";

    this.element = document.querySelector<DebugConsole>("debug-console");

    if (isDebug) {
      this.activate();
    }
  }

  /**
   * Set up console interception, exception handlers, and inject
   * `<debug-console>` if absent. Safe to call multiple times —
   * subsequent calls are no-ops while already active.
   */
  activate(): void {
    if (this._active) return;
    this._active = true;

    // Inject if absent
    if (!this.element) {
      this.element = document.createElement("debug-console") as DebugConsole;
      document.body.appendChild(this.element);
    }

    this.setupConsoleInterception();
    this.setupExceptionHandlers();
  }

  /**
   * Restore original `console.*` methods, remove global error/rejection
   * listeners, and detach the `<debug-console>` element. Safe to call
   * multiple times — subsequent calls are no-ops while already inactive.
   */
  deactivate(): void {
    if (!this._active) return;
    this._active = false;

    // Restore console methods
    if (this.originalConsoleLog) console.log = this.originalConsoleLog;
    if (this.originalConsoleWarn) console.warn = this.originalConsoleWarn;
    if (this.originalConsoleError) console.error = this.originalConsoleError;
    this.originalConsoleLog = null;
    this.originalConsoleWarn = null;
    this.originalConsoleError = null;

    // Remove global event listeners
    if (this._errorHandler) {
      window.removeEventListener("error", this._errorHandler);
      this._errorHandler = null;
    }
    if (this._rejectionHandler) {
      window.removeEventListener("unhandledrejection", this._rejectionHandler);
      this._rejectionHandler = null;
    }

    // Detach element
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  /** Forward TraceListener messages to the debug console. */
  onTrace(msg: TraceMessage): void {
    const level: LogLevel = msg.level === "success" ? "success" : msg.level;
    const text = msg.title ? `[${msg.title}] ${msg.message}` : msg.message;
    this.element?.log(level, text);
  }

  /** @deprecated Use `deactivate()` instead. Kept for backward compatibility. */
  destroy(): void {
    this.deactivate();
  }

  // ── Private ──

  private setupConsoleInterception(): void {
    this.originalConsoleLog = console.log;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;

    console.log = (...args: unknown[]) => {
      try {
        this.element?.log("log", this.formatArgs(args));
      } catch {
        /* swallow — never block the original */
      }
      this.originalConsoleLog!(...args);
    };

    console.warn = (...args: unknown[]) => {
      try {
        this.element?.log("warn", this.formatArgs(args));
      } catch {
        /* swallow — never block the original */
      }
      this.originalConsoleWarn!(...args);
    };

    console.error = (...args: unknown[]) => {
      try {
        this.element?.log("error", this.formatArgs(args));
      } catch {
        /* swallow — never block the original */
      }
      this.originalConsoleError!(...args);
    };
  }

  private setupExceptionHandlers(): void {
    this._errorHandler = (event: ErrorEvent) => {
      this.element?.log(
        "error",
        `Unhandled error: ${event.message} (${event.filename}:${event.lineno})`,
      );
    };
    window.addEventListener("error", this._errorHandler);

    this._rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason);
      this.element?.log("error", `Unhandled rejection: ${reason}`);
    };
    window.addEventListener("unhandledrejection", this._rejectionHandler);
  }

  private formatArgs(args: unknown[]): string {
    return args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");
  }
}

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
 */
export class DebugConsoleController implements TraceListenerHandler {
  private element: DebugConsole | null;
  private originalConsoleLog: typeof console.log | null = null;
  private originalConsoleWarn: typeof console.warn | null = null;
  private originalConsoleError: typeof console.error | null = null;

  constructor() {
    const isDebug =
      new URLSearchParams(window.location.search).get("debug") === "1";

    this.element = document.querySelector<DebugConsole>("debug-console");

    if (isDebug) {
      // Inject if absent
      if (!this.element) {
        this.element = document.createElement("debug-console") as DebugConsole;
        document.body.appendChild(this.element);
      }

      this.setupConsoleInterception();
      this.setupExceptionHandlers();
    }
  }

  /** Forward TraceListener messages to the debug console. */
  onTrace(msg: TraceMessage): void {
    const level: LogLevel = msg.level === "success" ? "success" : msg.level;
    const text = msg.title ? `[${msg.title}] ${msg.message}` : msg.message;
    this.element?.log(level, text);
  }

  /** Tear down hooks (useful for tests). */
  destroy(): void {
    if (this.originalConsoleLog) console.log = this.originalConsoleLog;
    if (this.originalConsoleWarn) console.warn = this.originalConsoleWarn;
    if (this.originalConsoleError) console.error = this.originalConsoleError;
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
    window.addEventListener("error", (event) => {
      this.element?.log(
        "error",
        `Unhandled error: ${event.message} (${event.filename}:${event.lineno})`,
      );
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason);
      this.element?.log("error", `Unhandled rejection: ${reason}`);
    });
  }

  private formatArgs(args: unknown[]): string {
    return args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      )
      .join(" ");
  }
}

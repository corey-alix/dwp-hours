/**
 * TraceListener — central message fan-out.
 *
 * Replaces NotificationManager.  Call sites keep calling
 * `notifications.success(...)` etc. — the variable now holds
 * a TraceListener instead.
 *
 * Controllers register as listeners and receive every message:
 *   traceListener.addListener(new PtoNotificationController());
 *   traceListener.addListener(new DebugConsoleController());
 */

export type TraceLevel = "success" | "error" | "info" | "warning";

export interface TraceMessage {
  level: TraceLevel;
  message: string;
  title?: string;
  duration?: number;
  /** Called when the user explicitly dismisses the notification (click). */
  onDismiss?: () => void;
}

/** Optional second argument for convenience methods (`info`, `success`, etc.). */
export interface TraceOptions {
  title?: string;
  /** Auto-dismiss timeout in milliseconds (overrides default duration). */
  autoDismissMs?: number;
  /** Called when the user explicitly clicks dismiss (not on auto-dismiss). */
  onDismiss?: () => void;
}

export interface TraceListenerHandler {
  onTrace(msg: TraceMessage): void;
}

/** Normalise convenience-method overloads into a flat options bag. */
function normalizeArgs(
  titleOrOptions?: string | TraceOptions,
  duration?: number,
): Partial<TraceMessage> {
  if (typeof titleOrOptions === "object" && titleOrOptions !== null) {
    return {
      title: titleOrOptions.title,
      duration: titleOrOptions.autoDismissMs,
      onDismiss: titleOrOptions.onDismiss,
    };
  }
  return { title: titleOrOptions, duration };
}

export class TraceListener {
  private listeners: TraceListenerHandler[] = [];

  addListener(handler: TraceListenerHandler): void {
    this.listeners.push(handler);
  }

  removeListener(handler: TraceListenerHandler): void {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }

  // ── Convenience API (backward-compatible with NotificationManager) ──

  success(message: string, options?: TraceOptions): void;
  success(message: string, title?: string, duration?: number): void;
  success(
    message: string,
    titleOrOptions?: string | TraceOptions,
    duration?: number,
  ): void {
    const opts = normalizeArgs(titleOrOptions, duration);
    this.emit({ level: "success", message, ...opts });
  }

  error(message: string, options?: TraceOptions): void;
  error(message: string, title?: string, duration?: number): void;
  error(
    message: string,
    titleOrOptions?: string | TraceOptions,
    duration?: number,
  ): void {
    const opts = normalizeArgs(titleOrOptions, duration);
    this.emit({ level: "error", message, ...opts });
  }

  info(message: string, options?: TraceOptions): void;
  info(message: string, title?: string, duration?: number): void;
  info(
    message: string,
    titleOrOptions?: string | TraceOptions,
    duration?: number,
  ): void {
    const opts = normalizeArgs(titleOrOptions, duration);
    this.emit({ level: "info", message, ...opts });
  }

  warning(message: string, options?: TraceOptions): void;
  warning(message: string, title?: string, duration?: number): void;
  warning(
    message: string,
    titleOrOptions?: string | TraceOptions,
    duration?: number,
  ): void {
    const opts = normalizeArgs(titleOrOptions, duration);
    this.emit({ level: "warning", message, ...opts });
  }

  // ── Internal ──

  private emit(msg: TraceMessage): void {
    for (const listener of this.listeners) {
      try {
        listener.onTrace(msg);
      } catch (err) {
        // Don't let a broken listener stop other listeners from receiving
        console.error("TraceListener handler error:", err);
      }
    }
  }
}

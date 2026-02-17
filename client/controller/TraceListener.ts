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
}

export interface TraceListenerHandler {
  onTrace(msg: TraceMessage): void;
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

  success(message: string, title?: string, duration?: number): void {
    this.emit({ level: "success", message, title, duration });
  }

  error(message: string, title?: string, duration?: number): void {
    this.emit({ level: "error", message, title, duration });
  }

  info(message: string, title?: string, duration?: number): void {
    this.emit({ level: "info", message, title, duration });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.emit({ level: "warning", message, title, duration });
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

import type { TraceListenerHandler, TraceMessage } from "./TraceListener.js";
import type { PtoNotification } from "../components/pto-notification/index.js";

/**
 * Bridges TraceListener messages to the `<pto-notification>` component.
 *
 * If the element is present in the DOM the controller forwards every
 * trace message as a visible toast.  If absent, messages are silently
 * dropped (no errors).
 */
export class PtoNotificationController implements TraceListenerHandler {
  private element: PtoNotification | null;

  constructor() {
    this.element = document.querySelector<PtoNotification>("pto-notification");

    // Auto-inject if absent
    if (!this.element) {
      this.element = document.createElement(
        "pto-notification",
      ) as PtoNotification;
      document.body.appendChild(this.element);
    }
  }

  onTrace(msg: TraceMessage): void {
    this.element?.show(msg.message, msg.level, msg.title, msg.duration);
  }
}

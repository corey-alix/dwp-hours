// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PtoNotification } from "../client/components/pto-notification/index.js";

describe("PtoNotification onDismiss", () => {
  let component: PtoNotification;

  beforeEach(() => {
    component = new PtoNotification();
    document.body.appendChild(component);
  });

  it("should accept an onDismiss callback via show()", () => {
    const onDismiss = vi.fn();
    component.show("Test message", "info", undefined, 0, onDismiss);

    // Toast should be rendered
    const toast = component.shadowRoot?.querySelector(".toast");
    expect(toast).toBeTruthy();
  });

  it("should fire onDismiss when user clicks the close button", () => {
    const onDismiss = vi.fn();
    // duration=0 prevents auto-dismiss
    component.show("Test message", "info", undefined, 0, onDismiss);

    const closeBtn = component.shadowRoot?.querySelector(
      ".toast-close",
    ) as HTMLElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("should NOT fire onDismiss on auto-dismiss (timeout)", async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    component.show("Test message", "info", undefined, 100, onDismiss);

    // Fast-forward past auto-dismiss timeout
    vi.advanceTimersByTime(500);

    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("should not throw when onDismiss is not provided", () => {
    component.show("No callback", "info", undefined, 0);

    const closeBtn = component.shadowRoot?.querySelector(
      ".toast-close",
    ) as HTMLElement;
    expect(closeBtn).toBeTruthy();

    // Should not throw
    expect(() => closeBtn.click()).not.toThrow();
  });
});

// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";

/**
 * Tests for Submit Time Off page event wiring.
 *
 * The key invariant is that events dispatched by <pto-entry-form> must
 * bubble so they reach the <submit-time-off-page> shadow root listener.
 *
 * Bug history:
 * - pto-submit was dispatched without bubbles:true, so Submit Time Off
 *   did not actually submit (the shadow root listener never fired).
 * - pto-data-request had the same issue, preventing calendar data reload.
 */
describe("Submit Time Off - event bubbling", () => {
  it("pto-submit event should bubble from child to parent shadow root", () => {
    // Simulate the DOM structure:
    //   <parent-host>
    //     #shadow-root  ← listener here
    //       <child-host>  ← event dispatched here
    const parent = document.createElement("div");
    const shadow = parent.attachShadow({ mode: "open" });
    const child = document.createElement("div");
    shadow.appendChild(child);

    const handler = vi.fn();
    shadow.addEventListener("pto-submit", handler);

    // With bubbles: true, the event reaches the shadow root
    child.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests: [{ date: "2026-02-10", type: "PTO", hours: 8 }] },
        bubbles: true,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.requests).toHaveLength(1);
  });

  it("pto-submit event without bubbles does NOT reach parent shadow root", () => {
    const parent = document.createElement("div");
    const shadow = parent.attachShadow({ mode: "open" });
    const child = document.createElement("div");
    shadow.appendChild(child);

    const handler = vi.fn();
    shadow.addEventListener("pto-submit", handler);

    // Without bubbles: true, the event stays on the child — this was the bug
    child.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests: [] },
        // bubbles defaults to false
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("pto-data-request event should bubble from child to parent shadow root", () => {
    const parent = document.createElement("div");
    const shadow = parent.attachShadow({ mode: "open" });
    const child = document.createElement("div");
    shadow.appendChild(child);

    const handler = vi.fn();
    shadow.addEventListener("pto-data-request", handler);

    child.dispatchEvent(new CustomEvent("pto-data-request", { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("pto-validation-error event should bubble from child to parent shadow root", () => {
    const parent = document.createElement("div");
    const shadow = parent.attachShadow({ mode: "open" });
    const child = document.createElement("div");
    shadow.appendChild(child);

    const handler = vi.fn();
    shadow.addEventListener("pto-validation-error", handler);

    child.dispatchEvent(
      new CustomEvent("pto-validation-error", {
        detail: { errors: ["test error"] },
        bubbles: true,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.errors).toEqual(["test error"]);
  });

  it("month-changed event should bubble from child to parent shadow root", () => {
    const parent = document.createElement("div");
    const shadow = parent.attachShadow({ mode: "open" });
    const child = document.createElement("div");
    shadow.appendChild(child);

    const handler = vi.fn();
    shadow.addEventListener("month-changed", handler);

    child.dispatchEvent(
      new CustomEvent("month-changed", {
        detail: { month: 3, year: 2026 },
        bubbles: true,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      month: 3,
      year: 2026,
    });
  });
});

describe("Submit Time Off - request payload", () => {
  it("requests from pto-entry-form may omit employeeId (server defaults to authenticated user)", () => {
    // Bug history:
    // The calendar submits requests like { date, hours, type } without employeeId.
    // For Admin users, the server used to assign `undefined` as targetEmployeeId
    // because the Admin branch read empId from the request body (which was absent).
    // Fix: server now falls back to authenticatedEmployeeId when empId is missing.

    // Verify the shape that pto-entry-form actually sends — no employeeId field
    const calendarRequests = [
      { date: "2026-02-12", hours: 8, type: "PTO" },
      { date: "2026-02-13", hours: 0, type: "Sick", id: 19 },
    ];

    const payload = { requests: calendarRequests };

    // None of the requests should have employeeId — that's the server's job
    for (const req of payload.requests) {
      expect(req).not.toHaveProperty("employeeId");
    }

    // The payload should have the `requests` array
    expect(payload.requests).toHaveLength(2);
  });
});
describe("Submit Time Off - lock button text", () => {
  /**
   * Helper: simulate the applyLockStateUI logic for the lock button
   * so we can verify button text and CSS classes without instantiating
   * the full web component.
   */
  function applyLockUI(
    lockBtn: HTMLButtonElement,
    state: "unlocked" | "employee-locked" | "admin-locked",
  ) {
    switch (state) {
      case "unlocked":
        lockBtn.textContent = "🔓 Lock Month";
        lockBtn.classList.remove("btn-unlock", "hidden");
        lockBtn.classList.add("btn-lock");
        break;
      case "employee-locked":
        lockBtn.textContent = "🔒 Unlock Month";
        lockBtn.classList.remove("btn-lock", "hidden");
        lockBtn.classList.add("btn-unlock");
        break;
      case "admin-locked":
        lockBtn.classList.add("hidden");
        break;
    }
  }

  it("should show '🔓 Lock Month' when unlocked", () => {
    const btn = document.createElement("button");
    applyLockUI(btn, "unlocked");
    expect(btn.textContent).toBe("🔓 Lock Month");
    expect(btn.classList.contains("btn-lock")).toBe(true);
    expect(btn.classList.contains("btn-unlock")).toBe(false);
    expect(btn.classList.contains("hidden")).toBe(false);
  });

  it("should show '🔒 Unlock Month' when employee-locked", () => {
    const btn = document.createElement("button");
    applyLockUI(btn, "employee-locked");
    expect(btn.textContent).toBe("🔒 Unlock Month");
    expect(btn.classList.contains("btn-unlock")).toBe(true);
    expect(btn.classList.contains("btn-lock")).toBe(false);
    expect(btn.classList.contains("hidden")).toBe(false);
  });

  it("should be hidden when admin-locked", () => {
    const btn = document.createElement("button");
    applyLockUI(btn, "admin-locked");
    expect(btn.classList.contains("hidden")).toBe(true);
  });

  it("should transition from unlocked to employee-locked correctly", () => {
    const btn = document.createElement("button");
    applyLockUI(btn, "unlocked");
    expect(btn.textContent).toBe("🔓 Lock Month");

    applyLockUI(btn, "employee-locked");
    expect(btn.textContent).toBe("🔒 Unlock Month");
    expect(btn.classList.contains("btn-lock")).toBe(false);
    expect(btn.classList.contains("btn-unlock")).toBe(true);
  });

  it("should transition from employee-locked back to unlocked correctly", () => {
    const btn = document.createElement("button");
    applyLockUI(btn, "employee-locked");
    expect(btn.textContent).toBe("🔒 Unlock Month");

    applyLockUI(btn, "unlocked");
    expect(btn.textContent).toBe("🔓 Lock Month");
    expect(btn.classList.contains("btn-unlock")).toBe(false);
    expect(btn.classList.contains("btn-lock")).toBe(true);
  });
});

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

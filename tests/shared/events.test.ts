// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import {
  dispatchTypedEvent,
  type AppEvents,
} from "../../client/shared/events.js";

describe("dispatchTypedEvent", () => {
  it("dispatches a CustomEvent with correct name and detail", () => {
    const target = document.createElement("div");
    let received: CustomEvent<AppEvents["employee-submit"]> | null = null;

    target.addEventListener("employee-submit", (e) => {
      received = e as CustomEvent<AppEvents["employee-submit"]>;
    });

    const employee = { name: "Jane Doe" };
    dispatchTypedEvent(target, "employee-submit", { employee });

    expect(received).not.toBeNull();
    expect(received!.detail.employee.name).toBe("Jane Doe");
    expect(received!.bubbles).toBe(true);
    expect(received!.composed).toBe(true);
  });

  it("events bubble through the DOM", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    let bubbled = false;
    parent.addEventListener("month-changed", () => {
      bubbled = true;
    });

    dispatchTypedEvent(child, "month-changed", { month: 3 });
    expect(bubbled).toBe(true);

    document.body.removeChild(parent);
  });

  it("allows overriding composed to false", () => {
    const target = document.createElement("div");
    let received: CustomEvent | null = null;

    target.addEventListener("form-cancel", (e) => {
      received = e as CustomEvent;
    });

    dispatchTypedEvent(target, "form-cancel", {} as Record<string, never>, {
      composed: false,
    });

    expect(received).not.toBeNull();
    expect(received!.composed).toBe(false);
  });

  it("returns true when event is not cancelled", () => {
    const target = document.createElement("div");
    const result = dispatchTypedEvent(
      target,
      "logout",
      {} as Record<string, never>,
    );
    expect(result).toBe(true);
  });
});

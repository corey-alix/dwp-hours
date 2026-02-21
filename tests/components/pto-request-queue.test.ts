// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtoRequestQueue } from "../../client/components/pto-request-queue/index.js";

function makePendingRequest(overrides = {}) {
  return {
    id: 1,
    employeeId: 10,
    employeeName: "John Doe",
    startDate: "2025-03-10",
    endDate: "2025-03-12",
    type: "PTO" as const,
    hours: 24,
    status: "pending" as const,
    createdAt: "2025-03-01T10:00:00Z",
    ...overrides,
  };
}

describe("PtoRequestQueue Component", () => {
  let component: PtoRequestQueue;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoRequestQueue();
    container.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("Component Initialization", () => {
    it("should create component instance with shadow DOM", () => {
      expect(component).toBeInstanceOf(PtoRequestQueue);
      expect(component.shadowRoot).toBeTruthy();
    });

    it("should render styles via css.ts import", () => {
      const html = component.shadowRoot?.innerHTML || "";
      expect(html).toContain("<style>");
      expect(html).toContain(".queue-container");
    });

    it("should show empty state when no requests", () => {
      const emptyState = component.shadowRoot?.querySelector(".empty-state");
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain("No pending requests");
    });
  });

  describe("Requests Property (private field + requestUpdate)", () => {
    it("should accept requests via property setter", () => {
      const requests = [makePendingRequest()];
      component.requests = requests;
      expect(component.requests).toEqual(requests);
    });

    it("should re-render when requests are set", () => {
      component.requests = [makePendingRequest()];

      const cards = component.shadowRoot?.querySelectorAll(".request-card");
      expect(cards?.length).toBe(1);
    });

    it("should show empty state after clearing requests", () => {
      component.requests = [makePendingRequest()];
      component.requests = [];

      const emptyState = component.shadowRoot?.querySelector(".empty-state");
      expect(emptyState).toBeTruthy();
    });

    it("should only show pending requests", () => {
      component.requests = [
        makePendingRequest({ id: 1, status: "pending" }),
        makePendingRequest({ id: 2, status: "approved" }),
        makePendingRequest({ id: 3, status: "rejected" }),
      ];

      const cards = component.shadowRoot?.querySelectorAll(".request-card");
      expect(cards?.length).toBe(1);
    });
  });

  describe("Rendering", () => {
    it("should display employee name", () => {
      component.requests = [makePendingRequest({ employeeName: "Jane Smith" })];

      const name = component.shadowRoot?.querySelector(".employee-name");
      expect(name?.textContent).toBe("Jane Smith");
    });

    it("should display request type", () => {
      component.requests = [makePendingRequest({ type: "Sick" })];

      const typeEl = component.shadowRoot?.querySelector(".request-type");
      expect(typeEl?.textContent).toBe("Sick");
    });

    it("should display hours requested", () => {
      component.requests = [makePendingRequest({ hours: 16 })];

      const details = component.shadowRoot?.querySelectorAll(".detail-value");
      const hoursDetail = details?.[0];
      expect(hoursDetail?.textContent).toContain("16");
    });

    it("should display pending count in stats", () => {
      component.requests = [
        makePendingRequest({ id: 1 }),
        makePendingRequest({ id: 2 }),
      ];

      const statValue = component.shadowRoot?.querySelector(".stat-value");
      expect(statValue?.textContent).toBe("2");
    });

    it("should render multiple request cards", () => {
      component.requests = [
        makePendingRequest({ id: 1, employeeName: "Alice" }),
        makePendingRequest({ id: 2, employeeName: "Bob" }),
        makePendingRequest({ id: 3, employeeName: "Carol" }),
      ];

      const cards = component.shadowRoot?.querySelectorAll(".request-card");
      expect(cards?.length).toBe(3);
    });
  });

  describe("Event Delegation", () => {
    it("should dispatch request-approve event on approve click", () => {
      component.requests = [makePendingRequest({ id: 42 })];

      let firedEvent: CustomEvent | null = null;
      component.addEventListener("request-approve", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const approveBtn = component.shadowRoot?.querySelector(
        ".action-btn.approve",
      ) as HTMLButtonElement;
      approveBtn?.click();

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.requestId).toBe(42);
    });

    it("should dispatch request-reject event on reject click", () => {
      component.requests = [makePendingRequest({ id: 7 })];

      let firedEvent: CustomEvent | null = null;
      component.addEventListener("request-reject", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const rejectBtn = component.shadowRoot?.querySelector(
        ".action-btn.reject",
      ) as HTMLButtonElement;
      rejectBtn?.click();

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.requestId).toBe(7);
    });

    it("should include correct requestId for specific card", () => {
      component.requests = [
        makePendingRequest({ id: 10 }),
        makePendingRequest({ id: 20 }),
      ];

      let firedEvent: CustomEvent | null = null;
      component.addEventListener("request-approve", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      // Click approve on the second card
      const approveBtns = component.shadowRoot?.querySelectorAll(
        ".action-btn.approve",
      );
      (approveBtns?.[1] as HTMLButtonElement)?.click();

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.requestId).toBe(20);
    });
  });
});

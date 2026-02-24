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
      const texts = Array.from(details ?? []).map((el) => el.textContent);
      expect(texts.some((t) => t?.includes("16"))).toBe(true);
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

  describe("Dismiss Animation", () => {
    it("dismissCard should resolve and hide card", async () => {
      component.requests = [
        makePendingRequest({ id: 1 }),
        makePendingRequest({ id: 2 }),
      ];

      const card = component.shadowRoot?.querySelector(
        '.request-card[data-request-id="1"]',
      ) as HTMLElement;
      expect(card).toBeTruthy();

      // dismissCard uses animateDismiss which resolves immediately in
      // happy-dom (no real transitions), setting display:none
      await component.dismissCard(1);

      expect(card.style.display).toBe("none");
    });

    it("dismissCard should be a no-op for non-existent requestId", async () => {
      component.requests = [makePendingRequest({ id: 1 })];
      // Should not throw
      await component.dismissCard(999);
    });

    it("card is removed after dismiss + re-render", async () => {
      component.requests = [
        makePendingRequest({ id: 1 }),
        makePendingRequest({ id: 2 }),
      ];

      await component.dismissCard(1);

      // Simulate data refresh removing the dismissed card
      component.requests = [makePendingRequest({ id: 2 })];

      const cards = component.shadowRoot?.querySelectorAll(".request-card");
      expect(cards?.length).toBe(1);
      expect(
        component.shadowRoot?.querySelector(
          '.request-card[data-request-id="1"]',
        ),
      ).toBeNull();
    });
  });

  describe("Single-day vs Multi-day Date Display", () => {
    it("should show single date without arrow for same-day requests", () => {
      component.requests = [
        makePendingRequest({ startDate: "2025-03-10", endDate: "2025-03-10" }),
      ];

      const dateRange = component.shadowRoot?.querySelector(".date-range");
      const text = dateRange?.textContent ?? "";
      expect(text).not.toContain("→");
    });

    it("should show date range with arrow for multi-day requests", () => {
      component.requests = [
        makePendingRequest({ startDate: "2025-03-10", endDate: "2025-03-12" }),
      ];

      const dateRange = component.shadowRoot?.querySelector(".date-range");
      const text = dateRange?.textContent ?? "";
      expect(text).toContain("→");
    });
  });

  describe("Employee Grouping", () => {
    it("should group requests by employee", () => {
      component.requests = [
        makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
        makePendingRequest({ id: 2, employeeId: 20, employeeName: "Bob" }),
        makePendingRequest({ id: 3, employeeId: 10, employeeName: "Alice" }),
      ];

      const groups = component.shadowRoot?.querySelectorAll(".employee-group");
      expect(groups?.length).toBe(2);
    });

    it("should show employee group heading with count", () => {
      component.requests = [
        makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
        makePendingRequest({ id: 2, employeeId: 10, employeeName: "Alice" }),
      ];

      const heading = component.shadowRoot?.querySelector(
        ".employee-group-name",
      );
      expect(heading?.textContent).toContain("Alice");
      expect(heading?.textContent).toContain("2 pending requests");
    });

    it("should use singular 'request' for single pending request", () => {
      component.requests = [
        makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
      ];

      const heading = component.shadowRoot?.querySelector(
        ".employee-group-name",
      );
      expect(heading?.textContent).toContain("1 pending request");
      expect(heading?.textContent).not.toContain("requests");
    });

    it("should render balance slot per employee group", () => {
      component.requests = [
        makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
        makePendingRequest({ id: 2, employeeId: 20, employeeName: "Bob" }),
      ];

      const slots = component.shadowRoot?.querySelectorAll("slot");
      const slotNames = Array.from(slots ?? []).map((s) =>
        s.getAttribute("name"),
      );
      expect(slotNames).toContain("balance-10");
      expect(slotNames).toContain("balance-20");
    });
  });

  describe("Confirmation Flow for Negative Balance", () => {
    it("should fire event immediately when employee has no negative balance", () => {
      component.requests = [makePendingRequest({ id: 42, employeeId: 10 })];

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

    it("should enter confirmation state on first click for negative-balance employee", () => {
      component.requests = [makePendingRequest({ id: 42, employeeId: 10 })];
      component.negativeBalanceEmployees = new Set([10]);

      let firedEvent: CustomEvent | null = null;
      component.addEventListener("request-approve", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const approveBtn = component.shadowRoot?.querySelector(
        ".action-btn.approve",
      ) as HTMLButtonElement;
      approveBtn?.click();

      // Should NOT fire the event yet
      expect(firedEvent).toBeNull();
      // Should show confirmation state
      expect(approveBtn.classList.contains("confirming")).toBe(true);
      expect(approveBtn.textContent).toContain("Confirm");
    });

    it("should fire event on second click (confirmation)", () => {
      component.requests = [makePendingRequest({ id: 42, employeeId: 10 })];
      component.negativeBalanceEmployees = new Set([10]);

      let firedEvent: CustomEvent | null = null;
      component.addEventListener("request-approve", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const approveBtn = component.shadowRoot?.querySelector(
        ".action-btn.approve",
      ) as HTMLButtonElement;
      approveBtn?.click(); // First click — enters confirming
      approveBtn?.click(); // Second click — confirms

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.requestId).toBe(42);
    });
  });
});

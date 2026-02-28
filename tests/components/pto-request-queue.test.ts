// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtoRequestQueue } from "../../client/components/pto-request-queue/index.js";
import { getCurrentMonth } from "../../shared/dateUtils.js";

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

describe("PtoRequestQueue - Inline Calendar", () => {
  let component: PtoRequestQueue;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoRequestQueue();
    container.appendChild(component);
  });

  afterEach(() => {
    if (container?.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render Show Calendar button on every employee group", () => {
    component.requests = [
      makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
      makePendingRequest({ id: 2, employeeId: 20, employeeName: "Bob" }),
    ];

    const buttons =
      component.shadowRoot?.querySelectorAll(".show-calendar-btn");
    expect(buttons?.length).toBe(2);
    buttons?.forEach((btn) => {
      expect(btn.textContent?.trim()).toBe("Show Calendar");
    });
  });

  it("should toggle inline calendar on Show Calendar button click", () => {
    component.requests = [
      makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
    ];

    // No calendars initially
    let calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
    expect(calendars?.length).toBe(0);

    // Click Show Calendar
    const btn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    expect(btn).toBeTruthy();
    btn.click();

    // Calendar should be visible
    calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
    expect(calendars?.length).toBe(1);

    // Button text should change
    const updatedBtn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    expect(updatedBtn?.textContent?.trim()).toBe("Hide Calendar");
  });

  it("should show correct navigation header with month label", () => {
    component.requests = [
      makePendingRequest({ id: 1, employeeId: 10, employeeName: "Alice" }),
    ];

    const btn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    btn.click();

    const navLabel = component.shadowRoot?.querySelector(
      ".nav-label",
    ) as HTMLElement;
    expect(navLabel).toBeTruthy();
    // Should contain a month name and year
    expect(navLabel.textContent).toMatch(/\w+ \d{4}/);
  });

  it("should default calendar month to request's month", () => {
    component.requests = [
      makePendingRequest({
        id: 1,
        employeeId: 10,
        startDate: "2026-05-10",
        endDate: "2026-05-10",
      }),
    ];

    const btn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    btn.click();

    const navLabel = component.shadowRoot?.querySelector(
      ".nav-label",
    ) as HTMLElement;
    expect(navLabel?.textContent).toContain("May");
    expect(navLabel?.textContent).toContain("2026");
  });

  it("should navigate to previous month on prev arrow click", () => {
    component.requests = [makePendingRequest({ id: 1, employeeId: 10 })];

    const showBtn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    showBtn.click();

    const initialLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();

    const prevArrow = component.shadowRoot?.querySelector(
      ".cal-nav-prev",
    ) as HTMLElement;
    expect(prevArrow).toBeTruthy();
    prevArrow.click();

    const newLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();
    expect(newLabel).not.toBe(initialLabel);
  });

  it("should navigate to next month on next arrow click", () => {
    component.requests = [makePendingRequest({ id: 1, employeeId: 10 })];

    const showBtn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    showBtn.click();

    const initialLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();

    const nextArrow = component.shadowRoot?.querySelector(
      ".cal-nav-next",
    ) as HTMLElement;
    expect(nextArrow).toBeTruthy();
    nextArrow.click();

    const newLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();
    expect(newLabel).not.toBe(initialLabel);
  });

  it("should render calendar with readonly attributes", () => {
    component.requests = [makePendingRequest({ id: 1, employeeId: 10 })];

    const btn = component.shadowRoot?.querySelector(
      ".show-calendar-btn",
    ) as HTMLElement;
    btn.click();

    const cal = component.shadowRoot?.querySelector(
      "pto-calendar",
    ) as HTMLElement;
    expect(cal).toBeTruthy();
    expect(cal.getAttribute("readonly")).toBe("true");
    expect(cal.getAttribute("hide-legend")).toBe("true");
    expect(cal.getAttribute("hide-header")).toBe("true");
  });

  it("should filter PTO entries by employee and month for calendar", () => {
    const currentMonth = getCurrentMonth();
    component.requests = [
      makePendingRequest({
        id: 1,
        employeeId: 10,
        employeeName: "Alice",
        startDate: `${currentMonth}-05`,
        endDate: `${currentMonth}-05`,
      }),
      makePendingRequest({
        id: 2,
        employeeId: 20,
        employeeName: "Bob",
        startDate: `${currentMonth}-06`,
        endDate: `${currentMonth}-06`,
      }),
    ];
    component.ptoEntries = [
      {
        employee_id: 10,
        type: "PTO",
        hours: 8,
        date: `${currentMonth}-10`,
        approved_by: null,
      },
      {
        employee_id: 20,
        type: "Sick",
        hours: 4,
        date: `${currentMonth}-15`,
        approved_by: 1,
      },
      {
        employee_id: 10,
        type: "PTO",
        hours: 8,
        date: "2020-01-05",
        approved_by: null,
      },
    ];

    // Open calendar for employee 10
    const btn = component.shadowRoot?.querySelector(
      '.show-calendar-btn[data-employee-id="10"]',
    ) as HTMLElement;
    btn.click();

    const cal = component.shadowRoot?.querySelector(
      "pto-calendar",
    ) as HTMLElement;
    expect(cal).toBeTruthy();
    expect(cal.getAttribute("data-employee-id")).toBe("10");
  });
});

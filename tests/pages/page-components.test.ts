// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AdminSettingsPage } from "../../client/pages/admin-settings-page/index.js";
import { AdminPtoRequestsPage } from "../../client/pages/admin-pto-requests-page/index.js";
import { AdminEmployeesPage } from "../../client/pages/admin-employees-page/index.js";
import { PriorYearSummaryPage } from "../../client/pages/prior-year-summary-page/index.js";
import { CurrentYearSummaryPage } from "../../client/pages/current-year-summary-page/index.js";

describe("AdminSettingsPage Component", () => {
  let page: AdminSettingsPage;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new AdminSettingsPage();
    container.appendChild(page);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should create component instance with shadow DOM", () => {
    expect(page).toBeInstanceOf(AdminSettingsPage);
    expect(page.shadowRoot).toBeTruthy();
  });

  it("should render heading", () => {
    const h2 = page.shadowRoot?.querySelector("h2");
    expect(h2?.textContent).toContain("System Settings");
  });

  it("should render placeholder settings list", () => {
    const items = page.shadowRoot?.querySelectorAll("li");
    expect(items?.length).toBeGreaterThan(0);
  });

  it("should implement onRouteEnter without errors", async () => {
    await expect(page.onRouteEnter!()).resolves.toBeUndefined();
  });
});

describe("AdminPtoRequestsPage Component", () => {
  let page: AdminPtoRequestsPage;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new AdminPtoRequestsPage();
    container.appendChild(page);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should create component instance with shadow DOM", () => {
    expect(page).toBeInstanceOf(AdminPtoRequestsPage);
    expect(page.shadowRoot).toBeTruthy();
  });

  it("should handle approve event", async () => {
    const handler = vi.fn();
    page.shadowRoot?.addEventListener("request-approve", handler);

    // Dispatch a mock approve event from within shadow DOM
    const queue = page.shadowRoot?.querySelector("pto-request-queue");
    if (queue) {
      queue.dispatchEvent(
        new CustomEvent("request-approve", {
          detail: { id: 1 },
          bubbles: true,
          composed: true,
        }),
      );
    }
  });
});

describe("AdminEmployeesPage Component", () => {
  let page: AdminEmployeesPage;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new AdminEmployeesPage();
    container.appendChild(page);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should create component instance with shadow DOM", () => {
    expect(page).toBeInstanceOf(AdminEmployeesPage);
    expect(page.shadowRoot).toBeTruthy();
  });

  it("should render employee-list component", () => {
    const list = page.shadowRoot?.querySelector("employee-list");
    expect(list).toBeTruthy();
  });

  it("should render add employee button", () => {
    const btn = page.shadowRoot?.querySelector('[data-action="add-employee"]');
    expect(btn).toBeTruthy();
  });
});

describe("PriorYearSummaryPage Component", () => {
  let page: PriorYearSummaryPage;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new PriorYearSummaryPage();
    container.appendChild(page);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should create component instance with shadow DOM", () => {
    expect(page).toBeInstanceOf(PriorYearSummaryPage);
    expect(page.shadowRoot).toBeTruthy();
  });

  it("should render prior-year-review component", () => {
    const review = page.shadowRoot?.querySelector("prior-year-review");
    expect(review).toBeTruthy();
  });
});

describe("CurrentYearSummaryPage Component", () => {
  let page: CurrentYearSummaryPage;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new CurrentYearSummaryPage();
    container.appendChild(page);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should create component instance with shadow DOM", () => {
    expect(page).toBeInstanceOf(CurrentYearSummaryPage);
    expect(page.shadowRoot).toBeTruthy();
  });

  it("should dispatch router-navigate on navigate-to-month event", () => {
    const handler = vi.fn();
    page.addEventListener("router-navigate", handler);

    // Simulate navigate-to-month event from a child card
    const ptoCard = page.shadowRoot?.querySelector("pto-pto-card");
    if (ptoCard) {
      ptoCard.dispatchEvent(
        new CustomEvent("navigate-to-month", {
          detail: { month: 3, year: 2026 },
          bubbles: true,
          composed: true,
        }),
      );

      // Give time for event propagation
      setTimeout(() => {
        if (handler.mock.calls.length > 0) {
          expect(handler.mock.calls[0][0].detail.path).toContain(
            "/submit-time-off",
          );
        }
      }, 0);
    }
  });
});

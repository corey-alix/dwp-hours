// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PtoPtoCard } from "../../client/components/pto-pto-card/index.js";
import type { PTOEntry } from "../../shared/api-models.js";

describe("PtoPtoCard", () => {
  let component: PtoPtoCard;

  beforeEach(() => {
    component = new PtoPtoCard();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  it("should render empty state when no entries", () => {
    component.fullPtoEntries = [];
    expect(component.shadowRoot?.textContent).toContain(
      "No scheduled time off.",
    );
  });

  it("should render toggle button when entries exist", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2025-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    const toggleButton = component.shadowRoot?.querySelector(".toggle-button");
    expect(toggleButton).toBeTruthy();
    expect(toggleButton?.textContent).toContain("Show Details");
  });

  it("should toggle expansion on button click", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2025-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    let toggleButton = component.shadowRoot?.querySelector(
      ".toggle-button",
    ) as HTMLButtonElement;

    // Initially collapsed
    expect(toggleButton?.textContent).toContain("Show Details");

    // Click to expand
    toggleButton?.click();
    toggleButton = component.shadowRoot?.querySelector(
      ".toggle-button",
    ) as HTMLButtonElement;
    expect(toggleButton?.textContent).toContain("Hide Details");

    // Click to collapse
    toggleButton?.click();
    toggleButton = component.shadowRoot?.querySelector(
      ".toggle-button",
    ) as HTMLButtonElement;
    expect(toggleButton?.textContent).toContain("Show Details");
  });

  it("should render table when expanded", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2025-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const table = component.shadowRoot?.querySelector(".entry-table");
    expect(table).toBeTruthy();
    expect(table?.textContent).toContain("01/15/2025");
    expect(table?.textContent).toContain("PTO");
    expect(table?.textContent).toContain("8.0");
  });

  it("should show approval indicators for approved entries", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2025-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const dateSpan = component.shadowRoot?.querySelector(".usage-date");
    expect(dateSpan?.classList.contains("approved")).toBe(true);
  });

  it("should dispatch navigate-to-month event on date click", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2025-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const mockDispatch = vi.fn();
    component.dispatchEvent = mockDispatch;

    const dateSpan = component.shadowRoot?.querySelector(
      ".usage-date",
    ) as HTMLElement;
    dateSpan?.click();

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "navigate-to-month",
        detail: { month: 1, year: 2025 },
      }),
    );
  });

  it("should handle keyboard navigation on date spans", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2025-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const mockDispatch = vi.fn();
    component.dispatchEvent = mockDispatch;

    const dateSpan = component.shadowRoot?.querySelector(
      ".usage-date",
    ) as HTMLElement;

    // Simulate Enter key
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });
    dateSpan?.dispatchEvent(enterEvent);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "navigate-to-month",
        detail: { month: 1, year: 2025 },
      }),
    );

    // Simulate Space key
    mockDispatch.mockClear();
    const spaceEvent = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
    });
    dateSpan?.dispatchEvent(spaceEvent);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "navigate-to-month",
        detail: { month: 1, year: 2025 },
      }),
    );
  });

  it("should apply PTO type color classes to type and hours columns", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
      {
        id: 2,
        employeeId: 1,
        date: "2025-01-16",
        type: "Sick",
        hours: 4,
        createdAt: "",
        approved_by: null,
      },
      {
        id: 3,
        employeeId: 1,
        date: "2025-02-10",
        type: "Bereavement",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
      {
        id: 4,
        employeeId: 1,
        date: "2025-03-05",
        type: "Jury Duty",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const typeCells = component.shadowRoot?.querySelectorAll(
      ".entry-table td.text-left:nth-child(2)",
    );
    expect(typeCells).toBeTruthy();
    const classes = Array.from(typeCells!).map((td) => {
      if (td.classList.contains("type-pto")) return "type-pto";
      if (td.classList.contains("type-sick")) return "type-sick";
      if (td.classList.contains("type-bereavement")) return "type-bereavement";
      if (td.classList.contains("type-jury-duty")) return "type-jury-duty";
      return "none";
    });
    expect(classes).toContain("type-pto");
    expect(classes).toContain("type-sick");
    expect(classes).toContain("type-bereavement");
    expect(classes).toContain("type-jury-duty");
  });

  it("should render month separator rows and subtotals", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
      {
        id: 2,
        employeeId: 1,
        date: "2025-01-16",
        type: "Sick",
        hours: 4,
        createdAt: "",
        approved_by: null,
      },
      {
        id: 3,
        employeeId: 1,
        date: "2025-02-10",
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const separators =
      component.shadowRoot?.querySelectorAll(".month-separator");
    expect(separators?.length).toBe(2);
    expect(separators?.[0].textContent).toContain("February 2025");
    expect(separators?.[1].textContent).toContain("January 2025");

    const subtotals = component.shadowRoot?.querySelectorAll(".month-subtotal");
    expect(subtotals?.length).toBe(2);
    // Feb: 8.0, Jan: 12.0 (8+4)
    expect(subtotals?.[0].textContent).toContain("8.0");
    expect(subtotals?.[1].textContent).toContain("12.0");
  });

  it("should render approval legend when approved entries exist", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: 3,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const legend = component.shadowRoot?.querySelector(".legend");
    expect(legend).toBeTruthy();
    expect(legend?.textContent).toContain("Admin approved");
  });

  it("should not render approval legend when no approved entries", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
    ];
    component.fullPtoEntries = entries;
    component.isExpanded = true;

    const legend = component.shadowRoot?.querySelector(".legend");
    expect(legend).toBeFalsy();
  });

  it("should persist expanded state to localStorage", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
    ];
    component.fullPtoEntries = entries;

    component.isExpanded = true;
    expect(localStorage.getItem("pto-pto-card-expanded")).toBe("true");

    component.isExpanded = false;
    expect(localStorage.getItem("pto-pto-card-expanded")).toBe("false");
  });
});

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
});

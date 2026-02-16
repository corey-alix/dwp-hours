// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtoBalanceSummary } from "../../client/components/pto-balance-summary/index.js";
import { seedEmployees } from "../../shared/seedData.js";
import type { PtoBalanceData } from "../../shared/api-models.js";

describe("PtoBalanceSummary Component", () => {
  let component: PtoBalanceSummary;
  let container: HTMLElement;

  const mockData: PtoBalanceData = {
    employeeId: 1,
    employeeName: seedEmployees[0].name,
    categories: [
      { category: "PTO", remaining: 32 },
      { category: "Sick", remaining: 8 },
      { category: "Bereavement", remaining: 40 },
      { category: "Jury Duty", remaining: -4 },
    ],
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoBalanceSummary();
    container.appendChild(component);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render empty state when no data is set", () => {
    const empty = component.shadowRoot?.querySelector(".empty");
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toBe("No balance data");
  });

  it("should render all four category badges when setBalanceData() is called", () => {
    component.setBalanceData(mockData);

    const badges = component.shadowRoot?.querySelectorAll(".balance-badge");
    expect(badges?.length).toBe(4);

    const labels = Array.from(badges || []).map(
      (b) => b.querySelector(".badge-label")?.textContent,
    );
    expect(labels).toEqual(["PTO", "Sick", "Bereavement", "Jury Duty"]);
  });

  it("should apply balance-available class when remaining >= 0", () => {
    component.setBalanceData(mockData);

    const badges = component.shadowRoot?.querySelectorAll(".balance-badge");
    // PTO (32), Sick (8), Bereavement (40) are all >= 0
    expect(badges?.[0]?.classList.contains("balance-available")).toBe(true);
    expect(badges?.[1]?.classList.contains("balance-available")).toBe(true);
    expect(badges?.[2]?.classList.contains("balance-available")).toBe(true);
  });

  it("should apply balance-exceeded class when remaining < 0", () => {
    component.setBalanceData(mockData);

    const badges = component.shadowRoot?.querySelectorAll(".balance-badge");
    // Jury Duty (-4) is < 0
    expect(badges?.[3]?.classList.contains("balance-exceeded")).toBe(true);
    expect(badges?.[3]?.classList.contains("balance-available")).toBe(false);
  });

  it("should display correct hours value in badge text", () => {
    component.setBalanceData(mockData);

    const values = Array.from(
      component.shadowRoot?.querySelectorAll(".badge-value") || [],
    ).map((v) => v.textContent);
    expect(values).toEqual(["32h", "8h", "40h", "-4h"]);
  });

  it("should handle zero remaining gracefully (balance-available)", () => {
    const zeroData: PtoBalanceData = {
      employeeId: 1,
      employeeName: seedEmployees[0].name,
      categories: [{ category: "PTO", remaining: 0 }],
    };
    component.setBalanceData(zeroData);

    const badge = component.shadowRoot?.querySelector(".balance-badge");
    expect(badge?.classList.contains("balance-available")).toBe(true);
    expect(badge?.querySelector(".badge-value")?.textContent).toBe("0h");
  });

  it("should handle empty categories array", () => {
    const emptyData: PtoBalanceData = {
      employeeId: 1,
      employeeName: seedEmployees[0].name,
      categories: [],
    };
    component.setBalanceData(emptyData);

    const empty = component.shadowRoot?.querySelector(".empty");
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toBe("No categories");
  });

  it("should have ARIA attributes for accessibility", () => {
    component.setBalanceData(mockData);

    const row = component.shadowRoot?.querySelector(".balance-row");
    expect(row?.getAttribute("role")).toBe("status");
    expect(row?.getAttribute("aria-label")).toContain(mockData.employeeName);

    const badges = component.shadowRoot?.querySelectorAll(".balance-badge");
    badges?.forEach((badge) => {
      expect(badge.getAttribute("aria-label")).toBeTruthy();
    });
  });
});

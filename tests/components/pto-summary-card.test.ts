// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PtoSummaryCard } from "../../client/components/pto-summary-card/index.js";

describe("PtoSummaryCard Component", () => {
  let component: PtoSummaryCard;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoSummaryCard();
    container.appendChild(component);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render loading state when no data is set", () => {
    const loadingText = component.shadowRoot?.textContent;
    expect(loadingText).toContain("Loading...");
  });

  it("should render balance-summary slot in shadow DOM", () => {
    component.summary = {
      annualAllocation: 96,
      availablePTO: 56,
      usedPTO: 40,
      carryoverFromPreviousYear: 0,
    };

    const slot = component.shadowRoot?.querySelector(
      'slot[name="balance-summary"]',
    );
    expect(slot).toBeTruthy();
    expect(slot?.getAttribute("name")).toBe("balance-summary");
  });

  it("should render balance-summary slot inside the card container", () => {
    component.summary = {
      annualAllocation: 96,
      availablePTO: 56,
      usedPTO: 40,
      carryoverFromPreviousYear: 0,
    };

    const card = component.shadowRoot?.querySelector(".card");
    expect(card).toBeTruthy();

    const slot = card?.querySelector('slot[name="balance-summary"]');
    expect(slot).toBeTruthy();
  });

  it("should include ::slotted styling for balance-summary", () => {
    component.summary = {
      annualAllocation: 96,
      availablePTO: 56,
      usedPTO: 40,
      carryoverFromPreviousYear: 0,
    };

    const style = component.shadowRoot?.querySelector("style");
    expect(style?.textContent).toContain("::slotted");
    expect(style?.textContent).toContain("balance-summary");
  });

  it("should display summary data correctly", () => {
    component.summary = {
      annualAllocation: 96,
      availablePTO: 56,
      usedPTO: 40,
      carryoverFromPreviousYear: 8,
    };

    const text = component.shadowRoot?.textContent || "";
    expect(text).toContain("96.00");
    expect(text).toContain("56.00");
    expect(text).toContain("40.00");
    expect(text).toContain("8.00");
  });
});

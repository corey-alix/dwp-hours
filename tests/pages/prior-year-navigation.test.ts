// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PriorYearSummaryPage,
  type PriorYearSummaryLoaderData,
} from "../../client/pages/prior-year-summary-page/index.js";
import type { PTOYearReviewResponse } from "../../shared/api-models.js";

function makeYearReview(year: number): PTOYearReviewResponse {
  return {
    year,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      ptoEntries:
        i === 0
          ? [{ date: `${year}-01-15`, type: "PTO" as const, hours: 8 }]
          : [],
      summary: {
        totalDays: 31,
        ptoHours: i === 0 ? 8 : 0,
        sickHours: 0,
        bereavementHours: 0,
        juryDutyHours: 0,
      },
    })),
  };
}

describe("PriorYearSummaryPage Year Navigation", () => {
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

  it("should render year navigation when multiple years available", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2024),
      availableYears: [2025, 2024, 2023],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const nav = page.shadowRoot?.querySelector(".year-nav");
    expect(nav).toBeTruthy();
  });

  it("should hide year navigation when only one year available", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2025),
      availableYears: [2025],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const nav = page.shadowRoot?.querySelector(".year-nav");
    expect(nav).toBeNull();
  });

  it("should hide year navigation when no years available", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2025),
      availableYears: [],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const nav = page.shadowRoot?.querySelector(".year-nav");
    expect(nav).toBeNull();
  });

  it("should disable older button at oldest year", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2023),
      availableYears: [2025, 2024, 2023],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const nav = page.shadowRoot?.querySelector(".year-nav");
    const buttons = nav?.querySelectorAll(".year-nav-btn");
    // First button should be disabled (oldest year - no older to go)
    const olderBtn = buttons?.[0];
    expect(olderBtn?.classList.contains("disabled")).toBe(true);
    expect(olderBtn?.getAttribute("aria-disabled")).toBe("true");

    // Newer button should be an <a> link
    const newerBtn = buttons?.[1];
    expect(newerBtn?.tagName).toBe("A");
    expect(newerBtn?.getAttribute("href")).toContain("year=2024");
  });

  it("should disable newer button at newest year", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2025),
      availableYears: [2025, 2024, 2023],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const nav = page.shadowRoot?.querySelector(".year-nav");
    const buttons = nav?.querySelectorAll(".year-nav-btn");
    // Older button should be an <a> link
    const olderBtn = buttons?.[0];
    expect(olderBtn?.tagName).toBe("A");
    expect(olderBtn?.getAttribute("href")).toContain("year=2024");

    // Newer button should be disabled (newest year - no newer to go)
    const newerBtn = buttons?.[1];
    expect(newerBtn?.classList.contains("disabled")).toBe(true);
    expect(newerBtn?.getAttribute("aria-disabled")).toBe("true");
  });

  it("should show both navigation buttons when in the middle", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2024),
      availableYears: [2025, 2024, 2023],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const nav = page.shadowRoot?.querySelector(".year-nav");
    const links = nav?.querySelectorAll("a.year-nav-btn");
    expect(links?.length).toBe(2);

    // Older link goes to 2023
    expect(links?.[0]?.getAttribute("href")).toContain("year=2023");
    // Newer link goes to 2025
    expect(links?.[1]?.getAttribute("href")).toContain("year=2025");
  });

  it("should display the current year label", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2024),
      availableYears: [2025, 2024, 2023],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const currentLabel = page.shadowRoot?.querySelector(".year-nav-current");
    expect(currentLabel?.textContent?.trim()).toBe("2024");
  });

  it("should update page heading with the year", async () => {
    const loaderData: PriorYearSummaryLoaderData = {
      yearReview: makeYearReview(2023),
      availableYears: [2025, 2024, 2023],
    };

    await page.onRouteEnter!({}, new URLSearchParams(), loaderData);

    const heading = page.shadowRoot?.querySelector(".page-heading");
    expect(heading?.textContent).toContain("2023");
  });
});

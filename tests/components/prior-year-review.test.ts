import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import type { PTOYearReviewResponse } from "../../client/api-types.js";

// Set up DOM environment for component testing
beforeAll(async () => {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
  });
  global.window = dom.window as any;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.ShadowRoot = dom.window.ShadowRoot;
  global.customElements = dom.window.customElements;
  global.CSSStyleSheet = dom.window.CSSStyleSheet;
});

describe("PriorYearReview Component", () => {
  let component: any;
  let container: HTMLElement;

  beforeEach(async () => {
    // Dynamic import to ensure DOM is set up
    const { PriorYearReview } =
      await import("../../client/components/prior-year-review/index.js");

    // Create a container for the component
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create the component
    component = new PriorYearReview();
    container.appendChild(component);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe("Component Initialization", () => {
    it("should create a shadow root", () => {
      expect(component.shadowRoot).toBeDefined();
    });

    it("should render with no data message when data is null", () => {
      component.data = null;
      const noDataElement = component.shadowRoot?.querySelector(".no-data");
      expect(noDataElement).toBeDefined();
      expect(noDataElement?.textContent).toBe("No data available");
    });

    it("should render with no data message when data has no entries", () => {
      const emptyData: PTOYearReviewResponse = {
        year: 2025,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          ptoEntries: [],
          summary: {
            totalDays: 31,
            ptoHours: 0,
            sickHours: 0,
            bereavementHours: 0,
            juryDutyHours: 0,
          },
        })),
      };
      component.data = emptyData;
      const noDataElement = component.shadowRoot?.querySelector(".no-data");
      expect(noDataElement).toBeDefined();
      expect(noDataElement?.textContent).toBe("No data available");
    });
  });

  describe("Data Rendering", () => {
    const mockData: PTOYearReviewResponse = {
      year: 2025,
      months: [
        {
          month: 1,
          ptoEntries: [
            { date: "2025-01-15", type: "PTO" as const, hours: 8 },
            { date: "2025-01-20", type: "Sick" as const, hours: 4 },
          ],
          summary: {
            totalDays: 31,
            ptoHours: 8,
            sickHours: 4,
            bereavementHours: 0,
            juryDutyHours: 0,
          },
        },
        {
          month: 2,
          ptoEntries: [],
          summary: {
            totalDays: 28,
            ptoHours: 0,
            sickHours: 0,
            bereavementHours: 0,
            juryDutyHours: 0,
          },
        },
      ].concat(
        Array.from({ length: 10 }, (_, i) => ({
          month: i + 3,
          ptoEntries: [],
          summary: {
            totalDays: 31,
            ptoHours: 0,
            sickHours: 0,
            bereavementHours: 0,
            juryDutyHours: 0,
          },
        })),
      ),
    };

    it("should render 12 month cards", () => {
      component.data = mockData;
      const monthCards = component.shadowRoot?.querySelectorAll(".month-card");
      expect(monthCards?.length).toBe(12);
    });

    it("should display correct month headers", () => {
      component.data = mockData;
      const headers = component.shadowRoot?.querySelectorAll(".month-header");
      expect(headers?.[0]?.textContent).toBe("January 2025");
      expect(headers?.[1]?.textContent).toBe("February 2025");
    });

    it("should render calendar grids for each month", () => {
      component.data = mockData;
      const calendarGrids =
        component.shadowRoot?.querySelectorAll(".calendar-grid");
      expect(calendarGrids?.length).toBe(12);
    });

    it("should display PTO entries with correct styling", () => {
      component.data = mockData;
      const ptoDays = component.shadowRoot?.querySelectorAll(".type-PTO");
      expect(ptoDays?.length).toBeGreaterThan(0);

      const sickDays = component.shadowRoot?.querySelectorAll(".type-Sick");
      expect(sickDays?.length).toBeGreaterThan(0);
    });

    it("should display hours in calendar cells", () => {
      component.data = mockData;
      const hoursElements = component.shadowRoot?.querySelectorAll(".hours");
      // Should have at least the hours from our mock data
      expect(hoursElements?.length).toBeGreaterThanOrEqual(2);
    });

    it("should render month summaries", () => {
      component.data = mockData;
      const summaries =
        component.shadowRoot?.querySelectorAll(".month-summary");
      expect(summaries?.length).toBe(12);

      // Check first month summary
      const firstMonthSummary = summaries?.[0];
      const ptoValue = firstMonthSummary?.querySelector(".summary-pto");
      expect(ptoValue?.textContent).toBe("8");
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive grid layout", () => {
      component.data = {
        year: 2025,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          ptoEntries: [],
          summary: {
            totalDays: 31,
            ptoHours: 0,
            sickHours: 0,
            bereavementHours: 0,
            juryDutyHours: 0,
          },
        })),
      };

      const monthsGrid = component.shadowRoot?.querySelector(".months-grid");
      expect(monthsGrid).toBeDefined();

      // Check that CSS contains responsive rules
      const styleElement = component.shadowRoot?.querySelector("style");
      expect(styleElement?.textContent).toContain("@media (max-width: 768px)");
    });
  });

  describe("Data Property", () => {
    it("should update rendering when data changes", () => {
      // Start with null data
      component.data = null;
      expect(component.shadowRoot?.querySelector(".no-data")).toBeDefined();

      // Set data
      const data: PTOYearReviewResponse = {
        year: 2025,
        months: [
          {
            month: 1,
            ptoEntries: [
              { date: "2025-01-01", type: "PTO" as const, hours: 8 },
            ],
            summary: {
              totalDays: 31,
              ptoHours: 8,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          },
        ].concat(
          Array.from({ length: 11 }, (_, i) => ({
            month: i + 2,
            ptoEntries: [],
            summary: {
              totalDays: 31,
              ptoHours: 0,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          })),
        ),
      };
      component.data = data;

      expect(component.shadowRoot?.querySelector(".no-data")).toBeNull();
      expect(component.shadowRoot?.querySelectorAll(".month-card").length).toBe(
        12,
      );
    });

    it("should return correct data via getter", () => {
      const data: PTOYearReviewResponse = {
        year: 2025,
        months: [
          {
            month: 1,
            ptoEntries: [],
            summary: {
              totalDays: 31,
              ptoHours: 0,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          },
        ].concat(
          Array.from({ length: 11 }, (_, i) => ({
            month: i + 2,
            ptoEntries: [],
            summary: {
              totalDays: 31,
              ptoHours: 0,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          })),
        ),
      };
      component.data = data;
      expect(component.data).toEqual(data);
    });
  });

  describe("CSS Styling", () => {
    it("should include all required CSS variables", () => {
      component.data = {
        year: 2025,
        months: [
          {
            month: 1,
            ptoEntries: [],
            summary: {
              totalDays: 31,
              ptoHours: 0,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          },
        ].concat(
          Array.from({ length: 11 }, (_, i) => ({
            month: i + 2,
            ptoEntries: [],
            summary: {
              totalDays: 31,
              ptoHours: 0,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          })),
        ),
      };

      const styleContent =
        component.shadowRoot?.querySelector("style")?.textContent;
      expect(styleContent).toContain("var(--color-pto-vacation)");
      expect(styleContent).toContain("var(--color-pto-sick)");
      expect(styleContent).toContain("var(--color-pto-bereavement)");
      expect(styleContent).toContain("var(--color-pto-jury-duty)");
    });

    it("should apply correct colors to PTO types", () => {
      const data: PTOYearReviewResponse = {
        year: 2025,
        months: [
          {
            month: 1,
            ptoEntries: [
              { date: "2025-01-01", type: "PTO" as const, hours: 8 },
              { date: "2025-01-02", type: "Sick" as const, hours: 4 },
              { date: "2025-01-03", type: "Bereavement" as const, hours: 8 },
              { date: "2025-01-04", type: "Jury Duty" as const, hours: 8 },
            ],
            summary: {
              totalDays: 31,
              ptoHours: 8,
              sickHours: 4,
              bereavementHours: 8,
              juryDutyHours: 8,
            },
          },
        ].concat(
          Array.from({ length: 11 }, (_, i) => ({
            month: i + 2,
            ptoEntries: [],
            summary: {
              totalDays: 31,
              ptoHours: 0,
              sickHours: 0,
              bereavementHours: 0,
              juryDutyHours: 0,
            },
          })),
        ),
      };
      component.data = data;

      const styleContent =
        component.shadowRoot?.querySelector("style")?.textContent;
      expect(styleContent).toContain(
        ".type-PTO { background: var(--color-pto-vacation); }",
      );
      expect(styleContent).toContain(
        ".type-Sick { background: var(--color-pto-sick); }",
      );
      expect(styleContent).toContain(
        ".type-Bereavement { background: var(--color-pto-bereavement); }",
      );
      expect(styleContent).toContain(
        ".type-Jury-Duty { background: var(--color-pto-jury-duty); }",
      );
    });
  });
});

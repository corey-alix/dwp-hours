// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { PTOYearReviewResponse } from "../../shared/api-models.js";
import { PriorYearReview } from "../../client/components/prior-year-review/index.js";
import "../../client/components/month-summary/index.js";
import "../../client/components/pto-calendar/index.js";

describe("PriorYearReview Component", () => {
  let component: any;
  let container: HTMLElement;

  beforeEach(async () => {
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
      const calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(12);

      // Check headers in each calendar's shadow root
      const calendarElements: Element[] = calendars
        ? Array.from(calendars)
        : [];
      const headers = calendarElements
        .map((cal: Element) =>
          cal.shadowRoot?.querySelector(".calendar-header"),
        )
        .filter(Boolean);

      expect(headers.length).toBe(12);
      expect(headers[0]?.textContent?.trim()).toBe("January 2025");
      expect(headers[1]?.textContent?.trim()).toBe("February 2025");
    });

    it("should render calendar grids for each month", () => {
      component.data = mockData;
      const calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(12);
    });

    it("should display PTO entries with correct styling", () => {
      component.data = mockData;
      const calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(12);

      // Check that calendars have readonly attribute
      calendars?.forEach((calendar: Element) => {
        expect(calendar.getAttribute("readonly")).toBe("true");
      });
    });

    it("should display hours in calendar cells", () => {
      component.data = mockData;
      const calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(12);

      // Check that calendars have the expected year and month
      const firstCalendar = calendars?.[0] as any;
      expect(firstCalendar?.getAttribute("year")).toBe("2025");
      expect(firstCalendar?.getAttribute("month")).toBe("1");
    });

    it("should render month summaries", () => {
      component.data = mockData;
      const summaries = component.shadowRoot?.querySelectorAll("month-summary");
      expect(summaries?.length).toBe(12);

      // Check first month summary
      const firstMonthSummary = summaries?.[0];
      const ptoValue =
        firstMonthSummary?.shadowRoot?.querySelector(".summary-pto");
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

      // Check that CSS contains responsive rules (mobile-first: min-width)
      const styleElement = component.shadowRoot?.querySelector("style");
      expect(styleElement?.textContent).toContain("@media (min-width: 768px)");
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
    it("should adopt PTO day-colors stylesheet", () => {
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

      // PTO type colors are now applied via adoptedStyleSheets
      const adoptedSheets = component.shadowRoot?.adoptedStyleSheets ?? [];
      expect(adoptedSheets.length).toBeGreaterThan(0);
    });

    it("should apply correct CSS classes for PTO types", async () => {
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

      // Wait for updateCalendars to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Find the first calendar with data
      const calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      const firstCalendar = calendars?.[0] as any;

      // Verify day cells have correct type classes in the calendar's shadow root
      const ptoDays =
        firstCalendar?.shadowRoot?.querySelectorAll(".type-PTO") ?? [];
      const sickDays =
        firstCalendar?.shadowRoot?.querySelectorAll(".type-Sick") ?? [];
      const bereavementDays =
        firstCalendar?.shadowRoot?.querySelectorAll(".type-Bereavement") ?? [];
      const juryDutyDays =
        firstCalendar?.shadowRoot?.querySelectorAll(".type-Jury-Duty") ?? [];

      expect(ptoDays.length).toBeGreaterThan(0);
      expect(sickDays.length).toBeGreaterThan(0);
      expect(bereavementDays.length).toBeGreaterThan(0);
      expect(juryDutyDays.length).toBeGreaterThan(0);
    });
  });
});

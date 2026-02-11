// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PtoCalendar,
  PTOEntry,
} from "../../client/components/pto-calendar/index.js";

describe("PtoCalendar Component - Approval Indicators", () => {
  let component: PtoCalendar;
  let container: HTMLElement;

  beforeEach(async () => {
    // Create a container for the component
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create the component
    component = new PtoCalendar();
    container.appendChild(component);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe("Checkmark Rendering", () => {
    it("should display checkmark for days with approved PTO entries", () => {
      const approvedEntries: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "PTO",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: 3,
        },
      ];

      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries(approvedEntries);

      // Wait for render
      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeTruthy();
      expect(checkmark?.textContent).toBe("✓");
    });

    it("should not display checkmark for days with unapproved PTO entries", () => {
      const unapprovedEntries: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "PTO",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: null,
        },
      ];

      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries(unapprovedEntries);

      // Wait for render
      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeFalsy();
    });

    it("should not display checkmark for days with no PTO entries", () => {
      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries([]);

      // Wait for render
      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeFalsy();
    });

    it("should display checkmark when at least one entry is approved on a day with multiple entries", () => {
      const mixedEntries: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "PTO",
          hours: 4,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: null,
        },
        {
          id: 2,
          employeeId: 1,
          date: "2024-02-12",
          type: "Sick",
          hours: 4,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: 3,
        },
      ];

      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries(mixedEntries);

      // Wait for render
      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeTruthy();
      expect(checkmark?.textContent).toBe("✓");
    });

    it("should position checkmark in top-right corner", () => {
      const approvedEntries: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "PTO",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: 3,
        },
      ];

      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries(approvedEntries);

      const checkmark = component.shadowRoot?.querySelector(
        ".checkmark",
      ) as HTMLElement;
      const computedStyle = window.getComputedStyle(checkmark);

      expect(computedStyle.position).toBe("absolute");
      expect(computedStyle.top).toBe("2px");
      expect(computedStyle.right).toBe("2px");
    });

    it("should use success color for checkmark", () => {
      // Define CSS custom properties for the test environment
      const style = document.createElement("style");
      style.textContent = `
        :root {
          --color-success: rgb(34, 197, 94);
        }
      `;
      document.head.appendChild(style);

      const approvedEntries: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "PTO",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: 3,
        },
      ];

      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries(approvedEntries);

      const checkmark = component.shadowRoot?.querySelector(
        ".checkmark",
      ) as HTMLElement;
      const computedStyle = window.getComputedStyle(checkmark);

      expect(computedStyle.color).toBe("rgb(34, 197, 94)"); // --color-success value

      // Clean up
      document.head.removeChild(style);
    });
  });

  describe("Integration with Seed Data", () => {
    it("should work with real seed data structure", async () => {
      const { seedPTOEntries } = await import("../../shared/seedData.js");

      // Filter for February 2024 approved entries and convert to PTOEntry format
      const febApprovedEntries: PTOEntry[] = seedPTOEntries
        .filter(
          (entry) =>
            entry.date.startsWith("2024-02") && entry.approved_by !== null,
        )
        .map((entry) => ({
          id: entry.employee_id, // Use employee_id as id for test
          employeeId: entry.employee_id,
          date: entry.date,
          type: entry.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
          hours: entry.hours,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: entry.approved_by,
        }));

      component.setYear(2024);
      component.setMonth(1); // February
      component.setPtoEntries(febApprovedEntries);

      // Should have checkmarks for approved days
      const checkmarks = component.shadowRoot?.querySelectorAll(".checkmark");
      expect(checkmarks?.length).toBeGreaterThan(0);
    });
  });
});

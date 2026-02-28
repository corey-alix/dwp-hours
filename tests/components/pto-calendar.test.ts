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
      component.setMonth(2); // February
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
      component.setMonth(2); // February
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
      component.setMonth(2); // February
      component.setPtoEntries([]);

      // Wait for render
      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeFalsy();
    });

    it("should display checkmark for approved jury duty entries", () => {
      const juryDutyApproved: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "Jury Duty",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: 3,
        },
      ];

      component.setYear(2024);
      component.setMonth(2); // February
      component.setPtoEntries(juryDutyApproved);

      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeTruthy();
      expect(checkmark?.textContent).toBe("✓");
    });

    it("should not display checkmark for unapproved jury duty entries", () => {
      const juryDutyUnapproved: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "Jury Duty",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: null,
        },
      ];

      component.setYear(2024);
      component.setMonth(2); // February
      component.setPtoEntries(juryDutyUnapproved);

      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeFalsy();
    });

    it("should display checkmark for jury duty when mixed with other approved PTO types", () => {
      const mixedApprovedEntries: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "PTO",
          hours: 4,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: 3,
        },
        {
          id: 2,
          employeeId: 1,
          date: "2024-02-12",
          type: "Jury Duty",
          hours: 4,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: null, // Unapproved jury duty
        },
      ];

      component.setYear(2024);
      component.setMonth(2); // February
      component.setPtoEntries(mixedApprovedEntries);

      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      // Should show checkmark because PTO is approved
      expect(checkmark).toBeTruthy();
      expect(checkmark?.textContent).toBe("✓");
    });

    it("should not display checkmark when only jury duty is present and unapproved", () => {
      const juryDutyOnlyUnapproved: PTOEntry[] = [
        {
          id: 1,
          employeeId: 1,
          date: "2024-02-12",
          type: "Jury Duty",
          hours: 8,
          createdAt: "2024-01-01T00:00:00Z",
          approved_by: null,
        },
      ];

      component.setYear(2024);
      component.setMonth(2); // February
      component.setPtoEntries(juryDutyOnlyUnapproved);

      const dayCell = component.shadowRoot?.querySelector(
        '[data-date="2024-02-12"]',
      );
      const checkmark = dayCell?.querySelector(".checkmark");

      expect(checkmark).toBeFalsy();
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
      component.setMonth(2); // February
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
      component.setMonth(2); // February
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

      // Filter for February 2025 approved entries and convert to PTOEntry format
      const febApprovedEntries: PTOEntry[] = seedPTOEntries
        .filter(
          (entry) =>
            entry.date.startsWith("2026-02") && entry.approved_by !== null,
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

      component.setYear(2026);
      component.setMonth(2); // February
      component.setPtoEntries(febApprovedEntries);

      // Should have checkmarks for approved days
      const checkmarks = component.shadowRoot?.querySelectorAll(".checkmark");
      expect(checkmarks?.length).toBeGreaterThan(0);
    });
  });
});

describe("PtoCalendar Component - Keyboard Navigation", () => {
  let component: PtoCalendar;
  let container: HTMLElement;

  beforeEach(async () => {
    // Create a container for the component
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create the component
    component = new PtoCalendar();
    container.appendChild(component);

    // Set to edit mode
    component.setReadonly(false);
    component.setYear(2024);
    component.setMonth(2); // February
    component.setPtoEntries([]);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  it("should only make weekdays clickable in edit mode", () => {
    // Get all clickable days (weekdays only in current month)
    const clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;
    // February 2024 has 21 weekdays (29 days - 8 weekend days)
    expect(clickableDays.length).toBe(21);
  });

  it("should navigate right with arrow keys between weekday cells", () => {
    const clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;

    // Focus on the first clickable day
    const firstDay = clickableDays[0];
    firstDay.focus();
    expect(component.shadowRoot?.activeElement).toBe(firstDay);

    // Simulate ArrowRight key press
    const arrowRight = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    firstDay.dispatchEvent(arrowRight);

    // Should move to next clickable day
    const secondDay = clickableDays[1];
    expect(component.shadowRoot?.activeElement).toBe(secondDay);
  });

  it("should stop at last day instead of wrapping when navigating right", () => {
    const clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;

    // Focus on the last clickable day
    const lastDay = clickableDays[clickableDays.length - 1];
    lastDay.focus();
    expect(component.shadowRoot?.activeElement).toBe(lastDay);

    // Simulate ArrowRight key press
    const arrowRight = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    lastDay.dispatchEvent(arrowRight);

    // Should stay on last day (no wrap)
    expect(component.shadowRoot?.activeElement).toBe(lastDay);
  });

  it("should navigate left with arrow keys", () => {
    const clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;

    // Focus on the second clickable day
    const secondDay = clickableDays[1];
    secondDay.focus();
    expect(component.shadowRoot?.activeElement).toBe(secondDay);

    // Simulate ArrowLeft key press
    const arrowLeft = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });
    secondDay.dispatchEvent(arrowLeft);

    // Should move to previous day
    const firstDay = clickableDays[0];
    expect(component.shadowRoot?.activeElement).toBe(firstDay);
  });

  it("should stop at first day instead of wrapping when navigating left", () => {
    const clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;

    // Focus on the first clickable day
    const firstDay = clickableDays[0];
    firstDay.focus();
    expect(component.shadowRoot?.activeElement).toBe(firstDay);

    // Simulate ArrowLeft key press
    const arrowLeft = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });
    firstDay.dispatchEvent(arrowLeft);

    // Should stay on first day (no wrap)
    expect(component.shadowRoot?.activeElement).toBe(firstDay);
  });

  it("should not handle tab key in readonly mode", () => {
    // Set to readonly
    component.setReadonly(true);

    const clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;
    expect(clickableDays.length).toBe(0); // No clickable days in readonly

    // Even if we try to dispatch, should not affect
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
    });
    component.dispatchEvent(tabEvent);

    // No active element expected
    expect(component.shadowRoot?.activeElement).toBe(null);
  });

  it("should enable keyboard navigation after entering edit mode", () => {
    // Start in readonly mode
    component.setReadonly(true);
    component.setYear(2024);
    component.setMonth(2); // February
    component.setPtoEntries([]);

    // Verify no clickable days in readonly mode
    let clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;
    expect(clickableDays.length).toBe(0);

    // Enter edit mode
    component.setReadonly(false);

    // Now should have clickable days (weekdays only)
    clickableDays = component.shadowRoot?.querySelectorAll(
      ".day.clickable",
    ) as NodeListOf<HTMLElement>;
    expect(clickableDays.length).toBe(21); // Weekdays in February

    // Focus on first day and navigate with arrow key
    const firstDay = clickableDays[0];
    firstDay.focus();
    expect(component.shadowRoot?.activeElement).toBe(firstDay);

    // Simulate ArrowRight key press
    const arrowRight = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    firstDay.dispatchEvent(arrowRight);

    // Should move to next day
    const secondDay = clickableDays[1];
    expect(component.shadowRoot?.activeElement).toBe(secondDay);
  });
});

describe("PtoCalendar Component - Note Indicators", () => {
  let component: PtoCalendar;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoCalendar();
    container.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should display note indicator when PTO entry has notes", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 8,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
        notes: "red rocks vacation",
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");

    expect(noteIndicator).toBeTruthy();
    expect(noteIndicator?.getAttribute("data-note")).toBe("red rocks vacation");
    expect(noteIndicator?.getAttribute("title")).toBe("red rocks vacation");
  });

  it("should not display note indicator when notes is empty", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 8,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
        notes: null,
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");

    expect(noteIndicator).toBeNull();
  });

  it("should not display note indicator when notes is not present", () => {
    const entries: PTOEntry[] = [
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
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");

    expect(noteIndicator).toBeNull();
  });

  it("should escape HTML in note text for title attribute", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 8,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
        notes: 'note with "quotes" & <tags>',
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");

    expect(noteIndicator).toBeTruthy();
    // Attributes should have escaped values
    expect(noteIndicator?.getAttribute("data-note")).toBe(
      'note with "quotes" & <tags>',
    );
  });
});

describe("PtoCalendar Component - Partial-Day Superscript", () => {
  let component: PtoCalendar;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoCalendar();
    container.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should display superscript for partial-day hours (4h)", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 4,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const dateEl = dayCell?.querySelector(".date");
    const superscript = dateEl?.querySelector("sup.partial-hours");

    expect(superscript).toBeTruthy();
    expect(superscript?.textContent).toBe("\u2074"); // Unicode superscript 4
  });

  it("should not display superscript for full-day hours (8h)", () => {
    const entries: PTOEntry[] = [
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
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const dateEl = dayCell?.querySelector(".date");
    const superscript = dateEl?.querySelector("sup.partial-hours");

    expect(superscript).toBeNull();
  });

  it("should display superscript with correct symbol for 2h", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 2,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const dateEl = dayCell?.querySelector(".date");
    const superscript = dateEl?.querySelector("sup.partial-hours");

    expect(superscript).toBeTruthy();
    expect(superscript?.textContent).toBe("\u00B2"); // Unicode superscript 2
  });

  it("should not display superscript for days with no PTO", () => {
    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries([]);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const dateEl = dayCell?.querySelector(".date");
    const superscript = dateEl?.querySelector("sup.partial-hours");

    expect(superscript).toBeNull();
  });
});

describe("PtoCalendar Component - Note Indicator", () => {
  let component: PtoCalendar;
  let container: HTMLElement;

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new PtoCalendar();
    container.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should render note indicator when PTO entry has notes", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 8,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
        notes: "Doctor appointment",
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");
    expect(noteIndicator).toBeTruthy();
    expect(noteIndicator?.getAttribute("data-note")).toBe("Doctor appointment");
    expect(noteIndicator?.getAttribute("title")).toBe("Doctor appointment");
  });

  it("should not render note indicator when notes is null", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 8,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
        notes: null,
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");
    expect(noteIndicator).toBeNull();
  });

  it("should not render note indicator when notes is empty string", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2024-02-12",
        type: "PTO",
        hours: 8,
        createdAt: "2024-01-01T00:00:00Z",
        approved_by: null,
        notes: "",
      },
    ];

    component.setYear(2024);
    component.setMonth(2);
    component.setPtoEntries(entries);

    const dayCell = component.shadowRoot?.querySelector(
      '[data-date="2024-02-12"]',
    );
    const noteIndicator = dayCell?.querySelector(".note-indicator");
    expect(noteIndicator).toBeNull();
  });
});

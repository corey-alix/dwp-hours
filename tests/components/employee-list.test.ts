// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EmployeeList } from "../../client/components/employee-list/index.js";
import { seedEmployees } from "../../shared/seedData.js";
import { getCurrentMonth } from "../../shared/dateUtils.js";

describe("EmployeeList Component - Search Filtering", () => {
  let component: EmployeeList;
  let container: HTMLElement;

  // Transform seed data into component format
  const testEmployees = seedEmployees.map((emp, index) => ({
    id: index + 1,
    name: emp.name,
    identifier: emp.identifier,
    ptoRate: emp.pto_rate,
    carryoverHours: emp.carryover_hours,
    hireDate: emp.hire_date,
    role: emp.role,
    hash: emp.hash ?? "",
  }));

  // Assert seed data contains required test values
  it("should have seed data with required employees for testing", () => {
    expect(seedEmployees).toBeDefined();
    expect(seedEmployees.length).toBeGreaterThanOrEqual(3);

    // Verify John Doe exists
    const johnDoe = seedEmployees.find((emp) => emp.name === "John Doe");
    expect(johnDoe).toBeDefined();
    expect(johnDoe?.identifier).toBe("john.doe@example.com");
    expect(johnDoe?.role).toBe("Employee");

    // Verify Jane Smith exists
    const janeSmith = seedEmployees.find((emp) => emp.name === "Jane Smith");
    expect(janeSmith).toBeDefined();
    expect(janeSmith?.identifier).toBe("jane.smith@example.com");
    expect(janeSmith?.role).toBe("Employee");

    // Verify Admin User exists
    const adminUser = seedEmployees.find((emp) => emp.name === "Admin User");
    expect(adminUser).toBeDefined();
    expect(adminUser?.identifier).toBe("admin@example.com");
    expect(adminUser?.role).toBe("Admin");
  });

  beforeEach(() => {
    // Create a container for the component
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create the component
    component = new EmployeeList();
    container.appendChild(component);

    // Set employees data using public API
    component.employees = testEmployees;
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe("Reactive Search Filtering", () => {
    it("should render all employees initially", () => {
      const employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3);
    });

    it("should show all employees when search input is cleared", () => {
      let searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      // First filter to "John"
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      let employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(1);

      // Re-query search input after re-render (old element replaced)
      searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      // Clear the search input
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      // All employees should be rendered again
      employeeCards = component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3);
    });

    it("should update employee count display during filtering", () => {
      // Initially shows all
      let countSpan = component.shadowRoot?.querySelector(
        ".search-container span",
      );
      expect(countSpan?.textContent).toBe("📊 3 employees");

      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      // After filtering, count updates reactively
      countSpan = component.shadowRoot?.querySelector(".search-container span");
      expect(countSpan?.textContent).toBe("📊 1 employees");
    });

    it("should show empty state when no employees match search", () => {
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      searchInput.value = "nonexistent";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(0);

      const emptyState = component.shadowRoot?.querySelector(".empty-state");
      expect(emptyState).toBeTruthy();
    });
  });
});

describe("EmployeeList Component - Inline Calendar", () => {
  let component: EmployeeList;
  let container: HTMLElement;

  const testEmployees = seedEmployees.map((emp, index) => ({
    id: index + 1,
    name: emp.name,
    identifier: emp.identifier,
    ptoRate: emp.pto_rate,
    carryoverHours: emp.carryover_hours,
    hireDate: emp.hire_date,
    role: emp.role,
    hash: emp.hash ?? "",
  }));

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new EmployeeList();
    container.appendChild(component);
    component.employees = testEmployees;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render View Calendar button on every employee card", () => {
    const buttons =
      component.shadowRoot?.querySelectorAll(".view-calendar-btn");
    expect(buttons?.length).toBe(testEmployees.length);
    buttons?.forEach((btn) => {
      expect(btn.textContent?.trim()).toBe("View Calendar");
    });
  });

  it("should toggle inline calendar on View Calendar button click", () => {
    // No calendars initially
    let calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
    expect(calendars?.length).toBe(0);

    // Click the View Calendar button for the first employee
    const firstBtn = component.shadowRoot?.querySelector(
      ".view-calendar-btn",
    ) as HTMLElement;
    expect(firstBtn).toBeTruthy();
    firstBtn.click();

    // Calendar should now be visible
    calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
    expect(calendars?.length).toBe(1);

    // Button text should change
    const updatedBtn = component.shadowRoot?.querySelector(
      ".view-calendar-btn",
    ) as HTMLElement;
    expect(updatedBtn?.textContent?.trim()).toBe("Hide Calendar");
  });

  it("should show correct navigation header with month label", () => {
    const firstBtn = component.shadowRoot?.querySelector(
      ".view-calendar-btn",
    ) as HTMLElement;
    firstBtn.click();

    const navLabel = component.shadowRoot?.querySelector(
      ".nav-label",
    ) as HTMLElement;
    expect(navLabel).toBeTruthy();
    // Should contain a month name and year
    expect(navLabel.textContent).toMatch(/\w+ \d{4}/);
  });

  it("should navigate to previous month on prev arrow click", () => {
    const firstBtn = component.shadowRoot?.querySelector(
      ".view-calendar-btn",
    ) as HTMLElement;
    firstBtn.click();

    const initialLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();

    const prevArrow = component.shadowRoot?.querySelector(
      ".cal-nav-prev",
    ) as HTMLElement;
    expect(prevArrow).toBeTruthy();
    prevArrow.click();

    const newLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();
    expect(newLabel).not.toBe(initialLabel);
  });

  it("should navigate to next month on next arrow click", () => {
    const firstBtn = component.shadowRoot?.querySelector(
      ".view-calendar-btn",
    ) as HTMLElement;
    firstBtn.click();

    const initialLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();

    const nextArrow = component.shadowRoot?.querySelector(
      ".cal-nav-next",
    ) as HTMLElement;
    expect(nextArrow).toBeTruthy();
    nextArrow.click();

    const newLabel = component.shadowRoot
      ?.querySelector(".nav-label")
      ?.textContent?.trim();
    expect(newLabel).not.toBe(initialLabel);
  });

  it("should dispatch calendar-data-request on View Calendar click", () => {
    const emp1Id = testEmployees[0].id;
    const currentMonth = getCurrentMonth();

    let firedEvent: CustomEvent | null = null;
    component.addEventListener("calendar-data-request", (e: Event) => {
      firedEvent = e as CustomEvent;
    });

    // Open calendar for employee 1
    const firstBtn = component.shadowRoot?.querySelector(
      `.view-calendar-btn[data-employee-id="${emp1Id}"]`,
    ) as HTMLElement;
    firstBtn.click();

    expect(firedEvent).toBeTruthy();
    expect(firedEvent!.detail.employeeId).toBe(emp1Id);
    expect(firedEvent!.detail.month).toBe(currentMonth);
  });

  it("should dispatch calendar-data-request on month navigation", () => {
    const emp1Id = testEmployees[0].id;

    // Open calendar first
    const firstBtn = component.shadowRoot?.querySelector(
      `.view-calendar-btn[data-employee-id="${emp1Id}"]`,
    ) as HTMLElement;
    firstBtn.click();

    // Capture events on next navigation
    const events: CustomEvent[] = [];
    component.addEventListener("calendar-data-request", (e: Event) => {
      events.push(e as CustomEvent);
    });

    const nextArrow = component.shadowRoot?.querySelector(
      ".cal-nav-next",
    ) as HTMLElement;
    nextArrow.click();

    expect(events.length).toBe(1);
    expect(events[0].detail.employeeId).toBe(emp1Id);
    // Should be next month
    expect(events[0].detail.month).toBeDefined();
  });

  it("should inject PTO entries into calendar via setCalendarEntries", () => {
    const emp1Id = testEmployees[0].id;
    const currentMonth = getCurrentMonth();

    // Open calendar for employee 1
    const firstBtn = component.shadowRoot?.querySelector(
      `.view-calendar-btn[data-employee-id="${emp1Id}"]`,
    ) as HTMLElement;
    firstBtn.click();

    // Inject entries via the public method
    (component as any).setCalendarEntries(emp1Id, currentMonth, [
      {
        id: 1,
        employeeId: emp1Id,
        date: `${currentMonth}-10`,
        type: "PTO",
        hours: 8,
        createdAt: "",
        approved_by: null,
      },
    ]);

    const cal = component.shadowRoot?.querySelector("pto-calendar") as any;
    expect(cal).toBeTruthy();
    expect(cal.ptoEntries?.length).toBe(1);
    expect(cal.ptoEntries[0].date).toBe(`${currentMonth}-10`);
  });

  it("should filter PTO entries by employee and month for calendar", () => {
    const emp1Id = testEmployees[0].id;
    const emp2Id = testEmployees[1].id;
    const currentMonth = getCurrentMonth();

    component.ptoEntries = [
      {
        employee_id: emp1Id,
        type: "PTO",
        hours: 8,
        date: `${currentMonth}-10`,
        approved_by: null,
      },
      {
        employee_id: emp2Id,
        type: "Sick",
        hours: 4,
        date: `${currentMonth}-15`,
        approved_by: 1,
      },
      {
        employee_id: emp1Id,
        type: "PTO",
        hours: 8,
        date: "2020-01-05",
        approved_by: null,
      },
    ];

    // Open calendar for employee 1
    const firstBtn = component.shadowRoot?.querySelector(
      `.view-calendar-btn[data-employee-id="${emp1Id}"]`,
    ) as HTMLElement;
    firstBtn.click();

    // Calendar should be rendered with readonly attribute
    const cal = component.shadowRoot?.querySelector("pto-calendar") as any;
    expect(cal).toBeTruthy();
    expect(cal.getAttribute("readonly")).toBe("true");
    expect(cal.getAttribute("hide-legend")).toBe("true");
    expect(cal.getAttribute("hide-header")).toBe("true");
  });

  it("should collapse calendar when entering edit mode", () => {
    vi.useFakeTimers();
    const emp1Id = testEmployees[0].id;

    // Open calendar for employee 1
    const firstBtn = component.shadowRoot?.querySelector(
      `.view-calendar-btn[data-employee-id="${emp1Id}"]`,
    ) as HTMLElement;
    firstBtn.click();

    let calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
    expect(calendars?.length).toBe(1);

    // Enter edit mode for the same employee
    component.editingEmployeeId = emp1Id;

    // Advance past the fade-out animation fallback timer (TRANSITION_MS + 50)
    vi.advanceTimersByTime(350);

    // Calendar should be collapsed (card replaced by editor)
    calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
    expect(calendars?.length).toBe(0);

    vi.useRealTimers();
  });
});

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EmployeeList } from "../../client/components/employee-list/index.js";
import { seedEmployees } from "../../shared/seedData.js";

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

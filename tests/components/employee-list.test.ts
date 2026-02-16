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
    expect(johnDoe?.identifier).toBe("john.doe@gmail.com");
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

  describe("Search Filtering Defect", () => {
    it("should filter employees when typing 'John' in search input", () => {
      // Get the search input
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;
      expect(searchInput).toBeTruthy();

      // Initially, all employees should be displayed (no hidden class)
      let employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3); // All 3 employees rendered
      employeeCards?.forEach((card) => {
        expect(card.classList.contains("hidden")).toBe(false);
      });

      // Type "John" into the search input
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      // Now only "John Doe" should be visible, others should have hidden class
      employeeCards = component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3); // All still rendered

      // Check which cards are hidden
      const visibleCards = Array.from(employeeCards || []).filter(
        (card) => !card.classList.contains("hidden"),
      );
      expect(visibleCards.length).toBe(1);

      // Verify it's the correct employee
      const employeeName =
        visibleCards[0]?.querySelector(".employee-name")?.textContent;
      expect(employeeName).toBe("John Doe");
    });

    it("should show all employees when search input is cleared", () => {
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      // First filter to "John"
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      let employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3); // All still rendered
      const visibleCardsAfterFilter = Array.from(employeeCards || []).filter(
        (card) => !card.classList.contains("hidden"),
      );
      expect(visibleCardsAfterFilter.length).toBe(1);

      // Clear the search input
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      // All employees should be visible again
      employeeCards = component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3);
      employeeCards?.forEach((card) => {
        expect(card.classList.contains("hidden")).toBe(false);
      });
    });

    it("should filter by identifier", () => {
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      // Search by identifier "john.doe@gmail.com"
      searchInput.value = "john.doe@gmail.com";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3); // All rendered
      const visibleCards = Array.from(employeeCards || []).filter(
        (card) => !card.classList.contains("hidden"),
      );
      expect(visibleCards.length).toBe(1);

      const employeeName =
        visibleCards[0]?.querySelector(".employee-name")?.textContent;
      expect(employeeName).toBe("John Doe");
    });

    it("should filter by role", () => {
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      // Search by role "Admin"
      searchInput.value = "Admin";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3); // All rendered
      const visibleCards = Array.from(employeeCards || []).filter(
        (card) => !card.classList.contains("hidden"),
      );
      expect(visibleCards.length).toBe(1);

      const employeeName =
        visibleCards[0]?.querySelector(".employee-name")?.textContent;
      expect(employeeName).toBe("Admin User");
    });

    it("should preserve input value during filtering", () => {
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      // Input value should be preserved
      expect(searchInput.value).toBe("John");

      // Check CSS classes are applied instead of DOM changes
      const cards = component.shadowRoot?.querySelectorAll(".employee-card");
      expect(cards?.length).toBe(3); // All cards still exist
      const visibleCards = Array.from(cards || []).filter(
        (card) => !card.classList.contains("hidden"),
      );
      expect(visibleCards.length).toBe(1);
    });

    it("should apply no-match CSS class to filtered employees", () => {
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const cards = component.shadowRoot?.querySelectorAll(".employee-card");
      const hiddenCards = Array.from(cards || []).filter((card) =>
        card.classList.contains("hidden"),
      );
      expect(hiddenCards.length).toBe(2); // 2 cards should be hidden

      // Verify the visible card is John Doe
      const visibleCards = Array.from(cards || []).filter(
        (card) => !card.classList.contains("hidden"),
      );
      const employeeName =
        visibleCards[0]?.querySelector(".employee-name")?.textContent;
      expect(employeeName).toBe("John Doe");
    });

    it("should update employee count display during filtering", () => {
      const countSpan = component.shadowRoot?.querySelector(
        ".search-container span",
      );
      expect(countSpan?.textContent).toBe("📊 3 employees");

      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;
      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      expect(countSpan?.textContent).toBe("📊 1 employees");
    });

    it("should maintain same DOM elements during filtering", () => {
      const cardsBefore =
        component.shadowRoot?.querySelectorAll(".employee-card");
      const searchInput = component.shadowRoot?.querySelector(
        "#search-input",
      ) as HTMLInputElement;

      searchInput.value = "John";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const cardsAfter =
        component.shadowRoot?.querySelectorAll(".employee-card");

      // Same number of DOM elements
      expect(cardsAfter?.length).toBe(cardsBefore?.length);

      // Same elements (check by data-employee-id)
      const idsBefore = Array.from(cardsBefore || []).map((card) =>
        card.getAttribute("data-employee-id"),
      );
      const idsAfter = Array.from(cardsAfter || []).map((card) =>
        card.getAttribute("data-employee-id"),
      );
      expect(idsBefore).toEqual(idsAfter);
    });
  });
});

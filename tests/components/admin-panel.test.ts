// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { seedEmployees, seedPTOEntries } from "../../shared/seedData.js";
import type { EmployeeForm } from "../../client/components/employee-form/index.js";

describe("AdminPanel Component", () => {
  let component: any;
  let container: HTMLElement;

  beforeEach(async () => {
    // Dynamic import to ensure DOM is set up
    const { AdminPanel } =
      await import("../../client/components/admin-panel/index.js");

    // Create a container for the component
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create the component
    component = new AdminPanel();
    container.appendChild(component);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe("Phase 1: Data Import Setup", () => {
    it("should import seedData correctly", () => {
      expect(seedEmployees).toBeDefined();
      expect(seedPTOEntries).toBeDefined();
      expect(Array.isArray(seedEmployees)).toBe(true);
      expect(Array.isArray(seedPTOEntries)).toBe(true);
      expect(seedEmployees.length).toBeGreaterThan(0);
      expect(seedPTOEntries.length).toBeGreaterThan(0);
    });

    it("should have correct seed data structure", () => {
      const employee = seedEmployees[0];
      expect(employee).toHaveProperty("name");
      expect(employee).toHaveProperty("identifier");
      expect(employee).toHaveProperty("pto_rate");
      expect(employee).toHaveProperty("carryover_hours");
      expect(employee).toHaveProperty("hire_date");
      expect(employee).toHaveProperty("role");
    });
  });

  describe("Phase 2: Component Data Integration", () => {
    it("should set employees via setEmployees method", () => {
      const testEmployees = [
        {
          id: 1,
          name: "Test Employee",
          identifier: "test@example.com",
          ptoRate: 0.71,
          carryoverHours: 40,
          hireDate: "2020-01-01",
          role: "Employee",
        },
      ];

      component.setEmployees(testEmployees);

      expect(component).toBeDefined();
    });

    it("should format seed data correctly for component", () => {
      const formattedEmployees = seedEmployees.map((emp, index) => ({
        id: index + 1,
        name: emp.name,
        identifier: emp.identifier,
        ptoRate: emp.pto_rate,
        carryoverHours: emp.carryover_hours,
        hireDate: emp.hire_date,
        role: emp.role,
        hash: emp.hash || undefined,
      }));

      expect(formattedEmployees[0]).toHaveProperty("id");
      expect(formattedEmployees[0]).toHaveProperty("name");
      expect(formattedEmployees[0].ptoRate).toBe(seedEmployees[0].pto_rate);
    });
  });

  describe("Phase 3: Dual Test Mode Implementation", () => {
    it("should validate seed data schema", () => {
      const isValidEmployee = (emp: any) => {
        return (
          typeof emp.name === "string" &&
          typeof emp.identifier === "string" &&
          typeof emp.pto_rate === "number" &&
          typeof emp.carryover_hours === "number" &&
          typeof emp.hire_date === "string" &&
          typeof emp.role === "string"
        );
      };

      seedEmployees.forEach((emp) => {
        expect(isValidEmployee(emp)).toBe(true);
      });
    });

    it("should handle empty employee array", () => {
      component.setEmployees([]);
      expect(component).toBeDefined();
    });
  });

  describe("Phase 5: Remove API Dependencies", () => {
    it("should dispatch create-employee event on form submission", () => {
      const mockDispatchEvent = vi.fn();
      component.dispatchEvent = mockDispatchEvent;

      // Simulate form submission
      const testEmployee = {
        id: 1,
        name: "New Employee",
        identifier: "new@example.com",
        ptoRate: 0.71,
        carryoverHours: 0,
        hireDate: "2024-01-01",
        role: "Employee",
      };

      // Access private method (in real tests, might need to expose or use different approach)
      (component as any).handleEmployeeSubmit(testEmployee, false);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "create-employee",
          detail: { employee: testEmployee, isEdit: false },
        }),
      );
    });

    it("should dispatch update-employee event for edits", () => {
      const mockDispatchEvent = vi.fn();
      component.dispatchEvent = mockDispatchEvent;

      const testEmployee = {
        id: 1,
        name: "Updated Employee",
        identifier: "updated@example.com",
        ptoRate: 0.71,
        carryoverHours: 10,
        hireDate: "2024-01-01",
        role: "Employee",
      };

      (component as any).handleEmployeeSubmit(testEmployee, true);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "update-employee",
          detail: { employee: testEmployee, isEdit: true },
        }),
      );
    });
  });

  describe("Phase 6: Implement Employee Form Inline", () => {
    it("should set editing-employee-id on employee-list when showEmployeeForm is called", () => {
      component.currentView = "employees";
      (component as any).showEmployeeForm(1);
      const employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("1");
    });

    it("should clear editing-employee-id when hideEmployeeForm is called", () => {
      component.currentView = "employees";
      (component as any).showEmployeeForm(1);
      (component as any).hideEmployeeForm();
      const employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("");
    });

    it("should toggle editing state", () => {
      component.currentView = "employees";
      (component as any).showEmployeeForm(1);
      let employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("1");

      (component as any).hideEmployeeForm();
      employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("");
    });

    it("should clear editing-employee-id when form-cancel event is received", () => {
      component.currentView = "employees";
      (component as any).showEmployeeForm(1);
      let employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("1");

      // Simulate form-cancel event from the employee-list (which forwards from inline form)
      const employeeListElement =
        component.shadowRoot?.querySelector("employee-list");
      employeeListElement?.dispatchEvent(
        new CustomEvent("form-cancel", {
          bubbles: true,
          composed: true,
        }),
      );

      employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("");
    });

    it("should allow showing and hiding editing state multiple times", () => {
      component.currentView = "employees";

      // First time
      (component as any).showEmployeeForm(1);
      let employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("1");

      (component as any).hideEmployeeForm();
      employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("");

      // Second time - this was failing before the fix
      (component as any).showEmployeeForm(2);
      employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("2");

      (component as any).hideEmployeeForm();
      employeeList = component.shadowRoot?.querySelector(
        "employee-list",
      ) as HTMLElement;
      expect(employeeList?.getAttribute("editing-employee-id")).toBe("");
    });
  });
});

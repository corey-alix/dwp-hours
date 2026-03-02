// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AdminEmployeesPage } from "../../client/pages/admin-employees-page/index.js";

/**
 * Integration tests for AdminEmployeesPage event reactions.
 * Verifies that custom events dispatched by child components
 * (employee-list, employee-form) trigger the correct API calls.
 */
describe("AdminEmployeesPage — Event Integration", () => {
  let page: AdminEmployeesPage;
  let container: HTMLElement;
  let mockApi: Record<string, ReturnType<typeof vi.fn>>;

  // Seed data
  const testEmployees = [
    {
      id: 1,
      name: "John Doe",
      identifier: "john@example.com",
      ptoRate: 0.8,
      carryoverHours: 0,
      hireDate: "2020-01-15",
      role: "Employee",
    },
    {
      id: 2,
      name: "Jane Smith",
      identifier: "jane@example.com",
      ptoRate: 1.0,
      carryoverHours: 10,
      hireDate: "2019-06-01",
      role: "Admin",
    },
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new AdminEmployeesPage();
    container.appendChild(page);

    // Inject test employees via the private field
    (page as any)._employees = testEmployees;

    // Mock the service layer methods
    mockApi = {
      deleteEmployee: vi.fn().mockResolvedValue({ message: "Deleted" }),
      updateEmployee: vi.fn().mockResolvedValue({ message: "Updated" }),
      createEmployee: vi.fn().mockResolvedValue({ message: "Created", id: 99 }),
      getEmployees: vi.fn().mockResolvedValue(testEmployees),
      getAdminPTOEntries: vi.fn().mockResolvedValue([]),
    };
    (page as any).services = {
      employees: {
        remove: mockApi.deleteEmployee,
        update: mockApi.updateEmployee,
        create: mockApi.createEmployee,
        getAll: mockApi.getEmployees,
      },
      admin: {
        getPTOEntries: mockApi.getAdminPTOEntries,
      },
    };
  });

  afterEach(() => {
    container.remove();
  });

  describe("employee-edit event", () => {
    it("should set editingEmployeeId on employee-list when employee-edit fires", () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;
      expect(list).toBeTruthy();

      // Dispatch employee-edit from the employee-list
      list.dispatchEvent(
        new CustomEvent("employee-edit", {
          detail: { employeeId: 1 },
          bubbles: true,
          composed: true,
        }),
      );

      expect(list.editingEmployeeId).toBe(1);
    });
  });

  describe("employee-delete event", () => {
    it("should call api.deleteEmployee when employee-delete fires", async () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;

      list.dispatchEvent(
        new CustomEvent("employee-delete", {
          detail: { employeeId: 1 },
          bubbles: true,
          composed: true,
        }),
      );

      // Wait for async handler
      await vi.waitFor(() => {
        expect(mockApi.deleteEmployee).toHaveBeenCalledWith(1);
      });
    });

    it("should refresh employees after successful delete", async () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;

      list.dispatchEvent(
        new CustomEvent("employee-delete", {
          detail: { employeeId: 1 },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.getEmployees).toHaveBeenCalled();
      });
    });
  });

  describe("employee-submit event (create)", () => {
    it("should call api.createEmployee for new employee", async () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;

      list.dispatchEvent(
        new CustomEvent("employee-submit", {
          detail: {
            employee: {
              name: "New Employee",
              identifier: "new@example.com",
              ptoRate: 0.8,
              carryoverHours: 0,
              hireDate: "2026-03-01",
              role: "Employee",
            },
            isEdit: false,
          },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.createEmployee).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "New Employee",
            identifier: "new@example.com",
          }),
        );
      });
    });
  });

  describe("employee-submit event (update)", () => {
    it("should call api.updateEmployee for existing employee", async () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;

      list.dispatchEvent(
        new CustomEvent("employee-submit", {
          detail: {
            employee: {
              id: 1,
              name: "Updated Name",
              identifier: "john@example.com",
              ptoRate: 0.9,
              carryoverHours: 5,
              hireDate: "2020-01-15",
              role: "Employee",
            },
            isEdit: true,
          },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.updateEmployee).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ name: "Updated Name" }),
        );
      });
    });
  });

  describe("form-cancel event", () => {
    it("should clear editing state when form-cancel fires during inline edit", () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;

      // First enter edit mode
      (page as any)._editEmployee = testEmployees[0];
      list.editingEmployeeId = 1;

      // Now cancel
      list.dispatchEvent(
        new CustomEvent("form-cancel", {
          bubbles: true,
          composed: true,
        }),
      );

      expect(list.editingEmployeeId).toBeNull();
      expect((page as any)._editEmployee).toBeNull();
    });
  });

  describe("calendar-data-request event", () => {
    it("should call api.getAdminPTOEntries with correct date range", async () => {
      (page as any).requestUpdate();

      const list = page.shadowRoot?.querySelector("employee-list") as any;

      list.dispatchEvent(
        new CustomEvent("calendar-data-request", {
          detail: { employeeId: 1, month: "2026-03" },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.getAdminPTOEntries).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeId: 1,
            startDate: "2026-03-01",
            endDate: "2026-03-31",
          }),
        );
      });
    });
  });
});

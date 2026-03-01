// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { APIClient } from "../client/APIClient.js";
import { EmployeeList } from "../client/components/employee-list/index.js";
import { seedEmployees } from "../shared/seedData.js";

// ── APIClient: getAdminEmployeePTOStatus ────────────────────────

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("APIClient.getAdminEmployeePTOStatus", () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient();
    vi.clearAllMocks();
  });

  it("should call the correct admin endpoint with employee ID", async () => {
    const mockResponse = {
      employeeId: 5,
      employeeName: "Jane Smith",
      hireDate: "2020-01-15",
      dailyRate: 0.71,
      annualAllocation: 80,
      availablePTO: 50,
      usedPTO: 10,
      carryoverFromPreviousYear: 0,
      monthlyAccruals: [],
      nextRolloverDate: "2027-01-01",
      sickTime: { allowed: 40, used: 0, remaining: 40 },
      ptoTime: { allowed: 80, used: 10, remaining: 70 },
      bereavementTime: { allowed: 24, used: 0, remaining: 24 },
      juryDutyTime: { allowed: 40, used: 0, remaining: 40 },
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await apiClient.getAdminEmployeePTOStatus(5);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/employees/5/pto-status",
      { credentials: "include" },
    );
    expect(result).toEqual(mockResponse);
    expect(result.employeeName).toBe("Jane Smith");
  });

  it("should throw on non-OK response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ error: "Employee not found" }),
    });

    await expect(apiClient.getAdminEmployeePTOStatus(999)).rejects.toThrow(
      "Employee not found",
    );
  });

  it("should throw on 403 Forbidden for non-admin users", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () => Promise.resolve({ error: "Admin access required" }),
    });

    await expect(apiClient.getAdminEmployeePTOStatus(5)).rejects.toThrow(
      "Admin access required",
    );
  });

  it("should include current_date query param when provided", async () => {
    const mockResponse = {
      employeeId: 5,
      employeeName: "Jane Smith",
      hireDate: "2020-01-15",
      dailyRate: 0.71,
      annualAllocation: 80,
      availablePTO: 50,
      usedPTO: 10,
      carryoverFromPreviousYear: 0,
      monthlyAccruals: [],
      nextRolloverDate: "2026-01-01",
      sickTime: { allowed: 40, used: 0, remaining: 40 },
      ptoTime: { allowed: 80, used: 10, remaining: 70 },
      bereavementTime: { allowed: 24, used: 0, remaining: 24 },
      juryDutyTime: { allowed: 40, used: 0, remaining: 40 },
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await apiClient.getAdminEmployeePTOStatus(5, "2025-06-15");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/employees/5/pto-status?current_date=2025-06-15",
      { credentials: "include" },
    );
  });

  it("should not include current_date query param when omitted", async () => {
    const mockResponse = {
      employeeId: 5,
      employeeName: "Jane Smith",
      hireDate: "2020-01-15",
      dailyRate: 0.71,
      annualAllocation: 80,
      availablePTO: 50,
      usedPTO: 10,
      carryoverFromPreviousYear: 0,
      monthlyAccruals: [],
      nextRolloverDate: "2027-01-01",
      sickTime: { allowed: 40, used: 0, remaining: 40 },
      ptoTime: { allowed: 80, used: 10, remaining: 70 },
      bereavementTime: { allowed: 24, used: 0, remaining: 24 },
      juryDutyTime: { allowed: 40, used: 0, remaining: 40 },
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await apiClient.getAdminEmployeePTOStatus(5);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/employees/5/pto-status",
      { credentials: "include" },
    );
  });
});

// ── EmployeeList: "View" button ─────────────────────────────────

describe("EmployeeList - View Summary Button", () => {
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
    if (container?.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render a View button on every employee card", () => {
    const buttons = component.shadowRoot?.querySelectorAll(".view-summary");
    expect(buttons?.length).toBe(testEmployees.length);
    buttons?.forEach((btn) => {
      expect(btn.textContent?.trim()).toBe("View");
    });
  });

  it("should place View button after View Calendar and before Edit", () => {
    const firstCard = component.shadowRoot?.querySelector(".employee-card");
    const actions = firstCard?.querySelector(".employee-actions");
    const buttons = actions?.querySelectorAll(".action-btn");
    expect(buttons).toBeTruthy();

    // Order: View Calendar, View, Edit, Delete
    const labels = Array.from(buttons!).map((b) => b.textContent?.trim());
    expect(labels).toEqual(["View Calendar", "View", "Edit", "Delete"]);
  });

  it("should dispatch router-navigate on View button click", () => {
    const navigateHandler = vi.fn();
    window.addEventListener(
      "router-navigate",
      navigateHandler as EventListener,
    );

    const viewBtn = component.shadowRoot?.querySelector(
      ".action-btn.view-summary",
    ) as HTMLElement;
    expect(viewBtn).toBeTruthy();

    viewBtn.click();

    expect(navigateHandler).toHaveBeenCalledTimes(1);
    const detail = (navigateHandler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.path).toMatch(
      /^\/current-year-summary\?employeeId=1&current_date=\d{4}-\d{2}-\d{2}$/,
    );

    window.removeEventListener(
      "router-navigate",
      navigateHandler as EventListener,
    );
  });
});

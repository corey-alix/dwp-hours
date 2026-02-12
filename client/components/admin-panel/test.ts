import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { AdminPanel } from "./index.js";
import { seedEmployees, seedPTOEntries } from "../../../shared/seedData.js";

// Admin Panel Test Data Integration:
// This test harness integrates seed data from shared/seedData.ts to provide
// realistic test data for the admin panel. Supports two modes:
// 1. Empty state: No seed data loaded
// 2. Seeded state: Full seed data loaded
// Data is injected via component methods following event-driven architecture.
export function playground() {
  console.log("Starting Admin Panel playground test...");

  const adminPanel = querySingle<AdminPanel>("admin-panel");
  const testOutput = querySingle<HTMLElement>("#test-output");
  const toggleButton = querySingle<HTMLButtonElement>("#toggle-seed-data");

  let seedDataLoaded = false;

  const setOutput = (message: string) => {
    testOutput.textContent = message;
  };

  const loadSeedData = () => {
    const employees = seedEmployees.map((emp) => ({
      id: emp.name === "John Doe" ? 1 : emp.name === "Jane Smith" ? 2 : 3, // Map to IDs
      name: emp.name,
      identifier: emp.identifier,
      ptoRate: emp.pto_rate,
      carryoverHours: emp.carryover_hours,
      hireDate: emp.hire_date,
      role: emp.role,
      hash: emp.hash || undefined,
    }));

    // Create employee name map for PTO requests
    const employeeNames: { [key: number]: string } = {};
    employees.forEach((emp) => {
      employeeNames[emp.id] = emp.name;
    });

    // Create PTO requests from pending entries (approved_by = null)
    const ptoRequests = seedPTOEntries
      .filter((entry) => entry.approved_by === null)
      .map((entry, index) => ({
        id: index + 1, // Simple ID assignment
        employeeId: entry.employee_id,
        employeeName: employeeNames[entry.employee_id] || "Unknown",
        startDate: entry.date,
        endDate: entry.date, // Single day entries for now
        type: entry.type,
        hours: entry.hours,
        status: "pending" as const,
        createdAt: new Date().toISOString(), // Current timestamp for testing
      }));

    adminPanel.setEmployees(employees);
    adminPanel.setPTORequests(ptoRequests);
    seedDataLoaded = true;
    setOutput("Seed data loaded");
    toggleButton.textContent = "Unload Seed Data";
  };

  const unloadSeedData = () => {
    adminPanel.setEmployees([]);
    adminPanel.setPTORequests([]);
    seedDataLoaded = false;
    setOutput("Seed data unloaded (empty state)");
    toggleButton.textContent = "Load Seed Data";
  };

  // Initially load seed data
  loadSeedData();

  // Toggle button
  addEventListener(toggleButton, "click", () => {
    if (seedDataLoaded) {
      unloadSeedData();
    } else {
      loadSeedData();
    }
  });

  // Handle employee creation/update events from admin panel
  addEventListener(adminPanel, "create-employee", (e: CustomEvent) => {
    console.log("Create employee:", e.detail);
    setOutput(`Create Employee: ${e.detail.employee.name}`);
    // In a real app, this would save to database and refresh the list
    // For testing, we don't update the local list since the component handles it
  });

  addEventListener(adminPanel, "update-employee", (e: CustomEvent) => {
    console.log("Update employee:", e.detail);
    setOutput(`Update Employee: ${e.detail.employee.name}`);
    // In a real app, this would update in database and refresh the list
    // For testing, update the local list
    const updatedEmployee = e.detail.employee;
    const currentEmployees = adminPanel.employees || [];
    const index = currentEmployees.findIndex(
      (emp) => emp.id === updatedEmployee.id,
    );
    if (index !== -1) {
      currentEmployees[index] = updatedEmployee;
      adminPanel.setEmployees(currentEmployees);
    }
  });

  const attachChildListeners = () => {
    const shadowRoot = adminPanel.shadowRoot;
    if (!shadowRoot) {
      return;
    }

    const employeeList = shadowRoot.querySelector("employee-list");
    if (employeeList instanceof HTMLElement) {
      addEventListener(employeeList, "add-employee", () => {
        setOutput("Add Employee clicked");
      });

      addEventListener(employeeList, "employee-edit", (e: CustomEvent) => {
        setOutput(`Edit Employee: ${e.detail?.employeeId ?? "unknown"}`);
      });

      addEventListener(employeeList, "employee-delete", (e: CustomEvent) => {
        setOutput(`Delete Employee: ${e.detail?.employeeId ?? "unknown"}`);
      });

      addEventListener(
        employeeList,
        "employee-acknowledge",
        (e: CustomEvent) => {
          setOutput(
            `Acknowledge Employee: ${e.detail?.employeeId ?? "unknown"}`,
          );
        },
      );
    }

    const requestQueue = shadowRoot.querySelector("pto-request-queue");
    if (requestQueue instanceof HTMLElement) {
      addEventListener(requestQueue, "request-approve", (e: CustomEvent) => {
        setOutput(`Approve Request: ${e.detail?.requestId ?? "unknown"}`);
      });

      addEventListener(requestQueue, "request-reject", (e: CustomEvent) => {
        setOutput(`Reject Request: ${e.detail?.requestId ?? "unknown"}`);
      });
    }

    const reportGenerator = shadowRoot.querySelector("report-generator");
    if (reportGenerator instanceof HTMLElement) {
      addEventListener(reportGenerator, "generate-report", (e: CustomEvent) => {
        const reportType = e.detail?.reportType ?? "unknown";
        setOutput(`Generate Report: ${reportType}`);
      });

      addEventListener(reportGenerator, "report-exported", (e: CustomEvent) => {
        setOutput(`Report Exported: ${e.detail?.filename ?? "csv"}`);
      });

      addEventListener(
        reportGenerator,
        "report-type-change",
        (e: CustomEvent) => {
          setOutput(`Report Type: ${e.detail?.reportType ?? "unknown"}`);
        },
      );

      addEventListener(
        reportGenerator,
        "date-range-change",
        (e: CustomEvent) => {
          const range = e.detail?.dateRange;
          if (range?.start && range?.end) {
            setOutput(`Date Range: ${range.start} to ${range.end}`);
          }
        },
      );
    }
  };

  // Test view changes
  addEventListener(adminPanel, "view-change", (e: CustomEvent) => {
    console.log("View changed to:", e.detail.view);
    setOutput(`Current view: ${e.detail.view}`);
    attachChildListeners();
  });

  attachChildListeners();

  // Test programmatic view changes
  setTimeout(() => {
    console.log("Testing programmatic view change to PTO requests...");
    adminPanel.currentView = "pto-requests";
  }, 2000);

  setTimeout(() => {
    console.log("Testing programmatic view change to reports...");
    adminPanel.currentView = "reports";
  }, 4000);

  setTimeout(() => {
    console.log("Testing programmatic view change back to employees...");
    adminPanel.currentView = "employees";
  }, 6000);

  console.log("Admin Panel playground test initialized");
}

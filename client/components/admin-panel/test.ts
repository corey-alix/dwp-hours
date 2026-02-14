import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { AdminPanel } from "./index.js";
import {
  seedEmployees,
  seedPTOEntries,
  seedAdminAcknowledgments,
} from "../../../shared/seedData.js";

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

  // Create toggle button programmatically
  const toggleButton = document.createElement("button");
  toggleButton.id = "toggle-seed-data";
  toggleButton.textContent = "Toggle Seed Data";
  toggleButton.style.margin = "10px 0";
  document.body.insertBefore(toggleButton, adminPanel);

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

    // Set admin acknowledgment data for monthly review component
    const acknowledgments = seedAdminAcknowledgments.map((ack) => ({
      id: `${ack.employee_id}-${ack.month}`, // Simple ID for testing
      employeeId: ack.employee_id,
      month: ack.month,
      adminId: ack.admin_id,
      acknowledgedAt: ack.acknowledged_at,
      adminName:
        employees.find((emp) => emp.id === ack.admin_id)?.name ||
        "Unknown Admin",
    }));

    // Find and set data on admin-monthly-review component if it exists
    const shadowRoot = adminPanel.shadowRoot;
    if (shadowRoot) {
      const monthlyReview = shadowRoot.querySelector("admin-monthly-review");
      if (
        monthlyReview &&
        typeof (monthlyReview as any).setAcknowledgmentData === "function"
      ) {
        (monthlyReview as any).setAcknowledgmentData(acknowledgments);
      }
    }

    seedDataLoaded = true;
    setOutput("Seed data loaded");
    toggleButton.textContent = "Unload Seed Data";
  };

  const unloadSeedData = () => {
    adminPanel.setEmployees([]);
    adminPanel.setPTORequests([]);

    // Clear admin acknowledgment data
    const shadowRoot = adminPanel.shadowRoot;
    if (shadowRoot) {
      const monthlyReview = shadowRoot.querySelector("admin-monthly-review");
      if (
        monthlyReview &&
        typeof (monthlyReview as any).setAcknowledgmentData === "function"
      ) {
        (monthlyReview as any).setAcknowledgmentData([]);
      }
    }

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

  // Handle admin monthly review data requests
  addEventListener(
    adminPanel,
    "admin-monthly-review-request",
    (e: CustomEvent) => {
      console.log("Admin monthly review request:", e.detail);
      const { month } = e.detail;

      // Employee ID mapping (matches seed data conventions)
      const employeeIdMap: Record<string, number> = {
        "John Doe": 1,
        "Jane Smith": 2,
        "Admin User": 3,
      };

      // Build data for ALL employees, computing hours from seedPTOEntries
      // and acknowledgment status from seedAdminAcknowledgments
      const mockData = seedEmployees.map((emp) => {
        const empId = employeeIdMap[emp.name] || 0;

        // Sum PTO hours by type for the requested month
        const monthEntries = seedPTOEntries.filter(
          (entry) =>
            entry.employee_id === empId && entry.date.startsWith(month),
        );
        const ptoHours = monthEntries
          .filter((e) => e.type === "PTO")
          .reduce((sum, e) => sum + e.hours, 0);
        const sickHours = monthEntries
          .filter((e) => e.type === "Sick")
          .reduce((sum, e) => sum + e.hours, 0);
        const bereavementHours = monthEntries
          .filter((e) => e.type === "Bereavement")
          .reduce((sum, e) => sum + e.hours, 0);
        const juryDutyHours = monthEntries
          .filter((e) => e.type === "Jury Duty")
          .reduce((sum, e) => sum + e.hours, 0);
        const totalHours =
          172 - ptoHours - sickHours - bereavementHours - juryDutyHours;

        // Check acknowledgment status
        const ack = seedAdminAcknowledgments.find(
          (a) => a.employee_id === empId && a.month === month,
        );
        const admin = ack
          ? seedEmployees.find(
              (_, i) => employeeIdMap[seedEmployees[i].name] === ack.admin_id,
            )
          : undefined;

        return {
          employeeId: empId,
          employeeName: emp.name,
          month,
          totalHours,
          ptoHours,
          sickHours,
          bereavementHours,
          juryDutyHours,
          acknowledgedByAdmin: !!ack,
          adminAcknowledgedAt: ack?.acknowledged_at || null,
          adminAcknowledgedBy: admin?.name || null,
        };
      });

      // Inject data into the monthly review component
      const shadowRoot = adminPanel.shadowRoot;
      if (shadowRoot) {
        const monthlyReview = shadowRoot.querySelector("admin-monthly-review");
        if (
          monthlyReview &&
          typeof (monthlyReview as any).setEmployeeData === "function"
        ) {
          (monthlyReview as any).setEmployeeData(mockData);
        }
      }

      setOutput(
        `Loaded monthly review data for ${month}: ${mockData.length} employees`,
      );
    },
  );

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

    // Handle admin acknowledgment events from monthly review component
    const monthlyReview = shadowRoot.querySelector("admin-monthly-review");
    if (monthlyReview instanceof HTMLElement) {
      addEventListener(monthlyReview, "admin-acknowledge", (e: CustomEvent) => {
        const { employeeId, employeeName, month } = e.detail || {};
        setOutput(
          `Admin Acknowledge: ${employeeName || "Unknown"} (${employeeId || "unknown"}) for ${month || "unknown month"}`,
        );
      });
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

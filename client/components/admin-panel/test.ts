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
// realistic test data for the admin panel.
//
// ROLE: This playground test is ONLY for:
// 1. Seeding test data into components
// 2. Hooking into component events to report them to the user via #test-output
// 3. Demonstrating component functionality in the browser
//
// Component interaction testing (button clicks, form validation) should be done in Vitest unit tests.
// E2E Playwright tests are for API interactions and visual snapshots only.
export function playground() {
  console.log("Starting Admin Panel playground test...");

  const adminPanel = querySingle<AdminPanel>("admin-panel");
  const testOutput = querySingle<HTMLElement>("#test-output");

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

    setOutput("Seed data loaded");
  };

  // Load seed data
  loadSeedData();

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

  // Handle PTO request approve/reject events
  addEventListener(adminPanel, "pto-approve", (e: CustomEvent) => {
    console.log("PTO approve event:", e.detail);
    setOutput(`Approved PTO request ID: ${e.detail.requestId}`);
  });

  addEventListener(adminPanel, "pto-reject", (e: CustomEvent) => {
    console.log("PTO reject event:", e.detail);
    setOutput(`Rejected PTO request ID: ${e.detail.requestId}`);
  });

  console.log("Admin Panel playground test initialized");
}

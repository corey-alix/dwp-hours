import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { AdminMonthlyReview } from "./index.js";
import {
  seedEmployees,
  seedPTOEntries,
  seedAdminAcknowledgments,
} from "../../../shared/seedData.js";
import type { AdminMonthlyReviewItem } from "../../../shared/api-models.js";

// Admin Monthly Review Test Architecture:
// This test harness implements the "seed data integration" testing pattern:
// 1. Reads realistic data from shared/seedData.ts (same source as server tests)
// 2. Transforms seed data into AdminMonthlyReviewItem[] structure
// 3. Simulates the /api/admin/monthly-review/:month API response
// 4. Tests component event-driven data flow without network dependencies
// 5. Ensures type safety with shared AdminMonthlyReviewItem interface

function generateMonthlyData(month: string): AdminMonthlyReviewItem[] {
  const data: AdminMonthlyReviewItem[] = [];

  for (let i = 0; i < seedEmployees.length; i++) {
    const employee = seedEmployees[i];
    const employeeId = i + 1; // employee_id starts from 1

    // Filter PTO entries for this employee and month
    const monthEntries = seedPTOEntries.filter(
      (entry) =>
        entry.employee_id === employeeId && entry.date.startsWith(month),
    );

    // Aggregate hours by type
    const hours = {
      pto: 0,
      sick: 0,
      bereavement: 0,
      juryDuty: 0,
    };

    for (const entry of monthEntries) {
      switch (entry.type) {
        case "PTO":
          hours.pto += entry.hours;
          break;
        case "Sick":
          hours.sick += entry.hours;
          break;
        case "Bereavement":
          hours.bereavement += entry.hours;
          break;
        case "Jury Duty":
          hours.juryDuty += entry.hours;
          break;
      }
    }

    // Check if acknowledged
    const acknowledgment = seedAdminAcknowledgments.find(
      (ack) => ack.employee_id === employeeId && ack.month === month,
    );

    // Mock total hours (assuming 40 hours/week * 4.3 weeks ≈ 172 hours)
    const totalHours = 172;

    data.push({
      employeeId: employeeId,
      employeeName: employee.name,
      month,
      totalHours,
      ptoHours: hours.pto,
      sickHours: hours.sick,
      bereavementHours: hours.bereavement,
      juryDutyHours: hours.juryDuty,
      acknowledgedByAdmin: !!acknowledgment,
      adminAcknowledgedAt: acknowledgment?.acknowledged_at,
      adminAcknowledgedBy: acknowledgment
        ? seedEmployees.find((e, idx) => idx + 1 === acknowledgment.admin_id)
            ?.name
        : undefined,
    });
  }

  return data;
}

function playground() {
  console.log("Starting Admin Monthly Review playground test...");

  const monthlyReview = querySingle<AdminMonthlyReview>("admin-monthly-review");
  const testOutput = querySingle<HTMLElement>("#test-output");

  // Create test controls
  const controlsDiv = document.createElement("div");
  controlsDiv.style.margin = "20px 0";
  controlsDiv.style.padding = "20px";
  controlsDiv.style.border = "1px solid #ddd";
  controlsDiv.style.borderRadius = "8px";
  controlsDiv.style.background = "#f9f9f9";

  controlsDiv.innerHTML = `
    <h3>Test Controls</h3>
    <p>This component displays employee monthly data for admin review and acknowledgment.</p>
    <div style="margin-top: 10px;">
      <strong>Current Features:</strong>
      <ul>
        <li>Month selector to view different months</li>
        <li>Employee cards showing hours breakdown</li>
        <li>Acknowledgment status indicators</li>
        <li>Acknowledge buttons for pending reviews</li>
      </ul>
    </div>
    <div style="margin-top: 10px;">
      <strong>Test Data:</strong> Uses seed data from shared/seedData.ts for development testing.
    </div>
  `;

  document.body.insertBefore(controlsDiv, monthlyReview);

  const setOutput = (message: string) => {
    testOutput.textContent = message;
  };

  // Listen for data requests
  addEventListener(
    monthlyReview,
    "admin-monthly-review-request",
    (e: CustomEvent) => {
      const { month } = e.detail;
      console.log("Monthly review data requested for:", month);

      const data = generateMonthlyData(month);
      monthlyReview.setEmployeeData(data);

      setOutput(`Loaded data for ${data.length} employees in ${month}`);
    },
  );

  // Listen for acknowledgment events
  addEventListener(monthlyReview, "admin-acknowledge", (e: CustomEvent) => {
    const { employeeId, employeeName, month } = e.detail;
    setOutput(
      `Acknowledgment requested for ${employeeName} (ID: ${employeeId}), Month: ${month}`,
    );

    // In a real implementation, this would trigger the API call
    console.log("Admin acknowledgment event:", e.detail);
  });

  // Set initial data for current month
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const initialData = generateMonthlyData(currentMonth);
  monthlyReview.setEmployeeData(initialData);

  setOutput(
    `Admin Monthly Review component loaded with data for ${initialData.length} employees. Select a month and test acknowledgment functionality.`,
  );
}

// Export for module loading
export { playground };

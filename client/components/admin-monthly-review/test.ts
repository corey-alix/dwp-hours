import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { AdminMonthlyReview } from "./index.js";
import { seedEmployees } from "../../../shared/seedData.js";

// Admin Monthly Review Test Data Integration:
// This test harness provides realistic test scenarios for the admin monthly review component.
// Supports testing acknowledgment workflows with mock employee data.
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
      <strong>Test Data:</strong> Uses mock employee data for development testing.
    </div>
  `;

  document.body.insertBefore(controlsDiv, monthlyReview);

  const setOutput = (message: string) => {
    testOutput.textContent = message;
  };

  // Listen for acknowledgment events
  addEventListener(monthlyReview, "admin-acknowledge", (e: CustomEvent) => {
    const { employeeId, month } = e.detail;
    setOutput(
      `Acknowledgment requested for Employee ID: ${employeeId}, Month: ${month}`,
    );

    // In a real implementation, this would trigger the API call
    console.log("Admin acknowledgment event:", e.detail);
  });

  setOutput(
    "Admin Monthly Review component loaded. Select a month and test acknowledgment functionality.",
  );
}

// Export for module loading
export { playground };

import { querySingle } from "../test-utils.js";
import { PtoSummaryCard } from "./index.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting PTO Summary Card playground test...");

  const card = querySingle<PtoSummaryCard>("pto-summary-card");

  // Compute summary from seedData
  const employee = seedEmployees.find(
    (e) => e.identifier === "john.doe@gmail.com",
  )!;
  const approvedPtoEntries = seedPTOEntries.filter(
    (e) => e.employee_id === 1 && e.approved_by !== null && e.type === "PTO",
  );
  const usedPto = approvedPtoEntries.reduce((sum, e) => sum + e.hours, 0);
  const annualAllocation = 96; // Standard annual allocation
  const availablePto = annualAllocation + employee.carryover_hours - usedPto;

  // Set initial sample data computed from seedData
  card.summary = {
    annualAllocation,
    availablePTO: availablePto,
    usedPTO: usedPto,
    carryoverFromPreviousYear: employee.carryover_hours,
  };

  querySingle("#test-output").textContent = "Initial data set via property";

  // Test attribute-based data setting
  setTimeout(() => {
    card.setAttribute(
      "data",
      JSON.stringify({
        annualAllocation,
        availablePTO: availablePto,
        usedPTO: usedPto,
        carryoverFromPreviousYear: employee.carryover_hours,
      }),
    );
    querySingle("#test-output").textContent = "Data updated via attribute";
  }, 2000);
}

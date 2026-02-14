import { querySingle } from "../test-utils.js";
import { PtoSummaryCard } from "./index.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting PTO Summary Card playground test...");

  // Set up John Doe card (employee 1)
  setupEmployeeCard("john.doe@gmail.com", "pto-summary-card-john", 1);

  // Set up Jane Smith card (employee 2)
  setupEmployeeCard("jane.smith@example.com", "pto-summary-card-jane", 2);

  // Set up Admin User card (employee 3)
  setupEmployeeCard("admin@example.com", "pto-summary-card-admin", 3);
}

function setupEmployeeCard(
  employeeIdentifier: string,
  cardId: string,
  employeeId: number,
) {
  const card = querySingle<PtoSummaryCard>(`#${cardId}`);

  // Compute summary from seedData
  const employee = seedEmployees.find(
    (e) => e.identifier === employeeIdentifier,
  )!;
  const approvedPtoEntries = seedPTOEntries.filter(
    (e) =>
      e.employee_id === employeeId &&
      e.approved_by !== null &&
      e.type === "PTO",
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

  // Set full PTO entries for approval testing
  const allPtoEntries = seedPTOEntries
    .filter((e) => e.employee_id === employeeId && e.type === "PTO")
    .map((seedEntry, index) => ({
      id: index + 1,
      employeeId: seedEntry.employee_id,
      date: seedEntry.date,
      type: seedEntry.type,
      hours: seedEntry.hours,
      createdAt: "2025-01-01T00:00:00.000Z",
      approved_by: seedEntry.approved_by,
    }));
  card.setAttribute("full-entries", JSON.stringify(allPtoEntries));

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
    card.setAttribute("full-entries", JSON.stringify(allPtoEntries));
    querySingle("#test-output").textContent = "Data updated via attribute";
  }, 2000);
}

import { PtoCalendar, CalendarEntry, PTOEntry } from "./index.js";
import { seedPTOEntries } from "../../../shared/seedData.js";
import { today } from "../../../shared/dateUtils.js";

export function playground(): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = `
        <h2>PTO Calendar Component Test</h2>
        <p>This demonstrates the extracted calendar component that can be tested independently.</p>
    `;

  // Create calendar component
  const calendar = document.createElement("pto-calendar") as PtoCalendar;

  // Use seed data for February 2026
  const sampleEntries: PTOEntry[] = seedPTOEntries
    .filter(
      (entry) => entry.employee_id === 1 && entry.date.startsWith("2026-02"),
    )
    .map((entry, index) => ({
      id: entry.employee_id * 1000 + index, // Generate unique id
      employeeId: entry.employee_id,
      date: entry.date,
      hours: entry.hours,
      type: entry.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
      createdAt: today(),
      approved_by: entry.approved_by,
    }));

  calendar.setYear(2026);
  calendar.setMonth(1); // February (0-indexed)
  calendar.setPtoEntries(sampleEntries);
  calendar.setReadonly(false); // Start in editable mode for testing

  // Add event listener for PTO request submission
  calendar.addEventListener("pto-request-submit", (event: any) => {
    console.log("PTO Request Submitted:", event.detail);
  });

  container.appendChild(calendar);

  // Add some test controls
  const controls = document.createElement("div");
  controls.innerHTML = `
        <h3>Test Controls</h3>
        <button id="test-colors">Test Color Coding</button>
        <button id="test-legend">Test Legend</button>
        <button id="test-checkmarks">Test Checkmarks</button>
        <div id="test-results"></div>
    `;
  container.appendChild(controls);

  // Add event listeners for testing
  const testColorsBtn = container.querySelector(
    "#test-colors",
  ) as HTMLButtonElement;
  const testLegendBtn = container.querySelector(
    "#test-legend",
  ) as HTMLButtonElement;
  const testCheckmarksBtn = container.querySelector(
    "#test-checkmarks",
  ) as HTMLButtonElement;
  const testResults = container.querySelector(
    "#test-results",
  ) as HTMLDivElement;

  testColorsBtn.addEventListener("click", () => {
    const sickDays = calendar.shadowRoot?.querySelectorAll(".type-Sick");
    const ptoDays = calendar.shadowRoot?.querySelectorAll(".type-PTO");
    testResults.innerHTML = `
            <p>Sick days found: ${sickDays?.length || 0}</p>
            <p>PTO days found: ${ptoDays?.length || 0}</p>
        `;
  });

  testLegendBtn.addEventListener("click", () => {
    const legendItems = calendar.shadowRoot?.querySelectorAll(".legend-item");
    testResults.innerHTML = `
            <p>Legend items: ${legendItems?.length || 0}</p>
        `;
  });

  testCheckmarksBtn.addEventListener("click", () => {
    const checkmarks = calendar.shadowRoot?.querySelectorAll(".checkmark");
    testResults.innerHTML = `
            <p>Checkmarks found: ${checkmarks?.length || 0}</p>
        `;
  });

  return container;
}

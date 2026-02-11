import { PtoCalendar, CalendarEntry, PTOEntry } from "./index.js";

export function playground(): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = `
        <h2>PTO Calendar Component Test</h2>
        <p>This demonstrates the extracted calendar component that can be tested independently.</p>
    `;

  // Create calendar component
  const calendar = document.createElement("pto-calendar") as PtoCalendar;

  // Sample data for February 2024
  const sampleEntries: PTOEntry[] = [
    {
      id: 1,
      employeeId: 1,
      date: "2024-02-12",
      hours: 4.0,
      type: "Sick",
      createdAt: "2024-01-01T00:00:00Z",
      approved_by: 3, // Approved
    },
    {
      id: 2,
      employeeId: 1,
      date: "2024-02-14",
      hours: 8.0,
      type: "Sick",
      createdAt: "2024-01-01T00:00:00Z",
      approved_by: 3, // Approved
    },
    {
      id: 3,
      employeeId: 1,
      date: "2024-02-16",
      hours: 8.0,
      type: "Sick",
      createdAt: "2024-01-01T00:00:00Z",
      // No approved_by - pending
    },
    {
      id: 4,
      employeeId: 1,
      date: "2024-02-20",
      hours: 8.0,
      type: "PTO",
      createdAt: "2024-01-01T00:00:00Z",
      approved_by: 3, // Approved
    },
    {
      id: 5,
      employeeId: 1,
      date: "2024-02-21",
      hours: 8.0,
      type: "PTO",
      createdAt: "2024-01-01T00:00:00Z",
      // No approved_by - pending
    },
    {
      id: 6,
      employeeId: 1,
      date: "2024-02-22",
      hours: 4.0,
      type: "PTO",
      createdAt: "2024-01-01T00:00:00Z",
      approved_by: 3, // Approved
    },
  ];

  calendar.setYear(2024);
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

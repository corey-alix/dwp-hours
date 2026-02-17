import { PtoCalendar, CalendarEntry, PTOEntry } from "./index.js";
import { seedPTOEntries } from "../../../shared/seedData.js";
import { today } from "../../../shared/dateUtils.js";
import { querySingle } from "../test-utils.js";

export function playground(): void {
  // Get existing calendar component
  const calendar = querySingle<PtoCalendar>("pto-calendar");

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

  let isEditMode = true;
  let currentMonth = 2; // February (1-indexed)
  let currentYear = 2026;

  function updateCalendar() {
    calendar.setYear(currentYear);
    calendar.setMonth(currentMonth);
    calendar.setReadonly(!isEditMode);
    calendar.setPtoEntries(sampleEntries);
  }

  function updateModeDisplay() {
    const modeDisplay = querySingle<HTMLSpanElement>("#mode-display");
    modeDisplay.textContent = `Mode: ${isEditMode ? "Edit" : "View"}`;
  }

  // Add event listeners for controls
  const prevBtn = querySingle<HTMLButtonElement>("#prev-month");
  const nextBtn = querySingle<HTMLButtonElement>("#next-month");
  const toggleBtn = querySingle<HTMLButtonElement>("#toggle-mode");

  prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    updateCalendar();
  });

  nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    updateCalendar();
  });

  toggleBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    updateCalendar();
    updateModeDisplay();
  });

  // Initialize with seed data
  updateCalendar();
  updateModeDisplay();

  // Add event listener for PTO request submission
  calendar.addEventListener("pto-request-submit", (event: any) => {
    console.log("PTO Request Submitted:", event.detail);
  });

  // Add event listeners for testing
  const testColorsBtn = querySingle<HTMLButtonElement>("#test-colors");
  const testLegendBtn = querySingle<HTMLButtonElement>("#test-legend");
  const testCheckmarksBtn = querySingle<HTMLButtonElement>("#test-checkmarks");
  const testResults = querySingle<HTMLDivElement>("#test-results");

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
}

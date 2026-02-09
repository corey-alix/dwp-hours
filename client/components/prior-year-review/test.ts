import { querySingle } from "../test-utils.js";
import { PriorYearReview } from "./index.js";
import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { seedPTOEntries } from "../../../scripts/seedData.js";
import { getDaysInMonth } from "../../../shared/dateUtils.js";

// Transform seed data into test format
function createMockDataFromSeed(year: number): PTOYearReviewResponse {
  // Filter entries for the specified year and employee 1 (John Doe)
  const yearEntries = seedPTOEntries.filter(
    (entry) => entry.employee_id === 1 && entry.date.startsWith(`${year}-`),
  );

  const months: PTOYearReviewResponse["months"] = [];

  for (let month = 1; month <= 12; month++) {
    const monthEntries = yearEntries.filter((entry) => {
      const entryMonth = parseInt(entry.date.split("-")[1]);
      return entryMonth === month;
    });

    // Calculate summary counts
    const summary = {
      totalDays: getDaysInMonth(year, month), // Days in month
      ptoHours: monthEntries
        .filter((e) => e.type === "PTO")
        .reduce((sum, e) => sum + e.hours, 0),
      sickHours: monthEntries
        .filter((e) => e.type === "Sick")
        .reduce((sum, e) => sum + e.hours, 0),
      bereavementHours: monthEntries
        .filter((e) => e.type === "Bereavement")
        .reduce((sum, e) => sum + e.hours, 0),
      juryDutyHours: monthEntries
        .filter((e) => e.type === "Jury Duty")
        .reduce((sum, e) => sum + e.hours, 0),
    };

    months.push({
      month,
      ptoEntries: monthEntries.map(({ date, type, hours }) => ({
        date,
        type,
        hours,
      })),
      summary,
    });
  }

  return { year, months };
}

// Create mock data from seed data
const mock2025Data = createMockDataFromSeed(2025);
const mock2026Data = createMockDataFromSeed(2026);

// Mock data map - include years with data
const mockDataMap: Record<number, PTOYearReviewResponse> = {
  2025: mock2025Data,
  2026: mock2026Data,
};

export function playground() {
  console.log("Starting prior year review playground test...");

  const component = querySingle<PriorYearReview>("prior-year-review");
  const output = querySingle("#test-output");

  // Create year selector externally
  const yearSelectorContainer = document.createElement("div");
  yearSelectorContainer.style.marginBottom = "16px";
  yearSelectorContainer.innerHTML = `
        <label for="external-year-select" style="font-weight: 600;">Select Year:</label>
        <select id="external-year-select" style="margin-left: 8px; padding: 4px 8px;">
            ${Object.keys(mockDataMap)
              .sort()
              .reverse()
              .map((year) => `<option value="${year}">${year}</option>`)
              .join("")}
        </select>
    `;

  // Insert before the component
  component.parentNode?.insertBefore(yearSelectorContainer, component);

  // Function to update component data
  const updateComponent = (year: number) => {
    const data = mockDataMap[year];
    component.data = data || null;
    output.textContent = data
      ? `Loaded data for ${year}`
      : `No data available for ${year}`;
  };

  // Initial load
  const initialYear = 2026;
  updateComponent(initialYear);
  (document.getElementById("external-year-select") as HTMLSelectElement).value =
    initialYear.toString();

  // Handle year change
  document
    .getElementById("external-year-select")
    ?.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const year = parseInt(target.value, 10);
      updateComponent(year);
    });

  console.log(
    "Prior Year Review playground test initialized with external year selector",
  );
}

import { querySingle } from "../test-utils.js";
import { CurrentYearPtoScheduler } from "./index.js";
import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { seedPTOEntries } from "../../../shared/seedData.js";
import { getDaysInMonth, getCurrentYear } from "../../../shared/dateUtils.js";

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

export function playground(): void {
  const component = querySingle<CurrentYearPtoScheduler>(
    "current-year-pto-scheduler",
  );
  const testOutput = querySingle("#test-output");

  // Load mock data
  const mockData = createMockDataFromSeed(getCurrentYear());
  component.data = mockData;

  testOutput.textContent = `Loaded mock data for year ${mockData.year} with ${mockData.months.length} months`;
}

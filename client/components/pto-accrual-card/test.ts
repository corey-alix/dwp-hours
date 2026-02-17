import { querySingle } from "../test-utils.js";
import { PtoAccrualCard } from "./index.js";
import { PtoCalendar } from "../pto-calendar/index.js";
import { parseDate, today } from "../../../shared/dateUtils.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";
import {
  computeEmployeeBalanceData,
  BUSINESS_RULES_CONSTANTS,
} from "../../../shared/businessRules.js";

// Compute data from seedData
const employee = seedEmployees.find(
  (e) => e.identifier === "john.doe@gmail.com",
)!;

// Get approved entries for computing bucket usage via businessRules
const approvedSeedEntries = seedPTOEntries.filter(
  (entry) =>
    entry.employee_id === 1 &&
    entry.date.startsWith("2026-") &&
    entry.approved_by !== null,
);

// Use computeEmployeeBalanceData from businessRules.ts for balance computation
const balanceData = computeEmployeeBalanceData(
  1,
  employee.name,
  approvedSeedEntries,
);

// Extract used hours from balanceData (remaining = limit - used, so used = limit - remaining)
const sickLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK;
const otherLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.OTHER;
const sickCategory = balanceData.categories.find((c) => c.category === "Sick")!;
const ptoCategory = balanceData.categories.find((c) => c.category === "PTO")!;
const bereavementCategory = balanceData.categories.find(
  (c) => c.category === "Bereavement",
)!;
const juryCategory = balanceData.categories.find(
  (c) => c.category === "Jury Duty",
)!;

const sickUsed = sickLimit - sickCategory.remaining;
const bereavementUsed = otherLimit - bereavementCategory.remaining;
const juryUsed = otherLimit - juryCategory.remaining;
// PTO limit in computeEmployeeBalanceData is hardcoded to 80; derive used from remaining
const ptoLimitInBusinessRules = 80;
const ptoUsed = ptoLimitInBusinessRules - ptoCategory.remaining;

// Work days in 2026 per month (Mon-Fri)
const workDaysPerMonth = [21, 20, 21, 22, 22, 21, 24, 22, 22, 23, 21, 23];
const totalWorkDays = workDaysPerMonth.reduce((sum, d) => sum + d, 0);

// Compute annual allocation and monthly accruals
const annualAllocation = employee.pto_rate * totalWorkDays;
const monthlyAccruals = workDaysPerMonth.map((workDays, i) => ({
  month: i + 1,
  hours: workDays * employee.pto_rate,
}));

// API response data - computed from seed data using business rules constants
const ptoStatus = {
  employeeId: 1,
  hireDate: employee.hire_date,
  annualAllocation,
  availablePTO: annualAllocation + employee.carryover_hours - ptoUsed,
  usedPTO: ptoUsed,
  carryoverFromPreviousYear: employee.carryover_hours,
  monthlyAccruals,
  nextRolloverDate: "2027-01-01",
  sickTime: {
    allowed: sickLimit,
    used: sickUsed,
    remaining: sickLimit - sickUsed,
  },
  ptoTime: {
    allowed: annualAllocation + employee.carryover_hours,
    used: ptoUsed,
    remaining: annualAllocation + employee.carryover_hours - ptoUsed,
  },
  bereavementTime: {
    allowed: otherLimit,
    used: bereavementUsed,
    remaining: otherLimit - bereavementUsed,
  },
  juryDutyTime: {
    allowed: otherLimit,
    used: juryUsed,
    remaining: otherLimit - juryUsed,
  },
};

// Use all entries for the calendar display (including pending)
const ptoEntries = seedPTOEntries
  .filter((entry) => entry.employee_id === 1 && entry.date.startsWith("2026-"))
  .map((entry) => ({
    date: entry.date,
    type: entry.type,
    hours: entry.hours,
  }));

export function playground() {
  console.log("Starting PTO Accrual Card test...");

  // Wait for component to be defined and ready
  customElements
    .whenDefined("pto-accrual-card")
    .then(() => {
      console.log("pto-accrual-card component defined, waiting for element...");

      const waitForComponent = () => {
        const card = document.querySelector(
          "pto-accrual-card",
        ) as PtoAccrualCard;
        if (card && card.shadowRoot) {
          console.log(
            "PTO Accrual Card component found and ready, initializing...",
          );

          // Process ptoEntries to get monthlyUsage
          const monthlyUsageMap: Record<string, number> = {};
          ptoEntries.forEach((entry) => {
            const month = parseDate(entry.date).month;
            const monthStr = month.toString();
            if (!monthlyUsageMap[monthStr]) monthlyUsageMap[monthStr] = 0;
            monthlyUsageMap[monthStr] += entry.hours;
          });
          const monthlyUsage = Object.keys(monthlyUsageMap).map((month) => ({
            month: parseInt(month),
            hours: monthlyUsageMap[month],
          }));

          // Set data
          // Convert simplified PTO entries to full PTOEntry format for the component
          const fullPtoEntries = ptoEntries.map((entry, index) => ({
            id: index + 1,
            employeeId: 1,
            date: entry.date,
            type: entry.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
            hours: entry.hours,
            createdAt: today(),
          }));

          card.ptoEntries = fullPtoEntries;
          card.monthlyAccruals = ptoStatus.monthlyAccruals;
          card.monthlyUsage = monthlyUsage;
          card.calendarYear = 2026;

          // Listen for month-selected events and compose slotted calendar
          card.addEventListener("month-selected", ((e: CustomEvent) => {
            const { month, year, entries, requestMode } = e.detail;
            console.log("month-selected:", {
              month,
              year,
              entries,
              requestMode,
            });

            // Create or update slotted calendar in light DOM
            let calendar = card.querySelector("pto-calendar") as PtoCalendar;
            if (!calendar) {
              calendar = document.createElement("pto-calendar") as PtoCalendar;
              calendar.setAttribute("slot", "calendar");
              card.appendChild(calendar);
            }

            calendar.setAttribute("month", String(month));
            calendar.setAttribute("year", String(year));
            calendar.ptoEntries = entries;
            calendar.setAttribute("selected-month", String(month));
            // Always allow interaction (edit mode by default)
            calendar.setAttribute("readonly", "false");

            // Scroll the calendar into view
            calendar.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }) as EventListener);

          querySingle("#test-output").textContent =
            "Accrual data set. Click calendar buttons to view details.";
        } else {
          console.log("PTO Accrual Card component not ready yet, retrying...");
          setTimeout(waitForComponent, 100);
        }
      };

      waitForComponent();
    })
    .catch((error) => {
      console.error("Error waiting for pto-accrual-card component:", error);
    });
}

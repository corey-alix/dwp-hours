import { querySingle } from "../test-utils.js";
import { seedEmployees, seedPTOEntries } from "../../../shared/seedData.js";
import { computeMonthlyAccrualRows } from "../../../shared/businessRules.js";
import { getCurrentYear } from "../../../shared/dateUtils.js";
import type { MonthlyAccrualTable } from "./index.js";

export function playground() {
  console.log("Starting Monthly Accrual Table playground...");

  const table = document.createElement(
    "monthly-accrual-table",
  ) as MonthlyAccrualTable;
  document.body.appendChild(table);

  // Use first seed employee (John Doe) for demo data
  const employee = seedEmployees[0];
  const year = getCurrentYear();

  // Filter seed PTO entries for this employee and year
  const yearEntries = seedPTOEntries.filter(
    (e) => e.employee_id === 1 && e.date.startsWith(String(year)),
  );

  const rows = computeMonthlyAccrualRows(
    year,
    employee.carryover_hours,
    employee.hire_date,
    yearEntries,
  );

  table.rows = rows;

  querySingle("#test-output").textContent =
    `Monthly Accrual Table rendered for ${employee.name} (${year}), hire date: ${employee.hire_date}, carryover: ${employee.carryover_hours}h`;

  console.log("Monthly Accrual Table playground initialized", rows);
}

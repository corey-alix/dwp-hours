import { querySingle } from "../test-utils.js";
import type { PtoBalanceSummary } from "./index.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";
import { BUSINESS_RULES_CONSTANTS } from "../../../shared/businessRules.js";
import type {
  PtoBalanceData,
  PtoBalanceCategoryItem,
} from "../../../shared/api-models.js";
import type { PTOType } from "../../../shared/businessRules.js";

/**
 * Compute PtoBalanceData for a given employee from seed data.
 * Uses BUSINESS_RULES_CONSTANTS for annual limits and seed PTO entries
 * for used hours. PTO limit is approximated from pto_rate * 260 workdays + carryover.
 */
function computeBalanceFromSeed(
  employeeId: number,
  year: number,
): PtoBalanceData {
  const empIndex = employeeId - 1;
  const emp = seedEmployees[empIndex];

  // Sum used hours per category for the given year
  const used: Record<PTOType, number> = {
    PTO: 0,
    Sick: 0,
    Bereavement: 0,
    "Jury Duty": 0,
  };
  for (const entry of seedPTOEntries) {
    if (entry.employee_id === employeeId && entry.date.startsWith(`${year}-`)) {
      used[entry.type] += entry.hours;
    }
  }

  // Annual limits from business rules
  const ptoLimit = Math.round(emp.pto_rate * 260) + emp.carryover_hours;
  const sickLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK;
  const bereavementLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT;
  const juryDutyLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY;

  const categories: PtoBalanceCategoryItem[] = [
    { category: "PTO", remaining: ptoLimit - used.PTO },
    { category: "Sick", remaining: sickLimit - used.Sick },
    { category: "Bereavement", remaining: bereavementLimit - used.Bereavement },
    { category: "Jury Duty", remaining: juryDutyLimit - used["Jury Duty"] },
  ];

  return {
    employeeId,
    employeeName: emp.name,
    categories,
  };
}

export function playground() {
  console.log("Starting PTO Balance Summary playground...");

  // Compute balance data for each seed employee (year 2026)
  const balances = seedEmployees.map((_, i) =>
    computeBalanceFromSeed(i + 1, 2026),
  );

  // Populate each component instance
  for (const balance of balances) {
    const el = querySingle<PtoBalanceSummary>(
      `#balance-emp-${balance.employeeId}`,
    );
    el.setBalanceData(balance);
    console.log(
      `Set balance for ${balance.employeeName}:`,
      balance.categories.map((c) => `${c.category}=${c.remaining}h`).join(", "),
    );
  }

  // Leave #balance-empty without data to show empty state

  console.log("PTO Balance Summary playground initialized");
}

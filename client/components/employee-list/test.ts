import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { EmployeeList, type Employee } from "./index.js";
import { seedEmployees, seedPTOEntries } from "../../../shared/seedData.js";
import { computeEmployeeBalanceData } from "../../../shared/businessRules.js";
import type { PtoBalanceData } from "../../../shared/api-models.js";

export function playground() {
  console.log("Starting Employee List playground test...");

  function computeBalanceData(
    employeeId: number,
    employeeName: string,
  ): PtoBalanceData {
    return computeEmployeeBalanceData(employeeId, employeeName, seedPTOEntries);
  }

  function setBalanceSummaries(employees: typeof sampleEmployees) {
    setTimeout(() => {
      const balanceSummaries = employeeList.shadowRoot?.querySelectorAll(
        "pto-balance-summary",
      );
      if (balanceSummaries) {
        balanceSummaries.forEach((summary) => {
          const employeeId = parseInt(
            (summary as HTMLElement).getAttribute("data-employee-id") || "0",
          );
          const employee = employees.find((e) => e.id === employeeId);
          if (employee) {
            let balanceData = computeBalanceData(employeeId, employee.name);
            // Ensure at least one employee shows negative values
            if (
              employeeId === employees.length &&
              balanceData.categories.every((c) => c.remaining >= 0)
            ) {
              balanceData.categories[3].remaining = -4; // Make Jury Duty negative for last employee
            }
            (summary as any).setBalanceData(balanceData);
          }
        });
      }
    }, 100);
  }

  const employeeList = querySingle<EmployeeList>("employee-list");

  // Sample employee data from seedEmployees
  const sampleEmployees: Employee[] = seedEmployees.map((emp, index) => ({
    id: index + 1,
    name: emp.name,
    identifier: emp.identifier,
    ptoRate: emp.pto_rate,
    carryoverHours: emp.carryover_hours,
    role: emp.role,
    hash: emp.hash ?? "",
  }));

  // Set initial data
  employeeList.employees = sampleEmployees;
  setBalanceSummaries(sampleEmployees);

  // Test event listeners
  addEventListener(employeeList, "add-employee", () => {
    console.log("Add employee button clicked");
    querySingle("#test-output").textContent = "Add employee action triggered";
  });

  addEventListener(employeeList, "employee-edit", (e: CustomEvent) => {
    console.log("Edit employee:", e.detail.employeeId);
    querySingle("#test-output").textContent =
      `Edit employee ID: ${e.detail.employeeId}`;
  });

  addEventListener(employeeList, "employee-delete", (e: CustomEvent) => {
    console.log("Delete employee:", e.detail.employeeId);
    querySingle("#test-output").textContent =
      `Delete employee ID: ${e.detail.employeeId}`;
  });

  addEventListener(employeeList, "employee-acknowledge", (e: CustomEvent) => {
    console.log("Acknowledge employee:", e.detail.employeeId);
    querySingle("#test-output").textContent =
      `Acknowledge employee ID: ${e.detail.employeeId}`;
  });

  // Test data updates
  setTimeout(() => {
    console.log("Testing data update...");
    const updatedEmployees: Employee[] = [
      ...sampleEmployees,
      {
        id: 4,
        name: "Alice Wilson",
        identifier: "AW004",
        ptoRate: 0.71,
        carryoverHours: 0,
        role: "Employee",
        hash: "hash4",
      },
    ];
    employeeList.employees = updatedEmployees;
    setBalanceSummaries(updatedEmployees);
    querySingle("#test-output").textContent =
      "Employee data updated - added Alice Wilson";
  }, 3000);

  console.log("Employee List playground test initialized");
}

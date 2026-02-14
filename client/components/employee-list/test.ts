import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { EmployeeList } from "./index.js";
import { seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting Employee List playground test...");

  const employeeList = querySingle<EmployeeList>("employee-list");

  // Sample employee data from seedEmployees
  const sampleEmployees = seedEmployees.map((emp, index) => ({
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

  // Test data updates
  setTimeout(() => {
    console.log("Testing data update...");
    const updatedEmployees = [
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
    querySingle("#test-output").textContent =
      "Employee data updated - added Alice Wilson";
  }, 3000);

  console.log("Employee List playground test initialized");
}

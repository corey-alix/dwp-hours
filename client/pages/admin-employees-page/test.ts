import { querySingle } from "../../components/test-utils.js";
import { seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting Admin Employees Page playground test...");

  const page = document.createElement("admin-employees-page") as any;
  document.body.appendChild(page);

  // Simulate loader data with seed employees
  const employees = seedEmployees.map((e, i) => ({
    id: i + 1,
    name: e.name,
    identifier: e.identifier,
    ptoRate: e.pto_rate,
    carryoverHours: e.carryover_hours,
    role: e.role,
    hireDate: e.hire_date,
  }));

  page.onRouteEnter({}, new URLSearchParams(), { employees });

  querySingle("#test-output").textContent =
    `Admin Employees page rendered with ${employees.length} employees`;

  console.log("Admin Employees Page playground test initialized");
}

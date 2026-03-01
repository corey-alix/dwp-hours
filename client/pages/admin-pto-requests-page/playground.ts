import { querySingle } from "../../components/test-utils.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";
import { today } from "../../../shared/dateUtils.js";

export function playground() {
  console.log("Starting Admin PTO Requests Page playground test...");

  const page = document.createElement("admin-pto-requests-page") as any;
  document.body.appendChild(page);

  // Build pending requests from seed data
  const requests = seedPTOEntries
    .filter((entry) => entry.approved_by === null)
    .map((entry, index) => {
      const employee = seedEmployees.find(
        (e) =>
          e.name ===
          (entry.employee_id === 1
            ? "John Doe"
            : entry.employee_id === 2
              ? "Jane Smith"
              : "Admin User"),
      )!;
      return {
        id: index + 1,
        employeeId: entry.employee_id,
        employeeName: employee.name,
        startDate: entry.date,
        endDate: entry.date,
        type: entry.type,
        hours: entry.hours,
        status: "pending" as const,
        createdAt: today(),
      };
    });

  page.onRouteEnter({}, new URLSearchParams(), { requests });

  querySingle("#test-output").textContent =
    `Admin PTO Requests page rendered with ${requests.length} pending requests`;

  console.log("Admin PTO Requests Page playground test initialized");
}

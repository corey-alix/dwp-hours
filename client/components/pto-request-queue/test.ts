import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { PtoRequestQueue } from "./index.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";
import { today } from "../../../shared/dateUtils.js";

interface PTORequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function playground() {
  console.log("Starting PTO Request Queue playground test...");

  const ptoQueue = querySingle<PtoRequestQueue>("pto-request-queue");

  // Sample PTO requests data from seedData (pending entries)
  const sampleRequests: PTORequest[] = seedPTOEntries
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
        endDate: entry.date, // Assuming single day for simplicity
        type: entry.type,
        hours: entry.hours,
        status: "pending" as const,
        createdAt: today(),
      };
    });

  // Set initial data
  ptoQueue.requests = sampleRequests;

  // Test event listeners
  addEventListener(ptoQueue, "request-approve", (e: CustomEvent) => {
    console.log("Approve request:", e.detail.requestId);
    querySingle("#test-output").textContent =
      `Approved request ID: ${e.detail.requestId}`;
  });

  addEventListener(ptoQueue, "request-reject", (e: CustomEvent) => {
    console.log("Reject request:", e.detail.requestId);
    querySingle("#test-output").textContent =
      `Rejected request ID: ${e.detail.requestId}`;
  });

  // Test data updates
  setTimeout(() => {
    console.log("Testing data update...");
    const updatedRequests: PTORequest[] = [
      ...sampleRequests,
      {
        id: 4,
        employeeId: 1,
        employeeName: "John Doe",
        startDate: "2024-02-25",
        endDate: "2024-02-26",
        type: "Bereavement",
        hours: 16,
        status: "pending",
        createdAt: "2024-02-03T11:45:00Z",
      },
    ];
    ptoQueue.requests = updatedRequests;
    querySingle("#test-output").textContent =
      "Added new PTO request for John Doe";
  }, 3000);

  console.log("PTO Request Queue playground test initialized");
}

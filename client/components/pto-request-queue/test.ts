import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { PtoRequestQueue } from "./index.js";

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

  // Sample PTO requests data
  const sampleRequests: PTORequest[] = [
    {
      id: 1,
      employeeId: 1,
      employeeName: "John Doe",
      startDate: "2024-02-15",
      endDate: "2024-02-16",
      type: "PTO",
      hours: 16,
      status: "pending",
      createdAt: "2024-02-01",
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: "Jane Smith",
      startDate: "2024-02-20",
      endDate: "2024-02-20",
      type: "Sick",
      hours: 8,
      status: "pending",
      createdAt: "2024-02-02",
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: "Bob Johnson",
      startDate: "2024-03-01",
      endDate: "2024-03-05",
      type: "PTO",
      hours: 40,
      status: "approved",
      createdAt: "2024-02-01",
    },
  ];

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

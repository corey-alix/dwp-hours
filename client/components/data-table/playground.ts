import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { DataTable } from "./index.js";
import { seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting Data Table playground test...");

  const dataTable = querySingle("data-table") as DataTable;

  // Sample table data from seedEmployees
  const sampleData = seedEmployees.map((emp, index) => ({
    id: index + 1,
    name: emp.name,
    department: "Engineering", // Mock department
    hireDate: emp.hire_date,
  }));

  // Table columns configuration
  const columns = [
    { key: "id", label: "ID", width: "60px" },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "hireDate", label: "Hire Date", sortable: true },
  ];

  // Set initial data and columns
  dataTable.data = sampleData;
  dataTable.columns = columns;
  dataTable.pageSize = 5;

  // Test event listeners
  addEventListener(dataTable, "sort-change", (e: CustomEvent) => {
    console.log("Sort changed:", e.detail);
    querySingle("#test-output").textContent =
      `Sorted by ${e.detail.sortKey} (${e.detail.sortDirection})`;
  });

  addEventListener(dataTable, "page-change", (e: CustomEvent) => {
    console.log("Page changed:", e.detail);
    querySingle("#test-output").textContent =
      `Page changed to ${e.detail.page}`;
  });

  addEventListener(dataTable, "page-size-change", (e: CustomEvent) => {
    console.log("Page size changed:", e.detail);
    querySingle("#test-output").textContent =
      `Page size changed to ${e.detail.pageSize}`;
  });

  // Test data updates
  setTimeout(() => {
    console.log("Testing data update...");
    const updatedData = [
      ...sampleData,
      {
        id: 9,
        name: "George Lucas",
        department: "Engineering",
        hireDate: "2016-12-01",
      },
    ];
    dataTable.data = updatedData;
    querySingle("#test-output").textContent =
      "Added new employee: George Lucas";
  }, 3000);

  console.log("Data Table playground test initialized");
}

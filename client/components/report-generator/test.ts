import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { ReportGenerator } from "./index.js";
import { seedEmployees, seedPTOEntries } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting Report Generator playground test...");

  const reportGenerator = querySingle<ReportGenerator>("report-generator");

  // Sample report data computed from seedData
  const sampleReportData = seedEmployees.map((emp, index) => {
    const employeeId = index + 1;
    const approvedEntries = seedPTOEntries.filter(
      (e) =>
        e.employee_id === employeeId &&
        e.approved_by !== null &&
        e.type === "PTO",
    );
    const usedPto = approvedEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalPto = 96 + emp.carryover_hours; // annual + carryover
    const remainingPto = totalPto - usedPto;

    return {
      employeeId,
      employeeName: emp.name,
      totalPTOHours: totalPto,
      usedPTOHours: usedPto,
      remainingPTOHours: remainingPto,
      carryoverHours: emp.carryover_hours,
    };
  });

  // Set initial data
  reportGenerator.reportData = sampleReportData;
  reportGenerator.reportType = "summary";

  // Test event listeners
  addEventListener(reportGenerator, "report-type-change", (e: CustomEvent) => {
    console.log("Report type changed:", e.detail);
    querySingle("#test-output").textContent =
      `Report type changed to ${e.detail.reportType}`;
  });

  addEventListener(reportGenerator, "date-range-change", (e: CustomEvent) => {
    console.log("Date range changed:", e.detail);
    querySingle("#test-output").textContent =
      `Date range: ${e.detail.dateRange.start} to ${e.detail.dateRange.end}`;
  });

  addEventListener(reportGenerator, "generate-report", (e: CustomEvent) => {
    console.log("Generate report requested:", e.detail);
    querySingle("#test-output").textContent =
      `Generating ${e.detail.reportType} report`;
  });

  addEventListener(reportGenerator, "report-exported", (e: CustomEvent) => {
    console.log("Report exported:", e.detail);
    querySingle("#test-output").textContent =
      `Report exported as ${e.detail.format}`;
  });

  console.log("Report Generator playground test initialized");
}

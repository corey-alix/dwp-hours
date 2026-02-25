import { describe, it, expect } from "vitest";
import { generateHtmlReport } from "../server/reportGenerators/htmlReport.js";
import type { ReportData } from "../server/reportService.js";

function makeReportData(overrides?: Partial<ReportData>): ReportData {
  return {
    year: 2025,
    generatedAt: "2025-12-31T00:00:00.000Z",
    employees: [
      {
        id: 1,
        name: "Alice Smith",
        identifier: "alice@example.com",
        hireDate: "2023-02-13",
        ptoRate: 0.71,
        carryoverHours: 16,
        ptoEntries: [
          { date: "2025-01-15", hours: 8, type: "PTO", approvedBy: "Admin" },
          { date: "2025-03-05", hours: 8, type: "Sick", approvedBy: "Admin" },
          {
            date: "2025-06-11",
            hours: 4,
            type: "PTO",
            approvedBy: null,
          },
        ],
        monthlyHours: [
          { month: "2025-01", hoursWorked: 160 },
          { month: "2025-02", hoursWorked: 152 },
        ],
        acknowledgements: [
          {
            month: "2025-01",
            acknowledgedAt: "2025-02-01T00:00:00Z",
          },
        ],
        adminAcknowledgements: [
          {
            month: "2025-01",
            adminName: "Mandi",
            acknowledgedAt: "2025-02-02T00:00:00Z",
          },
        ],
        ptoCalculation: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthName: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ][i],
          workDays: 22,
          dailyRate: 0.71,
          accruedHours: 15.62,
          carryover: i === 0 ? 16 : 15.62,
          subtotal: i === 0 ? 31.62 : 31.24,
          usedHours: i === 0 ? 8 : 0,
          remainingBalance: i === 0 ? 23.62 : 31.24,
        })),
      },
      {
        id: 2,
        name: "Bob Jones",
        identifier: "bob@example.com",
        hireDate: "2024-06-15",
        ptoRate: 0.65,
        carryoverHours: 0,
        ptoEntries: [],
        monthlyHours: [],
        acknowledgements: [],
        adminAcknowledgements: [],
        ptoCalculation: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthName: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ][i],
          workDays: 22,
          dailyRate: 0.65,
          accruedHours: 14.3,
          carryover: 0,
          subtotal: 14.3,
          usedHours: 0,
          remainingBalance: 14.3,
        })),
      },
    ],
    ...overrides,
  };
}

describe("HTML Report Generator", () => {
  it("should produce a valid HTML document", () => {
    const data = makeReportData();
    const html = generateHtmlReport(data);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("<head>");
    expect(html).toContain("</head>");
    expect(html).toContain("<body>");
    expect(html).toContain("</body>");
  });

  it("should include the report title with the year", () => {
    const html = generateHtmlReport(makeReportData({ year: 2026 }));
    expect(html).toContain("PTO Report");
    expect(html).toContain("2026");
  });

  it("should embed all employee data as JSON in a script tag", () => {
    const data = makeReportData();
    const html = generateHtmlReport(data);

    // The JSON payload should contain employee names
    expect(html).toContain("Alice Smith");
    expect(html).toContain("Bob Jones");
    // Should be inside a script tag
    expect(html).toContain("<script>");
    expect(html).toContain("REPORT_DATA");
  });

  it("should render the employee selector dropdown", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain('id="employee-select"');
    expect(html).toContain("<select");
  });

  it("should include PTO type color mappings", () => {
    const html = generateHtmlReport(makeReportData());
    // Legend colors embedded in JS
    expect(html).toContain("#00B050"); // Sick = green
    expect(html).toContain("#FFFF00"); // PTO = yellow
    expect(html).toContain("#BFBFBF"); // Bereavement = gray
    expect(html).toContain("#FF0000"); // Jury Duty = red
  });

  it("should include month names", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("January");
    expect(html).toContain("December");
  });

  it("should include the print button", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("Print");
    expect(html).toContain("window.print()");
  });

  it("should include print-friendly CSS media query", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("@media print");
  });

  it("should include prefers-reduced-motion media query", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("prefers-reduced-motion");
  });

  it("should render PTO calculation section", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("PTO Calculation Section");
    expect(html).toContain("Work Days");
    expect(html).toContain("Daily Rate");
    expect(html).toContain("Accrued");
    expect(html).toContain("Carryover");
    expect(html).toContain("Remaining");
  });

  it("should render acknowledgement section", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("Acknowledgements");
    expect(html).toContain("Employee Ack");
    expect(html).toContain("Admin Ack");
  });

  it("should handle empty employee list gracefully", () => {
    const data = makeReportData({ employees: [] });
    const html = generateHtmlReport(data);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("No employee data found");
  });

  it("should include hire date in employee data", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("2023-02-13"); // Alice's hire date
    expect(html).toContain("Hire Date");
  });

  it("should include legend section with all PTO types", () => {
    const html = generateHtmlReport(makeReportData());
    expect(html).toContain("Legend");
    expect(html).toContain("Sick");
    expect(html).toContain("PTO");
    expect(html).toContain("Bereavement");
    expect(html).toContain("Jury Duty");
  });

  it("should be fully self-contained (no external references)", () => {
    const html = generateHtmlReport(makeReportData());

    // Should not reference external stylesheets or scripts
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="http/);
    expect(html).not.toMatch(/<script[^>]+src="http/);
    // CSS should be inline in a style tag
    expect(html).toContain("<style>");
  });
});

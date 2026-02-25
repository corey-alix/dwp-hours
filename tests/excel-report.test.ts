import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { generateExcelReport } from "../server/reportGenerators/excelReport.js";
import type { ReportData } from "../server/reportService.js";

/** Load a generated buffer into an ExcelJS workbook (handles Node Buffer type quirks) */
async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return workbook;
}

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

describe("Excel Report Generator", () => {
  it("should produce a valid Buffer with non-zero length", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should create one worksheet per employee", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    expect(workbook.worksheets.length).toBe(2);
  });

  it("should name worksheets after employees", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const names = workbook.worksheets.map((ws) => ws.name);
    expect(names).toContain("Alice Smith");
    expect(names).toContain("Bob Jones");
  });

  it("should truncate long employee names to 31 characters", async () => {
    const data = makeReportData({
      employees: [
        {
          ...makeReportData().employees[0],
          name: "A Very Long Employee Name That Exceeds Limit",
        },
      ],
    });
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    expect(workbook.worksheets[0].name.length).toBeLessThanOrEqual(31);
  });

  it("should write employee name in cell B1", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    expect(ws.getCell("B1").value).toBe("Alice Smith");
  });

  it("should write hire date in cell R2", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    const value = ws.getCell("R2").value as string;
    expect(value).toContain("Hire Date");
    expect(value).toContain("2023-02-13");
  });

  it("should write month names in calendar headers", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // January should be in row 4 (first row-group header)
    // Find "January" in row 4
    let foundJanuary = false;
    ws.getRow(4).eachCell((cell) => {
      if (cell.value === "January") foundJanuary = true;
    });
    expect(foundJanuary).toBe(true);
  });

  it("should have calendar date cells with day numbers", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // Look for day 1 and day 15 somewhere in the calendar area (rows 4-38)
    let foundDay1 = false;
    let foundDay15 = false;
    for (let r = 4; r <= 38; r++) {
      ws.getRow(r).eachCell((cell) => {
        if (cell.value === 1) foundDay1 = true;
        if (cell.value === 15) foundDay15 = true;
      });
    }
    expect(foundDay1).toBe(true);
    expect(foundDay15).toBe(true);
  });

  it("should apply PTO fill colors to PTO day cells", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;

    // Find the cell for January 15 (PTO day) and check fill
    let ptoCellFill: ExcelJS.FillPattern | null =
      null as unknown as ExcelJS.FillPattern | null;
    for (let r = 4; r <= 38; r++) {
      ws.getRow(r).eachCell((cell) => {
        if (
          cell.value === 15 &&
          cell.note &&
          typeof cell.note === "string" &&
          cell.note.includes("PTO")
        ) {
          ptoCellFill = cell.fill as ExcelJS.FillPattern;
        }
      });
    }

    expect(ptoCellFill).not.toBeNull();
    expect((ptoCellFill as ExcelJS.FillPattern).fgColor?.argb).toBe("FFFFFF00");
  });

  it("should apply Sick fill color to sick day cells", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;

    // Find the cell for March 5 (Sick day) and check fill
    let sickCellFill: ExcelJS.FillPattern | null =
      null as unknown as ExcelJS.FillPattern | null;
    for (let r = 4; r <= 38; r++) {
      ws.getRow(r).eachCell((cell) => {
        if (
          cell.value === 5 &&
          cell.note &&
          typeof cell.note === "string" &&
          cell.note.includes("Sick")
        ) {
          sickCellFill = cell.fill as ExcelJS.FillPattern;
        }
      });
    }

    expect(sickCellFill).not.toBeNull();
    expect((sickCellFill as ExcelJS.FillPattern).fgColor?.argb).toBe(
      "FF00B050",
    );
  });

  it("should write legend section with correct labels", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // Legend header in column 27 (AA), row 8
    expect(ws.getCell(8, 27).value).toBe("Legend");
    // Legend entries
    expect(ws.getCell(9, 27).value).toBe("Sick");
    expect(ws.getCell(10, 27).value).toBe("Full PTO");
    expect(ws.getCell(11, 27).value).toBe("Partial PTO");
    expect(ws.getCell(12, 27).value).toBe("Planned PTO");
    expect(ws.getCell(13, 27).value).toBe("Bereavement");
    expect(ws.getCell(14, 27).value).toBe("Jury Duty");
  });

  it("should apply correct fill colors to legend entries", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    const sickFill = ws.getCell(9, 27).fill as ExcelJS.FillPattern;
    expect(sickFill.fgColor?.argb).toBe("FF00B050");

    const ptoFill = ws.getCell(10, 27).fill as ExcelJS.FillPattern;
    expect(ptoFill.fgColor?.argb).toBe("FFFFFF00");

    const juryFill = ws.getCell(14, 27).fill as ExcelJS.FillPattern;
    expect(juryFill.fgColor?.argb).toBe("FFFF0000");
  });

  it("should write PTO calculation section header", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    expect(ws.getCell(40, 2).value).toBe("PTO CALCULATION SECTION");
  });

  it("should write PTO calculation data rows with correct values", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // Row 43 = January (first data row)
    expect(ws.getCell(43, 2).value).toBe("January");
    expect(ws.getCell(43, 4).value).toBe(22); // work days
    expect(ws.getCell(43, 6).value).toBe(0.71); // daily rate
    expect(ws.getCell(43, 8).value).toBe(15.62); // accrued
    expect(ws.getCell(43, 11).value).toBe(16); // carryover (January)
    expect(ws.getCell(43, 14).value).toBe(31.62); // subtotal
    expect(ws.getCell(43, 17).value).toBe(8); // used (January)
    expect(ws.getCell(43, 20).value).toBe(23.62); // remaining
  });

  it("should write month names for all 12 months in PTO calculation", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    const months = [
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
    ];
    for (let i = 0; i < 12; i++) {
      expect(ws.getCell(43 + i, 2).value).toBe(months[i]);
    }
  });

  it("should write employee acknowledgements", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // January (row 43) should have acknowledgement
    const janEmpAck = ws.getCell(43, 23).value;
    expect(janEmpAck).toBe("ALICE");
    // February (row 44) should have dash
    expect(ws.getCell(44, 23).value).toBe("—");
  });

  it("should write admin acknowledgements", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // January (row 43) should have "Mandi"
    expect(ws.getCell(43, 24).value).toBe("Mandi");
    // February (row 44) should have dash
    expect(ws.getCell(44, 24).value).toBe("—");
  });

  it("should handle empty employee list with a placeholder sheet", async () => {
    const data = makeReportData({ employees: [] });
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    expect(workbook.worksheets.length).toBe(1);
    expect(workbook.worksheets[0].name).toBe("No Data");
    const value = workbook.worksheets[0].getCell("A1").value as string;
    expect(value).toContain("No employee data");
  });

  it("should produce a buffer that round-trips through ExcelJS", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    // Round-trip: load the buffer back
    const workbook = await loadWorkbook(buffer);

    // Write it back out
    const buffer2 = await workbook.xlsx.writeBuffer();
    expect(buffer2.byteLength).toBeGreaterThan(0);

    // Load the re-written buffer
    const workbook2 = await loadWorkbook(Buffer.from(buffer2));
    expect(workbook2.worksheets.length).toBe(2);
  });

  it("should hide grid lines on worksheets", async () => {
    const data = makeReportData();
    const buffer = await generateExcelReport(data);

    const workbook = await loadWorkbook(buffer);

    const ws = workbook.getWorksheet("Alice Smith")!;
    // Check the views property for showGridLines
    const views = ws.views;
    expect(views.length).toBeGreaterThan(0);
    expect(views[0].showGridLines).toBe(false);
  });
});

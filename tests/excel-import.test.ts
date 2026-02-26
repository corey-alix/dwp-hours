import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { existsSync } from "node:fs";
import {
  parseLegend,
  findLegendHeaderRow,
  findPtoCalcStartRow,
  isEmployeeSheet,
  parseCalendarGrid,
  parsePtoCalcUsedHours,
  parseCarryoverHours,
  adjustPartialDays,
  parseEmployeeInfo,
  generateIdentifier,
  parseAcknowledgements,
  parseEmployeeSheet,
  computePtoRate,
  resolveColorToARGB,
  parseThemeColors,
  colorDistance,
  findClosestLegendColor,
  extractCellNoteText,
  parseHoursFromNote,
  reconcilePartialPto,
} from "../server/reportGenerators/excelImport.js";
import { generateExcelReport } from "../server/reportGenerators/excelReport.js";
import { smartParseDate } from "../shared/dateUtils.js";
import type { ReportData } from "../server/reportService.js";

/** Load a generated buffer into an ExcelJS workbook */
async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return workbook;
}

// ── Test Data ──

function makeReportData(overrides?: Partial<ReportData>): ReportData {
  return {
    year: 2026,
    generatedAt: "2026-02-25T00:00:00.000Z",
    employees: [
      {
        id: 1,
        name: "Alice Smith",
        identifier: "asmith@example.com",
        hireDate: "2023-02-13",
        ptoRate: 0.71,
        carryoverHours: 16,
        ptoEntries: [
          { date: "2026-01-15", hours: 8, type: "PTO", approvedBy: "Admin" },
          { date: "2026-01-16", hours: 8, type: "PTO", approvedBy: "Admin" },
          { date: "2026-03-05", hours: 8, type: "Sick", approvedBy: "Admin" },
          { date: "2026-06-11", hours: 4, type: "PTO", approvedBy: null },
          {
            date: "2026-07-20",
            hours: 3,
            type: "Bereavement",
            approvedBy: "Admin",
          },
        ],
        monthlyHours: [
          { month: "2026-01", hoursWorked: 160 },
          { month: "2026-02", hoursWorked: 152 },
        ],
        acknowledgements: [
          { month: "2026-01", acknowledgedAt: "2026-02-01T00:00:00Z" },
        ],
        adminAcknowledgements: [
          {
            month: "2026-01",
            adminName: "Mandi",
            acknowledgedAt: "2026-02-02T00:00:00Z",
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
          usedHours: i === 0 ? 16 : i === 2 ? 8 : i === 5 ? 4 : i === 6 ? 3 : 0,
          remainingBalance: i === 0 ? 15.62 : 31.24,
        })),
      },
    ],
    ...overrides,
  };
}

/** Generate an Excel workbook buffer from test data */
async function generateTestBuffer(
  overrides?: Partial<ReportData>,
): Promise<Buffer> {
  const data = makeReportData(overrides);
  return generateExcelReport(data);
}

// ── Tests ──

describe("Excel Import", () => {
  describe("parseLegend", () => {
    it("should parse legend entries from an exported workbook", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      // First sheet is Cover Sheet, second is Alice Smith
      const ws = wb.getWorksheet("Alice Smith")!;
      expect(ws).toBeDefined();

      const legend = parseLegend(ws);
      expect(legend.size).toBeGreaterThan(0);

      // Check that known colors map to expected PTO types
      expect(legend.get("FF00B050")).toBe("Sick"); // green
      expect(legend.get("FFFFFF00")).toBe("PTO"); // yellow (Full PTO)
      expect(legend.get("FFBFBFBF")).toBe("Bereavement"); // gray
      expect(legend.get("FFFF0000")).toBe("Jury Duty"); // red
    });
  });

  describe("parseCalendarGrid", () => {
    it("should find PTO entries from colored calendar cells", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;
      const legend = parseLegend(ws);

      const { entries } = parseCalendarGrid(ws, 2026, legend);
      expect(entries.length).toBeGreaterThan(0);

      // Should find PTO on Jan 15
      const jan15 = entries.find((e) => e.date === "2026-01-15");
      expect(jan15).toBeDefined();
      expect(jan15!.type).toBe("PTO");

      // Should find Sick on Mar 5
      const mar5 = entries.find((e) => e.date === "2026-03-05");
      expect(mar5).toBeDefined();
      expect(mar5!.type).toBe("Sick");
    });

    it("should read hours from cell notes for partial days", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;
      const legend = parseLegend(ws);

      const { entries } = parseCalendarGrid(ws, 2026, legend);

      // June 11 was 4 hours in the export
      const jun11 = entries.find((e) => e.date === "2026-06-11");
      expect(jun11).toBeDefined();
      expect(jun11!.hours).toBe(4);

      // July 20 was 3 hours (Bereavement)
      const jul20 = entries.find((e) => e.date === "2026-07-20");
      expect(jul20).toBeDefined();
      expect(jul20!.hours).toBe(3);
    });
  });

  describe("parsePtoCalcUsedHours", () => {
    it("should read monthly used hours from PTO calculation section", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const rows = parsePtoCalcUsedHours(ws);
      expect(rows.length).toBe(12);

      // January: 16 hours used (2 full days PTO)
      expect(rows[0].month).toBe(1);
      expect(rows[0].usedHours).toBe(16);

      // March: 8 hours used (1 Sick day)
      expect(rows[2].month).toBe(3);
      expect(rows[2].usedHours).toBe(8);

      // June: 4 hours used
      expect(rows[5].month).toBe(6);
      expect(rows[5].usedHours).toBe(4);
    });
  });

  describe("parseCarryoverHours", () => {
    it("should read carryover from PTO calc start row, column L", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const carryover = parseCarryoverHours(ws);
      expect(carryover).toBe(16);
    });
  });

  describe("adjustPartialDays", () => {
    it("should reduce last entry when calendar total exceeds declared total", () => {
      const entries = [
        { date: "2026-01-10", type: "PTO" as const, hours: 8 },
        { date: "2026-01-11", type: "PTO" as const, hours: 8 },
        { date: "2026-01-12", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalc = [
        { month: 1, usedHours: 20 }, // 24 in calendar, only 20 declared → last day = 4h
        ...Array.from({ length: 11 }, (_, i) => ({
          month: i + 2,
          usedHours: 0,
        })),
      ];

      const adjusted = adjustPartialDays(entries, ptoCalc);
      expect(adjusted[0].hours).toBe(8); // unchanged
      expect(adjusted[1].hours).toBe(8); // unchanged
      expect(adjusted[2].hours).toBe(4); // reduced: 20 - 16 = 4
    });

    it("should not adjust when calendar total matches declared total", () => {
      const entries = [{ date: "2026-02-05", type: "Sick" as const, hours: 8 }];
      const ptoCalc = [
        { month: 1, usedHours: 0 },
        { month: 2, usedHours: 8 },
        ...Array.from({ length: 10 }, (_, i) => ({
          month: i + 3,
          usedHours: 0,
        })),
      ];

      const adjusted = adjustPartialDays(entries, ptoCalc);
      expect(adjusted[0].hours).toBe(8);
    });

    it("should handle non-standard partial hours (not multiple of 4)", () => {
      const entries = [
        { date: "2026-03-01", type: "PTO" as const, hours: 8 },
        { date: "2026-03-02", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalc = [
        { month: 1, usedHours: 0 },
        { month: 2, usedHours: 0 },
        { month: 3, usedHours: 13 }, // 16 in calendar, 13 declared → last = 5h
        ...Array.from({ length: 9 }, (_, i) => ({
          month: i + 4,
          usedHours: 0,
        })),
      ];

      const adjusted = adjustPartialDays(entries, ptoCalc);
      expect(adjusted[1].hours).toBe(5);
    });
  });

  describe("parseEmployeeInfo", () => {
    it("should extract name, year, hire date, and carryover from exported sheet", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const info = parseEmployeeInfo(ws);
      expect(info.name).toBe("Alice Smith");
      expect(info.year).toBe(2026);
      expect(info.hireDate).toBe("2023-02-13");
      expect(info.carryoverHours).toBe(16);
      expect(info.spreadsheetPtoRate).toBe(0.71);
    });

    it("should parse hire date from rich text cell values (legacy 2018 format)", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      // Overwrite R2 with a rich text value matching the 2018 XLSX format
      const hireDateCell = ws.getCell("R2");
      hireDateCell.value = {
        richText: [
          { font: { bold: true }, text: "HIRE DATE: " },
          { text: "8/19/14" },
        ],
      };

      const info = parseEmployeeInfo(ws);
      expect(info.hireDate).toBe("2014-08-19");
    });
  });

  describe("generateIdentifier", () => {
    it("should generate <firstName>-<lastName>@example.com", () => {
      expect(generateIdentifier("Alice Smith")).toBe("alice-smith@example.com");
      expect(generateIdentifier("Bob Jones")).toBe("bob-jones@example.com");
      expect(generateIdentifier("Charlie")).toBe("charlie@example.com");
      expect(generateIdentifier("Mary Jane Watson")).toBe(
        "mary-watson@example.com",
      );
    });

    it("should handle edge cases", () => {
      expect(generateIdentifier("  Alice  Smith  ")).toBe(
        "alice-smith@example.com",
      );
      expect(generateIdentifier("")).toBe("unknown@example.com");
    });

    it("should produce distinct identifiers for same-last-name employees", () => {
      expect(generateIdentifier("Dan Allen")).toBe("dan-allen@example.com");
      expect(generateIdentifier("Deanna Allen")).toBe(
        "deanna-allen@example.com",
      );
      expect(generateIdentifier("Dan Allen")).not.toBe(
        generateIdentifier("Deanna Allen"),
      );
    });
  });

  describe("parseAcknowledgements", () => {
    it("should detect employee and admin acknowledgement marks", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const acks = parseAcknowledgements(ws, 2026);

      const empAck = acks.find(
        (a) => a.month === "2026-01" && a.type === "employee",
      );
      expect(empAck).toBeDefined();

      const admAck = acks.find(
        (a) => a.month === "2026-01" && a.type === "admin",
      );
      expect(admAck).toBeDefined();

      // No ack for February
      const febEmp = acks.find(
        (a) => a.month === "2026-02" && a.type === "employee",
      );
      expect(febEmp).toBeUndefined();
    });
  });

  describe("parseEmployeeSheet (orchestrated parse)", () => {
    it("should parse all data from an exported employee worksheet", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const result = parseEmployeeSheet(ws);

      expect(result.employee.name).toBe("Alice Smith");
      expect(result.employee.year).toBe(2026);
      expect(result.ptoEntries.length).toBeGreaterThan(0);
      expect(result.acknowledgements.length).toBeGreaterThan(0);

      // Verify PTO entries found for Jan 15
      const jan15 = result.ptoEntries.find((e) => e.date === "2026-01-15");
      expect(jan15).toBeDefined();
      expect(jan15!.type).toBe("PTO");
    });
  });

  describe("Cover Sheet skipping", () => {
    it("should not be detected as an employee sheet", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const coverSheet = wb.getWorksheet("Cover Sheet");
      expect(coverSheet).toBeDefined();

      // Cover Sheet has no "Hire Date" in header, so isEmployeeSheet returns false
      expect(isEmployeeSheet(coverSheet!)).toBe(false);
    });

    it("should throw when parsing legend from Cover Sheet (no Legend header)", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const coverSheet = wb.getWorksheet("Cover Sheet")!;

      expect(() => parseLegend(coverSheet)).toThrow(/Legend header not found/);
    });
  });

  describe("Export superscript decoration", () => {
    it("should add \u00bd for 4-hour partial days", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      // June 11, 2026 is a Thursday (dow=4)
      // Month 6 = June → colGroup=1 (May-Aug), rowGroup=1
      // startCol=10, headerRow=13, dateStartRow=15
      // June 1, 2026 is Monday (dow=1), so day 11 = dow=(1+11-1)%7=4 (Thu)
      // row = 15 + floor((11-1+1)/7) based on calendar position
      // Day 1 starts at col=10+1=11, row=15
      // Day 7 (Sun next week) is col=10, row=16
      // Day 11 (Thu) is at row=16, col=14
      // Let's just search for the cell value containing "½"
      let found = false;
      for (let r = 15; r <= 20; r++) {
        for (let c = 10; c <= 16; c++) {
          const cell = ws.getCell(r, c);
          const val = cell.value?.toString() || "";
          if (val.includes("\u00BD") && val.includes("11")) {
            found = true;
          }
        }
      }
      expect(found).toBe(true);
    });

    it("should add superscript digit for non-4h partial days", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      // July 20, 2026 is 3 hours → should have superscript ³ (\u00B3)
      // Month 7 = July → colGroup=1 (May-Aug), rowGroup=2
      // startCol=10, headerRow=22, dateStartRow=24
      let found = false;
      for (let r = 24; r <= 29; r++) {
        for (let c = 10; c <= 16; c++) {
          const cell = ws.getCell(r, c);
          const val = cell.value?.toString() || "";
          if (val.includes("\u00B3") && val.includes("20")) {
            found = true;
          }
        }
      }
      expect(found).toBe(true);
    });
  });

  describe("Round-trip: export → import", () => {
    it("should recover PTO entries through export → import cycle", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const result = parseEmployeeSheet(ws);

      // Original had 5 PTO entries
      // Jan 15 (8h PTO), Jan 16 (8h PTO), Mar 5 (8h Sick), Jun 11 (4h PTO), Jul 20 (3h Bereavement)
      expect(result.ptoEntries.length).toBe(5);

      // Verify types are correct
      const ptoEntries = result.ptoEntries.filter((e) => e.type === "PTO");
      const sickEntries = result.ptoEntries.filter((e) => e.type === "Sick");
      const bereavementEntries = result.ptoEntries.filter(
        (e) => e.type === "Bereavement",
      );

      expect(ptoEntries.length).toBe(3); // Jan 15, Jan 16, Jun 11
      expect(sickEntries.length).toBe(1); // Mar 5
      expect(bereavementEntries.length).toBe(1); // Jul 20

      // Verify partial-day hours are recovered
      const jun11 = result.ptoEntries.find((e) => e.date === "2026-06-11");
      expect(jun11!.hours).toBe(4);

      const jul20 = result.ptoEntries.find((e) => e.date === "2026-07-20");
      expect(jul20!.hours).toBe(3);
    });

    it("should recover carryover hours from PTO calc section", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const info = parseEmployeeInfo(ws);
      expect(info.carryoverHours).toBe(16);
    });
  });

  describe("findLegendHeaderRow", () => {
    it("should find the Legend header row in exported workbook", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const row = findLegendHeaderRow(ws);
      expect(row).toBe(8); // Our export puts legend header at row 8
    });

    it("should return -1 when no Legend header exists", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Cover Sheet")!;

      const row = findLegendHeaderRow(ws);
      expect(row).toBe(-1);
    });
  });

  describe("findPtoCalcStartRow", () => {
    it("should find PTO calc start row in exported workbook", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      const row = findPtoCalcStartRow(ws);
      expect(row).toBe(43); // Our export writes PTO calc data at row 43
    });

    it("should throw when PTO calc section not found", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Cover Sheet")!;

      expect(() => findPtoCalcStartRow(ws)).toThrow(
        /PTO Calc validation failed/,
      );
    });
  });

  describe("isEmployeeSheet", () => {
    it("should return true for employee sheets with Hire Date", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      expect(isEmployeeSheet(ws)).toBe(true);
    });

    it("should return true when Hire Date cell uses rich text (legacy 2018 format)", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Alice Smith")!;

      // Overwrite R2 with a rich text value matching the 2018 XLSX format
      ws.getCell("R2").value = {
        richText: [
          { font: { bold: true }, text: "HIRE DATE: " },
          { text: "8/19/14" },
        ],
      };

      expect(isEmployeeSheet(ws)).toBe(true);
    });

    it("should return false for Cover Sheet", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.getWorksheet("Cover Sheet")!;

      expect(isEmployeeSheet(ws)).toBe(false);
    });
  });

  describe("computePtoRate", () => {
    it("should return correct rate for long-tenured employee", () => {
      // Hired 2001, year 2018 → 17 years → max tier 0.92
      const result = computePtoRate({
        name: "Test",
        hireDate: "2001-08-05",
        year: 2018,
        carryoverHours: 0,
        spreadsheetPtoRate: 0.65,
      });
      expect(result.rate).toBe(0.92);
      expect(result.warning).toContain("mismatch");
      expect(result.warning).toContain("spreadsheet=0.65");
      expect(result.warning).toContain("computed=0.92");
    });

    it("should return no warning when rates match", () => {
      // Hired 2023-02-13, year 2026 → 3 July bumps (2024, 2025, 2026) → tier 3 (0.74)
      const result = computePtoRate({
        name: "Alice Smith",
        hireDate: "2023-02-13",
        year: 2026,
        carryoverHours: 0,
        spreadsheetPtoRate: 0.74,
      });
      expect(result.rate).toBe(0.74);
      expect(result.warning).toBeNull();
    });

    it("should fall back to spreadsheet rate when hire date is missing", () => {
      const result = computePtoRate({
        name: "No Date",
        hireDate: "",
        year: 2026,
        carryoverHours: 0,
        spreadsheetPtoRate: 0.83,
      });
      expect(result.rate).toBe(0.83);
      expect(result.warning).toBeNull();
    });

    it("should fall back to default rate when both are missing", () => {
      const result = computePtoRate({
        name: "Unknown",
        hireDate: "",
        year: 0,
        carryoverHours: 0,
        spreadsheetPtoRate: 0,
      });
      expect(result.rate).toBe(0.65); // PTO_EARNING_SCHEDULE[0].dailyRate
      expect(result.warning).toBeNull();
    });
  });

  describe("smartParseDate", () => {
    it("should parse YYYY-MM-DD format", () => {
      expect(smartParseDate("2023-02-13")).toBe("2023-02-13");
    });

    it("should parse M/D/YY with 2-digit year < 50 → 2000s", () => {
      expect(smartParseDate("2/13/23")).toBe("2023-02-13");
      expect(smartParseDate("1/5/09")).toBe("2009-01-05");
    });

    it("should parse M/D/YY with 2-digit year >= 50 → 1900s", () => {
      expect(smartParseDate("6/15/95")).toBe("1995-06-15");
      expect(smartParseDate("12/1/50")).toBe("1950-12-01");
    });

    it("should parse M/D/YYYY with 4-digit year", () => {
      expect(smartParseDate("2/13/2023")).toBe("2023-02-13");
      expect(smartParseDate("12/25/1999")).toBe("1999-12-25");
    });

    it("should return null for invalid input", () => {
      expect(smartParseDate("")).toBeNull();
      expect(smartParseDate("not-a-date")).toBeNull();
      expect(smartParseDate("13/32/2023")).toBeNull(); // invalid month
    });
  });

  // ── Phase 5: Theme Color & Reconciliation Helpers ──

  describe("resolveColorToARGB", () => {
    it("should return ARGB from explicit argb property", () => {
      const result = resolveColorToARGB({ argb: "FFFFC000" } as any, new Map());
      expect(result).toBe("FFFFC000");
    });

    it("should resolve theme-indexed color", () => {
      const themeColors = new Map([[9, "FFF79646"]]);
      const result = resolveColorToARGB({ theme: 9 } as any, themeColors);
      expect(result).toBe("FFF79646");
    });

    it("should return undefined for no color info", () => {
      expect(resolveColorToARGB(undefined, new Map())).toBeUndefined();
      expect(resolveColorToARGB({} as any, new Map())).toBeUndefined();
    });
  });

  describe("colorDistance", () => {
    it("should return 0 for identical colors", () => {
      expect(colorDistance("FFFFC000", "FFFFC000")).toBe(0);
    });

    it("should measure Euclidean RGB distance", () => {
      // FFF79646 → R=F7, G=96, B=46 → (247, 150, 70)
      // FFFFC000 → R=FF, G=C0, B=00 → (255, 192, 0)
      const dist = colorDistance("FFF79646", "FFFFC000");
      expect(dist).toBeGreaterThan(50);
      expect(dist).toBeLessThan(100); // within threshold
    });
  });

  describe("findClosestLegendColor", () => {
    it("should find approximate match within threshold", () => {
      const legend = new Map([["FFFFC000", "PTO" as const]]);
      // FFF79646 is close to FFC000
      const result = findClosestLegendColor("FFF79646", legend);
      expect(result).toBe("PTO");
    });

    it("should reject low-chroma (gray/white) colors", () => {
      const legend = new Map([["FFBFBFBF", "Bereavement" as const]]);
      // FFF0F0F0 is a light gray — should NOT match via approximate
      const result = findClosestLegendColor("FFF0F0F0", legend);
      expect(result).toBeUndefined();
    });

    it("should return undefined when no color is close enough", () => {
      const legend = new Map([["FFFF0000", "Jury Duty" as const]]);
      // Pure green is far from pure red
      const result = findClosestLegendColor("FF00FF00", legend);
      expect(result).toBeUndefined();
    });
  });

  describe("extractCellNoteText", () => {
    it("should extract text from a string note", () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Test");
      const cell = ws.getCell("A1");
      cell.note = "0.5 hrs";
      expect(extractCellNoteText(cell)).toBe("0.5 hrs");
    });

    it("should extract text from rich-text note", () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Test");
      const cell = ws.getCell("A1");
      cell.note = {
        texts: [
          { font: { bold: true, name: "Calibri", size: 9 }, text: "Author:\n" },
          { font: { name: "Calibri", size: 9 }, text: ".5 hrs" },
        ],
      } as any;
      expect(extractCellNoteText(cell)).toContain(".5 hrs");
    });

    it("should return empty string when no note", () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Test");
      const cell = ws.getCell("A1");
      expect(extractCellNoteText(cell)).toBe("");
    });
  });

  describe("parseHoursFromNote", () => {
    it("should parse decimal hours", () => {
      expect(parseHoursFromNote(".5 hrs")).toBe(0.5);
      expect(parseHoursFromNote("0.5 hrs")).toBe(0.5);
      expect(parseHoursFromNote("4 hours")).toBe(4);
      expect(parseHoursFromNote("2.5 hr")).toBe(2.5);
    });

    it("should return undefined for non-hour notes", () => {
      expect(parseHoursFromNote("some other text")).toBeUndefined();
      expect(parseHoursFromNote("")).toBeUndefined();
    });
  });

  describe("reconcilePartialPto", () => {
    it("should add missing partial PTO from noted cells when gap exists", () => {
      // Calendar detected 16h for January, but PTO calc says 16.5h
      const entries = [
        { date: "2026-01-15", type: "PTO" as const, hours: 8 },
        { date: "2026-01-16", type: "PTO" as const, hours: 8 },
      ];
      const unmatchedNotedCells = [{ date: "2026-01-17", note: ".5 hrs" }];
      const ptoCalcRows = [
        { month: 1, usedHours: 16.5 },
        ...Array.from({ length: 11 }, (_, i) => ({
          month: i + 2,
          usedHours: 0,
        })),
      ];

      const result = reconcilePartialPto(
        entries,
        unmatchedNotedCells,
        ptoCalcRows,
        "Test",
      );
      expect(result.entries.length).toBe(3);

      const jan17 = result.entries.find((e) => e.date === "2026-01-17");
      expect(jan17).toBeDefined();
      expect(jan17!.hours).toBe(0.5);
      expect(jan17!.type).toBe("PTO");
      expect(jan17!.notes).toContain("Reconciled");
    });

    it("should not add entries when totals match", () => {
      const entries = [{ date: "2026-01-15", type: "PTO" as const, hours: 8 }];
      const unmatchedNotedCells = [{ date: "2026-01-17", note: ".5 hrs" }];
      const ptoCalcRows = [
        { month: 1, usedHours: 8 },
        ...Array.from({ length: 11 }, (_, i) => ({
          month: i + 2,
          usedHours: 0,
        })),
      ];

      const result = reconcilePartialPto(
        entries,
        unmatchedNotedCells,
        ptoCalcRows,
        "Test",
      );
      expect(result.entries.length).toBe(1); // no reconciliation needed
    });
  });

  // ── Legacy 2018 Workbook Integration ──

  const LEGACY_2018_PATH =
    "/home/ca0v/code/corey-alix/dwp-hours/reports/2018.xlsx";

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - A Bylenga",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      // Load the workbook once for all tests in this block
      it("should load worksheet and extract theme colors", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("A Bylenga");
        expect(sheet).toBeDefined();
        ws = sheet!;

        // Try to extract theme XML from workbook internals
        const wbAny = wb as any;
        const themeXml: string | undefined =
          wbAny._themes?.theme1 ?? wbAny.themes?.theme1;
        if (themeXml) {
          themeColors = parseThemeColors(themeXml);
          expect(themeColors.size).toBeGreaterThanOrEqual(10);
        } else {
          // Fall back to default Office theme
          themeColors = new Map([
            [0, "FFFFFFFF"],
            [1, "FF000000"],
            [2, "FFEEECE1"],
            [3, "FF1F497D"],
            [4, "FF4F81BD"],
            [5, "FFC0504D"],
            [6, "FF9BBB59"],
            [7, "FF8064A2"],
            [8, "FF4BACC6"],
            [9, "FFF79646"],
            [10, "FF0000FF"],
            [11, "FF800080"],
          ]);
        }
      });

      it("should detect cell E8 as theme-indexed orange with a .5h note", () => {
        const cell = ws.getCell("E8");
        const fill = cell.fill as ExcelJS.FillPattern | undefined;
        expect(fill?.type).toBe("pattern");

        // The cell uses theme color index 9 (accent6) instead of explicit ARGB
        const fgColor = fill?.fgColor as any;
        expect(fgColor?.theme).toBe(9);

        // It has a ".5 hrs" note
        const noteText = extractCellNoteText(cell);
        expect(noteText).toContain(".5");
      });

      it("should resolve theme 9 color and approximately match Partial PTO", () => {
        const resolved = resolveColorToARGB({ theme: 9 } as any, themeColors);
        expect(resolved).toBeDefined();

        // Parse legend with theme-awareness
        const legend = parseLegend(ws, themeColors);
        expect(legend.size).toBeGreaterThan(0);

        // The resolved color should match (exactly or approximately) to PTO
        const exactMatch = legend.get(resolved!);
        const approxMatch = findClosestLegendColor(resolved!, legend);
        expect(exactMatch ?? approxMatch).toBe("PTO");
      });

      it("should include Jan 17 partial PTO (0.5h) in parsed entries", () => {
        const legend = parseLegend(ws, themeColors);
        const { entries, unmatchedNotedCells } = parseCalendarGrid(
          ws,
          2018,
          legend,
          themeColors,
        );

        // First check if color matching found it directly
        const jan17Direct = entries.find((e) => e.date === "2018-01-17");
        if (jan17Direct) {
          expect(jan17Direct.hours).toBe(0.5);
          expect(jan17Direct.type).toBe("PTO");
        } else {
          // If not matched by color, it should be in unmatched noted cells
          const jan17Unmatched = unmatchedNotedCells.find(
            (c) => c.date === "2018-01-17",
          );
          expect(jan17Unmatched).toBeDefined();
          expect(jan17Unmatched!.note).toContain(".5");
        }
      });

      it("should produce 0.5h PTO for Jan 17 after full pipeline (parseEmployeeSheet)", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // S42 in the spreadsheet = 24.5h for January
        // Without Phase 5, only 24h was detected (3 × 8h full days)
        // The .5h from Jan 17 should now be captured
        const jan17 = result.ptoEntries.find((e) => e.date === "2018-01-17");
        expect(jan17).toBeDefined();
        expect(jan17!.hours).toBe(0.5);
        expect(jan17!.type).toBe("PTO");
      });

      it("should produce correct January total matching S42=24.5h", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const janEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-01-"),
        );
        const janTotal = janEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(janTotal).toBe(24.5);
      });
    },
  );

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - Deanna Allen (row offset anomaly)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load Deanna Allen worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("Deanna Allen");
        expect(sheet).toBeDefined();
        ws = sheet!;

        const wbAny = wb as any;
        const themeXml: string | undefined =
          wbAny._themes?.theme1 ?? wbAny.themes?.theme1;
        if (themeXml) {
          themeColors = parseThemeColors(themeXml);
        } else {
          themeColors = new Map([
            [0, "FFFFFFFF"],
            [1, "FF000000"],
            [2, "FFEEECE1"],
            [3, "FF1F497D"],
            [4, "FF4F81BD"],
            [5, "FFC0504D"],
            [6, "FF9BBB59"],
            [7, "FF8064A2"],
            [8, "FF4BACC6"],
            [9, "FFF79646"],
            [10, "FF0000FF"],
            [11, "FF800080"],
          ]);
        }
      });

      it("should detect July row offset anomaly and recover", () => {
        const legend = parseLegend(ws, themeColors);
        const { warnings } = parseCalendarGrid(ws, 2018, legend, themeColors);

        // Should have a warning about July anomaly
        const julyWarnings = warnings.filter((w) => w.includes("July"));
        expect(julyWarnings.length).toBeGreaterThan(0);

        // Should have a recovery message
        const recoveryMsg = julyWarnings.find((w) =>
          w.includes("Recovered successfully"),
        );
        expect(recoveryMsg).toBeDefined();
      });

      it("should find July PTO entries after row offset recovery", () => {
        const legend = parseLegend(ws, themeColors);
        const { entries } = parseCalendarGrid(ws, 2018, legend, themeColors);

        const julyEntries = entries.filter((e) =>
          e.date.startsWith("2018-07-"),
        );

        // July 4 (orange/Partial PTO), July 25-27 (yellow/Full PTO),
        // July 30-31 (yellow/Full PTO) = 6 colored cells
        expect(julyEntries.length).toBe(6);

        // July 4 should be detected
        const jul4 = julyEntries.find((e) => e.date === "2018-07-04");
        expect(jul4).toBeDefined();
        expect(jul4!.type).toBe("PTO");

        // July 25 should have the "red rocks" note
        const jul25 = julyEntries.find((e) => e.date === "2018-07-25");
        expect(jul25).toBeDefined();
        expect(jul25!.notes).toContain("red rocks");
      });

      it("should produce correct July total via full pipeline", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const julyEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-07-"),
        );
        const julyTotal = julyEntries.reduce((sum, e) => sum + e.hours, 0);

        // S48 declares 44h for July
        // The pipeline should reconcile to match this
        expect(julyTotal).toBe(44);
      });
    },
  );
});

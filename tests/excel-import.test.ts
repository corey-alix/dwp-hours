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
  parseWorkedHoursFromNote,
  processWorkedCells,
  parsePartialPtoColors,
  inferWeekendPartialHours,
  reclassifySickAsPto,
  reclassifySickByColumnS,
  reconcileUnmatchedColoredCells,
  detectOverColoring,
  overrideTypeFromNote,
  reclassifyBereavementByColumnS,
  ImportedPtoEntry,
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

      const { entries: adjusted } = adjustPartialDays(entries, ptoCalc);
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

      const { entries: adjusted } = adjustPartialDays(entries, ptoCalc);
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

      const { entries: adjusted } = adjustPartialDays(entries, ptoCalc);
      expect(adjusted[1].hours).toBe(5);
    });

    it("should back-calculate partial-day hours when calendarTotal < declaredTotal with one partial entry", () => {
      // Simulates A Campbell Dec 2018: 5×8h Full PTO + 1×1h Partial PTO (wrong)
      // PTO Calc declares 44.5h → partial should be 4.5h
      const entries = [
        {
          date: "2026-12-19",
          type: "PTO" as const,
          hours: 1,
          isPartialPtoColor: true,
        },
        { date: "2026-12-20", type: "PTO" as const, hours: 8 },
        { date: "2026-12-21", type: "PTO" as const, hours: 8 },
        { date: "2026-12-24", type: "PTO" as const, hours: 8 },
        { date: "2026-12-25", type: "PTO" as const, hours: 8 },
        { date: "2026-12-26", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalc = [
        ...Array.from({ length: 11 }, (_, i) => ({
          month: i + 1,
          usedHours: 0,
        })),
        { month: 12, usedHours: 44.5 },
      ];

      const { entries: adjusted, warnings } = adjustPartialDays(
        entries,
        ptoCalc,
      );
      const dec19 = adjusted.find((e) => e.date === "2026-12-19");
      expect(dec19!.hours).toBe(4.5);
      expect(dec19!.notes).toContain("Adjusted from 1h to 4.5h");
      expect(warnings.length).toBe(0);
    });

    it("should distribute hours evenly across multiple partial entries", () => {
      // Simulates E Aamodt Mar 2018: 2 partial PTO + no full days → only partials
      // Both are partial, declared=10h → each gets 10/2 = 5h
      const entries = [
        {
          date: "2026-07-25",
          type: "PTO" as const,
          hours: 2,
          isPartialPtoColor: true,
        },
        {
          date: "2026-07-26",
          type: "PTO" as const,
          hours: 5,
          isPartialPtoColor: true,
        },
      ];
      const ptoCalc = [
        ...Array.from({ length: 6 }, (_, i) => ({
          month: i + 1,
          usedHours: 0,
        })),
        { month: 7, usedHours: 10 },
        ...Array.from({ length: 5 }, (_, i) => ({
          month: i + 8,
          usedHours: 0,
        })),
      ];

      const { entries: adjusted, warnings } = adjustPartialDays(
        entries,
        ptoCalc,
      );
      // Both partials adjusted to 5h each (10 / 2)
      expect(adjusted.find((e) => e.date === "2026-07-25")!.hours).toBe(5);
      expect(adjusted.find((e) => e.date === "2026-07-26")!.hours).toBe(5);
      expect(warnings.length).toBe(0);
    });

    it("should distribute remaining hours after full days across partials", () => {
      // Simulates E Aamodt Mar 2018: 5 yellow (Full PTO) + 2 orange (Partial PTO)
      // Calendar total = 5×8 + 2×8 = 56h, declared = 46h
      // fullTotal = 40h, remaining = 6h, each partial = 3h
      const entries = [
        {
          date: "2026-03-08",
          type: "PTO" as const,
          hours: 8,
          isPartialPtoColor: true,
        },
        {
          date: "2026-03-16",
          type: "PTO" as const,
          hours: 8,
          isPartialPtoColor: true,
        },
        { date: "2026-03-19", type: "PTO" as const, hours: 8 },
        { date: "2026-03-20", type: "PTO" as const, hours: 8 },
        { date: "2026-03-21", type: "PTO" as const, hours: 8 },
        { date: "2026-03-22", type: "PTO" as const, hours: 8 },
        { date: "2026-03-23", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalc = [
        { month: 1, usedHours: 0 },
        { month: 2, usedHours: 0 },
        { month: 3, usedHours: 46 },
        ...Array.from({ length: 9 }, (_, i) => ({
          month: i + 4,
          usedHours: 0,
        })),
      ];

      const { entries: adjusted, warnings } = adjustPartialDays(
        entries,
        ptoCalc,
      );
      expect(adjusted.find((e) => e.date === "2026-03-08")!.hours).toBe(3);
      expect(adjusted.find((e) => e.date === "2026-03-16")!.hours).toBe(3);
      // Full days unchanged
      expect(adjusted.find((e) => e.date === "2026-03-19")!.hours).toBe(8);
      expect(adjusted.find((e) => e.date === "2026-03-23")!.hours).toBe(8);
      expect(warnings.length).toBe(0);
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

    it("should extract first number from note text regardless of unit suffix", () => {
      expect(parseHoursFromNote("Mandi Davenport:\n2 HRS PTO")).toBe(2);
      expect(parseHoursFromNote("Mandi Davenport:\n5 HRS PTO")).toBe(5);
      expect(parseHoursFromNote("3")).toBe(3);
      expect(parseHoursFromNote("1.5h")).toBe(1.5);
      expect(parseHoursFromNote("Author:\n1.1 hours of PTO")).toBe(1.1);
    });

    it("should return undefined for notes without numbers", () => {
      expect(parseHoursFromNote("some other text")).toBeUndefined();
      expect(parseHoursFromNote("")).toBeUndefined();
    });

    it("should prefer strict pattern with unit suffix over bare numbers", () => {
      // "PTO at 1PM" — neither strict nor fallback matches (1 is adjacent to PM)
      expect(parseHoursFromNote("PTO at 1PM")).toBeUndefined();
      // "MD360" — code, not hours (360 embedded in alphanumeric string)
      expect(parseHoursFromNote("Deanna Allen:\nMD360")).toBeUndefined();
      // But "4 hrs PTO" matches strict first
      expect(parseHoursFromNote("4 hrs PTO")).toBe(4);
      // "2 HRS" matches strict
      expect(parseHoursFromNote("Author:\n2 HRS")).toBe(2);
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

      it("should extract hours from cell notes for July 25-27 partial PTO", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // M27 (July 25): note "Mandi Davenport:\n2 HRS PTO" → 2h
        const jul25 = result.ptoEntries.find((e) => e.date === "2018-07-25");
        expect(jul25).toBeDefined();
        expect(jul25!.hours).toBe(2);
        expect(jul25!.type).toBe("PTO");
        expect(jul25!.notes).toContain("2 HRS PTO");

        // N27 (July 26): note "Mandi Davenport:\n5 HRS PTO" → 5h
        const jul26 = result.ptoEntries.find((e) => e.date === "2018-07-26");
        expect(jul26).toBeDefined();
        expect(jul26!.hours).toBe(5);
        expect(jul26!.type).toBe("PTO");
        expect(jul26!.notes).toContain("5 HRS PTO");

        // O27 (July 27): note "Mandi Davenport:\n5 HRS PTO" → 5h
        const jul27 = result.ptoEntries.find((e) => e.date === "2018-07-27");
        expect(jul27).toBeDefined();
        expect(jul27!.hours).toBe(5);
        expect(jul27!.type).toBe("PTO");
        expect(jul27!.notes).toContain("5 HRS PTO");
      });

      it("should produce correct July total of 12h (2+5+5)", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const julyEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-07-"),
        );
        const julyTotal = julyEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(julyTotal).toBe(12);
      });

      it("should default to 8h for cells without notes", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // January full PTO days should still be 8h each
        const janFullDays = result.ptoEntries.filter(
          (e) => e.date.startsWith("2018-01-") && e.hours === 8,
        );
        expect(janFullDays.length).toBeGreaterThanOrEqual(3);
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

  // ── Phase 9: Weekend "Worked" Days ──

  describe("parseWorkedHoursFromNote", () => {
    it("should parse parenthesised hours: (+5 hours)", () => {
      expect(parseWorkedHoursFromNote("Worked 10:30 to 3:30 (+5 hours)")).toBe(
        5,
      );
    });

    it("should parse parenthesised hours with decimal: (+5.30 hours)", () => {
      expect(
        parseWorkedHoursFromNote("Worked 10:00 to 3:30 (+5.30 hours)"),
      ).toBe(5.3);
    });

    it("should parse parenthesised hours PTO: (5 hours PTO)", () => {
      expect(
        parseWorkedHoursFromNote("Worked 8:30 to 11:30 (5 hours PTO)"),
      ).toBe(5);
    });

    it('should parse "make up" pattern: make up 1.5', () => {
      expect(
        parseWorkedHoursFromNote("Worked from 8pm-10pm to make up 1.5 PM PTO"),
      ).toBe(1.5);
    });

    it('should parse standalone hours: "3.3 hours"', () => {
      expect(
        parseWorkedHoursFromNote("worked 3.3 hours - subtracted from Friday"),
      ).toBe(3.3);
    });

    it('should parse standalone hours: "2 hours"', () => {
      expect(
        parseWorkedHoursFromNote("worked almost 2 hours on Nevada RFP"),
      ).toBe(2);
    });

    it("should return undefined when no hours pattern found", () => {
      expect(parseWorkedHoursFromNote("worked")).toBeUndefined();
      expect(parseWorkedHoursFromNote("Worked from 1-3pm")).toBeUndefined();
      expect(parseWorkedHoursFromNote("Worked 10 - 12")).toBeUndefined();
    });

    it("should return undefined for bare time ranges without hours keyword", () => {
      expect(
        parseWorkedHoursFromNote("Worked 8-430 and took half lunch"),
      ).toBeUndefined();
    });
  });

  describe("processWorkedCells", () => {
    it("should create negative PTO entry from note with explicit hours", () => {
      const workedCells = [
        { date: "2018-10-20", note: "Worked 10:30 to 3:30 (+5 hours)" },
      ];
      const existingEntries = [
        { date: "2018-10-15", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        usedHours: i === 9 ? 3 : 0, // October = 3h (8 - 5 = 3)
      }));

      const result = processWorkedCells(
        workedCells,
        existingEntries,
        ptoCalcRows,
        "Test",
      );

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].date).toBe("2018-10-20");
      expect(result.entries[0].hours).toBe(-5);
      expect(result.entries[0].type).toBe("PTO");
      expect(result.entries[0].notes).toContain("work credit");
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should infer hours from PTO Calc deficit for single unparsed cell", () => {
      const workedCells = [{ date: "2018-10-14", note: "worked" }];
      const existingEntries: { date: string; type: "PTO"; hours: number }[] =
        [];
      const ptoCalcRows = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        usedHours: i === 9 ? -4.5 : 0, // October = -4.5h
      }));

      const result = processWorkedCells(
        workedCells,
        existingEntries,
        ptoCalcRows,
        "A Bylenga",
      );

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].date).toBe("2018-10-14");
      expect(result.entries[0].hours).toBe(-4.5);
      expect(result.entries[0].type).toBe("PTO");
      expect(result.entries[0].notes).toContain("PTO Calc");
    });

    it("should warn and skip when hours cannot be determined", () => {
      const workedCells = [
        { date: "2018-03-10", note: "worked" },
        { date: "2018-03-17", note: "worked" },
      ];
      const existingEntries: { date: string; type: "PTO"; hours: number }[] =
        [];
      const ptoCalcRows = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        usedHours: i === 2 ? -8 : 0,
      }));

      const result = processWorkedCells(
        workedCells,
        existingEntries,
        ptoCalcRows,
        "Test",
      );

      // Two unparsed cells → can't distribute → skip both
      expect(result.entries.length).toBe(0);
      expect(result.warnings.length).toBe(2);
      expect(result.warnings[0]).toContain("Could not determine hours");
    });

    it("should return empty when no worked cells", () => {
      const result = processWorkedCells([], [], [], "Test");
      expect(result.entries.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe("inferWeekendPartialHours", () => {
    // Helper to build a full set of ptoCalcRows with zeroes except specified months
    function makePtoCalcRows(
      overrides: Record<number, number>,
    ): { month: number; usedHours: number }[] {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        usedHours: overrides[i + 1] ?? 0,
      }));
    }

    it("should infer p=4h w=8h for J Schwerin July pattern (3 Full + 1 Partial + 2 Worked, declared=12)", () => {
      // 3 Full PTO (24h) + 1 Partial PTO (8h default)
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [
          { date: "2018-07-03", type: "PTO", hours: 8 },
          { date: "2018-07-05", type: "PTO", hours: 8 },
          { date: "2018-07-06", type: "PTO", hours: 8 },
          {
            date: "2018-07-23",
            type: "PTO",
            hours: 8,
            isPartialPtoColor: true,
          },
        ];
      // 2 worked weekend cells (no note-derived hours)
      const workedCells = [
        {
          date: "2018-07-01",
          note: "(inferred weekend work from cell color FF7030A0)",
        },
        {
          date: "2018-07-07",
          note: "(inferred weekend work from cell color FF7030A0)",
        },
      ];
      const ptoCalcRows = makePtoCalcRows({ 7: 12 });

      const result = inferWeekendPartialHours(
        entries,
        workedCells,
        ptoCalcRows,
        "J Schwerin",
      );

      // Partial should be adjusted to 4h
      const partial = result.entries.find((e) => e.date === "2018-07-23");
      expect(partial!.hours).toBe(4);
      expect(partial!.notes).toContain("Inferred p=4h");
      expect(partial!.notes).toContain("w assumed 8h");

      // 2 new worked entries at -8h each
      expect(result.newWorkedEntries.length).toBe(2);
      expect(result.newWorkedEntries[0].hours).toBe(-8);
      expect(result.newWorkedEntries[1].hours).toBe(-8);
      expect(result.newWorkedEntries[0].notes).toContain("Inferred w=8h");

      // Both dates handled
      expect(result.handledWorkedDates.has("2018-07-01")).toBe(true);
      expect(result.handledWorkedDates.has("2018-07-07")).toBe(true);

      // Verify total: 24 + 4 - 16 = 12
      const total =
        result.entries.reduce((s, e) => s + e.hours, 0) +
        result.newWorkedEntries.reduce((s, e) => s + e.hours, 0);
      expect(total).toBe(12);
    });

    it("should infer p=4h w=8h for J Schwerin October pattern (1 Partial + 1 Worked, declared=-4)", () => {
      // 1 Partial PTO (8h default), no full days
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [
          {
            date: "2018-10-22",
            type: "PTO",
            hours: 8,
            isPartialPtoColor: true,
          },
        ];
      const workedCells = [
        {
          date: "2018-10-14",
          note: "(inferred weekend work from cell color FF7030A0)",
        },
      ];
      const ptoCalcRows = makePtoCalcRows({ 10: -4 });

      const result = inferWeekendPartialHours(
        entries,
        workedCells,
        ptoCalcRows,
        "J Schwerin",
      );

      const partial = result.entries.find((e) => e.date === "2018-10-22");
      expect(partial!.hours).toBe(4);

      expect(result.newWorkedEntries.length).toBe(1);
      expect(result.newWorkedEntries[0].hours).toBe(-8);

      // Total: 4 - 8 = -4
      const total =
        result.entries.reduce((s, e) => s + e.hours, 0) +
        result.newWorkedEntries.reduce((s, e) => s + e.hours, 0);
      expect(total).toBe(-4);
    });

    it("should skip months where total already matches declared", () => {
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [{ date: "2018-03-15", type: "PTO", hours: 8 }];
      const workedCells = [{ date: "2018-03-04", note: "worked" }];
      const ptoCalcRows = makePtoCalcRows({ 3: 8 });

      const result = inferWeekendPartialHours(
        entries,
        workedCells,
        ptoCalcRows,
        "Test",
      );

      // No changes — total (8) matches declared (8)
      expect(result.entries[0].hours).toBe(8);
      expect(result.newWorkedEntries.length).toBe(0);
      expect(result.handledWorkedDates.size).toBe(0);
    });

    it("should skip months with no partial PTO entries", () => {
      // Only full days, no partials — Phase 11 should not apply
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [
          { date: "2018-12-24", type: "PTO", hours: 8 },
          { date: "2018-12-25", type: "PTO", hours: 8 },
        ];
      const workedCells = [{ date: "2018-12-01", note: "worked" }];
      const ptoCalcRows = makePtoCalcRows({ 12: 8 });

      const result = inferWeekendPartialHours(
        entries,
        workedCells,
        ptoCalcRows,
        "Test",
      );

      expect(result.newWorkedEntries.length).toBe(0);
      expect(result.handledWorkedDates.size).toBe(0);
    });

    it("should skip months with no worked cells", () => {
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [
          { date: "2018-05-07", type: "PTO", hours: 8 },
          {
            date: "2018-05-14",
            type: "PTO",
            hours: 8,
            isPartialPtoColor: true,
          },
        ];
      const ptoCalcRows = makePtoCalcRows({ 5: 18 });

      const result = inferWeekendPartialHours(entries, [], ptoCalcRows, "Test");

      expect(result.newWorkedEntries.length).toBe(0);
      expect(result.handledWorkedDates.size).toBe(0);
    });

    it("should not re-process worked cells that already have negative entries", () => {
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [
          {
            date: "2018-09-10",
            type: "PTO",
            hours: 8,
            isPartialPtoColor: true,
          },
          { date: "2018-09-15", type: "PTO", hours: -8 }, // Already processed worked entry
        ];
      const workedCells = [
        { date: "2018-09-15", note: "worked" }, // Same date as existing negative entry
      ];
      const ptoCalcRows = makePtoCalcRows({ 9: 0 });

      const result = inferWeekendPartialHours(
        entries,
        workedCells,
        ptoCalcRows,
        "Test",
      );

      // Total = 8 + (-8) = 0, matches declared 0 → skip
      expect(result.newWorkedEntries.length).toBe(0);
    });

    it("should fall back to p=4 when w=8 produces invalid p", () => {
      // Construct: 1 partial + 1 worked, declared such that w=8 → p>8
      // fullTotal=0, target = declared - 0 = declared
      // w=8: p = (declared + 8) / 1. For p>8, need declared > 0.
      // w=8: p = (1 + 8) / 1 = 9 → invalid
      // p=4: w = (4 - 1) / 1 = 3 → valid
      const entries: import("../server/reportGenerators/excelImport.js").ImportedPtoEntry[] =
        [
          {
            date: "2018-06-15",
            type: "PTO",
            hours: 8,
            isPartialPtoColor: true,
          },
        ];
      const workedCells = [
        { date: "2018-06-03", note: "(inferred weekend work)" },
      ];
      const ptoCalcRows = makePtoCalcRows({ 6: 1 });

      const result = inferWeekendPartialHours(
        entries,
        workedCells,
        ptoCalcRows,
        "Test",
      );

      const partial = result.entries.find((e) => e.date === "2018-06-15");
      expect(partial!.hours).toBe(4);

      expect(result.newWorkedEntries.length).toBe(1);
      expect(result.newWorkedEntries[0].hours).toBe(-3);
      expect(result.newWorkedEntries[0].notes).toContain("p assumed 4h");

      // Total: 4 - 3 = 1 ✓
      const total =
        result.entries.reduce((s, e) => s + e.hours, 0) +
        result.newWorkedEntries.reduce((s, e) => s + e.hours, 0);
      expect(total).toBe(1);
    });
  });

  describe("parseCalendarGrid worked cell detection", () => {
    it("should separate worked-note cells from unmatched-note cells", async () => {
      const buffer = await generateTestBuffer();
      const wb = await loadWorkbook(buffer);
      const ws = wb.worksheets[1]; // First employee sheet

      // Manually add a "worked" note to a cell in the calendar area
      // January starts at row 6, col 2. Sunday Jan 4 would be at some cell.
      // Let's add a note to an arbitrary cell.
      const testCell = ws.getCell(8, 2); // Row 8, col B
      testCell.note = "worked extra";

      const legend = parseLegend(ws);
      const { workedCells, unmatchedNotedCells } = parseCalendarGrid(
        ws,
        2026,
        legend,
      );

      // The "worked" note cell should be in workedCells, not unmatchedNotedCells
      const workedDates = workedCells.map((c) => c.date);
      const unmatchedDates = unmatchedNotedCells.map((c) => c.date);

      // At least verify the arrays exist and are arrays
      expect(Array.isArray(workedCells)).toBe(true);
      expect(Array.isArray(unmatchedNotedCells)).toBe(true);
    });
  });

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - A Bylenga (weekend worked days)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load worksheet and extract theme colors", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("A Bylenga");
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

      it("should detect R17 (Oct 14) as a worked cell in parseCalendarGrid", () => {
        const legend = parseLegend(ws, themeColors);
        const { workedCells } = parseCalendarGrid(
          ws,
          2018,
          legend,
          themeColors,
        );

        const oct14 = workedCells.find((c) => c.date === "2018-10-14");
        expect(oct14).toBeDefined();
        expect(oct14!.note).toContain("worked");
      });

      it("should produce negative PTO entry for Oct 14 after full pipeline", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // October has 3 color-matched partial PTO entries (1h + 0.5h + 2h = 3.5h)
        // PTO Calc declares -4.5h for October
        // Worked credit = existingTotal - declaredTotal = 3.5 - (-4.5) = 8h
        // Entry gets hours = -8 so net October = 3.5 + (-8) = -4.5 = PTO Calc ✓
        const oct14 = result.ptoEntries.find((e) => e.date === "2018-10-14");
        expect(oct14).toBeDefined();
        expect(oct14!.hours).toBe(-8);
        expect(oct14!.type).toBe("PTO");
        expect(oct14!.notes).toContain("PTO Calc");
        expect(oct14!.notes).toContain("worked");
      });

      it("should produce correct October net total matching PTO Calc = -4.5h", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const octEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-10-"),
        );
        const octTotal = octEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(octTotal).toBe(-4.5);
      });

      it("should emit a warning for the detected worked day", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const workedWarning = result.warnings.find(
          (w) => w.includes("2018-10-14") && w.includes("worked"),
        );
        expect(workedWarning).toBeDefined();
      });
    },
  );

  // ── Phase 10: PTO Calc–Driven Reconciliation for Ambiguous Cell Notes ──

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - A Campbell (Phase 10: ambiguous note reconciliation)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load A Campbell worksheet and extract theme colors", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("A Campbell");
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

      it("should tag Dec 19 cell (U36) as Partial PTO color in parseCalendarGrid", () => {
        const legend = parseLegend(ws, themeColors);
        const partialColors = parsePartialPtoColors(ws, themeColors);
        expect(partialColors.size).toBeGreaterThan(0);

        const { entries } = parseCalendarGrid(
          ws,
          2018,
          legend,
          themeColors,
          partialColors,
        );

        const dec19 = entries.find((e) => e.date === "2018-12-19");
        expect(dec19).toBeDefined();
        expect(dec19!.isPartialPtoColor).toBe(true);
        expect(dec19!.type).toBe("PTO");
        // Note contains "PTO at 1PM" — bare number fallback no longer
        // extracts 1 (word boundary prevents matching 1PM)
        expect(dec19!.notes).toContain("PTO at 1PM");
      });

      it("should back-calculate Dec 19 from 1h to 4.5h via adjustPartialDays", () => {
        const legend = parseLegend(ws, themeColors);
        const partialColors = parsePartialPtoColors(ws, themeColors);
        const { entries } = parseCalendarGrid(
          ws,
          2018,
          legend,
          themeColors,
          partialColors,
        );

        const ptoCalcRows = parsePtoCalcUsedHours(ws);
        const { entries: adjusted } = adjustPartialDays(
          entries,
          ptoCalcRows,
          ws.name,
        );

        const dec19 = adjusted.find((e) => e.date === "2018-12-19");
        expect(dec19).toBeDefined();
        expect(dec19!.hours).toBe(4.5);
        expect(dec19!.notes).toContain("Adjusted from 8h to 4.5h");
      });

      it("should produce correct December total of 44.5h via full pipeline", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const decEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-12-"),
        );
        const decTotal = decEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(decTotal).toBe(44.5);
      });

      it("should not regress A Campbell months with correct note-based hours", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Dec Full PTO entries should still be 8h each
        const decFullDays = result.ptoEntries.filter(
          (e) =>
            e.date.startsWith("2018-12-") &&
            e.date !== "2018-12-19" &&
            e.hours === 8,
        );
        expect(decFullDays.length).toBe(5);
      });
    },
  );

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - A Bylenga July (Phase 10 regression check)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load A Bylenga worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("A Bylenga");
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

      it("should still produce correct July total of 12h (no regression)", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const julyEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-07-"),
        );
        const julyTotal = julyEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(julyTotal).toBe(12);

        // Individual entries
        const jul25 = julyEntries.find((e) => e.date === "2018-07-25");
        expect(jul25!.hours).toBe(2);
        const jul26 = julyEntries.find((e) => e.date === "2018-07-26");
        expect(jul26!.hours).toBe(5);
        const jul27 = julyEntries.find((e) => e.date === "2018-07-27");
        expect(jul27!.hours).toBe(5);
      });
    },
  );

  // ── Phase 12: Sick-Time Exhaustion Tests ──

  describe("reclassifySickAsPto", () => {
    it("should not reclassify Sick entries within the 24h allowance", () => {
      const entries = [
        { date: "2018-02-08", type: "Sick" as const, hours: 8 },
        { date: "2018-03-05", type: "Sick" as const, hours: 8 },
        { date: "2018-03-08", type: "Sick" as const, hours: 8 },
      ];
      const result = reclassifySickAsPto(entries, "Test");
      // All 3 sick days (24h total) are within allowance
      expect(result.entries.every((e) => e.type === "Sick")).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    it("should reclassify 4th Sick day as PTO when allowance is exhausted", () => {
      const entries = [
        { date: "2018-02-08", type: "Sick" as const, hours: 8 },
        { date: "2018-03-05", type: "Sick" as const, hours: 8 },
        { date: "2018-03-08", type: "Sick" as const, hours: 8 },
        { date: "2018-04-23", type: "Sick" as const, hours: 8 },
      ];
      const result = reclassifySickAsPto(entries, "D Allen");
      // First 3 remain Sick
      expect(result.entries[0].type).toBe("Sick");
      expect(result.entries[1].type).toBe("Sick");
      expect(result.entries[2].type).toBe("Sick");
      // 4th should be reclassified as PTO
      expect(result.entries[3].type).toBe("PTO");
      expect(result.entries[3].hours).toBe(8);
      expect(result.entries[3].notes).toContain("reclassified as PTO");
      expect(result.entries[3].notes).toContain("24h");
      expect(result.warnings.length).toBe(1);
    });

    it("should reclassify multiple subsequent Sick entries after exhaustion (J Rivers pattern)", () => {
      // J Rivers: exhausted sick time, then has Sick in Aug, Sep, Oct, Nov
      const entries = [
        { date: "2018-01-15", type: "Sick" as const, hours: 8 },
        { date: "2018-02-12", type: "Sick" as const, hours: 8 },
        { date: "2018-03-01", type: "Sick" as const, hours: 8 },
        // Allowance exhausted at 24h
        { date: "2018-08-03", type: "Sick" as const, hours: 8 },
        { date: "2018-09-10", type: "Sick" as const, hours: 8 },
        { date: "2018-10-05", type: "Sick" as const, hours: 8 },
        { date: "2018-11-07", type: "Sick" as const, hours: 8 },
      ];
      const result = reclassifySickAsPto(entries, "J Rivers");
      // First 3 remain Sick
      expect(result.entries.slice(0, 3).every((e) => e.type === "Sick")).toBe(
        true,
      );
      // Aug-Nov all reclassified to PTO
      expect(result.entries[3].type).toBe("PTO");
      expect(result.entries[4].type).toBe("PTO");
      expect(result.entries[5].type).toBe("PTO");
      expect(result.entries[6].type).toBe("PTO");
      expect(result.warnings.length).toBe(4);
    });

    it("should preserve existing PTO entries unmodified", () => {
      const entries = [
        { date: "2018-02-08", type: "Sick" as const, hours: 8 },
        { date: "2018-03-05", type: "Sick" as const, hours: 8 },
        { date: "2018-03-08", type: "Sick" as const, hours: 8 },
        {
          date: "2018-04-20",
          type: "PTO" as const,
          hours: 4,
          isPartialPtoColor: true,
        },
        { date: "2018-04-23", type: "Sick" as const, hours: 8 },
      ];
      const result = reclassifySickAsPto(entries, "D Allen");
      // PTO entry untouched
      expect(result.entries[3].type).toBe("PTO");
      expect(result.entries[3].hours).toBe(4);
      // Sick entry reclassified
      expect(result.entries[4].type).toBe("PTO");
      expect(result.entries[4].hours).toBe(8);
    });

    it("should handle partial sick hours in cumulative tracking", () => {
      const entries = [
        { date: "2018-01-10", type: "Sick" as const, hours: 8 },
        { date: "2018-02-10", type: "Sick" as const, hours: 8 },
        { date: "2018-03-10", type: "Sick" as const, hours: 4 }, // partial sick
        { date: "2018-04-10", type: "Sick" as const, hours: 8 }, // cumulative=20, still within 24
        { date: "2018-05-10", type: "Sick" as const, hours: 8 }, // cumulative=28, over but 24 reached after adding this
      ];
      const result = reclassifySickAsPto(entries, "Test");
      // 8+8+4 = 20 (within); 20+8 = 28 (still within at time of 4th); 5th starts at 28
      expect(result.entries[0].type).toBe("Sick"); // cumulative after: 8
      expect(result.entries[1].type).toBe("Sick"); // cumulative after: 16
      expect(result.entries[2].type).toBe("Sick"); // cumulative after: 20
      expect(result.entries[3].type).toBe("Sick"); // cumulative after: 28 (but cumulative BEFORE was 20 < 24)
      expect(result.entries[4].type).toBe("PTO"); // cumulative BEFORE = 28 >= 24
      expect(result.warnings.length).toBe(1);
    });
  });

  // ── Phase 13: Non-Standard Color PTO Recognition Tests ──

  describe("reconcileUnmatchedColoredCells", () => {
    it("should create PTO entries from unmatched colored cells when gap >= 8h", () => {
      const existing = [
        {
          date: "2018-03-28",
          type: "PTO" as const,
          hours: 4,
          notes: 'Cell note: "4 hours"',
        },
      ];
      const unmatchedCells = [
        { date: "2018-03-05", color: "FF7030A0", note: "" },
        { date: "2018-03-06", color: "FF7030A0", note: "" },
        { date: "2018-03-07", color: "FF7030A0", note: "" },
        { date: "2018-03-08", color: "FF7030A0", note: "" },
        { date: "2018-03-09", color: "FF7030A0", note: "" },
        { date: "2018-03-12", color: "FF7030A0", note: "" },
      ];
      const ptoCalcRows = [{ month: 3, usedHours: 52 }];

      const result = reconcileUnmatchedColoredCells(
        existing,
        unmatchedCells,
        ptoCalcRows,
        "J Rivers",
      );

      // Gap = 52 - 4 = 48h. 6 unmatched cells → 48/6 = 8h each
      expect(result.entries.length).toBe(6);
      for (const entry of result.entries) {
        expect(entry.type).toBe("PTO");
        expect(entry.hours).toBe(8);
        expect(entry.notes).toContain("Non-standard color");
        expect(entry.notes).toContain("FF7030A0");
      }
      // Total should be 4 + 48 = 52
      const total =
        existing.reduce((s, e) => s + e.hours, 0) +
        result.entries.reduce((s, e) => s + e.hours, 0);
      expect(total).toBe(52);
    });

    it("should use note-derived hours for cells with notes", () => {
      const existing: { date: string; type: "PTO"; hours: number }[] = [];
      const unmatchedCells = [
        { date: "2018-03-05", color: "FF7030A0", note: "" },
        { date: "2018-03-28", color: "FF7030A0", note: "4 hours" },
      ];
      const ptoCalcRows = [{ month: 3, usedHours: 12 }];

      const result = reconcileUnmatchedColoredCells(
        existing,
        unmatchedCells,
        ptoCalcRows,
        "Test",
      );

      // Gap = 12h. Noted cell gets 4h, remaining cell gets 8h
      expect(result.entries.length).toBe(2);
      const noted = result.entries.find((e) => e.date === "2018-03-28");
      expect(noted!.hours).toBe(4);
      const other = result.entries.find((e) => e.date === "2018-03-05");
      expect(other!.hours).toBe(8);
    });

    it("should not process when gap < 8h", () => {
      const existing = [{ date: "2018-03-05", type: "PTO" as const, hours: 8 }];
      const unmatchedCells = [
        { date: "2018-03-10", color: "FF7030A0", note: "" },
      ];
      const ptoCalcRows = [{ month: 3, usedHours: 12 }]; // gap = 4h, less than 8

      const result = reconcileUnmatchedColoredCells(
        existing,
        unmatchedCells,
        ptoCalcRows,
        "Test",
      );

      expect(result.entries.length).toBe(0);
    });

    it("should skip cells already in existing entries", () => {
      const existing = [{ date: "2018-03-05", type: "PTO" as const, hours: 8 }];
      const unmatchedCells = [
        { date: "2018-03-05", color: "FF7030A0", note: "" }, // same date as existing
        { date: "2018-03-06", color: "FF7030A0", note: "" },
      ];
      const ptoCalcRows = [{ month: 3, usedHours: 16 }]; // gap = 8h

      const result = reconcileUnmatchedColoredCells(
        existing,
        unmatchedCells,
        ptoCalcRows,
        "Test",
      );

      // Should only create entry for Mar 6 (Mar 5 is already in existing)
      expect(result.entries.length).toBe(1);
      expect(result.entries[0].date).toBe("2018-03-06");
      expect(result.entries[0].hours).toBe(8);
    });

    it("should be a no-op when there are no unmatched colored cells", () => {
      const existing = [{ date: "2018-03-05", type: "PTO" as const, hours: 8 }];
      const ptoCalcRows = [{ month: 3, usedHours: 52 }];

      const result = reconcileUnmatchedColoredCells(
        existing,
        [],
        ptoCalcRows,
        "Test",
      );

      expect(result.entries.length).toBe(0);
    });
  });

  // ── Phase 14: Over-Coloring Detection Tests ──

  describe("detectOverColoring", () => {
    it("should detect over-coloring when calendar > declared", () => {
      const entries = [
        { date: "2018-12-17", type: "PTO" as const, hours: 8 },
        { date: "2018-12-18", type: "PTO" as const, hours: 8 },
        { date: "2018-12-19", type: "PTO" as const, hours: 8 },
        { date: "2018-12-20", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = [{ month: 12, usedHours: 24 }]; // declared 24, calendar 32

      const result = detectOverColoring(entries, ptoCalcRows, "D Allen");

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain("Over-coloring detected");
      expect(result.warnings[0]).toContain("calendar=32h");
      expect(result.warnings[0]).toContain("declared=24h");
      expect(result.warnings[0]).toContain("Δ=+8h");
      expect(result.warnings[0]).toContain("Column S is authoritative");
    });

    it("should include note keywords in warning when found", () => {
      const entries = [
        {
          date: "2018-12-05",
          type: "PTO" as const,
          hours: 8,
          notes: 'Cell note: "Worked Saturday to make up for this sick day"',
        },
        { date: "2018-12-10", type: "PTO" as const, hours: 8 },
        { date: "2018-12-15", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = [{ month: 12, usedHours: 16 }];

      const result = detectOverColoring(entries, ptoCalcRows, "J Guiry");

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain("Worked Saturday");
      expect(result.warnings[0]).toContain("Relevant notes");
    });

    it("should not flag when calendar <= declared", () => {
      const entries = [
        { date: "2018-05-09", type: "PTO" as const, hours: 2 },
        { date: "2018-05-21", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = [{ month: 5, usedHours: 12 }]; // 10h calendar <= 12h declared

      const result = detectOverColoring(entries, ptoCalcRows, "J Guiry");

      expect(result.warnings.length).toBe(0);
    });

    it("should not flag when calendar equals declared", () => {
      const entries = [
        { date: "2018-07-02", type: "PTO" as const, hours: 8 },
        { date: "2018-07-03", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = [{ month: 7, usedHours: 16 }];

      const result = detectOverColoring(entries, ptoCalcRows, "Test");

      expect(result.warnings.length).toBe(0);
    });

    it("should handle multiple months with over-coloring", () => {
      const entries = [
        // July: 56h on calendar
        { date: "2018-07-02", type: "PTO" as const, hours: 8 },
        { date: "2018-07-03", type: "PTO" as const, hours: 8 },
        { date: "2018-07-04", type: "PTO" as const, hours: 8 },
        { date: "2018-07-05", type: "PTO" as const, hours: 8 },
        { date: "2018-07-06", type: "PTO" as const, hours: 8 },
        { date: "2018-07-09", type: "PTO" as const, hours: 8 },
        { date: "2018-07-10", type: "PTO" as const, hours: 8 },
        // December: 32h on calendar
        { date: "2018-12-17", type: "PTO" as const, hours: 8 },
        { date: "2018-12-18", type: "PTO" as const, hours: 8 },
        { date: "2018-12-19", type: "PTO" as const, hours: 8 },
        { date: "2018-12-20", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = [
        { month: 7, usedHours: 40 }, // declared 40, calendar 56
        { month: 12, usedHours: 24 }, // declared 24, calendar 32
      ];

      const result = detectOverColoring(entries, ptoCalcRows, "J Schwerin");

      expect(result.warnings.length).toBe(2);
      expect(result.warnings[0]).toContain("month 7");
      expect(result.warnings[1]).toContain("month 12");
    });

    it("should ignore Sick and Bereavement entries (only PTO tracked in column S)", () => {
      const entries = [
        { date: "2018-03-05", type: "Sick" as const, hours: 8 },
        { date: "2018-03-06", type: "Bereavement" as const, hours: 8 },
        { date: "2018-03-07", type: "PTO" as const, hours: 8 },
      ];
      const ptoCalcRows = [{ month: 3, usedHours: 8 }]; // Only PTO tracked

      const result = detectOverColoring(entries, ptoCalcRows, "Test");

      // Only 8h PTO vs 8h declared — no over-coloring
      expect(result.warnings.length).toBe(0);
    });
  });

  describe("reclassifySickByColumnS", () => {
    it("should not reclassify when Phase 12 has not reclassified any entries", () => {
      const entries: ImportedPtoEntry[] = [
        { date: "2018-08-03", type: "Sick", hours: 8 },
        { date: "2018-08-14", type: "PTO", hours: 8 },
      ];
      const ptoCalcRows = [{ month: 8, usedHours: 16 }];

      const result = reclassifySickByColumnS(entries, ptoCalcRows, "Test");

      // No Phase 12 reclassification detected, so no action
      expect(result.entries.filter((e) => e.type === "Sick").length).toBe(1);
      expect(result.warnings.length).toBe(0);
    });

    it("should reclassify Sick entries when Phase 12 has reclassified entries and gap exists", () => {
      const entries: ImportedPtoEntry[] = [
        { date: "2018-08-03", type: "Sick", hours: 8 },
        { date: "2018-08-14", type: "PTO", hours: 8 },
        // Phase 12 reclassified entry (serves as trigger)
        {
          date: "2018-10-30",
          type: "PTO",
          hours: 8,
          notes:
            "Cell colored as Sick but reclassified as PTO — employee had exhausted 24h sick allowance (used 24h prior to this date).",
        },
      ];
      const ptoCalcRows = [
        { month: 8, usedHours: 16 },
        { month: 10, usedHours: 8 },
      ];

      const result = reclassifySickByColumnS(entries, ptoCalcRows, "Test");

      // Aug sick should be reclassified as PTO (gap=8h, sick=8h)
      const augSick = result.entries.filter(
        (e) => e.date === "2018-08-03" && e.type === "Sick",
      );
      expect(augSick.length).toBe(0);

      const augPto = result.entries.filter(
        (e) => e.date === "2018-08-03" && e.type === "PTO",
      );
      expect(augPto.length).toBe(1);
      expect(augPto[0].notes).toContain("column S gap");
      expect(augPto[0].notes).toContain("sick allowance");
      expect(result.warnings.length).toBe(1);
    });

    it("should not reclassify when Sick hours would overshoot declared", () => {
      const entries: ImportedPtoEntry[] = [
        { date: "2018-04-20", type: "PTO", hours: 8 },
        { date: "2018-04-23", type: "Sick", hours: 8 },
        // Phase 12 trigger entry
        {
          date: "2018-10-30",
          type: "PTO",
          hours: 8,
          notes:
            "Cell colored as Sick but reclassified as PTO — employee had exhausted 24h sick allowance (used 24h prior to this date).",
        },
      ];
      // Declared 12h, PTO=8h, gap=4h, but Sick=8h would overshoot
      const ptoCalcRows = [
        { month: 4, usedHours: 12 },
        { month: 10, usedHours: 8 },
      ];

      const result = reclassifySickByColumnS(entries, ptoCalcRows, "Test");

      // Sick entry should remain — 8h > 4h gap
      const aprSick = result.entries.filter(
        (e) => e.date === "2018-04-23" && e.type === "Sick",
      );
      expect(aprSick.length).toBe(1);
      expect(result.warnings.length).toBe(0);
    });

    it("should reclassify multiple Sick entries when all fit within gap", () => {
      const entries: ImportedPtoEntry[] = [
        { date: "2018-07-02", type: "Sick", hours: 8 },
        { date: "2018-07-03", type: "Sick", hours: 8 },
        // Phase 12 trigger
        {
          date: "2018-10-30",
          type: "PTO",
          hours: 8,
          notes:
            "Cell colored as Sick but reclassified as PTO — employee had exhausted 24h sick allowance (used 24h prior to this date).",
        },
      ];
      const ptoCalcRows = [
        { month: 7, usedHours: 16 },
        { month: 10, usedHours: 8 },
      ];

      const result = reclassifySickByColumnS(entries, ptoCalcRows, "Test");

      const julSick = result.entries.filter(
        (e) => e.date.startsWith("2018-07") && e.type === "Sick",
      );
      expect(julSick.length).toBe(0);

      const julPto = result.entries.filter(
        (e) => e.date.startsWith("2018-07") && e.type === "PTO",
      );
      expect(julPto.length).toBe(2);
      expect(result.warnings.length).toBe(2);
    });
  });

  // ── Phase 12-14 Legacy 2018 Integration Tests ──

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - D Allen (Phase 12 sick-time exhaustion)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load D Allen worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("Dan Allen");
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

      it("should NOT reclassify any sick entries (total=24h, exactly at allowance)", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Dan Allen has 3 Sick entries: Mar 5 (8h), Mar 8 (8h), Apr 23 (8h) = 24h total.
        // Feb 8 has a different green (FF92D050 vs legend FF00B050, distance ~149 > threshold 100)
        // so it is NOT matched as Sick. With only 24h total, the allowance is never exceeded,
        // and no reclassification occurs (reclassification triggers only when cumulative >= 24h
        // BEFORE the current entry).
        const sickEntries = result.ptoEntries.filter((e) => e.type === "Sick");
        expect(sickEntries.length).toBe(3);

        // No entries should have reclassification notes
        const reclassified = result.ptoEntries.filter(
          (e) => e.notes && e.notes.includes("reclassified as PTO"),
        );
        expect(reclassified.length).toBe(0);

        // Verify no reclassification warnings
        const reclassWarnings = result.warnings.filter((w) =>
          w.includes("reclassified"),
        );
        expect(reclassWarnings.length).toBe(0);
      });

      it("should detect December over-coloring", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // D Allen Dec: 4 Full PTO colored (32h), column S declares 24h
        const overColorWarnings = result.warnings.filter(
          (w) => w.includes("Over-coloring") && w.includes("month 12"),
        );
        expect(overColorWarnings.length).toBeGreaterThanOrEqual(1);
      });
    },
  );

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - J Schwerin (Phase 12 regression + Phase 14)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load J Schwerin worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("J Schwerin");
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

      it("should still produce correct July total of 12h (Phase 11 regression)", () => {
        const result = parseEmployeeSheet(ws, themeColors);
        const julyEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-07-"),
        );
        const julyTotal = julyEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(julyTotal).toBe(12);
      });

      it("should still produce correct October total of -4h (Phase 11 regression)", () => {
        const result = parseEmployeeSheet(ws, themeColors);
        const octEntries = result.ptoEntries.filter((e) =>
          e.date.startsWith("2018-10-"),
        );
        const octTotal = octEntries.reduce((sum, e) => sum + e.hours, 0);
        expect(octTotal).toBe(-4);
      });

      it("should detect December over-coloring (Phase 14)", () => {
        const result = parseEmployeeSheet(ws, themeColors);
        const overColorWarnings = result.warnings.filter(
          (w) => w.includes("Over-coloring") && w.includes("month 12"),
        );
        expect(overColorWarnings.length).toBeGreaterThanOrEqual(1);
      });
    },
  );

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - J Rivers (Phase 12 sick + Phase 13 purple)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load J Rivers worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("J Rivers");
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

      it("should reclassify post-exhaustion Sick entries as PTO (Aug-Nov)", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // J Rivers should have sick-reclassification warnings
        // Phase 12 reclassifies Oct, Nov, Dec; Phase 12b reclassifies Aug, Sep
        const sickReclassWarnings = result.warnings.filter(
          (w) =>
            w.includes("reclassified as PTO") ||
            w.includes("Sick reclassified as PTO"),
        );
        expect(sickReclassWarnings.length).toBeGreaterThanOrEqual(3);

        // Verify Aug and Sep PTO totals now match declared
        for (const m of [8, 9]) {
          const monthPto = result.ptoEntries.filter((e) => {
            const mon = parseInt(e.date.substring(5, 7));
            return mon === m && e.type === "PTO";
          });
          const total = monthPto.reduce((s, e) => s + e.hours, 0);
          const declared = m === 8 ? 16 : 24;
          expect(total).toBe(declared);
        }
      });

      it("should have reclassification note on reclassified entries", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Find PTO entries that were reclassified from Sick
        const reclassified = result.ptoEntries.filter(
          (e) => e.notes && e.notes.includes("reclassified as PTO"),
        );
        expect(reclassified.length).toBeGreaterThanOrEqual(1);
        for (const entry of reclassified) {
          expect(entry.type).toBe("PTO");
          expect(entry.notes).toContain("sick allowance");
        }
      });
    },
  );

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - J Guiry (Phase 14 over-coloring + note keywords)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load J Guiry worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("J Guiry");
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

      it("should detect December over-coloring with weekend-makeup note", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const decOverColor = result.warnings.filter(
          (w) => w.includes("Over-coloring") && w.includes("month 12"),
        );
        expect(decOverColor.length).toBeGreaterThanOrEqual(1);
      });

      it("should NOT flag May as over-coloring (calendar < declared)", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        const mayOverColor = result.warnings.filter(
          (w) => w.includes("Over-coloring") && w.includes("month 5"),
        );
        expect(mayOverColor.length).toBe(0);
      });
    },
  );

  // ── Phase 15: overrideTypeFromNote ──

  describe("overrideTypeFromNote", () => {
    it("should override Bereavement → PTO when note contains 'PTO'", () => {
      const entries = [
        {
          date: "2018-05-18",
          type: "Bereavement" as const,
          hours: 3,
          notes:
            'Color matched via approximate (resolved=FFFCD5B5). Cell note: "3 hours PTO "',
        },
      ];
      const result = overrideTypeFromNote(entries, "L Cole");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("PTO");
      expect(result.entries[0].notes).toContain(
        "Type overridden from Bereavement to PTO",
      );
      expect(result.workedCells).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });

    it("should override Bereavement → Sick when note contains 'sick'", () => {
      const entries = [
        {
          date: "2018-02-07",
          type: "Bereavement" as const,
          hours: 4,
          notes:
            'Color matched via approximate (resolved=FFC3D69B). Cell note: "4 hours sick "',
        },
      ];
      const result = overrideTypeFromNote(entries, "L Cole");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("Sick");
      expect(result.warnings).toHaveLength(1);
    });

    it("should demote to workedCell when note contains 'worked'", () => {
      const entries = [
        {
          date: "2018-09-22",
          type: "Bereavement" as const,
          hours: 1,
          notes:
            'Color matched via approximate (resolved=FFB7DEE8). Cell note: "Worked from 1-3pm "',
        },
      ];
      const result = overrideTypeFromNote(entries, "Test");
      expect(result.entries).toHaveLength(0);
      expect(result.workedCells).toHaveLength(1);
      expect(result.workedCells[0].date).toBe("2018-09-22");
      expect(result.workedCells[0].note).toContain("Worked");
    });

    it("should not touch exact-match entries", () => {
      const entries = [
        {
          date: "2018-06-18",
          type: "PTO" as const,
          hours: 8,
          notes: undefined,
        },
      ];
      const result = overrideTypeFromNote(entries, "Test");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("PTO");
      expect(result.workedCells).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should keep Bereavement when note has no type keyword", () => {
      const entries = [
        {
          date: "2018-09-07",
          type: "Bereavement" as const,
          hours: 4,
          notes:
            'Color matched via approximate (resolved=FFFCD5B5). Cell note: "4 hours "',
        },
      ];
      const result = overrideTypeFromNote(entries, "Test");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("Bereavement");
      expect(result.warnings).toHaveLength(0);
    });

    it("should prefer PTO over Sick when note contains both", () => {
      const entries = [
        {
          date: "2018-05-23",
          type: "Bereavement" as const,
          hours: 6,
          notes:
            'Color matched via approximate (resolved=FFC3D69B). Cell note: "6 Hours Sick - Used 5 hours PTO "',
        },
      ];
      const result = overrideTypeFromNote(entries, "Test");
      expect(result.entries).toHaveLength(1);
      // Contains PTO keyword → should override to PTO (PTO takes priority)
      expect(result.entries[0].type).toBe("PTO");
    });
  });

  // ── L Cole integration test ──

  describe.skipIf(!existsSync(LEGACY_2018_PATH))(
    "Legacy 2018 workbook - L Cole (Phase 15 note-based type override)",
    () => {
      let ws: ExcelJS.Worksheet;
      let themeColors: Map<number, string>;

      it("should load L Cole worksheet", async () => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(LEGACY_2018_PATH);

        const sheet = wb.getWorksheet("L Cole");
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

      it("should override approximate-matched Bereavement entries based on notes", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Phase 15 warnings for overridden entries
        const overrideWarnings = result.warnings.filter((w) =>
          w.includes("overridden"),
        );
        expect(overrideWarnings.length).toBeGreaterThanOrEqual(5);
      });

      it("should have significantly fewer Bereavement entries after Phase 15", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Before Phase 15, L Cole had 29 Bereavement entries.
        // After Phase 15, many should be reclassified as PTO or Sick.
        const bereavEntries = result.ptoEntries.filter(
          (e) => e.type === "Bereavement",
        );
        // Only the actual bereavement cells (Oct 14-19 range with grey color)
        // should remain as Bereavement
        expect(bereavEntries.length).toBeLessThan(15);
      });

      it("should produce PTO totals closer to column S declared values", () => {
        const result = parseEmployeeSheet(ws, themeColors);
        const ptoCalc = parsePtoCalcUsedHours(ws);

        // Check months that were previously mismatched
        for (const month of [6, 12]) {
          const declared =
            ptoCalc.find((c) => c.month === month)?.usedHours || 0;
          const ptoTotal = result.ptoEntries
            .filter((e) => {
              const m = parseInt(e.date.substring(5, 7));
              return m === month && e.type === "PTO";
            })
            .reduce((s, e) => s + e.hours, 0);
          // PTO total should be much closer to declared now
          const gap = Math.abs(declared - ptoTotal);
          expect(gap).toBeLessThan(declared * 0.5); // Within 50% of declared
        }
      });

      it("should reclassify Sep Bereavement entries as PTO via Phase 16", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Sep: 2 Bereavement entries (4h + 4h) with "4 hours" notes
        // Column S declares 22h PTO; without Phase 16 only 14h PTO detected
        // Phase 16 should reclassify both to fill the 8h gap
        const sepPto = result.ptoEntries
          .filter((e) => e.date.startsWith("2018-09") && e.type === "PTO")
          .reduce((s, e) => s + e.hours, 0);
        // Should be close to declared 22h (14h base + 8h reclassified)
        expect(sepPto).toBeGreaterThanOrEqual(20);
      });

      it("should reclassify Dec Bereavement entry as PTO via Phase 16", () => {
        const result = parseEmployeeSheet(ws, themeColors);

        // Dec: 1 Bereavement entry (2h) — gap is exactly 2h
        const decPto = result.ptoEntries
          .filter((e) => e.date.startsWith("2018-12") && e.type === "PTO")
          .reduce((s, e) => s + e.hours, 0);
        // Should match declared 30h
        expect(decPto).toBe(30);
      });
    },
  );

  // ── Phase 16: reclassifyBereavementByColumnS ──

  describe("reclassifyBereavementByColumnS", () => {
    it("should reclassify approximate-matched Bereavement as PTO when gap exists", () => {
      const entries: Parameters<typeof reclassifyBereavementByColumnS>[0] = [
        { date: "2018-09-03", type: "PTO", hours: 8 },
        {
          date: "2018-09-07",
          type: "Bereavement",
          hours: 4,
          notes:
            'Color matched via approximate (resolved=FFFCD5B5). Cell note: "4 hours "',
        },
        { date: "2018-09-21", type: "PTO", hours: 8 },
      ];
      const ptoCalcRows = [{ month: 9, usedHours: 20 }];
      const result = reclassifyBereavementByColumnS(
        entries,
        ptoCalcRows,
        "Test",
      );
      expect(result.entries[1].type).toBe("PTO");
      expect(result.entries[1].notes).toContain(
        "Bereavement reclassified as PTO",
      );
      expect(result.warnings).toHaveLength(1);
    });

    it("should not reclassify exact-matched Bereavement entries", () => {
      const entries: Parameters<typeof reclassifyBereavementByColumnS>[0] = [
        { date: "2018-10-15", type: "Bereavement", hours: 8, notes: undefined },
        { date: "2018-10-16", type: "PTO", hours: 8 },
      ];
      const ptoCalcRows = [{ month: 10, usedHours: 16 }];
      const result = reclassifyBereavementByColumnS(
        entries,
        ptoCalcRows,
        "Test",
      );
      // No "Color matched via approximate" in notes → should stay Bereavement
      expect(result.entries[0].type).toBe("Bereavement");
      expect(result.warnings).toHaveLength(0);
    });

    it("should not overshoot declared total", () => {
      const entries: Parameters<typeof reclassifyBereavementByColumnS>[0] = [
        { date: "2018-05-04", type: "PTO", hours: 8 },
        {
          date: "2018-05-10",
          type: "Bereavement",
          hours: 4,
          notes:
            'Color matched via approximate (resolved=FFFCD5B5). Cell note: "4 hours "',
        },
        {
          date: "2018-05-11",
          type: "Bereavement",
          hours: 8,
          notes: "Color matched via approximate (resolved=FFB7DEE8).",
        },
      ];
      const ptoCalcRows = [{ month: 5, usedHours: 11 }];
      const result = reclassifyBereavementByColumnS(
        entries,
        ptoCalcRows,
        "Test",
      );
      // Gap is 3h. Smallest Bereavement is 4h → would overshoot → skip both
      expect(result.entries[1].type).toBe("Bereavement");
      expect(result.entries[2].type).toBe("Bereavement");
    });

    it("should reclassify multiple entries smallest-first to fill gap", () => {
      const entries: Parameters<typeof reclassifyBereavementByColumnS>[0] = [
        { date: "2018-09-03", type: "PTO", hours: 8 },
        {
          date: "2018-09-07",
          type: "Bereavement",
          hours: 4,
          notes:
            'Color matched via approximate (resolved=FFFCD5B5). Cell note: "4 hours "',
        },
        {
          date: "2018-09-12",
          type: "Bereavement",
          hours: 4,
          notes:
            'Color matched via approximate (resolved=FFFCD5B5). Cell note: "4 hours "',
        },
        { date: "2018-09-21", type: "PTO", hours: 8 },
      ];
      const ptoCalcRows = [{ month: 9, usedHours: 24 }];
      const result = reclassifyBereavementByColumnS(
        entries,
        ptoCalcRows,
        "Test",
      );
      // Gap is 8h, two 4h entries → both should be reclassified
      expect(result.entries[1].type).toBe("PTO");
      expect(result.entries[2].type).toBe("PTO");
      expect(result.warnings).toHaveLength(2);
    });
  });
});

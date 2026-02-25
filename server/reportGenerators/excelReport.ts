/**
 * Excel Report Generator
 *
 * Generates an Excel (.xlsx) workbook that mimics the legacy PTO
 * spreadsheet layout. Each employee gets a dedicated worksheet with
 * a calendar grid, PTO color coding, legend, PTO calculation section,
 * and acknowledgement columns.
 *
 * References the `pto-spreadsheet-layout` skill for exact cell coordinates.
 */

import ExcelJS from "exceljs";
import type {
  ReportData,
  EmployeeReportData,
  ReportPtoEntry,
} from "../reportService.js";
import { getDaysInMonth } from "../../shared/dateUtils.js";
import { MONTH_NAMES } from "../../shared/businessRules.js";

// ── Legacy ARGB fill colors (from pto-spreadsheet-layout skill) ──

const PTO_TYPE_FILLS: Record<string, string> = {
  Sick: "FF00B050", // green
  PTO: "FFFFFF00", // yellow
  Bereavement: "FFBFBFBF", // gray
  "Jury Duty": "FFFF0000", // red
};

// Legend entries include all types (some may not appear as PTO entries)
const LEGEND_ENTRIES: { label: string; argb: string }[] = [
  { label: "Sick", argb: "FF00B050" },
  { label: "Full PTO", argb: "FFFFFF00" },
  { label: "Partial PTO", argb: "FFFFC000" },
  { label: "Planned PTO", argb: "FF00B0F0" },
  { label: "Bereavement", argb: "FFBFBFBF" },
  { label: "Jury Duty", argb: "FFFF0000" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Header styling
const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A5276" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  name: "Calibri",
  size: 11,
};

const WEEKEND_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF0F0F0" },
};

const WEEKEND_FONT: Partial<ExcelJS.Font> = {
  color: { argb: "FFAAAAAA" },
  name: "Calibri",
  size: 10,
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCCCCCC" } },
  left: { style: "thin", color: { argb: "FFCCCCCC" } },
  bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
  right: { style: "thin", color: { argb: "FFCCCCCC" } },
};

// ── Build PTO lookup ──

function buildPtoMap(entries: ReportPtoEntry[]): Map<string, ReportPtoEntry> {
  const map = new Map<string, ReportPtoEntry>();
  for (const e of entries) {
    map.set(e.date, e);
  }
  return map;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// ── Worksheet population ──

/**
 * Populate a single worksheet for one employee.
 */
function populateEmployeeSheet(
  ws: ExcelJS.Worksheet,
  emp: EmployeeReportData,
  year: number,
): void {
  // ── Row 1–3: Employee header ──
  const nameCell = ws.getCell("B1");
  nameCell.value = emp.name;
  nameCell.font = { bold: true, size: 14, name: "Calibri" };

  const hireDateCell = ws.getCell("R2");
  hireDateCell.value = `Hire Date: ${emp.hireDate}`;
  hireDateCell.font = { size: 11, name: "Calibri" };

  // ── Calendar grid ──
  const ptoMap = buildPtoMap(emp.ptoEntries);
  writeCalendarGrid(ws, emp, year, ptoMap);

  // ── Legend section ──
  writeLegend(ws);

  // ── PTO Calculation section ──
  writePtoCalculation(ws, emp);

  // ── Acknowledgement columns ──
  writeAcknowledgements(ws, emp, year);
}

/**
 * Write the 12-month calendar grid.
 *
 * Layout: 4 rows × 3 columns of month blocks.
 * Each month block: 7 columns (Sun–Sat), up to 6 date rows + 1 header + 1 dow.
 *
 * Column layout (1-indexed):
 *   Months Jan–Apr: columns 2–8
 *   Months May–Aug: columns 10–16
 *   Months Sep–Dec: columns 18–24
 *
 * Row layout (1-indexed):
 *   Row-group 0: rows 4–12  (header row 4, dow row 5, dates rows 6–11)
 *   Row-group 1: rows 13–21 (header row 13, dow row 14, dates rows 15–20)
 *   Row-group 2: rows 22–30 (header row 22, dow row 23, dates rows 24–29)
 *   Row-group 3: rows 31–39 (header row 31, dow row 32, dates rows 33–38)
 */
function writeCalendarGrid(
  ws: ExcelJS.Worksheet,
  emp: EmployeeReportData,
  year: number,
  ptoMap: Map<string, ReportPtoEntry>,
): void {
  // Reconfigure column widths for 7-column month blocks
  // Col A (1): spacer width 2
  // Month block cols: width 4
  // Gap cols (9, 17): width 1.5
  ws.getColumn(1).width = 2;
  for (let c = 2; c <= 8; c++) ws.getColumn(c).width = 4;
  ws.getColumn(9).width = 1.5;
  for (let c = 10; c <= 16; c++) ws.getColumn(c).width = 4;
  ws.getColumn(17).width = 1.5;
  for (let c = 18; c <= 24; c++) ws.getColumn(c).width = 4;
  ws.getColumn(25).width = 1.5; // gap before legend
  ws.getColumn(26).width = 1.5;
  ws.getColumn(27).width = 16; // legend column AA

  // Column-group start columns
  const colStarts = [2, 10, 18];
  // Row-group header rows
  const rowGroupStarts = [4, 13, 22, 31];

  for (let month = 1; month <= 12; month++) {
    const m0 = month - 1;
    const colGroup = Math.floor(m0 / 4);
    const rowGroup = m0 % 4;

    const startCol = colStarts[colGroup];
    const headerRow = rowGroupStarts[rowGroup];
    const dowRow = headerRow + 1;
    const dateStartRow = headerRow + 2;

    // ── Month header (merged across 7 columns) ──
    const headerCell = ws.getCell(headerRow, startCol);
    headerCell.value = MONTH_NAMES[month - 1];
    headerCell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      name: "Calibri",
      size: 11,
    };
    headerCell.fill = HEADER_FILL;
    headerCell.alignment = { horizontal: "center" };
    ws.mergeCells(headerRow, startCol, headerRow, startCol + 6);

    // ── Day-of-week headers ──
    for (let d = 0; d < 7; d++) {
      const cell = ws.getCell(dowRow, startCol + d);
      cell.value = DAY_NAMES[d];
      cell.font = { size: 9, name: "Calibri", color: { argb: "FF555555" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEAF2F8" },
      };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    }

    // ── Date cells ──
    const daysInMonth = getDaysInMonth(year, month);
    // Day-of-week for the 1st of the month (0=Sun, 6=Sat)
    const firstDow = new Date(year, month - 1, 1).getDay();

    let row = dateStartRow;
    let col = startCol + firstDow;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
      const dow = (firstDow + day - 1) % 7;
      const cell = ws.getCell(row, col);
      cell.value = day;
      cell.alignment = { horizontal: "center" };
      cell.font = { size: 10, name: "Calibri" };
      cell.border = THIN_BORDER;

      // PTO color fill
      const ptoEntry = ptoMap.get(dateStr);
      if (ptoEntry) {
        const argb = PTO_TYPE_FILLS[ptoEntry.type] || "FFFFFF00";
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb },
        };
        cell.font = {
          bold: true,
          size: 10,
          name: "Calibri",
          color: {
            argb:
              ptoEntry.type === "Sick" || ptoEntry.type === "Jury Duty"
                ? "FFFFFFFF"
                : "FF333333",
          },
        };
        // Add PTO type as cell note/comment
        cell.note = `${ptoEntry.type}: ${ptoEntry.hours}h`;
      } else if (dow === 0 || dow === 6) {
        // Weekend styling
        cell.fill = WEEKEND_FILL;
        cell.font = WEEKEND_FONT;
      }

      // Advance to next cell
      col++;
      if (dow === 6) {
        // End of week — move to next row
        row++;
        col = startCol;
      }
    }
  }
}

/**
 * Write the legend section in column AA (column 27).
 */
function writeLegend(ws: ExcelJS.Worksheet): void {
  const legendCol = 27; // AA
  const startRow = 8;

  // Header
  const headerCell = ws.getCell(startRow, legendCol);
  headerCell.value = "Legend";
  headerCell.font = { bold: true, size: 12, name: "Calibri" };

  // Legend entries
  for (let i = 0; i < LEGEND_ENTRIES.length; i++) {
    const entry = LEGEND_ENTRIES[i];
    const row = startRow + 1 + i;
    const cell = ws.getCell(row, legendCol);
    cell.value = entry.label;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: entry.argb },
    };
    cell.font = {
      size: 11,
      name: "Calibri",
      color: {
        argb:
          entry.label === "Sick" ||
          entry.label === "Jury Duty" ||
          entry.label === "Planned PTO"
            ? "FFFFFFFF"
            : "FF333333",
      },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF999999" } },
      left: { style: "thin", color: { argb: "FF999999" } },
      bottom: { style: "thin", color: { argb: "FF999999" } },
      right: { style: "thin", color: { argb: "FF999999" } },
    };
  }
}

/**
 * Write the PTO Calculation Section.
 *
 * Layout (matching legacy positions):
 *   Row 40: "PTO CALCULATION SECTION" header (merged B–W)
 *   Rows 41–42: Column headers (two-row structure)
 *   Rows 43–54: Monthly data (January–December)
 */
function writePtoCalculation(
  ws: ExcelJS.Worksheet,
  emp: EmployeeReportData,
): void {
  const sectionHeaderRow = 40;
  const colHeaderRow1 = 41;
  const colHeaderRow2 = 42;
  const dataStartRow = 43;

  // ── Section header ──
  const sectionCell = ws.getCell(sectionHeaderRow, 2);
  sectionCell.value = "PTO CALCULATION SECTION";
  sectionCell.font = { bold: true, size: 13, name: "Calibri" };
  sectionCell.alignment = { horizontal: "center" };
  ws.mergeCells(sectionHeaderRow, 2, sectionHeaderRow, 23);

  // ── Column headers ──
  // Define header blocks: [label, startCol, endCol]
  const headers: [string, number, number][] = [
    ["Month", 2, 3],
    ["Work Days\nin Month", 4, 5],
    ["Daily\nRate", 6, 7],
    ["Accrued\nPTO", 8, 9],
    ["Previous Month's\nCarryover", 11, 12],
    ["Subtotal\nPTO hours", 14, 15],
    ["PTO hours\nper Month", 17, 18],
    ["Total Available\nPTO", 20, 21],
  ];

  for (const [label, startCol, endCol] of headers) {
    const cell = ws.getCell(colHeaderRow1, startCol);
    cell.value = label;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = THIN_BORDER;

    if (startCol !== endCol) {
      ws.mergeCells(colHeaderRow1, startCol, colHeaderRow2, endCol);
    } else {
      ws.mergeCells(colHeaderRow1, startCol, colHeaderRow2, startCol);
    }

    // Fill all cells in merge range with header styling
    for (let c = startCol; c <= endCol; c++) {
      for (let r = colHeaderRow1; r <= colHeaderRow2; r++) {
        const c2 = ws.getCell(r, c);
        c2.fill = HEADER_FILL;
        c2.border = THIN_BORDER;
      }
    }
  }

  // ── Monthly data rows ──
  let totalAccrued = 0;
  let totalUsed = 0;

  for (let i = 0; i < emp.ptoCalculation.length; i++) {
    const calc = emp.ptoCalculation[i];
    const row = dataStartRow + i;

    totalAccrued += calc.accruedHours;
    totalUsed += calc.usedHours;

    // Month name (merged 2 cols)
    const monthCell = ws.getCell(row, 2);
    monthCell.value = calc.monthName;
    monthCell.font = { bold: true, size: 11, name: "Calibri" };
    monthCell.border = THIN_BORDER;
    ws.mergeCells(row, 2, row, 3);

    // Work Days (merged 2 cols)
    const wdCell = ws.getCell(row, 4);
    wdCell.value = calc.workDays;
    wdCell.numFmt = "0";
    wdCell.alignment = { horizontal: "center" };
    wdCell.border = THIN_BORDER;
    ws.mergeCells(row, 4, row, 5);

    // Daily Rate (merged 2 cols)
    const drCell = ws.getCell(row, 6);
    drCell.value = calc.dailyRate;
    drCell.numFmt = "0.00";
    drCell.alignment = { horizontal: "center" };
    drCell.border = THIN_BORDER;
    ws.mergeCells(row, 6, row, 7);

    // Accrued PTO (merged 2 cols)
    const accCell = ws.getCell(row, 8);
    accCell.value = calc.accruedHours;
    accCell.numFmt = "0.00";
    accCell.alignment = { horizontal: "center" };
    accCell.border = THIN_BORDER;
    ws.mergeCells(row, 8, row, 9);

    // Carryover (merged 2 cols)
    const coCell = ws.getCell(row, 11);
    coCell.value = calc.carryover;
    coCell.numFmt = "0.00";
    coCell.alignment = { horizontal: "center" };
    coCell.border = THIN_BORDER;
    ws.mergeCells(row, 11, row, 12);

    // Subtotal (merged 2 cols)
    const subCell = ws.getCell(row, 14);
    subCell.value = calc.subtotal;
    subCell.numFmt = "0.00";
    subCell.alignment = { horizontal: "center" };
    subCell.border = THIN_BORDER;
    ws.mergeCells(row, 14, row, 15);

    // Used PTO (merged 2 cols)
    const usedCell = ws.getCell(row, 17);
    usedCell.value = calc.usedHours;
    usedCell.numFmt = "0.0";
    usedCell.alignment = { horizontal: "center" };
    usedCell.border = THIN_BORDER;
    ws.mergeCells(row, 17, row, 18);

    // Remaining (merged 2 cols)
    const remCell = ws.getCell(row, 20);
    remCell.value = calc.remainingBalance;
    remCell.numFmt = "0.00";
    remCell.alignment = { horizontal: "center" };
    remCell.border = THIN_BORDER;
    ws.mergeCells(row, 20, row, 21);

    // Alternate row shading
    if (i % 2 === 1) {
      const shadeFill: ExcelJS.FillPattern = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFAFAFA" },
      };
      for (const c of [2, 4, 6, 8, 11, 14, 17, 20]) {
        ws.getCell(row, c).fill = shadeFill;
      }
    }
  }

  // ── Totals row ──
  const totalsRow = dataStartRow + 12;
  const totalsFill: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEAF2F8" },
  };
  const totalsFont: Partial<ExcelJS.Font> = {
    bold: true,
    size: 11,
    name: "Calibri",
  };
  const totalsBorder: Partial<ExcelJS.Borders> = {
    top: { style: "medium", color: { argb: "FF1A5276" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };

  const totalLabel = ws.getCell(totalsRow, 2);
  totalLabel.value = "Total";
  totalLabel.font = totalsFont;
  totalLabel.fill = totalsFill;
  totalLabel.border = totalsBorder;
  ws.mergeCells(totalsRow, 2, totalsRow, 3);

  const totalAccCell = ws.getCell(totalsRow, 8);
  totalAccCell.value = Math.round(totalAccrued * 100) / 100;
  totalAccCell.numFmt = "0.00";
  totalAccCell.font = totalsFont;
  totalAccCell.fill = totalsFill;
  totalAccCell.alignment = { horizontal: "center" };
  totalAccCell.border = totalsBorder;
  ws.mergeCells(totalsRow, 8, totalsRow, 9);

  const totalUsedCell = ws.getCell(totalsRow, 17);
  totalUsedCell.value = Math.round(totalUsed * 10) / 10;
  totalUsedCell.numFmt = "0.0";
  totalUsedCell.font = totalsFont;
  totalUsedCell.fill = totalsFill;
  totalUsedCell.alignment = { horizontal: "center" };
  totalUsedCell.border = totalsBorder;
  ws.mergeCells(totalsRow, 17, totalsRow, 18);

  const lastRemaining =
    emp.ptoCalculation.length > 0
      ? emp.ptoCalculation[emp.ptoCalculation.length - 1].remainingBalance
      : 0;
  const totalRemCell = ws.getCell(totalsRow, 20);
  totalRemCell.value = lastRemaining;
  totalRemCell.numFmt = "0.00";
  totalRemCell.font = totalsFont;
  totalRemCell.fill = totalsFill;
  totalRemCell.alignment = { horizontal: "center" };
  totalRemCell.border = totalsBorder;
  ws.mergeCells(totalsRow, 20, totalsRow, 21);

  // Fill empty totals cells with styling
  for (const c of [4, 6, 11, 14]) {
    const cell = ws.getCell(totalsRow, c);
    cell.fill = totalsFill;
    cell.border = totalsBorder;
    ws.mergeCells(totalsRow, c, totalsRow, c + 1);
  }
}

/**
 * Write acknowledgement columns.
 *
 * Employee acknowledgements in columns 23–24, admin in columns 25–26,
 * aligned with PTO calculation data rows (43–54).
 */
function writeAcknowledgements(
  ws: ExcelJS.Worksheet,
  emp: EmployeeReportData,
  year: number,
): void {
  const colHeaderRow = 41;
  const dataStartRow = 43;

  // ── Column headers ──
  const empAckHeader = ws.getCell(colHeaderRow, 23);
  empAckHeader.value = "Employee\nAck";
  empAckHeader.font = HEADER_FONT;
  empAckHeader.fill = HEADER_FILL;
  empAckHeader.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  empAckHeader.border = THIN_BORDER;
  ws.mergeCells(colHeaderRow, 23, colHeaderRow + 1, 23);

  const admAckHeader = ws.getCell(colHeaderRow, 24);
  admAckHeader.value = "Admin\nAck";
  admAckHeader.font = HEADER_FONT;
  admAckHeader.fill = HEADER_FILL;
  admAckHeader.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  admAckHeader.border = THIN_BORDER;
  ws.mergeCells(colHeaderRow, 24, colHeaderRow + 1, 24);

  // Widen ack columns
  ws.getColumn(23).width = 10;
  ws.getColumn(24).width = 10;

  // ── Data rows ──
  for (let m = 1; m <= 12; m++) {
    const row = dataStartRow + (m - 1);
    const monthStr = `${year}-${pad2(m)}`;

    // Employee acknowledgement
    const empAck = emp.acknowledgements.find((a) => a.month === monthStr);
    const empCell = ws.getCell(row, 23);
    if (empAck) {
      empCell.value = emp.identifier.split("@")[0].toUpperCase() || "✓";
      empCell.font = {
        bold: true,
        color: { argb: "FF27AE60" },
        size: 11,
        name: "Calibri",
      };
    } else {
      empCell.value = "—";
      empCell.font = { color: { argb: "FFC0392B" }, size: 11, name: "Calibri" };
    }
    empCell.alignment = { horizontal: "center" };
    empCell.border = THIN_BORDER;

    // Admin acknowledgement
    const admAck = emp.adminAcknowledgements.find((a) => a.month === monthStr);
    const admCell = ws.getCell(row, 24);
    if (admAck) {
      admCell.value = admAck.adminName;
      admCell.font = {
        bold: true,
        color: { argb: "FF27AE60" },
        size: 11,
        name: "Calibri",
      };
    } else {
      admCell.value = "—";
      admCell.font = { color: { argb: "FFC0392B" }, size: 11, name: "Calibri" };
    }
    admCell.alignment = { horizontal: "center" };
    admCell.border = THIN_BORDER;
  }
}

// ── Public API ──

/**
 * Generate an Excel workbook as a Buffer containing one worksheet per employee.
 */
export async function generateExcelReport(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DWP Hours Tracker";
  workbook.created = new Date(data.generatedAt);

  for (const emp of data.employees) {
    // Excel sheet name limit: 31 characters, no special chars
    const sheetName = emp.name.slice(0, 31).replace(/[[\]*?/\\]/g, "_");
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: false }],
    });

    populateEmployeeSheet(ws, emp, data.year);
  }

  // If no employees, add a placeholder sheet
  if (data.employees.length === 0) {
    const ws = workbook.addWorksheet("No Data");
    ws.getCell("A1").value = `No employee data found for ${data.year}.`;
    ws.getCell("A1").font = {
      size: 14,
      name: "Calibri",
      color: { argb: "FF888888" },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

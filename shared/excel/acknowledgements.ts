/**
 * Excel Parsing — Acknowledgement Parsing & Generation
 *
 * Functions for reading acknowledgement marks from worksheets and
 * generating import acknowledgement records based on reconciliation results.
 */

import type ExcelJS from "exceljs";
import type {
  ImportedAcknowledgement,
  ImportedPtoEntry,
  PtoCalcRow,
} from "./types.js";
import {
  ADMIN_ACK_COL,
  COLUMN_S_TRACKED_TYPES,
  EMP_ACK_COL,
  pad2,
} from "./types.js";
import { findPtoCalcStartRow } from "./ptoCalcParsing.js";

/**
 * Parse acknowledgement marks from the worksheet.
 */
export function parseAcknowledgements(
  ws: ExcelJS.Worksheet,
  year: number,
): ImportedAcknowledgement[] {
  const acks: ImportedAcknowledgement[] = [];
  const startRow = findPtoCalcStartRow(ws);

  for (let m = 1; m <= 12; m++) {
    const row = startRow + (m - 1);
    const monthStr = `${year}-${pad2(m)}`;

    const empCell = ws.getCell(row, EMP_ACK_COL);
    if (empCell.value?.toString().trim() === "✓") {
      acks.push({ month: monthStr, type: "employee" });
    }

    const admCell = ws.getCell(row, ADMIN_ACK_COL);
    if (admCell.value?.toString().trim() === "✓") {
      acks.push({ month: monthStr, type: "admin" });
    }
  }

  return acks;
}

/**
 * Generate import acknowledgement records by comparing final calendar
 * totals against declared PTO Calc totals.
 */
export function generateImportAcknowledgements(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  year: number,
  sheetName: string,
): ImportedAcknowledgement[] {
  const acks: ImportedAcknowledgement[] = [];

  for (const calc of ptoCalcRows) {
    const monthStr = `${year}-${pad2(calc.month)}`;
    const monthPad = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const monthEntries = entries.filter(
      (e) =>
        e.date.substring(5, 7) === monthPad &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const calendarTotal = monthEntries.reduce((sum, e) => sum + e.hours, 0);
    const delta = Math.round((calendarTotal - declaredTotal) * 100) / 100;

    if (Math.abs(delta) <= 0.1) {
      acks.push({ month: monthStr, type: "employee", status: null });
      acks.push({ month: monthStr, type: "admin", status: null });
    } else {
      const sign = delta > 0 ? "+" : "";
      const note =
        `Calendar shows ${calendarTotal}h but column S declares ${declaredTotal}h ` +
        `(Δ=${sign}${delta}h) for ${sheetName} month ${calc.month}. Requires manual review.`;
      acks.push({ month: monthStr, type: "employee", status: "warning", note });
    }
  }

  return acks;
}

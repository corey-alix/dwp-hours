/**
 * Excel Parsing — PTO Calculation Section Parsing
 *
 * Functions for locating and parsing the PTO Calculation section
 * of the worksheet, including used hours per month and carryover.
 */

import type ExcelJS from "exceljs";
import type { PtoCalcRow } from "./types.js";
import { PTO_CALC_DATA_START_ROW, getCellNumericValue } from "./types.js";

/**
 * Find the PTO Calculation data start row.
 */
export function findPtoCalcStartRow(ws: ExcelJS.Worksheet): number {
  for (const candidate of [PTO_CALC_DATA_START_ROW, 43]) {
    const cell = ws.getCell(candidate, 2);
    const val = cell.value?.toString().trim() || "";
    if (val.toLowerCase() === "january") return candidate;
  }
  throw new Error(
    `PTO Calc validation failed on sheet "${ws.name}": ` +
      `could not find "January" at B42 or B43.`,
  );
}

/**
 * Parse the used-hours column (S = 19) from the PTO Calculation section.
 */
export function parsePtoCalcUsedHours(ws: ExcelJS.Worksheet): PtoCalcRow[] {
  const startRow = findPtoCalcStartRow(ws);
  const rows: PtoCalcRow[] = [];
  for (let i = 0; i < 12; i++) {
    const row = startRow + i;
    const cell = ws.getCell(row, 19); // Column S
    const val = cell.value;
    let hours = 0;
    if (typeof val === "number") {
      hours = val;
    } else if (val !== null && val !== undefined) {
      const parsed = parseFloat(val.toString());
      hours = isNaN(parsed) ? 0 : parsed;
    }
    rows.push({ month: i + 1, usedHours: hours });
  }
  return rows;
}

/**
 * Parse the carryover hours from cell L42 (or dynamically found start row).
 */
export function parseCarryoverHours(ws: ExcelJS.Worksheet): number {
  const startRow = findPtoCalcStartRow(ws);
  const cell = ws.getCell(startRow, 12); // Column L, January row
  const val = getCellNumericValue(cell);
  return val ?? 0;
}

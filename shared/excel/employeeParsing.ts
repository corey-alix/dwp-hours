/**
 * Excel Parsing — Employee Info Parsing
 *
 * Functions for detecting employee sheets, extracting employee metadata,
 * generating identifiers, and computing PTO rates.
 */

import type ExcelJS from "exceljs";
import { PTO_EARNING_SCHEDULE, getEffectivePtoRate } from "../businessRules.js";
import { smartParseDate } from "../dateUtils.js";
import type { EmployeeImportInfo } from "./types.js";
import { findPtoCalcStartRow, parseCarryoverHours } from "./ptoCalcParsing.js";

/**
 * Detect whether a worksheet is an employee sheet.
 */
export function isEmployeeSheet(ws: ExcelJS.Worksheet): boolean {
  for (let c = 18; c <= 24; c++) {
    const cell = ws.getCell(2, c);
    const val = cell.text || "";
    if (val.toLowerCase().includes("hire date")) return true;
  }
  return false;
}

/**
 * Parse employee metadata from a worksheet.
 */
export function parseEmployeeInfo(ws: ExcelJS.Worksheet): {
  info: EmployeeImportInfo;
  resolved: string[];
} {
  const name = ws.name.trim();
  const resolved: string[] = [];

  const yearCell = ws.getCell("B2");
  let year = 0;
  if (typeof yearCell.value === "number") {
    year = yearCell.value;
  } else if (yearCell.value) {
    year = parseInt(yearCell.value.toString(), 10) || 0;
  }

  const hireDateCell = ws.getCell("R2");
  let hireDate = "";
  const hireDateStr = hireDateCell.text || "";
  if (hireDateStr) {
    const match = hireDateStr.match(/hire\s*date:\s*(.+)/i);
    if (match) {
      let datePart = match[1].trim();
      const parsed = smartParseDate(datePart);
      if (parsed) {
        hireDate = parsed;
      } else {
        // Strip trailing parenthetical content like (FT), (PT)
        const stripped = datePart.replace(/\s*\(.*\)\s*$/, "").trim();
        if (stripped !== datePart) {
          const parsedStripped = smartParseDate(stripped);
          if (parsedStripped) {
            hireDate = parsedStripped;
            resolved.push(
              `Sheet "${name}": Hire date "${datePart}" contained parenthetical suffix — parsed as ${parsedStripped}`,
            );
          }
        }
      }
    }
  }

  const carryoverHours = parseCarryoverHours(ws);

  let spreadsheetPtoRate = 0;
  try {
    const startRow = findPtoCalcStartRow(ws);
    const decemberRow = startRow + 11;
    const rateCell = ws.getCell(decemberRow, 6);
    const rateVal = rateCell.value;
    if (typeof rateVal === "number") {
      spreadsheetPtoRate = rateVal;
    } else if (rateVal !== null && rateVal !== undefined) {
      const parsed = parseFloat(rateVal.toString());
      spreadsheetPtoRate = isNaN(parsed) ? 0 : parsed;
    }
  } catch {
    // findPtoCalcStartRow may throw if section not found
  }

  return {
    info: { name, hireDate, year, carryoverHours, spreadsheetPtoRate },
    resolved,
  };
}

/**
 * Generate an email identifier from an employee name.
 */
export function generateIdentifier(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "unknown@example.com";
  const firstName = parts[0].toLowerCase();
  const lastName =
    parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  const identifier = lastName
    ? `${firstName}-${lastName}@example.com`
    : `${firstName}@example.com`;
  return identifier;
}

/**
 * Compute the correct PTO rate from the hire date and year.
 */
export function computePtoRate(info: EmployeeImportInfo): {
  rate: number;
  warning: string | null;
} {
  if (!info.hireDate || !info.year) {
    const rate = info.spreadsheetPtoRate || PTO_EARNING_SCHEDULE[0].dailyRate;
    return { rate, warning: null };
  }

  const asOfDate = `${info.year}-12-31`;
  const tier = getEffectivePtoRate(info.hireDate, asOfDate);
  const computedRate = tier.dailyRate;

  if (
    info.spreadsheetPtoRate > 0 &&
    Math.abs(info.spreadsheetPtoRate - computedRate) > 0.005
  ) {
    return {
      rate: computedRate,
      warning:
        `PTO rate mismatch for "${info.name}": ` +
        `spreadsheet=${info.spreadsheetPtoRate}, ` +
        `computed=${computedRate} (hired ${info.hireDate}, year ${info.year}). ` +
        `Using computed value.`,
    };
  }

  return { rate: computedRate, warning: null };
}

/**
 * Excel PTO Spreadsheet Importer
 *
 * Reads an exported PTO workbook (produced by excelReport.ts) and
 * upserts employee data, PTO entries, and acknowledgements into the
 * database. Each employee worksheet is parsed for calendar colors,
 * PTO calculation rows, and acknowledgement marks.
 *
 * References the `pto-spreadsheet-layout` skill for exact cell coordinates.
 */

import ExcelJS from "exceljs";
import type { DataSource, Repository } from "typeorm";
import type { PTOType } from "../../shared/businessRules.js";
import {
  validateDateString,
  validatePTOType,
  VALIDATION_MESSAGES,
  MONTH_NAMES,
  PTO_EARNING_SCHEDULE,
  getEffectivePtoRate,
} from "../../shared/businessRules.js";
import {
  getDaysInMonth,
  formatDate,
  smartParseDate,
} from "../../shared/dateUtils.js";
import { Employee } from "../entities/Employee.js";
import { PtoEntry } from "../entities/PtoEntry.js";
import { Acknowledgement } from "../entities/Acknowledgement.js";
import { AdminAcknowledgement } from "../entities/AdminAcknowledgement.js";

// ── Constants ──

/** Calendar grid column-group start columns (1-indexed). */
const COL_STARTS = [2, 10, 18];

/** Calendar grid row-group header rows. */
const ROW_GROUP_STARTS = [4, 13, 22, 31];

/** Legend column (Z = 26). */
const LEGEND_COL = 26; // column Z

/** Max rows to scan when searching for dynamic positions. */
const LEGEND_SCAN_MAX_ROW = 30;

/** PTO Calculation section: assumed data start row (January). */
const PTO_CALC_DATA_START_ROW = 42;

/** Acknowledgement columns. */
const EMP_ACK_COL = 24; // X
const ADMIN_ACK_COL = 25; // Y

/** Superscript Unicode map for decoding partial-day decorations. */
const SUPERSCRIPT_TO_DIGIT: Record<string, number> = {
  "\u2070": 0,
  "\u00B9": 1,
  "\u00B2": 2,
  "\u00B3": 3,
  "\u2074": 4,
  "\u2075": 5,
  "\u2076": 6,
  "\u2077": 7,
  "\u2078": 8,
  "\u2079": 9,
};

/** Legend label → canonical PTOType mapping. */
const LEGEND_LABEL_TO_PTO_TYPE: Record<string, PTOType> = {
  Sick: "Sick",
  "Full PTO": "PTO",
  "Partial PTO": "PTO",
  "Planned PTO": "PTO",
  Bereavement: "Bereavement",
  "Jury Duty": "Jury Duty",
};

/** Maximum Euclidean RGB distance for approximate color matching. */
const MAX_COLOR_DISTANCE = 100;

/**
 * Standard Office 2010 theme palette.
 * Used as fallback when workbook theme XML is unavailable (e.g., streaming).
 * Maps theme index → ARGB string.
 */
const DEFAULT_OFFICE_THEME: Map<number, string> = new Map([
  [0, "FFFFFFFF"], // lt1 (window)
  [1, "FF000000"], // dk1 (windowText)
  [2, "FFEEECE1"], // lt2
  [3, "FF1F497D"], // dk2
  [4, "FF4F81BD"], // accent1
  [5, "FFC0504D"], // accent2
  [6, "FF9BBB59"], // accent3
  [7, "FF8064A2"], // accent4
  [8, "FF4BACC6"], // accent5
  [9, "FFF79646"], // accent6
  [10, "FF0000FF"], // hlink
  [11, "FF800080"], // folHlink
]);

// ── Theme Color Resolution ──

/**
 * Parse theme colors from the workbook's theme1 XML.
 * Extracts the clrScheme element and maps theme indices to ARGB strings.
 * The Excel theme index order is:
 *   0=lt1, 1=dk1, 2=lt2, 3=dk2, 4–9=accent1–6, 10=hlink, 11=folHlink
 * but the XML element order in <a:clrScheme> is:
 *   dk1, lt1, dk2, lt2, accent1–6, hlink, folHlink
 */
export function parseThemeColors(themeXml: string): Map<number, string> {
  const map = new Map<number, string>();

  // XML element order → theme index mapping
  const xmlOrderToThemeIndex = [
    1, // dk1 → theme 1
    0, // lt1 → theme 0
    3, // dk2 → theme 3
    2, // lt2 → theme 2
    4,
    5,
    6,
    7,
    8,
    9, // accent1–6 → themes 4–9
    10, // hlink → theme 10
    11, // folHlink → theme 11
  ];

  // Extract all srgbClr and sysClr values from the clrScheme
  const clrSchemeMatch = themeXml.match(
    /<a:clrScheme[^>]*>(.*?)<\/a:clrScheme>/s,
  );
  if (!clrSchemeMatch) return map;

  const colorElements = clrSchemeMatch[1];
  // Match each color entry: either <a:srgbClr val="RRGGBB"/> or <a:sysClr ... lastClr="RRGGBB"/>
  const colorRegex =
    /<a:(?:dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)>.*?(?:<a:srgbClr\s+val="([A-Fa-f0-9]{6})"\s*\/>|<a:sysClr[^>]*lastClr="([A-Fa-f0-9]{6})"[^>]*\/>).*?<\/a:(?:dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)>/gs;

  let match;
  let idx = 0;
  while ((match = colorRegex.exec(colorElements)) !== null && idx < 12) {
    const rgb = (match[1] || match[2] || "").toUpperCase();
    if (rgb && idx < xmlOrderToThemeIndex.length) {
      map.set(xmlOrderToThemeIndex[idx], `FF${rgb}`);
    }
    idx++;
  }

  return map;
}

/**
 * Apply an Excel tint to an ARGB color string.
 * Tint > 0 lightens toward white; tint < 0 darkens toward black.
 */
function applyTint(argb: string, tint: number): string {
  if (tint === 0) return argb;
  const r = parseInt(argb.substring(2, 4), 16);
  const g = parseInt(argb.substring(4, 6), 16);
  const b = parseInt(argb.substring(6, 8), 16);

  const apply = (c: number) => {
    if (tint > 0) return Math.round(c + (255 - c) * tint);
    return Math.round(c * (1 + tint));
  };

  const rr = Math.max(0, Math.min(255, apply(r)));
  const gg = Math.max(0, Math.min(255, apply(g)));
  const bb = Math.max(0, Math.min(255, apply(b)));

  const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `${argb.substring(0, 2)}${hex(rr)}${hex(gg)}${hex(bb)}`;
}

/**
 * Resolve an ExcelJS color object to an ARGB string.
 * Handles explicit ARGB, theme-indexed colors (with optional tint),
 * and falls back to undefined if unresolvable.
 */
export function resolveColorToARGB(
  color: { argb?: string; theme?: number; tint?: number } | undefined,
  themeColors: Map<number, string>,
): string | undefined {
  if (!color) return undefined;
  if (color.argb) return color.argb.toUpperCase();
  if (color.theme !== undefined) {
    const baseColor = themeColors.get(color.theme);
    if (baseColor) {
      return applyTint(baseColor, color.tint || 0);
    }
  }
  return undefined;
}

/**
 * Euclidean distance between two ARGB color strings (ignoring alpha).
 */
export function colorDistance(argb1: string, argb2: string): number {
  const r1 = parseInt(argb1.substring(2, 4), 16);
  const g1 = parseInt(argb1.substring(4, 6), 16);
  const b1 = parseInt(argb1.substring(6, 8), 16);
  const r2 = parseInt(argb2.substring(2, 4), 16);
  const g2 = parseInt(argb2.substring(4, 6), 16);
  const b2 = parseInt(argb2.substring(6, 8), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Find the closest legend color within MAX_COLOR_DISTANCE.
 * Returns the PTOType for the best match, or undefined if none is close enough.
 *
 * Skips approximate matching for near-neutral colors (low chroma) to avoid
 * false positives on weekend/header background cells. Chroma is measured as
 * the difference between the max and min RGB channels — colors with chroma
 * below MIN_CHROMA_FOR_APPROX (like #F0F0F0 gray or #EAF2F8 light blue)
 * are only matched via the exact-match path that runs before this function.
 */
const MIN_CHROMA_FOR_APPROX = 40;

export function findClosestLegendColor(
  argb: string,
  legend: Map<string, PTOType>,
): PTOType | undefined {
  // Extract RGB from the AARRGGBB string
  const r = parseInt(argb.substring(2, 4), 16);
  const g = parseInt(argb.substring(4, 6), 16);
  const b = parseInt(argb.substring(6, 8), 16);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (chroma < MIN_CHROMA_FOR_APPROX) return undefined;

  let bestType: PTOType | undefined;
  let bestDist = MAX_COLOR_DISTANCE;
  for (const [legendArgb, ptoType] of legend) {
    const dist = colorDistance(argb, legendArgb);
    if (dist < bestDist) {
      bestDist = dist;
      bestType = ptoType;
    }
  }
  return bestType;
}

/**
 * Extract the plain-text content of a cell's note/comment.
 * Handles string notes and rich-text note objects.
 */
export function extractCellNoteText(cell: ExcelJS.Cell): string {
  if (!cell.note) return "";
  if (typeof cell.note === "string") return cell.note;
  if ((cell.note as any)?.texts) {
    return (cell.note as any).texts.map((t: any) => t.text).join("");
  }
  return "";
}

/**
 * Maximum hours a single PTO entry can represent (sanity cap).
 * Rejects parsed values above this threshold to prevent false positives
 * from note text like "MD360" or other non-hours numeric content.
 */
const MAX_SINGLE_ENTRY_HOURS = 24;

/**
 * Try to parse hours from a note string.
 *
 * First tries a strict pattern requiring a unit suffix (hrs/hours/h) to
 * avoid false positives from time references like "1PM" or "12:30".
 * Falls back to extracting the first standalone bare number if the strict
 * pattern fails. The bare-number fallback requires word boundaries to
 * avoid matching digits embedded in codes like "MD360".
 *
 * All parsed values are capped at MAX_SINGLE_ENTRY_HOURS (24) to reject
 * obviously non-hours numbers.
 */
export function parseHoursFromNote(note: string): number | undefined {
  // Strict pattern: number followed by a time-unit suffix (h, hr, hrs, hour, hours)
  const strict = note.match(/(\d+(?:\.\d+)?|\.\d+)\s*(?:hours?|hrs?|h)\b/i);
  if (strict) {
    const val = parseFloat(strict[1]);
    if (!isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS) return val;
  }

  // Fallback: first standalone bare number (word boundaries to avoid "MD360")
  const bare = note.match(/(?<![A-Za-z])(\d+(?:\.\d+)?|\.\d+)(?![A-Za-z\d])/);
  if (bare) {
    const val = parseFloat(bare[1]);
    if (!isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS) return val;
  }
  return undefined;
}

// ── Result types ──

export interface ImportedPtoEntry {
  date: string;
  type: PTOType;
  hours: number;
  notes?: string;
  /** True when the calendar cell matched a "Partial PTO" legend color. */
  isPartialPtoColor?: boolean;
}

export interface ImportedAcknowledgement {
  month: string; // YYYY-MM
  type: "employee" | "admin";
}

export interface EmployeeImportInfo {
  name: string;
  hireDate: string;
  year: number;
  carryoverHours: number;
  /** PTO daily rate read from the spreadsheet (column F, December row). */
  spreadsheetPtoRate: number;
}

export interface SheetImportResult {
  employee: EmployeeImportInfo;
  ptoEntries: ImportedPtoEntry[];
  acknowledgements: ImportedAcknowledgement[];
  warnings: string[];
}

export interface ImportResult {
  employeesProcessed: number;
  employeesCreated: number;
  ptoEntriesUpserted: number;
  acknowledgementsSynced: number;
  warnings: string[];
  perEmployee: {
    name: string;
    employeeId: number;
    ptoEntries: number;
    acknowledgements: number;
    created: boolean;
  }[];
}

// ── Phase 1: Legend & Color Parser ──

/**
 * Find the row containing the "Legend" header in column Z.
 * Scans rows 1–30 looking for a cell whose text is "Legend".
 * Returns the header row number, or -1 if not found.
 */
export function findLegendHeaderRow(ws: ExcelJS.Worksheet): number {
  for (let r = 1; r <= LEGEND_SCAN_MAX_ROW; r++) {
    const cell = ws.getCell(r, LEGEND_COL);
    const val = cell.value?.toString().trim() || "";
    if (val.toLowerCase() === "legend") return r;
  }
  return -1;
}

/**
 * Parse the legend section from column Z to build a color→PTOType map.
 * Dynamically finds the "Legend" header row, then reads up to 10 entry
 * rows below it. Resolves theme-indexed colors using the provided theme map.
 * Throws if "Legend" header is not found.
 */
export function parseLegend(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): Map<string, PTOType> {
  const colorMap = new Map<string, PTOType>();

  const headerRow = findLegendHeaderRow(ws);
  if (headerRow < 0) {
    throw new Error(
      `Legend header not found in column Z on sheet "${ws.name}"`,
    );
  }

  // Scan up to 10 rows after the header for legend entries
  const maxEntries = 10;
  for (let i = 1; i <= maxEntries; i++) {
    const row = headerRow + i;
    const cell = ws.getCell(row, LEGEND_COL);
    const label = cell.value?.toString().trim() || "";
    if (!label) break; // stop at first blank row

    const ptoType = LEGEND_LABEL_TO_PTO_TYPE[label];
    if (!ptoType) continue;

    const fill = cell.fill as ExcelJS.FillPattern | undefined;
    if (fill?.type === "pattern") {
      const argb = resolveColorToARGB(fill.fgColor as any, themeColors);
      if (argb) {
        colorMap.set(argb, ptoType);
      }
    }
  }

  return colorMap;
}

/**
 * Scan the legend section and return the set of ARGB color strings
 * whose label is "Partial PTO".  Used to tag calendar entries so
 * `adjustPartialDays` can identify them for back-calculation.
 */
export function parsePartialPtoColors(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): Set<string> {
  const colors = new Set<string>();
  const headerRow = findLegendHeaderRow(ws);
  if (headerRow < 0) return colors;

  const maxEntries = 10;
  for (let i = 1; i <= maxEntries; i++) {
    const row = headerRow + i;
    const cell = ws.getCell(row, LEGEND_COL);
    const label = cell.value?.toString().trim() || "";
    if (!label) break;
    if (label !== "Partial PTO") continue;

    const fill = cell.fill as ExcelJS.FillPattern | undefined;
    if (fill?.type === "pattern") {
      const argb = resolveColorToARGB(fill.fgColor as any, themeColors);
      if (argb) colors.add(argb);
    }
  }
  return colors;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Info about a calendar cell that has a note but no legend color match. */
export interface UnmatchedNotedCell {
  date: string;
  note: string;
}

/** Info about a calendar cell with a "worked" note and no legend color match. */
export interface WorkedCell {
  date: string;
  note: string;
}

/** Result of parsing the calendar grid. */
export interface CalendarParseResult {
  entries: ImportedPtoEntry[];
  unmatchedNotedCells: UnmatchedNotedCell[];
  workedCells: WorkedCell[];
  warnings: string[];
}

/**
 * Extract the numeric value from a cell, handling plain numbers,
 * formula results, and string representations.
 */
function getCellNumericValue(cell: ExcelJS.Cell): number | undefined {
  const v = cell.value;
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }
  // Formula result object: { formula: string, result: number|string, ... }
  if (typeof v === "object" && "result" in v) {
    const r = (v as { result: unknown }).result;
    if (typeof r === "number") return r;
    if (typeof r === "string") {
      const n = Number(r);
      return isNaN(n) ? undefined : n;
    }
  }
  return undefined;
}

/** Maximum rows to scan above/below expected position when searching for day 1. */
const DAY1_SCAN_RANGE = 3;

/**
 * Parse the 12-month calendar grid from a worksheet.
 * Walks each month block, checks cell fill colors against the legend
 * using exact match, theme-color resolution, and approximate matching.
 * For each month, verifies day 1 is in the expected cell position. If
 * not found, scans nearby rows to detect and recover from row offsets
 * (e.g., extra blank rows in legacy spreadsheets).
 * Returns PTO entries found (defaulting to 8 hours each), a list
 * of unmatched cells that have notes (for reconciliation), and warnings.
 */
export function parseCalendarGrid(
  ws: ExcelJS.Worksheet,
  year: number,
  legend: Map<string, PTOType>,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
  partialPtoColors: Set<string> = new Set(),
): CalendarParseResult {
  const entries: ImportedPtoEntry[] = [];
  const unmatchedNotedCells: UnmatchedNotedCell[] = [];
  const workedCells: WorkedCell[] = [];
  const warnings: string[] = [];

  for (let month = 1; month <= 12; month++) {
    const m0 = month - 1;
    const colGroup = Math.floor(m0 / 4);
    const rowGroup = m0 % 4;

    const startCol = COL_STARTS[colGroup];
    const headerRow = ROW_GROUP_STARTS[rowGroup];
    const expectedDateStartRow = headerRow + 2;

    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = new Date(year, month - 1, 1).getDay();

    // ── Day-1 verification ──
    const expectedDay1Col = startCol + firstDow;
    const expectedDay1Cell = ws.getCell(expectedDateStartRow, expectedDay1Col);
    const expectedDay1Value = getCellNumericValue(expectedDay1Cell);

    let dateStartRow = expectedDateStartRow;

    if (expectedDay1Value === 1) {
      // Day 1 is where we expect it — no adjustment needed
    } else {
      // Day 1 not at expected position — scan nearby rows
      const monthName = MONTH_NAMES[month - 1];
      warnings.push(
        `Sheet "${ws.name}" ${monthName}: day 1 not found at expected row ${expectedDateStartRow}, col ${expectedDay1Col}. Scanning nearby rows...`,
      );

      let foundRow: number | undefined;
      for (
        let scanRow = expectedDateStartRow - DAY1_SCAN_RANGE;
        scanRow <= expectedDateStartRow + DAY1_SCAN_RANGE;
        scanRow++
      ) {
        if (scanRow < 1 || scanRow === expectedDateStartRow) continue;
        const scanCell = ws.getCell(scanRow, expectedDay1Col);
        const scanValue = getCellNumericValue(scanCell);
        if (scanValue === 1) {
          foundRow = scanRow;
          break;
        }
      }

      if (foundRow !== undefined) {
        const offset = foundRow - expectedDateStartRow;
        const direction = offset > 0 ? "below" : "above";
        warnings.push(
          `Sheet "${ws.name}" ${monthName}: resolved row anomaly — day 1 found ${Math.abs(offset)} row(s) ${direction} expected position (row ${foundRow} instead of ${expectedDateStartRow}). Recovered successfully.`,
        );
        dateStartRow = foundRow;
      } else {
        // Cannot find day 1 at all — skip this month
        warnings.push(
          `Sheet "${ws.name}" ${monthName}: ERROR — could not locate day 1 within ±${DAY1_SCAN_RANGE} rows of expected position. Skipping month.`,
        );
        continue;
      }
    }

    let row = dateStartRow;
    let col = startCol + firstDow;

    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (firstDow + day - 1) % 7;
      const cell = ws.getCell(row, col);
      const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
      const noteText = extractCellNoteText(cell);

      // Try to match cell fill color against legend
      const fill = cell.fill as ExcelJS.FillPattern | undefined;
      let ptoType: PTOType | undefined;
      let matchMethod = "";
      let matchedArgb: string | undefined;

      if (fill?.type === "pattern") {
        // 1. Try resolving fgColor (exact ARGB or theme-resolved)
        const fgArgb = resolveColorToARGB(fill.fgColor as any, themeColors);
        if (fgArgb) {
          ptoType = legend.get(fgArgb);
          if (ptoType) {
            matchMethod = "exact";
            matchedArgb = fgArgb;
          } else {
            // 2. Try approximate color match
            ptoType = findClosestLegendColor(fgArgb, legend);
            if (ptoType) {
              matchMethod = `approximate (resolved=${fgArgb})`;
              matchedArgb = fgArgb;
            }
          }
        }

        // 3. Try bgColor as fallback
        if (!ptoType && fill.bgColor) {
          const bgArgb = resolveColorToARGB(fill.bgColor as any, themeColors);
          if (bgArgb) {
            ptoType = legend.get(bgArgb);
            if (ptoType) {
              matchMethod = "bgColor exact";
              matchedArgb = bgArgb;
            } else {
              ptoType = findClosestLegendColor(bgArgb, legend);
              if (ptoType) {
                matchMethod = `bgColor approximate (resolved=${bgArgb})`;
                matchedArgb = bgArgb;
              }
            }
          }
        }
      }

      if (ptoType) {
        // Parse hours from note if present
        let hours = 8;
        if (noteText) {
          const noteHours = parseHoursFromNote(noteText);
          if (noteHours !== undefined) {
            hours = noteHours;
          }
        }
        const entry: ImportedPtoEntry = { date: dateStr, type: ptoType, hours };
        // Tag entries whose cell color matched a "Partial PTO" legend color
        if (matchedArgb && partialPtoColors.has(matchedArgb)) {
          entry.isPartialPtoColor = true;
        }
        if (matchMethod !== "exact" && matchMethod) {
          entry.notes = `Color matched via ${matchMethod}.`;
        }
        if (noteText) {
          entry.notes =
            (entry.notes ? entry.notes + " " : "") +
            `Cell note: "${noteText.replace(/\n/g, " ")}"`;
        }
        entries.push(entry);
      } else if (noteText) {
        if (/worked/i.test(noteText)) {
          // "Worked" note on non-legend cell — track for negative PTO credit
          workedCells.push({ date: dateStr, note: noteText });
        } else {
          // Cell has a note but no color match — save for reconciliation
          unmatchedNotedCells.push({ date: dateStr, note: noteText });
        }
      } else if (fill?.type === "pattern" && (dow === 0 || dow === 6)) {
        // Non-legend-colored weekend cell without notes — potential worked day
        const cellArgb =
          resolveColorToARGB(fill.fgColor as any, themeColors) ||
          resolveColorToARGB(fill.bgColor as any, themeColors);
        if (cellArgb && cellArgb !== "FFFFFFFF" && cellArgb !== "FF000000") {
          workedCells.push({
            date: dateStr,
            note: `(inferred weekend work from cell color ${cellArgb})`,
          });
          const monthName = MONTH_NAMES[month - 1];
          warnings.push(
            `Sheet "${ws.name}" ${monthName}: non-legend colored weekend cell ` +
              `on ${dateStr} (color=${cellArgb}). Treating as potential weekend work.`,
          );
        }
      }

      // Advance to next cell
      col++;
      if (dow === 6) {
        row++;
        col = startCol;
      }
    }
  }

  return { entries, unmatchedNotedCells, workedCells, warnings };
}

// ── Phase 2: Partial-Day Detection ──

export interface PtoCalcRow {
  month: number;
  usedHours: number;
}

/**
 * Find the PTO Calculation data start row by looking for "January" in
 * column B. Tries row 42 first (legacy 2018 format), then row 43 (our
 * export format). Throws if neither row contains "January".
 */
export function findPtoCalcStartRow(ws: ExcelJS.Worksheet): number {
  for (const candidate of [PTO_CALC_DATA_START_ROW, 43]) {
    const cell = ws.getCell(candidate, 2); // Column B
    const val = cell.value?.toString().trim() || "";
    if (val.toLowerCase() === "january") return candidate;
  }
  throw new Error(
    `PTO Calc validation failed on sheet "${ws.name}": ` +
      `could not find "January" at B42 or B43. ` +
      `Check PTO Calc section layout.`,
  );
}

/**
 * Read the PTO Calculation section to get declared used hours per month.
 * Dynamically finds the start row, then reads column S for 12 months.
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
 * Read carryover_hours from column L at the PTO calc start row
 * (January's "Previous Month's Carryover").
 */
export function parseCarryoverHours(ws: ExcelJS.Worksheet): number {
  const startRow = findPtoCalcStartRow(ws);
  const cell = ws.getCell(startRow, 12); // Column L
  const val = cell.value;
  if (typeof val === "number") return val;
  if (val !== null && val !== undefined) {
    const parsed = parseFloat(val.toString());
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * PTO types tracked in the spreadsheet's "PTO hours per Month" column (S).
 * Bereavement and Jury Duty are tracked separately and excluded from
 * the column S total.
 */
const COLUMN_S_TRACKED_TYPES = new Set<string>(["PTO"]);

/**
 * Adjust PTO entry hours based on declared monthly totals.
 *
 * For each month, the PTO Calculation section declares total used PTO hours.
 * The calendar may have N full-day entries (8h each). If the sum exceeds the
 * declared total, the last entry in that month gets reduced to a partial day.
 *
 * Note: Column S only tracks PTO and Sick hours. Bereavement and Jury Duty
 * are tracked separately and excluded from the adjustment calculation.
 */
export function adjustPartialDays(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  // Group entries by month
  const byMonth = new Map<number, ImportedPtoEntry[]>();
  for (const e of entries) {
    const month = parseInt(e.date.substring(5, 7), 10);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(e);
  }

  const result: ImportedPtoEntry[] = [];
  for (const e of entries) {
    result.push({ ...e });
  }
  const warnings: string[] = [];

  for (const calc of ptoCalcRows) {
    const monthEntries = byMonth.get(calc.month);
    if (!monthEntries || monthEntries.length === 0) continue;

    // Only count PTO+Sick entries (column S excludes Bereavement/Jury Duty)
    const trackedEntries = monthEntries.filter((e) =>
      COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const calendarTotal = trackedEntries.reduce((sum, e) => sum + e.hours, 0);
    const declaredTotal = calc.usedHours;

    if (declaredTotal <= 0) continue;

    const monthStr = pad2(calc.month);
    const monthResultEntries = result.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    if (monthResultEntries.length === 0) continue;

    if (calendarTotal === declaredTotal) continue;

    // ── Distribute hours across partial entries (column S is source of truth) ──
    monthResultEntries.sort((a, b) => a.date.localeCompare(b.date));
    const partials = monthResultEntries.filter(
      (e) => e.isPartialPtoColor === true,
    );

    if (partials.length > 0) {
      // Sum hours from non-partial (full-day) entries
      const fullTotal = monthResultEntries
        .filter((e) => !e.isPartialPtoColor)
        .reduce((sum, e) => sum + e.hours, 0);
      const remainingHours =
        Math.round((declaredTotal - fullTotal) * 100) / 100;
      const hoursEach =
        Math.round((remainingHours / partials.length) * 100) / 100;

      if (hoursEach > 0 && hoursEach <= 8) {
        for (const partial of partials) {
          if (partial.hours !== hoursEach) {
            const originalHours = partial.hours;
            partial.hours = hoursEach;
            const adjustNote =
              `Adjusted from ${originalHours}h to ${hoursEach}h ` +
              `based on PTO Calc (declared ${declaredTotal}h for month ${calc.month}).`;
            partial.notes = partial.notes
              ? `${partial.notes} ${adjustNote}`
              : adjustNote;
          }
        }
      } else {
        // Guard failed — hoursEach is out of range
        warnings.push(
          `"${sheetName}" month ${calc.month}: ` +
            `partial distribution produced ${hoursEach}h per entry (out of 0–8 range). ` +
            `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, ` +
            `${partials.length} partial entries. No adjustment applied.`,
        );
      }
    } else if (calendarTotal > declaredTotal) {
      // No partial entries — adjust the last entry as fallback
      const targetEntry = monthResultEntries[monthResultEntries.length - 1];
      const otherTotal = calendarTotal - targetEntry.hours;
      const partialHours = declaredTotal - otherTotal;

      if (partialHours > 0 && partialHours < targetEntry.hours) {
        const originalHours = targetEntry.hours;
        targetEntry.hours = Math.round(partialHours * 100) / 100;
        const adjustNote =
          `Adjusted from ${originalHours}h to ${targetEntry.hours}h ` +
          `based on PTO Calc (declared ${declaredTotal}h for month ${calc.month}).`;
        targetEntry.notes = targetEntry.notes
          ? `${targetEntry.notes} ${adjustNote}`
          : adjustNote;
      }
    } else {
      // calendarTotal < declaredTotal with no partial entries
      warnings.push(
        `"${sheetName}" month ${calc.month}: ` +
          `calendar total (${calendarTotal}h) < declared (${declaredTotal}h) ` +
          `but no Partial PTO entries found. Cannot back-calculate.`,
      );
    }
  }

  return { entries: result, warnings };
}

/**
 * Reconcile partial PTO entries that were missed by calendar color matching.
 *
 * When the PTO Calc section (column S) declares more hours than the sum of
 * calendar-detected entries for a month, this function scans unmatched cells
 * that have notes (e.g., ".5 hrs") and creates partial PTO entries for them.
 * The remaining hours are assigned to the noted cell(s).
 *
 * Returns updated entries and any warnings for still-unreconciled months.
 */
export function reconcilePartialPto(
  entries: ImportedPtoEntry[],
  unmatchedNotedCells: UnmatchedNotedCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  const result = [...entries];
  const warnings: string[] = [];

  for (const calc of ptoCalcRows) {
    if (calc.usedHours <= 0) continue;

    const monthStr = pad2(calc.month);
    // Only count PTO+Sick entries (column S excludes Bereavement/Jury Duty)
    const detectedTotal = result
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

    const gap = Math.round((calc.usedHours - detectedTotal) * 100) / 100;
    if (gap <= 0) continue;

    // Find unmatched noted cells in this month
    const monthNoted = unmatchedNotedCells.filter(
      (c) => c.date.substring(5, 7) === monthStr,
    );

    if (monthNoted.length > 0) {
      // Distribute gap across noted cells (typically just one)
      let remaining = gap;
      for (const noted of monthNoted) {
        if (remaining <= 0) break;

        // Try to parse hours from the note
        const noteHours = parseHoursFromNote(noted.note);
        const assignedHours =
          noteHours !== undefined ? Math.min(noteHours, remaining) : remaining;

        const noteExplanation =
          `Inferred partial PTO from cell note "${noted.note.replace(/\n/g, " ").trim()}". ` +
          `Calendar color not matched as Partial PTO. ` +
          `Reconciled against PTO Calc (declared=${calc.usedHours}h, ` +
          `detected=${detectedTotal}h, gap=${gap}h).`;

        result.push({
          date: noted.date,
          type: "PTO",
          hours: Math.round(assignedHours * 100) / 100,
          notes: noteExplanation,
        });

        remaining = Math.round((remaining - assignedHours) * 100) / 100;
      }

      // If gap still remains after assigning to noted cells
      if (remaining > 0) {
        warnings.push(
          `"${sheetName}" month ${calc.month}: partially reconciled. ` +
            `Declared=${calc.usedHours}h, detected=${detectedTotal}h, ` +
            `assigned ${gap - remaining}h from notes, ` +
            `${remaining}h still unaccounted for.`,
        );
      }
    } else {
      // No noted cells to assign to — emit warning
      warnings.push(
        `"${sheetName}" month ${calc.month}: PTO hours mismatch. ` +
          `Declared=${calc.usedHours}h, detected=${detectedTotal}h, ` +
          `gap=${gap}h. No cell notes found for reconciliation.`,
      );
    }
  }

  return { entries: result, warnings };
}

// ── Phase 2b: Weekend "Worked" Days — Negative PTO Credit ──

/**
 * Try to parse hours from a "worked" note.
 * Uses patterns specific to make-up/credit notes:
 *  - Parenthesised hours: "(+5 hours)", "(5 hours PTO)"
 *  - "make up" followed by a number: "make up 1.5"
 *  - Standalone hours: "3.3 hours", "2 hrs"
 * Returns the positive hour value (caller negates), or undefined.
 */
export function parseWorkedHoursFromNote(note: string): number | undefined {
  // 1. Explicit hours in parentheses: "(5 hours)", "(+5.30 hours)", "(5 hours PTO)"
  let match = note.match(/\(\+?\s*(\d+(?:\.\d+)?)\s*hours?\s*(?:PTO)?\s*\)/i);
  if (match) return parseFloat(match[1]);

  // 2. "make up" followed by a number: "make up 1.5"
  match = note.match(/make\s*up\s+(\d+(?:\.\d+)?)/i);
  if (match) return parseFloat(match[1]);

  // 3. Number followed by hours/hrs: "3.3 hours", "2 hrs", "2 hours"
  match = note.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 12) return val;
  }

  return undefined;
}

/**
 * Process "worked" weekend/off-day cells to create negative PTO credit entries.
 *
 * For each worked cell:
 * 1. Try to extract hours from the note text.
 * 2. If not found, infer from the PTO Calc deficit (declared total minus
 *    existing positive entries) — only when there is a single unparsed
 *    worked cell in the month.
 * 3. If hours still cannot be determined, emit a warning and skip.
 *
 * Returns new negative-hours PTO entries and warnings for each detection.
 */
export function processWorkedCells(
  workedCells: WorkedCell[],
  existingEntries: ImportedPtoEntry[],
  ptoCalcRows: { month: number; usedHours: number }[],
  sheetName: string,
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  const entries: ImportedPtoEntry[] = [];
  const warnings: string[] = [];

  if (workedCells.length === 0) return { entries, warnings };

  // Group worked cells by month
  const byMonth = new Map<number, WorkedCell[]>();
  for (const wc of workedCells) {
    const month = parseInt(wc.date.substring(5, 7), 10);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(wc);
  }

  for (const [month, cells] of byMonth) {
    const monthStr = pad2(month);
    const ptoCalc = ptoCalcRows.find((r) => r.month === month);
    const declaredTotal = ptoCalc?.usedHours ?? 0;

    // Sum of existing (positive) PTO entries for this month
    const existingTotal = existingEntries
      .filter((e) => e.date.substring(5, 7) === monthStr)
      .reduce((sum, e) => sum + e.hours, 0);

    // Split cells into those with parseable hours and those without
    const parsed: { cell: WorkedCell; hours: number }[] = [];
    const unparsed: WorkedCell[] = [];

    for (const wc of cells) {
      const hours = parseWorkedHoursFromNote(wc.note);
      if (hours !== undefined) {
        parsed.push({ cell: wc, hours });
      } else {
        unparsed.push(wc);
      }
    }

    // Create entries for cells with parseable hours
    for (const { cell, hours } of parsed) {
      entries.push({
        date: cell.date,
        type: "PTO",
        hours: -hours,
        notes:
          `Weekend/off-day work credit (${hours}h). ` +
          `Cell note: "${cell.note.replace(/\n/g, " ").trim()}"`,
      });
      warnings.push(
        `"${sheetName}": detected worked day on ${cell.date}. ` +
          `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
          `Assigned -${hours}h PTO credit from note.`,
      );
    }

    // Handle unparsed cells using PTO Calc deficit
    if (unparsed.length > 0) {
      const parsedCredit = parsed.reduce((sum, p) => sum + p.hours, 0);
      // Net PTO after all entries should equal declaredTotal:
      // existingTotal + (-parsedCredit) + (-unparsedCredit) = declaredTotal
      // unparsedCredit = existingTotal - parsedCredit - declaredTotal
      const unparsedCredit =
        Math.round((existingTotal - parsedCredit - declaredTotal) * 100) / 100;

      if (unparsedCredit > 0 && unparsed.length === 1) {
        // Single unparsed cell — assign all remaining credit
        const cell = unparsed[0];
        entries.push({
          date: cell.date,
          type: "PTO",
          hours: -unparsedCredit,
          notes:
            `Weekend/off-day work credit inferred from PTO Calc. ` +
            `Declared=${declaredTotal}h, detected=${existingTotal}h, ` +
            `other credits=${parsedCredit}h, inferred=${unparsedCredit}h. ` +
            `Cell note: "${cell.note.replace(/\n/g, " ").trim()}"`,
        });
        warnings.push(
          `"${sheetName}": detected worked day on ${cell.date}. ` +
            `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
            `Inferred -${unparsedCredit}h PTO credit from PTO Calc deficit.`,
        );
      } else if (unparsedCredit > 0 && unparsed.length > 1) {
        // Multiple unparsed cells — can't distribute reliably
        for (const cell of unparsed) {
          warnings.push(
            `"${sheetName}": detected worked day on ${cell.date}. ` +
              `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
              `Could not determine hours — ${unparsed.length} worked cells ` +
              `in month ${month} with ${unparsedCredit}h total deficit. Skipping.`,
          );
        }
      } else {
        // No deficit to assign
        for (const cell of unparsed) {
          warnings.push(
            `"${sheetName}": detected worked day on ${cell.date}. ` +
              `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
              `Could not determine hours (no PTO Calc deficit). Skipping.`,
          );
        }
      }
    }
  }

  return { entries, warnings };
}

// ── Phase 2c: Weekend-Work + Partial-PTO Joint Inference ──

/**
 * Phase 11: Joint inference for months with both Partial PTO and unprocessed
 * weekend work entries where individual hours cannot be determined from notes.
 *
 * When the monthly total doesn't match the declared column S total and the
 * month has both partial PTO entries and unprocessed worked cells, this
 * function solves the system of equations using priority-ordered heuristics:
 *   1. Try w=8 (full-day weekend work), solve for p
 *   2. Try p=4 (half-day PTO), solve for w
 *   3. Fallback: constrained solve keeping both p and w in (0, 8]
 *
 * Returns modified entries with corrected partial hours, new worked credit
 * entries, the set of handled worked cell dates, and warnings.
 */
export function inferWeekendPartialHours(
  entries: ImportedPtoEntry[],
  workedCells: WorkedCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): {
  entries: ImportedPtoEntry[];
  newWorkedEntries: ImportedPtoEntry[];
  handledWorkedDates: Set<string>;
  warnings: string[];
} {
  const result = entries.map((e) => ({ ...e }));
  const newWorkedEntries: ImportedPtoEntry[] = [];
  const handledWorkedDates = new Set<string>();
  const warnings: string[] = [];

  // Find unprocessed worked cells: dates with no existing negative entry
  const negativeEntryDates = new Set(
    entries.filter((e) => e.hours < 0).map((e) => e.date),
  );
  const unprocessedWorked = workedCells.filter(
    (wc) => !negativeEntryDates.has(wc.date),
  );

  // Group unprocessed worked cells by month
  const workedByMonth = new Map<number, WorkedCell[]>();
  for (const wc of unprocessedWorked) {
    const month = parseInt(wc.date.substring(5, 7), 10);
    if (!workedByMonth.has(month)) workedByMonth.set(month, []);
    workedByMonth.get(month)!.push(wc);
  }

  for (const calc of ptoCalcRows) {
    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    // Get current tracked entries for this month
    const monthResultEntries = result.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const currentTotal = monthResultEntries.reduce(
      (sum, e) => sum + e.hours,
      0,
    );

    // Skip if already matching
    if (Math.abs(currentTotal - declaredTotal) < 0.01) continue;

    // Find partial PTO entries and unprocessed worked cells for this month
    const partials = monthResultEntries.filter(
      (e) => e.isPartialPtoColor === true,
    );
    const worked = workedByMonth.get(calc.month) || [];

    // Phase 11 only applies when both partials and worked cells exist
    if (partials.length === 0 || worked.length === 0) continue;

    const partialCount = partials.length;
    const workedCount = worked.length;

    // Known total: non-partial positive entries + existing negative entries
    const fullTotal = monthResultEntries
      .filter((e) => !e.isPartialPtoColor && e.hours > 0)
      .reduce((sum, e) => sum + e.hours, 0);
    const existingCredits = monthResultEntries
      .filter((e) => e.hours < 0)
      .reduce((sum, e) => sum + e.hours, 0);

    // Equation: fullTotal + partialCount×p + existingCredits − workedCount×w = declaredTotal
    // Rearranged: partialCount×p − workedCount×w = declaredTotal − fullTotal − existingCredits
    const target = declaredTotal - fullTotal - existingCredits;

    let p: number | undefined;
    let w: number | undefined;
    let method = "";

    // Step 1: Try w = 8
    const p1 =
      Math.round(((target + workedCount * 8) / partialCount) * 100) / 100;
    if (p1 > 0 && p1 <= 8) {
      p = p1;
      w = 8;
      method = "w assumed 8h";
    }

    // Step 2: Try p = 4
    if (p === undefined) {
      const w2 =
        Math.round(((partialCount * 4 - target) / workedCount) * 100) / 100;
      if (w2 > 0 && w2 <= 8) {
        p = 4;
        w = w2;
        method = "p assumed 4h";
      }
    }

    // Step 3: Fallback — constrained solve
    if (p === undefined) {
      const midW = (partialCount * 4 - target) / workedCount;
      const clampedW = Math.round(Math.min(8, Math.max(0.5, midW)) * 100) / 100;
      const derivedP =
        Math.round(((target + workedCount * clampedW) / partialCount) * 100) /
        100;
      if (derivedP > 0 && derivedP <= 8) {
        p = derivedP;
        w = clampedW;
        method = "constrained solve";
      }
    }

    if (p !== undefined && w !== undefined) {
      // Apply: update partial entries
      for (const partial of partials) {
        const originalHours = partial.hours;
        partial.hours = p;
        const note =
          `Inferred p=${p}h (${method}). ` +
          `Equation: declared(${declaredTotal}) = full(${fullTotal}) + ` +
          `${partialCount}×p − ${workedCount}×${w}`;
        partial.notes = partial.notes ? `${partial.notes} ${note}` : note;
      }

      // Create worked entries
      for (const wc of worked) {
        newWorkedEntries.push({
          date: wc.date,
          type: "PTO",
          hours: -w,
          notes:
            `Inferred w=${w}h (${method}). ` +
            `Equation: declared(${declaredTotal}) = full(${fullTotal}) + ` +
            `${partialCount}×${p} − ${workedCount}×w. ` +
            `Cell note: "${wc.note.replace(/\n/g, " ").trim()}"`,
        });
        handledWorkedDates.add(wc.date);
      }

      const newTotal =
        fullTotal + existingCredits + partialCount * p - workedCount * w;
      warnings.push(
        `"${sheetName}" month ${calc.month}: Phase 11 inference applied. ` +
          `p=${p}h, w=${w}h (${method}). ` +
          `Declared=${declaredTotal}h, computed=${Math.round(newTotal * 100) / 100}h.`,
      );
    } else {
      warnings.push(
        `"${sheetName}" month ${calc.month}: Phase 11 inference failed. ` +
          `Could not find valid p and w values. ` +
          `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, ` +
          `${partialCount} partial(s), ${workedCount} worked cell(s). ` +
          `No adjustment applied.`,
      );
    }
  }

  return { entries: result, newWorkedEntries, handledWorkedDates, warnings };
}

// ── Phase 3: Employee Info Parsing ──

/**
 * Detect whether a worksheet is an employee sheet.
 * An employee sheet contains "Hire Date" (case-insensitive) somewhere in
 * the header area (row 2, columns R–X). Returns true if found.
 */
export function isEmployeeSheet(ws: ExcelJS.Worksheet): boolean {
  for (let c = 18; c <= 24; c++) {
    const cell = ws.getCell(2, c);
    // Use cell.text to handle rich text, formulas, and other non-string values
    const val = cell.text || "";
    if (val.toLowerCase().includes("hire date")) return true;
  }
  return false;
}

/**
 * Parse employee metadata from a worksheet.
 * - Name: from the worksheet tab name
 * - Hire date: from cell R2 (flexible format via smartParseDate)
 * - Year: from cell B2
 */
export function parseEmployeeInfo(ws: ExcelJS.Worksheet): EmployeeImportInfo {
  const name = ws.name.trim();

  // Year from B2
  const yearCell = ws.getCell("B2");
  let year = 0;
  if (typeof yearCell.value === "number") {
    year = yearCell.value;
  } else if (yearCell.value) {
    year = parseInt(yearCell.value.toString(), 10) || 0;
  }

  // Hire date from R2 — flexible format
  // Supports: "Hire Date: YYYY-MM-DD", "HIRE DATE: M/D/YY", etc.
  // Use cell.text to handle rich text, formulas, and other non-string values
  const hireDateCell = ws.getCell("R2");
  let hireDate = "";
  const hireDateStr = hireDateCell.text || "";
  if (hireDateStr) {
    // Extract the date portion after "Hire Date:" (case-insensitive)
    const match = hireDateStr.match(/hire\s*date:\s*(.+)/i);
    if (match) {
      const datePart = match[1].trim();
      const parsed = smartParseDate(datePart);
      if (parsed) {
        hireDate = parsed;
      }
    }
  }

  // Carryover from PTO calc start row, column L
  const carryoverHours = parseCarryoverHours(ws);

  // PTO daily rate from column F (col 6) at December row (startRow + 11)
  let spreadsheetPtoRate = 0;
  try {
    const startRow = findPtoCalcStartRow(ws);
    const decemberRow = startRow + 11;
    const rateCell = ws.getCell(decemberRow, 6); // Column F
    const rateVal = rateCell.value;
    if (typeof rateVal === "number") {
      spreadsheetPtoRate = rateVal;
    } else if (rateVal !== null && rateVal !== undefined) {
      const parsed = parseFloat(rateVal.toString());
      spreadsheetPtoRate = isNaN(parsed) ? 0 : parsed;
    }
  } catch {
    // findPtoCalcStartRow may throw if section not found; leave rate as 0
  }

  return { name, hireDate, year, carryoverHours, spreadsheetPtoRate };
}

/**
 * Generate an email identifier from an employee name.
 * Uses full first name + last name to avoid collisions.
 * "Alice Smith" → "alice-smith@example.com"
 * "Dan Allen" / "Deanna Allen" → distinct identifiers
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
 * Compute the correct PTO rate from the hire date and year, compare
 * with the spreadsheet value, and return the rate to use plus any
 * warning message.
 */
export function computePtoRate(info: EmployeeImportInfo): {
  rate: number;
  warning: string | null;
} {
  if (!info.hireDate || !info.year) {
    // Can't compute — fall back to spreadsheet value or default
    const rate = info.spreadsheetPtoRate || PTO_EARNING_SCHEDULE[0].dailyRate;
    return { rate, warning: null };
  }

  // Compute expected rate as of Dec 31 of the spreadsheet year
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

/**
 * Upsert an employee by name (case-insensitive) or generated identifier.
 * If not found by name, falls back to identifier lookup to avoid UNIQUE
 * constraint violations. Creates a new employee only when neither matches.
 * Returns the employee ID and whether it was newly created.
 */
export async function upsertEmployee(
  dataSource: DataSource,
  info: EmployeeImportInfo,
  log?: (msg: string) => void,
): Promise<{ employeeId: number; created: boolean }> {
  const empRepo = dataSource.getRepository(Employee);
  const trimmedName = info.name.trim();
  const generatedId = generateIdentifier(trimmedName);

  // Case-insensitive name match
  let existing = await empRepo
    .createQueryBuilder("emp")
    .where("LOWER(emp.name) = LOWER(:name)", { name: trimmedName })
    .getOne();

  // Fallback: match by generated identifier to avoid UNIQUE constraint
  if (!existing) {
    existing = await empRepo.findOne({ where: { identifier: generatedId } });
    if (existing) {
      log?.(
        `Employee "${trimmedName}" not found by name, matched by identifier "${generatedId}" (id=${existing.id})`,
      );
    }
  }

  if (existing) {
    // Update carryover_hours if provided
    if (info.carryoverHours !== 0) {
      existing.carryover_hours = info.carryoverHours;
    }
    // Update hire_date if provided and currently missing
    if (info.hireDate && !existing.hire_date) {
      existing.hire_date = new Date(info.hireDate);
    }
    // Always update PTO rate to the computed value
    const { rate, warning } = computePtoRate(info);
    existing.pto_rate = rate;
    if (warning) log?.(warning);
    await empRepo.save(existing);
    return { employeeId: existing.id, created: false };
  }

  // Create new employee with computed PTO rate
  const { rate, warning } = computePtoRate(info);
  if (warning) log?.(warning);
  const newEmp = empRepo.create({
    name: trimmedName,
    identifier: generatedId,
    hire_date: info.hireDate ? new Date(info.hireDate) : new Date(),
    pto_rate: rate,
    carryover_hours: info.carryoverHours,
    role: "Employee",
  });

  log?.(`Creating new employee: "${trimmedName}" (${generatedId})`);
  const saved = await empRepo.save(newEmp);
  return { employeeId: saved.id, created: true };
}

// ── Phase 4: PTO Entry Upsert ──

/**
 * Upsert PTO entries for an employee.
 * Per-date: update type + hours for existing entries, insert new ones.
 * Entries not in the import are left untouched.
 */
export async function upsertPtoEntries(
  dataSource: DataSource,
  employeeId: number,
  entries: ImportedPtoEntry[],
): Promise<{ upserted: number; warnings: string[] }> {
  const repo = dataSource.getRepository(PtoEntry);
  const warnings: string[] = [];
  let upserted = 0;

  for (const entry of entries) {
    // Validate
    const dateErr = validateDateString(entry.date);
    if (dateErr) {
      warnings.push(
        `Skipped ${entry.date}: ${VALIDATION_MESSAGES[dateErr.messageKey as keyof typeof VALIDATION_MESSAGES] || dateErr.messageKey}`,
      );
      continue;
    }

    const typeErr = validatePTOType(entry.type);
    if (typeErr) {
      warnings.push(`Skipped ${entry.date}: invalid PTO type "${entry.type}"`);
      continue;
    }

    // Import accepts any non-zero hours (negative values represent worked-day credits)
    if (typeof entry.hours !== "number" || entry.hours === 0) {
      warnings.push(`Skipped ${entry.date}: invalid hours ${entry.hours}`);
      continue;
    }

    // Find existing entry for this employee + date
    const existing = await repo.findOne({
      where: { employee_id: employeeId, date: entry.date },
    });

    if (existing) {
      existing.type = entry.type;
      existing.hours = entry.hours;
      existing.notes = entry.notes || null;
      await repo.save(existing);
    } else {
      const newEntry = repo.create({
        employee_id: employeeId,
        date: entry.date,
        type: entry.type,
        hours: entry.hours,
        notes: entry.notes || null,
        approved_by: null,
      });
      await repo.save(newEntry);
    }
    upserted++;
  }

  return { upserted, warnings };
}

// ── Phase 5: Acknowledgement Import ──

/**
 * Parse acknowledgement marks from the worksheet.
 * Column X (24) = employee ack, Column Y (25) = admin ack.
 * Dynamically finds the PTO calc start row and reads 12 months from there.
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

    // Employee ack
    const empCell = ws.getCell(row, EMP_ACK_COL);
    if (empCell.value?.toString().trim() === "✓") {
      acks.push({ month: monthStr, type: "employee" });
    }

    // Admin ack
    const admCell = ws.getCell(row, ADMIN_ACK_COL);
    if (admCell.value?.toString().trim() === "✓") {
      acks.push({ month: monthStr, type: "admin" });
    }
  }

  return acks;
}

/**
 * Upsert acknowledgements for an employee.
 * Checks for existing acknowledgements before inserting.
 */
export async function upsertAcknowledgements(
  dataSource: DataSource,
  employeeId: number,
  acks: ImportedAcknowledgement[],
  adminId?: number,
): Promise<number> {
  const ackRepo = dataSource.getRepository(Acknowledgement);
  const admAckRepo = dataSource.getRepository(AdminAcknowledgement);
  let synced = 0;

  for (const ack of acks) {
    if (ack.type === "employee") {
      const existing = await ackRepo.findOne({
        where: { employee_id: employeeId, month: ack.month },
      });
      if (!existing) {
        const newAck = ackRepo.create({
          employee_id: employeeId,
          month: ack.month,
        });
        await ackRepo.save(newAck);
        synced++;
      }
    } else {
      const existing = await admAckRepo.findOne({
        where: { employee_id: employeeId, month: ack.month },
      });
      if (!existing) {
        const newAdmAck = admAckRepo.create({
          employee_id: employeeId,
          month: ack.month,
          admin_id: adminId || employeeId, // fallback to self if no admin ID
        });
        await admAckRepo.save(newAdmAck);
        synced++;
      }
    }
  }

  return synced;
}

// ── Phase 6: Orchestrator ──

/**
 * Parse a single employee worksheet and return all extracted data
 * (no DB interaction).
 * Accepts an optional theme color map for resolving theme-indexed fill colors.
 */
export function parseEmployeeSheet(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): SheetImportResult {
  const warnings: string[] = [];

  // Parse legend from this sheet
  const legend = parseLegend(ws, themeColors);
  if (legend.size === 0) {
    warnings.push(`No legend found on sheet "${ws.name}"`);
  }

  // Parse employee info
  const employee = parseEmployeeInfo(ws);
  if (!employee.year) {
    warnings.push(`Could not determine year from sheet "${ws.name}"`);
  }
  if (!employee.hireDate) {
    warnings.push(`Could not determine hire date from sheet "${ws.name}"`);
  }

  // Check PTO rate consistency
  const { warning: rateWarning } = computePtoRate(employee);
  if (rateWarning) {
    warnings.push(rateWarning);
  }

  // Build set of "Partial PTO" legend colors for entry tagging
  const partialPtoColors = parsePartialPtoColors(ws, themeColors);

  // Parse calendar with theme-aware color matching
  const {
    entries: calendarEntries,
    unmatchedNotedCells,
    workedCells,
    warnings: calendarWarnings,
  } = parseCalendarGrid(
    ws,
    employee.year,
    legend,
    themeColors,
    partialPtoColors,
  );
  warnings.push(...calendarWarnings);

  // Parse PTO calc section for partial-day adjustment
  const ptoCalcRows = parsePtoCalcUsedHours(ws);
  const { entries: adjustedEntries, warnings: adjustWarnings } =
    adjustPartialDays(calendarEntries, ptoCalcRows, ws.name);
  let ptoEntries = adjustedEntries;
  warnings.push(...adjustWarnings);

  // Reconcile: add missing partial PTO entries from cell notes
  const { entries: reconciledEntries, warnings: reconWarnings } =
    reconcilePartialPto(ptoEntries, unmatchedNotedCells, ptoCalcRows, ws.name);
  ptoEntries = reconciledEntries;
  warnings.push(...reconWarnings);

  // Phase 11: Joint inference for weekend-work + partial-PTO months
  const {
    entries: phase11Entries,
    newWorkedEntries: phase11WorkedEntries,
    handledWorkedDates,
    warnings: phase11Warnings,
  } = inferWeekendPartialHours(ptoEntries, workedCells, ptoCalcRows, ws.name);
  ptoEntries = [...phase11Entries, ...phase11WorkedEntries];
  warnings.push(...phase11Warnings);

  // Process remaining "worked" weekend/off-day cells for negative PTO credit
  const remainingWorkedCells = workedCells.filter(
    (wc) => !handledWorkedDates.has(wc.date),
  );
  const { entries: workedEntries, warnings: workedWarnings } =
    processWorkedCells(remainingWorkedCells, ptoEntries, ptoCalcRows, ws.name);
  ptoEntries = [...ptoEntries, ...workedEntries];
  warnings.push(...workedWarnings);

  // Parse acknowledgements
  const acknowledgements = parseAcknowledgements(ws, employee.year);

  return { employee, ptoEntries, acknowledgements, warnings };
}

/**
 * Materialise a single worksheet from the streaming reader into a regular
 * ExcelJS Worksheet so existing parse helpers (which use random cell access)
 * continue to work.  Only ONE sheet is in memory at a time, which keeps the
 * footprint small even for workbooks with 60+ tabs.
 */
async function materialiseWorksheet(
  wsReader: ExcelJS.stream.xlsx.WorksheetReader,
): Promise<ExcelJS.Worksheet> {
  const tempWB = new ExcelJS.Workbook();
  const ws = tempWB.addWorksheet((wsReader as any).name || "Sheet");

  for await (const row of wsReader) {
    const newRow = ws.getRow(row.number);
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      newCell.value = cell.value;
      newCell.style = cell.style;
      if (cell.note) newCell.note = cell.note;
    });
    newRow.commit();
  }

  return ws;
}

/**
 * Import an entire Excel workbook.
 * Uses the non-streaming reader so cell notes/comments are preserved
 * (the streaming WorkbookReader drops them).  File size is capped at
 * 10 MB by the upload middleware, so memory usage stays manageable on
 * the 512 MB production server.
 * Iterates employee tabs, parses data, and upserts into the database.
 * Accepts an optional logger; each sheet is wrapped in try/catch so
 * one bad sheet does not abort the entire import.
 */
export async function importExcelWorkbook(
  dataSource: DataSource,
  filePath: string,
  adminId?: number,
  log?: (msg: string) => void,
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const result: ImportResult = {
    employeesProcessed: 0,
    employeesCreated: 0,
    ptoEntriesUpserted: 0,
    acknowledgementsSynced: 0,
    warnings: [],
    perEmployee: [],
  };

  // TypeORM's sql.js driver with autoSave: true writes the entire database
  // to disk after every single repo.save() call. For bulk imports with
  // hundreds of inserts this is catastrophically slow (~0.5s per write).
  // Temporarily disable autoSave, do all the work in-memory, then save once.
  const driver = dataSource.driver as any;
  const originalAutoSave = driver.options?.autoSave;
  if (driver.options) {
    driver.options.autoSave = false;
    log?.("autoSave disabled for bulk import");
  }

  const importStart = Date.now();
  const sheetNames: string[] = [];

  // Extract theme colors for theme-indexed cell color resolution.
  // The non-streaming workbook exposes theme XML in its model, falling
  // back to the standard Office 2010 theme palette.
  let themeColors: Map<number, string> = DEFAULT_OFFICE_THEME;
  try {
    const wbAny = workbook as any;
    const themeXml: string | undefined =
      wbAny._themes?.theme1 ??
      wbAny.themes?.theme1 ??
      wbAny._model?.themes?.theme1;
    if (themeXml) {
      themeColors = parseThemeColors(themeXml);
      log?.(`Parsed ${themeColors.size} theme colors from workbook`);
    } else {
      log?.("Theme XML not available; using default Office theme");
    }
  } catch (themeErr) {
    log?.(`Failed to parse theme colors, using defaults: ${themeErr}`);
  }

  try {
    for (const ws of workbook.worksheets) {
      const sheetName = ws.name || "Sheet";
      sheetNames.push(sheetName);

      // Skip non-employee sheets (detect by presence of "Hire Date" in header)
      if (!isEmployeeSheet(ws)) {
        log?.(`Skipping non-employee sheet: "${ws.name}"`);
        continue;
      }

      try {
        result.employeesProcessed++;
        const sheetStart = Date.now();
        log?.(`Processing employee sheet: "${ws.name}"`);

        // Parse sheet data
        const parseStart = Date.now();
        const sheetResult = parseEmployeeSheet(ws, themeColors);
        log?.(`  [profile] parseEmployeeSheet: ${Date.now() - parseStart}ms`);

        // Log blank/null value warnings
        const emp = sheetResult.employee;
        if (!emp.name) {
          const msg = `Sheet "${ws.name}": employee name is blank`;
          log?.(msg);
          result.warnings.push(msg);
        }
        if (!emp.hireDate) {
          const msg = `Sheet "${ws.name}": hire date is blank/unparseable`;
          log?.(msg);
          result.warnings.push(msg);
        }
        if (!emp.year) {
          const msg = `Sheet "${ws.name}": year is blank/unparseable`;
          log?.(msg);
          result.warnings.push(msg);
        }
        result.warnings.push(...sheetResult.warnings);

        // Upsert employee
        const empStart = Date.now();
        const { employeeId, created } = await upsertEmployee(
          dataSource,
          sheetResult.employee,
          log,
        );
        if (created) result.employeesCreated++;
        log?.(`  [profile] upsertEmployee: ${Date.now() - empStart}ms`);

        // Upsert PTO entries
        const ptoStart = Date.now();
        const { upserted, warnings: ptoWarnings } = await upsertPtoEntries(
          dataSource,
          employeeId,
          sheetResult.ptoEntries,
        );
        result.ptoEntriesUpserted += upserted;
        result.warnings.push(...ptoWarnings);
        log?.(
          `  [profile] upsertPtoEntries (${sheetResult.ptoEntries.length} entries, ${upserted} upserted): ${Date.now() - ptoStart}ms`,
        );

        // Upsert acknowledgements
        const ackStart = Date.now();
        const acksSynced = await upsertAcknowledgements(
          dataSource,
          employeeId,
          sheetResult.acknowledgements,
          adminId,
        );
        result.acknowledgementsSynced += acksSynced;
        log?.(
          `  [profile] upsertAcknowledgements (${sheetResult.acknowledgements.length} acks, ${acksSynced} synced): ${Date.now() - ackStart}ms`,
        );

        result.perEmployee.push({
          name: sheetResult.employee.name,
          employeeId,
          ptoEntries: upserted,
          acknowledgements: acksSynced,
          created,
        });

        log?.(
          `  → ${created ? "Created" : "Updated"} employee id=${employeeId}, ` +
            `${upserted} PTO entries, ${acksSynced} acknowledgements ` +
            `(${Date.now() - sheetStart}ms total)`,
        );
      } catch (sheetError) {
        const msg = `Failed to process sheet "${ws.name}": ${sheetError}`;
        log?.(msg);
        result.warnings.push(msg);
      }
    }
  } finally {
    // Restore autoSave and persist the database once
    if (driver.options) {
      driver.options.autoSave = originalAutoSave;
      log?.("autoSave restored");
    }

    // Manually save the database to disk once
    const saveStart = Date.now();
    if (typeof driver.save === "function") {
      await driver.save();
      log?.(`  [profile] final database save: ${Date.now() - saveStart}ms`);
    }
  }

  log?.(
    `Workbook contained ${sheetNames.length} sheets: ${sheetNames.join(", ")}`,
  );

  log?.(
    `Import complete: ${result.employeesProcessed} processed, ` +
      `${result.employeesCreated} created, ` +
      `${result.ptoEntriesUpserted} PTO entries, ` +
      `${result.acknowledgementsSynced} acknowledgements, ` +
      `${result.warnings.length} warnings ` +
      `(${Date.now() - importStart}ms total)`,
  );

  return result;
}

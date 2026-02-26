/**
 * Excel PTO Spreadsheet Parsing — Shared Module
 *
 * Pure parsing and reconciliation logic extracted from the server-side
 * excelImport.ts so it can run in both Node.js and browser environments.
 * No TypeORM, no Node.js `fs`, no `DataSource` — only ExcelJS types and
 * shared business-rule imports.
 *
 * The server-side `excelImport.ts` re-exports everything from this module
 * and adds the persistence layer (upsertEmployee, upsertPtoEntries, etc.).
 */

import type ExcelJS from "exceljs";
import type { PTOType } from "./businessRules.js";
import {
  MONTH_NAMES,
  PTO_EARNING_SCHEDULE,
  getEffectivePtoRate,
} from "./businessRules.js";
import { getDaysInMonth, smartParseDate } from "./dateUtils.js";

// ── Constants ──

/** Calendar grid column-group start columns (1-indexed). */
const COL_STARTS = [2, 10, 18];

/** Calendar grid row-group header rows. */
const ROW_GROUP_STARTS = [4, 13, 22, 31];

/** Legend column (Z = 26). */
const LEGEND_COL = 26;

/** Max rows to scan when searching for dynamic positions. */
const LEGEND_SCAN_MAX_ROW = 30;

/** PTO Calculation section: assumed data start row (January). */
const PTO_CALC_DATA_START_ROW = 42;

/** Acknowledgement columns. */
const EMP_ACK_COL = 24; // X
const ADMIN_ACK_COL = 25; // Y

/** Superscript Unicode map for decoding partial-day decorations. */
export const SUPERSCRIPT_TO_DIGIT: Record<string, number> = {
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
 * Used as fallback when workbook theme XML is unavailable.
 */
export const DEFAULT_OFFICE_THEME: Map<number, string> = new Map([
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

/**
 * PTO types tracked in the spreadsheet's "PTO hours per Month" column (S).
 */
export const COLUMN_S_TRACKED_TYPES = new Set<string>(["PTO"]);

/** Annual sick-time allowance in hours. */
const ANNUAL_SICK_ALLOWANCE = 24;

/** Maximum hours a single PTO entry can represent (sanity cap). */
const MAX_SINGLE_ENTRY_HOURS = 24;

/** Minimum chroma for approximate color matching. */
const MIN_CHROMA_FOR_APPROX = 40;

/** Maximum rows to scan above/below expected position when searching for day 1. */
const DAY1_SCAN_RANGE = 3;

/** Keywords in cell notes indicating weekend-makeup work. */
const OVERCOLOR_NOTE_KEYWORDS = /worked|make\s*up|makeup|offset/i;

// ── Result types ──

export interface ImportedPtoEntry {
  date: string;
  type: PTOType;
  hours: number;
  notes?: string;
  /** True when the calendar cell matched a "Partial PTO" legend color. */
  isPartialPtoColor?: boolean;
  /** True when hours were extracted from a cell note (authoritative). */
  isNoteDerived?: boolean;
}

export interface ImportedAcknowledgement {
  month: string; // YYYY-MM
  type: "employee" | "admin";
  note?: string;
  status?: "warning" | null;
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

export interface PtoCalcRow {
  month: number;
  usedHours: number;
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

/** Info about a calendar cell with a non-legend fill color and no note. */
export interface UnmatchedColoredCell {
  date: string;
  color: string;
  note: string;
}

/** Result of parsing the calendar grid. */
export interface CalendarParseResult {
  entries: ImportedPtoEntry[];
  unmatchedNotedCells: UnmatchedNotedCell[];
  workedCells: WorkedCell[];
  unmatchedColoredCells: UnmatchedColoredCell[];
  warnings: string[];
}

// ── Utility helpers ──

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
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

// ── Theme Color Resolution ──

/**
 * Parse theme colors from the workbook's theme1 XML.
 */
export function parseThemeColors(themeXml: string): Map<number, string> {
  const map = new Map<number, string>();
  const xmlOrderToThemeIndex = [1, 0, 3, 2, 4, 5, 6, 7, 8, 9, 10, 11];

  const clrSchemeMatch = themeXml.match(
    /<a:clrScheme[^>]*>(.*?)<\/a:clrScheme>/s,
  );
  if (!clrSchemeMatch) return map;

  const colorElements = clrSchemeMatch[1];
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
 */
export function findClosestLegendColor(
  argb: string,
  legend: Map<string, PTOType>,
): PTOType | undefined {
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
 * Try to parse hours from a note string.
 */
export function parseHoursFromNote(note: string): number | undefined {
  const strict = note.match(/(\d+(?:\.\d+)?|\.\d+)\s*(?:hours?|hrs?|h)\b/i);
  if (strict) {
    const val = parseFloat(strict[1]);
    if (!isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS) return val;
  }

  const bare = note.match(/(?<![A-Za-z])(\d+(?:\.\d+)?|\.\d+)(?![A-Za-z\d])/);
  if (bare) {
    const val = parseFloat(bare[1]);
    if (!isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS) return val;
  }
  return undefined;
}

/**
 * Check if a note contains a clear, unambiguous hours specification.
 */
export function isStrictHoursMatch(note: string): boolean {
  const strict = note.match(/(\d+(?:\.\d+)?|\.\d+)\s*(?:hours?|hrs?|h)\b/i);
  if (!strict) return false;
  const val = parseFloat(strict[1]);
  return !isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS;
}

// ── Legend & Color Parsing ──

/**
 * Find the row containing the "Legend" header in column Z.
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

  const maxEntries = 10;
  for (let i = 1; i <= maxEntries; i++) {
    const row = headerRow + i;
    const cell = ws.getCell(row, LEGEND_COL);
    const label = cell.value?.toString().trim() || "";
    if (!label) break;

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
 * whose label is "Partial PTO".
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

// ── Calendar Grid Parsing ──

/**
 * Parse the 12-month calendar grid from a worksheet.
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
  const unmatchedColoredCells: UnmatchedColoredCell[] = [];
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
      // Day 1 is where we expect it
    } else {
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

      const fill = cell.fill as ExcelJS.FillPattern | undefined;
      let ptoType: PTOType | undefined;
      let matchMethod = "";
      let matchedArgb: string | undefined;

      if (fill?.type === "pattern") {
        const fgArgb = resolveColorToARGB(fill.fgColor as any, themeColors);
        if (fgArgb) {
          ptoType = legend.get(fgArgb);
          if (ptoType) {
            matchMethod = "exact";
            matchedArgb = fgArgb;
          } else {
            ptoType = findClosestLegendColor(fgArgb, legend);
            if (ptoType) {
              matchMethod = `approximate (resolved=${fgArgb})`;
              matchedArgb = fgArgb;
            }
          }
        }

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
        let hours = 8;
        let isNoteDerived = false;
        if (noteText) {
          const noteHours = parseHoursFromNote(noteText);
          if (noteHours !== undefined) {
            hours = noteHours;
            isNoteDerived = isStrictHoursMatch(noteText);
          }
        }
        const entry: ImportedPtoEntry = { date: dateStr, type: ptoType, hours };
        if (isNoteDerived) {
          entry.isNoteDerived = true;
        }
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
          workedCells.push({ date: dateStr, note: noteText });
        } else {
          unmatchedNotedCells.push({ date: dateStr, note: noteText });
          if (fill?.type === "pattern") {
            const cellArgb =
              resolveColorToARGB(fill.fgColor as any, themeColors) ||
              resolveColorToARGB(fill.bgColor as any, themeColors);
            if (
              cellArgb &&
              cellArgb !== "FFFFFFFF" &&
              cellArgb !== "FF000000"
            ) {
              unmatchedColoredCells.push({
                date: dateStr,
                color: cellArgb,
                note: noteText,
              });
            }
          }
        }
      } else if (fill?.type === "pattern") {
        const cellArgb =
          resolveColorToARGB(fill.fgColor as any, themeColors) ||
          resolveColorToARGB(fill.bgColor as any, themeColors);
        if (cellArgb && cellArgb !== "FFFFFFFF" && cellArgb !== "FF000000") {
          if (dow === 0 || dow === 6) {
            workedCells.push({
              date: dateStr,
              note: `(inferred weekend work from cell color ${cellArgb})`,
            });
            const monthName = MONTH_NAMES[month - 1];
            warnings.push(
              `Sheet "${ws.name}" ${monthName}: non-legend colored weekend cell ` +
                `on ${dateStr} (color=${cellArgb}). Treating as potential weekend work.`,
            );
          } else {
            unmatchedColoredCells.push({
              date: dateStr,
              color: cellArgb,
              note: "",
            });
          }
        }
      }

      col++;
      if (dow === 6) {
        row++;
        col = startCol;
      }
    }
  }

  return {
    entries,
    unmatchedNotedCells,
    workedCells,
    unmatchedColoredCells,
    warnings,
  };
}

// ── PTO Calc Parsing ──

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
 * Read the PTO Calculation section to get declared used hours per month.
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
 * Read carryover_hours from column L at the PTO calc start row.
 */
export function parseCarryoverHours(ws: ExcelJS.Worksheet): number {
  const startRow = findPtoCalcStartRow(ws);
  const cell = ws.getCell(startRow, 12);
  const val = cell.value;
  if (typeof val === "number") return val;
  if (val !== null && val !== undefined) {
    const parsed = parseFloat(val.toString());
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// ── Partial-Day Adjustment ──

/**
 * Adjust PTO entry hours based on declared monthly totals.
 */
export function adjustPartialDays(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[] } {
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

    monthResultEntries.sort((a, b) => a.date.localeCompare(b.date));
    const partials = monthResultEntries.filter(
      (e) => e.isPartialPtoColor === true,
    );

    if (partials.length > 0) {
      const pinned = partials.filter((e) => e.isNoteDerived === true);
      const unpinned = partials.filter((e) => e.isNoteDerived !== true);

      const fullTotal = monthResultEntries
        .filter((e) => !e.isPartialPtoColor)
        .reduce((sum, e) => sum + e.hours, 0);
      const pinnedTotal = pinned.reduce((sum, e) => sum + e.hours, 0);

      if (unpinned.length > 0) {
        const remainingForUnpinned =
          Math.round((declaredTotal - fullTotal - pinnedTotal) * 100) / 100;
        const hoursEach =
          Math.round((remainingForUnpinned / unpinned.length) * 100) / 100;

        if (hoursEach > 0 && hoursEach <= 8) {
          for (const partial of unpinned) {
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
          warnings.push(
            `"${sheetName}" month ${calc.month}: ` +
              `partial distribution produced ${hoursEach}h per entry (out of 0–8 range). ` +
              `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, pinnedTotal=${pinnedTotal}h, ` +
              `${unpinned.length} unpinned partial entries. No adjustment applied.`,
          );
        }
      } else {
        const totalWithPinned =
          Math.round((fullTotal + pinnedTotal) * 100) / 100;
        if (Math.abs(totalWithPinned - declaredTotal) > 0.1) {
          warnings.push(
            `"${sheetName}" month ${calc.month}: ` +
              `all ${pinned.length} partial entries have note-derived hours (pinned). ` +
              `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, pinnedTotal=${pinnedTotal}h, ` +
              `total=${totalWithPinned}h. Not overriding pinned values.`,
          );
        }
      }
    } else if (calendarTotal > declaredTotal) {
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
      warnings.push(
        `"${sheetName}" month ${calc.month}: ` +
          `calendar total (${calendarTotal}h) < declared (${declaredTotal}h) ` +
          `but no Partial PTO entries found. Cannot back-calculate.`,
      );
    }
  }

  return { entries: result, warnings };
}

// ── Partial PTO Reconciliation ──

/**
 * Reconcile partial PTO entries that were missed by calendar color matching.
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
    const detectedTotal = result
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

    const gap = Math.round((calc.usedHours - detectedTotal) * 100) / 100;
    if (gap <= 0) continue;

    const monthNoted = unmatchedNotedCells.filter(
      (c) => c.date.substring(5, 7) === monthStr,
    );

    if (monthNoted.length > 0) {
      let remaining = gap;
      for (const noted of monthNoted) {
        if (remaining <= 0) break;

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

      if (remaining > 0) {
        warnings.push(
          `"${sheetName}" month ${calc.month}: partially reconciled. ` +
            `Declared=${calc.usedHours}h, detected=${detectedTotal}h, ` +
            `assigned ${gap - remaining}h from notes, ` +
            `${remaining}h still unaccounted for.`,
        );
      }
    } else {
      warnings.push(
        `"${sheetName}" month ${calc.month}: PTO hours mismatch. ` +
          `Declared=${calc.usedHours}h, detected=${detectedTotal}h, ` +
          `gap=${gap}h. No cell notes found for reconciliation.`,
      );
    }
  }

  return { entries: result, warnings };
}

// ── Weekend "Worked" Days ──

/**
 * Try to parse hours from a "worked" note.
 */
export function parseWorkedHoursFromNote(note: string): number | undefined {
  let match = note.match(/\(\+?\s*(\d+(?:\.\d+)?)\s*hours?\s*(?:PTO)?\s*\)/i);
  if (match) return parseFloat(match[1]);

  match = note.match(/make\s*up\s+(\d+(?:\.\d+)?)/i);
  if (match) return parseFloat(match[1]);

  match = note.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 12) return val;
  }

  const rangeMatch = note.match(
    /worked\s+(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*[-–]+\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?/i,
  );
  if (rangeMatch) {
    const startH = parseInt(rangeMatch[1], 10);
    const startM = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const endH = parseInt(rangeMatch[3], 10);
    const endM = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
    const diff =
      Math.round((endH + endM / 60 - (startH + startM / 60)) * 100) / 100;
    if (diff > 0 && diff <= 12) return diff;
  }

  return undefined;
}

/**
 * Process "worked" weekend/off-day cells to create negative PTO credit entries.
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

    const existingTotal = existingEntries
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

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

    if (unparsed.length > 0) {
      const parsedCredit = parsed.reduce((sum, p) => sum + p.hours, 0);
      const unparsedCredit =
        Math.round((existingTotal - parsedCredit - declaredTotal) * 100) / 100;

      if (unparsedCredit > 0 && unparsed.length === 1) {
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
        for (const cell of unparsed) {
          warnings.push(
            `"${sheetName}": detected worked day on ${cell.date}. ` +
              `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
              `Could not determine hours — ${unparsed.length} worked cells ` +
              `in month ${month} with ${unparsedCredit}h total deficit. Skipping.`,
          );
        }
      } else {
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

// ── Weekend-Work + Partial-PTO Joint Inference ──

/**
 * Joint inference for months with both Partial PTO and unprocessed weekend work.
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

  const negativeEntryDates = new Set(
    entries.filter((e) => e.hours < 0).map((e) => e.date),
  );
  const unprocessedWorked = workedCells.filter(
    (wc) => !negativeEntryDates.has(wc.date),
  );

  const workedByMonth = new Map<number, WorkedCell[]>();
  for (const wc of unprocessedWorked) {
    const month = parseInt(wc.date.substring(5, 7), 10);
    if (!workedByMonth.has(month)) workedByMonth.set(month, []);
    workedByMonth.get(month)!.push(wc);
  }

  for (const calc of ptoCalcRows) {
    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const monthResultEntries = result.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const currentTotal = monthResultEntries.reduce(
      (sum, e) => sum + e.hours,
      0,
    );

    if (Math.abs(currentTotal - declaredTotal) < 0.01) continue;

    const partials = monthResultEntries.filter(
      (e) => e.isPartialPtoColor === true,
    );
    const worked = workedByMonth.get(calc.month) || [];

    if (partials.length === 0 || worked.length === 0) continue;

    const unpinnedPartials = partials.filter((e) => e.isNoteDerived !== true);
    if (unpinnedPartials.length === 0) continue;

    const pinnedTotal = partials
      .filter((e) => e.isNoteDerived === true)
      .reduce((sum, e) => sum + e.hours, 0);
    const unpinnedCount = unpinnedPartials.length;
    const workedCount = worked.length;

    const fullTotal = monthResultEntries
      .filter((e) => !e.isPartialPtoColor && e.hours > 0)
      .reduce((sum, e) => sum + e.hours, 0);
    const existingCredits = monthResultEntries
      .filter((e) => e.hours < 0)
      .reduce((sum, e) => sum + e.hours, 0);

    const target = declaredTotal - fullTotal - pinnedTotal - existingCredits;

    let p: number | undefined;
    let w: number | undefined;
    let method = "";

    const p1 =
      Math.round(((target + workedCount * 8) / unpinnedCount) * 100) / 100;
    if (p1 > 0 && p1 <= 8) {
      p = p1;
      w = 8;
      method = "w assumed 8h";
    }

    if (p === undefined) {
      const w2 =
        Math.round(((unpinnedCount * 4 - target) / workedCount) * 100) / 100;
      if (w2 > 0 && w2 <= 8) {
        p = 4;
        w = w2;
        method = "p assumed 4h";
      }
    }

    if (p === undefined) {
      const midW = (unpinnedCount * 4 - target) / workedCount;
      const clampedW = Math.round(Math.min(8, Math.max(0.5, midW)) * 100) / 100;
      const derivedP =
        Math.round(((target + workedCount * clampedW) / unpinnedCount) * 100) /
        100;
      if (derivedP > 0 && derivedP <= 8) {
        p = derivedP;
        w = clampedW;
        method = "constrained solve";
      }
    }

    if (p !== undefined && w !== undefined) {
      for (const partial of unpinnedPartials) {
        partial.hours = p;
        const note =
          `Inferred p=${p}h (${method}). ` +
          `Equation: declared(${declaredTotal}) = full(${fullTotal}) + pinned(${pinnedTotal}) + ` +
          `${unpinnedCount}×p − ${workedCount}×${w}`;
        partial.notes = partial.notes ? `${partial.notes} ${note}` : note;
      }

      for (const wc of worked) {
        newWorkedEntries.push({
          date: wc.date,
          type: "PTO",
          hours: -w,
          notes:
            `Inferred w=${w}h (${method}). ` +
            `Equation: declared(${declaredTotal}) = full(${fullTotal}) + pinned(${pinnedTotal}) + ` +
            `${unpinnedCount}×${p} − ${workedCount}×w. ` +
            `Cell note: "${wc.note.replace(/\n/g, " ").trim()}"`,
        });
        handledWorkedDates.add(wc.date);
      }

      const newTotal =
        fullTotal +
        pinnedTotal +
        existingCredits +
        unpinnedCount * p -
        workedCount * w;
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
          `${unpinnedCount} unpinned partial(s), ${workedCount} worked cell(s). ` +
          `No adjustment applied.`,
      );
    }
  }

  return { entries: result, newWorkedEntries, handledWorkedDates, warnings };
}

// ── Employee Info Parsing ──

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
export function parseEmployeeInfo(ws: ExcelJS.Worksheet): EmployeeImportInfo {
  const name = ws.name.trim();

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
      const datePart = match[1].trim();
      const parsed = smartParseDate(datePart);
      if (parsed) {
        hireDate = parsed;
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

  return { name, hireDate, year, carryoverHours, spreadsheetPtoRate };
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

// ── Acknowledgement Parsing ──

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

// ── Note-Based Type Override ──

/**
 * Override the PTO type for approximate-color-matched entries when the cell
 * note contains an explicit type keyword.
 */
export function overrideTypeFromNote(
  entries: ImportedPtoEntry[],
  sheetName = "",
): {
  entries: ImportedPtoEntry[];
  workedCells: WorkedCell[];
  warnings: string[];
} {
  const result: ImportedPtoEntry[] = [];
  const workedCells: WorkedCell[] = [];
  const warnings: string[] = [];

  for (const entry of entries) {
    const isApprox = entry.notes?.includes("Color matched via approximate");
    if (!isApprox) {
      result.push({ ...entry });
      continue;
    }

    const noteMatch = entry.notes?.match(/Cell note: "(.+?)"/);
    const rawNote = noteMatch?.[1] || "";
    if (!rawNote) {
      result.push({ ...entry });
      continue;
    }

    if (/\bworked\b/i.test(rawNote)) {
      workedCells.push({ date: entry.date, note: rawNote });
      warnings.push(
        `"${sheetName}" ${entry.date}: approximate-matched ${entry.type} ` +
          `overridden → Worked cell (note: "${rawNote.substring(0, 60)}").`,
      );
      continue;
    }

    if (/\bPTO\b/i.test(rawNote) && entry.type !== "PTO") {
      const copy = { ...entry };
      const oldType = copy.type;
      copy.type = "PTO";
      copy.notes =
        (copy.notes || "") +
        ` Type overridden from ${oldType} to PTO based on note keyword.`;
      result.push(copy);
      warnings.push(
        `"${sheetName}" ${entry.date}: approximate-matched ${oldType} ` +
          `overridden → PTO (note: "${rawNote.substring(0, 60)}").`,
      );
      continue;
    }

    if (/\bsick\b/i.test(rawNote) && entry.type !== "Sick") {
      const copy = { ...entry };
      const oldType = copy.type;
      copy.type = "Sick";
      copy.notes =
        (copy.notes || "") +
        ` Type overridden from ${oldType} to Sick based on note keyword.`;
      result.push(copy);
      warnings.push(
        `"${sheetName}" ${entry.date}: approximate-matched ${oldType} ` +
          `overridden → Sick (note: "${rawNote.substring(0, 60)}").`,
      );
      continue;
    }

    result.push({ ...entry });
  }

  return { entries: result, workedCells, warnings };
}

// ── Sick → PTO Reclassification ──

/**
 * Reclassify Sick-colored entries as PTO when the employee has exhausted
 * their annual sick-time allowance (24h).
 */
export function reclassifySickAsPto(
  entries: ImportedPtoEntry[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  const result = entries.map((e) => ({ ...e }));
  const warnings: string[] = [];

  const sorted = result.slice().sort((a, b) => a.date.localeCompare(b.date));
  const dateToIndices = new Map<string, number[]>();
  for (let i = 0; i < result.length; i++) {
    const key = `${result[i].date}|${result[i].type}|${result[i].hours}`;
    if (!dateToIndices.has(key)) dateToIndices.set(key, []);
    dateToIndices.get(key)!.push(i);
  }

  let cumulativeSickHours = 0;

  for (const entry of sorted) {
    if (entry.type !== "Sick") continue;

    const entryHours = Math.abs(entry.hours);

    if (cumulativeSickHours >= ANNUAL_SICK_ALLOWANCE) {
      const key = `${entry.date}|Sick|${entry.hours}`;
      const indices = dateToIndices.get(key);
      if (indices && indices.length > 0) {
        const idx = indices.shift()!;
        result[idx].type = "PTO";
        const note =
          `Cell colored as Sick but reclassified as PTO — employee had exhausted ` +
          `${ANNUAL_SICK_ALLOWANCE}h sick allowance (used ${cumulativeSickHours}h prior to this date).`;
        result[idx].notes = result[idx].notes
          ? `${result[idx].notes} ${note}`
          : note;
        warnings.push(
          `"${sheetName}" ${entry.date}: Sick entry reclassified as PTO ` +
            `(${entryHours}h). Employee had used ${cumulativeSickHours}h of ` +
            `${ANNUAL_SICK_ALLOWANCE}h sick allowance.`,
        );
      }
      cumulativeSickHours += entryHours;
    } else {
      cumulativeSickHours += entryHours;
    }
  }

  return { entries: result, warnings };
}

// ── Column-S-Guided Sick → PTO Reclassification ──

/**
 * After all reconciliation phases, reclassify Sick entries as PTO based
 * on column S gap.
 */
export function reclassifySickByColumnS(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  const phase12Occurred = entries.some(
    (e) =>
      e.notes?.includes("reclassified as PTO") &&
      e.notes?.includes("sick allowance"),
  );
  if (!phase12Occurred) {
    return { entries, warnings: [] };
  }

  const result = entries.map((e) => ({ ...e }));
  const warnings: string[] = [];

  for (const { month, usedHours: declared } of ptoCalcRows) {
    let ptoTotal = 0;
    const sickIndices: number[] = [];

    for (let i = 0; i < result.length; i++) {
      const m = parseInt(result[i].date.substring(5, 7));
      if (m !== month) continue;
      if (result[i].type === "PTO") {
        ptoTotal += result[i].hours;
      } else if (result[i].type === "Sick") {
        sickIndices.push(i);
      }
    }

    let gap = declared - ptoTotal;
    if (gap < 0.1 || sickIndices.length === 0) continue;

    sickIndices.sort((a, b) => result[a].date.localeCompare(result[b].date));

    for (const idx of sickIndices) {
      const entryHours = Math.abs(result[idx].hours);
      if (entryHours > gap + 0.1) continue;

      result[idx].type = "PTO";
      const note =
        `Sick entry reclassified as PTO based on column S gap ` +
        `(sick allowance appears exhausted). ` +
        `Declared=${declared}h, PTO before reclassification=${ptoTotal.toFixed(1)}h, ` +
        `gap=${gap.toFixed(1)}h.`;
      result[idx].notes = result[idx].notes
        ? `${result[idx].notes} ${note}`
        : note;

      warnings.push(
        `"${sheetName}" ${result[idx].date}: Sick reclassified as PTO ` +
          `(${entryHours}h) based on column S gap. ` +
          `Declared=${declared}h, prior PTO=${ptoTotal.toFixed(1)}h.`,
      );

      ptoTotal += entryHours;
      gap -= entryHours;
      if (gap < 0.1) break;
    }
  }

  return { entries: result, warnings };
}

// ── Column-S-Guided Bereavement → PTO Reclassification ──

/**
 * Reclassify approximate-matched Bereavement entries as PTO when column S
 * declares more PTO than detected.
 */
export function reclassifyBereavementByColumnS(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  const result = entries.map((e) => ({ ...e }));
  const warnings: string[] = [];

  for (const { month, usedHours: declared } of ptoCalcRows) {
    const monthStr = pad2(month);
    let ptoTotal = 0;
    const bereavIndices: number[] = [];

    for (let i = 0; i < result.length; i++) {
      if (result[i].date.substring(5, 7) !== monthStr) continue;
      if (result[i].type === "PTO") {
        ptoTotal += result[i].hours;
      } else if (
        result[i].type === "Bereavement" &&
        result[i].notes?.includes("Color matched via approximate")
      ) {
        bereavIndices.push(i);
      }
    }

    let gap = declared - ptoTotal;
    if (gap < 0.5 || bereavIndices.length === 0) continue;

    bereavIndices.sort((a, b) => result[a].hours - result[b].hours);

    for (const idx of bereavIndices) {
      const entryHours = Math.abs(result[idx].hours);
      if (entryHours > gap + 0.1) continue;

      result[idx].type = "PTO";
      const note =
        `Bereavement reclassified as PTO based on column S gap. ` +
        `Declared=${declared}h, PTO before=${ptoTotal.toFixed(1)}h, ` +
        `gap=${gap.toFixed(1)}h.`;
      result[idx].notes = result[idx].notes
        ? `${result[idx].notes} ${note}`
        : note;

      warnings.push(
        `"${sheetName}" ${result[idx].date}: Bereavement reclassified as PTO ` +
          `(${entryHours}h) based on column S gap. ` +
          `Declared=${declared}h, prior PTO=${ptoTotal.toFixed(1)}h.`,
      );

      ptoTotal += entryHours;
      gap -= entryHours;
      if (gap < 0.5) break;
    }
  }

  return { entries: result, warnings };
}

// ── Non-Standard Color PTO Recognition ──

/**
 * Reconcile unmatched colored cells as PTO when column S declares more.
 */
export function reconcileUnmatchedColoredCells(
  existingEntries: ImportedPtoEntry[],
  unmatchedColoredCells: UnmatchedColoredCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): { entries: ImportedPtoEntry[]; warnings: string[] } {
  const newEntries: ImportedPtoEntry[] = [];
  const warnings: string[] = [];

  if (unmatchedColoredCells.length === 0) {
    return { entries: newEntries, warnings };
  }

  for (const calc of ptoCalcRows) {
    if (calc.usedHours <= 0) continue;

    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const calendarTotal = existingEntries
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

    let gap = Math.round((declaredTotal - calendarTotal) * 100) / 100;

    if (gap < 7.9) continue;

    const monthCells = unmatchedColoredCells.filter(
      (c) => c.date.substring(5, 7) === monthStr,
    );
    if (monthCells.length === 0) continue;

    const existingDates = new Set(existingEntries.map((e) => e.date));
    const availableCells = monthCells.filter((c) => !existingDates.has(c.date));
    if (availableCells.length === 0) continue;

    const withNotes: UnmatchedColoredCell[] = [];
    const withoutNotes: UnmatchedColoredCell[] = [];
    for (const cell of availableCells) {
      if (cell.note) {
        withNotes.push(cell);
      } else {
        withoutNotes.push(cell);
      }
    }

    for (const cell of withNotes) {
      if (gap <= 0.1) break;
      const noteHours = parseHoursFromNote(cell.note);
      const assignedHours =
        noteHours !== undefined ? Math.min(noteHours, gap) : Math.min(8, gap);
      newEntries.push({
        date: cell.date,
        type: "PTO",
        hours: Math.round(assignedHours * 100) / 100,
        notes:
          `Non-standard color (${cell.color}) treated as PTO — cell color not in legend ` +
          `but PTO Calc discrepancy suggests PTO. Cell note: "${cell.note.replace(/\n/g, " ")}"`,
      });
      gap = Math.round((gap - assignedHours) * 100) / 100;
    }

    if (gap > 0.1 && withoutNotes.length > 0) {
      const hoursEach = Math.round((gap / withoutNotes.length) * 100) / 100;

      if (hoursEach > 0 && hoursEach <= 8) {
        for (const cell of withoutNotes) {
          if (gap <= 0.1) break;
          const assignedHours = Math.min(hoursEach, gap);
          newEntries.push({
            date: cell.date,
            type: "PTO",
            hours: Math.round(assignedHours * 100) / 100,
            notes:
              `Non-standard color (${cell.color}) treated as PTO — cell color not in legend ` +
              `but PTO Calc discrepancy suggests PTO.`,
          });
          gap = Math.round((gap - assignedHours) * 100) / 100;
        }
      } else {
        warnings.push(
          `"${sheetName}" month ${calc.month}: ${withoutNotes.length} unmatched colored cells ` +
            `but distributing ${gap}h yields ${hoursEach}h each (out of 0–8 range). ` +
            `No PTO entries created from unmatched cells.`,
        );
      }
    }

    if (gap > 0.1) {
      warnings.push(
        `"${sheetName}" month ${calc.month}: partially reconciled via unmatched colored cells. ` +
          `Declared=${declaredTotal}h, calendar=${calendarTotal}h, ` +
          `assigned ${Math.round((declaredTotal - calendarTotal - gap) * 100) / 100}h from unmatched cells, ` +
          `${gap}h still unaccounted for.`,
      );
    } else if (newEntries.some((e) => e.date.substring(5, 7) === monthStr)) {
      warnings.push(
        `"${sheetName}" month ${calc.month}: Phase 13 reconciled ` +
          `${availableCells.length} unmatched colored cell(s) as PTO. ` +
          `Declared=${declaredTotal}h, original calendar=${calendarTotal}h.`,
      );
    }
  }

  return { entries: newEntries, warnings };
}

// ── Over-Coloring Detection ──

/**
 * Detect months where calendar-detected PTO exceeds the declared column S total.
 */
export function detectOverColoring(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): { warnings: string[] } {
  const warnings: string[] = [];

  for (const calc of ptoCalcRows) {
    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const monthEntries = entries.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const calendarTotal = monthEntries.reduce((sum, e) => sum + e.hours, 0);

    const delta = Math.round((calendarTotal - declaredTotal) * 100) / 100;
    if (delta <= 0.1) continue;

    const noteMatches: string[] = [];
    for (const entry of monthEntries) {
      if (entry.notes && OVERCOLOR_NOTE_KEYWORDS.test(entry.notes)) {
        noteMatches.push(
          `${entry.date} note: '${entry.notes.replace(/\n/g, " ").substring(0, 120)}'`,
        );
      }
    }

    let warning =
      `Over-coloring detected for ${sheetName} month ${calc.month}: ` +
      `calendar=${calendarTotal}h, declared=${declaredTotal}h (Δ=+${delta}h).`;

    if (noteMatches.length > 0) {
      warning += ` Relevant notes: ${noteMatches.join("; ")}.`;
    }

    warning += ` Column S is authoritative; calendar over-reports by ${delta}h.`;

    warnings.push(warning);
  }

  return { warnings };
}

// ── Import Acknowledgement Generation ──

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

// ── Sheet Orchestrator ──

/**
 * Parse a single employee worksheet and return all extracted data (no DB interaction).
 */
export function parseEmployeeSheet(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): SheetImportResult {
  const warnings: string[] = [];

  const legend = parseLegend(ws, themeColors);
  if (legend.size === 0) {
    warnings.push(`No legend found on sheet "${ws.name}"`);
  }

  const employee = parseEmployeeInfo(ws);
  if (!employee.year) {
    warnings.push(`Could not determine year from sheet "${ws.name}"`);
  }
  if (!employee.hireDate) {
    warnings.push(`Could not determine hire date from sheet "${ws.name}"`);
  }

  const { warning: rateWarning } = computePtoRate(employee);
  if (rateWarning) {
    warnings.push(rateWarning);
  }

  const partialPtoColors = parsePartialPtoColors(ws, themeColors);

  const {
    entries: calendarEntries,
    unmatchedNotedCells,
    workedCells: calendarWorkedCells,
    unmatchedColoredCells,
    warnings: calendarWarnings,
  } = parseCalendarGrid(
    ws,
    employee.year,
    legend,
    themeColors,
    partialPtoColors,
  );
  warnings.push(...calendarWarnings);

  const {
    entries: noteOverriddenEntries,
    workedCells: noteWorkedCells,
    warnings: noteOverrideWarnings,
  } = overrideTypeFromNote(calendarEntries, ws.name);
  const workedCells = [...calendarWorkedCells, ...noteWorkedCells];
  warnings.push(...noteOverrideWarnings);

  const { entries: sickReclassifiedEntries, warnings: sickWarnings } =
    reclassifySickAsPto(noteOverriddenEntries, ws.name);
  warnings.push(...sickWarnings);

  const ptoCalcRows = parsePtoCalcUsedHours(ws);
  const { entries: adjustedEntries, warnings: adjustWarnings } =
    adjustPartialDays(sickReclassifiedEntries, ptoCalcRows, ws.name);
  let ptoEntries = adjustedEntries;
  warnings.push(...adjustWarnings);

  const { entries: reconciledEntries, warnings: reconWarnings } =
    reconcilePartialPto(ptoEntries, unmatchedNotedCells, ptoCalcRows, ws.name);
  ptoEntries = reconciledEntries;
  warnings.push(...reconWarnings);

  const {
    entries: phase11Entries,
    newWorkedEntries: phase11WorkedEntries,
    handledWorkedDates,
    warnings: phase11Warnings,
  } = inferWeekendPartialHours(ptoEntries, workedCells, ptoCalcRows, ws.name);
  ptoEntries = [...phase11Entries, ...phase11WorkedEntries];
  warnings.push(...phase11Warnings);

  const remainingWorkedCells = workedCells.filter(
    (wc) => !handledWorkedDates.has(wc.date),
  );
  const { entries: workedEntries, warnings: workedWarnings } =
    processWorkedCells(remainingWorkedCells, ptoEntries, ptoCalcRows, ws.name);
  ptoEntries = [...ptoEntries, ...workedEntries];
  warnings.push(...workedWarnings);

  const { entries: unmatchedColorEntries, warnings: unmatchedColorWarnings } =
    reconcileUnmatchedColoredCells(
      ptoEntries,
      unmatchedColoredCells,
      ptoCalcRows,
      ws.name,
    );
  ptoEntries = [...ptoEntries, ...unmatchedColorEntries];
  warnings.push(...unmatchedColorWarnings);

  const { entries: columnSReclassEntries, warnings: columnSReclassWarnings } =
    reclassifySickByColumnS(ptoEntries, ptoCalcRows, ws.name);
  ptoEntries = columnSReclassEntries;
  warnings.push(...columnSReclassWarnings);

  const { entries: bereavReclassEntries, warnings: bereavReclassWarnings } =
    reclassifyBereavementByColumnS(ptoEntries, ptoCalcRows, ws.name);
  ptoEntries = bereavReclassEntries;
  warnings.push(...bereavReclassWarnings);

  const { warnings: overColorWarnings } = detectOverColoring(
    ptoEntries,
    ptoCalcRows,
    ws.name,
  );
  warnings.push(...overColorWarnings);

  const spreadsheetAcks = parseAcknowledgements(ws, employee.year);

  const importAcks = generateImportAcknowledgements(
    ptoEntries,
    ptoCalcRows,
    employee.year,
    ws.name,
  );

  const importAckKeys = new Set(importAcks.map((a) => `${a.month}:${a.type}`));
  const warningMonths = new Set(
    importAcks
      .filter((a) => a.type === "employee" && a.status === "warning")
      .map((a) => a.month),
  );
  const mergedAcks = [
    ...importAcks,
    ...spreadsheetAcks.filter(
      (a) =>
        !importAckKeys.has(`${a.month}:${a.type}`) &&
        !(a.type === "admin" && warningMonths.has(a.month)),
    ),
  ];

  return { employee, ptoEntries, acknowledgements: mergedAcks, warnings };
}

/**
 * Extract theme colors from an ExcelJS workbook object.
 * Works with both Node.js and browser builds of ExcelJS.
 */
export function extractThemeColors(
  workbook: ExcelJS.Workbook,
): Map<number, string> {
  try {
    const wbAny = workbook as any;
    const themeXml: string | undefined =
      wbAny._themes?.theme1 ??
      wbAny.themes?.theme1 ??
      wbAny._model?.themes?.theme1;
    if (themeXml) {
      return parseThemeColors(themeXml);
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_OFFICE_THEME;
}

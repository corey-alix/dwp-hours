/**
 * Excel Parsing — Shared Types and Constants
 *
 * All interfaces, type exports, and shared constants used across
 * the excel parsing modules.
 */

import type ExcelJS from "exceljs";
import type { PTOType } from "../businessRules.js";

// ── Constants ──

/** Calendar grid column-group start columns (1-indexed). */
export const COL_STARTS = [2, 10, 18];

/** Calendar grid row-group header rows. */
export const ROW_GROUP_STARTS = [4, 13, 22, 31];

/** Legend column (Z = 26). */
export const LEGEND_COL = 26;

/** Max rows to scan when searching for dynamic positions. */
export const LEGEND_SCAN_MAX_ROW = 30;

/** PTO Calculation section: assumed data start row (January). */
export const PTO_CALC_DATA_START_ROW = 42;

/** Acknowledgement columns. */
export const EMP_ACK_COL = 24; // X
export const ADMIN_ACK_COL = 25; // Y

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
export const LEGEND_LABEL_TO_PTO_TYPE: Record<string, PTOType> = {
  Sick: "Sick",
  "Full PTO": "PTO",
  "Partial PTO": "PTO",
  "Planned PTO": "PTO",
  Bereavement: "Bereavement",
  "Jury Duty": "Jury Duty",
};

/** Maximum Euclidean RGB distance for approximate color matching. */
export const MAX_COLOR_DISTANCE = 100;

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
export const ANNUAL_SICK_ALLOWANCE = 24;

/** Maximum hours a single PTO entry can represent (sanity cap). */
export const MAX_SINGLE_ENTRY_HOURS = 24;

/** Minimum chroma for approximate color matching. */
export const MIN_CHROMA_FOR_APPROX = 40;

/** Maximum rows to scan above/below expected position when searching for day 1. */
export const DAY1_SCAN_RANGE = 3;

/** Keywords in cell notes indicating weekend-makeup work. */
export const OVERCOLOR_NOTE_KEYWORDS = /worked|make\s*up|makeup|offset/i;

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
  /** Fatal or blocking issues that prevented full processing. */
  errors: string[];
  /** Auto-corrected issues that were resolved during parsing. */
  resolved: string[];
}

export interface ImportResult {
  employeesProcessed: number;
  employeesCreated: number;
  ptoEntriesUpserted: number;
  ptoEntriesAutoApproved: number;
  acknowledgementsSynced: number;
  warnings: string[];
  /** Fatal or blocking issues that prevented full processing. */
  errors: string[];
  /** Auto-corrected issues that were resolved during parsing. */
  resolved: string[];
  perEmployee: {
    name: string;
    employeeId: number;
    ptoEntries: number;
    ptoEntriesAutoApproved: number;
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
  resolved: string[];
}

// ── Utility helpers ──

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Extract the numeric value from a cell, handling plain numbers,
 * formula results, and string representations.
 */
export function getCellNumericValue(cell: ExcelJS.Cell): number | undefined {
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

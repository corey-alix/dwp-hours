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
  validateHours,
  VALIDATION_MESSAGES,
  MONTH_NAMES,
  PTO_EARNING_SCHEDULE,
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

// ── Result types ──

export interface ImportedPtoEntry {
  date: string;
  type: PTOType;
  hours: number;
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
 * rows below it. Throws if "Legend" header is not found.
 */
export function parseLegend(ws: ExcelJS.Worksheet): Map<string, PTOType> {
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
    if (fill?.type === "pattern" && fill.fgColor?.argb) {
      colorMap.set(fill.fgColor.argb.toUpperCase(), ptoType);
    }
  }

  return colorMap;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Parse the 12-month calendar grid from a worksheet.
 * Walks each month block, checks cell fill colors against the legend,
 * and returns all PTO entries found (defaulting to 8 hours each).
 */
export function parseCalendarGrid(
  ws: ExcelJS.Worksheet,
  year: number,
  legend: Map<string, PTOType>,
): ImportedPtoEntry[] {
  const entries: ImportedPtoEntry[] = [];

  for (let month = 1; month <= 12; month++) {
    const m0 = month - 1;
    const colGroup = Math.floor(m0 / 4);
    const rowGroup = m0 % 4;

    const startCol = COL_STARTS[colGroup];
    const headerRow = ROW_GROUP_STARTS[rowGroup];
    const dateStartRow = headerRow + 2;

    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = new Date(year, month - 1, 1).getDay();

    let row = dateStartRow;
    let col = startCol + firstDow;

    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (firstDow + day - 1) % 7;
      const cell = ws.getCell(row, col);

      // Check cell fill color
      const fill = cell.fill as ExcelJS.FillPattern | undefined;
      if (fill?.type === "pattern" && fill.fgColor?.argb) {
        const argb = fill.fgColor.argb.toUpperCase();
        const ptoType = legend.get(argb);
        if (ptoType) {
          const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
          // Check for partial-day indication in cell note
          let hours = 8;
          const note =
            typeof cell.note === "string"
              ? cell.note
              : (cell.note as any)?.texts?.map((t: any) => t.text).join("") ||
                "";
          if (note) {
            const noteMatch = note.match(/:\s*(\d+(?:\.\d+)?)h/);
            if (noteMatch) {
              hours = parseFloat(noteMatch[1]);
            }
          }
          entries.push({ date: dateStr, type: ptoType, hours });
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

  return entries;
}

// ── Phase 2: Partial-Day Detection ──

interface PtoCalcRow {
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
 * Adjust PTO entry hours based on declared monthly totals.
 *
 * For each month, the PTO Calculation section declares total used PTO hours.
 * The calendar may have N full-day entries (8h each). If the sum exceeds the
 * declared total, the last entry in that month gets reduced to a partial day.
 *
 * Note: This function groups ALL PTO types together per month (the "PTO hours
 * per Month" column in the export is the aggregate across all types).
 */
export function adjustPartialDays(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
): ImportedPtoEntry[] {
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

  for (const calc of ptoCalcRows) {
    const monthEntries = byMonth.get(calc.month);
    if (!monthEntries || monthEntries.length === 0) continue;

    const calendarTotal = monthEntries.reduce((sum, e) => sum + e.hours, 0);
    const declaredTotal = calc.usedHours;

    if (declaredTotal <= 0 || calendarTotal <= declaredTotal) continue;

    // Need to reduce — find the last entry in this month (by date) in the result
    const monthStr = pad2(calc.month);
    const monthResultEntries = result.filter(
      (e) => e.date.substring(5, 7) === monthStr,
    );
    if (monthResultEntries.length === 0) continue;

    // Sort by date to find the last one
    monthResultEntries.sort((a, b) => a.date.localeCompare(b.date));
    const lastEntry = monthResultEntries[monthResultEntries.length - 1];

    // Calculate the partial hours for the last day
    const otherTotal = calendarTotal - lastEntry.hours;
    const partialHours = declaredTotal - otherTotal;

    if (partialHours > 0 && partialHours < lastEntry.hours) {
      lastEntry.hours = Math.round(partialHours * 100) / 100;
    }
  }

  return result;
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
    const val = cell.value?.toString() || "";
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
  const hireDateCell = ws.getCell("R2");
  let hireDate = "";
  if (hireDateCell.value) {
    const hireDateStr = hireDateCell.value.toString();
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

  return { name, hireDate, year, carryoverHours };
}

/**
 * Generate an email identifier from an employee name.
 * "Alice Smith" → "asmith@example.com"
 */
export function generateIdentifier(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "unknown@example.com";
  const firstName = parts[0].toLowerCase();
  const lastName =
    parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  const identifier = lastName
    ? `${firstName[0]}${lastName}@example.com`
    : `${firstName}@example.com`;
  return identifier;
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
    await empRepo.save(existing);
    return { employeeId: existing.id, created: false };
  }

  // Create new employee
  const newEmp = empRepo.create({
    name: trimmedName,
    identifier: generatedId,
    hire_date: info.hireDate ? new Date(info.hireDate) : new Date(),
    pto_rate: PTO_EARNING_SCHEDULE[0].dailyRate,
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

    const hoursErr = validateHours(entry.hours);
    if (hoursErr) {
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
      await repo.save(existing);
    } else {
      const newEntry = repo.create({
        employee_id: employeeId,
        date: entry.date,
        type: entry.type,
        hours: entry.hours,
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
 */
export function parseEmployeeSheet(ws: ExcelJS.Worksheet): SheetImportResult {
  const warnings: string[] = [];

  // Parse legend from this sheet
  const legend = parseLegend(ws);
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

  // Parse calendar (all 8h initially)
  let ptoEntries = parseCalendarGrid(ws, employee.year, legend);

  // Parse PTO calc section for partial-day adjustment
  const ptoCalcRows = parsePtoCalcUsedHours(ws);
  ptoEntries = adjustPartialDays(ptoEntries, ptoCalcRows);

  // Parse acknowledgements
  const acknowledgements = parseAcknowledgements(ws, employee.year);

  return { employee, ptoEntries, acknowledgements, warnings };
}

/**
 * Import an entire Excel workbook.
 * Iterates employee tabs, parses data, and upserts into the database.
 * Accepts an optional logger; each sheet is wrapped in try/catch so
 * one bad sheet does not abort the entire import.
 */
export async function importExcelWorkbook(
  dataSource: DataSource,
  buffer: Buffer,
  adminId?: number,
  log?: (msg: string) => void,
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  log?.(
    `Workbook contains ${sheetNames.length} sheets: ${sheetNames.join(", ")}`,
  );

  const result: ImportResult = {
    employeesProcessed: 0,
    employeesCreated: 0,
    ptoEntriesUpserted: 0,
    acknowledgementsSynced: 0,
    warnings: [],
    perEmployee: [],
  };

  for (const ws of workbook.worksheets) {
    // Skip non-employee sheets (detect by presence of "Hire Date" in header)
    if (!isEmployeeSheet(ws)) {
      log?.(`Skipping non-employee sheet: "${ws.name}"`);
      continue;
    }

    try {
      result.employeesProcessed++;
      log?.(`Processing employee sheet: "${ws.name}"`);

      // Parse sheet data
      const sheetResult = parseEmployeeSheet(ws);

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
      const { employeeId, created } = await upsertEmployee(
        dataSource,
        sheetResult.employee,
        log,
      );
      if (created) result.employeesCreated++;

      // Upsert PTO entries
      const { upserted, warnings: ptoWarnings } = await upsertPtoEntries(
        dataSource,
        employeeId,
        sheetResult.ptoEntries,
      );
      result.ptoEntriesUpserted += upserted;
      result.warnings.push(...ptoWarnings);

      // Upsert acknowledgements
      const acksSynced = await upsertAcknowledgements(
        dataSource,
        employeeId,
        sheetResult.acknowledgements,
        adminId,
      );
      result.acknowledgementsSynced += acksSynced;

      result.perEmployee.push({
        name: sheetResult.employee.name,
        employeeId,
        ptoEntries: upserted,
        acknowledgements: acksSynced,
        created,
      });

      log?.(
        `  → ${created ? "Created" : "Updated"} employee id=${employeeId}, ` +
          `${upserted} PTO entries, ${acksSynced} acknowledgements`,
      );
    } catch (sheetError) {
      const msg = `Failed to process sheet "${ws.name}": ${sheetError}`;
      log?.(msg);
      result.warnings.push(msg);
    }
  }

  log?.(
    `Import complete: ${result.employeesProcessed} processed, ` +
      `${result.employeesCreated} created, ` +
      `${result.ptoEntriesUpserted} PTO entries, ` +
      `${result.acknowledgementsSynced} acknowledgements, ` +
      `${result.warnings.length} warnings`,
  );

  return result;
}

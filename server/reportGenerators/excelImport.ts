/**
 * Excel PTO Spreadsheet Importer (Server-Side)
 *
 * Re-exports all pure parsing logic from the shared module and adds
 * server-only persistence functions (upsert to DB via TypeORM).
 *
 * The pure parsing logic lives in `shared/excelParsing.ts` so it can
 * run in both Node.js and browser environments.
 */

import ExcelJS from "exceljs";
import type { DataSource } from "typeorm";
import { Between } from "typeorm";
import {
  validateDateString,
  validatePTOType,
  VALIDATION_MESSAGES,
  ENABLE_IMPORT_AUTO_APPROVE,
  SYS_ADMIN_EMPLOYEE_ID,
  shouldAutoApproveImportEntry,
  getYearsOfService,
  computeAnnualAllocation,
  BUSINESS_RULES_CONSTANTS,
  type PTOType,
  type AutoApproveEmployeeLimits,
  type AutoApprovePolicyContext,
} from "../../shared/businessRules.js";
import { Employee } from "../entities/Employee.js";
import { PtoEntry } from "../entities/PtoEntry.js";
import { Acknowledgement } from "../entities/Acknowledgement.js";
import { AdminAcknowledgement } from "../entities/AdminAcknowledgement.js";

// ── Re-export everything from the shared parsing module ──

export {
  // Constants
  SUPERSCRIPT_TO_DIGIT,
  DEFAULT_OFFICE_THEME,
  COLUMN_S_TRACKED_TYPES,
  // Types
  type ImportedPtoEntry,
  type ImportedAcknowledgement,
  type EmployeeImportInfo,
  type SheetImportResult,
  type ImportResult,
  type PtoCalcRow,
  type UnmatchedNotedCell,
  type WorkedCell,
  type UnmatchedColoredCell,
  type CalendarParseResult,
  // Theme & Color functions
  parseThemeColors,
  resolveColorToARGB,
  colorDistance,
  findClosestLegendColor,
  // Cell helpers
  extractCellNoteText,
  parseHoursFromNote,
  isStrictHoursMatch,
  // Legend parsing
  findLegendHeaderRow,
  parseLegend,
  parsePartialPtoColors,
  // Calendar grid
  parseCalendarGrid,
  // PTO Calc
  findPtoCalcStartRow,
  parsePtoCalcUsedHours,
  parseCarryoverHours,
  // Reconciliation
  adjustPartialDays,
  reconcilePartialPto,
  parseWorkedHoursFromNote,
  processWorkedCells,
  inferWeekendPartialHours,
  // Employee info
  isEmployeeSheet,
  parseEmployeeInfo,
  generateIdentifier,
  computePtoRate,
  // Acknowledgements
  parseAcknowledgements,
  // Reclassifications
  overrideTypeFromNote,
  reclassifySickAsPto,
  reclassifySickByColumnS,
  reclassifyBereavementByColumnS,
  reconcileUnmatchedColoredCells,
  detectOverColoring,
  generateImportAcknowledgements,
  // Sheet orchestrator
  parseEmployeeSheet,
  // Theme extraction
  extractThemeColors,
} from "../../shared/excelParsing.js";

import type {
  ImportedPtoEntry,
  EmployeeImportInfo,
  ImportedAcknowledgement,
  ImportResult,
} from "../../shared/excelParsing.js";

import {
  DEFAULT_OFFICE_THEME,
  parseThemeColors,
  isEmployeeSheet,
  parseEmployeeSheet,
  generateIdentifier,
  computePtoRate,
} from "../../shared/excelParsing.js";

// ── Server-Only Functions ──

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

/**
 * Context needed for auto-approve evaluation during import.
 * Passed from the import endpoint when `ENABLE_IMPORT_AUTO_APPROVE` is true.
 */
export interface AutoApproveImportContext {
  /** Employee's hire date (YYYY-MM-DD). */
  hireDate: string;
  /** Carryover hours from the prior year (from spreadsheet cell L42). */
  carryoverHours: number;
  /** Set of YYYY-MM month strings with "warning" acknowledgement status. */
  warningMonths: ReadonlySet<string>;
}

/**
 * Upsert PTO entries for an employee.
 * Per-date: update type + hours for existing entries, insert new ones.
 * Entries not in the import are left untouched.
 *
 * When `autoApproveCtx` is provided and `ENABLE_IMPORT_AUTO_APPROVE` is true,
 * new entries that pass all validation checks and annual limits are automatically
 * approved (`approved_by = SYS_ADMIN_EMPLOYEE_ID`). Entries that fail checks
 * remain unapproved (`approved_by = null`) with violations recorded in notes.
 */
export async function upsertPtoEntries(
  dataSource: DataSource,
  employeeId: number,
  entries: ImportedPtoEntry[],
  autoApproveCtx?: AutoApproveImportContext,
): Promise<{ upserted: number; autoApproved: number; warnings: string[] }> {
  const repo = dataSource.getRepository(PtoEntry);
  const warnings: string[] = [];
  let upserted = 0;
  let autoApproved = 0;

  // ── Auto-approve setup ──
  const doAutoApprove =
    ENABLE_IMPORT_AUTO_APPROVE && autoApproveCtx !== undefined;

  // Per-year running totals for auto-approve checks
  const annualUsage: Record<number, Record<PTOType, number>> = {};
  const annualPtoUsed: Record<number, number> = {};

  if (doAutoApprove) {
    // Determine years present in the import entries
    const years = new Set<number>();
    for (const entry of entries) {
      const y = parseInt(entry.date.substring(0, 4), 10);
      if (!isNaN(y)) years.add(y);
    }

    // Query existing annual usage from DB for each year
    for (const year of years) {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const existingEntries = await repo.find({
        where: {
          employee_id: employeeId,
          date: Between(yearStart, yearEnd),
        },
      });

      const usage: Record<PTOType, number> = {
        PTO: 0,
        Sick: 0,
        Bereavement: 0,
        "Jury Duty": 0,
      };
      for (const e of existingEntries) {
        if (e.type in usage) {
          usage[e.type as PTOType] += e.hours;
        }
      }
      annualUsage[year] = usage;
      annualPtoUsed[year] = usage.PTO;
    }
  }

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
      // Update path — do NOT change approved_by per design
      existing.type = entry.type;
      existing.hours = entry.hours;
      existing.notes = entry.notes || null;
      await repo.save(existing);
    } else {
      // New entry — evaluate auto-approve if enabled
      let approvedBy: number | null = null;

      if (doAutoApprove && autoApproveCtx) {
        const year = parseInt(entry.date.substring(0, 4), 10);

        // Ensure we have usage tracking for this year
        if (!annualUsage[year]) {
          annualUsage[year] = {
            PTO: 0,
            Sick: 0,
            Bereavement: 0,
            "Jury Duty": 0,
          };
          annualPtoUsed[year] = 0;
        }

        // Compute available PTO balance for this year
        const allocation = computeAnnualAllocation(
          autoApproveCtx.hireDate,
          year,
        );
        const carryover = autoApproveCtx.carryoverHours;
        const availableBalance = carryover + allocation - annualPtoUsed[year];

        const employeeLimits: AutoApproveEmployeeLimits = {
          annualUsage: annualUsage[year],
          availablePtoBalance: availableBalance,
        };

        const yearsOfService = getYearsOfService(
          autoApproveCtx.hireDate,
          entry.date,
        );

        const policyContext: AutoApprovePolicyContext = {
          yearsOfService,
          warningMonths: autoApproveCtx.warningMonths,
        };

        const result = shouldAutoApproveImportEntry(
          entry,
          employeeLimits,
          policyContext,
        );

        if (result.approved) {
          approvedBy = SYS_ADMIN_EMPLOYEE_ID;
          autoApproved++;
        } else {
          // Record violations in the entry notes
          const violationText = result.violations.join("; ");
          const existingNotes = entry.notes || "";
          entry.notes = existingNotes
            ? `${existingNotes} | Auto-approve denied: ${violationText}`
            : `Auto-approve denied: ${violationText}`;
          warnings.push(
            `${entry.date} ${entry.type} ${entry.hours}h not auto-approved: ${violationText}`,
          );
        }

        // Update running totals for subsequent entries
        annualUsage[year][entry.type as PTOType] += entry.hours;
        if (entry.type === "PTO") {
          annualPtoUsed[year] += entry.hours;
        }
      }

      const newEntry = repo.create({
        employee_id: employeeId,
        date: entry.date,
        type: entry.type,
        hours: entry.hours,
        notes: entry.notes || null,
        approved_by: approvedBy,
      });
      await repo.save(newEntry);
    }
    upserted++;
  }

  return { upserted, autoApproved, warnings };
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
          note: ack.note ?? null,
          status: ack.status ?? null,
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

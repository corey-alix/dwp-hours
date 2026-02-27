/**
 * Excel Parsing — Sheet Orchestrator
 *
 * The top-level `parseEmployeeSheet` function that coordinates all parsing
 * phases for a single employee worksheet, and `extractThemeColors` for
 * reading workbook-level theme data.
 */

import type ExcelJS from "exceljs";
import type { SheetImportResult } from "./types.js";
import { DEFAULT_OFFICE_THEME } from "./types.js";
import { parseThemeColors } from "./colorUtils.js";
import { parseLegend, parsePartialPtoColors } from "./legendParsing.js";
import { parseCalendarGrid } from "./calendarParsing.js";
import { parsePtoCalcUsedHours } from "./ptoCalcParsing.js";
import { parseEmployeeInfo, computePtoRate } from "./employeeParsing.js";
import {
  parseAcknowledgements,
  generateImportAcknowledgements,
} from "./acknowledgements.js";
import {
  adjustPartialDays,
  reconcilePartialPto,
  processWorkedCells,
  inferWeekendPartialHours,
  overrideTypeFromNote,
  reclassifySickAsPto,
  reclassifySickByColumnS,
  reclassifyBereavementByColumnS,
  reconcileUnmatchedColoredCells,
  detectOverColoring,
} from "./reconciliation.js";

/**
 * Parse a single employee worksheet and return all extracted data (no DB interaction).
 */
export function parseEmployeeSheet(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): SheetImportResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const resolved: string[] = [];

  const legend = parseLegend(ws, themeColors);
  if (legend.size === 0) {
    warnings.push(`No legend found on sheet "${ws.name}"`);
  }

  const { info: employee, resolved: hireDateResolved } = parseEmployeeInfo(ws);
  resolved.push(...hireDateResolved);
  if (!employee.year) {
    warnings.push(`Could not determine year from sheet "${ws.name}"`);
  }
  if (!employee.hireDate) {
    warnings.push(`Could not determine hire date from sheet "${ws.name}"`);
  }

  const { warning: rateWarning } = computePtoRate(employee);
  if (rateWarning) {
    resolved.push(rateWarning);
  }

  const partialPtoColors = parsePartialPtoColors(ws, themeColors);

  const {
    entries: calendarEntries,
    unmatchedNotedCells,
    workedCells: calendarWorkedCells,
    unmatchedColoredCells,
    warnings: calendarWarnings,
    resolved: calendarResolved,
  } = parseCalendarGrid(
    ws,
    employee.year,
    legend,
    themeColors,
    partialPtoColors,
  );
  warnings.push(...calendarWarnings);
  resolved.push(...calendarResolved);

  const {
    entries: noteOverriddenEntries,
    workedCells: noteWorkedCells,
    warnings: noteOverrideWarnings,
    resolved: noteOverrideResolved,
  } = overrideTypeFromNote(calendarEntries, ws.name);
  const workedCells = [...calendarWorkedCells, ...noteWorkedCells];
  warnings.push(...noteOverrideWarnings);
  resolved.push(...noteOverrideResolved);

  const {
    entries: sickReclassifiedEntries,
    warnings: sickWarnings,
    resolved: sickResolved,
  } = reclassifySickAsPto(noteOverriddenEntries, ws.name);
  warnings.push(...sickWarnings);
  resolved.push(...sickResolved);

  const ptoCalcRows = parsePtoCalcUsedHours(ws);
  const {
    entries: adjustedEntries,
    warnings: adjustWarnings,
    resolved: adjustResolved,
  } = adjustPartialDays(sickReclassifiedEntries, ptoCalcRows, ws.name);
  let ptoEntries = adjustedEntries;
  warnings.push(...adjustWarnings);
  resolved.push(...adjustResolved);

  const {
    entries: reconciledEntries,
    warnings: reconWarnings,
    resolved: reconResolved,
  } = reconcilePartialPto(
    ptoEntries,
    unmatchedNotedCells,
    ptoCalcRows,
    ws.name,
  );
  ptoEntries = reconciledEntries;
  warnings.push(...reconWarnings);
  resolved.push(...reconResolved);

  const {
    entries: phase11Entries,
    newWorkedEntries: phase11WorkedEntries,
    handledWorkedDates,
    warnings: phase11Warnings,
    resolved: phase11Resolved,
  } = inferWeekendPartialHours(ptoEntries, workedCells, ptoCalcRows, ws.name);
  ptoEntries = [...phase11Entries, ...phase11WorkedEntries];
  warnings.push(...phase11Warnings);
  resolved.push(...phase11Resolved);

  const remainingWorkedCells = workedCells.filter(
    (wc) => !handledWorkedDates.has(wc.date),
  );
  const {
    entries: workedEntries,
    warnings: workedWarnings,
    resolved: workedResolved,
  } = processWorkedCells(
    remainingWorkedCells,
    ptoEntries,
    ptoCalcRows,
    ws.name,
  );
  ptoEntries = [...ptoEntries, ...workedEntries];
  warnings.push(...workedWarnings);
  resolved.push(...workedResolved);

  const {
    entries: unmatchedColorEntries,
    warnings: unmatchedColorWarnings,
    resolved: unmatchedColorResolved,
  } = reconcileUnmatchedColoredCells(
    ptoEntries,
    unmatchedColoredCells,
    ptoCalcRows,
    ws.name,
  );
  ptoEntries = [...ptoEntries, ...unmatchedColorEntries];
  warnings.push(...unmatchedColorWarnings);
  resolved.push(...unmatchedColorResolved);

  const {
    entries: columnSReclassEntries,
    warnings: columnSReclassWarnings,
    resolved: columnSResolved,
  } = reclassifySickByColumnS(ptoEntries, ptoCalcRows, ws.name);
  ptoEntries = columnSReclassEntries;
  warnings.push(...columnSReclassWarnings);
  resolved.push(...columnSResolved);

  const {
    entries: bereavReclassEntries,
    warnings: bereavReclassWarnings,
    resolved: bereavResolved,
  } = reclassifyBereavementByColumnS(ptoEntries, ptoCalcRows, ws.name);
  ptoEntries = bereavReclassEntries;
  warnings.push(...bereavReclassWarnings);
  resolved.push(...bereavResolved);

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

  return {
    employee,
    ptoEntries,
    acknowledgements: mergedAcks,
    warnings,
    errors,
    resolved,
  };
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

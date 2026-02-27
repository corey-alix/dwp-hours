/**
 * Excel PTO Spreadsheet Parsing — Backward-Compatibility Barrel
 *
 * This file re-exports the entire public API from the refactored
 * `shared/excel/` submodules so that existing imports from
 * `shared/excelParsing.js` continue to work unchanged.
 *
 * For new code, prefer importing directly from `shared/excel/index.js`
 * or from the specific submodule (e.g. `shared/excel/reconciliation.js`).
 */

export {
  // Types & constants
  SUPERSCRIPT_TO_DIGIT,
  DEFAULT_OFFICE_THEME,
  COLUMN_S_TRACKED_TYPES,
  pad2,
  getCellNumericValue,

  // Color utilities
  parseThemeColors,
  resolveColorToARGB,
  colorDistance,
  findClosestLegendColor,

  // Cell utilities
  extractCellNoteText,
  parseHoursFromNote,
  isStrictHoursMatch,

  // Legend parsing
  findLegendHeaderRow,
  parseLegend,
  parsePartialPtoColors,

  // Calendar grid parsing
  parseCalendarGrid,

  // PTO Calc parsing
  findPtoCalcStartRow,
  parsePtoCalcUsedHours,
  parseCarryoverHours,

  // Reconciliation phases
  adjustPartialDays,
  reconcilePartialPto,
  parseWorkedHoursFromNote,
  processWorkedCells,
  inferWeekendPartialHours,
  overrideTypeFromNote,
  reclassifySickAsPto,
  reclassifySickByColumnS,
  reclassifyBereavementByColumnS,
  reconcileUnmatchedColoredCells,
  detectOverColoring,

  // Employee info parsing
  isEmployeeSheet,
  parseEmployeeInfo,
  generateIdentifier,
  computePtoRate,

  // Acknowledgement parsing
  parseAcknowledgements,
  generateImportAcknowledgements,

  // Sheet orchestrator
  parseEmployeeSheet,
  extractThemeColors,
} from "./excel/index.js";

export type {
  ImportedPtoEntry,
  ImportedAcknowledgement,
  EmployeeImportInfo,
  SheetImportResult,
  ImportResult,
  PtoCalcRow,
  UnmatchedNotedCell,
  WorkedCell,
  UnmatchedColoredCell,
  CalendarParseResult,
} from "./excel/index.js";

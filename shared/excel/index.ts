/**
 * Excel Parsing — Barrel Re-export
 *
 * Re-exports all public API from the excel parsing submodules.
 * Import from this file (or from `shared/excelParsing.js` for backward
 * compatibility) to access all parsing functions and types.
 */

// Types, interfaces, and constants
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
} from "./types.js";
export {
  SUPERSCRIPT_TO_DIGIT,
  DEFAULT_OFFICE_THEME,
  COLUMN_S_TRACKED_TYPES,
  pad2,
  getCellNumericValue,
} from "./types.js";

// Color utilities
export {
  parseThemeColors,
  resolveColorToARGB,
  colorDistance,
  findClosestLegendColor,
} from "./colorUtils.js";

// Cell utilities
export {
  extractCellNoteText,
  parseHoursFromNote,
  isStrictHoursMatch,
} from "./cellUtils.js";

// Legend parsing
export {
  findLegendHeaderRow,
  parseLegend,
  parsePartialPtoColors,
} from "./legendParsing.js";

// Calendar grid parsing
export { parseCalendarGrid } from "./calendarParsing.js";

// PTO Calc parsing
export {
  findPtoCalcStartRow,
  parsePtoCalcUsedHours,
  parseCarryoverHours,
} from "./ptoCalcParsing.js";

// Reconciliation phases
export {
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
} from "./reconciliation.js";

// Employee info parsing
export {
  isEmployeeSheet,
  parseEmployeeInfo,
  generateIdentifier,
  computePtoRate,
} from "./employeeParsing.js";

// Acknowledgement parsing and generation
export {
  parseAcknowledgements,
  generateImportAcknowledgements,
} from "./acknowledgements.js";

// Sheet orchestrator
export {
  parseEmployeeSheet,
  extractThemeColors,
} from "./parseEmployeeSheet.js";

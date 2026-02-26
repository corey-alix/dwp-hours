/**
 * Browser-Side Excel Import Client
 *
 * This module is loaded on-demand (lazy) only when the admin triggers a
 * browser-side import.  It bundles ExcelJS + the shared parsing functions
 * into a separate JS chunk so the main app.js stays small.
 *
 * Flow:
 *  1. Read the File as ArrayBuffer
 *  2. Load into ExcelJS workbook
 *  3. Extract theme colors
 *  4. Iterate employee sheets, calling parseEmployeeSheet()
 *  5. Convert results to BulkImportPayload
 *  6. Return the payload (caller submits it to the bulk API)
 */

import ExcelJS from "exceljs";
import {
  isEmployeeSheet,
  parseEmployeeSheet,
  extractThemeColors,
  generateIdentifier,
  computePtoRate,
} from "../../shared/excelParsing.js";
import type {
  BulkImportPayload,
  BulkImportEmployee,
} from "../../shared/api-models.js";

export interface ParseProgress {
  phase: "loading" | "parsing" | "complete" | "error";
  current: number;
  total: number;
  sheetName?: string;
  message?: string;
}

export type ProgressCallback = (progress: ParseProgress) => void;

/**
 * Parse an Excel file in the browser and return a BulkImportPayload.
 *
 * @param file       The File object from the file input
 * @param onProgress Optional callback for progress reporting
 * @returns          The payload ready to POST to /api/admin/import-bulk
 */
export async function parseExcelInBrowser(
  file: File,
  onProgress?: ProgressCallback,
): Promise<{ payload: BulkImportPayload; warnings: string[] }> {
  const allWarnings: string[] = [];

  // Phase 1: Load file into ExcelJS
  onProgress?.({
    phase: "loading",
    current: 0,
    total: 1,
    message: `Loading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)…`,
  });

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer as unknown as ExcelJS.Buffer);

  // Phase 2: Extract theme colors
  const themeColors = extractThemeColors(workbook);

  // Phase 3: Identify employee sheets
  const employeeSheets: ExcelJS.Worksheet[] = [];
  for (const ws of workbook.worksheets) {
    if (isEmployeeSheet(ws)) {
      employeeSheets.push(ws);
    }
  }

  if (employeeSheets.length === 0) {
    throw new Error(
      "No employee sheets found in workbook. " +
        "Employee sheets must contain 'Hire Date' in the header row.",
    );
  }

  // Phase 4: Parse each sheet
  const employees: BulkImportEmployee[] = [];

  for (let i = 0; i < employeeSheets.length; i++) {
    const ws = employeeSheets[i];

    onProgress?.({
      phase: "parsing",
      current: i + 1,
      total: employeeSheets.length,
      sheetName: ws.name,
      message: `Parsing ${ws.name} (${i + 1}/${employeeSheets.length})…`,
    });

    try {
      const result = parseEmployeeSheet(ws, themeColors);

      const { rate } = computePtoRate(result.employee);
      const identifier = generateIdentifier(result.employee.name);

      const employee: BulkImportEmployee = {
        name: result.employee.name,
        identifier,
        hireDate: result.employee.hireDate || "",
        carryoverHours: result.employee.carryoverHours,
        ptoRate: rate,
        ptoEntries: result.ptoEntries.map((e) => ({
          date: e.date,
          hours: e.hours,
          type: e.type,
          notes: e.notes || null,
          isNoteDerived: e.isNoteDerived,
        })),
        acknowledgements: result.acknowledgements.map((a) => ({
          month: a.month,
          type: a.type,
          note: a.note || null,
          status: a.status || null,
        })),
        warnings: result.warnings,
      };

      employees.push(employee);
      allWarnings.push(...result.warnings);
    } catch (sheetError) {
      const msg = `Failed to parse sheet "${ws.name}": ${sheetError}`;
      allWarnings.push(msg);
    }
  }

  onProgress?.({
    phase: "complete",
    current: employeeSheets.length,
    total: employeeSheets.length,
    message: `Parsed ${employees.length} employee(s) from ${file.name}`,
  });

  return {
    payload: { employees },
    warnings: allWarnings,
  };
}

/**
 * Conversion Utilities
 * Utilities for converting between Excel, JSON, and database formats
 */

import ExcelJS from "exceljs";

/**
 * Cell data structure for JSON representation
 */
export interface CellData {
  /** Cell value (string, number, boolean, or Date) */
  value?: any;
  /** Excel formula (without =) */
  formula?: string;
  /** Background color as hex string (e.g., 'FFFF0000' for red) */
  color?: string;
}

/**
 * Sheet data structure for JSON representation
 */
export interface SheetData {
  /** Cell data keyed by address (e.g., 'A1', 'B2') */
  cells: { [address: string]: CellData };
  /** Merged cell ranges (e.g., ['A1:B2', 'C3:D4']) */
  mergedRanges?: string[];
}

/**
 * Excel workbook data structure for JSON representation
 */
export interface ExcelData {
  /** Sheet data keyed by sheet name */
  sheets: { [sheetName: string]: SheetData };
}

/**
 * Validates if the provided data has the correct ExcelData structure
 */
export function validateExcelData(data: any): data is ExcelData {
  if (
    !data ||
    typeof data !== "object" ||
    !data.sheets ||
    typeof data.sheets !== "object"
  ) {
    return false;
  }

  for (const sheetName in data.sheets) {
    const sheet = data.sheets[sheetName];
    if (
      !sheet ||
      typeof sheet !== "object" ||
      !sheet.cells ||
      typeof sheet.cells !== "object"
    ) {
      return false;
    }

    // Check mergedRanges if present
    if (sheet.mergedRanges && !Array.isArray(sheet.mergedRanges)) {
      return false;
    }
  }

  return true;
}

/**
 * Converts ExcelData JSON structure to ExcelJS Workbook
 */
export function jsonToWorkbook(data: ExcelData): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  for (const sheetName in data.sheets) {
    const sheetData = data.sheets[sheetName];
    const worksheet = workbook.addWorksheet(sheetName);

    // Add cells
    for (const address in sheetData.cells) {
      const cellData = sheetData.cells[address];
      const cell = worksheet.getCell(address);

      if (cellData.formula) {
        cell.value = { formula: cellData.formula };
        // Don't set result to avoid [object Object] issues
      } else if (cellData.value !== undefined) {
        cell.value = cellData.value;
      } else if (cellData.color) {
        // Set empty value to ensure cell exists for color-only cells
        cell.value = "";
      }

      if (cellData.color) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: cellData.color },
        };
      }
    }

    // Add merged ranges
    if (sheetData.mergedRanges) {
      for (const range of sheetData.mergedRanges) {
        worksheet.mergeCells(range);
      }
    }
  }

  return workbook;
}

/**
 * Converts ExcelJS Workbook to ExcelData JSON structure
 */
export function workbookToJson(workbook: ExcelJS.Workbook): ExcelData {
  const data: ExcelData = { sheets: {} };

  workbook.eachSheet((worksheet, sheetId) => {
    const sheetName = worksheet.name;
    const sheetData: SheetData = { cells: {} };

    // Extract merged ranges
    const mergedRanges: string[] = [];
    worksheet.model.merges?.forEach((merge) => {
      mergedRanges.push(merge);
    });
    if (mergedRanges.length > 0) {
      sheetData.mergedRanges = mergedRanges;
    }

    // Extract cell data
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const address = cell.address;
        const cellData: CellData = {};

        // Get cell value
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === "object" && "formula" in cell.value) {
            // Handle formula cells - only store the formula, ignore computed value
            cellData.formula = (cell.value as any).formula;
          } else {
            cellData.value = cell.value;
          }
        }

        if (cellData.value === "") {
          cellData.value = undefined;
        }

        // Get cell background color
        if (cell.fill && cell.fill.type === "pattern" && cell.fill.fgColor) {
          const color = cell.fill.fgColor;
          if (typeof color === "object" && "argb" in color) {
            cellData.color = color.argb;
          }
        }

        // Only add cell if it has data
        if (
          cellData.value !== undefined ||
          cellData.formula ||
          cellData.color
        ) {
          sheetData.cells[address] = cellData;
        }
      });
    });

    data.sheets[sheetName] = sheetData;
  });

  return data;
}

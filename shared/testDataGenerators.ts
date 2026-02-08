/**
 * This file contains utilities for extracting data from the DWP Hours Tracker spreadsheet template.
 * The spreadsheet is used for managing employee PTO and hours tracking, containing monthly PTO hours,
 * work days, sick time status, employee information, and various calculated fields.
 *
 * Data Location Map:
 *
 * Employee Information:
 * - Employee Name: Cell J2
 * - Hire Date: Cell R2 (formatted as "Hire Date: MM/DD/YY")
 * - Year: Cell B2
 *
 * Monthly Data (Rows 42-53):
 * - Work Days: Column D (D42-D53)
 * - Daily Rates: Column F (F42-F53)
 * - Previous Years Carry Over PTO: Cell L42 (or computed as V42 - J42 if blank)
 * - PTO Hours: Column S (S42-S53)
 *
 * Sick Time Status:
 * - Allowed Hours: Cell AB32
 * - Used Hours: Cell AB33
 * - Remaining Hours: Cell AB34
 *
 * Legend:
 * - Legend Entries: Column Z, rows 9-14 (Z9-Z14)
 *   - Each entry includes a name and color
 *
 * Monthly Sections:
 * - Month Headers: Located dynamically by searching for month names (January-December)
 * - Month Data Ranges: Calculated as starting 2 rows below month header, spanning 7 columns
 *   (typically days of week), with height equal to number of weeks in the month
 */

import { SHEET_TEMPLATE } from "./SHEET_TEMPLATE";
import { parseMMDDYY, getWeeksInMonth } from "./dateUtils";

interface JsonSheet {
    cells: {
        [key: string]: {
            value?: number | string | { result: number; sharedFormula: string };
            formula?: string;
            color?: string;
        };
    };
}

type JsonSheets = Record<string, JsonSheet>;
type JsonSheetsTemplate = Record<string, JsonSheets>;

export function extractMonthlyPTOHours(sheetData: JsonSheet): number[] {
    const hours: number[] = [];
    for (let row = 42; row <= 53; row++) {
        const cellKey = `S${row}`;
        const cell = sheetData.cells[cellKey];
        let value = 0;
        if (cell && cell.value !== undefined) {
            if (typeof cell.value === 'number') {
                value = cell.value;
            } else if (typeof cell.value === 'object' && cell.value && 'result' in cell.value && typeof cell.value.result === 'number') {
                value = cell.value.result;
            }
        }
        hours.push(value);
    }
    return hours;
}

export function extractMonthlyWorkDays(sheetData: JsonSheet): number[] {
    const workDays: number[] = [];
    for (let row = 42; row <= 53; row++) {
        const cellKey = `D${row}`;
        const cell = sheetData.cells[cellKey];
        let value = 0;
        if (cell && cell.value !== undefined) {
            if (typeof cell.value === 'number') {
                value = cell.value;
            } else if (typeof cell.value === 'object' && cell.value && 'result' in cell.value && typeof cell.value.result === 'number') {
                value = cell.value.result;
            }
        }
        workDays.push(value);
    }
    return workDays;
}

export function extractHireDate(sheetData: JsonSheet): string | null {
    const cellKey = 'R2';
    const cell = sheetData.cells[cellKey];
    if (!cell || typeof cell.value !== 'string') {
        return null;
    }

    const match = cell.value.match(/^Hire Date:\s*(.+)$/);
    if (!match) {
        return null;
    }

    const dateStr = match[1];
    try {
        return parseMMDDYY(dateStr);
    } catch {
        return null;
    }
}

export function extractYear(sheetData: JsonSheet): number | null {
    const cellKey = 'B2';
    const cell = sheetData.cells[cellKey];
    if (!cell || typeof cell.value !== 'number') {
        return null;
    }
    return cell.value;
}

export function extractEmployeeName(sheetData: JsonSheet): string | null {
    const cellKey = 'J2';
    const cell = sheetData.cells[cellKey];
    if (!cell || typeof cell.value !== 'string') {
        return null;
    }
    return cell.value;
}

export function extractPreviousYearsCarryOverPTO(sheetData: JsonSheet): number {
    // Try to extract from L42 first
    const carryOverCell = sheetData.cells['L42'];
    if (carryOverCell && carryOverCell.value !== undefined && carryOverCell.value !== null && carryOverCell.value !== '') {
        if (typeof carryOverCell.value === 'number') {
            return carryOverCell.value;
        } else if (typeof carryOverCell.value === 'object' && carryOverCell.value && 'result' in carryOverCell.value && typeof carryOverCell.value.result === 'number') {
            return carryOverCell.value.result;
        }
    }

    // If L42 is blank, compute V42 - J42
    const v42Cell = sheetData.cells['V42'];
    const j42Cell = sheetData.cells['O42'];

    let v42Value = 0;
    let j42Value = 0;

    // Extract V42 value
    if (v42Cell && v42Cell.value !== undefined) {
        if (typeof v42Cell.value === 'number') {
            v42Value = v42Cell.value;
        } else if (typeof v42Cell.value === 'object' && v42Cell.value && 'result' in v42Cell.value && typeof v42Cell.value.result === 'number') {
            v42Value = v42Cell.value.result;
        }
    }

    // Extract J42 value
    if (j42Cell && j42Cell.value !== undefined) {
        if (typeof j42Cell.value === 'number') {
            j42Value = j42Cell.value;
        } else if (typeof j42Cell.value === 'object' && j42Cell.value && 'result' in j42Cell.value && typeof j42Cell.value.result === 'number') {
            j42Value = j42Cell.value.result;
        }
    }

    return v42Value - j42Value;
}

export interface SickHoursStatus {
    allowed: number;
    used: number;
    remaining: number;
}

export interface LegendEntry {
    name: string;
    color: string;
}

export function extractSickHoursStatus(sheetData: JsonSheet): SickHoursStatus | null {
    const allowedCell = sheetData.cells['AB32'];
    const usedCell = sheetData.cells['AB33'];
    const remainingCell = sheetData.cells['AB34'];

    if (!allowedCell) {
        return null;
    }

    // Extract allowed hours (should be 24)
    let allowed = 0;
    if (typeof allowedCell.value === 'number') {
        allowed = allowedCell.value;
    } else if (typeof allowedCell.value === 'object' && allowedCell.value && 'result' in allowedCell.value && typeof allowedCell.value.result === 'number') {
        allowed = allowedCell.value.result;
    }

    // Extract used hours (may not exist in template, default to 0)
    let used = 0;
    if (usedCell) {
        if (typeof usedCell.value === 'number') {
            used = usedCell.value;
        } else if (typeof usedCell.value === 'object' && usedCell.value && 'result' in usedCell.value && typeof usedCell.value.result === 'number') {
            used = usedCell.value.result;
        }
    }

    // Extract remaining hours (formula result or calculated)
    let remaining = 0;
    if (remainingCell) {
        if (typeof remainingCell.value === 'number') {
            remaining = remainingCell.value;
        } else if (typeof remainingCell.value === 'object' && remainingCell.value && 'result' in remainingCell.value && typeof remainingCell.value.result === 'number') {
            remaining = remainingCell.value.result;
        } else if (remainingCell.formula) {
            // If it's a formula AB32-AB33, calculate it
            remaining = allowed - used;
        }
    } else {
        // If no remaining cell, calculate it
        remaining = allowed - used;
    }

    return {
        allowed,
        used,
        remaining
    };
}

export function extractLegend(sheetData: JsonSheet): LegendEntry[] {
    const legend: LegendEntry[] = [];

    // Legend entries are in Z9 through Z14
    for (let row = 9; row <= 14; row++) {
        const cellKey = `Z${row}`;
        const cell = sheetData.cells[cellKey];

        if (cell && typeof cell.value === 'string' && cell.color) {
            legend.push({
                name: cell.value,
                color: cell.color
            });
        }
    }

    return legend;
}

export function extractDailyRates(sheetData: JsonSheet): number[] {
    const rates: number[] = [];
    for (let row = 42; row <= 53; row++) {
        const cellKey = `F${row}`;
        const cell = sheetData.cells[cellKey];
        let value = 0;
        if (cell && cell.value !== undefined) {
            if (typeof cell.value === 'number') {
                value = cell.value;
            } else if (typeof cell.value === 'object' && cell.value && 'result' in cell.value && typeof cell.value.result === 'number') {
                value = cell.value.result;
            }
        }
        rates.push(value);
    }
    return rates;
}

export function generateImportTestData(): JsonSheetsTemplate {
    return SHEET_TEMPLATE as JsonSheetsTemplate;
}

// Helper function to convert column number to letter (1-based)
function colToLetter(col: number): string {
    let result = '';
    while (col > 0) {
        col--;
        result = String.fromCharCode(65 + (col % 26)) + result;
        col = Math.floor(col / 26);
    }
    return result;
}

export function extractMonthCellRange(sheetData: JsonSheet, monthName: string): string | null {
    // Find the month header position
    let headerRow = -1;
    let headerCol = -1;

    for (const cellKey in sheetData.cells) {
        const cell = sheetData.cells[cellKey];
        if (cell && cell.value === monthName) {
            // Parse cell key like "D13"
            const match = cellKey.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const colStr = match[1];
                const row = parseInt(match[2]);
                // Convert colStr to number
                let col = 0;
                for (let i = 0; i < colStr.length; i++) {
                    col = col * 26 + (colStr.charCodeAt(i) - 64);
                }
                headerRow = row;
                headerCol = col;
                break;
            }
        }
    }

    if (headerRow === -1 || headerCol === -1) {
        return null; // Month not found
    }

    // Calculate start position
    const startRow = headerRow + 2;
    const startCol = headerCol - 2;

    // Get month number from name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1) return null;

    const monthNum = monthIndex + 1;
    const numWeeks = getWeeksInMonth(2025, monthNum);

    // Calculate end position
    const endRow = startRow + numWeeks - 1;
    const endCol = startCol + 6;

    // Return range
    return `${colToLetter(startCol)}${startRow}:${colToLetter(endCol)}${endRow}`;
}
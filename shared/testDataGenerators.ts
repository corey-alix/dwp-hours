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
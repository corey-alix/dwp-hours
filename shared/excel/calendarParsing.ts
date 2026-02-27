/**
 * Excel Parsing — Calendar Grid Parsing
 *
 * Parses the 12-month calendar grid from a worksheet, matching cell
 * fill colors against the legend to identify PTO entries.
 */

import type ExcelJS from "exceljs";
import type { PTOType } from "../businessRules.js";
import { MONTH_NAMES } from "../businessRules.js";
import { getDaysInMonth } from "../dateUtils.js";
import type { CalendarParseResult, ImportedPtoEntry } from "./types.js";
import {
  COL_STARTS,
  DAY1_SCAN_RANGE,
  DEFAULT_OFFICE_THEME,
  ROW_GROUP_STARTS,
  getCellNumericValue,
  pad2,
} from "./types.js";
import { resolveColorToARGB, findClosestLegendColor } from "./colorUtils.js";
import {
  extractCellNoteText,
  parseHoursFromNote,
  isStrictHoursMatch,
} from "./cellUtils.js";

/**
 * Parse the 12-month calendar grid from a worksheet.
 */
export function parseCalendarGrid(
  ws: ExcelJS.Worksheet,
  year: number,
  legend: Map<string, PTOType>,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
  partialPtoColors: Set<string> = new Set(),
): CalendarParseResult {
  const entries: ImportedPtoEntry[] = [];
  const unmatchedNotedCells: CalendarParseResult["unmatchedNotedCells"] = [];
  const workedCells: CalendarParseResult["workedCells"] = [];
  const unmatchedColoredCells: CalendarParseResult["unmatchedColoredCells"] =
    [];
  const warnings: string[] = [];
  const resolved: string[] = [];

  for (let month = 1; month <= 12; month++) {
    const m0 = month - 1;
    const colGroup = Math.floor(m0 / 4);
    const rowGroup = m0 % 4;

    const startCol = COL_STARTS[colGroup];
    const headerRow = ROW_GROUP_STARTS[rowGroup];
    const expectedDateStartRow = headerRow + 2;

    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = new Date(year, month - 1, 1).getDay();

    // ── Day-1 verification ──
    const expectedDay1Col = startCol + firstDow;
    const expectedDay1Cell = ws.getCell(expectedDateStartRow, expectedDay1Col);
    const expectedDay1Value = getCellNumericValue(expectedDay1Cell);

    let dateStartRow = expectedDateStartRow;

    if (expectedDay1Value === 1) {
      // Day 1 is where we expect it
    } else {
      const monthName = MONTH_NAMES[month - 1];
      warnings.push(
        `Sheet "${ws.name}" ${monthName}: day 1 not found at expected row ${expectedDateStartRow}, col ${expectedDay1Col}. Scanning nearby rows...`,
      );

      let foundRow: number | undefined;
      for (
        let scanRow = expectedDateStartRow - DAY1_SCAN_RANGE;
        scanRow <= expectedDateStartRow + DAY1_SCAN_RANGE;
        scanRow++
      ) {
        if (scanRow < 1 || scanRow === expectedDateStartRow) continue;
        const scanCell = ws.getCell(scanRow, expectedDay1Col);
        const scanValue = getCellNumericValue(scanCell);
        if (scanValue === 1) {
          foundRow = scanRow;
          break;
        }
      }

      if (foundRow !== undefined) {
        const offset = foundRow - expectedDateStartRow;
        const direction = offset > 0 ? "below" : "above";
        resolved.push(
          `Sheet "${ws.name}" ${monthName}: resolved row anomaly — day 1 found ${Math.abs(offset)} row(s) ${direction} expected position (row ${foundRow} instead of ${expectedDateStartRow}). Recovered successfully.`,
        );
        dateStartRow = foundRow;
      } else {
        warnings.push(
          `Sheet "${ws.name}" ${monthName}: ERROR — could not locate day 1 within ±${DAY1_SCAN_RANGE} rows of expected position. Skipping month.`,
        );
        continue;
      }
    }

    let row = dateStartRow;
    let col = startCol + firstDow;

    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (firstDow + day - 1) % 7;
      const cell = ws.getCell(row, col);
      const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
      const noteText = extractCellNoteText(cell);

      const fill = cell.fill as ExcelJS.FillPattern | undefined;
      let ptoType: PTOType | undefined;
      let matchMethod = "";
      let matchedArgb: string | undefined;

      if (fill?.type === "pattern") {
        const fgArgb = resolveColorToARGB(fill.fgColor as any, themeColors);
        if (fgArgb) {
          ptoType = legend.get(fgArgb);
          if (ptoType) {
            matchMethod = "exact";
            matchedArgb = fgArgb;
          } else {
            ptoType = findClosestLegendColor(fgArgb, legend);
            if (ptoType) {
              matchMethod = `approximate (resolved=${fgArgb})`;
              matchedArgb = fgArgb;
            }
          }
        }

        if (!ptoType && fill.bgColor) {
          const bgArgb = resolveColorToARGB(fill.bgColor as any, themeColors);
          if (bgArgb) {
            ptoType = legend.get(bgArgb);
            if (ptoType) {
              matchMethod = "bgColor exact";
              matchedArgb = bgArgb;
            } else {
              ptoType = findClosestLegendColor(bgArgb, legend);
              if (ptoType) {
                matchMethod = `bgColor approximate (resolved=${bgArgb})`;
                matchedArgb = bgArgb;
              }
            }
          }
        }
      }

      if (ptoType) {
        let hours = 8;
        let isNoteDerived = false;
        if (noteText) {
          const noteHours = parseHoursFromNote(noteText);
          if (noteHours !== undefined) {
            hours = noteHours;
            isNoteDerived = isStrictHoursMatch(noteText);
          }
        }
        const entry: ImportedPtoEntry = { date: dateStr, type: ptoType, hours };
        if (isNoteDerived) {
          entry.isNoteDerived = true;
        }
        if (matchedArgb && partialPtoColors.has(matchedArgb)) {
          entry.isPartialPtoColor = true;
        }
        if (matchMethod !== "exact" && matchMethod) {
          entry.notes = `Color matched via ${matchMethod}.`;
        }
        if (noteText) {
          entry.notes =
            (entry.notes ? entry.notes + " " : "") +
            `Cell note: "${noteText.replace(/\n/g, " ")}"`;
        }
        entries.push(entry);
      } else if (noteText) {
        if (/worked/i.test(noteText)) {
          workedCells.push({ date: dateStr, note: noteText });
        } else {
          unmatchedNotedCells.push({ date: dateStr, note: noteText });
          if (fill?.type === "pattern") {
            const cellArgb =
              resolveColorToARGB(fill.fgColor as any, themeColors) ||
              resolveColorToARGB(fill.bgColor as any, themeColors);
            if (
              cellArgb &&
              cellArgb !== "FFFFFFFF" &&
              cellArgb !== "FF000000"
            ) {
              unmatchedColoredCells.push({
                date: dateStr,
                color: cellArgb,
                note: noteText,
              });
            }
          }
        }
      } else if (fill?.type === "pattern") {
        const cellArgb =
          resolveColorToARGB(fill.fgColor as any, themeColors) ||
          resolveColorToARGB(fill.bgColor as any, themeColors);
        if (cellArgb && cellArgb !== "FFFFFFFF" && cellArgb !== "FF000000") {
          if (dow === 0 || dow === 6) {
            workedCells.push({
              date: dateStr,
              note: `(inferred weekend work from cell color ${cellArgb})`,
            });
            const monthName = MONTH_NAMES[month - 1];
            warnings.push(
              `Sheet "${ws.name}" ${monthName}: non-legend colored weekend cell ` +
                `on ${dateStr} (color=${cellArgb}). Treating as potential weekend work.`,
            );
          } else {
            unmatchedColoredCells.push({
              date: dateStr,
              color: cellArgb,
              note: "",
            });
          }
        }
      }

      col++;
      if (dow === 6) {
        row++;
        col = startCol;
      }
    }
  }

  return {
    entries,
    unmatchedNotedCells,
    workedCells,
    unmatchedColoredCells,
    warnings,
    resolved,
  };
}

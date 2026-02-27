/**
 * Excel Parsing — Cell Note Utilities
 *
 * Functions for extracting text from cell notes/comments and
 * parsing hours from note content.
 */

import type ExcelJS from "exceljs";
import { MAX_SINGLE_ENTRY_HOURS } from "./types.js";

/**
 * Extract the plain-text content of a cell's note/comment.
 */
export function extractCellNoteText(cell: ExcelJS.Cell): string {
  if (!cell.note) return "";
  if (typeof cell.note === "string") return cell.note;
  if ((cell.note as any)?.texts) {
    return (cell.note as any).texts.map((t: any) => t.text).join("");
  }
  return "";
}

/**
 * Try to parse hours from a note string.
 */
export function parseHoursFromNote(note: string): number | undefined {
  const strict = note.match(/(\d+(?:\.\d+)?|\.\d+)\s*(?:hours?|hrs?|h)\b/i);
  if (strict) {
    const val = parseFloat(strict[1]);
    if (!isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS) return val;
  }

  const bare = note.match(/(?<![A-Za-z])(\d+(?:\.\d+)?|\.\d+)(?![A-Za-z\d])/);
  if (bare) {
    const val = parseFloat(bare[1]);
    if (!isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS) return val;
  }
  return undefined;
}

/**
 * Check if a note contains a clear, unambiguous hours specification.
 */
export function isStrictHoursMatch(note: string): boolean {
  const strict = note.match(/(\d+(?:\.\d+)?|\.\d+)\s*(?:hours?|hrs?|h)\b/i);
  if (!strict) return false;
  const val = parseFloat(strict[1]);
  return !isNaN(val) && val > 0 && val <= MAX_SINGLE_ENTRY_HOURS;
}

/**
 * Excel Parsing — Legend & Color Parsing
 *
 * Functions for finding and parsing the legend section of a worksheet
 * (column Z), mapping cell fill colors to PTO types.
 */

import type ExcelJS from "exceljs";
import type { PTOType } from "../businessRules.js";
import {
  DEFAULT_OFFICE_THEME,
  LEGEND_COL,
  LEGEND_LABEL_TO_PTO_TYPE,
  LEGEND_SCAN_MAX_ROW,
} from "./types.js";
import { resolveColorToARGB } from "./colorUtils.js";

/**
 * Find the row containing the "Legend" header in column Z.
 */
export function findLegendHeaderRow(ws: ExcelJS.Worksheet): number {
  for (let r = 1; r <= LEGEND_SCAN_MAX_ROW; r++) {
    const cell = ws.getCell(r, LEGEND_COL);
    const val = cell.value?.toString().trim() || "";
    if (val.toLowerCase() === "legend") return r;
  }
  return -1;
}

/**
 * Parse the legend section from column Z to build a color→PTOType map.
 */
export function parseLegend(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): Map<string, PTOType> {
  const colorMap = new Map<string, PTOType>();
  const headerRow = findLegendHeaderRow(ws);
  if (headerRow < 0) {
    throw new Error(
      `Legend header not found in column Z on sheet "${ws.name}"`,
    );
  }

  const maxEntries = 10;
  for (let i = 1; i <= maxEntries; i++) {
    const row = headerRow + i;
    const cell = ws.getCell(row, LEGEND_COL);
    const label = cell.value?.toString().trim() || "";
    if (!label) break;

    const ptoType = LEGEND_LABEL_TO_PTO_TYPE[label];
    if (!ptoType) continue;

    const fill = cell.fill as ExcelJS.FillPattern | undefined;
    if (fill?.type === "pattern") {
      const argb = resolveColorToARGB(fill.fgColor as any, themeColors);
      if (argb) {
        colorMap.set(argb, ptoType);
      }
    }
  }

  return colorMap;
}

/**
 * Scan the legend section and return the set of ARGB color strings
 * whose label is "Partial PTO".
 */
export function parsePartialPtoColors(
  ws: ExcelJS.Worksheet,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): Set<string> {
  const colors = new Set<string>();
  const headerRow = findLegendHeaderRow(ws);
  if (headerRow < 0) return colors;

  const maxEntries = 10;
  for (let i = 1; i <= maxEntries; i++) {
    const row = headerRow + i;
    const cell = ws.getCell(row, LEGEND_COL);
    const label = cell.value?.toString().trim() || "";
    if (!label) break;
    if (label !== "Partial PTO") continue;

    const fill = cell.fill as ExcelJS.FillPattern | undefined;
    if (fill?.type === "pattern") {
      const argb = resolveColorToARGB(fill.fgColor as any, themeColors);
      if (argb) colors.add(argb);
    }
  }
  return colors;
}

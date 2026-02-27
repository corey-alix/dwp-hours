/**
 * Excel Parsing — Theme Color Resolution
 *
 * Functions for parsing workbook theme XML, resolving cell colors to ARGB,
 * and computing color distances for approximate matching.
 */

import type { PTOType } from "../businessRules.js";
import {
  DEFAULT_OFFICE_THEME,
  MAX_COLOR_DISTANCE,
  MIN_CHROMA_FOR_APPROX,
} from "./types.js";

/**
 * Parse theme colors from the workbook's theme1 XML.
 */
export function parseThemeColors(themeXml: string): Map<number, string> {
  const map = new Map<number, string>();
  const xmlOrderToThemeIndex = [1, 0, 3, 2, 4, 5, 6, 7, 8, 9, 10, 11];

  const sysColorRe = /<a:sysClr[^>]*lastClr="([A-Fa-f0-9]{6})"[^/]*\/>/g;
  const srgbColorRe = /<a:srgbClr val="([A-Fa-f0-9]{6})"[^/]*\/>/g;

  const blocks = themeXml.match(
    /<a:(dk1|lt1|dk2|lt2|accent[1-6])>([\s\S]*?)<\/a:\1>/g,
  );
  if (!blocks) return DEFAULT_OFFICE_THEME;

  blocks.forEach((block, xmlIndex) => {
    let hex: string | null = null;

    const sysMatch = sysColorRe.exec(block);
    if (sysMatch) hex = sysMatch[1];
    sysColorRe.lastIndex = 0;

    if (!hex) {
      const srgbMatch = srgbColorRe.exec(block);
      if (srgbMatch) hex = srgbMatch[1];
      srgbColorRe.lastIndex = 0;
    }

    if (hex && xmlIndex < xmlOrderToThemeIndex.length) {
      map.set(xmlOrderToThemeIndex[xmlIndex], `FF${hex.toUpperCase()}`);
    }
  });

  return map.size > 0 ? map : DEFAULT_OFFICE_THEME;
}

function applyTint(argb: string, tint: number): string {
  const hex = argb.length === 8 ? argb.substring(2) : argb;
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  } else {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  }

  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) =>
    clamp(v).toString(16).padStart(2, "0").toUpperCase();

  return `FF${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function resolveColorToARGB(
  color: { argb?: string; theme?: number; tint?: number } | undefined,
  themeColors: Map<number, string> = DEFAULT_OFFICE_THEME,
): string | undefined {
  if (!color) return undefined;
  if (color.argb) return color.argb;
  if (color.theme !== undefined) {
    const base = themeColors.get(color.theme);
    if (!base) return undefined;
    return color.tint ? applyTint(base, color.tint) : base;
  }
  return undefined;
}

export function colorDistance(argb1: string, argb2: string): number {
  const h1 = argb1.length === 8 ? argb1.substring(2) : argb1;
  const h2 = argb2.length === 8 ? argb2.substring(2) : argb2;
  const r1 = parseInt(h1.substring(0, 2), 16);
  const g1 = parseInt(h1.substring(2, 4), 16);
  const b1 = parseInt(h1.substring(4, 6), 16);
  const r2 = parseInt(h2.substring(0, 2), 16);
  const g2 = parseInt(h2.substring(2, 4), 16);
  const b2 = parseInt(h2.substring(4, 6), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function findClosestLegendColor(
  cellArgb: string,
  legend: Map<string, PTOType>,
): PTOType | undefined {
  const hex = cellArgb.length === 8 ? cellArgb.substring(2) : cellArgb;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (chroma < MIN_CHROMA_FOR_APPROX) return undefined;

  let bestDist = MAX_COLOR_DISTANCE;
  let bestType: PTOType | undefined;

  for (const [legendArgb, ptoType] of legend) {
    const d = colorDistance(cellArgb, legendArgb);
    if (d < bestDist) {
      bestDist = d;
      bestType = ptoType;
    }
  }

  return bestType;
}

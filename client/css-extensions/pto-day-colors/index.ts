/**
 * Shared PTO day-cell colour library for web components.
 *
 * Provides a constructable stylesheet singleton for day-cell background
 * colour classes (`.type-PTO`, `.type-Sick`, etc.) with inverse text.
 * Import `adoptPtoDayColors` to add the styles to a shadow root.
 */

import { ptoDayColorsCSS } from "./pto-day-colors.js";

// ── Constructable stylesheet singleton ──

let _sharedSheet: CSSStyleSheet | null = null;

/**
 * Return the shared CSSStyleSheet containing PTO day-cell colour classes.
 * The sheet is created lazily on first call.
 */
export function getPtoDayColorsSheet(): CSSStyleSheet {
  if (!_sharedSheet) {
    _sharedSheet = new CSSStyleSheet();
    _sharedSheet.replaceSync(ptoDayColorsCSS);
  }
  return _sharedSheet;
}

/**
 * Safely add the PTO day-cell colour stylesheet to a shadow root.
 * No-ops if the sheet is already adopted.
 */
export function adoptPtoDayColors(root: ShadowRoot | null): void {
  if (!root) return;
  const sheet = getPtoDayColorsSheet();
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}

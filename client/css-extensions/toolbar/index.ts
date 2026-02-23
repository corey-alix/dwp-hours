/**
 * Shared toolbar layout library for web components.
 *
 * Provides a constructable stylesheet singleton for toolbar utility classes.
 * Toolbar uses flexbox with space-around justification for even button
 * distribution.
 */

import { toolbarCSS } from "./toolbar.js";

// ── Constructable stylesheet singleton ──

let _sharedSheet: CSSStyleSheet | null = null;

/**
 * Return the shared CSSStyleSheet containing toolbar layout classes.
 * The sheet is created lazily on first call.
 */
export function getToolbarSheet(): CSSStyleSheet {
  if (!_sharedSheet) {
    _sharedSheet = new CSSStyleSheet();
    _sharedSheet.replaceSync(toolbarCSS);
  }
  return _sharedSheet;
}

/**
 * Adopt the shared toolbar stylesheet into a shadow root (or document).
 * Safe to call multiple times — the sheet is added only once.
 */
export function adoptToolbar(root: ShadowRoot | Document): void {
  const sheet = getToolbarSheet();
  root.adoptedStyleSheets = [
    ...root.adoptedStyleSheets.filter((s) => s !== sheet),
    sheet,
  ];
}

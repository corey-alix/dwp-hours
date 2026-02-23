/**
 * Shared navigation arrow library for web components.
 *
 * Provides a constructable stylesheet singleton for navigation arrow
 * button styles and exported symbol constants.
 * Import `adoptNavigation` to add styles, and `NAV_SYMBOLS` for arrow text.
 */

import { navigationCSS, NAV_SYMBOLS } from "./navigation.js";

// Re-export symbols for convenient single-import usage
export { NAV_SYMBOLS } from "./navigation.js";

// ── Constructable stylesheet singleton ──

let _sharedSheet: CSSStyleSheet | null = null;

/**
 * Return the shared CSSStyleSheet containing navigation layout classes.
 * The sheet is created lazily on first call.
 */
export function getNavigationSheet(): CSSStyleSheet {
  if (!_sharedSheet) {
    _sharedSheet = new CSSStyleSheet();
    _sharedSheet.replaceSync(navigationCSS);
  }
  return _sharedSheet;
}

/**
 * Safely add the navigation stylesheet to a shadow root's adoptedStyleSheets.
 * No-ops if the sheet is already adopted.
 */
export function adoptNavigation(root: ShadowRoot | null): void {
  if (!root) return;
  const sheet = getNavigationSheet();
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}
